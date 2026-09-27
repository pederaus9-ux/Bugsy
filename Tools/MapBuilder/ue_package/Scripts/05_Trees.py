"""Step 5: trees. Instanced forest scatter (OSM woods plus the steep wooded coulee walls, minus roads,
buildings and water), one HISM per 8 km cell, no collision, culled at 1.5 km.

Re-runnable: previous tree actors are replaced. Density is set at export time:
`mapbuilder.py ue_export --tree-spacing 30` gives fewer trees and more fps.
"""
import importlib.util
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

_spec = importlib.util.spec_from_file_location("bb_step", os.path.join(os.path.dirname(os.path.abspath(__file__)), "04_BridgesBuildings.py"))
_bb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bb)

TREES_BUDGET = 3_000_000


def main():
    with C.Step("trees"):
        man, n, a = _bb.instance_step("Tree", "Trees", "Tree")
        st = man["stats"]["trees"]
        C.log(f"trees: {st['forest_km2']:,} km² of forest at {st['tree_spacing_m']} m spacing -> {n:,} instances "
              f"in {a} HISM actors (no collision, culled at {C.CULL_M['Tree']} m)")
        if n > TREES_BUDGET:
            C.perf_warn(f"{n:,} trees (> {TREES_BUDGET:,}). Re-export with a larger --tree-spacing if fps drops.")
        C.log("trees: tree cells stream with World Partition. If trees pop in close to the car, raise "
              "World Settings > World Partition > Runtime Grids > Loading Range to 200000 (2 km).")
        return True


if __name__ == "__main__":
    main()
