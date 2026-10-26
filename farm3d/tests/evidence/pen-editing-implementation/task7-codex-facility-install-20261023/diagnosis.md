# Live trough care remains blocked after the narrow resume fix

## Established outcomes

Native independently moved trough [7.1,-35.4] to[6,-35] validates, publishes and reloads with46 animals, stable station IDs, exact reservation/paid-state fields, correct new target geometry and all46 validated placements. Isolated actual post-reload drinking completes at30/60/120Hz in24.90/24.8833/24.825s within60s. All original support/drift/liftoff/speed/muzzle limits pass. This is one within-slab placement, not all layouts or traffic.

## Genuine resume defect corrected

animal-pen-cow-adapter.js::prepareLayoutRebind.publish cleared free actors' old path/target, but left act=moving. Beast.update only starts normal decisions for idle/eating/resting. Real five-cow trace retained three targetless moving cows; one occupied the care approach. New contract RED1FAIL/7PASS confirms it. Minimal conditional now returns only unreserved ordinary moving actors to idle at publication, preserving timers and directed tasks.49 focused checks PASS, including existing robot stages/token/ledger/publication/save/locked-byte controls. New suite registered additively;103 core Node files, no full-core rerun claimed.

## Remaining unchanged60s RED

Original live-only-static and five-cow-dynamic controls both remain archived. After the narrow fix, all five actual cows are updated in original order, no actor/task/route injection or relocation. Reserved cow index3 still never reaches hold in3600 frames/60s; final position[3.3823463023361997,0.08,-35.71716388711714], destination approach[3.7,.08,-35]. Cow index4 remains near[3.7584,.08,-34.9422], act=idle, target=null, path=[]. Minimum tested-cow separation0.8500151622494241m, so the .85m collision guard is working. Other free cows now idle/replan instead of remaining falsely moving; this subdefect is resolved, but route clearing is not. No deadline, seed or physical margin was changed.

## Next investigation scope (inference clearly separated)

Exact runtime locations: index.html::waitCowStation (about2085-2100), Beast.go (about1723), route/hitsBlock/insideObst; animal-pen-cow-adapter.js publication lifecycle. waitCowStation tests prospective waiting positions with fitsPen .7 and static .65 obstacle allowance, then calls ordinary go and returns true without checking whether a real path exists. go uses the unchanged1.25m fit and1.6m ordinary route padding. Observed path=[] is consistent with an unsuccessful waiting escape; the exact candidate-selection sequence is not yet instrumented, so this remains the leading mechanism rather than a proved complete root cause.

Recommend parent escalate this coordinated care-wait/ordinary-route review to Astra/xhigh. First instrument candidate and actual path outcomes without changing arguments; retain exact live60s RED. Evaluate a reachable waiting destination using existing ordinary/collision contracts; do not switch to reduced-clearance free roaming, teleport/relocate a waiting actor as queue relief, or relax the .85m guard. Validate saved-layout/rebind/FIFO/robot-job and blocked-fence controls. If further protected scope is needed, request its exact file/functions; none is currently requested or edited.

## Blocker record

Action: qualify same live drinking reservation after Apply with all five actual cows updating. Target: index care-wait/ordinary route handoff near moved trough approach. Reason: reserved cow cannot finish within original60s because another actual idle cow remains in its approach. Status: retained failing evidence; broader routing change not attempted, pending stronger engineering review. Not denied; no uncertain mutation or new permission block. The one-condition activity correction is separately tested, but does not constitute a functional traffic fix.

Remaining facility matrix, feed bunk/robot/shelter, held-occupant moves, off-slab support, other species, per-edit fence installation, full traffic/import and Task8 remain open. No merge/deploy/visual acceptance.
