#!/usr/bin/env python3
"""Build CountyMap_Import.zip from ue_package/ plus the current MapBuilder export.

    python ue_package/build_package.py --landmarks <storm-chaser-landmarks.md> --out CountyMap_Import.zip

Fills the README placeholders (coordinate mapping, landscape settings, counts, perf warnings) from
out/ue/manifest.json, so the zip's README always matches the data it was built with.
Terrain tiles are not included (MapBuilder regenerates them).
"""
import argparse
import json
import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
MB = os.path.dirname(HERE)
sys.path.insert(0, MB)
import mapbuilder     # noqa: E402
import ue_export      # noqa: E402

MAP_DATA_PATH_TXT = """# Put the full path of MapBuilder's export folder on the line below (the folder that holds manifest.json),
# for example:  C:\\Users\\you\\Bugsy\\Tools\\MapBuilder\\out\\ue
# Lines starting with # are ignored.

"""


def fmt(v):
    return f"{v:,.1f}".replace(",", "") if isinstance(v, float) else str(v)


def counts_table(st, man):
    r, w, b, bd, t = st["roads"], st["water"], st["bridges"], st["buildings"], st["trees"]
    n_inst = {k: sum(1 for i in man["instances"] if i["kind"] == k) for k in ("Bridge", "Building", "Tree")}
    rows = [
        ("1 Landscape", f"{st['landscape_vertices']:,} vertices in 9 tiles", "9 landscape tiles (World Partition)"),
        ("2 Roads", f"{r['ways']:,} drivable ways, {r['km']:,} km", f"{r['merged_meshes']} merged Nanite meshes ({r['tris']:,} triangles), by class per 8 km cell"),
        ("3 Water", f"{w['lakes']:,} lakes/ponds, {w['river_areas']:,} river areas, {w['streams']:,} streams ({w['stream_km']:,} km)",
         f"{w['merged_meshes']} merged meshes ({w['tris']:,} triangles)"),
        ("4 Bridges", f"{b['osm_decks']} decks + {b['nbi_short_spans']} short spans", f"{n_inst['Bridge']} HISM actors, collision on"),
        ("4 Buildings", f"{bd['buildings']:,} footprints", f"{n_inst['Building']} HISM actors (massing blocks)"),
        ("5 Trees", f"{t['forest_km2']:,} km² forest at {t['tree_spacing_m']} m spacing", f"{t['trees']:,} instances in {n_inst['Tree']} HISM actors"),
        ("6 Playable", "landmark list", f"{len([s for s in man['player_starts'] if 'error' not in s])} PlayerStarts, drive + fly game modes"),
    ]
    out = "| Step | Source data | Result in Unreal |\n|---|---|---|\n"
    return out + "\n".join(f"| {a} | {b_} | {c} |" for a, b_, c in rows)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--landmarks", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    loc = mapbuilder.load_location()
    fr = mapbuilder.Frame(loc)
    ue_dir = os.path.join(mapbuilder.OUT, "ue")
    with open(os.path.join(ue_dir, "manifest.json")) as f:
        man = json.load(f)
    with open(os.path.join(ue_dir, "landscape.json")) as f:
        land = json.load(f)
    geo, st = man["geo"], man["stats"]

    ex = "n/a"
    lms = ue_export.parse_landmarks(a.landmarks)
    pick = next((l for l in lms if l["type"] == "Government"), lms[0] if lms else None)
    if pick:
        e, n = fr.fwd.transform(pick["lon"], pick["lat"])
        x, y = fr.to_local(pick["lon"], pick["lat"])
        ex = (f"{pick['name']} at lat {pick['lat']}, lon {pick['lon']} → easting {e:,.1f}, northing {n:,.1f} → "
              f"**X = {x * 100:,.0f} cm, Y = {-y * 100:,.0f} cm** (Z from the terrain at that point).")

    init_cmd = (f"python mapbuilder.py init --lat {loc['center_lat']:.6f} --lon {loc['center_lon']:.6f} "
                f"--res {loc.get('res_m', 2):g} --tiles-x {fr.tiles_x} --tiles-y {fr.tiles_y} --tile-quads {fr.tile_quads}")
    lx, ly, lz = land["location_cm"]
    towns = [s["town"] for s in man["player_starts"] if "error" not in s]
    subs = {
        "INIT_CMD": init_cmd,
        "LAND_LOC_X": fmt(lx), "LAND_LOC_Y": fmt(ly), "LAND_LOC_Z": fmt(lz),
        "LAND_MAX_X": fmt(lx + land["extent_cm"][0]), "LAND_MAX_Y": fmt(ly + land["extent_cm"][1]),
        # scale goes in exactly: Z rounded to 1 decimal would put roads up to ~45 cm off the terrain
        "LAND_SCALE_X": f"{land['scale'][0]:g}", "LAND_SCALE_Y": f"{land['scale'][1]:g}", "LAND_SCALE_Z": f"{land['scale'][2]:.4f}",
        "ORIGIN_LAT": geo["origin_lat"], "ORIGIN_LON": geo["origin_lon"], "EPSG": geo["crs"],
        "E0": f"{geo['origin_easting_m']:.3f}", "N0": f"{geo['origin_northing_m']:.3f}",
        "ELEV_MIN": geo["elev_min_m"], "ELEV_MAX": geo["elev_max_m"],
        "EXTENT": f"{land['extent_cm'][0] / 100000:.2f} km",
        "EXAMPLE": ex, "COUNTS_TABLE": counts_table(st, man),
        "PERF_WARNINGS": "; ".join(man["perf_warnings"]) or "none",
        "START_TOWNS": " or ".join(towns) if towns else "(no PlayerStart found; see log)",
    }
    with open(os.path.join(HERE, "Docs", "README.md"), encoding="utf-8") as f:
        readme = f.read()
    for k, v in subs.items():
        readme = readme.replace("{{" + k + "}}", str(v))
    left = [p for p in ("{{",) if p in readme]
    if left:
        sys.exit("README still has unfilled placeholders")

    with zipfile.ZipFile(a.out, "w", zipfile.ZIP_DEFLATED) as z:
        root = "CountyMap_Import"
        for fn in sorted(os.listdir(os.path.join(HERE, "Scripts"))):
            if fn.endswith(".py"):
                z.write(os.path.join(HERE, "Scripts", fn), f"{root}/Scripts/{fn}")
        z.writestr(f"{root}/Docs/README.md", readme)
        z.write(a.landmarks, f"{root}/Data/storm-chaser-landmarks.md")
        z.writestr(f"{root}/MapDataPath.txt", MAP_DATA_PATH_TXT)
    print(f"wrote {a.out}")
    for i in zipfile.ZipFile(a.out).infolist():
        print(f"  {i.file_size:>8}  {i.filename}")


if __name__ == "__main__":
    main()
