"""
Remove near-white backgrounds from garment PNGs and upscale.
Uses corner flood-fill + color tolerance; keeps interior white (e.g., shirt logo) intact.
"""
from PIL import Image, ImageFilter
from collections import deque
import os

ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "public", "garments"
)

TARGETS = [
    ("jackets", "black-jacket.png"),
    ("jackets", "white-hoodie.png"),
    ("shirts", "blue-shirt.png"),
    ("shirts", "green-shirt.png"),
    ("shirts", "red-shirt.png"),
]

WHITE_TOL = 28

def is_white(px, tol=WHITE_TOL):
    r, g, b = px[0], px[1], px[2]
    return r >= 255 - tol and g >= 255 - tol and b >= 255 - tol

def flood_remove_bg(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    data = list(im.getdata())
    alpha = [d[3] for d in data]

    visited = [False] * (w * h)
    q = deque()

    # seed from all edge pixels that look white
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if is_white(data[i]):
                q.append((x, y))
                visited[i] = True
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if is_white(data[i]) and not visited[i]:
                q.append((x, y))
                visited[i] = True

    while q:
        x, y = q.popleft()
        i = y * w + x
        alpha[i] = 0
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                ni = ny * w + nx
                if not visited[ni] and is_white(data[ni]):
                    visited[ni] = True
                    q.append((nx, ny))

    out = [(d[0], d[1], d[2], a) for d, a in zip(data, alpha)]
    new = Image.new("RGBA", (w, h))
    new.putdata(out)
    return new

def feather_alpha(im: Image.Image) -> Image.Image:
    r, g, b, a = im.split()
    a = a.filter(ImageFilter.GaussianBlur(0.8))
    return Image.merge("RGBA", (r, g, b, a))

def upscale(im: Image.Image, target=600) -> Image.Image:
    w, h = im.size
    if max(w, h) >= target:
        return im
    scale = target / max(w, h)
    return im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

def process(path):
    im = Image.open(path).convert("RGBA")
    im = flood_remove_bg(im)
    im = feather_alpha(im)
    im = upscale(im, 600)
    im.save(path, optimize=True)
    print(f"  cleaned: {path} -> {im.size}")

if __name__ == "__main__":
    for folder, name in TARGETS:
        p = os.path.join(ROOT, folder, name)
        if not os.path.exists(p):
            print(f"  missing: {p}")
            continue
        process(p)
    print("done")
