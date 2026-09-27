# Unreal import (UE 5.6)

`stormchaser_import.py` builds the county map inside the editor from the files `mapbuilder.py ue_export` writes to `out/ue/`.
Priority order: **landscape tiles → road splines → water → bridges → buildings → trees → landmarks**.

## 0. One-time setup

1. **Plugins:** Python Editor Script Plugin, Editor Scripting Utilities, Water, PCG. Restart the editor.
2. **Level:** File → New Level → *Open World* (World Partition on). Delete the template landscape.
3. **Data:** copy `out/ue/` (and the `heightmap_x#_y#` tiles) to the machine, then either set the environment variable `SC_MAP_DATA` to that folder or edit `DATA_DIR` at the top of the script.
4. **Script path:** add `Tools/MapBuilder/ue` to *Project Settings → Plugins → Python → Additional Paths*.

## 1. Landscape (the one manual step)

UE 5.6 has no stable Python API for creating a sized landscape from a heightmap, so this step is done in the editor. The script prints the exact numbers from `landscape.json`:

```
import stormchaser_import as sc; sc.run(["landscape"])
```

Then go to *Landscape Mode → Manage → New → Import from File*, pick `heightmap_x0_y0.r16` (or `.png` from `ue_export --png`), and use the printed section size (127), sections per component (2x2), location and scale. Run the step again afterwards; it checks the imported landscape's scale against the manifest.

- **Tiled import:** the tiles are named `_x#_y#` and share edge vertices. **VERIFY-5.6** that the import dialog picks up the whole tile set.
- **Fallback:** import each tile as its own landscape at the `location_cm` listed for it in `landscape.json`. Heights match exactly at the seams.

## 2. Blueprint contracts

Create these once under `/Game/Stormchaser/Map/Blueprints/`. The script sets the listed variables (Instance Editable, exact names) **after** filling the spline, which reruns the construction script.

| Blueprint | Components | Variables | Construction script |
|---|---|---|---|
| `BP_RoadSpline` | `SplineComponent` | `RoadClass` (Name: Interstate/Highway/County/Town/Service/Track), `WidthM` (float), `Surface` (Name), `SpeedKph` (float), `IsBridge` (bool), `OneWay` (bool) | For each spline segment: *Add Spline Mesh Component*. Pick the mesh by `RoadClass` and `Surface` (asphalt 2-lane, gravel, dirt track). *Set Start and End* from spline locations and tangents, scale Y by `WidthM / MeshWidthM`, collision `BlockAll`, physical material by surface (grip, §8.10). Skip the ground-snap when `IsBridge` |
| `BP_Creek` | `SplineComponent` | `WidthM` | Spline meshes with a shallow water material; no collision |
| `BP_Bridge` | `SplineComponent` (2 points = deck ends) | `DeckWidthM`, `LengthM`, `Material` (Name), `Design` (Name), `YearBuilt` (int), `NbiId` (String) | Deck mesh along the spline; railing and span kit picked by `Material`/`Design` (concrete slab, steel girder, timber, truss) |
| `BP_Culvert` | Scene root | `LengthM`, `DeckWidthM`, `NbiId` | Culvert pipe/box under the road, oriented by actor yaw |
| `BP_Landmark` | Billboard (editor only) | `LandmarkName`, `LandmarkType`, `Area`, `Confidence` (all String/Name) | None. It is an anchor for hand-built hero art and mission markers |

If a Blueprint is missing, its step logs a warning and skips (landmarks fall back to plain `TargetPoint`s).

## 3. Run

```
import stormchaser_import as sc
sc.run(["roads"], limit=200)     # smoke test on a sample first
sc.run_all()                     # full import (long: tens of thousands of actors; progress dialog can cancel)
```

- Re-running a step deletes only the actors that step spawned before (tag `SC_Import` + step tag), never hand-placed work.
- Packages are saved every 1,000 actors and at the end or cancel of each step.
- Outliner folders: `Map/Roads/<class>`, `Map/Water/...`, `Map/Bridges/...`, `Map/Buildings/<8 km cell>`, `Map/Landmarks/<town>`.

## 4. Trees (lidar → PCG)

1. Create a struct `S_TreePoint` with fields `X`, `Y`, `Z`, `HeightM`, `CrownRadiusM` (float), and a DataTable `DT_TreePoints` using it.
2. `sc.run(["trees"])` fills the table from `trees.csv`, one row per lidar tree.
3. PCG graph `PCG_LidarTrees`: *Get Data Table Row* / *Load Data Table* → points at (X, Y, Z), scale by `HeightM` → *Static Mesh Spawner* with the regional species set. Forest interiors not yet covered by processed lidar tiles use an NLCD density PCG graph.

## 5. Landmarks

Landmarks with `approximate` coordinates are tagged `NeedsAerialPin`. Filter by that tag in the Outliner and nudge each one against aerial imagery before building hero art on it.

## Known limits (V1)

- Buildings are **blockout massing** (a scaled cube per footprint, height from Microsoft or a 3 m / 5.5 m fallback tagged `HeightGuessed`). The destructible kit and PCG shape grammar replace them later (TDD §3, §8.3).
- River width per spline point is set through the water spline metadata (**VERIFY-5.6**). If that property path differs, the script warns and the width is set by hand on the few large rivers.
- Road splines are spline meshes laid on the lidar terrain, so road beds are already in the heightmap and no landscape flattening is needed. Use Landscape Patch later where a mesh needs a cleaner bed.
