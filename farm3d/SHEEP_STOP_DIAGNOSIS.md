# Sheep first-idle-frame contact regression

Base:39600b0bb02495f08c53d32ab3e1aedd36ddd7c2 (PR74 evidence-only candidate, production sheep identical to maina43a032). Branch:codex/sheep-stop-diagnosis. No production edits.

Command:node --test farm3d/tests/sheep-stop-continuity.test.mjs. Result:FAIL6/6, exit1. Warm-up:walk at height*0.65m/s for1second; height0.9/1.2,30/60/120Hz. First zero-movement idle update keeps the actual skinned hoof sole grounded but shifts the previously planted hoof104.500mm at0.9 or139.333mm at1.2. Existing2mm planted-slip/sole thresholds are used without changes. Test measures actual sole, not only planted flags.

Root cause verified in quadruped3d.js: speed0 makes state.amount0 immediately; then all legs lose planted flags and tx/tz are reset to0. A grounded hoof moves to the neutral pose in one frame. Existing sheep test only checks standing after30idleframes.

Next bounded experiment: sheep-specific stop recovery preserving world x/z of planted contacts and settling the swinging hooves to ground continuously. Compare this against holding planted contacts and finishing/recovering complete steps; choose based on real motion evidence and turning/restart/contact checks. Do not modify default shared quadruped behavior, dog/cat, horse/cow, speeds, collisions, saves or thresholds. No production correction or visual acceptance claimed. PR74 is separately qualifying correct capture placement; do not combine this known failing test with that evidence-only PR.
