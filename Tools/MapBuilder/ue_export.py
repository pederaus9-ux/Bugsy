"""Convert MapBuilder layers into the files the Unreal import package reads (TDD §8.3).

Runs outside Unreal (needs numpy, shapely, pillow). The Unreal scripts only read
what is written here, with the Python standard library, so they need no GIS tools.

Unreal frame: 1 uu = 1 cm, +X = east, +Y = south (GIS north flipped), +Z = up.
Every height is sampled from the same heightmap tiles the landscape is imported from.

Output: out/ue/
  manifest.json        geo mapping, landscape settings, chunk + instance index, perf budget report
  landscape.json       landscape import settings per tile
  meshes/*.bin         merged triangle meshes (roads by class, streams, lakes) per 8 km cell
  instances/*.bin      instance transforms (buildings, bridges, trees) per 8 km cell
  playable.json        PlayerStarts snapped onto real roads
  landmarks.json       landmark anchors

Binary formats (little-endian):
  mesh:     uint32 nverts, uint32 ntris, float32[nverts*3] xyz (cm, relative to the chunk pivot), uint32[ntris*3]
  instance: uint32 count, then per instance float32[8] = x, y, bottom_z (cm, world), yaw (deg),
            size_x, size_y, size_z (metres; Unreal scales the chosen mesh from its bounds to this size), pitch (deg)
"""
import json
import math
import os
import re
import struct

import numpy as np

CELL_M = 8000.0                                   # chunk size for merged meshes / instance groups
ROAD_SAMPLE_M = 4.0                               # road cross-section spacing along the road
CARVE_BELOW_CM = 4.0                              # terrain under a road is set this far below the road surface
EXCLUDED_HIGHWAYS = {"footway", "path", "cycleway", "steps", "pedestrian", "bridleway", "construction",
                     "proposed", "corridor", "elevator", "platform", "raceway", "bus_stop", "abandoned"}
EXCLUDED_SERVICE = {"parking_aisle", "drive-through", "emergency_access"}
ROAD_CLASS = {
    "motorway": "Interstate", "motorway_link": "Interstate",
    "trunk": "Highway", "trunk_link": "Highway", "primary": "Highway", "primary_link": "Highway",
    "secondary": "County", "secondary_link": "County", "tertiary": "County", "tertiary_link": "County",
    "unclassified": "Town", "residential": "Town", "living_street": "Town", "road": "Town",
    "service": "Service", "track": "Track",
}
# default width m, speed km/h, surface, lift above terrain cm (higher classes win where ribbons overlap)
CLASS_DEFAULTS = {
    "Interstate": (7.4, 113, "asphalt", 3), "Highway": (8.0, 89, "asphalt", 3), "County": (7.0, 80, "asphalt", 2),
    "Town": (6.0, 56, "gravel", 2), "Service": (3.5, 24, "gravel", 1), "Track": (3.0, 24, "dirt", 1),
}
# budgets for 60 fps on an RTX 5060 Ti class GPU (per loaded area, Nanite on)
BUDGET = {"road_tris_total": 12_000_000, "instances_per_cell": 250_000, "trees_total": 3_000_000,
          "landscape_vertices": 700_000_000}


# ---------------------------------------------------------------- ground sampling
class Ground:
    """Bilinear heights (cm, Unreal Z) from the exported landscape tiles."""

    def __init__(self, fr, out_dir, tile_dir=None):
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
                p = os.path.join(tile_dir or out_dir, f"heightmap_x{tx}_y{ty}.r16")
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

    def grid(self, stride):
        """Whole-map height grid (cm) at res*stride metres, row 0 = north. Used for slope masks."""
        rows = []
        for ty in range(self.fr.tiles_y):
            cols = [np.asarray(self.tiles[(tx, ty)][:-1:stride, :-1:stride], np.float32) for tx in range(self.fr.tiles_x)]
            rows.append(np.concatenate(cols, 1))
        g = np.concatenate(rows, 0)
        return self.z0 + (g - 32768.0) * self.zs / 128.0


# ---------------------------------------------------------------- helpers
def resample(pts, max_seg):
    out = [pts[0]]
    for p, q in zip(pts[:-1], pts[1:]):
        d = math.dist(p, q)
        k = max(1, int(math.ceil(d / max_seg)))
        for i in range(1, k + 1):
            out.append([p[0] + (q[0] - p[0]) * i / k, p[1] + (q[1] - p[1]) * i / k])
    return out


def ue_xy(x, y):
    return x * 100.0, -y * 100.0


def cell_of(fr, x, y):
    return (int(min(max((x + fr.half_x) // CELL_M, 0), (2 * fr.half_x) // CELL_M)),
            int(min(max((fr.half_y - y) // CELL_M, 0), (2 * fr.half_y) // CELL_M)))


def cell_pivot(fr, cx, cy):
    """Chunk pivot in Unreal cm: the cell's north-west corner (min X, min Y)."""
    return ((-fr.half_x + cx * CELL_M) * 100.0, (-fr.half_y + cy * CELL_M) * 100.0)


def parse_speed_kph(tag):
    m = re.match(r"\s*(\d+(?:\.\d+)?)\s*(mph)?", str(tag or ""))
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


class MeshChunks:
    """Accumulates triangles per (layer, class, cell) in Unreal cm, relative to each cell pivot."""

    def __init__(self, fr):
        self.fr, self.data = fr, {}

    def add(self, layer, cls, cell, verts_world, tris):
        key = (layer, cls, cell)
        v, t = self.data.setdefault(key, ([], []))
        px, py = cell_pivot(self.fr, *cell)
        base = len(v)
        for x, y, z in verts_world:
            v.append((x - px, y - py, z))
        t.extend((a + base, b + base, c + base) for a, b, c in tris)

    def write(self, ue_dir, material_of):
        os.makedirs(os.path.join(ue_dir, "meshes"), exist_ok=True)
        index = []
        for (layer, cls, cell), (v, t) in sorted(self.data.items()):
            if not t:
                continue
            name = f"{layer}_{cls}_{cell[0]}_{cell[1]}"
            with open(os.path.join(ue_dir, "meshes", name + ".bin"), "wb") as f:
                f.write(struct.pack("<II", len(v), len(t)))
                f.write(np.asarray(v, "<f4").tobytes())
                f.write(np.asarray(t, "<u4").tobytes())
            px, py = cell_pivot(self.fr, *cell)
            index.append({"name": name, "layer": layer, "class": cls, "cell": list(cell), "pivot_cm": [px, py, 0.0],
                          "verts": len(v), "tris": len(t), "material": material_of(layer, cls)})
        return index


def upward(tri, verts):
    """Winding so that cross(b-a, c-a).z > 0 in Unreal coordinates (materials are two-sided anyway)."""
    a, b, c = (verts[i] for i in tri)
    z = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return tri if z > 0 else (tri[0], tri[2], tri[1])


def cross_sections(pts_xy, half_w, k):
    """k points across the road at every centreline vertex, from left edge to right edge (local metres)."""
    p = np.asarray(pts_xy, float)
    d = np.zeros_like(p)
    d[1:-1] = p[2:] - p[:-2]
    d[0], d[-1] = p[1] - p[0], p[-1] - p[-2]
    d /= np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-6)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)               # left-hand normal in the GIS (north-up) frame
    offs = np.linspace(half_w, -half_w, k)
    return p[:, None, :] + nrm[:, None, :] * offs[None, :, None]    # (n, k, 2)


def strip(sec_xy, sec_z):
    """Triangle strip over (n, k) cross-section points -> (verts in Unreal cm, tris)."""
    n, k = sec_z.shape
    verts = []
    for i in range(n):
        for j in range(k):
            x, y = ue_xy(*sec_xy[i, j])
            verts.append((x, y, float(sec_z[i, j])))
    tris = []
    for i in range(n - 1):
        for j in range(k - 1):
            a, b, c, e = i * k + j, i * k + j + 1, (i + 1) * k + j, (i + 1) * k + j + 1
            tris += [upward((a, b, c), verts), upward((b, e, c), verts)]
    return verts, tris


def write_instances(ue_dir, kind, groups):
    os.makedirs(os.path.join(ue_dir, "instances"), exist_ok=True)
    index = []
    for cell, rows in sorted(groups.items()):
        if not rows:
            continue
        name = f"{kind}_{cell[0]}_{cell[1]}"
        with open(os.path.join(ue_dir, "instances", name + ".bin"), "wb") as f:
            f.write(struct.pack("<I", len(rows)))
            f.write(np.asarray([r if len(r) == 8 else list(r) + [0.0] for r in rows], "<f4").tobytes())
        index.append({"name": name, "kind": kind, "cell": list(cell), "count": len(rows)})
    return index


# ---------------------------------------------------------------- layers
def export_landscape(fr, g, ue_dir, png):
    m = g.m
    tile_len_cm = g.tq * fr.res * 100
    x0, y0 = -fr.half_x * 100, -fr.half_y * 100
    tiles = []
    for ty in range(fr.tiles_y):
        for tx in range(fr.tiles_x):
            tiles.append({"file_r16": f"terrain/heightmap_x{tx}_y{ty}.r16", "file_png": f"terrain/heightmap_x{tx}_y{ty}.png", "tx": tx, "ty": ty,
                          "location_cm": [round(x0 + tx * tile_len_cm, 1), round(y0 + ty * tile_len_cm, 1), m["ue_location_z_cm"]]})
            if png:
                from PIL import Image
                Image.fromarray(np.array(g.tiles[(tx, ty)], dtype=np.uint16)).save(os.path.join(ue_dir, "terrain", f"heightmap_x{tx}_y{ty}.png"))
    doc = {"tiles": [fr.tiles_x, fr.tiles_y], "tile_px": m["tile_px"], "section_quads": 127, "sections_per_component": 2,
           "components_per_tile": [g.tq // 254, g.tq // 254], "scale": [m["ue_scale"]["x"], m["ue_scale"]["y"], m["ue_scale"]["z"]],
           "location_cm": [round(x0, 1), round(y0, 1), m["ue_location_z_cm"]],
           "extent_cm": [round(2 * fr.half_x * 100, 1), round(2 * fr.half_y * 100, 1)], "tile_files": tiles,
           "vertices": fr.nx * fr.ny}
    with open(os.path.join(ue_dir, "landscape.json"), "w") as f:
        json.dump(doc, f, indent=1)
    return doc


def export_roads(fr, g, out_dir, chunks):
    osm = load(out_dir, "osm_local.json")
    stats, road_pts = {"ways": 0, "skipped": 0, "km": 0.0, "by_class": {}}, []
    carve = {"P0": [], "P1": [], "HW": [], "K": [], "Z0": [], "Z1": []}
    for r in osm["layers"]["roads"]:
        t = r["tags"]
        hw = t.get("highway", "")
        cls = ROAD_CLASS.get(hw)
        if hw in EXCLUDED_HIGHWAYS or cls is None or t.get("area") == "yes" or t.get("service") in EXCLUDED_SERVICE:
            stats["skipped"] += 1
            continue
        width, speed, surf, lift = CLASS_DEFAULTS[cls]
        lanes = str(t.get("lanes") or "")
        if lanes.isdigit():
            width = max(width, int(lanes) * 3.6)
        pts = resample(r["pts"], ROAD_SAMPLE_M)
        if not any(fr.inside(*p) for p in pts):
            continue
        is_bridge = t.get("bridge") not in (None, "no")
        p = np.asarray(pts)
        zc = g.z_cm(p[:, 0], p[:, 1])
        if is_bridge:
            zc = np.linspace(zc[0], zc[-1], len(zc))
        k = 5 if width > 9 else 3                          # centre vertex follows the road crown
        sec = cross_sections(pts, width / 2, k)
        if is_bridge:
            sz = np.repeat(zc[:, None], k, 1) + lift            # deck: flat across, straight between abutments
        else:
            sz = g.z_cm(sec[..., 0].ravel(), sec[..., 1].ravel()).reshape(sec.shape[:2]) + lift
        verts, tris = strip(sec, sz)
        if not is_bridge:                                        # bridges span; everything else shapes the terrain
            pa = np.asarray(pts)
            zp = np.full((len(pts), 5), np.nan)
            zp[:, :k] = sz
            carve["P0"].append(pa[:-1]); carve["P1"].append(pa[1:]); carve["HW"].append(np.full(len(pts) - 1, width / 2))
            carve["K"].append(np.full(len(pts) - 1, k)); carve["Z0"].append(zp[:-1]); carve["Z1"].append(zp[1:])
        # split into runs that stay in one cell, so each merged chunk streams on its own
        seg_cells = [cell_of(fr, (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2) for i in range(len(pts) - 1)]
        start = 0
        per = 2 * (k - 1)                                        # triangles per segment
        for i in range(1, len(seg_cells) + 1):
            if i == len(seg_cells) or seg_cells[i] != seg_cells[start]:
                vs = verts[k * start: k * (i + 1)]
                ts = [(a_ - k * start, b_ - k * start, c_ - k * start) for a_, b_, c_ in tris[per * start: per * i]]
                chunks.add("Road", cls, seg_cells[start], vs, ts)
                start = i
        stats["ways"] += 1
        stats["by_class"][cls] = stats["by_class"].get(cls, 0) + 1
        stats["km"] += sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)) / 1000
        if cls in ("Highway", "County", "Town"):
            road_pts.append((cls, t.get("name"), pts, zc))
    stats["km"] = round(stats["km"], 1)
    carve = {k_: np.concatenate(v) for k_, v in carve.items()} if carve["P0"] else None
    return stats, road_pts, carve


def carve_terrain(fr, g, ue_dir, cv):
    """Shape the heightmap to the roads, like landscape splines do: every terrain vertex under a road is set
    CARVE_BELOW_CM under the road surface, and vertices just outside the edge are lowered (never raised) so
    banks can't poke through. Writes carved copies to ue/terrain/; the original tiles are never modified."""
    tdir = os.path.join(ue_dir, "terrain")
    os.makedirs(tdir, exist_ok=True)
    res, tq, nx, ny = fr.res, g.tq, fr.nx, fr.ny
    grid = np.arange(-3, 4)
    dc, dr = [a.ravel() for a in np.meshgrid(grid, grid)]
    set_i, set_z, low_i, low_z = [], [], [], []
    N = len(cv["P0"])
    for s0 in range(0, N, 100_000):
        sl = slice(s0, min(N, s0 + 100_000))
        P0, P1, HW, K = cv["P0"][sl], cv["P1"][sl], cv["HW"][sl][:, None], cv["K"][sl][:, None]
        Z0, Z1 = cv["Z0"][sl], cv["Z1"][sl]
        mid = (P0 + P1) / 2
        col = np.round((mid[:, 0] + fr.half_x) / res)[:, None] + dc[None, :]
        row = np.round((fr.half_y - mid[:, 1]) / res)[:, None] + dr[None, :]
        vx, vy = -fr.half_x + col * res, fr.half_y - row * res
        d = P1 - P0
        L = np.maximum(np.hypot(d[:, 0], d[:, 1]), 1e-6)[:, None]
        ux, uy = d[:, 0:1] / L, d[:, 1:2] / L
        rx, ry = vx - P0[:, 0:1], vy - P0[:, 1:2]
        t = (rx * ux + ry * uy) / L
        off = rx * -uy + ry * ux                                # left of the road is positive (matches cross_sections)
        ok = (t >= -0.4) & (t <= 1.4) & (col >= 0) & (col < nx) & (row >= 0) & (row < ny)   # overlap covers bend corners
        t = np.clip(t, 0.0, 1.0)
        inside = ok & (np.abs(off) <= HW)
        margin = ok & (np.abs(off) > HW) & (np.abs(off) <= HW + 0.75 * res)   # wider margins terrace the banks
        u = (HW - np.clip(off, -HW, HW)) / (2 * HW)             # 0 at the left edge, 1 at the right edge
        f = u * (K - 1)
        j = np.clip(np.floor(f), 0, K - 2).astype(int)
        w = f - j
        z0 = np.take_along_axis(Z0, j, 1) * (1 - w) + np.take_along_axis(Z0, j + 1, 1) * w
        z1 = np.take_along_axis(Z1, j, 1) * (1 - w) + np.take_along_axis(Z1, j + 1, 1) * w
        z = z0 * (1 - t) + z1 * t - CARVE_BELOW_CM
        gi = (row * nx + col).astype(np.int64)
        set_i.append(gi[inside]); set_z.append(z[inside])
        low_i.append(gi[margin]); low_z.append(z[margin])

    def reduce(idx, val, fn):
        idx, val = np.concatenate(idx), np.concatenate(val)
        o = np.argsort(idx, kind="stable")
        idx, val = idx[o], val[o]
        starts = np.flatnonzero(np.r_[True, idx[1:] != idx[:-1]])
        return idx[starts], fn.reduceat(val, starts)
    si, sz = reduce(set_i, set_z, np.minimum)                   # overlaps: carve to the lower road (float, never bury)
    li, lz = reduce(low_i, low_z, np.minimum)
    keep = ~np.isin(li, si)
    li, lz = li[keep], lz[keep]

    enc = lambda zc: np.clip(np.round(32768 + (zc - g.z0) * 128.0 / g.zs), 0, 65535).astype(np.uint16)
    changed, dz = 0, []
    for (tx, ty), src in g.tiles.items():
        dst = np.array(src)                                     # copy of the original tile
        for idx, zc, mode in ((si, sz, "set"), (li, lz, "lower")):
            r, c = idx // nx, idx % nx
            lr, lc = r - ty * tq, c - tx * tq
            sel = (lr >= 0) & (lr <= tq) & (lc >= 0) & (lc <= tq)   # tile edges are shared: both tiles get the update
            lr, lc, v = lr[sel], lc[sel], enc(zc[sel])
            old = dst[lr, lc]
            new = v if mode == "set" else np.minimum(old, v)
            dz.append((new.astype(np.int64) - old.astype(np.int64)) * g.zs / 128.0)
            dst[lr, lc] = new
        dst.astype("<u2").tofile(os.path.join(tdir, f"heightmap_x{tx}_y{ty}.r16"))
        changed += 1
    dz = np.concatenate(dz) if dz else np.zeros(1)
    return {"carved_vertices": int(len(si)), "lowered_bank_vertices": int(len(li)),
            "carve_change_cm_median": round(float(np.median(dz)), 1), "carve_change_cm_p1_p99":
            [round(float(np.percentile(dz, 1)), 1), round(float(np.percentile(dz, 99)), 1)]}


def road_fit_check(fr, g, chunks, every=4):
    """Share of road surface the carved terrain comes through, worst case over both landscape triangle splits."""
    def worst(x, y):
        col = np.clip((x + fr.half_x) / fr.res, 0, fr.nx - 1.001); row = np.clip((fr.half_y - y) / fr.res, 0, fr.ny - 1.001)
        c0, r0 = np.floor(col), np.floor(row); fc, fr_ = col - c0, row - r0
        at = lambda dc, dr: g.z_cm(-fr.half_x + (c0 + dc) * fr.res, fr.half_y - (r0 + dr) * fr.res)
        z00, z10, z01, z11 = at(0, 0), at(1, 0), at(0, 1), at(1, 1)
        a = np.where(fc >= fr_, z00 + (z10 - z00) * fc + (z11 - z10) * fr_, z00 + (z01 - z00) * fr_ + (z11 - z01) * fc)
        b = np.where(fc + fr_ <= 1, z00 + (z10 - z00) * fc + (z01 - z00) * fr_, z11 + (z01 - z11) * (1 - fc) + (z10 - z11) * (1 - fr_))
        return np.maximum(a, b)
    es = []
    keys = [k for k in sorted(chunks.data) if k[0] == "Road"][::every]
    for key in keys:
        v, t = chunks.data[key]
        v, t = np.asarray(v, float), np.asarray(t)
        px, py = cell_pivot(fr, *key[2])
        c = (v[t[:, 0]] + v[t[:, 1]] + v[t[:, 2]]) / 3
        es.append(c[:, 2] - worst((c[:, 0] + px) / 100, -(c[:, 1] + py) / 100))
    e = np.concatenate(es) if es else np.zeros(1)
    return {"fit_median_lift_cm": round(float(np.median(e)), 1),
            "fit_terrain_through_road_pct": round(float((e < -2).mean() * 100), 2)}


def export_water(fr, g, out_dir, chunks):
    import shapely
    from shapely.geometry import LineString, Point, Polygon
    from shapely.strtree import STRtree

    w = load(out_dir, "water_nhd_local.json")
    stats = {"streams": 0, "stream_km": 0.0, "lakes": 0, "river_areas": 0}

    def add_polygon(poly, cls):
        poly = poly.simplify(2.0)
        if poly.is_empty or poly.area < 800:
            return False
        for part in getattr(poly, "geoms", [poly]):
            if part.geom_type != "Polygon" or part.area < 800:
                continue
            tri = shapely.constrained_delaunay_triangles(part)
            verts, tris, vid = [], [], {}
            coords = [c for tr in tri.geoms for c in list(tr.exterior.coords)[:3]]
            if not coords:
                continue
            arr = np.asarray(coords)
            z = g.z_cm(arr[:, 0], arr[:, 1]) + 10.0      # hydro-flattened water surface
            for k, (xy, zz) in enumerate(zip(coords, z)):
                key = (round(xy[0], 2), round(xy[1], 2))
                if key not in vid:
                    vid[key] = len(verts)
                    verts.append((*ue_xy(*xy), float(zz)))
            for k in range(0, len(coords), 3):
                a, b, c = (vid[(round(coords[k + j][0], 2), round(coords[k + j][1], 2))] for j in range(3))
                tris.append(upward((a, b, c), verts))
            c = part.representative_point()
            chunks.add("Water", cls, cell_of(fr, c.x, c.y), verts, tris)
        return True

    areas = [Polygon(a["pts"]).buffer(0) for a in w["areas"] if len(a["pts"]) >= 4]
    areas = [a for a in areas if a.area > 0]
    for a in areas:
        stats["river_areas"] += add_polygon(a, "River")
    tree = STRtree(areas) if areas else None
    for fl in w["flowlines"]:
        pts = [p for p in resample(fl["pts"], 20.0) if fr.inside(*p)]
        if len(pts) < 2:
            continue
        if tree is not None:
            line = LineString(pts)
            hits = [areas[i] for i in tree.query(line)]
            if hits and sum(1 for p in pts[::3] if any(h.contains(Point(p)) for h in hits)) >= 0.5 * len(pts[::3]):
                continue                                  # covered by the river-area surface
        p = np.asarray(pts)
        z = np.minimum.accumulate(g.z_cm(p[:, 0], p[:, 1])) + 10.0   # downstream: water never climbs
        width = 6.0 if fl.get("name") else 2.5
        verts, tris = strip(cross_sections(pts, width / 2, 2), np.repeat(z[:, None], 2, 1))
        c = pts[len(pts) // 2]
        chunks.add("Water", "Stream", cell_of(fr, *c), verts, tris)
        stats["streams"] += 1
        stats["stream_km"] += sum(math.dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1)) / 1000
    for wb in w["waterbodies"]:
        if wb.get("ftype") == 466 or len(wb["pts"]) < 4:  # marsh stays terrain
            continue
        stats["lakes"] += add_polygon(Polygon(wb["pts"]).buffer(0), "Lake")
    stats["stream_km"] = round(stats["stream_km"], 1)
    return stats


def export_bridges(fr, g, out_dir):
    from scipy.spatial import cKDTree
    b = load(out_dir, "bridges_nbi_local.json")
    nbi = {x["id"]: x for x in b["bridges"]}
    groups, n_deck, n_short = {}, 0, 0
    thick = 1.0

    def add(cx, cy, z_start, z_end, yaw_math, length, width):
        """Deck slab whose top runs straight from abutment to abutment; pitched like the road on it."""
        ux, uy = ue_xy(cx, cy)
        pitch = math.degrees(math.atan2((z_end - z_start) / 100.0, max(length, 1.0)))
        top_mid = (z_start + z_end) / 2
        groups.setdefault(cell_of(fr, cx, cy), []).append(
            [ux, uy, top_mid - thick * 100.0, -yaw_math, max(length, 4.0), max(width, 3.5), thick, pitch])

    for d in b.get("osm_decks", []):
        p0, p1 = d["pts"][0], d["pts"][-1]
        if not (fr.inside(*p0) or fr.inside(*p1)):
            continue
        z = g.z_cm([p0[0], p1[0]], [p0[1], p1[1]])
        rec = nbi.get(d.get("nbi")) or {}
        yaw = math.degrees(math.atan2(p1[1] - p0[1], p1[0] - p0[0]))
        length = math.dist(p0, p1) + 4.0                   # overlap the abutments
        width = rec.get("deck_width_m") or rec.get("roadway_width_m") or 8.0
        add((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, float(z[0]), float(z[1]), yaw, length, width)
        n_deck += 1
    osm = load(out_dir, "osm_local.json")
    segs = []
    for r in osm["layers"]["roads"]:
        if ROAD_CLASS.get(r["tags"].get("highway", "")):
            segs += [(p, q) for p, q in zip(r["pts"][:-1], r["pts"][1:])]
    kd = cKDTree(np.array([[(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] for p, q in segs]))
    for x in b["bridges"]:
        if x.get("osm_decks") or not fr.inside(x["x"], x["y"]):
            continue
        if "culvert" in (x.get("design") or "") or (x.get("length_m") or 0) < 6:
            continue                                        # culverts: the bare-earth DEM keeps the embankment
        dist, i = kd.query([x["x"], x["y"]])
        if dist > 60:
            continue
        p, q = segs[i]
        yaw = math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))
        L = float(x.get("length_m") or 10.0)
        ux, uy = math.cos(math.radians(yaw)), math.sin(math.radians(yaw))
        ends = g.z_cm([x["x"] - ux * L / 2, x["x"] + ux * L / 2], [x["y"] - uy * L / 2, x["y"] + uy * L / 2])
        add(x["x"], x["y"], float(ends[0]), float(ends[1]), yaw, L + 4.0, x.get("deck_width_m") or 8.0)
        n_short += 1
    return {"osm_decks": n_deck, "nbi_short_spans": n_short}, groups


def export_buildings(fr, g, out_dir):
    from shapely.geometry import Polygon
    b = load(out_dir, "buildings_ms_local.json")
    groups, guessed, n = {}, 0, 0
    for bl in b["buildings"]:
        if len(bl["pts"]) < 4:
            continue
        poly = Polygon(bl["pts"]).buffer(0)
        if poly.area < 8 or poly.geom_type != "Polygon":
            continue
        cx, cy = poly.centroid.x, poly.centroid.y
        if not fr.inside(cx, cy):
            continue
        rect = list(poly.minimum_rotated_rectangle.exterior.coords)[:4]
        e1, e2 = np.subtract(rect[1], rect[0]), np.subtract(rect[2], rect[1])
        L, W = float(np.hypot(*e1)), float(np.hypot(*e2))
        major = e1 if L >= W else e2
        L, W = max(L, W), min(L, W)
        ring = np.asarray(poly.exterior.coords)
        base = float(np.min(g.z_cm(ring[:, 0], ring[:, 1])))
        h = bl.get("height_m")
        if h is None or h < 2.5:
            h = 3.0 if poly.area < 60 else 5.5
            guessed += 1
        h = min(h, 40.0)
        ux, uy = ue_xy(cx, cy)
        groups.setdefault(cell_of(fr, cx, cy), []).append(
            [ux, uy, base, -math.degrees(math.atan2(major[1], major[0])), L, W, h])
        n += 1
    return {"buildings": n, "height_guessed": guessed}, groups


def export_trees(fr, g, out_dir, spacing_m=24.0, slope_deg=14.0):
    """Forest scatter: OSM woods plus steep coulee walls (in this terrain the slopes are wooded),
    minus roads, buildings and water. Jittered grid, one tree per spacing^2."""
    from PIL import Image, ImageDraw
    stride = max(1, int(round(spacing_m / 2 / fr.res)))    # mask cell = spacing/2
    cell = fr.res * stride
    zg = g.grid(stride) / 100.0
    H, W = zg.shape
    gy, gx = np.gradient(zg, cell)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    wood = Image.new("L", (W, H), 0)
    block = Image.new("L", (W, H), 0)
    dw, db = ImageDraw.Draw(wood), ImageDraw.Draw(block)
    to_px = lambda x, y: ((x + fr.half_x) / cell, (fr.half_y - y) / cell)
    osm = load(out_dir, "osm_local.json")["layers"]
    for lu in osm["landuse"]:
        t = lu["tags"]
        if (t.get("natural") == "wood" or t.get("landuse") == "forest") and len(lu["pts"]) >= 3:
            dw.polygon([to_px(*p) for p in lu["pts"]], fill=255)
    for r in osm["roads"]:
        if len(r["pts"]) >= 2:
            db.line([to_px(*p) for p in r["pts"]], fill=255, width=max(1, int(round(14 / cell))))
    for wtr in osm["water"]:
        if len(wtr["pts"]) >= 3:
            db.polygon([to_px(*p) for p in wtr["pts"]], fill=255)
    bl = load(out_dir, "buildings_ms_local.json")
    for b in bl["buildings"]:
        if len(b["pts"]) >= 3:
            db.polygon([to_px(*p) for p in b["pts"]], fill=255)
    forest = ((np.asarray(wood) > 0) | (slope > slope_deg)) & (np.asarray(block) == 0)
    rng = np.random.default_rng(1848)                        # deterministic: re-running gives the same forest
    rr, cc = np.nonzero(forest[::2, ::2])                   # one tree per 2x2 mask cells = one per spacing^2
    xs = -fr.half_x + (cc * 2 + rng.random(len(cc)) * 2) * cell
    ys = fr.half_y - (rr * 2 + rng.random(len(rr)) * 2) * cell
    zs = g.z_cm(xs, ys)
    hts = rng.uniform(12.0, 24.0, len(xs))
    yaws = rng.uniform(0, 360, len(xs))
    groups = {}
    for x, y, z, h, yaw in zip(xs, ys, zs, hts, yaws):
        ux, uy = ue_xy(x, y)
        crown = h * 0.4                                   # crown diameter
        groups.setdefault(cell_of(fr, x, y), []).append([ux, uy, float(z) - 30.0, float(yaw), crown, crown, h])
    return {"trees": int(len(xs)), "forest_km2": round(float(forest.sum()) * cell * cell / 1e6, 1),
            "tree_spacing_m": spacing_m}, groups


def parse_landmarks(path):
    items, area = [], None
    with open(path) as f:
        for line in f:
            if line.startswith("## "):
                area = line[3:].strip()
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) == 6 and re.match(r"^-?\d+\.\d+$", cells[3]) and re.match(r"^-?\d+\.\d+$", cells[4]):
                items.append({"name": cells[0], "type": cells[1], "why": cells[2], "lat": float(cells[3]),
                              "lon": float(cells[4]), "confidence": cells[5], "area": area})
    return items


def export_landmarks_and_starts(fr, g, ue_dir, path, road_pts, start_towns):
    lms = parse_landmarks(path) if path and os.path.exists(path) else []
    out, outside = [], []
    for it in lms:
        x, y = fr.to_local(it["lon"], it["lat"])
        if not fr.inside(x, y):
            outside.append(it["name"])
            continue
        z = float(g.z_cm(x, y)[0])
        out.append({k: it[k] for k in ("name", "type", "why", "confidence", "area")} | {"xy_m": [x, y], "location": [*ue_xy(x, y), z]})
    with open(os.path.join(ue_dir, "landmarks.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "landmarks": out}, f, indent=1)

    # PlayerStarts: each town's downtown landmark, snapped onto the nearest real road, facing along it
    all_pts = [(cls, name, p, zc[i], pts, i) for cls, name, pts, zc in road_pts for i, p in enumerate(pts)]
    arr = np.asarray([a[2] for a in all_pts]) if all_pts else np.zeros((0, 2))
    starts = []
    for town in start_towns:
        cands = [lm for lm in out if (lm["area"] or "").lower().startswith(town.lower())]
        cands.sort(key=lambda lm: (lm["type"] != "Downtown strip", lm["confidence"] != "verified"))
        if not cands or not len(arr):
            starts.append({"town": town, "error": "no downtown landmark or roads"})
            continue
        lm = cands[0]
        d = np.hypot(arr[:, 0] - lm["xy_m"][0], arr[:, 1] - lm["xy_m"][1])
        k = int(np.argmin(d))
        cls, name, p, z, pts, i = all_pts[k]
        q = pts[min(i + 1, len(pts) - 1)] if i + 1 < len(pts) else pts[i - 1]
        yaw_math = math.degrees(math.atan2(q[1] - p[1], q[0] - p[0])) if i + 1 < len(pts) else math.degrees(math.atan2(p[1] - q[1], p[0] - q[0]))
        starts.append({"town": town, "landmark": lm["name"], "road": name, "road_class": cls,
                       "snap_distance_m": round(float(d[k]), 1),
                       "location": [*ue_xy(*p), float(z) + 150.0], "yaw_deg": round(-yaw_math, 2)})
    with open(os.path.join(ue_dir, "playable.json"), "w") as f:
        json.dump({"frame": "Unreal cm", "player_starts": starts}, f, indent=1)
    return {"landmarks": len(out), "landmarks_outside_map": outside,
            "landmarks_need_aerial_pin": sum(1 for x in out if x["confidence"] != "verified")}, starts


def geo_mapping(fr, g):
    return {
        "origin_lat": round(fr.lat, 6), "origin_lon": round(fr.lon, 6), "crs": f"EPSG:{fr.epsg}",
        "origin_easting_m": round(fr.cx, 3), "origin_northing_m": round(fr.cy, 3),
        "elev_min_m": g.m["elev_min_m"], "elev_max_m": g.m["elev_max_m"],
        "to_ue": "X_cm = (easting - origin_easting) * 100;  Y_cm = -(northing - origin_northing) * 100;  Z_cm = (elevation_m - elev_min_m) * 100",
        "axes": "Unreal +X = east, +Y = south, +Z = up; 1 uu = 1 cm; yaw 0 = east, 90 = south",
    }


def run(fr, out_dir, landmarks_path=None, png=False, start_towns=("Whitehall", "Arcadia"), tree_spacing=24.0):
    ue_dir = os.path.join(out_dir, "ue")
    os.makedirs(ue_dir, exist_ok=True)
    g0 = Ground(fr, out_dir)                                     # original lidar terrain
    chunks = MeshChunks(fr)
    road_stats, road_pts, cv = export_roads(fr, g0, out_dir, chunks)
    carve_stats = carve_terrain(fr, g0, ue_dir, cv) if cv is not None else {}
    g = Ground(fr, out_dir, tile_dir=os.path.join(ue_dir, "terrain"))   # carved terrain = what Unreal imports
    carve_stats |= road_fit_check(fr, g, chunks)
    land = export_landscape(fr, g, ue_dir, png)
    water_stats = export_water(fr, g, out_dir, chunks)
    mats = {"Road": {"Interstate": "Asphalt", "Highway": "Asphalt", "County": "Asphalt", "Town": "Gravel",
                     "Service": "Gravel", "Track": "Dirt"}, "Water": {}}
    mesh_index = chunks.write(ue_dir, lambda layer, cls: mats[layer].get(cls, "Water"))
    br_stats, br_groups = export_bridges(fr, g, out_dir)
    bd_stats, bd_groups = export_buildings(fr, g, out_dir)
    tr_stats, tr_groups = export_trees(fr, g, out_dir, spacing_m=tree_spacing)
    inst_index = (write_instances(ue_dir, "Bridge", br_groups) + write_instances(ue_dir, "Building", bd_groups)
                  + write_instances(ue_dir, "Tree", tr_groups))
    lm_stats, starts = export_landmarks_and_starts(fr, g, ue_dir, landmarks_path, road_pts, start_towns)

    road_tris = sum(m["tris"] for m in mesh_index if m["layer"] == "Road")
    warnings = []
    if land["vertices"] > BUDGET["landscape_vertices"]:
        warnings.append(f"landscape has {land['vertices']:,} vertices: enable Nanite on the landscape or use a coarser res")
    if carve_stats.get("fit_terrain_through_road_pct", 0) > 2.0:
        warnings.append(f"terrain shows through {carve_stats['fit_terrain_through_road_pct']}% of road surface (> 2%)")
    if road_tris > BUDGET["road_tris_total"]:
        warnings.append(f"road meshes total {road_tris:,} triangles (> {BUDGET['road_tris_total']:,}): keep Nanite on for road meshes")
    worst = max((i for i in inst_index), key=lambda i: i["count"], default=None)
    if worst and worst["count"] > BUDGET["instances_per_cell"]:
        warnings.append(f"{worst['name']} has {worst['count']:,} instances in one 8 km cell: raise tree spacing or lower cull distance")
    if tr_stats["trees"] > BUDGET["trees_total"]:
        warnings.append(f"{tr_stats['trees']:,} trees exceeds the {BUDGET['trees_total']:,} day-one budget: re-export with a larger --tree-spacing")

    manifest = {
        "geo": geo_mapping(fr, g), "landscape": "landscape.json", "cell_m": CELL_M,
        "meshes": mesh_index, "instances": inst_index, "playable": "playable.json", "landmarks": "landmarks.json",
        "stats": {"roads": road_stats | carve_stats | {"merged_meshes": sum(1 for m in mesh_index if m["layer"] == "Road"), "tris": road_tris},
                  "water": water_stats | {"merged_meshes": sum(1 for m in mesh_index if m["layer"] == "Water"),
                                          "tris": sum(m["tris"] for m in mesh_index if m["layer"] == "Water")},
                  "bridges": br_stats, "buildings": bd_stats, "trees": tr_stats, "landmarks": lm_stats,
                  "landscape_vertices": land["vertices"]},
        "perf_warnings": warnings, "player_starts": starts,
    }
    with open(os.path.join(ue_dir, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=1)
    return {k: manifest[k] for k in ("stats", "perf_warnings", "player_starts")}
