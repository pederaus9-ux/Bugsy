#!/usr/bin/env python3
"""STORMCHASER real-world map builder (TDD §8.3).

Turns a real-world center point into Unreal-ready map data:
  init     write location.local.json (git-ignored; never commit it)
  dem      USGS 3DEP bare-earth DEM -> 8129x8129 .r16 heightmap + manifest + preview
  osm      OpenStreetMap roads/buildings/water/power/landuse -> local-meter JSON
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

LANDSCAPE_PX = 8129          # 32x32 components, 2x2 sections, 127 quads (UE recommended size)
DEFAULT_RES_M = 2.0          # 8128 quads * 2 m = 16.256 km
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
    """Local metric frame: UTM zone of the center, origin at the center."""

    def __init__(self, loc):
        self.lat, self.lon = loc["center_lat"], loc["center_lon"]
        self.res = loc.get("res_m", DEFAULT_RES_M)
        self.zone = int((self.lon + 180) // 6) + 1
        self.epsg = (32600 if self.lat >= 0 else 32700) + self.zone
        self.fwd = Transformer.from_crs(4326, self.epsg, always_xy=True)
        self.inv = Transformer.from_crs(self.epsg, 4326, always_xy=True)
        self.cx, self.cy = self.fwd.transform(self.lon, self.lat)
        self.half = (LANDSCAPE_PX - 1) * self.res / 2.0

    def to_local(self, lon, lat):
        x, y = self.fwd.transform(lon, lat)
        return x - self.cx, y - self.cy

    def bbox_lonlat(self, margin_m=0.0):
        h = self.half + margin_m
        pts = [self.inv.transform(self.cx + sx * h, self.cy + sy * h) for sx in (-1, 1) for sy in (-1, 1)]
        lons, lats = zip(*pts)
        return min(lats), min(lons), max(lats), max(lons)


# ---------------------------------------------------------------- init
def cmd_init(a):
    loc = {"center_lat": a.lat, "center_lon": a.lon, "res_m": a.res}
    with open(LOCATION, "w") as f:
        json.dump(loc, f, indent=2)
    fr = Frame(loc)
    print(f"wrote {LOCATION}  (UTM zone {fr.zone}, EPSG:{fr.epsg}, map {2 * fr.half / 1000:.3f} km square)")


# ---------------------------------------------------------------- DEM
def fetch_dem(fr):
    os.makedirs(CACHE, exist_ok=True)
    n = LANDSCAPE_PX
    dem = np.full((n, n), np.nan, dtype=np.float32)      # row 0 = north edge
    x0, y1 = fr.cx - fr.half, fr.cy + fr.half
    tiles = (n - 1) // DEM_TILE_QUADS
    for ty in range(tiles):
        for tx in range(tiles):
            i0, j0 = tx * DEM_TILE_QUADS, ty * DEM_TILE_QUADS
            size = DEM_TILE_QUADS + 1
            # pixel centers land exactly on landscape vertices
            xmin = x0 + i0 * fr.res - fr.res / 2
            ymax = y1 - j0 * fr.res + fr.res / 2
            xmax, ymin = xmin + size * fr.res, ymax - size * fr.res
            path = os.path.join(CACHE, f"dem_{fr.res:g}m_{tx}_{ty}.tif")
            if not os.path.exists(path):
                print(f"  DEM tile {tx},{ty} ...")
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
            dem[j0:j0 + size, i0:i0 + size] = t
    if np.isnan(dem).any():
        bad = np.isnan(dem)
        print(f"  filling {bad.sum()} nodata px with the median elevation")
        dem[bad] = np.nanmedian(dem)
    return dem


def write_heightmap(fr, dem):
    os.makedirs(OUT, exist_ok=True)
    hmin, hmax = float(dem.min()), float(dem.max())
    mid = (hmin + hmax) / 2
    half_m = (hmax - hmin) / 2 + 20.0                       # 20 m headroom each way for edits
    zscale = half_m * 100 * 128 / 32768                     # UE: height_cm = (v - 32768) * ZScale / 128
    v = np.clip(np.round(32768 + (dem - mid) * 100 * 128 / zscale), 0, 65535).astype("<u2")
    v.tofile(os.path.join(OUT, "heightmap_8129.r16"))

    # quick-look preview: hillshade (sun from NW) blended with elevation tint, 1/8 scale
    small = dem[::8, ::8]
    gy, gx = np.gradient(small, fr.res * 8)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(315), math.radians(45)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    elev = (small - hmin) / max(hmax - hmin, 1)
    rgb = np.stack([0.35 + 0.5 * elev, 0.55 + 0.25 * elev, 0.30 + 0.2 * elev], -1) * np.clip(shade, 0, 1)[..., None]
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, "preview_hillshade.png"))

    manifest = {
        "crs": f"EPSG:{fr.epsg}", "utm_zone": fr.zone,
        "landscape_px": LANDSCAPE_PX, "res_m": fr.res,
        "extent_m": 2 * fr.half,
        "ue_scale": {"x": fr.res * 100, "y": fr.res * 100, "z": round(zscale, 4)},
        "ue_location_z_cm": round((mid - hmin) * 100, 1),     # lowest real point sits at Z = 0
        "elev_min_m": round(hmin, 2), "elev_max_m": round(hmax, 2),
        "relief_m": round(hmax - hmin, 2),
        "source": "USGS 3DEP bare-earth DEM (public domain)",
        "note": "Local frame only. Absolute center lives in location.local.json.",
    }
    with open(os.path.join(OUT, "map_manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    return manifest


def cmd_dem(a):
    fr = Frame(load_location())
    m = write_heightmap(fr, fetch_dem(fr))
    print(json.dumps(m, indent=2))


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
        return abs(x) <= fr.half and abs(y) <= fr.half

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


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init"); p.add_argument("--lat", type=float, required=True)
    p.add_argument("--lon", type=float, required=True); p.add_argument("--res", type=float, default=DEFAULT_RES_M)
    sub.add_parser("dem"); sub.add_parser("osm")
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
        cmd_dem(a); cmd_osm(a); cmd_climate(a)
    else:
        {"init": cmd_init, "dem": cmd_dem, "osm": cmd_osm, "climate": cmd_climate, "lidar": cmd_lidar}[a.cmd](a)


if __name__ == "__main__":
    main()
