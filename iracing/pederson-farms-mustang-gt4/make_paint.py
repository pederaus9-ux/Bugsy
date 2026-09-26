"""Pederson Farms Racing - "Neon Harvest Glow" livery for the iRacing Ford Mustang GT4.

Follows the concept art: black body with glowing gold panel edges and gold
veins, #30, the team logo, wheat, the three cats, Tate's memorial and the
farm scene. The tribute pieces in assets/ are cut straight from the concept.

    pip install pillow numpy psd-tools
    python make_paint.py --id 123456
"""
import argparse
import math
import os
import random
import sys
import urllib.request
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "pederson-farms-gr86"))
import make_paint as kit  # shared drawing helpers (text, glow, wheat, fonts)  # noqa: E402

S = 2048
CACHE = os.path.join(HERE, ".template")
TEMPLATE_URL = ("https://ir-core-sites.iracing.com/members/member_images/"
                "cars/car_templates/204_template_FMGT4.zip")
GOLD, LIME = kit.GOLD, kit.LIME

# UV landmarks (template pixels). Left side of the car runs upright along the
# bottom of the sheet, nose to the left; the right side is its mirror at the
# top (y_top = MIRROR_Y - y), upside down. The middle row is a top view, nose
# left, car's left side toward the bottom.
MIRROR_Y = 2366
SIDE_BOX = (200, 1420, 2000, 2000)
NUMBER_PLATE = (640, 1660, 795, 1812)       # IMSA number plate on the front door
HOOD = (96, 830, 760, 1560)
WINDSHIELD = (855, 880, 978, 1490)
WINDSHIELD_INSIDE = (745, 880, 855, 1490)   # the banner's inner face
ROOF = (976, 880, 1400, 1500)
TRUNK = (1424, 900, 1696, 1480)
REAR_PANEL = (1728, 900, 1880, 1480)         # between the taillights, top edge = left
REAR_BUMPER = (1900, 880, 2020, 1500)
WING_TEXT = (60, 380, 600, 460)


def asset(name, boost=1.0):
    img = Image.open(os.path.join(HERE, "assets", name + ".png")).convert("RGBA")
    if boost != 1.0:   # the concept tiles are dim phone-screenshot JPEGs
        a = img.getchannel("A")
        img = ImageEnhance.Brightness(img.convert("RGB")).enhance(boost).convert("RGBA")
        img.putalpha(a)
    return img


# ---------------------------------------------------------------- template

def load_template():
    psd_path = os.path.join(CACHE, "Ford Mustang GT4.psd")
    if not os.path.exists(psd_path):
        os.makedirs(CACHE, exist_ok=True)
        zpath = os.path.join(CACHE, "fmgt4.zip")
        print("Downloading official Mustang GT4 template...")
        urllib.request.urlretrieve(TEMPLATE_URL, zpath)
        zipfile.ZipFile(zpath).extractall(CACHE)
    from psd_tools import PSDImage
    psd = PSDImage.open(psd_path)

    def full(l):
        img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        img.paste(l.topil().convert("RGBA"), (l.left, l.top))
        return img

    out, spec = {}, {}
    for l in psd.descendants():
        if l.is_group():
            continue
        grp = l.parent.name
        if grp in ("Paintable Area", "Turn Off Before Exporting TGA"):
            out[l.name] = full(l)
        elif "Channel" in grp:
            spec.setdefault(grp, []).append(full(l))
    out["spec"] = spec
    return out


# ---------------------------------------------------------------- effects

def outline_mask(wire):
    """Panel edges: the green island outlines of the template wireframe."""
    w = np.array(wire)
    m = (w[..., 3] > 40) & (w[..., 1] > 140) & (w[..., 0] < 140) & (w[..., 2] < 140)
    return Image.fromarray((m * 255).astype(np.uint8), "L")


def neon_edges(canvas, edges):
    """Gold glowing panel edges, turning lime along the rockers and splitter."""
    e = edges.filter(ImageFilter.MaxFilter(3))
    yy = np.arange(S)[:, None].repeat(S, 1)
    xx = np.arange(S)[None, :].repeat(S, 0)
    lime = ((yy > 1890) & (yy < 2010)) | ((yy > 356) & (yy < 476)) | (xx < 90)
    ea = np.array(e)
    for mask, col in ((~lime, GOLD), (lime, LIME)):
        a = Image.fromarray((ea * mask).astype(np.uint8), "L")
        spr = Image.new("RGBA", (S, S), col + (0,))
        spr.putalpha(a.point(lambda v: int(v * 0.9)))
        core = Image.new("RGBA", (S, S), (255, 250, 215, 0))
        core.putalpha(edges.point(lambda v: int(v * 0.8)))
        spr.alpha_composite(core)
        kit.add_glow(canvas, spr, col, radii=(3, 9, 22), strength=(0.9, 0.6, 0.35))


def gold_veins(w, h, count=260, seed=30):
    """Faint branching gold 'crackle' like the concept's marbled finish."""
    rnd = random.Random(seed)
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for _ in range(count):
        x, y = rnd.uniform(0, w), rnd.uniform(0, h)
        ang = rnd.uniform(0, 2 * math.pi)
        width = rnd.choice((1, 1, 2))
        a = rnd.randint(40, 110)
        for _ in range(rnd.randint(8, 26)):
            ang += rnd.uniform(-0.7, 0.7)
            step = rnd.uniform(6, 16)
            nx, ny = x + math.cos(ang) * step, y + math.sin(ang) * step
            d.line([(x, y), (nx, ny)], fill=(230, 170, 40, a), width=width)
            if rnd.random() < 0.12:  # small branch
                bx, by, ba = nx, ny, ang + rnd.choice((-1, 1)) * rnd.uniform(0.6, 1.2)
                for _ in range(rnd.randint(2, 6)):
                    ex, ey = bx + math.cos(ba) * 8, by + math.sin(ba) * 8
                    d.line([(bx, by), (ex, ey)], fill=(230, 170, 40, a // 2), width=1)
                    bx, by = ex, ey
            x, y = nx, ny
    glow = lay.filter(ImageFilter.GaussianBlur(3))
    glow.alpha_composite(lay)
    return glow


def recolor(img, stops):
    """Keep img's shape/alpha, repaint it with a gradient (e.g. gold -> lime)."""
    a = img.getchannel("A")
    lum = img.convert("L")
    m = Image.fromarray((np.array(a, dtype=float) * np.array(lum, dtype=float) / 255 * 1.6)
                        .clip(0, 255).astype(np.uint8))
    return kit.gradient_fill(m, stops)


def rot(img, deg):
    return img.rotate(deg, expand=True, resample=Image.BICUBIC)


def pf_badge(size):
    """Small gold shield with PF, for the rear bumper."""
    b = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(b)
    pts = [(size * .15, size * .12), (size * .85, size * .12), (size * .85, size * .6),
           (size * .5, size * .9), (size * .15, size * .6)]
    d.polygon(pts, fill=(12, 10, 4, 255), outline=GOLD + (255,))
    d.line(pts + [pts[0]], fill=GOLD + (255,), width=max(3, size // 30))
    t = kit.text_block("PF", kit.font(kit.F_BLOCK, 200), kit.SILVER_STOPS, stroke=4, skew=0)
    kit.paste_center(b, kit.fit(t, size * .5, size * .38), size * .5, size * .46)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    kit.add_glow(out, b, GOLD, radii=(4, 10), strength=(0.5, 0.3))
    return out


def wing_text(width):
    a = kit.text_block("PEDERSON FARMS ", kit.font(kit.F_BLOCK, 200), kit.SILVER_STOPS, stroke=6)
    b = kit.text_block("RACING", kit.font(kit.F_BLOCK, 200), kit.GOLD_STOPS, stroke=6)
    out = Image.new("RGBA", (a.width + b.width, max(a.height, b.height)), (0, 0, 0, 0))
    out.alpha_composite(a, (0, 0))
    out.alpha_composite(b, (a.width - 20, 0))
    return kit.fit(out, width, 9999)


# ---------------------------------------------------------------- artwork

def side_art(right, A):
    """One side, drawn in side-view coords (nose left on the left side, nose
    right on the right side), sized SIDE_BOX."""
    x0, y0, x1, y1 = SIDE_BOX
    W, H = x1 - x0, y1 - y0
    art = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def X(gx):
        return (x1 - gx) if right else (gx - x0)

    def Y(gy):
        return gy - y0

    # wheat sweep under the number and logo, like the concept
    g = [(X(x), Y(y)) for x, y in kit.bezier((700, 1905), (900, 1840), (1150, 1905), (1240, 1872), n=200)]
    kit.wheat_garland(art, g, ear=48, every=24)
    g2 = [(X(x), Y(y)) for x, y in kit.bezier((780, 1880), (760, 1800), (770, 1720), (800, 1665), n=90)]
    kit.wheat_garland(art, g2, ear=40, every=22)

    kit.paste_center(art, kit.number_30(190), X(905), Y(1768))
    kit.paste_center(art, kit.fit(A["logo"], 250, 190), X(1100), Y(1768))
    kit.paste_center(art, kit.fit(A["cats"], 220, 190), X(1322), Y(1745))
    kit.paste_center(art, kit.fit(A["tate"], 150, 138), X(1525), Y(1686))
    kit.paste_center(art, kit.fit(A["farm_lime"], 250, 95), X(1340), Y(1880))
    kit.paste_center(art, kit.fit(A["dedication"], 270, 135), X(480), Y(1712))

    name = kit.text_block("AUSTIN PEDERSON", kit.font(kit.F_COND, 120),
                          [(0, (255, 255, 255)), (1, (205, 205, 205))], stroke=4, tracking=6, skew=0.12)
    kit.paste_center(art, kit.fit(name, 230, 28), X(1215), Y(1466))

    rnd = random.Random(3 + right)
    d = ImageDraw.Draw(art)
    for _ in range(22):
        kit.sparkle(d, rnd.uniform(40, W - 40), rnd.uniform(60, H - 40), rnd.uniform(5, 13))
    return art


def hood_art(canvas, A):
    x0, y0, x1, y1 = HOOD
    cy = (y0 + y1) / 2
    for s in (-1, 1):   # wheat sprays along both hood edges, running to the nose
        g = kit.bezier((720, cy + s * 330), (560, cy + s * 350), (380, cy + s * 300), (170, cy + s * 210), n=220)
        kit.wheat_garland(canvas, g, ear=58, every=26)
        g = kit.bezier((650, cy + s * 250), (520, cy + s * 280), (400, cy + s * 230), (260, cy + s * 150), n=160)
        kit.wheat_garland(canvas, g, ear=46, every=24)
    logo = rot(A["logo"], -90)
    kit.paste_center(canvas, kit.fit(logo, 230, 470), 520, cy)
    # wheat laurel on the grille / nose, and the 30 on the bumper corner
    for s in (-1, 1):
        g = kit.bezier((110, cy + s * 20), (130, cy + s * 90), (170, cy + s * 150), (200, cy + s * 190), n=90)
        kit.wheat_garland(canvas, g, ear=36, every=20)
    kit.paste_center(canvas, kit.fit(rot(kit.number_30(200), -90), 80, 110), 180, 960)


def windshield_art(canvas):
    x0, y0, x1, y1 = WINDSHIELD
    band = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(band).rectangle(WINDSHIELD, fill=(6, 6, 6, 255))
    canvas.alpha_composite(band)
    t = kit.text_block("AUSTIN PEDERSON", kit.font(kit.F_COND, 140),
                       [(0, (255, 255, 255)), (1, (210, 210, 210))], stroke=4, tracking=10, skew=0)
    kit.paste_center(canvas, kit.fit(rot(t, -90), x1 - x0 - 30, y1 - y0 - 80), (x0 + x1) / 2, (y0 + y1) / 2)


def roof_art(canvas):
    x0, y0, x1, y1 = ROOF
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    kit.paste_center(canvas, kit.laurel(560, ears=6), cx, cy)
    kit.paste_center(canvas, kit.number_30(360), cx, cy)


def rear_art(canvas, A):
    x0, y0, x1, y1 = TRUNK
    kit.paste_center(canvas, kit.fit(rot(A["logo"], 90), 170, 380), (x0 + x1) / 2, (y0 + y1) / 2)
    x0, y0, x1, y1 = REAR_PANEL
    kit.paste_center(canvas, kit.fit(rot(A["tate"], 90), 150, 230), (x0 + x1) / 2 - 20, (y0 + y1) / 2)
    x0, y0, x1, y1 = REAR_BUMPER
    kit.paste_center(canvas, kit.fit(rot(kit.number_30(200), 90), 90, 130), (x0 + x1) / 2, 1360)
    kit.paste_center(canvas, kit.fit(rot(pf_badge(200), 90), 95, 95), (x0 + x1) / 2, 950)


def wing_art(canvas):
    x0, y0, x1, y1 = WING_TEXT
    kit.paste_center(canvas, wing_text(x1 - x0), (x0 + x1) / 2, (y0 + y1) / 2)


# ---------------------------------------------------------------- build

def build(cust_id, out_dir):
    tpl = load_template()
    A = {k: asset(k) for k in ("cats", "farm", "tread")}
    A.update({k: asset(k, 1.35) for k in ("tate", "dedication", "logo")})
    A["farm_lime"] = recolor(A["farm"], kit.LIME_STOPS)

    canvas = Image.new("RGBA", (S, S), kit.BLACK + (255,))
    d = ImageDraw.Draw(canvas)
    for k in range(-S, S * 2, 6):
        d.line([(k, 0), (k - S, S)], fill=(15, 15, 13, 255), width=2)
    canvas.alpha_composite(gold_veins(S, S))
    # tractor tread (from the concept) across the rear bumper / diffuser
    tread = A["tread"].resize((1040, 300), Image.LANCZOS)
    tread.putalpha(Image.new("L", tread.size, 110))
    canvas.alpha_composite(tread, (960, 10))

    neon_edges(canvas, outline_mask(tpl["Wire"]))

    hood_art(canvas, A)
    roof_art(canvas)
    rear_art(canvas, A)

    x0, y0, x1, y1 = SIDE_BOX
    canvas.alpha_composite(side_art(False, A), (x0, y0))
    canvas.alpha_composite(side_art(True, A).rotate(180), (x0, MIRROR_Y - y1))

    # series decals on top, minus the pieces the concept replaces: the IMSA
    # number plates, the windshield banner and the MUSTANG wing lettering
    decal = tpl["Car Decal"].copy()
    clear = Image.new("L", (S, S), 255)
    cd = ImageDraw.Draw(clear)
    px0, py0, px1, py1 = NUMBER_PLATE
    cd.rectangle(NUMBER_PLATE, fill=0)
    cd.rectangle((px0, MIRROR_Y - py1, px1, MIRROR_Y - py0), fill=0)
    cd.rectangle(WINDSHIELD, fill=0)
    cd.rectangle(WINDSHIELD_INSIDE, fill=0)
    wa = np.array(decal)
    wx0, wy0, wx1, wy1 = WING_TEXT
    region = wa[wy0:wy1, wx0:wx1]
    bright = region[..., :3].min(axis=2) > 150
    region[..., 3][bright] = 0
    decal = Image.fromarray(wa)
    decal.putalpha(Image.fromarray(np.minimum(np.array(decal.getchannel("A")), np.array(clear))))
    canvas.alpha_composite(decal)

    windshield_art(canvas)
    wing_art(canvas)
    canvas.alpha_composite(tpl["Pitbox Colors"])
    paint = canvas.convert("RGB")

    os.makedirs(out_dir, exist_ok=True)
    paint.save(os.path.join(out_dir, f"car_{cust_id}.tga"))

    # custom spec map: R metallic, G roughness, B clearcoat (0 = on)
    rgb = np.array(paint, dtype=float) / 255
    gold = (rgb[..., 0] > .55) & (rgb[..., 1] > .35) & (rgb[..., 2] < .45 * rgb[..., 0])
    silver = (rgb.min(axis=2) > .55) & (rgb.max(axis=2) - rgb.min(axis=2) < .08)

    def chan(layers):
        b = Image.new("RGBA", (S, S), (0, 0, 0, 255))
        for l in layers:
            b.alpha_composite(l)
        return np.array(b.convert("L"), dtype=float)

    sp = tpl["spec"]
    met = chan(sp.get("Red Channel Metallic", []))
    rough = chan(sp.get("Green Channel Roughness", []))
    parts = np.zeros((S, S), bool)
    for l in sp.get("Green Channel Roughness", [])[1:]:
        parts |= np.array(l.getchannel("A")) > 0
    body = ~parts
    met[body], rough[body] = 20, 28
    met[gold & body], rough[gold & body] = 235, 45
    met[silver & body], rough[silver & body] = 200, 40
    spec = np.stack([met, rough, np.zeros((S, S))], axis=2).clip(0, 255).astype(np.uint8)
    Image.fromarray(spec, "RGB").save(os.path.join(out_dir, f"car_spec_{cust_id}.tga"))

    paint.save(os.path.join(out_dir, "preview_flat.png"))
    wire = canvas.copy()
    wire.alpha_composite(tpl["Wire"])
    wire.convert("RGB").resize((1024, 1024), Image.LANCZOS).save(os.path.join(out_dir, "preview_wire.png"))
    print("Wrote", out_dir)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", default="CUSTID", help="your iRacing customer ID")
    ap.add_argument("--out", default=os.path.join(HERE, "output"))
    a = ap.parse_args()
    build(a.id, a.out)
