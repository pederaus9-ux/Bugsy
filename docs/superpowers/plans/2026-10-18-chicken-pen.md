# Chicken Pen and Care Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. The owner has assigned ChatGPT/Codex sole implementation; do not delegate.

**Goal:** Deliver a customizable chicken coop and netting run with shared 12-hour feed/water supplies and automatic outside-pallet egg collection.

**Architecture:** A DOM-free chicken-care module owns deterministic production and one-time legacy migration. Existing game mutations remain authoritative for inventory, XP and saves. A chicken-yard module owns geometry, station targets and appearance, connected to the existing page's input, collision and view hooks.

**Tech Stack:** Existing JavaScript ES modules, Three.js, Node test runner and Playwright; existing Firebase snapshot transport unchanged. No new product dependencies.

**Spec:** `docs/superpowers/specs/2026-10-18-chicken-pen-design.md`

## Global Constraints

- Base main: `756df378e7adbe20f34c204dc54172b1030e16bd`; base tree: `6580beff7b9018ec33c6d4cda0fff9139b4339d4`. Design checkpoint: `9cb302f1b69663bd41170a6afbcec9f91cfef4c1`.
- Fixed maximum six chickens; full feed and water last 12 real hours, including time away. Base interval 30 minutes; proposed pallet capacity 240 eggs.
- Empty-bin refill: one chicken-feed item per chicken; free water. Early feed top-up costs `ceil(flockSize * missingFraction)`; quote before confirmation; no charge when full.
- Preserve old animals, pending paid outputs, barn inventory, names, happiness, unknown save fields and top-level v1. Chicken care gets its own versioned optional envelope.
- Keep other animals, accepted animal meshes/motion, general movement, Firebase/auth/security, canonical economy and frozen evidence unchanged. Scoped chicken inventory/production/save additions are intentional; report any wider protected-system requirement before implementation.
- Holiday decorations come after chickens. Market sales are separate. Cow bulk tank waits for the cow pen. Whole-game graphical polish is a later pre-release phase, with measured mobile performance and save reliability.
- No merge/deployment until actual in-game evidence is reviewed and the owner explicitly authorizes this change. No recorder launch or normal optimization.

## Review Focus

1. Visiting another farm, account swaps, or newer care versions must never mutate an account through the new actions; Task 2 tests these guards.
2. Long absences, backwards clocks and simultaneous egg completions must produce bounded, repeatable results; Task 1 tests partition-independent accounting and full-pallet pauses.
3. Repeated confirmation events or partial barn pickup must not duplicate feed spending, eggs, bonuses or XP; Tasks 1–2 pin receipts and reward accounting.
4. Customization preview must not recolor shared barn materials or leak GPU resources; Tasks 3–4 test isolation, cancel and repeated previews.
5. A normal installed old worker and real touch gestures must work, not merely mouse clicks in phone-sized fresh contexts; Task 5 exercises actual touch input and installed-cache update/offline reboot.

---

### Task 1: Deterministic chicken care and migration

**Files:** Create `farm3d/chicken-care.js`, `farm3d/tests/chicken-care.test.mjs`.

**Interfaces:** Export `CHICKEN_CARE` constants; `ensureChickenCare(pen, at)`; `settleChickenCare(pen, at)`; `quoteChickenRefill(pen, resource, at)` returning `{cost, until, revision}`; `refillChickenCare(pen, resource, at, expectedRevision)` returning `{ok, cost, reason}`; `takeChickenEggs(pen, room, at)` returning `{normal, gold, xp}`; and `chickenCareStatus(pen, at)` returning counts, remaining times and pause reason. Resources are `feed` and `water`. These functions mutate only the passed chicken pen and return changes/rewards; they do not touch global inventory or DOM. Game integration validates available feed before refill.

- [ ] Write named Node tests with assertions: `one_six_and_zero_chickens` (one ordinary egg at 1,800,000ms, six at the same boundary, 144 base eggs after 43,200,000ms, zero without both supplies); `earlier_supply_deadline` (completion at the exact deadline counts; deadline+1 produces none); `early_topup_quote` (six-chicken half-fill costs three; empty costs six; full costs zero; stale revision fails without mutation).
- [ ] Add `pause_and_resume` (retain partial active progress; no backlog while full/empty), `pallet_boundary_and_barn_room` (never over 240, gold first, full barn leaves stock), `clock_partition` (one 12-hour catch-up equals many smaller settlements), `clock_backwards` (no additional progress), and `new_chicken` (fresh interval, same remaining supply).
- [ ] Add `legacy_migration_once` for zero/ready/future old timers, ownership/meta preservation and repeated reload; `unknown_care_version_preserved` must block new care mutations without replacing its envelope.
- [ ] Add `happy_cycles_and_rewards` with a persisted seeded random sequence: happy cycle 24 minutes, existing 25% double and 30% gold chances, happiness evaluated at historical cycle start. Repeated settlements/save round-trips retain the same outcomes. Use bounded per-cycle batches containing quantity, quality and unpaid XP; existing two XP per completed cycle is paid once on its first collected egg, including split double-egg pickups. Truncate a double to remaining pallet room without a second payout.
- [ ] Run `node --test farm3d/tests/chicken-care.test.mjs`; retain the initial missing-module failure.
- [ ] Implement the interfaces. Care v1 stores feed/water deadlines, monotonic last-accounted timestamp, per-chicken active progress/cycle-start happiness, pending legacy outputs, persisted RNG state, bounded reward batches, revision and counts. Counts must agree with batches. Empty new supplies; never auto-spend feed. Process completions in time order, ties by chicken index; loop bounded by available 12-hour supplies and 240 pallet capacity. Legacy outputs already paid may finish without new supplies; retain pending outputs if storage is full. New chickens start fresh. No wall-clock timer is the authoritative state.
- [ ] Rerun the same command; expect all assertions PASS, no skipped failures. Commit module and tests together with retained red-run receipt.

### Task 2: Existing game rules, saves and chicken-only routing

**Files:** Modify `farm3d/game.js` (animal mutations around 479–517, purchase around 696–711, load/upgrade/save around 245–357, HUD/away/reminders/tick/tutorial); create `farm3d/tests/chicken-care-integration.test.mjs`; extend `farm3d/firebase/tests/recovery.browser.cjs` only with additive snapshot round-trip assertions.

**Interfaces:** Export `getChickenCareStatus()`; `chickenRefillQuote(resource)`; `refillChickens(resource, expectedRevision)` returning boolean; `collectChickenEggs()` returning collected egg count; and `setChickenAppearance(appearance)` returning boolean. Status/quotes are read-only projections. Existing `feedOne`, `feedAll`, `collectAnimal`, `collectAll` signatures remain available for other species.

- [ ] Write fail-first integration tests: insufficient feed changes no inventory/deadlines; repeated confirmation with the same revision spends once; six feed items fill six birds for 12 hours; water is free; one pallet call transfers up to barn space with exactly-once quality/XP/events; all legacy chicken feed/collect entry points cannot produce an additional payout. `feedOne/All('chicken')` directs to the station rather than silently charging. `collectAnimal/All('chicken')` directs to the pallet rather than paying from a bird. Preserve return types.
- [ ] Add `read_only_farms` (visits, account hold and unsupported care version reject spending/collection), `other_species_exact` (cow/sheep/horse actions match prior state changes), and `farm_roundtrip` (names/unknown pen fields/top-level v1 survive upgrade, JSON, backup and restore). Unowned pens create no stock or UI actions.
- [ ] Run `node --test farm3d/tests/chicken-care-integration.test.mjs` and retain the failure. Use a disposable VM/DOM fixture following the existing test conventions, without external services.
- [ ] Implement wrappers: settle before chicken mutations, tick/save and successful restoration; quote-check and inventory-check before changing supplies; advance revision after mutations; commit once. Avoid save-to-settlement recursion. Settle before purchasing but add a fresh bird only after the purchase succeeds. Keep the existing maximum/prices and all non-chicken paths intact. Read-only status projection must not change a visited farm or generate random outcomes.
- [ ] Update chicken-ready HUD, away summary, reminders and tutorial wording to report the pallet/stations. Do not insert tutorial indices that would reinterpret saved progress. Existing bird pet/name/love metadata stays accessible; successful feed fill retains the existing +5 love benefit once per bird, after settling prior production.
- [ ] Run both focused test files and additive emulator snapshot tests through the existing emulator harness. Confirm full care/appearance envelopes survive `cloud.put(raw, summary, revision)` and restore without Firebase/rules/auth source edits. If transport rejects the data, retain the failure and report the precise protected expansion required.
- [ ] Commit the reviewed rule/save integration and tests. Do not claim cloud compatibility from a guest-only test.

### Task 3: Coop, netting, stations and pallet geometry

**Files:** Create `farm3d/chicken-yard.js`, `farm3d/tests/chicken-yard.test.mjs`; modify `farm3d/index.html` (chicken fence run around 1382, yard metadata/obstacles around 1545–1571, scene initialization and view refresh hooks).

**Interfaces:** `createChickenYard()` returns `{group, targets, layout, applyAppearance(appearance), setStatus(status), dispose()}`. Targets are `{kind, object}` for `coop`, `feed`, `water`, `eggs`; `layout` supplies footprint, enclosure, gate and chicken-specific obstacles. The module imports the existing vendored Three.js; materials/geometry are privately owned or deliberately shared inside the yard only.

- [ ] Write actual-geometry tests for complete coop/ramp/netting bounds, distinct target volumes, pallet outside enclosure, traversable gate and reachable stations. Initial layout: retain existing yard bounds; coop occupies the north-west corner, supplies beside the gate, pallet just outside the south edge. Calculate exact placements against existing tree/hay/barn obstacles before fixing layout constants; assert no overlapping player access corridor. No whole-farm expansion or shared-paddock relocation.
- [ ] Add tests: appearance options retain footprint/capacity; roof swap affects only roof; default wood/red metal/cream trim; repeated status updates allocate no new geometry/material; preview/cancel cycles restore colors; `dispose()` releases owned resources once and never shared barn resources. Adopt a component budget of at most 30 render calls, 30,000 triangles and four 512px textures; measure actual farm deltas too.
- [ ] Run `node --test farm3d/tests/chicken-yard.test.mjs`; retain initial failure, then build a raised wooden coop, nesting detail, ramp, netting posts/gate, visible feed bin, waterer and egg crates. Use merged/instanced geometry where helpful; no transparency-heavy stacked fence layers. Gold/normal crate amounts and water/feed levels reuse geometry.
- [ ] Replace only the chicken wooden fence and decorative water pan. Match animal enclosure and obstacle metadata to visible geometry; keep shared livestock fence/path segments. Preserve existing chicken models/controller byte-for-byte. Remove only obstacles/decor that would physically overlap the new coop, retaining unrelated placements; if a user-placed item blocks access, show the issue rather than deleting inventory.
- [ ] Rerun module tests and existing chicken motion/geometry tests. Commit geometry/integration after PASS; appearance is still unaccepted until real captures.

### Task 4: In-world interaction and customization

**Files:** Modify `farm3d/index.html` (`keyPos`, `trayHtml`, tray dispatch, `hitAt`, `aimScan`, `onTap`, debug/view hooks); modify chicken panels/dispatch in `farm3d/game.js`; create `farm3d/tests/chicken-yard-interaction.test.mjs`.

**Interfaces:** Page station hits carry `{type:'chickenStation', station:'coop'|'feed'|'water'|'eggs', obj, dist}`. Existing input routes call Task 2 wrappers. Appearance is `{walls, roof, trim, roofType}` using validated palette IDs and `metal`/`shingles`; temporary preview is page-local and Apply commits once.

- [ ] Write fail-first interaction contracts: Feed/Water shows remaining hours and exact refill quote; full/empty/insufficient states are understandable; pallet pickup needs one interaction and reports leftovers; chicken taps keep petting/naming without feed/collection controls. First/third-person aim labels use the same station hit/reach checks as classic taps.
- [ ] Add Customize contracts: walls/roof/trim and roof type preview; Apply persists validated choices, Cancel/close/visit exit restores saved appearance; no coins/feed change; barn materials unchanged; pointer and keyboard targets at least 44px and visible at 390px portrait and 740px landscape widths. Repeated same-revision confirmation cannot spend twice.
- [ ] Run `node --test farm3d/tests/chicken-yard-interaction.test.mjs`, retain the failure, implement the page/panel routing and Escape/focus-return behavior, then rerun. Keep generic move-edit disabled for this fixed-footprint coop. Avoid rebuilding geometry every animation frame.
- [ ] Commit controls and contract tests after PASS; do not call source/DOM tests native touch verification.

### Task 5: Native game evidence, saves and installed update

**Files:** Create `farm3d/tests/chicken-pen.browser.cjs`, `farm3d/tests/chicken-pen-update.browser.cjs`; add opt-in harness settings to `farm3d/tests/browser-harness.cjs` while retaining all existing defaults; modify `farm3d/tests/package.json`, `farm3d/tests/run-core-game-tests.mjs`, `.github/workflows/farm3d-regression.yml`, `farm3d/sw.js`, matching imports/version assertions in `farm3d/index.html` and existing version tests; document results in `farm3d/CHICKEN_PEN_REVIEW.md` and relay/state.

**Interfaces:** Add `start(options = {})` with optional `serviceWorkers:'allow'`, `deviceScaleFactor:1` and immutable served-source selection for update tests. Existing callers retain current SW-blocked/0.5 defaults. Add `npm run test:chickens` for focused Node files plus the two browser suites, and a dedicated hosted chicken job with artifacts always retained unless cancelled.

- [ ] Write native tests using actual `locator.tap()` and touch drag events at 740×360, 844×390 and 390×844; desktop mouse/keyboard at 1280×720. Test real station hit targets and reach, movement through gate, naming/petting, refill confirmation, full barn, repeated pickup, pause/resume and customization Apply/Cancel. Seed timer/inventory fixtures only where the setup requires; drive the tested action through real input. Record accelerated-clock use and software renderer limits.
- [ ] Add a normal disposable guest-farm test (not `?testfarm`): fill, earn, collect, save, reopen and repeat offline; no lost or duplicate goods. Add emulator care snapshot assertions from Task 2 to hosted existing Firebase checks. Block external accounts/weather/analytics/webhooks in guest harness; use only isolated emulators for account checks.
- [ ] Add installed-update test using exact base v46 assets and real active service worker, then serve the candidate on the same disposable local origin. Require distinct candidate worker activation and page reload, new modules cached at correct hashes, original raw save retained/migrated once, and fully offline reboot. Test absent new-module cache failure is retained, not masked as a pass. No alternate browser transport to bypass a denied launch.
- [ ] Advance cache v46→v47 and game module URL v25→v26; cache both new modules at `?v=1`, with import URLs matching shell entries. Existing worker algorithms unchanged. Verify each existing version assertion follows intentional version increments only; no tolerance or timeout relaxation.
- [ ] Run focused Node tests and syntax checks first; then native suites and exact-head hosted existing regressions. A missing local browser is UNVERIFIED locally; use the existing authorized hosted CI route. Retain first failures, logs, screenshots/traces and partial result checkpoints; no claim that a planned test has passed.
- [ ] Capture actual whole pen, coop close-up, fence detail, stocked/empty stations, outside pallet and two customization choices; capture an uninterrupted walk/refill/pickup sequence. Compare fixed-scene render calls/triangles/textures and frame observations against base in equivalent slots with disclosed renderer/viewport. Do not claim phone/GPU performance from software rendering. Inspect both sunny/night looks and all three views for cut-off/netting/occlusion issues.
- [ ] Self-review exact diff, resources, migration boundaries and all required results. Keep known legacy character timeout, black-surface report and broader CPU/GPU/capture/recorder gates explicit. If required tests fail, report blocked rather than merge-ready. Present screenshots/video and source HEAD to the owner; obtain actual visual acceptance and explicit merge instruction before integration. Save successful procedures and unresolved failures in the relay.

## Self-review and handoff

Spec coverage maps to Tasks 1–2 (production/supplies/storage/migration), Task 3 (physical pen), Task 4 (in-game customization/controls), Task 5 (native evidence, saves/update, gates). Every Review Focus item has an owning test. Proposed engineering defaults remain identified in the spec; no market/cow/holiday product code is included.

Status: plan prepared for owner review; no product implementation or game launch has occurred. Execution method is direct ChatGPT/Codex implementation, consistent with current repository owner instructions. After plan review, use `superpowers:executing-plans`; keep each task's checks and commits distinct. This is lead self-review, not an independent external-agent audit.
