"""Step 4: bridges and buildings as hierarchical instanced static meshes (HISM), one actor per kind per
8 km cell. Buildings are V1 massing blocks (footprint rectangle x height); bridge decks are solid slabs with
collision so the car can cross rivers.

Re-runnable: previous bridge/building actors are replaced.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

import unreal           # noqa: E402

INSTANCES_PER_CELL_BUDGET = 250_000


def instance_step(kind, step_tag, material_name):
    man = C.manifest()
    groups = [i for i in man["instances"] if i["kind"] == kind]
    C.clear_step(step_tag)
    mat = C.material(material_name)
    total, actors = 0, 0
    with unreal.ScopedSlowTask(len(groups), f"County map: {step_tag}") as task:
        task.make_dialog(True)
        for g in groups:
            if task.should_cancel():
                C.warn(f"{step_tag}: cancelled after {actors} of {len(groups)} cells")
                break
            task.enter_progress_frame(1, f"{g['name']} ({g['count']:,} instances)")
            rows = C.read_instances_bin(os.path.join(C.data_dir(), "instances", g["name"] + ".bin"))
            _, n = C.spawn_hism(kind, rows, g["cell"], mat, step_tag)
            total += n
            actors += 1
            if n > INSTANCES_PER_CELL_BUDGET:
                C.perf_warn(f"{g['name']}: {n:,} instances in one cell (> {INSTANCES_PER_CELL_BUDGET:,}).")
    C.save_all()
    return man, total, actors


def main():
    with C.Step("bridges + buildings"):
        man, nb, ab = instance_step("Bridge", "Bridges", "Bridge")
        bs = man["stats"]["bridges"]
        C.log(f"bridges: {bs['osm_decks']} OSM decks ({bs.get('osm_foot_bridges_3m', 0)} of them 3 m foot/cycle bridges) + "
              f"{bs['nbi_short_spans']} inventory short spans -> {nb:,} instances in {ab} HISM actors (collision on)")
        man, n, a = instance_step("Building", "Buildings", "Building")
        st = man["stats"]["buildings"]
        C.log(f"buildings: {st['buildings']:,} footprints -> {n:,} instances in {a} HISM actors "
              f"({st['height_guessed']:,} with a fallback height)")
        return True


if __name__ == "__main__":
    main()
