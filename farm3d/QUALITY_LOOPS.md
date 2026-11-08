# Whole-game quality loops

## Authorized horse timeout draft candidate - 2026-11-08

Base main is `15e2325fe90fc8ac332460ef60d3dca33ef050d8` (PR #112 merged).
The authorized tests-only draft branch is
`codex/quality-horse-case-isolation-20261108`; no PR number is assigned yet.
Draft publication and hosted checks are authorized and pending.
The new quality-loop run [42457026835](https://github.com/pederaus9-ux/Bugsy/actions/runs/42457026835)
passed 130 of 131 executions but killed the whole horse contact file at
180.106 seconds without assertion output. Independently, the existing main
regression [42457027307](https://github.com/pederaus9-ux/Bugsy/actions/runs/42457027307),
job 128658126349, passed all nine original tests in about 240.5 seconds on the
same source. This establishes a process-packaging timeout, not a failed horse
invariant or a game-performance improvement.

The draft candidate runs each of those nine original top-level cases once,
using anchored exact names. The two height cases retain all 104 scenarios at
30/60/120 Hz each; all 56 roaming sessions, seven pinned fuzz cases and every
remaining original case remain intact. Original source and scenario SHA-256
pins fail closed when coverage changes. A registration-only control checks the
manifest against the original file without executing its callbacks. Original
assertions, scenario values, runtime and frozen evidence are unchanged.

Each process retains the **same 180-second limit**, 2 GiB heap bound, sequential
execution, total campaign budget and no-retry policy. The manifest still has
128 Node files, now 139 isolated executions (the horse lane has 18). A selected
case only passes when TAP proves exactly one passing, non-skipped original test
and its fresh JSON has the expected measurement count with zero violations.
The scorecard rejects missing/duplicate case receipts and missing evidence.

The original after-hook writes one hardcoded JSON path. Before each case the
runner temporarily preserves any previous generated file; afterward it moves
the fresh exact bytes into that case's immutable artifact folder, hashes them,
and restores the previous file. It does not let the ninth case overwrite the
first eight. Two original assertion-only cases correctly produce empty arrays;
the other seven produce 745 measurement rows in total. A failed, timed-out or
missing-artifact case remains failed/unqualified, with available evidence kept.
Run tests against a stable source tree and do not concurrently run another
command that writes the same hardcoded generated artifact.

Private validation uses an explicitly partial, exact-blob public-source snapshot
on cloud Node 24.22.1. Its local synthetic Git baseline is not upstream main and
must not be used as a full-tree or exact-head qualification. Final focused
results are recorded below. Authorized draft publication and fresh hosted
Node22 checks are pending; all game lanes and applicable required CI remain
necessary before merge review. This patch changes no workflow, runtime,
protected receipt, cache or amendment. No PR publication, merge or deployment
has yet occurred for this candidate. A47, private horse-support work, physical-device and
owner visual gates remain separate. The tooling/manifest changes intentionally
make earlier loop reports incomparable rather than claiming a game fix.

### Private candidate validation results

- All **51 tooling controls** pass on Node 24.22.1 Linux, including the unchanged
  baseline/dashboard controls and new exact coverage, stale/missing artifacts,
  zero-match/skipped/TODO/TAP and scorecard negative controls. The unchanged
  hosted control command includes the new tests through `quality-loops.test.mjs`.
- All **nine original horse cases pass**, each exactly once, with one matched
  non-skipped passing test receipt. Longest process: 52.414 seconds; summed
  process time: 182.748 seconds. These are test-process times on an AMD EPYC
  9V74, not gameplay performance results or hosted Node22 qualification.
- Captured row counts in original case order: **312, 312, 56, 7, 0, 8, 32, 18, 0**.
  The 745-row aggregate preserves every scenario/height/Hz/frame/violation field
  from the original main-regression artifact. 743 rows are exactly equal.
- **Exact JSON/byte equality was not achieved.** Compared with hosted Node22.23.4,
  two fields differ (zero-based row indexes): row 676 `restDrop`, `1.473426380687109e-16` versus
  `1.473426380687135e-16`; row 695 `minSoleMM`, `0.49999980024367385` versus
  `0.499999800243666`. The strict comparison command exited 1 and is retained.
  No assertion or tolerance was changed to conceal these differences. Source
  coverage equivalence and passing original invariants are distinct from exact
  cross-environment numeric equivalence, which is not claimed.
- Original regression artifact 13607444603 aggregate SHA-256:
  `9389c4b3e1259bc845532fc28721e9c980f06d371cce351fd5ca2e5a8c002386`.
  Private candidate aggregate SHA-256:
  `08e0661ad055e4b3d569f90958f786c0b085b90c57da089020510feb50530e5c`.
- The initial new coverage control failed against the unpartitioned runner;
  expanded negative controls likewise failed before implementation. Those
  failures, original main timeout, independent full-file success and all raw
  per-case logs remain retained. Full game/browser suites and new exact-head
  hosted CI have not run for this private candidate.

## What is prepared

This tests-only candidate is based on main
`a9b2db54fe0325d9d42df48a53c3eef0d58fc109`, on branch
`codex/game-quality-loops-20261108`. It does not include or qualify the private
horse-support candidate or A47 glass UI. No runtime file, frozen receipt,
assertion, tolerance, cache version or amendment assignment is changed.

The manifest defines **23 lanes**: 16 Node lanes containing every one of the
existing core runner's 117 Node files, plus 11 focused player/audio/analytics/
performance checks; and 7 opt-in browser lanes. The six-species heavyweight
geometry file retains all four isolated assertions and its 2 GiB process bound.
An orchestration test checks original-manifest completeness.

Node lanes cover source/cache contracts, gameplay, saves, pen geometry, pen
routing, cow care, cow motion, horse motion/support, chickens, pets,
multi-species care, player attachments, world/decor, performance-monitor
contracts and service boundaries. Browser lanes cover gameplay, saves,
accessibility, animals, player/scene, SDK/analytics and measurement captures.

This is a **test, record and compare loop**, not an autonomous code-writing
agent. A failed measurement does not authorize a runtime edit, publication,
merge or deployment. Every specific PR merge still requires Austin's approval.

## Bounded operation

From the repository root, with Node 22:

```sh
node farm3d/tests/quality-loops.mjs --list
node farm3d/tests/quality-loops.mjs --budget-minutes 30
node farm3d/tests/quality-loops.mjs --lanes gameplay,player --budget-minutes 10
node farm3d/tests/quality-loops.mjs --lanes gameplay --repeat 3 --budget-minutes 10
node farm3d/tests/quality-loops.mjs --lanes gameplay --baseline path/to/prior/report.json
node farm3d/tests/quality-loops.mjs --baseline-directory path/to/downloaded-artifact
```

- One child process runs at a time. No shell evaluates test commands.
- Default: one Node-only pass. Maximum: 3 passes and 60 total minutes.
- Each Node step has a 180-second bound; browser steps have a 20-minute bound.
  Timeout is an explicit failed qualification, never a silent pass.
- A failed step does not suppress other lanes. An unsuccessful overall pass
  stops repetitions; there are no hidden retries to manufacture a green result.
- Separate immutable log paths and per-step artifact folders preserve output.
  Each run's report updates while active, then remains as historical evidence.
- A campaign receipt records requested/completed iterations; exhausted budgets
  and stopped repetitions cannot be reported as a complete successful campaign.
- Unexpected runner errors receive best-effort blocked receipts. A hard kill or
  disk failure can still leave stale status and needs process/evidence review.
- One output-folder lock prevents overlapping runs. After a hard process kill,
  inspect the recorded PID before manually removing a stale lock.
- Browser lanes require both selection and `--include-browser`. Install the
  pinned test dependencies and matching Chromium using the existing README.
  Run browser work only when its execution prerequisites and approvals are clear.
- The shared browser harness uses disposable local contexts and stubs external
  game endpoints. That does not establish absence of OS/browser telemetry.

**Windows exact-byte preflight:** inherited `core.autocrlf=true` can turn frozen
LF receipts into CRLF, causing real hash assertions to fail even when Git says
the checkout is clean. Use an isolated worktree with exact committed bytes.
Never repair this by editing expected hashes or rewriting frozen history. Check
the actual receipt hashes before starting. Do not alter another candidate's
checkout or global Git settings.

The report records head, branch, dirty status, manifest and test/runner hashes,
Node version and host CPU/platform. Dirty runs are not clean-commit qualifications.
Comparing reports requires matching test/runner fingerprints and environment;
unrun, blocked and timed-out lanes are not compared as passes. Browser measurement
comparability requires separate review. Changed test status identifies candidate regressions/fixes
for investigation. Test wall-clock time is not game frame time or phone FPS.

The hosted job automatically searches up to 20 prior successful runs of this
workflow on the **same branch**. It selects a non-expired matching evidence
artifact using read-only GitHub APIs, downloads it with the official artifact
action, and reads its confined latest report, checking its head against the
selected source and retaining the selected run/artifact IDs. Discovery has
a 30-second total request deadline. It never downloads executable
code from an artifact. Missing, expired, inaccessible or incompatible evidence
is explicitly shown as no comparison, while current assertions still run.
The first run of a new branch may have no baseline. A tooling, test, Node or
hardware change can invalidate an otherwise available baseline; this is not
reported as a game fix or regression. No prior failed evidence is overwritten.
Automatic retrieval is a **last-green regression baseline**. To verify a fix,
explicitly compare against the compatible failing report with `--baseline`;
a previously green baseline alone cannot establish that a failure was repaired.

## Where to watch

For an authorized published draft PR, open its **Checks** tab, then the
**Sunny Acres bounded quality loops** run. GitHub shows live logs and retains
the run's JSON evidence and per-step logs as downloadable artifacts for 14 days.
This is accessible on desktop or phone; no local PC connection is needed.
The run must actually exist before it is described as active or complete.
The GitHub job summary provides a 16-lane scorecard, per-lane execution counts,
source identity, baseline compatibility and remaining qualification limits.
Logs remain the source for live in-progress steps, and artifacts retain details.

For an optional local evidence viewer:

```sh
node farm3d/tests/quality-loop-dashboard.mjs
```

Open `http://127.0.0.1:4318` **on the same computer** while this process is
running. It refreshes saved evidence every two seconds and shows run history,
source identity, lane status, comparisons and log links. It is read-only,
loopback-only, and serves only the selected output folder. Artifact directory
paths are displayed as text; explicitly listed artifact files can be linked.

It is not a public or phone-accessible hosted dashboard. No dashboard process
is claimed running merely because its source exists. A stopped runner may
leave a last recorded `running` status; inspect its process before interpreting
that as ongoing work.

Results are under `farm3d/tests/artifacts/quality-loops/<run-id>/report.json`.
This directory is already ignored by the test folder's existing gitignore.

## Measure/change/test/compare workflow

1. Record a bounded baseline on the exact intended source and hardware.
2. Pick one reproduced defect; preserve its failing evidence.
3. Make one authorized, isolated change on a dedicated branch. Protected
   runtime changes still require their numbered amendment and scope receipt.
4. Rerun the focused lane and compare its report with the explicit baseline.
5. Run every Node lane, applicable browser/integration jobs and existing CI.
6. Inspect real rendered evidence. Owner visual acceptance is separate.
7. Present the specific PR and exact-head evidence to Austin for merge approval.

No weak assertion, longer deadline or omitted original check may be used to
turn a failure into acceptance. Source changes should not be made during a run.

## Additional gates that remain separate

- Firebase Auth/Firestore/Functions emulator tests and real account integration.
- Installed service-worker/update and offline-cache transition journeys.
- Actual Pages/Jekyll package validation and exact-head hosted CI.
- Physical iPhone/Safari, thermal and hardware/GPU performance qualification.
- Owner visual/product acceptance.

Do not glob every historical browser script. Some target frozen commits or
write old campaign evidence. In particular, old pen-matrix campaigns are not
generic recurring loops. This manifest does not replace existing CI gates.

## Scheduling and publication

`farm3d-quality-loops.yml` runs for **any farm3d change** in PRs targeting main
and pushes to main, and supports manual
dispatch after GitHub registers it on the default branch. Austin explicitly
approved publishing the tests-only draft PR and running GitHub checks. The job
checks out the exact PR head, uses read-only repository permissions, Node 22,
a 35-minute job bound and 14-day artifact retention. It also has read-only
Actions access to retrieve same-branch evidence. Existing CI gates remain
unchanged. No timer, Windows task, service, automatic code change, auto-merge
or deployment is configured. Every merge still needs separate approval.
The workflow is still a draft candidate until its PR is merged; other branches
must contain the workflow before GitHub can apply these triggers to them.

## Preserved first hosted baseline

Head `4fb5f9b5c077802d3043526386a4f1b32561d7f5` passed all four triggered
workflows and all 21 jobs: the new loop, existing regression, field qualification
and real Pages package validation. One field job deliberately tested immutable
historical source, separately from candidate coverage. The new Node22.23.4 loop
passed all 16 lanes, 128 files / 131 isolated executions, and 15 tooling controls.
The Firebase emulator's recovery suite passed 27/27 scenarios.

- Loop run: https://github.com/pederaus9-ux/Bugsy/actions/runs/42448457926
- Evidence: https://github.com/pederaus9-ux/Bugsy/actions/runs/42448457926/artifacts/13604227971
- Draft PR: https://github.com/pederaus9-ux/Bugsy/pull/112

Those results belong to that exact first head. The broader triggers, automatic
baseline retrieval and scorecard are a subsequent test-only change and need
their own exact-head validation. An older report may be incomparable because
the tooling fingerprint changed; that is expected and is shown honestly.

## Local validation and unresolved blocker

The runner's six initial control tests passed, including manifest completeness,
bounded CLI validation, failure/timeout preservation and comparison semantics.
The dashboard's seven HTTP/UI tests passed, including read-only methods,
loopback restrictions, path/link safety, artifact-folder handling and statuses.

Subsequent static review added environment/test-fingerprint comparison guards,
strict browser filename-kind separation, unique visual patterns, best-effort
exception finalization and requested/completed iteration accounting.

On the follow-up request to get the loops working, syntax checks passed and the
final independent tooling suite passed **15/15 tests** on local Node 24.19.0.
The initial sandbox attempt passed 14 and could not create the disposable
Windows junction needed for its link-safety test. A narrowly approved run of
only these tooling tests outside that sandbox passed all 15. These inspected
checks use synthetic temporary files and local loopback HTTP, not game execution
or the denied baseline session. This verifies the tooling, not a Node22 game
baseline, browser gameplay, hosted CI or a live dashboard.

The first full Node baseline started as
`2026-11-08T04-09-56-357Z-a9b2db54-1` on Node 24.19.0. It encountered confirmed
CRLF exact-receipt mismatches. The expected field/sound receipt hashes matched
the LF-normalized bytes, so expectations were not changed. The run is not a
qualified Node 22 baseline, and its failures are retained.

Attempting to interrupt that run through its execution session was denied.
No indirect stop/retry, exact-byte repair, new game/browser run or dashboard
launch was attempted after the denial. Its configured total limit is 20 minutes;
the saved report last changed at 2026-11-08T04:10:13Z and has no terminal receipt.
Its old recorded `running` state is not evidence of an active process.
Actual terminal state must be checked through an authorized execution path.
The original candidates are untouched. The owner-approved hosted run uses
repository source on GitHub rather than the blocked PC game-test session.
This candidate adds the scoped PR trigger; actual hosted results must be checked
on its exact head. Scheduling, local viewer launch and game qualification are
not implied by publishing the draft.
