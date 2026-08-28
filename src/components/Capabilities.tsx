const CAPS = [
  {
    name: "AI & generative",
    body: "Model integration that is engineered rather than prompted. Local diffusion pipelines, LLM-backed features with real fallbacks, and tests around the parts that fail silently.",
    tags: ["OpenAI", "Anthropic Claude", "Gemini", "PyTorch", "diffusers", "TensorFlow"],
  },
  {
    name: "Web & mobile",
    body: "Front ends that stay at sixty frames with real data in them, on the web and on the phone. Comfortable dropping to canvas or WebGL when the DOM stops being the right tool.",
    tags: ["React", "React Native", "Angular", "Ionic", "Expo", "TypeScript"],
  },
  {
    name: "Backend",
    body: "Services that hold their shape under load. I care about the boring guarantees — validation at the edge, sane auth, and what happens when a dependency goes dark.",
    tags: ["Node.js", "Express", "FastAPI", "Flask", "Prisma", "REST", "SOAP / XML"],
  },
  {
    name: "Data & infrastructure",
    body: "Environments described in code and rebuilt from nothing. Deduplication, ingestion pipelines, and schemas that survive contact with production.",
    tags: ["PostgreSQL", "MongoDB", "MySQL", "Docker", "GitLab CI"],
  },
  {
    name: "Systems & audio",
    body: "Lower down the stack, where the deadlines are measured in samples. Real-time DSP, custom rendering, and the discipline to keep the audio thread free of surprises.",
    tags: ["C++", "JUCE", "Real-time DSP", "Unix", "Assembly", "Networking"],
  },
];

const MARQUEE = [
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "C++",
  "PostgreSQL",
  "Docker",
  "Angular",
  "PyTorch",
  "JUCE",
];

export function Capabilities() {
  const track = (
    <div className="marquee__track" aria-hidden="true">
      {MARQUEE.map((m) => (
        <span className="marquee__item" key={m}>
          {m}
        </span>
      ))}
    </div>
  );

  return (
    <>
      <div className="marquee">
        {track}
        {track}
      </div>

      <section className="caps" id="capabilities">
        <div className="shell">
          <div className="section-head reveal">
            <h2>Capabilities</h2>
            <span className="label">What I actually do</span>
          </div>

          <div className="caps__list">
            {CAPS.map((c, i) => (
              <div className="caps__row reveal" key={c.name}>
                <span className="caps__no">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="caps__name">{c.name}</h3>
                <div className="caps__text">
                  <p className="caps__body">{c.body}</p>
                  <div className="caps__tags">
                    {c.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
