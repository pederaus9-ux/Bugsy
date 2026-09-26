"""Pederson Farms Racing - "Neon Harvest Glow" livery for the iRacing Toyota GR86.

Builds a 2048x2048 paint (car_<ID>.tga), a matching custom spec map
(car_spec_<ID>.tga) and preview PNGs on top of the official iRacing GR86
template.

    pip install pillow numpy psd-tools
    python make_paint.py --id 123456

The official template is downloaded from iRacing on first run.
"""
import argparse
import math
import os
import random
import urllib.request
import zipfile

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
CACHE = os.path.join(HERE, ".template")
TEMPLATE_URL = ("https://ir-core-sites.iracing.com/members/member_images/"
                "cars/car_templates/160_template_GR86.zip")
S = 2048

# Palette
BLACK = (8, 9, 8)
GOLD = (255, 196, 40)
GOLD_HI = (255, 240, 150)
LIME = (150, 255, 40)
LIME_DEEP = (70, 190, 20)

# UV landmarks (template pixels). The car's left side sits upright along the
# bottom of the sheet, front of the car to the left. The right side is its
# vertical mirror at the top of the sheet (y_top = MIRROR_Y - y_bottom), drawn
# upside down.
SIDE_BOX = (330, 1625, 1995, 2045)
MIRROR_Y = 2447
HOOD_LOGO = (410, 930, 670, 1490)    # hood sponsor block, front of car = left
ROOF = (1060, 900, 1560, 1580)
TRUNK = (1600, 930, 1830, 1520)      # rear of car = right
REAR_BUMPER = (40, 20, 1140, 300)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


F_BLOCK = "SairaExtraCondensed-Black.ttf"
F_COND = "SairaCondensed-ExtraBold.ttf"
F_SCRIPT = "GreatVibes-Regular.ttf"


# ---------------------------------------------------------------- template

def load_template():
    psd_path = os.path.join(CACHE, "Toyota GR86.psd")
    if not os.path.exists(psd_path):
        os.makedirs(CACHE, exist_ok=True)
        zpath = os.path.join(CACHE, "gr86.zip")
        print("Downloading official GR86 template...")
        urllib.request.urlretrieve(TEMPLATE_URL, zpath)
        zipfile.ZipFile(zpath).extractall(CACHE)
    from psd_tools import PSDImage
    psd = PSDImage.open(psd_path)

    def layer(name, parent=None):
        for l in psd.descendants():
            if l.name == name and (parent is None or l.parent.name == parent):
                full = Image.new("RGBA", (S, S), (0, 0, 0, 0))
                full.paste(l.topil().convert("RGBA"), (l.left, l.top))
                return full
        raise KeyError(name)

    return {
        "decals": layer("Car_decal"),
        "pitbox": layer("Pitbox"),
        "mask": layer("Mask"),
        "wire": layer("Wire"),
        "met_base": layer("Base Paint", "Red Channel Metallic"),
        "met_parts": layer("Parts", "Red Channel Metallic"),
        "rough_base": layer("Base Paint", "Green Channel Roughness"),
        "rough_parts": layer("Parts", "Green Channel Roughness"),
        "clear": layer("Blue Channel Clearcoat"),
    }


# ---------------------------------------------------------------- helpers

def layer_():
    return Image.new("RGBA", (S, S), (0, 0, 0, 0))


def add_glow(dst, src, color, radii=(4, 12, 30), strength=(1.0, 0.8, 0.55)):
    """Bloom: blurred copies of src's alpha tinted with color, added under src."""
    a = src.getchannel("A")
    for r, k in zip(radii, strength):
        g = a.filter(ImageFilter.GaussianBlur(r)).point(lambda v, k=k: min(255, int(v * k * 1.6)))
        tint = Image.new("RGBA", dst.size, color + (0,))
        tint.putalpha(g)
        dst.alpha_composite(tint)
    dst.alpha_composite(src)


def gradient_fill(mask, stops, horizontal=False):
    """Fill mask (L) with a multi-stop gradient, returns RGBA."""
    w, h = mask.size
    n = w if horizontal else h
    ts = np.linspace(0, 1, n)
    pos = [p for p, _ in stops]
    cols = np.array([c for _, c in stops], dtype=float)
    line = np.stack([np.interp(ts, pos, cols[:, i]) for i in range(3)], axis=1)
    if horizontal:
        arr = np.broadcast_to(line[None, :, :], (h, w, 3))
    else:
        arr = np.broadcast_to(line[:, None, :], (h, w, 3))
    img = Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")
    img.putalpha(mask)
    return img


GOLD_STOPS = [(0, (255, 248, 190)), (0.35, (255, 205, 60)), (0.55, (200, 130, 10)),
              (0.7, (255, 214, 90)), (1, (150, 90, 0))]
SILVER_STOPS = [(0, (255, 255, 255)), (0.4, (215, 220, 225)), (0.55, (120, 125, 132)),
                (0.75, (225, 228, 232)), (1, (150, 155, 160))]
LIME_STOPS = [(0, (220, 255, 150)), (0.45, (140, 240, 40)), (0.6, (60, 160, 10)),
              (1, (150, 230, 50))]


def text_block(text, fnt, stops, stroke=6, stroke_col=(0, 0, 0), skew=0.18,
               glow=None, tracking=0):
    """Rendered text sprite: gradient fill, dark outline, italic skew, optional glow."""
    pad = stroke + 60
    if tracking:
        widths = [fnt.getlength(c) for c in text]
        tw = int(sum(widths) + tracking * (len(text) - 1))
    else:
        tw = int(fnt.getlength(text))
    asc, desc = fnt.getmetrics()
    w, h = tw + pad * 2, asc + desc + pad * 2
    mask = Image.new("L", (w, h), 0)
    smask = Image.new("L", (w, h), 0)
    dm, ds = ImageDraw.Draw(mask), ImageDraw.Draw(smask)
    if tracking:
        x = pad
        for c, cw in zip(text, widths):
            dm.text((x, pad), c, font=fnt, fill=255)
            ds.text((x, pad), c, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
            x += cw + tracking
    else:
        dm.text((pad, pad), text, font=fnt, fill=255)
        ds.text((pad, pad), text, font=fnt, fill=255, stroke_width=stroke, stroke_fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if stroke:
        sc = Image.new("RGBA", (w, h), stroke_col + (255,))
        sc.putalpha(smask)
        out.alpha_composite(sc)
    out.alpha_composite(gradient_fill(mask, stops))
    if skew:
        extra = int(h * skew)
        out = out.transform((w + extra, h), Image.AFFINE, (1, skew, -extra, 0, 1, 0),
                            resample=Image.BICUBIC)
    out = out.crop(out.getbbox())
    if glow:
        big = Image.new("RGBA", (out.width + 120, out.height + 120), (0, 0, 0, 0))
        spr = Image.new("RGBA", big.size, (0, 0, 0, 0))
        spr.paste(out, (60, 60))
        add_glow(big, spr, glow, radii=(6, 18, 40), strength=(0.8, 0.6, 0.35))
        out = big
    return out


def fit(sprite, max_w, max_h):
    k = min(max_w / sprite.width, max_h / sprite.height)
    return sprite.resize((max(1, int(sprite.width * k)), max(1, int(sprite.height * k))),
                         Image.LANCZOS)


def paste_center(dst, sprite, cx, cy):
    dst.alpha_composite(sprite, (int(cx - sprite.width / 2), int(cy - sprite.height / 2)))


def bezier(p0, p1, p2, p3, n=120):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
        y = mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
        pts.append((x, y))
    return pts


def neon_line(dst, pts, color, width=4, core=(255, 255, 230)):
    ln = Image.new("RGBA", dst.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ln)
    d.line(pts, fill=color + (255,), width=width, joint="curve")
    d.line(pts, fill=core + (255,), width=max(1, width // 3), joint="curve")
    add_glow(dst, ln, color, radii=(3, 10, 24), strength=(1.0, 0.7, 0.45))


def sparkle(d, x, y, r, col=(255, 250, 210)):
    d.polygon([(x - r, y), (x, y - r * 0.18), (x + r, y), (x, y + r * 0.18)], fill=col + (255,))
    d.polygon([(x, y - r), (x + r * 0.18, y), (x, y + r), (x - r * 0.18, y)], fill=col + (255,))
    d.ellipse([x - r * .22, y - r * .22, x + r * .22, y + r * .22], fill=(255, 255, 255, 255))


# ---------------------------------------------------------------- motifs

def wheat_head(length, color_stops=GOLD_STOPS, stem=0.8):
    """One ear of wheat lying horizontally: stem on the left, tip on the right."""
    gl = length * 0.2            # grain length
    head = length * (1 - stem * 0.45)
    w, h = int(length + gl * 2), int(gl * 2.6)
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    cy = h / 2
    x_head = w - head - gl * 0.6
    d.line([(0, cy), (x_head + gl, cy)], fill=255, width=max(2, int(gl * 0.18)))
    n = max(4, int(head / (gl * 0.52)))
    for i in range(n):
        x = x_head + i * gl * 0.52
        k = 1 - 0.35 * (i / n)       # grains shrink toward the tip
        for side in (-1, 1):
            g = Image.new("L", (int(gl * 2), int(gl * 2)), 0)
            ImageDraw.Draw(g).ellipse([gl * .5, gl - gl * .22 * k, gl * .5 + gl * k, gl + gl * .22 * k], fill=255)
            g = g.rotate(side * 32, resample=Image.BICUBIC, center=(gl * .5, gl))
            m.paste(255, (int(x - gl * .5), int(cy - gl + side * gl * .12)), g)
            ax = x + gl * .9 * k
            d.line([(ax, cy + side * gl * .45), (ax + gl * 1.1, cy + side * gl * 1.05)], fill=190, width=1)
    tip = x_head + n * gl * 0.52
    d.ellipse([tip - gl * .2, cy - gl * .16, tip + gl * .5, cy + gl * .16], fill=255)
    d.line([(tip + gl * .4, cy), (tip + gl * 1.3, cy)], fill=190, width=1)
    fill = gradient_fill(m, color_stops)
    out = Image.new("RGBA", (w + 6, h + 6), (0, 0, 0, 0))
    edge = Image.new("RGBA", out.size, (40, 25, 0, 255))
    edge.putalpha(Image.new("L", out.size, 0))
    em = Image.new("L", out.size, 0)
    em.paste(m, (3, 3))
    edge.putalpha(em.filter(ImageFilter.MaxFilter(3)))
    out.alpha_composite(edge)
    out.alpha_composite(fill, (3, 3))
    return out


def wheat_garland(dst, pts, ear=46, every=26, color_stops=GOLD_STOPS):
    """Ears of wheat branching off a curve (pts), all leaning toward its end."""
    stem = Image.new("RGBA", dst.size, (0, 0, 0, 0))
    ImageDraw.Draw(stem).line(pts, fill=(200, 140, 20, 255), width=3, joint="curve")
    add_glow(dst, stem, GOLD, radii=(3, 8), strength=(0.6, 0.3))
    sprite = wheat_head(ear, color_stops, stem=0.35)
    acc, side = 0.0, 1
    for i in range(1, len(pts)):
        (xa, ya), (xb, yb) = pts[i - 1], pts[i]
        acc += math.hypot(xb - xa, yb - ya)
        if acc < every:
            continue
        acc = 0.0
        frac = i / len(pts)
        ang = math.degrees(math.atan2(yb - ya, xb - xa)) + side * 38
        k = 0.55 + 0.45 * math.sin(math.pi * min(1, frac * 1.1))   # taper at the ends
        spr = sprite.resize((max(2, int(sprite.width * k)), max(2, int(sprite.height * k))), Image.LANCZOS)
        spr = spr.rotate(-ang, expand=True, resample=Image.BICUBIC)
        paste_center(dst, spr, xb + math.cos(math.radians(ang)) * ear * k * 0.45,
                     yb + math.sin(math.radians(ang)) * ear * k * 0.45)
        side = -side


def laurel(size, color_stops=GOLD_STOPS, ears=5):
    """Two arcs of wheat ears curving up around the centre (for badges)."""
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    r = size * 0.4
    c = size / 2
    L = size * 0.3
    for side in (-1, 1):
        for i in range(ears):
            a = math.radians(100 + i * 30) if side < 0 else math.radians(80 - i * 30)
            x, y = c + math.cos(a) * r, c + math.sin(a) * r
            ear = wheat_head(L, color_stops, stem=0.4)
            tang = math.degrees(a) + (90 if side < 0 else -90)   # points up along the ring
            spr = ear.rotate(-tang, expand=True, resample=Image.BICUBIC)
            paste_center(out, spr, x, y)
    return out


def tread_texture(w, h, cell=90, alpha=38):
    """Tractor-tyre chevrons, dark and subtle, for the base."""
    t = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(t)
    for y in range(-cell, h + cell, cell):
        for x in range(-cell, w + cell, int(cell * 1.6)):
            lug = [(x, y), (x + cell * .55, y + cell * .45), (x + cell * .55, y + cell * .8),
                   (x, y + cell * .35)]
            lug2 = [(x + cell * .55, y + cell * .45), (x + cell * 1.1, y), (x + cell * 1.1, y + cell * .35),
                    (x + cell * .55, y + cell * .8)]
            d.polygon(lug, fill=(60, 70, 30, alpha))
            d.polygon(lug2, fill=(70, 60, 20, alpha))
    return t


def cat_sprite(h, body, patches=None, eye=(120, 220, 90)):
    """Seated cat, front view, simple vector silhouette."""
    w = int(h * 0.62)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    shade = tuple(max(0, int(c * 0.72)) for c in body)
    # tail curling round the front
    d.arc([w * .05, h * .62, w * .95, h * 1.05], 200, 340, fill=shade + (255,), width=int(h * .06))
    d.ellipse([w * .14, h * .38, w * .86, h * .99], fill=body + (255,))              # body
    d.ellipse([w * .3, h * .5, w * .7, h * .98], fill=tuple(min(255, c + 25) for c in body) + (255,))
    d.ellipse([w * .16, h * .1, w * .84, h * .5], fill=body + (255,))                 # head
    d.polygon([(w * .18, h * .26), (w * .22, h * .0), (w * .44, h * .14)], fill=body + (255,))
    d.polygon([(w * .82, h * .26), (w * .78, h * .0), (w * .56, h * .14)], fill=body + (255,))
    d.polygon([(w * .24, h * .2), (w * .25, h * .06), (w * .38, h * .14)], fill=(235, 160, 160, 255))
    d.polygon([(w * .76, h * .2), (w * .75, h * .06), (w * .62, h * .14)], fill=(235, 160, 160, 255))
    if patches:
        for box, col in patches:
            d.ellipse([w * box[0], h * box[1], w * box[2], h * box[3]], fill=col + (255,))
    for ex in (.36, .64):
        d.ellipse([w * (ex - .07), h * .25, w * (ex + .07), h * .33], fill=eye + (255,))
        d.ellipse([w * (ex - .018), h * .255, w * (ex + .018), h * .325], fill=(10, 10, 10, 255))
    d.polygon([(w * .46, h * .37), (w * .54, h * .37), (w * .5, h * .41)], fill=(220, 120, 130, 255))
    for s in (-1, 1):
        for k in (-1, 0, 1):
            d.line([(w * (.5 + s * .08), h * .4), (w * (.5 + s * .38), h * (.38 + k * .03))],
                   fill=(230, 230, 230, 200), width=1)
    d.ellipse([w * .3, h * .9, w * .46, h * .99], fill=tuple(min(255, c + 30) for c in body) + (255,))
    d.ellipse([w * .54, h * .9, w * .7, h * .99], fill=tuple(min(255, c + 30) for c in body) + (255,))
    return img


def frenchie_sprite(h):
    """French bulldog head (Tate): brindle, bat ears, front view."""
    w = h
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    brindle = (58, 44, 34)
    dark = (30, 24, 20)
    d.polygon([(w * .12, h * .45), (w * .1, h * .02), (w * .42, h * .28)], fill=brindle + (255,))
    d.polygon([(w * .88, h * .45), (w * .9, h * .02), (w * .58, h * .28)], fill=brindle + (255,))
    d.polygon([(w * .17, h * .38), (w * .16, h * .1), (w * .36, h * .28)], fill=(150, 100, 95, 255))
    d.polygon([(w * .83, h * .38), (w * .84, h * .1), (w * .64, h * .28)], fill=(150, 100, 95, 255))
    d.ellipse([w * .12, h * .22, w * .88, h * .98], fill=brindle + (255,))
    rnd = random.Random(30)
    for _ in range(40):  # brindle streaks
        x = rnd.uniform(.2, .8) * w
        y = rnd.uniform(.3, .9) * h
        d.line([(x, y), (x + rnd.uniform(-8, 8), y + h * .08)], fill=dark + (170,), width=2)
    d.ellipse([w * .3, h * .56, w * .7, h * .9], fill=(80, 64, 52, 255))              # muzzle
    d.ellipse([w * .42, h * .58, w * .58, h * .68], fill=(12, 10, 10, 255))           # nose
    d.arc([w * .36, h * .62, w * .5, h * .78], 20, 160, fill=(12, 10, 10, 255), width=3)
    d.arc([w * .5, h * .62, w * .64, h * .78], 20, 160, fill=(12, 10, 10, 255), width=3)
    for ex in (.34, .66):
        d.ellipse([w * (ex - .08), h * .4, w * (ex + .08), h * .54], fill=(25, 15, 8, 255))
        d.ellipse([w * (ex - .03), h * .42, w * (ex + 0), h * .46], fill=(255, 255, 255, 220))
    d.line([(w * .5, h * .3), (w * .5, h * .56)], fill=(200, 190, 175, 120), width=4)  # blaze
    return img


def tate_badge(size):
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    lr = laurel(size)
    out.alpha_composite(lr)
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([size * .2, size * .12, size * .8, size * .72], outline=GOLD + (255,),
                                 width=max(2, size // 70))
    add_glow(out, ring, GOLD, radii=(3, 8), strength=(0.8, 0.5))
    dog = frenchie_sprite(int(size * .5))
    paste_center(out, dog, size / 2, size * .42)
    t1 = text_block("IN MEMORY", font(F_COND, 80), GOLD_STOPS, stroke=3, skew=0)
    t2 = text_block("OF TATE", font(F_COND, 80), GOLD_STOPS, stroke=3, skew=0)
    paste_center(out, fit(t1, size * .5, size * .1), size / 2, size * .79)
    paste_center(out, fit(t2, size * .42, size * .1), size / 2, size * .89)
    return out


def cats_panel(h):
    specs = [("LITTLE MAN", cat_sprite(h, (238, 236, 230), eye=(110, 170, 240))),
             ("BENNY", cat_sprite(h, (112, 116, 124), eye=(230, 190, 60))),
             ("TWILA", cat_sprite(h, (236, 226, 210),
                                   patches=[((.18, .1, .5, .35), (205, 120, 40)),
                                            ((.55, .15, .8, .32), (35, 30, 30)),
                                            ((.2, .55, .45, .8), (205, 120, 40)),
                                            ((.58, .62, .82, .85), (35, 30, 30))],
                                   eye=(150, 200, 80)))]
    gap = int(h * 0.12)
    cw = specs[0][1].width
    w = cw * 3 + gap * 2
    out = Image.new("RGBA", (w + 40, int(h * 1.32)), (0, 0, 0, 0))
    for i, (name, spr) in enumerate(specs):
        x = 20 + i * (cw + gap)
        out.alpha_composite(spr, (x, 0))
        lbl = text_block(name, font(F_COND, 70), [(0, (255, 255, 255)), (1, (220, 220, 220))],
                         stroke=3, skew=0)
        lbl = fit(lbl, cw + gap * .8, h * .2)
        out.alpha_composite(lbl, (int(x + cw / 2 - lbl.width / 2), int(h * 1.05)))
    return out


def farm_scene(w, h):
    """Glowing line-art barn + silo + field rows."""
    m = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(m)
    col = LIME + (255,)
    lw = max(2, h // 40)
    gy = h * .9
    # silo
    sx = w * .18
    d.rectangle([sx, h * .22, sx + w * .1, gy], outline=col, width=lw)
    d.pieslice([sx, h * .1, sx + w * .1, h * .34], 180, 360, outline=col, width=lw)
    for k in range(1, 6):
        yy = h * .22 + (gy - h * .22) * k / 6
        d.line([(sx, yy), (sx + w * .1, yy)], fill=col, width=max(1, lw // 2))
    # barn
    bx0, bx1 = w * .32, w * .62
    d.line([(bx0, gy), (bx0, h * .45), (bx0 + (bx1 - bx0) * .15, h * .3), ((bx0 + bx1) / 2, h * .2),
            (bx1 - (bx1 - bx0) * .15, h * .3), (bx1, h * .45), (bx1, gy)], fill=col, width=lw, joint="curve")
    dx0, dx1 = w * .41, w * .53
    d.rectangle([dx0, h * .55, dx1, gy], outline=col, width=lw)
    d.line([(dx0, h * .55), (dx1, gy)], fill=col, width=lw)
    d.line([(dx1, h * .55), (dx0, gy)], fill=col, width=lw)
    d.rectangle([w * .44, h * .36, w * .5, h * .46], outline=col, width=lw)
    # fence + field rows
    for k in range(9):
        x = w * .64 + k * w * .04
        d.line([(x, gy), (x, h * .68)], fill=col, width=lw)
    d.line([(w * .64, h * .74), (w * .96, h * .74)], fill=col, width=lw)
    d.line([(w * .64, h * .82), (w * .96, h * .82)], fill=col, width=lw)
    d.line([(0, gy), (w, gy)], fill=col, width=lw)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    add_glow(out, m, LIME, radii=(3, 9), strength=(0.9, 0.5))
    return out


def team_logo(width, stacked=True):
    """PEDERSON (silver) / FARMS (lime) / RACING (gold) block."""
    p = text_block("PEDERSON", font(F_BLOCK, 260), SILVER_STOPS, stroke=10)
    f = text_block("FARMS", font(F_BLOCK, 260), LIME_STOPS, stroke=10)
    r = text_block("RACING", font(F_COND, 150), GOLD_STOPS, stroke=8, tracking=28)
    p, f = fit(p, width, 9999), None if False else f
    f = f.resize((int(f.width * p.height / f.height), p.height), Image.LANCZOS)
    if f.width > width:
        f = fit(f, width, 9999)
    r = fit(r, width * .85, 9999)
    gap = int(p.height * .05)
    h = p.height + f.height + r.height + gap * 2
    out = Image.new("RGBA", (width + 160, h + 160), (0, 0, 0, 0))
    spr = Image.new("RGBA", out.size, (0, 0, 0, 0))
    y = 80
    for part in (p, f, r):
        spr.alpha_composite(part, (int(80 + (width - part.width) / 2), y))
        y += part.height + gap
    add_glow(out, spr, (255, 210, 90), radii=(8, 24), strength=(0.35, 0.25))
    return out.crop(out.getbbox())


def number_30(height, glow=GOLD):
    n = text_block("30", font(F_BLOCK, 600), GOLD_STOPS, stroke=18, stroke_col=(20, 14, 0), glow=glow)
    return fit(n, 9999, height)


# ---------------------------------------------------------------- artwork

def base_layer():
    img = Image.new("RGBA", (S, S), BLACK + (255,))
    # faint diagonal carbon weave
    d = ImageDraw.Draw(img)
    for k in range(-S, S * 2, 6):
        d.line([(k, 0), (k - S, S)], fill=(16, 17, 15, 255), width=2)
    img.alpha_composite(tread_texture(S, S, cell=110, alpha=34))
    return img


def side_art(right):
    """Art for one car side in side-view coordinates (front of car at left for
    the left side, at right for the right side). Returns an RGBA sized SIDE_BOX."""
    x0, y0, x1, y1 = SIDE_BOX
    W, H = x1 - x0, y1 - y0
    art = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def X(gx):  # global left-side x -> local x in this side's view
        return (x1 - gx) if right else (gx - x0)

    def Y(gy):
        return gy - y0

    # tread band along the rocker, stronger toward the rear
    band = tread_texture(W, 140, cell=60, alpha=90)
    fade = Image.linear_gradient("L").rotate(90 if right else -90).resize((W, 140))
    band.putalpha(ImageChops.multiply(band.getchannel("A"), fade))
    art.alpha_composite(band, (0, Y(1905)))

    # flowing neon swooshes (defined for the left side, then mirrored)
    swooshes = [
        ((360, 1760), (700, 1690), (1100, 1990), (1990, 1720), GOLD, 7),
        ((360, 1800), (760, 1740), (1150, 2020), (1990, 1765), LIME, 5),
        ((420, 1700), (900, 1650), (1400, 1720), (1990, 1680), GOLD, 4),
        ((360, 1985), (700, 1900), (1000, 1940), (1300, 1880), LIME, 4),
        ((1250, 2025), (1400, 1960), (1600, 1950), (1990, 1905), GOLD, 4),
    ]
    for p0, p1, p2, p3, col, wdt in swooshes:
        pts = [(X(x), Y(y)) for x, y in bezier(p0, p1, p2, p3)]
        neon_line(art, pts, col, width=wdt)

    # wheat garland sweeping back under the logo toward the rear wheel
    garland = [(X(x), Y(y)) for x, y in bezier((760, 1950), (950, 1905), (1150, 1945), (1290, 1905), n=200)]
    wheat_garland(art, garland, ear=44, every=24)

    # driver name along the top of the door
    name = text_block("AUSTIN PEDERSON", font(F_COND, 120), SILVER_STOPS, stroke=5, tracking=6)
    paste_center(art, fit(name, 330, 40), X(1120), Y(1682))

    # team logo on the door, big number on the rear door / quarter. The red
    # panel ahead of the door is the GR Cup number plate the sim stamps.
    paste_center(art, fit(team_logo(420), 300, 205), X(1122), Y(1808))
    paste_center(art, number_30(200), X(1390), Y(1800))

    # farm scene + dedication on the front fender
    paste_center(art, farm_scene(330, 110), X(610), Y(1862))
    ded = text_block("Amber Pederson & Oaklynn", font(F_SCRIPT, 150), GOLD_STOPS, stroke=3, skew=0)
    paste_center(art, fit(ded, 250, 46), X(610), Y(1786))

    # tribute: three cats + Tate on the rear quarter
    paste_center(art, fit(cats_panel(200), 270, 130), X(1570), Y(1735))
    paste_center(art, fit(tate_badge(400), 165, 165), X(1790), Y(1748))

    # sparkles
    rnd = random.Random(7 + right)
    d = ImageDraw.Draw(art)
    for _ in range(26):
        sparkle(d, rnd.uniform(40, W - 40), rnd.uniform(40, H - 40), rnd.uniform(5, 14))
    return art


def hood_art(canvas):
    x0, y0, x1, y1 = HOOD_LOGO
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    # radiating neon lines from the logo toward the headlights / fenders
    for k, (col, wdt) in enumerate([(GOLD, 5), (LIME, 4), (GOLD, 4), (LIME, 3)]):
        off = 60 + k * 55
        for s in (-1, 1):
            p = bezier((740, cy + s * (off + 180)), (560, cy + s * (off + 330)),
                       (300, cy + s * (off + 60)), (120, cy + s * (off * .6)))
            neon_line(canvas, p, col, width=wdt)
    # wheat garlands either side of the logo, running forward to the headlights
    for s in (-1, 1):
        g = bezier((700, cy + s * 300), (560, cy + s * 360), (420, cy + s * 330), (220, cy + s * 250), n=200)
        wheat_garland(canvas, g, ear=50, every=26)
    logo = team_logo(520).rotate(-90, expand=True, resample=Image.BICUBIC)
    paste_center(canvas, fit(logo, x1 - x0 - 10, y1 - y0 - 10), cx, cy)


def roof_art(canvas):
    x0, y0, x1, y1 = ROOF
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for s in (-1, 1):
        neon_line(canvas, bezier((x0 - 20, cy + s * 300), (cx - 120, cy + s * 360),
                                 (cx + 120, cy + s * 240), (x1 + 20, cy + s * 300)), GOLD, 5)
        neon_line(canvas, bezier((x0 - 20, cy + s * 330), (cx - 100, cy + s * 390),
                                 (cx + 140, cy + s * 270), (x1 + 20, cy + s * 330)), LIME, 3)
    lr = laurel(640, ears=6)
    paste_center(canvas, lr, cx, cy + 10)
    n = number_30(400)
    paste_center(canvas, n, cx, cy)


def trunk_art(canvas):
    x0, y0, x1, y1 = TRUNK
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    badge = tate_badge(420).rotate(90, expand=True, resample=Image.BICUBIC)
    paste_center(canvas, fit(badge, 205, 205), x0 + 100, cy)
    txt = text_block("PEDERSON FARMS RACING", font(F_COND, 120), GOLD_STOPS, stroke=5, tracking=4)
    txt = txt.rotate(90, expand=True, resample=Image.BICUBIC)
    paste_center(canvas, fit(txt, 46, y1 - y0 - 40), x1 - 38, cy)


def rear_bumper_art(canvas):
    x0, y0, x1, y1 = REAR_BUMPER
    for k, col in enumerate([GOLD, LIME, GOLD]):
        yy = y0 + 70 + k * 45
        neon_line(canvas, bezier((x0, yy + 40), (x0 + 300, yy - 40), (x1 - 300, yy - 40), (x1, yy + 40)),
                  col, width=4)


# ---------------------------------------------------------------- build

def build(cust_id, out_dir):
    tpl = load_template()
    canvas = base_layer()

    rear_bumper_art(canvas)
    hood_art(canvas)
    roof_art(canvas)
    trunk_art(canvas)

    x0, y0, x1, y1 = SIDE_BOX
    left = side_art(right=False)
    canvas.alpha_composite(left, (x0, y0))
    right = side_art(right=True)
    canvas.alpha_composite(right.rotate(180), (x0, MIRROR_Y - y1))

    # iRacing's mandatory decals + pitbox marker stay on top, as in the template
    canvas.alpha_composite(tpl["decals"])
    canvas.alpha_composite(tpl["pitbox"])
    paint = canvas.convert("RGB")

    os.makedirs(out_dir, exist_ok=True)
    paint.save(os.path.join(out_dir, f"car_{cust_id}.tga"))

    # ---- custom spec map: R metallic, G roughness, B clearcoat (0 = on)
    lum = np.array(canvas.convert("RGB"), dtype=float)
    rgb = lum / 255.0
    gold = ((rgb[..., 0] > .55) & (rgb[..., 1] > .35) & (rgb[..., 2] < .45 * rgb[..., 0]))
    silver = ((rgb.min(axis=2) > .55) & (rgb.max(axis=2) - rgb.min(axis=2) < .08))

    def chan(base, parts):
        b = Image.new("RGBA", (S, S), (0, 0, 0, 255))
        b.alpha_composite(base)
        b.alpha_composite(parts)
        return np.array(b.convert("L"), dtype=float)

    met = chan(tpl["met_base"], tpl["met_parts"])
    rough = chan(tpl["rough_base"], tpl["rough_parts"])
    parts_a = np.array(tpl["rough_parts"].getchannel("A")) > 0
    paint_area = ~parts_a
    met[paint_area] = 20
    rough[paint_area] = 28
    met[gold & paint_area] = 235
    rough[gold & paint_area] = 45
    met[silver & paint_area] = 200
    rough[silver & paint_area] = 40
    clear = np.zeros((S, S))
    spec = np.stack([met, rough, clear], axis=2).clip(0, 255).astype(np.uint8)
    Image.fromarray(spec, "RGB").save(os.path.join(out_dir, f"car_spec_{cust_id}.tga"))

    # ---- previews
    paint.save(os.path.join(out_dir, "preview_flat.png"))
    wire = canvas.copy()
    wire.alpha_composite(tpl["wire"])
    wire.convert("RGB").resize((1024, 1024), Image.LANCZOS).save(os.path.join(out_dir, "preview_wire.png"))
    print("Wrote", out_dir)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", default="CUSTID", help="your iRacing customer ID")
    ap.add_argument("--out", default=os.path.join(HERE, "output"))
    a = ap.parse_args()
    build(a.id, a.out)
