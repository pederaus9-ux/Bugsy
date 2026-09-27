"""Shared helpers for the County Map import scripts (Unreal Engine 5.6, Editor Python).

Every step script imports this module. Nothing here needs anything beyond the Python standard
library and the `unreal` module, so it runs in a stock UE 5.6 editor.
"""
import array
import json
import math
import os
import struct
import sys
import time

import unreal

# ----------------------------------------------------------------------------- configuration
PACKAGE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # .../CountyMap_Import
ASSET_ROOT = "/Game/CountyMap"                    # everything the import creates lives under here
TAG = "CountyMapImport"                           # every spawned actor carries this tag + its step tag

CULL_M = {"Tree": 1500, "Building": 5000, "Bridge": 5000}        # instance cull end distance (m)
COLLISION = {"Tree": False, "Building": True, "Bridge": True}    # trees without collision keep physics light
MESH_FOR = {                                        # engine meshes: always present in a blank project
    "Building": "/Engine/BasicShapes/Cube",
    "Bridge": "/Engine/BasicShapes/Cube",
    "Tree": "/Engine/BasicShapes/Cone",
}
MATERIALS = {   # name: (base colour RGB 0-1, roughness, metallic)
    "Asphalt": ((0.045, 0.045, 0.05), 0.85, 0.0),
    "Gravel": ((0.36, 0.31, 0.24), 0.95, 0.0),
    "Dirt": ((0.24, 0.17, 0.10), 0.95, 0.0),
    "Water": ((0.02, 0.07, 0.10), 0.05, 0.0),
    "Building": ((0.62, 0.60, 0.57), 0.80, 0.0),
    "Bridge": ((0.55, 0.55, 0.53), 0.85, 0.0),
    "Tree": ((0.05, 0.16, 0.05), 0.90, 0.0),
}

_actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
_log_path = None


# ----------------------------------------------------------------------------- logging
def _log_file():
    global _log_path
    if _log_path is None:
        d = os.path.join(unreal.Paths.project_saved_dir(), "Logs")
        os.makedirs(d, exist_ok=True)
        _log_path = os.path.join(d, "CountyMapImport.log")
    return _log_path


def _write(level, msg):
    line = f"[CountyMap] {msg}"
    {"info": unreal.log, "warn": unreal.log_warning, "error": unreal.log_error}[level](line)
    try:
        with open(_log_file(), "a", encoding="utf-8") as f:
            f.write(time.strftime("%H:%M:%S ") + level.upper().ljust(5) + " " + msg + "\n")
    except OSError:
        pass


def log(msg): _write("info", msg)
def warn(msg): _write("warn", msg)
def error(msg): _write("error", msg)


def perf_warn(msg):
    """60 fps budget risks are logged loudly, never shipped silently."""
    _write("warn", "PERF: " + msg)


class Step:
    """`with Step("roads"):` logs start, end, duration and any exception with a clear hint."""

    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.t0 = time.time()
        log(f"===== step: {self.name} =====")
        return self

    def __exit__(self, exc_type, exc, tb):
        dt = time.time() - self.t0
        if exc:
            error(f"step '{self.name}' FAILED after {dt:.1f}s: {exc_type.__name__}: {exc}")
            return False
        log(f"step '{self.name}' done in {dt:.1f}s")
        return False


# ----------------------------------------------------------------------------- data location
def data_dir():
    """Folder holding MapBuilder's `ue` export. Checked in this order:
    1. environment variable COUNTYMAP_DATA
    2. first non-comment line of CountyMap_Import/MapDataPath.txt
    3. <project>/CountyMap_Import/MapData
    4. <project>/../Bugsy/Tools/MapBuilder/out/ue  and  ~/Bugsy/Tools/MapBuilder/out/ue
    """
    cands = []
    if os.environ.get("COUNTYMAP_DATA"):
        cands.append(os.environ["COUNTYMAP_DATA"])
    txt = os.path.join(PACKAGE_DIR, "MapDataPath.txt")
    if os.path.exists(txt):
        with open(txt, encoding="utf-8") as f:
            for line in f:
                line = line.strip().strip('"')
                if line and not line.startswith("#"):
                    cands.append(line)
                    break
    proj = unreal.Paths.convert_relative_path_to_full(unreal.Paths.project_dir())
    cands += [os.path.join(PACKAGE_DIR, "MapData"),
              os.path.join(proj, "..", "Bugsy", "Tools", "MapBuilder", "out", "ue"),
              os.path.join(os.path.expanduser("~"), "Bugsy", "Tools", "MapBuilder", "out", "ue")]
    for c in cands:
        c = os.path.normpath(c)
        if os.path.exists(os.path.join(c, "manifest.json")):
            return c
        if os.path.exists(os.path.join(c, "ue", "manifest.json")):     # user pointed at out/ instead of out/ue
            return os.path.join(c, "ue")
    raise FileNotFoundError(
        "MapBuilder export not found. Put the full path of Tools/MapBuilder/out/ue on its own line in "
        f"{txt} (see Docs/README.md step 3). Looked in: " + " | ".join(os.path.normpath(c) for c in cands))


def load_json(name):
    with open(os.path.join(data_dir(), name), encoding="utf-8") as f:
        return json.load(f)


def manifest():
    return load_json("manifest.json")


def read_mesh_bin(path):
    with open(path, "rb") as f:
        nv, nt = struct.unpack("<II", f.read(8))
        v = array.array("f"); v.frombytes(f.read(nv * 12))
        t = array.array("I"); t.frombytes(f.read(nt * 12))
    if sys.byteorder != "little":
        v.byteswap(); t.byteswap()
    return nv, nt, v, t


def read_instances_bin(path):
    with open(path, "rb") as f:
        (n,) = struct.unpack("<I", f.read(4))
        a = array.array("f"); a.frombytes(f.read(n * 32))
    if sys.byteorder != "little":
        a.byteswap()
    return [a[i * 8:(i + 1) * 8] for i in range(n)]    # x, y, bottom_z, yaw, size_x, size_y, size_z, pitch


# ----------------------------------------------------------------------------- actors
def clear_step(step_tag):
    """Remove only actors this import spawned for `step_tag` (hand-placed work is never touched)."""
    n = 0
    for a in _actors.get_all_level_actors():
        tags = [str(t) for t in a.tags]
        if TAG in tags and step_tag in tags:
            _actors.destroy_actor(a)
            n += 1
    if n:
        log(f"{step_tag}: removed {n} actors from the previous import")
    return n


def spawn(cls, location, yaw=0.0, label=None, folder=None, step_tag=None, extra_tags=()):
    a = _actors.spawn_actor_from_class(cls, location, unreal.Rotator(roll=0.0, pitch=0.0, yaw=float(yaw)))
    if a is None:
        raise RuntimeError(f"could not spawn {cls}")
    if label:
        a.set_actor_label(label)
    if folder:
        a.set_folder_path(folder)
    a.tags = [TAG] + ([step_tag] if step_tag else []) + list(extra_tags)
    return a


def set_spatially_loaded(actor, value):
    try:
        actor.set_editor_property("is_spatially_loaded", value)
    except Exception:
        pass    # not a World Partition level: property absent, nothing to do


def all_actors_of(cls):
    return [a for a in _actors.get_all_level_actors() if isinstance(a, cls)]


def save_all():
    unreal.EditorLoadingAndSavingUtils.save_dirty_packages(True, True)


# ----------------------------------------------------------------------------- assets
def ensure_folder(path):
    if not unreal.EditorAssetLibrary.does_directory_exist(path):
        unreal.EditorAssetLibrary.make_directory(path)


def delete_asset_if_exists(path):
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        unreal.EditorAssetLibrary.delete_asset(path)


def material(name):
    """Simple opaque two-sided material with a constant colour (created once, then reused)."""
    folder = f"{ASSET_ROOT}/Materials"
    path = f"{folder}/M_{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        return unreal.load_asset(path)
    ensure_folder(folder)
    rgb, rough, metal = MATERIALS[name]
    mel = unreal.MaterialEditingLibrary
    mat = unreal.AssetToolsHelpers.get_asset_tools().create_asset(f"M_{name}", folder, unreal.Material, unreal.MaterialFactoryNew())
    mat.set_editor_property("two_sided", True)          # winding-proof: every generated mesh renders from both sides
    col = mel.create_material_expression(mat, unreal.MaterialExpressionConstant3Vector, -400, 0)
    col.set_editor_property("constant", unreal.LinearColor(rgb[0], rgb[1], rgb[2], 1.0))
    mel.connect_material_property(col, "", unreal.MaterialProperty.MP_BASE_COLOR)
    r = mel.create_material_expression(mat, unreal.MaterialExpressionConstant, -400, 200)
    r.set_editor_property("r", rough)
    mel.connect_material_property(r, "", unreal.MaterialProperty.MP_ROUGHNESS)
    if metal:
        m = mel.create_material_expression(mat, unreal.MaterialExpressionConstant, -400, 300)
        m.set_editor_property("r", metal)
        mel.connect_material_property(m, "", unreal.MaterialProperty.MP_METALLIC)
    mel.recompile_material(mat)
    unreal.EditorAssetLibrary.save_loaded_asset(mat)
    return mat


# ----------------------------------------------------------------------------- Geometry Script meshes
def _gs(*names):
    for n in names:
        lib = getattr(unreal, n, None)
        if lib is not None:
            return lib
    return None


def geometry_script_ok():
    return (_gs("GeometryScript_MeshBasicEditFunctions") is not None and
            _gs("GeometryScript_NewAssetUtils", "GeometryScript_AssetUtils", "GeometryScript_CreateNewAssetFunctions") is not None)


def build_static_mesh(bin_path, asset_path, mat, nanite=True, collision=False):
    """Merged triangle mesh (MapBuilder .bin) -> StaticMesh asset via Geometry Script. Returns (mesh, tris)."""
    edit = _gs("GeometryScript_MeshBasicEditFunctions")
    newasset = _gs("GeometryScript_NewAssetUtils", "GeometryScript_AssetUtils", "GeometryScript_CreateNewAssetFunctions")
    normals = _gs("GeometryScript_Normals", "GeometryScript_MeshNormals", "GeometryScript_MeshNormalsFunctions")
    if edit is None or newasset is None:
        raise RuntimeError("Geometry Script plugin is not enabled (Edit > Plugins > 'Geometry Script'), see README step 2")

    nv, nt, v, t = read_mesh_bin(bin_path)
    buf = unreal.GeometryScriptSimpleMeshBuffers()
    buf.set_editor_property("vertices", [unreal.Vector(v[i], v[i + 1], v[i + 2]) for i in range(0, nv * 3, 3)])
    buf.set_editor_property("triangles", [unreal.IntVector(t[i], t[i + 1], t[i + 2]) for i in range(0, nt * 3, 3)])
    dm = unreal.DynamicMesh()
    edit.append_buffers_to_mesh(dm, buf)
    if normals is not None:
        for fn in ("recompute_normals", "compute_split_normals"):
            f = getattr(normals, fn, None)
            if f:
                try:
                    f(dm, unreal.GeometryScriptCalculateNormalsOptions())
                except Exception:
                    try:
                        f(dm)
                    except Exception:
                        pass
                break

    delete_asset_if_exists(asset_path)
    opts = unreal.GeometryScriptCreateNewStaticMeshAssetOptions()
    for k, val in (("enable_recompute_normals", True), ("enable_recompute_tangents", False),
                   ("enable_nanite", nanite), ("enable_collision", collision)):
        try:
            opts.set_editor_property(k, val)
        except Exception:
            pass
    res = newasset.create_new_static_mesh_asset_from_mesh(dm, asset_path, opts)
    mesh = res[0] if isinstance(res, tuple) else res
    if mesh is None:
        raise RuntimeError(f"Geometry Script could not create {asset_path}")
    mesh.set_material(0, mat)
    if collision:                      # drive on the exact road surface: use the triangles as the collision shape
        try:
            body = mesh.get_editor_property("body_setup")
            body.set_editor_property("collision_trace_flag", unreal.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE)
        except Exception as e:
            warn(f"{asset_path}: could not set complex-as-simple collision ({e}); the car then drives on the landscape")
    unreal.EditorAssetLibrary.save_loaded_asset(mesh)
    return mesh, nt


def place_mesh_actor(mesh, pivot_cm, label, folder, step_tag, collision=False):
    a = spawn(unreal.StaticMeshActor, unreal.Vector(*pivot_cm), label=label, folder=folder, step_tag=step_tag)
    smc = a.static_mesh_component
    smc.set_static_mesh(mesh)
    smc.set_mobility(unreal.ComponentMobility.STATIC)
    smc.set_collision_profile_name("BlockAll" if collision else "NoCollision")
    set_spatially_loaded(a, False)     # large merged chunks stay loaded: no road pop-in at cell borders
    return a


# ----------------------------------------------------------------------------- instancing (HISM)
def _add_hism_component(actor):
    """Add a HierarchicalInstancedStaticMeshComponent to a placed actor (instance component, saved with the level)."""
    sds = unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)
    handles = sds.k2_gather_subobject_data_for_instance(actor)
    params = unreal.AddNewSubobjectParams(parent_handle=handles[0],
                                          new_class=unreal.HierarchicalInstancedStaticMeshComponent,
                                          blueprint_context=None)
    handle, fail = sds.add_new_subobject(params)
    if not fail.is_empty():
        raise RuntimeError(f"SubobjectDataSubsystem refused the HISM component: {fail}")
    data = unreal.SubobjectDataBlueprintFunctionLibrary.get_data(handle)
    return unreal.SubobjectDataBlueprintFunctionLibrary.get_object(data)


def mesh_bounds(mesh):
    b = mesh.get_bounds()
    return b.origin, b.box_extent


def spawn_hism(kind, rows, cell, mat, step_tag):
    """One actor per 8 km cell holding every instance of `kind` in it."""
    mesh = unreal.load_asset(MESH_FOR[kind])
    origin, ext = mesh_bounds(mesh)
    sx0, sy0, sz0 = max(ext.x * 2, 1e-3), max(ext.y * 2, 1e-3), max(ext.z * 2, 1e-3)
    bottom = origin.z - ext.z
    x0, y0 = rows[0][0], rows[0][1]
    a = spawn(unreal.Actor, unreal.Vector(x0, y0, 0.0), label=f"{kind}s_{cell[0]}_{cell[1]}",
              folder=f"CountyMap/{step_tag}", step_tag=step_tag)
    hism = _add_hism_component(a)
    hism.set_static_mesh(mesh)
    hism.set_material(0, mat)
    hism.set_mobility(unreal.ComponentMobility.STATIC)
    hism.set_collision_profile_name("BlockAll" if COLLISION[kind] else "NoCollision")
    cull = CULL_M[kind] * 100.0
    hism.set_cull_distances(int(cull * 0.8), int(cull))
    xforms = []
    for x, y, zb, yaw, lx, ly, lz, pitch in rows:
        s = unreal.Vector(lx * 100.0 / sx0, ly * 100.0 / sy0, lz * 100.0 / sz0)
        z = zb - bottom * s.z                          # put the mesh's lowest point on the ground
        xforms.append(unreal.Transform(unreal.Vector(x, y, z), unreal.Rotator(roll=0.0, pitch=pitch, yaw=yaw), s))
    hism.add_instances(xforms, False, True)            # (transforms, return indices, world space)
    set_spatially_loaded(a, kind != "Tree")
    return a, len(xforms)
