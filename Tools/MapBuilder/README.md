# MapBuilder

Builds the STORMCHASER real-world map data (see `docs/stormchaser/STORMCHASER_TDD.md` §8).

```
pip install numpy pyproj tifffile pillow scipy "laspy[lazrs]"
python3 mapbuilder.py init --lat <lat> --lon <lon> --tiles-x 3 --tiles-y 3 --tile-quads 8128 [--shift-east-m .. --shift-north-m ..]   # writes location.local.json (git-ignored)
python3 mapbuilder.py all
```

Outputs land in `out/` (git-ignored):
- `heightmap_x#_y#.r16` + `map_manifest.json`: landscape tiles (8129 px with `--tile-quads 8128`, or 4065 px; 2 m; shared edges; one Z scale) for World Partition tiled import, with scale and Z location from the manifest
- `preview_hillshade.png`: a quick look at the terrain
- `osm_local.json` / `osm_summary.json`: roads, buildings, water, power and rail in local meters (+X east, +Y north)
- `water_nhd_local.json`: USGS NHD streams, rivers, lakes
- `bridges_nbi_local.json`: National Bridge Inventory bridges with length, width, spans, material, design
- `buildings_ms_local.json`: Microsoft building footprints with height estimates
- `preview_map.png`: everything drawn over the terrain for a visual check
- `climate_calibration.json`: local SPC tornado climatology for `DA_Climate`
- `lidar_objects_<x>_<y>_<size>.json` + `lidar_preview_*.png`: every tree (x, y, height, crown radius) and building (footprint, height, eave, roof) in a tile (`mapbuilder.py lidar --offset-x .. --offset-y .. --size-m 2000`)

Never commit `location.local.json`, `cache/` or `out/`. They hold or derive from the real home location.
Data: USGS (3DEP, NHD), NOAA SPC and FHWA/BTS NBI are public domain. OpenStreetMap is ODbL (credit "© OpenStreetMap contributors"). Microsoft building footprints are CDLA Permissive 2.0 (attribute Microsoft/Bing). Do not use Google Earth/Street View, and do not ship on Cesium ion.
