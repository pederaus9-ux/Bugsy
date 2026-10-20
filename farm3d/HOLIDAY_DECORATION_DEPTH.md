# Solid holiday decoration correction

Base: `c17d563886cca786391c8aaa401498437dfca0e7` (PR85 merged). Owner2026-10-19 20:03:12 Chicago: “Chicken pen looks good lets do decorations.” This is the qualitative chicken-pen acceptance and authorization for this bounded visual correction, not merge authority for the new work.

## Confirmed cause and correction

The previous `makeDecor` made every non-tree prize a textured PlaneGeometry, and the holiday set used five additional emoji planes. `updateGame` explicitly rotated both sets toward the camera. Plane bottoms extended below their placement height (h*.45-h*.5 for prizes, .38-.4 for themed pieces). These are source facts; font-specific emoji cropping is not assigned as a proven historical cause.

Replace only the21 holiday prize consumers and seven automatic holiday themes with `holiday-decor.js`. All are opaque, shaded volumes, with real front/side/back surfaces, fitting the existing placement footprints. Pumpkins have ribbed hollow shells, actual openings with thickness, an inset warm emissive interior and fixed world orientation. Other props use complete three-dimensional forms. No new point lights, texture downloads, animation driver or dependencies are introduced. Unrelated shop/event/seasonal card renderers remain outside this scope.

Placed IDs, inventory, coordinates, native Move/Done/Put away, collisions and game.js rules remain unchanged. Default orientation is fixed; an existing finite optional `rotation` is respected without writing or migrating save fields. Ambient props use fixed authored angles. Bases use the actual terrain intersections under the footprint instead of burying cards below0. Moving holidays retain their existing lift and save path. Per-prop merged material groups cap draw calls; sync/rebuild disposes owned resources exactly once without disposing the borrowed contact-shadow material.

The worker changes only its shell list and cache name48→49 so the new render module is available on installed/offline farms. Algorithms and saves are unchanged. Two existing explicit current-cache identity expectations follow that intentional version bump; no deadline, tolerance, action, save/hash or current-worker predicate is relaxed.

## Verification checkpoint

- Initial source-driven geometry regression: all21 holiday volumes fail with zero depth; failure retained.
- Intermediate fixture cleanup error retained; the fixture now represents the actual contact-shadow object.
- A real repeated-disposal regression then fails2vs1, and passes after adding the idempotent wrapper.
-24 final geometry/resource/compatibility contracts PASS. Focused cache/character/chicken contracts40/40 PASS; see raw receipts.
- `npm test` exited1 after40 completed invocations/240 passing assertions; no completion receipt was emitted for the last-started ambient-render-observation.test.mjs, and browsers were not reached. An isolated diagnostic of that file passes8/8. No assertion failure was printed for that incomplete command; its termination cause remains unassigned. No whole-suite green claim here.
- Local Chromium download fails with invalid/truncated ZIP; no local browser execution is claimed.
- Dedicated hosted job preserves a matched old-tree observation and candidate full-resolution390/844/1280 front/side/back captures, night view, all21 asset study, real guest inventory/place/move/reload and repeated-theme GPU memory checks. Native results PENDING at this checkpoint.
- Existing full PR regression/cloud/chicken/offline/character workflows remain intact; final exact-head qualification required.

## Limits and review

No merge/deployment authorized. Actual rendered evidence must be inspected before requesting owner acceptance. Automated Chromium/SwiftShader does not establish Android/iPhone sustained performance. Existing character appearance, chickens/other animal care, earned outputs, inventory, Firebase/auth/economy, save schemas and shelved recorder/normal work are preserved. Earlier failures remain evidence. This is lead implementation and self-review, not an independent audit. No market, cow tank, other pens or broader graphics phase is included.


## First hosted observation —f06b574

Run39352383716/job118399313339 passes all31 geometry/cache assertions. Native baseline confirms both original card systems turn toward the camera. Candidate390 full-resolution front/side/back orientation and grounding assertions pass, then native selection fails: expected decor0, actual stand. Source places the roadside stall at(3.7,22.6), between the first fixture camera(4,~3,27.5) and pumpkin(4,17.8); actual captures confirm the stall covers the subject. This is a proven fixture obstruction, not a prop-selection fix. Raw log, failure trace and artifact12234170397 SHA2567400c200f499c3af45b535f5dbf75ef2b06667d7408765a670646e70ce9414a6 remain retained. A baseline teardown screenshot also timed out15s; explicit captures and the candidate failure trace remain available.

Follow-up changes only the new test's setup: use the real free-decoration-spot finder near a clear west-side patch, retain one subject, aim front/side/back at that returned spot and raise the orbit angle. Keep the exact decor0 hit assertion, native touch/click, put-away/Place/move/Done, inventory/save equality, geometry and resource requirements. Bounds now exclude the transparent contact-shadow plane. No runtime/model change is made in this follow-up. Fresh exact-head native validation remains required.


## View/resource and actual-render follow-up —369ee446

Run39352965768/job118401293531 confirms baseline rotation and candidate front/side/back orientation at390,844,1280. Real native put-away/Place/drag/Done/reload passes at390 and844; saved coordinates prove1.53m and2.21m movement. The resource equality gate then FAILS because geometry count decreases220→210, textures57→57. Its old baseline was cumulative full-farm allocations, while its isolated perspective camera did not contain all5 props. Preserve artifact12234406752 SHA256ddff15632191776366d28f455c13ac1a87e82b6a691d05081fcd50ee76a3cc5f and the raw log. Follow-up retains exact equality and uses one controlled orthographic view containing every corner of all5 props before and after every theme refresh. It records coverage/counts before asserting, so a future failure retains the values. Native drag now also explicitly asserts a changed saved position.

Independent clearance audit caught the gift pile radius0.631m exceeding the existing0.6m walking clearance. A regression fails on that real geometry; circular footprint fitting corrects it without changing collision/movement rules. All21 types now pass the unchanged clearance limits.

Actual front/day/night renders were inspected. Their remaining jagged pumpkin apertures and grass across the lower face need correction before visual review. Replace centroid-deleted surface triangles with precisely cut polygons mapped onto a curved hollow shell and physical rims. Register holiday-only grass clearings through the existing clearGrass/moveClear machinery; restore old patches on move/store/theme removal and preserve overlapping/fixed building clearings. Two actual InstancedMesh restoration/overlap contracts fail before that change and pass after it. Existing clearGrass/moveClear algorithms remain unchanged.

Latest targeted set63/63 PASS:47 geometry/ownership/clearance/grass contracts,7 cache graph checks,9 surrounding character/chicken contracts. Model statistics are regenerated in refined-model-budget.json. No fresh native pass is claimed for these runtime refinements until exact-head hosted validation finishes. No merge/deploy.


## Automated qualification and visual rejection —55c78225

Native run39354260504/job118405482080 completes SUCCESS. All3 full CSS-resolution viewport/orbit and native selection/place/actualmovement/reload paths pass. Controlled resource equality is220→220 geometries and57→57 textures, with all5 props fully covered on15 draws across2 full theme cycles. All21 asset-study models render. Artifact12234372629 SHA256a3508be3f299b22c0085ff7497145c499bc868e81819d54b9ddb6599dcab70ff is retained byte-for-byte; prior raw failures remain untouched.

Actual image review rejects the pumpkin skin's crumpled shading despite the automated pass. Shared identical back-surface vertices carry normal-component differences up to1.5773. A new continuity regression fails on those actual mesh values. Welding the shell's shared vertices before computing normals removes the seams without changing the physical openings, triangle count, draw budget, gameplay or saves. Latest focused set64/64 passes. Fresh actual render and exact-head CI are still required for that final normal correction;55c782 is not owner-accepted or a clearance of the later head.


## Surrounding chicken test fixture — 5206a83b

The final holiday job passes, as do core regression, authored hands, character, both30-bird full-flock touch and installed/offline-save jobs. The separate chicken-pen native job118408450394 fails at chicken-pen.browser.cjs:38:29, waiting30s for a selectable bird from yaw2.6 after all four widths' feed/water/pallet/customization paths pass. The actual failure image shows the opaque coop across the rear overview. Raw artifact12235057753 is124,412,844bytes, SHA2562b216e01de7a4c39675ca218ac5206a83b114f5315cb75d779a4ea768671395a. Per-bird positions and separate predicate booleans were not persisted at historical timeout; the earlier stage field is stale. No claim that those exact six historical positions were recovered.

A source-grounded counterexample uses the actual createChickenYard, real createChicken3D skinned meshes, the exact native hitAt source and the exact failure camera coordinates. All six test birds are outside physical station clearances and inside the yard. Original rear view produces0 eligible native animal hits (all hit the opaque coop); the front view produces6 without moving birds or changing hit priority. This proves the fixed-camera test's visibility assumption is invalid for legitimate flock positions. The new regression fails with the old rear fixture and passes after a test-only view planner selects an actual unobstructed native bird hit. Planning restores the actual camera immediately; the test then uses the existing overview camera setup and unchanged30s wait, screen margins, exact native hit, native click and pet/rename assertions. It records per-bird screen/position/hit/UI terms for each inspected view, and labels the stage correctly. No runtime, animal, coop, holiday mesh, save or collision code changes in this follow-up. The counterexample demonstrates the mechanism; it does not invent missing failure-time telemetry. Fresh exact-head hosted qualification remains required.
