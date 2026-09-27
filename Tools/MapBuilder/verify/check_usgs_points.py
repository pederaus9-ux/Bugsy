"""Compare terrain heights against the USGS Elevation Point Query Service (best available 3DEP, usually 1 m lidar)
at the PlayerStarts and at seeded random points. Our tiles are the same 3DEP data resampled to 3 m, so small
differences are expected on slopes. Usage: python verify/check_usgs_points.py [n_random]"""
import json, os, sys, urllib.request
import numpy as np
MB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, MB)
from mapbuilder import Frame, load_location, OUT
from ue_export import Ground
fr = Frame(load_location())
g = Ground(fr, OUT)
elev_min = g.m["elev_min_m"]
man = json.load(open(os.path.join(OUT, "ue", "manifest.json")))
pts = [(s["town"] + " start", s["location"][0] / 100, -s["location"][1] / 100) for s in man["player_starts"] if "location" in s]
rng = np.random.default_rng(7)
for i in range(int(sys.argv[1]) if len(sys.argv) > 1 else 20):
    pts.append((f"random {i + 1}", rng.uniform(-fr.half_x, fr.half_x) * 0.98, rng.uniform(-fr.half_y, fr.half_y) * 0.98))
diffs = []
for name, x, y in pts:
    lon, lat = fr.inv.transform(fr.cx + x, fr.cy + y)
    ours = float(g.z_cm(x, y)[0]) / 100 + elev_min
    try:
        r = json.load(urllib.request.urlopen(f"https://epqs.nationalmap.gov/v1/json?x={lon}&y={lat}&units=Meters&wkid=4326", timeout=60))
        usgs = float(r["value"])
    except Exception as e:
        print(f"{name:12s} {lat:.5f},{lon:.5f}  ours {ours:8.2f} m  USGS unavailable ({e})")
        continue
    diffs.append(ours - usgs)
    print(f"{name:12s} {lat:.5f},{lon:.5f}  ours {ours:8.2f} m  USGS {usgs:8.2f} m  diff {ours - usgs:+6.2f} m")
d = np.abs(diffs)
print(f"\n{len(d)} points: mean |diff| {d.mean():.2f} m, median {np.median(d):.2f} m, max {d.max():.2f} m")
