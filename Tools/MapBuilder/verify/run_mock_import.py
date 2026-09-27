"""Run the UE import package end-to-end against verify/mock_unreal (a stand-in for the `unreal` module).
Checks Python errors, argument types, data consistency and re-run idempotency. It cannot prove the real
UE 5.6 API names exist. Usage: python verify/run_mock_import.py [1|0]  (1 = vehicle template present)
"""
import os
import runpy
import shutil
import sys

SP = os.path.dirname(os.path.abspath(__file__))                 # Tools/MapBuilder/verify
MB = os.path.dirname(SP)
sys.path.insert(0, os.path.join(SP, "mock_unreal"))
os.environ["MOCK_PROJECT"] = os.path.join(MB, "out", "verification", "mock_project")
os.environ["MOCK_VEHICLE"] = sys.argv[1] if len(sys.argv) > 1 else "1"
import unreal  # noqa: E402  (the mock)

PKG = os.path.join(os.environ["MOCK_PROJECT"], "CountyMap_Import")
shutil.rmtree(os.environ["MOCK_PROJECT"], ignore_errors=True)
shutil.copytree(os.path.join(MB, "ue_package", "Scripts"), os.path.join(PKG, "Scripts"))
with open(os.path.join(PKG, "MapDataPath.txt"), "w") as f:
    f.write("# comment line\n\n" + os.path.join(MB, "out", "ue") + "\n")
S = os.path.join(PKG, "Scripts")


def run(name):
    runpy.run_path(os.path.join(S, name), run_name="__main__")


def dump(title):
    errs = [m for lvl, m in unreal.LOG if lvl == "error"]
    print(f"\n==== {title}: {len(unreal.LOG)} log lines, {len(errs)} errors, level has {len(unreal.LEVEL)} actors")
    for lvl, m in unreal.LOG:
        if lvl != "info" or any(k in m for k in ("roads:", "water:", "bridges:", "buildings:", "trees:", "player start", "playable:", "summary", "landscape:", "lighting", "mode", "geo:")):
            print(f"  {lvl:5} {m[:230]}")
    unreal.LOG.clear()


run("ImportCountyMap.py")
dump("run 1 (no landscape yet)")

ls = unreal.LandscapeProxy()
import json  # noqa: E402
L = json.load(open(os.path.join(MB, "out", "ue", "landscape.json")))
ls._scale = unreal.Vector(*L["scale"])
ls.label = "Landscape"
unreal.LEVEL.append(ls)
run("ImportCountyMap.py")
dump("run 2 (landscape imported)")
n_after_full = len(unreal.LEVEL)

for step in ("02_Roads.py", "04_BridgesBuildings.py", "06_Playable.py"):
    run(step)
dump("re-run steps 2, 4, 6")
assert len(unreal.LEVEL) == n_after_full, f"re-run changed actor count {n_after_full} -> {len(unreal.LEVEL)}"
run("PlayMode_Fly.py"); run("PlayMode_Drive.py")
dump("play mode switches")
print("\nSTATS", dict(unreal.STATS))
print("actor count stable across re-runs:", n_after_full)
