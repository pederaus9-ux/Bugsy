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

Static verification and syntax pass. Hosted observations are complete; see the measured result below.
Report raw evidence and limitations first. Do not propose or implement a fix
from a guess, and do not change graphics or accepted animal systems here.
If the failure is not reproduced, report INCONCLUSIVE rather than claiming a
correction. Any second experiment requires a distinct evidence-driven hypothesis.

## Measured result — report before any fix

Diagnostic workflow1/run38335774387, job115095387590, **SUCCESS** at exact
head `528f0a9dbe9e12409c017a3a6872b98dab695672`, tree
`2c34df7c504dca522a013a01c60968aef482208c`.
One execution, original844and1280ambient cases:4/4pause/resume comparisons pass.
The originalmain199 resume failure is **not reproduced**. Its root cause is
**INCONCLUSIVE**, not fixed or dismissed.

| Width | Mode | Butterfly draw callbacks | First callback after mode setter | Actual position change |
| --- | --- | --- | --- | --- |
| 844 | Reduced | 1 | 648.4ms | No |
| 844 | Full | 1 | 590.3ms | Yes |
| 1280 | Reduced | 0 | None | No |
| 1280 | Full | 1 | 234.7ms | Yes |

Counts are captured in the post-assertion snapshots. Their measured elapsed
mode-to-snapshot times are725.4/724.8/724.6/719.5ms respectively; those include
later observation transport and are not altered waits. Both original700ms
waits and original comparisons remain intact. Actual callback timestamps for
all three observed draws fall before700ms after their mode-change marker.

VERIFIED:
- At1280,the reduced-motion assertion passes without a draw callback or an
  observer animation-frame callback. No rendered motion handler was exercised
  during that observation. Unchanged geometry alone is therefore not evidence
  of a correctly suppressed rendered update in this case.
- Both full-motion cases receive one actual callback and change geometry.
- At844,the reduced handler is actually invoked once and geometry stays fixed.
- All snapshots show an unhidden document, visible ancestors, correct current
  motion attributes, and a sphere intersecting the camera's view. No culling
  or motion-attribute override is observed in these cases.
- The844observer records one inter-frame gap of683.3ms. Only one interval exists,
  so this is not an FPS estimate, percentile or hardware performance claim.
- Recorded callback instrumentation cost is0–0.1ms at browser clock precision.
  The probe is observational and still has some overhead.

LIKELY: wall-clock-only samples are sensitive to scarce render opportunities
in this software-GPU CI environment. This is consistent with the result and
provides a credible timing hypothesis, but does not prove what happened in
originalmain199.

UNKNOWN: actual callback delivery, visibility and motion-state history at
originalmain199's failing sample. That run lacked these counters. The original
trace proves the full setter returned`full`, the nominal700ms wait actually
lasted702.058ms,and the comparison returnedfalse. It cannot reconstruct the
missing callback facts. This standalone diagnostic also omits earlier unrelated
character programs; no claim of reproducing their cumulative resource state.

Raw artifact11785226337 is checksum verified:
`44f2f5342f02b5f1c685d31798124fa95ff01a82367c2ac9862622d7da11a1c2`.
Unmodified observations, derived summary and original-failure trace timings
are frozen in `farm3d/tests/evidence/ambient-resume-diagnostic/`. Actions' full
ZIP/screenshot artifact expires2026-10-27; source and JSON receipts are retained
in Git. No replacement/generated images are validation evidence.

Production files and the original fixture are byte unchanged from main2bb0dae.
No thresholds changed, no failed check removed, no fix proposed/applied and no
merge/release performed. The originalmain regression remains6/7with one failed
job. This diagnostic's success is not clearance of that whole regression.

## SUNNY ACRES RELAY HANDOFF

Agent: ChatGPT/Codex only; observational review, no external agent audit.
Task: bounded diagnostic under owner instruction2026-10-12T21:01:07-05:00.
Base/main: `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`.
Measured diagnostic head: `528f0a9dbe9e12409c017a3a6872b98dab695672`.
Branch: `codex/ambient-motion-resume-diagnosis`; no integration PR.
Scope: actual draw/rAF/frame/state logging with original700ms checks unchanged.
Files: diagnostic runner/workflow, report/relay and frozen JSON evidence only.
Tests: syntax/static contract/diff guards pass; one hosted diagnostic4/4pass;
originalmain199 failure preserved. No blind rerun of the failed main job.
Protected: all production/animal/save/backend/interface/cache files unchanged.
Known limitations: failure not reproduced; software renderer, sparse samples,
observational overhead and no exact historical callback counters.
Verdict: **INCONCLUSIVE for original root cause; bounded diagnostic COMPLETE**.
Owner gate: report findings before any fix proposal; no merge/release approval.
Exact next action: return these measurements for owner review. Preserve the
unresolved original failure. Do not silently change the assertion, extend its
window, propose a production correction or declare the broader build cleared.
