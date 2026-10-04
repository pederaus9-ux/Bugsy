# Authored hands: technical candidate evidence

This is an original connected Blender model and a sandbox adapter. The original
phone-chat reference sheet was unavailable on this PC; no visual match to that
unseen image is claimed. Normal player farms still use their existing hands.

Two independent local Blender 4.5.14 exports produced identical GLB bytes:
`18bbcefd808131e7d8040c8f6126e6a18bd3ed0fc5b76c7a6cbd10c70a99e503`.
Source `.blend` and modeling recipe are included with the asset.

| Measurement | Legacy hands | Candidate |
| --- | ---: | ---: |
| Draws | 6 | 4 |
| Triangles | 3,888 | 5,952 |
| Geometry resources | 6 | 4 |
| Export size | procedural | 294,160 bytes |
| Asset image textures | 0 | 0 |
| Skeleton joints | 0 | 32 |

The triangle increase stays below the unchanged 6,000-triangle runtime budget.
The skin creates one GPU skeleton texture; that resource is explicitly released.
The plain studio warms the renderer's separate shared DFG lookup before measuring
ownership. Thirty rendered clone lifetimes return exactly to their starting GPU
resource counts at both viewports. Full pinned Khronos report has zero findings.

`runtime-results.json` records the exported asset's six clips, neutral reset,
clone independence and cleanup. `game-results.json` records the actual sandbox
Harvest button, weighted-joint motion/reset, all wardrobe colors, six clip poses,
thirty real wardrobe API calls, load rejection, cancelled late load, idempotent
cleanup and no disposal of borrowed farmer materials. Ownership counters render
the actual loaded hands separately so unrelated lazy world-sprite uploads cannot
contaminate the hand baseline. The unchanged scene-polish suite additionally
passes the original whole-farm wardrobe/resource assertions at both viewports.

`game-capture-results.json` and `game-*` images use the actual farm composer at
full 844x390 and 1280x720 drawing resolution, with no quality cuts. Camera/HUD,
Classic hiding, Walk rest, real curled harvest pose and pet pose were inspected.
These are automated PC captures, not human artwork or physical phone acceptance.

Earlier failed exports and test attempts remain in workspace `outputs/phase7m`:
twisted socket winding, parented-skin validator warnings, initial edge-on rest,
overhanging wrist, extra constant scale animation channels, renderer shared-texture
baselining, paused/cached mixer concerns, incorrect test rest-quaternion/motion
assumptions, a sampler callback after disposal, unrelated world-texture uploads
and an initial event-listener assumption for Skeleton. The model/exporter and
new harness were repaired; original tests, timeouts and budgets were untouched.
Final art/reference comparison, production/offline promotion, hosted checks,
specific merge approval and physical acceptance remain open.

Hosted first head `4d99c4a`, art run `37230016991`, passed the actual GLB/policy,
strict Khronos, all studio clips and full 844px game adapter checks. At 1280px,
the fixed 1.5-second post-click delay sampled the hand visibility before the Walk
transition completed. The assertion, trace and later failure screenshot are kept
in `outputs/phase7m/pr52-4d99c4a-art-failure-*`. The adapter test and full-resolution
capture now wait for the actual visible authored hands/hidden fallback state,
using the existing default wait timeout and identical visibility assertions.
The full-resolution art inspector selects the game's supported High preference
in its isolated browser and asserts full buffers, zero cuts and empty cut steps.

All eight hosted jobs passed the preceding 013db7b version (regression run
37230769629 and expanded art run 37230769651). Complete logs/artifacts are
retained under outputs/phase7m/pr52-013db7b-*. This is historical validation,
not approval or exact-head evidence for the revised model.

The current local revision reduces each arm by 11% around its lateral anchor,
lowers the rest presentation, rounds the palm/fingertips, gives the rolled cuff
two additional support loops, and offsets the four harvest fingers with stronger
thumb opposition. Cost grows by 256 triangles to 5,952, still below the unchanged
6,000 limit. Draw/geometry/material/bone counts are unchanged. Two exports are
byte-identical at the hash above; strict Khronos has zero findings. Actual
GLTFLoader six-clip/reset/clone/30-lifetime checks, the unchanged game adapter
at both sizes, all eight full CSS farm captures, and 52 original core units pass
locally. Fresh hosted validation is required before readiness.

This pass follows independently inspected captures and advisory phone-assistant
observations. There is no new direct human design or merge approval. Normal-game
promotion remains pending. The original generated reference bytes remain unseen;
older phone farm screenshots are baselines, not that missing reference.

The first polished studio invocation incorrectly supplied an export outside its
repository-root HTTP server and timed out before loading. Its log/failure is
retained in hands-polish-runtime1 and hands-preparation/polish-runtime1.log.
Serving the same asset from its repository path passes (hands-polish-runtime2);
the server boundary and default timeout were not changed.
