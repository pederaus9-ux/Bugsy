# Task 8 seed-1 three-night care/wake checkpoint (local)

Baseline head `28a89ef62f4a72b09cb55e219c35da9a875879ed`; the tested working-tree candidate was committed locally as `5924290533378dfa4bb7e3c124afb62383388459`. The raw browser `source` fields name the baseline HEAD at run time, not unmodified source bytes. This is an actual saved sheep whole-pen move at 30 Hz with all 46 owned animals. It qualifies the three-night **care/wake subgate** at seed 1, not the full five-class/two-seed/three-rate matrix or speed/contact/pose, cloud, hosted or device clearance. `acceptance.md` was written before the browser case.

## Deterministic seed evidence

The checked-in game retains `const rnd = rng(4242)`. `browser-harness.cjs` transforms exactly that one declaration in the response served to disposable local test browsers **only when** `gameplaySeed` is requested; missing, duplicate and unsupported declarations fail closed. The wrapper returns every draw from the requested Park–Miller generator without consuming an additional draw and records the first actual draw/call count. The unit test passed 2/2 against independent first three seed-1 values. Four rendered local browser loads in `../task8-codex-seed-probe-20261025/owned-animal/seed-probe.json` showed two identical seed-1 owned-chicken attributes, seed 1 different from seed 4242, explicit seed 4242 identical to the unmodified page, first seed-1 draw `16807/2147483647`, and zero browser errors. The initial empty-farm probe failed before it had an animal witness and is retained in that evidence directory; adding one disposable owned chicken corrected the probe, not the game RNG. The actual full-herd run recorded 484 draws by the ownership/Apply checkpoint.

## Retained failures and causal fix

The first seed-1 three-night run in `candidate/results.json` passed all 46 nighttime beds by frame 8,943, then failed the unchanged wake oracle: Cow 4 had physically left at frame 60 but remained stationary and idle in its old 0.65 m bed core through frame 921. A targeted diagnostic attempt had a test-only browser-scope `seed` ReferenceError; its artifact is retained and not counted as gameplay evidence. The corrected trace in `cow4-state-diagnostic-corrected/results.json` reproduced the original RED. It shows a daytime wander target `[3.94904062806118,-38.4752225470614]` inside Cow 4's installed bed core; `Beast.arrive()` ended the move and left the cow idle there. A focused captured-target test was RED and turned green with a daytime cow destination guard, with no RNG, bed, margin, collision, route, speed, care reservation or deadline relaxation.

That first candidate then exposed an analogous Horse 1 RED in `bed-destination-candidate/results.json`: after physical release, ordinary grazing ended at `[-16.887232555881294,-28.43607508939546]`, within the installed horse bed's 0.8 m core, and remained eating there before completing 40 seconds. The retained failure and source `freePoint`/`Beast.arrive` trace show that ordinary targets may use supported bed floors because those are not generic hard obstacles. The common `ordinaryDayTarget` guard now checks the current installed cow or remaining-animal bed stations; its exclusion radius is the existing physical bed margin plus the existing 0.35 m ordinary arrival threshold. It redirects only a **daytime ordinary** target to that station's authored approach. Night bed/care tasks and safe ordinary destinations remain unchanged. The captured horse/cow and safe-location control is RED-to-GREEN. The isolated cow VM fixture needed bindings for the new helper; the failed fixture logs and corrected 28/28 cow-scene/guard results are retained. Existing pen/pet route, support and physical collision logic remains active.

## Current measured outcome

`ordinary-bed-target-candidate/results.json` passed three consecutive seed-1 cycles in one browser context; the directly affected seed-4242/30 Hz case was rerun against the changed runtime and passed in `seed4242-runtime-regression/results.json`. All results retain 15,000-frame/500-second night and first physical departure bounds, 1,200-frame/40-second individual wakes, stable 46 identities, 46 unique installed bed reservations, revision 1, exact paid state, containment and zero browser errors.

| Seed | Cycle | Night held frames | Latest physical release frame | All wakes frame | Minimum wake frames |
|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 8,943 | 8,730 | 9,930 | 1,200 |
| 1 | 2 | 8,659 | 9,445 | 10,645 | 1,200 |
| 1 | 3 | 8,822 | 8,745 | 9,945 | 1,200 |
| 4242 | 1 | 8,631 | 8,900 | 10,100 | 1,200 |
| 4242 | 2 | 9,924 | 9,600 | 10,800 | 1,200 |
| 4242 | 3 | 9,814 | 9,430 | 10,630 | 1,200 |

The tested source files are in commit `5924290`; the subsequent relay-only documentation commit does not change game or harness bytes. Local Chromium and its 844×390 viewport are not official CI or a physical phone. Other four edit classes at both seeds, all 60/120 Hz runs, and speed/contact/pose breadth across every combination remain. A fresh importer/cache version alignment and predecessor check are required before offline/hosted publication of changed `index.html` and the earlier chicken module; no cache or Site update occurs at this checkpoint. No remote push, merge or live deployment.
