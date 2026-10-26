# Finite limb enclosure checkpoint; native certificate held

Baseline `0f3d8b7bd625e1c897ff2819ef0d172a4f448965`. Only new diagnostic helpers/tests/evidence and relays changed. No runtime integration, rig/terrain/geometry change, old-test edits, uploads, Site update, merge or deployment. The 31,751-frame profiles were not repeated. A20 gameplay remains unchanged; care/wake credit remains 1/30 and physical safety remains RED.

## Implemented finite mapping

`tests/helpers/cow-leg-enclosure.mjs` maps bounded limb parameters through ordinary IK and lie target projection to hip/knee/foot matrix intervals. It is explicitly **REAL_FORMULA_ENCLOSURE_NATIVE_UNCERTIFIED**, not a runtime collision certificate. Asking for `nativeCertificate:true` throws. This is a real-arithmetic enclosure implementation with native witness checks, not proof that every browser's floating-point execution lies inside it.

| Production branch | Implemented mapping and control |
| --- | --- |
| `cow3d.js:198-201`: reach-height floor/minimum and distance cap | Interval max/min, square roots and norms; ordinary positive-foot-below-hip domain. Reach-limited/support cases included. |
| `cow3d.js:204-212`: hinge, base quaternion, alpha/delta/bend | Nonzero denominator checks, algebraic half-angle IK, all four Three quaternion-extraction branches. Trace-zero transition included. |
| `cow3d.js:225-239`: planted/free foot | Explicit planted yaw quaternion versus identity; original hip/knee cancellation order retained as real matrix/quaternion operations. |
| `cow3d.js:300-307`: recovery | Required evaluated AND stored `rt`; polynomial residual and sine-squared arch enclosure, including rt=1. Possible radial clamp overapproximates each component toward zero; it does not increase actual reach. |
| `animal-pen-cow-support.js:17-23`: soil/slab and skip | Map actual pre-support local foot plus height domain [0,.08] through the second IK solve. Union original pose for the skip branch. Caller still must establish spatial support-cell membership. |
| `animal-care-poses.js:9,16-23`: first-positive lie | Union ordinary zero-weight pose with positive-weight replacement; include target inverse-body transform, decomposition, quaternion extraction, and recomposition. |

The `sqrt(... ) || 1` fallback is unreachable in the supported positive-y domain. Singular, reflected, projective, above-hip, out-of-range limb/support/lie and large trigonometric domains reject. These rejections are not accepted animal stopping behavior; the helper remains outside gameplay. Whole-time yaw/nominal gait/body/head/tail/care input domains are not produced by this helper.

## Analytical basis versus native assumption

Basic interval operations round outward to adjacent doubles. Square root uses the native answer only as a starting guess, then compares its square to the input using exact binary-integer arithmetic; failure to bracket within eight adjacent corrections rejects. Trigonometry on |x| <= 4 uses interval Taylor evaluation with explicit Lagrange remainder: degree 27 sine with |x|^29/29!, degree 26 cosine with |x|^28/28!. No native sine/cosine supplies an interval endpoint. The observed arch-helper RED came from a negative subnormal lower bound after outward addition of nonnegative squares. Intersecting that sum with its analytically proved nonnegative range fixes the helper; no epsilon or physical tolerance changed.

For the IK angles, let T be the normalized hip-to-foot direction, H its projected hinge axis, and E the production reference direction. Use cos(alpha)=E dot T and sin(alpha)=(E cross T) dot H, then signed half-angle identities. The law-of-cosines values give delta/bend half angles without opaque acos/atan2 calls. For quaternion extraction, the trace-positive branch has radicand >=1. Otherwise the selected largest diagonal m_i satisfies m_i >= trace/3, so 1+2*m_i-trace >=1 when trace<=0. Union every feasible branch; no assumed quaternion sign continuity.

**These are identities over real arithmetic, not a proof of the native implementation's rounding error.** The production solver evaluates acos/atan2/hypot and then sin/cos; the enclosure evaluates equivalent algebra. Production Matrix4 inversion and lie's `a+(b-a)*1` also have different floating evaluation order from the reference. No guessed one-ULP or 1e-8 blanket inflation has been added. The existing 1e-8 comparison limit remains unchanged and is never used as collision clearance.

The lie projection cannot be removed: a bounded fixture at body scaleY 1.007, yaw .24, roll .012 and lie weight .3 differs by **0.0025301446732888255** in a matrix coefficient after decompose/recompose. This is far above 1e-8. The actual branch is now represented; it was not a new runtime defect or an animation-change justification.

## Focused results and retained REDs

`controls-norm-final.json`: ten groups, including 339 strict native matrix containments and 62,238 original-weight limb-vertex containments on interior parameter/support/lie samples. No tolerance added to containment. Checks include all four quaternion branches, planted/free feet, root-height/distance branches, recovery interior samples, soil/slab adapter execution, first-positive and intermediate/full lie, exact live/state/geometry/RNG nonmutation, endpoint-only arch rejection and unsupported inputs.

`adversarial-norm-final.json`: six further groups. The exact retained turn fixture uses evaluated rt=0.7999999999999999 and stored rt=0.9333333333333332. Stored-only bounds fail; their union covers both phase evaluations. Zero-weight-only bounds miss all four first-positive lie legs. Wrong support and deliberately corrupted matrices fail. Native samples are witnesses, not exhaustive mathematical proof.

Three station endpoint checks cover 7,536 leg-influenced original-weight vertices each. Small nonzero tx/tz/lift domains have no vertex-bound overlap with the authored solid walls/bases at either feed dock or the drink dock. This is useful-domain evidence only: triangle connectivity, full motion, other body parts and route execution are NOT certified. The previous complete displayed approach/care profiles remain historical evidence, not converted into continuous passes.

Retained new-diagnostic failures:

- `controls-initial.json`: fixture mistakenly extended a documented [-4,4] trig domain beyond its boundary; corrected to test the boundary and explicitly reject the outside interval.
- `adversarial-initial.json`: fixture used literal .8 instead of the retained binary phase .7999999999999999. Corrected from immutable causal evidence, with an exact equality assertion; no tolerance introduced.
- `controls-negative-final.json`: genuine interval-helper negative-subnormal squared-norm rejection. Source stack retained; corrected by the proved nonnegative intersection.

Earlier intermediate successful runs are retained under their own filenames. Added guard/control or helper changes motivated the short reruns; no old profile or broad matrix was restarted.

## Cost and exact integration blocker

The final adversarial artifact records all 20 fixed-work samples (5 warmup, 15 measured) for **20 limb interval solves plus five existing displayed-pose spatial queries**. Its median/p95 are reported in the relay. This is a measured component sum, not an end-to-end continuous-query cost. It excludes temporal BVH input propagation, other animated bones, detached preview, traffic, rendering and device/browser costs. No claim that valid gameplay approaches or a full five-cow temporal budget are established.

The precise unfinished bridge is between the real-equation interval and native execution of `cow3d.js:204-212,223-237` and `animal-care-poses.js:9,19-23`: bound the native elementary-function errors and different matrix/lerp operation order across the supported domain. Sampling more frames cannot prove that bridge. [ECMAScript Math](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.sin) specifies implementation-approximated transcendental results. [V8's versioned source](https://raw.githubusercontent.com/v8/v8/13.6.233/src/base/ieee754.cc) exposes fdlibm algorithms and local polynomial bounds; [its header](https://raw.githubusercontent.com/v8/v8/13.6.233/src/base/ieee754.h) exposes alternative trig implementations. The [bundled glibc sine source](https://raw.githubusercontent.com/v8/v8/13.6.233/third_party/glibc/src/sysdeps/ieee754/dbl-64/s_sin.c) documents approximately .55 ULP under round-to-nearest assumptions. None of those alone proves the complete executing browser pipeline or its atan2/acos/hypot/composition error. Node24.19.0/V813.6.233.17-node.51 does not expose the inspected trig-build flag in `process.config.variables`.

There is **no demonstrated geometry incompatibility or mathematical impossibility**. No owner approval or tool operation is pending. Runtime integration is intentionally held because the numerical premise is unproved. Two concrete next routes are:

1. Keep production unchanged: establish an engine-specific error contract for the listed native operations and propagate it through this finite limb mapping, including matrix inversion and lie recomposition. This is targeted numerical analysis, not more sampled profiles. It needs no runtime-file approval, but cannot yet claim cross-browser coverage.
2. If portable by-construction bounds are required instead, propose a narrowly reviewed deterministic limb evaluator shared by rendering and bounds. That would change protected `cow3d.js::poseCowLeg` arithmetic and possibly lie's target construction in `animal-care-poses.js`; it requires a precise owner decision and the original motion/contact regression gates. It is not implemented or authorized by this checkpoint, and is not a broad animation rewrite.

After either numerical bridge, the remaining temporal parameter producer and cached interval traversal must still demonstrate the retained post rejection and successful valid care transitions before any controller integration. This checkpoint does not label a stopped cow safe or restore full-matrix credit.
