# Restricted-provider work: cached traversal and full-care feasibility, partial

Baseline `42dc5c59c3557cf380cd9a1b5983a2f78fa9215c`, unchanged A20 gameplay. **The requested event-aware continuous-motion provider is not implemented or proved by this checkpoint.** Runtime integration remains held. The completed work below establishes full-body displayed-pose feasibility and a useful traversal cost, rather than claiming the prior lower-leg observations solved motion safety.

No protected runtime, existing accepted test, rig, terrain, save or economy edits. No uploads, Site update, merge or deployment. A20 care/wake stays **1/30**, physical safety **RED**, broad qualification paused. No approval or executor wait is pending.

## Complete destination and approach/care results

`care-solid-endpoints.json` checks every actual cow triangle against every destination primitive at the authored dock, standing and full care weight. Both feed stations and the drink station are solid-clear in these seed-0 endpoint fixtures. The only positive intersections are grain primitive3 and water-fill primitive5. These are separately identified contact media in `cow-yard.js:85-88`, not silently omitted metal walls or bases. The care target matches `index.html:1452`; mouth distances are 0.0000334 m for feed and0.0041584 m for drink. The endpoint diagnostic retains all primitives and witnesses.

`full-solid-profile-final.json` completes all nine combinations (two feed stations and drink,30/60/120Hz) through approach, hold with care ramp, and care release. Every displayed frame checks the full skinned triangle set through conservative spatial traversal against solid fixture walls/bases. This is the earlier experimental0.8m/s approach, stop0.4m before dock,1s settle,0.01m/s final straight arrival. It is **test-only**, not a change to game movement.

| Site | Hz | Approach frames | Total frames | Full-weight contact frames | Max mouth error (m) |
| --- | --- | --- | --- | --- | --- |
| Feed1/Feed2, each |30|1264|1533|208|0.015740240|
| Drink |30|1266|1475|148|0.005673952|
| Feed1/Feed2, each |60|2527|3063|415|0.015742577|
| Drink |60|2531|2947|295|0.005673952|
| Feed1/Feed2, each |120|5055|6123|828|0.015743300|
| Drink |120|5063|5891|588|0.005673952|

All nine complete, no displayed solid hit, maximum commanded speed0.8m/s and unchanged full-weight mouth limit0.08m. Feed hold is8s, drink6s, care ramp1.1s and stand0.9s. The50s approach and60s total diagnostic work caps do not replace or extend the original500s care deadline. This is a synthetic aligned seed-0 flat-slab journey, without ownership, queues, task reservations, player edits, other animals or live route control. No whole-herd, post-replay, support-edge traversal, between-frame or browser/device pass is claimed. Existing historical REDs and seeds1/4242 remain untouched.

The original `full-solid-profile.json` used the first optimized cache. Review then strengthened its arithmetic error term to use absolute terms **before** cancellation. That dependency change justified one final nine-case run with identical assertions, inputs and caps. All frame/contact results agree; both raw runs and the pre-review helper source are preserved. The later optional all-ancestor verifier strengthens diagnostics only; it does not change the profile query path.

## Cached traversal, containment and measured cost

`tests/helpers/cow-cached-solid-query.mjs` builds a4095-node spatial tree once for the shared cow mesh. Each node stores bind-position and original weight domains per influencing bone. A query uses current actual bone matrices, original inverse binds, bind inverse and world transform. It descends only where a conservative node box overlaps a solid, then performs actual skinned triangle/box SAT at leaves. Geometry, rig/state and RNG remain untouched. The API labels every result `DISPLAYED_POSE_ONLY` and rejects temporal/support-domain options rather than treating them as an ignored request for continuous clearance.

The first cache lost correlation between variable weights and shared world translation, visiting2229 nodes and reading10893 vertices for a clear standing feed pose. Its15 query measurements ranged11.3-23.1ms; raw `cache-initial-cost.json` and `cached-traversal-initial.mjs` retain that performance RED. The researched correction is the affine identity:

```
sum_j(w_j * M_j * p) = W * M_ref * p + sum_j(w_j * (M_j - M_ref) * p)
W = sum_j(w_j), using ORIGINAL weights, never normalized
```

This removes artificial world-translation spread without assuming W=1. Outward arithmetic and a conservative dot/sum-order rounding term use magnitudes before cancellation. The same standing query visits23 nodes and reads no vertices. `cache-controls-complete.json` records nine control groups: all31728 vertices contained through **every ancestor and leaf** for initial/feed/recovery/support/lie/map-edge poses; exact state/geometry/RNG nonmutation; food contact and solid-clear controls; actual long-body/post hit with a clear root and translated clear control; corrupt-bound, nonfinite-obstacle and stale-cache rejection. The post control is synthetic, not a replay of A19/A20.

`temporal-rejection-controls.json` rejects five unsupported motion/domain requests. `nonfinite-weight-red.json` is a deliberately named diagnostic attempt whose suspected NaN hole was **disproved**: the existing second-pass weight-sum bound already rejected it. Its recorded status is `UNEXPECTED_REJECT`; it is not a runtime RED, and no unnecessary patch followed.

Latest fixed-work cost: cache build145.3003ms once; five displayed-pose queries per sample,10 warmup samples plus30 measured samples, **median1.1915ms,p951.5402ms,max2.1518ms** in Node24.19.0/V813.6.233.17-node.51. Earlier optimized measurements remain in the same directory; no fastest-only result was substituted. The five diagnostic cows share a station vicinity to exercise the query; this is not simultaneous gameplay traffic.

Actual source budget: `index.html:4650-4676` aims at50-60FPS in auto quality, reduces quality above23ms median frames and increases below15.5ms; battery mode skips draws less than31ms apart (`4614`). The30/60/120Hz test matrix specifies simulation qualification rates, not a separate120FPS rendering target. The measured query cost excludes shadow evaluation, temporal enclosure, animation, rendering and other gameplay. It demonstrates an improvement, **not spare full-frame budget or physical-device clearance**.

## Exact unfinished step and integration hold

The spatial query accepts actual current matrices only. It cannot turn temporal samples into a conservative motion bound. The finite next implementation is an actual-source limb enclosure: derive interval `tx,tz,lift` and evaluated/stored `rt` for the retained recovery step; map them through `cow3d.js::poseCowLeg` to hip/knee/hoof matrix intervals; explicitly union release/plant branches, slab/soil support heights and first-positive lie leg replacement. Include the ordinary breathing/body and care transforms before handing complete intervals to the cached skin traversal. Validate containment against the retained jumps and interior witnesses, then demonstrate valid traversal. A caller-supplied velocity bound or endpoint union would leave the original missing premise unresolved.

The previous contract's nonzero IK denominator ranges remain useful. They do not alone establish complete matrix ranges or outward transcendental behavior. [ECMAScript's Math specification](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.sin) treats these functions as implementation-approximated; a guessed single-ULP expansion is not a cross-browser proof. A requested V8 source page was inaccessible; no claim of auditing the executing engine's complete numerical implementation is made.

There is no measured need yet for fixture, terrain or anatomy redesign. The complete displayed approach/care result supports that distinction. The temporal mapping is still technical work, not a newly established owner-approval blocker. This checkpoint does **not** complete the requested end-to-end continuous correction; it saves the verified traversal/feasibility pieces without deploying an uncertified predicate or pretending stopped cows are successful.

All probes finished. Runtime/accepted-test invariance, source/evidence digests and final result integrity are recorded in `verification.json`. Both relays updated locally.
