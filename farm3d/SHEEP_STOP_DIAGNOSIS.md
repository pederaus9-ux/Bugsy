# Sheep first-idle-frame contact regression

Base:39600b0bb02495f08c53d32ab3e1aedd36ddd7c2 (PR74 evidence-only candidate, production sheep identical to maina43a032). Branch:codex/sheep-stop-diagnosis. No production edits.

Command:node --test farm3d/tests/sheep-stop-continuity.test.mjs. Result:FAIL6/6, exit1. Warm-up:walk at height*0.65m/s for1second; height0.9/1.2,30/60/120Hz. First zero-movement idle update keeps the actual skinned hoof sole grounded but shifts the previously planted hoof104.500mm at0.9 or139.333mm at1.2. Existing2mm planted-slip/sole thresholds are used without changes. Test measures actual sole, not only planted flags.

Root cause verified in quadruped3d.js: speed0 makes state.amount0 immediately; then all legs lose planted flags and tx/tz are reset to0. A grounded hoof moves to the neutral pose in one frame. Existing sheep test only checks standing after30idleframes.

Next bounded experiment: sheep-specific stop recovery preserving world x/z of planted contacts and settling the swinging hooves to ground continuously. Compare this against holding planted contacts and finishing/recovering complete steps; choose based on real motion evidence and turning/restart/contact checks. Do not modify default shared quadruped behavior, dog/cat, horse/cow, speeds, collisions, saves or thresholds. No production correction or visual acceptance claimed. PR74 is separately qualifying correct capture placement; do not combine this known failing test with that evidence-only PR.

## Local bounded correction

Scope: sheep3d.js only in production. At zero-input transition, preserve actual world x/z contacts and settle swinging-foot height using remaining gait phase. Reuse per-rig scratch state; shared quadruped solver and all geometry/rest definitions remain unchanged. Uses the same existing adaptive leg solve; no new reach/contact tolerance. Resumed movement/teleport clears recovery. Test-only relocation also translates active recovery targets.

Validation:31/31 selected tests pass including all6original failures,48walk/run gait-phase stop/restart/teleport scenarios,12left/rightturn-stop scenarios, original sheep/species/module/version checks. 48scenario probe: horizontal foot movement2.776e-12mm worst; final actual soles within0.000001mm of ground. Exact-head hosted production validation and visual/device acceptance pending.

Node benchmark (not a device):7batches x5000updates for6sheep; walking median main0.012195ms vs prototype0.012312ms. Stopped median main0.010499ms vs prototype0.019986ms; extra0.009487ms/six (1.90x). Held idle contacts need extra leg solve; no extra draw calls/geometry. No mobile performance claim.

The evidence-only parenta4d688b passed hostedregression1827/7; artifact11723714169 SHA25669c87e5d66a2003b247b16fe17005b2f73346a3c5046e782e38df135096fe221 verified, all9views inspected and no clipped geometry. That green result does not qualify this production correction. PR74 will be consolidated around stopping contact and faithful evidence instead of opening a duplicate integration PR. New15-viewsheet adds6continuous stop samples to existing9views. Geometry art quality and owner review remain open.
