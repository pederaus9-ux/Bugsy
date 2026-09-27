# Trempealeau County, WI — Game Map Data Packs

Pre-clipped, county-ready vector layers for the Unreal Engine 5 storm-chaser game map.
Prepared by Nova (AI agent) on **2026-09-27**. Coordinate system: **EPSG:4326** (lon/lat, decimal degrees).

**Bounding box used** (generous, covers all of Trempealeau County plus margin):
south 44.15, west −91.70, north 44.62, east −90.98

## Files

| File | Features | Size | Contents |
|---|---|---|---|
| `buildings.geojson` | 33,101 | 12.4 MB | Building footprint Polygons, clipped to bbox. Properties: `id`, `area_m2`, `height_m` (where MS estimated one — present on ~98.6%) |
| `roads.geojson` | 10,690 | 4.7 MB | Road LineStrings (`highway` = motorway→service). 3 split into MultiLineString at bbox edge. Properties: `osm_id`, `name`, `ref`, `highway`, `surface`, `lanes`, `maxspeed` |
| `water.geojson` | 7,065 | 6.0 MB | 6,058 river/stream LineStrings, 996 lake/pond Polygons (`natural=water`), 11 MultiLineStrings at bbox edge. Properties: `osm_id`, `name`, `ref`, `waterway`, `natural` |
| `bridges.geojson` | 292 | 71 KB | 281 `bridge=yes` LineStrings + 11 `man_made=bridge` outline Polygons. Properties: `osm_id`, `name`, `ref`, `highway`, `bridge`, `man_made` |

Sanity anchor: Whitehall (county seat, 44.364, −91.313) has 1,275 buildings, 295 road features
(Main Street carries `ref: US 53;WI 121;CTH D` — correct), 75 water features (Trempealeau River,
Irvin Creek), and 6 bridges (incl. the US-53/WI-121 Main Street bridge) within ~3 km. All
features verified inside the bbox; crossing features were clipped at the bbox edge.

## Sources & licenses

1. **Buildings — Microsoft GlobalMLBuildingFootprints** (github.com/microsoft/GlobalMLBuildingFootprints)
   - Only the 4 zoom-9 quadkey tiles intersecting the bbox were downloaded
     (`021333101`, `021333103`, `021333110`, `021333112`), from `dataset-links.csv`
     dated 2026-07-24 (host: bfppub.blob.core.windows.net). Imagery vintage 2014–2024.
   - License: **CDLA Permissive 2.0**. Include this attribution in the game credits/docs:
     `Building data © Microsoft (GlobalMLBuildingFootprints), licensed under CDLA Permissive 2.0.`
2. **Roads / Water / Bridges — OpenStreetMap** via Overpass API
   (overpass.private.coffee and overpass.openstreetmap.fr mirrors; data timestamps
   2026-05-06 through 2026-09-27 depending on layer — bridges re-queried 2026-09-27
   after a stale mirror response was detected and discarded).
   - License: **ODbL 1.0**. Required attribution, shown wherever the map appears:
     `© OpenStreetMap contributors`

## How Claude imports this into UE5

Options, cheapest first:

1. **Convert to Shapefile, then use a UE GIS plugin.** In QGIS (free): Layer → Add
   Vector Layer → select the `.geojson` → right-click → Export → Save as ESRI Shapefile
   (or `ogr2ogr -f "ESRI Shapefile" out.shp in.geojson`). UE5 plugins that ingest
   shapefiles: *StreetMap* (ships with UE, imports OSM directly), *ArcGIS Maps SDK for
   Unreal*, or the *Shapefile Loader* marketplace plugins.
2. **Buildings → FBX via Blender.** Import `buildings.geojson` into BlenderGIS or QGIS,
   extrude each footprint by its `height_m` property, export FBX, import to UE as static
   meshes (merge per city block for draw-call sanity).
3. **Roads → UE splines.** `roads.geojson` LineStrings map 1:1 to Landscape Spline /
   Spline Mesh road workflows: read each feature's coordinates, project lon/lat to the
   map's local XY (same projection used for the terrain), drop a spline control point
   per vertex. `highway` tag → road class (primary = 2-lane highway mesh, residential =
   narrow street mesh).
4. **Full pipeline context:** see `~/workspace/your_files/storm-chaser-map-pipeline-claude-brief.md`
   for the terrain + roads + buildings import pipeline these packs plug into.

Notes: geometry crossing the bbox border is clipped at the border, so edge roads/rivers
end cleanly at the map edge. `MultiLineString` features (14 total across roads+water)
need per-part handling in the spline importer.
