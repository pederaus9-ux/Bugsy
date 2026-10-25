# Actual cow motion: event-aware contract and feasibility boundary

Source: `3be40d3eb13be5d72b274526f941a4a63fa09a8c`, unchanged A20 runtime. This is a concrete design/proof boundary, **not an implemented continuous-collision certificate**. Existing rig, geometry, margins, clocks, seeds and assertions are unchanged.

## Why progressively smaller pose samples are insufficient

The production update is a state machine, not a continuous flow whose next-step displacement necessarily tends to zero with dt. The following actual source events must be enclosed explicitly. The retained fractional-step probes are a mathematical diagnostic; they do not assert that the live controller displays 1e-9-second frames.

| Production transition | Source | Required treatment |
| --- | --- | --- |
| Released hoof recovery | `cow3d.js:301-307` evaluates residual using old `rt`, then advances stored `rt` before rendering that residual | Carry the evaluated pose as well as post-step state. Include the interval between evaluated and stored recovery phase; a bound proportional only to the next dt omits it. |
| Plant/release/reach/idle/swing decisions | `updateCow3D`, especially phase/duty, amount .01/.05, reach .34, turning-release and slip branches | Split known predicates or union both branches, including changed anchors, foot orientation and lift reset. Do not exempt an obstacle containing the initial root. |
| Quiet mode | `cow3d.js:280` and eye/tail assignments | Include both ordinary and sleeping/resting scale/rotation states at a mode switch. These assignments are not all damped. |
| Care overlay onset, mode/target change, reset | `animal-care-poses.js:13-28` | Include the displayed pre-reset pose and next base. First positive lie weight replaces each leg matrix at blend weight 1; small care weight alone does not bound that replacement. Feed/drink targets need world-to-local domains, not only weight ranges. |
| Raised slab edge | `animal-pen-cow-support.js:7-21` | Classify each **foot's** support region. If its world domain straddles the polygon, union slab and ground heights. Root-region membership cannot substitute for foot membership. |
| Attention/timer and phase events | `updateCow3D` look/ear/blink timers, phase modulo, hop, distance >1.5 reset | Split or union the actual reset branches. Phase wrap can be periodic in transforms but not blindly in branch predicates. External displacement >1.5 is outside an ordinary step certificate. |

Evidence: `actual-transition-probes.json` and `causal-controls.json`. A genuine turn produced a 0.001747499 m difference at dt=1e-9. Its displayed leg used rt=0.8 while state stored rt=0.9333333333. Restoring only the evaluated timer on a detached causal control reduced the witness difference to 2.151319e-9 m, below the unchanged 1e-8 comparison. This is **not** a proposed rig patch. Ordinary same-mode idle and an existing coherent lie ramp converge in the sampled controls; that is not a general smoothness proof.

The first-positive lie fixture has a 0.301084509 m leg difference even when both sides use the same sleeping act. This is a rig-level branch witness, not proof that the live controller starts care in this exact moving state. At the actual default slab edge, root pairs 2e-7 m apart sample support heights 0.08 and 0 m and differ by 0.101411588 m at a skin vertex. Those support pairs are not credited as a valid walk through surrounding obstacles.

## Finite source-derived domains, without invented derivative limits

These domains bound scalar inputs to the actual formulas. They are useful for an interval implementation; **they are not yet floating-point-certified bone-matrix or skin enclosures**. Published decimal values below are explanatory approximations, not new collision tolerances.

For an ordinary supported leg, use the actual per-query scale s, support-height range and validated initial state. `updateCow3D` hard-clamps horizontal target radius to R=0.34. Nominal lift is in [0,0.13]; the recovery arch is at most 0.08 and combines with `max`, not addition. On flat soil/slab with root and support both in [0,0.08], the support correction is bounded by B=0.08/s. Therefore lift L is in [-B,0.13+B]. This restricted site domain does not cover arbitrary sloped-ground poses or arbitrary external transforms.

In `poseCowLeg` (`cow3d.js:196`), D=upper+lower-0.001=0.729 and:

```
rootY = min(0.77, 0.055 + L + sqrt(max(0.01, D*D - tx*tx - tz*tz)))
y     = rootY - 0.055 - L
```

For the measured h=1.7 rig, s=1.7/1.8, B=0.08470588235. Thus rootY is at least 0.6151514662 and y is at least min(0.715-(0.13+B), sqrt(D²-R²)) = 0.5002941176. Solver distance is in [0.5002941176,0.729]; the hinge denominator sqrt(1-Tx²) is at least 0.8270802140. This gives a nonzero denominator on this restricted domain. It does not make `acos` globally Lipschitz near its clamped endpoints. Enclose monotone `acos` values directly; do not invent an angular-speed bound from the denominator alone.

For lie weight w in [0,1], the authored solver has y=0.715-0.58w, tz=+/-0.12w. Its distance is at least hypot(0.135,0.12)=0.1806239187. The minimum occurs at w=1 (the unconstrained quadratic minimum is beyond 1). Both lie IK denominators therefore stay nonzero. The w=0 branch event still needs its separate union with the incoming gait pose.

Other finite domains follow directly from the validated state: body breathing scale [0.993,1.007], body yaw [-0.3,0.3], roll [-0.012,0.012], lie body height [0.45,1.03]; feed/drink neck target pitch [-1.4,0.1] and target height `localTargetY + [0,hypot(0.07,0.56)]`. The latter requires a bounded actual target/root transform. Heading changes are capped at 4*dt in the ordinary rig, but the directed care alignment in `index.html` has its own update and must be included separately. A whole-cow envelope cannot be inferred from the ordinary heading cap alone.

For `farmGroundY`, the base sine field has absolute value <=1.7, derivative bounds 0.209 in x and 0.159 in z. The radial fade adds at most 0.085 to either derivative. Each width-4 clearing smoothstep has derivative <=0.375; its two z transition bands are disjoint. Therefore conservative component bounds for continuous ground are 0.9315 and 0.8815, with Euclidean Lipschitz bound 1.282472027. Corners of the piecewise fade retain the same Lipschitz bound; differentiability there is unnecessary. This bound **excludes the discontinuous slab overlay**. A foot-domain crossing that overlay must include both heights regardless of interval size.

## Implementable certificate boundary

The narrow next implementation is a test-only **actual-formula domain evaluator**, beginning with the retained recovery and flat/slab cases above, not more sampling wrappers. Its input is a known post-care-reset shadow plus the displayed pose, proposed root/heading segment, elapsed interval, care mode/weight/target ranges and bounded support regions. Unsupported or nonfinite state must return UNKNOWN, never CLEAR.

1. Partition on known mode/support events. Evaluate actual gait branch predicates over interval state; where a predicate cannot be decided, evaluate and union both finite branches. Include previous displayed recovery phase as well as stored next phase. Preserve all anchors and foot orientation choices.
2. Enclose the actual IK, support and care transforms with outward arithmetic. Use range bounds for sin/cos, monotone sqrt/acos, and a wrapping-aware atan2 treatment. JavaScript transcendental calls plus one guessed ULP do **not** by themselves prove outward transcendental bounds. The existing affine kernel only establishes its basic arithmetic; this missing numerical layer must be verified or conservatively enclosed before integration.
3. At a discrete pose event, cover both sides and the entire admissible joint-domain bridge at the event root/heading; merely unioning endpoint vertex boxes is insufficient for a possible rotating limb. This is an overapproximation for safety, not an alteration of the displayed animation. There is no uniquely defined continuous renderer interpolation in the current update, so a narrower chosen interpolation must not be silently called the game's actual motion.
4. Feed whole-interval matrices into the existing original-weight affine skin kernel. Precompute bone-influence/triangle groups or a BVH; bound only groups near candidate obstacles, refining to vertices/triangles as required. Preserve actual body-inverse/hip and bind-matrix arithmetic rather than assuming exact cancellation or normalized skin weights.
5. Combine that envelope with the full padded-root segment, support and unchanged 0.85 m inter-cow separation. Use the **same** acceptance result for direct motion, sidesteps, route rejoining and replanning. Resource exhaustion or unresolved overlap is UNKNOWN/BLOCKED, never clearance. This alone is not a gameplay pass: valid care routes must still execute and complete within original deadlines.

An analytic interval enclosure gives inclusion directly; adaptive subdivision only tightens it. No sample-distance error estimate is required across jumps. Conversely, subdivision of endpoint samples without this enclosure has no justified error bound here. Continuous safety, route liveness, mutation freedom and performance are separate acceptance gates.

Acceptance before integration: reject retained A19/A20 post entries and the breathing midpoint; enclose both sides of release, care onset and slab events; detect interior limb/turn contacts and an edge-only triangle crossing; allow clear narrow passages and actual station approaches; preserve exact preview/base/RNG state; reject unsupported domains; measure actual browser cost. Original 30/60/120 Hz, separation, support, speed, contact, 500-second and 40-second checks remain unchanged. None of these integration gates is newly claimed passed by this document.

## Cost and the smaller practical option

The exact shadow query measured 0.8158 ms median, 1.5360 ms p95, over 100 warm queries after 20 warmups in Node. Five cows times eight queries is about 32.632 ms at the measured median **before collision work**. Frame budgets are 33.33/16.67/8.33 ms at 30/60/120 Hz. Together with the prior approximately 0.47-second all-vertex interval reference, this rules out adopting the current dense-clone/reference path as a general per-frame implementation. It is not proof that optimized event-aware bounds are infeasible, nor a browser/device benchmark.

A smaller controller option is a certified restricted approach profile: settle outside the fixture, then travel straight with low gait amplitude; use event-aware enclosures for this limited family and stopped turns rather than for arbitrary simultaneous turns and care transitions. The measured profile below supports investigating it without moving fixtures or changing the rig. It remains experimental: mixed-herd queues, full body, mouth contact, entry/exit transitions and continuous envelopes are unproved. It must not be integrated simply because displayed legs pass.

A pure evaluate/commit refactor could make the pose-time contract more explicit, but changing recovery timing or care blending changes accepted animation semantics. That is outside this turn's preserve-animation instruction; request a precise named-file/behavior decision if that alternative is selected. There is no evidence yet requiring terrain, fixture or anatomy redesign.

## Primary research

[Redon, Kim, Lin and Manocha's articulated CCD project](https://gamma.cs.unc.edu/ARTICULATE/) describes interval-based bounds for a selected in-between articulated motion. That supports explicit motion/domain definition before collision certification; it does not prove our procedural update matches their interpolation or implementation. The linked paper download was inaccessible in this environment; no unseen full-paper claims are made. The prior checkpoint's Three, affine-skinning and triangle-box references remain applicable within their stated limits.
