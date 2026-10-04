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
