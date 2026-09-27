# MapData / Phase 1 — terrain and map data for the GodsCountry Unreal project

Start with **HANDOFF_PHASE1.txt**: map facts, Unreal landscape import settings, coordinate conversion, steps and checks.

- `ue_export/terrain/` — the 9 road-carved terrain tiles to import (16-bit PNG, 8129 px, 3 m/px)
- `terrain_original/` — the same tiles before road carving
- `ue_export/` — Unreal-ready data (cm): settings, PlayerStarts, landmarks, prebuilt road/water meshes and instances
- `data/geojson/` — roads, water, bridges, buildings, places as WGS84 GeoJSON
- `data/local/`, `data/raw/` — pipeline intermediates and raw downloads (provenance)
- `preview/`, `docs/`, `import_package/`, `verification/`, `config/`
- `FILES.txt` — every file with its size · `CHECKSUMS.txt` — sha256 of the terrain PNGs

Everything here is produced by `Tools/MapBuilder` (see its README). Data licences: USGS, NOAA, FHWA/BTS = public domain;
roads/places © OpenStreetMap contributors (ODbL, credit required); buildings © Microsoft GlobalMLBuildingFootprints (CDLA Permissive 2.0).
