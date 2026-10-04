# Barn art candidate 01

Original Sunny Acres mesh, generated offline by `../../tools/build-barn.mjs`.
This is an editable code-authored mesh recipe, not a Blender-authored/rigged asset.
It uses explicit beveled board/trim shapes and four batched material families.
Vertex colors provide broad paint/stone variation. The GLB remains untextured;
the separate experimental scene study adds two procedural canvas material maps.
The shell preserves the existing 8 × 11 meter gambrel-barn silhouette.

Candidate only: not deployed, not installed in the gameplay scene. Preview door
leaves are static; the production animated-door/interior/material customization
integration is pending. UVs, a canopy/corbels and hip caps now exist. LODs, authored
baked/KTX2 maps and production vegetation integration remain pending.

Build from the repository root:

```sh
node farm3d/tools/build-barn.mjs
node farm3d/tools/validate-asset.mjs farm3d/assets/barn/barn-candidate.glb farm3d/art/asset-contract.json barn-lod0
```

The initial validator report in tests/evidence/phase7mx describes candidate 01.
The current 8,116-triangle, 1,075,236-byte binary is checked by pinned Khronos
gltf-validator 2.0.0-dev.3.10: zero errors/warnings, four reviewed unused-UV infos.
The GLB has no image references; UVs are used by the experimental canvas material
study. No findings are suppressed. The current report is in scene-study/validator.json.

`art/barn-scene-candidate.js` adds a worn apron, clustered leaves/sunflowers,
stone edging and hay. Static proof only: grass instance masks and the old ivy
are restored exactly; production must use the game's clearing/ownership systems.
The existing ivy extended above the wall into the roof/air and is hidden for the
candidate, preserved in the control. Four additional batched meshes, two 256-square
canvas textures, no per-frame animation or shadow-casting lights are introduced.
This is not a completed Blender/texture-export pipeline or an accepted visual upgrade.

Run `node farm3d/tools/capture-barn-scene.cjs` with Playwright installed to capture
paired Classic/Walk in noon/golden/rain, 844/1280 CSS pixels at DPR1. It uses the
real compositor/HUD. Desktop captures are not physical S26 performance evidence.
The original candidate captures and rejected attempts remain as historical evidence.

GLTFLoader, BufferGeometryUtils and SkeletonUtils come from Three.js tag r186;
only the bare `three` import was rewritten to the project's vendored module.
License: farm3d/lib/THREE-LICENSE.txt. No new runtime imports or service-worker
changes were made. KTX2 and Meshopt decoders are not introduced by this candidate.
