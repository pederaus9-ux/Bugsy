# B1 proposed proportion reference

Left: frozen production cow from Git blob866bb94666a58fd2f5402b440789255ce8264dee
at PR52 merge75baac10fc3e4294062b67d44dee7c9e1325f94c. Right: **proposed B1 target**,
using the non-executable proposed-reference-source.txt. Production cow3d.js,
index, cache and all gameplay remain unchanged by this planning PR. These are
actual renderer images, not generated illustrations or live phone captures.

Same height1.7, Bessie seed, origin/initial idle pose, orthographic camera and
lighting for each pair. The camera, pixel ratio1, exact640×650 drawing buffers
and source hashes are recorded in cow-b1-measurements.json. Final paired image
size1280×720 includes labels. Source colors use the actual shared vertex-color
material. Labels distinguish the proposal from the existing cow.

| Measure | Frozen B0 | Proposed reference |
| --- | ---: | ---: |
| Neutral width | .83591692 | .81222224 |
| Neutral skin height | 1.62776679 | 1.60074248 |
| Nose-to-rear extent | 1.82706678 | 1.81528323 |
| Cow triangles | 10,592 | 10,472 |
| Bones | 24 | 24 |
| Visible cow draw | 1 | 1 |

Values are game coordinates, not calibrated meters. Measurement scans every
actual skinned vertex rather than the padded culling box. The proposal fits
the frozen neutral envelope with the original .002 numerical tolerance; no
height/radius/gameplay change is proposed. Dominant-weight part bounds in JSON
are diagnostic bins, not exclusive anatomical volumes. Public creation/update,
movement, gait and visual behavior source is byte-identical after normalizing
line endings. The eye bind locations change to sit on the narrower proposed skull;
the leg/body/neck solver controls and 24-bone hierarchy remain preserved.

Targets and tolerances are specified in [the B1 plan](../../art/COW_RECONSTRUCTION.md).
The target is stylized Holstein anatomy, not a measured scan of a supplied cow.
The original owner farm-style picture contains no cow. Owner appearance review
is pending. Neither this envelope proof nor a green planning CI run is B8, B17,
B18, a completed cow reconstruction, or physical acceptance.

Reproduce from this PR checkout with Node and the existing isolated Playwright
runtime: `node farm3d/tools/capture-cow-b1.cjs`. It reads the actual frozen Git
source and the captured proposal text; no production imports reference the text.
It asserts matched camera/scale, complete true bounds, one cow draw, no increased
triangle cost, shared bone count, existing gait constants and unchanged public
API/motion. Failures are reported rather than weakening tolerances.

Known B0 stop/recovery contact and run-start cadence failures remain documented
in the baseline. No motion repair or production geometry promotion belongs to
this planning PR. B2 production changes follow owner review of B0/B1; B8 anatomy
must pass before B9 gait tuning, and B18 still requires controlled final evidence
and direct owner/device acceptance.
