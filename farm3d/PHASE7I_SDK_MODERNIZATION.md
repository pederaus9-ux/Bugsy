# Sunny Acres 3D — Phase 7I: Firebase SDK modernization

Status: IN PROGRESS
Base: `main` at `9f8dd5b2ab3ade76b847bdd3f6dac7c30d9a73e4` (PR #44 merged; owner accepted all six animals on S26 Ultra)
Branch: `chatgpt/phase7i-firebase-sdk`

> Naming note: older repository documents used "Phase 7I" for the dormant verified-marketplace experiment. The current `PHASE7_PLAN.md` supersedes those older labels. This file refers only to the current-roadmap Phase 7I: Firebase SDK modernization.

## Why this phase is next

At phase start, production loaded Firebase JavaScript SDK `9.23.0` from gstatic in `auth.js` and `players.html`. This branch now pins `12.19.0` in both. The current roadmap orders Firebase SDK modernization after the completed 7G/7H hardening work and before Analytics v2.

Firebase's [official release notes](https://firebase.google.com/support/release-notes/js) list JavaScript SDK `12.19.0` (2026-09-09), verified 2026-10-03. This is the pinned target. Relevant fixes include Auth persistence reconnection after pagehide and storage-inaccessible fallback. This game uses the modular API already, so no compat layer or gameplay rewrite is required.

## Scope

Production code:
- Upgrade the modular browser SDK URL used by `farm3d/auth.js`.
- Upgrade the modular browser SDK URL used by `farm3d/players.html`.
- Preserve named Firestore database `default`.
- Preserve email/password authentication, guest play, account migration, cloud saves, recovery, friends, presence, leaderboard, showcase, trading-post behavior and dormant verified-economy behavior.
- Bump module/query/cache versions only where required for reliable rollout.

Test infrastructure:
- Make the Firebase emulator harness exercise the same SDK version as production rather than silently testing the old 9.23.0 browser build.
- Keep existing rules/economy/recovery coverage intact.
- Do not weaken timeouts, assertions, viewport coverage or failure thresholds to obtain a pass.

Out of scope:
- No schema changes.
- No save-format changes.
- No economy redesign or activation.
- No Firebase rules policy expansion except a compatibility fix proven necessary by the SDK upgrade.
- No Analytics v2 work yet.
- No App Check enforcement.
- No visual/gameplay redesign.

## Required acceptance gates

1. Exact production SDK target is pinned and documented.
2. Normal farm and test farm boot without page errors.
3. New account registration and returning-account sign-in pass.
4. Guest play and guest-to-account migration pass.
5. Cloud save upload/download/revision conflict behavior passes.
6. Corrupt/missing-local-save recovery cases pass, including delayed startup.
7. Friends, usernames, showcase, visits, watering, presence and leaderboard flows pass.
8. Spark production mode sends no dormant verified-economy calls.
9. Economy-mode emulator coverage still passes without enabling it in production.
10. Old-save suite remains green.
11. Full Farm3D regression remains green.
12. Hosted CI is fully green on the exact PR head.
13. After merge/deploy, owner runs a short S26 Ultra account/cloud smoke test before Phase 7J begins.

## Current finding

At phase start, `auth.js` and `players.html` still reference `https://www.gstatic.com/firebasejs/9.23.0/`. The emulator harness also intentionally serves the 9.23.0 npm/browser files, so changing production alone would create false confidence. Production and emulator versions must move together.

## Implementation and validation

The browser URLs and emulator alias/lock move together. The alias is now
`firebase-browser: npm:firebase@12.19.0`; the harness checks its installed version
against both production files before running and refuses mismatches. Node rules
test dependencies and Firebase CLI remain separate and unchanged in scope.

Release/cache 35 and auth query 16 invalidate old phone code. The service-worker
fetch policy is unchanged. No auth/recovery/save behavior, schemas, economy flags,
friends implementation or animal/gameplay code is rewritten.

Local 44/44 units pass, including exact production/harness/package-lock parity.
The actual npm browser builds were loaded in Chromium through the real owner page:
App/Auth/Firestore/Functions share one app and expected modular APIs; owner sign-in
boot passes both normally and with IndexedDB/local storage blocked. No mock SDK
exports or production backend requests were used by this focused check.
Results/screenshots are under `tests/evidence/sdk/`. The same check runs in CI
alongside the full hosted emulator suite, whose real auth/save/social transactions
remain the integration authority. Current-head CI must pass before merge approval;
older green runs on the scope-only commit do not validate this migration.

After approval/merge, verify Pages and exact live SDK/query/cache files, then request
the owner's S26 account/cloud smoke test. The prepared analytics PR #46 stays in
draft until this step is accepted; rebase it on fresh main and deliberately use
the next cache/auth version before rerunning all five checks. The owner has asked
for continuing through the remaining roadmap after each specifically approved merge.

The parallel analytics CI run at `866ad2c` exposed a pre-existing pet-fixture race:
the test set noon once, but the active game calendar/weather overwrote it, reset
the cow's idle hold and sent it roaming out of the aimed target. Failure log and
artifact 11286673239 are preserved. The walk fixture now uses the existing
`preset=noon` override throughout and asserts the held cow position as well as
the original raycast/visible Pet action/actual E interaction and affection checks.
No production AI, assertion, timeout or threshold is relaxed. The exact SDK head
must be retested after this fixture repair.
