"""STORMCHASER map importer for Unreal Engine 5.6 (Editor Python).

Builds the county map from MapBuilder's out/ue/ files in priority order:
    landscape tiles -> road splines -> water -> bridges -> buildings -> trees -> landmarks

Run inside the UE 5.6 editor with the Python Editor Script Plugin enabled:
    Tools > Execute Python Script... > stormchaser_import.py
or from the Output Log (Python mode):
    import stormchaser_import as sc; sc.run_all()          # everything
    sc.run(["roads"])                                      # one step
    sc.run(["buildings"], limit=500)                       # quick test on a sample

Every spawned actor is tagged "SC_Import" plus its step tag, and filed under World Outliner
folders Map/<Step>/..., so a step can be re-run: it first removes only the actors it spawned before.

Required plugins: Python Editor Script Plugin, Editor Scripting Utilities, Water, PCG.
Required Blueprints: see ue/README.md (road/creek/bridge/culvert/landmark contracts).
Lines marked VERIFY-5.6 use APIs whose exact Python names should be confirmed on first run.
"""
import json
import math
import os

import unreal

# ----------------------------------------------------------------------------- configuration
DATA_DIR = os.environ.get("SC_MAP_DATA", r"C:/Stormchaser/MapBuilder/out/ue")   # folder with landscape.json etc.

CLASSES = {
    "road": "/Game/Stormchaser/Map/Blueprints/BP_RoadSpline",
    "creek": "/Game/Stormchaser/Map/Blueprints/BP_Creek",
    "bridge": "/Game/Stormchaser/Map/Blueprints/BP_Bridge",
    "culvert": "/Game/Stormchaser/Map/Blueprints/BP_Culvert",
    "landmark": "/Game/Stormchaser/Map/Blueprints/BP_Landmark",
}
BUILDING_MESH = "/Engine/BasicShapes/Cube"            # 100 cm cube, pivot at center: blockout massing (V1)
TREE_TABLE = "/Game/Stormchaser/Map/Data/DT_TreePoints"  # DataTable with row struct S_TreePoint (see README)
SAVE_EVERY = 1000                                     # save dirty packages every N spawned actors
TAG = "SC_Import"

actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


# ----------------------------------------------------------------------------- helpers
def log(msg):
    unreal.log(f"[Stormchaser] {msg}")


def warn(msg):
    unreal.log_warning(f"[Stormchaser] {msg}")


def load_json(name):
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} missing: run `mapbuilder.py ue_export` and set DATA_DIR / SC_MAP_DATA")
    with open(path) as f:
        return json.load(f)


def load_class(key):
    path = CLASSES[key]
    cls = unreal.EditorAssetLibrary.load_blueprint_class(path)
    if cls is None:
        warn(f"Blueprint {path} not found; step '{key}' falls back or is skipped (see README contracts)")
    return cls


def vec(p):
    return unreal.Vector(float(p[0]), float(p[1]), float(p[2]))


def save():
    unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)


def clear_step(step_tag):
    """Remove actors this importer spawned for a step (never touches hand-placed actors)."""
    n = 0
    for a in actors.get_all_level_actors():
        tags = [str(t) for t in a.tags]
        if TAG in tags and step_tag in tags:
            actors.destroy_actor(a)
            n += 1
    if n:
        log(f"removed {n} previously imported '{step_tag}' actors")


def spawn(cls, location, yaw=0.0, label=None, folder=None, step_tag=None):
    a = actors.spawn_actor_from_class(cls, location, unreal.Rotator(roll=0.0, pitch=0.0, yaw=float(yaw)))
    if a is None:
        return None
    if label:
        a.set_actor_label(label)
    if folder:
        a.set_folder_path(folder)
    a.tags = [TAG, step_tag] if step_tag else [TAG]
    return a


def set_props(actor, props):
    """Set Blueprint variables last: set_editor_property fires PostEditChange, which reruns the construction script."""
    for k, v in props.items():
        try:
            actor.set_editor_property(k, v)
        except Exception as e:  # missing variable on a user Blueprint: report, keep going
            warn(f"{actor.get_actor_label()}: cannot set '{k}' ({e})")


def fill_spline(spline, pts, closed=False):
    spline.clear_spline_points(False)
    for p in pts:
        spline.add_spline_point(vec(p), unreal.SplineCoordinateSpace.WORLD, False)
    spline.set_closed_loop(closed, False)
    spline.update_spline()


def first_spline(actor):
    return actor.get_component_by_class(unreal.SplineComponent)


class Progress:
    def __init__(self, total, title):
        self.task = unreal.ScopedSlowTask(total, title)
        self.count = 0

    def __enter__(self):
        self.task.__enter__()
        self.task.make_dialog(True)
        return self

    def __exit__(self, *exc):
        self.task.__exit__(*exc)
        save()                      # always persist what was spawned, including after a cancel

    def step(self):
        self.count += 1
        self.task.enter_progress_frame(1)
        if self.count % SAVE_EVERY == 0:
            save()
        return not self.task.should_cancel()


# ----------------------------------------------------------------------------- 1. landscape
def step_landscape(limit=None):
    """Validate the landscape against landscape.json and print exact import settings.

    Heightmap import is done once in Landscape Mode (Manage > New > Import from File), because
    UE 5.6 exposes no stable Python API for creating a sized landscape from a heightmap. VERIFY-5.6.
    """
    L = load_json("landscape.json")
    sx, sy, sz = L["scale"]
    log("---- Landscape import settings (Landscape Mode > Manage > New > Import from File) ----")
    log(f"Heightmap: first tile {L['tile_files'][0]['file_r16']} (tiles named _x#_y#; use --png export if the dialog wants PNG)")
    log(f"Tiles: {L['tiles'][0]} x {L['tiles'][1]}, each {L['tile_px']} px; section size 127 quads, 2x2 sections/component, "
        f"{L['components_per_tile'][0]} x {L['components_per_tile'][1]} components per tile")
    log(f"Location (cm): X={L['location_cm'][0]}  Y={L['location_cm'][1]}  Z={L['location_cm'][2]}")
    log(f"Scale: X={sx}  Y={sy}  Z={sz}")
    log("Fallback if tiled import is unavailable: import each tile as its own landscape at the tile's location_cm (tiles share edges).")

    found = [a for a in actors.get_all_level_actors() if isinstance(a, unreal.LandscapeProxy)]
    if not found:
        warn("No landscape in the level yet. Import it with the settings above, then re-run step 'landscape' to validate.")
        return
    for a in found:
        s = a.get_actor_scale3d()
        ok = abs(s.x - sx) < 0.01 and abs(s.y - sy) < 0.01 and abs(s.z - sz) < 0.01
        (log if ok else warn)(f"{a.get_actor_label()}: scale {s.x:.3f},{s.y:.3f},{s.z:.4f} "
                              f"{'OK' if ok else f'expected {sx},{sy},{sz}'}  location {a.get_actor_location()}")


# ----------------------------------------------------------------------------- 2. roads
def step_roads(limit=None):
    cls = load_class("road")
    if cls is None:
        return
    roads = load_json("roads.json")["roads"][:limit]
    clear_step("Roads")
    with Progress(len(roads), "Stormchaser: road splines") as pr:
        for r in roads:
            label = f"Road_{r['class']}_{r['name'] or r['ref'] or r['id']}"
            a = spawn(cls, vec(r["pts"][0]), label=label, folder=f"Map/Roads/{r['class']}", step_tag="Roads")
            sp = first_spline(a) if a else None
            if sp is None:
                warn(f"{label}: Blueprint has no SplineComponent")
            else:
                fill_spline(sp, r["pts"])
                set_props(a, {"RoadClass": r["class"], "WidthM": r["width_m"], "Surface": r["surface"],
                              "SpeedKph": float(r["speed_kph"]), "IsBridge": r["is_bridge"], "OneWay": r["oneway"]})
            if not pr.step():
                break
    save()
    log(f"roads: {len(roads)} splines")


# ----------------------------------------------------------------------------- 3. water
def _water_zone():
    zones = [a for a in actors.get_all_level_actors() if a.get_class().get_name() == "WaterZone"]
    if zones:
        return zones[0]
    L = load_json("landscape.json")
    z = spawn(unreal.load_class(None, "/Script/Water.WaterZone"), unreal.Vector(0, 0, L["location_cm"][2]),
              label="WaterZone_County", folder="Map/Water", step_tag="Water")
    try:  # VERIFY-5.6: zone extent property name
        z.set_editor_property("zone_extent", unreal.Vector2D(L["extent_cm"][0], L["extent_cm"][1]))
    except Exception as e:
        warn(f"set the WaterZone extent by hand to cover the map ({e})")
    return z


def _set_river_width(body, width_m, n):
    try:  # VERIFY-5.6: per-point river width lives in the water spline metadata
        meta = body.get_editor_property("water_spline_metadata")
        curve = meta.get_editor_property("width")
        pts = curve.get_editor_property("points")
        for i in range(min(n, len(pts))):
            pts[i].out_val = width_m * 100.0
        curve.set_editor_property("points", pts)
    except Exception as e:
        warn(f"{body.get_actor_label()}: set river width {width_m} m by hand ({e})")


def step_water(limit=None):
    W = load_json("water.json")
    clear_step("Water")
    _water_zone()
    river_cls = unreal.load_class(None, "/Script/Water.WaterBodyRiver")
    lake_cls = unreal.load_class(None, "/Script/Water.WaterBodyLake")
    creek_cls = load_class("creek")
    rivers, lakes, creeks = W["rivers"][:limit], W["lakes"][:limit], W["creeks"][:limit]
    with Progress(len(rivers) + len(lakes) + len(creeks), "Stormchaser: water") as pr:
        for r in rivers:
            a = spawn(river_cls, vec(r["pts"][0]), label=f"River_{r['name'] or 'unnamed'}", folder="Map/Water/Rivers", step_tag="Water")
            fill_spline(a.get_water_spline(), r["pts"])
            _set_river_width(a, r["width_m"], len(r["pts"]))
            if not pr.step():
                return
        for lk in lakes:
            if lk["marsh"]:
                pr.step()
                continue  # marshes stay terrain + material (PCG reeds), not open water
            a = spawn(lake_cls, vec(lk["pts"][0]), label=f"Lake_{lk['name'] or lk['area_m2']}", folder="Map/Water/Lakes", step_tag="Water")
            fill_spline(a.get_water_spline(), lk["pts"], closed=True)
            if not pr.step():
                return
        if creek_cls is None:
            warn("BP_Creek missing: creeks skipped (terrain channels still carry them visually)")
        else:
            for c in creeks:
                a = spawn(creek_cls, vec(c["pts"][0]), label=f"Creek_{c['name'] or 'unnamed'}", folder="Map/Water/Creeks", step_tag="Water")
                fill_spline(first_spline(a), c["pts"])
                set_props(a, {"WidthM": c["width_m"]})
                if not pr.step():
                    return
    save()
    log(f"water: {len(rivers)} rivers, {len(lakes)} lakes, {len(creeks)} creeks")


# ----------------------------------------------------------------------------- 4. bridges
def step_bridges(limit=None):
    B = load_json("bridges.json")
    bridge_cls, culvert_cls = load_class("bridge"), load_class("culvert")
    clear_step("Bridges")
    decks, structs = B["decks"][:limit], B["structures"][:limit]
    with Progress(len(decks) + len(structs), "Stormchaser: bridges") as pr:
        if bridge_cls:
            for d in decks:
                a = spawn(bridge_cls, vec(d["start"]), label=f"Bridge_{d['name'] or d['nbi_id'] or d['osm_id']}",
                          folder="Map/Bridges/Decks", step_tag="Bridges")
                fill_spline(first_spline(a), [d["start"], d["end"]])
                set_props(a, {"DeckWidthM": float(d["deck_width_m"] or 8.0), "LengthM": float(d["length_m"] or 0),
                              "Material": d["material"] or "", "Design": d["design"] or "",
                              "YearBuilt": int(d["year_built"] or 0), "NbiId": d["nbi_id"] or ""})
                if not pr.step():
                    return
        for s in structs:
            cls = culvert_cls if s["kind"] == "culvert" else bridge_cls
            if cls is None:
                pr.step()
                continue
            a = spawn(cls, vec(s["location"]), yaw=s["yaw_deg"], label=f"{s['kind']}_{s['nbi_id']}",
                      folder=f"Map/Bridges/{s['kind']}", step_tag="Bridges")
            set_props(a, {"LengthM": float(s["length_m"] or 4.0), "DeckWidthM": float(s["deck_width_m"] or 8.0),
                          "NbiId": s["nbi_id"] or ""})
            if not pr.step():
                return
    save()
    log(f"bridges: {len(decks)} decks, {len(structs)} culverts/short spans")


# ----------------------------------------------------------------------------- 5. buildings
def step_buildings(limit=None):
    """V1 blockout massing: one scaled cube per footprint. PCG shape grammar replaces these later (TDD §8.3)."""
    mesh = unreal.load_asset(BUILDING_MESH)
    blds = load_json("buildings.json")["buildings"][:limit]
    clear_step("Buildings")
    with Progress(len(blds), "Stormchaser: building massing") as pr:
        for b in blds:
            cx, cy, z = b["center"]
            h = b["height_m"] * 100.0
            a = spawn(unreal.StaticMeshActor, unreal.Vector(cx, cy, z + h / 2.0), yaw=b["yaw_deg"],
                      label=f"Bldg_{b['i']}", folder=f"Map/Buildings/{int(cx // 800000)}_{int(cy // 800000)}",
                      step_tag="Buildings")
            smc = a.static_mesh_component
            smc.set_static_mesh(mesh)
            smc.set_mobility(unreal.ComponentMobility.STATIC)
            a.set_actor_scale3d(unreal.Vector(b["length_m"], b["width_m"], b["height_m"]))  # cube is 1 m
            if b["height_guessed"]:
                a.tags = list(a.tags) + ["HeightGuessed"]
            if not pr.step():
                break
    save()
    log(f"buildings: {len(blds)} massing actors")


# ----------------------------------------------------------------------------- 6. trees
def step_trees(limit=None):
    """Load lidar tree points into a DataTable that a PCG graph spawns from (README: PCG_LidarTrees)."""
    csv_path = os.path.join(DATA_DIR, "trees.csv")
    with open(csv_path) as f:
        n = sum(1 for _ in f) - 1
    if n <= 0:
        warn("trees.csv is empty: no lidar tiles processed yet. Forests come from the NLCD PCG graph for now.")
        return
    table = unreal.load_asset(TREE_TABLE)
    if table is None:
        warn(f"{TREE_TABLE} missing: create a DataTable with row struct S_TreePoint (README), then re-run")
        return
    ok = unreal.DataTableFunctionLibrary.fill_data_table_from_csv_file(table, csv_path)
    (log if ok else warn)(f"trees: {n} lidar tree points {'loaded into' if ok else 'FAILED to load into'} {TREE_TABLE}")
    if ok:
        unreal.EditorAssetLibrary.save_loaded_asset(table)


# ----------------------------------------------------------------------------- 7. landmarks
def step_landmarks(limit=None):
    cls = load_class("landmark") or unreal.TargetPoint
    lms = load_json("landmarks.json")["landmarks"][:limit]
    clear_step("Landmarks")
    for lm in lms:
        a = spawn(cls, vec(lm["location"]), label=f"LM_{lm['area']}_{lm['name']}", folder=f"Map/Landmarks/{lm['area']}",
                  step_tag="Landmarks")
        if lm["confidence"] != "verified":
            a.tags = list(a.tags) + ["NeedsAerialPin"]
        if cls is not unreal.TargetPoint:
            set_props(a, {"LandmarkName": lm["name"], "LandmarkType": lm["type"], "Area": lm["area"] or "",
                          "Confidence": lm["confidence"]})
    save()
    log(f"landmarks: {len(lms)} placed ({sum(1 for x in lms if x['confidence'] != 'verified')} tagged NeedsAerialPin)")


# ----------------------------------------------------------------------------- entry points
STEPS = {"landscape": step_landscape, "roads": step_roads, "water": step_water, "bridges": step_bridges,
         "buildings": step_buildings, "trees": step_trees, "landmarks": step_landmarks}
ORDER = ["landscape", "roads", "water", "bridges", "buildings", "trees", "landmarks"]


def run(steps, limit=None):
    for s in steps:
        log(f"=== step: {s} ===")
        STEPS[s](limit=limit)


def run_all(limit=None):
    run(ORDER, limit)


if __name__ == "__main__":
    run_all()
