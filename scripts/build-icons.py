#!/usr/bin/env python3
"""Génère les icônes PWA / favicon à partir du monogramme variante B (Logo.tsx)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

# Même géométrie que src/components/Logo.tsx et assets-src/logo.svg :
# viewBox 1024², fond #08090A, marque #F7F8F8, translate(214.5 193.4) scale(1.1419).
CANVAS = 1024
TRANSLATE = (214.5, 193.4)
SCALE = 1.1419
BG = (0x08, 0x09, 0x0A)
FG = (0xF7, 0xF8, 0xF8)
MARK_POLYS = [
    [(0, 0), (521, 0), (521, 131), (131, 131)],
    [(0, 108), (131, 239), (131, 226), (262, 357), (131, 357), (131, 558), (0, 558)],
    [(239, 226), (390, 226), (521, 357), (370, 357)],
]

# Zone utile de la marque après transform, pour recentrer une version « maskable ».
MARK_W, MARK_H = 521 * SCALE, 558 * SCALE


def _points(ox: float, oy: float, scale: float) -> list[list[tuple[float, float]]]:
    return [
        [(x * scale + ox, y * scale + oy) for x, y in poly]
        for poly in MARK_POLYS
    ]


def render(size: int, *, pad: float | None = None, supersample: int = 8) -> Image.Image:
    """Rasterise le monogramme. `pad` = marge relative (0.20 = 20 % de chaque côté)."""
    hi = size * supersample
    img = Image.new("RGB", (hi, hi), BG)
    draw = ImageDraw.Draw(img)
    if pad is None:
        # Composition exacte du SVG (favicon / PWA « any »).
        k = (hi / CANVAS) * SCALE
        ox, oy = 214.5 * hi / CANVAS, 193.4 * hi / CANVAS
    else:
        usable = hi * (1 - 2 * pad)
        k = usable / 558  # on calibre sur la hauteur du monogramme
        ox = (hi - 521 * k) / 2
        oy = (hi - 558 * k) / 2
    for poly in _points(ox, oy, k):
        draw.polygon(poly, fill=FG)
    if supersample == 1:
        return img
    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    assets = {
        "favicon-32x32.png": render(32),
        "apple-touch-icon.png": render(180),
        "pwa-192x192.png": render(192),
        "pwa-512x512.png": render(512),
        # Marge ~26 % : le monogramme reste dans la zone sûre maskable (cercle 80 %).
        "maskable-icon-512x512.png": render(512, pad=0.26),
    }
    for name, im in assets.items():
        path = PUBLIC / name
        im.save(path, format="PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")

    ico_sizes = (16, 32, 48)
    ico_images = [render(s) for s in ico_sizes]
    ico_path = PUBLIC / "favicon.ico"
    ico_images[-1].save(
        ico_path,
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[:-1],
    )
    print(f"wrote {ico_path.relative_to(ROOT)} ({ico_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
