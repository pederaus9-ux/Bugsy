"""Convert MapBuilder layers into Unreal-ready JSON/CSV (TDD §8.3).

Runs outside Unreal (needs numpy, shapely, scipy). The Unreal-side importer
(ue/stormchaser_import.py) only reads the files written here, so it needs no
GIS libraries.

Unreal frame: 1 uu = 1 cm, +X = east, +Y = south (GIS north flipped), +Z = up.
Heights are snapped to the same heightmap tiles the landscape is imported from.
"""
import csv
import glob
import json
import math
import os
import re

import numpy as np

EXCLUDED_HIGHWAYS = {"footway", "path", "cycleway", "steps", "pedestrian", "bridleway", "construction",
                     "proposed", "corridor", "elevator", "platform", "raceway", "bus_stop", "abandoned"}
ROAD_CLASS = {
    "motorway": "Interstate", "motorway_link": "Interstate",
    "trunk": "Highway", "trunk_link": "Highway", "primary": "Highway", "primary_link": "Highway",
    "secondary": "County", "secondary_link": "County", "tertiary": "County", "tertiary_link": "County",
    "unclassified": "Town", "residential": "Town", "living_street": "Town", "road": "Town",
    "service": "Service", "track": "Track",
}
# (default width m, default speed km/h, default surface) per class (TDD §8.10)
CLASS_DEFAULTS = {
    "Interstate": (7.4, 113, "asphalt"), "Highway": (8.0, 89, "asphalt"), "County": (7.0, 80, "asphalt"),
    "Town": (6.0, 56, "gravel"), "Service": (3.5, 24, "gravel"), "Track": (3.0, 24, "dirt"),
}


# ---------------------------------------------------------------- ground sampling
class Ground:
    """Bilinear heights (cm, Unreal Z) from the exported landscape tiles."""

    def __init__(self, fr, out_dir):
        with open(os.path.join(out_dir, "map_manifest.json")) as f:
            self.m = json.load(f)
        self.fr = fr
        self.tq = self.m["tile_px"] - 1
        self.zs = self.m["ue_scale"]["z"]
        self.z0 = self.m["ue_location_z_cm"]
        n = self.m["tile_px"]
        self.tiles = {}
        for tx in range(fr.tiles_x):
            for ty in range(fr.tiles_y):
                p = os.path.join(out_dir, f"heightmap_x{tx}_y{ty}.r16")
                self.tiles[(tx, ty)] = np.memmap(p, dtype="<u2", mode="r", shape=(n, n))

    def z_cm(self, x, y):
        x, y = np.atleast_1d(np.asarray(x, float)), np.atleast_1d(np.asarray(y, float))
        col = np.clip((x + self.fr.half_x) / self.fr.res, 0, self.fr.nx - 1)
        row = np.clip((self.fr.half_y - y) / self.fr.res, 0, self.fr.ny - 1)
        tx = np.clip((col // self.tq).astype(int), 0, self.fr.tiles_x - 1)
        ty = np.clip((row // self.tq).astype(int), 0, self.fr.tiles_y - 1)
        c, r = col - tx * self.tq, row - ty * self.tq
        c0 = np.clip(np.floor(c).astype(int), 0, self.tq - 1)
        r0 = np.clip(np.floor(r).astype(int), 0, self.tq - 1)
        fc, fr_ = c - c0, r - r0
        out = np.empty(len(x))
        for key in set(zip(tx.tolist(), ty.tolist())):
            sel = (tx == key[0]) & (ty == key[1])
            t = self.tiles[key]
            a, b = r0[sel], c0[sel]
            v = (t[a, b] * (1 - fc[sel]) * (1 - fr_[sel]) + t[a, b + 1] * fc[sel] * (1 - fr_[sel])
                 + t[a + 1, b] * (1 - fc[sel]) * fr_[sel] + t[a + 1, b + 1] * fc[sel] * fr_[sel])
            out[sel] = self.z0 + (v - 32768.0) * self.zs / 128.0
        return out


# ---------------------------------------------------------------- helpers
def resample(pts, max_seg):
    """Insert vertices so no segment is longer than max_seg (keeps originals)."""
    out = [pts[0]]
    for p, q in zip(pts[:-1], pts[1:]):
        d = math.dist(p, q)
        k = max(1, int(math.ceil(d / max_seg)))
        for i in range(1, k + 1):
            out.append([p[0] + (q[0] - p[0]) * i / k, p[1] + (q[1] - p[1]) * i / k])
    return out


def ue_xy(x, y):
    return round(x * 100.0, 1), round(-y * 100.0, 1)


def ue_path(pts, zs, dz=0.0):
    return [[*ue_xy(x, y), round(float(z) + dz, 1)] for (x, y), z in zip(pts, zs)]


def parse_speed_kph(tag):
    if not tag:
        return None
    m = re.match(r"\s*(\d+(?:\.\d+)?)\s*(mph)?", str(tag))
    if not m:
        return None
    v = float(m.group(1))
    return round(v * 1.609 if m.group(2) else v, 1)


def load(out_dir, name):
    p = os.path.join(out_dir, name)
    if not os.path.exists(p):
        return None
    with open(p) as f:
        return json.load(f)


# ---------------------------------------------------------------- layers
def export_landscape(fr, g, ue_dir, png):
    m = g.m
    tile_len_cm = g.tq * fr.res * 100
    x0, y0 = -fr.half_x * 100, -fr.half_y * 100            # north-west corner in Unreal (min X, min Y)
    tiles = []
    for ty in range(fr.tiles_y):
        for tx in range(fr.tiles_x):
            tiles.append({"file_r16": f"heightmap_x{tx}_y{ty}.r16", "file_png": f"heightmap_x{tx}_y{ty}.png",
                          "tx": tx, "ty": ty,
                          "location_cm": [round(x0 + tx * tile_len_cm, 1), round(y0 + ty * tile_len_cm, 1), m["ue_location_z_cm"]]})
            if png:
                from PIL import Image
                arr = np.array(g.tiles[(tx, ty)], dtype=np.uint16)
                Image.fromarray(arr).save(os.path.join(ue_dir, f"heightmap_x{tx}_y{ty}.png"))
    doc = {
        "tiles": [fr.tiles_x, fr.tiles_y], "tile_px": m["tile_px"],
        "section_quads": 127, "sections_per_component": 2,
        "components_per_tile": [g.tq // 254, g.tq // 254],
        "scale": [m["ue_scale"]["x"], m["ue_scale"]["y"], m["ue_scale"]["z"]],
        "location_cm": [round(x0, 1), round(y0, 1), m["ue_location_z_cm"]],
        "extent_cm": [round(2 * fr.half_x * 100, 1), round(2 * fr.half_y * 100, 1)],
        "tile_files": tiles,
        "note": "Tiles share edge vertices. Import as one tiled landscape at location_cm, or as one landscape per tile at each tile's location_cm.",
    }
    with open(os.path.join(ue_dir, "landscape.json"), "w") as f:
        json.dump(doc, f, indent=1)
    return {"landscape_tiles": len(tiles), "png": bool(png)}


def export_roads(fr, g, out_dir, ue_dir):
    osm = load(out_dir, "osm_local.json")
    roads, skipped = [], 0
    for r in osm["layers"]["roads"]:
        t = r["tags"]
        hw = t.get("highway", "")
        cls = ROAD_CLASS.get(hw)
        if hw in EXCLUDED_HIGHWAYS or cls is None or t.get("area") == "yes":
            skipped += 1
            continue
        width, speed, surf = CLASS_DEFAULTS[cls]
        lanes = t.get("lanes")
        if lanes and str(lanes).isdigit():
            width = max(width, int(lanes) * 3.6)
        surface = t.get("surface")
        is_bridge = t.get("bridge") not in (None, "no")
        pts = r["pts"] if is_bridge else resample(r["pts"], 20.0)
        pts = [p for p in pts if fr.inside(*p)] if not is_bridge else pts
        if len(pts) < 2:
            continue
        zs = g.z_cm([p[0] for p in pts], [p[1] for p in pts])
        if is_bridge:                                       # deck spans between the abutments, never dips into the valley
            zs = np.linspace(zs[0], zs[-1], len(zs))
        roads.append({
            "id": r["id"], "class": cls, "highway": hw, "name": t.get("name"), "ref": t.get("ref"),
            "surface": surface or surf, "surface_guessed": surface is None,
            "width_m": round(width, 2), "speed_kph": parse_speed_kph(t.get("maxspeed")) or speed,
            "oneway": t.get("oneway") == "yes", "is_bridge": is_bridge,
            "pts": ue_path(pts, zs, dz=8.0),
        })
    with open(os.path.join(ue_dir, "roads.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "roads": roads}, f)
    by = {}
    for r in roads:
        by[r["class"]] = by.get(r["class"], 0) + 1
    return {"roads": len(roads), "skipped_non_drivable": skipped, "by_class": by}


def export_water(fr, g, out_dir, ue_dir):
    from shapely.geometry import LineString, Point, Polygon
    from shapely.ops import unary_union
    from shapely.strtree import STRtree

    w = load(out_dir, "water_nhd_local.json")
    areas = [Polygon(a["pts"]).buffer(0) for a in w["areas"] if len(a["pts"]) >= 4]
    areas = [a for a in areas if a.area > 0]
    tree = STRtree(areas) if areas else None
    rivers, creeks, lakes = [], [], []
    for fl in w["flowlines"]:
        pts = [p for p in resample(fl["pts"], 30.0) if fr.inside(*p)]
        if len(pts) < 2:
            continue
        line = LineString(pts)
        width = None
        if tree is not None:
            hits = [areas[i] for i in tree.query(line)]
            inside = sum(1 for p in pts[::3] if any(h.contains(Point(p)) for h in hits))
            if hits and inside >= 0.5 * len(pts[::3]):
                a = max(hits, key=lambda h: h.intersection(line).length)
                width = max(8.0, min(250.0, 2 * a.area / max(a.length, 1)))
        zs = g.z_cm([p[0] for p in pts], [p[1] for p in pts])
        zs = np.minimum.accumulate(zs)                       # NHD flowlines run downstream: water never climbs
        item = {"name": fl.get("name"), "ftype": fl.get("ftype"), "pts": ue_path(pts, zs, dz=10.0)}
        if width:
            item["width_m"] = round(width, 1)
            rivers.append(item)
        else:
            item["width_m"] = 6.0 if fl.get("name") else 2.5
            creeks.append(item)
    for wb in w["waterbodies"]:
        if len(wb["pts"]) < 4:
            continue
        poly = Polygon(wb["pts"]).buffer(0)
        if poly.area < 800 or poly.geom_type != "Polygon":
            continue
        ring = list(poly.simplify(3.0).exterior.coords)[:-1]
        ring = [p for p in ring if fr.inside(*p)]
        if len(ring) < 3:
            continue
        shore = g.z_cm([p[0] for p in ring], [p[1] for p in ring])
        surface = float(np.percentile(shore, 20))              # hydro-flattened lake surface
        lakes.append({"name": wb.get("name"), "ftype": wb.get("ftype"), "area_m2": round(poly.area),
                      "marsh": wb.get("ftype") == 466, "surface_z_cm": round(surface, 1),
                      "pts": [[*ue_xy(x, y), round(surface, 1)] for x, y in ring]})
    with open(os.path.join(ue_dir, "water.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "rivers": rivers, "creeks": creeks, "lakes": lakes}, f)
    return {"rivers": len(rivers), "creeks": len(creeks), "lakes": len(lakes)}


def export_bridges(fr, g, out_dir, ue_dir):
    from scipy.spatial import cKDTree
    b = load(out_dir, "bridges_nbi_local.json")
    nbi = {x["id"]: x for x in b["bridges"]}
    decks, points = [], []
    for d in b.get("osm_decks", []):
        p0, p1 = d["pts"][0], d["pts"][-1]
        z = g.z_cm([p0[0], p1[0]], [p0[1], p1[1]])
        rec = nbi.get(d.get("nbi")) or {}
        decks.append({"osm_id": d["osm_id"], "nbi_id": d.get("nbi"), "highway": d["highway"], "name": d["name"],
                      "length_m": rec.get("length_m") or d["length_m"],
                      "deck_width_m": rec.get("deck_width_m") or rec.get("roadway_width_m") or 8.0,
                      "material": rec.get("material"), "design": rec.get("design"), "year_built": rec.get("year_built"),
                      "spans": rec.get("spans"), "start": [*ue_xy(*p0), round(float(z[0]), 1)],
                      "end": [*ue_xy(*p1), round(float(z[1]), 1)]})
    # NBI structures with no OSM deck: culverts and short spans, oriented along the nearest road
    osm = load(out_dir, "osm_local.json")
    segs = []
    for r in osm["layers"]["roads"]:
        if ROAD_CLASS.get(r["tags"].get("highway", "")):
            segs += [(p, q) for p, q in zip(r["pts"][:-1], r["pts"][1:])]
    mids = np.array([[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] for p, q in segs]) if segs else np.zeros((1, 2))
    kd = cKDTree(mids)
    for x in b["bridges"]:
        if x.get("osm_decks"):
            continue
        _, i = kd.query([x["x"], x["y"]])
        p, q = segs[i] if segs else ([0, 0], [1, 0])
        yaw_math = math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
        culvert = "culvert" in (x.get("design") or "") or (x.get("length_m") or 0) < 6
        points.append({"nbi_id": x["id"], "kind": "culvert" if culvert else "short_bridge",
                       "length_m": x.get("length_m"), "deck_width_m": x.get("deck_width_m") or x.get("roadway_width_m"),
                       "material": x.get("material"), "design": x.get("design"), "year_built": x.get("year_built"),
                       "location": [*ue_xy(x["x"], x["y"]), round(float(g.z_cm(x["x"], x["y"])[0]), 1)],
                       "yaw_deg": round(-yaw_math, 2)})
    with open(os.path.join(ue_dir, "bridges.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "decks": decks, "structures": points}, f)
    return {"bridge_decks": len(decks), "culverts_and_short_spans": len(points)}


def export_buildings(fr, g, out_dir, ue_dir):
    from shapely.geometry import Polygon
    b = load(out_dir, "buildings_ms_local.json")
    out = []
    for i, bl in enumerate(b["buildings"]):
        if len(bl["pts"]) < 4:
            continue
        poly = Polygon(bl["pts"]).buffer(0)
        if poly.area < 8 or poly.geom_type != "Polygon":
            continue
        rect = list(poly.minimum_rotated_rectangle.exterior.coords)[:4]
        e1 = np.subtract(rect[1], rect[0]); e2 = np.subtract(rect[2], rect[1])
        L, W = float(np.hypot(*e1)), float(np.hypot(*e2))
        major = e1 if L >= W else e2
        L, W = max(L, W), min(L, W)
        yaw_math = math.degrees(math.atan2(major[1], major[0]))
        cx, cy = poly.centroid.x, poly.centroid.y
        if not fr.inside(cx, cy):
            continue
        ring = list(poly.exterior.coords)[:-1]
        base = float(np.min(g.z_cm([p[0] for p in ring], [p[1] for p in ring])))   # never float above sloped ground
        h = bl.get("height_m")
        guessed = h is None or h < 2.5
        if guessed:
            h = 3.0 if poly.area < 60 else 5.5            # shed vs. 1.5-storey house/barn fallback
        out.append({"i": i, "center": [*ue_xy(cx, cy), round(base, 1)], "yaw_deg": round(-yaw_math, 2),
                    "length_m": round(L, 2), "width_m": round(W, 2), "height_m": round(min(h, 40.0), 2),
                    "height_guessed": guessed, "area_m2": round(poly.area, 1),
                    "footprint": [list(ue_xy(x, y)) for x, y in ring]})
    with open(os.path.join(ue_dir, "buildings.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "buildings": out}, f)
    return {"buildings": len(out), "height_guessed": sum(1 for x in out if x["height_guessed"])}


def export_trees(fr, g, out_dir, ue_dir):
    rows = []
    for p in sorted(glob.glob(os.path.join(out_dir, "lidar_objects_*.json"))):
        with open(p) as f:
            for x, y, h, r in json.load(f)["trees_xyhr"]:
                if fr.inside(x, y):
                    rows.append((x, y, h, r))
    path = os.path.join(ue_dir, "trees.csv")
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Name", "X", "Y", "Z", "HeightM", "CrownRadiusM"])   # DataTable row struct S_TreePoint
        if rows:
            zs = g.z_cm([r[0] for r in rows], [r[1] for r in rows])
            for k, ((x, y, h, r), z) in enumerate(zip(rows, zs)):
                w.writerow([f"T{k}", *ue_xy(x, y), round(float(z), 1), h, r])
    return {"lidar_trees": len(rows), "note": "0 means no lidar tiles processed yet; PCG + NLCD fills forests"}


def parse_landmarks(path):
    items, town = [], None
    with open(path) as f:
        for line in f:
            if line.startswith("## "):
                town = line[3:].strip()
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) == 6 and re.match(r"^-?\d+\.\d+$", cells[3]) and re.match(r"^-?\d+\.\d+$", cells[4]):
                items.append({"name": cells[0], "type": cells[1], "why": cells[2], "lat": float(cells[3]),
                              "lon": float(cells[4]), "confidence": cells[5], "area": town})
    return items


def export_landmarks(fr, g, ue_dir, path):
    if not path or not os.path.exists(path):
        return {"landmarks": 0, "note": "landmarks file not found"}
    out, outside = [], []
    for it in parse_landmarks(path):
        x, y = fr.to_local(it["lon"], it["lat"])
        if not fr.inside(x, y):
            outside.append(it["name"])
            continue
        z = float(g.z_cm(x, y)[0])
        out.append({k: it[k] for k in ("name", "type", "why", "confidence", "area")} | {"location": [*ue_xy(x, y), round(z, 1)]})
    with open(os.path.join(ue_dir, "landmarks.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "landmarks": out}, f, indent=1)
    return {"landmarks": len(out), "outside_map": outside,
            "needs_aerial_pin": sum(1 for x in out if x["confidence"] != "verified")}


def run(fr, out_dir, landmarks_path=None, png=False):
    ue_dir = os.path.join(out_dir, "ue")
    os.makedirs(ue_dir, exist_ok=True)
    g = Ground(fr, out_dir)
    report = {}
    report.update(export_landscape(fr, g, ue_dir, png))
    report.update(export_roads(fr, g, out_dir, ue_dir))
    report.update(export_water(fr, g, out_dir, ue_dir))
    report.update(export_bridges(fr, g, out_dir, ue_dir))
    report.update(export_buildings(fr, g, out_dir, ue_dir))
    report.update(export_trees(fr, g, out_dir, ue_dir))
    report.update(export_landmarks(fr, g, ue_dir, landmarks_path))
    with open(os.path.join(ue_dir, "export_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    return report
