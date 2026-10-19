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
