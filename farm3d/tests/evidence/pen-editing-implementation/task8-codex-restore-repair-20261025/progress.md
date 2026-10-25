# A28 manual restore integrity

Runtime candidate: `bcb7c0c19ff51ac44a4c84376f870ec54dc23001`, branch `codex/safe-test-preview-20261023`. Local only. Owner authority, acceptance criteria and pre-edit digests were recorded before edits in `docs/superpowers/specs/2026-10-25-manual-restore-amendment.md` and `pre-edit-digests.json` here.

## Repair and scope

The former restore published the imported farm before its intent/weather writes. A later storage exception reported refusal while the running farm was still the prior farm, allowing the next save to overwrite the imported backup. The three original secondary-write REDs and the missing-intent interruption RED remain under `../task8-codex-restore-secondary-20261025/`.

The shared helper first writes a recoverable journal containing both complete snapshots and the local owner. It publishes intent/weather before the farm, archives both snapshots, then removes the pending record. Caught failures record rollback intent before restoring the prior keys. Interrupted or failed cleanup remains guarded until synchronous startup recovery finishes. Corrupt, unknown, owner-mismatched or unrelated state is preserved and held for recovery rather than guessed. Current-version stale tabs are prevented from saving over another tab's completed restore. Auth checks the recovery epoch before/after awaited handoffs and inside the cloud transaction.

Only the approved game restore/load/save guards, auth handoff guards, helper and cache entries changed. `scope.json` and the scope test invert every game/auth change to the exact pre-edit bytes. Other protected implementations and frozen receipts remain unchanged. Game34/auth20/helper1 use cache v74. No Firebase configuration, rules, economy, animal behavior or geometry change.

## Completed local results

- 64 distinct focused checks PASS: 44 save/writer/transaction/version checks, 6 scope/integration checks and 15 lock/SDK checks with one repeated scope check. The 11 helper cases include every storage publication boundary, refusal, failed rollback/cleanup, corrupt records, owner mismatch and stale tabs. Logs: `focused-first.txt`, `scope-first.txt`, `lock-fixtures-final.txt`.
- Original unchanged native secondary-write tests: all three PASS, preserving exact prior live/installed/durable state on refusal. `native-secondary/results.json`.
- Supplemental journal-aware native interruption: PASS exact imported farm, all 46 identities, intent before primary publication, complete expected write sequence, and no later writes after termination. `native-interruption/interruption.json`.
- New isolated account/emulator journey: three groups PASS for unresolved-journal save/upload refusal over 20 seconds, startup linking refusal, and interrupted owned restore of the exact 46-animal backup to the original account. `emulator/manual-restore.json`.
- Original four conflict cases PASS, including both choices and equal-clock conflicts; five corruption controls remain. The unchanged 27-check recovery suite PASS includes edited layout/paid state, primary quota refusal, delayed startup, corrupt/missing cloud, offline recovery, late replies and sign-out/sign-in. `emulator/regressions/conflicts-results.json` and `recovery.json`; full log `affected-emulator-regressions.txt`. The browser timeline is losslessly gzip archived with raw SHA-256 and original timestamp in `emulator/regressions/manifest.json`; original ignored raw artifacts remain.
- Installed v73-to-v74 transition PASS on immutable predecessor/current Git trees: exact game34/auth20/helper1 cache bytes, predecessor removal, foreign cache preservation, online and offline custom-pen reload with unchanged saved fields. `cache-v73-v74/results.json`.
- Original native manual-backup/recovery journey PASS, all 9 groups including exact whole-farm/all46 backup, Cancel, malformed input, primary storage refusal, confirmed restore, second reload, visit/home isolation and 8 corruption controls. `native-original-recovery/results.json`.

`source-and-original-tests.json` fixes the candidate runtime hashes and confirms seven original native/emulator/cache scripts are byte-identical to the predecessor. Initial native working-copy runs reported the predecessor Git HEAD; their tested runtime bytes are recorded separately and are not falsely described as a committed-tree run. The new cache journey serves immutable committed source.

## Intermediate failures and interpretation

The first new emulator fixture assumed a frozen-clock new account would autosave, but capture showed both durable and cloud farm absent, with no recovery block. Only the new fixture setup was corrected to explicitly commit/upload its baseline as the existing conflict fixture does; the original 60-second limit and exact farm assertions remain. `emulator/first-failure.json`, `setup-capture.json`, saved script copies and console logs preserve this failure.

A lock corruption control initially failed because the new, earlier scope guard produced a different diagnostic string. Its original assertion was retained; the guard now includes the required original diagnostic. `lock-fixtures-first.txt` remains alongside the passing result. The helper's initial RED is also preserved.

The historical interruption test expected a one-write sequence before termination. It remains unchanged, not relabeled PASS. The supplemental test asserts the full new sequence `[pending, restored, dirty, weather, farm]`, exact state and no post-termination writes. It does not omit the old safety guarantee.

## Limits and remaining handoff

These are disposable local Chromium and localhost `demo-sunny-acres` Firestore/Auth checks, not production accounts, hosted CI or physical phone testing. Interruption is deliberate JavaScript/tab termination, not physical power-loss proof or a universal cross-process transaction guarantee. Stale-tab controls cover the current implementation; already-running older clients were not requalified.

No broad herd matrix, expensive collision experiment, whole-game scan or final visual work was resumed. Current A26 care/wake coverage remains 1/30; historical results and owner-deferred timing/head-jaw REDs keep their previous status.

All approved local A28 checks are complete. Both relays updated; code and evidence saved in local commits. Upload, private Site update, hosted mutations, merge and live deployment remain on hold. Exact-source hosted checks, current private-phone review/performance and final owner release/merge approval remain separate. Historical private Site v4 acceptance is not approval of this candidate.

## Exact next gates

1. Obtain separate authority for accumulated branch code/evidence upload; check remote state and use a normal fast-forward push only. No remote write attempted here.
2. Arrange focused exact-source hosted qualification. The existing release qualification supports conflict dispatch, but the cloud-recovery workflow targets an older branch and the proposed pen diagnostic workflow is absent. A narrow workflow/trigger amendment or supported exact-branch execution is needed; do not substitute a whole-game scan.
3. With separate publication authority, rebuild through the existing isolated preview pipeline and update only owner-private Site `appgprj_6adb7f0aa0388191aa0ddab595515d06`. Keep production cloud/imports disabled. Current phone/visual/performance review should cover compact controls, outer-map edits/reload, trees, representative occupied care/robot passage and background/offline return. Local emulation is not physical-device evidence.
4. Final owner release/merge and live-deployment decisions remain absent. The severity-based deferrals and current care/wake 1/30 are disclosed rather than represented as full technical qualification.

All owned test sessions have completed. The emulator reported orderly shutdown, and no listeners remained on 8085/9099/4400/9150. No runtime source changed during final verification. No active test, approval wait or execution blocker remains for this local slice.
