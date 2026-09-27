# County Map Import for Unreal Engine 5.6

This package turns the MapBuilder data into a drivable Unreal level: real terrain, real roads, rivers and lakes, every bridge and building, forests, and a car parked on Main Street when you press Play.

```
CountyMap_Import/
  Scripts/ImportCountyMap.py     master script: runs every step below in order
  Scripts/01_Landscape.py        step 1  landscape check + material
  Scripts/02_Roads.py            step 2  merged road meshes
  Scripts/03_Water.py            step 3  lakes, river areas, streams
  Scripts/04_BridgesBuildings.py step 4  bridges + buildings (instanced)
  Scripts/05_Trees.py            step 5  forest (instanced)
  Scripts/06_Playable.py         step 6  sky, car, fly camera, PlayerStarts
  Scripts/PlayMode_Drive.py      switch to driving
  Scripts/PlayMode_Fly.py        switch to the free camera
  Scripts/sc_common.py           shared helpers (don't run this one)
  Data/                          landmark list used for the PlayerStarts
  MapDataPath.txt                one line: where MapBuilder put its export
  Docs/README.md                 this file
```

The terrain files (about 1.2 GB) are **not** in the zip. MapBuilder makes them on your PC in step 3.

---

## Setup (about 1–2 hours, mostly downloads)

### 1. Make the project

1. Open the **Epic Games Launcher → Unreal Engine → Library** and launch **5.6**.
2. In the project browser, choose **Games → Vehicle**, **Blueprint**, then name the project (for example `CountyMap`) and click **Create**. The Vehicle template gives you a ready-made Chaos car; everything else starts blank.
   *Already made a Blank project?* In the Content Browser click **+ Add → Add Feature or Content Pack → Vehicle**, then **Add to Project**.
3. World Partition is switched on by the level you create in step 4a. Nothing to do here.

### 2. Turn on the plugins

1. **Edit → Plugins**. Search for and tick each of these:
   - **Python Editor Script Plugin**
   - **Editor Scripting Utilities** (it may already be on)
   - **Geometry Script** (it builds the road and water meshes)
2. Click **Restart Now**.

### 3. Unzip, then build the map data with MapBuilder

1. Unzip `CountyMap_Import.zip` into your project folder, so you get `…/CountyMap/CountyMap_Import/Scripts/…`.
2. Install **Python 3.11 or newer** from python.org (tick *Add python.exe to PATH* in the installer).
3. Open a terminal in your copy of the repo's `Tools/MapBuilder` folder and run these commands one at a time:

   ```
   pip install -r requirements.txt
   {{INIT_CMD}}
   python mapbuilder.py all
   python mapbuilder.py ue_export --landmarks "<path to>/CountyMap_Import/Data/storm-chaser-landmarks.md"
   ```

   The `all` step downloads terrain, roads, water, bridges and buildings (30–60 minutes the first time; later runs reuse the cache). The last line prints the counts and any performance warnings.
4. Open `CountyMap_Import/MapDataPath.txt` in Notepad and put the **full path** of `Tools/MapBuilder/out/ue` on its own line, for example `C:\Users\you\Bugsy\Tools\MapBuilder\out\ue`. Save.

### 4. Import into Unreal

**4a. Make the level.** **File → New Level → Empty Open World → Create**, then **File → Save Current Level As…** `CountyMap` in a new folder `Content/CountyMap/Maps`.

**4b. First run: it tells you the landscape settings.** **Tools → Execute Python Script…** and pick `CountyMap_Import/Scripts/ImportCountyMap.py`. The first run stops after step 1 and prints the exact landscape import settings in the **Output Log** (Window → Output Log). They are also listed in the next step.

**4c. Import the landscape (the one manual step).**
1. Press **Shift+2** for Landscape Mode, open the **Manage** tab, then **New**.
2. Choose **Import from File**. For **Heightmap File**, pick `Tools/MapBuilder/out/heightmap_x0_y0.r16`. The `_x0_y0` name tells Unreal it is a set of tiles.
3. Set **Section Size** `127x127 Quads` and **Sections Per Component** `2x2 Sections`.
4. Set **Location** and **Scale** exactly as below:

   | | X | Y | Z |
   |---|---|---|---|
   | Location | {{LAND_LOC_X}} | {{LAND_LOC_Y}} | {{LAND_LOC_Z}} |
   | Scale | {{LAND_SCALE_X}} | {{LAND_SCALE_Y}} | {{LAND_SCALE_Z}} |

5. Click **Import** and wait. It is a big landscape, so this takes several minutes.
6. Select the landscape, tick **Enable Nanite** in the Details panel, then save (**Ctrl+Shift+S**).

**4d. Second run: build the whole map.** Run `ImportCountyMap.py` again. It runs all six steps, showing a progress bar for each and writing a log line with counts (for example `roads: … ways -> … merged meshes`). Expect 15–40 minutes. Save when it finishes.

### 5. Press Play

Click **Play** on the toolbar. You start in the car on a real road in {{START_TOWNS}}, facing along the road.

- **Drive:** W/S throttle and brake, A/D steer (the Vehicle template controls; a gamepad works too).
- **Free camera while playing:** press `~` to open the console, type `ToggleDebugCamera` and press Enter. Do the same again to go back to the car.
- **Fly mode instead of the car:** run `Scripts/PlayMode_Fly.py`, then Play. `PlayMode_Drive.py` switches back.
- **Pick where you start:** right-click any road in the viewport, then **Play From Here**.

---

## Geo → Unreal coordinate mapping

| Item | Value |
|---|---|
| Map origin (Unreal 0, 0) | lat **{{ORIGIN_LAT}}**, lon **{{ORIGIN_LON}}** |
| Projection | {{EPSG}} (UTM, metres). Origin easting {{E0}} m, northing {{N0}} m |
| Unreal units | 1 uu = 1 cm |
| Axes | **+X = east, +Y = south, +Z = up** (GIS north is flipped because Unreal is left-handed). Yaw 0° faces east, 90° faces south |
| Height | Z = (elevation − {{ELEV_MIN}} m) × 100. The lowest point on the map is Z = 0; the highest is {{ELEV_MAX}} m above sea level |
| Map extent | {{EXTENT}} square, from X,Y = {{LAND_LOC_X}}, {{LAND_LOC_Y}} to {{LAND_MAX_X}}, {{LAND_MAX_Y}} (cm) |

```
X_cm = (easting_m  - {{E0}}) * 100
Y_cm = -(northing_m - {{N0}}) * 100
Z_cm = (elevation_m - {{ELEV_MIN}}) * 100
```

Worked example: {{EXAMPLE}}

To convert a lat/lon yourself, project it to {{EPSG}} (for example with `pyproj` or epsg.io), then apply the formulas above. MapBuilder does this for every layer.

---

## What each step makes

{{COUNTS_TABLE}}

**Performance (target 60 fps on an RTX 5060 Ti with 32 GB RAM):**
- Roads and water are a few hundred merged Nanite meshes, not thousands of actors.
- Buildings, bridges and trees are hierarchical instanced meshes (HISM), one actor per 8 km cell. Trees have no collision and are culled beyond 1.5 km.
- Roads, water, bridges and buildings stay loaded (no pop-in). Trees stream with World Partition.
- Warnings from this export: {{PERF_WARNINGS}}

Every step logs a line starting with `PERF:` if it goes over budget. If fps is low, work through **Low fps** in Troubleshooting.

---

## Iterating: import → drive → report → fix → reimport

- Every step can be re-run on its own (**Tools → Execute Python Script…** → the step's file). It removes only what it created last time (actors tagged `CountyMapImport`) and never touches anything you placed by hand.
- To report a bug, send:
  1. `<Project>/Saved/Logs/CountyMapImport.log`
  2. what you saw
  3. where it was: press `~`, type `stat unit` for fps; the car's X/Y from the Details panel converts back to a real place with the mapping above

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `MapBuilder export not found` | `MapDataPath.txt` must contain the full path to `Tools/MapBuilder/out/ue`, the folder that holds `manifest.json` (step 3.4) |
| The run stops after `landscape` | Expected on the first run. Import the landscape (step 4c), then run again |
| `landscape … scale … but expected …` | The landscape was imported with the wrong scale. Delete it and re-import with the table in 4c. If you don't, roads and buildings float or sink |
| The import dialog doesn't pick up all tiles, or the editor runs out of memory while importing | Use the lighter terrain: re-run MapBuilder with `init … --res 6 --tile-quads 4064` (same county, 9 smaller tiles), then `all` and `ue_export` again |
| `Geometry Script plugin missing` | Step 2: enable **Geometry Script**, restart, re-run `02_Roads.py` and `03_Water.py` |
| `SubobjectDataSubsystem refused the HISM component` | The instancing step couldn't add its component. Send the log; roads, water and the car still work |
| `drive mode: no Chaos vehicle found` | Add the Vehicle template content (step 1). Until then the script falls back to fly mode so Play still works |
| The car doesn't respond to keys | Click inside the game viewport once. If that doesn't help, re-run `PlayMode_Drive.py`: it uses the Vehicle template's own game mode, which sets up the input |
| The car falls through the ground at the start | The landscape isn't loaded where the start is: open **Window → World Partition** and load the whole map once, or check the landscape Location Z in 4c |
| Roads flicker where two roads overlap | Two ribbons meet at the same height. Higher road classes sit 1 cm higher; send the location if it's distracting |
| Trees pop in close to the car | **World Settings → World Partition Setup → Runtime Grids → Loading Range**: set `200000` (2 km) |
| Low fps | 1. Landscape **Enable Nanite** on (step 4c.6). 2. Re-export with fewer trees (`ue_export --tree-spacing 32`) and re-run `05_Trees.py`. 3. **Settings → Engine Scalability → High** instead of Epic. 4. `stat unit` shows whether the GPU or the game thread is the limit |
| A step failed in the middle | Fix the cause shown in the log and re-run just that step; it cleans up after itself |

---

## Data and licences

- Terrain: USGS 3DEP (public domain). Water: USGS NHD (public domain). Bridges: FHWA National Bridge Inventory via BTS NTAD (public domain).
- Roads and places: © OpenStreetMap contributors, ODbL. **This credit must appear in the game.**
- Buildings: © Microsoft (GlobalMLBuildingFootprints), CDLA Permissive 2.0. **Attribute in the credits.**
