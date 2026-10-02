# Sunny Acres 3D: 7G / 7H gate state

Recorded 2026-10-02, from repository and GitHub evidence (not from any external reference file).

| Item | State | Evidence |
|---|---|---|
| **PHASE 7G REPOSITORY STATE** | **MERGED** | PR #35 merged 2026-10-02 03:14 UTC, merge commit `036bfb4f027cf223d6e2a208e146523c63bbfa68` = current main HEAD; PR head `324a949` is an ancestor of main. `farm3d/firebase/firestore.rules` present on main. |
| Phase 7G CI on main | PASS | Checks on `036bfb4`: "Firestore rules + game flows (emulator)" success, "Farm3D regression" success, Pages build/deploy success |
| **PRODUCTION FIREBASE STATE** | **UNPUBLISHED** (ruleset 7G-1) | No publish has been recorded by the owner. The console's actual current rules can't be read from the build environment, so their exact contents remain UNKNOWN; production still runs the pre-7G rules as far as any record shows. |
| **PHONE SMOKE TEST** | **NOT RUN** | It only makes sense after publishing (procedure in `farm3d/firebase/README.md`). |
| **PHASE 7H REPOSITORY AUTHORIZATION** | **AUTHORIZED** | `CLAUDE_HANDOFF_PHASE7G.md`: after a clean 7G merge, advance to 7H. The owner explicitly approved Claude auditing and changing the protected save code on 2026-10-02 while ChatGPT was out of credits. |

Production Firebase publication is separate from repository phases: 7H work proceeds in the repo, and publishing the
7G rules stays an owner action that can happen at any time, with its rollback copy and phone smoke test.

## Stale documentation reconciled (2026-10-02)

- `farm3d/HANDOFF.md`: the opening said "do not advance to Firebase hardening yet" (pre-7G history). It now starts with the current state.
- `farm3d/PHASE7_PLAN.md`: said "Phase 7G remain[s] deferred". It now says merged / unpublished, 7H active.
- `farm3d/PHASE7G_FIREBASE.md`: status "implemented in repo" is now "merged in repo, publish not done, smoke test not run".
- `farm3d/CLAUDE_HANDOFF_PHASE7G.md`: added a completed-status note (the body is kept as history).
- `farm3d/OWNER.lock`: 7G lock status set to merged/unpublished, and a 7H lock was added with the protected files it touches.
- `progress.md`: 7G marked merged; publish still unchecked.
