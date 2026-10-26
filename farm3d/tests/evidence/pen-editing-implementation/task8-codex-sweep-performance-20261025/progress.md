# Finite performance checkpoint

Source: `525cdccf4afc52346603aaa0802498fb31204472`, branch `codex/safe-test-preview-20261023`. Runtime remains A20. This checkpoint changes only the test-only `cow-hierarchical-sweep.mjs` bound calculation, adds two bounded diagnostic harnesses, and records evidence/relays. No protected runtime amendment was needed or used.

## Measured cause and minimal correction

The saved baseline CPU profile identifies `compoundBounds.bound` as the dominant query operation: 1,256,790 microseconds of sampled self time, versus 102,466 for `triangleMayHit`. The existing stress profile uses duplicated feed fixtures, so it establishes attribution, not a legal herd result. Raw `baseline.cpuprofile` and aggregated, query-call-tree `profile-summary.json` preserve the observation. The candidate profile is a different, capacity-valid fixture and is not used as a paired timing comparison.

The correction caches each bind-space part's absolute coordinate/weight magnitudes, computes bone/root magnitudes once per domain, and uses scalar low/high temporaries instead of allocating intervals for every inner product and sum. Product order, sum order, final interval bounds, magnitude guard, geometry, triangles, refinement, certificates and invalidation remain unchanged. No containing-obstacle exception or reduced clearance was added.

`cow-sweep-bound-equivalence.mjs` imports the immutable baseline helper directly from Git (only rebasing import URLs), then compares **7,598,016 coefficients with `Object.is`**: all 35,176 hierarchy/vertex nodes across 36 whole/interior/cache-expanded/recovery domains for the 11 existing motion cases. All match. A deliberate 1e-8 bound change is rejected without a tolerance. This is finite differential evidence plus operation-order review, not a universal floating-point theorem.

## Capacity-valid cost result

The same benchmark ran before and after the edit: distinct feed1/feed2/drink/robot stations and one free awake cow, minimum root separation 2.3 m, all 62 authored solid boxes supplied to every query, eight full-padding root obstacles. Floor/walkway/bedding support and separately identified grain/water contact media retain the previous classification. Five native rigs evolve each frame; this is not frozen-pose reuse. Every timed batch includes displayed-pose copying, five complete temporal queries, assertions and disposal. Ordinary animation, fixture advancement, controllers and rendering are outside the timing. There is no live reservation/queue-completion claim.

Node 24.19.0 / V8 13.6.233.17-node.51, Windows x64; sequential 20 warmup and 100 measured frames, no concurrent CPU test:

| Added cost for five cows | Baseline | Candidate |
| --- | ---: | ---: |
| Median | 14.9047 ms | 7.9082 ms |
| p95 | 20.2090 ms | 10.1795 ms |
| Worst measured | 37.0151 ms | 14.4939 ms |
| Worst warmup | 46.2811 ms | 33.2959 ms |
| Cache build | 96.1280 ms | 102.1161 ms |
| Cache retained heap delta | 40,801,096 B | 44,694,488 B |
| Post-query retained heap delta | 3,800,968 B | 3,798,384 B |

The p95 reduction is **49.63%**. Traversal work is identical: average five domains, 585.36 visited nodes, 65.14 leaf visits, 4.49 whole-envelope and 28.27 node-envelope hits per five-cow batch. This verifies the speedup did not come from skipping collision work. The worst observed sample is not a worst-case execution bound. Heap deltas are post-GC observations; `heapBeforeFinalGC` is a point sample, not peak process memory.

Separate V8 allocation sampling at 16 KiB, including collected objects, estimates query allocations falling from **45.82 MB to 21.53 MB per five-cow batch (53.02%)**. Cache storage increases by 3,893,392 B. Another approximately 3.72 MB/batch is attributed to cloning across the entire fixture, including both timed collision copies and untimed displayed-state capture. It cannot be presented as the timed-copy allocation count. Raw heap profiles are retained. Sampling changes execution cost; instrumented timings are excluded from the paired timing table. The [Node Inspector API](https://nodejs.org/api/inspector.html) supports this in-process profiling flow; no listener, credentials or network settings were changed.

## Safety checks retained

- Existing **21/21** controls pass unchanged, including exact retained A19/A20 root segments, actual skin contact, valid authored docks, full padding, stale/invalid inputs, cache invalidation and live/RNG non-mutation.
- Existing **11/11** containment cases pass unchanged, with **1,903,680 actual vertex checks**, recovery/turn/support/care/lie/chew-wrap events and bone-coefficient checks.
- The original nine full feed/drink sequences and their 31,751 frames were not repeated: the motion provider, traversal, predicates and accepted assertions did not change, and direct bound equivalence plus the affected controls passed. Their unchanged 0.8 m/s speed and 0.08 m mouth limits remain; they are still isolated profile evidence, not current gameplay qualification.
- Six protected files (`index.html`, `cow3d.js`, `cow-yard.js`, `farm-land.js`, `game.js`, `sw.js`) exactly match the starting Git tree. Hashes and source provenance are in `verification.json`.

## Budget decision and finite next step

The original `PHASE7_PLAN.md:146-148` targets **16.7 ms ideal / 22.2 ms good mobile / 33.3 ms acceptable whole-frame floor**, investigating hitches above 50 ms. There is no separate approved collision-subsystem budget. Candidate p95 alone uses **61.0% / 45.9% / 30.6%** of those totals on desktop Node, leaving rendering, other animals, controllers and browser work unmeasured. Cold queries and allocation pressure also remain material. There is no defensible numerical phone projection from this result.

**Runtime integration remains held.** The finite requested optimization is complete, but this cost is not demonstrated suitable for the game/phone budget. The next smallest performance option is bounded scratch-buffer reuse in the remaining bound/projection arithmetic and detached-pose copying, preserving exact intervals and non-mutation. Its speedup is not promised. No visual/behavior tradeoff was taken or shown necessary; replacing animated coverage with smaller geometry or dropping transitions is not supported by this evidence. A later production decision still needs total browser/phone cost, not a new formal-proof gate.

Live support-cell classification, full authored bed/robot approaches, integrated route/direct/side/rejoin use and original animated browser failure replay remain prior prerequisites. A20 gameplay physical safety is RED; current care/wake coverage stays **1/30** and the broad matrix is paused. No new permission/executor blocker; all commands finished. No upload, Site update, merge or deployment; previous upload denial remains held.

## Exact evidence and commands

All new raw files in this directory are preserved. The existing controls and containment harnesses write into sibling `task8-codex-hierarchical-sweep-20261025/` as `controls-performance-candidate.json` and `containment-performance-candidate.json`; the initial profiled stress is `perf-baseline-profiled.json` there.

```text
node --cpu-prof --cpu-prof-dir=<this-directory> --cpu-prof-name=baseline.cpuprofile --expose-gc farm3d/tests/cow-hierarchical-cost.mjs perf-baseline-profiled evolve
node --expose-gc farm3d/tests/cow-sweep-capacity-cost.mjs capacity-baseline
node --expose-gc farm3d/tests/cow-sweep-capacity-cost.mjs capacity-baseline-alloc alloc
node farm3d/tests/cow-sweep-bound-equivalence.mjs exact-bounds-candidate
node --expose-gc farm3d/tests/cow-sweep-capacity-cost.mjs capacity-candidate
node --expose-gc farm3d/tests/cow-sweep-capacity-cost.mjs capacity-candidate-alloc alloc
node farm3d/tests/cow-hierarchical-controls.mjs controls-performance-candidate
node farm3d/tests/cow-hierarchical-sweep-probe.mjs containment-performance-candidate
node --cpu-prof --cpu-prof-dir=<this-directory> --cpu-prof-name=candidate.cpuprofile --expose-gc farm3d/tests/cow-sweep-capacity-cost.mjs capacity-candidate-profiled
```

No failed command was blindly retried, no old result overwritten, and no existing assertion, seed, clearance or deadline changed.
