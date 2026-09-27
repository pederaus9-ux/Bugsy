"""Stand-in for the UE 5.6 `unreal` module, strict enough to catch Python errors, wrong argument types
and data problems in the County Map import scripts. It cannot prove that real API names exist in 5.6."""
import collections
import os

STATS = collections.Counter()
LOG = []
ASSETS = {}
PROJECT = os.environ.get("MOCK_PROJECT", "/tmp/mock_project")


def log(m): LOG.append(("info", m))
def log_warning(m): LOG.append(("warn", m))
def log_error(m): LOG.append(("error", m))


class _Struct:
    def set_editor_property(self, k, v):
        assert isinstance(k, str); setattr(self, k, v)
    def get_editor_property(self, k): return getattr(self, k)


class Vector(_Struct):
    def __init__(self, x=0.0, y=0.0, z=0.0):
        for v in (x, y, z):
            assert isinstance(v, (int, float)), f"Vector needs numbers, got {type(v)}"
        self.x, self.y, self.z = float(x), float(y), float(z)


class Vector2D(_Struct):
    def __init__(self, x=0.0, y=0.0): self.x, self.y = x, y


class IntVector(_Struct):
    def __init__(self, x=0, y=0, z=0):
        for v in (x, y, z):
            assert isinstance(v, int), "IntVector needs ints"
        self.x, self.y, self.z = x, y, z


class Rotator(_Struct):
    def __init__(self, roll=0.0, pitch=0.0, yaw=0.0):
        assert isinstance(yaw, (int, float)); self.roll, self.pitch, self.yaw = roll, pitch, yaw


class Transform(_Struct):
    def __init__(self, location=None, rotation=None, scale=None):
        assert isinstance(location, Vector) and isinstance(rotation, Rotator) and isinstance(scale, Vector)
        assert scale.x > 0 and scale.y > 0 and scale.z > 0, "non-positive instance scale"
        self.location, self.rotation, self.scale = location, rotation, scale


class LinearColor(_Struct):
    def __init__(self, r=0, g=0, b=0, a=1): self.r, self.g, self.b, self.a = r, g, b, a


class BoxSphereBounds:
    def __init__(self, origin, extent): self.origin, self.box_extent = origin, extent


class MaterialProperty: MP_BASE_COLOR, MP_ROUGHNESS, MP_METALLIC = "bc", "r", "m"
class ComponentMobility: STATIC = "STATIC"
class CollisionTraceFlag: CTF_USE_COMPLEX_AS_SIMPLE = "complex_as_simple"
class SplineCoordinateSpace: WORLD = "WORLD"


class Paths:
    @staticmethod
    def project_saved_dir(): return os.path.join(PROJECT, "Saved")
    @staticmethod
    def project_dir(): return PROJECT + "/"
    @staticmethod
    def convert_relative_path_to_full(p): return os.path.abspath(p)


# ----------------------------------------------------------------------------- UObjects / classes
class _Obj(_Struct):
    def get_name(self): return type(self).__name__


class Material(_Obj): pass
class MaterialFactoryNew(_Obj): pass
class BlueprintFactory(_Obj): pass
class MaterialExpressionConstant3Vector(_Obj): pass
class MaterialExpressionConstant(_Obj): pass
class MaterialExpressionVertexNormalWS(_Obj): pass
class MaterialExpressionComponentMask(_Obj): pass
class MaterialExpressionPower(_Obj): pass
class MaterialExpressionLinearInterpolate(_Obj): pass


class StaticMesh(_Obj):
    def __init__(self, path, extent=(50, 50, 50), origin=(0, 0, 0)):
        self.path, self._b = path, BoxSphereBounds(Vector(*origin), Vector(*extent))
    def get_bounds(self): return self._b
    def get_editor_property(self, k):
        assert k == "body_setup", k
        return _Struct()
    def set_material(self, i, m):
        assert isinstance(i, int) and isinstance(m, Material); self.mat = m


class GameModeBase(_Obj): pass
class DefaultPawn(_Obj): pass


class _BPClass(_Obj):
    def __init__(self, path): self.path, self.cdo = path, _Struct()
    def get_name(self): return self.path.rsplit("/", 1)[-1] + "_C"


def get_default_object(cls):
    assert isinstance(cls, _BPClass); return cls.cdo


class AssetToolsHelpers:
    class _Tools:
        def create_asset(self, name, folder, cls, factory):
            path = f"{folder}/{name}"
            assert path not in ASSETS, f"create_asset over an existing asset {path}"
            obj = Material() if cls is Material else _BPClass(path)
            ASSETS[path] = obj
            STATS["assets_created"] += 1
            return obj
    @staticmethod
    def get_asset_tools(): return AssetToolsHelpers._Tools()


class MaterialEditingLibrary:
    @staticmethod
    def create_material_expression(mat, cls, x, y):
        assert isinstance(mat, Material); return cls()
    @staticmethod
    def connect_material_property(expr, out, prop): assert prop in ("bc", "r", "m")
    @staticmethod
    def connect_material_expressions(a, ao, b, bi): assert isinstance(bi, str)
    @staticmethod
    def recompile_material(m): pass


class EditorAssetLibrary:
    @staticmethod
    def does_asset_exist(p):
        return p in ASSETS or (p.startswith("/Game/VehicleTemplate") and os.environ.get("MOCK_VEHICLE") == "1")
    @staticmethod
    def delete_asset(p): ASSETS.pop(p); STATS["assets_deleted"] += 1; return True
    @staticmethod
    def does_directory_exist(p): return True
    @staticmethod
    def make_directory(p): return True
    @staticmethod
    def save_loaded_asset(a): return True
    @staticmethod
    def save_asset(p): assert p in ASSETS; return True
    @staticmethod
    def load_blueprint_class(p):
        if p in ASSETS:
            return ASSETS[p]
        if p.startswith("/Game/VehicleTemplate") and os.environ.get("MOCK_VEHICLE") == "1":
            return _BPClass(p)
        return None


def load_asset(path):
    if path in ASSETS:
        return ASSETS[path]
    if path == "/Engine/BasicShapes/Cube":
        return StaticMesh(path, (50, 50, 50))
    if path == "/Engine/BasicShapes/Cone":
        return StaticMesh(path, (50, 50, 50))
    return None


# ----------------------------------------------------------------------------- Geometry Script
class DynamicMesh(_Obj):
    def __init__(self): self.v, self.t = 0, 0


class GeometryScriptSimpleMeshBuffers(_Struct):
    def set_editor_property(self, k, v):
        assert k in ("vertices", "triangles"), k
        assert isinstance(v, list) and v, "empty buffer"
        typ = Vector if k == "vertices" else IntVector
        assert isinstance(v[0], typ)
        setattr(self, k, v)


class GeometryScriptCreateNewStaticMeshAssetOptions(_Struct): pass
class GeometryScriptCalculateNormalsOptions(_Struct): pass


class GeometryScript_MeshBasicEditFunctions:
    @staticmethod
    def append_buffers_to_mesh(dm, buf, material_id=0, defer_change_notifications=False, debug=None):
        nv = len(buf.vertices)
        assert all(0 <= t.x < nv and 0 <= t.y < nv and 0 <= t.z < nv for t in buf.triangles), "triangle index out of range"
        dm.v += nv; dm.t += len(buf.triangles)
        return dm, None


class GeometryScript_Normals:
    @staticmethod
    def recompute_normals(dm, opts, debug=None): return dm


class GeometryScript_NewAssetUtils:
    @staticmethod
    def create_new_static_mesh_asset_from_mesh(dm, path, opts, debug=None):
        assert path not in ASSETS, f"asset exists: {path}"
        m = StaticMesh(path); ASSETS[path] = m; STATS["meshes_built"] += 1; STATS["mesh_tris"] += dm.t
        return m, "Success"


# ----------------------------------------------------------------------------- actors / level
class _Component(_Struct):
    def set_static_mesh(self, m): assert isinstance(m, StaticMesh); self.mesh = m
    def set_mobility(self, m): self.mob = m
    def set_collision_profile_name(self, n): assert n in ("BlockAll", "NoCollision"); self.col = n
    def set_material(self, i, m): assert isinstance(m, Material)
    def set_cull_distances(self, a, b): assert isinstance(a, int) and isinstance(b, int) and a < b
    def add_instances(self, xforms, return_indices, world_space):
        assert isinstance(xforms, list) and all(isinstance(t, Transform) for t in xforms[:50]) and world_space is True
        STATS["instances"] += len(xforms); return []


class HierarchicalInstancedStaticMeshComponent(_Component): pass


class Actor(_Obj):
    def __init__(self):
        self.tags, self.label, self.props = [], "", {}
        self.static_mesh_component = _Component()
        self.light_component = _Struct()
        self.components = []
    def set_actor_label(self, l): assert isinstance(l, str); self.label = l
    def get_actor_label(self): return self.label
    def set_folder_path(self, f): assert isinstance(f, str); self.folder = f
    def set_actor_rotation(self, r, teleport): assert isinstance(r, Rotator)
    def get_actor_scale3d(self): return getattr(self, "_scale", Vector(1, 1, 1))
    def set_editor_property(self, k, v):
        if k == "is_spatially_loaded":
            assert isinstance(v, bool)
        if k in ("enable_nanite",) and not isinstance(self, LandscapeProxy):
            raise AttributeError(k)
        self.props[k] = v


class StaticMeshActor(Actor): pass
class PlayerStart(Actor): pass
class DirectionalLight(Actor): pass
class SkyAtmosphere(Actor): pass
class SkyLight(Actor): pass
class ExponentialHeightFog(Actor): pass
class LandscapeProxy(Actor): pass


LEVEL = []


class EditorActorSubsystem:
    def spawn_actor_from_class(self, cls, loc, rot):
        assert isinstance(loc, Vector) and isinstance(rot, Rotator)
        a = cls(); a.loc = loc; LEVEL.append(a); STATS["spawned_" + cls.__name__] += 1; return a
    def get_all_level_actors(self): return list(LEVEL)
    def destroy_actor(self, a): LEVEL.remove(a); STATS["destroyed"] += 1; return True


class UnrealEditorSubsystem:
    class _World:
        ws = _Struct()
        def get_world_settings(self): return self.ws
    def get_editor_world(self): return self._World()


def get_editor_subsystem(c): return c()


class AddNewSubobjectParams(_Struct):
    def __init__(self, parent_handle=None, new_class=None, blueprint_context=None):
        assert new_class is HierarchicalInstancedStaticMeshComponent; self.parent = parent_handle


class _Fail:
    def is_empty(self): return True


class SubobjectDataSubsystem:
    def k2_gather_subobject_data_for_instance(self, actor): return [actor]
    def add_new_subobject(self, params):
        c = HierarchicalInstancedStaticMeshComponent(); params.parent.components.append(c); return c, _Fail()


class SubobjectDataBlueprintFunctionLibrary:
    @staticmethod
    def get_data(h): return h
    @staticmethod
    def get_object(d): return d


def get_engine_subsystem(c): return c()


class AssetRegistryHelpers:
    class _AR:
        def get_assets_by_path(self, path, recursive=True): return []
    @staticmethod
    def get_asset_registry(): return AssetRegistryHelpers._AR()


class ScopedSlowTask:
    def __init__(self, n, t): assert isinstance(n, (int, float)); self.n = n
    def __enter__(self): return self
    def __exit__(self, *e): return False
    def make_dialog(self, b): pass
    def enter_progress_frame(self, k=1, desc=""): pass
    def should_cancel(self): return False


class EditorLoadingAndSavingUtils:
    @staticmethod
    def save_dirty_packages(a, b): STATS["saves"] += 1; return True
