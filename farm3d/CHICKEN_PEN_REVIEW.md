# Chicken pen v1 — implementation and qualification record

Owner approved the written plan on 2026-10-18 at20:02:34 America/Chicago. Base main is `756df378e7adbe20f34c204dc54172b1030e16bd`; implementation follows design checkpoint `ad5774419e6cec5b08e2d23e91a3faf7eb0142c8` on `codex/chicken-pen-v1-20261018`. Original PC workspace is untouched.

## Current result

Implemented: chicken-only deterministic care/migration module; physical coop, netting run, feed bin, waterer and outside pallet; station interactions and in-game preview/Apply/Cancel appearance controls; matching v47 worker shell and v26 game imports. Other species retain their feeding and collection paths. Preserved the accepted chicken model/controller.

Local focused checks: 28 care/game/geometry/tray contracts pass, plus six cache/version contracts. Syntax checks pass for three inline scripts and three modified/new product modules; browser scripts parse. Existing selected chicken motion/placement checks pass with the geometry checks (24 total). Initial failures and the stale-quote regression are retained under `tests/evidence/chicken-pen/`. These are Node/geometry/contract checks, not native touch or visual acceptance.

Qualification is IN PROGRESS. Native touch/video, installed-worker failure/update/offline reboot and authenticated emulator snapshot assertions are authored but not yet qualified. Exact-head hosted regression is required. Authentic hosted browser screenshots/video are retained from two attempts below; no merge or deployment performed. Any generated image would be concept only; none was used.

## Decisions made while executing

- Fresh isolated Git clone and dedicated runtime branch instead of a nested linked worktree; no original checkout exists in this environment. Cost if wrong: workspace metadata differs, files remain isolated.
- Preserve failed/unfinished evidence rather than deleting the plan workspace while qualification is open. Cost: extra retained diagnostic files.
- Author performs adversarial self-review, consistent with owner-directed sole implementation; no independent external audit claimed.
- Passive saves persist completed production events rather than elapsed-second-only bookkeeping. The saved anchor reconstructs partial progress; existing auth treats every changed field as real progress. Cost if wrong: a partial-progress snapshot waits until an output or action, rather than creating a dirty cloud snapshot every second. Dedicated failing-then-passing regression retained.
- Authenticated emulator qualification runs on the complete UI/cache candidate in the final validation stage. Cost: transport defects may be discovered later; no merge clearance without the receipt.
- Refill accepts optional displayed `expectedCost` as well as revision, and uses one captured timestamp for the inventory check and charge. Cost: a stale rounded quote asks for reconfirmation; it cannot silently overcharge feed.

## Preserved limitations and next gate

The retained character CI timeout, prior black-surface report with unknown cause, broader CPU/GPU/capture-repeatability gaps and shelved recorder/normal optimization remain separate unresolved evidence. This update cannot clear them. Native software-rendered tests cannot establish physical Android/iPhone performance, heat, battery or sustained GPU behavior.

Next: run exact-head hosted tests, inspect genuine renders/interaction video and correct observed defects. Owner visual acceptance and explicit merge authority are still required. Holiday-decoration work follows chickens; cow bulk tank waits for cow pen; whole-game graphical polish remains a later release-readiness phase.

## First hosted attempt and correction pass

PR85 source head `8ee27d0bf769fa501f218516bb45f4e0e4154589`, exact tree `d6cea6c12569a0e71a907e509afdcb5ba6e56761`, regression213/run39185264006. The chicken job117846247086 passed28 Node contracts, then failed the unchanged30-second feed-station aim gate. Actual failure capture shows the camera aimed up; the test helper used positive pitch whereas the actual first-person camera requires negative pitch to look down. Correct the helper, not the gate. First ZIP artifact12157608588 has SHA256 `cae6d49b519aca69e7c0184915608ca452fbc9398fac538490e059b6981ed1dc`; raw results/log retained in this directory's evidence. Images/video/trace remain retained. Its reported render.calls=1/triangles=1 observed only the final postprocess pass and is not a valid scene-cost comparison; revised test records three complete farm draws with temporary test-only renderer hooks, in equal slots/quality.

Completed first-head jobs: old saves, accessibility, analytics, six-species visuals and planting PASS. Character job117846246902 FAIL at scene-polish.browser.cjs:75 waiting10000ms for the legacy finger-return condition; this same named failure was retained before this feature. No character assertion/deadline change. Core/emulator results were still pending at this checkpoint; do not count them as passes.

Code self-review found and reproduced important defects: malformed care could throw or permit invalid payouts/purchases; the enclosure depended on the barn for one wall and the upper gable face was absent; a distant walking tap could bypass station reach; replacing the coop tray could leave a preview active; petting could change already-earned offline quality; and buying between outputs could give a new bird pre-purchase progress. Each has a retained failing test and a passing correction.54 focused contracts including planting/cache pass after corrections. Force partial-time accounting before actual bird purchases/happiness changes, while passive saves still avoid dirtying the cloud every second. Cost if wrong: purchase/happiness actions capture an extra time anchor, not an extra reward.

New native coverage includes joystick gate traversal, full/repeated pickup, empty-supply pause/refill, real pet/name controls, opposite-side noon/night and first/third-person captures. These extensions remain unverified until their new exact-head run finishes. Auth fixture proves active supplies plus a paid egg survive upload/reload, then explicitly pauses its test supplies for the existing long quiescent recovery scenarios; no original recovery assertion is removed.

Local full `npm test` rerun completed41 Node invocations with229 passing assertions on the earlier candidate, then stopped because Chromium is not installed locally. No alternate local browser transport was used. New corrections have focused verification; complete native/global qualification belongs to the next exact-head hosted run. Self-review is not an independent audit; no merge approval exists.

## Cached-client follow-up (qualification pending)

Two additional failing Node probes showed that a still-open v25 client can write a paid timer into `pen.list` after the care envelope exists; the first implementation ignored it. The correction imports distinct unpaid timers even after initial migration, clears their legacy slots once, and preserves overlapping paid outputs. The compatibility queue is bounded at12 entries; ambiguous overflow is preserved and blocks new care spending rather than being discarded.56 focused contracts pass, including both new cases. The installed-update suite now revisits the actual base v25 module, feeds a bird through its original mutation, advances a disclosed test clock90 seconds, and returns to v26 before offline reboot. This new browser extension is not yet verified.

## Second hosted attempt and scoped pickup correction

Source b60d7722d1c7ef5cc8c2de472f02950d7e5af1f4, tree ad0a7ca800ffd7c1881520fc7dd713db34a35500; regression run39186621804, chicken job117850570866.20 native behavior groups pass: feed/water, pickup12, preview/cancel/apply and touch turning on740×360,844×390,390×844, plus740 joystick gate/full/repeated pickup/expiry-refill and desktop feed/water. Desktop pickup then times out at the unchanged30s target gate. Actual failure capture shows Buddy directly in front of the pallet; receipt centerHit is animal/Gift at0.952m. This is a real obstruction, not proof of a pallet gap causing this native failure. The next fixture approaches from the clear east side, with pets and hit priorities unchanged.

A separate Node ray probe reproduces a true center gap when looking down through the pallet slats. A bounded non-rendered raycast volume covers the actual pallet footprint; no extra GPU geometry/material, no global animal-priority change. Failing/passing tests retained.57 focused care/game/geometry/tray/planting/version contracts pass. Native desktop retest, installed update and cloud results remain pending.

Second raw ZIP artifact12158632372, SHA256 864bf18adcf2c2962fe5d250f24117d50e955e923dadad9c2664babc75a8473d retained with screenshots/video/trace. Base844 vs candidate844 three complete farm draws report303→333 calls,1,149,787→1,175,311 triangles, geometry259→275,textures94→96. These are scene-resource observations, not frame-time/GPU/phone-performance qualification. No release or performance clearance.

## Third hosted attempt: desktop pickup passed; palette refresh defect reproduced

Source7f325ad58618e27849b878d1df04d494b8b74679/tree d829d92c9daef4e5999679ffb8d1460165659486, run39188036117, chicken117854854396:21 native groups PASS, including desktop pallet pickup12. Desktop customization then fails: scrollIntoViewIfNeeded element detached at chicken-pen.browser.cjs33:218 while reaching roof choice. Actual receipt still targets coop. Full native images/video/trace retained in ZIP12159855420, SHA256b8bbc625b212864982726cedd97c76b27615a3368a9c639d8f51df0a28215c62. No installed-update run occurred because the former combined command stopped at the native failure.

A failing clock-only render test reproduces supply countdown changes replacing customization HTML. Correction removes the unrelated live supply summary from the palette; bin/water panels retain supply timing. Actual color choice still updates pressed state.58 focused contracts pass. Original native action assertions and timeouts are unchanged. Hosted workflow now runs installed-update separately after passing care contracts even when native UI fails, preserving both independent outcomes. This changes evidence collection, not acceptance thresholds.

Fresh local full core on7f:41 Node invocations239 assertions PASS, then local Chromium absence blocks browser. Current source-specific hosted planting/accessibility/old saves/analytics/six-species PASS. Existing named scene-polish75/10000ms character failure repeats and is preserved. Core and emulator were pending at correction preparation; no pass inferred. Palette correction still needs native requalification. Evidence checkpoint branch codex/chicken-pen-evidence-20261019 at b5549a1 records the earlier timestamped state; current paragraph supersedes only its pending-native entry.

Owner was shown genuine earlier-native b60 overview/pallet and a coop still extracted unchanged from recorded video at82s. No chicken visual acceptance or merge instruction received. Large tree obstructs overview; opposite view remains pending. Test-farm fixtures, accelerated clocks, software rendering and physical-phone limits remain explicit.

Final third-source job receipts: core117854854447 SUCCESS (38 Node files, five browser suites); Firebase117854854271 SUCCESS, including both named chicken authenticated upload and full restore assertions. Exact care/game code is unchanged by the palette correction. These qualify that source's core/cloud behavior; no installed-update or current palette-native clearance inferred. Task2 snapshot gate now has real emulator evidence. Seven regression jobs passed and two failed (character and chicken UI) on7f; preserve both failures.

## Owner scope amendment:30 chickens, October18 at21:29:59 America/Chicago

Owner explicitly chose30 for now after larger coop/run were proposed. New fixed limit30, run125.28 vs69.58 scene-square-units, coop floor scaled1.7×/1.55× (about22 square-units), larger stations and proportionally scaled1,200-egg pallet. The1,200 storage choice is an engineering default; normal30-bird12-hour output is720, happiness can fill it earlier. Keep30-minute base and12-hour supplies; empty-bin cost is one feed/current bird. No real welfare or phone-performance claim from scene dimensions.

65 focused checks PASS, including30-bird production, purchase limit, reload, bonuses/partitioning, capacity and preserved old paid outputs. Existing six-bird fixtures remain. Initial30-capacity failures, boulder-fixture parser failure, true boulder overlap and second overlapping-layout failure are retained. Revised coop(-11.6,-2.2)/ramp(-11.6,1.55) clear existing boulder footprints. New palette correction remains intact; accepted animal/controller sources unchanged. Existing exact worker-version assertion intentionally follows48; game27/care2/yard2 imports match cache.

New full-flock fixture uses real30 bird models in disposable normal guest farms at844×390 and390×844, native refill/pickup/customization and reload, plus actual captures/video/resources. Fixture camera/time are disclosed; no native result yet. The installed-worker test adds actual purchases from2 to30 and an offline reboot. Firebase snapshot fixture now transports/restores30 birds. Full-flock and installed-update jobs are separate from native UI, so failures do not omit each other's receipt. Earlier actual screenshots show the superseded smaller pen and are not new-layout validation. No merge or deployment.
