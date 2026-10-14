# Phase 7N later progression and timed-reward qualification, 2026-10-14

**Bounded scope complete: 29/30 distinct behavior groups PASS; one visitor-expiry production defect FAIL and confirmed in a fresh fixture with native browser Date. Runtime is unchanged. The next decision is approval for the single expiry guard below.**

## Exact source, authority and preserved work

Owner approved this scope at 2026-10-14 12:13:04 UTC ("Okay" to later progression/land/daily/visitor/rush checks). Fresh GitHub/API and local fetch verified main **`e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`**, tree **`fbbac30554c58a2153e79495723084701cc4e4ba`**, with no newer integrated work. Clean publication-record checkpoint **`bf4d739f51fabb274323672e6c86f3184876cbb4`** is preserved as the base of dedicated `codex/phase7n-later-progression-qualification`. Runtime was served exclusively from immutable main Git objects, not working-tree files. [Preflight](tests/evidence/phase7n-later-progression/preflight.json).

Earlier 15 progression/update/backup passes, audio qualification/fix, PR81 publication, accepted animals, the owner's qualitative Android/iPhone round and owner manual Firebase rules substantive review are credited without repeating them. No new phone work or rules export/publish was requested. No original workspace, other project or FS25 file was touched. No installation, production/player write, security change, runtime fix, merge, deploy or release occurred.

Coverage inspection found earlier earned progression ending at level 8, general regression suppressing visitor/rush timers, seeded testfarm level 12 boot without later unlock earning, and visitor screenshots without reward/expiry contracts. No existing test asserted the selected land deeds, calendar or request reward boundaries. Repository .agents directory was absent; AGENTS/relay files and the feature-testing/JavaScript guidance were read.

## Results actually run

[Complete summary and scenario map](tests/evidence/phase7n-later-progression/summary.json). Thirty distinct behavior groups comprise twelve earned level transitions, their final persistence check and seventeen boundary/persistence groups. Twenty-nine pass; expired visitor claim fails. Two save-provenance checks are reported separately and do not inflate the acceptance count.

| New contract | Result and fixture distinction |
| --- | --- |
| Earned levels9–20 | PASS. Resume exact prior earned level-8 save, then actual pumpkin planting/harvesting and Barn selling. No injected level/XP/currency/stock. 1,979 additional harvests; final total 2,300. Levels9–12 ran once, then13–20 continued the retained partial state after the accounting diagnostic. |
| Later entitlements/unlocks | PASS. Perks earned/selected at levels 10/15/20, duplicate/invalid perk refusal; cosmetics unlocked at levels 12/16/20. Three deeds bought with earned funds: first two at level 12 for 1,500/3,000, third at level 16 for 6,000. Final level 20, land 3, grow1/sell3/owed0. |
| Earned persistence | PASS. Level 20/XP/coins/gems/land/perks/look/inventory/stats/unlocks/plots retained on reload. [Earned continuation receipt](tests/evidence/phase7n-later-progression/continued-earned-results.json), [level-20 capture](tests/evidence/phase7n-later-progression/earned-level20.png). |
| Land boundary fixtures | PASS. Deed gates 7/8, 11/12, 15/16; exact cost and one-coin-short refusal; capacities 36/42/48, last-field purchase and further-field/deed refusal; 48 fields/land persisted. Seeded levels/coins/field count exercise handlers; these are not earned field purchases. |
| Daily gift/calendar | PASS. Seeded level 20 reward scale, seven successive days, eighth-day wrap, coins/gems/fertilizer/decor, repeated same-day and reload claims, exact midnight and missed-day reset. Browser-only calendar accelerated in UTC. |
| Daily quests | PASS. Three unique generated quests; incomplete/invalid/repeated claims, exact coins/XP and once-only gem bonus, reload and next-day reset. Quest completion counters explicitly seeded; no earned quest-completion claim. |
| Rush requests | PASS. Level2 exclusion, level3 first wait5–15min, generated20min deadline, missing-stock refusal, exact goods/rewards/counters, duplicate/stale refusal, cooldown30–90min, active/completed reload and exact-expiry rejection. Stock/level/time fixtures explicit. |
| Visitors | PASS except expiry action. Level gates/generated 30-minute deadlines, missing stock, exact goods/rewards/counters, fifth-heart gem/cap, repeated claims, cooldown10–40min and active/completed reload. Twelve generated requests avoided consecutive identity and matched seeded five-heart pricing. Stock/friend thresholds seeded. |
| Expired visitor Give | **FAIL**, exact end in accelerated calendar; confirmed in fresh profile with native Date and a seeded expired deadline. The real still-enabled Give button paid 96 coins/18 XP and consumed 2 flour/4 tomatoes. Tick/no-request control paid 0 and consumed nothing. |

The earned run advances timestamps to ready crop deadlines, suppresses popups and uses seeded randomness/static scene. This proves state/reward contracts, not real-time pacing, full balance, device performance or long-session user experience. Synthetic data-act buttons dispatch some seeded successful land cases as well as invalid/repeat cases; the raw limits text is corrected by this method note. Earned Shop/Barn/perk buttons are actual rendered controls, clicked programmatically. No trusted physical touch acceptance is claimed.

## Retained first failure and bounded continuation

[First raw run](tests/evidence/phase7n-later-progression/first-results.json) retains 22 PASS/9 FAIL labels and the [initial exact fixture source](tests/evidence/phase7n-later-progression/initial-test-source.txt). The first level-13 assertion omitted a valid Halloween first-tier 50-coin prize. [Failure state 6](tests/evidence/phase7n-later-progression/first-failure-6.json) records h:halloween/progress20/won1, coins 8,130 versus expected8,080. Unchanged source eventProgress pays that prize. Seven later levels were prerequisite cascades (still at level 12), not seven additional defects. Initial partial persistence retained level 12, despite the original screenshot filename saying 20; its published [captioned copy](tests/evidence/phase7n-later-progression/first-partial-level12-persistence.png) is explicitly level 12.

[Classification](tests/evidence/phase7n-later-progression/failure-classification.json). The fixture was corrected to credit the unchanged event schedule of 50/120/250 coins and 0/1/2 gems, preserving exact reward equality and tightening final persistence to require earned level 20. A fresh profile loaded the exact failure-6 farm/clock at earned level 12/XP 60 and ran only the unfinished13–20 transitions. Its ten checks passed (eight transitions, source provenance, final persistence). No passing9–12, land/daily/rush/visitor group was rerun. The original failure, source, screenshots and all cascade states remain retained. No tolerances/assertions or existing tests were weakened.

## Confirmed defect and proposed correction (unapplied)

`helpVisitor()` at game.js:898 guards only request existence and inventory; it omits `v.end <= now()`. `visitorTick()` clears expired requests only when it runs. Between the deadline and the next tick, an already enabled Give control can still consume stock and award coins/XP/friendship. Rush delivery and eventProgress already check expiry. [Original failure 30](tests/evidence/phase7n-later-progression/first-failure-30.json), [fresh native-Date diagnostic](tests/evidence/phase7n-later-progression/visitor-native-date-confirmation.json).

The original generated Sam request paid 188 coins/37 XP at its exact end. The independent generated Lily request with native Date paid 96 coins/18 XP when the seeded deadline preceded the click by 2 ms. A valid request paid its exact 114-coin/22 XP reward; an expired request cleared by tick paid 0 and left goods intact. This is a bounded stale-action correctness defect, not proof of phone timing or a server security issue.

Minimal proposed change, **not applied**:

`if (!v || v.end <= now() || !hasAll(v.items)) return;`

Keep valid/repeat/missing-stock behavior intact; focused acceptance should require no reward/stock/friendship mutation at exact or past expiry through a stale Give action. Applying this runtime guard and testing it needs separate owner approval; integration/deployment remain later gates. No other fix or phase expansion is proposed.

## Integrity and relay handoff

Executed runtime main/tree above; fixture hashes in [summary](tests/evidence/phase7n-later-progression/summary.json) match the preserved initial source, current later helper and native confirmation helper. Four transport receipts record disposable profiles, intercepted externals, zero page exceptions and only the exact served main source. Existing CDP harness, tests/assertions and all prior frozen evidence are unchanged; all 65 runtime inventory objects remain exact published-main bytes. [Invariant receipt](tests/evidence/phase7n-later-progression/invariants.json) records final scope.

- Agent: ChatGPT/Codex; adversarial self-review, not an independent external-agent audit.
- Branch base: `bf4d739f51fabb274323672e6c86f3184876cbb4`; tested source: `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`; tested tree: `fbbac30554c58a2153e79495723084701cc4e4ba`.
- Files: two new opt-in tests, this report/evidence, and current coordination documents only.
- Results: 29 acceptance PASS/1 confirmed FAIL; 2 provenance checks PASS. Prior earned level 8/update/restore/audio/publication/phone/rules evidence credited, not rerun.
- No hosted workflow rerun or new PR needed for this evidence checkpoint; any subsequent PR remains draft. No merge/deployment/release authorization.
- Recommendation: stop completed bounded qualification; request owner decision on the one-line visitor expiry guard. Broader physical/performance/PWA/cloud-conflict/balance/release limits remain open.
