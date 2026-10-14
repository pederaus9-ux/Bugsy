# Phase 7N — qualification checkpoint, 2026-10-13

**Current continuation, 2026-10-14:** The owner authorized an isolated connected
workspace. Recovery and 15 distinct local progression/update/restore assertions
passed; see [the connected qualification report](PHASE7N_CONNECTED_QUALIFICATION.md)
for exact source, raw failures, results, remaining gates and next approval.
The October 13 record below preserves its historical evidence and limits; its
original-executor-only next step is superseded by that authorized continuation.

**Report ready for review; release qualification remains IN PROGRESS. No release approval.**
Implementation/review: ChatGPT/Codex only; adversarial self-review, not an independent external-agent audit.

## Fixed source and completed gates — VERIFIED

- Integrated main: `a183e17b1a0a4f855d704da2ee8e5bc0187eed46`.
- Source tree: `98158379ffbed2e1ce865eaa0b6ac38b590dcd31`.
- Report branch: `codex/phase7n-qualification-reconcile`, based on that main.
- [Regression 201](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392622802): all **7/7 jobs passed** on this main. [Pages 77](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392621215): passed on the same commit. GitHub metadata was refreshed after the interruption; no suites were rerun to recover the report.
- [PR79](https://github.com/pederaus9-ux/Bugsy/pull/79) merged at `2bb0daebea1fb7d8e34df4d7b7325faba76f66ce`. Same-account conflicting saves passed in isolated Firebase emulators on `c0ba1dc79bff54b210edadd7fb87a44029124d17`, [qualification run 1](https://github.com/pederaus9-ux/Bugsy/actions/runs/38328239127), job `115071811629`. The log reports both phone/cloud choices: stale upload refused, progress and byte-exact backup survive reload. This is not proof of physical shared-account conflict behavior against the live backend.
- [PR80](https://github.com/pederaus9-ux/Bugsy/pull/80) merged at current main. Its tested head `81bb935ac73322741724eb706ce25725226ec899` has the same tree as main. The test-only ambient correction requires actual paired completed render callbacks in reduced-motion pause and full-motion resume. At least two completed draws per mode, including a draw after the original 700 ms observation period, prevent a no-draw interval passing. Original waits and geometry assertions remain; the bounded 10-second draw-availability gate does not loosen motion behavior. Main 201's character log confirms all four viewport/mode observations passed with no violations.
- Owner accepted all current animals on 2026-10-12. Cow, horse, sheep, dog, cat and chicken remain frozen. Full farm/normal progression stays free; optional future cosmetics are permitted, with no monetization work here.

Main 199's ambient failure and its three diagnostics remain historical evidence, not a current pending CI label. See the [frozen ambient report](https://github.com/pederaus9-ux/Bugsy/blob/a1e43eee2cd45c766bc883dac3efb55f4ffb811c/farm3d/AMBIENT_RENDERED_MOTION_CORRECTION.md). Earlier Phase 7N receipts remain in [the original evidence directory](tests/evidence/phase7n/).

## New non-destructive checks already run — VERIFIED

Checks used immutable Git source at main above. They executed before the connection interruption; resuming this task did not repeat them.

| Check | Result | What it proves / limit |
| --- | --- | --- |
| Catalog dependencies and unlocks | PASS: 29 items, 18 recipes, levels 1–8 reachable; 8 crops, 6 buildings, 4 production animal entries | Inputs and producers are available at declared unlock levels. Does not prove complete UI progression, balance, waiting times or enjoyment. |
| Declared client inventory | PASS: 43 modules/inline modules parsed; 66 URL variants, 65 physical files | Literal imports, declared offline shell and enumerated imagery are present and parse. Computed/external SDK paths are outside coverage; parsing is not running the game. |
| Disposable archive/restore | PASS: 65/65 files restored byte-for-byte | Temporary file restoration only. Not a live deployment rollback, player-save import, old installed cache update or backend recovery rehearsal. |
| Live static deployment parity | PASS: 66/66 URL variants | Fresh anonymous GETs return HTTP 200, exact main SHA256 bytes and suitable JavaScript/HTML MIME types. Does not inspect an existing phone's cache or execute account/backend operations. |

Archive: 3,604,480 bytes; SHA256 `46dfd3b7825c3619aedb25d231e9cdcc9a6e9c81f309d00ed0f9ed3373e3ac81`.
Raw receipts: [first Node attempt](tests/evidence/phase7n-post-phone/audit-node-direct.json), [curl follow-up](tests/evidence/phase7n-post-phone/audit-curl.json), [source equivalence](tests/evidence/phase7n-post-phone/source-equivalence.json), [summary](tests/evidence/phase7n-post-phone/summary.json), and [GitHub metadata](tests/evidence/phase7n-post-phone/github-metadata.json) and [qualified log excerpts](tests/evidence/phase7n-post-phone/qualified-log-excerpts.json).

### Failed attempt preserved

The first full audit at `2026-10-13T15:36:46.667Z` passed catalog/inventory/archive, but native Node fetch failed all 66 network comparisons before returning HTTP responses. Its raw overall status remains **FAIL**. A representative fetch exposed DNS error `EAI_AGAIN`; curl against the same public `sw.js` returned HTTP 200 / 1,914 bytes. This discriminated an executor transport/environment problem from a deployed asset mismatch.

The follow-up at `2026-10-13T15:41:26.514Z` used proxy-aware curl for network parity only and passed 66/66. Four workers, 20-second request bounds, no redirects, exact byte hashes and MIME criteria were retained. Catalog and archive were not rerun. Their functions are byte-identical between variants; the current helper was not rerun in full after this transport change. Node version: `v24.19.0`. The [original helper source](tests/evidence/phase7n-post-phone/audit-node-direct-source.txt) is retained alongside the current opt-in [audit helper](tests/release-qualification-audit.cjs). No runtime or executor environment replacement occurred.

Executed commands (record only; do not rerun passed checks solely for this report):

```sh
node --experimental-vm-modules farm3d/tests/release-qualification-audit.cjs --ref=a183e17b1a0a4f855d704da2ee8e5bc0187eed46 --out=/workspace/scratch/d10a2c5c1730/phase7n-release-audit.json
node --experimental-vm-modules farm3d/tests/release-qualification-audit.cjs --ref=a183e17b1a0a4f855d704da2ee8e5bc0187eed46 --live-only --out=/workspace/scratch/d10a2c5c1730/phase7n-release-audit-curl.json
```

The first command ran the preserved Node variant. The second ran the current curl variant. The helper is opt-in, requires Git/Node/curl/tar and changes no workflow, dependencies, existing runner or threshold.

### Previous evidence carried forward, not rerun

All 65 inventoried runtime files are byte-identical between the owner-accepted animal baseline `047cbed91b816b4869f983ef8fe2571cdde987e2` and current main. The conflict-qualified auth/game/feature/rules/test files are unchanged. SDK version 12.19.0 is pinned in `auth.js`; an initial comparison incorrectly named nonexistent `sdk.js`, then corrected that bookkeeping error.

The controlled cache/offline fixture is unchanged. [Art 70](https://github.com/pederaus9-ux/Bugsy/actions/runs/38321403465), at PR78's identical integrated tree, covered actual controlled cache migration, normal saves/wardrobe, offline reload without server responses and asset fallback. Source equivalence supports carrying that code evidence forward; it does not establish a real previously installed phone's upgrade path.

Main 201 also covers existing old-save recovery, farming/movement, emulator cloud recovery/economy rules, six-species visuals, accessibility/focus and analytics/dashboard. This report does not replace those suites with static checks or claim a fresh local browser run.

## Owner phone round — VERIFIED as owner-reported evidence

The owner reports the round complete: smooth Classic and Walk modes; turns, stops and animal interactions fine; phones warm; background/reopen retained progress; downloaded backup opened; offline wheat survived reopening; online/offline saves worked on the owner's Android and wife's iPhone; rain, snow and night looked good.

These are real qualitative observations, not instrumented measurements. Exact device-to-observation assignment, browser/PWA versions, fixed candidate identifier and duration were not fully captured. Opening a backup is not a completed import/restore drill. Physical shared-account conflict was not established. **No more phone tests are requested now.**

Historical Phase 7K's five-second S26 Ultra Walk/snow measurement remains reference evidence only; it is not sustained performance proof for this candidate. Preserve ideal 60 FPS, good 45+, floor 30; investigate sustained frame times over 33.3 ms and hitches over 50 ms. No criterion is reduced because the qualitative round was positive. Warm phones alone establish neither a thermal failure nor sustained thermal acceptance.

## LIKELY, with limits

- Current unchanged runtime and successful automated/qualitative checks are a useful baseline for continued qualification. They do not close long-session, production-security or operational gaps.
- The initial native Node network failure came from the executor's DNS/proxy path, supported by `EAI_AGAIN` and the successful same-endpoint curl experiment. Not every failing Node request had a captured cause code; no general production outage is inferred.

## UNKNOWN / remaining release gates

| Gate | Existing credit | Missing evidence / bounded next action |
| --- | --- | --- |
| Live security/configuration | Owner confirmed on 2026-10-13 at 19:28:55 America/Chicago that rules were already checked and are good; repository/emulator qualification remains credited | Rules review is owner-confirmed complete. This session did not independently verify an export, deployed ruleset ID/hash or the wider configuration. Do not ask again for the completed rules review or claim independent deployment parity. |
| Sustained device performance | Completed owner qualitative phone round; historical short reference | Fixed-candidate measured frame times, memory/thermals/battery, session duration and precise device assignment are incomplete. Keep gap open; request no additional phone work now. |
| Physical shared-account conflict | PR79 emulator choice/stale-write/backup scenarios passed | No real shared-account divergence/choice proof against live configuration. Do not replace this claim with ordinary online/offline saving. |
| Full progression/gameplay | Main 201 short flows; static recipe/unlock graph passed | Consecutive real production/order/unlock/customization flow through applicable levels and long-session stress not fully qualified. Future bounded test-environment scenarios should target uncovered paths only. |
| Real installed update / recovery operations | Existing controlled cache tests and 65-file archive rehearsal | Real old install upgrade, actual save-import recovery and live-approved rollback rehearsal are unverified. The old rules backup is historical, not an approved current rollback. |
| Environment/audio | Owner rain/snow/night acceptance | Full sound/mute/audio lifecycle qualification is not established by those visual observations. |
| Fixed release and owner approval | Current source and deployment match; animals accepted | No final release approval or authorization to merge this checkpoint. Documentation/test checkpoint review is separate from releasing the game. |

No new production defect was established by these checks. Unknown gates are missing evidence, not invented failures. Existing open PRs 60, 54, 37 and 34 are separate scopes; no authority to merge, close or overwrite them.

## Highest-value next action and approvals

Owner confirms the rules were already checked and are good. Credit that completed review; the earlier export request is superseded and is not the next task. Independently verified deployed identity/config parity remains a measurement limit, not a reason to repeat the owner's review. Tested repository rules SHA256: `ece0ca33c35adda40254d3ca274677fbb4efb18f356b205ee3a07c1ce674d489`.

The next bounded engineering action is to inspect existing full-progression and installed-update/backup-restore coverage, then execute only distinct uncovered test-environment scenarios when the original executor reconnects. The workspace currently reports `409 Conflict, environment_offline: Environment is not connected`; no new local checks ran and no replacement environment is authorized. Do not request additional phone tests.

The October 2 pre-7I rules backup (`5ff061fd76d0e2d97185abcb46159e0bd88c6c9b85794f1dead1350b3613d92c`) allows broader farm listing/email-based ownership and client market writes. It is not a safe default current rollback and its historical publishing instructions are not current authorization.

No approval is required merely to preserve this report or for authorized non-destructive checks. **Integrating this documentation/test checkpoint requires owner merge approval**; a PR, if opened, stays draft. Any production-impacting remediation or release needs a separate concrete review and approval. No runtime changes, merge, deployment or release are authorized here.

Stop on a proven data-loss/privacy failure, repeatable crash, wrong award, broken update or measured sustained performance failure; capture first failing operation and isolate its cause. Stop before protected-system expansion. Do not rerun unchanged failures blindly, weaken checks or expand into optional polish.

## SUNNY ACRES RELAY HANDOFF

- Agent: ChatGPT/Codex.
- Task / phase: 7N post-phone qualification checkpoint.
- Base SHA: `a183e17b1a0a4f855d704da2ee8e5bc0187eed46`; source tree above.
- Head SHA: resolve the checkpoint branch commit; exact final commit is reported with delivery. Source tested is the fixed base, not a new runtime candidate.
- Branch / PR: `codex/phase7n-qualification-reconcile`; report checkpoint, no PR required for preservation. Any later PR remains draft.
- Scope completed: current evidence reconciliation; four bounded checks above; completed phone round credited; failed Node and successful curl receipts preserved.
- Files changed: qualification report, current relay/roadmap/status notes, backend documentation caveats, opt-in audit helper and new receipts. Historical records retained.
- Tests / CI: existing main 201 all 7 passed and Pages 77 passed; local results above, not repeated. No new full regression or local browser execution claimed for this documentation checkpoint.
- Evidence: linked raw receipts, frozen original failure/diagnostics, exact-source Actions runs.
- Protected systems checked: runtime, animals, saves, auth, economy, security rules, service worker, renderer, dependencies and existing test thresholds unchanged.
- Known failures / limits: preserved Node environment attempt; no discovered runtime regression; outstanding gates above. Self-review is not independent external review.
- Merge recommendation: checkpoint ready for review; **release NOT READY with outstanding evidence gates**. No merge authorized.
- Exact next action: inspect progression/update/restore coverage; execute only distinct uncovered test-environment checks after the original executor reconnects. Owner rules review is complete; no new phone requests now.
