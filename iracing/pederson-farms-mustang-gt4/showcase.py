"""Showcase poster for the Mustang GT4 paint: left, right and top views cut
out of the painted template (run make_paint.py first).

    python showcase.py
"""
import importlib.util
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "pederson-farms-gr86"))
import make_paint as kit  # noqa: E402  (GR86 helpers)
import showcase as sc     # noqa: E402  (GR86 poster helpers)

spec = importlib.util.spec_from_file_location("mustang_paint", os.path.join(HERE, "make_paint.py"))
mp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mp)

OUT = os.path.join(HERE, "output")


def views(paint, lab):
    x0, y0, x1, y1 = mp.SIDE_BOX
    left = sc.cutout(paint, lab, [(1000, 1770)], (x0, y0, x1, y1))
    right = sc.cutout(paint, lab, [(1000, mp.MIRROR_Y - 1770)],
                      (x0, mp.MIRROR_Y - y1, x1, mp.MIRROR_Y - y0)).rotate(180)
    top = sc.cutout(paint, lab, [(500, 1200), (910, 1190), (1188, 1190), (1560, 1190), (1800, 1190)],
                    (60, 830, 1890, 1560))
    return left, right, top


def build():
    tpl = mp.load_template()
    paint = Image.open(os.path.join(OUT, "preview_flat.png"))
    left, right, top = views(paint, sc.islands(tpl["Wire"]))
    tiles = [(name, mp.asset(key, 1.35 if key in ("dedication", "tate", "logo") else 1.0))
             for name, key in (("DEDICATION", "dedication"), ("THREE CATS", "cats"),
                               ("IN MEMORY OF TATE", "tate"), ("TEAM LOGO", "logo"))]
    poster = sc.compose(left, right, top, subtitle="FORD MUSTANG GT4  //   ", tiles=tiles)
    path = os.path.join(OUT, "showcase.png")
    poster.save(path, optimize=True)
    print("Wrote", path, poster.size)


if __name__ == "__main__":
    build()
