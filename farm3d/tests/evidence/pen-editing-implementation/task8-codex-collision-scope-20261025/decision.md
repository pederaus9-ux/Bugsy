# Collision acceptance and finite proxy decision

Source: clean `dce142256b3e44a64f32b3be7dd6c8b29800ea8b`, unchanged A20 gameplay. This checkpoint changes only new diagnostic/evidence files and relays. No runtime integration, accepted-test edits, uploads, Site update, merge or deployment.

## Original requirements versus investigation additions

| Authoritative source | Required acceptance | What it does not require |
| --- | --- | --- |
| Approved pen spec33,103 | Correct containment and full-shape/continuous-segment clearance; accepted gait, speed, neighbour clearance and physical tolerances unchanged | A universal proof of the accuracy of every ECMAScript implementation |
| Spec104; plan77 | Body-clearance routes and actual standing/turning skin/contact qualification; centre-only routes insufficient | A particular interval arithmetic library, full per-frame vertex scan, or analytic reconstruction of every native transcendental |
| Spec105,129 | Distinct legal positions, support, traversable transitions; no queue-solving teleport | Permission to freeze movement and call it fixed |
| Spec147; plan28,211 | Keep deadlines, physical tolerances, seeds, trusted input checks and frozen failures; all46, five edit classes, seeds1/4242,30/60/120Hz, three nights,500s goals,40s wakes as amended | Permission to discard an inconvenient observed midpoint, release or care-transition collision |
| Plan212; existing B17 | Bounded work, resource/performance evidence; B17 catastrophe threshold <1ms per ordinary rig update | An independently promised120FPS mobile renderer, or free budget for collision work |

Exact spec103: "Check full shapes and continuous segments, not only centres or corners." Spec104: "Actual standing/turning skin and existing contact assertions remain part of validation/qualification; a centre-point route alone is insufficient." Existing `tests/cow-room.test.mjs:29-36` checks standing-skin turns at24 angles per bed, not every real-valued time/engine. That finite accepted test remains; the newly measured animated incursions still need additional targeted coverage.

**Correction to the preceding investigation:** I elevated universal native-transcendental certification into an integration prerequisite without finding it in the approved acceptance. That is not an additional owner release gate. Keep the earlier interval helper honestly labelled; do not relabel its conditional result as proved. Move forward with explicit supported-engine numerical assumptions, conservative geometry, source-derived motion bounds and strong negative/physical tests. The actual release blocker is the retained cow/post penetration and unsafe route execution, not lack of a theorem about all conforming JavaScript engines.

The endpoint-only animated envelope remains disproved. The1.747499mm recovery jump,101.4116mm support-edge displacement and301.0845mm lie-onset witness are **motion/state geometry**, not floating-point noise. A numerical epsilon cannot cover or excuse those changes. They require explicit state/event coverage. The breathing midpoint witness is0.960627micrometres and likewise needs its real breathing range; an accidentally large numerical guard is not the explanation.

## Numerical scale and selected predicate policy

The existing tests assert different properties. B10 planted drift/height is <1e-10m. Rest reset and new preview equivalence use1e-8m. Physical lie skin stays >=.075m on the.08m slab; belly contact is within.005m; feed/drink mouth error <=.08m. Cow separation is.85m (focused comparisons use the existing1e-9 allowance). None of those values changes. A collision bound expanded outward is not a relaxation of any of them; it can reject additional movement, so liveness/contact must still pass.

IEEE binary64 unit roundoff u=2^-53=1.1102230246251565e-16. The standard gamma_n=n*u/(1-n*u) example for256 basic operations at220m is6.252776074689059e-12m. Even an illustrative1000x amplification gives6.2527760746890595e-9m. That amplification is a scale illustration, **not a certified whole-rig condition number or operation count**. At the ordinary longest reach d=.729m, the actual law-of-cosines acos sensitivity is <=18.8515; existing positive-y/hinge and nonsingular body-scale bounds avoid the zero-length singularity. Near-zero algebraic half-angle cancellation in the reference is another reason not to replace the accepted native solver merely to satisfy the reference.

**Selected engineering policy for the next prototype:** use local obstacle-relative coordinates, expand collision proxies by at least **1e-6m (one micrometre)** outward, and add operation/magnitude-dependent gamma terms where a dot/product/sum is used. Treat uncertain/near-zero separation as blocked and refine the proxy; never subtract an epsilon from the solid, ignore an intersection, or change a physical assertion. The guard applies to noncontact obstacle decisions, not to moving feet upward, altering care targets, normalizing weights, or modifying the.42/.85m existing margins. It is a conservative engineering allowance on supported high-accuracy engines, not a universal ECMAScript guarantee. Inputs must be finite and within the actual map/rig scale; unsupported or ill-conditioned domains fail closed and are diagnosed.

The source research supports this distinction:

- [ECMAScript's Math contract](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.sin) leaves transcendental approximation to implementations; it does not supply a portable ULP maximum. [TC39 issue3347](https://github.com/tc39/ecma262/issues/3347) explicitly discusses the missing accuracy bound. This limits a universal claim, not ordinary supported-browser engineering.
- [V8's versioned numeric source](https://raw.githubusercontent.com/v8/v8/13.6.233/src/base/ieee754.cc) uses fdlibm algorithms with small approximation errors; [the alternative bundled sine implementation](https://raw.githubusercontent.com/v8/v8/13.6.233/third_party/glibc/src/sysdeps/ieee754/dbl-64/s_sin.c) documents approximately.55ULP under its stated assumptions. These support high-accuracy-engine expectations, not certification of Safari or all browser builds. Node/V8 local evidence remains distinct from hosted/physical device qualification.
- [PBRT's rounding-error analysis](https://www.pbr-book.org/4ed/Shapes/Managing_Rounding_Error) uses error terms based on operation count and absolute input magnitudes and warns that discarding nearby intersections with a blanket epsilon can miss geometry. Our proposed guard grows the collision region instead.
- [Box2D collision documentation](https://box2d.org/documentation/md_collision.html) uses simple convex shapes and broad-phase structures, and explicitly notes limitations of rotational time-of-impact approximations. This supports compound proxies, not copying its defaults or calling endpoint checks continuous.

The1e-6m allowance is60,000-70,000 times smaller than the measured feed gaps and29,000 times smaller than the measured drink gap below. It is1/5000 of the existing.005m belly-contact tolerance and1/80000 of the.08m mouth limit, but100 times *larger* than the unrelated1e-8 equivalence tolerance. We retain that equivalence assertion exactly; no numerical allowance is added to it. GPU Float32 bone/uniform rounding is separate from CPU binary64 collision and remains a rendered/device check; this document does not claim a GPU error certificate.

## Bounded proxy feasibility, actual result

`cow-proxy-scope-probe.mjs` ran seven fixed native seed0 endpoints in1.308s wall time: both feed docks and drink standing/full-care, plus robot standing. Every one of the10,576 triangles is assigned to exactly one anatomy group with all three deformed vertices inside its box. Spatial bins are fixed by bind-pose triangle centroids; no geometry is deleted or shrunk. Grain/water media are classified exactly as prior evidence; all solid destination walls/bases remain. No path, animation interval, herd or deadline pass is claimed.

| Representation | Feed/drink result | Robot standing |
| --- | --- | --- |
| Whole-cow box |2 false solid overlaps at each endpoint |clear |
|23 anatomy boxes |1-2 false overlaps; up to49.44mm overlap in the initial read-only probe |clear |
|92 boxes (2x2 subdivisions per anatomy group) |all six endpoints clear with the1micrometre outward guard |clear |
|338 boxes (4x4) |also clear; no demonstrated need for this complexity |clear |

All actual triangle/solid checks are clear. Minimum normalized separating-axis gap estimates are **71.109mm feed standing,63.959mm feed care,29.009mm drink,539.222mm robot standing**. These are conservative-direction separation estimates from the fixed native CPU geometry, not exact Euclidean distances or animated guarantees. Very small axes are skipped, which can only reduce the estimated gap. Raw full results are in `proxy-feasibility.json`; earlier coarse result is `initial-static-proxy.json`.

A single root-centred all-direction disk is a poor replacement: the measured standing radius1.09608m implies diameter2.19216m, wider than the robot's2.03m inner rail gap. Aligned standing width is only.81222m. Preserve orientation and body parts; do not inflate every animal into that universal disk or widen the robot. The92-box endpoint result demonstrates a feasible spatial refinement, **not yet a proxy containing every animated pose**.

## Phone budget and finite next implementation

The previous five-cow partial p95 **4.7009ms** uses28.2% of a60FPS16.67ms frame,14.1% of a30FPS33.33ms frame, before actual game/render work. It is measured on desktop Node, so it cannot clear a phone budget. The existing displayed-only BVH query costs1.5402ms p95 for five cows and visited only23 nodes on the recorded standing query; a flat scan of92 boxes could be worse, not automatically faster. This probe generated boxes by a full vertex scan for analysis; **that scan must not be shipped per frame**.

Recommended next finite slice, within existing pen-controller scope:

1. Build a test-only two-level compound proxy from cached bind-position/weight metadata. Use a cheap conservative travel envelope away from obstacles; refine only overlapping anatomy regions near posts/stations, retaining original weights and triangle coverage. Reuse the existing spatial traversal instead of adding another generic engine.
2. Bound the actual modes needed by the retained case: walk/turn/recovery, settle, feed/drink care and support transition. Use source reach/scale/range limits, explicit old/new event unions, and a root/rotation sweep with outward arithmetic. A turn needs an arc bound, not endpoint union; breathing needs its sinusoidal range; the recorded recovery/lie/support jumps need explicit mode coverage. Do not use the1micrometre arithmetic guard as a deformation bound.
3. One bounded acceptance set: reject both retained A19/A20 post entries and containing-obstacle exemptions; contain all actual skin in the proxy over adversarial phases/events at30/60/120Hz; execute the existing valid settle/care approaches without changing the.08m contact or500s deadline; include thin-post, mid-turn, blocked-yield and starvation controls. Preserve speeds,.85m separation, reservations and native state/RNG.
4. Measure complete five-cow predicate cost, allocation and visited-node counts in the local browser before integration. If a conservative proxy fails a valid corridor, refine that part locally or use the existing exact candidate-pose narrow phase; do not shrink it or broaden rig scope. Only then record the protected `index.html` amendment/preimage and connect the shared check to direct/side/rejoin/replan paths. Broad matrix stays paused until this physical gate passes.

No new rig/terrain/fixture approval is currently needed. The next step is this bounded physical proxy/route prototype, **not native transcendental certification or another full-profile sampling run**. If supported-engine observations contradict the numerical assumptions, retain the failure and investigate that specific operation. A deterministic rig rewrite remains an unnecessary unapproved alternative at present.

All commands completed. Current runtime still has the retained collision defect; A20 care/wake coverage remains1/30, physical safety RED and other Task7/8 release gates remain open. No executor or permission blocker, runtime edit or external write occurred.
