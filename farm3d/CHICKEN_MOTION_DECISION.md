# Sunny Acres — chicken motion repair decision

## Decision resolved — October 12, 2026

The owner explicitly authorized the recommended coordinated repair with “Repair it” at 17:27 America/Chicago. See `CHICKEN_COORDINATED_REVIEW.md` for implementation and current validation. The experiments below remain historical evidence; their blockers do not describe the new controller. No merge was authorized.

## Original decision request

Authorize a coordinated chicken foot controller, or explicitly defer the chicken milestone while keeping its defects on the release-blocker list. No merge is requested.

Current main: `d87658e3ee97f0dabc372f4cbaf8c99a8d36e65d`. Existing audit checkpoint: `e1a5893f9e0a49e2028a3684d2b567f790e02ce7`. Main cat qualification192 and Pages74 passed. Production on this diagnostic branch remains the unchanged audit checkpoint; experimental overlays are isolated under `tests/experiments/chicken-motion/`.

## VERIFIED

- Chicken stop/restart correction passed71 selected local checks. Six additional first-step/right-turn checks still fail on the unchanged audit candidate. Nothing was merged or submitted to hostedCI.
- The first walking frame jumps106.615mm at gameheight0.72. A 90degree right turn can slide a physically grounded foot101–107mm. Plant flags can reset while the actual toe soles remain on the ground.
- The original updater creates targets from a distance phase, clips reach, and releases contacts independently. A new swing can finish outside that phase's stance window, so returning to the original phase can discard a real landing.
- Four bounded experiments were tested; they are not approved production fixes.

|Experiment|Observed result|Verdict|
|---|---|---|
|A: retain still-reachable stance contacts, arm startup recovery|First-step motion reduced, but right-turn grounded slip44.820mm remains. Hip origin can fall from0.2 to0.075 local units.|Reject: contact failure and attachment risk.|
|B: continuous early lift, original minimum-jerk path|Six canonical cases pass;96-case turn matrix fails8 cases. Fast-turn foot-target errors up to5.884mm; two walking cells lose ground support.|Reject: canonical success does not generalize.|
|C: remove takeoff delay, cubic path, walking support floor|96-case matrix fails1 case: defaultheight0.35,30Hz,walk,0.7second warm-up,rightturn. Grounded slip7.583mm; foot-target error16.572mm.|Reject: public default rig still violates the2mm gates.|
|D: retain early landings until the old phase reaches stance|96-case matrix fails15 cases; target error79.509mm. At gameheight0.72/60Hz, actual body/thigh bounding boxes can separate159.447mm in the1.3second warm-up/right-turn sequence.|Reject: holding a completed landing can outlast leg reach and disconnect the visible thigh.|

The matrix uses two heights0.35/0.72,30/60/120Hz,walk/run,four warm-ups0.3/0.7/1/1.3seconds and both90degree directions:96 cells. Actual toe soles, grounded previous contacts, requested foot paths and walking support are measured. No2mm threshold was increased. Running may have flight; walking must retain ground support.

Body gap was measured from actual skinned body/thigh vertices. Lack of a sampled thigh vertex inside the body is inconclusive on its own; the reported159.447mm vertical bounding-box separation is conclusive disconnection. No AI-generated imagery or visual acceptance is claimed.

## LIKELY root cause

The phase-based gait and the added reach-recovery overlay have competing ownership of foot liftoff and landing. Independent overlays cannot reliably hand support from one foot to the other. This is the strongest supported engineering diagnosis, not proof that every possible small correction is impossible.

## Recommended repair

One chicken-specific controller owns both physical feet from idle through startup, walking/running, turns, stopping, restart and reset. Each foot has explicit stance/swing/landing state. Before lifting the last walking contact, it verifies the opposite landing and the remaining path are reachable. A completed landing stays a real world-space contact rather than being returned to a contradictory virtual phase.

Boundaries:

- Change only chicken motion internals and test/evidence helpers. Keep the shared updater and every other animal frozen.
- Preserve existing skeleton/rest geometry and actual toe soles; no arbitrary hip displacement to disguise unreachable targets.
- Preserve gameplay root movement, speeds, collision, saves/cloud/auth/economy, public exports and serviceworker.
- Keep the existing phase/distance/head behavior where compatible; disclose any necessary internal gait changes for owner gameplay review.
- Keep all current tests and tolerances. Add the96-case matrix and the newly reproduced failures as permanent regression gates.
- Measure repeated turns, reversals, mode transitions and seeded roaming at30/60/120Hz. Inspect actual skinned body attachment and soles.
- Measure CPU/allocation/resource cost against main before hosted qualification and a real phone preview. No performance improvement or device result is assumed.

Stop condition: if this needs changes to gameplay movement, accepted other rigs, the save/backend/public interfaces, or a broader architecture, stop again with evidence and alternatives. No merge without exact-headCI, actual renders, owner visual/gameplay acceptance and explicit authorization.

## Simpler alternative

Defer the chicken correction and reprioritize independent game work. Leave main unchanged; retain the committed stop improvement, failing tests and diagnostic evidence. Chicken startup/turn defects remain release blockers. This avoids an immediate controller redesign but does not finish the chicken, meet its motion requirements or authorize release.

## UNKNOWN

The replacement controller is not implemented or proven. Its phone cost, gameplay feel, full-session reliability and final visual quality are unknown. No hours worked, completion percentage or delivery deadline is estimated.

## Reproduction artifacts

- Existing gates: `node --test farm3d/tests/chicken-start-turn.test.mjs` —6fail on the unchanged audit candidate.
- Matrix: `node farm3d/tests/chicken-turn-matrix.mjs` — baseline diagnostic; returns nonzero when gates fail.
- Body/thigh geometry: `node farm3d/tests/chicken-body-attachment-probe.mjs`.
- Saved overlay: `node farm3d/tests/chicken-experiment-runner.mjs early-lift-cubic-c` (also acceptsreach-only-a,early-lift-b,landing-hold-d).
- Experimental source is isolated; it is deliberately unoptimized and must not be imported by the production game.

This review is ChatGPT/Codex self-review, not an independent external-agent audit. Owner authority for major architecture/scope and merge decisions remains in force.
