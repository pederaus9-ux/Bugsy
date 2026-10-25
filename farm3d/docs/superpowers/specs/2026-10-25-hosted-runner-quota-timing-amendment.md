# A30: sandbox-compatible runner and quota timing diagnostics

Recorded before edits from local dc036e9b8596a34c2b1e3a19d97c8721d33c8789. Trusted owner reply 2026-10-25 20:47:59 UTC, Sentinel_704daf6903d08191acc0da6703ba80aa, "Yes", approved the parent's exact question about a compatible sandboxed runner, recovery timing diagnostics and affected-job rerun, without game changes, weaker assertions or longer timeouts.

Named scope: `.github/workflows/farm3d-release-qualification.yml` and timing-only instrumentation in `farm3d/firebase/tests/recovery.browser.cjs`. Pre-edit bytes/hashes are retained in `tests/evidence/pen-editing-implementation/task8-codex-hosted-a30-20261025/`. No helper/runtime/security/credential changes. Preserve A29 original failures and all old assertions/deadlines.

Plan and acceptance:

1. Change only pen/cache runner to supported Ubuntu 22.04. Keep pinned Chromium and raw CDP launcher flags, including its sandbox. No AppArmor/sysctl changes, sandbox-disable flags, setuid installation or paid/custom runner.
2. Add a manual choice defaulting to the existing full run, plus an explicit affected-cache/recovery choice. PR/default conflict behavior and all existing job commands remain available. For the approved affected run, omit only already-passed conflict/focused/source/animal-route execution; both failed cache transitions and original recovery/manual-restore sequence run unchanged. This scheduling distinction does not mark omitted checks as new passes.
3. Add bounded, read-only quota timing records: listener arm, reload call/return, document lifecycle, local emulator request/response/failure, actual CDP console emission timestamp versus Node delivery, wait settlement and failure cleanup. No storage/auth/game state edits, renderer release, sleeps, polling, assertion replacements or timeout changes. Keep only small JSONL records, no new full trace archive.
4. Verify by exact inverse diff, unchanged assertions/deadlines/runtime hashes, syntax and scheduling controls; upload normally after remote check. Dispatch once on the new exact head and inspect terminal artifacts. Retain any new failure without blind rerun.

Research: Chromium documents downloaded-browser sandbox restrictions on Ubuntu 23.10+ at https://chromium.googlesource.com/chromium/src/+/main/docs/security/apparmor-userns-restrictions.md. Ubuntu 22.04 remains listed by GitHub's standard runner catalog and Playwright system requirements. Choosing it is an evidence-backed environment candidate, not a verified success until startup/transition execution. GitHub workflow_dispatch choice inputs support bounded job selection. No claim of a universal browser guarantee.

Publication authority is limited to this branch amendment/receipts and affected jobs. Site v5 unchanged. Phone acceptance remains pending, so merge and deployment remain held under parent gate coordination.
