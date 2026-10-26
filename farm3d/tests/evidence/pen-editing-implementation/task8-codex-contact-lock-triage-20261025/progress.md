# Attachment contact and old regression triage

Base `ec3f78fdb43f9dcd1fd0a9794e5760c57f5d733a`; local branch `codex/safe-test-preview-20261023`. The starting checkout was clean. This checkpoint uses existing browser witnesses and local immutable history, not another browser journey or broad suite.

## Attachment verdict: unintended right hind-leg penetration

`cow-attachment-witness-diagnosis.mjs` maps all 180 retained plate first-hit witnesses at 30/60/120 Hz to actual immutable geometry indices and skin weights. Every triangle is weighted to **knee3/hip3**, the right hind leg from `cow3d.js:16-19,143-160`. None is an udder/teat triangle. The solid is the rectangular **0.4 x 0.06 x 0.48 m carrier plate**, arm-local center `(-1,.07,0)`, created in `cow-yard.js:92`. The group is translated, not rotated, during service, so these recorded boxes match that solid cuboid rather than a loose rotated envelope.

Contacts occur during both extension and retraction, at attachment fractions roughly **0.5611–0.9445**, not at the fully attached endpoint. Counts remain 26/52/102 frames. Actual stored vertices lie inside the plate in 44/86/166 instances. The additional inward-box diagnostic reaches its 30 mm cap on some witnesses; that is not a minimum translation depth or changed acceptance tolerance. Detailed frame ranges, native vertex indices and weights are in `attachment.json`. A21's immutable-baseline run already has the same 26-frame problem at 30 Hz.

By contrast, the saved primitive-44 cup-AABB witnesses are body/root-weighted vertices at rest y=.50–.52, z≈.22–.24: the front teat tip/stem geometry (`cow3d.js:142`). The unchanged contact test requires all four cup openings within **.025 m horizontally**, and vertically between the existing teat tip/top. Cup-AABB contact alone is not unwanted penetration or a new acceptance failure. This classification does not certify every cylinder surface or waive other contacts masked by a first hit.

The original pen spec, lines103–105, requires full-shape/body clearance and retains actual standing/turning skin and contact assertions. The leg/solid-plate contact is not the intended teat/cup contract. No universal continuous-math proof requirement is added.

### Smallest defensible next scope

Two read-only rectangular-trim feasibility checks disprove an easy shrink fix. Removing 110 mm of rear overhang still intersects 22/44/82 saved witnesses. Even the tight rectangle just enclosing all four unchanged .045 m-radius cup bases (0.25 x 0.241111 m, zero edge margin) still intersects 14/26/48. These are hypothetical boxes only; **no production geometry changed**. Their positive results reject those candidates, while a zero result would not have proven complete safety.

Recommended next candidate is limited to **`farm3d/cow-yard.js::setRobotPose` transient arm x/y/z motion**: stage the retracted carrier forward into the gap between the legs, insert inward at its low retracted height, then return to the existing under-teat position and lift; reverse for removal. Preserve exact current retracted/fully attached endpoints, all plate/cup/rod dimensions, four cup-contact coordinates, the native cow rig, gates, job identity and 12-second service clock. This is a source-supported candidate direction, not a verified route: front-leg, belly/udder, rod, gate and intermediate cup collisions must all be checked before accepting it. If that bounded candidate cannot pass, stop for a separately scoped carrier redesign.

**Approval required before that arm-motion edit.** A21 authorizes parked gates and matching cow routes, not the robot attachment trajectory. The precise proposed exception is `setRobotPose`'s transient translation path only, with all geometry, final contact transforms and service timing unchanged. Verify original actual default/custom jobs and all displayed body/solid/contact assertions at 30/60/120 Hz, retaining A21 entry/exit limits and failures. No expensive experimental collision system is needed for this diagnosis.

## Install fixture and inactive blocker correction: verified

Production creates `hills`/`far` Object3D arrays before BLOCKS and installs `cowPlantClearing` after meadow creation. The isolated VM extracted their consumers without supplying these inputs. The fixture now supplies nonempty tree objects and wires a clearing spy to the actual lexical binding at the correct phase. Every original test assertion remains unchanged. A new control verifies tree block/route/snapshot identity survives publication and clearing follows active/inactive status.

Once that omission was removed, an unchanged original assertion exposed an A21 adapter defect: `syncCowGateBlocks` replaced registry-owned inactive coordinates (>=10000) with legacy 1000-series placeholders. The pre-edit hash and exact intended correction were recorded in `acceptance.md` before editing. One expression now preserves the registry-assigned inactive x/z while updating extents. This is covered by A14/A21 matching-blocker authority. Active gate poses, blockers and routes are unchanged, so A21's successful active browser cases were not repeated.

Final focused result: **17/17** in `install-final-wired-clearing.txt` (original scene-install cases, the new tree/clearing case and A21 registry lifecycle). The original `hills` RED remains in the A21 directory. `install-fixture-corrected.txt` retains the exposed inactive-coordinate failure and a new test's incomplete actor-spy error. `install-final.txt` retains the new clearing-spy's lexical-shadowing setup error; wiring the existing lexical variable, rather than changing the assertion, fixed it. No blind unchanged rerun.

## Chicken lock: exact drift identified; registry held

The registry expects `2c4293ab...`, exactly matching `ed0c09a^`. Only these later changes distinguish current bytes:

1. `ed0c09a`: adds the `postNightAwakeUntil` condition to daytime bed requests. A17 records the named file, exact preimage and intended condition; A15/A14 supply the wake/pen authority. Result hash `0b0a007c...`.
2. `e420efd`: removes the stale `groundLeg===false` prerequisite from the existing occupied **intermediate raised-floor** waypoint bypass, plus four explanatory comments. Equal-height, real occupied sleeper, final-dock, support and physical-step rules remain. Its captured second-night RED, source diagnosis, new 500-second focused case and 28/28 controller results are retained. Current hash `e4b680d...` exactly equals this immutable commit, with no subsequent drift.

`chicken-stations-retrospective-scope.test.mjs` reconstructs the old reviewed source by reversing exactly those changes: **5/5** controls pass, including deliberate wake-barrier, collision-margin, final-dock and unrelated-byte corruption. This does not make the existing positive lock green. The registry remains unchanged and its original RED remains valid.

**Procedural gap:** the later `e420efd` correction is pen-related under A14, but a separate pre-edit named-file/digest entry for that correction was not found in its committed acceptance/amendments. The retained after-the-fact report and this exact immutable diff are retrospective evidence; they do not prove that the required pre-edit gate occurred. To close bookkeeping, explicitly accept that retrospective scope review and register only these two audited changes, keeping the frozen predecessor and the new negative controls. Do not silently replace the digest or pretend the earlier gate happened.

`chicken-history.json`, the two exact `.diff` files and the frozen reviewed source contain full hashes and provenance. One overly broad historical pickaxe lookup reached a missing partial-clone object and failed DNS while trying a read-only fetch; it was not retried. All required three local trees were available and compared directly. No remote write occurred.

## Stop state

Only runtime change: inactive gate placeholder preservation in `index.html`. Cow geometry, rig, chicken controller, lock registry, terrain, game/economy/Firebase, original evidence and A21 route code are unchanged. No browser/full matrix was run; A21 care/wake coverage remains0/30 and physical qualification remains blocked on attachment contact. All owned commands finished. No upload, Site update, merge or deployment; previous upload hold remains.
