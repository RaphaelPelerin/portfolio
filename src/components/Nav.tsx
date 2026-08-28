import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const [hidden, setHidden] = useState(false);
  const [clock, setClock] = useState("");
  const last = useRef(0);
  /** where the scroll direction last flipped, so travel is measured from there */
  const anchor = useRef(0);
  const dir = useRef(0);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Europe/Paris",
        }).format(new Date()),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    /* Comparing against the previous event is not enough: smooth scrolling
       fires ~120 times a second, so the per-event delta falls under any small
       threshold the moment the scroll eases, and the bar flickers back in.
       Instead, measure travel since the last direction change and require a
       sustained move before toggling. */
    const REVEAL_AT = 500;
    const TRAVEL = 90;

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - last.current;
      last.current = y;
      if (Math.abs(delta) < 1) return;

      const d = Math.sign(delta);
      if (d !== dir.current) {
        dir.current = d;
        anchor.current = y;
      }
      const travelled = y - anchor.current;

      if (y < REVEAL_AT) setHidden(false);
      else if (d > 0 && travelled > TRAVEL) setHidden(true);
      else if (d < 0 && travelled < -TRAVEL) setHidden(false);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="nav" data-hidden={hidden}>
      <div className="nav__inner">
        <a className="nav__mark" href="#top">
          <span className="nav__dot" />
          <span>R. Pelerin</span>
        </a>
        <nav className="nav__links">
          {LINKS.map((l) => (
            <a key={l.href} className="nav__link" href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <span className="label">
          Paris <span style={{ color: "var(--ink-dim)" }}>{clock}</span>
        </span>
      </div>
    </header>
  );
}
