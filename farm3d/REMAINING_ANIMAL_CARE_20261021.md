# Remaining physical animal care — 2026-10-21

Owner instruction: do horses, sheep, dog and cat together in one build effort. This extends the existing care flow; it does not rebuild the farm.

Base: 393cb849b258852b3cd2ec92342004051785c5e2. Existing worktrees and untracked chicken reproduction preserved. PR94 merged/live; latest release notes recovered from evidence/cow-pr94-publication-20261021 at621e449. Main documents still contain historical pending states, so that publication receipt is retained as authoritative release evidence. No active local test/build or queued/in-progress GitHub run observed during recovery; external chat activity cannot be conclusively inspected.

## Acceptance checkpoints

- [x] Recovery: exact main, owner scope, instructions, old work, active processes inspected.
- [x] Layout (local contracts; hosted render pending): separate generous northern horse/sheep pens, four/five beds, real shelters, feed/water surfaces, accessible gates and routes; dog/cat each have food, water and bed. No saved object moved/deleted. Site conflicts retain old farm until cleared/reloaded.
- [x] Motion (local actual rig/controller proofs; native pending): actual accepted rigs physically walk, align, eat/drink at the surfaces, fold into supported beds, stand and clear approaches. Fixed per-animal places; no overlapping slots, teleports, doorway queues or deadlocks.
- [x] Cycles (local complete AI and rate tests; hosted pending): maximum four horses/five sheep plus dog/cat repeat three full sleep/wake cycles (including second bedtime), at30/60/120Hz; simultaneous feed/wake/weather changes; movement/clearance assertions retained.
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

## Initial hosted failure and corrected candidate
Initial head81dbc4c, tree0755980, PR95 draft. All4 remaining-care jobs in39672156102FAIL at boot: cat furniture overlaps the unchanged order board `[3.3,11.4,1.5,.6]` and its support `[1.9,12.3,.4,.4]`. No rendered care/recovery success is inferred. All4 original ZIPs downloaded and API SHA256 verified, raw job logs committed, original complete bundle preserved as Sunny-Acres-PR95-Initial-Failure-Evidence-81dbc4c.zip. Full-world snapshot retained in tests/fixtures/remaining-care-initial-world.json.

The complete world (including the large reserved field block) showed the front of the barn cannot hold a second pet area without occupying existing objects/path. Both new pet nooks move to open flat space behind the barn. No existing board, field, tree, path, saved object or building moves. The new pet-location test now requires stations behind the barn (`z<-6.2`) to retain the original main-door clearance guarantee, rather than the initial unapproved front-only assumption. Full actual-world site testRED→GREEN.

Self-review independently reproduced a final stand-up frame that began exiting immediately after weight reachedzero. The controller now waits for the next frame; strict new regressionRED→GREEN, no deadline/clearance/assertion relaxation. Feed overlay adds a small real mouth motion; actual head-skinned vertices remain at the surface. Four-species motion testsRED→GREEN.

Final focused43/43PASS after corrections, with30/60/120Hz three-night maximum-herd cases, all original skin/contact and immutable20-file proofs. Completed local69-file integrated sweepPASS, explicitly diagnostic/mixed-source; final exact-head hosted sweep remains required. Browser speed assertion applies to actual care frames; ordinary accepted free-roaming animals may legitimately run faster than station walking, so it no longer mislabels those unrelated movements as a care teleport. Physical-care bound and500sim-second deadline remain unchanged.

Earlier hosted/source greens do not qualify this revised candidate. No owner visual/release approval is inferred.

## Continuous route/terrain checkpoint (local, before next publication)
Current PR headcab7ded: four-view39673900077 has844PASS and390/768/1280FAIL after the second bedtime, while waking pets attempt food/water. All eleven beds and feeding/drinking passed in all four. Original three failure ZIPs/API SHA256 verified and persisted;844PASS artifact12381275163 SHA256f6b04fab9ed34b07081aa9b469f1af08c60008f04135bf245f50a57b37b2b84e downloaded and actual captures inspected. They are too distant/back-facing or dark to serve as final visual acceptance; new close and daylight inspection views are prepared, without moving/hiding scene geometry.

Actual390 snapshot retained as remaining-care-corner-wake.json. Both original pet positions RED: an0.08m visibility sample skips a narrow rectangle/fence-cap collision that the unchanged physical step correctly refuses. New remaining-care-navigation.js uses continuous inflated-rectangle, capsule, neighbour-circle and pen-halfplane checks. Both exact positions now choose a physically clear first step and reach the original station. No clearance/speed/deadline relaxed.

Terrain self-review found ordinary roots at0 while the new pastures range roughly-.20to+.19m. Actual Beast/root and physical-care approach tests RED. Only the four active new-care species now follow the preserved ground surface; directed approaches retain their original3D speed via bounded step-length selection. Land, accepted rigs, old cow/chicken controllers and economic/save modules are unchanged. Corrected51focused checksPASS. Controller2 and navigation1 are in cache63; installed main remains cache62.

Full actual-Beast/accepted-rig local replay with two seeds and three nights plus40second full waking lives is active. Its first two setup attempts exposed test-fixture syntax/VM lexical-export mistakes, both retained and corrected; no runtime failure is inferred from those setup errors. The browser now retains all original goals/deadlines and adds40seconds of full waking life between nights, actual terrain support and closer/daylight inspection captures. New exact-head hosted qualification remains mandatory; no release/owner visual approval.

## Completed local integrated replay and final qualification preparation
Local complete actual-Beast/accepted-rig replay nowPASS for seeds4242and1: initial four-species feeding/drinking, all11beds through three full nights, three40-second unrestricted waking lives, then all9horse/sheep paid-stamp feeder visits. Runtime about17seconds after correcting the planner's empty-path performance fault. The older full replay had exposed missing ordinary-rest/drink integration and new traffic before the last sleeper cleared; those failures are retained.

Ordinary rest/drink decisions now use real care stations; they respect the existing transient visit cooldowns. Runtime requests wait while overnight animals exit, then resume. Waiting keeps emotes/accepted rig settling active. Empty searches respect their existing one-second replan interval and reject an occupied destination before a full search (2473queries on everyframe RED -> one initial check and wait GREEN). No timeout/assertion/physical clearance relaxed.

The contact fixture explicitly disables spontaneous naps as it already disables unsolicited feeding/drinking during targeted visits. Natural nap cooldowns reset on real release; night/weather always take priority. The complete replay subsequently exercises normal waking behavior, and all nine paid feeders are verified after stamp changes. Original all-awake/zero-reservation and500-second goals remain.

Focused new-care + original cow scene + cache suite82/82PASS. A later gate-approach test RED exposed a saved building just outside the sheep footprint that could seal the entrance; explicit2.5m approach guards now preserve the building and defer installation. Both gates pass actual3Dgeometry rays and player-width continuous collision checks; post-guard17layout/model/cache checksPASS. All20protected runtime files remain exact393cb84bytes.

Final browser recipe keeps every earlier assertion and adds full40-second waking lives, terrain support, ordinary care and all9actualpaid feeder visits. Captures use unmodified scene/normal composer at closer angles plus explicitly labeled daylight inspection of settled night poses. The844job also installs actual live393cb84/cache62 in a separate guest context, requires the requested63worker to replace it, then checks exact paid state,11beds and offline reboot. It fetches the fixed predecessor commit shallowly; no old-shell behavior is inferred. This installed-update/native/render recipe is still pending hosted execution.

Current source versions: cache63, navigation1/layout2/yard2/controller2/pose1; game30 and all existing protected runtime source unchanged. Final exact-head hosted72-fileNode plus all standard regression/cow/chicken/art/conflict and four-view care gates remain required. No actual final preview or owner approval claimed.

Final lifecycle supplement: daytime physical nap joins rain sheltering, remains held beyond its nap duration, then stands/exits/releases after clearing;1/1PASS. Main remains393cb84. Superseded cab7ded finished34SUCCESS/3routeFAIL; no checks waived or original failures retried unchanged.
