# Bounded ambient-resume diagnostic

Owner instruction: log render callbacks and frame timing; keep production code
and the original700ms assertion unchanged; report evidence before proposing a fix.
This branch is a diagnostic, not a proposed production correction. No merge.

Base main `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`, tree
`55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.

## Verified failure and baseline

Main regression199/run38331540392 finished6/7successful jobs. Character job
115082147953 failed in `scene-polish.browser.cjs:34`:
`AssertionError: ambient motion resumes`, false!==true.
Farmer wardrobe/walk/pet/evidence, recovery-startup ordering and wardrobe-depth
checks had passed before that assertion. Failure artifact11783381790 is preserved
by Actions until2026-10-20; ZIP SHA256:
`370406726b305254daed23ad42606753ddc20d354d61834f0afd60b01c8686cb`.
The complete pre-merge tree at c0ba1dc is identical to this main tree and passed
all7 regression198 jobs. That supports investigating timing/state; it does not
prove a test defect or dismiss the recorded failure.

## Falsifiable hypotheses

1. No butterfly render callback arrived during the700ms window, so the
   unchanged geometry does not distinguish paused rendering from broken resume.
2. Rendering happened, but the motion attribute was reset, or the object was
   hidden/outside the camera's view.
3. The butterfly callback ran in full motion and still left geometry unchanged.
   This would support a production animation defect.

## One bounded experiment

`node farm3d/tests/ambient-resume-diagnostic.cjs` compiles a logged copy of the
existing fixture in memory. It does not edit the original file. Original
weather-preset setup,20GPU fences and environment checks remain intact.
Both700ms waits and equality/inequality assertions remain literal unchanged
statements. A static verification guard fails if the anchors change.
Original fixture SHA256:
`88f0a77329ee7129ab5701ee07cf72e08714d4931dcfc4572296df4e84e6f435`.

Observation covers the original844/1280viewports, once each, stopping at the
first assertion failure. Unrelated wardrobe/material/action and legacy cases
are outside this diagnostic. It is not a passing claim for that whole suite.

The wrapper calls the native render callback with the same receiver/arguments
and preserves its return value. A MutationObserver records actual motion
attribute changes; an independent requestAnimationFrame observer records
frame timestamps and delivery times. Records are bounded to128entries per
stream. Native-callback time and instrumentation overhead are separately logged.
Snapshots copy geometry after each original assertion. Logging occurs after
comparison and does not add another wait before the assertion.

Record callback counts, renderer frame counts, rAF intervals, visibility,
ancestor visibility, existing sphere/frustum status, effective motion settings
and actual position arrays. Compute frustum observations using copies of
existing bounds; do not recompute/change production geometry bounds. All
observations are software-rendered CI evidence, not phone performance.

The dedicated branch-only push workflow has a10minute job bound and archives
JSON, screenshot and trace on success or failure. It runs once, with unchanged
pinned dependencies and no production account/network/data writes. Failures
remain failures; no assertion is removed, no threshold/timeout is increased.
No blind rerun of the failed main job.

## Status and stop conditions

Static verification and syntax pass. Hosted observations are pending.
Report raw evidence and limitations first. Do not propose or implement a fix
from a guess, and do not change graphics or accepted animal systems here.
If the failure is not reproduced, report INCONCLUSIVE rather than claiming a
correction. Any second experiment requires a distinct evidence-driven hypothesis.
