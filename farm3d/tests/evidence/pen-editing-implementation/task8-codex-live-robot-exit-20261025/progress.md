# Live robot exit verdict — 2026-10-25

Base: `780ab878d3bf02cb13ae17539e0725789561e9d2`, branch `codex/safe-test-preview-20261023`. Local-only checkpoint. Current instruction prohibits geometry/rig changes, broad matrix, new performance benchmark and all remote writes. No runtime edit or new adapter digest was made. Acceptance was recorded in `acceptance.md` before either browser run.

## Verdict

The opened robot exit-gate collision is a **real native-controller defect**, not merely the earlier scripted benchmark. Both the ordinary default installation and an installed default-shaped custom saved pen reproduce it. The custom fixture exercises boot installation, not another native editor Apply journey.

Pinned local Chromium 151.0.7922.34, 30 Hz, five actual cow controllers, 46 owned animals with the other 41 paused. Disposable paid stock and a real `G.milkCow` job are used. Roots, controller routes and reservations are not replaced. The served HTML adds only a read-only getter exposing actual navigation arrays/predicates; disk `index.html` is unchanged. External requests and service workers are blocked. These are not physical-phone, hosted, full-herd or performance results.

| Case | Approach + milk setup | Actual exit | Displayed frames with actual skin intersection | Minimum five-cow root separation |
| --- | ---: | ---: | ---: | ---: |
| Default | 24.3 s | 8.5 s | 64 / 255 | 1.3808716145 m |
| Installed custom | 24.3 s | 8.5 s | 64 / 255 | 1.1745733689 m |

Both finish the real job and release its reservation within the original 60-second setup and exit limits. Maximum target speed is 0.8000000000000185 m/s within the unchanged per-step allowance; root support error is zero. All five cow identities and the target robot reservation generation/job ID remain stable throughout. There are no browser errors. This does not establish hoof contact, full skin containment, other cows' physical safety, all paid/save fields or continuous safety between displayed frames.

Each run has 37 lower-bar and 27 upper-bar first witnesses (primitives 40 and 41), from exit frames 115–178. Direct `Box3.intersectsTriangle` rechecks confirm all 128 actual saved triangle witnesses; all 128 far-translated obstacle negative controls reject. 118 still intersect a diagnostic box inset by 1 mm. That inset is evidence of positive penetration, not a changed runtime shape or acceptance tolerance. The first witness occurs at root `(8.44, .08, -39.2)`, yaw `.8`, while following the authored turn target `(6.95, .08, -39.2)`.

## Root cause and registration

- `cow-yard.js:91,108`: the exit leaf parks at `+PI/2`, from z −38.2 to −40.3; the entry leaf parks at `−PI/2`, from z −34.4 to −32.3. Both are at x 7.55. Their actual lower bars overlap the height of the side rail, not just a loose bounding volume.
- `cow-yard.js:48` defines fixed obstacle rectangles, including the final bed divider and robot side rails, but not moving leaves. `index.html:1643–1650` builds `BLOCKS`/`OBST` from those rectangles. `animal-pen-scene.js:13` installs the same authored obstacle category for custom pens. `index.html:2024–2035` changes gate mesh status without synchronizing dynamic leaf blockers.
- Both live snapshots have **no registered obstacle** at the opened exit-leaf midpoint `(7.55, -39.25)`. The final bed divider at `(6.2, -38.65)` **is registered**, as obstacle 121 in default and 134 in custom.
- `index.html:2214–2238` routes and directly advances the actual exit waypoints, checking neighbour separation but no static swept body geometry. Sidesteps check authored static rectangles, which also omit the leaves.
- The actual path is dock → exit `(8.6,-39.2)` → turn `(6.95,-39.2)` → clear `(6.95,-37)`. The script did not invent that root route. However, its starting rig state/phase/actor and timing differ: the earlier four first-witness divider hits were **not** seen as first hits in this live exit capture. They remain valid scripted adversaries, not proven live bed-path failures or cleared cases. The first-hit query can also mask simultaneous hits; no universal divider-clear claim is made.

## Why a registration-only patch is not safe completion

A read-only call to the unchanged route function with exact opened exit-leaf rectangles makes `hitsBlock` detect the crossing. The custom route returns `[]`; the default route returns the original intersecting goal because `index.html:1690` falls back to `[to]` when no graph path exists. Neither outcome is a valid physical exit. Also, `updateCowTaskStep` consumes waypoints before finding a path and can advance lifecycle on an empty path; a future fail-closed correction must preserve the pending target/job rather than merely return `[]`.

Independently of graph completeness, the measured XZ projections of the opened exit leaf, side rail and opened entry leaf span z −40.3 to −32.3 at x 7.55. The pen ends at −40.2 and −32.8. Applying the **existing** segment margin `.42 − .05 = .37` makes those intervals overlap across the entire pen depth. Thus the current planar collision contract has no contained route crossing from the robot lane's x 8.6 side to the yard's x 6.95 side while all these parked solids remain in place. This is a measured obstruction under existing planar constraints, not a universal claim about every possible 3D motion/animation or redesigned layout. Walking outside the pen, ignoring containing obstacles, jumping, shrinking padding or crediting a stopped cow would violate the task.

## Exact next decision

**Pending scope decision, not an execution denial:** permit changes to the two robot gates' parked-open poses/kinematics in `farm3d/cow-yard.js::createCowYard` / `setStatus`, so they park clear of the authored entry/exit space. Keep bar mesh dimensions and closed barrier, cow rig, pen boundary, terrain, care surfaces and all original physical limits unchanged. Record immutable preimage digest before any edit. A possible inward parking arrangement must be checked for leaf-to-leaf overlap and swept closing collisions; it is not already qualified by this diagnosis.

Under the existing pen-fix grant, accompany that permitted geometry correction with narrowly scoped dynamic gate blocker synchronization and fail-closed cow waypoint handling in `index.html`; update `animal-pen-scene.js` only if needed to make installation/disposal/rebinding retain the exact same blocker ownership. Record each actual file/scope before editing. No blanket scene redesign or full-body movement integration is authorized by this report.

Finite next verification: the retained default/custom native job traces must complete without actual gate/divider skin hits; valid bed approach remains usable; closed-gate and deliberately obstructed exit must block without fake completion or lost reservation; reopened/rebound gate must recover; retain speed/support/separation and original deadlines. A geometry change can remove this specific obstruction, but does not itself solve the earlier A19/A20 swept-body post failures or the observer's performance problem.

## Evidence and preserved state

- `default.json`, `custom.json`: exact source, disposable fixture, native task/path/waypoints/reservation trace and all first triangle/solid hits. Both status `LIVE_ROUTE_PHYSICAL_RED`; exit code 1 is expected retained failure.
- `default-first-hit.png`, `custom-first-hit.png`: actual first-hit rendered captures. The automatic camera is partly roof-occluded; these images alone are insufficient visual proof. `live-exit-geometry.svg` is an explicitly labelled coordinate plot of recorded geometry and route, not an in-game screenshot.
- `verification.json`: offline evidence checks, exact barrier intervals, controls and 20 immutable runtime/helper/historical hashes. The original 65 confirmed / 59 uncertain / 1 conditional-clear / 0 invalid-domain classification is preserved.
- New test harness: `tests/cow-live-exit.browser.cjs`, `tests/helpers/cow-live-exit-diagnostic.mjs`, `tests/cow-live-exit-evidence.mjs`. No existing test, tolerance, seed or deadline changed. One read-only console summary tried to slice an absent archived history entry; it changed no file or test outcome and caused no browser rerun.

All browser/server commands completed and closed. No executor or approval request is pending in a tool. No runtime fix, performance run, broad matrix, upload, Site update, merge or deployment. A20 physical safety remains RED and care/wake remains 1/30. Both relays updated locally; previous denied upload remains held.
