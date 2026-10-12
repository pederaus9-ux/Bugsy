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
