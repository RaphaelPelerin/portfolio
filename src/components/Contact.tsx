import { GitHubMark, LinkedInMark } from "./icons";

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="shell">
        <span className="label reveal">AI internship, end of studies — from March 2027</span>

        <h2 className="contact__big reveal">
          Let&rsquo;s build
          <br />
          something solid
        </h2>

        <div className="contact__routes reveal">
          <a className="contact__btn" href="mailto:raphael_pelerin@yahoo.com.au">
            <span>raphael_pelerin@yahoo.com.au</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            className="contact__btn"
            href="https://github.com/RaphaelPelerin"
            target="_blank"
            rel="noreferrer noopener"
          >
            <GitHubMark /> <span>GitHub</span>
          </a>
          <a
            className="contact__btn"
            href="https://www.linkedin.com/in/raphael-pelerin-a2b389272/"
            target="_blank"
            rel="noreferrer noopener"
          >
            <LinkedInMark /> <span>LinkedIn</span>
          </a>
        </div>

        <footer className="footer" style={{ marginTop: "clamp(3.5rem, 8vw, 7rem)" }}>
          <span>© 2026 Raphael Pelerin · Biot, France</span>
          <div className="footer__links">
            <a href="tel:+33611724588">+33 6 11 72 45 88</a>
          </div>
          <span>Built with React, three.js & GSAP</span>
        </footer>
      </div>
    </section>
  );
}
