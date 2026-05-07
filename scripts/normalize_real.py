"""Normalize real garment PNGs: convert to RGBA, downscale to <= 900px max side."""
from PIL import Image
import os

DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "public", "garments", "real",
)

MAX = 900

for f in sorted(os.listdir(DIR)):
    if not f.endswith(".png"):
        continue
    p = os.path.join(DIR, f)
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    if max(w, h) > MAX:
        scale = MAX / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    im.save(p, optimize=True)
    print(f"  {f}: {im.size} {im.mode}")
