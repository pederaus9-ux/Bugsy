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


## Later qualification findings

The first390-native failure used outer.panel.scrollWidth; the unchanged close
button intentionally overhangs it. A same-production-CSS browser counterexample
confirmed356scroll vs342client, while actual.pbody was342==342 and the close
button remained inside the390viewport. The observer now measures.pbody like the
established accessibility suite. Strict viewport and44px requirements remain.
Full-resolution captures use deviceScaleFactor1 and settled modal geometry.

The next native check expected1426coins but observed1486 after237egg+189milk
sale proceeds. Actual game replay proved the existing40point season milestone
adds60coins at42.6points. Native sale-only fixtures now explicitly have a completed
season track; a separate real-game contract proves that original reward pays once.
Runtime sale/price/character/animal code is unchanged after the initial candidate.

A surrounding seed browser check failed at740/KeyE (plot2 null rather than wheat,
coins10 unchanged). Its original fresh-ray/identical-label wait can certify a stale
cached interaction target; a focused helper counterexample failed then passed
with stronger readiness. The test-only served debug getter observes the actual
cached target and requires the requested plot/action while preserving every old
ray/label/state assertion, native key action and30second deadline. Bounded trusted
input/cache diagnostics are retained. Production planting/index control code is
unchanged. The failed historical job did not record that cached target, so its
exact cause remains unassigned; do not claim the counterexample is historical
telemetry. Native observations and final exact-head CI remain required.

Latest focused local suite:98/98PASS including new readiness checks. Initial
local/browser limitations and every failed native sample remain retained. This
review document is a running checkpoint; a later immutable assessment records
final refs, actual images and hosted results without changing the tested PR head.


## Cow integration fixture precondition

Current-head core job118491469566 completed43Node invocations/259assertions and
regression.browser/shed-switch, then failed cow3d.browser at740: distance0 vs>.01.
Trace return also records measured0; the last two core browser suites were not
reached and are not credited. Artifact12246351548 SHA2565116b03583fc1fcfe737ad0f6bf18c567527fe38679e1b55ae28656e943488a1
and its original trace/log are retained. The screenshot is teardown evidence,
not an exact snapshot of the synchronous travel probe.

Actual fixture code ends its lighting inspection with setPreset('night'), forces
the cow mode to'fair', then requests a stroll. Actual Actor.update clears that
target when it detects the fair→night mismatch. A fail-first fixture/production-
branch counterexample proves the conflict. Restoring noon after all five lighting
samples establishes the intended fair-weather travel precondition. Every old
assertion/threshold,120travel and180blocked updates, native controls and budget
remain intact. Integration snapshots now persist requested path and first-step
mode/target on failure. Cow/actor/renderer/game runtime is unchanged; no old cow
program or performance/recorder work is reopened.100focused local checks pass.
The corrected original native cow probe and complete exact-head CI are pending.
