# Claude Handoff — Sunny Acres 3D Phase 7G

> **Status (2026-10-02):** completed and merged as PR #35 (main `036bfb4`). Production rules not yet published by the
> owner. This file is kept as the historical handoff; current state lives in `PHASE7G_FIREBASE.md` and `docs/phase7h/GATE_STATE.md`.

PROJECT: Sunny Acres 3D
WORKSTREAM: SunnyAcres/FirebaseHardening
OWNER TO ASSIGN: Claude
BASELINE MAIN COMMIT: `97cb54055e3284d5ec2a063a48d7991658075c73`
ARCHITECTURE BRANCH: `chatgpt/sunny-acres-phase7g-entry`
CURRENT PHASE: 7G — Firebase hardening

## State entering Phase 7G

- PR #29 Phase 7E locomotion prototype: merged.
- PR #30 Phase 7F locomotion rollout: merged.
- PR #31 true 3D cow prototype: merged.
- Austin confirmed the new cow loads on the phone.
- PR #32 made 3D cows the default on the normal phone/PC game link: merged at baseline above.
- Save behavior is preserved.
- Existing local + hosted regression checks for PR #32 passed.

## Read first

1. `farm3d/PHASE7G_FIREBASE.md`
2. `farm3d/PHASE7_PLAN.md`
3. `farm3d/HANDOFF.md`
4. `farm3d/DESIGN.md`
5. `farm3d/auth.js`
6. `farm3d/friends.js`
7. `farm3d/players.html` and any dashboard/admin-facing Firebase code
8. `.github/workflows/farm3d-regression.yml`

## Goal

Version and test the actual Firestore security rules, cover every collection used by the game, preserve current gameplay/account flows, and document what remains client-authoritative.

## First action — audit before editing

Inventory every Firebase collection/path and every operation from current main. At minimum account for:

- `farms/{uid}`
- `players/{uid}`
- `players/{uid}/friends/{fid}`
- `usernames/{nameLower}`
- `showcase/{uid}`
- `help/{uid}/items/{id}`
- `market/{id}`
- `events/{id}`
- presence/dashboard paths

Search all `farm3d/*.js` and HTML modules for Firestore reads/writes/transactions so nothing is missed.

## Critical architecture rule

Do not confuse Firebase Authentication with server-authoritative gameplay.

Client code currently calculates inventory, coins, progression and leaderboard/showcase values. Firestore rules can enforce:

- caller identity
- document ownership
- field shape/types/ranges
- immutable fields
- legal document transitions
- access boundaries

They cannot prove that browser-computed gameplay values are honest.

Do not market or document Phase 7G as cheat-proof economy/leaderboards.

## Implementation target

1. Add a version-controlled Firestore rules file.
2. Add Firebase emulator/rules tests using an official supported testing path.
3. Add configuration needed for local rule tests without changing GitHub Pages hosting.
4. Cover allow AND deny cases for every production collection.
5. Keep current cloud-save revision/conflict behavior working.
6. Keep guest mode working.
7. Keep username transaction/rename behavior working.
8. Harden market state transitions and ownership.
9. Bind showcase/profile writes to matching UID and schema.
10. Bound help/events payloads and access.
11. Audit all presence/dashboard paths.
12. Evaluate App Check only after rules are green; prefer monitoring before enforcement.
13. Run the full existing Sunny Acres regression suite and hosted CI.

## Market hardening priority

The market is the highest-risk shared-write path.

Require tests proving:

- seller can create only their own listing
- seller/item/qty/price remain immutable after creation except where explicitly necessary
- buyer can transition only an unsold listing
- buyer cannot buy own listing
- buyer cannot alter item/qty/price/seller
- second buyer cannot overwrite a sold listing
- only seller can remove an unsold listing
- collection/deletion of sold listing follows current client flow without allowing unrelated deletion
- malformed field types/ranges are rejected

Do not claim rules can verify coin balance or inventory escrow; those are client-side.

## Rules deployment safety

Do not deploy a stricter production ruleset until emulator tests prove the current app flows still work.

If access to Firebase console/CLI is available:

- fetch or inspect the currently deployed rules first
- preserve a copy/hash of the pre-change rules
- compare proposed rules against current behavior
- deploy only after tests pass
- immediately run signed-in smoke tests after deployment

If Firebase production-rule access is not available, commit/test the rules and return that limitation in the handoff; do not guess what is currently deployed.

## Existing regression requirements

At minimum keep the existing suite green, including:

- normal boot
- testfarm boot
- no page errors
- planting
- harvest
- orders
- walking/interactions
- save/reload
- panel fit at mobile + desktop sizes
- shed-switching regression
- 3D cows default
- `?characters2d` comparison mode
- save preservation

## Protected systems

Do not change unless required and justified:

- save key / save ownership semantics
- cloud save revision conflict logic
- guest-mode migration
- Phase 7E/7F locomotion
- 3D cow rendering
- older `/farm` game
- unrelated root Bugsy app
- GitHub Pages hosting structure

## Phase-gate evidence back to ChatGPT

Return:

PROJECT / WORKSTREAM / BASELINE / RESULT COMMIT
GOAL
COLLECTION/PATH INVENTORY
CURRENT DEPLOYED RULES SOURCE + HASH (if accessible)
CHANGED FILES
PROTECTED FILES TOUCHED
RULES TESTS — PASS/FAIL with allow + deny counts
FULL GAME REGRESSION — PASS/FAIL
HOSTED CI — PASS/FAIL
MARKET TRANSITION TESTS
GUEST + ACCOUNT + CLOUD SAVE TESTS
APP CHECK DECISION
CLIENT-AUTHORITATIVE LIMITS STILL REMAINING
FAILED APPROACHES / DO NOT RETRY
RISKS
NEXT EXACT STEP

## Automatic progression

Routine failures are yours to diagnose/fix without Austin.

When Phase 7G is clean, merge under the standing authorization and advance automatically to **Phase 7H — Save + update hardening**.

If ChatGPT usage becomes unavailable, continue from this file and `PHASE7G_FIREBASE.md`; do not wait for a new ChatGPT session unless a major unresolved architecture/integrity issue appears.
