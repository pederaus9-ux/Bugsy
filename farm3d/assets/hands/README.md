# Authored hand topology study

Original geometry and Blender modeling recipe created for Sunny Acres. No
purchased/downloaded third-party model, image texture or generated raster is
included. Project source/provenance is the modeling script and editable .blend.
The external reference-image rights and bytes are not represented by this study.
Blender and the glTF exporter are tools, not incorporated model assets; the
runtime loader retains the existing Three.js license in `lib/THREE-LICENSE.txt`.

This is a technical candidate, available only in the isolated test farm, not accepted by the
owner. The original reference sheet has not reached the PC for comparison.
The sandbox adapter shares wardrobe colors, maps actual actions and retains the legacy load-failure fallback. Production promotion/cache integration, final real-game regression,
hosted exact-head checks and physical S26 acceptance remain required.

`hands-source.blend` contains a connected palm/wrist/thumb/finger surface per
hand, tapered sleeves/cuffs, independent left/right joint chains and six clips.
Thirty-two bones; 5,696 triangles; four surfaces; two material slots; 287,492-byte
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

Review `?testfarm&debug&artHands&portrait` and choose Walk. Normal player farms never load this candidate. `art/authored-hands.js` owns the entire exported scene and its skin/geometry resources, borrows wardrobe materials without disposing them, and samples bone channels absolutely to prevent paused action/offset accumulation. `tests/authored-hands.browser.cjs` verifies real harvest, all six poses, all skin colors, thirty real wardrobe rebuilds, failure fallback and idempotent cleanup. `tools/capture-hands-game.cjs` captures the actual farm composer at 844x390/1280x720 with no quality cuts. Sandbox-only review does not close owner approval, production/offline or physical-device gates.

Earlier attempts and failures are retained in workspace `outputs/phase7m`:
finger/thumb socket twists, four parent-transform validator warnings, initial
edge-on rest pose, and a false zero-texture cleanup assertion. r186's lazy shared
DFG lookup is warmed before resource baselining; zero asset-owned resource growth
remains required. No production test threshold or timeout was weakened.
