# Sunny Acres 7M-X: visual production

Owner direction: maximize premium stylized farm presentation within measured
S26 sustained-performance limits. 7N release acceptance is deferred until this
program passes. Accepted source baseline: e080aee5b1d3ca714bb4baa642634353f433523b.

## Status

MX-01 first art specification: implemented here; actual asset review remains open.
MX-02 asset policy/preflight: implemented here; exporter, optimizer, runtime loader,
texture decoders, offline integration and actual GLB assets remain pending.
MX-03 through MX-20: pending. This commit makes no visible runtime changes.

## Art direction

Premium storybook farm with tactile, softly beveled forms. Keep the red barn,
silo, yellow clothing and readable field layout as recognition anchors.
Use warm sun, cool shadows, restrained haze and distinct material families.
Build broad masses before fine detail; avoid uniform grass spikes and repeated
spherical canopies. Close-up geometry must withstand the Walk camera.

Palette starting points (source colors, before lighting): barn red #A84335,
cream trim #F0DBAF, roof charcoal #424E57, meadow #64894C, sunlit grass #97AE62,
soil #765540, worn dirt #AF9570. Review under the actual ACES/exposure settings;
these are working swatches, not final appearance guarantees.

### First proof slice

Authored barn plus its immediate ground/vegetation, reviewed in both owner camera
views. Keep the remainder of the farm as the control. No broad world swap until
this slice improves composition and close-up craftsmanship at acceptable cost.
Hands need a dedicated authored rig next, not another sphere/cylinder iteration.

Barn: readable roof thickness, recessed windows, trim bevels, stone foundation,
plank direction and selective wear. Cluster hay/tools near doors; keep paths clear.
Vegetation: clustered short/medium/tall silhouettes, intentional bare ground,
edge masks and measured alpha overdraw. Spend triangles on silhouettes first.
Hands: tapered arms, coherent palm/wrist surface, anatomical thumb placement,
individual fingers, cuffs, six named interaction clips and wardrobe material slots.

## Asset contract

See asset-contract.json. Budgets are provisional per-asset ceilings, not device
performance proof or total scene budgets. Separate LOD files avoid counting all
LODs as simultaneously visible. Meter units, Y-up at runtime, named identity root,
ground-contact pivot; preserve existing gameplay transforms and interaction proxies.

Production images must be embedded KTX2. Untextured assets are allowed. Author
textures at up to 1024 initially; 2048 requires an explicit measured hero-asset case.
The preflight currently checks MIME policy, NOT KTX2 payload validity/dimensions,
mesh data integrity, skinning validity, LOD coverage or visual craftsmanship.
Those remain separate acceptance gates. Primitive count describes asset surfaces,
not actual scene/composer/shadow draw calls. Meshopt is allowed, not mandatory.
Its decoder and KTX2 transcoder are NOT installed in the runtime yet.

## Production sequence

1. Author/edit coherent topology in Blender; preserve editable source and license.
2. UV and bake stylized base color, AO, normal and roughness as appropriate.
3. Export GLB with applied transforms, explicit root and named animation clips.
4. Validate export with Khronos glTF Validator; resolve errors and review warnings.
5. Optimize with a pinned glTF Transform toolchain; record versions/commands.
6. Encode textures with Basis/KTX2; evaluate quality and target GPU memory.
7. Run policy preflight against each LOD/profile, then validate optimized output.
8. Verify actual loading with version-matched GLTFLoader/decoders in a sandbox.
9. Capture paired real renders; inspect silhouettes, seams, normals and animations.
10. Integrate one visual proxy with procedural fallback and explicit ownership.
11. Include required assets/decoders in offline cache with a deliberate release bump.
12. Measure actual farm cost, recovery, disposal and real-device acceptance.

Run policy preflight:

```sh
node farm3d/tools/validate-asset.mjs barn-lod0.glb farm3d/art/asset-contract.json barn-lod0
node --test farm3d/tests/asset-policy.test.mjs
```

The preflight is intentionally a production-policy tool, not a substitute for
Khronos validation. No purchased/generated model is accepted without license,
source provenance and visual review. No model is assumed production-ready merely
because it was exported from Blender.

## Gates and measurement

S26 60 FPS is a target, not a verified result for the proposed assets. Desktop GPU
benchmarks do not establish mobile headroom. Record actual frame-time distribution,
render scale/quality, temperature conditions, battery, resource counts and session
length. Compare identical camera/state/weather at baseline and candidate.

Preserve Classic and Walk, noon/golden/rain/snow/night, maximum crop/decor density,
Reduced Motion, wardrobe, harvest/plant, background/resume and offline recovery.
A 30-minute physical session must assess sustained performance and thermal change.
Do not call zero stutter or zero regression guaranteed; log failed runs honestly.
Resource counts must stabilize through repeated load/unload/weather/wardrobe cycles.
Shared assets require ownership/refcounts; dispose only after the final owner.

Gameplay state, saves, economy, Firebase, collision and AI remain authoritative.
Decorative replacement must preserve hit proxies and avoid new collision blockers.
One visual representation per entity. Each major slice gets isolated review,
paired screenshots and relevant existing regression checks before deployment.

## Remaining order

MX-03 hands; MX-04 barn/silo; MX-05 terrain; MX-06 vegetation; MX-07 trees/LOD;
MX-08 crops; MX-09 props; MX-10 countryside; MX-11 lighting/weather; MX-12 materials;
MX-13 farmer; MX-14 animals; MX-15 HUD; MX-16 animation; MX-17 audio/feedback;
MX-18 batching/LOD; MX-19 S26 optimization; MX-20 physical visual acceptance.
Optimization runs alongside every slice, not only at MX-18/19.

## Primary references checked 2026-10-04

- https://threejs.org/docs/pages/GLTFLoader.html
- https://github.com/KhronosGroup/glTF-Validator
- https://gltf-transform.dev/cli

Compatibility must be verified against the vendored Three.js revision before
adding loaders or decoders. WebGPU is not a prerequisite for this program.
