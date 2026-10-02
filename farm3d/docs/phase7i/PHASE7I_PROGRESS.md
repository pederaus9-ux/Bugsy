# Sunny Acres 3D: Phase 7I (real farm marketplace) progress

Base: main `ed9a3453af893c922788611edfa39241e5a73dd5` (Phase 7H merged, PR #38). Branch: `claude/sunny-acres-phase7i`.
Design: `CLAUDE_HANDOFF_PHASE7I-3.md` (architecture closed). Firebase production: **not deployed, not published.**


**SPARK RELEASE (current): Austin is staying on the free Firebase plan, so the 7I economy is built, tested and switched OFF in production (see "Spark release" below). Head 97f3a12, CI run 37051052574.**

**7I numbers before the Spark change (head 3dec25c, CI run 37044971493):** rules 22/22 (79 allow + 267 deny = 346 checks; mutation 264/267), economy 25/25, reconciliation 9/9, real game flows 32/32, save recovery 15/15 in CI (12/12 locally with REPEAT=1), Farm3D regression green, old saves green.
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
- Rules: 24/24 tests, 83 allows + 256 denies = 339 checks (at 7I-A; final after the owner-UID hardening: 22/22, 346 checks).
- Mutation check (wide-open rules): 253 of 256 denies get through. The other 3 are edits of documents an earlier
  allowed delete had already removed.
- Economy: 6/6.
- CI note: the first CI run failed 3 economy tests. `node --test` runs test files in parallel, one per spare CPU:
  1 on this 2-CPU container, more on CI. `rules.test.mjs` wipes the emulator database before each test, which
  deleted the economy tests' data mid-test.
  - Reproduced locally with `--test-concurrency=2` (2 failures). Running the files in sequence passes.
  - The scripts now run the two files one after the other.

## 7I-B: verified plots, online planting, server time, generations, offline maturity, harvest reconciliation

**ChatGPT ruling, Q1 (bootstrap):** option C, one server-authorized free WHEAT planting per account, ever. The
architecture statement is now: "no transferable starter balance or inventory grant; one server-authorized bootstrap
wheat planting is permitted." Canonical accounts still start at 0 coins and no items.

**Q2 (growth time): no ruling received.** Built with the conservative proposal: canonical `matureAt` = server
`plantedAt` + the crop's base time. Watering, soil, perks and weather affect only local crops. Flagged for ChatGPT.

**Self-sustaining proof (from the real game numbers):**
- A harvest always yields 2. Golden harvests are random on the device, so they are never canonical.
- Wheat sells for 2 and its seed costs 1.
- Keeping wheat: free wheat → harvest 2 → replant with 1 wheat → harvest 2 → 3 wheat. That is +1 wheat per cycle,
  with no coins needed.
- Selling (7I-C): 2 wheat → 4 coins, seed 1 → +3 coins per cycle.
- The test "economy bootstraps itself" runs the keep-wheat loop end to end.

**Built:**
- `functions/catalog.js`: the server's crop table (time, seed, price), YIELD 2, six canonical plots p0–p5. A test
  reads `game.js` and fails if the two ever disagree. It caught 5 wrong sale prices in my first draft.
- `plant`:
  - The plot must be empty. It is paid with 1 canonical crop of that kind, otherwise with the seed price in coins.
  - Bootstrap: wheat only, only if the account was never harvested and never bootstrapped. It is recorded as
    `meta.bootstrapUsed` plus a create-once ledger marker `bootstrap-plant-{uid}` in the same transaction.
  - Generation +1; `plantedAt`/`matureAt` come from the server clock. Key `plant-{uid}-{plot}-{requestId}`.
- `harvest`:
  - Names the plot and the generation, and needs server time ≥ `matureAt`. Yield 2. Key
    `harvest-{uid}-{plot}-{generation}`.
  - Refusals (NOT_MATURE_YET, WRONG_CROP, NO_SUCH_GENERATION, …) write nothing.
- `farm3d/canon.js`: the device side.
  - Planting needs a connection. A planting whose answer was lost is re-sent with the same request id.
  - Harvests are queued in storage, shown as provisional, and flushed on reconnect.
    - Accepted or replayed: confirmed.
    - Refused for good: dropped, and its provisional grant disappears.
    - Not mature yet, or no connection: kept for the next flush.
  - Not wired into the game's screens yet (7I-D).

**Tests:**
- Economy 15/15 (7I-A 6 + 7I-B 9). Bootstrap:
  - It works and costs 0. A retry returns the original. A second free plant is refused.
  - Wheat only. Refusals (other crop, busy plot) don't use it up.
  - 3 devices at once get exactly 1 free plant.
  - Sign out and back in, a new token, a "reinstalled" client, or an edited legacy save can't bring it back.
  - Later wheat is paid normally (1 wheat, then coins). Other crops are never waived.
- Economy, harvest:
  - Server time only: a client-sent time or matureAt is ignored.
  - Early, wrong crop, and wrong or unknown generation are refused without using anything up.
  - 4 devices harvesting one generation get 1 grant.
  - An old generation replays and never grants again.
  - Real time over the callable: plant, wait past maturity with no calls, harvest; granted once.
- Device reconciliation 8/8:
  - Offline planting is refused.
  - A lost answer is retried with the same id.
  - Offline harvest is provisional, then confirmed once.
  - An early harvest waits.
  - Two devices get one grant.
  - A stale device's old harvest replays with no grant and doesn't touch generation 2.
  - A refused provisional harvest is dropped.
  - The queue survives a restart and is per account.

## 7I-C: function-created listings, inventory escrow, atomic buy, server coin transfer, collect removed

**Built:**
- `marketList`:
  - Checks the canonical quantity, and holds (escrows) the goods out of the seller's verified items.
  - Creates `market/{uid}-{requestId}` `{v:2, seller, sellerName, item, qty, price, at, state:"open"}`. The seller's
    name comes from their own `players/` profile, never from the request.
  - Allows at most 4 open listings and quantities of 1–10. Price bounds are the game's `marketPrice()` (half to double
    the base price, per unit). Crops only, since canonical goods come only from harvests.
- `marketBuy`, in ONE transaction:
  - Refuses self-buy, a gone or sold listing, a 7G legacy listing, and not enough canonical coins.
  - Debits the buyer, credits the seller AT ONCE, grants the goods, deletes the listing, and writes a `buy-` row
    (buyer) and a `sale-` row (seller).
  - Price, item and quantity always come from the stored listing.
- `marketCancel`: the seller only; returns the escrowed goods. A sold listing is GONE.
- Rules: `market/` can be read by signed-in players, and no client may write it. The old client list/buy/take-back/
  collect writes are all now refused, and every old deny case is kept.
- `friends.js` (trading post screen):
  - List, buy and take back call `economyAct`. `collectSales` is removed.
  - The screen shows the verified balance and offers only verified goods. Phone coins and barn are untouched by trading.
- `auth.js`: `saAuth.fb.call(data)` loads the Functions SDK the first time it's used. Versions: auth.js v14,
  friends.js v5, cache sa3d-v29.

**Bug the browser flow test caught (fixed):**
- The Cloud Function used the admin SDK's unnamed `(default)` database. The game's database is named `default`.
- The server-side tests used the same wrong database, so they agreed with each other. Only the real-game flow showed
  `NOT_ENOUGH_ITEMS` while the screen showed 3 verified wheat.
- Now the function and the tests use `default`, and a regression test checks that the server writes there and not to
  `(default)`.

**Tests:**
- Rules 22/22: 339 checks (at 7I-C; final after the owner-UID hardening: 22/22, 346 checks).
- Economy 22/22. The 7 market tests:
  - Server-created listing with escrow. Each refusal changes nothing. The 4-listing limit holds.
  - Atomic buy: the seller is paid at once; a replayed buy charges nothing.
  - Self-buy is refused. Legacy coins and barn are refused. 7G legacy listings can't be bought or taken back.
  - 3 buyers at the same moment: one gets it, the seller is paid once, and the goods exist once.
  - Take back works for the seller only; a sold listing is gone.
  - End to end through the callable.
  - The server writes to the `default` database.
- Device reconciliation 8/8.
- Real game flows 21/21:
  - The trading post offers only verified goods (3), not the phone barn (5).
  - The server creates the listing. The seller's verified wheat is held while the phone barn is untouched.
  - The buyer pays with verified coins. The seller is paid while away, with no collect step.
  - The sold listing is gone. Phone coins and barn are untouched on both sides.

**Recovery observation (7H code, not changed; for ChatGPT):**
- In one full-suite run, recovery scenario 3 failed: the game's first cloud read never answered and never errored
  for over 60 s.
- `linkFarm` awaits `cloud.get()` with no timeout. Its retry only runs when the read rejects, so recovery stayed
  pending.
- The invariant still held: recovery pending means uploads are refused, and the cloud was not touched.
- The same suite run alone passed 10/10, and the 7I-B CI run passed.
- Suggested 7H follow-up: a timeout (about 20 s) around `cloud.get()` in `linkFarm`, so a hung read falls into the
  existing retry.
- Evidence: `evidence/full-suite-7IC-run1-recovery3-hang.log`, `evidence/console-grandma-run1-recovery3-hang.log`,
  `evidence/recovery-alone-rerun-PASS.log`.

**Open for 7I-D (legacy UX):**
- A player's own 7G listings (legacy-escrowed, client-written) can't be bought or taken back through the server.
- 7I-D needs a legacy close-out: give the legacy goods or coins back to the phone farm only, never to the canonical
  economy.

## 7I-D (in progress): legacy UX, sale, offline, multi-device, 7H compatibility

**Built:**
- `sell`: verified crops sell to the game at the BASE price for verified coins (phone-farm perks don't count). Online
  only. A replay pays once. Proves bootstrap path B: free wheat → harvest 2 → sell for 4 → seed 1 → 3 coins.
- `legacyClose`: the seller closes a 7G listing. Nothing canonical moves. The answer tells the device to give the goods
  back to the PHONE barn (unsold) or pay the 7G price in PHONE coins (marked sold by a 7G buyer). The listing is
  deleted, and closing again replays the first answer (no second payout).
- HUD:
  - A separate ✅ verified-coins counter, live from `economy/{uid}`. It starts at 0.
  - The phone coins are labelled LEGACY_UNVERIFIED: `data-legacy`, plus the title "not verified, so they can't be
    traded".
- Trading post:
  - "Or sell now to the market" for verified goods.
  - "From before verified trading": the player's own 7G listings, with Take back / Collect to the phone only.
- `canon.js`: `sell()` is online only. Offline it does nothing and nothing is queued.
- Versions: friends.js v6, cache sa3d-v30.

**Tests (local, full suite):**
- Rules 22/22.
- Economy 25/25:
  - sale and base price
  - legacy barn not sellable
  - bootstrap path B
  - legacy close-out: phone only, no canonical movement, no second payout, a v2 listing refused
- Reconciliation 9/9: offline sale does nothing; a provisional harvest can't be sold until confirmed.
- Real game flows 24/24: HUD verified counter and legacy label; the seller sees the sale on waking; a 7G listing goes
  back to the phone barn with nothing verified moving.
- Save recovery 10/10.

**(Superseded: ChatGPT ruled option B, see "7I-D: Verified Field" below.)** Verified farming in the 3D game itself: planting and harvesting
the server's plots p0–p5 from the farm screen.
- The server side and device module (`canon.js`) are done and tested.
- What's open is how verified plots appear in the game. Until then, real players have no way to produce verified goods
  in the UI.

## 7I-D: Verified Field (ChatGPT ruling B), growth-time ruling, 7H cloud-read timeout

**Verified Field** (`farm3d/verified.js`):
- A separate panel, opened by the ✅ button (signed-in players only), with six server plots p0–p5.
- Shows online/offline status, the verified balance and goods, and per plot: crop, time left with a progress bar,
  Harvest when ready, and "Picked ✓ checking…" for offline picks.
- Planting:
  - Online only, through `economyAct`.
  - The price label is "free (first planting)" for the bootstrap wheat, "1 🌾" when a verified crop is available,
    otherwise the seed coins.
- Harvests go only to verified goods. Offline picks queue in `canon.js` and are checked on reconnect (or by a 5 s
  re-check while online).
- The normal fields, barn, orders, feed and recipes are untouched. The flow test checks the phone barn and the normal
  plots byte for byte before and after.
- **Growth time ruling:** base crop time on the server clock. There is no watering, weather or perk effect in the
  Verified Field: it simply has no such controls.

**7H cloud-read timeout** (`auth.js` `readCloud()`):
- After 20 s without an answer, the read counts as unavailable:
  - not treated as missing
  - no upload
  - recovery protection kept
  - the existing retry and backoff take over
- Attempt identity: only the newest `linkFarm` attempt may act, and a late answer of an abandoned read is ignored.
- Test seam: `__saTestHoldCloudRead`, set only by the harness, holds back the first real answer.
  - A network-level hold could not reproduce the hang, because Firestore fails a read itself after 10 s without a
    reply. The real hang had no reply and no error.
  - The first version of the seam was used up by a read that failed on its own. Evidence:
    `evidence/recovery-run-hold-on-failed-read-FAIL.log`. Fixed so it holds the first read that actually answers.
- Recovery 12/12:
  - 12a: a slow read past 20 s on a corrupt phone save. Timeout, no upload, and the retry restores the real farm.
  - 12b: the late answer is ignored, sync keeps working, no reload.
  - The missing-cloud, corrupt-phone and fast-read scenarios still pass.

**Game flows 32/32**, including the Verified Field end to end with a brand-new account:
- Six plots and online status.
- Free first wheat, planted on the server with server times (`matureAt - plantedAt` = 20 s) and 0 cost.
- Time left shown. The harvest goes to verified goods (wheat 2), with the phone farm unchanged.
- The second planting is paid with 1 verified wheat.
- Offline: planting is off, and a pick is kept as "checking" with nothing verified yet.
- Back online: granted once, the queue is empty, and the phone farm is still unchanged.

## Owner-UID hardening (in PR #39, per ChatGPT)

- Austin supplied his Firebase Authentication UID from the console (Authentication › Users). It is not a secret: it's an
  account identifier.
- `firestore.rules` `isOwner()` is now `request.auth.uid == '<that UID>'`. The email claim is no longer used.
- Rules tests:
  - The owner's UID is allowed, with or without an email claim.
  - The owner email on any other account, verified or not, is refused. So are a different-case email, a lowercased
    UID, a UID with an extra character, and no email at all.
  - The authorization matrix runs with the owner as that UID.
  - Rules 22/22, 346 checks.
- Mutation check: 264/267 denies get through wide-open rules; the other 3 are the known not-found edits.
  - While doing this I found that my 7I-C market test had 3 deny checks that were hollow under mutation: a delete
    earlier in the test removed the listing.
  - They now re-seed before each attempt.
  - Correction: the earlier "253/256" figure was measured before the 7I-C market rewrite and was not re-measured
    after it.
- Game flows: the dashboard flow creates the owner with that exact UID (Auth emulator admin endpoint). The owner sees
  the dashboard; another player is refused.

## Spark release (ChatGPT ruling: plan approved with two changes)

- `farm3d/features.js`: `verifiedEconomy` is false everywhere except a 127.0.0.1/localhost page where the test harness
  set `window.__saTestEconomy === true` before load. URL parameters (`?debug&economy`), saved settings, or the flag
  forced on a public host do nothing. It is frozen after load. Unit test: `farm3d/tests/features.test.mjs`.
- When off:
  - the Verified Field isn't started (✅ hidden)
  - no Trading tab
  - no verified counter or LEGACY_UNVERIFIED label
  - zero `economyAct` requests (counted for the whole Spark flow run)
- Old (pre-7I, client-written) listings: "Left at the old trading post" on the Friends tab.
  - Unsold: the goods go back to the phone barn. Sold by an old buyer: the price goes to phone coins.
  - Done in one transaction, so it happens once.
  - Only listings of the exact old shape. Anything else is left alone and logged.
- Rules: market create and update are denied. Delete is allowed only for the seller of their own listing WITHOUT a
  `v` field (every server-made listing has `v:2`, which the economy tests assert).
  - Boundary tests:
    - the seller deletes their own old listing (unsold, and sold)
    - refused: someone else's, signed out, the owner, any `v` listing, create, update
    - a batch that deletes and also writes economy/ledger is refused whole
  - Rules 23/23 (358 checks); mutation 274/277.
- Flows run in both modes:
  - Spark 19/19: no ✅/Trading/counter, `?debug&economy` can't enable it, old-listing close-out, roadside shop,
    normal farm, friends, visiting, saves, recovery, owner dashboard, zero economyAct calls
  - economy 33/33: the full 7I flows, kept working for later
- The 7I backend (functions, verified plots, reconciliation) and its tests are kept and run in CI.
- **Spark release order** (ChatGPT):
  1. final authorization
  2. merge PR #39 (GitHub Pages)
  3. wait for the new release to reach the phone (service worker)
  4. confirm on the phone: the new version loaded, Verified Field and Trading hidden, the normal farm works
  5. THEN publish the 7I + owner-UID rules (console paste or `firebase deploy --only firestore:rules`)
  6. phone smoke test again
  No Blaze, no Functions deploy.

## Production deployment requirements (owner actions; NOT done)

1. **Firebase Blaze plan** on `fir-config-18b64`. Cloud Functions can't be deployed on the free plan.
2. **Deploy the function** from `farm3d/firebase`: `firebase deploy --only functions --project fir-config-18b64`
   (`economyAct`, us-central1, Node 22). It writes to the Firestore database named `default`.
3. **Publish the rules** (`firestore.rules`, 7I) only after:
   - the owner-UID hardening (DONE in PR #39)
   - a saved copy of the current production rules
   - the phone smoke test being ready
4. **Order matters.** The game is served from `main` by GitHub Pages, so merging PR #39 releases the new game at once.
   Its trading post and Verified Field call `economyAct`, so the function must be deployed BEFORE the merge, or those
   two screens will say they can't reach the farm server. The normal farm is unaffected either way.
5. A composite index may be requested for `market` (`seller` == uid and `state` == "open"). If the deployed function
   logs an index link, open it once.

## Next

- 7I-B (verified plots, online planting, server times, generations, offline maturity, harvest reconciliation) starts
  once ChatGPT answers the two questions above.
- Still blocking any production publish:
  - owner-UID hardening (waiting for Austin's UID)
  - a saved copy of the current production rules
  - the phone smoke test
  - the Blaze plan, before Functions can ever be deployed
