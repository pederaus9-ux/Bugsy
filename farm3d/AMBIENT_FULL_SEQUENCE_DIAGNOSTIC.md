# Original full-sequence ambient diagnostic — evidence

The one owner-authorized execution passed every program in the original character
sequence. The original main199 ambient-resume failure was not reproduced.
**Verdict: INCONCLUSIVE on the original failure's cause.** No correction, second
execution, merge, public deployment or release is proposed by this report.

## Exact version and scope

- Main, verified before and after: `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`.
- Base tree: `55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b`.
- Branch: `codex/ambient-full-sequence-diagnostic`.
- Tested native head: `26d332dfabf205466b304cff57578cb8c16161be`.
- Tested tree: `3e04600ba0f810e02df134a38a90f48b2fa3324c`.
- [Workflow 1, attempt 1, run 38338910516](https://github.com/pederaus9-ux/Bugsy/actions/runs/38338910516),
  job `115105248859`: SUCCESS. No retries.
- Owner request: 2026-10-12 21:47:27 America/Chicago, one original full sequence
  with frame logging, unchanged game code and test limits.

Run the unchanged `npm run test:core:characters` command, in its original order:

1. `farmer3d.browser.cjs` — PASS.
2. `farmer3d-walk.browser.cjs` — PASS.
3. `farmer3d-evidence.browser.cjs` — PASS.
4. `recovery-startup.browser.cjs` — PASS.
5. `farmer-depth.browser.cjs` — PASS.
6. `scene-polish.browser.cjs` — PASS at 844/1280 and visuallegacy.
7. `phase7m-color.browser.cjs` — PASS at 844/1280.

The same Ubuntu 24.04, Node 22, pinned dependencies, Playwright/SwiftShader
setup and original 20-minute job bound were used. Original fail-fast `&&`
sequencing was retained. Full scene, legacy and subsequent color fixtures ran.
The dedicated diagnostic did not run the other six regression jobs.

Only an observational Node preload, dedicated diagnostic workflow, report and
relay notes were added to the tested branch. `package.json`, package-lock,
original browser harness/fixtures and all production files are unchanged.
Original fixture SHA256:
`88f0a77329ee7129ab5701ee07cf72e08714d4931dcfc4572296df4e84e6f435`.
Both original 700 ms waits and original equality/inequality assertions remained
literal. No timeout, retry, assertion threshold or fixture case was removed.

## Verified measurements

A draw callback is the game's butterfly update invoked when Three.js draws that
object. A timer can expire even when no such draw happens. Counts below are
since the motion-setting marker, sampled immediately after the unchanged
assertion. The observation snapshot is later than the timer/comparison and is
**not a replacement wait or changed test limit**.

| Width | Mode | Assertion | Draw callbacks | First callback after marker | Post-assertion snapshot | Geometry changed |
|---|---|---|---:|---:|---:|---|
| 844 | Reduced | PASS | 1 | 653.9 ms | 721.6 ms | No |
| 844 | Full | PASS | 1 | 603.3 ms | 727.2 ms | Yes |
| 1280 | Reduced | PASS | 0 | None | 721.3 ms | No |
| 1280 | Full | PASS | 1 | 239.3 ms | 718.4 ms | Yes |

- Both full-motion assertions observed changed geometry with one actual draw.
- The 844 pause assertion had one callback without movement.
- The 1280 pause assertion passed with **no callback**: it did not exercise the
  paused update handler. This is a demonstrated coverage weakness, not proof
  of a production motion failure.
- Page visibility, object/ancestor visibility and camera bounds were valid in
  all four snapshots. The test changed `data-motion`; unchanged game preference
  fields remained `system`/false. This is the original fixture's mechanism,
  not a real device settings-menu acceptance test.
- At 844, only two animation-frame samples were logged across pause/resume,
  separated by 683.3 ms. At 1280, only one was logged, during full motion.
  These sparse software-render samples cannot establish FPS or phone cost.
- Measured callback instrumentation cost was 0–0.1 ms at the clock's resolution.
  Observation can still affect scheduling; overhead is not proven zero.
- Full-scene geometry/texture resource counts stayed 256/97 before and after
  at each width. This does not exclude other process/GPU resource effects.

## Comparison and limits

The earlier bounded diagnostic at `528f0a9dbe9e12409c017a3a6872b98dab695672`,
[run 38335774387](https://github.com/pederaus9-ux/Bugsy/actions/runs/38335774387),
also passed all four comparisons. It logged the same callback counts: 844
reduced/full = 1/1, 1280 = 0/1. Its first full callbacks were 590.3/234.7 ms,
versus 603.3/239.3 ms in this full sequence. One run of each is insufficient to
characterize variability or prove any cause from those small differences.

**VERIFIED:** the complete earlier programs did not reproduce an ambient-resume
failure during this execution; all later programs also completed. Rendering was
sparse in both diagnostic runs. The original failed main199 check remains failed
and visible.

**LIKELY:** the fixed wall-clock observation window is sensitive to sparse CI
software rendering. A callback-dependent effect cannot be checked reliably if
no draw opportunity occurs. This hypothesis has direct supporting observations,
but no failing resume window was captured in either diagnostic.

**UNKNOWN:** why original main199 failed; whether earlier programs sometimes
cause rendering interference; what callbacks occurred in the original failing
window; whether instrumentation changed that scheduling; real-device cost.
A passing rerun is not evidence that the underlying intermittent issue is fixed.

Original [main199, run 38331540392](https://github.com/pederaus9-ux/Bugsy/actions/runs/38331540392)
failed `ambient motion resumes` at `scene-polish.browser.cjs:34`; other six jobs
passed. Its Playwright trace measured a 702.058 ms full-motion wait followed by
an unchanged-geometry result, but did not contain draw counters. It therefore
cannot prove absence of draws retrospectively. Frozen earlier analysis:
[06526afb report](https://github.com/pederaus9-ux/Bugsy/blob/06526afb973797fdddbc369de225aa59a01fa3eb/farm3d/AMBIENT_RESUME_DIAGNOSTIC.md).

## Durable receipts and stopping condition

Raw observations are preserved byte-for-byte in
`tests/evidence/ambient-full-sequence/observations.json`; derived timing fields,
version and artifact provenance are in `summary.json`. `pass-log.txt` contains
all 16 original PASS lines with timestamps, and `scene-polish-results.json`
retains complete original scene results. Generated screenshots are in the CI
artifact; they were not used to grant new visual acceptance in this diagnostic.

Artifact `ambient-full-sequence-1`, ID `11786532025`, 6,617,818 bytes:
SHA256 `655ef81852ea37457d006ecb056c8f193b10404142c359cc834169cec3b34624`.
The downloaded archive matches GitHub's digest. These report/receipt additions
are an evidence-only child of the tested head; the workflow path filter excludes
them, so saving results does not authorize or start another diagnostic execution.

This bounded run is finished. Stop here and report the evidence before a fix.
Do not alter game code or the 700 ms assertion, clear the original failure, or
launch an unchanged retry. Any next investigation should discriminate render
opportunity from wrong motion state, with one specific hypothesis, rather than
repeat the entire suite without new information. No production change is
supported by a reproduced failure in this execution.
