const STATS = [
  { n: "2027", l: "Epitech, Bac+5" },
  { n: "HSK 3", l: "Mandarin, a year in Beijing" },
  { n: "5", l: "Projects shipped" },
  { n: "2", l: "Internships" },
];

const EDUCATION = [
  {
    when: "2022 — 2027",
    what: "Epitech Technology",
    where: "Master's, Computer Engineering · Nice",
    detail:
      "Functional and object-oriented programming, Unix, assembly, systems and network programming. Specialisations in DevOps, AI, web and mobile, and cybersecurity.",
  },
  {
    when: "2025 — 2026",
    what: "Beijing Jiaotong University",
    where: "Fourth year abroad · Beijing, China",
    detail: "Software engineering, alongside Mandarin to HSK 3.",
  },
  {
    when: "2023",
    what: "ARD",
    where: "Mobile development intern",
    detail:
      "An Angular application to manage NFC cards and user profiles for alarm systems, including card scanning to display cardholder information.",
  },
  {
    when: "2022",
    what: "Intel · AI for Youth",
    where: "Competition — 2nd place, team",
    detail: "Computer vision and object recognition in Python with TensorFlow.",
  },
];

export function About() {
  return (
    <section className="about" id="about">
      <div className="shell">
        <div className="section-head reveal">
          <h2>About</h2>
          <span className="label">Biot, France</span>
        </div>

        <div className="about__grid">
          <p className="about__lead reveal">
            The interesting part of AI <span>is everything around the model.</span>
          </p>

          <div>
            <div className="about__copy reveal">
              <p>
                I am in my fifth year at Epitech, looking for an end-of-studies internship
                in AI. What interests me is not the model itself but the engineering around
                it — the part that decides whether a good demo becomes something a team can
                actually rely on.
              </p>
              <p>
                That is what Forge is. SDXL and ControlNet on a single 8&nbsp;GB GPU, driven
                by recipes so forty generated assets look like they came from the same game,
                exposed over an API so a pipeline can call it, and offline end to end.
                Building it meant measuring where the model actually fails — the text
                encoder only reads English, style strength has to vary by asset type — and
                designing around those limits instead of prompting harder. That is the work
                I want more of.
              </p>
              <p>
                The front end is where most of my experience already is — lead on the web
                client of Syntheza, an Angular internship before that, React and React
                Native throughout. I am comfortable there, and that is exactly why I want to
                move deeper now. I have worked outside it before — a VST3 sampler in C++,
                where the deadlines are measured in samples — and I would rather spend the
                next years on the part of the system that decides what the interface is
                showing in the first place.
              </p>
              <p>
                I spent my fourth year in Beijing, which is where the Mandarin comes from. I
                would rather ship something narrow that works than something broad that
                almost does.
              </p>
            </div>

            <div className="about__stats reveal">
              {STATS.map((s) => (
                <div className="about__stat" key={s.l}>
                  <b>{s.n}</b>
                  <span className="label">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="edu reveal">
          {EDUCATION.map((e) => (
            <div className="edu__row" key={e.what}>
              <span className="label edu__when">{e.when}</span>
              <div>
                <h3 className="edu__what">{e.what}</h3>
                <span className="label edu__where">{e.where}</span>
                <p className="edu__detail">{e.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
