# Exact turn-domain diagnosis complete; no fix

Source `3bd7a07d443589122a5092c493d4e2d3f2a160e7`. One instrumented browser trace stopped at the same frame166 failure. All41 rejection signatures (frame,station,reason,visited nodes,domain count) and827completed queries match the retained original exactly. No second trace, benchmark rerun, bound/tolerance change or runtime fix occurred. Original performance RED remains.

## Captured cause

Drink cow (`cow-3`), rear leg index3, recovery event from evaluated rt=0.7999999999999999 to stored rt=0.9333333333333332. Root[5.350000000000004,0.08,-35.4],yaw0.35880847197778587; intended step[-0.02666666666666667,0,0] over1/30s. The provider calls its zero-time recovery union with recoveryFraction[0,1].

The unchanged `cow-leg-enclosure.mjs::validation` rejects tz upper0.5240209425525728 against its existing0.5m domain. Captured domains:

- tx=[-0.16231107039199685,0.12974380060460608]
- tz=[0.11940176569778972,0.5240209425525728]
- lift=[0.05345598267084745,0.05345598267084767]

This is **overly broad enclosure arithmetic, not unsupported native leg motion or incorrect recorded recovery phase**. The source computes recovery weight `w(t)=1-t*t*(3-2*t)`. On[0,1], w'(t)=-6t(1-t)<=0, so this captured t interval has endpoint weight range[0.01274074074074072,0.10400000000000009]. The provider evaluates repeated t occurrences as independent intervals and instead permits[-0.2195555555555555,0.2746666666666666], including impossible negative residual weights. With the captured constant residual coefficients x=-0.5909383630776559,z=-0.6704854402662643 and nominalz≈0.376812139223, that dependency loss produces the oversized target domain. Its reach enclosure[0.1926521382965301,0.5485825660786922] crosses0.34, so the independently multiplied clipping-factor interval includes1 and fails to remove the infeasible large target.

Arithmetic propagation of the monotone weight range alone would give preclip tx[-0.061457589760076266,-0.007528992477730122],tz[0.3070816534353067,0.3682696580581269]. These numbers are a causal diagnostic, **not an implemented or newly certified bound**. The production `updateCow3D` still applies its0.34m radial guard before `poseCowLeg`. Ten detached native evaluations from1e-9 through1 frame produce maxreach0.3400000000000001 (normal floating rounding),max|tz|0.3399289678996534,lift[0.05345598268240646,0.06363595023970711], well inside the unchanged helper domain. The failed old/evaluated-phase union is intentionally distinct from next-update samples; the derivative and native reach guard establish why the impossible0.524m bound is not a physical input requirement.

Actual native recovery-phase hooks show **zero history mismatches**. The previous frame's leg3 evaluation was rt0.8 with storedrt0.9333333333333332, exactly what the fixture supplied. All827completed queries preserve captured live state/transforms. Each of41detached predicted endpoints matches the actual next displayed skeleton/root matrices **exactly (maximum difference0)**. No RNG-producing clone constructor was added; the existing detached copy helper is reused. No new exhaustive RNG claim or universal native-transcendental proof is made.

Source pointers: `cow-motion-domains.mjs` recovery-weight/target and reach-clip construction,lines56-59; `cow-leg-enclosure.mjs::validation`,line62; production `cow3d.js`,recovery lines301-307 and hardreach guard before `poseCowLeg` around315-316. `served-instrumentation.json` contains every read-only served-text hook. The checked-in production/helper bytes remain unchanged.

## The41 rejections

All41 captured bases/displayed starts were checked against the unchanged62solid boxes with original-weight actual skinned triangle/box SAT. There are316native fractional poses plus41displayed starts. Fractions include0.25/0.5/0.75/1,nearzero,and the reference's first uncertain interval endpoints/midpoint. Every row and full intersection witness is retained in `capture.json.classifications`.

| Station | Rejections | Actual witnessed skin intersections | No sampled intersection; temporal unresolved |
| --- | ---: | ---: | ---: |
| Feed1 |7|0|7|
| Feed2 |7|0|7|
| Drink |10|0|10|
| Robot |12|3|9|
| Bed5 |5|0|5|
| Total |41|**3**|**38**|

The three genuine intersections are robot frames162,163,164 against solid34, the upper right metal rail: x[9.614999914169312,9.685000085830689],y[1.315000057220459,1.3849999904632568],z[-38.19999980926514,-34.39999961853027]. Frame162 has native interior and endpoint contacts (triangle3820 at fraction0.25; triangle3775 at endpoint). Frames163/164 already intersect at the displayed start; frame164 becomes clear by the sampled half-frame. These are actual native skin/rail intersections, not merely broad AABB overlap.

**Fixture classification matters:** these robot intersections occur during the benchmark's scripted reversal inside the narrow lane. Production `updateCowTask` assigns the robot's forward exit,turn,clear waypoints (`index.html` around2247), matching `cow-yard.js`'s authored robot path. It does not request this scripted mid-lane return. Valid station reservations do not make that maneuver a valid authored care route. These hits are a useful adversarial collision witness but do not demonstrate a new live robot-route bug. The previous timing result is a reversal stress result, not representative normal robot-exit performance.

The remaining38are conservative query rejections with no actual intersection at the inspected poses. They are **not** proven false positives throughout continuous motion; unsampled instants/recovery-event interiors remain unresolved. No clearance pass is inferred. The intermediate progress statement that no actual samples intersected was based on sparse console summaries and was corrected after the complete classification showed these three hits.

## Finite next action and stopping state

Recommended next scoped correction is in the **test-only motion-domain provider**: bound the monotone recovery residual while preserving the native radial-reach correlation/invariant, keeping the0.5m assertion,0.34m native reach,geometry and all accepted tolerances unchanged. First verify this exact captured state and its history, then existing adversarial controls and the retained41geometry cases. Do not enlarge the helper's accepted domain to conceal dependency inflation. No such correction was made here.

Before any later representative performance comparison, use the authored forward robot exit and retain this reverse-turn case separately as adversarial evidence. Do not erase its real collisions or previous performance RED. This is a test-trajectory distinction, not permission to rewrite gameplay or drop a safety assertion. Phone publication remains held; this turn contains no phone work.

Browser/server closed normally after the single successful diagnostic. All nine checked runtime/reference helper files match sourceHEAD. Original21controls/11containment cases were not rerun unchanged. Only new diagnostic files/evidence and relays changed. A20 gameplay physical safety stillRED,care/wake1/30,broadmatrixpaused. No upload,Site update,merge,deployment or new architecture.
