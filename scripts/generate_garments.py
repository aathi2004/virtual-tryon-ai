"""
Generate clean t-shirt/polo/jacket silhouettes with transparent backgrounds
across several colors. Output goes to frontend/public/garments/tshirts/,
shirts/, jackets/.
"""
from PIL import Image, ImageDraw, ImageFilter
import os

ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "frontend", "public", "garments"
)

W, H = 600, 700


def shaded_fill(draw: ImageDraw.ImageDraw, polygon, base_rgb):
    """Draw polygon with a subtle top-to-bottom darker gradient for depth."""
    r, g, b = base_rgb
    draw.polygon(polygon, fill=(r, g, b, 255))


def add_shadow(im: Image.Image, polygon, alpha=60, offset=(6, 10), blur=8):
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    shifted = [(x + offset[0], y + offset[1]) for x, y in polygon]
    sd.polygon(shifted, fill=(0, 0, 0, alpha))
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    im.alpha_composite(shadow)


def highlight(draw: ImageDraw.ImageDraw, polygon, base_rgb, strength=22):
    # lighter inner polygon for a subtle sheen near the top
    r, g, b = base_rgb
    hr = min(255, r + strength)
    hg = min(255, g + strength)
    hb = min(255, b + strength)
    # pick top half of polygon
    ys = [p[1] for p in polygon]
    ymin, ymax = min(ys), max(ys)
    mid = ymin + (ymax - ymin) * 0.35
    top = [(x, y) for x, y in polygon if y <= mid]
    if len(top) >= 3:
        draw.polygon(top, fill=(hr, hg, hb, 120))


def tshirt(color, neck_style="crew", sleeve="short"):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    cx = W // 2
    top = 120
    shoulder_y = 170
    hem_y = 630

    sh_out_l = 90
    sh_out_r = W - 90
    neck_l = cx - 60
    neck_r = cx + 60

    if sleeve == "short":
        sleeve_end_l = sh_out_l - 10
        sleeve_end_r = sh_out_r + 10
        sleeve_bottom_y = 290
    elif sleeve == "long":
        sleeve_end_l = sh_out_l - 20
        sleeve_end_r = sh_out_r + 20
        sleeve_bottom_y = 560
    else:  # sleeveless
        sleeve_end_l = sh_out_l + 30
        sleeve_end_r = sh_out_r - 30
        sleeve_bottom_y = 230

    pit_l = 150
    pit_r = W - 150

    body = [
        (neck_l, top + 20),                 # left neck
        (sh_out_l + 5, shoulder_y - 10),    # left shoulder top
        (sleeve_end_l, shoulder_y + 20),    # left sleeve outer top
        (sleeve_end_l + 8, sleeve_bottom_y),# left sleeve bottom
        (pit_l, sleeve_bottom_y + 5),       # left armpit
        (pit_l - 8, hem_y),                 # left hem
        (pit_r + 8, hem_y),                 # right hem
        (pit_r, sleeve_bottom_y + 5),       # right armpit
        (sleeve_end_r - 8, sleeve_bottom_y),
        (sleeve_end_r, shoulder_y + 20),
        (sh_out_r - 5, shoulder_y - 10),
        (neck_r, top + 20),
    ]

    # neck cutout
    if neck_style == "v":
        neck = [
            (neck_l, top + 20),
            (cx, top + 110),
            (neck_r, top + 20),
        ]
    else:  # crew
        neck = [
            (neck_l, top + 18),
            (neck_l + 10, top + 55),
            (cx - 30, top + 78),
            (cx + 30, top + 78),
            (neck_r - 10, top + 55),
            (neck_r, top + 18),
        ]

    add_shadow(im, body)
    shaded_fill(draw, body, color)
    highlight(draw, body, color)

    # cut neck hole
    mask = Image.new("L", im.size, 255)
    ImageDraw.Draw(mask).polygon(neck, fill=0)
    r, g, b, a = im.split()
    a = Image.eval(a, lambda v: v)
    a = Image.composite(a, Image.new("L", im.size, 0), mask)
    im = Image.merge("RGBA", (r, g, b, a))

    # neck rib
    draw2 = ImageDraw.Draw(im)
    rib_dark = tuple(max(0, c - 30) for c in color)
    if neck_style == "v":
        draw2.line(
            [(neck_l, top + 20), (cx, top + 110), (neck_r, top + 20)],
            fill=rib_dark + (255,), width=5,
        )
    else:
        draw2.arc(
            [neck_l - 4, top + 10, neck_r + 4, top + 90],
            start=0, end=180, fill=rib_dark + (255,), width=6,
        )

    return im


def hoodie(color):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    cx = W // 2
    top = 80
    hood_bottom = 210
    hem_y = 640
    sh_out_l = 85
    sh_out_r = W - 85

    hood = [
        (cx - 120, top + 10),
        (cx - 140, hood_bottom),
        (cx + 140, hood_bottom),
        (cx + 120, top + 10),
        (cx, top - 10),
    ]

    body = [
        (sh_out_l, 200),
        (40, 330),
        (70, 580),
        (120, hem_y),
        (W - 120, hem_y),
        (W - 70, 580),
        (W - 40, 330),
        (sh_out_r, 200),
        (cx + 140, hood_bottom),
        (cx - 140, hood_bottom),
    ]

    add_shadow(im, body)
    shaded_fill(draw, body, color)
    highlight(draw, body, color)
    shaded_fill(draw, hood, tuple(max(0, c - 18) for c in color))

    # pocket
    pocket = [
        (cx - 130, 440),
        (cx - 150, 560),
        (cx + 150, 560),
        (cx + 130, 440),
    ]
    draw.polygon(pocket, fill=tuple(max(0, c - 25) for c in color) + (255,))

    # drawstrings
    draw.line([(cx - 30, hood_bottom), (cx - 25, hood_bottom + 70)], fill=(250, 250, 250, 230), width=4)
    draw.line([(cx + 30, hood_bottom), (cx + 25, hood_bottom + 70)], fill=(250, 250, 250, 230), width=4)

    return im


def polo(color):
    im = tshirt(color, neck_style="crew", sleeve="short")
    draw = ImageDraw.Draw(im)
    cx = W // 2
    # collar wings
    col_dark = tuple(max(0, c - 35) for c in color)
    left = [(cx - 75, 155), (cx - 30, 150), (cx - 20, 220), (cx - 55, 230)]
    right = [(cx + 30, 150), (cx + 75, 155), (cx + 55, 230), (cx + 20, 220)]
    draw.polygon(left, fill=col_dark + (255,))
    draw.polygon(right, fill=col_dark + (255,))
    # placket
    draw.rectangle([cx - 4, 220, cx + 4, 340], fill=col_dark + (255,))
    # buttons
    draw.ellipse([cx - 6, 248, cx + 6, 260], fill=(240, 240, 240, 255))
    draw.ellipse([cx - 6, 298, cx + 6, 310], fill=(240, 240, 240, 255))
    return im


def jacket(color, inner=(245, 245, 245)):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    cx = W // 2
    shoulder_y = 170
    hem_y = 620

    body = [
        (cx - 180, 150),
        (80, 260),
        (70, 580),
        (120, hem_y),
        (W - 120, hem_y),
        (W - 70, 580),
        (W - 80, 260),
        (cx + 180, 150),
    ]

    add_shadow(im, body)
    shaded_fill(draw, body, color)
    highlight(draw, body, color)

    # lapel: V inset of a lighter color
    lapel = [
        (cx - 160, 150),
        (cx - 80, 260),
        (cx, 520),
        (cx + 80, 260),
        (cx + 160, 150),
    ]
    draw.polygon(lapel, fill=inner + (255,))

    # inner collar line
    dk = tuple(max(0, c - 40) for c in color)
    draw.polygon(
        [
            (cx - 160, 150),
            (cx - 100, 220),
            (cx - 60, 240),
            (cx, 520),
            (cx + 60, 240),
            (cx + 100, 220),
            (cx + 160, 150),
        ],
        fill=dk + (255,),
    )

    # button line
    for by in (380, 440, 500):
        draw.ellipse([cx - 7, by, cx + 7, by + 14], fill=(30, 30, 30, 255))

    _ = shoulder_y  # keep linter quiet
    return im


ITEMS = [
    ("tshirts/tshirt-black.png", lambda: tshirt((28, 28, 30))),
    ("tshirts/tshirt-white.png", lambda: tshirt((245, 245, 245))),
    ("tshirts/tshirt-navy.png", lambda: tshirt((24, 45, 96))),
    ("tshirts/tshirt-olive.png", lambda: tshirt((90, 104, 54))),
    ("tshirts/tshirt-mustard.png", lambda: tshirt((205, 155, 42))),
    ("tshirts/tshirt-maroon.png", lambda: tshirt((125, 32, 42))),
    ("tshirts/vneck-teal.png", lambda: tshirt((34, 120, 130), neck_style="v")),
    ("tshirts/tank-charcoal.png", lambda: tshirt((60, 60, 64), sleeve="sleeveless")),
    ("shirts/long-sleeve-white.png", lambda: tshirt((240, 240, 240), sleeve="long")),
    ("shirts/long-sleeve-black.png", lambda: tshirt((26, 26, 28), sleeve="long")),
    ("shirts/polo-red.png", lambda: polo((180, 32, 46))),
    ("shirts/polo-sky.png", lambda: polo((110, 180, 225))),
    ("jackets/hoodie-gray.png", lambda: hoodie((110, 112, 118))),
    ("jackets/hoodie-forest.png", lambda: hoodie((46, 84, 62))),
    ("jackets/blazer-navy.png", lambda: jacket((28, 40, 78), inner=(230, 230, 230))),
    ("jackets/blazer-beige.png", lambda: jacket((192, 170, 132), inner=(250, 245, 230))),
    ("jackets/denim-jacket.png", lambda: jacket((70, 100, 140), inner=(220, 225, 235))),
]


def main():
    for rel, fn in ITEMS:
        out = os.path.join(ROOT, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im = fn()
        im.save(out, optimize=True)
        print(f"  wrote: {rel}")
    print("done")


if __name__ == "__main__":
    main()
