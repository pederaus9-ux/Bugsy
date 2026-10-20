# Solid holiday decoration correction

Base: `c17d563886cca786391c8aaa401498437dfca0e7` (PR85 merged). Owner2026-10-19 20:03:12 Chicago: “Chicken pen looks good lets do decorations.” This is the qualitative chicken-pen acceptance and authorization for this bounded visual correction, not merge authority for the new work.

## Confirmed cause and correction

The previous `makeDecor` made every non-tree prize a textured PlaneGeometry, and the holiday set used five additional emoji planes. `updatePointer`'s surrounding frame update explicitly rotated both sets toward the camera. Plane bottoms extended below their placement height (h*.45-h*.5 for prizes, .38-.4 for themed pieces). These are source facts; font-specific emoji cropping is not assigned as a proven historical cause.

Replace only the21 holiday prize consumers and seven automatic holiday themes with `holiday-decor.js`. All are opaque, shaded volumes, with real front/side/back surfaces, fitting the existing placement footprints. Pumpkins have ribbed hollow shells, actual openings with thickness, an inset warm emissive interior and fixed world orientation. Other props use complete three-dimensional forms. No new point lights, texture downloads, animation driver or dependencies are introduced. Unrelated shop/event/seasonal card renderers remain outside this scope.

Placed IDs, inventory, coordinates, native Move/Done/Put away, collisions and game.js rules remain unchanged. Default orientation is fixed; an existing finite optional `rotation` is respected without writing or migrating save fields. Ambient props use fixed authored angles. Bases use the actual terrain intersections under the footprint instead of burying cards below0. Moving holidays retain their existing lift and save path. Per-prop merged material groups cap draw calls; sync/rebuild disposes owned resources exactly once without disposing the borrowed contact-shadow material.

The worker changes only its shell list and cache name48→49 so the new render module is available on installed/offline farms. Algorithms and saves are unchanged. Two existing explicit current-cache identity expectations follow that intentional version bump; no deadline, tolerance, action, save/hash or current-worker predicate is relaxed.

## Verification checkpoint

- Initial source-driven geometry regression: all21 holiday volumes fail with zero depth; failure retained.
- Intermediate fixture cleanup error retained; the fixture now represents the actual contact-shadow object.
- A real repeated-disposal regression then fails2vs1, and passes after adding the idempotent wrapper.
-24 final geometry/resource/compatibility contracts PASS. Focused cache/character/chicken contracts40/40 PASS; see raw receipts.
- `npm test` attempted in this environment; full result will be recorded when the runner finishes. No whole-suite green claim here.
- Local Chromium download fails with invalid/truncated ZIP; no local browser execution is claimed.
- Dedicated hosted job preserves a matched old-tree observation and candidate full-resolution390/844/1280 front/side/back captures, night view, all21 asset study, real guest inventory/place/move/reload and repeated-theme GPU memory checks. Native results PENDING at this checkpoint.
- Existing full PR regression/cloud/chicken/offline/character workflows remain intact; final exact-head qualification required.

## Limits and review

No merge/deployment authorized. Actual rendered evidence must be inspected before requesting owner acceptance. Automated Chromium/SwiftShader does not establish Android/iPhone sustained performance. Existing character appearance, chickens/other animal care, earned outputs, inventory, Firebase/auth/economy, save schemas and shelved recorder/normal work are preserved. Earlier failures remain evidence. This is lead implementation and self-review, not an independent audit. No market, cow tank, other pens or broader graphics phase is included.
