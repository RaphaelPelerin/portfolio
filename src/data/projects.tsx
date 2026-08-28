import type { ReactNode } from "react";

export type GeometryId = "ico" | "knot" | "octa" | "torus" | "dodeca";

/**
 * What the rail shows for a project.
 *
 * Projects with a real product shot are rendered as the device they run on —
 * the screenshot is the texture. Projects without one fall back to an abstract
 * solid rather than to a placeholder image.
 */
export type Body =
  | { kind: "solid"; shape: GeometryId }
  | { kind: "phone"; src: string; aspect: number }
  | { kind: "screen"; src: string; aspect: number };

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  year: string;
  role: string;
  /** shown on the card when the project is live somewhere */
  link?: { label: string; href: string };
  /** public source, where there is any - team and client work often has none */
  repo?: string;
  body: Body;
  /** hex, drives the accent across DOM + 3D */
  accent: string;
  mark: ReactNode;
}

/* --------------------------------------------------------------
   Marks. Monoline, 48x48, stroke = currentColor so they inherit
   the live project accent. Syntheza uses its own app icon.
   -------------------------------------------------------------- */
const s = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const MarkSyntheza = (
  <img src="/work/syntheza-logo.png" alt="" style={{ width: "100%", height: "100%" }} />
);

const MarkForge = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M10 34h28M14 34l4-16h12l4 16" {...s} />
    <path d="M20 26h8" {...s} />
    <path d="M24 6v8" {...s} strokeWidth={2.5} />
    <path d="M17 10l3 4M31 10l-3 4" {...s} />
  </svg>
);

const MarkKeys = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect x="5" y="16" width="38" height="20" rx="2" {...s} />
    <path d="M14 16v13M23 16v13M32 16v13" {...s} />
    <path d="M10 16v8h4v-8M19 16v8h4v-8M28 16v8h4v-8M37 16v8" {...s} strokeWidth={1} />
    <path d="M24 6v6" {...s} strokeWidth={2.5} />
  </svg>
);

const MarkKeysGpt = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M8 30c0-10 7-18 16-18s16 8 16 18" {...s} />
    <path d="M8 30v6M40 30v6" {...s} />
    <path d="M14 34v-6M20 36v-10M26 33v-4M32 37v-12" {...s} strokeWidth={2.5} />
  </svg>
);

const MarkAppolonia = (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <rect x="7" y="9" width="34" height="24" rx="2" {...s} />
    <path d="M7 39h34" {...s} />
    <circle cx="24" cy="21" r="6" {...s} />
    <path d="M24 15v12M18 21h12" {...s} strokeWidth={1} />
  </svg>
);

/* --------------------------------------------------------------
   The work
   -------------------------------------------------------------- */
export const projects: Project[] = [
  {
    id: "syntheza",
    name: "Syntheza",
    tagline: "Strategic watch, against information overload",
    description:
      "A one-year entrepreneurial project run by three Epitech students working from three different countries. It ingests RSS at scale, deduplicates what it finds, and returns a daily synthesis instead of another feed. I lead the web client — interface, design system, and the React component layer.",
    stack: ["React 19", "TypeScript", "Tailwind v4", "Radix UI", "Node 20", "Prisma 7", "PostgreSQL"],
    year: "2025 — 2026",
    role: "Lead Frontend Web",
    link: { label: "syntheza.ovh", href: "https://syntheza.ovh" },
    // the code repos are private; the org is the public face of the team
    repo: "https://github.com/Syntheza-DEV",
    body: { kind: "phone", src: "/work/syntheza-mobile.jpg", aspect: 0.4603 },
    accent: "#9b7cff",
    mark: MarkSyntheza,
  },
  {
    id: "forge",
    name: "Forge",
    tagline: "Game-asset generation that never leaves the machine",
    description:
      "Generating one good image with an AI tool is easy. Generating forty that look like they came from the same game is the actual problem. Forge answers it as a service: a FastAPI backend driving SDXL on a local GPU, with recipes — presets that own the style, sampler and post-processing — so a game pipeline can call it like any other endpoint. No account, no subscription, and no image leaving the machine.",
    stack: ["FastAPI", "REST API", "PyTorch", "CUDA", "diffusers · SDXL", "ControlNet", "React 18"],
    year: "2026",
    role: "Solo project",
    repo: "https://github.com/RaphaelPelerin/forge-asset-generator",
    body: { kind: "solid", shape: "ico" },
    accent: "#c6f24e",
    mark: MarkForge,
  },
  {
    id: "keys",
    name: "Keys",
    tagline: "A VST3 sampler, drawn by hand",
    description:
      "A single-sample VST3 instrument built on JUCE. It pitch-shifts one sample across the keyboard through an ADSR envelope, a three-mode filter whose cutoff follows that envelope, and ping-pong looping across 16 voices. Every knob, curve and meter is drawn with the JUCE Graphics API — no GUI library at all.",
    stack: ["C++", "JUCE 8", "Real-time DSP", "IIR filters", "Projucer"],
    year: "2025",
    role: "Solo project",
    repo: "https://github.com/RaphaelPelerin/keys-gpt-vst",
    body: { kind: "screen", src: "/work/keys-vst.jpg", aspect: 1.1933 },
    accent: "#4ee1f2",
    mark: MarkKeys,
  },
  {
    id: "keys-gpt",
    name: "Keys GPT",
    tagline: "Describe a part, get a MIDI file",
    description:
      "You describe a part — a mood, a key, a tempo, a length — and get a piano roll you can hear and a MIDI file you can keep. It writes melodies, chord progressions, counter-melodies and drum grooves, and infers the part type from the prompt rather than from a menu.",
    stack: ["React", "TypeScript", "OpenAI API", "Web Audio", "MIDI"],
    year: "2025 — 2026",
    role: "Solo project",
    repo: "https://github.com/RaphaelPelerin/keys-gpt",
    body: { kind: "screen", src: "/work/keys-gpt.jpg", aspect: 1.8159 },
    accent: "#ff4e77",
    mark: MarkKeysGpt,
  },
  {
    id: "appolonia",
    name: "Appolonia",
    tagline: "Casino floor management, where a mistake takes a machine offline",
    description:
      "Appolonia builds the systems casinos use to run their gaming floors. I worked on KAMA, the manager operators use to configure and deploy to the touchscreens embedded in slot machines. I rebuilt the updater as three explicit steps, and built the scheduled shutdown panel and an internal email tool from scratch.",
    stack: ["Angular 13", "Ionic 6", "TypeScript", "SOAP / XML", "GitLab"],
    year: "Apr — Aug 2025",
    role: "Front-end intern",
    // the employer's site, not a product link - there is no public artefact
    link: { label: "appolonia.fr", href: "https://www.appolonia.fr/index.php/fr/" },
    body: { kind: "solid", shape: "dodeca" },
    accent: "#ff7a3d",
    mark: MarkAppolonia,
  },
];
