# Phase 7M: hands and cultivated ground

Base: accepted PR #48, merge `60021c47cf307f73764e11875a459720917bbc89`.
The owner selected both their S26 overview and first-person screenshots as visual
baselines. The farm identity, existing 3D animals/farmer, AI and save/economy
behavior remain protected. Compare real game images rather than promising that
an AI concept painting will match the delivered renderer.

## Concrete gaps and first pass

The first-person hands were a sleeve cylinder, a scaled sphere and a thumb sphere.
They lacked separate fingers and a fabric cuff. Cultivated rows were perfectly
smooth half-cylinders using tinted speckled path material, which read as wooden
tubes close up. The path lacked visible use.

The focused repair uses sculpted palms, wrists, thumbs and four fingers, with a
raised cuff. Batched geometry keeps six hand draws and the existing camera
envelope. The active fingers close gently during planting/harvest reaches, open
for petting and reset afterward. Existing wardrobe skin/shirt colors and the
reduced-motion policy still apply. In first person, nearby animal status/emotion
icons have a 48 CSS pixel size cap, with their normal world scale restored in
Classic. Smaller, softer ripe-crop glints preserve readiness without filling the
close-up camera with bloom. Existing readiness, targeting and AI remain unchanged.

Cultivated ground uses deterministic fine-grained earth with broad tonal patches,
restrained normal relief and gently irregular mounds. The path uses softer earth
variation and two subtle wheel ruts. Textures are generated once; no new network
assets, extra draw pass, lights or shadow maps are required.

## Verification requirements

Preserve before/after game captures at 844×390 and 1280×720, overview and first
person, with noon/golden/rain light. Inspect images for hand clipping, readable
soil/crops and path seams. Camera, field state and weather must match; animal
poses can differ because the live game remains active.

Measure the loaded farm with the existing optional hardware GPU/CPU benchmark
before and after. Short headless sample windows establish renderer cost only;
they do not prove S26 display FPS, long battery behavior or thermal acceptance.
Preserve every failed attempt and do not weaken tests or thresholds.

Require all existing hosted jobs at the final head, a specific owner merge
approval, deployed source verification and actual S26 visual acceptance before
closing this phase. Release-candidate stress remains Phase 7N.
The expanded browser chain is partitioned across two independent core runners,
with every original command preserved and both 20-minute job limits intact.
All seven current-head jobs must pass, including the character/scene group.

## Local results and limits

The 46 unit tests pass. The complete existing core browser chain passed during
development; the final nearby-marker change is additionally checked in the
focused real-game browser suite at both landscape sizes. That suite verifies six
skin tones, shirt colors, six hand draws, actual harvest closure/reset, the nearby
marker cap, deterministic soil and 30 wardrobe rebuilds without resource growth.
Nine analytics units/eight browser scenarios and all 11 accessibility groups pass.
Final general game regression passes all 50 checkpoints. Exact-head hosted checks remain the release gate.
The combined environment/HUD pass also passes the final general regression and
all 11 accessibility groups. Its real-game checks cover idempotent installation,
weather/exposure without drift, disabled layer, ambient motion stop/resume,
unobstructed overlay input and the original hands/soil/reach/resource assertions.

All 25 loaded-farm hardware scenarios completed before and after, with identical
quality settings and no rejected GPU queries. For the combined PR #49 pass,
worst scenario CPU p95 was 5.90 ms before and 6.20 ms after; worst GPU p95 was
4.919 ms and 5.155 ms. This single short paired run records a modest cost increase,
not a performance improvement or phone FPS claim. Samples are 2 seconds per
scenario, with a 10-second rain window. The earlier hands-only result (5.80 ms CPU,
4.956 ms GPU) remains locally preserved, but is not the combined PR release gate.
No sampled CPU frame exceeded 50 ms.

No geometry grew within an after measurement window. One combined after window
(desktop Walk noon) loaded one additional texture; three baseline windows did
so too. Existing lazy
emoji texture caching is the likely explanation, but individual allocations were
not traced. Do not label every window resource-stable: the comparison explicitly
records the exceptions. Repeated wardrobe rebuilds and both rain windows were
stable. The new two normal textures are shared, generated once and bounded.

Curated paired images and detailed results are in `tests/evidence/phase7m/`.
All 12 final after images were captured; the phone/desktop noon, golden and rain
close-up/overview views were inspected. The accepted base is served from Git for
the before captures, rather than removing local work. Live animals can change
pose between captures. Local source hashes identify the measured implementation.
The committed after images and comparison cover the combined pass; earlier
hands-only captures remain in local outputs. The accidental contended benchmark
start was stopped and preserved separately, and is excluded from these results.

Rejected hand framings and failed test/version-edit attempts remain in the local
outputs. A version-edit error was caught, restored from accepted source and
verified to leave only the intended one-line release changes. The new normal-map
test now accounts for the existing 2.6× Walk detail multiplier; the reach test
waits for the rendered neutral pose rather than assuming 800 wall-clock ms.
Existing assertions, timeouts and quality thresholds were not relaxed.

Current state: implemented and locally checked; specific approval, exact-head
hosted results, deployment and owner visual acceptance are pending. Not live.
