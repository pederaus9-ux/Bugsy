# Chicken quality audit

Main/base: `d87658e3ee97f0dabc372f4cbaf8c99a8d36e65d`. Runtime tree: `ce9b0b24f7dd34b67f84fa5090b200f2e4488abc`. Main regression192/run38286414523 passed7/7 and Pages74/run38286414160 passed. Owner cat acceptance and explicit PR77 merge are recorded.

Owner: ChatGPT/Codex; branchcodex/chicken-contact-audit. Existing openPRs60/54/37/34 have unrelated scopes; none owns chicken changes. Main relay contains the pre-acceptance cat snapshot; explicit owner acceptance and merged qualification supersede it. Update current relay in this phasePR.

Initial goal: audit actual chicken anatomy and walk/run/stop/restart/contact behavior at defaultheight0.35 and gameheight0.72,30/60/120Hz. Biped requirements differ from quadrupeds; do not impose the horse's two-feet walking support rule. Preserve original2mm contact and sole limits, root speeds/collision, existing bones/geometry/head motion, other animals and save/backend/renderer/serviceworker contracts.

First hypothesis: chicken uses the shared quadruped updater, whose idle reset snaps world foot contacts to neutral. Reproduce before changing production. Separately measure the remaining root-only screenshot staging problem; do not confuse it with live movement.

Baseline idle front/side/rear are unmodified real captures from regression191 artifact11757967991, SHA25641ab44e7084ce838be76f86b0747c49e22529cf494ddabe752b9fe09c552f0a2. Its tested tree is exactly the mergedmain tree, so reuse avoids rerunning unchanged rendering. Existing walking/running chicken captures recenter roots without contacts and are not accepted as motion evidence.

## Bounded correction preflight

Reproduction:48/48stops fail. In-gameheight0.72,walk0.8m/s for1second: planted foot slides82mm at30/60/120Hz; any-foot shift106.142778mm. Matrix maximum117.520669mm; moving contacts stay within4.441e-13mm. The first eight behavioral regression tests fail on parent; a ninth checks the new per-rig cache contract.

Planned production target: chicken3d.js only. Reuse the qualified stop/restart recovery method with two actual legs and the chicken model's0.52unit scale, retain its exact head-pitch calculation and existing joint solve. Geometry/rest definitions, shared updater, root movement/speeds/collision, otheranimals, saves/backend, renderer interfaces and serviceworker are protected.

Test-only targets: chicken-stop-continuity.test.mjs, chicken-evidence-placement.mjs/test, chicken-baseline.browser.cjs, animal-visual.browser.cjs, core runner/package and relay/report. Measure actual skinned toe soles, not just target locations. Validate48gait-phase cells,12turn-stop cells, two independent rigs, invaliddt, teleport and exact staging translation/reset. Preserve all existing numeric assertions.

## Current verified findings

Stop/staging correction:71/71 selected tests pass, including48gait-phase stop/restart/teleport cells,12turn-stop cells, actual toe soles, other-species/frozen geometry checks and existing module/version checks. A new staging test initially used an out-of-scope loop variable; corrected to use the actual two-leg rig. No numeric tolerance changed.

This does not clear the broader motion audit. `node --test farm3d/tests/chicken-start-turn.test.mjs` fails6/6 with unchanged2mm contact limits and the existing first-restart travel bound applied to first-start continuity.

|Hz|First walk foot jump|Root travel|Right-turn first failing frame|Grounded slip|
|---|---:|---:|---:|---:|
|30|106.615mm|26.667mm|35|15.032mm|
|60|106.615mm|13.333mm|71|15.032mm|
|120|106.615mm|6.667mm|142|7.382mm|

Reproduction: height0.72,walk0.8m/s straight1second then right90degree movement for2seconds. Actual previous/current toe soles are at the ground plane (within1e-7m), previous foot was planted, and current flag is cleared. First requested old-anchor horizontal radius is0.138856local at30/60Hz and0.133331at120Hz. Shared updater clips at0.128 and releases the flag, although hard leg reach is0.159. Subsequent replants produce up to102.535/101.279/107.412mm grounded motion. Raising a soft reach limit without measuring body attachment is not a justified fix.

A separate diagnostic using the2mm near-ground band catches3.4mm unplanted landing/liftoff samples; those are not presented as planted slip. The right-turn failures remain when measured at the actual ground plane, so they are real. Straight walking actual planted contacts remain fixed.

Main and candidate feet match exactly in six moving comparisons (left/right,30/60/120Hz); start/turn defects are inherited. No existing protected geometry changed. Bounded stop improvement is implemented; full chicken motion acceptance is blocked.

Next discriminating experiment: preserve still-reachable world contacts versus begin a continuous early lift from the actual foot pose. Check contact/sole/continuity, support and hip/body attachment on the pinned first failed frames. Do not blindly increase reach, move hips to conceal errors, rewrite other species or run unchanged failing CI. If evidence requires a larger planner replacement, present repair/simpler alternatives and tradeoffs before expanding.

All failures remain in the test runners. HostedCI and new browser renders have not been started. No PR, visual approval or merge. Performance is unmeasured. This is ChatGPT self-review, not an independent external-agent audit.
