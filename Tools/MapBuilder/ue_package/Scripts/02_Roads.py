"""Step 2: roads. Merged road meshes, one static mesh per road class per 8 km cell (not one actor per road).

MapBuilder carves the heightmap to the roads at export (like landscape splines), so each road ribbon sits
about 4 cm above the landscape and the car drives on the landscape at road height. Road meshes need no
collision, which saves about 1 GB of physics memory. Water has no collision. Bridge decks get collision in step 4.
Re-runnable: previous road actors and generated road meshes are replaced.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

import unreal           # noqa: E402

ROAD_TRIS_BUDGET = 12_000_000


def build_layer(layer, step_tag, asset_folder, collision=False):
    """Shared by roads and water: build every merged chunk of `layer` from the manifest."""
    man = C.manifest()
    chunks = [m for m in man["meshes"] if m["layer"] == layer]
    if not C.geometry_script_ok():
        C.error(f"{step_tag}: Geometry Script plugin missing. Enable Edit > Plugins > 'Geometry Script', restart, re-run.")
        return None
    C.clear_step(step_tag)
    C.ensure_folder(asset_folder)
    mats = {}
    built, tris, per_class = 0, 0, {}
    with unreal.ScopedSlowTask(len(chunks), f"County map: {step_tag}") as task:
        task.make_dialog(True)
        for m in chunks:
            if task.should_cancel():
                C.warn(f"{step_tag}: cancelled after {built} of {len(chunks)} meshes")
                break
            task.enter_progress_frame(1, f"{m['name']} ({m['tris']:,} tris)")
            mat = mats.get(m["material"]) or mats.setdefault(m["material"], C.material(m["material"]))
            mesh, nt = C.build_static_mesh(os.path.join(C.data_dir(), "meshes", m["name"] + ".bin"),
                                           f"{asset_folder}/SM_{m['name']}", mat, nanite=True, collision=collision)
            C.place_mesh_actor(mesh, m["pivot_cm"], label=m["name"], folder=f"CountyMap/{step_tag}/{m['class']}",
                               step_tag=step_tag, collision=collision)
            built += 1
            tris += nt
            per_class[m["class"]] = per_class.get(m["class"], 0) + 1
    C.save_all()
    return man, built, tris, per_class


def main():
    with C.Step("roads"):
        res = build_layer("Road", "Roads", f"{C.ASSET_ROOT}/Generated/Roads", collision=False)
        if res is None:
            return False
        man, built, tris, per_class = res
        st = man["stats"]["roads"]
        C.log(f"roads: {st['ways']:,} ways ({st['km']:,} km) -> {built} merged meshes, {tris:,} triangles "
              "(no collision: the car drives on the road-shaped landscape)")
        C.log("roads: meshes per class: " + ", ".join(f"{k} {v}" for k, v in sorted(per_class.items())))
        C.log(f"roads: {st['skipped']:,} non-drivable ways skipped (footpaths, cycleways, parking aisles)")
        if "carved_vertices" in st:
            C.log(f"roads: terrain carved under roads at export ({st['carved_vertices']:,} vertices set, "
                  f"{st['lowered_bank_vertices']:,} bank vertices lowered); road sits a median "
                  f"{st['fit_median_lift_cm']} cm above it, terrain shows through {st['fit_terrain_through_road_pct']}% of road surface")
        if tris > ROAD_TRIS_BUDGET:
            C.perf_warn(f"roads total {tris:,} triangles (> {ROAD_TRIS_BUDGET:,}). Nanite is on, so this is OK on an "
                        "RTX 5060 Ti; if Nanite is off in your project, expect frame drops.")
        return True


if __name__ == "__main__":
    main()
