"""Step 1: landscape. Checks the heightmap tiles, prints the exact import settings, then validates the imported
landscape and gives it a material. Heightmap import itself is one dialog (README step 4c), because UE 5.6 has
no stable Python call that creates a sized landscape from a heightmap.

Re-runnable: validation and material assignment can be repeated any time.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

import unreal           # noqa: E402


def landscape_material():
    path = f"{C.ASSET_ROOT}/Materials/M_Landscape"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        return unreal.load_asset(path)
    C.ensure_folder(f"{C.ASSET_ROOT}/Materials")
    mel = unreal.MaterialEditingLibrary
    mat = unreal.AssetToolsHelpers.get_asset_tools().create_asset("M_Landscape", f"{C.ASSET_ROOT}/Materials",
                                                                  unreal.Material, unreal.MaterialFactoryNew())
    # grass on flat ground, bare soil on steep coulee walls: lerp by the world-space normal's Z
    grass = mel.create_material_expression(mat, unreal.MaterialExpressionConstant3Vector, -700, -100)
    grass.set_editor_property("constant", unreal.LinearColor(0.10, 0.17, 0.05, 1))
    soil = mel.create_material_expression(mat, unreal.MaterialExpressionConstant3Vector, -700, 50)
    soil.set_editor_property("constant", unreal.LinearColor(0.20, 0.15, 0.10, 1))
    nrm = mel.create_material_expression(mat, unreal.MaterialExpressionVertexNormalWS, -900, 250)
    mask = mel.create_material_expression(mat, unreal.MaterialExpressionComponentMask, -700, 250)
    for ch, on in (("r", False), ("g", False), ("b", True), ("a", False)):
        mask.set_editor_property(ch, on)
    mel.connect_material_expressions(nrm, "", mask, "")
    exp = mel.create_material_expression(mat, unreal.MaterialExpressionConstant, -700, 400)
    exp.set_editor_property("r", 8.0)
    pw = mel.create_material_expression(mat, unreal.MaterialExpressionPower, -500, 250)
    mel.connect_material_expressions(mask, "", pw, "Base")
    mel.connect_material_expressions(exp, "", pw, "Exp")
    lerp = mel.create_material_expression(mat, unreal.MaterialExpressionLinearInterpolate, -300, 0)
    mel.connect_material_expressions(soil, "", lerp, "A")
    mel.connect_material_expressions(grass, "", lerp, "B")
    mel.connect_material_expressions(pw, "", lerp, "Alpha")
    mel.connect_material_property(lerp, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rough = mel.create_material_expression(mat, unreal.MaterialExpressionConstant, -300, 200)
    rough.set_editor_property("r", 0.95)
    mel.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    mel.recompile_material(mat)
    unreal.EditorAssetLibrary.save_loaded_asset(mat)
    return mat


def print_import_settings(L, tiles_dir):
    first = os.path.join(tiles_dir, L["tile_files"][0]["file_r16"])
    sx, sy, sz = L["scale"]
    C.log("---- Landscape import settings (README step 4c) ----")
    C.log(f"Heightmap file : {first}")
    C.log(f"Tiles          : {L['tiles'][0]} x {L['tiles'][1]} tiles of {L['tile_px']} x {L['tile_px']} px (named _x#_y#, edges shared)")
    C.log("Section size   : 127x127 quads | Sections per component: 2x2 | "
          f"Components per tile: {L['components_per_tile'][0]} x {L['components_per_tile'][1]}")
    C.log(f"Location (cm)  : X={L['location_cm'][0]}  Y={L['location_cm'][1]}  Z={L['location_cm'][2]}")
    C.log(f"Scale          : X={sx}  Y={sy}  Z={sz}")


def main():
    with C.Step("landscape"):
        L = C.load_json("landscape.json")
        tiles_dir = C.data_dir()                                 # road-carved tiles: out/ue/terrain/
        missing = [t["file_r16"] for t in L["tile_files"] if not os.path.exists(os.path.join(tiles_dir, t["file_r16"]))]
        C.log(f"landscape: {len(L['tile_files']) - len(missing)}/{len(L['tile_files'])} heightmap tiles found in {tiles_dir}")
        if missing:
            C.error(f"missing tiles: {', '.join(missing)}. Re-run `mapbuilder.py ue_export` (README step 3).")
            return False
        print_import_settings(L, tiles_dir)
        verts = L["vertices"]
        C.log(f"landscape: {verts:,} vertices total ({L['extent_cm'][0] / 100000:.1f} x {L['extent_cm'][1] / 100000:.1f} km)")

        proxies = C.all_actors_of(unreal.LandscapeProxy)
        if not proxies:
            C.warn("landscape: NOT IMPORTED YET. Do README step 4c (Landscape Mode > Manage > Import) with the settings "
                   "above, then run ImportCountyMap.py again.")
            return False

        mat = landscape_material()
        sx, sy, sz = L["scale"]
        ok_all, nanite_on = True, 0
        for p in proxies:
            s = p.get_actor_scale3d()
            ok = abs(s.x - sx) < 0.01 and abs(s.y - sy) < 0.01 and abs(s.z - sz) < 0.01
            ok_all &= ok
            if not ok:
                C.error(f"landscape '{p.get_actor_label()}': scale {s.x:.3f}, {s.y:.3f}, {s.z:.4f} but expected "
                        f"{sx}, {sy}, {sz}. Roads and buildings will float or sink. Re-import with the printed scale.")
            try:
                p.set_editor_property("landscape_material", mat)
            except Exception as e:
                C.warn(f"landscape: could not assign material ({e})")
            for prop in ("enable_nanite", "b_enable_nanite"):
                try:
                    p.set_editor_property(prop, True)
                    nanite_on += 1
                    break
                except Exception:
                    continue
        C.log(f"landscape: {len(proxies)} landscape actors found, scale {'OK' if ok_all else 'WRONG'}, material assigned")
        if nanite_on < len(proxies):
            C.perf_warn(f"Nanite could not be switched on for {len(proxies) - nanite_on} landscape actor(s). With "
                        f"{verts:,} vertices, turn on 'Enable Nanite' in the landscape Details panel for 60 fps.")
        C.save_all()
        return ok_all


if __name__ == "__main__":
    main()
