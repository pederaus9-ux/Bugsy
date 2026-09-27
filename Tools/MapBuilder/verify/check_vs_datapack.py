"""Cross-check against the independent county data pack (OSM + Microsoft GeoJSON, EPSG:4326) inside the pack's
own bounding box. Usage: python verify/check_vs_datapack.py <path to storm-chaser-data-packs>"""
import json, os, sys
MB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, MB)
from mapbuilder import Frame, load_location, OUT
pack = sys.argv[1]
S, W, N, E = 44.15, -91.70, 44.62, -90.98          # the pack's documented bbox
fr = Frame(load_location())
inside = lambda lon, lat: S <= lat <= N and W <= lon <= E

def ours_in_bbox(items, key="pts"):
    n = 0
    for it in items:
        pts = it[key] if key else [[it["x"], it["y"]]]
        if any(inside(*fr.inv.transform(fr.cx + x, fr.cy + y)) for x, y in pts[:: max(1, len(pts) // 5)]):
            n += 1
    return n

osm = json.load(open(os.path.join(OUT, "osm_local.json")))["layers"]
roads_all = ours_in_bbox(osm["roads"])
bridges_osm = ours_in_bbox([r for r in osm["roads"] if r["tags"].get("bridge") not in (None, "no")])
bl = json.load(open(os.path.join(OUT, "buildings_ms_local.json")))["buildings"]
bld = sum(1 for b in bl if inside(*fr.inv.transform(fr.cx + b["pts"][0][0], fr.cy + b["pts"][0][1])))
p = {k: len(json.load(open(os.path.join(pack, f"{k}.geojson")))["features"]) for k in ("roads", "buildings", "bridges", "water")}
nbi = json.load(open(os.path.join(OUT, "bridges_nbi_local.json")))["bridges"]
nbi_in = sum(1 for b in nbi if inside(*fr.inv.transform(fr.cx + b["x"], fr.cy + b["y"])))
rows = [("roads (OSM highway ways)", roads_all, p["roads"]),
        ("buildings (Microsoft footprints)", bld, p["buildings"]),
        ("bridges (OSM bridge=yes highway ways)", bridges_osm, p["bridges"]),
        ("bridges (FHWA NBI records, ours only)", nbi_in, None)]
print(f"inside the pack bbox S{S} W{W} N{N} E{E}:")
for name, ours, theirs in rows:
    if theirs is None:
        print(f"  {name:40s} ours {ours:>7,}")
    else:
        print(f"  {name:40s} ours {ours:>7,}  pack {theirs:>7,}  diff {(ours - theirs) / theirs * 100:+6.1f}%")
print(f"  water: pack uses OSM water ({p['water']:,} features); ours uses USGS NHD, so counts are not comparable")
print("notes: the pack's bridges include cycleway/rail bridge ways and 11 man_made=bridge outlines; ours counts highway "
      "bridge ways only. The pack clips features at the bbox edge; ours counts any feature touching the bbox.")
