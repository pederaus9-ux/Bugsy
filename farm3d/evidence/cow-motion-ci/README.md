# B9–B11 motion checks in hosted regression

Base: `3fb7eff9f2a9d2da0c4384342fd85e6fd1a448c3` (owner-merged PR59).
Branch: `codex/cow-motion-ci-gates`.

The existing hosted core command enumerated57 unit tests and omitted
`cow-gait.test.mjs` and `cow-b10-contact.test.mjs`. The main run
[37559356506](https://github.com/pederaus9-ux/Bugsy/actions/runs/37559356506)
confirms57 passes with neither new test name. B11's diagnosis produced numeric
measurements but was not an asserted CI check. Green existing regression did not
prove that these new motion gates ran in hosted CI.

The repair retains the original command, every browser check and all budgets/
timeouts, adding the two unchanged B9/B10 tests and two B11 turning cases.
Each turning case measures rendered skeleton soles on a matched radius2 path at
30/60/120 Hz after two seconds of warmup. Both directions require finite poses,
continuous planted samples, drift/ground error below the existing B10 `1e-10`
limit, outside swing travel at least20% greater than inside, and torso/turn
direction matching the path. Acquisition/replant frames do not count as drift.
Coordinates use game units, not calibrated physical meters. Rigs are disposed
twice to preserve the idempotent cleanup contract.

Direct local verification: all61 core unit tests pass, followed by every existing
game/save/reload/shed/cow browser check at740/844/1280 and16 full-resolution
idle/eating anatomy views with stable30-rebuild resources. Existing B9/B10
tests2/2 and new B11 tests2/2 pass. The same new test against the pre-B11 renderer at
`df63f59e557165501b4425b569f1f7f781eb2ceb` fails both directions. Raw negative
control logs and source are preserved outside the repo in the dated resync
package. Original frozen B0 evidence is untouched.

The old expanded B0 probe was repeated separately against current main, without
overwriting its baseline: all18 contact scenarios now meet the original `.002`
limit, including stopping/teleport recovery at30/60/120 Hz. Run-start phase
spread remains0.0054466761587463886 for equal travel and is deferred to B12;
this validation repair does not retime motion or claim to close transitions.

No cow renderer, anatomy, gameplay, saves, auth/Firebase/economy, other animals,
cache behavior or protected root files change. Full final-head hosted checks
and specific human merge approval remain required. No physical/B18 acceptance
is established by these local or hosted measurements.
