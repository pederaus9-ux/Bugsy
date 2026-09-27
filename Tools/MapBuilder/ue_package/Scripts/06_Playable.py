"""Step 6: day-one playable. Sky and sun if the level has none, a drive game mode (Chaos vehicle) and a fly
game mode (free camera), and PlayerStarts on real roads in the town centres from the landmark list.

Re-runnable: previous PlayerStarts/lighting from this import are replaced; game-mode assets are reused.
Switch modes any time with PlayMode_Drive.py / PlayMode_Fly.py.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

import unreal           # noqa: E402

GM_FOLDER = f"{C.ASSET_ROOT}/GameModes"
KNOWN_VEHICLE_PAWNS = [   # UE 5.x Vehicle template (Blueprint) paths, checked first
    "/Game/VehicleTemplate/Blueprints/SportsCar/SportsCar_Pawn",
    "/Game/VehicleTemplate/Blueprints/OffroadCar/OffroadCar_Pawn",
]
REMOVE_OTHER_PLAYERSTARTS = True   # the Open World template's own PlayerStart sits at the map centre, not on a road


# ----------------------------------------------------------------------------- asset discovery
def _parent_class(ad):
    for getter in (lambda: ad.get_tag_value("ParentClass"),
                   lambda: unreal.AssetRegistryHelpers.get_tag_value(ad, "ParentClass")[1]):
        try:
            v = getter()
            if v:
                return str(v)
        except Exception:
            continue
    return ""


def _blueprints_under(path):
    ar = unreal.AssetRegistryHelpers.get_asset_registry()
    out = []
    for ad in ar.get_assets_by_path(path, recursive=True):
        cls = getattr(ad, "asset_class_path", None)
        name = str(cls.asset_name) if cls is not None else str(getattr(ad, "asset_class", ""))
        if name == "Blueprint":
            out.append(ad)
    return out


def find_vehicle():
    """Returns (pawn_class, template_game_mode_class or None)."""
    for p in KNOWN_VEHICLE_PAWNS:
        if unreal.EditorAssetLibrary.does_asset_exist(p):
            pawn = unreal.EditorAssetLibrary.load_blueprint_class(p)
            if pawn:
                return pawn, _template_game_mode(p.rsplit("/Blueprints/", 1)[0])
    for ad in _blueprints_under("/Game"):
        if "WheeledVehiclePawn" in _parent_class(ad) and not str(ad.package_name).startswith(C.ASSET_ROOT):
            pawn = unreal.EditorAssetLibrary.load_blueprint_class(str(ad.package_name))
            if pawn:
                return pawn, _template_game_mode(str(ad.package_path).rsplit("/Blueprints", 1)[0])
    return None, None


def _template_game_mode(root):
    """The vehicle template's own GameMode sets the right PlayerController and input; reuse it when present."""
    for ad in _blueprints_under(root):
        if "GameMode" in _parent_class(ad):
            return unreal.EditorAssetLibrary.load_blueprint_class(str(ad.package_name))
    return None


def make_game_mode(name, pawn_class):
    path = f"{GM_FOLDER}/{name}"
    if not unreal.EditorAssetLibrary.does_asset_exist(path):
        C.ensure_folder(GM_FOLDER)
        f = unreal.BlueprintFactory()
        f.set_editor_property("parent_class", unreal.GameModeBase)
        unreal.AssetToolsHelpers.get_asset_tools().create_asset(name, GM_FOLDER, None, f)
    cls = unreal.EditorAssetLibrary.load_blueprint_class(path)
    unreal.get_default_object(cls).set_editor_property("default_pawn_class", pawn_class)
    unreal.EditorAssetLibrary.save_asset(path)
    return cls


def world_settings():
    world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    return world.get_world_settings()


def set_play_mode(mode):
    """'drive' or 'fly': sets this level's GameMode override."""
    path = f"{GM_FOLDER}/BP_CountyGameMode_Fly" if mode == "fly" else None
    if mode == "drive":
        pawn, template_gm = find_vehicle()
        if pawn is None:
            C.error("drive mode: no Chaos vehicle found. Add the Vehicle template content (README step 1), then re-run.")
            return False
        gm = template_gm or make_game_mode("BP_CountyGameMode_Drive", pawn)
        if template_gm is None:
            C.log(f"drive mode: pawn {pawn.get_name()} via BP_CountyGameMode_Drive")
        else:
            C.log(f"drive mode: using the vehicle template's own game mode {template_gm.get_name()} (its pawn, controller and input)")
    else:
        gm = make_game_mode("BP_CountyGameMode_Fly", unreal.DefaultPawn)
        C.log(f"fly mode: DefaultPawn free camera ({path}). WASD to move, mouse to look, E/Q up/down")
    ws = world_settings()
    ws.set_editor_property("default_game_mode", gm)
    C.save_all()
    return True


# ----------------------------------------------------------------------------- level content
def ensure_lighting():
    have = {cls.__name__: bool(C.all_actors_of(cls)) for cls in
            (unreal.DirectionalLight, unreal.SkyAtmosphere, unreal.SkyLight, unreal.ExponentialHeightFog)}
    C.clear_step("Lighting")
    added = []
    if not have["DirectionalLight"]:
        sun = C.spawn(unreal.DirectionalLight, unreal.Vector(0, 0, 100000), label="Sun", folder="CountyMap/Lighting", step_tag="Lighting")
        sun.set_actor_rotation(unreal.Rotator(roll=0.0, pitch=-38.0, yaw=-35.0), False)
        try:
            sun.light_component.set_editor_property("atmosphere_sun_light", True)
        except Exception:
            pass
        added.append("sun")
    if not have["SkyAtmosphere"]:
        C.spawn(unreal.SkyAtmosphere, unreal.Vector(0, 0, 0), label="SkyAtmosphere", folder="CountyMap/Lighting", step_tag="Lighting")
        added.append("sky atmosphere")
    if not have["SkyLight"]:
        sl = C.spawn(unreal.SkyLight, unreal.Vector(0, 0, 100000), label="SkyLight", folder="CountyMap/Lighting", step_tag="Lighting")
        try:
            sl.light_component.set_editor_property("real_time_capture", True)
        except Exception:
            pass
        added.append("sky light")
    if not have["ExponentialHeightFog"]:
        C.spawn(unreal.ExponentialHeightFog, unreal.Vector(0, 0, 0), label="HeightFog", folder="CountyMap/Lighting", step_tag="Lighting")
        added.append("height fog")
    for a in C._actors.get_all_level_actors():
        if "Lighting" in [str(t) for t in a.tags]:
            C.set_spatially_loaded(a, False)
    C.log("lighting: " + ("added " + ", ".join(added) if added else "level already has sun, sky, sky light and fog"))


def place_player_starts():
    starts = C.load_json("playable.json")["player_starts"]
    C.clear_step("PlayerStarts")
    if REMOVE_OTHER_PLAYERSTARTS:
        others = [a for a in C.all_actors_of(unreal.PlayerStart) if C.TAG not in [str(t) for t in a.tags]]
        for a in others:
            C._actors.destroy_actor(a)
        if others:
            C.log(f"player starts: removed {len(others)} template PlayerStart(s) that were not on a road")
    placed = 0
    for s in starts:
        if "error" in s:
            C.error(f"player start {s['town']}: {s['error']}")
            continue
        a = C.spawn(unreal.PlayerStart, unreal.Vector(*s["location"]), yaw=s["yaw_deg"], label=f"PlayerStart_{s['town']}",
                    folder="CountyMap/PlayerStarts", step_tag="PlayerStarts", extra_tags=[s["town"]])
        C.set_spatially_loaded(a, False)
        placed += 1
        C.log(f"player start {s['town']}: on {s['road'] or 'unnamed road'} ({s['road_class']}), "
              f"{s['snap_distance_m']} m from the '{s['landmark']}' landmark, facing along the road")
    if placed > 1:
        C.log("player starts: UE picks one of these at random on Play. To choose, right-click the road in the "
              "viewport > 'Play From Here', or delete the start you don't want.")
    return placed


def main():
    with C.Step("playable"):
        ensure_lighting()
        n = place_player_starts()
        drive = set_play_mode("drive")
        if not drive:
            C.warn("playable: falling back to fly mode so Play still works")
            set_play_mode("fly")
        make_game_mode("BP_CountyGameMode_Fly", unreal.DefaultPawn)   # always available for PlayMode_Fly.py
        C.log(f"playable: {n} PlayerStarts, mode = {'drive' if drive else 'fly'}. Press Play. "
              "While playing, open the console (~) and type ToggleDebugCamera for a free camera.")
        return n > 0


if __name__ == "__main__":
    main()
