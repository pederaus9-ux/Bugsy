# Bounded envelope experiment: performance FAIL, do not integrate

Starting clean head: `f33012bdf9e94762cfc4d9ec4251411d3f145e8c`. This is the single requested test-only option-2 experiment. It stopped after one matched browser comparison. No runtime, rig, accepted assertion, geometry, clearance, deadline or seed change; no upload, Site update, merge or deployment.

## What was built

`cow-envelope-fast-path.mjs` constructs one conservative 92-part union over eight predicted native steps on detached shadows. It includes the existing full motion domain, displayed pose and separate evaluated/stored recovery event for each step. The certificate records exact native state/transforms, request, support identity/revision, layout revision, solid geometry and geometry versions. Reuse is checked **before** motion-domain construction. Missing/mismatched provenance, unsupported state or an overlapping envelope uses the unchanged complete reference query. Full 0.42 m root padding remains checked. No near-station exception, animation restriction, reduced coverage or stopped-animal success was introduced.

This is an exact-forecast-window experiment, not a general reusable certificate for arbitrary nearby states. Preparing the window is charged to the query that misses; no asynchronous work is hidden. The prototype is inactive outside the test harness and is rejected for runtime integration.

## Browser baseline and matched result

Pinned Chromium/Playwright 1.62.1, Windows, actual D3D11 NVIDIA RTX 5060 Ti, 844x390 CSS viewport / DPR 1, fixed quality. The full current game renders and the other 41 animals continue updating. Five original cow controllers are suppressed in the disposable test scene and replaced with five native cow rigs executing identical scripted care transitions at two feed docks, drink, robot and a free standing site. Minimum root separation is 2.3 m; every query gets the same 62 solid boxes and eight padded root obstacles. This measures representative full-browser cost; it is not an actual five-cow scheduler/queue or phone qualification.

Each mode has 30 warmup and 120 measured frames; five native cows advance at 30 Hz simulation steps. Comparison uses separate fresh contexts with the same fixture/quality/request sequence. The rest of the game uses its ordinary frame clock, so this is matched scene/cost evidence, not a bitwise identical whole-farm simulation. Disposable testfarm storage remained unchanged, all external requests were intercepted, and no browser error occurred during the valid runs.

| Whole-frame metric | Baseline, no new collision query | Full reference | Envelope candidate |
| --- | ---: | ---: | ---: |
| CPU median | 5.20 ms | 10.00 ms | 10.30 ms |
| CPU p95 | 6.50 ms | 12.40 ms | **67.10 ms** |
| CPU worst measured | 10.10 ms | 17.10 ms | **75.10 ms** |
| Frames above 50 ms /120 | 0 | 0 | **15** |
| CPU worst warmup | see raw | 25.40 ms | **92.90 ms** |
| GPU p95 | 2.65 ms | 2.62 ms | 2.36 ms |
| Scripted cow/query block p95 | 1.30 ms | 7.20 ms | **62.40 ms** |

The cow/query block includes fixture pose capture and native animation; it is not the isolated predicate timing from the previous Node benchmark. The browser fixture transitions to full care weight, unlike the previous Node partial-weight fixture, so those costs are not a before/after speedup claim.

The original whole-frame goals remain 16.7 ms ideal, 22.2 ms good mobile and 33.3 ms floor, with >50 ms hitches investigated. Reference p95 fits the ideal desktop goal in this bounded scene, though its worst sample exceeds 16.7 ms. Candidate p95 exceeds every goal and repeatedly exceeds the hitch threshold. CPU and GPU p95 are not added as if they were serial, nor is independent p95 subtraction a guaranteed subsystem budget. No phone headroom is established.

Cache construction outside the timed render loop costs 69.20 ms reference /65.70 ms candidate, explicitly retained as setup work. Candidate additionally prepares 95 per-cow windows during 150 warmup/measured frames; the largest single preparation is 24.10 ms. Rebuilding all five windows on the same periodic boundary causes the visible spikes. Staggering work or another optimization was **not** started after this failure.

## Why the fast path failed

Candidate queries report 300 fast hits and 450 fallbacks across the 750 warmup/measured queries. Robot/free-cow windows are reusable; **both feed windows and the drink window overlap real fixture solids**. The reference still clears their complete motion and maintains contact, so these are conservative-envelope false positives, not evidence permitting geometry deletion or a new gameplay collision claim.

The drink witness is group 1 versus solid 23. Its union reaches y=0.70779324 while the trough side reaches y=0.71999997, with overlapping x/z ranges: about 12.21 mm of projected y overlap. Both feed witnesses involve group 4 versus solid 20; their projected y overlaps are about 41.01 mm and 11.99 mm. Complete bounds/boxes are retained in `comparison.json.overlapWitnesses` per candidate case. These are AABB overlaps, not actual triangle penetration depths.

The isolated 60-frame drink test also has **0 fast hits /60 fallbacks**; native contact completes with maximum mouth error 0.00567022 m under the unchanged 0.08 m limit. Reference and candidate browser cases have the same maximum full-weight mouth error, 0.01568954 m. This experiment therefore adds expensive prediction/validation without eliminating the near-fixture reference work it was intended to avoid.

## Allocations and memory

A separate 30-frame window after each timing run uses CDP allocation sampling at 128 KiB, including collected objects. This preserves one matched comparison while excluding profiler overhead from the frame timing above. Raw profiles are retained; byte counts are estimates.

| Estimated whole-browser allocation per frame | Reference | Candidate |
| --- | ---: | ---: |
| Total | 12.34 MB | **22.01 MB** |
| Reference query contribution | 9.62 MB | 7.34 MB |
| Window preparation | 0 | **11.19 MB** |
| Signature checks | 0 | 1.11 MB |

Observed maximum JS heap in the timed samples is 232.1 MB reference /329.4 MB candidate. These are sampled heap observations, not retained ownership, process peaks or leak proof. The lower reference-query allocation is outweighed by prediction and signature work.

## Checks and evidence limits

- **10 additional groups pass:** pre-domain reuse/no live or RNG mutation, layout/support/state invalidation, inserted real solid, stale geometry, mismatched forecast, both exact retained post root segments, and native drink transition with full fallback.
- Existing **21 controls and 11 containment cases /1,903,680 vertex checks** execute with their source assertions unchanged through the new wrapper. Without envelope provenance they correctly take the full reference path. They preserve the original guarantees; they do not prove general fast-path coverage.
- Original successful movement/turn controls remain; no new live approach or full-herd matrix credit is claimed. Previously recorded complete care profiles are unchanged historical evidence and were not repeated after the performance failure.
- Full physical limits, native animation, 500-second/40-second contracts and matrix seeds remain untouched. Six protected runtime files exactly match the starting Git tree.
- `comparison-reference.png` and `comparison-candidate.png` are actual rendered game captures; the candidate image was visually inspected. They are desktop viewport evidence, not owner visual or physical-device acceptance.

`comparison.json.status=PASS` means the harness completed both runs and its safety/contact/storage/error assertions passed. **The experiment's performance decision is FAIL**, recorded separately in `verification.json`; it is not an integration pass.

## Retained setup faults

The first sandbox launch was blocked before page load by `ERR_NETWORK_ACCESS_DENIED` to localhost; `headroom.json` preserves it. The supported escalated local-test execution route then worked without networking/security changes. The first successful headroom fixture reset care before rendering: its timing remains in `headroom-permitted.json`, but it is superseded by `headroom-care-render.json` after moving reset to the next frame. This was a diagnosed fixture correction, not an unchanged rerun or test weakening. The early generic `baseline.png` capture was overwritten by the corrected capture because the initial harness omitted the evidence label; the earlier timing JSON is intact. Subsequent captures use unique label/mode filenames.

The optional app dependency-path tool was unavailable; the existing pinned Playwright installation in the preserved original checkout was located read-only and reused. No dependency installation or unrelated process changes occurred.

## Decision and next boundary

Reject this forecast-envelope implementation for runtime use. It does not meet measured desktop headroom and has no demonstrated benefit at the hard feed/drink sites. Do not add exceptions or another optimization layer.

The new useful result is that the **unchanged full reference** fits this bounded desktop browser scene. Before spending on another architecture, the next decision should be whether to measure that reference in an isolated physical-phone benchmark and a representative moving/recovery scene. This checkpoint authorizes neither publication nor runtime integration. Existing live support classification, full bed/robot routes, actual controller integration, animated browser failure replay and matrix remain unresolved. A20 gameplay physical safety is still RED; care/wake credit remains 1/30. All owned commands have finished and browsers/servers closed. Both relays are updated locally.
