# Player-editable Animal Pens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players expand/reshape animal pens, edit real fences/gates and relocate animal care buildings while preserving the accepted farm, care, saves and paid state.

**Architecture:** Resolve bounded saved layout records through frozen templates into one immutable revision shared by geometry, collisions, support, interactions and care. A separate draft editor validates the complete proposed farm, prepares resources and animal rebindings, then commits one full-farm save before publishing the new scene. Keep existing default factories and the production/tree/decor editor intact.

**Tech Stack:** Existing browser ES modules, Three.js, Node test runner, pinned Playwright 1.62.1 and existing Firebase emulators/production SDK; no dependency upgrade.

**Spec:** `farm3d/docs/superpowers/specs/2026-10-21-player-editable-pens-design.md`, approved by the owner's reply **“I approve”**; immutable SHA256 `f4b6339878861b8423e6c5965005eafc666383d7926c2ab03f8e8c636763ba49` at `a2f0b8c5faa09fe5da96f35e4609185ffd1ace2c`. Its historical pending-review wording records the earlier checkpoint; this approval supersedes that gate.

Execution: **native, sole ChatGPT/Codex implementer**, using `superpowers:executing-plans`; repository instructions supersede the generic subagent recommendation above. Self-review is not an independent audit. This plan is ready for owner review, not executed. Dates here use current environment UTC (2026-10-22); the approved spec's milestone date was 2026-10-21 America/Chicago.

## Global Constraints

- Existing limits remain **5 cows, 30 chickens, 4 horses, 5 sheep, one dog and one cat**: 46 animals; no extra capacity or changed costs/rewards/timers.
- Free layout actions; buildings translate only, with no rotation, scaling, demolition or individual bed arranging.
- Minimum enclosure areas: chicken **125.28 m²**, cow **176.12 m²**, horse **161.755 m²**, sheep **195.70 m²**.
- Minimum exterior gate widths: chicken **1.50 m**, cow **2.30 m**, horse **4.25 m**, sheep **4.00 m**; both sides traversable.
- Each penned species: **3–24** boundary vertices, **0–24** interior runs, **1–4** total gates including at least one exterior; new runs at least **one metre**; existing shorter default stubs remain valid.
- Optional `layout.animalPens`: schema **v:1**, monotonic layout revision, customized sites only; maximum payload **32 KiB**.
- Writer **4** starts only on first successful custom Apply; existing writer1/2/3 farms retain their behavior; old migrations/fixtures remain frozen.
- At least **44×44 CSS-pixel** targets, **one-metre** nudges; snap edited geometry only; validation at most every **150 ms** during drag.
- Preserve the accepted horse corners outside ordinary onFarm24; editable land includes approved animal-site footprints/approaches; no terrain/path/world expansion.
- Pause animal physical updates only during draft; production/supply expiry/wall-clock recovery continue; discard accumulated physical dt on exit.
- Four rendered/emulated viewports: **390×844, 844×390, 768×1024, 1280×720**; never claim physical-device coverage.
- All 46 animals, three sleep/wake cycles with full **40-second** wakes after each edit class; retain existing **500-second** care goals, tolerances and trusted **50 ms** native-input checks.
- At least **20** edit/apply/cancel/rebuild resource cycles; actual installed **cache63 → candidate**, tentatively **game31/cache64** after fresh-main verification.
- No ledger/security/SDK changes, unrelated farm features, Full Pull/tractor games, model/anatomy/gait redesign, assertion weakening or frozen-evidence overwrites.
- Exact-head hosted checks, actual edited-game previews and owner visual/release approval precede merge; verify Pages/live bytes/postmerge afterward.

## Review Focus

1. Late validation of an earlier green draft or a second pointer arriving during drag must not authorize the latest invalid draft — Task 6 `staleValidationCannotEnableApply` / `secondPointerCancelsOnlyCurrentGesture`.
2. Storage quota failure or crash between persistence and publication must leave either the complete old layout or recoverable complete new layout, never a mixed save — Task 5 `quotaFailurePreservesOldLayout` / `persistedCandidateSurvivesPublicationFault`.
3. A cow job changes stage while the player edits; rebind its current ledger without duplicate milk or fictitious docking — Tasks 4/5 `robotStageChangesDuringDraft` and equal-clock comparisons.
4. A legacy farm obstructs a care site, or uses the accepted horse land outside decor bounds; editing must support legal relocation without deleting paid objects — Tasks 2/7 `legacyHorseLandIsEditable` / `obstructedSiteCanMoveAsWhole`.
5. A gate-bearing edge is split/removed, or an unknown saved template loads; preserve identity/data and prevent silent destructive normalization — Tasks 1/6 `unknownTemplateIsReadOnly` / `edgeChangeNeverDropsGate`.

---

## Baseline, recovery and command conventions

Freshly fetched main is `1115f93101a0e86fdcc9780e053c17b73dd6dac5`, tree `77d5e453112f56fd87b6eabfb62c6c28af10e88d`. Approved spec branch is `docs/player-pen-editing-design-20261021` at `a2f0b8c5faa09fe5da96f35e4609185ffd1ace2c`; planning branch starts there. No runtime files differ from main. Existing PR95 qualification belongs to that release, not this feature.

Workspace maintenance removed the earlier checkouts. Recovery cloned into a new directory; no reset/clean/delete/force push. Original untracked scratch proofs/logs are inaccessible; committed release evidence remains on `evidence/remaining-care-pr95-publication-20261021` at `2f0e9ccdb7c2efe3c1864a5d74ef967d18cbcc8a`, with prior failure receipts on their existing evidence branches. No local test/writer process or new remote pen-editor implementation branch was observed; another chat's external activity cannot be conclusively inspected. Recheck before execution and each hosted dispatch.

All commands below run at repository root unless a `--prefix` is present. Before execution, read AGENTS and both canonical relays, fetch main again, inspect status/processes/open PRs, preserve any concurrent work, and create an isolated implementation worktree using `superpowers:using-git-worktrees`. Preserve the approved spec and plan with the implementation branch. Stop and reconcile if main's runtime baseline changed. Install only existing locked dependencies (`npm ci --ignore-scripts --prefix farm3d/tests`) when execution starts. Browser installation uses the existing pinned workflow; do not bypass TLS.

Each task's red and green logs go into a new uniquely named directory under `farm3d/tests/evidence/pen-editing-implementation/`; never replace a failed attempt. Record source/tree, command, seed, UTC, output, status and failure state. Update relays/checkpoint with the task's acceptance outcome before proceeding. Do not deploy intermediate commits. Commit commands name only each task's files, plus that task's new evidence and canonical relay update; no blanket `git add .`.

## File responsibilities and shared contracts

New product modules:

| File under `farm3d/` | Responsibility |
| --- | --- |
| `animal-pen-geometry.js` | Pure simple-polygon/continuous capsule clearance, projection and land-union predicates |
| `animal-pen-templates.js` | Frozen PR95 site/component/station definitions and named ownership |
| `animal-pen-layout.js` | Bounded schema decoder/resolver; immutable world revision |
| `animal-pen-validation.js` | Full footprint/support/routes/staging validation; no storage or economy |
| `animal-pen-runtime.js` | Off-scene replacement preparation, controller rebind, resource/publication ownership |
| `animal-pen-editor.js` | Pure draft commands, gesture cancellation, revision validation and Apply/Cancel state |
| `animal-pen-editor-view.js` | DOM action strip/handles/preview/pointer and keyboard integration |

Existing targeted changes: `game.js` save transaction/writer; `index.html` editor entry, scene registries, controller integration, containment; yard factories in `chicken-yard.js`, `cow-yard.js`, `remaining-care-yard.js`; `remaining-care-layout.js`, `remaining-care-navigation.js`, `remaining-care-controller.js`, `chicken-stations.js` coordinate/rebind adapters; `sw.js` module shell; existing test runner/workflows. Cow physical task state currently lives in `index.html`, not a standalone cow station controller: keep its rebind adapter beside that code. `cow-care.js` and accepted animal rig modules remain byte-identical.

Use JSDoc in defining modules for these exact names (types describe data, not new runtime classes):

- `Kind = 'chicken'|'cow'|'horse'|'sheep'|'dog'|'cat'`; `Point2 = [number,number]` is x/z, `Point3 = [number,number,number]` is x/y/z. `AnimalPens = {v:1,revision:number,sites:Partial<Record<Kind,SiteRecord>>}`.
- `SiteRecord = {template:string,boundary?:Array<{id:string,x:number,z:number}>,runs?:Array<{id:string,a:Point2,b:Point2}>,gates?:Array<{id:string,edge:[string,string]|null,run:string|null,offset:number,width:number}>,structures:Record<string,Point2>}`. Gate offset is metres from the first edge vertex/run.a; exactly one of edge/run is non-null. Boundary is implicitly closed; no repeated closing vertex. Pet records omit boundary/runs/gates. Require complete known structure keys when a site is customized. Stable ID regex `^[A-Za-z][A-Za-z0-9_-]{0,63}$`; reject duplicate IDs across a site's vertices/runs/gates. Reject coordinate magnitudes over 128m before geometry work. Revision is a nonnegative safe integer; absent layouts resolve revision0; next Apply increments once with overflow rejected. Do not sort/round saved coordinates.
- Templates named `sa3d-pr95-<kind>-v1`. Component IDs: chicken `coop/feeder/waterer/eggStand`; cow `shelter/feedBunk/trough/robot`; horse/sheep `shelter`; dog/cat `nook`. Anchor is each component's frozen template world origin; positions are new world origins, and all descendants transform by new-minus-template origin. Stable station IDs are copied from the existing accepted factories, never renumbered.
- `ResolvedSite = {kind,template,custom:boolean,polygon:Point2[]|null,components,stations,obstacles,fenceSegments,gates,supports,approaches,waiting,footprint,issues:Issue[]}`. Components are keyed IDs with `{origin:Point2,delta:Point2,footprint:Point2[],hitBounds,lightingAnchors}`; station/support/hit/obstacle records retain existing factory shapes, documented at their original definitions. Resolved gates add `{id,inside:Point3,outside:Point3,segment:[number,number,number,number]}`. `ResolvedLayout = {revision:number,sites:Record<Kind,ResolvedSite>}` is deeply frozen.
- `DecodeResult = {status:'ok',value:AnimalPens|undefined}|{status:'readonly',raw:unknown,reason:string}|{status:'invalid',issues:Issue[]}`. `Issue = {code:string,kind:Kind|null,target:string|null,message:string}`; use stable codes `SCHEMA/UNKNOWN_VERSION/LIMIT/GEOMETRY/LAND/OVERLAP/PATH/SUPPORT/ROUTE/STAGING/STALE/READONLY/STORAGE`. Unknown versions/templates return readonly retaining the original object; invalid data is never saved/repaired in place.
- `World = {epoch:string,obstacleRevision:number,owned:Record<Kind,number>,land,blocked,path,groundY,actors:ActorSnapshot[]}`. `land/blocked/path` contain full polygon/segment/rectangle/circle shapes, not centre probes; derive them from existing live registries. `groundY(x:number,z:number):number` is existing support-aware ground sampling. `ActorSnapshot = {id:string,kind:Kind,position:Point3,component:string|null,stationId:string|null,clearance:number}`. `epoch` changes on farm identity/account/restore/visit transitions; ordinary production ticks do not change it. `obstacleRevision` changes on geometry/ownership edits; exact latest snapshot revalidation is still required at Apply.
- `Validation = {revision:number,worldEpoch:string,obstacleRevision:number,ok:boolean,issues:Issue[],placements:Record<string,Point3>,routes:Array<{actorId:string,targetId:string,points:Point3[]}>}`. It includes each owned actor, unique legal staging, required stations, every doorway and both gate directions. Routes use body/turn/support clearance, not a centre-only proof.
- `PreparedRevision = {revision:number,publish():void,dispose():void}`. Preparation cannot mutate live scene, actors, scheduler, save or paid ledger. `publish` switches all registries synchronously, once; `dispose` releases only uninstalled owned resources, idempotently. Old installed resources dispose only after successful publication. Unexpected publication failure follows fatal recovery, not rollback.

### Task 1 — Frozen templates, bounded saved records and concave geometry (phase A)

**Files:** Create the first three product modules above; `tests/animal-pen-layout.test.mjs`, `tests/animal-pen-geometry.test.mjs`, `tests/fixtures/animal-pens-pr95.json`. Existing default layout modules are read-only here.

**Interfaces:** Produce `decodeAnimalPens(raw:unknown):DecodeResult`, `resolveAnimalPens(value:AnimalPens|undefined):ResolvedLayout`, `defaultSiteRecord(kind:Kind):SiteRecord` in layout; `PEN_TEMPLATES` in templates. Geometry exports `polygonArea(poly:Point2[]):number`, `pointInPolygon(point:Point2,poly:Point2[],pad=0):boolean`, `segmentInPolygon(a:Point2,b:Point2,poly:Point2[],pad=0):boolean`, `nearestLegalPoint(point:Point2,poly:Point2[],pad=0):Point2|null`. Boundaries count as inside at pad0; positive pad requires distance from every boundary edge. No convex assumption.

- [ ] Write `defaultsMatchFrozenPR95`, `concaveNotchRejectsCrossing`, `unknownTemplateIsReadOnly`, `invalidSchemaHasNoSideEffects` in the two test files. Export baseline values directly from main's existing modules into the frozen JSON; record their SHA and source SHA. Include bed/station IDs, docks/supports/fences/footprints/robot points, exact decimal values and known horse vertices. Example assertions:
  ```js
  assert.deepEqual(resolveAnimalPens(undefined).sites.horse.polygon, frozen.horse.polygon);
  assert.equal(resolveAnimalPens(undefined).sites.chicken.stations.filter(s=>s.kind==='bed').length,30);
  const l=[[0,0],[6,0],[6,2],[2,2],[2,6],[0,6]];
  assert.equal(pointInPolygon([4,4],l),false);
  assert.equal(segmentInPolygon([1,5],[5,1],l,.1),false);
  const raw={v:2,revision:1,sites:{}};
  assert.equal(decodeAnimalPens(raw).status,'readonly');
  assert.deepEqual(raw,{v:2,revision:1,sites:{}});
  ```
  Table-test NaN/Infinity, duplicate IDs, unknown owners/structure IDs, wrong arity, negative/unsafe revision, over128m, payload32769bytes, vertex2/25, run25, gate0/5; accepted32768byte boundary measured as UTF8 rather than JS characters. Unknown template at v1 is readonly. Add nearest-point and continuous edge/rectangle/circle cases, including a line that exits and re-enters a concave polygon.
- [ ] Run `node --test farm3d/tests/animal-pen-layout.test.mjs farm3d/tests/animal-pen-geometry.test.mjs`; preserve RED (missing exports initially; after imports exist, geometric assertions must catch the old convex method).
- [ ] Implement the exact exports. Use continuous segment intersection and point-to-edge distances; resolve all derivatives from immutable templates without touching accepted default factories. Freeze resulting arrays/records and reject malformed inputs before expensive work. Structurally valid drafts with a missing gate edge/run retain that gate record and add a GEOMETRY issue to ResolvedSite.issues; omit its unresolvable derived passage, keep the preview editable and reject Apply. Decode validates structural shape/limits; geometric reference validity belongs to validation. Invalid saved geometry opens read-only for explicit recovery and is never silently written back.
- [ ] Run the same tests plus `node --test farm3d/tests/remaining-care-layout.test.mjs farm3d/tests/chicken-yard.test.mjs farm3d/tests/cow-room.test.mjs`; require zero failures and exact frozen baseline equality.
- [ ] Commit these six new files: `feat(farm3d): resolve bounded animal pen layouts and concave boundaries`.

### Task 2 — Complete land, footprint, route and staging validation (phase A)

**Files:** Create `animal-pen-validation.js`, `tests/animal-pen-validation.test.mjs`, `tests/fixtures/animal-pen-world.mjs`. Modify `animal-pen-geometry.js` only for reusable continuous shape predicates.

**Interfaces:** Consume Task1 exports and `World`; produce `validateAnimalPens(layout:ResolvedLayout,world:World):Validation` and `penEditableLandContains(shape:Point2[]|{a:Point2,b:Point2,pad:number},world:World):boolean`. Test fixture exports `makePenWorld(overrides:Partial<World>={}):World`, with exact PR95 world geometry/maximum herd, and `translatedLayout(kind:Kind,delta:Point2):ResolvedLayout`, translating a default record's boundary/runs/structures without rounding. Interior gates also use species width floors. New post clearance constant `.15m` must be at least actual rendered post radius; reject narrower spans without modifying legacy default stubs.

- [ ] Write `legacyHorseLandIsEditable`, `continuousFootprintCannotBridgeOffFarm`, `interiorRunCannotCutBedRoute`, `all46PlacementsAreDistinct`, `everyGateHasTwoClearApproaches`. Example:
  ```js
  const world=makePenWorld(), layout=resolveAnimalPens(undefined);
  assert.equal(penEditableLandContains(layout.sites.horse.footprint,world),true);
  const v=validateAnimalPens(layout,world);
  assert.equal(v.ok,true);
  assert.equal(Object.keys(v.placements).length,46);
  assert.equal(new Set(Object.values(v.placements).map(p=>JSON.stringify(p))).size,46);
  ```
  Add invalid full-footprint/path crossings even when all corners/centres appear legal; occupied decor at fallback site; rotated obstacle/circle tangencies at existing tolerances; bed/ramp height discontinuities; narrow turns; staging in doorway guards; area just below all four minima; all gate width floors; max geometry/finite search termination. Baseline validation must account for existing accepted installation policy rather than reject the accepted farm wholesale.
- [ ] Run `node --test farm3d/tests/animal-pen-validation.test.mjs`; retain RED with each obstruction fixture's issues/positions.
- [ ] Implement bounded route search on the current finite farm footprint (0.3m grid, at most200000 visited nodes per search, deterministic tie order); use existing exact capsule/shape checks for edges and standing/turning skin envelopes, plus existing support sampling. Reachability must cover the assigned bed/feed/drink, two coop doorway paths, robot route and every gate direction for each relevant actor; collect actionable issues. Stage unplaceable actors distinctly before accepting. Do not move any paid object or expand land.
- [ ] Run the new tests and Task1 tests; verify obstacle/ramp failures report `OVERLAP/PATH/SUPPORT/ROUTE/STAGING` as appropriate, never `ok:true`. Record worst-case candidate counts/elapsed time for later device profiling, not a performance-pass claim.
- [ ] Commit the four listed files: `feat(farm3d): validate pen clearance routes and legal edit placements`.

### Task 3 — Factories that move complete functional units (phase B)

**Files:** Modify `chicken-yard.js`, `cow-yard.js`, `remaining-care-yard.js`, `remaining-care-layout.js`; create `tests/animal-pen-yards.test.mjs` and `animal-pen-runtime.js` resource-preparation section.

**Interfaces:** Extend `createChickenYard({layout:ResolvedSite|null=null}={})`, `createCowYard({north=0,layout:ResolvedSite|null=null}={})`, `createRemainingCareYards({layouts:Partial<Record<Kind,ResolvedSite>>|null=null}={})`, `remainingCareLayouts({layouts:Partial<Record<Kind,ResolvedSite>>|null=null}={})`. Existing return contracts and zero-argument outputs remain exact. Each custom unit registers geometry/hit/collision/contact/support/lighting by the component IDs above. Produce `preparePenYards(layout:ResolvedLayout):{yards:Record<Kind,object>,dispose():void}`; it owns only its new resources, attaches nothing to live scene and disposes idempotently.

- [ ] Write `identityFactoriesMatchAcceptedGeometry`, `translatedRobotIncludesTankPipeAndAnimatedParts`, `translatedCoopIncludesBothRamps30Beds`, `oldFootprintsNoLongerCollide`, `prepareDisposeDoesNotTouchInstalledYard`. Compare actual transformed mesh bounds, hit/contact/support points, fence gaps, station IDs and owned resources, not empty group positions. For delta[2,-1], assert every attached representative vertex/contact shifts[2,0,-1], independent unselected units shift[0,0,0], all bed IDs unchanged. Assert five cow,30 chicken,four horse,five sheep and two pet beds.
- [ ] Run `node --test farm3d/tests/animal-pen-yards.test.mjs`; RED must demonstrate merged meshes failing to follow logical groups, not just a source-string mismatch.
- [ ] Implement optional custom factory paths using component-local geometry before material merge; preserve default construction paths. Move slabs/clearings/robot hit bounds and appearance/supply content with their owners. Introduce no default-model/gait changes. Keep plant clearing masks composable so releasing old yard ownership cannot restore grass still hidden by a building/new yard.
- [ ] Run the new tests plus `node --test farm3d/tests/chicken-yard.test.mjs farm3d/tests/chicken-yard-interaction.test.mjs farm3d/tests/cow-yard.test.mjs farm3d/tests/cow-clearings.test.mjs farm3d/tests/remaining-care-yard.test.mjs farm3d/tests/holiday-clearings.test.mjs`; all pass. GPU ownership is further measured in Task8.
- [ ] Commit the six listed files: `feat(farm3d): build relocatable animal care assemblies`.

### Task 4 — Revision-aware care and real gate passage (phases B/D)

**Files:** Modify `chicken-stations.js`, `remaining-care-controller.js`, `remaining-care-navigation.js`, `index.html` containment/cow-task adapter, `animal-pen-runtime.js`; create `tests/animal-pen-rebind.test.mjs`, `tests/animal-pen-gates.test.mjs`.

**Interfaces:** Consume `ResolvedSite`, Task2 Validation/World and Task3 prepared yards. Add `snapshotLayout():CareSnapshot` and `prepareLayoutRebind({site:ResolvedSite,actors:ActorSnapshot[],now:number,placements:Record<string,Point3>}):PreparedRevision` to chicken and remaining-care controllers, and a same-shaped local cow adapter in index. `CareSnapshot` contains scheduler tokens verbatim plus per-actor stationId/kind/stage/held/weight/blocked/pose/nap/paid-visit markers, lane queue order, current lane owner and wake/night barriers; derived paths/coordinate references are omitted then rebuilt. Snapshotting/preparing must not release tokens. Produce `prepareAnimalPenRevision(layout:ResolvedLayout,validation:Validation,live:LivePenAdapters):PreparedRevision` in runtime; Index supplies `LivePenAdapters={prepareCare:(layout:ResolvedLayout,validation:Validation)=>PreparedRevision[],publishRegistries:(layout:ResolvedLayout,yards:Record<Kind,object>,validation:Validation)=>void,disposePrevious:()=>void}`. Runtime calls Task3 preparePenYards plus prepareCare off-scene; publish installs prepared yards/registries then prepared care in one synchronous turn, disposes the previous revision only after success, and dispose releases only uninstalled preparations. Publish replaces all pen-owned entries coherently while preserving unrelated entries and stable external arrays.

- [ ] Write `rebindPreservesGenerationFifoAndWakeBarrier`, `occupiedStructureMovesOnceWithoutWalkingTeleport`, `robotStageChangesDuringDraft`, `gateIsPassableButRoamingRemainsContained`. Assertions:
  ```js
  assert.deepEqual(after.tokens,before.tokens);
  assert.deepEqual(after.lanes,before.lanes);
  assert.equal(after.robot.jobId,before.robot.jobId);
  assert.equal(after.robot.startedAt,before.robot.startedAt);
  assert.deepEqual(after.paidLedger,before.paidLedger);
  assert.equal(after.oldRevisionPathCount,0);
  ```
  These before/after reports are local test captures of the real controller/Beast, not additional production APIs. Exercise each species gate player crossing and directed animal inside→outside / outside→inside separately and together, and each coop door entry/exit/mixed queue. Test an approach while milking advances to exiting before prepare. Legal free actors retain exact position; moved occupants use one support-local delta; excluded actors use validated distinct staging; subsequent frames obey original speed/pose/clearance. Assert no new dock report for already docked cow and physical approach/dock/exit/turn/clear for other stages.
- [ ] Run `node --test farm3d/tests/animal-pen-rebind.test.mjs farm3d/tests/animal-pen-gates.test.mjs`; preserve RED with full task/lane/station/position records.
- [ ] Implement the signatures and adapters. Replace convex-only inside/projection/forbidden-polygon logic with Task1 general polygon predicates. Explicit gate links permit only a directed passage corridor during passage; ordinary roaming still uses inset containment. Controller instances rebind or rebuild via validated snapshot/restore preserving valid generations/queue/pose/barriers; discard old-coordinate routes. Do not use relocation as ordinary queue relief. Cow ledger functions remain unchanged.
- [ ] Run the two new suites and `node --test farm3d/tests/chicken-care-controller.test.mjs farm3d/tests/chicken-stations.test.mjs farm3d/tests/remaining-care-controller.test.mjs farm3d/tests/remaining-care-beast.test.mjs farm3d/tests/remaining-care-navigation.test.mjs farm3d/tests/cow-stations.test.mjs farm3d/tests/cow-robot-contact.test.mjs farm3d/tests/cow-room.test.mjs`. All original speed/tolerance/deadline assertions remain.
- [ ] Commit the seven listed files: `feat(farm3d): rebind care routes and traversable pen gates atomically`.

### Task 5 — Transactional writer4 with failure recovery (phases C/E)

**Files:** Modify `game.js`; create `tests/animal-pen-save.test.mjs`, `tests/animal-pen-writer-compatibility.test.mjs`, `tests/fixtures/game-before-pen-writer.js`; modify `tests/versions.test.mjs` and `tests/cow-writer-compatibility.test.mjs` only where asserting the new current maximum writer (old fixture/migration assertions remain). Add any new imports to existing VM harness contexts explicitly.

**Interfaces:** Produce synchronous `commitAnimalPenLayout({expectedFarm:object,expectedRevision:number,animalPens:AnimalPens,canCommit:()=>boolean,prepare:(candidate:object)=>PreparedRevision,onFatal:(error:Error)=>void}):{ok:boolean,code:'OK'|'STALE'|'READONLY'|'INVALID'|'PREPARE'|'STORAGE'|'RECOVERY'}` in game. `expectedFarm` is G.S identity; prepare receives a candidate complete farm after existing paid settlement, so it binds the current ledger stage. `canCommit` checks latest epoch/geometry immediately before persistence. Refactor shared internal save preparation/notification without changing normal save semantics or replacing live G.S. `SAVE_VERSION=4`, `MIGRATIONS[3]` shape-preserving, existing migrations unchanged. No API serializes transient actors/scheduler.

- [ ] Freeze exact game30 `game.js` from main1115 into the new predecessor fixture, record SHA256 in the compatibility test. Follow existing cow-writer VM isolation pattern; do not modify old fixtures. Write `quotaFailurePreservesOldLayout`, `persistedCandidateSurvivesPublicationFault`, `normalTicksDoNotStaleDraft`, `robotStageChangesDuringDraft`, `writer3CannotOverwriteWriter4`, `unknownTemplateCannotBeSaved`, `cancelNeverPromotesWriter`. For actual in-memory/storage adapters, assert:
  ```js
  assert.strictEqual(G.S,identityBefore);
  assert.equal(storage.getItem(G.SAVE_KEY),oldBytes); // quota-failure case
  assert.deepEqual(events,[]);                       // no saved event on failure
  assert.equal(JSON.parse(newBytes).v,4);             // successful Apply case
  assert.equal(savedEventCount,1);
  assert.equal(oldWriter.save(),false);
  assert.equal(oldWriterRaw,newBytes);
  ```
  At identical Date.now compare Apply and ordinary-save controls for full pens/care/tank/job/receipts, barn/coins/XP/stats/production timers (excluding only authorized layout/writer fields). Include milk boundary at11999/12000ms, supplies expiring during draft, prepare throw, storage throw, epoch/obstacle change, overflow revision, persisted-but-publish throw and simulated reload before publication. Successful reload must reconstruct the complete new layout and paid state.
- [ ] Run `node --test farm3d/tests/animal-pen-save.test.mjs farm3d/tests/animal-pen-writer-compatibility.test.mjs`; preserve RED, including exact saved bytes for transaction faults.
- [ ] Implement the API with existing read-only/restoring/account/visit/care-recovery guards. Settle normal elapsed paid state, build candidate/prepare, recheck canCommit, write exactly once, update only authorized live layout/version fields, publish synchronously, then existing saved event once. On prewrite/storage failure dispose prepared resources, preserve old layout/version/save bytes; legitimate paid settlement equals normal-save control. After persisted publication fault block old-layout writes and call controlled reload recovery; never overwrite or cloud-rollback the complete new save. All owner-transition and malformed/unknown custom-layout guards apply to ordinary save too; valid existing v4 must never be demoted even when no new edit occurs. Unknown template/schema blocks writes with recovery notice. Guard normal save as well, including after export/import/restore.
- [ ] Run the new tests plus `node --test farm3d/tests/cow-writer-compatibility.test.mjs farm3d/tests/save-writer-compatibility.test.mjs farm3d/tests/cow-care.test.mjs farm3d/tests/cow-milking.test.mjs farm3d/tests/chicken-care.test.mjs`; no paid-state or old-client regressions.
- [ ] Commit the six listed files: `feat(farm3d): commit custom animal layouts with writer4 recovery guards`.

### Task 6 — Draft editing, stable fence identities and gesture rules (phase C)

**Files:** Create `animal-pen-editor.js`, `tests/animal-pen-editor.test.mjs`.

**Interfaces:** `createAnimalPenEditor({readWorld:()=>World,readLayout:()=>AnimalPens|undefined,validate:(layout:ResolvedLayout,world:World)=>Promise<Validation>,commit:(value:AnimalPens,base:{epoch:string,revision:number})=>boolean,onChange:(state:EditorState)=>void,clock:()=>number}):PenEditor`. Methods: `begin(kind:Kind):boolean`, `select(target:Selection|null):void`, `dispatch(command:EditCommand):boolean`, `beginGesture(pointerId:number):void`, `cancelGesture():void`, `endGesture():void`, `validateNow():Promise<boolean>`, `apply():Promise<boolean>`, `cancel():void`, `snapshot():EditorState`, `dispose():void`. `Selection={kind:Kind,type:'vertex'|'edge'|'run'|'gate'|'structure'|'pen',id:string}`. `EditorState={open:boolean,dirty:boolean,draft:AnimalPens,selection:Selection|null,draftRevision:number,validation:Validation|null,canApply:boolean,reason:string|null}`; draftRevision is transient gesture epoch independent of saved layout revision.

`EditCommand` is the union: `{type:'moveVertex',kind,id,to:Point2}`, `{type:'moveEdge',kind,edge:[string,string],delta:Point2}`, `{type:'splitEdge',kind,edge:[string,string],id:string,at:Point2}`, `{type:'removeVertex',kind,id}`, `{type:'addRun',kind,id,a:Point2,b:Point2}`, `{type:'moveRun',kind,id,delta:Point2}`, `{type:'removeRun',kind,id}`, `{type:'addGate',kind,gate:SiteRecord['gates'][number]}`, `{type:'setGate',kind,id,offset:number,width:number}`, `{type:'removeGate',kind,id}`, `{type:'moveStructure',kind,id,to:Point2}`, `{type:'movePen',kind,delta:Point2}`. Invalid geometric commands remain draft edits with invalid status; reject malformed/unknown command identities. Removing a gate-bearing edge/run retains an unresolved gate record and invalid reason until explicitly reanchored; add `{type:'anchorGate',kind,id,edge:[string,string]|null,run:string|null,offset:number}` for this repair. Stable gate IDs never silently disappear.

- [ ] Write `staleValidationCannotEnableApply`, `secondPointerCancelsOnlyCurrentGesture`, `edgeChangeNeverDropsGate`, `openCancelDoesNotRoundOrSave`, `allCommandsRespectOwnershipAndPetMode`. Use manually resolved promises for two successive validations: resolve newer invalid first then older valid and assert `snapshot().canApply===false`, commit calls0. After one completed move and one cancelled drag, assert first move retained, second exactly restored; Cancel leaves original raw save/no commit calls. Split a gate edge, remove a post and remove its interior run; assert original gate ID retained or explicit user removal, no hidden gap; reanchor restores valid record. Table-drive all command variants and whole-pen deltas against decimal baseline coordinates.
- [ ] Run `node --test farm3d/tests/animal-pen-editor.test.mjs`; retain RED with command sequences and deterministic promise ordering.
- [ ] Implement pure draft ownership. Clone only on begin/change; coalesce preview validation at150ms, stamp each request by draftRevision+world epoch+obstacleRevision and ignore late results. Final Apply waits for fresh complete validation, increments saved revision once and invokes commit with current base token. Recheck after await; no pending gesture Apply. Invalid latest drafts remain repairable. Unknown template/future schema/unowned species cannot enter editable state; dog/cat expose nook moves only.
- [ ] Run the new suite plus Task1/Task2/Task5 suites. All command/revision/Cancel assertions pass with no localStorage/economy authority in this module.
- [ ] Commit the two listed files: `feat(farm3d): add revision-safe animal pen drafts and fence commands`.

### Task 7 — Native Edit submode and live integration (phases B/C/E)

**Files:** Create `animal-pen-editor-view.js`, `tests/animal-pen-integration.test.mjs`, `tests/animal-pen-editor.browser.cjs`; modify `index.html`, `animal-pen-runtime.js` and `game.js` only for required UI entry hooks. Do not mix unfinished drafts with the immediate-save editor.

**Interfaces:** `createAnimalPenEditorView({editor:PenEditor,host:HTMLElement,canvas:HTMLElement,project:(p:Point3)=>Point2,unproject:(p:Point2)=>Point3|null,preview:(layout:ResolvedLayout,validation:Validation|null)=>void,clearPreview:()=>void,panZoom:(event:PointerEvent)=>void,onClose:()=>void}):{dispose():void}`. Bind actual pointer capture/keyboard events; DOM dispatch is not qualification input. Index defines local integration functions `snapshotPenWorld():World` and `setAnimalPenEditing(active:boolean):void`; neither is a new global game clock. Only debug mode adds `__dbg.penEditor`, `__dbg.penRuntime` (current revision/resource report/World), never production bypass controls. `commit` closure uses Task5 with Task4 preparation and fresh full Task2 validation.

- [ ] Write integration tests `obstructedSiteCanMoveAsWhole`, `productionEditorUsesCurrentCustomGuards`, `editPausesOnlyPhysicalActors`, `dirtyExitHasThreeChoices`; browser journey `nativeEveryEditOperation`. Browser evidence goes to `tests/artifacts/animal-pen-editor-<width>/results.json`, trace, screenshots and measured inputs. At each four viewport, open Edit→Animal pens with trusted input; select species, expand corner/edge, split/remove post, add/move/remove interior run, add/move/widen/reanchor gate, move each assembly type, whole-pen move, nudge and keyboard. Assert all visible targets≥44×44, selected handles accessible without thin-fence precision, current draft feedback, input trust/timing and geometry after Apply/reload. Explicitly test second touch, pointercancel/lostcapture, closing while dirty, Apply/Discard/Keep editing and storage failure. Record DOM overlays if a torso/handle tap is covered.
- [ ] Run `node --test farm3d/tests/animal-pen-integration.test.mjs` and `PEN_VIEWPORT=390x844 node farm3d/tests/animal-pen-editor.browser.cjs`; preserve RED. The new browser script uses existing `browser-harness.cjs` and accepts `PEN_VIEWPORT` with only the four declared viewport values; unknown values fail.
- [ ] Implement actual action strip and owned species/assembly selection, lightweight previews/large hit handles, one-metre edited-coordinate snap/nudge, readable invalid reasons. Capture camera/selection before entering and restore on exit. Second touch cancels current gesture then pans; gameplay taps cannot leak. Cancel/discard never save. Production time/supply settlement continues while physical actors pause; reset physical dt baseline on exit. Read current resolved sites in old editValid/spotFree guards, not frozen old yards. Publish all layout registries/hits/support/clearings/lighting in one turn, including fallback-site retirement only after successful Apply. Account/visit/restore/future-save transitions cancel/disable pen mode and invalidate callbacks.
- [ ] Run the Node test and browser script with each `PEN_VIEWPORT=390x844`, `844x390`, `768x1024`, `1280x720`; require native input evidence, actual rendered valid/invalid previews and exact Cancel/storage saved-byte comparisons. Run `node farm3d/tests/seed-selection.browser.cjs`, `node farm3d/tests/decor-catalog.browser.cjs`, `node farm3d/tests/accessibility.browser.cjs` for nearby editor/game controls, retaining their original assertions.
- [ ] Commit the six listed files: `feat(farm3d): expose native animal pen editing with Apply and Cancel`.

### Task 8 — Full-herd, persistence/cloud and resource qualification (phases D/E/F)

**Files:** Create `tests/animal-pen-care.test.mjs`, `tests/animal-pen-care.browser.cjs`, `tests/animal-pen-recovery.browser.cjs`; extend `firebase/tests/recovery.browser.cjs`, `firebase/tests/conflicts.browser.cjs`; modify `index.html`, `sw.js`, `tests/versions.test.mjs` for legitimate module/cache versions and `tests/run-core-game-tests.mjs` to include new Node suites. Create `.github/workflows/animal-pen-diagnostic.yml`; add edited-layout cloud checks to existing firebase job without replacing its checks. No package lock/SDK/rules changes.

**Interfaces:** Care/recovery scripts accept `PEN_VIEWPORT` as Task7; output `animal-pen-care-<width>` / `animal-pen-recovery-<width>` artifact directories using the same source/tree/input/failure schema. Workflow matrix runs editor+care at all four views and recovery+resources at844/1280; immutable head checkout and artifact upload `if: always()`. Extend current emulator flows rather than invent cloud backdoors. Node care suite drives actual Beast/rig/controller functions, not stub motion.

- [ ] Write `all46ThreeNightsAfterEachEditClass`, `recoveryRetainsCustomLayoutAndPaidState`, `twentyRebuildsReleaseOwnedResources`. Run five edit classes separately: boundary reshape/expansion, interior fence with gate, exterior gate relocation, individual assembly move, whole-pen relocation; include all six species/assembly types over the cases. Seed1 and4242,30/60/120Hz, three nights each, full40s ordinary wakes, original500s goals; assert all46 present, unique sleep/reservation slots, actual mouth/body support and original speed/clearance/pose limits. Exercise coop both doors with entry/exit separately then mixed, exterior player/animal passages and cow approaching/docked/milking/exiting edits. Snapshot original state on any timeout; never skip second bedtime.
- [ ] Write recovery browser cases for actual installed main1115 cache63→candidate64, writer3→4, night reload, offline reboot, hidden→visible, backup export/import, account switch, visiting, future schema/template and stale event. Actual emulator same-account devices must retain complete layout through revision conflict and reject old-writer overwrite; assert exact equal-clock paid controls and SDK12.19.0 with storage allowed/blocked. Resource test alternates Apply/Cancel and full rebuild20times after warmup; geometries/textures return to owned steady baseline, renderer calls/triangles/preview time recorded. Maximum fences in all four pens: profile150ms validation scheduling and bounded search counters; no repeated full route validation each animation frame.
- [ ] Run `node --test farm3d/tests/animal-pen-care.test.mjs` and `PEN_VIEWPORT=844x390 node farm3d/tests/animal-pen-recovery.browser.cjs`; preserve first failures. At this stage tests target already implemented behavior; if a new defect is found, preserve exact state and add its failing focused test before the smallest repair. A green first run is not falsely labeled a reproduced failure.
- [ ] Register changed/new modules with consistent import query versions and service-worker shell (game31/cache64 only if still next). Include all new Node files in the existing isolated runner; keep original72files and their process isolation. Add diagnostic workflow with pinned source and required artifacts; no disabling old gates. Repair only evidence-proven bounded defects with new hypothesis and unchanged existing assertions. Commit exact files above with `test(farm3d): qualify edited pens through care and recovery` (any necessary runtime repair gets its own focused commit/evidence).
- [ ] Run `FARM3D_CORE_GROUP=node node farm3d/tests/run-core-game-tests.mjs`, all Task7 four-view editor checks, all Task8 four-view care checks,844/1280 recovery/resource checks, and `npm test --prefix farm3d/firebase` plus `npm run test:conflicts --prefix farm3d/firebase`. Run existing chicken physical, remaining-care and cow diagnostic workflows on the same final head, plus full regression workflow. Inspect actual current jobs/artifacts rather than cached historic totals. If any source changes, prior greens are historical; qualify final exact head again. Don't start duplicate jobs while equivalent ones run.

### Task 9 — Exact-head review, real preview and guarded publication (phase G)

**Files:** Create `farm3d/PEN_EDITING_20261022.md`, unique final qualification/evidence JSON under `tests/evidence/pen-editing-implementation/`; update both relays. Final publication receipts belong on a separate evidence-only branch after merge, preserving release tree. No speculative new feature coding in this task.

**Interfaces:** Consume exact final source/tree plus workflow IDs/attempts/jobs/check-runs, archived artifact API digests and local SHA256, measured resource/input/care/recovery results. Produce human-readable release packet and durable relay state. Evidence fields: base/head/tree/merge-tree, file manifest, each command/job/result, failed-attempt references, preview files, viewport/emulated/physical flags, owner approval text, limitations and next action.

- [ ] Compare all spec sections to Tasks1–8 results; adversarial self-review storage/crash windows, station identity, scene ownership, gate/concave geometry, old writers and protected-file digests. Explicitly check no BLOCKER/MAJOR unresolved, original rig/ledger/security/land/path bytes preserved, no loosened assertions, no undocumented scope changes, no failing/skipped required jobs. A suspicion needs reproduction, not a fabricated pass. Record all original failures and repairs.
- [ ] Commit the final test/runtime tree before final hosted qualification, fetch fresh main, inspect conflict/synthetic merge tree and pin every required result to that exact head. Run all existing regression17jobs, cow9, chicken3, remaining-care4 plus new editor/care/recovery jobs; verify actual workflow inventory if it changes rather than assuming37 remains the total. Source or merge-base runtime changes invalidate affected prior receipts.
- [ ] Inspect actual edited-game screenshots/video: phone portrait/landscape, tablet, desktop; show enclosure before/after, both coop doors/ramps, enlarged walking areas, relocated robot/shelters/nooks, real feed/drink/sleep and editor controls. Provide a runnable exact-head preview and clearly label emulation. Ask one concise owner visual/release question with concrete previews. Do not substitute generated imagery or infer visual acceptance from plan approval.
- [ ] After direct visual/release approval and fresh exact-head readiness verification, mark ready/merge pinned head via normal GitHub merge; never force/reset. Record merge and tree equality/any reviewed merge resolution. Preserve saves; rollback, if needed, is a reviewed revert, with writer4 data compatibility addressed before release of older code.
- [ ] Verify automatic main regression and Pages actual results, deployed normal entry and every changed/cached runtime file hash, installed update/offline behavior and relevant postmerge checks. Preserve failures and perform only evidence-supported scoped reruns. Finish with publication receipts on an evidence-only branch, relays updated, explicit process/automation status and actual game link. Do not call the feature merged/deployed/complete until those steps succeed.

## Plan self-review and owner checkpoint

Coverage: spec owner outcome/interaction→Tasks6/7; fixed capacities/defaults/horse land/general geometry→Tasks1/2; complete assemblies→Task3; gate/route/queue/stage-aware rebind→Task4; schema/writer/transaction/recovery→Tasks1/5/8; all46care+native+cloud+resource qualification→Tasks7/8; exact-head visuals/merge/deployment→Task9. All five Review Focus inputs have named owning tests. Shared data/API names above are used consistently; optional existing factory arguments preserve old callers. No full implementation bodies, new economics or unrelated refactor included.

Planning validation is documentation/JSON/diff/integrity review only. Product tests and performance measurements are future execution gates, not claimed passes. No runtime test/CI/deployment started for this plan. Approval of the written design is recorded; **owner review of this completed plan is the next gate**, followed by native sole-implementer execution. Fresh edited-game visual and release approval remains later.
