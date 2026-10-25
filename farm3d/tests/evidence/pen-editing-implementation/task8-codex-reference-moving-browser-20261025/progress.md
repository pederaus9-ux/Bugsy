# Moving/recovery reference measurement: RED, stopped

Source `689454bd80f4c176b2e8b1f2193a6f71ae67b9da` is preserved. Only two new test files, this evidence and relays changed. No rejected envelope optimization, original helper/test/runtime edit, upload, Site update, merge or deployment.

The matched desktop baseline completed. The unchanged reference then failed at frame166 during the return turn, after135 of180 measured frames. The harness retained the error and stopped; no retry, workaround or allocation phase ran. This does not establish a completed performance or safety pass.

## Scene and actual motion

Pinned Chromium151.0.7922.34 / Playwright1.62.1, Windows, NVIDIA RTX5060Ti D3D11,844x390/DPR1, fixed quality. Full current game rendering and41 ordinary animal controllers remain active. Five original cow controllers are suppressed; five native rigs execute scripted motion using real authored station coordinates and five unique tokens from `createStationScheduler`: feed1,feed2,drink,robot,bed5. A duplicate feed reservation is rejected and the token snapshot remains exact. This proves capacity validity, not live scheduler/queue behavior or care completion.

Thirty idle warmup frames precede180 planned30Hz simulation frames:60 approach,60 stopped recovery,60 return/turn. Native rig/heading/IK remain unchanged. Each approach stops at least0.4m short of its dock, except the longer robot approach that advances at most1.6m. The same path is then reversed, allowing the native heading/recovery behavior to execute. All cows move; baseline records428 moving-cow frames,266 recovering-cow frames and62 releases. Partial reference records303,190 and48 respectively (includes completed cows from the failing frame). Minimum root separation is1.523154621m, maxspeed0.8m/s, root-support height error0, containment and reservation checks pass until the exception. Root support is the accepted flat0.08m slab only; no general terrain or hoof-contact qualification is implied.

Every reference call receives the same62 fixture solids and8 full-padding post obstacles as the prior case. All solid exclusions are unchanged: grain/water contact media, slab and bed surface classifications remain as previously documented. Queries are observers, not movement acceptors. A returned uncertain/collision result is logged while the native scripted scene continues, allowing rejection cost to be measured; an exception stops. This intentionally does NOT claim the prototype prevents gameplay collisions. No care completion,500s/40s,full-herd or integrated A19/A20 replay credit is added.

## Result and comparison

| Whole-frame CPU | Baseline, same first135frames | Reference,135 completed frames |
| --- | ---: | ---: |
| Median |6.50ms|9.50ms|
| p95 |10.20ms|**40.30ms**|
| Worst |13.50ms|**104.30ms**|
| >33.3ms |0|8|
| >50ms |0|6|

Complete baseline180frames: p9511.50ms,worst14.90ms. Reference stage p95: approach19.70ms(60frames),stop/recovery10.10ms(60),return/turn104.30ms(15 completed). The truncated15-frame turn p95 is also its maximum and is not a stable population estimate. Reference query/capture/native-animation block overallp9535.40ms,worst99.70ms. Reference GPU p952.831808ms,worst5.971904ms; CPU and GPU are not added as serial independent quantiles. Cache setup67.90ms occurs outside the measured loop and is explicitly disclosed. Sampled reference heap maximum272.99MB vsbaseline134.77MB is not allocation rate, retained ownership or leak evidence.

The original16.7/22.2/33.3ms whole-frame goals and>50ms hitch investigation remain unchanged (`PHASE7_PLAN.md:146-148`). The partial reference result exceeds all goals and already contains six hitches. Its preceding stationary/care12.40ms p95 result is still valid for that different scene; it cannot represent this turning workload. Fresh browser contexts share fixture/quality/request sequence, but the other41animals follow their normal wall-clock progression, so this is not bitwise identical whole-farm replay.

**Allocation measurement: not completed.** The planned separate fresh-context sampling sequence was never launched after the reference exception. Do not substitute heap samples, prior stationary allocations, or estimated bytes for this missing result. The incomplete comparison is sufficient to withhold integration; no phone performance is inferred.

## Exact retained blocker and source trace

Reference completed827queries including warmup and two cows in frame166:786clear,41rejected. First rejections appear at frame153 (feed1/feed2/drink) and154(robot/bed). Full witnesses remain in `measurement.json.cases[1].firstRejected`; every rejection is retained. They are conservative traversal failures/uncertain displayed poses, not measured triangle penetration depths. Some interval bounds are visibly broad, but that alone does not prove every rejection false.

Frame166 throws `Unsupported limb domain` from `cow-leg-enclosure.mjs::validation` (line62), via `ordinaryLeg` and the first ordinary-leg call in `cowMotionDomains` (line59), before the support-overlay branch. The guard accepts |tx|/|tz|<=0.5m and lift in[-0.1,0.25]m. At least one supplied interval exceeds this helper domain. The current raw stack does not include the offending interval, leg or exact native state; those are **unknown**, not guessed. Query count827 plus fixed cow order locates the throwing third query to the drink cow on frame166, an inference from counters/order. We have not established whether this is loose interval growth, unsupported actual motion or bad provenance. It is not evidence for changing anatomy, native math certification, or enlarging an accepted tolerance.

The failing query happens before the fixture reattaches that test cow to the scene; `reference.png` therefore captures the aborted scene and is not successful full-herd visual evidence. The entire browser context/server closed in finally. No unrelated process was touched. Execution used the previously supported permitted localhost route, with all foreign requests intercepted and service workers blocked; no network/security setting changed. Saved farm value stayed unchanged and no page error occurred outside the captured helper failure.

## Decision and smallest next step

Reference integration remains held for both a supported-domain failure and measured turn cost. Do not publish a benchmark promising a successful full moving sequence yet. The next finite diagnostic, if selected, is one instrumented replay of the exact failed transition capturing the pre-query native state, evaluated phase and first rejected limb interval, then classifying interval inflation vsactual source-domain vsprovenance. Retain the current RED and every guard; do not start another optimization architecture or rerun a broad matrix. That diagnostic was not started in this turn.

`phone-plan.md` specifies the minimal future owner-run isolated benchmark and exact publication approval. No artifact was built or uploaded. Six protected runtime files match sourceHEAD; existing21controls/11containment cases were not repeated because their code is unchanged and this new measurement has already stopped. A20 gameplay physical safety remainsRED; care/wake1/30; all broader release gates remain open. Both relays updated locally.
