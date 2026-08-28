import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

import { SplitText } from "./SplitText";

export function Hero() {
  const root = useRef<HTMLElement>(null!);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero__fade", {
        opacity: 0,
        y: 18,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.9,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__top">
        <span className="hero__avail hero__fade">
          <i className="hero__pulse" />
          <span className="label">AI internship — from March 2027</span>
        </span>
        <span className="label hero__fade">Epitech · graduating in 2027</span>
      </div>

      <div className="shell">
        <h1 className="hero__name">
          <SplitText lines={["Raphael"]} delay={0.35} />
          <SplitText lines={["Pelerin"]} className="ghost" delay={0.46} />
        </h1>

        <div className="hero__foot">
          <p className="hero__blurb hero__fade">
            I am looking for an end-of-studies internship in AI — the kind where I
            <strong> add something to the technology rather than only consume it</strong>.
            Calling an API is the easy part; the interface on top I can already build.
            I want the engineering in between.
          </p>

          <div className="hero__scroll hero__fade">
            <span className="label">Scroll to explore</span>
            <span className="hero__scrollbar" />
          </div>
        </div>
      </div>
    </section>
  );
}
