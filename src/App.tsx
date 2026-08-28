import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";


import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Work } from "./components/Work";
import { Capabilities } from "./components/Capabilities";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { view } from "./lib/view";

gsap.registerPlugin(ScrollTrigger);

/* three + postprocessing is ~900kB of the bundle. Splitting it out lets the
   type and layout paint on the first chunk; the canvas fades in behind them a
   moment later, which is the order a visitor reads the page in anyway. */
const Scene = lazy(() => import("./three/Scene").then((m) => ({ default: m.Scene })));

export default function App() {
  const root = useRef<HTMLDivElement>(null!);
  const grid = useRef<HTMLDivElement>(null!);

  /* ---- smooth scroll, driven off the GSAP ticker so Lenis and ScrollTrigger
          share one clock instead of fighting over two RAF loops ---- */
  useEffect(() => {
    /* A reload restored mid-pin drops you into a half-finished 3D transition
       with no context. One page, one entry point: always the hero. */
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    view.reduced = reduced;
    if (reduced) return;

    const lenis = new Lenis({ lerp: 0.085, touchMultiplier: 1.6 });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  /* ---- pointer, read by the render loop rather than by React ---- */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      view.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      view.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /* ---- reveals + background grid drift ---- */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      gsap.to(grid.current, {
        yPercent: -7,
        xPercent: -2,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    }, root);

    /* Two refreshes, for two separate reasons:
       - one frame later, because StrictMode mounts, tears down and remounts.
         A pinned element measured during that teardown comes back 0x0, and
         ScrollTrigger bakes that size into inline styles until it re-measures.
       - on fonts.ready, because web fonts land after first paint and move
         every measurement on the page. */
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <div className="grid-layer" ref={grid} />
      <div className="vignette" />
      <div className="grain" />

      <Nav />

      <main className="content">
        <Hero />
        <Work />
        <Capabilities />
        <About />
        <Contact />
      </main>
    </div>
  );
}
