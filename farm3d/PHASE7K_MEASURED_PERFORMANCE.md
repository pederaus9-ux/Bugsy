# Phase 7K — Measured performance optimization

Status: IN PROGRESS

Base: merged Phase 7J main `c1c88c34784971baf5a0807ba7a34a357646d293`.

This phase follows the current `PHASE7_PLAN.md` roadmap. It is strictly evidence-driven: measure first, optimize only confirmed constraints, and preserve gameplay, saves, visuals and mobile reliability.

## Scope

Evaluate and, only where measurements justify it, optimize:

- GPU: render scale, shadows, bloom, tilt-shift, grass distance/density, particles and texture pressure.
- CPU: animal updates, raycasts, DOM synchronization, hot loops, save work, timers and avoidable allocations.
- Frame delivery: median, p95 and worst-frame behavior rather than average FPS alone.
- Mobile thermals/battery: sustained performance on Android landscape, especially 844×390.

## Required baseline scenarios

Measure at minimum:

1. Classic mode and Walk mode.
2. Noon, golden hour, rain, snow and night.
3. Dense crops, many animals and a decorated/heavy farm.
4. Panels open/closed where relevant.
5. Fresh load, several minutes sustained play, and a longer thermal run.
6. Mobile-sized browser profiles plus desktop regression coverage.

Use the existing `?perf` observability and current analytics/performance buckets where useful. Record before/after evidence for every optimization that survives review.

## Performance interpretation

Roadmap targets are goals, not pre-existing claims:

- ideal: 60 FPS / 16.7 ms
- good mobile: 45+ FPS / 22.2 ms
- acceptable floor: 30 FPS / 33.3 ms
- investigate sustained frames above 33.3 ms
- investigate hitches above 50 ms

Do not trade correctness for a benchmark number. A change that improves one scene but harms save reliability, interaction, animation, visual stability or another common scene is not accepted.

## Optimization rules

- No speculative rewrites or framework/build-system changes.
- Keep the handwritten three.js/JavaScript architecture.
- No save-schema or economy changes.
- No real-money features.
- Preserve current Firebase 12.19.0 behavior and Phase 7J analytics.
- Preserve animal/farmer behavior and six-species visual acceptance.
- Prefer caching, reuse, bounded update rates, reduced redundant work and adaptive quality over removing visible features.
- Do not weaken tests, thresholds or timeouts to manufacture a pass.

## Validation gate

Before this phase can be proposed for merge:

- Document measured baseline and identified bottleneck(s).
- Document each retained optimization with before/after measurements.
- Verify no material regression in visual quality or interaction.
- Run full Farm3D core regression.
- Run six-species animal visual coverage.
- Run old-save coverage.
- Run analytics/dashboard coverage.
- Run Firebase/cloud/recovery integration.
- Keep exact production/emulator Firebase SDK parity.
- Require all hosted checks green on the exact PR head.

After deployment, require a short S26 Ultra physical performance/thermal/gameplay acceptance before Phase 7L begins.

## Out of scope

Phase 7L accessibility/mobile UX changes, Phase 7M visual makeover work and Phase 7N release-candidate stress testing remain separate phases. Do not fold them into this PR.

## Reproducible local measurement

Run `npm run measure:performance` in `farm3d/tests`, using `CHROME_PATH` when
Chromium is supplied by the local Chrome installation. `PERF_ARTIFACTS` selects
the output directory; `PERF_SAMPLE_MS` and `PERF_SUSTAIN_MS` select durations
(defaults: 5 seconds per scene, 180 seconds sustained). `PERF_SOFTWARE=1` selects
SwiftShader explicitly; software results must not be called hardware GPU evidence.

The benchmark instruments an HTTP-served copy of the current page in memory.
Production game files are unchanged. It isolates external services, uses the
existing non-saving test farm, and checks page errors and the unchanged player
save. The loaded fixture has 30 ripe crop plots, the maximum 20 penned animals
plus dog/cat, all buildings and 16 decorations. Both 844x390 at DPR 2 and
1280x720 at DPR 1 cover Classic and Walk at noon/golden/rain/snow/night, a moving
Walk sample and a barn panel. Mobile-sized viewports still use the PC GPU.

CPU stages cover camera/hands/doors/effects, the animal loop, game/aim/farmer,
world wind/weather and composer submission. The total is main-thread frame work;
render submission may include driver stalls and is not GPU elapsed time.
Asynchronous `EXT_disjoint_timer_query_webgl2` measures the full composer GPU
pipeline separately where supported; disjoint results are excluded. Calls and
triangles include every composer pass through the existing `?perf` monitor.
Timing probes add overhead. Headless frame dispatch is uncapped, so its intervals
are diagnostic throughput and hitch evidence, not physical display FPS.

The bounded probe retains at most 100,000 samples per stage and fails if the
measurement fills it. An initial local attempt used a 20,000-sample limit which
filled before the sustained CPU window ended; that attempt is preserved locally
and superseded by a full-window rerun. Boot-to-ready is measured once, separately
from scenario duration. Resource snapshots before/after each sample distinguish
lazy initialization from later changes; JS heap values include benchmark arrays
and uncollected garbage and cannot establish a leak or battery behavior.

Current baseline results and the owner's device result are recorded below when
complete. No benchmark-only green run establishes release acceptance; all five
existing hosted jobs must pass on the final PR head, followed by its specific
human merge approval and the required post-deploy phone gate.

## Measured result: preserve current production performance

The full local run completed all 25 scenarios on the NVIDIA RTX 5060 Ti with
actual D3D11 GPU timers and no page errors or player-save writes. Timing is
instrumented desktop headless work, not physical phone FPS. No production
optimization is retained because no material constraint was demonstrated.

| Profile / sample | CPU total p95 ms | GPU p95 ms | Worst dispatch interval ms |
| --- | ---: | ---: | ---: |
| 844 / classic-noon | 5.4 | 4.28 | 8.3 |
| 844 / classic-golden | 5.2 | 4.31 | 8.5 |
| 844 / classic-rain | 5.4 | 4.52 | 8.1 |
| 844 / classic-snow | 6.1 | 4.84 | 9.1 |
| 844 / classic-night | 5.4 | 4.45 | 8.1 |
| 844 / walk-noon | 3.7 | 3.02 | 9.2 |
| 844 / walk-golden | 3.3 | 3.08 | 6.7 |
| 844 / walk-rain | 3.9 | 3.36 | 6.2 |
| 844 / walk-snow | 3.5 | 3.26 | 5.4 |
| 844 / walk-night | 3.5 | 3.29 | 7.1 |
| 844 / walk-moving-noon | 4.5 | 3.58 | 9 |
| 844 / classic-barn-panel | 6 | 4.92 | 8.2 |
| 844 / classic-rain-sustained | 5.8 | 4.76 | 10.9 |
| 1280 / classic-noon | 5.4 | 4.08 | 9.9 |
| 1280 / classic-golden | 5.2 | 4.33 | 8.2 |
| 1280 / classic-rain | 6.3 | 4.92 | 13.4 |
| 1280 / classic-snow | 5.4 | 4.45 | 7.7 |
| 1280 / classic-night | 5.2 | 4.27 | 8.7 |
| 1280 / walk-noon | 3.3 | 3.06 | 6.1 |
| 1280 / walk-golden | 3.5 | 3.18 | 5.6 |
| 1280 / walk-rain | 3.4 | 3.11 | 6.2 |
| 1280 / walk-snow | 3.8 | 3.21 | 7 |
| 1280 / walk-night | 3.9 | 3.23 | 6.2 |
| 1280 / walk-moving-noon | 4.6 | 3.51 | 7.7 |
| 1280 / classic-barn-panel | 5.8 | 4.58 | 9.5 |

All measured windows had zero dispatch intervals over 50 ms. CPU total p95
was at most 6.3 ms; GPU p95 at most 4.93 ms. The full three-minute rain sample
captured 34,837 CPU frames, p95 5.8 ms CPU and 4.76 ms GPU, worst dispatch
10.9 ms. GPU geometries/textures stayed 318/120 throughout that sustained
window. Earlier resource changes between scene transitions reflect new visible
content/caches; these results do not establish unlimited-session memory behavior.

The mobile-sized postcapture screenshot includes a 64.8 ms recent interval.
It is outside the timed window and overlaps exporting the large probe arrays,
consistent with benchmark collection overhead. It remains preserved and is not
concealed by the timed-window summary. The benchmark does not claim that all
out-of-window work, including probe export, stayed below the hitch threshold.

The owner provided a real S26 Ultra first-person snow screenshot: 60.0 FPS,
median 16.7 ms, p95 17.4 ms, worst 18.9 ms over the five-second display window.
Viewport 780x360, device/render DPR 4, reported scale 200% relative to the capped
base DPR 2, 2048 shadows, bloom on, tilt off; 50 full-composer calls and 994,003
triangles. Owner replies: Cool warm, then Not that I noticed in response to
battery/stutter/resolution questions. The requested session was 5-10 minutes;
its duration and battery percentage were not independently measured. This is
current short-session physical evidence, not the final 7N long stress gate.

Evidence is in `tests/evidence/phase7k/`. Production index/game/auth/analytics,
animal modules, rendering, schemas, service worker and quality policy are unchanged;
the PR adds an opt-in reproducible benchmark, evidence and program documentation.
No before/after speedup is claimed because no production optimization was made.

Final exact-head CI and specific PR #47 merge approval remain pending. After
approved merge/deploy verification, request the agreed short S26 acceptance before
starting Phase 7L. Phases 7L, 7M and 7N remain unfinished.
