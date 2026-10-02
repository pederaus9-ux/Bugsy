# CLAUDE HANDOFF — SUNNY ACRES PHASE 7I, ARCHITECTURE CLOSED

Status: design only. Not implemented.
Prerequisite: PHASE 7I MAY NOT BEGIN UNTIL CHATGPT CONFIRMS PHASE 7H MERGED AND CLEAN.
Do not modify Claude's 7H branch, main, Firebase production, or current 7H tests from this packet.
Owner decision: one real farm marketplace. Separate market credits are rejected.

## FINAL AUTHORITY MODEL

Server is final for spendable coins, tradable inventory, plot generation, plantedAt, matureAt, harvest state, listing economics, and ledger.
Client may show provisional harvest only.
Client is final for movement, camera, animation, weather rendering, and guest local play.
If a value can create transferable wealth, the client is not its final authority.

## ONLINE/OFFLINE BOUNDARY

Verified plant requires online.
Once the server accepts a plant, the crop may mature while the device is offline.
Harvest may be queued and reconciled.
Canonical sell, shop purchase, market list, and market buy require online.
Local unverified farming may still exist for guest and legacy play. It cannot enter the canonical economy.

## VERIFIED PLANT FLOW

Client calls economyAct plant while online.
Server checks the plot is empty, writes crop, generation, plantedAt, and matureAt, and writes one ledger row.
plantedAt is server receipt time.
A retry of the same plant key returns the original row and does not increment generation.

## MATURITY WHILE OFFLINE

matureAt is server-owned.
No connection is required for time to pass.
Harvest eligibility is server now >= matureAt.
The device clock cannot make a crop mature.

## VERIFIED HARVEST FLOW

Client may show a provisional harvest while offline.
On reconnect, economyAct harvest must name the plot and the authoritative generation.
Server accepts only if that generation is growing, the crop matches, and server time is at or after matureAt.
Acceptance adds the fixed yield and marks that generation harvested.
Denial removes the provisional grant.

## CROP GENERATION MODEL

plots/{uid}/items/{plotId} includes generation: int.
Server increments generation on each accepted plant.
Harvest must reference that generation.
Plant generation 1, harvest generation 1, replant generation 2, then replay harvest generation 1: no second grant.

## PLANT IDEMPOTENCY MODEL

Key: plant-{uid}-{plotId}-{clientRequestId}.
The key is create-once in the ledger.
The transaction that creates the key is the only transaction that increments generation.

## HARVEST IDEMPOTENCY MODEL

Key: harvest-{uid}-{plotId}-{generation}.
Replay returns the stored result and does not add yield again.

## CANONICAL CUTOVER BASELINE

One policy: zero.
Canonical starting coins: 0.
Canonical starting inventory: empty.
No starter grant.
No configuration value.
starterIssued is unnecessary and must not be implemented.
Duplicate issuance cannot happen because nothing is issued.
Legacy coins and items are not copied.

Owner alternative, not this phase: a fixed starter would be a product grant, not verified wealth. It is out of scope unless Austin later sets an exact amount.

## LEGACY WEALTH UX

Pre-7I coins and barn counts remain visible and labeled LEGACY_UNVERIFIED.
They can be used in local non-market play.
They cannot be listed, sold into canonical coins, or spent on a canonical shop or market purchase.
The canonical balance is shown separately and starts at 0.

## OFFLINE SALE POLICY

Canonical local sale requires online.
A queued sale of provisional wheat is rejected.
The client must not add canonical coins offline.

## OFFLINE SHOP POLICY

Canonical shop purchase requires online.
Provisional coins cannot be spent.

## DEPENDENT INTENT POLICY

Only harvest may be queued, and only against a server-accepted generation.
No dependent chain is stored.
Sell, shop, list, and buy are not queued behind a provisional harvest.
This avoids a distributed transaction engine.

## MULTI-DEVICE RECONCILIATION

Both devices submit against economy rev and plot generation.
First valid harvest wins.
The other device receives already-harvested and drops its provisional grant.
A stale device cannot overwrite economy or plots.

## FUNCTION-CREATED LISTING RULE

Clients do not create authoritative listing shells.
marketList is economyAct.
In one transaction the server checks canonical quantity, debits it, creates the listing, and writes the ledger row.
Rules deny client creation or modification of listing economics.

## ATOMIC MARKET SETTLEMENT

marketBuy is one transaction.
Reject self-buy, sold listing, and insufficient canonical coins.
Debit buyer, credit seller, grant goods, mark sold, write ledger.
Collect is removed.
Price, item, and qty are the stored listing values.

## ATTACK TESTS

Edited save coins or barn: not copied, cannot buy or list.
Fake harvest, early harvest, wrong crop, wrong generation: deny.
Harvest replay: one grant.
Plant retry: one generation.
Offline clock change: no effect.
Provisional sale or shop spend: deny.
Two devices harvest one generation: one grant.
Two buyers: one success.
Client-created listing: deny.

## CUTOVER TESTS

Existing save with 1e9 coins and 999999 wheat loads as legacy.
economy/{uid} coins are 0 and items are empty.
No starter document is created.

## OFFLINE TESTS

Online plant, then offline wait past matureAt, then harvest sync: grant once.
Offline plant of a tradable crop: no canonical plot.
Offline list or buy: no listing and no coin movement.
Provisional harvest denied by server: client removes it.

## REPLANT/OLD-GENERATION TESTS

Generation 1 harvested, generation 2 planted.
Replay harvest-{uid}-{plotId}-1: no grant.
Harvest generation 2 before matureAt: deny.

## COST IMPACT

Plant and harvest: a few writes each.
No offline plant writes.
No per-tick calls.
Sell, shop, list, and buy happen only while online.

## 7I-A/B/C/D GATES

7I-A: economy and ledger exist. Client writes denied. Cutover is zero. Hacked save is not copied.
7I-B: online plant assigns generation and server times. Offline maturity works. Harvest generation replay denies. Plant retry does not double-increment.
7I-C: function creates the listing and escrows inventory. Buy is atomic. Collect is gone. Client listing create is denied.
7I-D: legacy label and separate canonical balance. Two devices reconcile. Offline sale and shop do nothing. 7H tests still pass.

## 7I REAL FARM MARKETPLACE ARCHITECTURE CLOSED

YES, for this boundary.
Implementation still may not begin until ChatGPT confirms Phase 7H merged and clean.
