# Confirmed waiting-route handoff defect and bounded correction

The installed trough and station transforms were already correct. The unchanged five-cow60Hz journey again failed at3600frames/60seconds with no drinking hold before this correction. The passive trace records14,369 go requests and only five distinct selected destination/state combinations, all producing no target/path. No route arguments or actors were changed by tracing.

waitCowStation returned after the first point passing its loose waiting filters. Beast.go then fitted that point at1.25m and planned at1.6m. For example, cow4's first requested point near the north fence fitted to z=-34.05,1.25m inside the fence; a custom route requires1.6m. It therefore returned no target, but waitCowStation reported that it had handled the wait. Idle cows retried the same failed destination every frame. Some raw points also projected back into a care corridor after being checked outside it.

The full-browser shadow probe found later reachable candidates with unchanged arguments: the blocking cow4 had13 reachable choices. It never moved a real actor or installed a synthetic route. Cow2 in that sample had no route from its current source, but was outside the care corridor; this is not a claim that every ordinary placement/route is reachable.

## Baseline versus installation

The unchanged-facility browser control uses the same source, save, seed4242, fixed wall clock, water action, native editor entry and original60s bounds, followed by Cancel instead of Apply. It completed in31.8s before the correction. Boot positions vary slightly with real initialization timing, and a pre-Apply drink reservation can belong to cow0 or cow3; these browser runs are not an exact matched-state experiment. Traces collected in finally after successful reload are absent because the page has reloaded; failure traces and immutable executed sources remain complete.

`exact-route-comparison.json` supplies the matched routing experiment: exact positions and tasks from the previous retained five-cow failure, actual index fit/route/go/wait functions and actual resolved cow obstacles/fences. Both unchanged and moved trough geometry are compared under default versus custom pen routing, before versus after this patch. It is a routing replay, not physical motion or a full-farm obstacle simulation.

Before: the same cow4 request returns no target for either custom geometry, but default legacy routing supplies its existing fallback. After: both custom geometries find the same reachable destination[2.4061432085416676,-34.57983373324083] on the fourth route attempt. Positions and task tokens remain exact in every row. Thus custom routing exposed a pre-existing assumption in the waiting caller; bad trough installation or an intrinsically unusable trough destination is not the cause. This patch does not change default fallback policy or relax custom route validation.

## Runtime change

Only `index.html::waitCowStation` changes: fit a candidate before checking its waiting filters, and return after go only if it actually installed a target. Otherwise continue the existing bounded five-radii/24-angle search; exhaustion uses the existing one-second idle wait. No route rewrite, new queue mechanic, teleport, actor placement, reservation release, ledger/save edit or rig change. Existing1.25 fit/1.6 planner/.7 waiting pen/.65 waiting obstacle/1.3 destination-neighbour/1.1 corridor/.85 directed collision limits remain. Runtime outside this function is byte-identical to base.

## Results and limits

Original live five-cow cases PASS30/60/120Hz in29.6667/29.55/29.5s, including native Apply, same task/token continuation, real drinking/hold/release, exact paid state and reload46. Separate all-five-cow safety supplements pass all three rates:31,015 individual actor updates,13,719 ordinary-moving actor frames, minimum separation1.368999122m; speed excess<3.4e-15m, planted support<2e-15m, planted drift/liftoff<1.5e-14m. Continuous containment and original limits stay asserted. Non-cow actors are static, so this is not whole-farm mixed traffic. Existing planner/static-obstacle behavior remains unchanged; no universal geometry or all-layout clearance claim.

Isolated post-reload60Hz drinking/support regression PASS25.0333s. Final unchanged-facility60Hz control also PASS. All actual new runtime browser reports carry the same index SHA256. Real rendered drinking image inspected; it is an overhead scene with actual cow at water. It is local emulation, not physical-device, hosted CI, final art review or owner visual approval.

Focused tests: three new behavioral REDs before the fix; six waiting contracts then PASS. An added exact-replay helper initially used class-method syntax inside an object literal and caused three test parser failures; original helper and raw80PASS/3FAIL log retained. Corrected helper uses a class prototype, changes no runtime/assertion, and all three replay tests PASS. Together with unchanged affected regressions,125 tests PASS across the recorded runs, zero skips. The initial failed aggregate is not relabeled as a successful run. Two new test files register additively (105core files); no full-core or credited pet-sweep rerun is claimed.

All1500 prior evidence files,20 protected implementations, seven reviewed adapter records and exact A1/A2/A3 bytes remain unchanged. Historic static-neighbour live RED remains preserved: freezing a neighbour is a separate diagnostic limitation and has not been relabeled PASS. No new denial or uncertain mutation. All launched commands/browser/server pairs closed at checkpoint; prior external process inventory remains unavailable and was not retried.

Remaining: independent feed/robot/shelter support and held/off-slab facility moves; other-species facility care/doorways; installed fence/run/gate traffic; full in-pen mixed traffic and connectivity; import; Task8 recovery/cloud/resource/cache-predecessor/hosted/device; separate A3/editor visual acceptance and explicit merge approval. A4 animal exterior trips/transfers stay deferred by owner decision. No merge or deployment.
