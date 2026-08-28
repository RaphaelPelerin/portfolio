"""
Injects the generated shapes and the project links into template.html, then
renders the PDF.

Chrome is driven headless with --print-to-pdf. --virtual-time-budget is what
makes it wait for the Google Fonts request; without it the PDF renders in a
fallback face and the whole thing looks like a different document.
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
SOURCE = Path("C:/Users/rapha/OneDrive/Documents/David")

CHROME_CANDIDATES = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
]

# Each project link is read from its file in the source folder, so filling one
# in there and rebuilding is all it takes. The fallback covers a file that is
# missing or empty. A project with no link renders no line at all, rather than
# an empty label.
LINK_FILES = {
    "syntheza": ("SYNTHEZA/link.txt", "https://syntheza.ovh"),
    "forge": ("FORGE/LINK.txt", ""),
    "keys": ("KEYS GPT/Link.txt", ""),
}


def find_chrome():
    for c in CHROME_CANDIDATES:
        if Path(c).exists():
            return c
    found = shutil.which("chrome") or shutil.which("msedge")
    if found:
        return found
    sys.exit("No Chrome or Edge binary found - cannot render the PDF.")


def read_links():
    out = {}
    print("links:")
    for key, (rel, fallback) in LINK_FILES.items():
        f = SOURCE / rel
        text = f.read_text(encoding="utf-8", errors="ignore").strip() if f.exists() else ""
        url = (text.splitlines()[0].strip() if text else "") or fallback
        state = "from file" if text else ("fallback" if url else "NOT SET")
        print(f"  {key:10} {url or '-':34} ({state})")
        out[key] = url
    return out


def link_markup(url):
    if not url:
        return ""
    label = url.replace("https://", "").replace("http://", "").rstrip("/")
    return f'<p class="linkline"><span>Live</span>{label}</p>'


def main():
    subprocess.run([sys.executable, str(HERE / "shapes.py")], check=True)

    shapes = json.loads((HERE / "shapes.json").read_text(encoding="utf-8"))
    html = (HERE / "template.html").read_text(encoding="utf-8")

    for name, svg in shapes.items():
        html = html.replace("{{" + name + "}}", svg)

    for key, url in read_links().items():
        html = html.replace("{{link_" + key + "}}", link_markup(url))

    if "{{" in html:
        leftover = html[html.index("{{"): html.index("{{") + 40]
        sys.exit(f"Unreplaced placeholder in template: {leftover!r}")

    out_html = HERE / "portfolio.html"
    out_html.write_text(html, encoding="utf-8")
    print(f"wrote {out_html.name} ({len(html) // 1024} kB)")

    out_pdf = HERE / "Raphael-Pelerin-Portfolio.pdf"
    if out_pdf.exists():
        out_pdf.unlink()

    subprocess.run(
        [
            find_chrome(),
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--no-pdf-header-footer",
            "--virtual-time-budget=25000",
            f"--print-to-pdf={out_pdf}",
            out_html.as_uri(),
        ],
        check=True,
        capture_output=True,
    )

    if not out_pdf.exists():
        sys.exit("Chrome exited without producing a PDF.")
    print(f"wrote {out_pdf.name} ({out_pdf.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()
