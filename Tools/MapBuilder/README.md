# MapBuilder

Builds the STORMCHASER real-world map data (see `docs/stormchaser/STORMCHASER_TDD.md` §8).

```
pip install numpy pyproj tifffile pillow scipy "laspy[lazrs]"
python3 mapbuilder.py init --lat <lat> --lon <lon> [--tiles-x 6 --tiles-y 6 --shift-east-m .. --shift-north-m ..]   # writes location.local.json (git-ignored)
python3 mapbuilder.py all
```

Outputs land in `out/` (git-ignored):
- `heightmap_x#_y#.r16` + `map_manifest.json`: 6×6 landscape tiles (4065 px, 2 m, shared edges, one Z scale) for World Partition tiled import, with scale and Z location from the manifest
- `preview_hillshade.png`: a quick look at the terrain
- `osm_local.json` / `osm_summary.json`: roads, buildings, water, power and rail in local meters (+X east, +Y north)
- `climate_calibration.json`: local SPC tornado climatology for `DA_Climate`
- `lidar_objects_<x>_<y>_<size>.json` + `lidar_preview_*.png`: every tree (x, y, height, crown radius) and building (footprint, height, eave, roof) in a tile (`mapbuilder.py lidar --offset-x .. --offset-y .. --size-m 2000`)

Never commit `location.local.json`, `cache/` or `out/`. They hold or derive from the real home location.
Data: USGS 3DEP and NOAA SPC are public domain. OpenStreetMap is ODbL, so the credits must attribute it.
