#!/usr/bin/env python3
"""STORMCHASER real-world map builder (TDD §8.3).

Turns a real-world center point into Unreal-ready map data:
  init     write location.local.json (git-ignored; never commit it)
  dem      USGS 3DEP bare-earth DEM -> tiled 4065px .r16 landscape heightmaps + manifest + preview
  osm      OpenStreetMap roads/buildings/water/power/landuse -> local-meter JSON
  water    USGS NHD flowlines, waterbodies and river areas -> local-meter JSON
  bridges  FHWA National Bridge Inventory (BTS NTAD) -> bridge points with length, width, spans, type
  buildings Microsoft Global ML Building Footprints -> footprints with height estimates
  ue_export Unreal-ready roads/water/bridges/buildings/trees/landmarks in cm, snapped to the heightmap
  preview  composite map image: terrain, water, buildings, roads, bridges, towns
  climate  SPC tornado database -> local climatology for DA_Climate calibration
  lidar    3DEP lidar point cloud -> every tree (x, y, height, crown) + building (footprint, height, roof) per tile
  all      dem + osm + climate

All outputs go to out/ (git-ignored). Coordinates in outputs are local meters
relative to the map center, UTM-projected, +X east, +Y north.
Unreal is +X forward/+Y right; the Editor import script flips Y.

Requires: numpy pyproj tifffile pillow (+ scipy, laspy[lazrs] for lidar)
"""
import argparse
import csv
import io
import json
import math
import os
import sys
import time
import urllib.parse
import urllib.request

import numpy as np
import tifffile
from PIL import Image
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
LOCATION = os.path.join(HERE, "location.local.json")
OUT = os.path.join(HERE, "out")
CACHE = os.path.join(HERE, "cache")
UA = "stormchaser-mapbuilder/0.1"

TILE_QUADS = 4064            # default landscape tile: 16x16 components of 2x2 sections of 127 quads (4065 px)
                             # --tile-quads 8128 gives 32x32 components -> 8129 px, Epic's largest listed size
DEFAULT_RES_M = 2.0          # 4064 quads * 2 m = 8.128 km per landscape tile
DEFAULT_TILES = (6, 6)       # 6x6 tiles = 48.77 km square
DEM_URL = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage"
DEM_TILE_QUADS = 2032        # 4x4 tiles of 2033 px (server returns 500 above ~2000 px)
OVERPASS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]
SPC_CSV = "https://www.spc.noaa.gov/wcm/data/1950-2025_actual_tornadoes.csv"


# ---------------------------------------------------------------- helpers
def http_get(url, data=None, timeout=180, retries=4):
    body = urllib.parse.urlencode(data).encode() if data else None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:  # network flake: back off 2s, 4s, 8s
            if attempt == retries - 1:
                raise
            print(f"  retry {attempt + 1} ({e})", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))


def load_location():
    if not os.path.exists(LOCATION):
        sys.exit("location.local.json missing: run `mapbuilder.py init --lat .. --lon ..` first")
    with open(LOCATION) as f:
        return json.load(f)


class Frame:
    """Local metric frame: UTM zone of the map center, origin at the map center.

    The map is tiles_x * tiles_y landscape tiles of TILE_QUADS quads at res_m.
    """

    def __init__(self, loc):
        self.lat, self.lon = loc["center_lat"], loc["center_lon"]
        self.res = loc.get("res_m", DEFAULT_RES_M)
        self.tiles_x, self.tiles_y = loc.get("tiles", [2, 2])
        self.tile_quads = loc.get("tile_quads", TILE_QUADS)
        self.zone = int((self.lon + 180) // 6) + 1
        self.epsg = (32600 if self.lat >= 0 else 32700) + self.zone
        self.fwd = Transformer.from_crs(4326, self.epsg, always_xy=True)
        self.inv = Transformer.from_crs(self.epsg, 4326, always_xy=True)
        self.cx, self.cy = self.fwd.transform(self.lon, self.lat)
        self.nx = self.tiles_x * self.tile_quads + 1     # vertices across the whole map
        self.ny = self.tiles_y * self.tile_quads + 1
        self.half_x = (self.nx - 1) * self.res / 2.0
        self.half_y = (self.ny - 1) * self.res / 2.0

    def to_local(self, lon, lat):
        x, y = self.fwd.transform(lon, lat)
        return x - self.cx, y - self.cy

    def inside(self, x, y):
        return abs(x) <= self.half_x and abs(y) <= self.half_y

    def bbox_lonlat(self, margin_m=0.0):
        hx, hy = self.half_x + margin_m, self.half_y + margin_m
        pts = [self.inv.transform(self.cx + sx * hx, self.cy + sy * hy) for sx in (-1, 1) for sy in (-1, 1)]
        lons, lats = zip(*pts)
        return min(lats), min(lons), max(lats), max(lons)


# ---------------------------------------------------------------- init
def cmd_init(a):
    if a.tile_quads % DEM_TILE_QUADS:
        sys.exit(f"--tile-quads must be a multiple of {DEM_TILE_QUADS}")
    loc = {"center_lat": a.lat, "center_lon": a.lon, "res_m": a.res, "tiles": [a.tiles_x, a.tiles_y],
           "tile_quads": a.tile_quads}
    if a.shift_east_m or a.shift_north_m:         # move the map center off the given point (e.g. to take in towns)
        fr0 = Frame(loc)
        loc["center_lon"], loc["center_lat"] = fr0.inv.transform(fr0.cx + a.shift_east_m, fr0.cy + a.shift_north_m)
    with open(LOCATION, "w") as f:
        json.dump(loc, f, indent=2)
    fr = Frame(loc)
    print(f"wrote {LOCATION}  (UTM zone {fr.zone}, EPSG:{fr.epsg}, map {2 * fr.half_x / 1000:.2f} x "
          f"{2 * fr.half_y / 1000:.2f} km, {fr.tiles_x}x{fr.tiles_y} landscape tiles)")


# ---------------------------------------------------------------- DEM
def dem_request(fr, rx, ry):
    """One cached DEM request tile (DEM_TILE_QUADS+1 px) whose pixel centers sit on landscape vertices.
    rx, ry index request tiles from the north-west corner."""
    os.makedirs(CACHE, exist_ok=True)
    size = DEM_TILE_QUADS + 1
    i0, j0 = rx * DEM_TILE_QUADS, ry * DEM_TILE_QUADS
    xmin = fr.cx - fr.half_x + i0 * fr.res - fr.res / 2
    ymax = fr.cy + fr.half_y - j0 * fr.res + fr.res / 2
    xmax, ymin = xmin + size * fr.res, ymax - size * fr.res
    path = os.path.join(CACHE, f"dem_{fr.res:g}m_{int(xmin)}_{int(ymax)}.tif")
    if not os.path.exists(path):
        raw = http_get(DEM_URL, {
            "bbox": f"{xmin},{ymin},{xmax},{ymax}", "bboxSR": fr.epsg, "imageSR": fr.epsg,
            "size": f"{size},{size}", "format": "tiff", "pixelType": "F32",
            "noData": "-9999", "interpolation": "RSP_BilinearInterpolation", "f": "image",
        })
        if raw[:2] not in (b"II", b"MM"):
            sys.exit(f"DEM service returned non-TIFF: {raw[:200]!r}")
        with open(path, "wb") as f:
            f.write(raw)
    t = tifffile.imread(path).astype(np.float32)
    t[t < -1000] = np.nan
    return t


def landscape_tile(fr, tx, ty):
    """Heights (m) for landscape tile (tx, ty) from the north-west: (tile_quads+1)^2 px, edges shared with neighbours."""
    k = fr.tile_quads // DEM_TILE_QUADS
    out = np.empty((fr.tile_quads + 1, fr.tile_quads + 1), np.float32)
    for dy in range(k):
        for dx in range(k):
            t = dem_request(fr, tx * k + dx, ty * k + dy)
            out[dy * DEM_TILE_QUADS:(dy + 1) * DEM_TILE_QUADS + 1, dx * DEM_TILE_QUADS:(dx + 1) * DEM_TILE_QUADS + 1] = t
    return out


def cmd_dem(a):
    fr = Frame(load_location())
    os.makedirs(OUT, exist_ok=True)
    ntiles = fr.tiles_x * fr.tiles_y
    # pass 1: fetch everything and find the global range (one Z scale for every tile)
    hmin, hmax, filled = np.inf, -np.inf, 0
    for ty in range(fr.tiles_y):
        for tx in range(fr.tiles_x):
            print(f"  fetch tile x{tx}_y{ty} ({ty * fr.tiles_x + tx + 1}/{ntiles})")
            t = landscape_tile(fr, tx, ty)
            hmin, hmax = min(hmin, float(np.nanmin(t))), max(hmax, float(np.nanmax(t)))
    mid = (hmin + hmax) / 2
    half_m = (hmax - hmin) / 2 + 20.0                       # 20 m headroom each way for edits
    zscale = half_m * 100 * 128 / 32768                     # UE: height_cm = (v - 32768) * ZScale / 128
    # pass 2: encode tiles (UE tiled-import naming _x#_y#; y counts from the north edge)
    step = 16
    prev_rows = []
    for ty in range(fr.tiles_y):
        row_imgs = []
        for tx in range(fr.tiles_x):
            t = landscape_tile(fr, tx, ty)
            bad = np.isnan(t)
            if bad.any():
                filled += int(bad.sum())
                t[bad] = mid
            v = np.clip(np.round(32768 + (t - mid) * 100 * 128 / zscale), 0, 65535).astype("<u2")
            v.tofile(os.path.join(OUT, f"heightmap_x{tx}_y{ty}.r16"))
            row_imgs.append(t[:-1:step, :-1:step])
        prev_rows.append(np.concatenate(row_imgs, 1))
    small = np.concatenate(prev_rows, 0)
    if filled:
        print(f"  filled {filled} nodata px with the mid elevation")

    # preview: hillshade (sun from NW) with elevation tint
    gy, gx = np.gradient(small, fr.res * step)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(45)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    elev = (small - hmin) / max(hmax - hmin, 1)
    rgb = np.stack([0.35 + 0.5 * elev, 0.55 + 0.25 * elev, 0.30 + 0.2 * elev], -1) * np.clip(shade, 0, 1)[..., None]
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "preview_hillshade.png"))

    manifest = {
        "crs": f"EPSG:{fr.epsg}", "utm_zone": fr.zone,
        "tiles": [fr.tiles_x, fr.tiles_y], "tile_px": fr.tile_quads + 1, "res_m": fr.res,
        "tile_files": "heightmap_x{tx}_y{ty}.r16 (uint16 LE, y from the north edge, edge rows shared)",
        "extent_m": [2 * fr.half_x, 2 * fr.half_y],
        "ue_scale": {"x": fr.res * 100, "y": fr.res * 100, "z": round(zscale, 4)},
        "ue_location_z_cm": round((mid - hmin) * 100, 1),     # lowest real point sits at Z = 0
        "elev_min_m": round(hmin, 2), "elev_max_m": round(hmax, 2), "relief_m": round(hmax - hmin, 2),
        "source": "USGS 3DEP bare-earth DEM (public domain)",
        "note": "Local frame only. Absolute center lives in location.local.json.",
    }
    with open(os.path.join(OUT, "map_manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    print(json.dumps(manifest, indent=2))


# ---------------------------------------------------------------- OSM
OSM_QUERY = """
[out:json][timeout:180];
(
  way["highway"]({b});
  way["building"]({b});
  way["waterway"]({b});
  way["natural"~"water|wood|wetland"]({b});
  way["landuse"]({b});
  way["power"~"line|minor_line"]({b});
  node["power"~"tower|pole"]({b});
  way["railway"]({b});
  node["place"]({b});
  node["amenity"]({b});
);
out tags geom;
"""


def cmd_osm(a):
    fr = Frame(load_location())
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    s, w, n, e = fr.bbox_lonlat()
    q = OSM_QUERY.replace("{b}", f"{s},{w},{n},{e}")
    raw_path = os.path.join(CACHE, "osm_raw.json")
    if not os.path.exists(raw_path):
        last = None
        for url in OVERPASS:
            try:
                print(f"  Overpass: {url}")
                raw = http_get(url, {"data": q}, timeout=240, retries=2)
                json.loads(raw)
                with open(raw_path, "wb") as f:
                    f.write(raw)
                break
            except Exception as ex:
                last = ex
        else:
            sys.exit(f"all Overpass mirrors failed: {last}")
    with open(raw_path) as f:
        els = json.load(f)["elements"]

    def keep(x, y):
        return fr.inside(x, y)

    layers = {k: [] for k in ("roads", "buildings", "water", "landuse", "power_lines", "power_poles", "rail", "places")}
    for el in els:
        t = el.get("tags", {})
        if el["type"] == "node":
            x, y = fr.to_local(el["lon"], el["lat"])
            if not keep(x, y):
                continue
            item = {"x": round(x, 2), "y": round(y, 2), "tags": t}
            if t.get("power") in ("tower", "pole"):
                layers["power_poles"].append(item)
            elif "place" in t:
                layers["places"].append(item)
            continue
        pts = [fr.to_local(p["lon"], p["lat"]) for p in el.get("geometry", [])]
        if not pts or not any(keep(x, y) for x, y in pts):
            continue
        item = {"id": el["id"], "tags": t, "pts": [[round(x, 2), round(y, 2)] for x, y in pts]}
        if "highway" in t:
            layers["roads"].append(item)
        elif "building" in t:
            layers["buildings"].append(item)
        elif "waterway" in t or t.get("natural") in ("water", "wetland"):
            layers["water"].append(item)
        elif t.get("power") in ("line", "minor_line"):
            layers["power_lines"].append(item)
        elif "railway" in t:
            layers["rail"].append(item)
        elif "landuse" in t or t.get("natural") == "wood":
            layers["landuse"].append(item)

    with open(os.path.join(OUT, "osm_local.json"), "w") as f:
        json.dump({"frame": "local meters, +X east, +Y north", "licence": "ODbL, (c) OpenStreetMap contributors",
                   "layers": layers}, f)

    def length(it):
        p = it["pts"]
        return sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))

    by_surface = {}
    for r in layers["roads"]:
        s_ = r["tags"].get("surface", "unknown")
        by_surface[s_] = by_surface.get(s_, 0) + length(r)
    summary = {k: len(v) for k, v in layers.items()}
    summary["road_km_by_surface"] = {k: round(v / 1000, 1) for k, v in sorted(by_surface.items(), key=lambda kv: -kv[1])}
    summary["places"] = sorted({p["tags"].get("name", "?") for p in layers["places"]})
    with open(os.path.join(OUT, "osm_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(json.dumps(summary, indent=2))


# ---------------------------------------------------------------- climate
def cmd_climate(a):
    loc = load_location()
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(CACHE, "spc_tornadoes.csv")
    if not os.path.exists(path):
        print("  downloading SPC tornado database ...")
        with open(path, "wb") as f:
            f.write(http_get(SPC_CSV, timeout=300))
    lat0, lon0, R = loc["center_lat"], loc["center_lon"], a.radius_km

    def hav(la1, lo1, la2, lo2):
        p1, p2 = math.radians(la1), math.radians(la2)
        d = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lo2 - lo1) / 2) ** 2
        return 6371.0 * 2 * math.asin(math.sqrt(d))

    rows = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            try:
                slat, slon = float(r["slat"]), float(r["slon"])
                elat, elon = float(r["elat"]), float(r["elon"])
            except (KeyError, ValueError):
                continue
            if elat == 0 or elon == 0:
                elat, elon = slat, slon
            if hav(lat0, lon0, slat, slon) <= R or hav(lat0, lon0, elat, elon) <= R:
                rows.append((r, slat, slon, elat, elon))

    years = sorted({int(r["yr"]) for r, *_ in rows})
    span = (max(years) - min(years) + 1) if years else 1
    ef, month, bearings, lengths, widths = {}, [0] * 12, [], [], []
    for r, slat, slon, elat, elon in rows:
        m = int(r["mag"]) if r["mag"] not in ("", "-9") else -9
        ef[m] = ef.get(m, 0) + 1
        month[int(r["mo"]) - 1] += 1
        lengths.append(float(r["len"]) * 1.609)
        widths.append(float(r["wid"]) * 0.9144)
        if (elat, elon) != (slat, slon):
            dy = elat - slat
            dx = (elon - slon) * math.cos(math.radians(slat))
            bearings.append((math.degrees(math.atan2(dx, dy)) + 360) % 360)
    n = len(rows)
    mb = None
    if bearings:
        sx = sum(math.sin(math.radians(b)) for b in bearings)
        cx = sum(math.cos(math.radians(b)) for b in bearings)
        mb = round((math.degrees(math.atan2(sx, cx)) + 360) % 360, 1)
    med = lambda v: round(float(np.median(v)), 2) if v else None
    out = {
        "radius_km": R, "years": [min(years), max(years)] if years else None, "count": n,
        "per_year": round(n / span, 2),
        "ef_share": {("unknown" if k == -9 else f"EF{k}"): round(v / n, 3) for k, v in sorted(ef.items())} if n else {},
        "month_share": {m_: round(c / n, 3) for m_, c in zip(
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], month)} if n else {},
        "mean_motion_bearing_deg": mb,
        "median_path_km": med(lengths), "p90_path_km": round(float(np.percentile(lengths, 90)), 2) if lengths else None,
        "median_width_m": med(widths), "max_width_m": round(max(widths), 1) if widths else None,
        "source": "NOAA/NWS Storm Prediction Center tornado database (public domain)",
    }
    with open(os.path.join(OUT, "climate_calibration.json"), "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out, indent=2))


# ---------------------------------------------------------------- ArcGIS REST helper
def arcgis_query(url, fr, out_fields, where="1=1"):
    """All features of an ArcGIS layer intersecting the map, geometry in WGS84 (esri JSON)."""
    s_, w, n, e = fr.bbox_lonlat()
    feats, offset = [], 0
    while True:
        d = json.loads(http_get(url + "/query", {
            "where": where, "geometry": f"{w},{s_},{e},{n}", "geometryType": "esriGeometryEnvelope",
            "inSR": 4326, "spatialRel": "esriSpatialRelIntersects", "outFields": out_fields,
            "outSR": 4326, "returnGeometry": "true", "resultOffset": offset, "resultRecordCount": 1000, "f": "json",
        }, timeout=300))
        if "error" in d:
            sys.exit(f"ArcGIS error from {url}: {d['error']}")
        batch = d.get("features", [])
        feats += batch
        offset += len(batch)
        if not batch or not d.get("exceededTransferLimit"):
            return feats


def local_path(fr, coords):
    return [[round(v, 2) for v in fr.to_local(lon, lat)] for lon, lat in coords]


# ---------------------------------------------------------------- water (USGS NHD)
NHD = "https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer"


def cmd_water(a):
    fr = Frame(load_location())
    os.makedirs(OUT, exist_ok=True)
    out = {"frame": "local meters, +X east, +Y north", "source": "USGS NHD large scale (public domain)",
           "flowlines": [], "waterbodies": [], "areas": []}
    for layer, key, geom in ((6, "flowlines", "paths"), (12, "waterbodies", "rings"), (9, "areas", "rings")):
        feats = arcgis_query(f"{NHD}/{layer}", fr, "gnis_name,ftype,fcode")
        for f_ in feats:
            at = {k.lower(): v for k, v in f_["attributes"].items()}
            for part in f_.get("geometry", {}).get(geom, []):
                pts = local_path(fr, part)
                if any(fr.inside(x, y) for x, y in pts):
                    out[key].append({"name": at.get("gnis_name"), "ftype": at.get("ftype"), "fcode": at.get("fcode"), "pts": pts})
        print(f"  NHD {key}: {len(out[key])}")
    with open(os.path.join(OUT, "water_nhd_local.json"), "w") as f:
        json.dump(out, f)
    km = sum(math.dist(p[i], p[i + 1]) for fl in out["flowlines"] for p in [fl["pts"]] for i in range(len(p) - 1)) / 1000
    names = sorted({fl["name"] for fl in out["flowlines"] if fl["name"]})
    print(json.dumps({"flowline_km": round(km, 1), "waterbodies": len(out["waterbodies"]),
                      "areas": len(out["areas"]), "named_streams": len(names)}, indent=2))


# ---------------------------------------------------------------- bridges (FHWA NBI via BTS NTAD)
NBI = "https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_National_Bridge_Inventory/FeatureServer/0"
NBI_FIELDS = ("STRUCTURE_NUMBER_008,FACILITY_CARRIED_007,FEATURES_DESC_006A,YEAR_BUILT_027,STRUCTURE_KIND_043A,"
              "STRUCTURE_TYPE_043B,MAIN_UNIT_SPANS_045,MAX_SPAN_LEN_MT_048,STRUCTURE_LEN_MT_049,DECK_WIDTH_MT_052,"
              "ROADWAY_WIDTH_MT_051,TRAFFIC_LANES_ON_028A,SERVICE_UND_042B,LATDD,LONGDD")
NBI_KIND = {"1": "concrete", "2": "concrete continuous", "3": "steel", "4": "steel continuous", "5": "prestressed concrete",
            "6": "prestressed concrete continuous", "7": "wood/timber", "8": "masonry", "9": "aluminum/iron", "0": "other"}
NBI_TYPE = {"01": "slab", "02": "stringer/girder", "03": "girder-floorbeam", "04": "tee beam", "05": "box beam multiple",
            "06": "box beam single", "07": "frame", "09": "deck truss", "10": "thru truss", "11": "deck arch",
            "12": "thru arch", "19": "culvert", "22": "channel beam", "00": "other"}


def cmd_bridges(a):
    fr = Frame(load_location())
    os.makedirs(OUT, exist_ok=True)
    bridges = []
    for f_ in arcgis_query(NBI, fr, NBI_FIELDS):
        at, g = f_["attributes"], f_.get("geometry") or {}
        lon, lat = g.get("x", at.get("LONGDD")), g.get("y", at.get("LATDD"))
        if lon is None or lat is None:
            continue
        x, y = fr.to_local(lon, lat)
        if not fr.inside(x, y):
            continue
        kind, typ = str(at.get("STRUCTURE_KIND_043A") or "0"), str(at.get("STRUCTURE_TYPE_043B") or "00").zfill(2)
        bridges.append({
            "x": round(x, 2), "y": round(y, 2), "id": at.get("STRUCTURE_NUMBER_008"),
            "carries": (at.get("FACILITY_CARRIED_007") or "").strip(), "over": (at.get("FEATURES_DESC_006A") or "").strip(),
            "year_built": at.get("YEAR_BUILT_027"), "material": NBI_KIND.get(kind, kind), "design": NBI_TYPE.get(typ, typ),
            "spans": at.get("MAIN_UNIT_SPANS_045"), "max_span_m": at.get("MAX_SPAN_LEN_MT_048"),
            "length_m": at.get("STRUCTURE_LEN_MT_049"), "deck_width_m": at.get("DECK_WIDTH_MT_052"),
            "roadway_width_m": at.get("ROADWAY_WIDTH_MT_051"), "lanes": at.get("TRAFFIC_LANES_ON_028A"),
        })
    # merge: OSM bridge=yes road segments carry the exact deck line; NBI carries dimensions and type
    osm_path = os.path.join(OUT, "osm_local.json")
    decks = []
    if os.path.exists(osm_path) and bridges:
        from scipy.spatial import cKDTree
        tree = cKDTree([[b["x"], b["y"]] for b in bridges])
        with open(osm_path) as f:
            roads = json.load(f)["layers"]["roads"]
        for r in roads:
            if r["tags"].get("bridge") in (None, "no"):
                continue
            pts = r["pts"]
            mx, my = pts[len(pts) // 2]
            dist, i = tree.query([mx, my])
            deck = {"osm_id": r["id"], "highway": r["tags"].get("highway"), "name": r["tags"].get("name"),
                    "ref": r["tags"].get("ref"), "pts": pts,
                    "length_m": round(sum(math.dist(pts[k], pts[k + 1]) for k in range(len(pts) - 1)), 1)}
            if dist <= 60:
                deck["nbi"] = bridges[i]["id"]
                bridges[i].setdefault("osm_decks", []).append(r["id"])
            decks.append(deck)
    with open(os.path.join(OUT, "bridges_nbi_local.json"), "w") as f:
        json.dump({"frame": "local meters, +X east, +Y north",
                   "source": "FHWA National Bridge Inventory 2025 via BTS NTAD (public domain); decks from OSM (ODbL)",
                   "bridges": bridges, "osm_decks": decks}, f, indent=1)
    by = {}
    for b in bridges:
        k = f'{b["material"]} {b["design"]}'
        by[k] = by.get(k, 0) + 1
    print(json.dumps({"bridges": len(bridges), "osm_decks": len(decks),
                      "decks_matched_to_nbi": sum(1 for d_ in decks if "nbi" in d_),
                      "nbi_with_deck": sum(1 for b in bridges if b.get("osm_decks")), "by_type": dict(sorted(by.items(), key=lambda kv: -kv[1])[:10]),
                      "longest_m": max((b["length_m"] or 0 for b in bridges), default=0),
                      "oldest": min((b["year_built"] or 9999 for b in bridges), default=None)}, indent=2))


# ---------------------------------------------------------------- buildings (Microsoft Global ML Building Footprints)
MS_LINKS = "https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv"


def quadkeys(fr, z=9):
    s_, w, n, e = fr.bbox_lonlat()

    def tile(lon, lat):
        x = int((lon + 180) / 360 * 2 ** z)
        r = math.radians(lat)
        y = int((1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** z)
        return x, y

    x0, y0 = tile(w, n)
    x1, y1 = tile(e, s_)
    keys = []
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            q = ""
            for i in range(z, 0, -1):
                m = 1 << (i - 1)
                q += str((1 if x & m else 0) + (2 if y & m else 0))
            keys.append(q)
    return keys


def cmd_buildings(a):
    import gzip
    fr = Frame(load_location())
    os.makedirs(OUT, exist_ok=True); os.makedirs(CACHE, exist_ok=True)
    links_path = os.path.join(CACHE, "ms_dataset_links.csv")
    if not os.path.exists(links_path):
        with open(links_path, "wb") as f:
            f.write(http_get(MS_LINKS, timeout=300))
    want = set(quadkeys(fr))
    urls = []
    with open(links_path, newline="") as f:
        for r in csv.DictReader(f):
            if r["Location"] == "UnitedStates" and r["QuadKey"] in want:
                urls.append(r["Url"])
    print(f"  {len(urls)} footprint tiles for quadkeys {sorted(want)}")
    out, heights = [], 0
    for u in urls:
        path = os.path.join(CACHE, "ms_" + u.split("quadkey=")[1].replace("/", "_"))
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(http_get(u, timeout=600))
        with gzip.open(path, "rt") as f:
            for line in f:
                ft = json.loads(line)
                ring = ft["geometry"]["coordinates"][0]
                lon = sum(p[0] for p in ring) / len(ring); lat = sum(p[1] for p in ring) / len(ring)
                x, y = fr.to_local(lon, lat)
                if not fr.inside(x, y):
                    continue
                h = ft.get("properties", {}).get("height", -1)
                heights += h is not None and h > 0
                out.append({"pts": local_path(fr, ring), "height_m": h,
                            "confidence": ft.get("properties", {}).get("confidence")})
    with open(os.path.join(OUT, "buildings_ms_local.json"), "w") as f:
        json.dump({"frame": "local meters, +X east, +Y north",
                   "source": "Microsoft Global ML Building Footprints (CDLA Permissive 2.0; attribute Microsoft/Bing)",
                   "buildings": out}, f)
    print(json.dumps({"buildings": len(out), "with_height": int(heights)}, indent=2))


# ---------------------------------------------------------------- lidar (trees + buildings)
EPT_BASE = "https://s3-us-west-2.amazonaws.com/usgs-lidar-public/"


def ept_nodes(base, ept, qmin, qmax, max_depth):
    """Yield EPT node keys whose cube intersects the 3857 query box [qmin, qmax] (xy only)."""
    b = ept["bounds"]
    pages = {}

    def page(key):
        if key not in pages:
            pages[key] = json.loads(http_get(f"{base}ept-hierarchy/{key}.json"))
        return pages[key]

    def walk(d, x, y, z, hier):
        key = f"{d}-{x}-{y}-{z}"
        if key not in hier:
            return
        if hier[key] == -1:                       # sub-hierarchy page
            hier = page(key)
        size = (b[3] - b[0]) / 2 ** d
        x0, y0 = b[0] + x * size, b[1] + y * size
        if x0 > qmax[0] or x0 + size < qmin[0] or y0 > qmax[1] or y0 + size < qmin[1]:
            return
        if hier[key] > 0:
            yield key
        if d < max_depth:
            for dx in (0, 1):
                for dy in (0, 1):
                    for dz in (0, 1):
                        yield from walk(d + 1, 2 * x + dx, 2 * y + dy, 2 * z + dz, hier)

    yield from walk(0, 0, 0, 0, page("0-0-0-0"))


def cmd_lidar(a):
    import laspy
    from scipy import ndimage as ndi

    fr = Frame(load_location())
    os.makedirs(OUT, exist_ok=True)
    base = EPT_BASE + a.dataset + "/"
    ept = json.loads(http_get(base + "ept.json"))
    half, cell = a.size_m / 2, a.cell_m
    ox, oy = a.offset_x, a.offset_y                       # tile center, local meters
    n = int(round(a.size_m / cell))
    to3857 = Transformer.from_crs(fr.epsg, 3857, always_xy=True)
    from3857 = Transformer.from_crs(3857, fr.epsg, always_xy=True)
    corners = [to3857.transform(fr.cx + ox + sx * half, fr.cy + oy + sy * half) for sx in (-1, 1) for sy in (-1, 1)]
    qmin = (min(c[0] for c in corners), min(c[1] for c in corners))
    qmax = (max(c[0] for c in corners), max(c[1] for c in corners))

    dsm = np.full((n, n), -np.inf, np.float32)
    gsum = np.zeros((n, n), np.float64); gcnt = np.zeros((n, n), np.int32)
    ocnt = np.zeros((n, n), np.int32); osingle = np.zeros((n, n), np.int32)
    keys = list(ept_nodes(base, ept, qmin, qmax, a.max_depth))
    print(f"  {len(keys)} EPT nodes")
    tile_cache = os.path.join(CACHE, "ept_" + a.dataset)
    os.makedirs(tile_cache, exist_ok=True)
    total = 0
    for i, k in enumerate(keys):
        fp = os.path.join(tile_cache, k + ".laz")
        if not os.path.exists(fp):
            with open(fp, "wb") as f:
                f.write(http_get(f"{base}ept-data/{k}.laz"))
        las = laspy.read(fp)
        cls = np.asarray(las.classification)
        keep = (cls != 7) & (cls != 18)
        if not keep.any():
            continue
        X, Y = from3857.transform(np.asarray(las.x)[keep], np.asarray(las.y)[keep])
        col = ((X - (fr.cx + ox - half)) / cell).astype(np.int64)
        row = (((fr.cy + oy + half) - Y) / cell).astype(np.int64)      # row 0 = north
        inb = (col >= 0) & (col < n) & (row >= 0) & (row < n)
        if not inb.any():
            continue
        col, row = col[inb], row[inb]
        Z = np.asarray(las.z)[keep][inb].astype(np.float32)
        c = cls[keep][inb]
        nr = np.asarray(las.number_of_returns)[keep][inb]
        np.maximum.at(dsm, (row, col), Z)
        g = c == 2
        np.add.at(gsum, (row[g], col[g]), Z[g]); np.add.at(gcnt, (row[g], col[g]), 1)
        o = c == 1
        np.add.at(ocnt, (row[o], col[o]), 1); np.add.at(osingle, (row[o], col[o]), (nr[o] == 1).astype(np.int32))
        total += int(inb.sum())
        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{len(keys)} nodes, {total / 1e6:.1f} M points")
    print(f"  {total / 1e6:.1f} M points in tile")

    # ground model: mean ground return per cell, holes filled from the nearest ground cell
    dtm = np.where(gcnt > 0, gsum / np.maximum(gcnt, 1), np.nan).astype(np.float32)
    idx = ndi.distance_transform_edt(np.isnan(dtm), return_distances=False, return_indices=True)
    dtm = dtm[tuple(idx)]
    dsm = np.where(np.isfinite(dsm), dsm, dtm)
    chm = np.clip(ndi.median_filter(dsm, 3) - dtm, 0, None)

    # buildings: tall, planar, single-return surfaces; trees: rough multi-return canopy
    rough = ndi.generic_filter(dsm, np.std, size=3) if n <= 1200 else np.sqrt(np.clip(
        ndi.uniform_filter(dsm.astype(np.float64) ** 2, 3) - ndi.uniform_filter(dsm.astype(np.float64), 3) ** 2, 0, None))
    single = osingle / np.maximum(ocnt, 1)
    bmask = (chm > 2.5) & (rough < 0.35) & (single > 0.7) & (ocnt >= 1)
    bmask = ndi.binary_closing(ndi.binary_opening(bmask, iterations=2), iterations=2)
    lab, nb = ndi.label(bmask)
    buildings = []
    min_cells = int(a.min_building_m2 / cell ** 2)
    for bi, sl in enumerate(ndi.find_objects(lab), 1):
        m = lab[sl] == bi
        if m.sum() < min_cells:
            continue
        rr, cc = np.nonzero(m)
        xs = (cc + sl[1].start + 0.5) * cell - half + ox
        ys = half - (rr + sl[0].start + 0.5) * cell + oy
        pts = np.stack([xs, ys], 1)
        mu = pts.mean(0)
        w, v = np.linalg.eigh(np.cov((pts - mu).T))
        major = v[:, 1]
        yaw = math.degrees(math.atan2(major[1], major[0]))
        pr = (pts - mu) @ v
        L, W = np.ptp(pr[:, 1]) + cell, np.ptp(pr[:, 0]) + cell
        fill = m.sum() * cell ** 2 / max(L * W, 1e-6)
        if fill < 0.45 or W < 3.0:                    # tree clumps and hedges are ragged and thin
            continue
        hts = chm[sl][m]
        h95, h50, h10 = (float(np.percentile(hts, q)) for q in (95, 50, 10))
        buildings.append({
            "x": round(float(mu[0]), 2), "y": round(float(mu[1]), 2),
            "length_m": round(float(L), 1), "width_m": round(float(W), 1), "yaw_deg": round(yaw, 1),
            "height_m": round(h95, 2), "eave_m": round(h10, 2),
            "roof": "flat" if h95 - h10 < 0.8 else "pitched",
            "ridge_axis": "length" if h95 - h10 >= 0.8 else None,
            "area_m2": round(float(m.sum() * cell ** 2), 1),
        })

    # trees: local maxima of the smoothed canopy outside building footprints (dilated)
    nob = ~ndi.binary_dilation(bmask, iterations=int(2 / cell))
    sm = ndi.gaussian_filter(chm, 1.0)
    win = max(3, int(round(3.0 / cell)) | 1)
    peaks = (sm == ndi.maximum_filter(sm, size=win)) & (sm > a.min_tree_m) & nob
    pr_, pc_ = np.nonzero(peaks)
    trees = []
    if len(pr_):
        from scipy.spatial import cKDTree
        tx = (pc_ + 0.5) * cell - half + ox
        ty = half - (pr_ + 0.5) * cell + oy
        th = chm[pr_, pc_]
        d, _ = cKDTree(np.stack([tx, ty], 1)).query(np.stack([tx, ty], 1), k=2)
        for x, y, h, dn in zip(tx, ty, th, d[:, 1]):
            r = min(0.12 * h + 1.5, max(dn * 0.6, 1.0))    # allometric crown, limited by neighbour spacing
            trees.append([round(float(x), 2), round(float(y), 2), round(float(h), 2), round(float(r), 2)])

    tag = f"{int(ox)}_{int(oy)}_{int(a.size_m)}"
    with open(os.path.join(OUT, f"lidar_objects_{tag}.json"), "w") as f:
        json.dump({"frame": "local meters, +X east, +Y north", "cell_m": cell,
                   "source": f"USGS 3DEP lidar {a.dataset} (public domain)",
                   "buildings": buildings, "trees_xyhr": trees}, f)

    # preview: canopy height, buildings red, tree tops green, 1/2 scale
    step = max(1, n // 2000)
    ch = np.clip(chm[::step, ::step] / 30.0, 0, 1)
    rgb = np.stack([ch * 0.6 + 0.15] * 3, -1)
    bm = bmask[::step, ::step]
    rgb[bm] = [0.85, 0.15, 0.1]
    img = (rgb * 255).astype(np.uint8)
    for x, y, h, r in trees:
        c_ = int(((x - ox + half) / cell) / step); r_ = int(((half - (y - oy)) / cell) / step)
        img[max(r_ - 1, 0):r_ + 2, max(c_ - 1, 0):c_ + 2] = [40, 220, 60]
    Image.fromarray(img).save(os.path.join(OUT, f"lidar_preview_{tag}.png"))
    print(json.dumps({"tile": tag, "buildings": len(buildings), "trees": len(trees),
                      "tallest_tree_m": max((t[2] for t in trees), default=0)}, indent=2))


# ---------------------------------------------------------------- composite preview
def cmd_preview(a):
    from PIL import ImageDraw
    fr = Frame(load_location())
    base = Image.open(os.path.join(OUT, "preview_hillshade.png")).convert("RGB")
    W, H = base.size
    sx, sy = W / (2 * fr.half_x), H / (2 * fr.half_y)
    px = lambda x, y: ((x + fr.half_x) * sx, (fr.half_y - y) * sy)
    d = ImageDraw.Draw(base)

    def load(name):
        path = os.path.join(OUT, name)
        return json.load(open(path)) if os.path.exists(path) else None

    w = load("water_nhd_local.json")
    if w:
        for poly in w["areas"] + w["waterbodies"]:
            if len(poly["pts"]) > 2:
                d.polygon([px(*p) for p in poly["pts"]], fill=(70, 120, 200))
        for fl in w["flowlines"]:
            d.line([px(*p) for p in fl["pts"]], fill=(90, 150, 230), width=1)
    b = load("buildings_ms_local.json")
    if b:
        for bl in b["buildings"]:
            x, y = px(*bl["pts"][0])
            d.point((x, y), fill=(255, 190, 60))
    o = load("osm_local.json")
    if o:
        widths = {"motorway": 4, "trunk": 3, "primary": 3, "secondary": 2, "tertiary": 2}
        for r in o["layers"]["roads"]:
            hw = r["tags"].get("highway", "")
            if hw in ("footway", "path", "cycleway", "steps", "service", "track"):
                continue
            col = (255, 80, 60) if hw.startswith("motorway") else (250, 250, 250) if hw in widths else (200, 200, 200)
            d.line([px(*p) for p in r["pts"]], fill=col, width=widths.get(hw, 1))
    br = load("bridges_nbi_local.json")
    if br:
        for bg in br["bridges"]:
            x, y = px(bg["x"], bg["y"])
            d.rectangle([x - 2, y - 2, x + 2, y + 2], fill=(255, 0, 255))
    if o:
        for pl in o["layers"]["places"]:
            if pl["tags"].get("place") in ("town", "village", "city"):
                x, y = px(pl["x"], pl["y"])
                d.text((x + 4, y - 6), pl["tags"].get("name", ""), fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    base.save(os.path.join(OUT, "preview_map.png"))
    print("wrote", os.path.join(OUT, "preview_map.png"))


# ---------------------------------------------------------------- Unreal export
DEFAULT_LANDMARKS = os.path.join(HERE, "..", "..", "docs", "stormchaser", "private", "pack", "storm-chaser-landmarks.md")


def cmd_ue_export(a):
    import ue_export
    fr = Frame(load_location())
    print(json.dumps(ue_export.run(fr, OUT, a.landmarks, a.png), indent=2))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init"); p.add_argument("--lat", type=float, required=True)
    p.add_argument("--lon", type=float, required=True); p.add_argument("--res", type=float, default=DEFAULT_RES_M)
    p.add_argument("--tiles-x", type=int, default=DEFAULT_TILES[0]); p.add_argument("--tiles-y", type=int, default=DEFAULT_TILES[1])
    p.add_argument("--shift-east-m", type=float, default=0.0); p.add_argument("--shift-north-m", type=float, default=0.0)
    p.add_argument("--tile-quads", type=int, default=TILE_QUADS, help="4064 (4065 px tiles) or 8128 (8129 px tiles)")
    sub.add_parser("dem"); sub.add_parser("osm")
    sub.add_parser("water"); sub.add_parser("bridges"); sub.add_parser("buildings"); sub.add_parser("preview")
    p = sub.add_parser("ue_export", help="write out/ue/*.json for the Unreal importer")
    p.add_argument("--landmarks", default=DEFAULT_LANDMARKS); p.add_argument("--png", action="store_true")
    p = sub.add_parser("climate"); p.add_argument("--radius-km", type=float, default=80.0)
    p = sub.add_parser("lidar", help="trees + buildings from the 3DEP lidar point cloud for one tile")
    p.add_argument("--dataset", default="WI_12County_7_B22")
    p.add_argument("--size-m", type=float, default=2000.0); p.add_argument("--cell-m", type=float, default=0.5)
    p.add_argument("--offset-x", type=float, default=0.0); p.add_argument("--offset-y", type=float, default=0.0)
    p.add_argument("--max-depth", type=int, default=30)
    p.add_argument("--min-tree-m", type=float, default=4.0); p.add_argument("--min-building-m2", type=float, default=15.0)
    p = sub.add_parser("all"); p.add_argument("--radius-km", type=float, default=80.0)
    a = ap.parse_args()
    if a.cmd == "all":
        cmd_dem(a); cmd_osm(a); cmd_water(a); cmd_bridges(a); cmd_buildings(a); cmd_climate(a); cmd_preview(a)
    else:
        {"init": cmd_init, "dem": cmd_dem, "osm": cmd_osm, "climate": cmd_climate, "lidar": cmd_lidar,
         "water": cmd_water, "bridges": cmd_bridges, "buildings": cmd_buildings, "preview": cmd_preview, "ue_export": cmd_ue_export}[a.cmd](a)


if __name__ == "__main__":
    main()
