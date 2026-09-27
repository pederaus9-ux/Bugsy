# MapBuilder

Builds the STORMCHASER real-world map data (see `docs/stormchaser/STORMCHASER_TDD.md` §8).

```
pip install numpy pyproj tifffile pillow
python3 mapbuilder.py init --lat <center lat> --lon <center lon>   # writes location.local.json (git-ignored)
python3 mapbuilder.py all
```

Outputs land in `out/` (git-ignored):
- `heightmap_8129.r16` + `map_manifest.json`: import as a World Partition Landscape with the scale and Z location from the manifest
- `preview_hillshade.png`: a quick look at the terrain
- `osm_local.json` / `osm_summary.json`: roads, buildings, water, power and rail in local meters (+X east, +Y north)
- `climate_calibration.json`: local SPC tornado climatology for `DA_Climate`

Never commit `location.local.json`, `cache/` or `out/`. They hold or derive from the real home location.
Data: USGS 3DEP and NOAA SPC are public domain. OpenStreetMap is ODbL, so the credits must attribute it.
