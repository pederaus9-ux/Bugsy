# Authored hand topology study

Original geometry and Blender modeling recipe created for Sunny Acres. No
purchased/downloaded third-party model, image texture or generated raster is
included. Project source/provenance is the modeling script and editable .blend.
The external reference-image rights and bytes are not represented by this study.
Blender and the glTF exporter are tools, not incorporated model assets; the
runtime loader retains the existing Three.js license in `lib/THREE-LICENSE.txt`.

This draft proposes the authored hands in normal player farms. It is not accepted
or deployed. The original reference sheet has not reached the PC for comparison.
The adapter shares wardrobe colors, maps actual actions and retains the legacy
hands during loading or failure. Versioned module/GLB and the loader graph are
pre-cached by sa3d-v40. Hosted exact-head checks, owner artwork/merge approval
and physical S26 acceptance remain required.

`hands-source.blend` contains a connected palm/wrist/thumb/finger surface per
hand, tapered sleeves/cuffs, independent left/right joint chains and six clips.
Thirty-two bones; 5,952 triangles; four surfaces; two material slots; 294,160-byte
untextured GLB. Max three normalized vertex influences in the skin surfaces.
Base topology checks: one connected component per mesh, zero boundary edges,
zero non-manifold edges. Model is a starting topology study, not final art.

Skin/sleeve surfaces are glTF scene roots to avoid invalid parent-transform
assumptions for skinned meshes. `SunnyHands` is the identity skeleton root.
The runtime must own and transform the complete `gltf.scene`, rather than
extracting only the named skeleton node. Do not dispose shared geometry/materials
when removing a clone; its skeleton textures are owned by that clone.

Blender 4.5.14 LTS, build `62c1db4208e8`, authored/exported this study. Run from the
repo root with a fresh factory scene (never over an open Blender project):

```text
blender --background --factory-startup --python farm3d/tools/build-hands.py -- farm3d/assets/hands
node farm3d/tools/validate-asset.mjs farm3d/assets/hands/hands-candidate.glb farm3d/art/asset-contract.json hands
node farm3d/tools/capture-hands-study.cjs
```

The build emits neutral editable source, GLB, topology report and studio captures.
Pinned Khronos glTF Validator 2.0.0-dev.3.10 reports zero errors/warnings/infos.
The browser capture loads the actual exported asset with the vendored r186
GLTFLoader/SkeletonUtils, checks all six clips and neutral reset, independent
cloned bones, four draws, fewer than 6,000 triangles, shared-resource ownership
and cleanup. The studio captures are not the actual farm or phone acceptance.

Normal farms load the candidate by default. Review the isolated farm with
`?testfarm&debug&artHands&portrait` and choose Walk. `testfarm` without `artHands`
and `visuallegacy` retain the procedural comparison. `art/authored-hands.js` owns
the exported scene, borrows wardrobe materials without disposing them and samples
bone channels absolutely. `tests/authored-hands.browser.cjs` verifies real harvest,
six poses, six skins, thirty wardrobe rebuilds, fallback and idempotent cleanup.
`tests/hands-production.browser.cjs` uses a normal guest farm and the actual
service worker: saved crop/coins/clothing, old-cache migration, foreign-cache
preservation, exact cached GLB hash, offline reload with zero server responses,
and real missing-module/model fallback. Its localhost worker registration is
explicit because deployed auto-registration requires HTTPS. Account/cloud tests
remain in the separate Firebase emulator job. `tools/capture-hands-game.cjs`
captures the actual farm composer at full 844x390/1280x720 buffers with no quality
cuts. Browser results are not owner approval or physical-device acceptance.

Earlier attempts and failures are retained in workspace `outputs/phase7m`:
finger/thumb socket twists, four parent-transform validator warnings, initial
edge-on rest pose, and a false zero-texture cleanup assertion. r186's lazy shared
DFG lookup is warmed before resource baselining; zero asset-owned resource growth
remains required. No production test threshold or timeout was weakened.

The second visual study reduces each arm 11% around its own lateral anchor and
lowers the presentation, rounds the palm/fingertips, adds two cuff support loops,
and staggers harvest finger joints with stronger thumb opposition. The 32-bone
rig, four surfaces, two wardrobe material slots and six clips are preserved.
This is an independently reviewed polish pass under the existing art-work scope;
the phone assistant's critique is advisory, not direct owner design approval.
No match to the unseen original reference is claimed. All eight hosted checks
passed the preceding 013db7b version; the revised bytes require fresh hosted checks.
