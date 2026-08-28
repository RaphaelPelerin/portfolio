import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { ProjectRail } from "./ProjectRail";

/**
 * One fixed canvas behind the whole document. Nothing in here is interactive -
 * pointer events pass through to the DOM, and the scene reads the pointer from
 * the shared `view` singleton instead.
 *
 * The inner <Suspense> is load-bearing. ProjectRail suspends while its screen
 * textures load; without a boundary inside the Canvas that suspension escapes
 * to the one wrapping <Scene>, which unmounts the Canvas itself and throws away
 * its WebGL context. It then remounts and takes a fresh one - and with
 * StrictMode doing that twice, the browser runs out of contexts and drops the
 * scene entirely. Keeping the boundary here means the Canvas mounts once.
 */
export function Scene() {
  return (
    <div className="canvas-layer" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 60 }}
      >
        <Suspense fallback={null}>
          <ProjectRail />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.5}
            radius={0.72}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
