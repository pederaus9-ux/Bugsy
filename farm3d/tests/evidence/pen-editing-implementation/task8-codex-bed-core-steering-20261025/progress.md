# Cow 3 wake failure: severity checkpoint

Runtime unchanged from `1e7cd6af242849474f9729c3a88b1b7975eef661`; launch/checkpoint base `4b8033e5d0fb6531862a96720e0fe12adbe05e90`. No production code, original test, oracle, seed, time limit, physical tolerance or protected checksum change.

## Matrix results

Dog-nook assembly seed1/120Hz passed all three nights (233.55 wall seconds), following the two previously credited unchanged cases. The next batch added interior-fence/gate seed1/30Hz (131.42 seconds) and sheep whole-pen seed1/30Hz (135.24 seconds), also three-night PASS. Boundary expansion seed1/30Hz failed during night-three wake (119.05 seconds).

Current technical coverage is **5/30 PASS, 1 FAIL, 24 not run**. All original 46 stable identities, unique beds, 500-second bed/departure deadlines, continuous 40-second wakes, paid/save/revision, containment and browser-error checks remain. These are care/wake results, not full-herd speed/skin/hoof/contact/pose proof. See adjacent `task8-codex-a22-matrix-20261025/coverage.json` for exact actions and provenance.

## What failed, and what is causal

The original boundary test failed at third-wake frame745, cow:2 (Cow 3), after first departure frame59. Its position was `[-3.462581962150974,0.08,-37.934356848192884]`, target `[-3.8,-36.8]`, label "Leaving the straw beds", no bed task. The unchanged oracle detected less than0.025m motion within its old0.65m bed core over2.5seconds. This proves that strict condition, not permanent blockage.

`snapshot-analysis.json` evaluates the production steering formulas at the retained positions. The0.8m/s exit vector `[-.228086,.766796]` nearly cancels the neighbouring grazing cow's separation vector `[.222614,-.768373]`; gap1.533343m, net requested speed0.005695m/s. No authored nearby cow obstacle contributes repulsion at that point. This is a local steering balance, not proof of a skin collision.

The native frozen-neighbour fixture reproduces only0.011256m net motion over2.5seconds (RED). Removing that neighbour, with all other positions fixed, produces0.840754m displacement and physical departure (PASS), while preserving the original0.85m separation and0.8m/s walk controls. Those tests are now a standalone diagnostic, preserving the original `cow-scene.test.mjs` exactly. The deliberate RED remains executable and is not hidden by a passing status.

One observation-only full-browser replay retained every original assertion/seed/deadline and passed all three nights. Its first cycle exactly matches the original; cycle2 differs (9044/10135 night/wake frames versus8621/9613), and cycle3 differs. It is **not credited as a replacement pass**. Exact RNG history/initial simulated clock and timer ordering were not captured in the original; the current script seeds the ordinary RNG but begins at `d.clock()` after real initial draws and leaves background intervals running. These are unisolated replay sensitivities, not a confirmed explanation for the divergence. No repeat loop was started.

## Player impact and owner disposition

Following the owner's12:22/12:25 triage direction, a bounded continuation used the captured five cow positions and actual production movement/care. It deliberately allowed the neighbour its **full authored14-second grazing duration**, then ordinary logic continued. This is a conservative reconstructed scenario with a fresh fixture seed1; the original remaining timer/RNG state and velocities were unavailable. It is not an exact continuation of the closed original browser.

Cow 3 physically left the0.65m core after **14.8333seconds**. At15seconds the neighbour had moved and Cow 3 was0.7795m from its bed; at16seconds it was1.0652m away. The90-second observation completed. From that live state, all five cows then completed feed, drink and nighttime bed visits, settling within **164.4667seconds**, under the unchanged500-second care limit. `player-impact-corrected.json` retains each one-second observation. No production fix or teleport was used.

The initial impact fixture errored before simulation because a VM lexical `PERSONALITY` constant was read as an object property. Its error/log remain in `player-impact.json/.log`; the supported `vm.runInContext` lexical lookup corrected setup, with assertions unchanged. No broad suite rerun.

**Disposition: document/defer as a recoverable traffic hesitation under the owner's severity-first plan.** Exact original duration, frequency across ordinary play and physical-phone perception remain unknown. One failure among six original matrix combinations is not a player prevalence estimate; the separate non-identical replay passed. No feed/water/night progression block was observed in the bounded continuation. Milking after this snapshot was not tested; A21/A22 robot evidence remains separately credited. No assertion is changed or relabelled green.

The primary steering reference distinguishes reactive steering from path/goal planning: [Craig Reynolds, Steering Behaviors](https://www.red3d.com/cwr/steer/). It supports examining the combination of goals and avoidance; it does not prove our implementation or justify reducing any clearance. No runtime solution was selected or implemented after the owner changed triage priority.

## Stop and next work

All owned browser/server/Node runs finished. No pending approval, access denial or executor blockage. A cleanup attempt to delete an unused draft analysis file returned a filesystem failure; no deletion occurred. The file was instead completed as the retained snapshot-analysis tool; no protected or historical evidence was removed.

Next prioritize targeted checks for materially blocking issues in changed systems, then remaining Task7/8 engineering gates according to severity. The broader matrix is still incomplete, not silently waived. The planned whole-game scan is deferred to near completion/final polish. No uploads, Site update, merge or deployment; private Sitev4 phone acceptance and local attachment views remain separate.

### Custom-pen guard follow-through

The first isolated continuation used the baseline fixture movement path. Because the retained browser had installed custom pen guards, one specifically justified variant enabled the actual custom containment, supported-step and0.85m cow-separation branches with the same captured positions, full14s grazing wait and fresh fixture seed1. This variant also PASS: physical departure16.8333s; all five feed/drink/night visits and holds159.3333s. Evidence player-impact-custom.json/.log. No runtime fix. This strengthens recoverability classification but still is not the original full46-animal RNG/history or a physical skin-clearance test. No further timing fixes or broad reruns are planned for this deferred issue.
