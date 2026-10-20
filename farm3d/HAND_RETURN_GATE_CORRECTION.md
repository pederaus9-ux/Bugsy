# Authored-hand desktop gate: software drawing budget

## Problem and reproduced cause

PR85 source `2afe7fc8c884f182e1341174eb9d79ed8ad0fdd9` has two retained desktop timeouts in workflow39257238400. Their in-memory failure samples were never saved, so neither old run's individual predicate terms can be reconstructed.

A new purpose-built native observation at commit `f9e820488246094615b651e10c77ff6ed799c230`, run39344007122/job118372117258, reproduced the same1280 deadline with the original71-callback cap, pose tolerances,10000ms deadline, native Harvest click and844→1280 ordering. Production files were unchanged; only the separately named diagnostic's served page had read-only hooks beside actual game updates. The original test file remained byte-identical in that reproduction.

Verified1280 receipt:
- Trusted Harvest input arrived after2 samples; the collector held11/71 samples when the wait failed. It did not exhaust.
- Nine post-input game updates ran, each with actualdt0.1 while wall-clock gaps were approximately1.09–1.15seconds. The game was visible and not held.
- Harvest completed (`crop:null`). Count and action departure predicates passed. The final-three settled predicate failed, with component errors `[1.1082258566996739e-5, 6.739122288546007e-7, 0]`.
- The live finger was exactly neutral at the post-wait observation. The final in-wait poll already had the same zero-error final sample but only two of its last three samples were within1e-6. A tenth post-input update was needed for the third settled sample.
- Observer error count0, no dropped update records.844 passed with ten post-input updates and the expected settled tail.

This establishes an insufficient-update deadline in the new native reproduction under SwiftShader drawing load. It does not retroactively create the missing samples from either historical failure. It also does not establish a stuck character pose, collector exhaustion in that run, or physical-device performance.

## Minimal change

Only `farm3d/tests/authored-hands.browser.cjs` changes executable behavior: `start()` becomes `start({deviceScaleFactor:.25})` for this bone/material/interaction suite, rather than inheriting the shared harness default0.5. The CSS viewports remain844×390 and1280×720, and the actual world, authored GLB, native input and game update path remain active. The desktop drawing buffer becomes320×180.

All original assertions, departure0.1, return1e-6, last-three requirement,71-sample cap and10000ms deadline remain byte-identical. Reversing that single option restores every original test byte; see `tests/evidence/hand-return-causal-20261019/source-invariants.json`.

This bounds software rendering work in a component integration test; it is not a production graphics optimization. Its lower-resolution screenshots are not visual acceptance evidence. The separate `capture-hands-game.cjs` still uses deviceScaleFactor1, the High preference, original full-size buffers and real game renders. `hands-production.browser.cjs`, the shared harness, game/runtime/assets, worker, saves, Firebase and other species are unchanged.

## Native validation

Controlled candidate `7858572903687c413b7d21d56948276ff2c47991`, run39344522666:
- Observed844/1280 sequence: step SUCCESS.
- Actual `node farm3d/tests/authored-hands.browser.cjs` without observer instrumentation: step SUCCESS for the same candidate.
- Original subsequent normal-farm/offline/fallback and full-resolution capture sequence: PENDING at this documentation checkpoint. Do not infer whole-job success.

The new observer's bounded-storage counters, trusted-input selection, post-wait timing separation, error reporting, source anchors and queued-callback cleanup pass5 local Node checks. A cleanup-race test first failed, then passed after making the removed observer optional in pending diagnostic sample callbacks. That change is only in the separately retained diagnostic branch; no observer/helper/workflow is added to PR85 by this patch.

## Evidence and remaining gates

Evidence directory: `tests/evidence/hand-return-causal-20261019/`. Raw failed artifact12229758641 is preserved separately with SHA256 `670df03e50df2828c9809eca1eb84d3310bac74e2ef76f0453f969b4cc209144`. The native log and both width receipts are included here. Original failures and previous non-reproductions remain untouched.

No engine, production animation, character geometry, save, cloud, worker, chicken/other-species, economy or release setting changes. Existing chicken/scene/cloud qualification on2afe remains historical credit, not exact-head CI clearance of a later commit. The cancelled original core job and separately prepared CI partition/aggregate correction remain separate work. Owner30-bird visual acceptance, explicit merge authority and broader performance/capture/device gates remain open. No merge or deployment.

This is lead implementation and adversarial self-review, not an independent external audit.


## Completed controlled qualification (supersedes pending checkpoint above)

Run39344522666/job118373798545 completed SUCCESS and uploaded artifact12231091075 (SHA256119c0c1e778d033efb51a7ea071200cc96e31c633d2c86af427e0c09ded8aa02). Observed waits were7871ms at844 and7975ms at1280; both retained ten post-input updates and three settled tail samples with zero observer errors. Every shared before/after quaternion component matches exactly (maximum difference0); the difference is available rendered-update cadence, not a changed pose.

The original uninstrumented test also passes844/1280 on this candidate. Original subsequent normal/pending/ready/asset-failure/module-failure checks, guest save/wardrobe, actual service-worker migration/offline reload, and full CSS-resolution captures all pass. Render receipts show844x390 and1280x720 buffers at pr1/High, including hidden overview and visible idle/harvest/pet. Four representative actual renders were inspected; these are not new owner acceptance or physical-device performance evidence.

PR85 now contains the one-line test correction and publication-checkpoint evidence at3251c754375428edf161e92ae9f3b75bf63513c0. Exact PR-head art39345911273/authored118378334290 is running at this checkpoint, alongside regression/release checks; do not infer its result from the controlled branch. Later receipts are kept on an evidence branch to preserve the tested PR head.

## Exact PR-head qualification

Run39345911273/job118378334290 completed SUCCESS on PR head3251c754375428edf161e92ae9f3b75bf63513c0. The original authored test passed844 and1280. Asset validation/study, pending/ready/missing-asset/missing-module paths, guest save/wardrobe, actual worker migration/offline reload, and full CSS drawing-resolution overview/Walk idle/harvest/pet captures all passed. Artifact12230884748 is9128542bytes, SHA256aa4fbd7feb912e524d0da630854a9242ada069ae91fd494d086a579631189349; downloaded bytes and ZIP integrity verified. Exact-head log and result JSONs are retained beside the timestamped CI snapshot.

At that snapshot, fresh Farm3D regression, old-save checks, six-species review, both30-bird touch widths, installed-update/30-bird offline save and same-account conflicting-save checks also report SUCCESS. Other jobs remain running; no whole-PR clearance is asserted. The original timed-out core run remains a historical failure; the prepared CI partition/aggregate branches were not integrated or changed in this task. Keep PR85 draft/unmerged; owner visual acceptance, physical-device/performance checks and explicit merge approval remain separate.
