"""Render resume.html to a one-page A4 PDF through headless Chrome.

Same approach as the portfolio build: Chrome is the only renderer here that
handles the web fonts and the print CSS identically to what you see on screen.
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
SRC = HERE / "resume.html"
OUT = HERE / "Raphael-Pelerin-Resume.pdf"
OUT_NO_PHOTO = HERE / "Raphael-Pelerin-Resume-no-photo.pdf"

# A photo is expected on a CV in France, Germany and Switzerland, and is a
# liability in the US, UK and Canada, where employers routinely discard CVs
# carrying one to stay clear of discrimination claims. Both versions are built
# from the same source so neither can drift out of date.
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
    if not SRC.exists():
        sys.exit(f"missing {SRC}")

    chrome = find_chrome()
    html = SRC.read_text(encoding="utf-8")

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

    render(SRC.as_uri(), OUT)

    # the variant is written beside the original so relative asset paths hold
    variant = HERE / "_no-photo.html"
    variant.write_text(html.replace("</head>", HIDE_PHOTO + "</head>"), encoding="utf-8")
    try:
        render(variant.as_uri(), OUT_NO_PHOTO)
    finally:
        variant.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
