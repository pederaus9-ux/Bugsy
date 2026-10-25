# Narrow recovery correction and authored-exit measurement

Base: `810fbc83c36997a401aaf3a1bb5a051f20e579ae`. Branch: `codex/safe-test-preview-20261023`. Local only. Acceptance was recorded in `acceptance.md` before implementation. No runtime, rig, geometry, collision tolerance, deadline, seed or existing assertion changed.

## Completed correction

Only `tests/helpers/cow-motion-domains.mjs` changed among existing implementation files. Recovery residual `w(t)=1-t*t*(3-2*t)` now uses its shared-phase monotone range: `w'(t)=-6*t*(1-t)<=0` on `[0,1]`, so the endpoints bound the polynomial. Outward interval endpoint operations plus an outward 16-machine-epsilon native-operation allowance enlarge this scalar range; no physical tolerance is relaxed. The 0.5 m helper guard and 0.34 m native reach remain byte-for-byte unchanged. Radial-clipping logic was deliberately not changed.

- Range/extrema/adversarial controls: **19,018 checks**, 75 groups. Narrowed extrema and old independent-phase range controls reject; invalid inputs and mutation/RNG controls reject.
- Existing hierarchical controls: **21/21 pass**, including retained post paths, actual skin hit, valid translated/turn and station controls, invalid provenance, mutation and cache controls.
- Existing containment probe: **11/11**, **1,903,680 native vertex checks**. Its old literal source label remains unchanged; `verification.json` identifies this run's actual base and helper digest.
- Exact captured drink frame 166: every archived prestate/request field matches. **317,280** additional native vertex checks cover five motion and five recovery-event fractions; no live state/RNG mutation. There are 828 signed-zero-aware query nonmutation checks and no recovery-history mismatches. These finite witnesses support the source-derived enclosure; they are not universal continuous sampling proof.

The first new browser harness stopped because JSON archives do not retain signed zero while browser transport does. Its raw RED is preserved in `captured-verification.json`. The new harness then compares exactly the same JSON representation and rejects a deliberate 1e-12 coordinate corruption. Live query comparisons still distinguish signed zero. The corrected representation run is separately retained; no accepted oracle changed.

## Separate retained robot failure

The full original reversal trace is **still RED** in `captured-verification-json-roundtrip.json`. After the drink query succeeds, robot leg 0 at frame 166 exceeds the unchanged helper guard with `tz=[0.23015380992057194,0.5022728063458718]`. The preclip reach interval is `[0.34095021969949774,0.5036765402138478]` and recovery phase is already 1. `cowMotionDomains` independently multiplies each component by an interval for `0.34/reach`; losing component-versus-norm correlation preserves an impossible large component. This is a separate conservative-enclosure defect, not evidence that the native hard reach guard failed.

The original whole-trace verifier and its no-guard assertion remain unchanged after that RED. A separate focused diagnostic (`cow-recovery-drink-skin.browser.cjs`) expects this exact remaining robot guard and checks the drink's captured skin. That diagnostic passing does **not** turn the original trace green. Its additional run was specifically for the skin assertions unreachable behind the new robot assertion boundary, not a blind retry.

All **41** original rejection records remain. The **three actual robot upper-rail intersections at frames 162–164** remain rejected and are retained as adversarial reversal evidence. The other **38** remain temporally unresolved despite earlier finite samples with no witness. They are not credited as safe.

## One representative desktop comparison

The new fixture is separate from the frozen reversal fixture. It uses the actual authored robot points from `cow-yard` and the production exit order (`index.html`, `task.stage='exit'`): finish approaching `dock`, then `exit`, `turn`, `clear`. It does not reverse midway down the robot lane. The other four scripted motions are unchanged. There are five unique production-scheduler reservations, 41 ordinary controllers and five scripted native cows; cow queries are observers and never reject actual motion.

New benchmark duration was specified in advance: 30 warmup + 420 measured 30 Hz steps, with 60 approach, 60 stopped recovery and 300 departure steps. The original 180-frame benchmark and its RED are preserved. The additional departure time is a separately defined representative performance fixture, not a changed care/qualification deadline. The 45-second per-run wall cap remains unchanged. Only this one matched comparison ran, plus its separate allocation window.

Pinned Chromium 151.0.7922.34, desktop headless D3D11 / RTX 5060 Ti, 844x390 / DPR1:

| Whole rendered-frame CPU | Baseline | Reference observer |
| --- | ---: | ---: |
| Median | 5.40 ms | 9.90 ms |
| p95 | 9.70 ms | 25.20 ms |
| Worst | 15.10 ms | 76.80 ms |
| Frames >33.3 ms | 0/420 | 14/420 |
| Frames >50 ms | 0/420 | 4/420 |

Reference stage p95: approach20.40 ms, stopped recovery10.70 ms, departure30.30 ms. Cache setup67.20 ms. Separate CDP sampling estimates17.12 MB allocated per five-cow frame across the browser, including13.17 MB attributed to reference queries and0.94 MB to detached copies. These are sampled allocations, not retained memory or exact byte counts; instrumented timings are not used. Sampled peak heap was141.57 MB baseline and360.70 MB reference, without a leak conclusion.

All four authored robot points were reached exactly at frames177/286/348/431. Baseline/reference/allocation runs have identical scripted distances, final positions, waypoints and reservations. Max speed0.8 m/s, minimum root separation1.523154621 m, root support error0, containment intact, no save writes or browser errors. Real rendered screenshots are `baseline.png`, `reference.png`, `reference-allocations.png`. This checks a scripted route, not the live controller or a completed care job. The other41 controllers remain real-time driven; this is one representative paired measurement, not a statistical or lockstep whole-world comparison.

The reference completes2,250 queries:2,125 clear, **125 rejected** (feed1:12,feed2:12,drink:15,bed5:12,robot:74). Those new rejections are unclassified, not assumed false positives or actual collisions. Movement still proceeds because this is an observer benchmark. Passing waypoint assertions therefore provides no new live route-safety clearance.

## Decision and stopping point

The requested shared-phase correction is verified and the single comparison is complete. **Do not integrate or publish this as a phone-safe movement solution.** Reference whole-frame p95 exceeds the original16.7/22.2 ms goals; it is below33.3 ms at p95 but has14 frames beyond that budget and four >50 ms hitches. Phone performance is unmeasured. The separate radial guard and unclassified route rejections also remain.

Recommended next bounded decision: keep this implementation test-only; choose whether to authorize the source-derived radial-invariant enclosure correction and a focused classification of representative rejected route states before any further integration/performance work. No further optimization, architecture or rerun started here. A20 gameplay physical safety stays RED, care/wake credit stays1/30, broad matrix stays paused. Existing shelter/default-speed and release gates are not cleared by this experiment.

`verification.json` records15 byte-identical protected/runtime/helper/historical-evidence files and the exact corrected helper SHA. Both relays are updated. All owned browser/server processes closed normally. No execution/approval wait, remote upload, Site update, merge or deployment; previous denied upload remains held.
