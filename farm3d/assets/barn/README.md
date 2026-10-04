# Barn art candidate 01

Original Sunny Acres mesh, generated offline by `../../tools/build-barn.mjs`.
This is an editable code-authored mesh recipe, not a Blender-authored/rigged asset.
It uses explicit beveled board/trim shapes and four batched material families.
Vertex colors provide broad paint/stone variation; no image textures are used.
The shell preserves the existing 8 × 11 meter gambrel-barn silhouette.

Candidate only: not deployed, not installed in the gameplay scene. Preview door
leaves are static; the production animated-door/interior/material customization
integration is pending. LODs, UV/baked maps and vegetation are pending too.

Build from the repository root:

```sh
node farm3d/tools/build-barn.mjs
node farm3d/tools/validate-asset.mjs farm3d/assets/barn/barn-candidate.glb farm3d/art/asset-contract.json barn-lod0
```

Khronos gltf-validator 2.0.0-dev.3.10 checked the binary, including its buffers:
zero errors, warnings, infos or hints. Full report is in tests/evidence/phase7mx.

GLTFLoader, BufferGeometryUtils and SkeletonUtils come from Three.js tag r186;
only the bare `three` import was rewritten to the project's vendored module.
License: farm3d/lib/THREE-LICENSE.txt. No new runtime imports or service-worker
changes were made. KTX2 and Meshopt decoders are not introduced by this candidate.
