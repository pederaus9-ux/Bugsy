# Sunny Acres 3D: Phase 7 development and polish plan

This roadmap supersedes older Phase 7 labels. Work in order, using focused
branches and PRs from current main. The owner reviews and merges each PR.
Phases 7A and 7B are merged. The owner reports a successful Phase 7C performance
session on an S26 Ultra. Its shed-switching repair is merged in PR #27 and live;
the owner's subsequent "good continue" is taken as phone confirmation and
authorization for Phase 7D. Phase 7D adds regression tests and CI; stop for owner
review/merging before starting Phase 7E.

## Rules for every phase

- Work in `farm3d/`; Phase 7D additionally needs its single GitHub Actions workflow
  in `.github/workflows/`. Preserve the older `/farm` game and unrelated root app.
- No real money, ever. Coins and gems are earned through gameplay.
- Preserve saves, progression, mobile usability and the cozy game identity.
- Keep the handwritten three.js/JavaScript architecture. Avoid giant rewrites,
  casual framework/build-system additions and speculative optimization.
- Mobile web comes first: Android Chrome, iPhone Safari/PWA; check landscape
  740×360 and 844×390 as well as desktop.
- Measure before optimizing. Existing grass, instancing and adaptive quality
  stay intact unless evidence justifies a change.
- New persisted fields need defaults in `fresh()` and repair in `upgrade()`.
- Bump changed modules' query versions and the service-worker cache when needed.
- Each meaningful change reports what/why, validation, risks and measurements.

## Ordered roadmap and approval gates

| Phase | Scope and acceptance |
| --- | --- |
| **7A — Baseline stabilization** | Audit current main, verify PR #24's seed-drag guards, make E interact only (Enter also interacts; Q/Left turn left, Right turns right; WASD moves), record this plan and correct stale handoff statements. Validate parse, normal/testfarm boot, page errors, input, planting/cancelled drag, save/reload and mobile layouts. Handle cache invalidation. Open a focused PR; **stop for owner review, do not merge or start 7B**. |
| **7B — Performance observability** | Optional `?perf` overlay: FPS, median/p95/worst recent frame time, render scale, renderer calls/triangles/geometries/textures, shadow resolution, bloom, tilt-shift, mode, viewport and DPR. Use renderer info; keep overhead small. Count the complete composer frame; document windows and limitations. **Stop for owner review, do not merge or start 7C.** |
| **7C — Real-device baseline** | Android classic/walk modes; noon, golden hour, rain, snow and night; full crops, many animals, heavy decorations/effects and panels; 20–30 minute sessions. Identify CPU/GPU/memory/thermal/network/save/UI constraints. No optimization unless a severe blocker is found. |
| **7D — Automated regression testing + CI** | Prefer Playwright when practical: normal/testfarm boot, page errors, planting, harvest, orders, walking, interaction, save/reload, panel fit at both mobile sizes and desktop. Add CI; recommend required checks only after reliable results. Repository settings require owner approval. |
| **7E — Locomotion prototype** | Audit cow, chicken, sheep, horse, dog, cat, farmer and Rosa/Joe/Mia/Sam/Lily: groups, legs/head/tail, skeletons, movement/bob, speed ownership, facing/update rate and reusable parts. Prototype **cow, chicken and farmer only**. Require visible legs, travel-synchronized cadence and smooth starts/stops. Cow: restrained heavy motion; chicken: alternating short steps with subtle head/body motion; farmer: opposite arm/leg swing and distinct walk/run. **Stop for human visual approval.** |
| **7F — Locomotion rollout** | **Only after 7E approval:** extend to sheep, horse, dog, cat and villagers with species-specific character and inexpensive idle animation. Preserve AI. |
| **7G — Firebase hardening** | Version and test Firestore rules; validate market/events; inspect showcase/leaderboard trust; document client-authoritative limits. Evaluate App Check with monitoring before enforcement; avoid unnecessary server architecture. |
| **7H — Save + update hardening** | Measure JSON bytes, stringify/write/parse times and cloud upload size/time. Add explicit version migrations and old-save fixtures; improve release/cache version management. IndexedDB only if measurements justify it. |
| **7I — Firebase SDK modernization** | Isolated SDK upgrade after tests exist. Cover login, guest, migration, cloud save, friends, market, presence, leaderboard and reconnect. |
| **7J — Analytics v2** | Privacy-conscious version/platform/screen class, guest/account, first harvest/order, tutorial, levels, D1/D7 return, session bucket, crash-free session and performance bucket. FPS buckets: 60+, 45–59, 30–44, below 30. Dashboard: version, 7/30 days/all time, platform. No per-frame uploads or unnecessary personal data. |
| **7K — Measured performance optimization** | Optimize confirmed constraints only. GPU: resolution, shadows, bloom, tilt-shift, grass distance/density, particles, textures. CPU: animals, raycasts, DOM sync, loops, saves, timers, allocations. |
| **7L — Mobile UX + accessibility** | Target sizes, safe areas, thumb reach, readable text/buttons, color-independent information, reduced motion and background battery behavior. No whole-UI redesign. |
| **7M — Visual makeover** | Prioritize animal/character silhouettes, proportions, faces, clothing, animation, expression and personality. Improve ambience, weather/audio, rewards, customization, immersion and UI gradually. More polygons alone are not the goal. |
| **7N — Release-candidate stress test** | Long sessions, old saves, cloud conflicts/multiple devices, offline/reconnect, background/foreground, social/market/weather, heavy farms/full inventories/many animals, mobile thermal load and PWA updates. Campaign complete only after this passes. |

## Locomotion and performance criteria

Advance gait phase from **actual distance traveled / stride length**, not just
wall-clock time: stationary actors stop stepping and cadence follows speed.
Use appropriate diagonal pairs for quadrupeds and alternating legs for chickens;
differentiate heavy cows, springier sheep, long-striding horses, energetic dogs
and restrained cats. Farmer arms oppose legs, with subtle torso motion and run lean.
No frozen-leg sliding, floating, moonwalking or pogo bouncing.

Cache part references and numeric state, reuse vectors and apply direct transforms.
Avoid per-frame geometry/material allocation, scene traversal, mesh reconstruction,
heavy IK or large animation dependencies. Draw calls should not meaningfully rise.

Targets (not current performance claims): ideal 60 FPS / 16.7 ms; good mobile
45+ FPS / 22.2 ms; acceptable floor 30 FPS / 33.3 ms. Investigate sustained
frames above 33.3 ms and hitches above 50 ms, using median and p95 measurements.

## Deferred features

Do not implement now: earned-only gem/cosmetic shop, gamepad, pointer lock,
rebinding, stronger PC support, world expansion/interiors, farmhouse/windmill,
tractor/machinery, more styles, deeper animal/social/farming systems, world events,
richer seasons or native packaging. No real-money monetization.
