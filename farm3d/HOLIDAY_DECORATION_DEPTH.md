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
