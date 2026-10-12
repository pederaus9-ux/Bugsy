# Horse R8 — bounded performance diagnosis

Reviewed source: `24a956394450eebd96fa68107eae2640e3e80626` on `codex/horse-contact-r8-review`. All production horse files match original R8 tree `ad721e1c5ed0a651ae82f9495e07ebc1c5962850`.
Live main re-fetched for this diagnosis: `205b25db0aab877aa6cf9a40adcbc766640c78cf`, unchanged. No production edits, threshold changes, push, hosted CI dispatch or merge.

## Verified experiment

1. Node CPU sampling of the supplied cpuwork.mjs: six horses, alternating heights 2.3/1.6, seeded roaming, 60 Hz; 600 warm-up frames followed by 3,000 measured frames. Observed 0.848 ms per six-horse update frame. This is host CPU simulation timing, not mobile FPS.
2. Chromium 153 CPU sampling using CDP Profiler on the supplied throttle.cjs workload: six horses, 6x emulated CPU throttling, 900 frames, first 120 omitted from timing statistics. Main then R8 sequentially. No unrelated browser suites active during this comparison. The script adds profiler start/stop around the workload; production code remains unchanged.

Profiled browser timing (includes sampling overhead):

| Source | Median | p95 | Maximum |
| --- | ---: | ---: | ---: |
| main | 0.900 ms | 2.700 ms | 14.400 ms |
| R8 | 7.600 ms | 17.800 ms | 54.100 ms |

These are single emulated-host observations. They do not establish actual-phone performance, a release budget, battery behavior or full-game frame time. Do not compare their absolute values directly with earlier unprofiled measurements as a performance change.

## Sample attribution

Inclusive sample attribution groups identical function names across V8 call sites; child functions are included, so rows overlap and must not be added. Whole profiles include initialization and warm-up.

| Function | Node whole profile | Chromium whole profile |
| --- | ---: | ---: |
| updateHorse3D | 77.68% | 77.21% |
| timeToReachLimit | 27.13% | 20.43% |
| nextLifts | 8.71% | 11.01% |
| yawStep | 5.85% | 8.06% |
| pathFits | 3.77% | 3.75% |

Within sampled updateHorse3D time, timeToReachLimit accounts for approximately 35% in Node and 26% in Chromium. pathFits accounts for approximately 5% in both. This supports investigating the reach scan before weakening the per-frame path checks. Sampling is approximate, not an exact function timer.

Source inspection: timeToReachLimit repeatedly scans the 65-entry forecast, recomputing hip positions from the same forecast body positions and rotations. nextLifts invokes it again while considering support scheduling. This explains a plausible reuse opportunity; it does not prove a cache will improve timing.

## Smallest next experiment

Prototype a per-update cache of forecast hip x/z positions. Keep the same arithmetic order, forecast horizon, planning rate, path checks, reach tests, support floor and thresholds. Benchmark the cache against unmodified R8, including idle and straight movement where cache construction may cost more than it saves.

Before integration, require bit-identical per-frame output on equivalent inputs, the unchanged motion/contact tests, both scenario matrices, figure-eight/tight-circle/reversal/stop regressions, and the roaming checks. Only a measured improvement with preserved behavior is acceptable. A cache is currently a hypothesis, not an implemented fix.

Do not shorten the forecast horizon or reduce planning frequency in this experiment: those change behavior and would need separate evidence and review. No optional animation polish or geometry work.

## Reproduction

Retained delivery script: horse-contact-r8/scripts/cpuwork.mjs. Run Node with --cpu-prof against the reviewed checkout. For Chromium use horse-contact-r8/scripts/throttle.cjs with RATES=6, NS=6 and the working Chromium executable; enable CDP Profiler immediately before page.evaluate's workload, stop immediately after, and save its returned profile.

Raw profiles and the test-only profiling wrapper are intermediate files in the session's r8-planner-profile folder. They are reproducible; this report is the durable repository checkpoint.

## Gates

Positive owner R8 phone feedback remains recorded. Actual phone performance is unknown. Full-farm walking click timeout occurs on main and R8; shed panel assertion and final cow-preview navigation timeout remain unattributed. Existing green motion tests do not clear those failures. No merge approval is inferred.

Verdict: diagnosis verified; performance correction not yet implemented; integration remains blocked.
