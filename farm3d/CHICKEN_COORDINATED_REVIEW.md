# Chicken coordinated motion — engineering review

Base main: `d87658e3ee97f0dabc372f4cbaf8c99a8d36e65d`. Branch: `codex/chicken-coordinated-motion`. Owner authorized the proposed chicken-specific controller by saying “Repair it” on October 12, 2026. This does not authorize merging.

## Implemented

One controller owns both actual feet, with explicit stance, swing and settling states. A contact is handed over after the opposite foot lands. Landing timing reacts to new movement input; airborne paths are checked against current reach, including the takeoff frame. Stopping retains horizontal contacts and lowers airborne toes; restarting during a partial landing begins at the actual interrupted pose.

Both hips retain their attachment to the body. A single body-height adjustment makes both foot targets reachable; unlike the rejected overlays, individual thigh roots are not pulled away from the torso. The original geometry, skin buffers, skeleton/rest transforms, distance phase, heading response and head formula remain protected. Gameplay movement and all other species are unchanged.

## Verified local evidence

- All 96 original turn cells pass at heights 0.35/0.72, 30/60/120 Hz, walk/run, four warm-ups and both directions. Original 2 mm gates remain.
- The original six first-step/right-turn checks and stop/restart/teleport gates pass.
- Forty-five additional seeded sessions exercise changing directions, walk/run/idle and jittered 30/60/120 Hz over 900 simulated seconds. Requested and actual feet agree; walking retains at least one actual grounded sole. Results are in `tests/evidence/chicken-coordinated/roaming.json`.
- Partial-stop restarts preserve the original first-frame displacement bound at both sizes, all three frame rates, walk/run and one/two/four idle frames.
- Geometry/skin hashes and factory bone transforms are checked against frozen integrated main; other-species protection tests pass.
- The four original six-species geometry/contact/cadence assertions pass separately, with no weakened assertion.
- Node CPU comparison: median 1.342 microseconds per chicken update versus 1.085 on main, 1.236x. Seven alternating samples after warm-up, six rigs, repeated turns. This is not a phone measurement. Resource counts and geometry are unchanged; controller vectors/states are reused.

The initial controller exposed a seeded acceleration failure: the opposite landing completed, but the newly lifted old support was already outside reach on that same frame. The corrected controller validates takeoff as well as subsequent swing frames. The failing seeded case is retained in the regression suite. A separate partial-stop restart case now starts from its current pose rather than an old swing origin.

## Pending and limitations

Hosted regression and browser capture results are pending. Local Playwright is available but its Chromium executable is absent; no local browser pass is claimed. The previously written capture callback contained `.chickench`, corrected to `.catch` before hosted execution. Tests now capture continuous turns and reversal as well as idle/walk/run/stop/restart and actual farm context.

Running currently retains ground support rather than intentionally introducing a flight phase. Body lowering, cadence, turning and visual/gameplay feel require owner review of real captures and a phone build. CPU and memory behavior on the owner phone remain unknown. Local seeded sessions do not prove every possible gameplay input or full release readiness.

This is ChatGPT/Codex implementation and adversarial self-review, not an independent external-agent audit. Main remains unchanged. No visual acceptance or merge is claimed.
