# Sheep stopping contact and visual evidence audit

Base: a43a032d629e4e314f10d3c70bb544f9bf97db51; branch codex/sheep-quality-audit.
Initial baseline audit changed no production files. The subsequent sheep-only stop correction is described below. Horse and cow remain frozen.

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

Additional exact-head probes at56a1775: height1.2;30/60/120Hz;4seconds each: walk0.78m/s for1second then stop, left/right90degree turn, or straight run1.68m/s throughout. Worst planted horizontal error1.223e-11mm; sampled actual soles within0.000001mm of ground. Final turn yaw +/-pi/2; stop amount0. These do not establish natural transitions. Idle intentionally releases planted flags; flag counts alone are not physical support. Continuous capture now samples every20frames for120frames/2seconds, exceeding one0.62m stride at0.35m/s.

## Reproduced production hard-stop defect (subsequent local correction)

Reproduction on published source candidate56a1775, whose production sheep/shared solver are identical to maina43a032: createLiveAnimal('sheep',1.2); walk at0.78m/s for exactly1second with matching root movement and updateLiveAnimal(...,'walk',false), at each30/60/120Hz. Record actual foot world positions, then one updateLiveAnimal(r,0,0,1/hz,'idle',false) without moving root. Previously planted legs1/2 move139.333mm in one frame; swinging legs0/3 move210.903mm. This occurs identically across all rates. Idle sole grounding is not proof of continuous stopping.

Root cause: updateQuadruped sets state.amount to0 immediately when input distance is0. The same update releases every planted leg and zeroes its relative target (tx/tz). IK places every hoof into the neutral standing position in one frame. Existing sheep test checks only finite gait and standing after30idleframes; it misses the first transition frame. The motion wrapper maps the idle act to walk mode, but zero speed alone triggers the defect.

Required correction: preserve current world contacts and finish/recover ongoing steps during stopping, scoped to sheep and preserving other animals. Optional wool/joint art polish is separate. No threshold loosened. Shared quadruped code also serves dog/cat: do not modify its default behavior casually. A sheep-only opt-in recovery prototype and continuous camera-follow stop evidence are the next discriminating experiments after corrected baseline capture. Current evidence PR contains no production fix and does not accept this defect.

## Hosted capture and visual framing rejection

At39600b0, regression181's six-species job passed, including corrected staging and new two-second continuous sheep capture. Artifact11724245223 SHA256674e9e343766e0de19307a41052b06c66fc00db161746f90b91288825dd060a6 verified. Browser errors0; worst contact1.8874e-12mm. Actual gallery was inspected and rejected for full anatomy review: head/ears clipped by the fixed camera window.

Correction changes camera framing only, fitting actual skinned vertices with12percent margin at unchanged390x250 per-cell resolution. Adds an assertion that every projected sheep vertex is inside0.98 of the viewport. Node experiment across the same9poses: old projected extent1.2196428 (clipped; boundary1), corrected0.89285714. Syntax and3local tests pass; corrected browser render remains pending. No production file or existing assertion changed.

## Current integration candidate

PR74 is consolidated around sheep stopping contact plus faithful evidence. Sheep3d.js holds stationary world contacts and settles swinging feet using remaining gait timing; geometry/rest definitions and default shared solver are unchanged. The new stop regression and recovery-aware test staging are included in the existing animal job.31/31local tests pass, including sixoriginal failures,48gait-phase stop/restart/teleport cases and12turn-stop cases. New continuous stop render evidence and final exact-head hosted qualification remain pending. This is ChatGPT implementation plus self-review; no external-agent audit or owner visual approval claimed.

Evidence-only parenta4d688b passed7/7regression182 jobs. Its complete9-viewgallery was inspected with no clipping; artifact11723714169 digest69c87e5d66a2003b247b16fe17005b2f73346a3c5046e782e38df135096fe221. Those passing results do not qualify the newer production stop correction. Optional wool/limb art changes are deferred. See SHEEP_STOP_DIAGNOSIS.md for reproduction, numerical and performance evidence.
