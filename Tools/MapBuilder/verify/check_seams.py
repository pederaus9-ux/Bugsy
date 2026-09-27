"""Heightmap tile seams: neighbouring tiles must share identical edge rows/columns (original and road-carved)."""
import json, os, sys
import numpy as np
MB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, MB)
from mapbuilder import Frame, load_location, OUT
fr = Frame(load_location())
n = fr.tile_quads + 1
for label, d in (("original", OUT), ("carved", os.path.join(OUT, "ue", "terrain"))):
    t = {(x, y): np.memmap(os.path.join(d, f"heightmap_x{x}_y{y}.r16"), "<u2", "r", shape=(n, n))
         for x in range(fr.tiles_x) for y in range(fr.tiles_y)}
    worst = 0
    for (x, y), a in t.items():
        if (x + 1, y) in t:
            worst = max(worst, int(np.abs(a[:, -1].astype(int) - t[(x + 1, y)][:, 0]).max()))
        if (x, y + 1) in t:
            worst = max(worst, int(np.abs(a[-1, :].astype(int) - t[(x, y + 1)][0, :]).max()))
    size = os.path.getsize(os.path.join(d, "heightmap_x0_y0.r16"))
    print(f"{label:8s}: {len(t)} tiles of {n}x{n} ({size:,} bytes each), max seam difference = {worst} (must be 0)")
