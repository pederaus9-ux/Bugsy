# Market Sales — review checkpoint

Base main: `2bf6f16a0d0b965df1eda089a3ea6a0f140f6f69` (PR86 merged/published).
The owner approved the in-chat bounded design on2026-10-20 at01:10 Chicago.
Implementation and a draft PR are authorized; merge and deployment are separate.

## Behavior

- Barn → Market Sales opens instant egg/dozen and milk/gallon sales.
- One existing milk item is one gallon; no stored quantities or recipes migrate.
- Ordinary base prices are120/dozen and18/gallon. Existing Haggler per-item
  rounding applies before calculating the base. Integer quotes stay inside
 80–120percent of that base (milk15–21 at zero perks).
- Prices are deterministic per good and UTC-aligned six-real-hour window.
  Reopening/reloading/offline play cannot reroll a same-window quote. This is a
  local farm economy using the device clock, not a server-authoritative market.
- Quantity and Sell All consume whole lots from the barn, keeping leftover eggs
  and all uncollected pallet stock. Gold goods go first as in existing barn sales.
  Their extra share is rounded to whole coins and included in the displayed total;
  an entirely gold lot pays exactly twice its ordinary quote.
- Every confirmation recomputes stock, gold, perk and window identity. Stale or
  repeated confirmations fail without a payout. The UI refreshes at window rollover.
- Existing barn/roadside/trading-post selling remains available. Existing Market
  Day/daily market progress receives the earned coins through the existing hook.

## Protected contracts

No save schema, production rates, recipes, chicken care/geometry, animal/character
modules, Firebase/auth/canonical economy, collision or movement changes. No cow
bulk tank, new pen or monetization work. No player profiles or live saves used.
Worker algorithms remain byte-identical; cache49→50 adds the new module and
game27→28 updates the actual import/cache identities. Existing identity assertions
follow only these intentional version changes; no deadline/tolerance is relaxed.

## Verification and limits

New contracts failed first for the absent sale API and missing barn entry, then
passed. Eight focused Market Sales tests and seven cache contracts pass locally; the surrounding chicken/seed/player-motion/attachment suite passes95/95,0fail/skip/cancelled.
Native390/844/1280 touch/mouse controls, stale/duplicate guards, old49→50 installed
update and offline sale/reopen receipts are required from the dedicated hosted job.
The complete original CI jobs remain present. Hosted results are pending at this
checkpoint. No visual or physical-phone performance acceptance is claimed.

Local Chromium installation failed with an invalid download; the raw installer log
is preserved outside the source checkout. Local npm test was attempted before the
feature edits and remains incomplete at this checkpoint; it is not a green baseline
or a green final suite. Exact-head hosted CI must qualify the final candidate.
Lead implementation and self-review only; no independent external-agent audit.
