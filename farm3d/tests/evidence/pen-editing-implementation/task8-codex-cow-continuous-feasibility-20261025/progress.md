# Cow continuous-motion feasibility checkpoint

Baseline `3be40d3eb13be5d72b274526f941a4a63fa09a8c`; branch `codex/safe-test-preview-20261023`. Test-only diagnostics and documentation. Runtime remains A20; no accepted tests, rig, terrain, scene, saves or constants changed. No uploads, Site update, merge or deployment. Broad matrix remains paused, current-runtime care/wake credit **1/30**, physical safety **RED**.

## Established, not assumed

- `actual-transition-probes.json`: five source-directed fixture families, six positive dt values each, all 31,728 actual skin vertices, zero-step controls and live-state/RNG guards. Same-mode idle and existing lie ramp converge in these samples. Recovery, quiet-mode change and first-positive lie exhibit finite pose jumps; the measured slab-edge support pairs also exhibit a finite jump.
- `causal-controls.json`: detached recovery-phase control isolates the 1.747499 mm witness to evaluated rt=0.8 versus stored rt=0.9333333333; correcting only that shadow phase leaves 2.151319e-9 m. Same-sleeping-mode care comparison isolates 0.301084509 m to first-positive lie leg replacement. No production correction is made; the lie fixture is not claimed to occur at that exact live arrival.
- Measured shadow cost: 120 queries, 100 warm, median 0.8158 ms, p95 1.5360 ms. Full sampling plus collision work is not a supported per-frame solution. Node timing is not mobile clearance.
- `motion-contract.md` identifies the actual events, finite ordinary/support/lie IK domains and terrain gradient bound, numerical implementation prerequisites, required controls and two bounded implementation options. It rejects an O(dt)-only error assumption without declaring continuous safety fundamentally impossible.

## Station approach experiment and retained scaffold RED

The earlier always-forward lower-leg intersections do not establish unusable geometry. A bounded new seed-0 diagnostic uses the unchanged rig: walk at 0.8 m/s until 0.4 m before the dock, settle one second, then creep straight at 0.01 m/s. It tests every knee/hoof-influenced triangle against all solid primitives of the destination fixture on each displayed frame. Those experimental profile parameters are **not adopted runtime constants**.

`station-profile.json` retains the first run. Both feed stations completed at 30/60/120 Hz in 42.1333-42.1667 simulated seconds without a displayed leg/fixture hit. All three drink cases stopped at the diagnostic 50-second work cap with no hit. The raw output is retained as `PROFILE_FEASIBILITY_RED`; it is not turned green retrospectively. Its old counter reported the first unexecuted loop frame (50+1/hz seconds); exactly 50*hz frames were processed.

Source-directed arithmetic diagnosis found a test-scaffold termination fault: x=5.75, dock=6.15 gives d=0.40000000000000036; remaining segment=3.3306690738754696e-16. Adding it leaves x unchanged, so `d<=0.4` never becomes true. The correction records that the exact remaining approach segment was consumed, without adding an epsilon, displacement, frames or deadline. It also reports processed rather than post-loop frames. Only drink cases were rerun; the original six feed results remain evidence from the earlier scaffold revision, not exact-corrected-harness credit.

`station-profile-drink-corrected.json`: drink completed at 30/60/120 Hz in 42.2000/42.1833/42.1917 seconds, zero displayed lower-leg hits, maximum commanded speed 0.8 m/s, creep amplitude at most 1/6. Wall times 2.705/5.391/10.349 seconds. The script refuses to overwrite either evidence file. The existing 500-second care deadline was not changed, but these single-rig approaches do **not** qualify actual care or whole-herd completion under it.

Scope limitations: aligned seed-0 fixture, flat support and no care overlay, other cows, reservation lifecycle, full-body observer, live route controller, terrain crossing or continuous collision certificate. This is positive evidence for a settle/straight-arrival option, not a gameplay fix. No ordinary or care behavior has been frozen to obtain a pass.

## Remaining blocker and next bounded step

The missing piece is an actual-formula event-aware transform enclosure, including support/care events and justified transcendental bounds, then an efficient collision traversal. The existing affine skin helper alone does not provide it. Dense cloned pose sampling has neither the required guarantee nor measured practical cost. No safe integrated movement predicate exists yet.

Recommended next step: implement and adversarially verify the **restricted flat/slab recovery/settled-approach interval provider** described in `motion-contract.md`, with explicit UNKNOWN for unsupported modes. Measure a cached influence/BVH path before adding it to runtime. It must cover retained jump/breathing/post cases and prove valid station traversal; do not launch the broad matrix first. A more invasive pure evaluator/commit animation refactor would need a precise scope decision; no such change is assumed here.

All probe processes finished. No execution or approval wait remains. The blocker is technical proof/performance, not an executor stall. Protected/source checks and evidence hashes are in `verification.json`. Both relays updated at the local checkpoint.
