# Secondary-write and interrupted restore checkpoint

Tested source: `4a457e4086b4f8fe88de0e48fe79de7b8f250bdf`, branch `codex/safe-test-preview-20261023`. Runtime remains byte-identical to that checkpoint. Only supplemental test/evidence and relay files changed. No existing assertion, seed, deadline, protected digest, production save or Firebase setting changed. All test processes finished. No remote writes.

## Native results

Three independent guest-browser quota injections **FAIL** the exact-state refusal requirement:

| Failed write | Durable farm after refusal | Running/installed farm | Marker left behind | Next ordinary save |
|---|---|---|---|---|
| sa3d-restored | revision1 / 9000 synthetic coins | revision2 / 9017 coins | none | returns true; exactly restores old pre-attempt save |
| sa3d-dirty | revision1 / 9000 coins | revision2 / 9017 coins | restored=1 | same overwrite; restored marker remains |
| weather | revision1 / 9000 coins | revision2 / 9017 coins | restored=1, dirty=1 | same overwrite; both markers remain |

The native file input/confirmation reaches the unmodified `game.js::restoreFrom` path. Each case has all46 unique animals and zero browser errors. The test wraps only Storage.setItem to throw at its named secondary key. Full pre-state, partial state, subsequent ordinary-save state and completed-write trace are preserved in `native-first/results.json` plus screenshots and trace ZIPs. Original FAILs remain FAIL. The subsequent save is a diagnostic observation, not a passing restore.

Player impact is conditional but material to backup safety: after the game says restore failed, reopening before the next save can load the backup anyway; continuing to play can overwrite those backup bytes with the old running farm. Two failure paths leave an explicit-restoration marker attached to that old farm. No real save was used, ordinary gameplay frequency is unmeasured, and actual cloud overwrite was **not** observed in these guest tests. Do not claim widespread loss or a confirmed production incident.

Source cause: `game.js:2271-2277` writes farm, restored marker, dirty marker and weather separately, then clears its save guard on any exception. `save()` at355 resumes writing the old live S. `auth.js::linkFarm` at288 consumes the restored marker to force upload for the same owner; otherwise it follows the ordinary revision/conflict path. This source trace establishes why the intent matters, not a replacement for a signed-in emulator reproduction.

The [HTML Storage algorithm](https://html.spec.whatwg.org/multipage/webstorage.html#dom-storage-setitem) gives individual-key operations, not a transaction over this sequence. No universal crash/disk guarantee has been added to acceptance.

## One interrupted boundary

After the primary farm write and before the restored marker, the native restore stack was paused and captured. The first harness attempt closed the paused page, but subsequent writes still ran. Its strict no-later-writes assertion correctly failed: **harness ERROR**, no product interruption verdict. Full evidence and exact initial test source remain in `interruption-first/`.

Research identified Chromium's documented [`Debugger.resume` terminateOnResume](https://github.com/ChromeDevTools/devtools-protocol/blob/master/pdl/js_protocol.pdl) operation. The single corrected capture terminated the paused execution, closed only that disposable tab without beforeunload, and reopened the same disposable context. It retained the same no-later-writes and exact-farm assertions.

Result in `interruption-terminated/`: completed-write trace contains **only SAVE_KEY**; all four storage keys at the next document's startup exactly equal the captured boundary. Guest boot installs the exact entire backup farm with all46 stable unique identities and correct revision: **PASS**. Restored/dirty intent is absent: **FAIL**. This is controlled JavaScript termination/tab reopening, not physical power-loss, process-crash durability, or signed-in cloud verification. Other interruption boundaries remain unrun because the generic repair scope is now explicit; no further probe is needed to establish that blocker.

Seven deliberate comparator corruptions (live/durable coins, installed polygon, durable layout revision, restore intent, missing/duplicate animal) are rejected; unchanged-state positive control passes. `analyze.cjs` reproduces `summary.json`, including immutable raw-result hashes. Historical positive manual restore, Cancel, malformed input, primary quota and emulator recovery/conflict receipts remain separate valid evidence; they do not cover these failures.

## Exact scope hold and proposed next step

**Pending owner scope decision, not an execution denial.** No runtime repair attempted. A7's exact `game.js` exception is limited to landscape-removal/layout compatibility and atomic ordinary-edit persistence/recovery while preserving cloud handoff. A14 explicitly requires a decision for issues not clearly pen-related. This global manual-restore failure applies without a pen edit. A27 authorizes test/cache/emulator setup only.

Smallest coherent amendment proposal:

1. `farm3d/game.js`: `restoreFrom`, startup `load`, and the existing `restoring`/save guard only, to stage and recover a manual restore across farm/intent/weather writes. Preserve the old complete farm until a recoverable commit exists; do not resume old-state saving after a partial commit. Handle failed rollback/recovery explicitly. No save-schema/economy/animal changes.
2. `farm3d/auth.js`: narrowly gate `linkFarm` and `upload` on unresolved manual-restore recovery, resolving intent before reading a snapshot/choosing/uploading a farm. No account ownership, conflict-choice policy, Firebase configuration/rules or credential change. A small shared local restore-journal helper may coordinate both modules; asynchronous module startup makes a game-only assumption unsafe.
3. `farm3d/index.html` and `farm3d/sw.js`: matching version/import/cache entries only for the approved changed modules/helper. Matching test imports and focused recovery tests; retain every historical RED and current assertion.

Before edits, record exact intended functions and current preimage digests. Verify refusal and recovery at every write boundary, quota during recovery/cleanup, exact paid/layout/tree/ownership preservation, repeated restore, wrong-account/stale-journal/corruption controls, and a bounded signed-in demo-emulator handoff. Reuse unrelated completed evidence. This proposal is not an implementation or request to rewrite all saving/authentication.

## Publication / hosted / device / owner handoff

- All changes are local on `codex/safe-test-preview-20261023` in `Bugsy-safe-preview`; this evidence checkpoint's exact commit is supplied by the final task response. Game source remains4a457e4 (cachev73, game?v33, auth?v19). The current save-integrity RED must be resolved or explicitly dispositioned before claiming local readiness.
- **GitHub upload remains held.** When separately authorized: read the remote ref, then normal fast-forward push of this branch and its accumulated code/tests/evidence to `pederaus9-ux/Bugsy`. Never force-push; no main/PR60/54/37/34 changes. No remote freshness or current hosted result was checked in this turn.
- **Hosted verification remains unrun on this final source.** Existing `farm3d-release-qualification.yml` supports manual dispatch for conflict tests. `cow-cloud-recovery-diagnostic.yml` currently triggers only on the older cow branch, and the planned `animal-pen-diagnostic.yml` is absent. A scoped diagnostic workflow/trigger amendment or supported exact-branch execution is needed to run the selected pen/cache/manual-restore/recovery checks and retain artifacts. Do not dispatch the broad regression workflow as an accidental whole-game scan. These workflow/dispatch actions were not authorized or attempted here.
- **Private Site update remains held.** After source readiness and explicit publication authority: use existing `farm3d/tools/build-safe-test-preview.cjs` isolated pipeline and supported Sites helper for the same owner-private Site `appgprj_6adb7f0aa0388191aa0ddab595515d06`. New output directory, source/version manifest, dedicated storage origin, production Firebase/credentials/endpoints disabled throughout shipped scripts, real-save imports disabled, no production deployment. Re-check packaging and hosted smoke then; no candidate was built/published in this turn.
- **Physical device / owner review pending:** Sitev4 'Works good' is historical usability approval. The later gates, attachment, routing and cache/save work has no current owner phone acceptance. Minimum new hands-on review: portrait/landscape compact controls, outer-map pen Apply/Cancel/reload, trees/ordinary builds, representative occupied care/robot entry-exit, background/resume/offline reopen, and noticeable responsiveness on the owner's actual phone. Backup/cloud fault injection stays in disposable local/emulator tests because the private preview deliberately disables real imports/cloud.
- Previous completed local A27 evidence stays valid:28focused checks, two installed cache transitions,4conflict choices plus5corruption controls,27recovery checks. No repetition this turn. Current full three-night care/wake coverage remains1/30 onA26; historical A22 24PASS/6FAIL is not recredited. Owner-deferred visual head/jaw and timing failures remain RED, broader whole-game scan stays deferred. Continuous-skin breadth, sustained physical-phone performance and final overall visuals are not implied PASS. Fresh owner merge approval and live-deployment approval remain separate and absent.

Tools used: existing local Playwright1.62.1 and `chromium-1234/chrome-win64/chrome.exe`, headless SwiftShader at844x390 CSS pixels/dpr.25. All browser requests outside the disposable localhost origin were intercepted with existing empty stubs. No emulator reset/start, installation, credentials, account or production connection was needed this turn. All owned Node/browser/server commands completed; no active test or tool wait.
