import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import { projects, type Body, type GeometryId } from "../data/projects";
import { view, damp, smoothstep, railPosition } from "../lib/view";
import { monolithVertex, monolithFragment } from "./shaders";

/**
 * Every project is its own body, all of them sitting on one horizontal rail.
 * Scrolling slides the rail: the current body travels off to one side while
 * the next arrives from the other, the way a planet switcher moves between
 * worlds. Nothing morphs - each shape stays itself the whole way.
 *
 * A project with a real product shot is rendered as the device it runs on,
 * with the screenshot as the texture. One without falls back to an abstract
 * solid. Faceted solids are built at detail 0 so three gives them flat
 * normals and they read as cut crystal; they take no noise displacement,
 * which would only tear the facets apart.
 */
const SHAPES: Record<GeometryId, { geo: () => THREE.BufferGeometry; displace: number }> = {
  ico: { geo: () => new THREE.IcosahedronGeometry(1.2, 5), displace: 0.17 },
  octa: { geo: () => new THREE.OctahedronGeometry(1.5, 0), displace: 0.0 },
  knot: { geo: () => new THREE.TorusKnotGeometry(0.85, 0.3, 260, 42), displace: 0.05 },
  torus: { geo: () => new THREE.TorusGeometry(1.05, 0.36, 48, 220), displace: 0.07 },
  dodeca: { geo: () => new THREE.DodecahedronGeometry(1.3, 0), displace: 0.0 },
};

const COUNT = projects.length;

/** Gap between bodies, in local units (before the section scale is applied). */
const SPACING = 3.4;

/** Screen size targets, chosen so a phone and a monitor carry the same mass
 *  on the rail as the solids do. */
const PHONE_H = 2.55;
/* Screens are sized by AREA, not by a fixed width. Sizing by width makes a
   panoramic screenshot come out short, so it reads as a smaller object than a
   squarer one even though both are "full width" - Keys GPT at 1.82:1 was
   carrying a third less mass than Keys at 1.19:1. Area keeps them even. */
const SCREEN_AREA = 6.34;
const BEZEL = 0.055;
const DEPTH = 0.11;
/* ExtrudeGeometry adds the bevel on top of `depth`, so a centred slab actually
   reaches DEPTH/2 + BEVEL. Sitting the screen at DEPTH/2 buries it inside the
   chassis and only the shader shows. */
const BEVEL = 0.016;
const SCREEN_Z = DEPTH / 2 + BEVEL + 0.005;

/* A device chassis is a real black frame, not an accent-tinted one. It runs the
   same shader as the solids, but with a neutral rim so the fresnel reads as
   light catching anodised metal instead of as a coloured glow. The project's
   colour stays where it belongs - on the orbit ring and in the DOM. */
const CHASSIS_BASE = "#06070a";
const CHASSIS_RIM = "#848c9c";

/* Side buttons, as fractions of the chassis height, laid out the way a phone
   actually is: mute switch, volume up, volume down on the left; power on the
   right, sitting a little lower than the volume pair. */
const PHONE_BUTTONS = [
  { side: -1, y: 0.237, h: 0.036 },
  { side: -1, y: 0.150, h: 0.085 },
  { side: -1, y: 0.048, h: 0.085 },
  { side: 1, y: 0.136, h: 0.128 },
];

/** Centred rounded rectangle, shared by the chassis and the screen inside it. */
function roundedRect(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** A rounded slab - the chassis behind every device screen. */
function slabGeometry(w: number, h: number, d: number, r: number) {
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth: d,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geo.center();
  return geo;
}

/**
 * The screen itself, with corners matching the chassis instead of a hard
 * rectangle poking out of a rounded frame.
 *
 * ShapeGeometry derives UVs from the shape's own coordinates, so a shape
 * spanning -w/2..w/2 samples the texture in world units and tiles it. They have
 * to be remapped to 0..1 across the bounding box or the screenshot comes out
 * repeated and offset.
 */
function roundedScreenGeometry(w: number, h: number, r: number) {
  const geo = new THREE.ShapeGeometry(roundedRect(w, h, r), 16);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

/** Screen plane size for a body, and the chassis that frames it. */
function deviceDims(body: Extract<Body, { kind: "phone" | "screen" }>) {
  const phone = body.kind === "phone";
  const sw = phone ? PHONE_H * body.aspect : Math.sqrt(SCREEN_AREA * body.aspect);
  const sh = phone ? PHONE_H : Math.sqrt(SCREEN_AREA / body.aspect);
  const radius = phone ? 0.13 : 0.085;
  return {
    sw,
    sh,
    bw: sw + BEZEL * 2,
    bh: sh + BEZEL * 2,
    radius,
    // the screen sits inside the frame, so its corner is that much tighter
    screenRadius: Math.max(0.014, radius - BEZEL),
  };
}

export function ProjectRail() {
  /* ---------- textures ---------- */
  const textureUrls = useMemo(
    () => projects.map((p) => (p.body.kind === "solid" ? null : p.body.src)),
    [],
  );
  // useLoader needs a stable, non-null list; the nulls are mapped back after
  const loaded = useLoader(
    THREE.TextureLoader,
    textureUrls.filter((u): u is string => u !== null),
  );
  const textures = useMemo(() => {
    const list = Array.isArray(loaded) ? loaded : [loaded];
    list.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    });
    let n = 0;
    return textureUrls.map((u) => (u === null ? null : list[n++]));
  }, [loaded, textureUrls]);

  /* ---------- geometry, built once ---------- */
  const bodyGeos = useMemo(
    () =>
      projects.map((p) => {
        if (p.body.kind === "solid") return SHAPES[p.body.shape].geo();
        const d = deviceDims(p.body);
        return slabGeometry(d.bw, d.bh, DEPTH, d.radius);
      }),
    [],
  );

  const screenGeos = useMemo(
    () =>
      projects.map((p) => {
        if (p.body.kind === "solid") return null;
        const d = deviceDims(p.body);
        return roundedScreenGeometry(d.sw, d.sh, d.screenRadius);
      }),
    [],
  );

  const buttonGeos = useMemo(
    () =>
      projects.map((p) => {
        if (p.body.kind !== "phone") return null;
        const d = deviceDims(p.body);
        return PHONE_BUTTONS.map((b) => ({
          geo: new THREE.BoxGeometry(0.038, b.h * d.bh, DEPTH * 0.66),
          // nudged out past the bevel so the button breaks the silhouette
          pos: [b.side * (d.bw / 2 + 0.011), b.y * d.bh, 0] as [number, number, number],
        }));
      }),
    [],
  );

  const ringGeo = useMemo(() => new THREE.TorusGeometry(1.85, 0.007, 3, 220), []);

  /* Ambient starfield. It sits outside the rail so it never travels - it is
     the space the bodies move through, not one of them. */
  const dust = useMemo(() => {
    const n = 420;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 4.5 + Math.random() * 9;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  /* ---------- materials ---------- */
  // one shader for solid cores and device chassis alike, so both pick up the
  // same accent rim and the same fade
  const bodyMats = useMemo(
    () =>
      projects.map(
        (p) =>
          new THREE.ShaderMaterial({
            vertexShader: monolithVertex,
            fragmentShader: monolithFragment,
            uniforms: {
              uTime: { value: 0 },
              uDisplace: {
                value: p.body.kind === "solid" ? SHAPES[p.body.shape].displace : 0,
              },
              uCharge: { value: 0 },
              uFade: { value: 0 },
              uAccent: {
                value: new THREE.Color(p.body.kind === "solid" ? p.accent : CHASSIS_RIM),
              },
              uBase: {
                value: new THREE.Color(p.body.kind === "solid" ? "#0b0d11" : CHASSIS_BASE),
              },
            },
          }),
      ),
    [],
  );

  const screenMats = useMemo(
    () =>
      projects.map((p, i) => {
        if (p.body.kind === "solid") return null;
        return new THREE.MeshBasicMaterial({
          map: textures[i] ?? undefined,
          toneMapped: false,
          color: new THREE.Color(0, 0, 0),
        });
      }),
    [textures],
  );

  const ringMats = useMemo(
    () =>
      projects.map(
        (p) =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(p.accent),
            transparent: true,
            opacity: 0,
          }),
      ),
    [],
  );

  const dustMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color("#8b93a3"),
        size: 0.032,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    [],
  );

  /* ---------- refs ---------- */
  const holder = useRef<THREE.Group>(null!);
  const dustRef = useRef<THREE.Points>(null!);
  const slots = useRef<THREE.Group[]>([]);
  const spins = useRef<THREE.Group[]>([]);
  const rings = useRef<THREE.Mesh[]>([]);

  const charge = useRef<number[]>(projects.map(() => 0));
  const focused = useRef(-1);
  const sectionFade = useRef(1);
  const baseScale = useRef(0.7);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const mobile = state.size.width < 960;

    const pos = railPosition(view.workProgress, COUNT);

    /* the body arriving at centre gets a charge pulse - it powers up as it
       takes the stage rather than just sliding into place */
    const centre = Math.round(pos);
    if (centre !== focused.current) {
      focused.current = centre;
      charge.current[centre] = 1;
    }

    /* ---- placement of the whole assembly ----
       Offsets are a fraction of the visible world width rather than fixed
       units, so it holds the same share of the screen from a 13" laptop to an
       ultrawide instead of drifting over the copy. */
    const w = state.viewport.width;

    // hero: pushed well clear of the name, which runs to about 67% of the width
    let tx = mobile ? 0 : w * 0.27;
    let ty = mobile ? 0.35 : 0.2;
    let tz = 0;
    let ts = mobile ? 0.56 : 0.8;

    if (view.section === 1) {
      if (mobile) {
        tx = 0;
        ty = 1.35;
        ts = 0.44;
      } else {
        /* Pulled back toward the middle and scaled up. At 0.25 the widest
           element - the orbit ring - reached the readout rail on the right;
           this keeps it inside the gap between the copy and that rail. */
        tx = w * 0.2;
        ty = 0;
        ts = 0.76;
      }
    } else if (view.section === 2) {
      tx = 0;
      ty = 0;
      tz = -3.5;
      ts = 0.4;
    }

    holder.current.position.x = damp(holder.current.position.x, tx, 3, dt);
    holder.current.position.y = damp(holder.current.position.y, ty, 3, dt);
    holder.current.position.z = damp(holder.current.position.z, tz, 3, dt);

    baseScale.current = damp(baseScale.current, ts, 3.5, dt);
    holder.current.scale.setScalar(baseScale.current);

    /* Past the work section the page turns typographic, so the rail goes out
       rather than sitting behind body copy. The dust stays - it is ambient and
       never competes with text. */
    sectionFade.current = damp(sectionFade.current, view.section === 2 ? 0 : 1, 2.6, dt);

    /* a turn driven purely by scroll, on top of the idle spin */
    const scrub = view.workProgress * Math.PI * 4;

    for (let i = 0; i < COUNT; i++) {
      const slot = slots.current[i];
      const spin = spins.current[i];
      const ring = rings.current[i];
      if (!slot || !spin || !ring) continue;

      const d = i - pos;
      const ad = Math.abs(d);

      /* Off-centre bodies fade before they can reach the text column on the
         left. That window is what keeps the slide legible without the
         neighbours sitting on the copy. */
      const f = (1 - smoothstep(0.45, 1.0, ad)) * sectionFade.current;

      slot.visible = f > 0.01;
      if (!slot.visible) continue;

      slot.position.x = d * SPACING;
      slot.position.z = -ad * 1.6;
      slot.scale.setScalar(1 / (1 + 0.7 * ad));

      charge.current[i] = damp(charge.current[i], 0, 5, dt);

      const u = bodyMats[i].uniforms;
      u.uTime.value = t;
      u.uFade.value = f;
      u.uCharge.value = charge.current[i];

      // a basic material has no fade uniform; scaling its colour toward black
      // dims the screenshot by exactly the same curve
      const sm = screenMats[i];
      if (sm) sm.color.setScalar(f);

      ringMats[i].opacity = 0.5 * f;

      const isDevice = projects[i].body.kind !== "solid";
      if (view.reduced) {
        spin.rotation.y = scrub * 0.4 + i;
        spin.rotation.x = 0;
      } else if (isDevice) {
        /* A device has a front. It sways rather than tumbling, so the screen
           stays readable for most of its time on stage - and the amplitude is
           kept small, because past about 15 degrees the screenshot starts to
           read as a shape turned away rather than as a screen. */
        spin.rotation.y = Math.sin(t * 0.35 + i) * 0.2 + view.pointerX * 0.1;
        spin.rotation.x = Math.sin(t * 0.24 + i) * 0.05;
        spin.rotation.z = Math.cos(t * 0.2 + i) * 0.025;
      } else {
        // the per-body offset stops all of them reading as one rigid object
        spin.rotation.y = t * 0.14 + scrub + i * 1.1;
        spin.rotation.x = Math.sin(t * 0.22 + i) * 0.15 + view.workProgress * 0.6;
        spin.rotation.z = Math.cos(t * 0.17 + i) * 0.07;
      }

      ring.rotation.x = Math.PI / 2 + 0.4 + i * 0.24;
      ring.rotation.y = t * 0.2 + i;
    }

    dustRef.current.rotation.y = t * 0.014;

    /* ---- pointer parallax on the whole assembly ---- */
    if (!view.reduced) {
      holder.current.rotation.y = damp(holder.current.rotation.y, view.pointerX * 0.26, 3, dt);
      holder.current.rotation.x = damp(holder.current.rotation.x, -view.pointerY * 0.2, 3, dt);
    }
  });

  return (
    <group ref={holder}>
      {projects.map((p, i) => (
        <group
          key={p.id}
          ref={(el) => {
            if (el) slots.current[i] = el;
          }}
        >
          <group
            ref={(el) => {
              if (el) spins.current[i] = el;
            }}
          >
            <mesh geometry={bodyGeos[i]} material={bodyMats[i]} />
            {buttonGeos[i]?.map((b, n) => (
              <mesh key={n} geometry={b.geo} material={bodyMats[i]} position={b.pos} />
            ))}
            {screenGeos[i] && screenMats[i] && (
              <mesh
                geometry={screenGeos[i]!}
                material={screenMats[i]!}
                position={[0, 0, SCREEN_Z]}
              />
            )}
          </group>

          <mesh
            ref={(el) => {
              if (el) rings.current[i] = el;
            }}
            geometry={ringGeo}
            material={ringMats[i]}
          />
        </group>
      ))}

      <points ref={dustRef} geometry={dust} material={dustMat} />
    </group>
  );
}
