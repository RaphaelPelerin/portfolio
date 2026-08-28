import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  /** one array entry per rendered line - each line clips its own overflow */
  lines: string[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p" | "div";
}

/**
 * Character-level entry animation. Each line is an overflow-hidden block, so
 * the characters rise out of nothing rather than fading in place.
 */
export function SplitText({ lines, className, delay = 0, as: Tag = "div" }: Props) {
  const root = useRef<HTMLElement>(null!);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".split__ch",
        { yPercent: 118, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.15,
          ease: "power4.out",
          stagger: 0.021,
          delay,
        },
      );
    }, root);
    return () => ctx.revert();
  }, [delay]);

  return (
    <Tag ref={root as never} className={`split ${className ?? ""}`}>
      {lines.map((line, li) => (
        <span className="split__line" key={li}>
          {Array.from(line).map((ch, ci) => (
            <span className="split__ch" key={ci}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
