# Phase 7N visitor-expiry fix candidate, 2026-10-14

**Owner-approved one-line guard passes all nine focused browser regressions. Original failure/tests/evidence are preserved. Exact-head hosted checks remain the draft candidate gate; no merge, deployment or release is authorized.**

## Exact source and minimal change

Owner approved applying/testing the proposed correction at 2026-10-14 12:39:49 UTC ("Yes"). Preflight verified clean qualification checkpoint **`b3e1c7ca0948f4c1dfb4a86e74d8892131f73656`** and unchanged integrated main **`e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`**. Dedicated branch `codex/phase7n-visitor-expiry-fix` preserves the earlier publication and qualification records. [Preflight](tests/evidence/phase7n-visitor-expiry-fix/preflight.json).

Committed implementation and executed test source: **`1877fcb94b84eee5f0bc7e9af3f867a8a7b37951`**, tree **`c9199b2dd21baae95f9fe0d4d42f3fdc055079aa`**. Only runtime change is game.js:900:

`if (!v || v.end <= now() || !hasAll(v.items)) return;`

An expired visitor's existing Give button now returns before stock, rewards, friendship, progress/statistics or save effects. Valid requests and missing-stock rejection retain their original code. No schemas, timers, UI/renderer/animal models/motion, audio correction, auth/rules/economy, cache/worker, version parameters or dependencies change. The tick still removes the visitor; the guard closes the stale-action interval without introducing another timer.

## Retained failure and focused results

The [original qualification report](PHASE7N_LATER_PROGRESSION_QUALIFICATION.md), first failed assertion and native-Date confirmation remain byte-identical at their saved checkpoint. They recorded a generated expired Lily request paying 96 coins/18 XP and consuming 2 flour/4 tomatoes before tick. The two original helpers intentionally preserve their original assertions/statuses; they are not edited or rerun as if their defect-confirmation expectations were acceptance tests.

The new opt-in `qualification-visitor-expiry-fix.browser.cjs` exercises the same native Date/generated request/seed 8309/stale Give path, then adjacent boundaries and persistence. Runtime comes from immutable Git objects served on ephemeral localhost, with disposable Chrome profile/guest storage and all external requests intercepted. [Raw nine-group results](tests/evidence/phase7n-visitor-expiry-fix/focused-results.json) and [transport](tests/evidence/phase7n-visitor-expiry-fix/focused-transport.json).

| Focused regression | Result |
| --- | --- |
| Original native-Date expired stale Give | PASS: full farm state and local save bytes unchanged; zero save events. |
| Valid native-Date request/fifth heart/duplicate | PASS: exact coins/XP and fifth-heart gem/friendship, goods consumed once, one commit; stale/duplicate actions pay nothing. |
| Completed reward/friendship reload | PASS: relevant state retained; repeated claim after reload rejected. |
| Active visitor reload | PASS: request/stock/deadline/cooldown retained. |
| Deadline minus 1 ms | PASS: valid reward and one commit. |
| Exact deadline | PASS: full farm unchanged, zero commits. |
| Deadline plus 1 ms | PASS: full farm unchanged, zero commits. |
| Missing goods | PASS: Give remains disabled; direct handler request has zero farm/save mutation. |
| Expired saved request/reload/tick/no request | PASS: rewards/stock/friendship retained; expired/no-request actions cannot pay. |

Commands actually run (PowerShell):

```powershell
node --check farm3d/game.js
node --check farm3d/tests/qualification-visitor-expiry-fix.browser.cjs
$env:QUALIFICATION_REF = '1877fcb94b84eee5f0bc7e9af3f867a8a7b37951'
node farm3d/tests/qualification-visitor-expiry-fix.browser.cjs
git diff --check
```

Node syntax checks for game/new fixture and Git whitespace check pass. Fixture SHA256 matches the committed test blob. No earlier earned9–20, land/daily/rush passes, backup/update/audio/phone/rules round was rerun. The original failed qualification and event-accounting diagnostics remain frozen.

Exact/±1ms cases temporarily override browser Date.now within one synchronous evaluation and restore it; the original failure-path check uses native Date/Date.now and seeds only its past deadline. Levels/stock/friendship are explicit boundary fixtures. These local checks do not prove real 30-minute pacing/balance, physical phone/Safari/PWA/OS lifecycle, performance or production deployment/adoption.

## Source integrity and review

[Integrity receipt](tests/evidence/phase7n-visitor-expiry-fix/invariants.json): 64/65 runtime inventory files equal published main bytes; game.js equals main after precisely the approved guard replacement. All 290 previously tracked test/evidence objects, including 172 frozen evidence objects and both original failure helpers, retain Git blob identity. Main audio fix and accepted animals are preserved.

[Adversarial self-review](tests/evidence/phase7n-visitor-expiry-fix/local-review.json) found no material issue in the one-line patch or adjacent contracts. The expiry test uses <=; absent requests short-circuit; returning early precedes all reward/save changes; active/missing-stock/duplicate cases pass. This is ChatGPT/Codex self-review, not an independent external-agent audit. No CPU/resource measurement is claimed for one extra deadline comparison.

## Exact-head hosted gate and handoff

Final candidate PR head is pinned in delivery after report/relay publication. Existing seven-job regression and same-account conflict qualification are relevant required PR gates because runtime reward handling changed. Workflows/tests/job limits remain unchanged; their normal isolated runner setup is not an installation on this connected PC. No rerun/skip/loosened criteria or deployment dispatch is requested. Hosted terminal results must apply to that exact head/tree; prior main 203 green does not replace this gate.

- Agent: ChatGPT/Codex.
- Branch base: `b3e1c7ca0948f4c1dfb4a86e74d8892131f73656`; integrated base main: `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`; local tested runtime head: `1877fcb94b84eee5f0bc7e9af3f867a8a7b37951`.
- Branch: `codex/phase7n-visitor-expiry-fix`; any PR stays **draft**.
- Change: one approved helpVisitor expiry condition, new focused regression and truthful evidence/coordination updates.
- Local: 9/9 PASS; syntax/whitespace/source invariants PASS; original failures frozen.
- Hosted: pending final exact candidate head; record immutable terminal results separately so a documentation update cannot invalidate the reviewed head.
- Remaining gates: exact-head hosted results and final evidence review, then owner's separate merge decision. No merge/deploy/release/install/security/production data/FS25/phone change authorized.
