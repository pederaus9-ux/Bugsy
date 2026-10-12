# Sheep baseline audit

Base: a43a032d629e4e314f10d3c70bb544f9bf97db51; branch codex/sheep-quality-audit.
No production files changed. Horse and cow remain frozen.

## Verified

Regression #178 passed all seven jobs on base. Artifact 11722491226 SHA256 bbaa6f53bfc2dc2604b56b94531edcb2a677ccb50f3722728fbc4e1ba5082f6b verified. Eighteen actual sheep captures recovered under evidence/sheep-main178. Front/side/rear idle views inspected; recognizable sheep, smooth oval wool, visible rounded limb caps and cylindrical legs. These are visual observations, not owner acceptance or rejection.

Existing sheep3d.test.mjs passed 1/1. Browser capture script syntax passed; execution unavailable because local browser is missing, /tmp/chromium is empty, and Playwright archive URL returned 195 bytes of HTML instead of a ZIP. No repeated installer runs planned.

Staging reproduction: createLiveAnimal('sheep',1.2,0,14); for 24 frames at 60 Hz move root by -1.2*(run?1.4:.65)/60 and call updateLiveAnimal with matching delta and running flag. Before recenter, planted foot world x/z minus l.ax/l.az is approximately zero. Restore root z to 14 without updating anchors, as animal-visual.browser.cjs does: errors become 312 mm walk and 672 mm run. Rendered frozen poses still exist, but these no longer represent a consistent contact state. Do not judge subsequent movement from those staged anchors.

Uninterrupted five-second straight walk at 0.78 m/s, height1.2, each30/60/120Hz: maximum planted foot horizontal error 2.665e-12 mm. Actual skinned sole vertices measured with applyBoneTransform + localToWorld remain at ground within 0.000001 mm. Per-leg hip local-position lowering reaches 85.874/86.039/86.039 mm, compared with authored rest height. Its visual acceptability is not established.

## Unknown / next action

Continuous walking visual sequence, turns, stops, running contact/support, continuity and extended behavior remain unaudited. Existing CI walk/run screenshots are isolated sampled poses, not a continuous animation review. Use camera-follow captures without root relocation before proposing a rig correction. Do not expand shared quadruped3d.js scope affecting dog/cat without justification. No sheep rebuild or merge is authorized by passing this baseline.

## Bounded evidence correction

Test-only sheep-evidence-placement.mjs translates the staged root and finite world x/z anchors together. Both gallery and actual-farm sheep recentering use it and assert <=2 mm horizontal planted-foot error. Other species branches, original assertions and thresholds are unchanged. Three local tests pass, including original sheep test, a negative control reproducing 312/672 mm errors and pose/contact/every-skinned-vertex translation checks at height0.9/1.2 in idle/walk/run. Syntax and diff checks pass.

A separate camera-follow capture script produces three idle views and six sequential walk samples without relocating the root. It is added after all existing six-species browser checks in test:animals. Browser execution is not locally verified; exact-head hosted CI and visual inspection are required. This PR contains source/relay/report only; original recovered images remain available in verified main regression178 artifact11722491226 rather than duplicating that artifact. Production animals and game systems are untouched. No merge authorization.
