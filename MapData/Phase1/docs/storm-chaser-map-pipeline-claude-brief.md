# Storm Chaser Game — Trempealeau County Map Pipeline (Claude Builder Brief)

Paste this to Claude, then say: "Build the map following this pipeline."

## Project context

PC storm-chasing game on **Unreal Engine 5.6**, commercial release. The game map is **Trempealeau County, Wisconsin, USA** — a real rural county (towns: Whitehall (county seat), Arcadia, Independence, Blair, Ettrick, Osseo). The map must be realistic and drivable: correct terrain, real road layout, real waterways, real building placement, plus hand-crafted local landmarks as easter eggs.

**Strategy: 90/10.** Auto-generate the 90% that is verifiable-but-generic (terrain, roads, water, building masses, procedural trees). Hand-craft the 10% players actually recognize (water towers, Kwik Trip signs, schools, Main Street storefronts, known bridges). Players check "that's Highway 53" — they never verify individual trees.

**Hard rule: the shipped game must be fully self-contained.** Do NOT build the map on Cesium ion streaming (see Licensing Gotchas — its commercial terms are hostile to shipped games). All data below is downloaded once and baked into the build.

## Working rules

1. Verify each dataset download exists before building on it (see Open Questions — a few items need a 2-minute check).
2. Work the pipeline in order, one step at a time. Confirm each step's output before moving on.
3. Respect every license below. When in doubt, attribute.
4. UE5.6 only. If a tool/plugin version doesn't support 5.6, say so instead of forcing it.
5. Coordinate system: pick one meter-based CRS in QGIS/GDAL at step 1 and keep it through every step.

---

## DATA SOURCES

### 1. Terrain — USGS 3DEP 1 m DEM ✅ Available
- **Coverage:** YES for Trempealeau County. USGS states quality level 2 or better lidar is available across Wisconsin, which supports the standard 1 m DEM product statewide. (Spot-check tile completeness in the downloader — see Open Questions.)
- **Download:** The National Map Downloader — https://www.usgs.gov/the-national-map-data-delivery/gis-data-download (also via USGS LidarExplorer and bulk S3: `prd-tnm.s3.amazonaws.com`)
- **Format:** GeoTIFF (Cloud Optimized GeoTIFF); 1 m DEM tiles are Float32, 10,012×10,012 px
- **License:** US public domain — "free of charge and without use restrictions"

### 2. Buildings — Microsoft Global ML Building Footprints ✅ Available
- **Coverage:** YES — global/US coverage, 1.4B buildings from Bing imagery 2014–2024, US refreshes through Aug 2026 (current snapshot 2026-08-13)
- **Download:** https://github.com/microsoft/globalmlbuildingfootprints (README links `dataset-links.csv`; also on Microsoft Planetary Computer: https://planetarycomputer.microsoft.com/dataset/ms-buildings)
- **Format:** per-tile `.csv.gz` files containing line-delimited GeoJSON — polygon footprint + height estimate in meters (−1 if none) + confidence 0–1. Repo includes `make-gis-friendly.py` for GIS conversion
- **License:** **CDLA Permissive 2.0** (NOT ODbL — older docs saying ODbL refer to the legacy dataset). Permissive, but read the CDLA terms before shipping; attribute Microsoft/Bing.

### 3. Roads — OpenStreetMap (practical source) ⚠️ Partially verified
- **WisDOT:** the GIS Open Data hub (https://data-wisdot.opendata.arcgis.com) is live and free, but searches found **no bulk statewide road-centerline download** — the authoritative centerline lives in WisDOT's internal WISLR system. Treat WisDOT as a "no" for bulk centerlines.
- **Use instead: OpenStreetMap** (ODbL license — attribution "© OpenStreetMap contributors" required in-game). Get Wisconsin extracts via Geofabrik, or query the county directly via Overpass. Rural road geometry coverage in Wisconsin is generally good, but **Trempealeau-specific completeness is unverified — spot-check Whitehall/Arcadia in OSM before committing.**
- **County alternative:** check https://geodata.wisc.edu for a Trempealeau County road-centerline set.

### 4. Water — USGS NHD ✅ Available
- **Coverage:** YES — national seamless dataset, includes Trempealeau River, streams, lakes
- **Download:** https://www.usgs.gov/national-hydrography/access-national-hydrography-products (by watershed, by state, or national; also via The National Map Downloader)
- **Format:** Shapefile or File Geodatabase
- **License:** US public domain

### 5. Bridges — National Bridge Inventory via BTS NTAD ✅ Available
- **Coverage:** YES — national; filter the statewide file to the county
- **Download:** BTS National Transportation Atlas Database — https://www.bts.gov/newsroom/bts-updates-datasets-national-transportation-atlas-database-summer-2025 (2025 NBI data; download via the BTS Geospatial Data Catalog)
- **Format:** File Geodatabase, Shapefile, GeoJSON, CSV, KML
- **License:** Public domain
- **Caveat:** FHWA historically withheld lat/long from public NBI ASCII releases — **use the BTS NTAD geospatial files**, not the FHWA ASCII files, for bridge point locations.

### 6. Trees/vegetation — NO per-tree dataset exists (confirmed)
- USDA Forest Service FIA exact plot coordinates are legally protected (fuzzed ~1 km, plots swapped). No public per-tree data anywhere — AAA studios don't have it either.
- **Use instead:** USDA **NLCD 2021** land cover (30 m resolution, public domain) from https://www.mrlc.gov as density masks → procedural foliage scattering with UE5's **PCG framework**. OSM forest polygons can supplement.

---

## RECOMMENDED PIPELINE (steps 1–8)

1. **Terrain.** Download 1 m DEM tiles for the county area of interest from The National Map Downloader (GeoTIFF, public domain). Mosaic + reproject to a meter-based CRS in QGIS/GDAL. Resample to a **legal UE landscape size: 127 / 253 / 505 / 1009 / 2017 / 4033 / 8129** (never an arbitrary size like 4096 — it gets padded/cropped). Export **16-bit PNG** (or 16-bit RAW `.r16`). Import as UE5.6 landscape. Sizing math: resolution = (components × quads-per-section × sections-per-side) + 1. Example: 32×32 components, 2×2 sections, 63 quads/section = **4033 (~4 km across at XY scale 100)**; 32×32 / 2×2 / 127 quads = **8129 (~8.1 km)**. Max single landscape is 8129×8129; beyond that, tile. Note: the full county at 1 m exceeds one landscape — **scope a playable region a few km across** (or tile). Set Z scale to cover local relief (Trempealeau relief is modest; default ±256 m at Z=100 is usually enough).

2. **Roads.** Pull OSM road network for the area (Geofabrik Wisconsin extract or Overpass query); spot-check completeness first. Import centerlines as **Landscape Splines** with road cross-section meshes — this is the standard UE5 drivable-road workflow (splines deform the road mesh, terrain is flattened/painted under them).

3. **Water.** Clip NHD flowlines/waterbodies to the area. Carve river/stream channels into the heightmap **before** landscape import (or via spline masks), then place UE Water-system planes for the Trempealeau River and lakes.

4. **Bridges.** Filter BTS NTAD NBI 2025 to the county. Where road splines cross NHD water, auto-place procedural bridge actors scaled from NBI structure length/width attributes.

5. **Buildings.** Download the MS footprints tiles covering the county (GeoJSONL, CDLA Permissive 2.0); clip to the area in QGIS/GeoPandas. Procedurally extrude footprints using the `height` attribute (fallback ~1–2 stories for rural buildings with height −1) via the PCG framework or an Editor Utility → instanced/static meshes.

6. **Vegetation.** Build density masks from NLCD 2021 forest/canopy classes (+ OSM forest polygons). Scatter trees/grass with UE5's **PCG framework**. Use FIA data only for species-mix calibration, never placement.

7. **Polish/streaming.** Landscape material with Runtime Virtual Texturing; LODs/HLODs for building clusters; **World Partition** cells for streaming (recommended for open worlds — it's Epic's default for new open-world maps); drivable collision on spline road meshes.

8. **Package.** Ship self-contained. No Cesium ion dependency, no online streaming requirement.

## Tools (UE 5.6 status)
- **Landscape Combinator** (Fab, paid — check current price and EULA): native UE 5.6, actively maintained. Closest to all-in-one: heightmap→landscape, OSM→landscape splines (roads/rivers), auto-buildings from outlines, OSM-based foliage. Strongly consider it.
- **StreetMap plugin forks** (open source, e.g. https://github.com/bjoernbethge/streetmap): imports `.osm` XML; community forks on newer UE with PCG integration — **check each repo's LICENSE.txt before commercial use**, requires C++ rebuild.
- **blosm** (Blender addon, base free/GPL): OSM buildings/roads/vegetation + terrain → export FBX/glTF → UE. Verified working as of Jul 2026: https://github.com/vvoovv/blosm
- **Cesium for Unreal** (Apache 2.0, free, supports UE 5.6 via v2.27.0): use ONLY as an optional online reference/visualization layer during development — **do not ship the game on it** (see below).

## LICENSING GOTCHAS (read before shipping)
- **Microsoft footprints = CDLA Permissive 2.0** (not ODbL, not public domain). Read the CDLA terms; attribute Microsoft/Bing.
- **OSM-derived geometry = ODbL.** In-game attribution "© OpenStreetMap contributors" required. Share-alike applies to the database; producing a game map from it is generally fine, but get counsel if redistributing a derived OSM dataset.
- **USGS 3DEP, NHD, NLCD, NBI/BTS = US public domain.** No restrictions; citation appreciated.
- **Cesium ion — DO NOT SHIP ON IT:** Community tier is **non-commercial only**; paid tiers trigger at **$50K annual revenue/raised funds** (dollar prices not published — contact sales); quotas are tiny for a game (Community: 15 GB streaming/mo, 1,000 Google 3D Tiles root tiles/mo); ToS **§2.2.2 bans offline/baked use** (streaming only — a shipped offline-capable game violates it); ToS **§2.2.3 mandates a prominent "Cesium ion" logo on the main game window**; display rights **end when the plan lapses** (subscription forever); Google/Bing tiles carry their own third-party terms on top. Sources: https://cesium.com/platform/cesium-ion/pricing/ and http://cesium.com/legal/terms-of-service/ (both verified live 2026-09-27).

## OPEN QUESTIONS (verify these — none are blockers)
1. Confirm 1 m DEM tile completeness for every part of Trempealeau County (USGS says QL2+ statewide; 2-minute check in The National Map Downloader closes this).
2. OSM road/building completeness specifically for rural Trempealeau County — spot-check Whitehall/Arcadia in OSM or via Overpass before committing to OSM as the road source.
3. Whether a Trempealeau County road-centerline set exists on https://geodata.wisc.edu (county-level alternative to OSM).
4. Exact WisDOT statewide road-centerline bulk download path (not found on the open-data hub; WISLR is likely internal/request-based).
5. Whether current FHWA NBI downloads still withhold lat/long (mitigated: use BTS NTAD geospatial files).
6. Landscape Combinator's current Fab price and EULA terms.
7. Dollar pricing for Cesium ion Commercial/Premium tiers (only relevant if reconsidering Cesium — not recommended).

## Definition of done
A drivable UE5.6 map of the scoped Trempealeau County region: real terrain (1 m DEM), real road layout (OSM splines), real waterways (NHD), real building placement (MS footprints), procedural vegetation (NLCD + PCG), procedural bridges at road/water crossings — fully self-contained build, all licenses complied with, World Partition streaming functional.
