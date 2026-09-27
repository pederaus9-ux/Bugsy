"""Step 3: water. Lakes, ponds and river areas as flat merged meshes on the hydro-flattened water surface;
streams as ribbons. One mesh per water class (Lake / River / Stream) per 8 km cell.

Re-runnable: previous water actors and generated water meshes are replaced.
"""
import importlib.util
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sc_common as C   # noqa: E402

_spec = importlib.util.spec_from_file_location("roads_step", os.path.join(os.path.dirname(os.path.abspath(__file__)), "02_Roads.py"))
_roads = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_roads)


def main():
    with C.Step("water"):
        res = _roads.build_layer("Water", "Water", f"{C.ASSET_ROOT}/Generated/Water")
        if res is None:
            return False
        man, built, tris, per_class = res
        st = man["stats"]["water"]
        C.log(f"water: {st['lakes']:,} lakes/ponds + {st['river_areas']:,} river areas + {st['streams']:,} streams "
              f"({st['stream_km']:,} km) -> {built} merged meshes, {tris:,} triangles")
        C.log("water: meshes per class: " + ", ".join(f"{k} {v}" for k, v in sorted(per_class.items())))
        C.log("water: V1 water is an opaque glossy surface (cheap). Swap M_Water for a translucent or Water-plugin "
              "material later; translucency over large areas costs GPU time, so check fps when you do.")
        return True


if __name__ == "__main__":
    main()
