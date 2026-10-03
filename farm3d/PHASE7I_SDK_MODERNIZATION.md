# Sunny Acres 3D — Phase 7I: Firebase SDK modernization

Status: IN PROGRESS
Base: `main` at `9f8dd5b2ab3ade76b847bdd3f6dac7c30d9a73e4` (PR #44 merged; owner accepted all six animals on S26 Ultra)
Branch: `chatgpt/phase7i-firebase-sdk`

> Naming note: older repository documents used "Phase 7I" for the dormant verified-marketplace experiment. The current `PHASE7_PLAN.md` supersedes those older labels. This file refers only to the current-roadmap Phase 7I: Firebase SDK modernization.

## Why this phase is next

Current production browser code still loads Firebase JavaScript SDK `9.23.0` from gstatic in `auth.js` and `players.html`. The current roadmap orders Firebase SDK modernization after the completed 7G/7H hardening work and before Analytics v2.

Firebase's official release notes list JavaScript SDK `12.19.0` as the current release (2026-09-09). The upgrade target for this phase is therefore `12.19.0`, unless exact-head compatibility testing identifies a blocking regression that requires an explicitly documented intermediate version.

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

## Next exact step

Update the production SDK references and the emulator harness/package lock together, then run the complete local test matrix before opening this draft for merge review.
