import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { projects } from "../data/projects";
import { view, setAccentVar, railPosition, BASE_ACCENT } from "../lib/view";
import { GitHubMark } from "./icons";

const pad = (n: number) => String(n).padStart(2, "0");

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M1 13L13 1M13 1H4M13 1v9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The pinned showcase. One ScrollTrigger owns the whole section: it pins the
 * viewport for `projects.length` screens of scroll, publishes normalised
 * progress to the 3D scene, and flips the active panel. React state changes
 * five times across the entire section - everything else is the render loop.
 */
export function Work() {
  const section = useRef<HTMLElement>(null!);
  const pin = useRef<HTMLDivElement>(null!);
  const fill = useRef<HTMLDivElement>(null!);
  const [active, setActive] = useState(0);
  /* true once the work section is behind us - the accent goes back to the
     site's own colour so the ending is not tinted by whichever project
     happened to be last on screen */
  const [past, setPast] = useState(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: () => "+=" + projects.length * window.innerHeight,
        pin: pin.current,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          view.workProgress = self.progress;
          fill.current?.style.setProperty("--p", String(self.progress));
          // same helper the rail uses, so the label can never name a project
          // other than the one centred on screen
          const i = Math.round(railPosition(self.progress, projects.length));
          setActive((prev) => (prev === i ? prev : i));
        },
        onEnter: () => {
          view.section = 1;
          setPast(false);
        },
        onEnterBack: () => {
          view.section = 1;
          setPast(false);
        },
        /* Pin the active index at both ends too. A jump that clears the whole
           section in one frame (anchor link, restored scroll, flick on a
           trackpad) never runs onUpdate, and the accent would otherwise stay
           on whichever project was last shown. */
        onLeave: () => {
          view.section = 2;
          setActive(projects.length - 1);
          setPast(true);
        },
        onLeaveBack: () => {
          view.section = 0;
          setActive(0);
          setPast(false);
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  // keep the DOM accent in step with the one the shader is lerping toward
  useEffect(
    () => setAccentVar(past ? BASE_ACCENT : projects[active].accent),
    [active, past],
  );

  return (
    <section className="work" id="work" ref={section}>
      <div className="work__pin" ref={pin}>
        <div className="work__grid">
          <div className="work__stage">
            {projects.map((p, i) => (
              <article
                key={p.id}
                className="work__panel"
                data-active={i === active}
                style={{ "--accent": p.accent } as CSSProperties}
              >
                <div className="work__mark">{p.mark}</div>

                <div className="work__no">
                  <b>{pad(i + 1)}</b>
                  <i />
                  <span>
                    {p.role} <span className="work__dot">·</span> {p.year}
                  </span>
                </div>

                <h3 className="work__title">{p.name}</h3>
                <p className="work__tag">{p.tagline}</p>
                <p className="work__desc">{p.description}</p>

                <div className="work__stack">
                  {p.stack.map((s) => (
                    <span className="work__chip" key={s}>
                      {s}
                    </span>
                  ))}
                </div>

                <div className="work__links">
                  {p.link && (
                    <a
                      className="work__link"
                      href={p.link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {p.link.label} <Arrow />
                    </a>
                  )}
                  {p.repo && (
                    <a
                      className="work__link work__link--repo"
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <GitHubMark /> Source
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="work__readout">
            <span className="label">Selected work</span>
            <div className="work__rail">
              <div className="work__railfill" ref={fill} />
            </div>
            <span className="work__meta">
              <b>{pad(active + 1)}</b>
              {pad(projects.length)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
