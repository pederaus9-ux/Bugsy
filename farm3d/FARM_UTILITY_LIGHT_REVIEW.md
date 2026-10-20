# Farm Utility light — candidate

Owner selected Farm Utility and asked to add buyable lights that brighten dark farm areas. Authorized implementation October20 at08:10:34Chicago. Base8a18715515028904e984012eb3d37c41eb0f2dc2, after accepted PR88 decoration publication.

One full-volume wooden utility pole with galvanized gooseneck shade and warm bulb. Existing Decor coin purchase/place/drag/Done/put-away controls. Draft price250coins; no new unlock, gems, running charge, fuel, electricity or save schema. Existing54IDs/prices/models retained. The paper lantern is unchanged.

Real Three.js PointLights illuminate standard-material world surfaces at night; daylight turns them off. Four reusable unshadowed lights follow the nearest placed sources to the walking camera or overview target. Every placed bulb remains emissive at night; only the nearest four cast real illumination. No utility lights are attached to a farm without these lamps. This is an explicit mobile budget, not proof of physical-phone performance. Existing sun shadows, scene presets, animal/character materials and game lighting are not retuned.

The model owns all geometry/materials with idempotent disposal. The light pool owns only its lights; moving uses the real transformed bulb anchor. Putting lamps away/rebuilding decor detaches stale sources. Worker51->52 adds utility-lights1, game28->29 accounts for the new catalog entry. Worker algorithms, dependencies and external services are unchanged.

Tests are written first: original missing-feature5fail receipt,5first-green, extra no-owner-cost regression RED (4 unexpected lights), corrected focused97PASS. All raw logs retained privately and will be attached sanitized. Native browser includes trusted purchases/drags at390/844/1280, front/side/back/night/day, identical frozen actual scene light-off/on framebuffer comparison (bulb/exposure unchanged), actual20-rebuild GPU equality, old51worker -> requested52controller and cached modulehash, exact paid-save/rotation retention fully offline. Geometry has <=12draws/6500tris and existing .6m collision footprint.

Status: implementation and focused contracts pass; actual native night inspection, full exact-head hosted CI and owner merge approval pending. Local Chromium is absent; no local browser pass claimed. Do not merge/deploy this lighting feature before actual renders and owner approval. Existing PR88 publication evidence ec525a655f6a133533eda89c94dcfb355a0d94d8 supersedes stale pending fields in inherited records.


## Farm Utility qualification follow-up —2026-10-20

Owner requested preparing PR89 for merge at09:42Chicago, not merging it. Main remains8a18715515028904e984012eb3d37c41eb0f2dc2. Recovering from scratch workspace maintenance uses exact GitHub blobs and verified artifacts, not reconstructed guesses.

First PR-head a798409 had three retained failures: Market Sales expected obsolete game28 despite intentional29 (test identity corrected only); scene-polish1280 geometry292to281 (cause remains unassigned, no runtime or original-test change); utility1280 frame+3 wait timed out60s after20 queued manual renders, followed by screenshot timeout (trace retained, no failurePNG claimed). The earlier native run passed automation but normal390 side/back renders had excessive bloom glare. Corrected new-lamp-only12intensity/decay1/bulb1 preserves warm ground coverage and readable solid bracket/post; existing lighting is untouched.

Isolated diagnostic ba99bfac218590f3445cfe36865e520ff093728c/run39433716353: utility job118665116411 SUCCESS,97Node contracts and6native groups including390/844/1280DPR1 actual purchase/move/rotation/day-night/save/put-away and old51to52 requested-worker/offline. Actual brightened pixels outside entire model bounds133032/121784/370377.20 real rebuilds after GPU completion retain219geometries/64textures exactly; per-draw GPU waits about3.5–3.8s justify completing measured GPU work rather than queuing20draws before preset change. All original60/90s readiness deadlines,20cycles and exact equality remain. This supports corrected test observation ordering, not exclusive historical root-cause attribution.

Matched character diagnostic job118665116015 SUCCESS, including original wardrobe equality at844283/97 and1280292/96 before/after. Two observed disposed geometries belong to farmer rebuild/hitproxy. No11-geometry loss reproduced; historical cause remains unknown. Original scene-polish test and production characters are unchanged. Passing diagnostic is a non-reproduction, not a fix claim.

Verified artifact12269328996 SHA0199ef5c058d90cae5cbac6636ad4a71bde030abb5018cdd0a87c122d79bb896 (19300632bytes); wardrobe12273095252 SHAb313593f10fb3973a1431c722ecb1ac9e5b3de0d5cb4cc6e985fd75a8c5516e5 (7650423bytes). Both ZIP CRC/path checks PASS. Lead inspected actual normal-composer front/side/back/day/offline captures. No physical-phone or independent external audit claim. Full new PR-head checks required, no merge/deploy. Diagnostic workflow/copy remains separate.
