# Sunny Acres 3D: Phase 7I (real farm marketplace) progress

Base: main `ed9a3453af893c922788611edfa39241e5a73dd5` (Phase 7H merged, PR #38). Branch: `claude/sunny-acres-phase7i`.
Design: `CLAUDE_HANDOFF_PHASE7I-3.md` (architecture closed). Firebase production: **not deployed, not published.**

## Reconciliation with merged 7H

Nothing in 7H invalidates the 7I design. Four constraints carry forward:

1. **The 7H cloud save stays legacy-only.**
   - `farms/{uid}` is one client-written blob, and recovery, the farm chooser and restore all swap it whole.
   - The canonical economy therefore lives in separate, server-written documents (`economy/`, `ledger/`, `plots/`).
   - No 7H path can overwrite them, because they aren't in the blob and clients can't write them.
2. **7H already treats the save's coins and barn as client data.** That matches "legacy, unverified".
3. **7G-2 rules are unchanged** for every existing collection. The new collections are deny-all for client writes.
4. **The 7H tests still run in the same suite.** It now also starts the Functions emulator.

## Current planting behaviour (inspected, unchanged)

- `game.js plant()` uses 1 of that crop from the barn if there is one. Otherwise it charges the seed price in coins:
  wheat 1, corn 2, carrot 3, soybean 4, sugarcane 5, tomato 6, strawberry 8, pumpkin 12.
- Grow time comes from `growTime(crop, plot)`, which depends on soil, perks, watering (25% sooner), rain/sprinklers
  and heatwaves. All of these are client time and client weather.

**Open architecture questions (sent to ChatGPT; they block 7I-B only):**
- **Bootstrap.** Canonical play starts at 0 coins and no items, with no starter grant, but planting costs coins or a
  crop. As specified, a new player can never plant canonically. Recommended: verified planting is free.
- **Growth time.** The server can't verify weather. Proposal: canonical `matureAt` = server `plantedAt` + the crop's
  base time. Watering, weather and perks affect only local crops.

## 7I-A: canonical economy, ledger, rules, cutover, idempotency foundation

**Built:**
- `farm3d/firebase/functions/` (new; firebase-functions 6.6, firebase-admin 13.10, Node 22). It runs only in the
  Functions emulator; nothing is deployed.
  - `economy.js` is the core.
    - `act()` runs every action in ONE Firestore transaction. It reads the ledger row for the action's key first, and
      a replay returns the stored result.
    - When an action is accepted, its effects and its create-once ledger row are written together.
    - A refused action (an error such as `NOT_MATURE_YET`) writes nothing, so its key is not used up.
    - `apply()` refuses negative, fractional, oversized or unknown amounts.
  - `index.js` defines the callable `economyAct`. The account comes from the verified ID token, never from the request
    body. 7I-A has one action, `open`, which creates `economy/{uid}` at 0 coins and no items and grants nothing.
- `firestore.rules` (7I-A):
  - `economy/{uid}`: get by its own player only; no list; no client writes.
  - `ledger/{uid}/rows/{key}` and `plots/{uid}/items/{id}`: get/list by their own player; no client writes.
  - Every 7G-2 rule is unchanged.
- `firebase.json`: functions source and the Functions emulator on port 5001.
- CI: the Firebase job installs the functions dependencies and runs the economy tests with the rest.

**Gate results:**

| 7I-A gate (handoff) | Evidence |
|---|---|
| Economy and ledger exist | `open` creates `economy/{uid}` `{v:1, coins:0, items:{}, rev:1}` and one ledger row `open-{uid}` |
| Client writes denied | Rules test: alice (own data), bob, the game owner and signed-out users all fail every create/update/delete on `economy`, `ledger` and `plots` |
| Cutover is zero | Economy test: coins 0, items empty; opening twice changes nothing (replay); no other collection appears (no starter document) |
| Hacked save is not copied | A legacy save with 1e9 coins and 999999 wheat stays exactly as it was, and is never read |
| The body can't pick another account | `{op:"open", uid:"someone-else", coins:1e9}` only opens the caller's own zero account |
| Idempotency | Replay returns the stored result. 10 simultaneous calls with one key apply once. A refusal writes nothing and the same key succeeds later |

**Test results:**
- Rules: 24/24 tests, 83 allows + 256 denies = 339 checks.
- Mutation check (wide-open rules): 253 of 256 denies get through. The other 3 are edits of documents an earlier
  allowed delete had already removed.
- Economy: 6/6.
- CI note: the first CI run failed 3 economy tests. `node --test` runs test files in parallel, one per spare CPU:
  1 on this 2-CPU container, more on CI. `rules.test.mjs` wipes the emulator database before each test, which
  deleted the economy tests' data mid-test.
  - Reproduced locally with `--test-concurrency=2` (2 failures). Running the files in sequence passes.
  - The scripts now run the two files one after the other.

## Next

- 7I-B (verified plots, online planting, server times, generations, offline maturity, harvest reconciliation) starts
  once ChatGPT answers the two questions above.
- Still blocking any production publish:
  - owner-UID hardening (waiting for Austin's UID)
  - a saved copy of the current production rules
  - the phone smoke test
  - the Blaze plan, before Functions can ever be deployed
