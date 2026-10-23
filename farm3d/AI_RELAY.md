# Sunny Acres AI Relay Protocol

**Canonical coordination document for all coding agents.**

This file exists so ChatGPT, Antigravity, Claude, Grok, Codex, Copilot/Cursor-style agents, and human contributors can hand work to one another without losing project state.

## 1. Authority and source of truth

- Repository: `pederaus9-ux/Bugsy`.
- Sunny Acres 3D lives under `farm3d/`.
- GitHub `main` is the only authoritative integrated codebase.
- Never treat a local workspace, Replit copy, stale handoff, chat transcript, generated patch, or unmerged PR as more authoritative than GitHub.
- Before changing code, fetch/pull current `main` and record its exact SHA.
- Work on a dedicated branch or isolated worktree. Never develop directly on `main`.
- Existing historical docs may be stale. For current coordination, this file and `farm3d/AI_RELAY_STATE.json` take precedence over `farm3d/HANDOFF.md` when they conflict.

## 2. Human authority

The owner is the final authority for:
- visual acceptance;
- product direction;
- scope changes;
- destructive operations;
- merges when a phase gate requires direct approval.

Agents may recommend a merge, but must not claim owner approval unless the owner explicitly gave it.

Owner update, 2026-10-11 19:49 America/Chicago: ChatGPT may start engineering reviews and hosted tests whenever evidence is ready, without asking again. This supersedes older handoff restrictions reserving hosted CI initiation for a separate owner instruction. It does not authorize merging, release, destructive changes or overriding owner visual/product decisions.

## 3. Agent roles

### ChatGPT
Technical lead, architecture, task specification, evidence review, red-team QA, phase gating, and GitHub coordination.

### Current owner instruction — 2026-10-11
ChatGPT/Codex is the sole active AI engineering lead and implementer. The owner canceled Claude and Grok. Do not require their handoffs or reviews, or claim they are working. Preserve their historical patches and evidence. ChatGPT performs implementation, regression checks and an adversarial self-review; disclose that this is not an independent external-agent audit. Owner acceptance and merge gates remain unchanged.

### Codex
Repo-native implementation/debug/test worker. Prefer bounded tasks, deterministic verification, and explicit diffs.

### CI
Objective verification layer. A green local run is not a substitute for exact-head hosted CI when hosted CI is part of the gate.

### Owner
Final visual/product acceptance and explicit merge authority where required.

## 4. Operating loop

Use this sequence unless a task explicitly requires something else:

**GOAL → INSPECT → PLAN → IMPLEMENT → TEST → FAILURE ANALYSIS → CORRECT → EVIDENCE → REVIEW → APPROVE/MERGE → UPDATE RELAY STATE**

Never skip directly from implementation to "done."

## 5. Mandatory preflight before coding

Every agent must:

1. Read this file.
2. Read `farm3d/AI_RELAY_STATE.json`.
3. Confirm current `main` SHA.
4. Identify current phase and active gate.
5. Inspect the files/interfaces relevant to the requested task.
6. List protected systems that must not change.
7. State exact acceptance tests.
8. Stop if the requested task is based on a stale branch or stale phase state.

## 6. Protected-system rule

Unless the task explicitly authorizes changes, do not alter:
- save schema or old-save compatibility;
- Firebase/auth/cloud behavior;
- economy/rewards/progression;
- unrelated animals;
- unrelated UI;
- collision/gameplay movement semantics;
- public renderer APIs;
- production ownership/root-object contracts;
- unrelated service-worker/cache behavior;
- previously frozen evidence/baselines.

A task that requires touching a protected system must be escalated before implementation.

## 7. Branch and PR discipline

- Use one bounded branch per milestone or defect cluster.
- Keep unrelated cleanup out of the PR.
- Record the exact base SHA and head SHA.
- Do not hide regressions by loosening tolerances, deleting tests, extending timeouts, or weakening assertions unless the owner/technical lead explicitly approves that change.
- Do not overwrite frozen evidence.
- Do not begin the next gated phase while the current gate is unresolved.
- If a PR head changes after review, prior approval applies only if the new changes are proven not to invalidate that approval.

## 8. Evidence contract

A serious coding task is not complete until the handoff includes:

- exact base SHA;
- exact head SHA;
- changed files;
- concise implementation summary;
- tests run and exact results;
- hosted CI status when applicable;
- performance/resource impact when applicable;
- screenshots/video/measurements when visual or motion quality is part of the gate;
- known limitations;
- protected systems verified unchanged;
- unresolved risks;
- recommended next action.

Use evidence, not confidence language, to establish completion.

## 9. Standard relay handoff

Every agent finishing or pausing a task should output this packet:

```text
SUNNY ACRES RELAY HANDOFF
Agent:
Task / phase:
Base SHA:
Head SHA:
Branch / PR:
Scope completed:
Files changed:
Tests:
CI:
Evidence:
Protected systems checked:
Known failures / limitations:
Unresolved questions:
Merge recommendation:
Exact next action:
```

If a task stops because of usage/session limits, produce this handoff at the nearest clean point rather than stopping mid-change.

## 10. Review severity

Review findings should be classified as:
- **BLOCKER** — unsafe to merge; proven contract/regression/data-loss/security failure.
- **MAJOR** — materially wrong behavior, missing acceptance criterion, or serious quality regression.
- **MINOR** — bounded defect that does not invalidate the milestone.
- **POLISH** — non-blocking aesthetic/cleanup opportunity.
- **SUSPICION** — plausible issue not yet proven; requires a reproduction/test.

Do not present suspicions as confirmed defects.

## 11. Merge gate

A PR is merge-ready only when:
- required tests pass on the exact reviewed head;
- no BLOCKER or MAJOR finding remains unresolved;
- protected contracts are preserved;
- required visual/device/manual gates are explicitly accepted;
- the owner has given direct merge approval when the phase requires it.

After merge:
1. record the merge commit;
2. confirm `main`;
3. update `AI_RELAY_STATE.json`;
4. sync any external coding workspace from `main`;
5. then begin the next phase.

## Current phase - 2026-10-14

Owner approved the bounded visibility/master-gain runtime correction at 10:40:41
UTC. Applied exactly the proposed two lines in game.js; no unrelated runtime
changes. Original native audio suite now passes 10/10; the ten-second actual-tab
regression records zero hidden output, positive unmuted return and zero muted
return, with stored preferences preserved. See
[PHASE7N_AUDIO_FIX.md](PHASE7N_AUDIO_FIX.md) for exact source/integrity limits.
64 of 65 inventoried runtime files remain exact accepted baseline bytes; game.js
has the intentional approved audio-only exception. Historical 65/65 receipts and
the original audio failures remain untouched. Draft candidate needs exact-head
hosted CI and owner merge approval. No deployment, release or phone retesting.

### Previous audio failure checkpoint, 2026-10-14

Owner approved isolated audio qualification at 06:21:41 UTC. Native local Chrome
checks passed nine groups but failed actual hidden-tab ambient silence. A focused
reproduction recorded persistent nonzero PCM over ~10 seconds, trusted hidden/
visible browser events and zero hidden output under the game's master mute.
See [PHASE7N_AUDIO_QUALIFICATION.md](PHASE7N_AUDIO_QUALIFICATION.md) for exact
source `d8aed9e`, retained failures and the unapplied two-line fix recommendation.
Stop this testing scope here. Next approval: owner authorization for a narrowly
scoped shared-master gain/visibility fix. Runtime, existing tests and prior frozen
evidence remain unchanged. No phone, security, merge, deploy or release work.

### Previous connected checkpoint, 2026-10-14

The owner authorized recovery of checkpoint `e2f2ab2` into a fresh isolated
connected checkout, superseding the older replacement-environment restriction.
Recovery and 15 distinct local progression/update/restore assertions passed on
that immutable source: consecutive earned levels 1-8 with all 18 recipes/eight
orders; compressed/SA1/file import and failure guards; actual published old worker
installation followed by current-worker activation, save retention and offline
reboot. Failed environment/fixture attempts remain frozen. See
[PHASE7N_CONNECTED_QUALIFICATION.md](PHASE7N_CONNECTED_QUALIFICATION.md).
Review this documentation/test checkpoint next; recommend a separately authorized
local audio lifecycle extension. Broader device/physical-conflict/operational gates
remain open. No runtime, phone, security, merge, deployment or release work approved.

### Previous checkpoint credit, 2026-10-13

Current main: `a183e17b1a0a4f855d704da2ee8e5bc0187eed46` (PR80 merged).
Current phase: **7N — release qualification; report checkpoint ready for review, release gates open**.
[Regression201](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392622802) passed all7 jobs; [Pages77](https://github.com/pederaus9-ux/Bugsy/actions/runs/38392621215) passed on this main.
PR79's conflicting-save emulator qualification and PR80's test-only rendered
ambient observation correction are merged and credited, not pending reruns.

The owner accepted all current animals and completed the qualitative Android/iPhone
phone round: modes, movement/interactions, saves/reopen/offline and weather were
reported good. Exact device assignment and sustained instrumentation remain incomplete;
no true shared-account physical conflict proof is claimed. No more phone tests now.
New bounded checks passed: catalog29 items/18 recipes,43 modules,archive65/65,
live static assets66/66. The initial failed Node network attempt and successful
curl follow-up are both retained. No runtime, criteria or live settings changes.

See [PHASE7N_RELEASE_QUALIFICATION.md](PHASE7N_RELEASE_QUALIFICATION.md) for
fixed-source evidence and limits. Owner confirms rules were already checked and are
good (2026-10-13 19:28:55 America/Chicago); credit that review as complete without
claiming this session independently verified deployment identity. Next: inspect
progression/update/restore coverage, then run only uncovered test-environment checks
after the original executor reconnects. Sustained measurements, physical conflicts
and operational/full-progression evidence gaps remain. Integration needs
owner merge approval; no merge, deploy or release authorized. ChatGPT/Codex only.
Full farm/progression remains free; optional future cosmetics are permitted.

The cow sections below retain historical intent and do not reopen accepted work.

## 12. Historical Sunny Acres cow program

The cow program is gated sequentially:

- B0 baseline freeze — complete.
- B1 measurable Holstein reference — complete.
- B2–B8 static anatomy — complete and merged through PR #55.
- B9 gait retiming — next.
- B10 hoof/contact validation.
- B11 turning reconstruction.
- B12 transitions.
- B13–B15 renderer micro-behavior and recent-action suppression.
- B16 long deterministic behavior test.
- B17 full regression/performance.
- B18 controlled owner/device acceptance.

Do not start B10+ as part of B9 unless the relay state or owner explicitly changes the scope.

## 13. Historical B9 intent

B9 must improve gait timing while preserving approved B8 anatomy and gameplay semantics.

Primary goals:
- visually more realistic dairy-cow stride;
- improved stance/swing timing;
- believable body weight transfer;
- stable behavior at 30/60/120 Hz;
- no new hoof skating/contact regressions;
- preserve gameplay movement speed;
- preserve 24-bone/public renderer contracts;
- preserve documented B0 stop/recovery/run-start failures as evidence until the phases assigned to fix them address them.

B9 is not authorization to rebuild anatomy, collision, AI behavior, save data, economy, Firebase, or unrelated systems.

## 14. Stale-context defense

If chat instructions, old handoff files, screenshots, local branches, or agent memory disagree with current GitHub:
1. stop;
2. inspect GitHub;
3. report the conflict;
4. use the newest owner-approved merged state unless explicitly told otherwise.

No agent should "remember forward" past evidence.

## 15. Fast user commands

When the owner says:
- **"Check Sunny Acres"** — inspect current GitHub state, active PRs, exact-head CI, relay state, and blockers.
- **"Take over"** — continue from the relay state at the next safe bounded task.
- **"Audit PR #N"** — independently review diff, tests, CI, evidence, and protected contracts.
- **"Merge"** — re-verify the exact head and required gates immediately before merging.
- **"Handoff"** — produce the standard relay packet without starting unrelated work.

This protocol is intentionally model-neutral. The agent is replaceable; the repository state, evidence, contracts, and gates are not.

## Current bounded publication record - 2026-10-14

PR81 merged/published under the owner's 11:23:24 UTC conditional approval after unchanged exact-head readiness checks. Main is `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`; tree `fbbac30554c58a2153e79495723084701cc4e4ba` equals reviewed `e92a1ba40b53e8340f7d19c649e9a777d742ad28`. Regression203 all7, Pages78 and live static bytes5/5 passed. See [PHASE7N_AUDIO_PUBLICATION.md](PHASE7N_AUDIO_PUBLICATION.md) and AI_RELAY_STATE.json for exact receipts. Publication records remain on a separate evidence branch; no further main change is authorized by this outcome. Stop this completed patch task. Full release/additional development need separate owner authorization; no new phone work. Earlier phase checkpoint restrictions describe their historical authorization, not this completed bounded publication.

## Current later qualification record - 2026-10-14

The owner authorized the next isolated scope at12:13:04 UTC. Exact published main `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765` is unchanged. Later progression/land/daily/visitor/rush scope is complete with29/30 behavior PASS and a native-Date-confirmed visitor expiry action FAIL. See [PHASE7N_LATER_PROGRESSION_QUALIFICATION.md](PHASE7N_LATER_PROGRESSION_QUALIFICATION.md) and current state. Runtime fixes require a separate owner decision; propose only the one-line expiry guard. Prior publication/accepted animal/rules/phone evidence remains credited. No merge/deploy/release/new phone work is authorized by this outcome.

## Current visitor expiry candidate - 2026-10-14

Owner approval at12:39:49 UTC supersedes the earlier no-fix qualification gate only for the minimal visitor expiry check. Source checkpoint `b3e1c7ca0948f4c1dfb4a86e74d8892131f73656` and main `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765` were unchanged. Implementation `1877fcb94b84eee5f0bc7e9af3f867a8a7b37951` passes nine focused browser contracts and preserves all prior evidence/runtime except the approved one-condition game.js edit. See [PHASE7N_VISITOR_EXPIRY_FIX.md](PHASE7N_VISITOR_EXPIRY_FIX.md). Keep PR draft, pin final exact-head hosted results, and await separate merge authority. No deploy/release/new phone/FS25/security/production scope.

## Owner-authorized accepted character publication — 2026-10-18

Owner instruction at08:55:37 America/Chicago: "Just merge and let me see it in game and we can unmerge if it dont approve". This explicitly authorizes merging the recovered accepted character baseline for in-game owner review before fresh screenshots. It supersedes the earlier preview-before-merge restriction only for this bounded publication. It does not clear the known broader CPU/GPU, capture-repeatability or release gates.

Fresh main is `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`, tree`05ac4ee6c3ff982ba2e8925d68fd5077667d058f`. The five runtime files exactly match recovered accepted reference`70e7085c744acc3a8d7b83ba601753e055c2e9a3`. The normal-calculation optimization and recorder investigation remain shelved; no recorder launch or code is included. Saves, Firebase, economy, native controls, animals and assets are unchanged. Worker algorithms are unchanged; only the matching module versions/cache shell entries change.

Local verification passes89/89 focused character and surrounding regressions,0fail/skip/cancelled, plus four module syntax checks. Existing hosted commands remain intact, with the seven focused character test files prepended to the existing character job. Await exact-head CI before the guarded merge. No fresh native screenshots or performance clearance is claimed. This is lead self-review, not an independent external audit.

See[PHASE7N_ACCEPTED_CHARACTER_PUBLICATION.md](PHASE7N_ACCEPTED_CHARACTER_PUBLICATION.md). Record the final merge/base for a normal revert if the owner rejects the in-game result; do not reset main or imply save writes can be undone by code rollback. Earlier stopped scopes and failures above remain historical evidence.

First PR83 head a4a84bc8 failed the authored-hands harvest-return check. Its isolated adapter neutral excluded the accepted overlay's relaxed finger bend. The real-GLB offline probe reproduced the exact baseline mismatch; a test-only correction retains nativeNeutral and checks independently composed idle before and after harvest using unchanged action/return tolerances and timeout. Initial logs, screenshots and trace remain retained. No runtime changes; fresh exact-head CI remains required.

## Current bounded task — session seed equipment, 2026-10-18

PR83 actually merged at `54d970e389418e6dbd9d49ca25f8a611b6f2f81c` (tree `a3d86d39d6f0454e65cd6055a769ef9598b4a184`), and Pages run39135350923 succeeded. At09:30:55 America/Chicago the owner said “It looks good on game.” Credit this qualitative character/arms acceptance. The earlier publication-pending entries above are historical; they do not supersede this completion record. Retained desktop authored-hands timeout and broader CPU/GPU/capture failures remain open. The recorder and normal-calculation optimization stay shelved.

At09:39:49 America/Chicago the owner approved session seed equipment: choosing a crop plants the pending plot and closes the chooser; walking Plant reuses it across plots; visible controls change or put it away. Work is isolated on `codex/sticky-seed-planting-20261018` from the merge above. No save-schema, game.js rules, Firebase, movement, animal or character changes. Worker cache version only advances v45→v46 so the changed HTML refreshes offline. Existing checks retain their tolerances/timeouts; the exact cache-version assertion follows the intentional bump.

Local focused verification:101/101 pass,0 fail/skip/cancelled, plus6 syntax checks. Fail-first and intermediate fixture/cache/overlay failures remain retained. Exact-head hosted browser/regression tests and authentic screenshots are pending. See[PHASE7N_STICKY_SEED_PLANTING.md](PHASE7N_STICKY_SEED_PLANTING.md). This approval permits implementation/testing and a draft PR, not merge/deployment/full release. No new physical phone testing or shelved-recorder launch is implied.

First draft head5403107: dedicated hosted planting job passes22 behavior groups and authentic screenshots; saves/accessibility/analytics pass. Original core regression correctly catches display metadata collision with seed-picker actions. Preserve failed log/ZIP12140771867 and trace. Correct display-only attribute to data-equipped-crop; fail-first check then101/101 local pass. Exact-head hosted rerun required; no merge authority.

## Current design draft — chickens, 2026-10-18

Main ref is verified at `756df378e7adbe20f34c204dc54172b1030e16bd`, tree `6580beff7b9018ec33c6d4cda0fff9139b4339d4` (PR84 integrated). Earlier planting-pending records are historical. The owner later reported “Looks good now” after the phone follow-up; no runtime correction or confirmed stale-cache/black-surface cause is claimed. Prior failed tests and broader performance/capture gates remain open; recorder and normal optimization remain shelved.

Current work is a written chicken-pen design on `codex/chicken-pen-design-20261018`. See [the review draft](../docs/superpowers/specs/2026-10-18-chicken-pen-design.md): a customizable in-game coop and netting run, fixed six-chicken capacity, physical 12-real-hour feed and water supplies, one base egg/chicken/30 minutes, and outside pallet pickup. Proposed visual/top-up/migration defaults are distinguished from confirmed owner direction. Lead self-review only; no implementation, tests, launch, PR, merge or deployment in this documentation task. Owner written-design review precedes implementation planning; actual game acceptance and merge remain separate.

Owner requests holiday decorations after chickens: flat and apparently cut-off shapes, plus pumpkins following viewing direction. The screenshots support appearance feedback, not a runtime cause. Inspect renderer/orientation/clipping before correction; recommend fixed-orientation 3D pumpkins and restrained lantern glow in a separately reviewed change. Market Sales remains a separate later scope, with egg/dozen and milk/gallon quotes fixed for six-real-hour windows. The bulk milk tank is explicitly deferred to the cow-pen phase. Preserve existing animal models/motion and original PC workspace.

## Chicken implementation plan prepared — 2026-10-18

Owner instructed continuing the pen at19:48:25 America/Chicago after the linked design draft. Fresh main remains `756df378e7adbe20f34c204dc54172b1030e16bd`; design branch checkpoint is `9cb302f1b69663bd41170a6afbcec9f91cfef4c1`. Open PRs60/54/37/34 contain no competing chicken-pen scope. [Implementation plan](../docs/superpowers/plans/2026-10-18-chicken-pen.md) maps five direct-implementation tasks: pure care/migration, existing game/save routing, physical yard, interaction/customization, and native touch/installed-update evidence. Plan self-review and structure/placeholder/whitespace check completed; no product code, runtime tests, game launch, CI dispatch or merge in this checkpoint. Written plan is ready for owner review; no implementation completion or new game preview claimed.

Owner additionally confirmed whole-game graphical polish in the final pre-release phase, covering decorations/environment/lighting/characters/opening/settings/UI while keeping smooth phone performance and reliable saves. This is roadmap direction, not clearance. Bulk tank remains for cows; holidays are next after chickens. Preserve prior failures and the original PC checkout.

## Chicken pen implementation candidate — 2026-10-18

Owner approved the written plan at20:02:34 America/Chicago. Fresh isolated clone, base main756df378, runtime branch `codex/chicken-pen-v1-20261018`; original PC untouched. Chicken care/migration, physical coop/netting/stations/pallet and in-game appearance preview/Apply/Cancel are implemented.34 focused care/game/geometry/tray/cache contracts pass; syntax and selected chicken motion/placement checks pass. This is local contract evidence, not native input or visual acceptance. Full local/hosted checks are in progress. See [CHICKEN_PEN_REVIEW.md](CHICKEN_PEN_REVIEW.md) for decisions and retained failures.

Hosted native touch, video, real v46→v47 installed-update/offline reboot and existing authenticated snapshot emulator assertions must qualify on the exact candidate. No physical phone performance, merge, deployment or release claimed. Required owner visual/merge gates and all prior character/performance/capture/black-surface/recorder limitations remain. Holiday decorations are next after chickens; cow tank stays with cows; whole-game graphics polish is later.

Chicken PR85 native checkpoint: second source b60d7722d1c7ef5cc8c2de472f02950d7e5af1f4 passes20 behavior groups including all three phone layouts; desktop pallet gate fails because an actual foreground pet blocks the ray. Separate slat-gap probe reproduced and fixed with a non-rendered pallet picking volume; test camera approaches clear east side without altering pets or priority.57 focused Node contracts pass. Both failures and native images/video retained; installed-worker and authenticated qualification remain open. Exact-head rerun required; no merge/deploy/physical-device approval.

Third source7f325ad:21 native groups pass including desktop pallet. Palette scroll loses its DOM element when supply countdown changes; separate fail-first renderer test reproduces. Remove irrelevant live supply summary from palette;58 focused Node checks pass. Installed-worker suite now has an independent hosted step gated on passing care contracts, so UI failure cannot omit its receipt. Exact-head native requalification still required; no merge or visual acceptance.239 earlier local Node assertions passed before absent Chromium. Known character75 timeout retained. See CHICKEN_PEN_REVIEW.md.

Third-source final core and Firebase jobs both SUCCESS. Two named chicken authenticated upload/restore checks pass; Task2 cloud gate has evidence. Care/game code unchanged by palette-only correction; current exact-head native/installed rerun remains required. Character timeout and original native detached-control failure stay retained.

Owner revision2026-10-18T21:29:59-05:00 selects30 chickens, superseding six-bird limit. Enlarge coop/run; one existing feed per current bird retains12-hour supply, base30-minute eggs. Engineering storage default scales240→1,200.65 focused Node checks pass; earlier6-bird real captures are historical, not30-bird evidence. Revised layout clears existing boulders; failures retained. Native full-flock and installed-update jobs independent. Source care2/yard2/game27/cache48; existing version test follows intentional bump. New30-bird normal guest, installed offline and emulator fixtures require exact-head receipts. Keep PR85 unmerged, original PC and accepted animal models/motion untouched. See updated spec/plan/review.

Thirty-bird final local check66/66 PASS after clearing the flock resting/spawn fallback. Early obstruction wording corrected: ramp met a bush; coop met a rock. Actual existing rock/bush footprints retained and avoided. Full-flock matrix isolates844 and390 layouts at full scale with20m case budgets; no action deadline or drawing-quality reduction. Native receipts still pending.

Fourth47 native UI script SUCCESS; installed update fails offline boot after five update groups pass. Raw ZIP05b2ce68...9df33e/results/trace retained. Composer imports are absent from cache manifest; new graph probe finds16 omitted local modules including auth script-src root. Cache48 list now contains all41 local boot modules, with no cache algorithm/auth/canonical-code edits. Test reconfirms current active worker/cache after intentionally serving older worker bytes; original90s offline gate unchanged.67 local checks PASS; no native offline or30-bird visual clearance. Current30-bird candidate remains unmerged and needs exact-head browser evidence.

## Owner-authorized correction — October19,07:40:56 Chicago

Owner requested solving the two diagnosed gates. Isolated correction from2072e88; main remains756df378. Test-only patch: capture the newly requested worker from updatefound BEFORE requesting update, and require that exact object to be activated, active and controlling the page. Missing/redundant/predecessor/pending installs fail closed. No cache-name-only inference. Test harness can deliberately serve v25 page modules while keeping actual48 worker bytes; then separately force46 rollback and48 re-upgrade, each fully settled before navigation. One-way offline reboot is checked before either compatibility scenario. All existing hash/save/30-bird offline requirements and original90s deadlines remain.

Character test now independently requires accepted composed[-.1,-.1] idle BEFORE harvest, unchanged>.35 active curl, exact idle return within original10000ms, actual crop harvest, and zero inactive native curl after subtracting the accepted overlay rest blend (floating reconstruction tolerance1e-12). Its new resting expectation follows native/actual-source evidence, not observed arbitrary poses. Game character code is unchanged. Original zero-check failures remain retained.

120 focused Node assertions pass. Identity tests have retained red/mid-correction/green evidence. Full local npm test attempted; inspect full-local.log for exact environment result. Native two independent update runs plus full original scene-polish at844/1280 are pending. No game/auth/Firebase/save schema/economy/worker algorithm changed. No merge, deploy, phone or performance clearance. Earlier diagnostics/evidence branches remain frozen. Lead self-review only.

### Native first correction and marker fixture follow-up

Sourcea1279e6a8c9e0f2f8711b3f22ff60603d44afff6/treea2361f1ad88df4a4801b6a1cc264cb612790497b: isolated update jobs118067257877 and118067258094 PASS10 stages each, with all three requested-worker replacements actually controlling. Exact-head PR update job118067285154 also SUCCESS (third independent native run). Real30-bird offline restart:30 care birds,880coins,0feed,2eggs,sage appearance,controlledtrue. One-way offline, old-client/current-worker, explicit46 rollback and48 re-upgrade, original hash/paid-output/save checks all pass.

Character job118067258038 reaches past corrected844 arm action/return/inactive checks, then FAILS unchanged30000ms marker-ready gate at line80. Existing fixture chose first pen animal, now a chicken whose individual timer is migrated to shared pallet. Actual game-source probe confirms chicken list clears and pallet increments while cow individual timer persists. Follow-up selects explicit cow and asserts its identity;48.001px cap, visibility requirement and deadline unchanged. This is a fixture repair consistent with the approved shared-chicken design, not a removed marker requirement. Raw failure9f9f4282...961486 retained.1280/remaining scene checks pending fresh native run.

Final local npm test completed37 Node test-file invocations with248 passing assertions, then fails before browser launch because Chromium executable is absent. Preserve full-local-final.log; no whole-suite green claim. Monitor also emits fatal-library lookup-self diagnostics; these did not fail Node checks.120 focused checks passed separately. All87 runtime files still byte-identical to2072e88. No game, worker algorithm, auth, save, animal or character edits. Current full PR run partly pending; do not credit pending/cancelled jobs. No merge/deploy authorization.


## Authored-hand desktop gate correction — owner-directed October19

Owner requested another attempt at fixing the outstanding hand-return issue at18:47:37 America/Chicago. New native diagnostic f9e820488246094615b651e10c77ff6ed799c230/run39344007122/job118372117258 reproduces1280 failure with actual samples:2pre-input samples,9post-input game updates,11of71samples, no cap exhaustion; count/departure pass, final-three return fails. Actual frame gaps1.09–1.15seconds advance onlydt0.1. The live finger is exactly neutral at the post-wait observation; the last in-wait poll still lacks its third settled sample. No hidden/hold or observer error was observed. The historical two failed jobs still lack their own samples.

Candidate7858572903687c413b7d21d56948276ff2c47991/run39344522666 passes both observed widths and the original test without observer instrumentation. The only executable integration change is authored-hands.browser.cjs start({deviceScaleFactor:.25}) instead of inheriting0.5. Every test assertion, tolerance,71-sample cap and10000ms deadline remains byte-identical; reversing this one option restores the entire original test. Shared harness, production game/character/assets/saves/Firebase/worker and independent full-resolution capture scripts are unchanged.

The subsequent normal-farm/offline/fallback/full-resolution capture stage is still running at this publication checkpoint and is not credited as success. Exact new PR-head CI remains required. See HAND_RETURN_GATE_CORRECTION.md and tests/evidence/hand-return-causal-20261019/. Earlier failures and diagnostic branches remain preserved. This is a software-CI component-rendering-budget correction, not a production speed or physical-phone clearance. The separate cancelled core/partition integration gate, owner30-bird visual acceptance and explicit merge authority remain open. No merge/deploy. Lead implementation and adversarial self-review only.


Controlled correction completion: run39344522666/job118373798545 is SUCCESS, including observed and uninstrumented844/1280 tests, original normal/offline/fallback paths and full-resolution captures. Observed waits7871/7975ms; before/after shared quaternion prefix has maximum component difference0. Artifact12231091075 SHA119c0c1e778d033efb51a7ea071200cc96e31c633d2c86af427e0c09ded8aa02 is retained. PR85 was updated with the minimal integration at3251c754375428edf161e92ae9f3b75bf63513c0. Fresh exact-head CI is running; later receipts remain on an evidence branch without changing that tested head. No merge/deploy or new device/performance clearance.

- Exact PR-head3251c75 authored-hands run39345911273/job118378334290 SUCCESS through normal/offline/fallback, full-resolution captures and artifact upload. Downloaded artifact12230884748 SHA256aa4fbd7feb912e524d0da630854a9242ada069ae91fd494d086a579631189349 verified. Fresh core regression and30-bird/offline jobs also SUCCESS; other jobs still running in timestamped evidence snapshot. No merge/deploy/whole-PR clearance. Later receipts use separate evidence branch to retain tested PR head.

## Owner-authorized PR85 merge —2026-10-19 19:49:13 Chicago

Owner said “Merge.” Immediately reverified unchanged reviewed head3251c754375428edf161e92ae9f3b75bf63513c0 against main756df378e7adbe20f34c204dc54172b1030e16bd. All16 exact-head check runs and all3 workflows are SUCCESS. Marked ready and merged with expected-head guard: c17d563886cca786391c8aaa401498437dfca0e7 at2026-10-20T00:50:02Z. Main and merge tree verified; treef92185d4834b142428349bd3f2315786aee672ba equals the reviewed head and CI synthetic merge.

Automatic Pages39349973730 and main regression39349974581 started; no manual deployment triggered. Record publication outcome separately. Owner explicitly authorized integration; no new physical-device performance or30-bird visual acceptance is invented. Broader graphics/capture/black-surface questions remain open, recorder/normal optimization shelved. Separate CI partition/evidence branches and every prior failure remain preserved. Do not start holiday/other backlog in this merge task. The latest state on this evidence branch supersedes older pending-merge checkpoints without changing tested/published main.

Publication follow-up: automatic Pages39349973730 completed SUCCESS on merged mainc17d563886cca786391c8aaa401498437dfca0e7. No separate/manual deploy was triggered. This credits the Pages workflow only; no new real-player/save, live-static-byte or physical-device/performance result is invented. Post-merge main regression may still be running. Owner in-game review is next.

## Holiday decoration depth —owner authorization2026-10-19 20:03:12 Chicago

Owner: “Chicken pen looks good lets do decorations.” This accepts the30-bird pen qualitatively and authorizes the existing depth/clipping/fixed-pumpkin-orientation scope. Fresh mainc17d563 verified; new isolated branchcodex/holiday-depth-20261019. Existing placed inventory/positions, saves, chicken and other species care, characters, Firebase/economy and shelved work remain protected. Actual source confirms emoji PlaneGeometry and camera-facing rotation. Replace holiday visual consumers only, retain old IDs/placement paths, align with actual ground, capture orbit and mobile/desktop/save/resource evidence. No merge/deploy authorized for this new task.


## Market Sales — owner-approved bounded implementation,2026-10-20

Owner approved the short in-chat design at01:10Chicago: barn Market Sales, eggs/dozen, existing milk item/gallon,120/18base coins before perks/gold, quotes within±20percent every six real hours, quantity/Sell All, preserve existing selling. Fresh main2bf6f16a0d0b965df1eda089a3ea6a0f140f6f69 is PR86's actual merge; automatic Pages39366606202 and post-merge regression39366607070 both SUCCESS. This supersedes older draft/unmerged decoration statements without changing their evidence. New isolated branchcodex/market-sales-20261020.

Pure deterministic UTC six-hour pricing adds no save fields. Instant barn-only sales validate live stock/gold/perk/window before confirmation, preserve leftovers and accepted quality/perk bonuses, reject duplicate/stale/read-only mutations. Worker algorithms unchanged; cache50 precaches market-sales1 and game28. Existing cache identity pins follow these intentional versions only. Runtime changes are limited to approved sale/menu integration; animal/character/chicken/recipes/cloud/save schema/worker algorithms remain protected. Cow bulk tank, other pens, recorder and normal optimization stay deferred.

See MARKET_SALES_REVIEW.md. New local fail-first API/menu contracts and15focused market/cache checks pass; actual native multi-layout, installed/offline and full exact-head CI are pending. Local browser download failed and local complete npm test remains incomplete, neither credited as success. No merge, deployment, owner visual acceptance or physical-phone performance clearance is authorized or claimed. Review actual hosted renders and exact-head results before owner review.


Market qualification follow-up: original CSS counterexample confirms356outer scroll/342client vs342==342body; corrected observer retains strict viewport/44px gates. Second balance mismatch1486vs1426 is the independently replayed existing60coin season prize at40points (237+189sale proceeds→42.6points); separate contract proves it pays once, completed-season native fixtures isolate direct sale proceeds. No production changes follow these observations.

Surrounding native seed job118489014725 at740 failed KeyE/plot2 null vs wheat, with coins10unchanged. Retain artifact12245536957 SHA25662dbfd07c94e423e34c68a83bfbd8c35f304832f3359a7a49eff6e83c8e76d17. An actual-helper counterexample proves fresh ray+repeated Plant label can be ready while cached input target is stale. Test-only served debug getter and stronger wait require requested cached plot/action; all original scenario assertions/key actions/30sdeadline remain exact. New trusted-input/cache receipts distinguish this mechanism on the next run. Historical cached target was not persisted; exact original cause remains unassigned. Production input/planting code and accepted seed behavior are untouched.98focused local contracts pass. Final native/CI/owner review pending; no merge/deploy.


Core regression onf77e3bc5 reached43Node invocations/259PASS, regression.browser andshed-switch PASS, then failed cow3d.browser740 distance0>.01 (job118491469566). Raw artifact12246351548/5116b03583fc1fcfe737ad0f6bf18c567527fe38679e1b55ae28656e943488a1 retained; remaining2browser suites not credited. Actual fixture leaves presetNight then forces cowfair/go; productionweather mismatch cancels that target. Actual-fixture/production-branch red/green confirms it. One test-onlysetPreset('noon') restores intended travel conditions afterall5lighting samples. Everyoriginalassertion/threshold/120+180updates remains unchanged; path/first-update snapshots now retained beforeassertions. No cow/actor/render/runtime edits or oldcowprogram reopening.100focused checksPASS; corrected originalnativeprobe andfullfinalheadCI required. No merge/deploy.


## Market Sales final qualification — 2026-10-20T07:28:22.173493+00:00

PR87 remains draft/open/unmerged at reviewed head`b39b7242f6cf6e90572316233d637cb2c28474f0`, tree`e99bdfacd052bef22ef3913822e3ea1eb20ac662`,
base main`2bf6f16a0d0b965df1eda089a3ea6a0f140f6f69`. All18exact-head check runs and all3workflows SUCCESS.
CI synthetic merge`b123046e0be21749c85f0ce9337527affc9bf59e` has the identical tree. Core completes
all41Node files/44invocations/261passing Node tests and all5original browser
suites. Market15nativegroups pass at390/844/1280DPR1, including actual requested
49to50worker control/module hashes, retained30birds/old stock and offline sale/
reload. Final native planting22groups pass; historical cached target is missing
and original cause remains unassigned. The844key telemetry filename was overwritten
by a later scenario; original844assertions passed but no key telemetry is claimed.

Actual final images are inspected and retain normal scrolling. The enumerated
protected-file receipt replaces an earlier unsupported117summary count with83
exact protected production/config/asset blobs under an explicit path scope. Only
approved sale/menu logic and import/cache identities change; worker algorithms,
dependencies/lockfile, animal/character/planting runtime and save schema remain exact.
All4native failure samples/logs/traces and local installer/full-npm limitations
remain retained. Final cow snapshots preserve the fair-weather first-step target
and pass original travel/block/pick/save requirements at all3widths without runtime
cow edits. See[immutable assessment](tests/evidence/market-sales-20261020/final-review/assessment.json).

This evidence branch records qualification without changing the tested PR head.
Owner actual visual acceptance and direct merge approval are pending. No merge,
deployment, new phone performance clearance or other phase started. Local100/100
focused and12800price cases pass; local browser/full-npm are not passing receipts.
Lead implementation and adversarial self-review only; no independent audit.
Exact next action: owner reviews actual previews and PR87.


## Owner-authorized Market Sales merge — 2026-10-20T11:15:02Z

Owner instruction at2026-10-20T06:14:11-05:00: “I approve merge that.” Fresh
preflight verified unchanged PR87 head`b39b7242f6cf6e90572316233d637cb2c28474f0`, unchanged base main2bf6f16,
all18exact-head checks SUCCESS and clean mergeability. Marked ready and merged
with expected-head guard. Actual merge/main`9214e564f64c43ab4ccf3eb1175a075d34e32a70` has tree`e99bdfacd052bef22ef3913822e3ea1eb20ac662`, identical
to the reviewed head and CI synthetic merge. Prior failure samples remain frozen.

Automatic Pages39413607315 started and main regression39413608502 queued. No
manual deploy was triggered. Record later workflow results separately; no physical
phone performance, new save/player operation or live-static-byte result is claimed.
This record supersedes earlier PR87 pending-merge statements, without rewriting
those historical receipts. Evidence remains separate from tested/published main.

The owner also requested buyable street-style lights so players can add light to
dark farm areas. This is recorded as the next separate decor idea in the state
and[idea note](STREET_STYLE_LIGHTING_IDEA.md). No light model, runtime, placement,
save, price or performance-budget change is included in the Market Sales merge.
Price/style/range/night behavior and mobile light budget need scoped design.
Exact next action: verify automatic Pages publication, then discuss the streetlight
decor scope. Keep accepted animals/characters/chickens/saves and shelved work intact.

Publication follow-up: automatic Pages39413607315 completed SUCCESS. Anonymous
static GETs of index.html, sw.js, market-sales.js and game.js all return HTTP200
and exactly match reviewed/published bytes (4/4) at2026-10-20T11:16:49Z. No game
execution, owner profile, cookies or save access used. Main regression39413608502
is in progress and is not a passing post-merge receipt. Market Sales is published;
owner game review and separate streetlight scoping are next. See publication
merge/live-static evidence. No lighting implementation or new device claim.


## All world decoration depth — owner instruction2026-10-20 at06:27Chicago

Fresh main9214e564 is the actual Market Sales merge, with successful Pages and
4/4live-static identity receipts. Owner selected Farm Utility lamp option2 and
reported more flat/camera-following decorations (lantern/maple/sunflowers). Source
catalog audit finds54IDs:21holiday solid models,2existing procedural trees and31
emoji planes. Existing makeDecor fallback and camera-facing update assign the cause.

New isolated branchcodex/all-decoration-depth-20261020 extends the same solid,
fixed-orientation visual treatment to the31remaining shop/event/season props.
The accepted holiday module and2tree appearances remain intact. Game.js, IDs,
prices, saved ownership/positions, saves/auth/animal/character paths stay protected.
A new pure model module owns/merges/disposes its resources; complete geometry is
fitted to existing circular placement bounds and terrain. Grass clearing extends
to the new solid props and restores on move/put-away. Cache51 adds the new module;
worker algorithms and game28 remain exact. Cache-identity pins follow51 only.

101focused local tests pass, with initial billboard/pose and6540triangle blossom
failures retained. Blossom is simplified to5940 under the unchanged6500cap.
All54paidcounts/IDs/positions/rotations survive the actual save/load path. Actual
native31model galleries, front/side/back views, native purchase/movement/reload,
50to51requested-worker/offline boot and full exact-head CI are pending. No actual
appearance, phone hardware performance or merge clearance is claimed.

Farm Utility is the selected style for the separate new-light feature. It is not
silently substituted for the existing paper-lantern item. No new lamp price,
lighting runtime or renderer rebuild is included in this geometry milestone.
See ALL_DECORATION_REVIEW.md. Lead implementation/self-review only; preserve all
failures and show actual game evidence before any separately approved merge.


Native attempt1 at2e804feb: all3widths pass actual volume/ground/orientation and
native buy/move/done/reload/put-away. All31front/side/back renders were inspected;
no cards or cut-off geometry observed. The separate model study fails cleanup:
127geometries→0,1texture→1, while the new test incorrectly expected every renderer
texture to reach0. Actual Three r186 source creates the shared16x16 DFG_LUT for
standard materials; model factory creates no textures. Next test-only observer
renders/disposes an independent plain cube before any model, records that LUT
and baseline, then requires exact model cleanup equality. This preserves zero
owned-geometry/texture leakage; hosted baseline proof and offline stage remain
pending. Original exit1/log/artifact retained under native-attempt-1. No runtime
change follows this test finding, and no whole-job pass is claimed.


Offline setup correction: the native script atf122b8e waits on serviceWorker.ready
on the harness HTTP origin without registering any worker. The unchanged page
auto-registers only when location.protocol is HTTPS. A source-VM counterexample
executes the actual page guard and test callbacks: HTTP auto-register0, HTTPS1;
old setup reads ready with0register calls and never resolves. The corrected test
explicitly registers sw.js, as existing installed-update suites do, then waits
up to90seconds for the activated predecessor to control the page. No production
worker, registration policy, save assertion or update assertion changes. Native
proof of the corrected offline path remains pending; source-VM proof is not a
browser result. Thef122hosted job was still running when this guaranteed setup
hang was identified; preserve its eventual cancellation/timeout logs separately.


Native attempt3 atf9becbbee fails only in the offline fixture receipt after8native
PASSgroups, including exact independent LUT baseline/cleanup. Tracecall@1355's
async wait returns after5.206ms; call@1357 observes r.active null. Actual locked
Playwright poll checks Promise truthiness without awaiting its Boolean result.
The prior VM probe awaited the callback and missed this; the corrected probe
executes the real installed polling condition and proves asyncfalse succeeds
prematurely. Use a stored registration and synchronous Boolean readiness check,
keeping90sdeadline/all existing assertions. A separate isolated offline diagnostic
branch qualifies this corrected setup before another full PR-head qualification.
No production model/worker/save change follows these test bugs. Final offline
acceptance remains pending; original exit1/log/PNG/trace retained.


Isolated native offline proof now passes atcc2274bd, run39422484072/job118626666214
(exit0, artifact12265065857/SHA256851a76f83c514020898eed68fe64dff5cf761fa4ec23e7ee484b63dc91b2136d).
The actual50worker is activated and controls localhost; requested51worker then
replaces it, cached moduleSHA256matches81d49f5e3a7f4717df4653b3c577ebc569359b3c45267a81a521fc6ad9705dd7,
and online/offline reload preserves paid inventory, stocks, farm and rotation.
The full test receives the exact synchronous readiness fix. Diagnostic workflow
and subset script remain on the separate branch; they are not added to this PR.
No product source changes follow any of these fixture corrections. One full
final PR-head native run and all19checks are still required before owner review.


## Final exact-head qualification — 2026-10-20

PR88 head f0a043f620d634c164f94c27ddd546609d7f32c2, tree
5d912e6a5489133a1076c911f20073ba38f8945a. CI merge65c0e30e6e98efbbdd6b174b2fd5f2a748f75fd5 has the identical tree.
All19 checks and all3 workflows39423140872/39423140835/39423140795 SUCCESS.
Core job118629370887:296 Node assertions across43 files/46 processes, all5
original browser suites ENDcode0, full completion footer. Catalog job118629370830
passes10 native groups and91 Node contracts. Actual final artifact12264844029
SHA25646ff4eff8a2d5c09c2aa7ceeda128886867f452d4a365d8eaf0aad2fe10b8473.

All31 front/side/back actual model studies and actual390sunflower/844lantern/
1280maple farm orbits reviewed. Models are complete, grounded and fixed in world
orientation. Real buy/move/done/reload/put-away and50->51worker online/offline
paid-save retention pass.127 owned geometries are released; exact memory returns
to independently warmed0geometry/1sharedDFG_LUT texture baseline.

The third fixture failure was an async polling predicate returning a truthy
Promise before activation; retained source counterexample uses actual installed
Playwright polling semantics. Synchronous Boolean registration/activation/control
wait fixes the observer. No runtime change, assertion relaxation, timeout
extension or skipped original test followed any fixture correction.

All previous pending fields above are historical checkpoints superseded here.
Failure logs/traces and cancelled partial result are retained. Physical phones
remain untested. This is lead self-review, not owner acceptance. Farm Utility
real-light feature remains next, separate from this PR. PR88 stays draft/open/
unmerged pending owner appearance acceptance and explicit merge approval.
Final evidence is on a separate branch so the tested PR head remains unchanged.


## Owner-approved PR88 publication — October20
Owner instructed Merge at08:03:41Chicago. PR88 merged13:04:10Z as8a18715515028904e984012eb3d37c41eb0f2dc2. Tree5d912e6a5489133a1076c911f20073ba38f8945a is identical to qualified headf0a043f6. Pages39427285408 SUCCESS; anonymous postdeploy index,decor-models,sw,game GETs all200 and byte-identical to reviewed files. Earlier predeployment old responses retained separately. Postmerge regression39427286563 remains inprogress at this checkpoint, not claimed as complete. Physical phones untested. Farm Utility buyable lighting is next separate scope. Prior owner-pending fields are historical, superseded by this approval/publication record.


## Current: Farm Utility lighting — October20
PR88 is owner-approved, merged and published as8a187155; exact tree and Pages publication receipts are in ec525a65 evidence branch. Owner now authorizes lighting implementation. See FARM_UTILITY_LIGHT_REVIEW.md. Focused97PASS; native real illumination/touch/offline and full final-head CI pending. Current light feature not merged/deployed; owner must see actual night renders before approval.


## Farm Utility qualification follow-up —2026-10-20

Owner requested preparing PR89 for merge at09:42Chicago, not merging it. Main remains8a18715515028904e984012eb3d37c41eb0f2dc2. Recovering from scratch workspace maintenance uses exact GitHub blobs and verified artifacts, not reconstructed guesses.

First PR-head a798409 had three retained failures: Market Sales expected obsolete game28 despite intentional29 (test identity corrected only); scene-polish1280 geometry292to281 (cause remains unassigned, no runtime or original-test change); utility1280 frame+3 wait timed out60s after20 queued manual renders, followed by screenshot timeout (trace retained, no failurePNG claimed). The earlier native run passed automation but normal390 side/back renders had excessive bloom glare. Corrected new-lamp-only12intensity/decay1/bulb1 preserves warm ground coverage and readable solid bracket/post; existing lighting is untouched.

Isolated diagnostic ba99bfac218590f3445cfe36865e520ff093728c/run39433716353: utility job118665116411 SUCCESS,97Node contracts and6native groups including390/844/1280DPR1 actual purchase/move/rotation/day-night/save/put-away and old51to52 requested-worker/offline. Actual brightened pixels outside entire model bounds133032/121784/370377.20 real rebuilds after GPU completion retain219geometries/64textures exactly; per-draw GPU waits about3.5–3.8s justify completing measured GPU work rather than queuing20draws before preset change. All original60/90s readiness deadlines,20cycles and exact equality remain. This supports corrected test observation ordering, not exclusive historical root-cause attribution.

Matched character diagnostic job118665116015 SUCCESS, including original wardrobe equality at844283/97 and1280292/96 before/after. Two observed disposed geometries belong to farmer rebuild/hitproxy. No11-geometry loss reproduced; historical cause remains unknown. Original scene-polish test and production characters are unchanged. Passing diagnostic is a non-reproduction, not a fix claim.

Verified artifact12269328996 SHA0199ef5c058d90cae5cbac6636ad4a71bde030abb5018cdd0a87c122d79bb896 (19300632bytes); wardrobe12273095252 SHAb313593f10fb3973a1431c722ecb1ac9e5b3de0d5cb4cc6e985fd75a8c5516e5 (7650423bytes). Both ZIP CRC/path checks PASS. Lead inspected actual normal-composer front/side/back/day/offline captures. No physical-phone or independent external audit claim. Full new PR-head checks required, no merge/deploy. Diagnostic workflow/copy remains separate.


## Paid-light writer compatibility — final review blocker and bounded correction

Final pre-release source audit reproduced actual main game28 silently removing a newly placed utilitylamp from a v1 save and save() returningtrue, overwriting paid ownership. This is now a merge blocker independently of earlier CI passes. The exact whole old/new game-module probe and6new regression contracts are included. Original unguarded source fails the new protection expectations; corrected disposable source passes all6. DOM/timers and unrelated chicken settlement are boundary shims; original game load/upgrade/save functions execute unmodified by the harness. Local gitshow transport uses the exact main source fetched via GitHub because scratch maintenance removed the checkout; hosted test uses gitshow directly.

Bounded correction uses the already-existing newerSave read-only guard in old clients: current code supports version2 (identity migration, no changed data fields); ordinary farms remain v1 and old-client chicken-timer workflows stay writable. Only owning a utilitylamp, placed or in inventory, promotes the saved v marker to2. Older code can display its known farm but refuses every save and preserves the raw paid farm exactly; reopening updated code restores the lamp. Versions newer than2 remain read-only. No Firebase/worker algorithm or chicken/character/other gameplay changes. Native test adds actual cached28 write-refusal/raw-byte retention/current29 reopen before the original requested-worker/offline scenario. Existing ordinary-farm v1 assertions remain unchanged; only lamp-owning tests expect2. Full exact new-head hosted native/regression required before readiness; no merge/deploy.

Authenticated emulator recovery includesv2 lamp ownership/30birds.

Final qualification core job118701321125 at82076e4 failed before test execution because depth1 checkout cannot resolve main8a187155 historical game blob (gitshow exit128). No artifact was uploaded because no artifact file existed. New test now reads a frozen copy of that exact already-existing Git blob with SHA256f0e5da372f94ef064140724458907b1ebcb8268f35b529db359fbebaa02a5786 checked before execution; no network/history assumptions or relaxed assertions. Direct local node--test now passes6/6 without git transport shims. Added required synthetic3d-v2-utility-lamp.json fixture, preserving fields/paid ownership/rotation/30 birds. Full latest-head qualification required; earlier heads not credited.


## Cow courtyard and physical animal care — October20
Owner selected concept4 Dairy Courtyard and requested real beds/shelter sleeping and physical eating/drinking at stations for all animals. Ready cows show milk-full symbol; selecting Milk sends that cow to a robot which transfers milk to a bulk tank. Current main bf404a2 is PR89; its postmerge regression39449603350 is SUCCESS. Design-only branch codex/cow-courtyard-20261020 records the specification and proposed supply/tank defaults. No product implementation or new merge authorization. Cow milestone first; all remaining species remain explicitly in rollout scope. See docs/superpowers/specs/2026-10-20-cow-courtyard-robot-design.md. Generated concept4 is a direction, not validation evidence.


## Cow design approved; implementation plans — October20
Owner Yes at2026-10-20T11:14:27-05:00 approves concept4/specification and shared feed30,water12hours,robot12seconds,tank50gallons,existing5cow cap/rates/prices. Two linked plans cover cow robot/courtyard and subsequent all-animal physical care. Plans self-reviewed for interfaces, save/queue/quality/XP safety, original tests and actual rendered evidence. Native execution by sole lead follows existing repo instruction; no independent audit claim. Product code remains unchanged; plan review is the next gate, no new merge approval. Branch codex/cow-courtyard-20261020 is the single build thread.


## Cow courtyard implementation checkpoint — 2026-10-20

The owner approved the concept4 specification and the implementation plans
(Yes11:14:27, Good11:52:40 America/Chicago). Work continues on the existing
`codex/cow-courtyard-20261020` branch. Main remains
`bf404a2a1261f3c7581025b249f2bd00c4539964`; no cow merge/deployment is authorized.

Source checkpoint remote`ec84291554cf359b9a8e60a26cfc1d404bb63c12` has the same
tree`1ff4de350bec2a99e9787a12649edf31719d3dbc` as local`618c736b93f94350d2b76cd1f44ecd840ec45e31`.
Authenticated tree-equal publication preserves local commits because shell git
push has no credentials. Do not reset or recreate this implementation.

85 focused checks pass locally. Completed accounting covers stable IDs, supplied
cycles, a manual FIFO robot ledger, exact tank/XP credit, writer3 protection and
legacy paid timers. The scene prototype adds five beds, stocked stations, directed
trips, opt-in folded-leg poses, and robot/tank controls. Pure/model tests include
actual skin contact and all five bay center paths through actual model geometry.
No accepted ordinary cow gait/anatomy file was changed.

Native diagnostic39464917356 passed35 domain tests but stopped at an event popup;
39465733521 passed37 domain tests and real feed/water touch, then selected the
tank rather than the ready cow. Both original artifacts/logs are preserved. The
corrected source is awaiting a hosted runner; no full robot, three-viewport, cloud,
offline, GPU-rebuild or final full-suite pass is claimed. Local Chrome launch is
blocked by OS sockets; browser installation success did not establish a pass.

See[COW_COURTYARD_REVIEW.md](COW_COURTYARD_REVIEW.md) and the current state JSON.
Continue native qualification, correct proven failures without weakening tests,
then present an actual preview for owner acceptance. Remaining species follow
the approved separate physical-care plan after the cow gate; they are not done.


## Cow courtyard checkpoint — draft PR90 / October20

Owner approved both implementation plans. Draft PR90 uses the existing branch
`codex/cow-courtyard-20261020`; published checkpoint `ef24375a` has tree
`dace967670746c6fd6b9e7be253fe78423b741cb`, identical to local`1d7951d`.
Main remains `bf404a2`. No cow merge/deployment approval exists.

Earlier source2033544 passed actual844x390 supply/Milk/dock/service/tank/exit/
pickup and installed52to53/cached29 refusal/offline paid-readiness evidence in
run39469981279; artifact12287191813 digest
`af04c7274a890c398e878d6596de7aab04b18e87681ecd14ff23d160cab1d5de`.
This supersedes the earlier statement that no complete native trip had passed.

The expanded checkpoint adds five-cow supply/bed/FIFO tests, covered feed row,
three High/drawingPR1 real-time viewport jobs, interrupted-job offline recovery,
actual normal-composer pose captures and20GPU rebuilds. Diagnostic39474692376,
regression39474713607, art39474712835 and release39474713100 are being checked.
53 focused contracts passed before publication; full exact-head qualification
is still pending. The chicken job first failed its two VM ray-view checks on a
missing cowYardActive binding, before any native chicken check; the original
assertions are preserved and the fixture dependency is now supplied.

Author self-review reproduced same-count farm recovery retaining the former
cow rig/reservation, and saved layout being applied after the first courtyard
site decision. Both now have regression tests and local fixes; transition15
checks pass. These corrections require a new hosted source checkpoint. No
independent external-agent audit or physical-phone performance claim exists.
Historical wardrobe resource decrease remains unassigned.


## Checkpoint93a47fa results and current corrections

Diagnostic39476066195:390touch/1280mouse, three-size poses/five distinct beds/
20GPU rebuilds and complete installed/interrupted/queued offline checks PASS.
844Ready-cow tap FAIL: naturally moving cow left fixed aim; camera-follow probe
now retains real taps/30s timeout and removes animal-freeze assumptions.
Art39476072800 all3PASS, conflicts39476072859PASS. Authenticated cow upload
and restoration pass in39476072804, then the original25s delayed-start race
hits its original30s load wait; timing diagnostics added without relaxing it.

Correction to earlier clearance diagnosis: clearGrass already uses squares.
Flowers in captures come from separate Phase7M meadow instances. Restore the
original1.85 square grass coverage; the new courtyard-only reversible meadow
clearing hides stems/heads inside the footprint and restores original bytes on
removal. Phase7M geometry/color/placement remains unchanged; its only source
change names stems for this bounded integration, version4 cached in shell53.
Current66focused checks PASS. Fresh rendered/full final-head results required.


## PR90 correction checkpoint — legacy rig fixture and animal card headers

02af01f all5cow diagnostics and scene/wardrobe original assertions PASS. Core
failed1280 distance>0.01 because the fixture's cow was already holding its bed
task;740/844 had incidentally measured care movement. The isolated rig fixture
now releases that reservation/pose and starts its same stroll in the clear aisle.
Actual Beast reproduction is0 before correction and0.883886m afterward; original
120/180 steps, distance agreement, blocked phase and picking/save checks remain.
Native chicken Rename separately timed out30s as its header button detached.
The existing keyed card update now covers all animal-card controls and parents;
station/other trays retain their original paths. Current cache54 is unmerged.
Both original artifacts/logs are verified in cow-native-run17. Hosted contracts
and full next-head CI are pending.02af01f full cloud job was still active before
this checkpoint; do not claim a final Firebase/SDK result. The706 missing-card
tap and older wardrobe cause remain unproven. Keep draft, do not merge/deploy.


The header correction ateda7cef passes actual390/844/1280 cow journeys and all8
real-DOM identity/fallback checks, plus the visual job. Core stopped before its
browser probes: the older isolated weather VM did not bind prepareCowStroll.
That dependency is now supplied using the real helper and Three vectors; both
original weather assertions are unchanged. All57core Node files/60isolated
invocations pass locally, including all4animal-visual checks. Product code is
unchanged by this follow-up. Final exact-head hosted browser/full CI remains
required; do not merge, deploy or assign the old missing-card/wardrobe causes.


## Ready-cow HUD selection correction — final hosted validation pending

Published1d48b8b native844 job118928368954 failed the original30s #cow-milk
locator wait after Ready-cow selection. Artifact12305786160 SHA256
`d65bfc61a238fb2f394a2eb6928e7ab28612b8ea216c691e1ff5b4ad1fa99cd3`
is verified in cow-native-run19/native844-red (ZIP, results, screenshot, trace,
video and full original log retained).61 input/mutation records establish that
trusted pointerdown/up/click reached actBtn labelled Ready cow; each fresh center
hit was empty. There was no blocking modal/seed tray. Original interact rerays
onTap at the old center, missing the naturally moving displayed cow and closing
the tray. This run proves delivered input and the moving-target selection miss.

The bounded runtime correction keeps the displayed cow identity, revalidates its
current visible torso/marker with the existing hitAt and original reach, and
requires the same existing, ready, current-farm cow. Occluded/distant/removed/
spent/former-farm targets remain rejected. It only opens the card; Milk, ledger,
saves/cloud, ordinary gait and geometry are unchanged. Four actual-Three/actual-
handler regressions fail before correction and pass afterward; combined focused
checks35PASS/0fail/0skip, including original seed and chicken input contracts.
Both native journey and30s assertion remain unchanged; the new tests are added to
existing core/domain runners. New-head full hosted CI and actual preview still
required. Older706 missing-card and historical wardrobe causes remain unproven.
Keep PR90 draft/unmerged; physical-phone performance and owner approval pending.


## Owner-approved PR90 merge/publication — October20,18:42Chicago

Owner said I approve after actual mobile preview and25/25successful exact-head
checks. Guarded merge33b6118282f4aebabcc4cc0e56fe82147619aaa4 has exactly
approveda366dbf tree6b59b6e5b33f931774d128b44fb1472ad2158be1; main confirmed.
Pages39516722769SUCCESS. Anonymous HTTP200entry plus9module/page/worker GETs
match approved bytes. Earlier old-entry response before Pages completed is kept
separately. See tests/evidence/cow-courtyard-merge-20261020/receipt.json.

All25premergechecks PASS: core58Nodefiles+5browser suites, cloud22/22+SDK,
real native390/844/1280care/robot/tank, installed/offline/writer barrier, original
scene/wardrobe and chickenRename. First core cancellation and all earlier red
evidence retained; one isolated retry passed unchanged. No test assertions,
timeouts, limits or production files change in this receipt. Owner approval does
not establish physical-phone sustained performance or historical706/wardrobe
causes. Sole-author review remains distinct from an independent audit.

Automatic postmerge regression39516723469 is in progress, not a passing receipt.
Workspace fetched/synced from mergedmain; existing feature branches, checkouts,
all raw artifacts and logs preserved. This evidence branch updates coordination
without changing the deployed/tested tree. Other species care remains the next
approved plan; no new implementation started by this merge approval.


## Northern expansion and seasonal trees — October21 UTC
Owner approved the proposed northern extension with25metres instead of15, and requested seasonal tree leaves with natural autumn colours now. Latest owner screenshot proves the old dairy site is conflict-blocked, not a stale build. Work continues on the same checkout, dedicated branch codex/north-land-seasons-20261021, base33b6118282f4aebabcc4cc0e56fe82147619aaa4. Prior evidence branch00912f2 preserved. Main automatic postmerge regression39516723469 now16/16SUCCESS.
The existing courtyard is translated25metres north into newly usable land; no saved objects are moved. Terrain height is preserved on old farm coordinates, with a smooth flat northern extension. Camera, edit/decor bounds and walking use the expanded area; cow stations, robot selection, approaches and clearings use matching world coordinates. Existing horse/sheep/chicken care, accepted rigs, game rules, economy, save schema and cloud/auth are protected. A new cache55 includes the two new modules and yard2.
Tree canopies, purchased oaks and decorative deciduous trees use the existing season calendar; autumn gold/orange/red/brown, spring/summer greens and winter bare canopies. Pines/Christmas trees remain evergreen. Colours reuse geometry/colour buffers and distant woods stay batched; no added lights or tree count. Actual rendered evidence and phone performance are not yet verified.
New contracts5/5 and integration28/28 passed. Broader probe93 included two old failures (B13 chew fade regex; B16 30Hz terminal phase0.6439902652569154 versus0.6336422291556492); source cow3d.js and these test dependencies unchanged from base. Preserve them separately; do not claim repaired. Two clearing VM-fixture dependencies corrected with original assertions preserved. Full required/hosted gates pending. Sole-lead self-review, no external independent audit. New preview and owner explicit merge gate remain open.


### PR91 runtime evidence and isolated fixture correction
Draft PR91 published cf2cf8983add89a5668a76abd64197468e6c34c8 with treecb837a21bea3525bafee400a9245f508ffc31691, identical to localddd886b7c47731f926ad2459a2fffb3c23d8bd60. All6 cow/land/season diagnostic jobs39521279018 SUCCESS: native390/844/1280 care+robot, interrupted/offline recovery, supported poses/20GPU rebuilds and expanded land/fourseasons/saved-layout reload. Actual day/night mobile/desktop renders inspected; all4seasons inspected.21GPU samples retain321geometries/95textures at drawingPR1. Physical-phone sustained performance remains unverified.
Three initial full-regression jobs stopped on the same test-fixture ReferenceError seasonalLeaves is not defined (blossom,maple,orientation assertions). Original logs retained; the fixture now imports and instantiates the real controller with fall season. No assertions/deadlines changed.49affected local checks PASS; the complete canonical60Nodefiles PASS in259.65seconds. This correction changes test setup and coordination/evidence only, no product bytes. Publishing it will run full hosted gates on the corrected head; keep draft and unmerged until those pass and owner approves. Historical B13/B16 and earlier tap/wardrobe failures remain separately tracked, not repaired by these results.


### PR91 retained station countdown detachment
da5325e final regression chicken job118968541202 failed at740wide final Close after full/repeated egg pickup. Exact error locator.scrollIntoViewIfNeeded: Element is not attached to the DOM. Artifact12311437104 SHA25625de67f53185f581c3b7955f42867f2a94d1714fc9a0e052686ac308d4d630de downloaded and retained. Trace after@call@405 through before@call@413 shows water9h59m->9h58m rebuilding the egg-pallet tray/header/Close during actionability wait; egg12->24/repeated pickup assertions already passed. This establishes a station countdown control-lifetime defect, not historical cow tap/wardrobe causes.
One conditional extends the existing atomic control-preserving patch from animal cards to cow/chicken station cards; labels, disabled/revision attributes update on the same buttons/ancestors, structural changes retain original rebuild fallback. No new interaction design, chicken gameplay, save/economy/auth changes. Native chicken test remains byte-identical to base. Existing real-DOM cow action identity probe adds both station types. Browser qualification pending before any repair claim. HTML network-first entry changes, module graph/cache55 unchanged.


### Owner-requested cow entrance access — October20 Chicago
Owner reports the cow barn faces the back of the main barn on Amber's farm, and narrows this request to cows. Source inspection confirms the legacy south gate z=-7.8 is only1.9m behind the barn rear z=-5.9. Existing PR91 relocation puts that gate atz=-32.8,26.9m clear of the barn. This request additionally reserves4m of open outside approach between gate x=-4.4..-2.1 andz=-32.8..-28.8. The existing site-conflict and edit/decor placement consumers use the same guard; no existing saved objects move or disappear.
New fail-first paid-decoration obstruction regression reproduces the gap on unmodifieda34da33. Minimal guard passes10/10 north-land/cow-yard tests plus2syntax checks; actual-model rays at3heights/3lateral positions clear the entrance. Existing legacy layout/model contracts remain intact. Browser probe adds51actual walker-collider positions across approach/gate, build/decor rejection and identical results after saved-layout reload at all3viewports. Hosted and actual rendered confirmation remain pending on the new head. A partial exact-blob local checkout was recovered after scratch loss; no complete local npm suite result is claimed. Original artifacts and initial failure log retained. Protected game/save/cloud/economy/rig/movement code and chicken coop unchanged. Keep PR91 draft/unmerged pending exact-head CI, owner preview and explicit merge authority.


### Owner-requested stone path to the northern courtyard
Owner asks for a stone path from the main farm to the new dairy. Continue PR91 from exact head76c101ab24cfc36f016d04d1325253095cc57dc8; preserve all earlier branches and evidence. A roughly1.8m-wide grey flagstone path connects the front farm path, passes west around the chicken enclosure, then meets the south dairy gate. Two batched meshes, shared existing stone texture, ground-conforming heights; no lights, save fields, animal movement, cloud or economy changes. Grass/meadow clear only over paving; future building/decor placement protects the path while existing saved objects remain untouched.
Two new contracts fail before implementation and pass afterward; combined27focused Node checks pass with no assertion relaxation. Existing land/season browser probe now checks the entire real walker route, placement protection, identical reload results and actual mobile/desktop path captures. Hosted/rendered validation pending. PR91 remains draft and unmerged. Earlier a34cloud failure retained: test fixture still puts its blocking lamp at old(-8,-10), while asserting the relocated site remains blocked. This path change does not repair or conceal that separate fixture failure.


### Stone preview verified; relocated-world fixture corrections
Final runtime7c2483ac295ec8ebc42d8c850b7700702cb6f4f8 removes only paving-bed polygon depth bias after the first wide captures hid the raised stones. Matched new390/844/1280captures show stone detail at normal wide view. Hosted land/path118984259817SUCCESS:378stones/twodraws,65actual collision samples per viewport,placementprotection and identical reload/layouts. Artifact12312884454 SHA4f5ac1ac0e2065ab757654110bf29f40e52f38b7fd48c493684c9aafb73ba7e2 downloaded/verified, captures inspected. Physical-phone FPS remains unverified.
FullCI separately exposed decor native-drag failures118984294064/118984294103. Both retained traces show start(-17.65,10.37), original input, Can't go here and That spot is taken, so it went back. Catalog844 exact camera/ground ray reproduces an endpoint inside the existing field clearance. New path protection changes the old west-meadow free placement, so the test's formerly free drag area is no longer valid. Test setup now uses open northern meadow(7,-22), adds an actual-ground-ray destination-valid precondition, and retains every original native gesture, movement threshold, ownership/save/reload assertion and timeout. Utility shares this old camera fixture and is updated consistently. Hosted qualification pending, no drag repair claim.
The separate authenticated cow snapshot fixture now locates its deliberately blocking lamp from the current physical courtyard footprint, with a new strict inactive-site/decor-conflict precondition. Real layout proof: oldlamp(-8,-10) yields0conflicts while currentcenter(-6.45,-36.375)yields1decorconflict. All original cloud equality/recovery assertions and timings remain unchanged; no runtime/cloud/auth/save edits. Earlier failure does not establish save-data loss. Exact final-head hosted checks remain required; keepPR91draft/unmerged.


## Chicken physical care Task1 — October20 Chicago
PR91 merged mainfe7af2bae8da8ab18497153965a31e53d4377b4a, tree31f584318e590b4d42ffe23613768065a133757c; Pages39531087042SUCCESS and approved live bytes previously verified. Owner Looks good / All are good is qualitative live acceptance, not instrumented physical-phone performance. Automatic main regression39531089387 now16/16SUCCESS, including cloud118996880368 original recovery checks and actualSDK12.19.0 storageblockedfalse/true. Raw green cloud/chicken logs retained; gate closed before new edits.
Owner selected chickens next with Okay. Dedicated branch codex/chicken-physical-care-20261020 begins from freshly fetched exact main. Existing all-animal plan Task1 only: open the physical coop doorway, continuous supported ramp and straw floor,30 separately reserved resting places, limited feeder/waterer contact slots, species-specific beak/lie overlays, one-way coop admission/exit and distinct safe yard return points. Reuse animal-stations scheduler and accepted chicken contact controller; optional support sampler is off for ordinary ground movement. Existing route planner accepts opt-in transient bird obstacles; default callers retain the same obstacle list and calculation. Cosmetic adapter imports no game/accounting/save API. Game.js/auth/cloud/economy,30cap, existing egg rules and other species rigs remain unchanged.
Six missing-station/pose/support checks RED then GREEN; controller3RED then3GREEN, crowded-spawn return and daytime-nap cases separately RED then GREEN.90focused motion/care/coop/cow/cache checksPASS before the last two controller edge additions; final controller/stations11/11PASS. All original assertions/limits preserved. Added straw initially exposed31draws against original30draw limit; ramp treads share its wood batch, retaining the original30draw limit unchanged. Full Node sweep still running and browser render not yet inspected: no complete qualification claim.
Cache56 and matching module revisions include the new cosmetic adapter/support rig. Existing installed-update fixture expectations advance to cache56/current modules with every original gesture/hash/save/recovery assertion unchanged. Hosted three-viewport diagnostic covers approach/contact/ramp/30sleep/wake and actual guest reload/offline paid-state equality. Local browser remains socket-blocked; do not relaunch unchanged. No new PR/merge yet, actual preview and final-head CI still required. Preserve all retained failures; historical cowtap/wardrobe causes remain unproven, B13/B16 separate. Sole lead/self-review only, not independent audit.

### First chicken native failure and bounded correction
Owner instructed Merge when ready; preserve as conditional authorization, not a completed merge or a passing readiness claim. First exact2e67daa diagnostic39536113001 failed at all3sizes: feed/drink actual beak contactPASS, then Physical chicken goal ramp not reached. All3ZIPs downloaded and API SHA256 verified under chicken-physical-run1; raw logs, original trace, failure state and captures retained. Inspected844trace has no console errors. Real30bird positions reproduce locally; original assertion preserved.
Cause: transient waiting birds were padded rectangles. A starting point outside actual circular0.34m clearance could be inside a padded rectangle, causing the planner skipA mechanism to ignore that blocking bird. Optional circle descriptors align planner intersections/start classification with unchanged movement clearance, and initial care routes include waiting birds. Static/default callers retain old calculations. Original dense-grid and observed30bird regression nowPASS, including full static farm obstacles and yard fences;20/20controller/station/cache checksPASS. No test assertion, timeout or physical clearance threshold weakened.
Initial feed/drink screenshots show poor camera framing (animal occluded/off-frame), so they are not accepted preview evidence. Fixture camera now aims at the actual hen; failure receipt also exports full blockers/path state for causal diagnosis if needed. This is separate from the proven runtime flock blockage. New-head hosted/rendered qualification remains pending, no merge yet. Local full Node sweep completed63files/66isolatedinvocations; final controller/station11PASS supplements later nap change.

### Retained second native neighbour corner
Diagnostic39537023176 on3524610 reaches actual feed/drink, ramp and3beds at all3sizes, then another hen blocks. Full original artifacts downloaded and SHA256 checked under chicken-physical-run2. Full failure receipt now supplies all59farm blockers, positions, path and reservations. Hen4 is0.252m from one existing ordinary neighbour and0.345m from another. Only perpendicular sidesteps cannot increase the existing overlap while clearing the other bird. New fixture replays exact state and fails unchanged at30Hz; bounded steering using64precomputed directions passes at30/60/120Hz with original0.34m clear predicate and0.65m/s speed unchanged. Original dense/capturedflock cases alsoPASS. No test assertion/time/physics threshold weakened.
The new feeding capture now visibly shows the actual beak at the grain ring. Ramp capture instead shows existing bush occlusion from the chosen west camera; capture camera moves to the clear east side, no scenery removed. All30sleep/wake/reload/offline and final-head full CI remain pending; no merge-ready claim. Owner conditional Merge when ready instruction retained.

### Third native sleep proof; retained wake/access/lifetime corrections
Diagnostic39537703228 on46c80ad passes real feed/drink/ramp and all30separate settled beds at all3sizes. All3 then fail original Physical chicken goal awake not reached. All3ZIPs downloaded/digest checked and rawlogs preserved under chicken-physical-run3. Actual ramp/interior captures inspected: genuine supported ramp approach and30crouched hens; old emote sprites stay visible because early care return skips the generic timer. No concept imagery.
Wake state retains hen13at[-11.00500574569558,.48782562584370187,.9134523170014028] targeting an ordinary yard point: a ground return path re-enters raised ramp access then cannot leave its edge. New regression reproduces that unauthorized climb; root/foot support and collision carve now opt into explicit elevated bed legs only. Additional observed ground oscillation is removed by retaining a safe detour briefly, with the same clearance/speed. Wake admission priority keeps newly requested cosmetic visits from blocking departing sleepers, resumes afterward, and preserves the original all30awake/zeroreservation assertion. The real emote lifetime is updated during care. Three new checks RED before implementation; combined24/24PASS after correction. No assertion/time/physics tolerance weakened; no paid timing/supplies changed. Original browser awake/reload/offline assertions remain untouched. Full browser and final-head release qualification still pending; conditional owner merge permission retained, no merge-ready claim.

### Ground collision carve authorization and final qualification preparation
Fourth run39538819572 on99f2c4 again passes real30beds but fails awake. All3ZIPs/API digests and rawlogs retained under chicken-physical-run4. Retained hen17 is on ordinary ground inside old ramp guard, with no nearby birds and a free final destination. Prior support gate prevented raised climbing, but flat entry strip was still carved for unrelated ground targets, inconsistent with planner obstacles. Carve now opens only for explicit elevated bed access, the real rampStart waypoint or southward outside-access waypoint. New retained ground-guard test RED -> full25checksPASS; no speed/clearance/timeout/assertion changed. This closes support AND collision authorization, not an assertion workaround. Original native all30awake/zeroreservation/reload/offline checks remain intact.
Preparing exact-head final qualification: native3viewport plus6cowdiagnostics on this branch, PR regression16/art3/conflicts1. No new functionality, no deployment or merge-ready claim until green and actual final renders reviewed. Conditional owner Merge when ready instruction permits merge after readiness; this is not a claimed separate physical-device measurement or historical-failure fix. All prior artifacts/workspaces retained.


### Owner revision — larger two-door coop, October21 Chicago
Owner requested a larger coop with two usable entrances/exits, superseding the earlier single-lane design. Continue PR92, draft and unmerged, from a4d1e76; fresh mainfe7af2b unchanged. Floor grows about42percent, two supported ramps and real openings serve15beds each, with exclusive lanes allowing concurrent entry/exit. Waiting birds physically yield. Built-in feeder/waterer move slightly within the yard so both ramps and every supply place remain reachable; paid/save rules are unchanged. A chicken-only bounded ground fallback validates the generic planner's endpoint-overlap shortcuts; other animals/default routing stay untouched. Original speed/clearance and all browser assertions/deadlines remain unchanged.
37focused checksPASS, including both real door openings/visible ramps, full30sleep/wake/concurrent occupancy, original and second-bedtime crowds, all supply slots, appearance/disposal/budget and cache. The original15s single-door ground-return reproduction keeps its frozen original world/source; the new larger world is tested separately end-to-end. Evidence in tests/evidence/dual-door-coop-20261021. Protected9runtime files match main exactly. Cache57/yard4/controller2 align.
Previous exact-head qualification finished25SUCCESS/3nativeFAIL/1coreCANCELLED. Core log shows20minute job budget cancellation during last settings browser, not a passing full suite. Existing63Nodefiles and5browser probes now split across two20minute jobs; bare runner still executes both. New total30required jobs, no assertions/limits/tests removed. Actual final native mobile/desktop previews and full CI remain pending. Owner conditional merge instruction retained, no merge/deploy/readiness claim.


### Two-door native proof and final clearance correction
Run39590490025 onaa94a24 all3viewportsSUCCESS: actualfeed/drink,concurrentexclusive entry/exit,30sleep/wake,secondbedtime,nightreload andinstalledofflinepaidstateequality. All3ZIPs downloaded and SHA256 verified under dual-door-coop-aa94a24. Portrait actual interior inspected; front camera was inside existing leaves, so capture moves insideyard/widerportraitlens only. No scenery hidden or generated preview.
Self-review actualskinnedboundsprove0.06277m intrusion at rightmost bed. New realskin-vs-wall ray testRED, coopbody shifts0.3m east while bed/door/ramp worldcoords stayfixed; support/footprint/awning/fallbackalign.38localchecksPASS, oldassertions/limitsunchanged. Nativepetview Node setup failed its outside-stations precondition before browser: largerdepth left originalstagedbirds0.25mfromguard against0.30mrequired. Stagedpositions move0.1m south; bothoriginalnegative/positivevisibility testsPASS unchanged. Originalfailurelog retainedremotely job119189948005; no gameplayselectionrepairclaimed. New-head full30gates and actualpreview stillrequired; no merge.


### Retained north-yard return and minimum wall correction
Run39591147626 on366aab7:390SUCCESS,844/1280FAILoriginalawake. All3ZIPs/API SHA verified and extracted under dual-door-coop-366aab7; consoleempty. Active29targets[-7.088880707500912,0,-5.217853876912522], targetitselfclear/no nearbybirds, but0.3mcoopshift narrowed routebesidebarn to0.04m rootgap. New exacttarget60sgroundreturn testRED with rootzero/speedbound. Minimum0.1mshift leaves0.037m actualskinnedwallmargin and0.24mrootpassage; newcaseandall41layout/controller/pet/cache checksPASS. Door/ramp/bed coordinates/cap/savesunchanged. Originalnativeawake1800ssimgoaluntouched. Clearfrontcapturestillpending: previoussouthcamera leaf-occluded; nextcamerauses previouslyclear ramp-side position aimedbetweenbothdoors with wideinspectionlens. Finalsource native/full30CI stillrequired, no merge/readinessclaim.


### Active build conversation recovery — October21

Owner transferred the active Sunny Acres build conversation and authorized bounded A–F continuation of PR92, with actual preview before merge. GitHub main remainsfe7af2b; PR92 recovered headab61c9a already contains the larger two-door coop. Original local worktrees and evidence are preserved; they are not assumed transferred/current. No other project writer/test process observed within this container; external chat activity cannot be conclusively inspected. New isolated clone follows the existing PR branch.

Exact-head physical run39595818908 is844/1280PASS and390FAILfirst admission. Verified original390 ZIP SHA256e888c08a4aae57e225dfd9130a6ae5cc7738e2183145324060b3a5e24ccac59d; full original state retained. Reconstructed full-world crowd fails with858replans. Proximity-only yielding leaves a waiting bird blocking the feeder-side corridor; test-only relocation of that bird proves causality. Candidate uses forward-route yielding without relaxing0.65m/s,0.34m clearance or1800s goals. Extended cycles separately expose non-yielding already-departed idle birds, then a legal narrow north strip outside the grid; each has an isolated RED and targeted GREEN. Physical idle yielding creates no station/save/production state. Bounded corner visibility connections preserve collision checks. Full repeated cycles are still active at this checkpoint. Cache58/controller3 align.

All63 canonical Node files passed before the final idle/boundary amendments; first browser suite cannot launch because Chromium is unavailable. Browser download returned HTML rather than a ZIP. No full local-suite claim; exact-head hosted qualification remains mandatory. Prior-head real390/844/1280 images inspected: two supported doorways visible, thirty separate positions visible inside. These images predate the routing amendments. No visual approval or merge/deployment claimed. See COOP_RECOVERY_20261021.md and retained evidence.


Recovery result: all39focused checksPASS, including all30birds through three sleep/wake cycles at30/60/120Hz and the preserved original second bedtime. Self-review found the new idle traffic path could freeze a pet/emote timer; exact RED and3targetedGREENs preserve existing aging. No unrelated model/game/save/rule changes. An empty care queue bypasses idle-traffic scanning. Final combined41checks running; actual new-head hosted validation/preview still pending.


Final local checkpoint: combined41/41PASS plus mixed daytime nap entry/waking exit1/1PASS. The short-circuit initially used door-lane occupancy; two retained forced-exit tests caught that assumption. It now checks the empty care-task map, preserving those tests; red and targeted/full green logs retained. Original assertions, tolerances and deadlines unchanged. Nine frozen runtime files byte-identical to main. Previous ab61c9a hosted total is29SUCCESS/1portraitFAIL, superseding earlier running counts. All30new-head jobs and fresh actual preview remain required. No owner visual acceptance, merge or deployment.


### Tablet wake failure — nap intent crossing nightfall

Owner repeated When ready merge in the active conversation. Actual9303c2a preview shown; all3phone/desktop physical runsPASS, archivesSHA-verified, rendersinspected, syntheticmergetree=headtree. 25of30canonicaljobsPASS/5running at this checkpoint, but extra pinned768x1024tabletFAILawake; no merge. Run39601313812/job119226239552/artifact12346352907 SHA2565c746673a3a47fc34ea5c3d19fb6a8305128937ec0516ffce3cea0a2d714bd76 retained, consoleempty.

Existing day naps retained nap=true overnight; the wake barrier only includes non-naps. New generation46–87 feed/nap admissions reopen while original sleepers still depart, causing competing internal routes. Isolated day-to-night testRED. Three-line production correction promotes bed intent at night/wet; existing barrier now includes the full overnight flock. Local43/43PASS, including original queues and three cycles at30/60/120Hz. Physical browser now settles an actual daytime nap before first night and asserts promotion, without removing earlier assertions or changing deadlines. Cache59/controller4 align. Prior head greens are historical; all30new-head checks and pinned tablet must pass before the authorized merge. Original failure trace/log/results preserved. No independent audit or physical device test.


### Owner-requested double cow room — October21

New cow-only milestone from freshly verified maind040783. Northern floor88.06→176.12m²; connected cow-width walking area24.85→95.85m². Five rear beds and an open aisle replace side-bed obstruction. Moved fixtures retain contact/navigation/docking alignment; stone gate, existing land and paid state preserved. Final46focusedPASS, including actual standing-skin turns, three full-herd care/sleep/wake cycles andFIFOrobot requests. Same-frame bed-release sleeping state has isolatedRED and one-line cow-onlyGREEN. Original failures retained; see COW_ROOM_20261021.md.
Earlier64-file Node sweepPASS before last navigation amendment, then final46PASS. Exact-head hosted checks and actual four-view preview remain required. Local browser unavailable; no physical-device or independent-audit claim. DashboardPR93 disjoint/untouched. Prior chicken-only merge permission is not cow-room merge authorization. No cow merge/deploy.


### Native desktop slow-frame checkpoint

Originale1c2889 has22/33hostedPASS, one native1280FAILrobot arrival, ten still active at amendment preparation. Allfour visual viewportsPASS three cycles; archivesSHAverified, actual390/844/768 renders inspected; desktop render artifactPASS but inspection pending. Those are prior-head receipts, not qualification of the next amendment. Main advanced tobe8babf by dashboard-onlyPR93; head and syntheticmerge c357f6c have identical farm3d subtreee385baa. No dashboard changes made here.
Native failure run39618559323/job119285608808/artifact12354227104 ZIP SHA2563f228f503a0ca2d71f0a9746076b297ce555676d1bdf2bfdaa66c1fad70bd10c retained. Cow stillapproaching at[6.975,.08,-33.86], no site/ledger error. Actual draw interval about2.3s. Existing aggregate1s cap integrates only0.8m on a2.5s visible frame; isolated paceRED and exact60s/2.4s-frame routeRED reproduce this. Remove aggregate truncation while retaining0.8m/s,1/30s physical substeps and zero-dt hidden-return discard. No browser assertion/deadline or body clearance changed. Final48focusedPASS, including all original tests and hidden-return proof. Requalify exact new head in all33jobs; no merge or owner visual approval claimed.


### Offline snapshot clock correction

05f5729:22/33PASS,1persistenceFAIL,10active at test-only amendment preparation. All3real-time native runsPASS, including original desktop60s robot deadline. Allfour actual visual viewportsPASS three cycles, archivesSHAverified, actual renders inspected and final-production preview shown. These are prior-head receipts until exact new qualification completes.
Persistence run39620308177/job119291711375/artifact12353779330 originalZIP SHA2561c12ddd8c916006d26b05b1b50d66d05a0e3e039eb8fa2b51730bfc21f56c069 and full failure log preserved. Installed-update scriptPASS. Recovery snapshot's prior11999ms boundary/milk/XP checksPASS; expected exiting job already null after slow boot draws. Real-controller proof: same credited job walks6.75m and clears during three3s visible frames; with0dt paused it retains exiting and identical milk/XP. Thus the shot sim0 fixture did not actually freeze startup animation time.
Test-only correction freezes performance.now in this snapshot fixture, while retaining its Date.now offline advances, every original stage/credit/save/receipt assertion and deadline. All other native/visual tests use normal clocks. No runtime/save/auth/ledger or production movement change in this amendment. Final49focusedPASS. Requalify all33exact-head jobs; keep draft/unmerged pending gates and owner cow decision.


### Remaining chicken interior route correction

At ed77784, 31 of 33 hosted jobs passed, physical844 failed, and cloud regression remained active when this amendment was prepared. All nine cow jobs passed, including all four real render viewports, all three native input viewports, installed/offline recovery and land/path/seasons. These prior-head results do not qualify this amendment.

The original physical844 artifact12354903207 (SHA256878a6148ad052afcc95fb497d13f6b382e853d6dc8259fe24411bd322bf24527) captures hen8 assigned free bed0 while its intermediate interior waypoint is occupied by sleeping hen2 in bed4. A read-only mainbe8babf reproduction retains the same failure through the original1800 simulated seconds; no cow code is involved. Baseline proof, original log and state are preserved on evidence/cow-pr94-ed77784.

Original owner instructions explicitly authorize chicken queue/routing repairs and repeated-cycle verification. That authority persists; the earlier interpretation that another scope approval was needed was corrected. This introduces no new animal feature and implies no cow merge permission. The minimal controller correction bypasses only an occupied intermediate raised-floor waypoint at the same height, retaining final docks, doorway/ramp height transitions, physical steering, original speed and body/wall/support clearance. The sleeping bird remains stationary.

New exact-state two-bird RED becomes GREEN; complete captured30-bird replay reaches30 unique beds. Full original controller/station/yard suite42/42PASS, including repeated cycles and mixed nap/wake tests. Focused cow/cache checks49/49PASS. Original assertions and deadlines unchanged. Cache61/controller5 align. Chicken controller is the single explicitly authorized protected-file exception; the other15 protected files remain byte-identical to base. All new-head33 hosted checks and fresh actual previews remain required. Keep draft/unmerged until gates pass and owner reviews/authorizes cow PR94.


### Cow waiting traffic after a full waking period

Fresh5a38507 portrait visual failed its unchanged second-bedtime assertion. Original run39625972375/job119311194975/artifact12358160671 ZIP SHA2564d5820e87209d108899c978367bfec6e60b11c18f6690bdbae1fd4a3917a0824 retained with trace/results/log on evidence/cow-pr94-5a38507. Original result does not include internal cow state; its exact final state cannot be reconstructed from the screenshot alone. Added failure-state recording for future visual runs, without changing assertions/deadlines. All three physical chicken jobs passed on that head.

New seeded actual-Beast reproduction extends wake sampling to the visual fixture's full40 simulated seconds, preserving its500s per-bedtime deadline. Seed1 stalls on third night: cows waiting for another station remain at both released feed docks, blocking assigned entrants. A test-only counterfactual moves only unreserved dock blockers out of the way, preserving care/scheduler state; all five then settle. This establishes the local mechanism; matching it to the original portrait failure remains an inference.

Dock-only waiting clearance passes seed1 but seed4242 exposes a waiter in the cross-aisle between active feed/drink routes. Both REDs retained. Final bounded cow-only waiting behavior finds a legal point clear of station corridors AND active directed routes, then calls existing normal walking; it neither teleports nor claims a station nor changes saved state. Four seeds (1/4242/21/390), three nights each with full40s wakes pass unchanged500s limits. A focused physical waiting check asserts normal walking, no position jump/reservation/save mutation. Full focused suite51/51PASS. Cache62 aligns. Chicken controller is unchanged from5a38507 (three hosted physical viewportsPASS); care/ledger/rig/auth/land/path/seasons remain untouched.

Fresh33 exact-head hosted jobs and four-view renders remain mandatory. Keep draft/unmerged pending completed gates and owner cow visual/merge decision. No unrelated features or weakened assertions.


### Owner combined remaining-care instruction — October21
PR94 is merged/live at393cb84; final publication evidence621e449 confirms33premerge/17postmerge/Pages3PASS. Owner now asks horses, sheep and dog/cat physical care together. Isolated main-based branchcodex/remaining-animal-care-20261021; old work/evidence preserved. See REMAINING_ANIMAL_CARE_20261021.md for checkpoint acceptance. Existing economic/save/auth contracts and accepted rig geometry stay unchanged; care collision/pose integration is within this instruction. Actual combined preview and owner release gate remain pending.

Implementation checkpoint: dedicated remaining-care layout/yard/controller/pose modules integrated; cache63. Baseline64NodePASS, focused47PASS; expandedthree-night30/60/120Hzcontroller and cow-focusPASS. Full local diagnostic sweep active, but source amendments during it mean it is not exact-source qualification. Scenery ownershipRED/GREEN preserved. Local Chromium unavailable; first four-view hosted/native/recovery qualification pending. See REMAINING_ANIMAL_CARE_20261021.md. No actual preview or release approval claimed.

PR95 initial81dbc4c remaining-care4FAIL at boot: cat site overlaps unchanged board. Original4archives/API digests and full logs preserved; full-world regressionRED/GREEN moves new pet furniture behind barn without moving existing objects. Separate final-stand-frameRED/GREEN enforces standing before exit. Actual feeding motion/head-skin checksRED/GREEN. Corrected focused43PASS; completed69-file mixed-source local sweepPASS, not final-source qualification. Initial other hosted gates still active; publish corrected source then requalify. No release/visual approval.

Corrected local checkpoint: retained dog/cat cornersRED/GREEN via continuous visibility; terrain/root, ordinary rest/drink, occupied-target backoff and overnight-exit priority eachRED/GREEN. Complete actualBeast/rig2seedsPASS:3nights,40swakes,all9paidfeeders. Combined82checksPASS; final real gate/approach17PASS. Original4+3failures/logs/digests preserved. New-source actual4-view/native/installed62→63/offline qualification next; source cache63 nav1/layout2/yard2/controller2/pose1, protected20files byte-identical393cb84. No final preview/approval/release claim.


Third dd1c6c9 remaining-care run39681678748:390/768/1280PASS;844FAILafter all3complete sleep/wake/40sdaylife cycles at second native action. Original trace/screenshot prove horse infoTray remains open after G.close (which closes only game panels), covering sheep torso on short landscape. Test now uses existing visible native Close button before aiming next torso, waits for hidden tray and verifies DOM canvas receives the tap; every original feed/Pet/paidvisit/reload/offline assertion and deadline retained. Production runtime bytes unchanged. Original844ZIP SHA256 ed1b9607a3c51058b88ae5955155f0d5b3c1d077ac6103846e7eb881b920fcb2 preserved. Actual desktop feed/beds/pets inspected; final exact-head all37 and installed62→63/offline still required. No release or owner visual approval.

Self-review partial-pet fallback: dog-active/cat-obstructed (and reverse) hid the legacy shared bowl used by the obstructed pet. Real syncRemainingCareYards RED proves it; one bounded visibility/collision condition now retains that original bowl whenever an owned pet remains on fallback care. Both asymmetric cases plus all-active pass; integration/protected3/3PASS. Runtime amendment is this single condition only; tested maximum-ownership render geometry unchanged. Cache63 remains unreleased. New exact-source all37required, no owner/release approval.


Final native-input checkpoint: d4ccb34 remaining-care390FAILfirst horse native selection after all3cycles/40swakes;844/768/1280PASS including installed62→63/offline on844. Original390ZIP SHA25677d443e2dc1cff95f9361a666edc4c0cd869135a999c67277ab4dcd081d13efb and fulltrace/log retained. Trace touchscreenTap roundtrip650ms versus450ms game quick-tap guard; original delivered event interval was not recorded, so timing as its exact cause is an inference. Isolated diagnostic ebd83a7/run39685567990 preserves exact d4ccb34 production bytes and all assertions: explicit native Chromium50ms touch gesture, actual trusted down/up events measured at the game's handlers, no synthetic DOM action/clock change. Both390and844completePASS; observed handler intervals0.6–56.9ms, event timestamps50ms apart. Same native Close control and real ray/DOM hit preconditions remain. Final recipe adopts this specified quick gesture, with new isTrusted/duration assertions; all paid-action/cost/contact/500sim goals and reload/offline checks remain.

One separate d4cow844job119516196325 failed before game launch: Chromium CDN returned certificate *.azureedge.net for cdn.playwright.dev, while eight sibling installers succeeded. OriginalZIP SHA25602902dd07ad33e0aec470cf0e8ad6a2fae4a0e7e0232e0d241c3d3da86dfd58a and fullrawlog preserved. No TLS bypass/dependency/assertion/deadline change and no standalone retry. New candidate qualification uses fresh standard runners. Obsolete pending qualification may be cancelled automatically by the existing concurrency policy when superseded; no cancelled/old-source result qualifies this candidate. All37fresh gates required. Runtime remains exact d4ccb34; all20protected files exact393cb84. No owner release/visual approval or merge.


Final-head checkpoint2a8a64d/tree77d5e45, syntheticmerge8b23abb samewhole tree. All4care viewsPASS; original4archives downloaded/API SHA256verified, actual390/844/768/1280renders inspected and final4speciespreview shown. Three nights/full40swakes each, actualtrusted Feed-all/Pet,all9paidfeedervisits, nightreload/installed62to63/offlinepaidstate equality and11beds844,20GPUrebuilds1280 allPASS. Cow9 andchicken3PASS. Broader qualification remains active; all37mustfinishSUCCESS. Soleauthor/selfreview;physicaldevices untested;ownerfinalvisual/releaseapprovalpending. This evidencebranch doesnotchange reviewedPRruntime.


Final qualification complete:2a8a64d/tree77d5e45, syntheticmerge8b23abb identicaltree, main393cb84unchanged. All37exact-headcheck-runs completedSUCCESS (0failed/0active);72Node filesPASS; cloud22/22andactualSDK12.19.0storage false/truePASS. Four actual care archives SHA256verified, four views inspected, final combined preview shown; all10preview/evidence saves succeeded. All27runtime digests frozen;20protectedfiles exactmain; no unrelatedproject change; originalworktrees/untrackedchickenproof preserved. Soleauthor/selfreview;emulatedphone/tablet,physicalperformance unverified. PR95remainsdraft/unmerged. Ownerfinalvisual/releaseapproval is the onlyremaininggate. No build/test process or automation active. After approval: merge frozenhead, verifyPages/livefilehashes and all17postmerge gates. Separateevidencebranch changesnotes/receiptsonly; no claimofowneracceptance ordeployment.


### PR95 owner-approved merge — October21

Owner replied **Merge** after the final combined preview and explicit approval question. Exact approved2a8a64d and unchanged393cb84 base were rechecked: all37actual checks completedSUCCESS. PR95 marked ready and merged with expected-head guard at1115f93101a0e86fdcc9780e053c17b73dd6dac5. Actual whole tree77d5e45 equals approved head and reviewed synthetic merge. No source amendment. Automatic Pages39691471875 and main regression39691472556 are active; one read-only monitor verifies27live runtime hashes plus plain entry. No duplicate hosted test, physical-device test or independent audit. Publication verification remains active, not complete. Latest frozen qualification remains on evidence/remaining-care-pr95-2a8a64d atc73c1fd; this notes-only publication branch preserves production bytes.


### PR95 publication complete — 2026-10-22T00:02:44.945352+00:00

Owner-approved2a8a64d merged at1115f93; actual whole tree77d5e45 equals approved head. Pages39691471875 all3SUCCESS; main39691472556 current17/17SUCCESS,72Nodefiles and cloud22/22/SDK12.19.0storagefalse/truePASS. Original cloud119538430164 failed before tests at Chromium CDN wrong-host TLS certificate; full raw log SHA256b15cc28364c3e7d3402a8561d8bf604b1b077bfb06824c47cebfcc9044945585 retained, no artifact produced. Identical pinned download succeeded on sibling/premerge; one cloud-only fresh-runner rerun119546968464 passed unchanged source/dependencies/TLS/assertions/deadlines. GitHub carries16successes forward; their cloned check metadata is not16new executions. No full-workflow retry.27live runtime digests and plain entry exact. See PR95_PUBLICATION_1115f93.md and publication/final-publication.json. This notes-only receipt branch retains merged runtime; source main does not gain unqualified receipt changes.

Owner next requested player-expandable pens, add/adjust fence and movable animal buildings. Read-only discovery recorded in publication/owner-next-feature.json. Existing Edit mode covers production buildings/trees/decor; animal layouts and care docks use fixed world coordinates. New feature needs shared saved layouts and coordinated geometry/collision/station/routing updates, not merely decorative fences. No new-feature runtime/save/backend changes or release approval. Design review is the next action. Emulated views only; no physical-device performance or independent audit.


### Player-editable pens — conversational approach approved, written specification ready

Owner replied **yes** to the Edit-mode design: expandable/adjustable real fences and gates, movable animal buildings, Apply/Cancel, working care routes and saves. This is approval of the conversational approach, not of a written specification/implementation plan that did not yet exist. Fresh main remains1115f93101a0e86fdcc9780e053c17b73dd6dac5 (PR95 merged/live; previous publication receipts on evidence/remaining-care-pr95-publication-20261021 at2f0e9cc).

Isolated notes branch `docs/player-pen-editing-design-20261021` contains `farm3d/docs/superpowers/specs/2026-10-21-player-editable-pens-design.md` and the checkpoint at `farm3d/tests/evidence/pen-editing-design-20261021/checkpoint.json`. Written design covers free bounded fence editing, component moves without model resizing, coherent saved-layout/scene/collision/care updates, writer4 protection, invalid/storage/crash recovery and full46-animal repeated-cycle acceptance. Key inspection findings: convex-only containment; cross-component merged meshes; accepted horse corners outside ordinary onFarm24; scheduler snapshot/restore and existing writer3 compatibility contracts. Default farm/rig/economy/auth/path behavior remains protected.

No product code, migration, dependency or test assertion changed. No new CI/runtime test or automation started. Old untracked chicken proof and pending remaining-care evidence preserved. Sole-author design self-review only; no new physical-device or independent audit claim. **Next: owner review of the written spec, then written implementation plan/review.** No pen-editor merge or deployment authorized. Latest current state is this section/AI_RELAY_STATE; earlier PR95 pending snapshots remain chronological evidence.


### Player-editable pens — written design approved; implementation plan ready

Owner replied **“I approve”** to the written design review question. This explicitly approves the specification at `a2f0b8c5faa09fe5da96f35e4609185ffd1ace2c`, SHA256 `f4b6339878861b8423e6c5965005eafc666383d7926c2ab03f8e8c636763ba49`, and the next planning step. Earlier pending-spec wording above and in the frozen spec/checkpoint is historical, not the current approval gate. No repeat specification approval is needed.

Fresh main remains `1115f93101a0e86fdcc9780e053c17b73dd6dac5`. Dedicated docs branch `docs/player-pen-editing-plan-20261022` includes [the implementation plan](docs/superpowers/plans/2026-10-22-player-editable-pens.md) and `tests/evidence/pen-editing-plan-20261022/checkpoint.json`. Nine checkpoints specify bounded saved templates/concave geometry; complete land/route/support/staging validation; relocatable functional assemblies; preserved care reservations/gates/robot stages; atomic writer4 failure recovery; draft gestures; trusted native editor integration; all46-animal/recovery/cloud/resource tests; and exact-head visual/release/publication gates. Execution method stays native sole implementer; no subagents or independent audit.

Workspace maintenance removed prior local checkouts. The committed design was recovered from GitHub into a new clean checkout with matching hash; old untracked scratch proofs/logs are inaccessible, not automatically transferred. Committed publication/failure receipts remain on the recorded evidence branches. No competing local test/writer or new remote pen-editor implementation branch observed; external chat activity cannot be conclusively inspected. No runtime files, migrations, assertions, dependencies, build/test runs, CI, monitors, automation or deployment changed/started for planning. Documentation/JSON/diff integrity self-review only.

**Next: owner review of the completed implementation plan, then native execution after fresh-main/writer preflight.** The writing-plans skill requires review before implementation. Written design approval does not approve an unseen implementation plan or future edited-game visuals/release. Keep PR95 publication complete and other projects untouched.


### Pen editor execution approved — Task1 foundation

Owner replied **Yes** to the completed implementation plan at `a1c583b`; approval is recorded and native execution continues without per-task permission prompts. Fresh main still1115f93. Isolated `codex/player-pen-editing-20261022` worktree preserves planning checkout. New pure modules freeze accepted PR95 templates, decode bounded custom records without data loss and implement continuous concave containment/projection. Default factories/game imports/worker/ledger/rigs remain unchanged. Baseline72NodefilesPASS; focused36checksPASS at final Task1 verification. No integrated pen UI or new rendered/device result is claimed.

Original RED logs retained under tests/evidence/pen-editing-implementation/task1, including waiting-position double translation and negative-clearance projection. Both received focused RED→GREEN corrections; initial payload-fixture sizing mistake is recorded, with exact32769/32768byte tests now in place. Plan ledger is mirrored in task evidence; new failures are never overwritten. Next: Task2 complete land/shape/support/staging/route validation; then continue approved plan. Visual/release gates remain later; no merge/deploy.


### Pen editor Task2 pure preflight checkpoint; physical gate still open

35pure layout/geometry/validation checksPASS, including all46distinct placements, both coop doors entry/exit route proofs, occupied-bed support-frame preservation, second-edit origin deltas, fallback-site preservation, gates blocked by neighbouring animal fixtures, full-segment/footprint collisions, paid-object/path/land checks and storage-payload limits. Original failures and a V8 performance diagnosis are retained in task2 evidence. Repeated shape evaluation was reduced with safe bounds rejection and per-margin edge caching; baseline proof is about1s with a passing5s subprocess bound. This is not phone performance clearance or physical care qualification. Existing game/index/yard/worker/rig/ledger bytes remain unchanged so far.

Task2 stays in progress for exact rendered assembly footprint/standing-skin/turn/support acceptance; Task3 real geometry adapters are its dependency and begin next. Frozen real-vertex fingerprints and meaningful moved-mesh RED tests captured before factory changes. New World snapshot fields installed/currentLayout preserve fallback policy and use new-minus-installed origins. Source decisions/rulings are in the mirrored progress ledger. No UI, preview, hosted run, merge or deploy yet; continue approved plan without another permission prompt.


### Pen editor Task3 factory checkpoint

Relocatable complete care assemblies, actual primitive envelopes and composable plant clearing implemented. Frozen default mesh fingerprints unchanged;76focused checks and all72existing Node test filesPASS. Local Chromium launch blocked by socket EPERM before page creation; no screenshot/visual/device pass. See tests/evidence/pen-editing-implementation/task3/checkpoint.md. Task2 physical qualification remains open; Task4 care/routing integration next. Owner renewed conditional merge authority, but required actual preview/visual acceptance and feature validation remain pending. No merge/deployment.


### Pen editor continued implementation checkpoint

Task3 is backed up remotely at23916e3, identical tree to local50d30d0. Partial Task4 care rebinds, concave routing, distinct waiting positions and atomic publication; Task5 writer4 transaction; Task6 pure draft commands are implemented and locally tested. See task4–6/progress.md for exact suites and retained failures. Existing chicken34 and cow scene19PASS; validator21PASS; save/care50PASS; draft8PASS. These are partial-module checks, not full feature acceptance. Full live registries, gate passage, cow slab support transitions, native controls, all46 edited cycles and actual hosted renders remain unresolved. No merge/deployment or visual approval. Continue authorized work without another plan-approval prompt.

### Continued pen implementation — scene routing, native input contracts and paid boundaries

Owner asks to finish all approved work. Fresh main1115f93 unchanged; prior files and failure logs preserved. Actual customized-pen scene routing/containment now handles concavity without illegal fallback or endpoint tunneling. Draft command coverage, second-pointer/capture cancellation, lightweight preview ownership and exact paid-save boundaries are tested. Combined102checksPASS before separate preview3 and expanded cow-support6 suites; no single final106-check execution claimed. Runner registers15new files while retaining all72originals. See task6/continuation-checkpoint.md for fixture corrections and raw RED/GREEN references.

This is still incomplete feature work: no player-facing editor, live registry swap or complete gate traffic yet. Support module is not runtime-installed; actual skin clearance/full46edited cycles/native four-view/recovery/cloud/GPU gates remain open. No actual new game preview, owner visual acceptance, hosted qualification, merge or deployment. Continue implementation without another planning permission request. Sole author; emulation/device evidence is not inferred from Node tests.

Checkpoint backup383147a (tree88bb5a0 equals local4cb4d70) succeeded. Original72-file regression command returned exit0, but retained redirected log ends prematurely at horse-evidence-placement; full raw completion tail is inaccessible. This is explicitly incomplete qualification evidence, not a final87-file pass. No blind retry. Focused module receipts remain retained. No process/automation active at this checkpoint; feature integration and release gates remain incomplete.

### Owner pause and Claude takeover — October22,2026

Owner explicitly instructed: “Pause and write a handoff for claude to take over your usuage almost gone.” Codex stopped implementation and prepared `CLAUDE_HANDOFF_20261022.md`. This supersedes the historical sole-Codex/no-Claude team instruction. No competing writer should continue in Codex.

The current WIP adds a real yard scene-registry module and partial index wiring; registry4PASS and focused registry/integration/cache16PASS. Owner paused immediately after two new publication preparation tests were written RED: publication suite4PASS/2FAIL because `prepareAnimalPenRevision` does not yet call the proposed `prepareRegistries` hook. Preserve this exact RED and complete it first; no assertion was weakened or runtime fix made after pause. All unfinished code and logs are included in the handoff checkpoint. No feature PR, actual preview, visual approval, hosted qualification, merge or deployment. No process/automation remains active. Claude should recover from the actual branch head, not assume this workspace transferred.


### Claude resumes as sole implementer — October22

Owner: Claude is now the main implementer ("You are main ai making game others usuage is up so you do all"); recorded approvals of spec `a2f0b8c` and plan `a1c583b` stand. Main rechecked at `1115f93` with 20/20 checks success; open PRs remain 60/54/37/34 and untouched. Codex handoff head `d20e9fe` was fast-forwarded (no force) onto the session branch `claude/hayday-style-game-currency-hq3vi4`, which is now the single active implementation branch; `codex/player-pen-editing-20261022` stays frozen as the transfer artifact.

Task 7 progress on Node 22.22.2 (no browser/device/hosted run): the two retained publication REDs were reproduced on exact `d20e9fe`, then turned GREEN by an optional prepared-registry hook (`45c77b3`; publication 6/6, pen files 146/146, full core runner 88/88 files exit0 with complete log). A new actual-index consumer test publishes a real custom revision through the real registry into `installAnimalPenScene`; it found a boot-time `setStatus(null)` crash before the first cow sync (retained RED, one-condition guard, 3/3 GREEN). All 23 index-reading suites 260/260 after updating the stale current-cache literal in player-arm-attachment-integration (v63→v64, same precedent as PR95). Two legacy cow B13/B16 tests outside every runner/workflow fail identically on untouched main; pre-existing and untouched. Runner registers 89 files; full core runner on this exact tree 89/89 exit0. Open: boot-restore obstacle-ordering SUSPICION, browser cache-literal review, World snapshot, boot restore, controller rebind, gate traffic, cow support install, Edit UI and four-view native journeys. See `tests/evidence/pen-editing-implementation/task7-claude-20261022/progress.md`. No player-facing editor, preview, visual approval, merge or deployment.

Boot-order follow-up: the obstacle-ordering SUSPICION is now a reproduced defect for the planned saved-layout boot restore (actual index slices in boot order: field-area block lost its route obstacle). Startup route registration is now identity-based and skips pen-registry-owned blocks; default boot is unchanged. Install/boot suite 5/5; 23 index-reading suites 262/262. Next: actual saved-layout boot restore before herd creation.

Saved-layout boot restore: `restoreSavedAnimalPens()` runs in `GV.refresh("all")` after applyLayout and before syncHerd, installing a valid saved custom layout through the prepared registry plus all six care-controller rebinds; unknown/future/invalid records keep the default and are never rewritten; live animals are never rebound without validated placements (in-page farm switches are the next subphase). Registry revisions gained dispose(). Install+versions 20/20, index-reading suites 269/269, core runner 89/89. Runtime module joins the offline shell. Still no player-facing editor.

Real-browser diagnostic: local headless Chromium 141 with locked Playwright 1.62.1 now launches in this environment (not the hosted pinned browser). New `tests/animal-pen-restore.browser.cjs` saves a moved horse pen through G.save (writer4), reloads and runs 60 simulated seconds: custom pen installed, 4/4 horses inside throughout, all care sites active, zero page errors. Diagnostic only; hosted qualification still required.

In-page farm switches: `retireAnimal` is extracted verbatim from syncHerd; when a different saved pen record arrives with a live herd (visit, going home, new/imported farm) the herd is retired, the layout installs with nothing to place and syncHerd respawns it, so no live animal is rebound without validated placements. Local real-browser diagnostic: visiting a default-pen farm and going home switch pens correctly with every horse inside and the save untouched. Index suites 270/270, core runner 89/89, local core browser group 5/5 (Chromium 141, not hosted).

Invisible-wall fix: main's legacy hen water pan collision (mesh retired long ago) stays for the accepted chicken yard but is now retired when the chicken yard is customised, so moving the pen cannot leave an invisible obstacle. Reproduced RED, install 14/14, index suites 271/271.

Live World snapshot: shared `penEditableLand()` (proven equal to the calibrated validator land) and `snapshotPenWorld()` in index build full foreign shapes, baseline blockers, stone path, actor IDs/clearances/components, installed flags and current layout from the running farm; epoch follows farm identity and the obstacle revision ignores walking and paid ticks. Locally in a real browser the accepted default layout validates against the live snapshot with 0 issues (11 actors). Core runner 90/90, index suites 272/272. Next: Apply transaction through the editor core with validated six-controller rebinds.

Apply transaction: `index.html` now drives the real editor core (`__dbg.penEditor`, debug only) with the live World, the shared validator and `commitPenDraft`, which re-validates on the newest snapshot and commits through `G.commitAnimalPenLayout` with the prepared yards, registries and all six validated care rebinds publishing together. Local real-browser diagnostic (Chromium 141, not hosted): sheep meadow moved 1 m west applies, saves writer v4 revision 1, keeps 5/5 sheep inside and the same herd after refresh, survives reload; an off-farm cat move is refused with the save untouched. Retained RED on `a14388f`; index suites 272/272 after a placement-only fix for a `cow-scene` slice collision; core 90/90. Owner decision needed: under the approved land and stone-path rules the chicken yard and horse paddock cannot move as a whole at all (horse paddock extends 2.4 m beyond the farm capsule; chicken yard is boxed in by the barn, the stone path and the scenery it encloses). No editor UI, preview, hosted run, visual approval or merge yet.

Owner decision and validator fix: owner says "Chickens can stay horse needs to move". Measuring the horse paddock found a defect: unowned sites were invisible to validation, so a pen could be moved onto the empty chicken yard or into the unbuilt cow yard. Unowned sites now stay reserved (RED retained; validator 24/24, pen suites 165/165, index 272/272, core 90/90, browser Apply PASS locally). Next: amendment A1 gives the horse paddock 10 m of levelled west ground so it can move 1-9 m west.

Horse room (amendment A1) held for owner authority: making the horse paddock movable needs 10 m of level ground west of it, which means changing protected land bytes (`farm-land.js`), outside the recorded adapter authority. A locally verified candidate (paddock moves 1-9 m west; terrain unchanged elsewhere; one hill tree moved) is retained as `horse-room-A1-candidate.patch`, not committed as code. The branch stays green. Awaiting an explicit owner yes/no with previews.

Horse room authorized and implemented: the owner answered "Yes" to flattening the 10 m strip west of the horse paddock. Applied the recorded candidate unchanged; farm-land.js is registered as the sole land exception (previous/reviewed digests), and a negative control shows the guard still rejects any further land edit. Pen suites 189/189, index 272/272, core 91/91. Local real-browser test PASS: the paddock moves 6 m west, horses stay inside through refresh, reload and 30 s; 10 m is refused. Before/after previews were produced for owner visual approval (not yet given). Chicken yard stays fixed by owner decision.

Square horse paddock (amendment A2): the owner asked for a square, not slanted, horse fence and, shown real-game previews, chose to square it in place. The stone path's diagonal leg is now a right-angle corner (locked farm-path.js, registered as the sole path exception; negative control still fails any further edit). The default horse paddock is the full 18.7 x 12 m rectangle (template sa3d-horse-v2, regenerated by a capture script from the actual factories; PR95 fixtures untouched; floor 224.4 m2 per the "at least the species baseline" rule). Focused suites 84/84; local browser check of the square default passes. Full regression and owner visual approval pending.

Care deadlock fix: the square paddock's full regression exposed a pre-existing remaining-care bug that also exists on main (8/40 Beast seeds failed at bedtime before A2). Horses and sheep swapping sides replanned in mirror image forever, two horses could each stand on the other's destination, and pets visiting the north field could not route home. A blocked walker now gives way to a higher-priority walker (fixed order), and pet route searches cover the pet and its goal. New RED-first controller tests; core runner 92/92; sweep 75/80. Remaining pre-existing pocket trap (5/80, pets) recorded with a proposed fix. Local browser horse-square, horse-room and apply PASS. Final square-paddock previews were sent to the owner for visual approval.


### Claude hands back to ChatGPT/Codex — October 22

Owner: "Yeah mark handoff I had you continue cause usuage ran out but it reset now so I wanna take it back to gpt". Claude has stopped; ChatGPT/Codex is the single active implementation owner again. Read `farm3d/CHATGPT_HANDOFF_20261022.md`.

State: branch `claude/hayday-style-game-currency-hq3vi4`, head `b053188` before the handoff commit; `main` is unchanged at `1115f93`; there is no PR. Results on the final code: core 92/92, index 276/276, pen-focused 193/193, and local browser horse-square, horse-room and apply PASS. Hosted CI has never run on this branch.

Owner decisions recorded: the chicken yard stays fixed; the horse paddock is movable (A1, protected land change) and square (A2, protected path change). Visual approval of the square paddock is pending.

Open: a pre-existing pet pocket trap (5/80 Beast seeds), the remaining Task 7 items, Task 8, and merge only with explicit owner approval.

### Codex recovery — pet pocket diagnosis; ordinary-movement scope approval needed

Recovered exact handoff `cf29f6d6433ceb3060f6f049045504afb3c87c3a`, tree `99113966de81a11871c51f50d3028313a201c864`; freshly fetched main remains `1115f93101a0e86fdcc9780e053c17b73dd6dac5`. Sole implementer on isolated `codex/pet-pocket-20261022`. Existing worktrees, dashboard, saves, frozen evidence and PRs60/54/37/34 preserved. Fresh Windows checkout text conversion was restored to exact indexed LF bytes with blob-hash verification before tests; no runtime source changed.

Acceptance criteria were recorded first in `tests/evidence/pen-editing-implementation/task7-codex-pet-pocket-20261022/progress.md`. Retained exact five-seed RED (23,26,41,62,69), then the complete original diagnostic range2–81: **75/80**, the same five failures, no skips/cancellations; every assertion,500s goal and40s wake unchanged. Official unchanged Beast seeds4242/1 **2/2PASS**, physical negative controls **6/6PASS**, protected/default-geometry checks **4/4PASS**. Local Node24.19.0, not hosted CI or physical-device clearance. No unnecessary full-core rerun or new visual claim.

The handoff's single "empty pocket plan" classification was incomplete. Seeds23/26/41 already stand inside the barn's real footprint after ordinary roaming. Seed41's dog is enclosed by the barn, chicken fence and two bushes under its unchanged0.42m body clearance and existing monotone escape rule. A collision-preserving controller escape cannot open this cage. A zero-pad diagnostic path crosses the0.5m gap but violates the original body clearance, so the proposed reduced-clearance correction is rejected. Seed41's observed original Beast run enters the barn without a care task at4.7667s and187.4333s. Seeds62/69 instead retain a direct plan whose first0.05m physical step fails the default convex-pen mitered corner check, which the planner's radial clearance and0.08m sampling missed. Full snapshots, entry trace and continuous rejection proofs are retained.

**Pending new owner scope approval; no denied or uncertain runtime mutation.** Needed: a narrow ordinary-pet collision/pen-projection correction in `index.html` (`Beast.update`, final `fit` and route handoff), plus consistent continuous full-clearance corner checks in remaining-care controller/navigation. This expands the delegated controller-only slice and protected ordinary-movement semantics. No further A1/A2, land/path, rig, ledger, save, economy or auth change is proposed. Do not lower clearance, change seeds/deadlines, allow new physical penetration or teleport a trapped pet. On approval, write focused source-entry/corner RED tests, then rerun the retained five,2–81,4242/1 and targeted/core gates unchanged.

Both relays record this clean evidence-only stopping point. All launched tests finished; no monitor/automation started. Task7/8 remain incomplete and previous work stays credited. No feature PR, new hosted run, visual approval, merge or deployment. Diagnostic review is the sole author's self-review, not an independent audit.

### Codex owner-approved pet collision correction - bounded checkpoint

Owner explicitly answered **Yes** to the proposed ordinary-pet collision/pen-projection and route-handoff correction plus controller/navigation corner consistency. Authority and acceptance were recorded first in `docs/superpowers/specs/2026-10-22-pet-collision-correction.md`. This resolves the previous scope blocker; it adds no terrain/path/rig/economy/auth authority. Base `6e3b40159347a99b7069e1eecc6495c2312c0ab9`; branch `codex/pet-pocket-20261022`. Fresh remote main remains `1115f93101a0e86fdcc9780e053c17b73dd6dac5`; Claude handoff remains `cf29f6d6433ceb3060f6f049045504afb3c87c3a`. Sole implementation writer; old worktrees, dirty files, saves, dashboard, frozen evidence and PRs60/54/37/34 preserved.

Reproduced the exact five-seed RED before runtime edits. Ordinary dog/cat routes and each movement step now enforce full body/footprint/fence/neighbour/pen clearance; blocked steps can only slide safely or stop. There is no blocked direct-route fallback. Default mitered and custom radial/concave pen predicates are checked continuously at boundary events; care physical steps use the same clearance. A zero-time velocity division found during self-review was reproduced and guarded. No clearance, assertion, original seed or deadline was reduced, replaced or extended. The pre-existing invalid seed41 cage remains impassable; the fix prevents its source.

Final exact-runtime local results: **80/80** original seeds2-81 including23/26/41/62/69, **50/50** focused checks, **93/93** core Node files including original4242/1, and **278/278** index assertions across24 suites. Seed41 observation:6435 ordinary dog frames and6273 cat frames, zero static full-body/pen violations. Twenty protected implementations, six adapter digests, exact A1/A2 bytes, prior tests and frozen evidence remain unchanged. Existing core visual-pattern isolation executes every original pattern; no new skip. Evidence, all RED/intermediate attempts, commands, manifests and final hashes: `tests/evidence/pen-editing-implementation/task7-codex-pet-fix-20261022/`. This is Windows Node24.19.0 diagnostic evidence, not hosted CI, physical-device clearance or an independent audit.

Clean bounded stopping point before broader Task7: owned chicken/cow Apply and maximum ownership, whole-farm/gate traffic, cow support install, new-farm/2D import, player-facing Animal pens editor with physical pause/input isolation and four viewport journeys remain; Task8 cache-predecessor review, full46-animal recovery/cloud/resource and official hosted qualification remain. Prior credited work stays credited. All launched tests finished; no server, monitor or automation started. No feature PR, visual approval, merge or deployment. Fresh explicit owner approval is required before merge.

Owner model preference recorded: parent manages adaptive changes between checkpoint turns, disclosing exact model/effort/reason each time. Final visual polish uses **gpt-6-astra / xhigh**, real rendered phone-size and desktop previews, emulated viewport versus physical-device evidence distinguished, and final owner visual approval retained. No model switch or visual work occurred in this slice.

### Codex Task7 full ownership and Apply - October23 bounded checkpoint

Parent selected **gpt-6.1-sol / high** for bounded integration/tests to conserve usage after the difficult collision fix; switch disclosed with its reason. Base `94dd729d4ec9a6bd29e908caa69d78ea55068282`, branch `codex/pet-pocket-20261022`; main and Claude handoff freshly verified unchanged. Acceptance was written before verification in `tests/evidence/pen-editing-implementation/task7-codex-full-ownership-20261022/progress.md`. This is a partial Task7 checkpoint, not completion of Task7 or46-animal care qualification. Sole implementation writer; no other worktree, dirty file, save, dashboard or historical PR changed. CIM process inventory is unavailable; external activity is not conclusively claimed inspected.

The new actual-shell test `tests/animal-pen-full-ownership.browser.cjs` passes with **all46**:30 chickens,5 cows,4 horses,5 sheep,dog andcat;46 distinct World actors and exact owned counts, every owned yard active, accepted default valid against actual live shapes/actors. With cows/chickens owned the sheep meadow applies1m west through newest validation and the real transaction; writer4/revision1 saves only sheep, full equal-clock paid state is unchanged, chicken/cow components remain exact and all penned actors are inside. Same-farm refresh keeps every actor identity; reload restores all46 and the custom sheep layout. Four cardinal1m chicken whole-yard moves and an invalid cat move are refused with exact unchanged save/Cancel bytes. These chicken refusals establish the accepted current World's fixed-yard behavior; no universal hypothetical policy-lock claim.

**No production repair was needed; no product RED fabricated.** First pinned-browser navigation was blocked by the sandbox before game load (`ERR_NETWORK_ACCESS_DENIED`); exact failure/trace retained. Normal require_escalated localhost permission was approved and the same unchanged test passed. Locked Playwright**1.62.1** / Chromium**151.0.7922.34**, revision**1234**, Windows; normal pinned install protocol/certificates. This is local diagnostic evidence, not hosted CI, a physical device or trusted input journey. An actual default-camera render was inspected; it is not a close-up visual preview of the sheep move or owner visual acceptance. Focused existing publication/save/writer/protected/default-render Node suites **25/25**, zero skips. All1446 previously tracked files matched base before relay updates; all20 protected implementations, six adapter digests, original tests/fixtures/package locks/A1/A2/frozen evidence unchanged. Credited pet80/80 and core93/93 results remain on identical runtime bytes; they were not needlessly rerun.

Evidence: `tests/evidence/pen-editing-implementation/task7-codex-full-ownership-20261022/`, including original failed launch, final browser report/full snapshots, PNGs, pinned environment, test/source hashes and byte audit. Only full-ownership snapshot and sheep Apply while cows/chickens are owned are credited. Custom cow/chicken assembly Apply, custom cow support, full gate traffic/three nights, new-farm/2D import, physical pause/input isolation/UI/four viewport journeys and remaining Task8 qualification are still open. All launched tests/server pairs closed; no background server, monitor, automation, merge or deployment. Sole-author self-review only. Final visual polish remains Astra/xhigh, with emulation/device evidence distinct and explicit owner visual/merge gates retained.

### Codex Task7 custom cow Apply/support diagnosis - stronger routing review pending

Base `b9b99891ae8f12184031f795a0130abb2c8b82d1`; same isolated branch and parent-selected **gpt-6.1-sol / high**. Acceptance recorded first in `tests/evidence/pen-editing-implementation/task7-codex-cow-support-20261023/progress.md`. No production edit. All1461 tracked files matched base before relays, with20 protected implementations/six adapter digests/A1/A2/original tests and prior evidence exact. Sole writer; no unrelated work or historical PR touched.

Pinned local Chromium151.0.7922.34 /Playwright1.62.1 probe:five sampled custom cow boundaries validate. A real rear-east expansion applies through the existing editor and writer with all46 owned; only cow is saved, full equal-clock paid state and herd/task identity remain unchanged, and the realcow-bed-1 token/cow-1/generation1 reservation is preserved. The original gate and assemblies stay in place. Rendered foundation ray hits0.080000013 inside the unchanged slab; expanded soil has no foundation and ground0. Actual1280x720 night render inspected; not visual/device/hosted acceptance.

Strict actual-Beast diagnostic retains **three REDs**:two standing hoof soles remain0.08m above soil; an actual ordinary request has no path/target although its segment clears building/fence at body radius0.9 and polygon containment0.95; debugcowYard points to the detached old yard after Apply. Original runtime fit total is1.25 and planner pad1.6. The initial diagnostic's displayed fit margin1.35 is a metadata arithmetic error, not a geometry input; exact source establishes1.25. Initial planted-only contact assertion was vacuous because idle legs are markedfalse; its original source/output remain, and the stronger all-standing assertion fails at the same1e-10 tolerance. The stance was night and could start a care task; no dynamic transition qualification is claimed. Existing focused support/rebind/scene/protected checks **28/28**, zero skips; module coverage does not establish index installation.

**Denied, known not executed:** automatic approval review rejected a combined diagnostic-source archive/daylight-no-task fixture/report-only fit-field correction/rerun command, interpreting changing the displayed0.45 to the actual0.35 extra as reduced collision clearance or weakened RED. Target:`actual-cow-red.cjs`; proposed output:`actual-red-final/`. Neither the archive, edit nor rerun executed, and there was no retry/workaround. Read-only follow-up confirms original runtime `fit(v, extra = .35)`, planner `this.S.r + .7`, exact index SHA256 equality withHEAD and the diagnostic's report-only property. Parent can provide fresh explicit authority for that report-only/daylight correction and select stronger reasoning for the routing/support decision. No runtime action was denied or attempted.

This is an **evidence-only stopping point**, not a support fix or completed Task7. Preserve the exact REDs and evaluate ordinary fit/planner/staging consistency without relaxing collision contracts. Support installation, real30/60/120Hz slab transitions, gate traffic, custom assembly moves, UI/import and remaining Task8 remain pending. All launched commands/browser/server pairs finished; no background server, monitor, automation, merge or deployment. Sole-author diagnosis/self-review only.


### Codex cow-support adapter checkpoint - October23,2026

Owner-approved report-only/daylight retry succeeded from ce33c00; no further permission denial. Parent selected and disclosed gpt-6-astra/xhigh. Runtime now installs custom-cow slab/soil support through the existing step/pose adapter, preserving the original full3D speed, gait/care-pose order and all fit/planner/collision margins. Current-yard debug getters follow Apply. A separate RED reproduced custom cows stranded moving-without-target after a refused route; they now return to idle. No locked rig/ledger/auth/land/path/factory bytes or adapter approval digests changed.

Focused66/66, index282/282, core94/94 files and existing all46 ownership/Apply/fixed-chicken/reload browser test PASS. Actual-source ordinary/directed support crosses both directions at30/60/120Hz under original strict planted/step limits. Actual rendered west-facing care routes cross expanded soil to slab atall3rates within6s, with exact planted contact/anchors and original speed/liftoff limits. Local pinned Chromium151.0.7922.34/Playwright1.62.1 on Windows only; no hosted/device/trusted-input or visual approval. All834 prior evidence files and20 protected implementations exact.

Two retained limitations prevent broader qualification: (1) original narrow2.2m rear strip is ineligible under existing1.6m ordinary planner clearance; its original reachability assertion remains RED, with no fallback/reduced clearance; (2) initial sharp-turn liftoff .06639m at30/60Hz exceeds .05 before the slab. Direct replay through unchanged cow3d.js reproduces browser feet within7.4e-15m. Rig untouched; no adapter-only remedy established yet, and any rig edit needs fresh owner authority. Separate west-facing PASS does not resolve that original RED. Earlier clock/overlapping-test-probe fixture mistakes are retained and explained.

Evidence: tests/evidence/pen-editing-implementation/task7-codex-cow-support-fix-20261023/progress.md and checkpoint.json. Next bounded work: retained turn/ordinary-care routing consistency, reverse live and independently moved cow support, full farm/gate traffic; then new-farm/2D import, native editor/pause/input isolation/four viewport journeys and Task8 full46/recovery/cloud/resource/cache-predecessor/official hosted qualification. No merge/deploy. All launched tests and browser/server pairs finished; no monitor or automation. Sole-author self-review only.


### Read-only cow-turn mechanism and validator-gap checkpoint - October23,2026

From b3a4c67, gpt-6-astra/xhigh retained; no runtime/test/locked-byte changes. Exact replay explains the original .0663903m liftoff: updateCow3D clamps planted reach .4102956 to .34 before release records its residual. Formula matches observed displacement within6.3e-15m. Substepping at1/120 or1/240 masks this at internal steps but still fails original30/60Hz outer-frame limits (up to .16636m). No qualifying adapter-only remedy is established. Simply removing the clamp would predict .11242m hip drop, beyond the existing .08m envelope.

Proposed owner authority is narrowly limited to cow3d.js::updateCow3D body-yaw and planted-hoof reach/release/recovery block (current259-290), retaining reach/contact/liftoff/hip limits. poseCowLeg, anatomy/construction/skin, COW_GAIT constants, face/tail, terrain/path, collision margins and paid/auth/save systems stay excluded. Owner has NOT approved this change; no rig edit or new protected digest was attempted. Exact scope, risks and acceptance are in tests/evidence/pen-editing-implementation/task7-codex-cow-turn-diagnosis-20261023/progress.md.

Separately, the narrow-route probe assumed .95 physical clearance guaranteed ordinary1.25 fit/1.6 planning; that assumption is false. Existing failed-route idle recovery is credited and unchanged. A genuine validator gap is confirmed: the accepted5.14m2 expansion adds no ordinary-eligible space (analytic clearance bound1.1091m) and accepts an unreserved cow there using care.42. Care routes remain usable; this is not total isolation. Proposed next validator slice separates ordinary eligibility from care clearance, preserving occupied care/defaults and rejecting unusable enlargement/free placement without lowering margins. No geometry/validator implementation this turn.

Only focused read-only diagnostic instances ran; no redundant full suite or browser run. All previous tracked bytes were checked exact before relay updates. Original REDs/tolerances and other projects preserved. All launched commands finished. No merge/deploy, preview/visual/device/hosted or independent-audit claim.


### Owner-authorized A3 cow turn correction checkpoint - October23,2026

From9db7d6d, sole worker gpt-6-astra/xhigh, no model switch. Owner's Okay explicitly authorizes only updateCow3D heading and hoof reach/release/recovery (original259-290), recorded in docs/superpowers/specs/2026-10-23-cow-turn-release-amendment.md. This supersedes the preceding pending-authority status. Solver, anatomy/appearance, COW_GAIT, face/tail and all other runtime bytes remain frozen. A3 exact predecessor/successor and prefix/suffix hashes are registered with six negative lock controls.

Exact30/60Hz .0663903m RED reproduced before edits. Final bounded heading, anticipatory release and world-axis recovery pass the retained displayed-frame .05m limit and1e-10 planted-contact/drift limits without changing .34 reach. Intermediate failures and default-motion comparison retained; no substep-only result or pre-alignment credited. Default gait phase/distance remain identical; earlier release and running swing differences are documented for later visual review.

PASS:65 focused motion checks;99/99 full core Node files (previous94 retained plus new lock/turn and existing B10/B12/gait);282/282 index consumers; default cow browser at740/844/1280 widths; unchanged robot native touch care/dock/service/credit/exit/night flow. Original actual Beast soil-to-slab crossings pass30/60/120Hz in1.8667/1.85/1.8333s within unchanged6s. Max live liftoff1.52e-14m.21 supplemental actual game-rendered API cases pass, including reverse support; representative stills inspected. All921 prior evidence files and other19 protected implementations exact.

Original compound browser report remains RED solely on its unchanged ordinary-route fixture expectation; genuine validator gap remains a separate next slice. Historical B13/B16 failures reproduce identically before/after and are retained. Local pinned Chromium151.0.7922.34/Playwright1.62.1 Windows only; no hosted/device/owner visual approval, no independent audit, merge or deployment. v5 cow importer and unreleasedv64 cache remain coordinated; final predecessor/offline qualification deferred.

Evidence: tests/evidence/pen-editing-implementation/task7-codex-cow-turn-fix-20261023/progress.md and checkpoint.json. All launched tests/browser/server commands finished. Next: separate ordinary/care validator consistency, then remaining full-farm/gate traffic, independently moved support, new-farm/2D import, native editor/pause/input isolation/four viewport journeys and Task8 full46/recovery/cloud/resource/cache/hosted qualification.


### Codex Task7 ordinary/care cow placement validation - October23,2026

Base 740bc5081311524a23b9f171ce8a891643905b97; same branch, parent-selected gpt-6-astra/xhigh, sole writer. Acceptance, exact retained RED and every intermediate fixture failure are in farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-validator-20261023/progress.md. No new permission denial or locked-scope change.

The retained narrow layout accepted a free cow at[10.6,0,-39.1] despite the unchanged1.6 m ordinary route inset. Custom free-cow placements/staging now require a supported full.9 m body-clear direct ordinary step beyond the existing.35 m arrival threshold, with actual rectangular route padding/endpoint rules; unchanged index route parity passes. Care keeps.42 and all required care/gate/support proofs. Live snapshots recognize actual tasks and pending authoritative robot jobs; final Apply revalidates current state. No silent relocation of a still-contained bad free start. No ordinary runtime/rig/A3, terrain/path, ledger/economy/auth or digest changes.

Spec distinguishes reshaping from expansion. Harmless narrow decorative borders remain allowed with eligible actors. The.3 m grid found216 ordinary-clear samples before/after, no sampled gain; this does not prove zero continuous gain, and moving a fence can release room inside the old outline. Original narrow-route RED remains archived: physical.95 clearance does not establish a1.6 route. A wider gate-preserving control passes actual editor Apply with46 animals and unchanged paid state; an actual cow walks1.028m in added ground from a test-owned start, with real close-up renders inspected. Ordinary entry from old aisles/full roaming connectivity is not claimed.

Checks:63/63 focused;100/100 core files at identical runtime (new ninth positive case then added and entire9/9 suite passed);282/282 original index assertions plus9/9 new separately. Early aggregate290/291 retains only the new positive gate-fixture error, not a hidden green. Browser custom46 Apply/save/task-token/identity/stale-task/reload PASS; unchanged full46/fixed-chicken regression PASS; usable extension render/control PASS. Fixture diagnostics preserved: normal first Halloween event changed an overlong save baseline, corrected by actual G.tick before baseline without weakening byte assertions; moving a gate endpoint crossed the path, corrected only in the new positive fixture while retaining the original gate/guards.

All1079 prior evidence files and protected/A1/A2/A3/adapter/test bytes exact; only validation/index/core-runner changed before relay updates. Cow rig SHA256 remains2d0be792fa13d5a12eb9dd48e011d5d74557e943df580cdb70e7538eb4e3fb01. Local pinned Chromium151.0.7922.34/Playwright1.62.1 Windows, not hosted/device/native-input/visual approval. All owned commands and browser/server pairs finished; external CIM inventory remains unavailable. No merge/deploy.

A3 real turn/walk/run previews for later owner review: https://github.com/pederaus9-ux/Bugsy/tree/740bc5081311524a23b9f171ce8a891643905b97/farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-turn-fix-20261023/rendered-final (immutable commit; running-swing/earlier-release tradeoff in adjacent progress.md). Remaining Task7: full traffic/gates, independent assembly/support moves, new-farm/2D import, native UI/pause/input isolation/four viewports. Task8 full46 care/recovery/cloud/resource/cache-predecessor/official qualification and owner visual/merge gates remain.


### Codex Task7 gate traffic diagnostic checkpoint - October23,2026

Base cb2af61cee02d2f0c0625aee7c9b66b6eb53e752, sole writer, parent-selected gpt-6.1-sol/high. Parent explicitly instructed diagnostic escalation for coordinated new routing/care defects. Acceptance first in farm3d/tests/evidence/pen-editing-implementation/task7-codex-gate-traffic-20261023/progress.md; actionable diagnosis and exact functions in diagnosis.md. No runtime edits or new digest registration.

Actual46-animal editor Apply of four custom identity records PASS; paid state/herd exact, chicken whole-yard displacement zero. All4 gate bridges statically clear at original body radii. Actual player collideWalker:24 bidirectional30/60/120Hz crossings,1392frames, unchanged.35 radius/3.4m/s speed, zero correction/error;4 adjacent solid-fence controls remain blocked. Real1280x720 sheep gate render inspected. API/test-owned starts, static independent traffic; no native-input/mixed-traffic/turn-skin qualification.

Directed animal passage remains RED: all8 actual scene bridge replays empty; remaining-care plan rejects outside targets and both directions; chicken groundRoute fallback cannot bypass physical inside checks. No explicit scoped passage state exists. Ordinary containment is correct and must remain restrictive; this is missing Task4 integration. Separately, actual Beast.go leaves custom chickens/horses/sheep in moving with null target/empty path. Focused until=0 retry tests3RED/5PASS; real browser remains targetless through120frames/2s. Cow's existing idle recovery passes. Two initial lexical test-harness errors and original sources/logs retained, corrected without changing runtime or assertions.

All1777 tracked baseline files/1124 prior evidence files, original tests, seven reviewed adapter entries, A1/A2/A3 and protected bytes exact before relay updates. No unchanged full-suite rerun; prior100 core-file qualification remains credited on identical runtime bytes. Pinned local Chromium151.0.7922.34/Playwright1.62.1, not hosted/device/owner visual acceptance or independent audit. All owned commands/browser/server pairs closed; no monitor/automation, merge or deploy. No automatic approval denial.

Implementation is pending stronger review as instructed: recommend parent switch to Astra/xhigh, first isolate the small Beast.go empty-route recovery, then design a scoped gate adapter or coordinated planning/physical predicates. Preserve default containment, full collision/support/turn checks, care/coop lane reservations and paid ledger; define outside wait/re-entry handoff. An index-level shared ephemeral adapter may avoid locked chicken-stations changes; otherwise resolve exact lock authority before changing that file or its digest. Full mixed traffic, relocated gates, moved fixtures/support, UI/four viewport and Task8 work remain pending.


### Codex Task7 custom ordinary-route recovery checkpoint - October23,2026

Base0f0d0562fdec3216da2130852441771bcd7d6552; same isolated branch, sole writer. Parent selected and disclosed gpt-6-astra/xhigh; no further model switch. Acceptance first in farm3d/tests/evidence/pen-editing-implementation/task7-codex-route-recovery-20261023/progress.md. Exact retained3RED/5PASS reproduced; expanded6RED/14PASS before runtime edit. One condition in index.html::Beast.go extends the custom-cow idle fallback to every custom penned species. All fitting, routing/physical predicates, timers, task metadata, care, default/pet behavior and rigs remain unchanged. New20-case suite is additively registered.

Final same-runtime local results:28/28 retained/new focused,133/133 relevant care/rebind/navigation/robot/collision/A3-lock assertions,239/239 remaining index assertions across24 files, zero failures/skips. Real owned animals at30/60/120Hz:12cases/1680frames, original think/update, half-second cooldown then normal decisions within2s, no targetless moving/out-of-pen step, all12 actual reservation snapshots unchanged. Full46 custom identity Apply preserves paid state/herd. Unchanged full-ownership browser regression passes fixed-chicken cardinal refusals, sheep Apply/save/paid-state/refresh/reload. Actual1280x720 horse render inspected. No actor relocation in recovery fixture; some normal decisions choose idle/nearby arrival, so full roaming connectivity is not claimed.

Byte audit1799 baseline tracked/1146 prior evidence exact except one index condition and additive runner registration before relays. All20 protected implementations/seven adapter entries/A1/A2/A3 exact, cow SHA2d0be792fa13d5a12eb9dd48e011d5d74557e943df580cdb70e7538eb4e3fb01. No hashes registered, tests/seeds/deadlines weakened or unrelated pet sweeps repeated.101 core files registered; no new101-file full-core pass claimed. Pinned local Chromium151.0.7922.34/Playwright1.62.1 Windows only, no hosted/device/native-input/owner visual acceptance or independent-audit claim.

Gate implementation is PENDING a precise product decision, not denied or attempted: approved Task4/spec permits only a directed corridor while ordinary roaming stays contained and excludes open/close gameplay. Actual consumers supply neither an exterior request initiator nor terminal outside behavior. farm3d/tests/evidence/pen-editing-implementation/task7-codex-route-recovery-20261023/gate-decision.md proposes an internal explicitly requested bounded out-and-back operation with no player control/autonomous exits, and explains the alternative caller-controlled outside hold. Parent/owner must choose that contract before adding behavior; no synthetic care job, teleport, broad gate exception or locked chicken-stations edit. Prior eight gate route REDs stay unresolved. Current recovery fix needs no new authority.

All owned commands/browser/server pairs finished; no monitor/automation. Earlier external process inventory denial remains unavailable and was not retried. Main freshly verified unchanged1115f93; historical PRs/other projects/worktrees/saves preserved. Remaining directed mixed traffic, moved fixtures/support, import/native UI/four-view and Task8 qualification stay pending. No merge/deploy; fresh owner visual and merge gates remain.
