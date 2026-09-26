"""Showcase poster: left, right and top views cut straight out of the paint.

    python showcase.py            (run make_paint.py first)

Each view is the real painted panel from the template, masked to its UV
island, so what you see is exactly what's in car_<ID>.tga.
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

import make_paint as mp

OUT = os.path.join(mp.HERE, "output")


def islands(wire):
    """Label the template's UV islands from its wireframe outlines."""
    w = np.array(wire.getchannel("A")) > 30
    w = ndimage.binary_dilation(w, iterations=2)
    lab, _ = ndimage.label(ndimage.binary_fill_holes(w))
    return lab


def cutout(paint, lab, seeds, box):
    ids = {lab[y, x] for x, y in seeds}
    m = Image.fromarray((np.isin(lab, list(ids)) * 255).astype(np.uint8), "L")
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    img = paint.convert("RGBA")
    img.putalpha(m)
    return img.crop(box)


def views(paint, lab):
    x0, y0, x1, y1 = mp.SIDE_BOX
    left = cutout(paint, lab, [(1100, 1850), (600, 1860)], (300, y0, x1, y1))
    ry0, ry1 = mp.MIRROR_Y - y1, mp.MIRROR_Y - y0
    right = cutout(paint, lab, [(1100, mp.MIRROR_Y - 1850), (600, mp.MIRROR_Y - 1860)],
                   (300, ry0, x1, ry1)).rotate(180)
    # top view: hood, windshield banner, roof and trunk sit nose-left in order
    ids = [(540, 1200), (930, 1200), (1300, 1240), (1700, 1240)]
    # the roof shares an island with both sides; the crop keeps just its band
    top = cutout(paint, lab, ids, (80, 850, 2000, 1600))
    return left, right, top


def label(text, size=46):
    return mp.text_block(text, mp.font(mp.F_COND, size), mp.GOLD_STOPS, stroke=2,
                         skew=0, tracking=int(size * .35))


def with_reflection(img, fade=0.35, depth=0.45):
    h = int(img.height * depth)
    ref = img.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, img.width, h))
    grad = Image.linear_gradient("L").resize((img.width, h)).point(lambda v: int((255 - v) * fade))
    a = np.minimum(np.array(ref.getchannel("A"), dtype=float), np.array(grad, dtype=float))
    ref.putalpha(Image.fromarray(a.astype(np.uint8)))
    out = Image.new("RGBA", (img.width, img.height + h + 6), (0, 0, 0, 0))
    out.alpha_composite(img)
    out.alpha_composite(ref.filter(ImageFilter.GaussianBlur(1.5)), (0, img.height + 6))
    return out


def framed(img, title, W):
    """View with a thin neon frame and a spaced-out gold caption."""
    pad = 40
    lab = label(title)
    lab = mp.fit(lab, W * .5, 50)
    H = img.height + lab.height + pad * 3
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(panel)
    d.rounded_rectangle([2, 2, W - 3, H - 3], 18, fill=(10, 11, 9, 235), outline=(90, 70, 15, 255), width=2)
    mp.paste_center(panel, lab, W / 2, pad + lab.height / 2)
    mp.paste_center(panel, img, W / 2, pad * 2 + lab.height + img.height / 2)
    return panel


def build():
    tpl = mp.load_template()
    paint = Image.open(os.path.join(OUT, "preview_flat.png"))
    lab = islands(tpl["wire"])
    left, right, top = views(paint, lab)

    W = 2400
    M = 70
    col = W - M * 2
    side_w = col
    left_v = with_reflection(mp.fit(left, side_w - 120, 9999))
    right_v = with_reflection(mp.fit(right, side_w - 120, 9999))
    top_v = mp.fit(top, col - 120, 9999)

    p_left = framed(left_v, "LEFT SIDE", side_w)
    p_right = framed(right_v, "RIGHT SIDE", side_w)
    p_top = framed(top_v, "TOP  ·  NOSE LEFT", col)

    # header
    title = mp.text_block("PEDERSON FARMS RACING", mp.font(mp.F_BLOCK, 300), mp.SILVER_STOPS,
                          stroke=10, glow=(255, 200, 70))
    title = mp.fit(title, W * .72, 260)
    sub_a = mp.text_block("TOYOTA GR86  //   ", mp.font(mp.F_COND, 70),
                          [(0, (235, 235, 235)), (1, (200, 200, 200))], stroke=0, skew=0, tracking=18)
    sub_b = mp.text_block("NEON HARVEST GLOW EDITION", mp.font(mp.F_COND, 70), mp.LIME_STOPS,
                          stroke=0, skew=0, tracking=18)
    sub = Image.new("RGBA", (sub_a.width + sub_b.width, max(sub_a.height, sub_b.height)), (0, 0, 0, 0))
    sub.alpha_composite(sub_a, (0, (sub.height - sub_a.height) // 2))
    sub.alpha_composite(sub_b, (sub_a.width, (sub.height - sub_b.height) // 2))
    sub = mp.fit(sub, W * .6, 60)

    # tribute strip
    ded = Image.new("RGBA", (620, 300), (0, 0, 0, 0))
    a1 = mp.fit(mp.text_block("Amber Pederson", mp.font(mp.F_SCRIPT, 150), mp.GOLD_STOPS, stroke=2, skew=0), 560, 120)
    a2 = mp.fit(mp.text_block("& Oaklynn", mp.font(mp.F_SCRIPT, 150), mp.GOLD_STOPS, stroke=2, skew=0), 420, 120)
    mp.paste_center(ded, a1, 310, 80)
    mp.paste_center(ded, a2, 330, 215)
    tiles = [
        ("DEDICATION", ded),
        ("THREE CATS", mp.cats_panel(260)),
        ("IN MEMORY OF TATE", mp.tate_badge(420)),
        ("TEAM LOGO", mp.team_logo(520)),
    ]
    tile_w = (col - M * 3) // 4
    tile_h = 380
    strip = []
    for name, art in tiles:
        t = Image.new("RGBA", (tile_w, tile_h), (0, 0, 0, 0))
        d = ImageDraw.Draw(t)
        d.rounded_rectangle([2, 2, tile_w - 3, tile_h - 3], 14, fill=(10, 11, 9, 235),
                            outline=(90, 70, 15, 255), width=2)
        lb = mp.fit(label(name, 40), tile_w * .8, 34)
        mp.paste_center(t, lb, tile_w / 2, 40)
        mp.paste_center(t, mp.fit(art, tile_w - 50, tile_h - 110), tile_w / 2, 60 + (tile_h - 60) / 2)
        strip.append(t)

    tag = mp.text_block("HARVESTING PASSION.  HONORING FAMILY.  RACING TOGETHER.", mp.font(mp.F_COND, 60),
                        [(0, (230, 230, 225)), (1, (190, 190, 185))], stroke=0, skew=0, tracking=14)
    tag = mp.fit(tag, W * .6, 40)

    H = (M + title.height + 20 + sub.height + M + p_left.height + M + p_right.height + M
         + p_top.height + M + tile_h + M + tag.height + M)
    poster = Image.new("RGBA", (W, H), (4, 5, 4, 255))
    poster.alpha_composite(mp.tread_texture(W, H, cell=120, alpha=22))

    y = M
    # wheat either side of the title
    for s in (-1, 1):
        g = mp.bezier((W / 2 + s * (title.width / 2 + 40), y + title.height * .9),
                      (W / 2 + s * (title.width / 2 + 120), y + title.height * .7),
                      (W / 2 + s * (title.width / 2 + 150), y + title.height * .3),
                      (W / 2 + s * (title.width / 2 + 110), y), n=120)
        mp.wheat_garland(poster, g, ear=60, every=26)
    mp.paste_center(poster, title, W / 2, y + title.height / 2)
    y += title.height + 20
    mp.paste_center(poster, sub, W / 2, y + sub.height / 2)
    y += sub.height + M
    poster.alpha_composite(p_left, (M, y))
    y += p_left.height + M
    poster.alpha_composite(p_right, (M, y))
    y += p_right.height + M
    poster.alpha_composite(p_top, (M, y))
    y += p_top.height + M
    for i, t in enumerate(strip):
        poster.alpha_composite(t, (M + i * (tile_w + M), y))
    y += tile_h + M
    mp.paste_center(poster, tag, W / 2, y + tag.height / 2)

    path = os.path.join(OUT, "showcase.png")
    poster.convert("RGB").save(path, optimize=True)
    print("Wrote", path, poster.size)


if __name__ == "__main__":
    build()
