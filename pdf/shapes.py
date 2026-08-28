"""
Generates the wireframe solids used on the PDF pages.

The site draws real polyhedra in WebGL; a PDF cannot, so these are the same
solids projected orthographically to SVG here, with back edges dimmed for
depth. Hand-drawing them would not survive the comparison - the vertex maths
is what makes them read as objects rather than as decoration.

Every shape is emitted with `currentColor`, so each page sets its own accent
in CSS exactly the way the project accents work on the site.
"""

import json
import math
import random
from pathlib import Path

PHI = (1 + 5 ** 0.5) / 2


# --------------------------------------------------------------------------
# solids: (vertices, edge-length^2 used to detect edges)
# --------------------------------------------------------------------------
def _cyclic(a, b, c):
    return [(a, b, c), (b, c, a), (c, a, b)]


def icosahedron():
    v = []
    for s1 in (-1, 1):
        for s2 in (-1, 1):
            v += _cyclic(0, s1 * 1, s2 * PHI)
    return v, 4.0


def octahedron():
    return [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)], 2.0


def dodecahedron():
    v = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                v.append((sx, sy, sz))
    for s1 in (-1, 1):
        for s2 in (-1, 1):
            v += _cyclic(0, s1 / PHI, s2 * PHI)
    return v, (2 / PHI) ** 2


def edges_of(verts, target_sq, tol=1e-6):
    out = []
    for i in range(len(verts)):
        for j in range(i + 1, len(verts)):
            d = sum((verts[i][k] - verts[j][k]) ** 2 for k in range(3))
            if abs(d - target_sq) < tol:
                out.append((i, j))
    return out


# --------------------------------------------------------------------------
# projection
# --------------------------------------------------------------------------
def rotate(p, rx, ry):
    x, y, z = p
    y, z = y * math.cos(rx) - z * math.sin(rx), y * math.sin(rx) + z * math.cos(rx)
    x, z = x * math.cos(ry) + z * math.sin(ry), -x * math.sin(ry) + z * math.cos(ry)
    return x, y, z


def project(verts, rx, ry, scale):
    pts = [rotate(v, rx, ry) for v in verts]
    norm = max(math.hypot(p[0], p[1]) for p in pts) or 1
    k = scale / norm
    return [(p[0] * k, -p[1] * k, p[2]) for p in pts]


def wire_svg(name, verts, target_sq, rx, ry, scale=150, glow=0.30, width=1.1):
    pts = project(verts, rx, ry, scale)
    zs = [p[2] for p in pts]
    lo, hi = min(zs), max(zs)
    span = (hi - lo) or 1

    lines = []
    for i, j in edges_of(verts, target_sq):
        a, b = pts[i], pts[j]
        depth = ((a[2] + b[2]) / 2 - lo) / span          # 0 = back, 1 = front
        op = round(0.14 + 0.52 * depth, 3)
        lines.append(
            f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"'
            f' stroke-opacity="{op}"/>'
        )

    nodes = "".join(
        f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="1.9"'
        f' fill-opacity="{0.2 + 0.55 * ((p[2] - lo) / span):.2f}"/>'
        for p in pts
    )

    return f'''<svg class="solid" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><radialGradient id="glow-{name}"><stop offset="0" stop-color="currentColor" stop-opacity="{glow}"/><stop offset=".55" stop-color="currentColor" stop-opacity="{glow * 0.28:.3f}"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
<circle cx="0" cy="0" r="{scale * 1.28:.0f}" fill="url(#glow-{name})"/>
<g stroke="currentColor" fill="none" stroke-width="{width}" stroke-linecap="round">{"".join(lines)}</g>
<g fill="currentColor" stroke="none">{nodes}</g>
</svg>'''


def torus_svg(name, rx=1.05, ry=0.5, scale=150, tube=0.36, glow=0.26):
    """Parametric torus, drawn as its two families of curves."""
    R, r = 1.0, tube
    rings = []

    def pt(u, v):
        cx = (R + r * math.cos(v)) * math.cos(u)
        cy = (R + r * math.cos(v)) * math.sin(u)
        cz = r * math.sin(v)
        return rotate((cx, cy, cz), rx, ry)

    raw = [pt(u, v) for u in [i * math.pi / 60 for i in range(120)] for v in [0]]
    norm = max(math.hypot(p[0], p[1]) for p in raw) or 1
    k = scale / (norm * 1.25)

    def path(points):
        d = " ".join(
            ("M" if n == 0 else "L") + f"{p[0] * k:.1f},{-p[1] * k:.1f}"
            for n, p in enumerate(points)
        )
        depth = sum(p[2] for p in points) / len(points)
        return d, depth

    # tube outlines
    for vi in range(12):
        v = vi * 2 * math.pi / 12
        pts = [pt(u * 2 * math.pi / 96, v) for u in range(97)]
        d, depth = path(pts)
        rings.append((depth, f'<path d="{d}" stroke-opacity="{0.13 + 0.34 * (depth + 0.4):.3f}"/>'))
    # cross-sections
    for ui in range(36):
        u = ui * 2 * math.pi / 36
        pts = [pt(u, v * 2 * math.pi / 24) for v in range(25)]
        d, depth = path(pts)
        rings.append((depth, f'<path d="{d}" stroke-opacity="{0.10 + 0.30 * (depth + 0.4):.3f}"/>'))

    rings.sort(key=lambda t: t[0])
    body = "".join(s for _, s in rings)

    return f'''<svg class="solid" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><radialGradient id="glow-{name}"><stop offset="0" stop-color="currentColor" stop-opacity="{glow}"/><stop offset=".55" stop-color="currentColor" stop-opacity="{glow * 0.3:.3f}"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
<circle cx="0" cy="0" r="{scale * 1.3:.0f}" fill="url(#glow-{name})"/>
<g stroke="currentColor" fill="none" stroke-width="0.85" stroke-linecap="round">{body}</g>
</svg>'''


def orbit_svg(name, count=2, scale=176):
    """The thin orbit rings each project body carries on the site."""
    out = []
    for i in range(count):
        tilt = -26 + i * 52
        ry_ = scale * (0.30 + 0.16 * i)
        out.append(
            f'<ellipse cx="0" cy="0" rx="{scale}" ry="{ry_:.0f}"'
            f' transform="rotate({tilt})" stroke-opacity="{0.42 - 0.12 * i:.2f}"/>'
        )
    return f'''<svg class="orbits" viewBox="-200 -200 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g stroke="currentColor" fill="none" stroke-width="1">{"".join(out)}</g>
</svg>'''


def stars_svg(seed=7, n=190, w=794, h=1123):
    """Deterministic dust field, matching the starfield behind the site."""
    rnd = random.Random(seed)
    dots = []
    for _ in range(n):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        r = rnd.choice([0.5, 0.6, 0.8, 1.0, 1.4])
        o = round(rnd.uniform(0.12, 0.55), 2)
        dots.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" opacity="{o}"/>')
    return (
        f'<svg class="stars" viewBox="0 0 {w} {h}" preserveAspectRatio="none"'
        f' xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
        f'<g fill="#9aa2b1">{"".join(dots)}</g></svg>'
    )


def build():
    ico_v, ico_e = icosahedron()
    oct_v, oct_e = octahedron()
    dod_v, dod_e = dodecahedron()

    shapes = {
        "ico": wire_svg("ico", ico_v, ico_e, 0.42, 0.62, scale=152, glow=0.34),
        "ico2": wire_svg("ico2", ico_v, ico_e, -0.3, 1.1, scale=150, glow=0.30),
        "octa": wire_svg("octa", oct_v, oct_e, 0.34, 0.7, scale=156, glow=0.30, width=1.5),
        "dodeca": wire_svg("dodeca", dod_v, dod_e, 0.35, 0.55, scale=150, glow=0.28),
        "torus": torus_svg("torus", rx=1.02, ry=0.55, scale=152),
        "orbits": orbit_svg("orbits"),
        "orbits3": orbit_svg("orbits3", count=3),
        "stars": stars_svg(),
        "stars2": stars_svg(seed=21, n=150),
    }

    out = Path(__file__).with_name("shapes.json")
    out.write_text(json.dumps(shapes), encoding="utf-8")
    print(f"wrote {out.name}: {', '.join(shapes)}")


if __name__ == "__main__":
    build()
