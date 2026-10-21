# Remaining physical animal care — 2026-10-21

Owner instruction: do horses, sheep, dog and cat together in one build effort. This extends the existing care flow; it does not rebuild the farm.

Base: 393cb849b258852b3cd2ec92342004051785c5e2. Existing worktrees and untracked chicken reproduction preserved. PR94 merged/live; latest release notes recovered from evidence/cow-pr94-publication-20261021 at621e449. Main documents still contain historical pending states, so that publication receipt is retained as authoritative release evidence. No active local test/build or queued/in-progress GitHub run observed during recovery; external chat activity cannot be conclusively inspected.

## Acceptance checkpoints

- [x] Recovery: exact main, owner scope, instructions, old work, active processes inspected.
- [ ] Layout: separate generous northern horse/sheep pens, four/five beds, real shelters, feed/water surfaces, accessible gates and routes; dog/cat each have food, water and bed. No saved object moved/deleted. Site conflicts retain old farm until cleared/reloaded.
- [ ] Motion: actual accepted rigs physically walk, align, eat/drink at the surfaces, fold into supported beds, stand and clear approaches. Fixed per-animal places; no overlapping slots, teleports, doorway queues or deadlocks.
- [ ] Cycles: maximum four horses/five sheep plus dog/cat repeat three full sleep/wake cycles (including second bedtime), at30/60/120Hz; simultaneous feed/wake/weather changes; movement/clearance assertions retained.
- [ ] Recovery: save/reload and installed offline reopening preserve all paid state. Runtime reservations rebuild from ownership, never saved as production progress. Visitor/read-only farms cannot mutate care ledgers.
- [ ] Regression: all existing Node/browser/cloud and care tests on exact head; existing horse/sheep/dog/cat rigs, cow/chicken systems, land/path, auth, saves and rewards unchanged. Dedicated overlay only changes care poses during visits.
- [ ] Visual: actual phone portrait/landscape, tablet, desktop renders and resource ownership verified. Show owner real preview. No physical-device claim, generated concept evidence or independent review claim.
- [ ] Release: owner preview/merge gates and exact-head hosted checks before merge; main/deployment/live hashes and postmerge checks afterward.

## Implementation plan

1. Pure layout/station contract in remaining-care-layout.js; tests prove capacities, bed/surface separation, flat care surfaces, real approach clearance and paid-object conflict preservation before implementation.
2. Dedicated resettable quadruped-care-poses.js overlay; actual skinned-bound and mouth-contact tests RED then GREEN without changing the accepted rig modules.
3. remaining-care-yard.js builds shared low-cost sheltered pens and individual pet furniture, with disposal/resource ownership. remaining-care-controller.js owns transient care and per-animal reservations only, physically moves with collision validation and stable standing/return stages. Existing production modules remain byte-identical.
4. Small index.html integration activates unoccupied sites before spawning, registers collision/placement/grass ownership, hooks physical care before ordinary animal behavior and exposes existing debug-style inspection. Preserve conflicts and old layouts without snapping a live herd across the map.
5. Local deterministic tests and original full Node suite; hosted exact-head native input, four-view care renders, repeated cycles, installed offline/save recovery and unrelated regression. Preserve every failed run and change hypotheses before retry.
6. Adversarial self-review, actual preview, owner release decision and final receipts.

The owner supplied the combined intended behavior and explicitly instructed execution in one go; no repeated feature/design permission question is required. Final visual approval is not inferred from this instruction.

## Implementation checkpoint, before first hosted diagnostic
New layout/pose tests12/12PASS; initial furniture/controller6/6PASS with actual own-yard obstacles. Expanded controller now covers all30/60/120Hz, three nights per species; focused cow+care+cache47/47PASS, farm-switch focused suitePASS. Full64-file baselinePASS. A69-file integrated local sweep is active; edits occurred during that sweep, so it is diagnostic only and cannot qualify a single exact source tree. Exact-head hosted suite remains required.

Original layout failures exposed stone-path/usable-boundary conflicts; revised horse polygon follows the existing stone approach and has161.75m², sheep rectangle195.7m². Beds occupy existing flat care land; no farm-land/path change. A test helper originally assumed rectangles; corrected to polygon shoelace area while retaining the150m² minimum. Original failures retained.

Actual skin tests caught unsupported legs, tail penetration and incorrect two-link mouth angles. Dedicated resettable overlay now passes all original skin/restore/contact assertions. It caches bounded support corrections from actual skinned vertices, never alters rig geometry or production. Scenery ownership RED/GREEN proves removing one site cannot restore flowers in another site.

Local browser launch blocked by missing Chromium executable. No unchanged download retry or local browser-pass claim. New four-view hosted diagnostic exercises eleven maximum animals, physical contact, three nights, trusted existing feed/pet input, night save/reload, installed offline boot and20GPU rebuilds. Existing cow9/chicken3 diagnostics and all standard PR gates will also run on this branch.

Cache63 adds exactly four new physical-care modules; all20 frozen protected runtime files remain byte-identical to393cb84. Existing cache assertions are advanced from candidate62to63, preserving every assertion and deadline. Cow VM fixture supplies a no-op for the new unrelated remaining-species sync hook; all cow assertions remain unchanged.
