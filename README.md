# Portfolio

A single-page developer portfolio built around one scroll-driven idea: every
project is a 3D body on a horizontal rail. Scrolling slides the rail - the
current body travels off one side while the next arrives from the other, the
way a planet switcher moves between worlds - and that project's mark, name,
description and stack come in beside it.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Stack

| Concern | Library |
|---|---|
| 3D scene graph | `@react-three/fiber` (three.js as React components) |
| Post-processing | `@react-three/postprocessing` (bloom) |
| Scroll timelines, section pinning | `gsap` + `ScrollTrigger` |
| Momentum scroll | `lenis` |
| Styling | plain CSS + custom properties |

No component library. A portfolio is typography, layout and motion — the parts a
component library solves (dialogs, forms, tables) do not appear on this page,
and its visual defaults would work against the custom direction.

## How the scroll drives the 3D

`src/lib/view.ts` is a **mutable singleton**, not React state. `ScrollTrigger`
writes scroll progress into it at up to 120Hz and the R3F render loop reads it in
`useFrame`. Routing that through `useState` would re-render the tree every frame.
React only ever hears about the *active project index*, which changes five times
across the whole page.

One `ScrollTrigger` in `src/components/Work.tsx` owns the work section: it pins
the viewport for `projects.length` screens, publishes normalised progress, and
flips the active panel.

### The slide

All five bodies exist at once, spaced along X. `railPosition()` turns scroll
progress into a continuous index: each of the `count - 1` transitions **holds**
at its stop before travelling, so a project sits still long enough to be read
instead of drifting constantly.

A body's distance from centre drives everything about it — it shrinks, recedes
in Z, and fades out before it can reach the text column on the left. That fade
window is what keeps the slide legible without neighbours sitting on the copy.

DOM and 3D both call `railPosition()`, so the label can never name a project
other than the one centred on screen.

## Adding a project

Everything lives in `src/data/projects.tsx` — name, description, stack, accent
hex, an inline SVG mark, and a `geometry` key. The accent propagates to the DOM
(via the `--accent` custom property) and to the shader from that one field.

Shapes are defined in `SHAPES` in `src/three/ProjectRail.tsx`. Faceted solids
are built at detail 0 so three gives them flat normals, and they take no noise
displacement because it would only tear the facets.

## Reskinning

`src/styles/tokens.css` holds every colour, type step and spacing value.
`BASE_ACCENT` in `src/lib/view.ts` is the site's own colour, used everywhere
outside the work section.

## Notes

- The 3D bundle is code-split (`lazy(() => import("./three/Scene"))`) so type and
  layout paint on the first chunk — ~115kB gzipped instead of ~373kB.
- `prefers-reduced-motion` disables Lenis, the character stagger and the idle
  rotation; the scrubbed rotation is kept but halved.
- Hot-reloading the scene can desync the module singleton from the remounted
  bodies (wrong shape centred). A full reload clears it; it does not happen on
  a normal page load.
- Content is placeholder. The five projects are invented.
