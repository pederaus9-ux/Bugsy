# Dog stopping correction preflight

Base main: `ae30cc0c2dcf43145654de6bc7ce5413b807bb5e`.
Branch: `codex/dog-stop-contact`; implementation owner: ChatGPT/Codex.
Main regression186/run38237769216: all7jobsSUCCESS. PR75 Pages deployment succeeded.
No competing dog PR exists; historical cow/Firestore/docs PRs are untouched.

## Defect and scope

At in-game height1.15 and walking speed1.5m/s,1second walk then first idle frame
snaps planted paws170.113636mm and swinging paws246.527014mm at30/60/120Hz.
Expanded48case baseline: every stop exceeds2mm; worst planted241.369318mm,
any paw255.775762mm. Moving planted contacts remain within2.664535e-12mm.
Cause: shared updater clears contacts and zeroes horizontal targets at idle.

Target production file: dog3d.js only. Preserve geometry, shared solver, accepted
sheep/cow/horse, other animals, gameplay movement/speeds/collision, saves/cloud/
auth/economy, service worker and renderer interfaces. Add regression tests and
faithful test-only dog staging/camera-follow evidence. No optional art redesign.

Acceptance: actual grounded paws retain horizontal contacts within existing2mm;
actual soles remain above-2mm and all land within2mm; test default/in-game sizes,
30/60/120Hz, walk/run gait phases, stops after turns, restart and teleport.
Re-run original animal tests; exact-head hosted CI, continuous captures and owner
visual/gameplay review remain required. No owner approval or merge authorization
for this dog correction has been given.

## Candidate and limitations

Before correction: eight dog regressions failed. After correction:48gait-phase
stop/restart/teleport cells and12turn-stop cells pass at both sizes/three rates.
The first prototype retained planted restart contacts but swinging paws still
jumped up to346.325760mm. The final prototype eases unplanted paws into existing
gait goals; initial world pose subtracts movement already applied by the caller.
The added first-restart bound is paw displacement no greater than root travel;
no existing threshold or test was weakened. Actual skinned soles are checked
throughout stop and resumed travel, not just invisible target points.

Only dog3d.js changes production. Six-species staging now resets/translates dog
stop/restart caches, with negative controls and pose/mesh/contact preservation.
New camera-follow gallery:3rest angles plus6walk,6stop,6restart,6run,6run-stop
samples of the same actual rig. No capture teleport, generated imagery, changed
image resolution or weakened contact limit. Browser rendering awaits hosted CI;
local Chromium is unavailable (previous installer returned invalid HTML).

Node benchmark7measured batches×6000updates×6dogs: walking main0.014302ms vs
candidate0.017479ms (1.22×); idle0.011664ms vs0.030537ms (2.62×,additional
0.018873ms per six). These are comparable Node timings, not mobile FPS/battery.
Buffers are reused per rig; geometry, resources and normal shared gait unchanged.

Dog baseline idle captures at mainae30 were inspected; their rounded/segmented
art is not altered or newly owner-approved here. The correction is a stopping
milestone, not a claim that every dog animation or anatomy concern is complete.
Hosted regression, actual capture review and owner acceptance remain pending.

Local final selection:47/47tests passed (dog, unchanged sheep, animal modules,
live interfaces and versions); all4original six-species geometry/contact/cadence
assertions passed in isolated processes. Syntax and diff checks passed.
The reproduced30Hz in-game run restart now moves its swinging paws26.463138mm
instead of346.325760mm; grounded paws remain within1.813e-12mm.
This is measured improvement, not a visual/gameplay acceptance claim.
