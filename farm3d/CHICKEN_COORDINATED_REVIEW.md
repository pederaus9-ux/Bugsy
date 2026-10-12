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
- Node CPU comparison: median 1.680 microseconds per chicken update versus 1.042 on main, 1.612x. Seven alternating samples after warm-up, six rigs, repeated turns. This is not a phone measurement. Resource counts and geometry are unchanged; controller vectors/states are reused.

The initial controller exposed a seeded acceleration failure: the opposite landing completed, but the newly lifted old support was already outside reach on that same frame. The corrected controller validates takeoff as well as subsequent swing frames. The failing seeded case is retained in the regression suite. A separate partial-stop restart case now starts from its current pose rather than an old swing origin.

The real frame loop caps time steps at 0.1 seconds. An adversarial 10 Hz running probe found a 19.846 mm target error on the first hosted candidate. Planning now interpolates that already-completed caller travel internally with a common 120 Hz planning clock; it never rewinds or modifies the public root. The added 0.05/0.1-second tests pass, including both heights and turning. All 40 selected checks and the 45 jittered sessions were rerun after this correction.

The actual skinned-body probe (`tests/chicken-body-contact-proof.mjs`) checks the two thigh origins inside the rendered torso, using upward and downward ray intersections on its actual posed triangles. All 2,520 samples passed, with minimum 4.983 mm interior clearance. This supplements fixed-attachment and geometry protection tests; it is not visual acceptance.

The frame review also exposed timing normalization defects in candidate9a0b138: identical one-second travel differed by40mm (walk) and80mm (run) between30 and120Hz. The support deadline was measured at the current frame but added to the previous elapsed clock; it also subtracted unsigned distance even when a planted foot lay ahead of the hip. The corrected solver uses signed relative hip velocity to calculate circle-exit time, includes the current time step, and uses the same120Hz internal planning clock across30/60/120Hz rendering. A new physical-foot comparison test passes within the original2mm contact tolerance, with numerical differences near1e-12mm in straight travel. Step advance is derived from the unchanged upper-plus-lower leg length, with landing lead at half that distance. The first caller frame after restart retains its continuity guard.

All40 selected checks,96turns,45seeded sessions and the four original six-species assertions pass after normalization. The maximum common body drop in deliberately abrupt roaming is0.123641local units; hips stay attached and all feet remain reachable. This can create a brief crouch on sharp inputs and needs owner gameplay judgement. Ordinary running still has ground support rather than a deliberately introduced flight phase.

The parent gallery9a0b138 contained48real poses and no browser errors; maximum contact error8.951e-16m. Its six regularly spaced run frames aliased the stride. Capture times now use nonuniform intervals to expose the movement, and fresh exact-head images are required. No parent-head image or CI success clears this changed motion head.

## Pending and limitations

Hosted regression and browser capture results are pending. Local Playwright is available but its Chromium executable is absent; no local browser pass is claimed. The previously written capture callback contained `.chickench`, corrected to `.catch` before hosted execution. Tests now capture continuous turns and reversal as well as idle/walk/run/stop/restart and actual farm context.

Running currently retains ground support rather than intentionally introducing a flight phase. Body lowering, cadence, turning and visual/gameplay feel require owner review of real captures and a phone build. CPU and memory behavior on the owner phone remain unknown. Local seeded sessions do not prove every possible gameplay input or full release readiness.

This is ChatGPT/Codex implementation and adversarial self-review, not an independent external-agent audit. Main remains unchanged. No visual acceptance or merge is claimed.
