# Read-only cow turn and narrow-route diagnosis

Base b3a4c679acc983bb330a0252d1a2e886c9c6cc14, main1115f93101a0e86fdcc9780e053c17b73dd6dac5. Parent requested gpt-6-astra/xhigh, sole worker, diagnostic/evidence-only checkpoint. Owner has not approved a cow-rig change. Runtime, protected approvals, original tests and prior evidence stay byte-identical.

Acceptance written before diagnostic execution:

1. Replay the retained clock-corrected first-turn trajectories through the unchanged rig and quantify the first planted-to-unplanted discontinuity, incoming anchor reach, clamp/release state and predicted versus measured displacement. Preserve .05m liftoff and1e-10m planted-contact/anchor tolerances.
2. Evaluate a possible adapter remedy using only calls to the existing rig API on diagnostic instances. Smaller steps must be assessed at the original outer30/60/120Hz observations, including total motion, contact, liftoff and actual endpoint. An internally green substep cannot hide a failing outer frame. Keep every original RED and label supplemental scenarios separately.
3. Read the exact approved spec and validator. Revalidate the retained applied layout against its original World, then examine usable expansion and ordinary versus care margins without changing geometry/clearance. Distinguish an invalid diagnostic expectation from product behavior and validation coverage gaps.
4. Produce a precise proposed correction: files/functions, minimal scope, risks, required tests and whether additional owner authority is needed. No runtime implementation, new locked hashes, merge/deployment or unrelated full-suite rerun.

## Exact turn mechanism

`trace-turn.mjs` replays the retained clock-corrected browser root trajectories through unchanged cow3d.js and verifies the resulting sole positions against the original report to1e-10. No rig state is overridden and no candidate source is evaluated.

In `cow3d.js::updateCow3D`, lines259-272 update body heading and transform each planted world anchor into the new model frame. At30Hz frame3 and60Hz frame6, leg1's anchor is now .410295590975756m from its hip in that horizontal frame. Lines287-290 clamp tx/tz to .34 **before** calling release(). The release closure atline278 therefore records the shortened position instead of the actual old anchor. With model scale1.7/1.8, the predicted displacement is(.410295590975756-.34)*(1.7/1.8)=.066390280365992m. Actual displacement differs by less than3e-15m. This is a deterministic reach-clamp ordering discontinuity, not support sampling, collision projection, inaccurate browser timing, anatomy randomness or merely a misleading screenshot. Other released legs match the same formula. At120Hz the observed overshoot is smaller: .032914025824707m.

The existing quarter-second recovery residual stores local rx/rz. After release, further model rotation carries that local residual through world space; finer internal steps do not guarantee a bounded visible release frame.

## Adapter remedies evaluated and limits

Supplemental API-only replays preserve the exact recorded outer root positions and30/60/120Hz observations, subdividing the same displacement/time into at most1/30,1/60,1/120 or1/240s updates. They do not replace any original test.

| Outer rate | Internal maximum step | Internal maximum liftoff | Outer maximum liftoff | Retained .05m outer limit |
| --- | --- | --- | --- | --- |
|30Hz|1/30s|.0663903|.0663903|FAIL|
|30Hz|1/60s|.0663903|.0663903|FAIL|
|30Hz|1/120s|.0329140|.1441112|FAIL|
|30Hz|1/240s|.0153804|.1663624|FAIL|
|60Hz|1/120s|.0329140|.0735444|FAIL|
|60Hz|1/240s|.0153804|.0815029|FAIL|

All variants retain planted-contact/anchor precision below1e-10. The120Hz outer variants pass the .05 limit, but do not cure30/60Hz. Subdividing only the adapter and reporting internal steps would mask the failure; it is rejected as the correction. Pre-aligning a test cow remains a useful support-isolation control, not a product fix. Resetting planted flags, overriding bones/anchors after the rig update, or falsifying dx/dz would hide the rig defect or duplicate protected state ownership and is also not recommended.

Naively removing the .34 clamp or keeping the .4103 target for one frame is not a safe proposed fix. The unchanged `poseCowLeg` formula would lower the model-space hip by .1124234m instead of .0701427m at .34. That exceeds the existing .08m hip-cover envelope tested in `cow3d.test.mjs` lines71-83. This is a formula-based risk assessment, not an implemented or approved candidate. Keep the solver, link lengths and reach limits intact.

No qualifying adapter-only remedy is established. A separately designed root steering/turn policy could in principle avoid sharp heading demands, but must prove collision/route/deadline and care-stage preservation; it is not a proven small substitute for fixing this internal reach/release transition. These diagnostics do not prove all possible adapters impossible.

## Smallest recommended correction scope for owner review

**Approval requested, not granted:** permit changes only to `farm3d/cow3d.js::updateCow3D`, specifically its body-yaw update and planted-hoof reach/release/recovery decision block (currently lines259-290), to make tight-turn release continuous at the original displayed frame rates while respecting the existing .34 reach, .05m liftoff, planted-contact/anchor and hip-cover limits. Prefer anticipating a reach-limit crossing and bounding the heading/release transition, rather than clamping an already overextended anchor to a different point. Any residual recovery must remain continuous in world space during the turn. The exact algorithm still needs RED-first implementation and verification after approval; no candidate is claimed correct here.

Keep `buildTemplate`, geometry/material/skin weights, bone hierarchy/dimensions, COW_GAIT constants, `poseCowLeg`, ordinary stride/cadence, face/tail behavior, terrain/path, collision clearances and paid/account/save systems outside that authority. Do not register a new protected digest until the owner explicitly approves this narrow exception and the resulting candidate is reviewed/tested through the existing adapter-approval process. If a correction needs any excluded function or anatomy change, stop and request that exact additional scope. Current protected cow3d.js SHA256 is4d6c180cc70b8695a7e47ca792d7ddaf9311b9987b8ea34ad6a1e3821db87e44.

Acceptance for a later authorized correction:

- Replay the exact retained unaligned30/60/120Hz trajectories and actual live care crossings, with the original6s crossing limit, .05 liftoff and1e-10 planted-contact/anchor assertions, at both internal and displayed frames. Do not credit only west-facing controls.
- Cover left/right initial and moving90/180-degree turns, walk/run starts/stops, soil/slab crossings in both directions, with the existing speed/cadence/hip/finite-bone/skin constraints; preserve actual physical fence/footprint and neighbour checks. Cases supplement original seeds/deadlines.
- Run existing cow3d anatomy/contact/transition/scene/robot/care and support regressions unchanged, including accepted B10/B12 tolerances. Record existing unrelated historical failures separately. Validate actual rendered standing/turning skin; no model redesign inferred from numerical contact alone.
- Verify care reservations and robot approach/dock/exit credit, full3D movement, ordinary recovery and equal-clock paid saves, then relevant full regressions/hosted qualification when the final candidate warrants them. Owner visual acceptance remains separate.

## Narrow expansion: fixture error and genuine validator gap

The original probe asserts that a .95m-contained body-clear segment guarantees an ordinary route, but ordinary go() first fits at1.25 and routes at1.6. The start[9.79,-39.1] is ineligible for1.6; the requested goal[10.6,-39.1] is fitted back to[9.187596159536348,-38.95]. Empty routing is correct under those unchanged rules. Its original RED is retained. The genuine moving-without-target state bug was already corrected atb3a4c67 and is not redone.

`inspect-expansion.mjs` reconstructs the exact retained applied cow record and revalidates it against the separately retained maximum-ownership World (restoring groundY from the unchanged module). This is a Node diagnostic, not a new live Apply. The original browser report independently proves real Apply succeeded. Current validator again returns ok with no issues. Area grows from176.12 to181.26m2, adding5.14m2, but no added point can meet either1.25 or1.6 clearance. A .05m grid finds2026 added samples:894 atcare.42,157 atphysical.95,0 atfit1.25,0 atplanner1.6. The conclusion does not rely solely on grid sampling: the added pocket has an analytic clearance upper bound1.109091m. For10<=x<=11.8 it is bounded by parallel edges2.2m apart; x>11.8 is within.2m of its east edge; for9.8<x<10 the north edge/reentrant corner gives the stated upper bound, and its southern wedge is at most.2m wide.

A supplemental World places an unreserved cow-5 at[10.6,0,-39.1]. Validation still succeeds and retains that exact placement, although the position is not an ordinary-planner start. This is not proof of a permanently trapped cow: existing directed care can recover from that area, as the earlier live route already demonstrated. It is proof of a mismatch between care-valid placement and ordinary usable walking room.

The approved spec says expansion adds walking room (line16), requires body/turn/support routes and distinct legal placements (lines104-105), and preserves contained ordinary roaming (line108). `snapshotPenWorld` supplies one cow clearance .42; `validateAnimalPens` proves care/station/gate/robot routes at that clearance but checks neither added ordinary usable area nor free-actor ordinary route eligibility. Therefore this accepted expansion provides no new **ordinary** walking room. Care connectivity is preserved; asserting all new ground is completely unusable would be incorrect. The spec does not require every boundary centimetre to be walkable, so a future check should target connected usable expansion, not reject ordinary narrow border bands.

Smallest separate validation proposal, within existing pen-adapter scope for a future implementation turn: `index.html::snapshotPenWorld` and `animal-pen-validation.js::validateAnimalPens/planner`, plus focused tests, should distinguish ordinary-roaming eligibility from care/occupied-station clearance. Validate a connected ordinary-usable addition for an enlargement and reject an edit that leaves a free placement unable to begin ordinary roaming. Preserve occupied care poses/reservations and accepted unedited defaults; do not globally substitute1.6 forcare.42 or silently relocate a legal occupied animal. Fail with an actionable draft reason instead of lowering any margin or moving fences automatically. Saved-layout compatibility and exact world-state revalidation need coverage. No geometry, margin, validator or adapter code was changed in this diagnosis.
