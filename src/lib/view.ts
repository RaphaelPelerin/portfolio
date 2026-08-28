/**
 * A mutable singleton shared between the DOM (writes) and the R3F render
 * loop (reads). Scroll updates land here ~120x/second; routing them through
 * React state would re-render the tree on every frame. React only ever hears
 * about the *active project index*, which changes five times in the whole page.
 */
export const view = {
  /** 0..1 across the pinned work section */
  workProgress: 0,
  /** 0 = hero, 1 = work, 2 = everything after */
  section: 0 as 0 | 1 | 2,
  /** -1..1, normalised pointer position */
  pointerX: 0,
  pointerY: 0,
  reduced: false,
};

/** The site's own colour. Projects borrow the accent while you are inside the
 *  work section; everywhere else the page returns to this. */
export const BASE_ACCENT = "#c6f24e";

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Framerate-independent exponential approach. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Publishes the accent to CSS so DOM and 3D never drift apart. */
export function setAccentVar(hex: string) {
  document.documentElement.style.setProperty("--accent", hex);
}

/**
 * Where the rail sits, as a continuous project index (0 .. count-1).
 *
 * Scroll maps onto `count - 1` transitions, and each one holds at its stop
 * before travelling, so a project sits still long enough to be read instead of
 * drifting constantly. DOM and 3D both call this, so the label can never
 * disagree with what is centred on screen.
 */
export function railPosition(progress: number, count: number) {
  const segments = count - 1;
  if (segments <= 0) return 0;
  const raw = clamp(progress, 0, 1) * segments;
  const i = Math.min(Math.floor(raw), segments - 1);
  return i + smoothstep(0.35, 0.78, raw - i);
}
