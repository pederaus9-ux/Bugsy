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
Production integration revision:
Normal player farms now request authored-hands.js?v=2 and the same polished GLB
with ?v=2. Testfarm without artHands and visuallegacy keep the existing procedural
comparison; all original assertions remain. sa3d-v40 pre-caches the entire actual
loader/module/GLB graph. Cache consistency additionally recognizes nested module
paths, so a stale nested version cannot bypass the existing checks.

The new production browser fixture passes a normal level-1 guest farm, pending
HTTP model/legacy visibility, ready authored/legacy hiding, shared wardrobe
materials, skin and crop/coins save reload. It registers the actual production
worker explicitly on secure-context localhost (deployed auto-registration is
HTTPS-only), removes old sa3d-v39 while preserving a foreign cache, verifies every
shell response and the exact cached GLB SHA256, then reopens offline with both
browser offline and server responses disabled. Missing GLB and missing module
HTTP requests both retain playable procedural hands and planting/saving.

production-results.json and production-normal/offline.png are from the successful
local normal-farm test. These two pictures use the normal reduced software-GPU
test buffer (DPR 0.5), not the full-buffer art comparison or a physical phone.
All 53 core units, the unchanged scene-polish 844/1280/visuallegacy tests and the
authored adapter at both sizes pass locally on this production revision.

Failure records are retained in workspace outputs/phase7m. The first offline
fixture assumed Chrome would make no worker-update request; Chrome still probed
sw.js. The revised proof cuts off the local server and asserts zero served
responses instead. Attempt 2 passed offline and missing-GLB behavior but timed
out before the final missing-module boot; its trace also captured the new init
script accessing about:blank storage. The fixture now guards the origin and
closes each completed game context before starting the next case. Attempt 3
passes every case with the same boot/assertion limits and unchanged game code.

Hosted d65da3f: all seven regression jobs pass. Combined art run 37233910105
completed all hand stages and barn ownership/disposal, then exceeded the existing
20-minute job limit during the final full-buffer barn captures. Full logs,
available artifacts and the explicit timeout annotation remain preserved under
pr52-d65da3f-*. Hand and barn checks now run as separate jobs, each with the same
20-minute limit; no checks, assertions or captures were removed. The production
fixture is added to the hand job. This revision requires all nine exact-head
hosted checks. Owner artwork/merge approval and physical device acceptance remain
open; nothing is merged/live and no match to the unseen reference is claimed.
