# Finite swept-proxy implementation checkpoint

Started at `d9651da113d23649cb4ed50f510158802f26715d`; stopped at the parent's explicit request at 05:33 UTC. All commands completed. No executor/permission wait or active test remains.

## Delivered

Six new test-only source files implement the actual production-domain adapter, cached 92-group/3448-node skin hierarchy, guarded triangle interval refinement, explicit recovery-event traversal and bounded clear-envelope caches. The provider follows body/attention/face/tail, heading feasibility, gait stance/swing, reach clipping, evaluated-versus-stored recovery, supplied flat/slab height unions and care/lie onset. Unsupported carriers, missing recovery provenance and moving care overlays reject explicitly. The skin formula keeps original weights and correlated bone-local bind offsets. Numerical guard is outward-only 1e-6 m plus operation/magnitude terms. No geometry, accepted threshold or existing test changed.

Bounds reuse is conditional: a new complete domain must fit a previously proved clear envelope. Obstacle coordinates invalidate the cache; geometry versions are checked; node certificates contain only relevant bone domains, with a 256-node cap and 12 whole-pose envelopes per rig. Root segments retain the complete 0.42 m padding and never exempt containing obstacles. No new code is imported by gameplay.

## Retained implementation failures and researched corrections

- `initial-domain.json`: interval rounding just below zero rejected a valid first lie weight. Intersecting with the production clamp's actual [0,1] range corrected the adapter; no collision tolerance changed.
- `feed1-30-initial.json`: the adapter included a planted zero-lift branch during a definitely swinging leg. The actual production branch condition removed that impossible alternative.
- `feed1-30-plant-branch.json`: modulo wrap was represented as an entire gait cycle. Separate end/start phase intervals preserve the source's local transition.
- `feed1-30-phase-union.json`: time subdivision could not narrow a recovery-phase event. The evaluator now traverses the recorded evaluated-to-stored phase interval separately from ordinary positive-time motion.
- `feed1-30-event-traversal.json`: blink scale and bind translation lost their shared offset, producing a metre-scale conservative bound. Bone-local bind coordinates retain the exact algebraic correlation.
- `feed1-30-correlated-bind.json`: the displayed-start path stopped at a conservative leaf box. It now uses the same guarded triangle interval refinement; a displayed pose never substitutes for the temporal query.
- `chew-wrap-red.json`: a real adapter underbound (about 0.52 mm vertex miss) was reproduced when production wraps chew phase before its half-frequency jaw channel. Explicit wrapped pieces correct it; `chew-wrap-green.json` retains the exact control. This was a defect in the new test-only provider, not a runtime rig change.

Each subsequent approach run followed a specific source-based correction; none was an unchanged blind retry. Intermediate raw results remain intact.

## Final focused evidence

- `controls-cached-final.json`: **21/21** controls, including exact recorded A19/A20 root paths, containing-post rejection, actual skin contact while the root is clear, valid authored dock poses, nonmutation/RNG, stale/invalid inputs, deliberate underbound, cache reuse and obstacle/movement invalidation.
- `cached-containment-final.json`: **11/11** bounded cases, **1,903,680** actual vertex checks plus bone-coefficient comparisons at interior times. Covers idle/walk/turn/recovery, feed/drink/lie onset, both support heights, and chew wrap. Sampling is verification of the source-derived intervals, not universal native-math certification.
- The nine `cow-*-*-cached-final.json` files: both feed stations and drinking at **30/60/120 Hz**, **31,751** simulated frames total. Complete approach/settle/creep/contact/stand sequences pass. Maximum speed **0.8 m/s**; maximum mouth error **0.0157432998967 m** against unchanged **0.08 m**. Approaches finish in about **42.1–42.2 s**, complete sequences in **49.09–51.1 s**. These are seed-0 isolated authored fixtures using the already retained experimental profile, not seed substitution for the original herd matrix. The original 500 s care contract is unchanged; the diagnostic retains its stricter 50 s approach/60 s sequence caps.
- `verification.json`: aggregate results and source/protected hashes.

## Measured integration blocker

Complete five-query stress measurements include displayed-pose copying, production-domain construction, event/temporal traversal and triangle refinement; rendering, controller and ordinary animation are additional.

| Workload | Median | p95 | Max |
| --- | ---: | ---: | ---: |
| Five repeated care snapshots, uncached traversal | 28.01 ms | 36.88 ms | 42.13 ms |
| Five identical cached snapshots | 4.22 ms | 5.16 ms | 7.61 ms |
| Five evolving care snapshots, whole-pose cache | 18.80 ms | 25.30 ms | 36.84 ms |
| Five evolving care snapshots, bounded node cache | 17.76 ms | **23.40 ms** | 30.40 ms |
| Five evolving snapshots, distant solids | 4.67 ms | 5.83 ms | 6.19 ms |

The identical-snapshot result is **not** a moving-game performance claim. The evolving near-solid workload still visits about **861.52 hierarchy nodes per five queries**. Its 23.4 ms added p95 exceeds an entire 60 FPS frame and consumes about 70% of a 30 FPS frame before the rest of the game. These are desktop Node/V8 measurements, not a phone failure or phone clearance. The stress fixtures repeat the two feed stations: they measure five independent queries, **not a valid five-cow reservation layout**. A capacity-valid mixed station workload and actual browser/device cost remain unmeasured. Setup retained heap delta was about 42.2 MB, including the shared cache, cow template and five fixture/shadow rigs, not cache-only memory. The final additional missing-provenance guard followed that benchmark; successful query mathematics/traversal is unchanged, but exact-final-byte cost was not rerun after the stop request.

Integration is held on this measured cost/risk, not on a newly invented transcendental-proof requirement. The next finite step, if resumed, is to isolate the expensive near-fixture blended head/neck leaf descent and assess a tighter precomputed bone-local bound, then measure a capacity-valid five-station mix. Do not repeat the broad matrix or the unchanged profiles just to obtain status. If a performance correction changes the predicate, rerun only affected containment/control/profile cases before protected integration.

## Explicitly pending

- Runtime/controller integration, physically executable live post avoidance, original animated A19/A20 browser replays and matrix requalification.
- Live support-cell classification instead of a supplied height union; arbitrary terrain/moving-care modes remain unsupported.
- Complete bed/robot approach and lie-transition routes (current evidence includes their endpoint/lie controls, not full routes), real herd reservations/separation, browser and phone cost.
- All previous release gates remain. A20 care/wake credit stays **1/30**, physical safety remains **RED** in gameplay.

Protected `index.html`, `cow3d.js` and `cow-yard.js` hashes remain exactly unchanged. No protected-file amendment was needed for these new test-only files; one must still precede any runtime edit. No upload, Site update, merge, live deployment or original worktree change occurred. Prior upload denial stays held.
