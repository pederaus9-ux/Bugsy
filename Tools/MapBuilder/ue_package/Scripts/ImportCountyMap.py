"""Master import: runs every step in order and logs a summary.

    1 landscape -> 2 roads -> 3 water -> 4 bridges + buildings -> 5 trees -> 6 playable

Run from the editor: Tools > Execute Python Script... > ImportCountyMap.py
Or from the Output Log (Python):  py "<path>/ImportCountyMap.py"

The first run stops after step 1 if the landscape has not been imported yet; it prints the exact import
settings. Import the landscape (README step 4c) and run this again. Every step is safe to re-run.
Full log: <Project>/Saved/Logs/CountyMapImport.log
"""
import importlib.util
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sc_common as C   # noqa: E402

STEPS = ["01_Landscape.py", "02_Roads.py", "03_Water.py", "04_BridgesBuildings.py", "05_Trees.py", "06_Playable.py"]


def load_step(filename):
    spec = importlib.util.spec_from_file_location(filename[:-3].lower(), os.path.join(HERE, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def run(steps=STEPS):
    t0 = time.time()
    C.log(f"County map import started. Data: {C.data_dir()}")
    man = C.manifest()
    g = man["geo"]
    C.log(f"geo: origin {g['origin_lat']}, {g['origin_lon']} = UE (0,0); {g['axes']}")
    for w in man.get("perf_warnings", []):
        C.perf_warn(w)
    results = {}
    for s in steps:
        try:
            ok = load_step(s).main()
        except Exception as e:     # a failing step is logged with its cause and the run continues where it can
            C.error(f"{s}: {type(e).__name__}: {e}")
            ok = False
        results[s] = ok
        if s == "01_Landscape.py" and not ok:
            C.warn("Stopping here: import the landscape first (README step 4c), then run ImportCountyMap.py again.")
            break
    C.log("summary: " + ", ".join(f"{k[:-3]}={'OK' if v else 'FAILED/STOPPED'}" for k, v in results.items())
          + f"  ({time.time() - t0:.0f}s)")
    if all(results.get(s) for s in STEPS):
        C.log("All steps done. Press Play.")
    return results


if __name__ == "__main__":
    run()
