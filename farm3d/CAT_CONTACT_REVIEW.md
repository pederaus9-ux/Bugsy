# Cat contact audit

Base: `4741a44f11f6ac6422a25783acd19fc048b0eecb`.
Branch: `codex/cat-contact-audit`; implementation owner: ChatGPT/Codex.
Main regression189: all seven jobs passed; Pages deployment passed.
PR76 dog face/stop/restart owner accepted and merged. No active cat PR or overlapping open implementation was found.

Scope: measure stopping and restarting on the existing cat rig; implement a cat-only correction if reproduced. No anatomy redesign or optional animation polish.

Expected: stopping retains actual world paw x/z within the existing2mm contact bound; real sole vertices do not penetrate more than2mm and settle within1second. Restart cannot jump farther than caller root travel. Test defaultheight0.4 and gameheight0.85 at30/60/120Hz, walk/run, multiple gait phases, both90degree turns, teleport/cache isolation and invaliddt.

Protected: sharedquadruped geometry and gait, cat rest bones and paw surfaces, otheranimals, gameplay speeds/collision/root, saves/cloud/auth/economy, publicrenderer APIs/serviceworker, accepted baselines. Planned productionfile: cat3d.js only. Tests/evidence/relay updates are in scope.

First hypothesis: shared updateQuadruped clears contacts and resets leg targets on idle, snapping physicallygrounded paws to neutral. The flag reset cannot disguise physical sliding.

## Reproduced baseline

All48 stops exceed2mm on main. Gameheight0.85, walk0.9m/s for1second: previously planted paw slips75.375mm at30/60/120Hz; maximum any paw133.564809mm. Matrix maximum231.608972mm (previously planted222.131250mm). Moving planted contacts hold to8.882e-13mm.

The first eight new behavioral tests fail on the unchanged parent; the ninth specifically verifies the new recovery cache contract. The correction passes allnine.

## Correction and local verification

`cat3d.js` uses the qualified dog recovery method, with cat defaultheight0.4 in its fallback cadence. Real paw x/z is retained; lifted paws settle using existing remaining gait timing. Restart blending accounts for gameplay root movement before the updater; per-rig caches are reused and reset on teleport. Shared geometry, walking solver and renderer contract remain unchanged. Duplication is deliberate to keep the accepted other species frozen; a shared-helper refactor is deferred.

53 selected tests pass:48cat stop/restart/teleport cells,12left/rightturn-stop cells, actual sole contact, invaliddt/cache independence, staging reset/translation negative controls, dog/sheep regressions, sixspecies frozen geometry/rest fingerprints and existing module/version tests. Forty-eight independent stop measurements yield worst horizontal displacement4.441e-13mm.

The new staging negative control initially selected runframe24, which has no planted paw at catheight0.85; it now samples frame23 with real planted contacts and computes the expected root displacement. This changes only the new negative-control setup, not any threshold or production gait.

Node performance: median7measured batches x6000updates x6cats. Walk main0.027460ms vs candidate0.033045ms (extra0.005585ms); idle main0.026229ms vs candidate0.029623ms (extra0.003394ms). Comparative local CPU measurements, not phone/browser frame rates.

## Evidence and remaining gates

Camera follows the same real cat rig across3resting views,3head closeups and30continuous walk/stop/restart/run/run-stop samples, without relocating contacts. Gallery and actual-farm staging use cat-specific test-only reset/translation with unchanged2mm guards. No generated validation imagery.

Hosted browser suites and rendered capture inspection are pending; no local browser execution or owner approval is claimed. A passing job will not establish visual acceptance. ChatGPT self-review is not an independent external-agent audit. No merge is authorized.

All four original six-species visual geometry/contact/cadence assertions pass in isolated processes with original limits. Syntax checks and git diff --check pass.

## Owner-rejected visual correction preflight

2026-10-12T10:36:34-05:00: owner states the cat visuals are not right after reviewing the real render. Continuing the proposed bounded face and leg-attachment correction. Main remains4741a44; PR77 head7fbb7ac/tree5eaeafaf. Regression190 retry passed7/7; art66 passed. No visual acceptance or merge permission.

Implementation branchcodex/cat-visual-correction; delivery remainsPR77/codex/cat-contact-audit with an expected-head safeguard. Production targetquadruped3d.js: cat-only head/ear surfaces and a continuous upper-leg volume whose top vertices follow the body. No gait, bone/rest, knee/lower-leg/paw, body/tail, other-species geometry, material/mesh/public API, gameplay/save/backend or serviceworker change.

Before editing, frozen cat-visual-protected.json was generated from exact parenttree5eaeafaf. Only cat head, ears and upper-leg geometry are authorized exclusions; every other species and cat bone/lower-leg/paw/body/tail remains fingerprinted. The earlier dog snapshot's full-cat geometry guard must recognize these newly authorized regions through this separately frozen partial-cat fingerprint. Its original immutable snapshot file is not altered. This updates scope, not contact/animation/performance thresholds.

Acceptance: each upper leg is one connected volume, anchored inside the actual body mesh through idle/walk/run/turn/stop; knee attachment and actual sole tests remain intact; one centered pink triangular nose, two compact cheek pads, mouth and whiskers replace the pig nostril pair; ears meet the skull. Run all contact and protected-mesh checks; inspect actual hosted36-view sheet and farm images; owner visual/gameplay approval remains required.

## Visual candidate implementation and validation

Cat-only template branches replace the separated upper-leg pieces with one tapered connected surface. Top vertices follow the body and lower vertices follow the existing hip, preserving the original bones, solver and paw geometry. Compact cheek pads, a centered triangular pink nose, mouth, six whiskers, forward green slit eyes and embedded ears replace the prior snout. Body/tail/lower legs and other species remain fingerprint-identical.

Three visual checks: the protected-mesh guard passes on parent; identity and upper-leg continuity fail on parent and pass on candidate. Actual top anchors remain inside the skinned body through walk/run/turn/stop at heights0.4/0.85 and30/60/120Hz. Upper ends meet the knee surface; actual sole/contact/restart limits remain unchanged.

An initial blended-weight prototype failed the original1e-8m staging translation assertion: stored Float32 weights summed1.0000000298023224, creating2.086162576e-8m drift. The cause was corrected by quantizing build-time blend weights to binary1/256fractions so stored weights sum exactly1. No assertion was loosened.

Resource count:3464 to3776triangles (+312),21bones,one skinnedmesh/material. Geometry and weights are built once per template; no new per-frame geometry work or gait logic. Phone/GPU performance is unmeasured; existing hosted performance gates remain required.

ChatGPT performs adversarial self-review, not an external independent-agent audit. New actual renders and owner acceptance remain pending. No merge authorized.

Final local validation:56/56 selected tests and all four original six-species geometry/contact/cadence assertions PASS; syntax and diff checks PASS. Exact-head hosted results are still pending.
