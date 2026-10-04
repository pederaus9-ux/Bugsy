# Authored hands: technical candidate evidence

This is an original connected Blender model and a sandbox adapter. The original
phone-chat reference sheet was unavailable on this PC; no visual match to that
unseen image is claimed. Normal player farms still use their existing hands.

Two independent local Blender 4.5.14 exports produced identical GLB bytes:
`e5123c2d08842326efe1d6d94612399f07ae7c9d88d294a001518cfbcd9f3b69`.
Source `.blend` and modeling recipe are included with the asset.

| Measurement | Legacy hands | Candidate |
| --- | ---: | ---: |
| Draws | 6 | 4 |
| Triangles | 3,888 | 5,696 |
| Geometry resources | 6 | 4 |
| Export size | procedural | 287,492 bytes |
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
