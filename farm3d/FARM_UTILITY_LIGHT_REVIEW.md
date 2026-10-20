# Farm Utility light — candidate

Owner selected Farm Utility and asked to add buyable lights that brighten dark farm areas. Authorized implementation October20 at08:10:34Chicago. Base8a18715515028904e984012eb3d37c41eb0f2dc2, after accepted PR88 decoration publication.

One full-volume wooden utility pole with galvanized gooseneck shade and warm bulb. Existing Decor coin purchase/place/drag/Done/put-away controls. Draft price250coins; no new unlock, gems, running charge, fuel, electricity or save schema. Existing54IDs/prices/models retained. The paper lantern is unchanged.

Real Three.js PointLights illuminate standard-material world surfaces at night; daylight turns them off. Four reusable unshadowed lights follow the nearest placed sources to the walking camera or overview target. Every placed bulb remains emissive at night; only the nearest four cast real illumination. No utility lights are attached to a farm without these lamps. This is an explicit mobile budget, not proof of physical-phone performance. Existing sun shadows, scene presets, animal/character materials and game lighting are not retuned.

The model owns all geometry/materials with idempotent disposal. The light pool owns only its lights; moving uses the real transformed bulb anchor. Putting lamps away/rebuilding decor detaches stale sources. Worker51->52 adds utility-lights1, game28->29 accounts for the new catalog entry. Worker algorithms, dependencies and external services are unchanged.

Tests are written first: original missing-feature5fail receipt,5first-green, extra no-owner-cost regression RED (4 unexpected lights), corrected focused97PASS. All raw logs retained privately and will be attached sanitized. Native browser includes trusted purchases/drags at390/844/1280, front/side/back/night/day, identical frozen actual scene light-off/on framebuffer comparison (bulb/exposure unchanged), actual20-rebuild GPU equality, old51worker -> requested52controller and cached modulehash, exact paid-save/rotation retention fully offline. Geometry has <=12draws/6500tris and existing .6m collision footprint.

Status: implementation and focused contracts pass; actual native night inspection, full exact-head hosted CI and owner merge approval pending. Local Chromium is absent; no local browser pass claimed. Do not merge/deploy this lighting feature before actual renders and owner approval. Existing PR88 publication evidence ec525a655f6a133533eda89c94dcfb355a0d94d8 supersedes stale pending fields in inherited records.
