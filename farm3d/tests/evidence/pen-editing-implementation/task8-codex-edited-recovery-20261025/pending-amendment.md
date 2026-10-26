# Exact pending test/cache bundle (not applied)

This is a proposal, not owner approval. Existing A21 authorizes gate poses/blocker registration and A14 authorizes routine pen fixes, but A14 preserves original assertions. Earlier cache approvals identify particular version chains through v72. Because these two existing assertions change their expected contract and this is a new version chain, retain them unchanged pending the parent's exact scope decision. No protected implementation or checksum changes are proposed.

## Two original assertion corrections

1. `farm3d/tests/animal-pen-scene-registry.test.mjs`, test `diagonal custom fences keep oriented route obstacles and exact gate gaps`.
   - Original: `assert.equal(b.blocks.length, layout.sites.cow.obstacles.length, ...)`, currently 24 !== 22.
   - Proposed: require exact ordered equality of both `b.blocks` and `b.bounds` to `[...layout.sites.cow.obstacles, ...next.yards.cow.gateObstacleBounds()]`. Require the two gate entries, retain every existing fence count/identity/half-width/orientation assertion and its 1e-9 threshold.
   - Add the five already-proven deliberate corruptions: omitted leaf, duplicate leaf, extra solid diagonal rectangle, block filling a gate gap, incorrect oriented fence. Supplemental witness is the prior `task8-codex-boundary-final-20261025/registry-count-diagnosis.json`; original RED remains unchanged.
2. `farm3d/tests/remaining-care-integration.test.mjs`, test `authorized yard adapters retain exact accepted default rendered geometry`.
   - Original: complete default cow mesh receipt must equal frozen PR95 receipt. Native A21 cow hash is `504c8a74f4c7b9124fe656d8fb9fb1de8db092acf8c10fa141a6c2ee95f6e78c`; PR95 is `bf5e11fd5a99878af7408cb5de361928f03d38587d5d766561b324a43ae51ab3`, both 5040 vertices.
   - Proposed: first require exact A21 parked transforms: entry rotation +PI/2, x=-4.35+.10; exit rotation -PI/2, x=-4.35+.18. In the disposable test instance only, restore the two prior parked transforms (entry -PI/2, exit +PI/2, both x=-4.35), then require the COMPLETE mesh receipt to equal the unchanged PR95 receipt. All other transforms and geometry, the chicken receipt and unrelated assertions remain exact. Existing A21 closed-barrier/mesh-byte and A21/A22 source-lock controls stay required.
   - New supplemental witness `pr95-receipt-proposal.json` proves exact normalized equality and rejects wrong gate rotation, omitted offset, unrelated yard translation and missing gate geometry. This does not edit the original assertion or bless new geometry. No frozen receipt is overwritten.

## Version references only, eight production files

| File under farm3d/ | Exact reference changes |
|---|---|
| animal-pen-runtime.js | cow-yard.js?v=4 -> v=5 |
| animal-pen-validation.js | cow-yard.js?v=4 -> v=5 |
| animal-pen-placement.js | animal-pen-validation.js?v=3 -> v=4 |
| animal-pen-placement-worker.js | animal-pen-placement.js?v=3 -> v=4 |
| animal-pen-placement-controller.js | animal-pen-placement.js?v=3 -> v=4; animal-pen-placement-worker.js?v=3 -> v=4 |
| animal-pen-editor-view.js | animal-pen-placement-controller.js?v=3 -> v=4 |
| index.html | cow-yard v4->5; chicken-stations v6->7; remaining-care-controller v3->4; animal-pen-scene v1->2; animal-pen-runtime v1->2; animal-pen-validation v3->4; animal-pen-editor-view v3->4 |
| sw.js | CACHE sa3d-v72 -> sa3d-v73; same seven module changes above plus placement, placement-worker and placement-controller v3->4 in SHELL |

`cache-proposal.json` records every matching line and preimage SHA-256. The changed leaf implementations need new URLs; the modules importing those URLs need their own new URLs through the worker and editor chain. Their gameplay code is unchanged by this proposal. The ground/rig/game/auth URL versions do not change.

Matching current-run test imports only (assertions unchanged), all under `farm3d/tests/`:

- animal-pen-cow-roaming.browser.cjs
- animal-pen-full-ground-grid.browser.cjs
- animal-pen-full-ownership.browser.cjs
- animal-pen-occupied-shelter.browser.cjs
- animal-pen-outer-map.browser.cjs
- animal-pen-placement.browser.cjs
- animal-pen-resource-cycles.browser.cjs
- animal-pen-restore.browser.cjs
- animal-pen-robot-install.browser.cjs
- animal-pen-shelter-feasibility.cjs
- horse-square.browser.cjs

The inventory also finds `animal-pen-cache-v71-to-v72.browser.cjs`. Preserve that historical transition script/receipt; create a separate v72-to-v73 transition check with equivalent strict expectations, not edits that relabel its old evidence. Installed old-main v63-to-candidate coverage remains independently required. The old-main worker is now recovered and blob-verified; this does not establish that every predecessor asset is already available locally.

After approval: apply only this exact chain; check source diff and all import/worker/SHELL alignment; run both original corrected tests with corruption/lock controls; run actual installed-predecessor online/offline transition with edited-save integrity. No broad matrix or runtime behavioral change. No upload or publication implied.

## Emulator setup gap (technical, not an access denial)

Existing actual backend is Firestore/Auth. `farm3d/firebase/package.json` defines `firebase emulators:exec --only firestore,auth --project demo-sunny-acres` for recovery and conflicts. The local package directory has no node_modules, and `java`/`firebase` are not found on PATH; checked sibling test dependency directories and the configured Firebase emulator cache do not provide a ready equivalent. No emulator command, package installation, credential change or production call was attempted.

Next supported step is to provision the pinned project dependencies and a compatible Java/emulator runtime in an isolated authorized test environment, then supplement existing `firebase/tests/recovery.browser.cjs` and `conflicts.browser.cjs` with edited-layout and paid-state assertions. Exercise same-account/equal-clock choices and storage allowed/blocked using only the demo emulator ports. Preserve all existing tests. The new guest backup/restore PASS is not a substitute for this gate.
