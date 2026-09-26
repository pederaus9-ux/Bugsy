"""Assemble the 3D preview poster from the shot_*.png renders in this folder."""
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "pederson-farms-gr86"))
import make_paint as kit  # noqa: E402


def shot(n, box):
    return Image.open(os.path.join(HERE, f"shot_{n}.png")).convert("RGBA").crop(box)


W, M = 2400, 50
hero = shot("front_left", (150, 80, 1500, 840)).resize((W - 2 * M, int((W - 2 * M) * 760 / 1350)), Image.LANCZOS)
cw = (W - 3 * M) // 2
ch = int(cw * 9 / 16)
crop = {"rear_right": (150, 80, 1500, 840), "front": (250, 150, 1350, 769), "rear": (250, 150, 1350, 769),
        "left": (160, 200, 1440, 920), "right": (160, 200, 1440, 920), "top": (200, 60, 1400, 735)}
rows = [["rear_right", "top"], ["front", "rear"], ["left", "right"]]
title = kit.fit(kit.text_block("PEDERSON FARMS RACING", kit.font(kit.F_BLOCK, 300), kit.SILVER_STOPS,
                               stroke=10, glow=(255, 200, 70)), W * .7, 230)
sub = kit.fit(kit.text_block("#30  //  NEON HARVEST GLOW  //  3D PREVIEW", kit.font(kit.F_COND, 70),
                             kit.LIME_STOPS, stroke=0, skew=0, tracking=16), W * .6, 55)
note = kit.fit(kit.text_block("Mock-up: your Mustang GT4 paint projected onto a stand-in sports-car model. "
                              "Check the real shape in iRacing.", kit.font(kit.F_COND, 60),
                              [(0, (170, 170, 165)), (1, (150, 150, 145))], stroke=0, skew=0, tracking=2), W * .75, 34)
H = M + title.height + 15 + sub.height + M + hero.height + M + len(rows) * (ch + M) + note.height + M
P = Image.new("RGBA", (W, H), (3, 3, 3, 255))
y = M
kit.paste_center(P, title, W / 2, y + title.height / 2)
y += title.height + 15
kit.paste_center(P, sub, W / 2, y + sub.height / 2)
y += sub.height + M
P.alpha_composite(hero, (M, y))
y += hero.height + M
d = ImageDraw.Draw(P)
for r in rows:
    for i, n in enumerate(r):
        im = shot(n, crop[n]).resize((cw, ch), Image.LANCZOS)
        x = M + i * (cw + M)
        P.alpha_composite(im, (x, y))
        d.rounded_rectangle([x, y, x + cw - 1, y + ch - 1], 12, outline=(90, 70, 15, 255), width=2)
    y += ch + M
kit.paste_center(P, note, W / 2, y + note.height / 2)
out = os.path.join(HERE, "..", "output", "render_3d.jpg")
P.convert("RGB").save(out, quality=90)
print("Wrote", out)
