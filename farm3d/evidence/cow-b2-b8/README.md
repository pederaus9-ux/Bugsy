# B2–B8 runtime anatomy candidate

Base: owner-merged B0/B1 PR53, `18763e21889177dadd72f4469c75716d32a3f677`.
The first runtime candidate adopted its rendered B1 reference. The owner rated
that candidate's side view86/100, below the roughly90/100 B8 visual gate, and
requested further static anatomy refinement inside PR55. This revision changes
the geometry beyond the reference while preserving its exact public/motion code
and gait constants. B0 and B1 evidence remains immutable.

Closed section meshes shape the torso, skull/neck, upper/lower limbs, two claws
per hoof, ears, udder/four teats and tail. Selective transition weights blend
attachments; hoof soles remain rigid. The public renderer APIs, 24-bone control
hierarchy and motion/gait algorithms are preserved. Existing Beast decisions,
speeds, collision, routes, species values, saves and economy remain unchanged.
One shared geometry/material and one pickable skinned visual remain synchronous;
no textures or loaders are added. Cow imports move to v3 and cache sa3d-v41.

The refinement gives the torso separate dorsal/ventral contours: deeper ribs,
a rising flank, distinct shoulder/chest and pelvic hooks, and a level loin.
Claws have rounded toes, inset heels and tapered coronary bands; cannons and
hocks/fetlocks have cleaner taper. Upper limb caps penetrate the body. The
udder's upper attachment overlaps the actual belly/rear flank, with four
attached teats and a softer color transition. A lower forelock tessellation
and redistributed ring samples fund the detail within the frozen budget.

The original technically green but visually unapproved candidate is preserved
at `ac8a73b3373158c27ead46398e7811d80fdd5b52`, including all images and
measurements. [Original86/100 side](https://github.com/pederaus9-ux/Bugsy/blob/ac8a73b3373158c27ead46398e7811d80fdd5b52/farm3d/evidence/cow-b2-b8/cow-anatomy-1280-idle-side.png)
can be compared against the current side capture below, with identical camera,
lighting, pose, viewport and drawing buffer. Its ten green hosted jobs do not
validate this newer source. No owner score or B8 approval is claimed for it.

## Local engineering evidence

The original rebased candidate passed56core units and its ten hosted jobs.
The refinement passes57core units, including an additional real surface-ray
attachment test and an exact public/motion-source guard. Fresh existing browser
game/normal-guest/save/shed/cow integration checks passed on the revision.
Cow picking, measured movement after collision, blocking without false strides,
standalone preview controls and optional painted comparison all passed at
740×360,844×390 and1280×720. Existing tests, tolerances and job limits are intact.

The new stationary renderer produced16views: idle/eating × front/side/rear/
three-quarter at844×390 and1280×720. All16images were inspected. These images
use exact full drawing buffers and pixel ratio1. Thirty additional rig creation/
double-disposal cycles per view caused no geometry/texture growth. The cow costs
10,576triangles versus B0's10,592, with one cow draw and24bones. The test floor
adds a second draw. Shadowed cow preview costs21,152triangles/two draws, below
the frozen cow's21,184. Hoof soles stay at their original localY=-.055 plane.
Local update timings are CPU-only software-renderer observations, not S26 FPS.

`cow-anatomy-static.json` scans every actual skinned vertex at height1.7:

| Axis | Minimum | Maximum |
| --- | ---: | ---: |
| X | -.40611112 | .40611112 |
| Y | .00010323 | 1.60083338 |
| Z | -1.09272217 | .72256106 |

These are game coordinates, not calibrated physical meters or conservative
culling bounds. `cow-anatomy-rendered.json` contains all16pose/buffer/resource
records; `cow3d-results.json` contains the unchanged live integration checks.
Unit checks cover manifold/winding/nondegenerate faces, normalized finite weights,
bilateral body/udder, actual neutral envelope, eyes overlapping skull surface,
head/neck/body picking and continuous limb rays, rigid cloven sole surfaces,
independent skeletons, finite head/graze/rest transitions and idempotent disposal.
Actual ray intersections also prove the udder attachment penetrates the belly
at four longitudinal stations, each teat overlaps an udder quarter and the
tail root lies inside the rump. The whole creation/update/disposal source suffix
and gait constants compare exactly with the immutable B1 reference text.
[Actual attachment comparison](attachment-comparison.json) shows the original
udder gap reached .0613 game coordinates at height1.8; the refined upper
attachment overlaps the belly at every tested station. This new test would
reject the original detached rear attachment rather than just mirror the code.

## Rendered review

| View | 844×390 idle / eating | 1280×720 idle / eating |
| --- | --- | --- |
| Front | [idle](cow-anatomy-844-idle-front.png) / [eating](cow-anatomy-844-eating-front.png) | [idle](cow-anatomy-1280-idle-front.png) / [eating](cow-anatomy-1280-eating-front.png) |
| Side | [idle](cow-anatomy-844-idle-side.png) / [eating](cow-anatomy-844-eating-side.png) | [idle](cow-anatomy-1280-idle-side.png) / [eating](cow-anatomy-1280-eating-side.png) |
| Rear | [idle](cow-anatomy-844-idle-rear.png) / [eating](cow-anatomy-844-eating-rear.png) | [idle](cow-anatomy-1280-idle-rear.png) / [eating](cow-anatomy-1280-eating-rear.png) |
| Three-quarter | [idle](cow-anatomy-844-idle-three-quarter.png) / [eating](cow-anatomy-844-eating-three-quarter.png) | [idle](cow-anatomy-1280-idle-three-quarter.png) / [eating](cow-anatomy-1280-eating-three-quarter.png) |

Reproduce with `npm run test:core:game` in `farm3d/tests`; the individual static
checks are `node --test cow-anatomy.test.mjs` and `node cow-anatomy.browser.cjs`.
Browser outputs use `TEST_ARTIFACTS` or the existing `tests/artifacts` default.
Hosted results must pass at the new exact published head before readiness.
The owner also requires roughly90/100 static anatomy. Technical checks alone
cannot meet this visual gate; the refinement remains unapproved/unmerged.

Earlier prototype eye attachment failures and B0 stop/recovery/run-start failures
remain preserved in the parent workspace. This PR has no gait retune. B9–B12
will address the known contact/cadence issues only after the B8 anatomy gate.
B13–B18 behavior, long simulation, full review and owner/device acceptance are
outstanding. B8 engineering evidence is not physical or whole-program acceptance.

Older draft PR54 is a separate B1 planning proposal based on padded bounds;
it is not used by this runtime. Its source/tests/history are preserved, and its
disposition remains pending. No changes to that PR are made by this candidate.
