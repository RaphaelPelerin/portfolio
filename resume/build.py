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
    with tempfile.TemporaryDirectory() as profile:
        subprocess.run(
            [
                chrome,
                "--headless",
                "--disable-gpu",
                f"--user-data-dir={profile}",
                "--no-pdf-header-footer",
                # the fonts come from Google Fonts, so give the load a real budget
                "--virtual-time-budget=20000",
                f"--print-to-pdf={OUT}",
                SRC.as_uri(),
            ],
            check=True,
            capture_output=True,
        )

    print(f"wrote {OUT.name} ({OUT.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()
