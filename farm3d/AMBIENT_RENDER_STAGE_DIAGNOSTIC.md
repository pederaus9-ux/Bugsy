# Bounded render-stage timing investigation

Base main: `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`, tree
`55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.
Branch: `codex/ambient-render-stage-diagnostic`. ChatGPT is the only implementer.

The completed original full sequence passed (run38338910516) with the same
sparse callback pattern as the isolated run. It did not reproduce main199's
ambient-resume failure. These runs are frozen evidence; do not rerun them.

The owner said okay to the proposed next render-timing investigation. This
new experiment runs **one original complete scene fixture**, without preceding
character programs. It is not another full-suite retry. No game correction or
merge is authorized.

## Falsifiable hypothesis

Long synchronous rendering or delays before the next game frame account for
the sparse draws. Alternatives: expensive game update outside rendering, a
frame that skips rendering, or a drawn butterfly using the wrong motion state.

Source evidence: `index.html` schedules the next frame after update/render work.
`phase7m.js` updates butterflies only in their actual `onBeforeRender` callback.
Prior observation shows only one drawn update in each full-mode 700 ms window.
That is supporting context, not proof of the original failing cause.

## Smallest new measurements

Before the original twenty weather GPU fences, install temporary observational
wrappers around requested callbacks named `frame`, the cached EffectComposer
render method, and renderer.render. Record start/end spans, request-to-delivery
delay, nesting, visibility and quality state. Observe browser long tasks.
Native receiver, arguments, return value, errors and request IDs are preserved;
no extra draw, forced fence, altered frame rate or artificial load is introduced.

Reuse the prior butterfly callback and motion marker logger at the original
pause/resume checks. Spans are bounded to 256 entries; callback data to 128.
Capture both original assertions after execution. Restore every observed method
once the full-motion assertion is captured, including on assertion failure.
One initial already-queued game frame can precede RAF wrapping; do not claim
complete startup timing coverage. Nested wrapper cost is part of the observed
run and cannot be assumed zero.

Compare frame time with composer time, renderer pass time, and delivery delay.
A frame with no composer call distinguishes skip/no-draw from expensive drawing.
A full-motion callback with unchanged geometry would implicate update/state.
If the failure does not recur, report measurements as diagnosis of sparse
rendering only, not a retrospective root-cause proof.

## Preserved contract and stop

Original `scene-polish.browser.cjs` remains byte-identical; source SHA256
`88f0a77329ee7129ab5701ee07cf72e08714d4931dcfc4572296df4e84e6f435`.
All cases/assertions, both 700 ms waits, pinned dependencies, browser harness,
viewport/drawing buffer, original 20-minute job limit and fail-fast behavior
remain unchanged. No production file, save/cloud/economy, animal, renderer API
source or service worker is edited.

Stop after this single execution and preserve failures. No automatic retry,
threshold change, production fix, merge or release. Report verified evidence,
likely causes and unknowns before deciding any correction.

Preparation passed static syntax and unchanged-source guards. Completed hosted results follow below.

## Completed execution and findings

Tested head: `61dc68647f5b3b28f1abafe1912ea87b49d6ce0f`.
Tested tree: `a28e908b6954ceed4c6f58b1a768a8a579e26706`.
[Run38385795074](https://github.com/pederaus9-ux/Bugsy/actions/runs/38385795074),
attempt1, job115257145474: SUCCESS. The original complete scene fixture passed
at both widths and visuallegacy; all four original ambient assertions passed.
No preceding character programs or subsequent color program were run here.
Main remains `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`.

| Width / mode | Draws | Frame CPU time | Composer CPU time | Time from request to next frame | First draw after mode marker |
|---|---:|---:|---:|---:|---:|
| 844 reduced | 1 | 16.9 ms | 14.4 ms | 662.5 ms | 655.4 ms |
| 844 full | 1 | 9.8 ms | 7.8 ms | 660.4 ms | 529.1 ms |
| 1280 reduced | 0 | None | None | No frame in window | None |
| 1280 full | 1 | 12.7 ms | 10.9 ms | 1007.4 ms | 210.6 ms |

Frame CPU time is the synchronous callback duration, including the nested
observational wrappers. Composer CPU time is drawing/post-processing submission,
including any synchronous command stalls, not complete GPU execution. Request
latency starts when the **preceding game frame requests** its successor. That
request may predate the motion toggle: the 1007.4 ms delay is therefore compatible
with a draw 210.6 ms after switching to full. Do not confuse those clocks or
interpret the later logging snapshot as a changed 700 ms wait.

**VERIFIED**

- Most elapsed time in these samples occurs before the next requested frame is
  delivered, rather than inside the running game-frame callback. Outside the
  composer, the three drawn assertion-window frames took 2.5/2.0/1.8 ms.
- Each sampled frame called the composer once; page was visible and the 30 FPS
  cap was false. No sampled assertion-window frame skipped drawing. The full
  callbacks ran in full mode and changed geometry; the 844 reduced callback
  ran in reduced mode without changing geometry.
- The nearby five-second lookback included delivery delays up to 3317.7 ms at
  844 and 3561.1 ms at 1280. Nearby frame CPU times were 7.9–16.9 ms. These
  lookbacks include the original weather-fence work, not just the assertions.
- Supported long-task observation logged no task in those selected nearby
  windows. This does not exclude off-thread work or contention elsewhere.
- The 1280 pause check again passed with no draw opportunity. The test's
  unchanged-geometry comparison alone cannot distinguish working pause from
  not rendering. The observed full-frame spacing exceeds 700 ms at 1280,
  supporting sensitivity to the time at which the test starts its timer.
- Literal source hash, original assertion guards and raw receipts were checked.
  Every production file and the original fixture/harness/dependencies remain
  unchanged. No automatic retry, game correction or merge occurred.

**LIKELY**

Browser scheduling or asynchronous software-GPU work delays frame delivery.
This is more consistent with the measured timing split than a several-hundred-ms
horse update or synchronous rendering callback in these windows. The exact
browser/GPU mechanism is not measured here. Timing dependence is supported;
this is not proof that the original failed main199 window had no draw.

**UNKNOWN / limits**

Original main199's immediate failure cause remains unverified. The original
failure was not reproduced, and none of its draw counters were captured. The
instrumentation can affect scheduling. Logged bookkeeping costs are partial
and quantized; do not treat them as a complete overhead benchmark. Initial
already-queued frames and bounded span retention limit startup coverage. No
real phone, device FPS or thermal result follows from this SwiftShader run.

## Receipts and next action

Artifact `ambient-render-stage-1`, ID11807365441, 845452 bytes, digest
`f180d6bd885512286e876e9ef11ed82f914811968b8e249d89b126dbf1b995ad` matches the
downloaded ZIP. Raw observations are frozen byte-for-byte in
`tests/evidence/ambient-render-stage/observations.json`. `summary.json` records
version/provenance and derived spans; `pass-log.txt` and original
`scene-polish-results.json` preserve test outcomes. The evidence-only child
commit does not trigger the diagnostic workflow's path filter.

The bounded experiment is finished. **No production fix is supported by a
reproduced game defect.** The next justified correction area is test-harness
synchronization/coverage: require an actual drawn pause and resume observation,
and distinguish no frame from incorrect animation. Any proposed change must
retain equivalent or stronger checks, explain its timing contract, preserve the
original failed evidence and receive review before integration. No longer
wait, lower quality or blind full-suite retry is justified by this report.
The original main199 failed check remains visible and unresolved.
