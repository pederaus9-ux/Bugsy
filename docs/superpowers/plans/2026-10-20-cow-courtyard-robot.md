# Cow Courtyard and Robot Milking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Native execution by the sole ChatGPT/Codex lead; adversarial self-review, no independent-agent claim.

**Goal:** Build the selected blue/cream courtyard with physical cow care and manually requested robot milking into a persistent bulk tank.

**Architecture:** Keep pure cow accounting independent of scene frames. A reusable station scheduler owns physical occupancy; the scene adapter reports validated robot docking while a separate procedural yard owns geometry and animation. Existing game menus, saves, cloud synchronization and worker updates remain the integration boundary.

**Tech Stack:** Existing JavaScript ES modules, Three.js, Node test runner, pinned Playwright and Firebase emulators. No new runtime dependencies.

**Spec:** docs/superpowers/specs/2026-10-20-cow-courtyard-robot-design.md, approved by owner Yes at 2026-10-20T11:14:27-05:00.

## Global Constraints
- Concept4 courtyard; five cows, unlock4, pen300coins, cow120coins.
- Production180000ms; happy144000ms; XP3; existing happy double/gold probabilities retained.
- Feed stock capacity30, one cow_feed per new cow cycle; free water43200000ms; robot12000ms; tank50 existing milk units displayed as gallons.
- Manual Milk command required; only a physically docked cow may start the robot timer.
- No milk loss, duplicate feed charge, duplicate output/XP/event credit or quality reroll.
- Ordinary v1 farms and v2 lamp-only farms retain their writer markers; incompatible cow-care farms require new writer3, after rechecking main still supports2.
- No new herd cap, prices, recipes, production account operations, Firebase rule changes or dependencies.
- All original tests, assertions and timeouts remain. Preserve failed logs/traces.
- Main bf404a2a1261f3c7581025b249f2bd00c4539964; continue branch codex/cow-courtyard-20261020, not a competing implementation.
- Separate all-animal follow-up plan is part of the approved scope. Cow-only completion is not all-animal completion.
- Actual rendered owner review and explicit merge approval remain required.

## Review Focus
1. Reload/close exactly at robot credit or pickup: quantities, quality, XP and event progress change once (Tasks2/3/7).
2. Full tank with a two-unit happy batch and a busy queue: no overflow, deadlock or lost readiness (Tasks2/6).
3. Renamed/rebuilt cows or newly purchased cow: stable identity and queue membership survive display rebuilds (Tasks1/3/5).
4. Night/weather/player movement during approach or milking: reservations remain valid and no wall-walking, snapping or premature credit occurs (Tasks4/5/7).
5. Partial/corrupt/future cow envelopes, stale account snapshots and old cached clients: preserve raw valuable state, refuse unsafe writes and recover (Tasks1/3/7).

## File and interface map
- farm3d/cow-care.js: pure state/migration/supply/queue/tank accounting.
- farm3d/animal-stations.js: reusable occupancy/approach scheduler with no production rewards.
- farm3d/cow-yard.js: courtyard/robot/tank model, colliders, station transforms and appearance.
- farm3d/animal-care-poses.js: additive opt-in rest/feed/drink pose adapter, beginning with cow.
- farm3d/game.js: inventory spending, reward dispatch, save floor and public cow actions.
- farm3d/index.html: Beast integration, routing/terrain, input, status markers and render adapters.
- farm3d/tests/cow-*.test.mjs and cow-*.browser.cjs: domain/native evidence.
- farm3d/firebase/tests/recovery.browser.cjs: authenticated cow-state recovery.
- Existing sw/index cache pins, core runner and regression workflow gain exact-source qualification.

### Task1: Persistent cow identity, envelope and legacy import
**Files:** Create cow-care.js and tests/cow-care.test.mjs; later integrate game.js in Task3.
**Interfaces:** ensureCowCare(pen, atMs) -> care|null; validateCowCare(care) -> boolean; COW_CARE constants. Input pen retains existing list/meta; care stores stable cow IDs, monotonic nextId/jobId, feed, waterUntil, lastAt, per-cow progress/duration/charged/ready batch, queue, activeJob and tank normal/gold. Batch is {id,n,gold,xp,credited}; job is {id,cowId,stage,batch,startedAt,credited}, stage approaching|milking|exiting. Unknown versions return null without mutating pen.
- [ ] Write tests for unfed/running/ready/one/five-cow legacy farms; assert paid timer is imported once, original stock/name/love retained and two calls yield identical IDs/state. Assert malformed/future envelopes remain byte-identical.
    const first = structuredClone(ensureCowCare(pen, at));
    assert.deepEqual(ensureCowCare(pen, at), first);
    assert.equal(validateCowCare(pen.care), true);
- [ ] Run node --test farm3d/tests/cow-care.test.mjs; retain missing-module RED receipt.
- [ ] Implement the interfaces. Allocate IDs from a persisted counter, never names/scene indices. Preserve any original paid timer as an import receipt before clearing it.
- [ ] Run the same command; require all new migration/validation assertions PASS.
- [ ] Commit this independently tested domain task.

### Task2: Supplies, ready batches, robot queue and tank ledger
**Files:** cow-care.js; tests/cow-care.test.mjs; create tests/cow-milking.test.mjs.
**Interfaces:** settleCowCare(pen,atMs)->care|null; stockCowFeed(pen,units,atMs)->acceptedUnits; refillCowWater(pen,atMs)->boolean; requestCowMilking(pen,cowId,atMs)->{ok,reason}; dockCowMilking(pen,jobId,atMs)->boolean; finishCowRobotExit(pen,jobId,atMs)->boolean; takeCowMilk(pen,units,atMs)->{normal,gold}. Pure functions return reward receipts, not inventory/XP effects. settleCowCare returns pending unacknowledged receipts; acknowledgeCowReward(pen,receiptId) marks them applied by Task3.
- [ ] Test180000/144000ms boundaries, one feed per cycle, missing-water pause/resume, backwards time, ready batch freeze, duplicate commands, queue order, wrong/stale docking IDs, full tank49 plus double batch2, repeated finish/pickup and reload serialization. Persist deterministic RNG following chicken-care's pattern with existing .25/.30 happy rules.
    assert.equal(requestCowMilking(pen,id,t).ok,true);
    assert.equal(requestCowMilking(pen,id,t).ok,false);
    assert.equal(dockCowMilking(pen,wrongJob,t),false);
    assert.equal(takeCowMilk(pen,50,t).normal,expectedNormal);
- [ ] Run node --test farm3d/tests/cow-care.test.mjs farm3d/tests/cow-milking.test.mjs; require failures at the intended missing transitions.
- [ ] Implement queue FIFO with one active robot. Reserve the fixed batch's tank room at admission, not by discarding excess. A ready but blocked cow stays ready. Only docking sets startedAt; credit after12000ms, mark the receipt once, then hold robot in exiting until exit acknowledgment.
- [ ] Verify same command PASS; use serialized/reloaded states to verify every transition and receipt replay.
- [ ] Commit domain accounting.

### Task3: Game commands, economy compatibility and minimum writer
**Files:** game.js; tests/cow-care-integration.test.mjs; tests/save-writer-compatibility.test.mjs; fixtures/saves/3d-v3-cow-robot.json; tests/save7h.browser.cjs; core runner and exact version pins.
**Interfaces:** exported getCowCareStatus(), fillCowFeed(units), fillCowWater(), milkCow(cowId), collectCowTank(units), reportCowRobotDock(jobId), reportCowRobotExit(jobId), settleCows(). view.refresh retains existing interface; optional view.cowStatus(care) callback. Existing cow feed/collect/collectAll buttons must use these actions; other species retain their outputs.
- [ ] Write actual game-module tests for atomic feed transfer, partial/full barn pickup, no reward at pickup, one XP/event receipt at credit, stable cow IDs after buy/rename/rebuild and no direct cow-collection bypass.
- [ ] Add v1/v2/v3 migration and old-client refusal tests using SHA-pinned predecessor sources; retain every prior lamp/chicken assertion. Test future/corrupt care no-overwrite and visitor/recovery/read-only guards.
- [ ] Run node --test farm3d/tests/cow-care-integration.test.mjs farm3d/tests/save-writer-compatibility.test.mjs; preserve relevant RED.
- [ ] Implement writer3 only when incompatible cow care exists. Save the tank/receipt acknowledgment and game rewards in the same state serialization; no externally committed partial reward. Keep old paid timers and barn milk exact. First imported legacy output is not fed again.
- [ ] Require those tests PASS; run original decor-save, chicken-care-integration and market-sales contracts to verify protected economics.
- [ ] Commit game/save integration.

### Task4: Safe station reservations and courtyard geometry
**Files:** Create animal-stations.js, cow-yard.js, tests/animal-stations.test.mjs, tests/cow-yard.test.mjs; modify index.html integration points for new yard only.
**Interfaces:** createStationScheduler(stations) -> {request(animalId,kind),arrive(token),release(token),snapshot(),restore(snapshot)}. Tokens include generation and owner; stale/wrong releases cannot free another animal's slot. createCowYard() -> {group,layout,stations,targets,robot,setStatus(care),setRobotPose(progress),dispose()}. Export COW_YARD_LAYOUT for polygon/colliders/bays/robot entry,dock,exit/tank target. Every station supplies world approach, dock, facing and support surface.
- [ ] Add tests proving capacity ownership, stale-token refusal, five usable beds, reachable feed/water/robot path, preserved player entrance and separate safe horse/sheep accommodation. Compare fixed footprints against buildings, fields, existing pens and synthetic occupied decor fixtures. If no fit exists inside authorized space, preserve work and report the measured footprint conflict before moving paid objects/expanding land.
- [ ] Run node --test farm3d/tests/animal-stations.test.mjs farm3d/tests/cow-yard.test.mjs; record missing-export/layout RED.
- [ ] Implement compact L-shaped blue/cream shelter, straw beds, trough/bunk, robot gates/arm/cluster, visible pipe and horizontal tank. Tank interaction stays outside the cattle lane. Merge static geometry by material; dynamic robot owns only its moving parts; idempotent resource disposal. Use current scene measurement to select explicit nonoverlapping layout coordinates in COW_YARD_LAYOUT; tests pin them.
- [ ] Require same tests PASS and model draw/triangle counts recorded; verify20 rebuilds return to independently warmed exact renderer resource baseline in native Task7.
- [ ] Commit geometry and scheduler.

### Task5: Cow movement, physical contact and lying poses
**Files:** animal-care-poses.js; cow3d.js additive pose capability; index.html Beast bridge; tests/cow-stations.test.mjs; tests/cow-rest-pose.test.mjs; original cow motion suites unchanged.
**Interfaces:** getAnimalCarePose(kind,rig)->{apply({mode,weight,target}),reset()}; station modes feed|drink|lie|stand|dock. Scene adapter validates physical robot center error<=.10m, yaw error<=.10rad and speed<=.03m/s continuously for250ms before calling reportCowRobotDock(jobId). Fixed thresholds are new docking criteria, not replacements for original gait/contact thresholds.
- [ ] Test actual muzzle within.08m of feed/water interaction surface; supported bed pose without more than.005m ground penetration; legs genuinely folded and standing completed before locomotion. Add night/rain/blocked-lane/duplicate station requests, same-cow rebuild, and queued/stale job cases.
- [ ] Run node --test farm3d/tests/cow-stations.test.mjs farm3d/tests/cow-rest-pose.test.mjs; preserve first relevant RED.
- [ ] Implement opt-in care task priority: active milking/exit, requested robot approach, basic supplies, then sleep/rest/wander. Reserve/release slots correctly. No teleport to fix blockage and no renderer-frame reward. Apply care bone overrides after existing updateCow3D without changing body proportions or ordinary gait.
- [ ] Require new tests PASS, then all original cow/stance/contact/performance contracts unchanged. Film lie/stand and approach sequences in Task7; do not infer appearance from geometry tests.
- [ ] Commit physical cow behavior.

### Task6: Ready marker, robot controls, tank UI and sound
**Files:** game.js panels/actions/sounds; index.html pick targets/status markers; tests/cow-controls.browser.cjs.
**Interfaces:** tap ready cow -> Milk action using stable ID; show Ready/Queued/Walking/Milking/Leaving. Robot progress derives from job time and scene setRobotPose; tank panel uses getCowCareStatus and collectCowTank. Shared feed/water stations invoke fillCowFeed/fillCowWater.
- [ ] Write real touch/mouse tests for marker->cow->Milk, full/busy robot and tank, queue ordering and partial pickup at390x844/844x390/1280x720. Assert no milk enters the barn merely from Milk; tank gain occurs only after docking/service; later pickup changes barn once.
- [ ] Run node farm3d/tests/cow-controls.browser.cjs to get intended RED on available browser runtime; if local Chromium is unavailable, record that and use isolated hosted diagnostic without claiming local PASS.
- [ ] Implement readable phone targets/status text and restrained robot audio through existing mute/background controls. Reduced motion retains understandable milking state and all accounting.
- [ ] Require native scenarios PASS with actual input, no account/save writes beyond synthetic fixtures.
- [ ] Commit controls.

### Task7: Reload/offline/cloud/update and rendered qualification
**Files:** tests/cow-robot.browser.cjs, tests/cow-update.browser.cjs, firebase/tests/recovery.browser.cjs, fixtures/saves, sw.js/index cache pins; workflows/farm3d-regression.yml; core runner.
**Interfaces:** Reuse browser-harness start/setup and worker-transition updateWorker; no custom parallel deployment. Native screenshots/video and partial results contain exact commit/source hashes.
- [ ] Write tests for reload queued/approaching/docked/just-before-credit/credited/exiting/partial-pickup; old installed client updates to candidate with exact cached hashes; old writer refuses raw v3 overwrite; fully offline paid cow/lamp farm reopening.
- [ ] Add authenticated emulator snapshot recovery for feed/water/tank/queue/job/receipt with old barn milk, gold and30chickens preserved; retain stale-upload/corrupt/slow-read scenarios.
- [ ] Run new domain/native suites for intended missing coverage RED; fix product causes before fixture changes. Never relax old checks.
- [ ] Capture genuine normal-composer daytime/night/walk/overview at390/844/1280 DPR1 plus uninterrupted robot and lie/feed/drink video. Inspect cluster-to-udder contact, bed support, muzzle surfaces, tank/pipe, gates and five-cow readability. Compare matched before/after resources and frame measurements;20 rebuild exact equality. Physical-phone performance remains an explicit unverified gate until measured.
- [ ] Run all original required regression/art/release qualification workflows on final head. Recover artifacts and inspect full logs, not only green icons. Preserve every failed trace.
- [ ] Commit evidence references/relay updates as appropriate without invalidating qualified head; draft PR and owner actual-preview/merge gate. No automatic merge.

### Task8: Cow milestone handoff and all-animal continuation
**Files:** farm3d/AI_RELAY.md, AI_RELAY_STATE.json, COW_COURTYARD_REVIEW.md; follow-up plan linked below.
- [ ] Record base/head/tree, exact changed files, test commands/results, original failures, artifact hashes, visuals and protected-file inventory.
- [ ] Confirm the specification's cow requirements against actual final evidence and list unresolved phone/quality findings candidly.
- [ ] Present owner preview and merge recommendation. Only after explicit approval, merge with expected-head guard, verify Pages and anonymous live bytes, then record postmerge checks separately.
- [ ] Continue docs/superpowers/plans/2026-10-20-animal-physical-care.md. Do not claim the remaining animals implemented before their actual evidence exists.
