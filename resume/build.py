"""Render resume.html and resume-fr.html to one-page A4 PDFs through headless Chrome.

Same approach as the portfolio build: Chrome is the only renderer here that
handles the web fonts and the print CSS identically to what you see on screen.
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent

# Each source produces a photo and a no-photo PDF. A photo is expected on a CV
# in France, Germany and Switzerland, and is a liability in the US, UK and
# Canada, where employers routinely discard CVs carrying one to stay clear of
# discrimination claims. Both variants are built from the same source so they
# cannot drift apart.
TARGETS = [
    (HERE / "resume.html", HERE / "Raphael-Pelerin-Resume.pdf",
     HERE / "Raphael-Pelerin-Resume-no-photo.pdf"),
    (HERE / "resume-fr.html", HERE / "Raphael-Pelerin-CV.pdf",
     HERE / "Raphael-Pelerin-CV-sans-photo.pdf"),
    # Frontend-tailored: leads with Appolonia/ARD (Angular/Ionic production work)
    # instead of the AI framing, for web/mobile front-end postings.
    (HERE / "resume-frontend.html", HERE / "Raphael-Pelerin-Resume-Frontend.pdf",
     HERE / "Raphael-Pelerin-Resume-Frontend-no-photo.pdf"),
    # Apple IS&T internship: single-column and ATS-safe. Photo version is the
    # default; the no-photo one is there for a US/UK recruiter if he prefers.
    (HERE / "resume-apple.html", HERE / "Raphael-Pelerin-Resume-Apple.pdf",
     HERE / "Raphael-Pelerin-Resume-Apple-no-photo.pdf"),
]

HIDE_PHOTO = "<style>.photo{display:none}.head{gap:0}</style>"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def find_chrome():
    for c in CHROME_CANDIDATES:
        if Path(c).exists():
            return c
    found = shutil.which("chrome") or shutil.which("msedge")
    if found:
        return found
    sys.exit("No Chrome or Edge binary found - cannot render the PDF.")


def main():
    chrome = find_chrome()

    def render(source_uri, dest):
        with tempfile.TemporaryDirectory() as profile:
            subprocess.run(
                [
                    chrome,
                    "--headless",
                    "--disable-gpu",
                    f"--user-data-dir={profile}",
                    "--no-pdf-header-footer",
                    # fonts come from Google Fonts, so give the load a real budget
                    "--virtual-time-budget=20000",
                    f"--print-to-pdf={dest}",
                    source_uri,
                ],
                check=True,
                capture_output=True,
            )
        print(f"wrote {dest.name} ({dest.stat().st_size // 1024} kB)")

    for src, out, out_no_photo in TARGETS:
        if not src.exists():
            sys.exit(f"missing {src}")

        html = src.read_text(encoding="utf-8")
        render(src.as_uri(), out)
        if out_no_photo is None:
            continue

        # written beside the source so relative asset paths (photo.jpg) hold
        variant = src.with_name(f"_{src.stem}-no-photo.html")
        variant.write_text(html.replace("</head>", HIDE_PHOTO + "</head>"), encoding="utf-8")
        try:
            render(variant.as_uri(), out_no_photo)
        finally:
            variant.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
