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


### Codex Task7 containment amendment and native entry checkpoint - October23,2026

Base1ab18b466bbda574b10582d6e6a0472f200843a6; sole writer, parent-selected/disclosed gpt-6-astra/xhigh retained. Owner Okay to the precise one-pen/species question is recorded in docs/superpowers/specs/2026-10-23-contained-animals-amendment.md (A4). Penned animals remain contained; player gate access and moving/reshaping existing pens remain required, chicken whole-yard stays fixed. Exterior animal trips/transfers are deferred features. Prior eight route REDs remain frozen as absent-capability evidence, not PASS or skipped tests. This supersedes the preceding pending gate product decision; no protected exception/digest added.

Native Edit > Animal pens now attaches existing editor/view/preview with owned selection, camera framing, physical pause, paid-clock continuity and gameplay/legacy-drag isolation. Cancel discards; dirty Close offers Apply/Discard/Keep editing. Account-hold/visit/future-layout transitions invalidate the session; existing Apply revalidation/publication remains authoritative. Existing camera bounds are preserved by the new two-pointer handler. No motion/routing/clearance, rig, land/path, ledger or auth change. View/preview added to unreleasedv64 shell.

Retained first missing-entry RED, three view-contract REDs and camera-bound RED; final68/68 focused and299/299 remaining index assertions pass with zero skips. Actual trusted native entry journeys PASS at390x844,844x390,768x1024,1280x720:46 owned actors, physical state/tokens frozen while normal due-order settlement continues, valid sheep nudge/preview, saved-byte Cancel/Discard, Apply/reload, and simulated invalidating transitions. Real390/844/1280 renders inspected. This is entry/session coverage, not complete all-operation journeys or authenticated cloud qualification.

Nearby seed22 and accessibility11 groups PASS. Original decor suite retains nine PASS groups then a stalev63 lookup RED; baseline already usedv64. Only the expected cache namespace and transition label were corrected, retaining all original hash/offline/paid-state assertions and timeouts. Exact installed-update block passes in a fresh focused continuation; no full-script rerun PASS claimed and50-to64 does not substitute for pen63-to64 qualification.

Evidence: farm3d/tests/evidence/pen-editing-implementation/task7-codex-native-entry-20261023/progress.md, checkpoint.json, final-*/valid-sheep-draft.png.1827 baseline tracked files accounted for,1173 previous evidence files and20 protected/seven approved adapter entries/A1A2A3 exact. Cow SHA2d0be792fa13d5a12eb9dd48e011d5d74557e943df580cdb70e7538eb4e3fb01.102 core files registered additively; no new full-core run. Pinned local Windows Chromium151.0.7922.34/Playwright1.62.1, drawing scale0.5 at exact CSS viewports; not hosted/device/owner visual approval or independent audit.

All owned commands/browser/server pairs finished. Temporary executor loss recovered the same running command without restart. Earlier external CIM inventory denial remains unavailable, not retried. No new permission blocker. Main freshly verified1115f93; other projects/worktrees/historical PRs untouched. No merge/deploy. Remaining: full four-view gesture/invalid/storage and selection/focus journeys; independent assemblies/support, in-pen mixed traffic/internal gates/both coop doors, new-farm/2D import; Task8 full46 three-night care/recovery/cloud/resource/cache-predecessor/hosted qualification. Final visuals/merge still require separate owner approval. A3 real turn/walk/run previews remain at https://github.com/pederaus9-ux/Bugsy/tree/740bc5081311524a23b9f171ce8a891643905b97/farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-turn-fix-20261023/rendered-final .


### Codex Task7 native drag/interruption and sheep assembly qualification - October23,2026

Basea308c3a4957f6a4485ac2134142ec42578b4463d, sole writer, parent-selected/disclosed gpt-6-astra/xhigh retained. Runtime and every existing test unchanged; A4 containment-only remains. Acceptance written before probes in farm3d/tests/evidence/pen-editing-implementation/task7-codex-native-gestures-20261023/progress.md.

Four exact CSS viewports390x844/844x390/768x1024/1280x720 PASS native whole-pen handle/interruption journeys:45 trusted events each, real mouse capture, one-metre snap, second native touch cancels only active gesture then pans, native touchCancel restores pre-gesture draft. Original50ms hold floor; saves/physical actors/reservations unchanged. Four independent sheep-shelter journeys then PASS native selection/drag/full validation/Apply/reload,46 animals, equal-clock paid state, fixed boundary/gate, actual5 bed meshes and care dock/approach shifts. Other assembly types/support traffic are not qualified by this result.

Two initial assembly REDs retained: new oracle incorrectly translated already-Float32-rounded old bounds as exact reals, producing1.5258789076710855e-6m Z residual despite correct station/saved delta. Independent expected Float32 coordinates match all20 bounds exactly;20 deliberately shifted negative controls fail at unchanged1e-8. Corrected only new probe expected coordinates, no tolerance/clearance change. Initial diagnostic Windows import URL error retained and corrected before proof; no runtime defect/fix inferred.

All1933 baseline tracked bytes exact before relays, including1276 prior evidence files,20 protected implementations/seven adapter records and A1/A2/A3. No redundant core/index/nearby reruns on unchanged dependencies. Actual768 drag and390/1280 valid assembly previews inspected. Windows pinned Chromium151.0.7922.34/Playwright1.62.1, drawing scale0.5; every context touch-enabled/isMobile including1280. Trusted browser mouse/CDP touch, not DOM dispatch/debug editor commands, hosted CI or physical-device/owner visual acceptance. Unexpected lostcapture cancellation remains pending despite observed normal release events.

All owned commands/browser/server pairs complete; no disconnect/new denial. Prior external CIM inventory unavailable/not retried. No merge/deploy. Next: complete native fence/run/gate/remaining assembly/invalid/storage and selection/focus journeys; independent cow support, in-pen mixed traffic/internal gates/both coop doors, new-farm/2D import; Task8 full46 three-night care/recovery/cloud/resource/cache63-to64/official qualification. Exterior animal trips/transfers stay deferred by A4. Full result/evidence in farm3d/tests/evidence/pen-editing-implementation/task7-codex-native-gestures-20261023/checkpoint.json.


### Codex Task7 native controls and operation checkpoint - October23,2026

Base1ad8541434b4bcca401fe83a1d7a6fdd40f71d6c; sole writer. Parent selected/disclosed model switch togpt-6.1-sol/high for focused qualification. A4 containment-only and exact A1/A2/A3 remain. Acceptance/results in farm3d/tests/evidence/pen-editing-implementation/task7-codex-native-controls-20261023/progress.md and checkpoint.json.

Retained genuine native REDs: missing entry focus; Tab escaping after entry-only fix; split edge leaves nonexistent selected old edge; queued redraw resets chosen gate attachment. Only editor-view changed: focus/cycling/host keyboard and dirty-exit focus; created/removed structural selection; preserve pending same-gate anchor, show actual attachment on gate changes. No geometry/validation/movement/save/rig/controller/terrain/path/auth change or digest registration. New probe decimal round-trip expectation RED retained, corrected only strict expected JS arithmetic; no runtime rounding or tolerance change.

Final19/19 existing focused view/editor checks and8/8 native CSS viewport journeys PASS. Four controls cases cover native focus/Tab/handle arrows/Escape/Keep, browser-API unexpected capture-loss fault and canonical-save quota fault, exact draft/save/paused actors/reservations/installed revision preservation, readable error, successful retry/paid-state/reload46 and opener return. Four operation cases cover edge/corner, post split/remove, drawn run add/move/remove, gate add/move/resize/reanchor/remove with original gate retained, valid width4-to5 Apply/reload46, fixed-chicken invalid preview and11 remaining component command/Cancel checks (44total). Portrait same-runtime operation candidate credited, no duplicate run; report input-label change metadata only.

Only view runtime bytes changed; all2004 baseline files accounted for,1345 prior evidence and20 protected/seven adapter/A1A2A3 exact; old tests/seeds/deadlines untouched. No unchanged core/index/motion/care reruns. Native operation input is mouse/keyboard in touch-enabled/isMobile contexts at390x844/844x390/768x1024/1280x720; fault triggers explicitly injected browser APIs. Pinned Windows Chromium151.0.7922.34/Playwright1.62.1, drawing scale0.5. Real gate-valid/storage-error renders inspected; no new touch-specific, physical-device, hosted, cloud, independent-audit or owner visual claim.

All owned commands/browser/server pairs complete, no disconnect/new denial; prior external CIM inventory unavailable/not retried. Remaining: saved installed post/edge/run/other assembly edit classes, independent cow support/care, full in-pen traffic/internal gates/both coop doors, pre-entry selection/touch-specific journeys, new-farm/2D import; Task8 full46 three-night care/recovery/cloud/resource/cache63-to64/official qualification. A4 exterior trips/transfers stay deferred. No merge/deploy; fresh visual/merge gates remain.

Final native-controls review supplement:390x844 canvas click then Tab returns to editor PASS, followed by all prior focus/capture/quota/reload checks. No further runtime change; original8 cases remain credited on identical bytes. Canonical controls test only adds this assertion. Supplement evidence in same directory/canvas-focus-supplement.json; all original sources/results retained.


### Codex Task7 cow trough facility partial checkpoint - October23,2026

Base1bfabbac1d7354f68896bd2d4dfcf9a087d4ce23, sole worker, parent-selected/disclosedgpt-6.1-sol/high. Coverage matrix and acceptance before tests in farm3d/tests/evidence/pen-editing-implementation/task7-codex-facility-install-20261023/progress.md. A4/locks preserved.

One independent trough move[7.1,-35.4] to[6,-35] passes native full validation/Apply/reload46, exact paid/herd/station/reservation state, correct target geometry and46 validated publication placements. Isolated actual post-reload approach/drink/release passes30/60/120Hz in24.90/24.8833/24.825s within original60s; final-runtime60Hz regression alsoPASS. Existing1e-10 support/drift,.05 liftoff,.85 separation and.08 muzzle limits unchanged. Actual care render inspected (rear angle partly obscures muzzle). Not off-slab/held-occupant/full traffic proof. Two fixture REDs preserved: mutable observer snapshot and pre-reload actor versus actual new reservation owner after reload.

Live continuation exposes genuine failure. Static-neighbor and five-actual-cow controls fail60s. Publication cleared unreserved routes but left act=moving, preventing new decisions. New contract RED1FAIL/7PASS; one conditional in unlocked animal-pen-cow-adapter.js returns only those movers to idle.49/49 relevant contract/rebind/ledger/save/publication/protection tests PASS; new suite additively registered (103corefiles, no full-core rerun).

Residual remains RED after fix: same reserved cow never holds in3600frames/60s, while actual idle cow near approach[3.7,.08,-35] has target=null/path=[]. Separation remains>=.85. Broader route changes stopped. Leading inference is waitCowStation accepting a waiting candidate before checking ordinary go success, under unchanged.7/.65 candidate tests versus1.25 fit/1.6 planning; exact candidate trace not yet collected. Recommend parent raise togpt-6-astra/xhigh for coordinated wait/ordinary route diagnosis. No reduced clearance, teleport, deadline/seed change or locked-file edit. Exact blocker/action/target/status in diagnosis.md and checkpoint.json. No new permission denial; stronger engineering review pending.

All2095 baseline bytes accounted for,1434 prior evidence/20protected/seven reviewed adapters/A1A2A3 exact; only cow adapter conditional and additive runner changed before relays. All owned commands/browser/server pairs closed, no disconnect/new denial; prior external CIM inventory unavailable/not retried. Native edit versus API setup/manual actual-actor care are labeled; local pinned Windows Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5. No hosted/device/cloud/independent audit/owner visual claim, merge or deploy. Remaining facilities, per-edit installed fences, full internal traffic/import and Task8 stay pending.


### Codex Task7 live cow waiting-route correction - October23,2026

Base21dd339; parent selected/disclosed gpt-6-astra/xhigh. Sole writer, same isolated branch, fresh main1115f93. Acceptance written first in farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-wait-20261023/progress.md. Unchanged live five-cow60s RED reproduced. Passive trace proves the waiting caller repeatedly accepts a destination after strict custom ordinary routing returns no target; projection also puts some candidate points back in a care corridor. Exact retained cow4 positions/tasks with actual fit/route/go/wait and cow geometry isolate this caller assumption for moved and unmoved custom trough layouts. Default browser care passes but has slightly different boot positions, so it is not falsely presented as an exact matched-state comparison.

Minimal index.html::waitCowStation correction checks the fitted destination and continues the existing bounded search unless go installs a target. All margins, route planner, collision/motion code, token/ledger/save contracts and A1/A2/A3 remain exact. Original live five-cow30/60/120Hz PASS in29.6667/29.55/29.5s, native Apply/paid state/same token/reload46 included. Separate all-five motion guards PASS at all three rates over31015 actor updates; minimum separation1.368999122m, support/drift/liftoff within original limits. Isolated reload60Hz PASS25.0333s; final unchanged-facility control PASS21.1333s. This is actual cow traffic with non-cow actors static, not full-farm qualification.

Focused125 tests pass across recorded runs; zero skips. Three initial exact-replay parser failures were a new helper syntax error, retained with original helper/raw80PASS3FAIL log; only helper syntax corrected and the3tests rerun. No assertion/seed/deadline change. Two new Node files registered additively (105corefiles); no redundant fullcore/pet sweep. Protected20/reviewed7/A1A2A3 and1500 historical evidence files byte-exact; all other runtime outside waitCowStation unchanged. Real overhead in-game drinking render inspected and retained; local pinned Chromium151.0.7922.34/Playwright1.62.1 Windows, not hosted/device/cloud/independent audit or visual acceptance.

Clean bounded checkpoint: live trough wait blocker resolved for these cases. Other assemblies/support/held/off-slab moves, internal mixed traffic/connectivity/coop doors, installed fence/run/gate functions, import and Task8 recovery/cloud/resources/cache63-to64/official hosted/device remain pending. Original static-neighbour RED and all older evidence preserved. A4 exterior animal trips/transfers remain deferred by owner decision. All owned commands/browser/server pairs closed; no new denial/disconnect, previous external process inventory not retried. No merge/deploy. Separate A3/editor owner visual review and fresh explicit merge approval remain required.


### Codex Task7 independent robot installation and physical contact - October23,2026

Base0b01d6329f7a5b5f93fd254a7460118b33dfdc90; sole worker, parent-selected/disclosed gpt-6-astra/xhigh. Acceptance before tests and terminal correction in farm3d/tests/evidence/pen-editing-implementation/task7-codex-robot-install-20261023/progress.md. A4 containment-only; locks unchanged.

Two distinct genuine REDs retained. Occupied milking Apply preserves job/token/gates but resets new arm, extra1.1m sideways/.1m down: installAnimalPenScene now restores existing service phase with the same normal-frame formula.120Hz then reveals default terminal docking stops early: actual pre-edit cup radial.0263743592m is preserved exactly by translation, exceeding unchanged.025m. updateCowTaskStep now recognizes only terminal robot-dock arrival after actual speed/support-limited movement, never snapping or clearing a blocked target. Existing waypoint policy elsewhere, routes/margins, physical dock gate, rig and ledger remain exact. Focused RED5/5 phase and3/8 terminal controls retained, plus clearly labeled new-fixture syntax/preemption mistakes.

Final9/9 native Apply/reload journeys PASS: approaching/occupied milking/exiting at30/60/120Hz,46 actors present and five actual cows updating. Full validator, immutable paid state/job/token/task fields, grouped geometry/targets/stations,46 validated placements and243 trusted input events. Actual approach/service/exit and single gallon/3XP/reload proof meet original60/12/30 bounds; exiting never credits again. Maximum cup radial.000278341m over3462 contact frames; selected-cow min separation1.76918m, support/drift/liftoff within original limits across12260 observed frames. Non-cows static; no full-farm/all-animal claim. Results and exact scope in checkpoint.json/coverage-matrix.md.

Focused52/52 phase-era and47/47 final arrival/support/rebind/milking groups pass, zero skips; groups overlap, not99 distinct tests. Two additive core registrations,107 total; no fullcore or unrelated trough/pet rerun. All2244 tracked base files accounted for,1574 prior evidence files/20 protected implementations/seven approved records/A1A2A3 exact. Only two index functions changed. Current activeWork header reconciled from stale trough-RED wording; historical evidence and prior checkpoint records retained.

Actual final service/exit renders inspected under final-milking-120/robot-milking.png and final-exiting-30/robot-exiting.png; rail/tank partly occludes contact, measured joints/cups are primary. Earlier overhead screenshots remain preserved; final probes use native Done before ordinary camera. Pinned Windows Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5. API supply/Milk setup and manual five-cow physics explicitly labeled. Not hosted/device/cloud/independent audit or owner visual approval.

All owned test commands/browser/server pairs complete. No new denial/disconnect; prior external CIM inventory unavailable/not retried. No merge/deploy. Remaining: independent feed bunk/occupied shelter/slab, held/off-slab facilities, chicken/horse/sheep/pet functional edits, installed fence/run/internal-gate mixed traffic/connectivity/both coop doors, imports and Task8 recovery/cloud/resources/cache63-to64/official qualification. Robot multi-job/arbitrary-layout/recovery coverage also pending. A4 exterior trips/transfers deferred; separate real A3/editor visual acceptance and fresh explicit merge approval remain. A3 immutable previews: https://github.com/pederaus9-ux/Bugsy/tree/740bc5081311524a23b9f171ce8a891643905b97/farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-turn-fix-20261023/rendered-final .


### Codex Task7 occupied shelter/feed-bunk partial checkpoint - October23,2026

Basec2926638b476d416ba0d284a5e963172940a5972, sole writer, parent-selected/disclosed Astra/xhigh. Acceptance before each case in farm3d/tests/evidence/pen-editing-implementation/task7-codex-occupied-shelter-20261023/progress.md and feed-acceptance.md. No runtime or existing-test changes. A1/A2/A3 and A4 exact.

Independent native feed-bunk move[-8.2,-33.05] to[-8,-34] while five cows hold real beds passes full validation/Apply and immediate reload46 at60Hz. All occupied positions/tasks/token generations and equal-clock paid state preserved; actual geometry/targets/feed stations shift together, other stations exact. This separate persistence case does not qualify feeding continuation.

Retained invalid cases: occupied shelter right-nudge rejects PATH/OVERLAP/ROUTE; all8 read-only nearby candidates invalid, not proof of global impossibility. Existing path/slab overlap policy not changed. Active-feed bunk candidate rejects ROAMING for two waiting cows; no Apply/contact defect inferred. No-water continuation misses60s but never establishes paid demand; exact original source/ledger retained. Separate normal water refill proves all5 charged cycle1 demands, then exposes genuine separation RED at2722frames/45.3667s: .845131788m below .85m. Four actual feed contacts, max muzzle error.015506108m under.08m.

Passive replay reproduces same frame and isolates ordinary cow4 movement toward reserved-approach cow3: .854292028m before to .845131788m after. Ordinary Beast.update uses soft repulsion without a final hard separation guard; directed step had remained clear. Exact default-layout reproduction and safe correction not yet established. No runtime candidate; hard stopping alone may deadlock the queue. Next bounded correction must preserve original60s, all30/60/120 controls, support/motion, reservations and rig. Other rates/continuation reload pending, not passed or waived. Full diagnosis/matrix/checkpoint retained.

All2348 baseline tracked bytes unchanged before relays,1675 prior evidence files/20 protected/seven approved adapters exact. No old assertions/seeds/deadlines changed; no unrelated robot/trough/core reruns. Six new diagnostic script syntax checks pass. Local pinned Windows Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5; native editor input, API fixture/manual five-cow updates, other41 static. Inspected night installed render has limited detail; failure render roof-occluded, quantitative trace is collision evidence. Not hosted/device/cloud/independent audit/visual approval.

All owned commands/browser/server pairs completed; no disconnect/new denial. Sandboxed ref DNS failure recovered via approved network read; main1115f93 and remote branchc292663 verified. Prior external CIM inventory unavailable/not retried. Engineering correction pending, no permission blocker. Broader facilities/internal traffic/import/Task8 remain pending; exterior trips/transfers deferred by A4. No merge/deploy. A3 preview path remains in coverage-matrix.md.


### Codex Task7 bounded cow separation and queue correction - October23,2026

Base170347be78d83c874c85b97691b5a846585235cd, sole writer, parent-selected/disclosed Astra/xhigh. Acceptance first in farm3d/tests/evidence/pen-editing-implementation/task7-codex-cow-separation-20261023/progress.md. Exact original edited-layout RED reproduced at2722frames/45.3667s with .845131788m separation versus .85m. New actual final-block tests retain3PASS/4FAIL before correction.

Only Beast.update ordinary custom-cow final support block changes: check actual supported displacement continuously against other cows at existing .85m, reject unsafe step and derive actual velocity. Existing overlap may depart without becoming closer; no snap/new side-step/route/priority/reservation change. Default and all other code byte-exact outside the block. One candidate, seven focused controlsPASS; no hard-stop-as-success claim.

Original five-cow paid feed queue completes30/60/120Hz in56.8667/57.4333/54.8333s within60s, all five actual full-weight visits and release; native occupied-bed bunk Apply/paid/token/geometry/46 placements and reload46 PASS. Global min separation.850004719m, max muzzle.033575085m below.08m; original speed, containment,1e-10 support/drift and.05 liftoff intact.76/76 relevant Node checks incl A3 negative locks, zero skips. Existing60Hz trough all-cow safety PASS29.55s and occupied robot service/exit/reward/reload PASS17.4s. One additive core file,108 registered; no fullcore/unrelated suites claimed.

Default no-Apply control has equal initial occupied bed positions/tokens but fails earlier speed bound both before/after at1002frames with exact same offending position and.002004713m excess. Strict whole-herd comparison FAIL retained: another cow differs by one directed step and setup37versus1 observed updates. No tolerance relaxed; do not claim identical full trajectories/default qualification or same eventual separation RED. Source audit/local final-block replay show default movement branch unchanged. Default speed finding remains separate pending triage.

Actual camera-only preview supplementPASS with every original assertion; preview-60/first-feed.png and retained-red-frame.png show cows under canopy at real feeding/formerRED time. Earlier occluded captures retained. Pinned local Windows Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5; five actual cows manually stepped, other41 static. Not full-farm/hosted/device/cloud/independent audit/owner visual approval.

All2392 baseline files accounted for,1713 prior evidence files/20 protected/seven approved adapter entries/A1A2A3 exact. Existing tests unchanged except additive runner. All owned commands/browser/server pairs complete; no disconnect/new denial; external CIM inventory unavailable/not retried. Original occupied shelter and active-feed Apply rejections stay unresolved, never replaced by easier bed-occupied case. Other facilities/internal traffic/import/Task8 and visual/merge gates pending. A4 exterior trips/transfers deferred. No merge/deploy. Full diagnosis/matrix/checkpoint in current evidence directory.


### Codex Task7 default speed and strict comparison classification - October23,2026

Base792f87c047341cf917d2777c5bf1184c528794c8; predecessor170347be78d83c874c85b97691b5a846585235cd, accepted main1115f93. Sole worker, parent-selected/disclosed Astra/xhigh. Acceptance before execution in farm3d/tests/evidence/pen-editing-implementation/task7-codex-default-speed-classification-20261023/progress.md; classification/impact/proposed follow-up in diagnosis.md. No runtime or old-test changes.

Controlled immutable pre/current browser runs have exactly equal complete cow/controller inputs, all1,001 five-cow frame states, captured movement/fit records, metrics and all46 failure actor records; default custom-guard entries zero. Both remain RED for identical .0020047129475116426m speed excess. Original real-time startup current replay again fails at1,002frames, as historical controls. Separate controlled boot freezes performance.now only through startup then restores it; cows acquire real beds in319 updates, no actor/task/velocity injection. It does not replace original startup evidence.

Actual ordinary Cow1 step is .014004712947511645m versus .012000000000000002m budget at60Hz, same1e-9 tolerance. Task null/running false/energy.25/dt1/60 exact; fit input/output and root height unchanged. Additive repulsion raises actual velocity above nominal .72m/s; default branch has no final speed cap. Exact steering source is identical in main/pre/current; whole main browser journey was not reproduced. This is a pre-existing physical speed-budget defect, not a792f87c regression and not waived. No runtime fix authorized by this regression-only assignment was needed.

Original strict whole-herd assertion still FAILS at unchanged1e-10: Cow2 differs .0132460645m X/-.0015230078m Z. Its initial equal bed positions/tokens concealed different care clocks and task deadlines (37versus1 setup updates); exact historical cowTickAt branch was not captured, so no unsupported exact-branch claim. Added whole-save-envelope strict check also FAILS and is retained: only orders/quests differ, already at startup and unchanged within each run. Cow/controller/physical equality does not imply whole-save equality. Numerical speed-boundary and deliberately changed-trajectory controls pass without relaxing existing assertions.

All2,448 baseline tracked bytes exact before relays, including1,766 historic evidence/20 protected/seven approved adapter records and A1/A2/A3/A4. Two new-source syntax checks pass, no core registration or unrelated suite reruns. Pinned local Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5; five actual cows manually stepped, other41 static. Not hosted/device/cloud/whole-farm/independent audit or visual approval.

Bounded custom correction remains supported; overall readiness pending. Proposed separate next slice: collision-safe default-cow displacement budget in Beast.update, preserving steering coefficients/clearance/reservations/rig and original30/60/120 queue/contact limits. No such change implemented here. Original occupied shelter/slab and active-feed placement rejections remain unresolved. Other facilities/internal traffic/import/Task8 and owner visual/merge gates pending. All owned commands/browser/server pairs completed, no new denial/disconnect; prior external CIM inventory unavailable/not retried. No merge/deploy.


### Codex Task7 default scope audit and occupied placement diagnosis - October23,2026

Base95a21337e3e140c4c383a09964256a0f4c58fa38; sole worker, parent-selected/disclosed Astra/xhigh. Main1115f93/branch fresh and clean at recovery. Acceptance before probes and exact scope in farm3d/tests/evidence/pen-editing-implementation/task7-codex-placement-scope-20261023/progress.md and authority-audit.md. No runtime changes.

Default-cow displacement correction is HELD for explicit owner scope approval: index is not a whole-file lock, but Task4 containment/care adapters, dog/cat exception and A1-A4 do not clearly grant ordinary default steering changes. The latest parent instruction expressly holds expansion. Keep speed finding visible for readiness; current evidence does not establish this exact correction is necessary for edited-layout final gates, and this diagnostic is absent from inspected workflow/core/package registrations. No assertion waived or original herd/whole-save comparison relabeled green.

Read-only production validator replay exactly reproduces original occupied-shelter PATH/OVERLAP/ROUTE and active-feed ROAMING issue lists from real captured World/actors. Five new shelter-only and five whole-cow relocation candidates remain invalid; no global impossibility or validator defect claimed. Separate south-boundary expansions validate. Native snapping requires two south posts down1 (to[10,-32]/[-14,-32]) and existing gate width+1 to clear the fixed path; original edge-down1 neighbour overlap and narrower gate path failures retained.

Separate native occupied-feed combined draft reaches full validation/Apply with74 trusted inputs per run, equal-clock paid state/tokens, actual bunk/station geometry and all46 exact publication placements. It exposes genuine first-resumed-frame contact RED: muzzle error.665370856m versus original.08m; side-camera replay.665024250m. World component null for feeding cow, validator selects generic staging, cow adapter keeps hold/weight1/until while replacing station, and updateCowTaskStep holds without approaching new dock. Default speed path is unrelated. Exact mechanism/proposed bounded custom contact-aware rebind review in diagnosis.md; no teleport, timer reset, clearance change, new locked scope or runtime patch. Completion/reload/30/120 not reached; both attempts FAIL.

All2,477 tracked baseline bytes exact before relays, including1,794 historic evidence,20 protected/seven reviewed adapters, approved spec/plan and A1-A4. Two new diagnostic syntax checks pass, no core registration or unchanged suite reruns. Pinned local Windows Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5; five actual cows manually stepped, other41 static. Actual side render retained under native-expanded-feed-side-60/occupied-feed-resumed.png; fixture/body angle limits direct mouth-gap visibility, world-space measurements are primary. Not hosted/device/cloud/full-farm/independent audit/visual approval.

Original occupied shelter and active-feed single-move rejections remain unresolved; separate combined Apply does not substitute for original acceptance or qualify care. Other facilities/internal traffic/import/Task8 pending, A4 exterior trips/transfers deferred. All owned commands/browser/server pairs complete; no new denial/disconnect, prior external CIM inventory unavailable/not retried. Default change pending owner authority, not tool-denied; custom rebind defect pending engineering follow-up. No merge/deploy.


### Codex Task7 occupied-feed contact rebind partial checkpoint - October23,2026

Base04f2a8eaf06f16fdd7c3eb1ff2bcd85565a83c60, sole worker, parent-selected/disclosed Astra/xhigh. Acceptance before edits in farm3d/tests/evidence/pen-editing-implementation/task7-codex-feed-rebind-20261023/progress.md. Exact unchanged native RED repeats mouth.663211535m versus.08m; both prior REDs remain frozen. New focused tests retain initial helper defects/source, corrected substantive5PASS/9FAIL before runtime. No existing assertion/seed/deadline changed.

Minimal candidate only cow adapter prepareLayoutRebind and index updateCowTaskStep: displaced feed/drink hold physically disengages/reapproaches with same task/token/generation/held/until, then actual full-weight mouth contact before credit. No dock teleport/timer reset, reservations remain; normal preemption releases. Relative contacts/departing visits/beds/robot unchanged. Final17 focused PASS including feed/drink30/60/120, blocked/expired/repeated edit and unreachable-contact negative control.48 affected +34 additional care/pose/ledger/lock checks PASS,99 distinct checks, zero skips. One additive core registration109; no fullcore claim.

Exact native combined draft still FAILS. Apply/paid/tokens/geometry/46 placements pass; first conditional frame passes only because stage is stand. Continuation fails unchanged speed assertion after6frames (.00032077274074084235m excess). Passive trace reveals cowYardActive=false: legacy full-width gate-access rectangle intersects two existing horse blocks, so yard hides and Beast bypasses directed care. Immutable04f2a8e reproduces same two conflicts and original contact RED. This corrects earlier attribution: prior first-resumed native frame did not prove updateCowTaskStep ran, although independent focused tests establish its rebind defect.

Production validator accepts same captured46 World and .42m gate-axis corridor; locked legacy guard rejects accessX[-5.2,-1.9],Z[-34.5,-29.5]. Both actual blocks lie outside cow enclosure/components; separate inserted gate/enclosure blockers are rejected by both contracts. No guard/geometry/clearance changed. Precise pending decision: retain full legacy access reservation and reject this draft, or explicitly authorize an agreed custom activation approach contract in index syncCowYard with narrow unlocked helper/tests. Never simply skip conflicts, hide speed failure or edit locked cow-yard bytes. See diagnosis.md/activation-contract.json. This is a contract/scope hold, not a tool denial. Native completion/reload and30/120 remain unqualified, not waived.

Actual inspected native-sync-diagnostic-60/occupied-feed-resumed.png shows cows/grass with cow yard hidden; not corrected contact or visual approval. Pinned local Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5; native editor/API fixture/manual five cows/other41static. Not hosted/device/cloud/full-farm/independent audit. All2502 tracked baseline files accounted for,1817 old evidence/20 protected/seven adapters/A1A2A3A4 exact; index outside directed step, including default movement, byte-exact.

All owned commands/browser/server pairs completed; executor connected, no new denial/disconnect, prior external CIM inventory unavailable/not retried. Default displacement remains held. Occupied shelter and original active-feed single-move rejection unresolved; other facilities/internal traffic/import/Task8 and owner visual/merge gates pending. A4 exterior trips/transfers deferred. No merge/deploy. A3 immutable real previews remain linked in coverage-matrix.md.


### Codex Task7 A5 full access restriction and legal feed return - October23,2026

Basecb4759d7, sole writer, parent-disclosed Astra/xhigh. Owner approval and exact transcript in docs/superpowers/specs/2026-10-23-full-access-placement-overlay-amendment.md: enforce existing full access before saving and add a ground placement overlay. No new locked exception or merge/visual approval. Acceptance and all evidence in farm3d/tests/evidence/pen-editing-implementation/task7-codex-access-overlay-20261023.

Only validator runtime changes: call unchanged cowYardConflicts with candidate full footprint/access and fixed/decor/candidate installed other-yard obstacles. Activation guard/geometry, index, contact candidate and all protected bytes unchanged. Three missing-access REDs and native before-save RED retained. Initial one-metre gate-shift positive hypothesis clips path; preserved as invalid control, not a fixed runtime defect. Separate offset11 control is valid.8 focused+24 unchanged validator checks,73 affected including focused,97 distinct NodePASS; zero skips. Core110 registrations, no fullcore run.

Native30/60/120 reject exact historic draft before save with ACCESS/disabled Apply and real programmatic Apply refusal, preserving full prior state. Separate native same-edge gate reattach plus10nudges reaches offset11/width3.3, same posts/bunk. Yard remains active; same occupied visit physically stands/approaches/aligns/contacts and completes7.8/7.8333/7.8s within60s, releases token, reloads46 with paid/geometry equality. Max muzzle.007999555m below.08; min separation1.220040983m above.85; unchanged speed bound. Original until/token/held preserved;60Hz additionally proves actual task/token references across Apply.122 trusted inputs each. Earlier REDs remain frozen; A5 explicitly changes acceptance of their illegal draft. This qualifies one selected occupied visit with five live cows, not all queues/full farm.

Actual contact renders retained/inspected; side angle and extra front view are partly occluded, measurements primary. Local pinned Chromium151.0.7922.34/Playwright1.62.1,1280x720,DPR.5,manual fivecow updates/other41static; not hosted/device/cloud/fullfarm/visual approval. All owned commands complete, no new denial/disconnect. Prior external CIM unavailable/not retried.

Ground overlay remains approved and pending; design records selected snapped-operation checks, non-color-only valid/blocked/unknown states/reasons, no hover mutation and bounded worker work because full46 validation is about.7s/candidate. Continue implementation next without a new approval request. Occupied shelter/other facilities/internal traffic/import/Task8 remain pending. Default movement held, A1A2A3A4 exact, no merge/deploy.


### Codex Task7 A5 selected-operation placement guide - October23,2026

Baseb109f470, sole worker, parent-disclosed Astra/xhigh unchanged. A5 already recorded; acceptance before code in farm3d/tests/evidence/pen-editing-implementation/task7-codex-placement-overlay-20261023/progress.md; exact outcome and intermediate failures in outcome.md.

Implemented isolated real-command candidates, single serial worker (25nearby positions,128cache, context cancellation), same full validator for every green, optional definite-static-failure shortcut only, terrain-following check/cross/unknown guide and reasons, pointer/touch inspection and native focus button. Actual command layer now enforces the existing fixed chicken whole-yard rule after retained RED. No runtime access/collision/care/rig/terrain/path/economy/auth change. Apply always revalidates.

80distinct NodePASS (16new+32editor/version/negative locks+32validator/access), zero skips,113core files registered, no fullcore run. New invalid vertex-count oracle and scripted-select fixture failures retained/classified and corrected; no old assertion relaxed. Candidate unknown-cell endless Checking RED fixed. Original live phone gesture regressionPASS. Five DPR1 native overlays1280x720/390x844/844x390/1024x768/768x1024PASS:10green/15blocked cat positions and1green/20blocked gate positions, authoritative agreement, exact hover state equality, chicken fixed,32/33trusted inputs, zero workers on close.50ms responsiveness probe20ticks in1000.9-1008ms; no broad performance claim.

Real in-game previews in native-final/cat-390.png, cat-1280.png and gate variants. Actual scene explicitly rendered in paused snapshot fixture; separate gesture regression has live frame loop. Inspected phone/desktop/tablet. Local pinned Chromium151.0.7922.34/Playwright1.62.1, not hosted/device/cloud/owner visual acceptance. Bounded local map; edge cells may be behind UI/offscreen, unknown/unmarked ground never green.

2,581baseline paths/1,890historic evidence exact except six authorized runtime/runner files before relays;20protected/seven exceptions/A1-A5 exact. index diff only overlay import/lifecycle/focus. Default movement held; occupied shelter/other facilities/full traffic/import/Task8 pending; original single-move rejection not replaced by earlier valid combined layout. A4 exterior features deferred. All owned commands complete, no new denial/disconnect, no merge/deploy.


### Codex Task7 occupied shelter placement and skin-oracle diagnosis - October23,2026

Base2b9ae20fead8bbdd15827b44bdecaa19a5622f0d, sole worker, parent-selected/disclosed Astra/xhigh unchanged. Main1115f93 and branch freshly verified at recovery. Acceptance before probes in farm3d/tests/evidence/pen-editing-implementation/task7-codex-shelter-scope-20261023/progress.md; reconciled coverage-matrix.md, diagnosis.md and outcome.md. No runtime or old-test change.

Original occupied shelter right-nudge issue list exactly reproduced. All64 independent integer anchors with five bed docks inside unchanged boundary (X=-5..2,Z=-40..-33), exhaustively confirmed against66,049 command anchors, are validly rejected. Only[-1,-40]/[0,-40] clear land/path, both create new real robot primitive overlaps. This captured-farm result is not global impossibility.18 composed geometry hypotheses and4 actual-command drafts rejected with all rules unchanged. A separate explicit shelter[-1,-40]/robot[12,-36]/reshaped north-east boundary/gateoffset16,width4.3 draft passes437 route records and actual native Apply.

Both native60Hz runs preserve paid state/reservations/same task-token object identities/timers/all46 placements/root translation, then FAIL original1e-8 skin-translation assertion at about9.340307e-8m. Passive second run proves all5 local bone/model/card matrices, rig state, root rotation/scale and skin weights bit-identical. Existing Float32 weight sums differ from1 by at most2.9802322387695312e-8; delta*(sumWeights-1) explains every vertex within2.145075e-14m. Bundled Three CPU oracle uses bone matrixWorld, not packed boneMatrices. Separate unchanged-rig/no-adapter15case diagnostic: both composed and original smaller translations fail strict limit for all5 rigs, zero controls pass, local bones exact. Original strict failures remain RED; no adapter deformation established.

PENDING precise test-contract decision, not tool denial: owner forbids assertion changes. Proposed review only, not implemented: keep1e-8 root and vertex residual limits/all physical limits; require exact local pose-state-weights and compare translation against unchanged-weight prediction, with deliberate root/bone negative controls and original REDs retained. No rig/library/geometry change proposed. Full support continuation/wake/release/reload30/120 remains unreached. Composed Apply does not replace independent shelter refusal.

All2,650 baseline paths exact before relays, including1,951 historic evidence/20 protected/seven exceptions/A1-A5; seven new source syntax checks pass, no core registration/fullsuite rerun. Local pinned Chromium151.0.7922.34/Playwright1.62.1,1280x720/DPR.5,seed4242, five actual cows manually updated/other41static. Real draft/failure screenshots retained but roof-occluded paused night view and no explicit post-Apply rerender; not continuation/contact visual proof, hosted/device/cloud/fullfarm or visual approval.

All owned commands/browser/server pairs complete, executor connected, no new denial/disconnect; prior external CIM unavailable/not retried. Other facilities/internal mixed traffic/import/Task8 pending. Default movement held, overlay unchanged/visual acceptance pending, A4 exterior features deferred. No merge/deploy.


### Codex placement-guide appearance acceptance and oracle proposal - October23,2026

Base63cc14d0bb9d742b34a5cc959899ffa3b841aa6d, clean branch/main refs verified, Astra/xhigh unchanged. Owner Yes to the shown2b9ae20 phone/desktop placement guide is recorded verbatim with message IDs in farm3d/docs/superpowers/specs/2026-10-23-placement-guide-visual-acceptance.md. This accepts guide appearance/readability only. No overall visual, rig, test-change, merge/deployment approval or actual-device gameplay proof. Overlay implementation unchanged.

Parent requested precise oracle proposal before seeking test-change approval. Formula: length((vertexAfter-vertexBefore)-commandedDelta*sumOfBeforeWeights)<1e-8m. Tolerance unchanged. Freeze both command delta and each vertex's stored weight sum before Apply; independent root displacement remains commandedDelta within1e-8m. Require exact local bone/model/card matrices, rig state, root orientation/scale and weights. Existing Float32 weight sums differ from1 by2.9802322387695312e-8 and cause the measured9.340307e-8m residual. No renormalization or rig/library change.

Separate proposal-only diagnostic at farm3d/tests/evidence/pen-editing-implementation/task7-codex-oracle-proposal-20261023: five unchanged root-only translations satisfy the proposal while allfive still fail original strict skin oracle. Seven deliberate corruptions rejected: extra root2e-8m, duplicate translation, body-bone2e-8m, body rotation, model scale, root rotation and changed weight. Expected values frozen beforehand; disposable private geometry only. Not native qualification, no assertion adopted/changed, no runner registration. Exact values in proposal.md and controls/results.json.

Existing tracked diff empty before relays; original shelter test/runtime/library/20protected/sevenexceptions unchanged, syntaxPASS. Both original native shelter REDs retained. Owner no-assertion-change instruction still holds adoption for precise decision. Shelter continuation/wake/reload/rates, remaining facilities/traffic/import/Task8/hosted/device remain pending. All owned commands complete, executor connected, no new denial/disconnect. No merge/deploy.

### Codex physical-phone menu obstruction: private preview v2 - October 23, 2026

Owner reported that the menus obscure the view after selecting a pen to move. Existing owner Library JPEG `libfile_5e834dbaa5cc8191b4cbed35ac225994` could not be materialized because the Windows Library helper failed at `os.setxattr` after download; its pixels were not inspected. A local 844x390 touch-enabled Chromium RED reproduced both full editor and placement panels covering much of the viewport. RED screenshot/measurement remain in `farm3d/tests/evidence/pen-editing-implementation/task7-codex-phone-menu-20261023/red/`.

Approved view adapter now collapses both panels on phone selection/movement, leaving a compact bottom Options/Apply/Cancel dock with item and validation reason. Options reopens full controls without discarding draft; focus follows visible controls. Preview-only builder hides its disposable-save badge during pen editing. No placement, care, animal, paid, save, terrain, path, rig or production cloud code changed. The focused rebuilt-artifact Chromium run passed selection, reopen, nudge, Cancel, valid Apply/reload, invalid Apply, touchCancel, portrait bounds and dirty Escape; machine records and rendered screenshots are in `final-built/`. Local viewport emulation is not physical-device clearance.

Disposable preview branch `codex/safe-test-preview-20261023` at `799cb0fbfc42f4cbbd324abfeeea80e8709fbbb4` rebuilt. Packaged view SHA256 matches source; static scan found no production Firebase or webhook endpoints. Existing owner-private Site `appgprj_6adb7f0aa0388191aa0ddab595515d06` source `30e5c347273080056da5388f205689efa7de5620`, version `appgver_a89fa1dc5c548191bec315882e7578aa`, deployed succeeded at `https://sunny-acres-phone-test-20261023.ardentanole10.chatgpt.site`. Access remains only the owner account. Owner physical-phone retest pending. Historical occupied shelter continuation and other Task 7/8 gates remain unresolved. No merge or live game deployment.

### Codex whole-ground grid local checkpoint and private-preview publication hold - October 23, 2026

Owner clarified that the grid should cover the whole open farm area except obstructions. The Library JPEG `libfile_cb01a133b458819199191802416b3adc` could not be inspected through the Windows materialization helper; actual rendered local RED at844x390 and1280x720 shows the old fixed y=.05 GridHelper and only25 pen candidate cells, no terrain-following base. RED screenshots/results retained in `task7-codex-full-ground-grid-20261023/red/`.

Source `8e88b995c52d4066da5bb11e45f673a7136e063f` replaces only the visual grid with a batched ground-following unchecked lattice. Existing land masks, object/path collisions, whole-footprint/support/access/care routing,25-candidate worker, Apply/save rules and compact phone menu remain unchanged. Focused actual farm results:2474 pen-grid cells,762 masked, x[-33,25]/z[-46,27]; ordinary Edit1964 cells inside its mask. Nine Node checksPASS, actual phone844x390/desktop1280x720 Chromium rendered with zero page errors and31.6/72.6ms one-time grid builds; sampled valid and blocked cells exactly agree with authoritative validator, including cow-gate access reason. Existing focused phone selection/reopen/nudge/Cancel/valid Apply+reload/invalid Apply/touchCancel/portrait/dirty Escape passes. No broad suites rerun. Real before/after and machine results in current evidence directory. Local browser is not physical device clearance.

The isolated output was rebuilt and scanned: no production Firebase/webhook endpoint, source and generated grid hashes matched. Owner-private Site `appgprj_6adb7f0aa0388191aa0ddab595515d06` was confirmed version2, one owner, zero external visitors. Existing Site source checkout was opened via supported helper and three dist files prepared locally. The next helper launch to package/push Site source was rejected by automatic approval review before execution: a push might trigger deployment, and it judged trusted owner deployment authorization insufficient. No retry or alternate publication route; private Site remains version2. Prepared dist is intentionally preserved. Exact additional authorization needed: owner approval to upload and publish this tested whole-area-grid build to the existing owner-private Sites preview. No main, production deployment or merge. Occupied shelter, other Task7/8 and physical-phone retest remain pending.

### Owner-approved owner-private grid preview publication - October 23, 2026

After the auto-review refusal, owner explicitly approved uploading and publishing the tested full-ground grid to the existing private Sunny Acres test Site, with no live-game change. This is new authority for one retry of the previously rejected Sites source helper. Before retry, verified Site version2/one owner/zero external visitors, prepared dist exact SHA256 matches isolated tested index/grid/view bytes and static scan excludes production Firebase and webhook endpoints. The formerly denied helper launch then succeeded; source d7927bb6a44a5abce4f09e22b20ae83d0d06e75e was packaged unchanged. Native save-and-deploy-private succeeded for version appgver_8c574feae9188191803ea9125a9162e3 at https://sunny-acres-phone-test-20261023.ardentanole10.chatgpt.site. Fresh get_site confirms latest version3, same owner-private access, one owner and zero external visitors. Sites checkout clean. The previous refusal remains historical evidence, not a current blocker.

No further game behavior, tests, assertions or source scope changed in publication. Focused local evidence remains at task7-codex-full-ground-grid-20261023: neutral whole-area grid, tree/object/path gaps, selected valid/blocked agreement, and phone menu regression. Owner physical-device retest and broader Task7/8/shelter gates still pending; no merge or live game deployment.

### Immediate buildable-land request: protected-scope hold - October 24, 2026

Owner clarified the request is actual buildability across suitable grassy map ground, farm expansion, and removable trees; when asked immediate versus purchased parcels, answered "Immediately". This removes the proposed parcel-purchase gate, not physical footprint/support/path/care requirements or the named protected-file gate. Prior full-ground grid v3 is visual only.

Read-only measurements: ground mesh spans220x220m; ordinary build placement uses onFarm radius23, pen land uses radius24 capsule plus baseline/A1 patches, camera pan has x[-24,24] and z[-43,28] clamps. Existing `More land` buys six additional field slots, not world extent. The north-east level clearing x14..25,z-44..-28 is a bounded first playable candidate; x24,z-40 is currently off onFarm24 with groundY0. Fixed-block fixture has no blocks in x14..27,z-46..-25, but actual full-footprint/care validation remains to prove. Two near trees have stable saved move IDs;14 hill/70 distant scenic trees lack saved removal IDs. Buildings are fixed-height at y0; opening outer hills without support/grading would be unsafe.

Proposed first-slice amendment and acceptance are in docs/superpowers/specs/2026-10-24-immediate-buildable-land-proposed-amendment.md. farm-land.js is protected with only A1 west-strip exception; broad "Immediately" did not name that file or authorize an east buildable-mask change. Await exact owner approval for a new narrow farm-land.js exception on the measured tract with no terrain-height edit. No indirect mask edit, test weakening, tree deletion, cost, save change, push, Site update, main change, merge or deployment. New screenshot Library ID libfile_5ef8020808b08191b9f43461a636fee2 was not inspected because the supported Windows materialization helper failed on previous screenshots; no repeated download loop.

### Codex immediate buildable land: first level tract - October 24, 2026

Owner explicitly approved farm3d/farm-land.js buildable-mask expansion starting with level north-east ground, without terrain-height changes, at 11:56 UTC. Exact exchange and A6 exception are in docs/superpowers/specs/2026-10-24-immediate-buildable-land-proposed-amendment.md. The prior A1 land digest 6a739a8a becomes d736eb4e; prefix/suffix negative locks prove A1 terrain, old farm membership/player clamp and other protected bytes unchanged. No parcels or currency charge.

The first x14..25,z-44..-28m tract is now shared by ordinary building and pen land masks; the neutral grid shows only unchecked cells there, and edit-only zoom/pan reaches it. This is a first slice, not all grassy ground. The actual old-ref browser rejects a loom at (20,-40), while current source accepts it; native pointer move, Apply, saved old-guest layout, reload and desktop render pass. Tree/path/outside-footprint controls reject. 27 relevant Node checks, four deliberate A6 lock checks and local phone/desktop isolated-candidate grid smoke pass. Exact results, retained RED and previews are in tests/evidence/immediate-buildable-land-20261024/progress.md; fixture failures are retained under task/SunnyAcres-land-diagnostic-history-20261024. Local browser is not official CI or physical-device proof.

An isolated disposable candidate exists at task/SunnyAcres-preview-land-20261024. Its cloud-disabled auth/game bytes equal the prior preview and static scan finds no production Firebase/webhook markers. The owner-private Site remains version 3: this candidate has not been uploaded or deployed, pending new explicit owner approval for upload/private publication. Existing live game, main, historical PRs and dirty shelter checkout remain unchanged. Remaining owner goal: all suitable grass, safe uneven-ground building support/access, removable trees with stable saved IDs and confirmation; broader Task7/8 and physical testing also remain. No merge or live deployment.

### Codex whole existing level north clearing - October 24, 2026

The owner-approved buildable mask now covers the entire terrain-defined flat north clearing x[-33,25],z[-46,-25], including the first northeast pocket and A1 west strip. A measured (-28,-40) RED became valid for all six ordinary workshops via the same editor footprint/collision check. Actual native pointer drag of the loom from the previous saved east location, Apply and reload passed. West/north fade, tree and path controls still reject; neutral unchecked grid reaches west. No terrain, old onFarm, player clamp, A1 horse level, path, rig, paid state or fixed chicken rule changed. Pen land uses the same mask but an owned pen Apply in this new area is not yet qualified.

Node 15 direct land/grid/A1/protected plus17 pen placement/access PASS, including four deliberate A6 negative locks. Local isolated candidate at task/SunnyAcres-preview-north-clearing-20261024 passed phone844x390/desktop1280x720 grid smoke with2664 cells,762 holes, zero page errors; cloud-disabled auth/game bytes match the prior private preview. Desktop real west placement screenshot and exact RED/green machine results are in tests/evidence/north-clearing-build-20261024. Local Chromium is not hosted, official CI, or physical-device evidence. The candidate was not uploaded; previous owner-private Site version3 was not changed, and a new explicit private-publication approval is pending.

This completes only the existing flat north clearing, not the owner's full grass-map request. Sample workshop footprints on nearby slopes vary 0.21-0.82m in ground height while existing building roots/decals sit at y0; a mask-only expansion would visibly bury/float buildings and threaten entrances. Future slope foundations/support, access and care routes, plus persistent removable hill trees, require separately bounded scope. Full Task7/8, shelter, owner visual, merge and live-deployment gates remain open. Main and unrelated worktrees untouched.

### Suitable-grass implementation scope checkpoint - October 24, 2026

Owner directed implementation of the researched full suitable-grass plan at 12:50 UTC. Read-only audit and exact staged acceptance/protected-scope proposal are recorded in `docs/superpowers/specs/2026-10-24-suitable-grass-implementation-gates.md`. A6 approves only the `farm-land.js` buildable-mask range, with terrain heights unchanged. The new ordinary edit, save and cache work requires a named-file owner amendment for `index.html` (`groundAt`, `editValid`, `commitEdit`, `applyLayout`, camera and tree registry/confirmation), `game.js` (versioned landscape state and persist-before-publish ordinary edit) and `sw.js` (changed module cache/version entries). Pen hillside validation remains separately gated if an actual gap is proved. No protected code, gameplay or tests were changed at this checkpoint; no private Site upload, live deployment or merge. Prior north-clearing evidence and unresolved shelter/Task7/8 gates are preserved.

### A7 named-file approval and ordinary-edit transaction stage - October 24, 2026

Owner answered "Approved" at 12:58 UTC to the exact `index.html` placement/camera/foundation/tree-control, `game.js` safe-save/recovery/tree-persistence and `sw.js` offline-cache scopes; terrain heights, rigs, economy, Firebase rules, fixed chicken yard, merge and live deployment remain excluded. A7 exchange, baseline digests and staged acceptance are recorded in `docs/superpowers/specs/2026-10-24-suitable-grass-implementation-gates.md`.

Stage1 RED and focused evidence: `tests/evidence/suitable-grass-20261024/stage1.md`. The ordinary editor now final-revalidates and commits a complete farm candidate to storage before publishing the live visual/block registry; quota and stale failures restore the drag without moving the farm. Four new transaction tests, 13 existing pen-save, three immediate land and nine A6/A7/protected/remaining-care checks PASS, including an unrelated-economy mutation negative guard. Native local Chromium old-ref RED/current `b:loom` pointer Apply/reload at (-28,-40) PASS. A7 game digest is registered with predecessor and frozen out-of-scope prefix/suffix. Game cache/import v32 and service worker v66 are paired. No hillside/root support, full-map mask, persistent tree clearing, owner-private Site update, merge or live deploy is claimed. Shelter/default-speed/remaining Task7/8 remain open.

### Suitable-grass Stage 2 bounded local checkpoint - October 24, 2026

A6 buildable-mask expansion now matches the frozen 40 m player-clamp capsule rather than the old 23 m buildable radius; terrain heights, original farm membership and player clamp bytes remain unchanged. A7 editor uses exact rendered terrain triangle picking, full-footprint 9x9 support sampling, a 0.35 m maximum pier gap and a 3 m entrance ramp with at most 0.50 m rise. Owned workshops remain upright with visible stone supports; selected placements still pass original obstacles, pens, path and care approach checks. The edit camera reaches the expanded region and the neutral grid uses bounded camera-following windows for masks above 10,000 cells. No animal-pen hillside support claim is made.

An actual owned loom was dragged by native pointer from (20,-40) to grassy hillside (30,-30), applied, and reloaded with the same root height and saved position; (30,-40) stayed rejected for support. Local rendered foundation evidence and exact result are in `tests/evidence/suitable-grass-20261024/stage2.md`. Thirty-five focused land, site, save, grid, A6/A7 lock and physical-care integration Node checks pass. The broader pre-existing pen-entry browser script reached a valid sheep draft with physical pause and input isolation but stopped at its old Close-button expectation: the current compact phone editor exposes Options instead. Retain this as an unqualified journey; do not weaken its existing assertion. Local Chromium is not hosted or physical-device proof.

The full 220 m grassy map remains pending: the player is still bounded by the protected 40 m `farm-land.js::clampToFarm`, so extending advertised placement beyond that requires explicit named-file approval and player/route qualification. Tree clearing, Stage 3/4, occupied shelter, full Task 7/8 and owner-private Site update remain pending. No merge or live deployment.

### A7 reachable-tree clearing checkpoint and A8 approval - October 24, 2026

Owner approved the exact A8 `farm-land.js::clampToFarm` player-reach expansion at 13:29 UTC, preserving terrain and obstacle collision; this is recorded in the suitable-grass implementation gates. A8 has not yet changed the clamp. The current separate A7 tree checkpoint offers explicit free clearing for the two courtyard trees and fourteen individually rendered hill trees within the old player reach. Stable IDs, writer-v5 removal persistence, a true storage-before-scene publication barrier, physical hill/courtyard blocks, visual/contact removal and old-save tree presence are implemented. Thirty-one focused save/writer/tree Node checks, nine A6/A7/protected/care checks and twelve placement/navigation/tree checks pass. The existing writer ceiling assertion was updated from 4 to 5 without changing old-version compatibility assertions. Actual local landscape-phone pointer journeys passed Cancel, confirmed courtyard-tree removal, reload, visit/home restoration and a reachable hill-tree removal/reload. Exact raw results and rendered previews are in `tests/evidence/suitable-grass-20261024/stage3.md`.

The 70 distant woods are merged and still outside the old clamp, so they are not yet clearable. A8 expanded reach, woods catalogue/rendering, full-map building support, backup/import/cloud conflict checks and hosted/physical-phone qualification remain. The pen-entry script's historic Close-button RED remains unmodified: compact mode exposes Options, which reopens the same Close action, but the full journey was not retested. Prior shelter/default-speed and Task 7/8 gates remain. No owner-private Site update, push, merge or live deployment; GitHub DNS remained unavailable at the previous checkpoint.

### A8 full-map and distant-woods local checkpoint - October 24, 2026

Owner explicitly approved `farm-land.js::clampToFarm` expansion at 13:29 UTC, without terrain-height or obstacle relaxation. A6 full-footprint buildable mask and A8 player clamp now cover the rendered 220 m map inside a 1 m edge margin; edit/pinch camera reaches that area. Ordinary owned workshops still require the unchanged terrain, foundation/entrance, obstacle, path, care and ownership checks. Stable records freeze all 70 predecessor distant-woods transforms and render them in nine rebuildable merged chunks; 63 sites lie in the playable square and are individually selectable, physically blocking, and removable through the existing explicit free confirmation and durable v5 save. Seven decorative sites outside player bounds are intentionally not selectable. Chicken-yard and separately qualified pen placement rules remain unchanged.

Retained old RED: grass at (45,-100) met workshop support but failed old land mask; player target (75,60) was clamped near (32.689,27.409). Current focused checks: 18 Node including terrain/clamp negative locks; actual landscape-phone Chromium full-map/trunk removal/owned loom pointer Apply and reload PASS; existing courtyard/hill tree clear regression PASS; equivalent visible Options > Close dirty-pen Keep editing/Discard browser route PASS without changing the historical test. Native results and screenshots are under `tests/evidence/suitable-grass-20261024/stage4.md`. Initial tree browser launch was denied localhost by sandbox, then the approved local retry passed. These are local diagnostics, not hosted or physical-device results. Earlier shelter/default-speed/full Task 7/8 issues remain unresolved. No merge or live deployment. Owner-private Site has not yet been updated with this candidate.

### Stage 4 private-preview delivery blocked by Sites source DNS - October 24, 2026

The checked-in `tools/build-safe-test-preview.cjs` built game commit `0f62550d42725838ba0840980302f7939849d545` into the separate disposable candidate `task/SunnyAcres-preview-stage4-20261024`. Candidate land, tree identity/removal, support and grid modules match the game source byte-for-byte. Packaged auth is the 148-byte no-cloud stub; real 2D/backup imports and persistent service-worker registration are disabled, CSP connects only to its own origin, and the static scan found no production Firebase or webhook endpoint. No real save was copied. The existing Site `appgprj_6adb7f0aa0388191aa0ddab595515d06` is owner-only with zero external visitors.

The supported Sites source helper was attempted once with a fresh short-lived credential, but its Git destination `git.chatgpt-team.site` could not resolve. The helper did not open or push source; no version was saved or deployed. A fresh `get_site` confirmed older version 3 remains live at `https://sunny-acres-phone-test-20261023.ardentanole10.chatgpt.site`. The separate GitHub push failed DNS resolution of `github.com`. Do not present that URL as Stage 4. The candidate directory and source commit are preserved for a normal retry when executor DNS is restored; no alternate network route, settings change or deployment was attempted.

### Stage 4 owner-private Sites publication completed - October 24, 2026

After read-only checks showed `git.chatgpt-team.site` reachable through the supported permitted execution path, the existing Sites source helper opened the clean v3 checkout and synchronized the previously built isolated Stage 4 candidate. All 114 candidate static files matched the checkout byte-for-byte with zero extras; static scan found no production Firebase/webhook endpoint and auth remained the 148-byte no-cloud stub. The helper pushed Sites source commit `91491b90ec2efb4f2cda0c411341078b2e959095` and packaged its exact source. Native owner-private save-and-deploy succeeded for version 4, ID `appgprj_6adb7f0aa0388191aa0ddab595515d06~appgver_45a1764a8c2c819193c53f37a69475f1`, deployment `appgdep_6add092b77548191a95506580e41c99d`, at `https://sunny-acres-phone-test-20261023.ardentanole10.chatgpt.site`. Fresh `get_site` confirmed version 4, custom owner-only access with one owner and zero external visitors; `get_site_version` confirmed source SHA and 115 archive files (including hosting manifest). The native deployment result was terminal succeeded. Browser UI smoke was unavailable in this executor, so physical phone testing remains the owner's next check. The earlier DNS failure is historical; no GitHub push, main merge or live game deployment occurred.

### Occupied cow shelter native continuation qualified locally - October 24, 2026

Owner phone-tested the owner-private Site v4 and reported “Works good”; that is usability feedback, separate from release qualification. On `codex/safe-test-preview-20261023`, the approved occupied-shelter oracle and test-only composed journey were brought forward without changing runtime, rig, terrain, economy or protected implementation. The original independent shelter move remained invalid; a fully valid native composed edit was used for the occupied test. Research found the paused observer repeatedly invoked `__dbg.penRuntime` inside each of 158,640 per-frame vertex checks, rebuilding the 46-animal snapshot. The test now caches the site once and uses an exact rectangle support sampler, with a 10,000-point Node equivalence check and all-vertex production comparisons before and after continuation. Original physical assertions, seed and simulated deadlines remain unchanged.

Native local Chromium composed journeys passed at 30, 60 and 120 Hz, each through five real occupied beds, Apply, hold/wake/release, every-vertex support/contact/separation/speed checks, trusted input and save/reload. Exact results, historical unsuccessful launch artifacts, screenshots and diagnosis are in `tests/evidence/pen-editing-implementation/task7-codex-shelter-diagnosis-20261024/progress.md`. The first 60 Hz invocation was interrupted by tool output overflow, and a subsequent launch failed before game startup for missing `CHROME_PATH`; both were preserved, not counted as game failures or passes. The corrected logged run passed. The separate original dirty checkout and its evidence were not edited. Official CI, hosted qualification, physical-device shelter checks, default-cow speed, remaining Task 7/8 integration, visual acceptance and merge approval remain open. No merge or live deployment.

### Farm-transition local qualification and push hold - October 24, 2026

At clean local shelter head `85bbac6`, Task 7/8 open gates were reconciled in `tests/evidence/pen-editing-implementation/task7-codex-farm-transitions-20261024/remaining-gates.md`. The real Settings > Start a new farm Cancel preserved the custom horse layout, all four horses and saved bytes; confirmation retired the custom pen/herd and installed defaults. A newly authored strict whole-save byte assertion after new-farm reload remains RED. Exact raw diff: ordinary boot generated today's `quests` from null and advanced `lastSeen`; all other top-level saved fields were equal. No product defect or runtime change is claimed. The proposed narrow oracle correction and four deliberate corruption controls are documented but have not been applied pending owner approval under the no-weakened-test rule.

An independent ordinary-mode 2D fixture import through visible “Bring my farm” passed: exact coins/gems/xp/level, three chickens and one dog installed in default facilities, source 2D save untouched, and those values retained after reload with zero page errors. The initial shot-mode harness failure is retained because shot mode closes startup panels; the corrected run used the unchanged fixture and visible control. Raw local browser results/screenshots and limits are in the same evidence directory. This is not cloud/official CI/device qualification. No merge, live deploy or Site update.

The normal GitHub push of the shelter checkpoint was automatically rejected before process execution: the approval reviewer could not verify authorization to disclose this private branch payload to `pederaus9-ux/Bugsy`. The owner has been asked for explicit push authorization; no retry or alternative route is attempted while it is pending. The local branch remains the source of truth for this checkpoint.

### Task 8 cache-predecessor exact-head review - October 24, 2026

At local head `eaaa801`, the unchanged `versions.test.mjs`/worker-transition Node run found two version/boot-graph REDs: page and offline shell import `farm-land.js?v=5`, but `animal-pen-validation.js` and the placement worker import `?v=3`; the worker-transition unit control passed. Direct source and standards diagnosis is in `tests/evidence/pen-editing-implementation/task8-codex-cache-predecessor-20261024/progress.md`. A safe correction requires those two stale imports plus consistent cache-busting versions up their importer chain and matching `index.html`/`sw.js` shell. No files were changed for this cache finding. The validator and other newly required modules are outside A7's named-file scope, so one explicit bundled owner amendment is needed before editing; no version assertion was weakened or unchanged failing command blindly rerun. Actual predecessor/offline browser qualification remains open. The new-farm reload oracle correction and GitHub push separately await owner decisions. No merge or live deployment.

### A9 approved cache alignment and new-farm oracle checkpoint - October 24, 2026

At 22:29 UTC the owner approved the exact seven-file version-only cache amendment, a strict new-farm reload oracle correction, and a normal upload of `codex/safe-test-preview-20261023` to `pederaus9-ux/Bugsy`. The named authority is recorded in `docs/superpowers/specs/2026-10-24-cache-and-farm-transition-amendment.md`. The old cache and new-farm REDs remain preserved. Nested `farm-land.js` imports now use `v=5`; importer and shell URLs were bumped consistently, with offline cache `sa3d-v71`. No geometry, runtime clearance, terrain, rig, save or economy behavior changed. Matching test import URL versions changed without assertion edits.

The approved new-farm oracle still compares every other save field exactly; it independently requires exact current-day daily quest initialization and a bounded monotonic `lastSeen`. Thirteen deliberate corruption controls reject paid/ownership/layout, quest and timestamp errors. Focused oracle/cache/worker Node checks pass 24/24. A real local Chromium combined journey passed new-farm Cancel, confirmed reset and reload, then reached the visible 2D import paid/ownership/default-pen checks. Its separate 2D raw whole-save equality remains RED because `lastSeen` advanced and `lastNag` was initialized on reload. That assertion is outside the new-farm-only approval and remains untouched; the earlier independent 2D import/reload focused check remains credited. Raw results and trace are under `tests/evidence/pen-editing-implementation/task7-codex-farm-transitions-20261024/approved-oracle-candidate`.

The directly affected placement browser completed 25 candidate/authoritative comparisons and 20 responsive ticks at 1280x720, then stopped on its unchanged ambiguous Cancel locator because compact UI renders two matching controls. Old editor-view/integration synthetic fixtures separately fail on absent `selectedOptions[0]`, and an integration camera assertion still expects the pre-A8 +/-24 m boundary. These REDs are retained without weakening or speculative fixes in `tests/evidence/pen-editing-implementation/task8-codex-cache-predecessor-20261024`. The actual predecessor/offline browser transition, other viewports, broad Task 7/8, hosted/device and merge gates remain open. Owner-private Site v4 is unchanged; no live deployment. The explicit branch upload is pending final remote/fast-forward verification at this checkpoint.

### A9 authorized branch upload verified - October 24, 2026

The clean A9 code/evidence checkpoint `3f481825b2f245dabead8c86abdf08d1de10a247` was pushed normally to `origin/codex/safe-test-preview-20261023` under the owner's new explicit upload approval. A fresh `ls-remote` returned the same SHA. The remote's prior `253e72b` was confirmed an ancestor before the push; no force-push, PR, merge, Site update or live deployment occurred. The prior automatic-review rejection was before execution and is resolved by this successful authorized operation. Remaining REDs and release gates above remain unchanged.

### A9 local predecessor-worker transition and A10 proposal - October 24, 2026

The exact `sa3d-v70` Git predecessor `69d79e6` and approved `sa3d-v71` Git source `d4276b0` were exercised in an isolated localhost Chromium profile with a saved custom four-horse pen. The real worker became distinct/active/controlling, v70 cache was replaced while an unrelated cache survived, three cached module hashes matched current Git bytes, and no stale land `v3` cache entry remained. Both online and zero-server-response offline reloads preserved every non-lifecycle save field, four owned horses and the installed custom pen. Four browser stages passed with zero browser errors. A first restricted Chrome launch failed before startup with a crashpad pipe error and is retained; one supported isolated retry passed. Acceptance, raw results, transport and rendered offline frame are in `tests/evidence/pen-editing-implementation/task8-codex-cache-predecessor-20261024`. This is local browser proof, not hosted or physical PWA qualification.

A separate **unapproved** test-only A10 proposal is in `docs/superpowers/specs/2026-10-24-test-fixture-oracle-proposal.md`. It names the exact 2D reload (`lastSeen`/`lastNag`), visible Cancel selector, synthetic `selectedOptions`, and animal-pen draft-pan bound corrections with strict replacement checks and negative controls. No pending test assertion or fixture was edited. Source review corrected an earlier imprecise relay description: the specific animal-pen pointer-pan handler currently clamps x to `[-24,27]` and z to `[-46,28]`; its old test asserts x `[-24,24]` and z `[-43,28]`. This is separate from A8's general map access. The historical REDs and broader release gates remain open; no live deployment or merge.

### A11 supported outer-map animal pens and A10 fixture checkpoint - October 24, 2026

The owner approved the narrow real pen-camera/land-mask correction and three test-only A10 corrections at 22:59 UTC; the small-bound oracle update was withdrawn. Approval, original bytes, retained two REDs, exact changes and evidence are in `docs/superpowers/specs/2026-10-24-full-map-animal-pen-amendment.md` and `tests/evidence/pen-editing-implementation/task7-codex-full-map-pens-20261024/progress.md`. The pen candidate land and two-finger draft pan now reach the rendered ±109 m map. Unchanged complete-footprint support, obstacle, gate, care-route, collision, paid/save and fixed-chicken constraints still govern Apply. Real local Chromium native Apply/reload of an owned four-horse enclosure at outer x=-37 m passed; object, edge and unsupported-slope controls failed correctly. The outer fence still retains its existing supported shelter; no far care-building pad has been qualified.

The strict 2D oracle and deliberate corruption controls passed, and the real six-stage new-farm/2D-import browser journey passed. Editor fixture tests passed, then the five-viewport full-ownership placement/Cancel journey passed with actual visible Options navigation, native touch/pointer controls, worker/authority agreement, fixed-chicken protection and exact saved bytes/paid/actor state after Cancel. Earlier phone test-driver REDs and rendered local screenshots are preserved. This is local Chromium evidence, not official hosted/physical-device qualification. **Cache-version hold:** the new validator bytes still sit behind `?v=2`, so offline publication requires a fresh version-only importer-chain/cache amendment; A9's previous v1→v2 alignment does not clearly cover this new generation. The required files and v2→v3/v71→v72 plan are in the progress note. No cache edits, remote push, Site update, merge or live deployment for this A11 checkpoint yet. Other Task 7/8 release gates remain open.

Local code/evidence commit `20a515175c647bdfdfc2704e45876111af206a95` was saved. Read-only remote verification found `origin/codex/safe-test-preview-20261023` still at `8061826`. The attempted normal push was automatically rejected before execution because the reviewer did not find explicit owner authorization to disclose this new A11 checkpoint. It was not retried by another route. The remote and Site remain unchanged; a specific new owner approval for this A11 branch upload is needed before retrying. Cache scope separately remains pending.

### A12 owner-approved v72 cache and offline predecessor checkpoint - October 24, 2026

At 23:25 UTC the owner explicitly approved the exact version-only importer/cache chain and upload of the new A11 checkpoint. The authority and before hashes are recorded in `docs/superpowers/specs/2026-10-24-a11-cache-version-and-upload-amendment.md`. The chain now resolves validator and placement modules at v3 through the page, worker and editor, with `sa3d-v72`; unchanged `farm-land.js?v=5` remains shared. Only matching current test imports changed. Original v70→v71 test and frozen evidence remain intact. Static version/worker checks passed 10/10; directly affected placement/editor/full-map/version tests passed 27/27. A real isolated Chrome upgrade from pinned v71 commit `8061826` to candidate `a660780` passed distinct worker activation, old-cache deletion, unrelated-cache preservation, exact v3 module digests, and both online and zero-server-response offline reload of the custom four-horse save. Full raw results and rendered offline evidence are in `tests/evidence/pen-editing-implementation/task8-codex-cache-v72-20261024/progress.md`. Local browser evidence does not establish hosted or physical-device PWA behavior. The owner-authorized normal feature-branch push succeeded at `4c3335ac80393aaf261ebac87a5c3da062982ba7`, confirmed by fresh `ls-remote`; the earlier denied push did not execute. No force-push, merge, Site update or live deployment.

A second, documentation-only push for the local successful-upload relay commit `f3a7476` was automatically denied before execution: the reviewer interpreted the owner's upload approval as one-time. The branch's tested code/evidence remains published at `4c3335a`; the final relay update is local only. No alternative upload route or retry was used.

### Task 8 full-herd resource cycles, local-only checkpoint - October 24, 2026

After the A12 branch upload, the next independent local Task 8 gate exercised 20 alternating native Apply/Cancel/rebuild cycles with a paid, owned 46-animal farm at 1280×720 and 844×390. The first test-driver RED and source diagnosis are retained: after Apply, the existing edit bar remains open and its visible “Animal pens” control is the correct reentry path. The final test also follows compact phone Options between nudges. No game runtime or physical validator was edited. Both final viewport runs passed all 20 cycles: every Apply published a supported x=-36/-37 m horse-fence variant and advanced the layout revision; every Cancel preserved exact saved bytes and actor state. Renderer geometry/texture counts returned exactly to the warmed 356/106 baseline after every closed edit, all 46 animals and paid state remained, preview durations were recorded, workers/guide were released and browser errors were zero. Acceptance, failure trace, raw results and real local rendered frames are in `tests/evidence/pen-editing-implementation/task8-codex-resource-cycles-20261024/progress.md`. This does not qualify other edit classes, hosted or physical-device resource use, three-night care, cloud recovery or merge readiness. The earlier relay-only push denial remains held; this checkpoint is local and no remote write, Site update or live deployment was attempted.

### Task 8 full-herd installed-care RED, local-only diagnostic - October 24, 2026

After a real saved sheep-pen Apply with all 46 animals, a 300-frame 30 Hz cost sample passed and measured 715.4 ms for 10 simulated seconds. The bounded first integrated night then passed the full 40 s waking phase but failed the original 500 s bedtime deadline: all cows, horses, sheep and pets reached beds, while two chickens remained at coop approaches and 28 waited. The exact RED, screenshots and trace are retained. One same-seed/same-deadline instrumented replay confirmed lead birds repeatedly replanned at the two inflated coop doorway edges. A short read-only before/after Apply probe verified that scene publication replaces all six chicken collision arrays, while the chicken-care generic external-block callback in protected `index.html` excludes only the original array identities. It consequently misclassifies the new coop doorway blocks as external. Acceptance, measured cost, raw observations, source diagnosis, and the exact narrow proposed callback correction are in `tests/evidence/pen-editing-implementation/task8-codex-full-herd-care-20261024/progress.md`. No runtime correction was made: this chicken-care callback is outside existing named approvals, so owner approval for precisely that `index.html` scope is required. Full five-class/two-seed/three-rate/three-night qualification remains RED/unrun. No remote write, Site update, merge or live deployment occurred; the earlier denied relay-only push remains held.

### A13 chicken-care Apply correction, newly exposed cow-route RED - October 24, 2026

The owner approved only `farm3d/index.html`'s chicken-care collision callback at 23:50 UTC. The named amendment and before/after SHA-256 are in `docs/superpowers/specs/2026-10-24-chicken-care-apply-collision-amendment.md` and the full local evidence note. One predicate now treats the scene registry's rebuilt chicken blocks as own-coop blocks; external physical blocks, ramp/support, separation, lanes and deadlines remain in force. A post-Apply real external-block negative control passed: the chick never entered the new obstacle in 500 s, then settled in 446 frames after its removal. The original all-46 sheep-edit test reached beds for all 30 chickens, four horses, five sheep and both pets were in bed hold, eliminating the retained coop blockage, but remained RED at the unchanged 500 s deadline because cows 2 and 4 did not settle. A same-deadline route diagnostic showed both orbiting the same cow-bed-3 approach waypoint at existing 0.85 m separation, while cow 4 actually owned bed 5. Source `beginCowTask` can add that shared approach by proximity to another bed; directed movement cannot resolve the conflict. No cow code was edited. The exact original RED, new RED, route traces, owner approval, and focused controls are in `tests/evidence/pen-editing-implementation/task8-codex-full-herd-care-20261024/progress.md`. A distinct owner amendment for protected cow task waypoint/approach logic is pending; A13 chicken approval does not cover it. Full Task 8 matrix, hosted/device and merge gates remain open. This is local only; no remote retry, Site update, merge or live deployment.

### A14 cow waypoint correction and strict wake-oracle proposal - October 25, 2026

The owner approved `beginCowTask` waypoint selection and necessary approach handoff, plus other pen-related issue fixes, at 23:57 UTC October 24. The scope and protected-file hash are recorded in `docs/superpowers/specs/2026-10-24-pen-routing-owner-amendment.md`. A focused RED showed cow 4, assigned bed 5, claiming a nearby bed-3 approach. A one-condition correction omits that false approach only for bedtime; real bed-to-feed departures retain their exit approach. The focused control and all 21 cow-scene regression tests pass. In the original seed-4242, 30 Hz, real sheep-Apply full-herd prerequisite, all 46 reached distinct bed holds in 263.9 seconds, within the unchanged 500-second goal. The original wake assertion remains RED: its shared task-free frame plus another shared task-free frame 40 seconds later fails when ordinary daytime naps begin. An observation-only same-seed/deadline trace found all 46 first overnight-bed releases within 284.14 seconds after bedtime completion, each with at least 61.1 continuous seconds until its next bed task. The original browser test was restored unchanged; `tests/evidence/pen-editing-implementation/task8-codex-cow-waypoint-20261024/progress.md` retains all results, and `wake-oracle-proposal.md` specifies a strict individual 40-second check with deliberate failure controls. That test-only amendment needs an exact owner decision before changing the assertion. The full five-class/two-seed/three-rate/three-night matrix, recovery/cloud, hosted/device and merge gates remain open. Work is local only; the denied relay-only remote upload remains held. No Site update, merge or live deployment.

### A15 owner-approved individual physical wake, roaming/core RED - October 25, 2026

The owner approved the individual physical release and 40-second wake interpretation at 00:20 UTC. The named acceptance amendment, nine passing strict unit controls, original test-only correction and retained browser outcomes are in `docs/superpowers/specs/2026-10-25-individual-wake-owner-amendment.md` and `tests/evidence/pen-editing-implementation/task8-codex-individual-wake-20261025/progress.md`. The 500-second physical departure limit, 1200 consecutive 30 Hz wake frames, stable 46 identities, distinct bed reservations, containment and paid state remain. A first browser launch was sandbox-blocked before page load; the supported loopback run reached all 46 beds by 282.17 seconds. Source review corrected a test-only overbroad bed-support rectangle, because horse drink docks intentionally share its slab; a second candidate exposed a missing resolved-margin fixture source. After reading the existing template margin directly, the strict approved physical test found a real cow-1 RED: after leaving bed 2 it grazed back within the 0.65 m occupied core at wake frame 182, only 123 frames after first departure, without a bed task. No runtime fix or threshold change was made. A product decision is now needed on whether active travel through a sleep core violates the required 40-second physical wake or whether the oracle may treat active non-sleep travel as awake. Preserve the RED; do not silently alter movement or acceptance. Full Task 8 matrix, hosted/device/cloud and merge gates remain open. No remote upload, Site update, merge or live deployment.

### A16/A17 night-only cows and individual post-bed wake, local prerequisite PASS - October 25, 2026

Owner clarified that cows rest at night only; this does not change other species. The named A16/A17 amendments, retained REDs, diagnosis, controls and local browser result are in `docs/superpowers/specs/2026-10-25-cows-rest-at-night-owner-amendment.md`, `docs/superpowers/specs/2026-10-25-chicken-postbed-wake-owner-amendment.md` and `tests/evidence/pen-editing-implementation/task8-codex-cow-night-only-20261025/progress.md`. Cows now request/hold beds only during the existing effective night and cannot pick generic daytime rest. Ordinary cow grass targets respect the existing 1.5 m steering clearance and depart an occupied bed through the already-authored care exit. The A15 oracle distinguishes measured motion from a mere `act=moving` label; the previous 0.4 m/2.5 s route-replan heuristic is not used as a sleep/stuck classification. Frozen actors, premature rest, missed/late departures and identities still fail. A newly exposed chicken RED showed generic rest 791 frames after leaving its overnight bed; its individual 40-second post-exit barrier now blocks generic and care-bed naps, then permits later naps. Local focused/regression checks pass: cow scene 26/26, chicken controller 27/27, wake oracle 12/12. The original saved sheep-pen Apply, 46-animal, seed-4242, 30 Hz browser prerequisite passes with distinct beds by 276.87 s, every physical departure by 301.13 s (<500 s) and every continuous 40-second wake by 341.13 s; paid state, saved revision, containment and browser-error checks pass. The original failures remain in evidence. This is one local prerequisite only; the five-edit/two-seed/three-rate/three-night matrix, recovery/cloud, hosted/device and release gates remain open. Earlier remote push denial remains held; no push, Site update, merge or live deployment.

### Task 8 first three-night matrix case, local-only - October 25, 2026

The first bounded matrix case used the same real sheep whole-pen Apply, all 46 owned animals, seed 4242 and 30 Hz through three consecutive nights. Its original second-night run failed at the unchanged 500-second deadline: two chickens held both coop approach lanes while 21 waited. The retained browser RED and an instrumented repeat showed those birds on the raised coop floor with `groundLeg=true`, preventing the existing occupied intermediate-waypoint bypass. A captured-state 30-hen focused test failed under the same deadline; a minimal `chicken-stations.js` correction bases that bypass on actual raised-floor position while preserving equal-height, sleeper occupancy, final dock, physical steps, support and collision checks. It turned the focused RED green and all 28 chicken-controller tests pass.

The same local Chromium case then passed three full nights: bed holds at 287.70/324.37/312.23 seconds, all physical releases by 296.8/309.4/299.2 seconds, and all individual 40-second wakes by 336.80/349.43/339.20 seconds. Stable 46 identities, 46 distinct installed beds, paid state, saved revision, containment and zero browser errors held per cycle. Acceptance, historical failures, diagnostics, focused log, final raw results and local rendered frame are in `tests/evidence/pen-editing-implementation/task8-codex-three-night-matrix-20261025/progress.md`. The tested working tree was committed locally as `e420efd63977d477707e41a6a277d36f796b36f1`; raw `source` names its baseline HEAD before this commit. This passes the **three-night care/wake subgate for one of 30** edit/seed/rate combinations; the other 29 care/wake combinations and original speed/contact/pose breadth across all 30 remain, as do cloud/recovery, hosted/device and merge gates. Internal movement seed 1 still needs a test mechanism; no run was relabeled. Before offline publication, the new chicken module generation needs a named-file importer/cache version amendment and predecessor check. The prior relay-only push denial remains held. No remote write, Site update, merge or live deployment.

### Task 8 deterministic seed 1 and two three-night care/wake combinations, local-only - October 25, 2026

A test-only local response transform replaces exactly the ordinary `rng(4242)` declaration with seed 1 only when requested. The checked-in game RNG is unchanged; absent/duplicate/unsupported overrides fail closed. Two seed-1 rendered loads reproduced actor attributes, differed from 4242, and explicit 4242 matched the unmodified game; the first actual seed-1 draw matched `16807/2147483647`. The original seed-1 full-herd wake RED showed Cow 4 idle inside its old bed core after physical departure; a corrected trace proved its ordinary wander endpoint was inside the bed. A later RED showed Horse 1 grazing at an ordinary endpoint inside its old bed. A researched daytime ordinary destination guard uses each installed bed's existing margin plus the ordinary 0.35 m arrival threshold and diverts only those endpoints to the authored approach. Night bed trips, care reservations, route/collision/support/speed rules and the original 500-second and 40-second limits remain. Captured endpoint controls and all 28 cow-scene/guard tests pass.

The actual saved sheep whole-pen move with all 46 animals passed three consecutive nights and individual wakes at both seed 1 and seed 4242, 30 Hz, on the changed runtime. All beds held under 500 s, all physical departures occurred under 500 s, all individual wakes lasted at least 40 s, and identities, unique installed beds, paid state, revision 1, containment and zero browser errors held per cycle. Exact times, historical REDs, seed witness, test-only diagnostic errors and raw results are in `tests/evidence/pen-editing-implementation/task8-codex-seed1-three-night-20261025/progress.md`. This is only the care/wake subgate for two of 30 edit/seed/rate combinations; the other four edit classes, 60/120 Hz, full physical speed/contact/pose breadth, cloud/recovery, hosted/device and merge gates remain. Changed page/chicken module bytes need separately approved importer/cache version bookkeeping and predecessor qualification before publication. Earlier relay-only push denial remains held. No remote write, Site update, merge or live deployment.
Provenance addendum: the tested working-tree source/harness was committed locally as `5924290533378dfa4bb7e3c124afb62383388459`. Raw browser `source` fields name the pre-edit baseline HEAD because the candidate was uncommitted during execution; this documentation-only addendum does not change tested game or harness bytes.

### Task 8 seed-1 sheep edit at 60 Hz, local-only - October 25, 2026

The existing three-night harness now accepts 30/60/120 Hz with actual `dt=1/rate` and rate-scaled frame counts that preserve the original 500-second bed/departure and 40-second individual wake limits. New 60 Hz controls reject the old 30 Hz wake count, a 39.9-second return and a late physical departure; wake-oracle tests pass 14/14. One bounded local Chromium run of the real saved sheep whole-pen Apply, all 46 animals, seed 1 and 60 Hz passed three nights: all beds by 282.02/312.83/263.68 seconds, latest physical departures by 288.77/332.02/300.03 seconds and all individual wakes by 328.77/372.02/340.03 seconds. Stable 46 identities, unique beds, exact paid state, revision 1, containment and zero browser errors held each cycle. Raw result and rendered frame are in `tests/evidence/pen-editing-implementation/task8-codex-sheep-60hz-20261025/seed1-candidate/`; acceptance and scope in adjacent `progress.md`. This is only **3 of 30 three-night care/wake combinations**, with 27 other combinations and full speed/contact/pose breadth, recovery/cloud, hosted/device and merge still open. Importer/cache alignment needs approval before publication. Earlier denied remote push remains held; no push, Site update, merge or live deployment.

### Task 8 seed-4242 sheep edit at 60 Hz, local-only - October 25, 2026

The matching 60 Hz case used the unmodified production seed-4242 source with all 46 animals and the real saved sheep whole-pen Apply. Three consecutive nights passed: all beds by 274.22/301.40/325.07 seconds, latest physical departures by 292.22/296.12/318.70 seconds, and all continuous individual 40-second wakes by 332.22/336.12/358.70 seconds. Identical identity, distinct-bed, paid-state, revision, containment and browser-error assertions passed. Acceptance, raw result and rendered local frame are in `tests/evidence/pen-editing-implementation/task8-codex-sheep-60hz-seed4242-20261025/`. This advances the care/wake subgate to **4 of 30 combinations**; 26 and full speed/contact/pose, recovery/cloud, hosted/device and release gates remain. No code changed since the seed-1/60 Hz test. Prior relay-only remote denial remains held; no remote write, Site update, merge or live deployment.

### Task 8 edit-class reconciliation and individual-assembly second-night RED - October 25, 2026

All four credited 30/60 Hz three-night cases dispatch sheep `movePen [-1,0]`; they are the **whole-pen relocation** class, never individual assembly movement. The exact action, seed, rate, launch HEAD, tested candidate/runtime provenance and artifact for each are in `tests/evidence/pen-editing-implementation/task8-codex-matrix-coverage-20261025.md`. Game runtime bytes have not changed since the locally tested candidate committed as `5924290`, so these four care/wake results remain applicable to this head; full physical breadth is still open. Current class coverage is whole-pen 4/6 and each other class 0/6, total 4/30.

For the separate individual-assembly class, a real 46-animal validator probe accepted dog nook `moveStructure` from `[1.8,-10.9]` to `[3,-11]` and correctly rejected a route-blocking alternative. The real Apply saved the requested nook and the first three-night cycle passed, but night two remained RED at the original 500-second bed deadline: Cow 1 and Cow 3 had distinct assigned beds yet approached the same static waypoint from opposite sides. A focused replay from their captured positions/path nodes reproduced a 500-second failure while the 0.85 m separation assertion stayed green. Static route planning has no dynamic cow reservation and one-step sidesteps do not clear this contested corner. Acceptance, raw browser failure, focused RED and source diagnosis are in `tests/evidence/pen-editing-implementation/task8-codex-assembly-matrix-20261025/`. No runtime fix, test relaxation, blind rerun or new pass credit. Next: design and verify a physical right-of-way/route resolution under unchanged obstacle, speed, support, reservation and deadline rules. No remote upload, Site update, merge or deployment.

### Task 8 cow shared-corner right-of-way, local-only - October 25, 2026

The captured dog-nook seed-1/30 Hz night-two 500-second RED arose because two cows headed toward one static corner from opposite sides for different reserved beds. Their 0.85351 m gap could not admit a legal step at the unchanged 0.85 m separation, and ordinary local sidesteps did not clear the corner. Acceptance and the original browser/captured RED were retained before a researched, bedtime-only right-of-way correction. A stable lower cow identity plans a physical supported detour around a circular representation of the other cow at the full combined clearance; if no detour exists, the original collision guard and route remain. There is no teleport, reservation handoff, speed change, or reduced margin. A first diagnostic fixture inadvertently retained paid-feed state; it was corrected before any result was credited. The A14-required named protected-file digest was recorded as A18 after the first prototype edit instead of before it; this sequencing mistake is documented explicitly, and no further protected edit followed.

Focused cow-scene checks pass **32/32**: captured RED to green; either identity and update order at 30/60/120 Hz; solid post, support, pen, 0.85 m separation, 0.8 m/s speed, blocked-detour and follower/non-bed controls. Real saved dog-nook assembly Apply with all 46 animals passed three consecutive nights at both seed 1 and 4242/30 Hz. The changed-runtime sheep whole-pen seed-1/30 Hz case also passed a direct recheck. In each run the 500-second bed/release and individual continuous 40-second wake limits, stable identities, unique installed beds, paid state, revision, containment and browser-error checks passed. Exact per-cycle times, retained failures, focused log, raw browser results and rendered local frames are in `tests/evidence/pen-editing-implementation/task8-codex-cow-right-of-way-20261025/progress.md`.

**Current changed-runtime care/wake credit is 3/30** edit/seed/rate combinations; the other three historical sheep passes require requalification. Full speed/contact/pose breadth, other Task 7/8 integration, recovery/cloud, hosted/device and merge gates remain open. These are local Chromium results, not official hosted CI or physical-device clearance. Earlier denied relay-only push remains held; no remote write, Site update, merge or live deployment.

One additional local dog-nook individual-assembly case at seed 1/60 Hz passed all three nights on committed runtime `12f6781`: bed holds at 289.75/269.17/289.82 seconds, latest physical releases at 287.15/313.83/279.83 seconds and complete individual 40-second wakes at 327.15/353.83/319.83 seconds. All 46 identities and saved-state/containment/browser-error checks passed. The changed-runtime care/wake count is now **4/30**. Acceptance and raw results are in the same evidence directory's `dog-nook-seed1-60-*` files. This is local browser evidence only; no runtime code change or remote write followed `12f6781`.

### Task 8 A18 retrospective audit and four more local matrix cases - October 25, 2026

An immutable-tree read-only audit confirmed the A18 protected `index.html` preimage and candidate SHA-256 digests match `92197ab` and the committed `12f6781` file exactly. Its two code hunks contain only the named bedtime detour helper and blocked-cow branch change. A18 was still recorded after the first prototype edit; the audit does not make that gate timely. Future named protected-file digest entries must precede edits.

The three historical sheep whole-pen cases now pass direct changed-runtime rechecks: seed 4242/30 Hz and seeds 1/4242 at 60 Hz. One new dog-nook individual-assembly seed 4242/60 Hz case also passed. Each is a real saved Apply with all 46 animals, three nights, original 500-second bed/physical-release deadlines and individual continuous 40-second wake checks. Stable identities, distinct installed beds, paid state, revision, containment and zero browser errors passed in every cycle. Exact timings, acceptance and raw local browser evidence are in `tests/evidence/pen-editing-implementation/task8-codex-cow-right-of-way-20261025/progress.md`. **Current-runtime care/wake coverage is 8/30**: four whole-pen and four assembly combinations. The two 120 Hz combinations for those classes and all three other edit classes remain, along with full physical speed/contact/pose, recovery/cloud, hosted/device and release gates. Earlier denied relay-only push remains held; no remote write, Site update, merge or live deployment.

### Task 8 120 Hz cow bed-core RED, researched A19 correction - October 25, 2026

On the A18 runtime, sheep whole-pen seed 1/120 Hz passed a three-night local browser case. Dog-nook assembly seed 1/120 Hz passed night one, then retained a genuine night-two wake RED: Cow 4 physically returned to its old bed core and stayed idle before its individual 40-second wake completed. The original raw result and one targeted, assertion-identical extended-trace replay are preserved. Source and trace show an external ordinary destination, steering back through the core, and the general 2.5-second target-abandonment heuristic calling `arrive()` while still 0.64 m from that destination. The oracle caught physical immobility; no label-based pass or threshold change was made.

Before protected runtime editing, A19 recorded the exact `index.html` preimage digest, intended `Beast.update` branch, owner A14 pen-fix scope, retained RED and controls. A captured-state test failed before the edit and passed after the narrow daytime cow exit handoff. Outside-core ordinary arrival, night travel and blocked physical exit controls pass; cow-scene passes **35/35**. The unchanged dog-nook seed 1/120 Hz three-night browser journey then passed all 46 animals, original 500-second bed/departure and 40-second wake limits, distinct installed beds, paid state/revision, containment and zero browser errors. Exact per-cycle results and diagnostic files are in `tests/evidence/pen-editing-implementation/task8-codex-cow-right-of-way-20261025/progress.md`.

Because A19 changes ordinary cow movement, the nine earlier A18 care/wake passes are **historical pending requalification on A19 bytes**. Current A19 care/wake credit is **1/30**. The existing three-night harness covers only whole-pen and individual-assembly edits; boundary reshape, interior fence/gate and exterior gate relocation need test-only harness cases with real Apply before they can be counted. Full physical speed/contact/pose breadth, recovery/cloud, hosted/device and merge gates remain open. Earlier denied relay-only push remains held; no remote write, Site update, merge or live deployment.

### Task 8 three additional edit classes and A20 opposing final-bed route, local-only - October 25, 2026

Test-only candidate probing found valid sheep boundary expansion, interior fence with gate, and exterior gate relocation drafts with all 46 owned animals; a route-blocking alternative was correctly rejected. A new three-night harness kept the original seed/rate set, 500-second bed and physical-release deadlines, individual 40-second wake, identities, reservations, paid/revision, containment and browser-error assertions. Boundary and interior seed 1/30 Hz each passed real Apply and three nights on A19 runtime `01d399d`; those are now historical after the A20 runtime change.

The gate seed 1/30 Hz case retained a second-night 500-second RED: Cow 3 and Cow 4 held different bed reservations but stood 0.850 m apart with opposing distinct final approaches. A diagnostic replay showed zero motion from night-two frame 1,500 to 15,000. A20 owner pen-fix authority and exact protected `index.html` preimage digest were recorded before editing. The initial focused fixture missed the real remaining dock waypoint and produced a false green; the unchanged browser case stayed RED. A second targeted trace exposed the mismatch, the fixture was corrected back to RED, and the helper now permits a supported physical detour only for opposing one-node bedtime approaches with each cow's exact dock next. No collision margin, speed, task token, seed or deadline changed. Focused 30/60/120 Hz, both update orders, swapped identities, blocked-route/follower/non-bed controls and cow-scene **37/37** pass. The original full 46-animal gate journey then passed all three nights with unchanged limits; raw failures, traces and result are in `tests/evidence/pen-editing-implementation/task8-codex-extra-classes-20261025/` and exact analysis in `gate-seed1-30-diagnosis.md`.

**Current A20 care/wake credit is 1/30** (gate seed 1/30 Hz). All A19 and earlier bedtime results need direct requalification on A20 bytes. The captured cows began within the padded box of default cow post index 4, and Cow 3 is about 0.459 m radially from its center versus a 0.485 m post-plus-route radius. That preexisting entry/collision condition remains under investigation; the care/wake pass and existing focused post checks do not clear the full physical-obstacle gate. Full physical speed/contact/pose breadth, other combinations, recovery/cloud, hosted/device and merge gates remain open. No remote write, Site update, merge or live deployment. Earlier denied relay-only push remains held.

### Task 8 cow post root cause, evidence-only safety RED - October 25, 2026

From clean A20 `3954a08`, two bounded observation-only runs of the same real sheep-gate seed-1/30 Hz case establish **actual rendered cow/post penetration**, not only padding overlap. On A20, the first observed 0.42 m root-padding crossing already has six deformed vertex records inside the installed solid post. An immutable A19 `01d399d` replay confirms the defect predates A20: 473 recorded vertices penetrate while the root still passes the 0.4 m endpoint guard, then a direct 0.8 m/s step enters that padded box. Installed and resolved post geometry match exactly. The new diagnostic intentionally stops on entry; neither run is credited as a completed matrix case.

The causal chain is now measured: lateral avoidance leaves the original route corridor; direct rejoining does not check static obstacles; replanning after padded entry can exempt the containing post; rectangular segment checks subtract 0.05 m while endpoint/side guards use different padding. All of these checks represent a root point rather than the unchanged cow's oriented turning body (resting extent about 1.09 m forward). The earlier 37/37 focused checks and A20 care/wake pass do not establish skin/post safety. No runtime, rig, accepted assertion, margin, seed or deadline changed during this investigation; protected index SHA-256 remains `c68f7dd240c4dd724453d3bad914ec213e8d30e4c01ff01c3ef195556fc401d0`.

Acceptance, exact raw A19/A20 REDs, rendered frames, source pointers, diagnostic assertions/negative control and the proposed coherent cow-only motion contract are in `tests/evidence/pen-editing-implementation/task8-codex-post-root-cause-20261025/diagnosis.md`. The next bounded step is to prove an oriented swept body/turn envelope and executable post route against the unchanged rig and existing care corridors, then integrate one predicate into route/direct/side/rejoin behavior with pre-edit named-file digests. A larger universal disk or another corner exception is not an established remedy. No safe runtime candidate exists yet. Broad matrix runs remain paused; A20 care/wake credit stays **1/30**, physical safety RED, other release gates pending. No process remains running, remote write, Site update, merge or deployment. One read-only GitHub ref check failed DNS resolution and was not retried.

### Task 8 shared cow sweep prototype and animated-envelope RED, local-only - October 25, 2026

From `7017109`, acceptance was recorded before adding a test-only shared root/body sweep prototype. The old predicate failed 8/10 targeted geometry checks; the prototype passes 12/12 including complete padded root segments, no containing-obstacle exemptions, thin obstacles, mid-turn contact, linear local deformation, clear narrow passages, and frozen-pose approaches at all nine authored care stations. This does **not** establish a safe gameplay correction: a coherent actual-rig probe disproves linear endpoint skin interpolation. Normal breathing alone places a body vertex 9.60627e-7 m beyond the endpoint envelope halfway through a 30 Hz step. The raw RED and an earlier uncredited fixture error are preserved. No existing assertions, limits or runtime files changed.

A separate 27-case bounded actual-rig probe at 30/60/120 Hz found nine positive lower-leg/solid witnesses across both feed approaches and the drink approach. The other 18 bed/robot cases had no included-vertex witness, which is not proof of disjoint meshes. These are synthetic aligned seed-0 gait probes, not full-controller or browser qualification; they show that an always-forward approach can be unsafe, not that the existing corridor geometry is fundamentally unusable. Primary continuous-collision and LBS research supports investigating bone-aware bounds, but the inspected discrete skinning method excludes this rig's joint scaling/translation and does not provide temporal bounds. No corridor or rig redesign is justified by current evidence.

Exact contracts, raw failures/results, source and research links are in `tests/evidence/pen-editing-implementation/task8-codex-cow-motion-contract-20261025/progress.md`. Next prerequisite: a non-mutating pose/state preview with exact equivalence, and conservative animated bounds covering breathing, IK/hoof release and care overlays; only then integrate the shared predicate across routes/direct/side/rejoin/replanning after recording protected-file scope/digests. A20 runtime and protected hashes are unchanged, care/wake credit stays **1/30**, and physical safety remains RED. No process running, permission request pending, remote upload, Site update, merge or deployment. This is a clean partial technical checkpoint, not a completed collision fix.

### Task 8 detached pose preview and affine skin-bound prerequisite, local-only - October 25, 2026

From `b096b29`, test-only shadow preview now passes **6/6** checks: no live/base/geometry/request/RNG mutation; exact state/transforms and 761,472 vertex comparisons across 24 pose/rate cases; support/care and failure controls; and 36 consecutive care frames with transformed ancestry. A real preview RED exposed the care reset's quaternion/Euler callback effects (including signed zeros). The corrected shadow runs the unchanged reset itself after preserving the displayed prediction, rather than assuming a pre-overlay copy is the next base. Exact comparisons remain. The newly authored census/rounding fixture mistakes and all prototype REDs are retained and classified, not credited as runtime bugs.

A separate interval affine-skinning kernel passes **6/6** checks, including all current 31,728 vertices, original rounded weights, scaling/translation, analytic breathing coverage of the prior midpoint RED, and missing/invalid/projective/normalization controls. Its premise remains explicit: each input bone transform interval must cover the whole motion interval. **Those intervals for the real nonlinear limb/release, terrain support and care transitions are not yet proved.** This is not a full animated collision certificate or a gameplay fix. The direct all-vertex reference cost is about 0.47 s in Node, so production use would additionally need precomputed/on-demand bounds and measured browser performance.

Nine short triangle/box comparisons reproduce lower-leg feed/trough intersections at 30/60/120 Hz, including some missed earlier by vertex-only observation. In each case, stopping from the previous sampled clear frame stays triangle-clear for one simulated second, and a static dock pose is also leg-clear. This supports researching a physical settling approach, without establishing a continuous safe final move or justifying fixture redesign. Evidence, source pointers and primary research are in `tests/evidence/pen-editing-implementation/task8-codex-cow-shadow-bounds-20261025/progress.md`. Next: derive and adversarially verify whole-interval limb/support/care enclosures, then integrate only after executable valid-care and retained-post tests pass. No runtime/rig change; A20 care/wake **1/30**, physical safety RED, broad matrix paused. No active command, permission request, upload, Site update, merge or deployment.

### Task 8 actual motion events, bounded feasibility checkpoint - October 25, 2026

From `3be40d3`, test-only actual-formula probes reject a smooth O(dt)-only adaptive sampling assumption. A turn's displayed hoof recovery used rt=0.8 while state stored0.9333333333; the next infinitesimal step has a1.747499mm witness. Restoring only the evaluated phase in a detached causal control reduces it to2.151319e-9m under the unchanged1e-8 comparison. First-positive lie replaces a leg matrix even at tiny weight, and the actual slab-foot support edge is discontinuous. The lie witness is a rig-level fixture, not a claim about live care arrival. Exact raw controls and source-derived finite ordinary/support/lie domains are in `tests/evidence/pen-editing-implementation/task8-codex-cow-continuous-feasibility-20261025/motion-contract.md`.

The contract requires explicit event/branch unions and outward actual-formula transform bounds; the existing affine skin kernel cannot supply those inputs. Exact shadow queries measured0.8158ms median and1.5360ms p95 in Node. Dense cloned sampling plus collision is not a supported per-frame implementation; cached influence/BVH bounds need measurement. No fundamental geometry incompatibility is concluded. An experimental settle/straight-creep profile reaches both feed docks at all three rates and the drink dock at30/60/120Hz in about42.2s without displayed lower-leg/fixture collisions. Original drink scaffold RED is retained; a sub-ULP remaining-segment termination fault was diagnosed and corrected only in that new diagnostic, with no epsilon or deadline change. Six feed results are prior-scaffold evidence; the corrected run covers only three drink cases. This is not continuous, full-body, care/contact, controller or herd qualification.

`progress.md` and `verification.json` record exact results, limitations and hashes. Next bounded work is a restricted flat/slab recovery/settled-approach interval provider and efficient collision traversal, with retained event/post/breathing controls and executable routes before integration. A pure evaluate/commit rig refactor would change animation semantics and needs a separate precise scope decision. No runtime or existing-test changes; A20 care/wake stays **1/30**, physical safety **RED**, broad matrix paused. All probes finished; no permission/executor wait, remote write, Site update, merge or deployment. Both relays updated locally; earlier upload denial remains held.

### Task 8 cached whole-skin traversal and complete care profile, partial - October 25, 2026

From `42dc5c5`, the requested temporal provider remains **unfinished**; this checkpoint delivers the traversal and complete displayed-profile prerequisites. Test-only cached cow bounds preserve original weight sums and affine translations, descend to actual triangle/box SAT, and explicitly reject temporal/domain requests. Initial11.3-23.1ms query cost exposed lost shared-translation correlation; the reference-plus-delta correction reduces a standing query from2229 to23 visited nodes. Raw failures and both helper candidates are retained. Nine control groups cover all31728 vertices through every ancestor/leaf at ordinary/recovery/support/lie/feed/map-edge poses, state/geometry/RNG nonmutation, corrupted bounds, stale/nonfinite inputs, actual synthetic body/post contact and a clear translated control. Five unsupported temporal requests fail explicitly. Final five-query cost: median1.1915ms,p951.5402ms,max2.1518ms in Node, excluding preview, continuous bounds, animation/rendering and other game work. Actual source targets50-60FPS auto quality and a31ms battery draw interval;120Hz is a simulation qualification rate, not an independently specified rendering target.

All nine aligned seed-0 full-skin profile cases now complete feed/drink approach, care hold and release at30/60/120Hz, with zero displayed solid hits and maximum full-weight mouth error0.0157433m under unchanged0.08m. Metal walls/bases remain checked; only separately identified grain/water contact media are classified as such. This uses the experimental settle/creep movement in a test fixture, **not gameplay**. It does not establish temporal safety, queues/reservations, full-herd deadlines, a retained browser post replay or physical-device readiness. Final nine-case run was justified by a strengthened cache rounding bound; no input/assertion/rate/deadline changed. Evidence and precise limitations are in `tests/evidence/pen-editing-implementation/task8-codex-cow-restricted-provider-20261025/progress.md`.

The finite remaining implementation is the actual-source tx/tz/lift/recovery-phase-to-bone interval mapping, with release/plant, slab/soil and lie-onset unions plus body/care transforms. Current cache accepts displayed matrices only; supplying endpoint samples cannot complete that premise. No measured need for fixture/terrain/anatomy redesign or new approval has been established. No runtime or accepted-test changes, no processes left running, no upload, Site update, merge or deployment. A20 care/wake stays **1/30**, physical safety **RED**, broad matrix paused. Both relays updated locally; previous upload denial remains held.
### Task 8 finite limb enclosure, native numerical bridge held - October 25, 2026

From `0f3d8b7`, test-only parameter-to-matrix enclosures now represent ordinary cow IK, planted/free feet, evaluated/stored recovery phase, soil/slab support replacement and first-positive lie with actual target TRS projection. Ten focused groups pass, with339 native matrix and62,238 original-weight limb-vertex containments; six adversarial/cost groups pass. Omitted recovery phase, endpoint-only arch, omitted lie branch, wrong support and corrupted-bound controls fail as intended. A new interval-helper negative-subnormal squared-norm RED was corrected by intersecting with the analytically nonnegative range; raw RED and two diagnostic fixture errors remain. All historical tests, tolerances and runtime bytes are unchanged.

The new helper explicitly classifies results as real-formula enclosures, **not native execution certificates**. Native sin/cos/acos/atan2/hypot rounding and algebraically equivalent matrix evaluation order remain unproved across the supported domain. `nativeCertificate:true` rejects. Lie's decompose/recompose changes a measured matrix coefficient by0.0025301447; cancellation would be incorrect. Small leg domains remain useful at both feed docks/drink, but endpoint vertex boxes do not certify triangles or moving routes. Five cows'20 limb maps plus five existing displayed-pose queries cost2.97ms median/4.70ms p95 in Node; full temporal traversal/render/device costs remain excluded.

Evidence and exact finite branch/next-option analysis: `tests/evidence/pen-editing-implementation/task8-codex-cow-leg-enclosure-20261025/progress.md`. The next missing bridge is an audited native numerical-error contract and propagation through the listed operations, not more sampled profiles. A deterministic shared rig evaluator is an alternative requiring a separate precise protected-scope decision; none was changed here. Whole-time input domains and actual post/valid-care continuous execution remain before integration. No geometry impossibility concluded. A20 care/wake stays1/30, physical safety RED; broad matrix paused. All probes finished, no executor/approval wait, runtime edit, upload, Site update, merge or deployment. Both relays updated locally; denied upload remains held.
### Task 8 original collision acceptance reconciled; compound-proxy decision - October 25, 2026

From `dce1422`, a read-only requirements/source audit confirms the approved spec requires full shapes/continuous segments, actual standing/turning skin and unchanged physical assertions; it does not require universal certification of every native transcendental. The preceding investigation added that stronger prerequisite. It is withdrawn as a project release gate, without relabelling the conditional interval helper or weakening any test. Physical post penetration and route safety remain the real blocker. Numerical rounding must remain conservative, but recovery/support/lie discontinuities are geometry and cannot be hidden by an epsilon.

A bounded seven-endpoint native geometry probe found whole-cow and 23-anatomy-box proxies falsely block valid feed/drink sites. Deterministic 2x2 subdivision produces 92 boxes that contain every assigned triangle and clear all seven endpoints with a proposed 1-micrometre outward arithmetic guard. Actual triangle/solid tests are clear; smallest separating-axis gap estimates are 63.959 mm feed care, 29.009 mm drink and 539.222 mm robot standing. These are static seed-0 feasibility results, not all-pose, route or herd qualification. No original profile was repeated. The probe took 1.308 s and finished.

The prior partial 4.7009 ms p95 is 28.2% of a 60 FPS frame before rendering, measured on desktop Node. A flat 92-box scan is not assumed faster; reuse cached hierarchical pruning and refine only overlapping body regions. The recommended finite next slice is a conservative mode-aware compound/swept proxy, explicit release/support/care event unions and local robust predicates, followed by retained A19/A20 rejection plus valid care execution at original rates/limits and complete browser cost. Use outward numerical allowance plus magnitude-based error terms on supported engines; never shrink geometry or add that allowance to existing contact/equivalence assertions. No rig/fixture rewrite or new protected scope is justified by present evidence.

Exact requirements comparison, numerical assumptions, source references, raw static results and bounded acceptance are in `tests/evidence/pen-editing-implementation/task8-codex-collision-scope-20261025/decision.md`. Runtime/accepted tests/protected hashes remain unchanged. A20 care/wake stays 1/30; physical safety RED and broad matrix paused. No running process, approval blocker, upload, Site update, merge or deployment. Both relays updated locally; earlier upload denial remains held.

### Task 8 finite hierarchical sweep implementation; integration held on cost - October 25, 2026

From `d9651da`, six new test-only source files now implement actual cow motion domains, the 92-group cached skin hierarchy, guarded triangle interval refinement, separate evaluated/stored recovery-event traversal and bounded clear-envelope reuse. They cover supported heading/gait/recovery, body/face/tail, supplied flat/slab-height unions and care/lie onset. Numerical guard only expands bounds. No gameplay, rig, original test or accepted tolerance changed. Intermediate adapter REDs were retained and traced to actual branches: impossible planting alternatives, modulo wraps, recovery-event width, lost bind-offset correlation and insufficient leaf refinement. A chew-phase wrap exposed a real new-provider underbound; its exact RED and corrected control are retained.

Final focused results: **21/21 controls**, **11 containment cases / 1,903,680 actual vertex checks**, and **nine complete feed/drink sequences at 30/60/120 Hz / 31,751 frames**. Maximum speed is0.8m/s and mouth error0.0157433m under the unchanged0.08m limit. The isolated seed-0 experimental approach completes in about42.1–42.2s; full care/stand in49.09–51.1s. These do not replace original seeded herd qualification. Both retained A19/A20 root segments reject at full0.42m padding; exact animated browser replays have not run on an integrated fix.

Complete five-query cost fell from36.88ms p95 to23.40ms p95 with evolving poses and bounded node caching; identical repeated snapshots reach5.16ms but are not a moving-game claim. The evolving near-solid stress still visits about861.5nodes/five queries. It uses duplicated feed-station fixtures to measure independent query cost, not a legal five-cow reservation layout. Desktop Node measurements exclude renderer/controller; capacity-valid mixed stations and browser/phone costs remain unmeasured. Setup heap delta is about42.2MB including shared cache/template and fixture/shadow rigs. The final additional invalid-provenance guard followed the benchmark; exact-final-byte cost was not rerun after the stop request.

Runtime integration is **held** on performance/remaining live-mode evidence. This is not a native-math-certification gate. The next finite optimization target is near-fixture blended head/neck leaf descent, followed by a capacity-valid five-station cost case. Full bed/robot approach routes, live support-cell classification, integration, original browser failures and full matrix remain pending. A20 care/wake stays **1/30**, gameplay physical safety **RED**. All commands finished; no executor or approval wait. Parent requested stopping implementation, so no further feature/profiling work started. Exact files, RED classifications, results, hashes and limitations: `tests/evidence/pen-editing-implementation/task8-codex-hierarchical-sweep-20261025/progress.md` and `verification.json`. No upload, Site update, merge or deployment; denied upload remains held.


### Task 8 finite swept-query performance step, local-only - October 25, 2026

From clean `525cdcc`, profiling identified interval bound construction as the dominant near-fixture query cost. A test-helper-only correction caches invariant absolute magnitudes and removes temporary inner-loop interval arrays, preserving arithmetic order, every triangle, temporal refinement, numerical guard and cache rule. Direct comparison against the immutable baseline passes **7,598,016 exact coefficients**, across35,176nodes and36domains for11motion cases; deliberate1e-8 corruption fails. Existing **21/21 controls** and **11/11 containment cases /1,903,680 actual vertex checks** pass unchanged. The nine previously completed care profiles were not repeated because their provider/predicates/limits are unchanged and bound equivalence is established. No runtime/rig/old-test changes.

The new capacity-valid mix has two feeding cows, one drinking, one at the robot and one free awake cow, with2.3m minimum separation and all62solid boxes supplied to every query. Five evolving native rigs,20warmup+100measured frames in desktopNode24: added median **14.9047→7.9082ms**, p95 **20.2090→10.1795ms**, worst **37.0151→14.4939ms**; candidate cold worst33.2959ms. Identical visited-node/leaf/certificate counts confirm no coverage was skipped. Separate allocation sampling estimates query allocation **45.82→21.53MB per five-cow batch**, while retained cache grows40.80→44.69MB. Cloning estimates include untimed fixture capture; instrumented timings are not used for the comparison. Raw profiles and exact exclusions are retained.

Original project targets are16.7/22.2/33.3ms for the whole frame. Candidate query p95 alone consumes61.0/45.9/30.6% on desktop, excluding rendering, animation/controller and other animals. **Runtime integration stays held**; phone/frame cost is unmeasured and allocation pressure remains. No fidelity tradeoff or new mathematical certification gate was introduced. The requested finite step is complete; a subsequent bounded scratch-buffer/copy-reuse optimization is an option, not a promised result or work begun here. Live support classification,bed/robotroutes,integration and original animated browser replays remain before matrix requalification.

Evidence: `tests/evidence/pen-editing-implementation/task8-codex-sweep-performance-20261025/progress.md` and `verification.json`. Six protected files exactly match the starting tree. A20 care/wake remains **1/30**, gameplay physical safety **RED**, broadmatrix paused. All commands finished; no executor/approval wait. No upload,Siteupdate,merge or deployment; previous upload denial remains held. Bothrelaysupdatedlocally.


### Task 8 single pre-domain envelope experiment rejected on browser cost - October 25, 2026

From clean f33012b, one test-only eight-step native-forecast cache checks a conservative 92-part motion/displayed/recovery envelope before domain construction. Exact state, request, support, geometry and layout provenance is mandatory; uncertain envelopes use the unchanged full reference. No animation restriction, geometry reduction or special station exception was added. The candidate remains inactive outside tests.

A corrected full-game desktop browser baseline has CPU p95 **6.50 ms**. In the single matched comparison, full reference p95 is **12.40 ms** (worst17.10), while the candidate is **67.10 ms** (worst75.10) with **15/120 frames above50ms** and warmup worst92.90ms. All are pinned Chromium/D3D11 RTX5060Ti at844x390/DPR1, with41 ordinary animals and five scripted native cows at distinct stations; no phone or actual cow-controller/queue claim. Candidate windows work for robot/free cows but overlap feed/drink solids:300hits and450fallbacks over750 queries. Preparation adds up to24.10ms per cow. Whole-browser sampled allocation rises **12.34 to22.01MB/frame**; raw profiles retain preparation/signature costs. Maximum mouth contact error remains0.01568954m.

**Performance experiment FAIL: do not integrate.** The harness completed safety assertions, so raw execution status PASS must not be confused with this failed performance decision. Ten additional controls pass, as do the unchanged21controls and11containmentcases/1,903,680vertices through the wrapper. The isolated native drink transition completes with0fast hits/60fallbacks. Original physical limits and six protected runtime files remain exact. No matrix or animated browser replay credit added.

The initial localhost sandbox navigation failure and first fixture's premature care-reset timing are retained; supported local execution and a diagnosed fixture correction produced the valid baseline. One early generic screenshot was overwritten by the corrected capture; raw timings remain, and comparison filenames are unique. Details, exact bounds, raw CPU/GPU/allocation data and real screenshots: tests/evidence/pen-editing-implementation/task8-codex-envelope-experiment-20261025/progress.md and verification.json.

The requested experiment stops here. The unchanged reference fits this bounded desktop scene; physical-phone and representative moving/recovery cost remain unknown and should inform the next architecture decision. No further optimization, runtime integration, upload, Site update, merge or deployment. A20 physical safety remains RED, care/wake1/30 and broad matrix paused. All owned commands/browsers/servers finished; both relays updated locally.


### Task 8 moving/recovery reference browser measurement stopped on RED - October 25, 2026

From clean 689454b, one matched full-game desktop browser measurement uses five unique production-scheduler reservations (feed1/feed2/drink/robot/bed5), native scripted approach/stop/reverse-turn motion and41 ordinary animal controllers. Baseline completes180measuredframes. Reference stops at frame166 after135completed measuredframes with Unsupported limb domain from cow-leg-enclosure validation via cowMotionDomains ordinaryLeg. Exact offending interval is not captured; no guess, guard change or rerun. Raw firstrejection witnesses and all41rejections remain. Queries are observers and do not prevent gameplay collisions.

Common135frame CPU p95 is10.20ms baseline versus **40.30ms reference**, worst13.50/104.30ms; reference has8frames>33.3ms and6>50ms. Approachp9519.70ms(60frames),stop/recovery10.10ms(60),return-turn104.30ms(15). Original16.7/22.2/33.3goals remain. Prior stationary reference12.40ms result does not represent this workload. Reference setup67.90ms; separate allocation phase neverstarted after the failure, so allocationrate is **unknown**. Sampledheap272.99MB is not allocation or leakproof. Pinned desktop Chromium151/RTX5060Ti at844x390/DPR1 is not physicalphone evidence.

Reservation identity,rootcontainment,separation(min1.52315m),speed(max.8m/s) and flat.08m support remain checked. Partial reference includes303movingcowframes,190recoverycowframes,48releases. Sixprotectedruntimefiles exactstartingbytes; no oldtests/helpers changed or repeated. No new safety/route/matrixcredit. Failed-scene screenshot omits the cow detached when the observer throws, explicitly documented.

The finite experiment stops here. Next proposed diagnostic captures the exact failed transition/state/limb interval to classify unsupported motion versus interval/provenance error before any fix; not started. A concise phone plan lists minimal isolatedartifact,transitivehelpers,inmemoryStorage,ownerStart/Stop,sourceversion,metrics and exact future existing-Site publicationapproval. No artifactbuilt/uploaded. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-reference-moving-browser-20261025/progress.md,verification.json,measurement.json,phone-plan.md. A20physicalsafetyRED,carewake1/30,broadmatrixpaused. Allownedbrowser/servercommandsclosed; no runtimeintegration,upload,Siteupdate,merge,deployment.


### Task 8 exact frame166 domain cause and41rejection classification - October 25, 2026

From clean3bd7a07, one diagnostic browser trace reproduces exactframe166,drinkcowleg3,all41rejection signatures and827completedqueries. Read-only servedhooks capture the unchangedassertion inputs/nativeparameters/history; no disk runtime/helper edits. The cause is recovery smoothstep interval dependency loss: true monotone weight range[.01274074,.104] forrt[.8,.933333] expands to[-.2195556,.2746667], then uncorrelated reachclipping leaves impossible tzupper.52402094 above theunchanged.5guard. Nativehardreach.34 ispreserved;10nativefailedframe samples maxreach.3400000000000001. Recoveryhistory has0mismatches;827querynonmutationchecks and41exactshadow/nativeendpointmatches pass. No fixorboundchange.

Actualskinnedtrianglechecks of316fractionalposes+41displayedstarts classify **3realrobotupperrailintersections** (frames162-164) and **38no-sampled-hit,continuous-unresolved** rejections. Threehits arise during scriptedreversal insidethe narrowrobotlane; authoredgameplay exitsforward viarobot.exit/turn/clear. Validreservations didnotmake that benchmark maneuver avalid authoredroute. Do not callthe38clear continuously or the3anewlivecontrollerbug. OriginalperformanceRED retained; no new timingclaim. An interim no-hit progressmessage was corrected afterfullclassification.

Finite nextproposal: correct only test-provider monotone residual/radial invariant enclosure with unchangedguard andadversarial controls, then exactcapture validation; notimplemented. Beforefuture representativecost useauthoredrobotexit while retaining reversalassafetyadversary. Evidence farm3d/tests/evidence/pen-editing-implementation/task8-codex-turn-domain-capture-20261025/progress.md,verification.json,capture.json,served-instrumentation.json. Allownedcommandsclosed,ninecheckedruntime/referencefiles unchanged. A20physicalRED,carewake1/30,broadmatrixpaused. No runtimeintegration,upload,Siteupdate,phonepublication,merge,deployment.


### Task 8 shared recovery range corrected; authored-exit measurement remains unsuitable for integration - October 25, 2026

From local810fbc8, only the test-helper recovery residual now uses the shared-phase monotone polynomial range, with outward arithmetic guards. Unchanged0.5m helper/0.34m native reach. Range controls:19,018 checks; existing21 controls and11 containment cases/1,903,680 vertices pass. The exact retained drink frame166 prestate/request matches;317,280 further native vertex checks and nonmutation controls pass. Original41 rejections and3 confirmed robot reversal intersections remain; the other38 are still temporally unresolved.

The original full reversal trace remains RED: the next robot query at frame166 exposes an independent radial interval correlation loss, tz upper0.5022728063 exceeding the unchanged0.5 guard. No radial correction was made. The new focused drink diagnostic verifies only the previously failed drink state and explicitly retains that remaining robot guard. A new-harness signed-zero archive comparison fault and its corrected representation result are both retained; accepted assertions are unchanged.

One separate authored-forward-exit benchmark completes: robot dock/exit/turn/clear, five distinct reservations,30 warmup+420 measured30Hz steps. Original reversal fixture/deadlines preserved. Desktop pinned Chromium whole-frame p95 baseline9.70ms/reference25.20ms, worst15.10/76.80ms; reference14/420 frames >33.3ms and4 >50ms. Cache setup67.20ms. Separate allocation sampling17.12MB/browser frame,13.17MB attributed to queries. Speed0.8m/s, minimum separation1.523m, exact waypoints/support/reservations/save invariants pass.125 of2250 observer queries reject and remain unclassified; queries never prevent movement. This is not live-route safety or physical-phone evidence.

Stop after the single comparison: no integration or more optimization. Reference exceeds16.7/22.2ms goals and has hitches; phone performance unknown. Recommended next finite decision is a test-only radial-invariant correction and focused rejection classification, not publication. Evidence: tests/evidence/pen-editing-implementation/task8-codex-recovery-range-20261025/progress.md and verification.json.15 protected/runtime/helper/historical evidence files verified byte-identical. A20 physical RED, care/wake1/30 and broad-matrix pause remain. All owned commands closed; no approval/executor wait, upload,Site,merge or deployment. Prior denied upload held.


### Task 8 radial invariant corrected; forward route geometry obstruction classified - October 25, 2026

From907a84e, test-only cowReachClip intersects the old radial range with the source-proven disk component invariant, enlarged outward for existing numerical assumptions. The0.5m helper and0.34m native reach guards remain unchanged.75,625 arithmetic witnesses,21 existing controls,11 containment cases/1,903,680 vertices and317,280 exact captured robot-frame vertices pass. Original reversal now reaches830queries throughframe166 without the domain exception, but still rejects geometry uncertainty; prior3confirmed reversal intersections and all41historical records remain.

One diagnostic forward trace using immutable907a84e reproduces all125rejection signatures. Same-state candidate comparison and795nativefractional poses/125displayedstarts yield65confirmed solid intersections (61openedexitgate,4adjacentbeddivider),59conservativeuncertainties,1conditionalenclosureclear,0invaliddomains. All125nativeendpoints exactly match recorded matrices;2250querynonmutation checks and0historymismatches. The openedexitgate leaf exactly matches solids40/41 and crosses the authored exit-to-turn segment atz=-39.2; divider solid18 exactly matches production geometry. These are scripted direct-waypoint witnesses, not livecontroller diagnosis.2recovery cases lack interior-event sampling and remain uncertain.

Retained new-harness404 capture was followed by one diagnosed server-lookup fix/importpreflight and a separate successfulcapture. An aggregatefirst-witness summary wrongly attributed all65hits togate; fourdivider witnesses corrected from saveddata, no rerun. Both faults and the interimprogress correction are documented. No oldassertion/tolerance or runtime edit.

No new benchmark: previous907a84e p9525.20ms/worst76.80ms remains old-helper evidence; correctedcandidate andphone performance unmeasured. Tighterbounds cannot safely clear actualcollisions. Recommendednextboundeddecision: inspect liverobotexit routing and openedgate/divider blocker registration, retaining allguards, before furtherperformance work. Currentapproach has not metbothusable safety andframebudget; keepit test-only. Evidence: tests/evidence/pen-editing-implementation/task8-codex-radial-classification-20261025/progress.md,verification.json,grouped-classification.json.16protected/helper/historicalfiles exact. A20physicalRED,carewake1/30,broadmatrixpaused. Allcommandsclosed; noapprovalwait,upload,Site,merge,deployment.


### Task 8 live robot exit confirms missing gate blockers and incompatible parked geometry - October 25, 2026

From clean780ab878, two bounded native-controller browser diagnoses reproduce actual opened exit-gate skin intersections in both default and installed custom saved pens:64displayedframes per run,37lowerbar/27upperbar,first115,last178. Actual paid robot jobs complete setup24.3s/exit8.5s within unchanged60s limits. Five cow controllers,46owned/41paused; no scripted root replacement. Max target speed0.8m/s within original step allowance,minimum separation1.38087m/default and1.17457m/custom,zero root-floor error,stable five identities/robot token/job. Not full-herd,hoof/contact,continuous safety,hosted/device or performance qualification.

The opened leaf midpoint has no registered obstacle; the final bed divider is registered. Read-only exact-leaf route input detects the crossing,returns[] for custom and the unsafe original goal for default no-path fallback. Actual open entry/exit leaves and side rail together span beyond both pen boundaries atx7.55 under unchanged planar margins. Registration alone therefore strands cows or leaves fallback penetration. The real controller follows the same authored exit/turn/clear root path as the benchmark. Historical divider witnesses remain adversarial,not reclassified as a livebedpath failure or clear; first-hit capture can mask simultaneous hits.

Offline checks confirm128actual saved triangle witnesses and128far-box negative controls;118still intersect an additional1mm-inward diagnostic box.20runtime/helper/historical files exactly match startingtree. Original65confirmed/59uncertain/1conditionalclear evidence retained. No runtime change or digest registration. All commands finished.

**Pending design scope:** allow only the robot gates' parked-open pose/kinematic correction in cow-yard.js::createCowYard/setStatus, preserving bar dimensions/closed barrier,rig,penboundary,terrain and limits; then synchronize dynamic blockers and fail-closed route handoff under existing pen-fix authority. Current task explicitly prohibits geometry changes,so this correction is held,not tool-denied. Inward parking must be tested for leaf overlap/closing sweeps,not assumed safe. No partial stopping fix.

Evidence and exact proposal:tests/evidence/pen-editing-implementation/task8-codex-live-robot-exit-20261025/progress.md;verification.json;default/custom.json;real roof-occluded screenshots and labelled coordinate SVG. No broadmatrix,newbenchmark,upload,Site,merge or deployment. A20physicalRED,carewake1/30; previous upload denial held. Bothrelaysupdatedlocally.


### Task 8 A21 robot gates and native routes corrected; separate physical blockers retained - October 25, 2026

From clean32f1871, exact owner approval and pre-edit digests were recorded before changing parked-open gate poses and matching index/scene adapters. Open leaves now fold clear of the lane, one another and side rails; closed world transforms/mesh vertices/dimensions remain exact. Dynamic bounds are installed, synchronized and retired with the actual yard. Unreachable directed waypoints retain their real job/reservation and recover after obstruction removal. No default fallback through closed leaves. Native robot staging starts0.5m earlier before entry and turns0.35m earlier on exit, clearing observed entrance-post/divider skin hits without changing their geometry, the rig or original endpoints/limits.

Original default/custom64-hit failures retained. Immutable baseline also reproduces3entry-post and26milkingplate frames. Candidate60/120Hz11/20live divider hits retained and corrected by the final earlier turn. Exact-current native default30/custom60/custom120 jobs complete setup24.9667/24.8/24.7833s and exit8.1/8/7.9583s under unchanged60s limits. Zero observed entry/exit body or gate hits across6,889displayed target frames. Exit maxspeed.8000000000001251m/s within original numerical allowance, minimum five-cow separation1.303367m, root-floor error0; stable5IDs/targettoken and actual completion, no browser errors.46owned/41paused; custom saved default-shaped pen, not new editorApply. No continuous/othercowbody/fullpaid-save/phone/hosted/performance claim.

Focused59/59 passed before finalturnchange; directly affected39/39 passed after. A21scope/negativecontrols2/2 pass;19protected/helper/historicalfiles exact and all unrelated adapter entries unchanged. Two old gates remain RED: scene-install VM lacks hills (reproduced with immutable base index), and positiveglobal lock fails unchanged chicken-stations.js versus its pre-existing registry digest. No oldtest weakened/skipped or unrelated hash re-registered.

**Full robot physical safety remains open:** rectangular attachment plate43 intersects actualskin26/52/102frames at30/60/120, same26baseline30Hz.180saved witnesses reconfirm,168also positive against1mminward diagnostic,180far-boxnegatives reject. Cup44 AABB overlap is separately not proof of unwanted cylinder contact; original four-cupcontact testpasses. A21 does not authorize armgeometry. Next bounded diagnosis should map this plate witness to anatomy/attachmentphase and propose exact necessary scope, not silently reshape arm/rig. Broadmatrix remains paused; A21carewake0/30, earlier A20 1/30historical. Prior65confirmed/59uncertain and rejected expensive experiments preserved, not integrated.

Evidence: tests/evidence/pen-editing-implementation/task8-codex-robot-gates-20261025/progress.md and verification.json with exact candidate runtime hashes, all raw REDs/final cases and limits. All owned commands/browser/server processes finished. No upload,Siteupdate,merge,deployment or approval/executorwait; prior upload denial remains held. Bothrelaysupdatedlocally.


### Task 8 attachment anatomy and lock provenance diagnosed; install fixture fixed - October 25, 2026

From cleanec3f78f, existing native witnesses show all180plate intersections on right hindleg knee3/hip3 during robot insertion/retraction (attach~.5611-.9445), not teat contact. Cup44AABB firsthits instead map to body/root teat tips; original .025m cup/contact test remains separate. Exact plate solid is .4x.06x.48m. A hypothetical .11m reartrim still hits22/44/82witnesses; even the tight unchanged-cup support rectangle hits14/26/48. Neither is a safe proposedfix. No geometry edited or newbrowserrun.

Recommended next narrowly approved candidate: cow-yard.js::setRobotPose transient x/y/z path only, staging forward/low throughleggap before insertion and final lift, reverse for removal. Exact retracted/attached endpoints, cup/rod/plate dimensions, rig/gates and12sserviceclock stay fixed. This arm-motion scope is outsideA21 and remains held for explicit approval; the candidate itself needs full native body/contact checks, not assumed safe.

Installfixture lacked production hills/far and clearing lifecycle. It now uses nonempty treeobjects and correctly wires the actual lexical clearing binding, retaining every originalassertion and adding tree/clearing controls. This exposed A21inactivegate placeholder overwrite; prehash/intent recorded before a one-expression indexadapter fix retaining registry-assigned x/z.17/17install/registrychecks pass; activeA21gate/route code unchanged. New fixture setup errors retained rather than assertions weakened.

Chickenlock expected2c4293ab equals ed0c09a^; exactlaterdiffs are A17wakecondition ated0c09a and occupiedintermediate raisedfloor groundLeg fix ate420efd. Current bytes equal e420efd, no laterdrift. Retrospective normalization and4 deliberatecorruptions pass5/5. Registry remains unchanged because separate e420efdpreedit namedfile/digestrecord was not established: exacthistoricalaudit is retrospective, not proof oldgate happened. Proposed registration must explicitly acknowledge that gap and retain frozenpredecessor/negativecontrols. No automaticdigestacceptance.

Evidence: tests/evidence/pen-editing-implementation/task8-codex-contact-lock-triage-20261025/progress.md andverification.json.22protected/helper/historicalfiles preserved, originalassertions unchanged. No matrix/fullbenchmark/phone/hosted rerun. PhysicalgateRED,A21carewake0/30; activeA21browsercases remain applicable to unchanged code. Allcommandsfinished. No upload,Siteupdate,merge,deployment; previousuploadhold remains.

### Task8 A22 attachment-motion correction and A23 accepted chicken audit exception — October25,2026

Base80b3c8c8d51faaee45c80df8b20a1792b41c6eca; local-only checkpoint. Workspace unavailable during previous turn; one new supported probe restored access and confirmed clean identical head. No previous work reset.

A22 owner yes and all pre-edit digests were recorded before editing. Only setRobotPose changed: stage the low carrier0.30m forward, insert between legs, slide under teats, then lift; reverse on removal. Exact arm mesh/rig/gates, retracted/attached transforms and12sserviceclock unchanged. All original26/52/102actual plate/hindleg witnesses retained; unchanged old geometry/path hits180, candidate moved-solid test hits0 on the same triangles. That offline test alone is not clearance proof.

Native default30/custom60/custom120 cycles PASS:6889displayed frames,0unintended solid/skin hits,0cup/non-teat hits,0gate/entry/exit hits.320authored teat triangles alone are recognized for intended contact; every leg triangle remains.1890held frames meet original horizontal .025m and vertical teat-stem limits, worst horizontal .0002778066m. Actual jobs complete: setup24.9667/24.8/24.7833s;exit8.1/8/7.9583s under original60slimits. Exit maxspeed .8000000000001251 within original allowance, minseparation1.303198m, rootsupporterror0; five exit identities/reservation token stable and actual jobs end. Original browser assertions retained; new non-cup/full-skin and non-teat/cup checks add coverage. No geometry/clearance/test weakening.

40focused checks pass (18first+22regression/locks),0fail/skip. Covers motion scope and corrupted geometry/endpoints/clock, exact old endpoints/hold/symmetric withdrawal, valid/displaced cupcontact, retained leg triangles, original service-phase installation/resource lifecycle, A21closed barriers/dynamic registry/blocked-route recovery, chicken5retrospective controls, production lock positive+6negative controls. The A21scope guard now first normalizes exactly the hash-frozen A22method, then runs its old comparisons and negative controls; original protected preimages remain.

A23 owner Yes at11:41UTC explicitly accepts the historical missing-pre-edit-record exception. Current chicken source byte-exact e420efd63977d477707e41a6a277d36f796b36f1, following ed0c09a15c079e9d4cffa03c9d293bb7d973779a. The latter's A17 wake record exists; e420efd lacks separate pre-edit gate. Git establishes scope, not timing. Exception recorded honestly; checksum e4b680d02ce0c6485377bcd9acbb1cf99ae7663d69bce717469f3a71587dae4c registered with predecessor/oldreview preserved. No chicken behavior or test changes. All unrelated registry entries exact.

Limits: five actual cows/46owned/41paused; target skin only, authored62volumes, displayed poses only, custom saved default-shaped fixture not newApply. Native screenshots exist but robot housing obscures attachment; no visual acceptance inferred. No phone/hosted/performance/continuous or wholeherd qualification. Current carewake0/30; previouspasses historical, otherTask7/8/cache gates pending. Original1mm/180witnesses and rejected expensive sweep experiments untouched. No browser failure/new intermediate candidate RED in this slice.

All owned processes finished. No upload, Site, merge or deployment. Next work must reconcile remaining physical/matrix/cache gates, not claim release readiness from this bounded result.

Evidence: tests/evidence/pen-editing-implementation/task8-codex-robot-attachment-20261025/progress.md and verification.json.

### Task8 post-A22 current-runtime whole-herd batch — October25,2026

Clean launch head 1e7cd6af242849474f9729c3a88b1b7975eef661. Acceptance and source/harness hashes recorded before running. No game runtime, old test, oracle, seed,deadline or tolerance edits. Both cases are first current-code passes, not falsely claimed new RED reproductions.

| Actual edit | Seed | Hz | Three bed holds (s) | Three latest departures (s) | Three full wakes (s) | Local wall (s) |
|---|---:|---:|---|---|---|---:|
| sheep exterior gate relocation | 1 | 30 | 298.10 / 299.47 / 311.67 | 290.70 / 286.87 / 300.00 | 330.70 / 326.87 / 340.00 | 86.28 |
| sheep whole-pen move | 4242 | 30 | 287.70 / 330.80 / 324.10 | 296.67 / 320.30 / 303.20 | 336.67 / 360.30 / 343.20 | 86.97 |

All46stableidentities,unique46installedbed reservations, original500s goals/departure deadline, individual continuous40s wakes, paid/save/revision, original containment and browsererror checks pass. Gate seed1/30 revisits the retained night-two distinct-bed deadlock; wholePen4242/30 revisits the original full-herd/chicken integration. All three nights executed in each. Seed1 mechanism and4242production declaration unchanged.

Current-runtime CARE/WAKE credit: **2/30**, exterior gate1/30 and sheepwholePen4242/30. HistoricalA18/A19/A20passes are not added to this count. Bodies/feet/contact/speed/pose are NOT comprehensively measured by these herd scripts; original script/oracle unchanged. Fullphysical qualification remains separate.

A camera-only default30Hz native robot cycle records6travel phases (retracted,forward,inserting,lifting,attached,withdrawing), with geometry/material/visibility untouched. Low camera now shows plate/cups/leg/teats; inserting and attached images inspected. Same bounded robot assertions pass. This run is visual evidence, not extra matrix credit or owner approval. Original occluded captures remain. Source hash and exact camera/arm coordinates recorded.

11source/harness/oracle hashes exact; only new test-only camera runner plus documentation/evidence added. No new failure or runtime fix in this batch. No universal-proof requirement. A22 targetbody sampled clearance remains credited; fullherdphysical/continuous limitations,phoneperformance,owner visuals andhosted gates remain distinct. No upload,Siteupdate,merge/deployment. All owned commands finished.

Evidence and next gates: tests/evidence/pen-editing-implementation/task8-codex-post-a22-herd-20261025/.

### Task8 A22 matrix checkpoint 2026-10-25T12:05:25.643Z

Current-runtime care/wake **3/30**; 0 failures; no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases.

### Task8 A22 matrix checkpoint 2026-10-25T12:10:17.921Z

Current-runtime care/wake **5/30**; 1 failures; no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Failure retained; diagnosis required before retry.

### Task8 Cow3 severity checkpoint and owner QA priority - October25,2026

Current unchanged A22 care/wake5/30 PASS,1FAIL,24pending. Dog-nook1/120,interior1/30,wholePen1/30 added to prior2cases; boundary1/30 third-wake frame745 retained RED. Production steering snapshot confirms0.8m/s goal nearly cancels grazing-neighbour repulsion at1.5333m. Frozen-neighbour native fixture moves0.011256m/2.5s (RED); blocker removal0.840754m (PASS). No source/oracle/limit change. One same-seed assertion-identical browser replay passes but diverges after identical first cycle; not replacement credit or proof of exact recovery.

Owner at12:22/12:25 prioritizes major gameplay problems, defers minor recoverable timing quirks and moves planned whole-game scan to near completion/final polish. Bounded reconstructed five-cow continuation gives neighbour full authored14s graze, Cow3 physically exits at14.8333s; then all5feed/drink/night holds complete164.4667s under original500s. Exact original RNG/history/recovery and player prevalence unknown; milking not retested. Classify recoverable hesitation DEFER, original gate remains RED. No claim of80percent or full release readiness. Setup VM lexical-property error retained and corrected without assertion changes.

All11runtime/harness/oracle hashes and original cow-scene tests exact. Diagnostics moved to standalone probe with fresh-output requirement; deliberate RED retained. All commands finished. No upload,Siteupdate,merge/deployment. See tests/evidence/pen-editing-implementation/task8-codex-bed-core-steering-20261025/progress.md,verification.json,remaining-gates.md and docs/superpowers/plans/2026-10-25-severity-first-qualification.md. Physical/cache/cloud/hosted/phone/visual gates remain separate.

Custom-guard impact follow-through: one justified variant enabled actual custom containment/support/separation branches (baseline fixture previously omitted these). PASS physical departure16.8333s after full14s neighbour grazing; all five feed/drink/night holds159.3333s. Still reconstructed isolated positions/fresh fixture RNG, not exact original fullherd history. Supports DEFER disposition, no original assertion turnedgreen. No runtime change or further fix loop.

### Task8 A22 matrix checkpoint 2026-10-25T12:39:33.300Z

Current-runtime care/wake **8/30**; 1 failures (1 deferred, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T12:42:49.620Z

Current-runtime care/wake **11/30**; 1 failures (1 deferred, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T12:46:14.031Z

Current-runtime care/wake **14/30**; 1 failures (1 deferred, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T12:51:24.764Z

Current-runtime care/wake **16/30**; 2 failures (2 deferred, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T12:55:20.707Z

Current-runtime care/wake **19/30**; 2 failures (2 deferred, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T13:02:32.956Z

Current-runtime care/wake **21/30**; 3 failures (2 deferred, 1 classified open, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T13:09:23.209Z

Current-runtime care/wake **23/30**; 4 failures (2 deferred, 2 classified open, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. Continue remaining authorized bounded cases; known timing deferral does not turn its test green.

### Task8 A22 matrix checkpoint 2026-10-25T13:16:45.844Z

Current-runtime care/wake **24/30**; 6 failures (3 deferred, 3 classified open, 0 unclassified); no runtime/original harness/oracle edits. Exact current cases and source hashes: tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/coverage.json. All46identities,unique beds,original500s/40s,paid/save/revision/containment/browsererror checks retained. PriorA18/A19/A20passes historical. Current care/wake only. Full physical/contact/pose/speed, cache/cloud/hosted/device/visual release gates remain separate. Original assertions/seeds/deadlines unchanged. No remote writes. Allownedbatchprocessesfinished. All cases attempted; failed/deferred is not passed. Other targeted gates remain.

### Completed A22 care/wake matrix attempt — severity-first local checkpoint

All30 combinations attempted:24PASS,6FAIL (3recoverable wake hesitations deferred,3functional-care failures open),82complete cycles,0running/0unrun. Current11dependency hashes remain exact; no runtime/original harness/oracle changes. Full per-case results, actual edits, limitations and remaining gates are in tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/completion.md and coverage.json.

Open: dog-nook4242/120 night2 three-cow approach, boundary4242/120 night3 two-cow approach, gate1/120 night3 Sheep4 drink approach. Both cow reconstructions remained blocked90additional night seconds, then recovered at morning and completed subsequent five-cow care; exact original history/frequency/milking unknown. Sheep recovery remains unknown, so no minor/permanent-stuck classification. Next bounded diagnosis targets its captured empty water route, then the cow interactions. Gate4242/120 Cow2 wake hesitation joins the two prior boundary hesitations as deferred under owner severity instruction; originalREDs remain.

All owned commands finished. Local only; separate upload hold remains. No permission/executor blocker encountered. Other targeted physical/save/cache/cloud/hosted/device/visual gates remain; broad whole-game scan stays deferred to final polish. No merge or deployment.

### A24 captured sheep route candidate — before original browser verification

A14 scoped pen authority and A24 plan-only pre-edit digest recorded. Native captured sheep stays stuck90night+90morning; start/goal legal, no route even without actors. Exact continuous-predicate witness crosses a0.2m legal fixture gap missed by0.3m grid columns. Candidate adds one start-aligned search at same spacing only after normal failure.8focused controls pass, actual drink/bed recovery14.4s at30/60/120Hz, unchanged speed/support/separation. Affected regressions retain an unrelated old PR95 cow geometry receipt mismatch; cow source/receipt/test are unchanged and do not use modified planner. No oracle update.

A22 matrix24PASS/6FAIL is now historical: the original11hash preflight omitted this controller dependency. Frozen results preserved; old runner/status refuse accidental reuse via explicit supersession marker. Original gate1/120 case pending in new artifacts. Cow nighttime configurations still open; minor wake hesitations untouched. No upload/Site/merge/deployment.

### A24 original sheep PASS; A25 bounded cow candidate before browser

A24 sheep correction is verified by its original gate1/120 three-night browser journey at df64b44: all46 stable animals, original500s/40s, unchanged paid/save/revision/containment/error assertions PASS. Native reconstructed drink/bed recovery14.4s at30/60/120Hz,8focusedcontrols PASS. Related34/35regressions retain the unrelated unchanged PR95 cow mesh receipt failure. No receipt change.

Cow impact: captured three-/two-cow approaches remain blocked90additional night seconds; reconstructed next-day care recovers. Exact original recovery/frequency/milking unknown. Different intermediate corners are excluded from the old rejoin rule; a direct one-edge rejoin is also rejected. A25 changes only cowSharedCornerDetour under A14 with pre-edit digests. Newly eligible rejoins require legal source/target at existing.42padding; original priority, opposition, avoidance circle, speed/support/separation, tokens and shared/final minimums remain intact.

Current focused result47PASS/7FAIL:37existing cow tests PASS; boundary captured replay settles20.27–20.44s at30/60/120Hz and both update orders, min separation>=0.851755m,maxspeed0.8m/s. Scope and blocked/containing-obstacle controls PASS. Seven assembly expectations remain RED: the retained cow root starts inside a static post padding before either baseline or candidate runs. Installed resolver and fixture obstacle arrays match exactly. This is a real unresolved initial-state safety issue, not a candidate-created overlap or proof of exact skin penetration. The candidate deliberately refuses the new detour there. Retained prototype recovery is not accepted physical safety.

Next: original boundary4242/120 browser case once on committed candidate. Assembly remains OPEN; do not force an escape, remove assertions, move geometry or run broad matrix. A22 fullmatrix24PASS/6FAIL is historical after A24/A25. A24gate browserPASS is source-specific. Local only: no upload/Site/merge/deployment. Browser results are pinned local diagnostics, not hosted/device clearance.

### Open care impact checkpoint: A24 verified, A25 partial, retained safety/wake REDs

Candidate3e5c5bb original boundary4242/120 browser result is FAIL, not a complete verification. First night273.4417s and first wake332.8333s PASS; second night315.9583s reaches all46beds. Second wake stops at31.075s on sheep:0, which departed at4.3917s and then moved less than0.025m over the oracle's2.5s window in its old bed core. It has no care task, act=moving, label Off to graze. Subsequent recovery/player harm unknown. No rerun, oracle edit or guessed fix. Original third-night cow failure was not reached.

Current A25 full-matrix coverage0PASS/1attemptedFAIL, others not requalified. A24 sheep3nightPASS is historical exact-source evidence atdf64b44 after cow runtime changes. HistoricalA22 24PASS/6FAIL remains intact, three minor wake deferrals remain unchanged. New sheep wake requires severity classification before any fix; no evidence yet warrants a major-glitch label.

Safe partial result: A24 fixes the sustained sheep water deadlock. A25 fixes the legal-start two-cow captured approach at30/60/120Hz/bothorders, with47focusedPASS;7assembly expectations still fail because captured starting clearance is invalid. Do not claim A25 full livecase qualification or assembly correction. No exact skin or continuous clearance qualification from these root/path tests.

Next smallest actions: classify the new sheep wake using bounded follow-through only if prioritized; trace the assembly cow's last legal-to-padded-post entry in one livecase before choosing any further correction. No broadmatrix or universal-proof work. Retain old PR95receipt failure and separate releasegates. All commands finished; no permissionblocker. No remote writes/Site/merge/deployment.

### Cow post-entry mechanism confirmed; sheep wake provisionally deferred



One original assembly/4242/120 diagnostic served immutable2f1138393563a56b8fd693e477c2d0f4d8bf102f through the supported localhost harness. Original first night and40-second per-animal wake completed. The observer then stopped2.175simulatedseconds into night2 at the first.42padded-post entry by cow:1 (displayCow2), post[-1.8,-36.45,.065,.065].

This is not padding-only:497 sampled animated skin vertices were inside the solid post (.13x2.7x.13m,y.08..2.78). Recorded witness vertices are weighted100%to body bone. Strict point-in-solid and3m-translated negative controls pass. Positive vertex inclusion proves actual intersection at that frame; it does not establish full continuous coverage or the duration of clipping.

Cause: the cow retains an old remaining path after lateral avoidance (avoidSide=-1). Direct movement resumes toward[-6.405,-35.845] without checking that static leg again. Measured displacement matches that direct step to1.65e-15m. The retained segment crosses post3; direct updateCowTaskStep movement checks cow separation and robot gate leaves, but not that static segment. A fresh existing planner query returns an executable centre detour via[-1.195,-35.845], without shrinking guards. Source/history supports route invalidation as a concrete defect; a body-safe correction still requires qualification.

Original failure shows overnight bed care blocked through500s; captured reconstruction stayed blocked90extra night seconds, then recovered with next-day care. Permanent progression/save damage, frequency and exact original recovery remain unmeasured. This warrants a narrow functional-care repair, not a claim of a catastrophic farm failure.

## Single test-only repair probe, not integrated

A disposable served copy revalidates only bed-approach remaining static segments and replans with the existing.42margin, refusing non-executable results. Production index.html is unchanged. The finite probe intended to observe the first10s of night2, past the original hit. Broader10Hz near-post skin sampling stopped it earlier, during ordinary daytime running in wake1:103 vertices belonging to the jaw entered the post while the root remained outside padded clearance. That branch is outside the candidate's bed-task patch; this is not evidence that the bed repair introduced or fixed it. The original baseline observer did not sample this earlier outside-padding event.

Verdict: candidate UNQUALIFIED; no minimal production repair integrated. Do not call the replan ineffective solely from an earlier unrelated stop, nor call it safe. Jaw clipping has no measured gameplay blockage and must not automatically become a severe release gate. No second candidate, broad rerun, geometry change or expensive universal collision proof followed.

## Sheep wake severity

One bounded reconstruction restored the46captured roots and sheep:0's target, froze neighbours and regenerated its ordinary route in the native browser. It left its old bed core after27.5833s and moved0.5m after28.1083s, eventually3.8678m. It first abandoned the obstructed grazing target, ate/idled, then walked away. This supports a recoverable ordinary hesitation. Provisionally defer further fix work under the owner's severity priority; original wake FAIL remains. This is not an exact continuation: original path/pose/RNG/needs/timers were absent, care scheduling suppressed for walking capability, neighbours frozen. Actual original recovery/frequency/care impact remains unknown.


Exact evidence and next action: farm3d/tests/evidence/pen-editing-implementation/task8-codex-entry-impact-20261025/progress.md. Runtime/original assertions unchanged. No new matrix credit or remote writes. All owned processes finished.

### A26 stale bed-leg repair candidate before native qualification

A26 exact pre-edit function/digests recorded under A14. Revalidates bed approaches after lateral avoidance; same static padding/planner/waypoints, containing obstacles refused, blocked result cannot fake arrival and native animation still updates.43focused/existing cow testsPASS; first broader candidate42PASS/1FAIL retained and narrowed to causal scope, no test edits. Native assembly4242/120 two-night arrival pending; jaw clipping remains separate observation, sheep wake provisionaldeferral unchanged. No fullmatrix credit or remote writes. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-stale-bed-route-20261025/

### A26 bounded bed-arrival checkpoint; physical RED retained

Runtime ddb4746 changes only updateCowTaskStep after recorded A26 pre-edit digests: revalidate bed static legs after lateral avoidance, replan with unchanged margins, refuse unusable repair without fake arrival.43focused/unchanged cow checks PASS. Capturedpre-entry actualbedarrival30/60/120Hz13.267/13.133/13.100s. OriginalRED and initial42PASS/1FAIL candidate preserved.

Native assembly4242/120 candidate remainsFAIL on separate head/post clipping during a different cow-avoidance turn. One explicitly labelled diagnostic follow-through, with unchangedruntime, keeps that physicalRED and exits1: all46 reach unique held beds in secondnight286.325s, after firstnight281.55s and completewake330.6583s. Targetcow holdsitsbed14.9s after one sampledhead/jawhit; no measured persistent care blockage. Rootseparation minimum.8500322846m,speedmaximum.80000000000042m/s withinoriginal1e-9 check,supporterror0;paidstate/revisions/identities/containment/browserchecks hold.10Hzskin samples are not continuousclearance. Differentbootclock means fresh samefixture observation, not exactoriginal continuation.

Recommend defer remaining transient head/jaw visual clipping under ownerseveritypolicy; recordedphysicalRED is notPASS. Sheepwake provisionaldeferral unchanged. No more runtime changes or broadmatrix. CurrentA26 full3nightmatrix0qualified; historicalA22 24PASS/6FAIL andA24/A25 source-specific evidence not recredited. Boundary4242/120 thirdnightcowcase still lacks livecompletion due prior interveningsheepwake stop; separatephysical/cache/save/cloud/hosted/device/visual gatesremain.

Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-stale-bed-route-20261025/progress.md. Allownedcommands finished. No permissionblocker orremote writes/Site/merge/deployment.

### Boundary4242/120 final-runtime targeted care PASS; minimum readiness reconciled

Tested8f4413a(A26runtimeunchanged).All46 complete allthree nights271.4667/296.9083/303.3s and full40secondwakes337.6083/331.5/350.625s; original500slimits/identities/reservations/support/paidstate/revisions/containment/errorspass. The knownsheepwake continuation was neverused; alloriginalwakeassertionsPASS. Current completecare/wakecoverage1/30,not a fullmatrix.524610cowbedsteps:minsep.8500207641m,maxspeed.800000000010594m/s withinoldallowance,supporterror0.No skin/continuous/phoneclaim. Head/jawRED owner-deferred; prior sheepRED provisionaldeferral unchanged.

Affected install/publication/registrybatch26PASS/1FAIL: originaldiagonalfencecount expects22, actual24includes exactlytwoA21robotleaves. Supplementalexactidentity/orientation and5corruptioncontrolsPASS; originalassertionunchangedRED. Existing20nativeApply/Cancel desktopcyclesPASS oncurrentruntime,all46,356geometries/107texturessteady,exactCancelstate/revision/paid/cleanupchecks. No runtimeedit oradditionalmatrix.

Minimum remaining: precisetestcount/oldPR95receiptbookkeeping; currentcache/versionchain and installedpredecessorverification; editedlayout recovery/conflictcoverage and focusedtest/harnessregistration; finaltargetedhosted/device/ownerreleasegates. UnchangedpureUI/save layers retain bounded prior evidence; historicalwhole-herd outcomes aren'tcurrentgreens. Detailedreuse/deferral decisions in farm3d/tests/evidence/pen-editing-implementation/task8-codex-boundary-final-20261025/readiness.md. Oneoldmainblobread failedgithub.comDNSviaGitslazyfetch; noretryorremotewrite. Allownedprocessesfinished.No upload/Site/merge/deploy.

### Edited-save local recovery PASS; exact cache/test bundle pending

Runtime bf352071 unchanged. New disposable local Chromium recovery test passes9groups: actual validated horseboundary revisions1/2 with46animals; exact whole-farm downloaded backup and confirmed restore, Cancel/malformed/primary SAVE_KEY quota atomic refusal, save recovery, secondreload and local defaultfriendvisit/home. Eight corruptioncontrols rejected; no fields omitted. API editfixture is not nativegesture credit; guestlocal is not cloud/account proof. Core runner adds only previouslyqualified cow-stale-bed-route test, no redundant suite.

PR95 diagnostic proves exact full5040vertexreceipt after undoing only A21parkedposes in a testinstance; four negativecontrolsPASS. Original count/meshassertions and frozenreceipt remainunchangedRED. Proposed exact two-test correction and eightproductionfile version-only v72->v73 chain recorded; pending scope decision, not denial. Oldmainworker recovered through read-onlyGitHubconnector and exactblob541540b...verified ascache63; shellDNSfailure notblindlyretried, transitionnotyettested.

Cloudconflictworkflow notstarted: Firestore/Auth projectdependenciesabsent and java/firebase notonPATH; no installation orproductioncontact. Needs isolateddemo emulator setup and edited-layout assertions. Secondaryrestorewrites/interruption untested. Currentcompletecare/wake1/30 unchanged; earlierresults historical/deferred, no broadmatrix/wholegamescan. Remainingexact-final-cache/emulator/hosted/device/owner gates retained. Allownedprocessesfinished; no remote writes/Site/merge/deploy. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-edited-recovery-20261025/progress.md.

### A27 approved cache/test alignment checkpoint

Owner15:09UTC Yes explicitly approves exacttest/cache/portableemulatorbundle. A27 and23pre-editdigests recorded before changes. Two approved A21-aware geometrycontracts corrected with9negativecontrols;28focused testsPASS,0FAIL/0SKIP. Eightproductionfiles and11testimports have exactinverse-version-only diffs; frozenPR95receipt andv71-to-v72script unchanged. Cache nowv73; no gameplaychange. Nativecachetransition and editedsaveFirestore/Auth execution pending, isolatedsetup inprogress. No upload/Site/merge/deployment. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-cache-emulator-20261025.


### A27 local cache/edited-save bundle complete

Approval and23pre-edit digests preceded changes. Exact A21 geometry contracts and version-only8production/11test-import chain committed51bcd0f;28focused checksPASS, original receipts and v71-to-v72 evidence unchanged. Separate installedv72-to-v73 and mainv63-to-v73 online/offline journeysPASS; oldmain preserved all saved fields, exact approvedA2 square default, then actual outerhorseApply/reload. Nine predecessor blobs read through GitHub connector and hash-verified locally; no remote writes.

Portable checksum-verified Temurin21.0.12.1+1 and Firestore1.19.8 plus locked FirebaseCLI14.27.0/SDK12.19.0/Playwright1.62.1 work with temporary XDG/cache/per-command PATH. No login, compiler, permanent setting, new browser, production Firebase or rules change. Four edited-save conflict casesPASS (both choices, including equal-clock), five corruption controlsPASS;27recovery checksPASS including primary storage-full, original delayed-start/corruption/offline/read-timeout/sign-out windows. Original30conflict assertion calls and19static recovery calls retained verbatim. Initial conflict revisionRED traced to artificiallevel20 boot initialization, not measured conflict corruption; initialized fixture and controlled clocks corrected before requalification. Main predecessor polygon expectation corrected only in newtest to exactA2; historicalRED retained.

Bundle complete locally, no execution/permission blocker. Secondary-marker/weather-write failure and interrupted restore remain unqualified; hosted/diagnostic CI, exact-current phone and final ownerrelease gates pending. No fullmatrix credit: A26care/wake1/30; historical/deferred physical/timing issues unchanged. Allownedprocesses finished, emulatorports closed. No upload/Site/merge/deploy. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-cache-emulator-20261025/progress.md.


### Secondary restore failures retained; narrow global restore scope pending

Tested4a457e4; runtime unchanged. Three native disposable secondary quota cases (restored marker,dirty marker,weather) FAIL exact refusal: durable backup revision1/9000coins differs from live revision2/9017coins; next ordinary save returns true and restores exact old bytes. Two cases retain stale restored intent. All46 identities and zero browser errors; seven deliberate comparator corruptions rejected. These are synthetic values, not real-save loss or measured production frequency.

One corrected CDP terminate-on-resume capture proves only primary farm write completed before tab termination; reopen installs exact full backup/all46 PASS but explicit restore intent FAIL. Initial close-while-paused harness ERROR retained: later writes ran, so it has no interruption verdict. Logical tab/JS termination is not power-loss proof, and signed-in cloud impact remains unmeasured. No repeated broad tests or emulator reset.

Generic manual-restore repair exceeds narrow A7 ordinary-edit and A14 pen scope; no runtime change attempted. Pending precise owner amendment: game.js restoreFrom/load/save guard, auth.js unresolved-restore link/upload gate, optional shared local journal helper, index.html/sw.js matching version-only entries/tests. No account policy, economy, schema/terrain/rig/Firebase rules changes. Exact proposal and publication/hosted/device/owner handoff: farm3d/tests/evidence/pen-editing-implementation/task8-codex-restore-secondary-20261025/progress.md. All commands finished; no execution denial, no upload/Site/merge/deployment. A27 successes and A26care/wake1/30 unchanged; historical/deferred REDs not recredited.


### A28 approved manual restore candidate: targeted native/emulator checks pass

Owner Yes16:43UTC2026-10-25 explicitly grants manual restore recovery/game/auth guard/helper/cache scope. Amendment and pre-edit hashes recorded before runtime edits. New journal preserves exact prior/imported snapshots, publishes intent/weather before farm, rolls back caught failures, blocks unresolved/stale save/account paths, and recovers synchronously on reload. No account-policy/Firebase/economy/rig/terrain changes. Cachev74 game34 auth20 helper1.

Three original secondary-write native casesPASS unchanged; journal-aware supplemental native interrupted restorePASS exactwholefarm/all46/intent/no-later-write checks. Historical interruption trace assumes no journal and remains unchanged evidence. Eleven helper cases cover each writeboundary, rollback/cleanup/quota/corruption/owner/stale-tab controls;44focused save/writer/transaction/version testsPASS;6scope/integration checksPASS;15lock/SDK checksPASS (counts overlap). Exact inverse A28 game/auth scope reproduces original pre-edit bytes; A7prefix/suffix and frozenotherlocks remain enforced.

Isolated manualrestore emulatorPASS:20s unsafe-save/upload refusal, corrupted-journal startup holds cloud exact, actual native interrupted owned restore recovers/uploads exact46animal backup tooriginalaccount. Initialfixture failedbecause frozenclock left bothlocal/cloudabsent, not guardregression; captured before explicitnormalcommit initialization,60slimit unchanged. A lock negativecontrol first failed only on earlierguard diagnostic wording; original assertion preserved and message corrected.

Existing affected conflict/recovery regressions currently running; installedv73->v74 and final evidence checkpoint pending. No broadmatrix orwholegamescan. No upload/Site/merge/deployment. Evidence:farm3d/tests/evidence/pen-editing-implementation/task8-codex-restore-repair-20261025.


### A28 restore-integrity local qualification complete

Runtime bcb7c0c19ff51ac44a4c84376f870ec54dc23001; approval/amendment/pre-edit hashes preceded changes. Journal preserves prior/imported snapshots, restores consistency after interruption, rolls back caught refusal and blocks unsafe current-version stale/unresolved save/account handoffs. No account-policy/Firebase/economy/geometry changes. Exact scope inversion and original protected controls PASS.

64 distinct focused checksPASS; three original secondary-write native casesPASS; supplemental journal-aware interrupted exact46farm/intentPASS; three manualrestore demo-emulator groupsPASS. Original unchanged four conflict cases plusfive corruptioncontrolsPASS,27recoverychecksPASS, andnine native backup/recoverygroups includingeight corruptioncontrolsPASS. Installed immutablev73-to-v74 online/offline transitionPASS exactgame34/auth20/helper1 cachebytes and preserved custompen. Original failures, initialnewfixture nullsave/setup failure and early lockmessage failure retained with diagnosis; no weakened limits or assertions. Historical interruptiontrace remains unchanged, separately superseded by exactnewjournal-sequence check.

All approved local A28 checks complete; code unchanged during finalverification. CurrentA26care/wake1/30 unchanged, historical/deferredREDs not recredited. No physical-power-loss, hosted, currentphone oroverallvisual claim. Remaining: separately authorized branchupload; focusedexactsourcehosted workflow/run; isolatedprivatepreview/currentphysicalphone review; finalownerrelease/merge/deployment decisions. No remote writes/Site/merge/deployment. Allownedtests completed, emulators shut down/no listeners. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-restore-repair-20261025/progress.md and summary.json.


### A28 private Site v5 delivered; GitHub large-evidence blocker

Owner18:41:53UTC Okay approved exact888383b upload/privateupdate/hostedverification. Existingowner-privateSitev5 published successfully, Site source94b6e9cbf8014c3e1427fa2d5441af124dc87872, same URL/access. Game runtimeunchanged; generatednotice hidden duringordinaryediting afterretainedlandscapeobstruction. Local/hosted sixsmokegroupsPASS,116servedfiles verified; exactoriginalHTML pluscapturedCloudflareJSDinsertion only,3corruptioncontrolsPASS. Cloud/imports disabled, disposableorigin, noSWinstallation; nothostedrestorefaultCI orphysicalphoneproof.

One GitHubpush of888383b stopped afterconfirmingthreeincomingtraceZIPs exceed100MiB. Rawarchives/history preserved; remote codex/safe-test-preview-20261023 still4c3335a,main1115f93. No serverlimitrejection claimed; disconnect reflectsownedtransportcancellation. No unchangedretry/forcepush/LFS/deletion. Read-onlyproposal: separatepublicationbranch fromremotehead, exactgamesource/smalltests/evidence withoriginalhashmanifest and independentlyretainedlargeartifacts; requiresownerapproval. Two cachetests dependonunpublishedpredecessorSHAs and needexactinputs preservedbeforehostedexecution, noassertionchanges. No branchproposalimplemented.

Evidence/precisepaths/checklist: farm3d/tests/evidence/pen-editing-implementation/task8-codex-a28-publication-20261025/progress.md. Currentcare/wake1/30 andhistorical/deferredREDs unchanged. Allownedsessionsfinished. No merge/livegamedeployment/productionFirebasechange.


### A28 separate publication packaging approved and verified

Owner19:22:14UTC Yes approves new branch codex/a28-publication-20261025 fromremote4c3335a. Game source121files exact888383b;4056 retained priorfiles exact2deffa9. Three test-only source-mapping edits preserve every assertion by exactinverse. All3 oversizedarchives/originalhistory remain untouched inoriginalworktree, hashes inprovenance; newpublicationtree intentionally differs. Three historical snapshots preserve360inputs and originalblob/SHA256 checks, allowing both cachetransitions withoutunpublishedhistory.

49focusedchecks+5snapshotcontrolgroupsPASS. Installed historicalv72-to-v73 andv73-to-publication-v74 online/offlinePASS. RestrictedChrome pipelaunchfailure retained; permittedexecution PASS withunchangedtests. Incomingpreflight0blobs>100MiB; largest97,874,190bytes. Normalnewbranchupload pending finalpreflight/outcome receipt. ExistingSitev5/remoteoldbranch/main unchanged; no merge/live/Firebasechanges. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-a28-publication-branch-20261025/progress.md. No newcare/wake/phone/hostedCI claim.


### A28 publication payload uploaded and remote verified

Normalnewbranch codex/a28-publication-20261025 now contains verifiedpayload9d1ce4d0050578fed42f987d912c5bed72e29aad. Read-onlyremotecheck confirmsmain1115f93 andoldpreview4c3335a unchanged. Game121files exact888383b; finalretainedpriorcount4054 plus2relayupdates/3test-onlymappings.49focusedchecks,5snapshotcontrolgroups andbothcachetransitionsPASS. Originalcheckoutclean2deffa9/allarchivesretained;3oversizedZIPs remainlocalonly. Sitev5 unchanged. No merge/live/Firebasechange. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-a28-publication-branch-20261025/remote-receipt.json. OfficialhostedCI/currentphone/releaseapproval stillpending; carewake1/30 anddeferralsunchanged.


### Final gate1/120 retained wake failure; conditional merge not executable

Original unchanged gate-relocation seed1/120Hz journey onacb5230 ran once181.977s. All46 beds completed allthree nights284.5917/292.5917/289.0s; firsttwo full40s wakesPASS326.8667/343.15s. Prior night3Sheep4 water blockage didnotrecur. ThirdwakeFAIL Cow1(cow:0) frame4746,firstdeparture241: original<.025m/2.5s stuck-core check before40s. No onward recovery/frequency/care-impact measurement, no guessedfix/rerun, not automaticallydeferred. Complete currentcare/wake1/30 remains; no newmatrixcredit. Existingassembly head/jaw physicalRED isowner-deferredvisualpolish with observedbedarrival14.9safterhit, notmeasuredclipduration.

Read-onlyremote9d1ce4d has0Actionsruns/0checks/0statuses: hostedNOTRUN. Smallestproposal onefile .github/workflows/farm3d-release-qualification.yml addingmanual-onlytargetedpen/cache+recoveryjobs; originalconflictsjob/tests/limits preserved. Amendment/upload/dispatchpending, notattempted. Owner20:03:28UTCYes conditionallyapprovesmergeonlyafterrequiredchecks; currentphoneunconfirmed andnewwakeimpactopen. Freshread ofPages39691471875 provesprior main1115f93 automaticallypublishedaftermerge; parentmustresolve live-deploymentboundarybeforemerge. CurrentPagesconfigurationnotfreshlyexposed.

Evidence:farm3d/tests/evidence/pen-editing-implementation/task8-codex-final-gate-20261025/progress.md andhosted-proposal.md. Raw131,960,286byteZIPpreserveduntracked/localonly withSHA256manifest, nosilentdeletion/ignorechange or oversizedGitobject. Runtime/tests/workflowsunchanged; originalsandallarchivespreserved. Allownedjourneyprocessesfinished. No upload,externaljob,PR,Siteupdate,merge/deployment/productionFirebase.


### Cow1 final-gate impact: natural recovery observed, original FAIL retained

One instrumented unchanged gate1/120 reproduction on1d4c073 reached exactly the captured Cow1 position/target/frame4746/first241; all preceding night/wake timings match. In that live session, no reconstructed/reset state: .025m netmotion4.7s, physical exit of .65m bedcore13.1917s, native bed-exit targetarrival13.925s. Five seconds later stilloutside1.0541m andordinaryidle Taking in the view. All46 identities/containment,paid/revisions/daytime nonrest/error controls held. Next independentroam/feed/milk target completion wasnotobserved; this is bed-exit recovery, not fullwake orcarePASS. Original test and diagnostic exit1 retained.

Recommend defer this recoverable hesitation under ownerseveritypolicy, pending parent's specific disposition; no movementfix oradditionalrun. Completecare/wake1/30unchanged. No causal proof that capturedgrazingneighbour alone causeddelay, no newfullphysical/performanceclaim. Evidence:farm3d/tests/evidence/pen-editing-implementation/task8-codex-final-gate-impact-20261025/progress.md. Runtime/originaltests unchanged byverifiedhash; raw129,938,328byteZIPpreserveduntracked/hashmanifest, originalarchivesuntouched. Allownedprocessesfinished. Workflow/upload/dispatchapprovalpending; nomerge/Site/deploy/remote writes.


### A29 manual-only hosted workflow authorized and locally verified

Owner20:17:33UTCYes approves precise one-file manual pen/cache+recovery workflow, branch upload and dispatch; conditional merge/automaticlive only after required checks and phone review. Pre-edit approval/digest preceded workflow append. Original1843byte prefix/conflicts/permissions/triggers exact. YAML+14 BashsyntaxblocksPASS; originalruntime/tests hashes unchanged. Newjobs gatedworkflow_dispatch; no skipped assertions or masked localCow1FAIL. InitialrestrictedBashstartup failure, then permittedsyntax-onlyPASS, retained. Remote9d1ce4d verified; upload/dispatch notyetexecuted at this record. Currentphonepending; no merge/Siteupdate. Evidence: farm3d/tests/evidence/pen-editing-implementation/task8-codex-hosted-a29-20261025/progress.md


### A29 exact-head hosted run completed; blockers retained

Normal fast-forward upload verified remote 1a13bbb7f8d3f921c44fc4e5553f14b9bd22a13b on codex/a28-publication-20261025; one manual run https://github.com/pederaus9-ux/Bugsy/actions/runs/40230653120, completed 2026-10-25T20:40:47Z with FAILURE. No retry or runtime/test changes. Original 49 focused checks and five source controls PASS. Gate seed1/120Hz all46 three-night/three-wake journey PASS with original500s/40s limits. Original same-account conflict job PASS all4 ordinary/equal-clock cloud/phone cases with exact backups and zero stale farm writes.

Both cache transitions failed before Chromium startup: No usable sandbox on Ubuntu24.04, no cache assertion executed. Recovery passed8checks then unchanged30000ms quota-refusal wait FAILED; remaining19 recovery checks and3 manual-restore groups NOTRUN. Warning appears in later console receipt; exact listener/auth/read/cleanup timing unresolved, no saved-data corruption or harmless-oracle conclusion. Proposed environment-only sandbox-preserving runner change and test-only timestamp capture are documented, not implemented. No deadline extension, security change or blind rerun.

Current movement has passing full-care/wake evidence for2distinct combinations: priorboundary4242/120 and newhostedgate1/120;28other combinations lack final-movement completion evidence. Retainedlocalgate1/120 wakeFAIL remains despite this hostedPASS; exact matchedlocalreproduction recoveredbedexit13.1917s/exit-target13.925s. This is not fullphysical qualification, cross-platform determinism, or a new all-matrix gate. Earlier24PASS/6FAIL are historical and ownerseverity deferrals remain separate.

Conditional merge and automaticlive publication authority recorded; unmet requiredhostedchecks and explicitcurrentphone acceptance still prevent merge. Sitev5 unchanged. No newPR/main/live/Firebase/account/security changes. Allownedprocesses/jobs completed; small receipts and both relays savedlocally without anotherpush, preserving exactCIhead. Oversizedtraces remainlocal/untracked/hashed; originalarchives/history untouched. Evidence:farm3d/tests/evidence/pen-editing-implementation/task8-codex-hosted-a29-20261025/summary.json and diagnosis.md.


### A30 approved sandboxed runner and quota timing follow-up prepared

Owner20:47:59UTC Yes explicitly approved compatible runner and timing-only diagnostics with affected-job rerun. Named amendment/pre-edit hashes preceded both file edits. Pen/cache uses Ubuntu22.04, pinned Chromium/raw sandbox flags unchanged; recovery remains Ubuntu24.04 to preserve failing environment. New manual affected-cache-recovery selection omits prior-passed conflict/focused/source/gate execution only for that selection; default and PR behavior retained. No assertion/timeout/runtime/security changes.

Exact inverse restores original recovery test; declared YAML delta, unchanged commands/runtime/CDP hashes and five bounded observer controlsPASS. Initial VM test fixture omitted Node URL; retained error and fixture-only correction. Observer records navigation/emulator network, browser console emission versus Node delivery and failure cleanup, max2048 records/no page mutations/no full trace. Currentphone/merge held, Sitev5 unchanged. Remote1a13bbb verified; upload/dispatch pending. Evidence:farm3d/tests/evidence/pen-editing-implementation/task8-codex-hosted-a30-20261025.


### Field-only release preparation; historical bookkeeping action rejected

OwnerSentinel_f239254969288191b4f78027ef127e3b approvesfieldmergewhenready. Verifiedmainac4c438; PR96mergedandPages40324462814 pluspostmerge40324468298all17PASS. Controls9fcaaf2preservedseparate. Newlocalfieldbranchfromac4cherry-pickedonlyaudited3file69668c2delta asd96982b; copiedonlyapprovedworkshoporacleandnativeguestfixturefrom5085. Controlsfiles/historynotcarried. CurrentproducerSW76includesplot-supportonly; game/auth/terrainbytesunchanged. Earlier102focused+strict5phasenativePASSremainapplicable toidenticalfieldruntime, notrerun.

AutomaticreviewREJECTEDprepare-field-releasescriptbeforeexecution because broadsa3d-v75replacementwouldrewritepredecessorcachetests contrarytopreservation. Helper/receiptabsenceconfirmed. No retry/bypass; historicaltestbytesuntouched. Saferunaffectedcacheproducerchangeonlycompleted. Pendingprecisescopeischeckpoint.json: exactfieldreceipt/inverseguardaccountingwithfrozenhistoryretained; newassetexacthash+122currentruntimepackagecheck; keephistoricalv75assertionsandoldRefs,pindynamiccandidateonlytoacceptedv75source; addseparatev75to76journey; current-onlyversionchecksandnarrowworkflow. No expectationorhistoricalinputsrewritten. No PR/push/merge/deploy, no realdata/cloudwrite. Needexplicitapprovalreconciliationforthechangedtest-accountingproposalbeforepublication.
