# Ambient-motion rendered observation correction

## Scope and exact baseline

Base main: `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`.
Base tree: `55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.
Branch: `codex/ambient-rendered-motion-check`. Sole implementation/review owner:
ChatGPT/Codex. Owner authorized this test-only correction on 2026-10-13 at
06:04:40 America/Chicago. No merge or release is authorized.

Only test observer/helper/coverage, one original browser fixture, one core-test
list entry, current relay notes and this report change. Game/runtime source,
accepted animals, saves/cloud/auth/economy, gameplay, renderer interfaces,
service worker, browser harness, dependency versions, graphics quality,
viewports, original npm character command/order and existing workflow/job
limits remain unchanged.

## Evidence driving the correction

Main199, [run38331540392](https://github.com/pederaus9-ux/Bugsy/actions/runs/38331540392),
failed `ambient motion resumes` at scene-polish.browser.cjs:34. This failure is
retained, not reclassified as a pass or retrospectively proven a no-draw case.
Its full-motion timer measured 702.058 ms; callback state was not recorded.

Three frozen diagnostics remain untouched:

- [Isolated evidence06526afb](https://github.com/pederaus9-ux/Bugsy/blob/06526afb973797fdddbc369de225aa59a01fa3eb/farm3d/AMBIENT_RESUME_DIAGNOSTIC.md):
  tested528f0a9, run38335774387, four comparisons passed; 1280 pause had no draw.
- [Original full-sequence evidence1aadc3d](https://github.com/pederaus9-ux/Bugsy/blob/1aadc3d70d54c29971a33cba38a70f85ea585138/farm3d/AMBIENT_FULL_SEQUENCE_DIAGNOSTIC.md):
  tested26d332d, run38338910516, all seven programs passed, same no-draw pause.
- [Render-stage evidence23a8564](https://github.com/pederaus9-ux/Bugsy/blob/23a856487a3486b251609cd5297672011875ed17/farm3d/AMBIENT_RENDER_STAGE_DIAGNOSTIC.md):
  tested61dc686, run38385795074. Running game frames took9.8/12.7ms in full mode,
  while requested frames were delivered660.4/1007.4ms later. Both resume checks
  passed; pause at1280 had no frame. Delay mostly preceded frame execution.

VERIFIED: the old pause comparison can pass without rendering. Sparse delivery
makes a timed geometry comparison dependent on available draw opportunities.
LIKELY: browser/asynchronous software-GPU scheduling explains that sparsity.
UNKNOWN: the exact original main199 failure cause, device performance, and any
specific underlying browser/GPU mechanism. No production defect is claimed.

## Behavioral and timing contract

The test installs an observer around the butterfly object's original
onBeforeRender/onAfterRender callbacks. Native receiver/arguments/return values
and exceptions pass through. It never directly invokes those callbacks, forces
a render, moves geometry, changes animation speed or bypasses game state.
Only Three.js can supply the real fixture's paired completed draw observations.
The observer is restored in finally, including on failure.

For each mode, require at least **two completed draws**, including one at least
**700 ms after setting that mode**. Preserve the two original700ms waits and
exact final geometry equality (pause) / inequality (resume) assertions. Each
observed pause draw must have exactly unchanged geometry before/native update/
after draw. Each full draw must show the native callback updating geometry and
rendered geometry differing from the paused baseline. Wrong motion state or
nonfinite geometry fails. Early violations remain even if detailed receipt
storage rolls over.

**Timing change is explicit:**700ms remains the original minimum observation
period; it is no longer treated as a deadline implying a render happened.
After that period, a separate **bounded10s draw-availability gate** fails if
required observations are missing. This uses the fixture's existing10s wait
cap pattern, without increasing either700ms sleep or the20-minute CI job limit.
There is no retry of a failed behavior comparison, longer arbitrary sleep,
quality reduction or relaxed numerical assertion. A missing-draw window cannot
pass. This is strengthened behavioral coverage, not a phone performance SLA.

## Validation

Local: `node --check farm3d/tests/scene-polish.browser.cjs` passed;
`node --test farm3d/tests/ambient-render-observation.test.mjs` passed8/8.
Controls cover no draws in both modes, missing after-render callback, single
draw, insufficient700ms span, valid pause/resume, moving pause, frozen or
one-update resume, wrong state, invalid geometry and retained early failures.
They validate gate sensitivity with controlled callback receipts, not browser
performance or actual farm rendering. Actual rendered observations require
hosted browser results.

Add only the new observer unit test to the existing core-game test list. Run
the existing full regression workflow through a draft PR. Its original
`npm run test:core:characters` sequence remains byte-identical: farmer wardrobe,
walk, evidence, recovery-startup, depth, complete scene-polish, then color.
All original scene/legacy/material/action/resource assertions remain. Review
all7regression jobs on the exact candidate head, plus raw paired-draw receipts
in the character artifact before recommending integration.

Stop if behavior fails, no actual draw is observed within the bounded gate,
any unrelated regression appears or job resources exceed existing limits.
Capture/classify the exact failure; do not loosen thresholds or retry blindly.

Candidate creation snapshot: local controls passed. Completed qualification follows below.


## Completed exact-head qualification

[Draft PR80](https://github.com/pederaus9-ux/Bugsy/pull/80) remains open/draft,
unmerged, head `81bb935ac73322741724eb706ce25725226ec899`.
Tree `98158379ffbed2e1ce865eaa0b6ac38b590dcd31` matches both the reviewed local
candidate and CI checkout `b996e0156a3bb5254f236bafe46cfe5acfaf2460`. That checkout
is GitHub's temporary PR test commit, not an owner-authorized merge into main.
Main was reverified unchanged at `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`.

[Regression200, run38388786272](https://github.com/pederaus9-ux/Bugsy/actions/runs/38388786272),
attempt1: **SUCCESS, 7/7 jobs passed**. No retries or further candidate edits.

| Job | Result |
|---|---|
| Farmer, first-person and scene/visual checks | PASS — all seven original programs |
| Farm3D core regression | PASS — all33Node files and5browser suites; new8controls passed |
| Six-species visual regression | PASS |
| Old saves and measurements | PASS |
| Analytics and owner dashboard | PASS |
| Mobile accessibility, motion and focus | PASS |
| Firestore/economy/game/save-recovery emulators and exact SDK boot | PASS |

Raw paired-draw receipts were checked beyond workflow status:

| Width | Mode | Completed draws | First draw after setting mode | Last observed draw | Violations |
|---|---|---:|---:|---:|---:|
| 844 | Reduced | 2 | 945.3ms | 1831.9ms | 0 |
| 844 | Full | 2 | 867.4ms | 1736.8ms | 0 |
| 1280 | Reduced | 2 | 1292.2ms | 2579.3ms | 0 |
| 1280 | Full | 2 | 1267.0ms | 2554.1ms | 0 |

Every before/update/after mode matched its phase; geometry was finite. Reduced
geometry stayed exactly at its baseline across both draws. Each full native
callback updated geometry and the completed-draw receipt differed from the
paused baseline. Updated and after-draw arrays matched in every receipt. Both
old final comparisons also passed. No manually invoked render/update occurred.

The first full draws in this run occurred **after** the old700ms window. This
is direct evidence that draw opportunity must be distinguished from animation
behavior on this software-rendering runner. It supports the synchronization
correction, without reconstructing unlogged events in original main199.

## Durable evidence and remaining gaps

The character artifact ID11808447691, 7,553,034bytes, SHA256
`492acd5f65a3a9f0897ebf0a5b3edadae7fdadabee9c87ff04e51ff1afa21e35` matched
the downloaded ZIP. `tests/evidence/ambient-rendered-motion/observations.json`
preserves its raw motion receipts byte-for-byte. `summary.json`, `provenance.json`,
`regression-jobs.json`, `artifact-manifest.json`, `pass-log.txt` and original
`scene-polish-results.json` record qualification/version and original outcomes.
These receipts and the current report/relay are saved as an evidence-only child
on `codex/ambient-rendered-motion-evidence`. The tested PR head stays frozen.
This avoids rerunning code qualification just to publish derived results.

The candidate's relay/report are the pre-CI creation snapshot. The draft PR body
links this completed checkpoint; actual GitHub results and this exact-head
receipt supersede that pending snapshot. No historical failure or prior frozen
diagnostic was overwritten. Main199 remains a failed historical run.

Limits: one exact-head qualification, not a guarantee against every future CI
stall. Controlled negative tests validate observer sensitivity; real browser
positive receipts validate native draw submission. They are not GPU pixel
readback, a phone performance result or new owner visual acceptance. Existing
mobile/iPhone/PWA, long-session, live backend/operational and release gates remain
open. This is ChatGPT/Codex adversarial self-review, not an external-agent audit.

## SUNNY ACRES RELAY HANDOFF

Agent: ChatGPT/Codex.
Task/phase: Phase7N, test-only ambient rendered-observation correction.
Base SHA:2bb0daebea1fb7d8e34df4d7b7325faba76f66ce.
Tested head SHA:81bb935ac73322741724eb706ce25725226ec899.
Branch/PR:codex/ambient-rendered-motion-check; draftPR80.
Scope completed: actual pause/resume draw gates, exact per-draw behavior checks,
failure controls, original full character sequence and full regression.
Files changed: original scene fixture/core list, observer/helper tests, report
and relay. Evidence-only files are on a separate checkpoint branch.
Tests:8new controls+2existing scene unit checks locally; hosted33Node files,
5core browser suites and7original character programs passed.
CI:regression200 run38388786272 attempt1, all7jobs PASS on the exact tree.
Evidence:raw paired-draw receipts and immutable original failure/diagnostic links.
Protected systems checked: all runtime, animals, backend, saves, economy,
service worker, renderer APIs, harness/quality/dependencies unchanged.
Known failures/limitations: original main199 immediate cause remains unproven;
no statistical reliability guarantee or new device/release approval.
Merge recommendation: READY FOR OWNER REVIEW. Keep draft and unmerged;
no merge or release is authorized by this task.
Exact next action: owner reviews bounded test-only PR80 and may separately
approve integration; reverify head/base and gates immediately before any merge.
