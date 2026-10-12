# R8 reach-cache experiment

Base: `c984432dee057f9e76e3ad583076658996b4de2e`; main re-fetched unchanged at `205b25db0aab877aa6cf9a40adcbc766640c78cf`.
Branch: `codex/horse-r8-reach-cache`. Original R8 review worktree preserved.

## Scope

Only production edit: horse3d.js timeToReachLimit. Cache its last exact x/z/hard/from query separately for each leg; invalidate at every planner update. A miss executes the original arithmetic and scan; a hit returns its unchanged result. No forecast horizon, planning rate, threshold, geometry, IK, stance-helper, gait, root-movement or other-system change.

Rejected experiment: eagerly caching all forecast hip coordinates preserved the 39 quick comparison traces but slowed most turning cases. Rejected before integration; no broader validation claimed for that version.

## Measured candidate behavior and cost

Quick supplied equiv.mjs comparison: 39/39 runs, 23,576 frame traces matched unchanged R8. The comparator hashes selected planner/hoof-track/bone output bits; it does not compare every possible rig property.

Supplied perf2.mjs, five repetitions, median microseconds per horse update:

| Case | R8 60 Hz | Cache 60 Hz | R8 120 Hz | Cache 120 Hz |
| --- | ---: | ---: | ---: | ---: |
| Straight walk | 147.1 | 131.6 | 164.2 | 146.2 |
| Walk reversal | 139.7 | 137.5 | 151.9 | 154.8 |
| 90-degree walk turn | 142.5 | 112.1 | 128.5 | 125.8 |
| Tight circle | 127.8 | 133.1 | 135.9 | 136.0 |
| Canter turn | 72.5 | 67.1 | 77.6 | 82.9 |
| Idle | 23.3 | 22.7 | 21.8 | 22.8 |

Node results are mixed; do not claim a universal gain.

Unprofiled Chromium 153, supplied throttle.cjs, six horses, 6x emulation, sequential R8 then cache, 900 frames with first120 omitted:

| Source | Median | p95 | Maximum |
| --- | ---: | ---: | ---: |
| R8 | 6.3 ms | 14.2 ms | 54.1 ms |
| Result cache | 5.4 ms | 10.1 ms | 39.2 ms |

This single host comparison suggests a useful roaming-workload improvement; no confidence interval, actual-phone qualification or full-game FPS claim. Browser comparison completed before broader CPU validation began.

## Validation checkpoint

Unchanged node --test horse-motion-evidence.test.mjs horse-contact-feasibility.test.mjs: 11/11 PASS, zero failed/skipped/cancelled. Includes both 104-scenario matrices at30/60/120Hz (312 each,624 total), 56 pinned roaming sessions, tight circles,1/1.25m/s90-degree response and original motion windows. Duration342.771s on this host.

Independent45-session roaming: minimum walk/idle support2, zero emergency lifts, zero final swings, maximum planted sole0.499999713mm, maximum target residual4.471e-12mm, longest swing0.447467s. Earlier figure-eight cases and all18known reproductions passed. Independent hard stops30/60/120Hz, slow reversal and gait-restoration probes passed; see retained diagnostic logs.

Full supplied equiv.mjs comparison:343/343 runs,159468 frame traces matched unchanged R8. Tests and comparisons exercised the production code saved in candidate commit `739dfc9cec622539a1a320081141fa619fef3ffd` (tree `c316294b9c68c8b75742451e128a0d566072e52e`). Subsequent report/relay edits do not change tested production files.

Standalone matrix.mjs also finished:0/312 failures at height2.3 and0/312 at1.6, using unchanged30/60/120Hz checks. Minimum walk/idle support2 and idle-recovery support3 in both. Maximum planted sole0.499999713mm/0.499999800mm; longest swing0.433333333s. Final queued validation command exited0. Protected-file diff inspection confirms no production files except horse3d.js changed from the isolated base.

No hosted CI dispatch, push or merge. Owner positive R8 visual feedback does not automatically approve this candidate or prove performance. Verdict: locally validated bounded optimization; performance qualification and browser failures still block integration.

Integration remains blocked by remaining browser failures and actual-device qualification. Preserve all original test thresholds. No optional visual/animation polish.
