# Authorized narrow cow turn correction

Base 9db7d6d8424cf008926106aa3ceb5bc060a138a4. Sole worker, parent-selected gpt-6-astra/xhigh. No merge/deployment or visual acceptance.

Acceptance recorded before runtime changes:

1. Replay the exact retained unaligned 30/60/120Hz root trajectories from transitions-clock/results.json; retain the original failure output. Observe original displayed frames, .05m liftoff and 1e-10m planted contact/anchor bounds. No internal substep substitute.
2. Correct only updateCow3D heading and hoof reach/release/recovery block. Preserve .34 reach, solver, gait constants, appearance/anatomy and collision margins. Test left/right initial and moving 90/180 degree turns, walk/run/stops, finite bones, hip cover and cadence.
3. Run unchanged accepted cow motion/contact/transition, care/robot/support and relevant full regressions. Classify any pre-existing historical failures against the baseline.
4. Run the unchanged clock-corrected real care crossings at 30/60/120Hz with original 6s deadline, speed/contact/liftoff limits; inspect rendered evidence. Separately retain the known ordinary-route fixture RED and validator gap; do not change validator or clearances.
5. Record owner authority in amendment A3 and exact adapter digests only after reviewing the candidate. Add negative lock controls proving unauthorized bytes and scopes remain rejected. Verify all frozen evidence and excluded runtime bytes. Update both relays and finish at a clean tested checkpoint.

## Candidate review

Exact retained RED reproduced: 30/60Hz .06639028036599m, 120Hz .03291402582471m. The broader initial/moving 90/180-degree matrix also exposed existing failures. Candidate 1 fixed retained replays but retained eight 30Hz running liftoff failures (.0685457m). Candidate 2 passed all65 focused checks and all three unchanged live crossings, but supplemental all-frame comparison showed faster default-stride recovery. That candidate is not the final implementation. Candidate 3 preserved the straight nominal stride, but its travel-derived heading cap delayed all releases beyond the short retained pre-slab trace at two rates; both failures remain in turn-candidate-3.log.

Candidate 4 uses a heading-only four-radian/second cap, further limited by actual planted-anchor reach, with early release if another root step would exhaust the existing .34m reach. The cap bounds airborne hoof rotation even when no planted leg constrains heading. Recovery retains the release direction in world axes while preserving ordinary root translation and nominal gait travel; vertical release residual prevents the first swing sample from jumping upward. Replant uses the actual recovered target, not a stale local residual. Solver, all COW_GAIT constants, .34m reach and collision geometry/margins remain unchanged. Candidate 4 passes all65 focused tests. Source snapshots and all attempt logs are retained. Final source differs from candidate4 only in a clarifying hard-guard comment.

Supplemental default/turn comparison is in recovery-comparison-4.json. Phase/distance stay identical. Peak all-frame motion falls from .946m to .418m across sharp cases, but this is not a new absolute motion clearance: some running swing peaks rise (e.g. initial -90-degree turn at30Hz .374 to .418m); the .05m criterion governs planted-to-released frames, not every running swing frame. Straight walking peak motion stays essentially at the original envelope; conservative early release reduces planted-frame totals, most at30Hz run (about14%). Those behavior changes require real rendered review and remain distinct from owner visual approval.

## Rendered and live evidence

Final unchanged live original probe: all three actual Beast care crossings pass at30/60/120Hz in1.8667/1.85/1.8333s, original6s bound. Maximum liftoff1.52e-14m, planted support3.50e-15m, planted drift4.30e-14m. Overall report intentionally remains RED because its original ordinary-route assertion is unchanged and still fails; that is the separately diagnosed fixture assumption/validator discrepancy, not a rig failure. The driver and prior raw files were not modified.

Supplemental render-turns.cjs:21 cases pass (18 default-slab walk/run left/right90/180-degree turns plus3 reverse support crossings at30/60/120Hz). These use the actual cow module in the actual game renderer and the applied cow yard. Supplemental root trajectories are API-driven diagnostic inputs, not physical navigation qualification. Real before/release/recovery/settled PNGs are in rendered-final/. Representative30/60/120Hz images were inspected: joints remain attached, hoof shapes and body proportions intact. Reverse seam rails obscure some feet. The original unchanged crossing driver also retains its overlapping old stationary probe, so those frames alone cannot qualify silhouette. Supplemental default turns isolate one visible cow. These are rendered still sequences with per-frame numeric records, not owner visual acceptance.

Default-module compatibility: one version cow3d.js?v=5 remains in index, care poses and the unreleased v64 shell; no importer or locked care-pose byte changed. Existing network-first authored-module loading remains intact. Predecessor/offline/cache upgrade qualification and any release version coordination remain Task8 work; no deployment occurred.

Historical B13 chew-fade assertion and B16 terminal phase consistency fail both before and after with the same messages/numbers. They were not skipped or rewritten; motion-baseline.log and historical-final.log retain them. They are outside the existing core runner, and full release readiness is not claimed.

## Final checkpoint results

99/99 core Node files and282/282 index consumers pass. Core now registers both new turn/lock tests and unchanged B10/B12/gait tests in addition to all previous94 files. Default cow browser integration passes at740x360,844x390,1280x720 (emulated viewports). Unchanged robot browser passes native touch feed/water, physical docking/service/exit, single tank credit/pickup with no duplicate XP, and night feeding/drinking/folded bedding/stand-before-robot. All launched commands and owned browser/server pairs finished.

Integrity:1569 prior tracked files compared; only four authorized implementation/guard/runner files changed before relay updates. All921 prior evidence files exact, other19 protected implementations exact, existing six adapter records exact. A3 successor 2d0be792fa13d5a12eb9dd48e011d5d74557e943df580cdb70e7538eb4e3fb01; prefix/suffix frozen and six negative controls pass. No pet sweep rerun because pet/navigation/index/support dependencies were unchanged. No test assertion, seed or deadline weakened. Raw native logs/snapshots retain original formatting, including diagnostic whitespace.

Remaining: separate usable-expansion/free-roaming validation discrepancy and original route fixture RED; historical B13/B16 failures; independent cow assembly support/full-farm/gate traffic, new-farm/2D import, Edit > Animal pens with pause/input isolation, four viewport journeys, full46 qualification/recovery/cloud/resource/cache predecessor and official hosted/device checks. No merge/deploy or visual acceptance.
