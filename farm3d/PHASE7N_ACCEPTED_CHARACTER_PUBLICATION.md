# Accepted character baseline — owner-authorized in-game review

Status: prepared for exact-head hosted checks and guarded merge under the owner's explicit October18,2026 request. This is a bounded provisional publication, not full release or performance clearance.

## Owner scope

At08:55:37 America/Chicago the owner instructed: "Just merge and let me see it in game and we can unmerge if it dont approve". Publish the previously accepted corrected arm/character work so the owner can inspect it in the actual game. Earlier screenshot-before-merge restriction is superseded for this change. The owner retains product acceptance. No unrelated roadmap feature is included.

Base main: `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`; base tree: `05ac4ee6c3ff982ba2e8925d68fd5077667d058f`. Branch: `codex/accepted-character-owner-review-20261018`. The final reviewed head is the immutable PR head; exact commit/check/merge identities are recorded by GitHub and the completion handoff, rather than inventing this commit's own SHA inside itself.

## Runtime and tests

Five runtime files are byte-for-byte the recovered accepted reference`70e7085c744acc3a8d7b83ba601753e055c2e9a3`: index.html,scene-polish.js,sw.js,player-motion.js,player-arm-attachment.js. The accepted attachment is5937bytes with SHA256`dff17b03ff3c485fa87d214293705d85ad513820b59cf1847db31660d37b6511`; the shelved optimization is excluded.

The page installs the existing motion overlay and body-to-elbow sleeve attachment after the native hands, evaluates them in native frame order, and restores procedural constructor rotations before evaluating fallback actions. The worker moves sa3d-v43 to sa3d-v45, precaches both new modules and scene-polish.js?v=2, and retains its existing algorithms.

Seven original focused test files and their two fixtures are added unchanged. test:player-motion runs those tests and is prepended to the existing test:core:characters command. Existing regression tests, tolerances, timeouts and workflow files remain unchanged except the authored-hands browser baseline correction described below. No browser integration helper requiring a separate local CDP environment is introduced into hosted CI.

Fresh local Nodev24.19.0 verification:89tests passed,0failed,0skipped,0cancelled. The seven focused test files plus farmer3d.test.mjs,live3d.test.mjs,scene-polish.test.mjs and versions.test.mjs ran together. Four runtime modules passed node --check. Source/module and fixture checks are not actual browser or device evidence. Exact-head hosted checks are pending at this candidate record and must be inspected before merging.

## Preserved boundaries and evidence

All paths not in this focused change retain current-main blobs. game.js,auth.js,Firebase,save formats,cloud conflict behavior,economy,controls,animals,assets and the unrelated root app are unchanged. New source files are recovered from a hash-verified export, not a recovered original Git history. Current main and its later visitor/audio fixes remain the base; no whole archived tree replaces main.

The cloud preview failed before any game request with ERR_BLOCKED_BY_CLIENT, followed by a browser URL-policy denial. Its error tab and server were stopped, no screenshots were produced, and all350 source hashes remained unchanged. That failure is not visual validation. The subsequent PC transfer did not produce reviewed live screenshots. Prior accepted visual evidence remains distinct from this unreviewed publication.

Known broader integration CPU/GPU failures (including the reported approximately+9.11% GPU result versus5%), other phase failures/control drift, reference/reference pixel variation and six unqualified views remain unresolved. These are not attributed solely to the normal optimization, and this publication does not clear them. No performance improvement is claimed. The recorder remains shelved and BLOCKED with its eight findings and capacity/native-behavior gaps preserved. No recorder launches, recorder fixes or benchmark are part of this change.

## Publication and rollback

Use the existing main/root Pages route; no hosting/security/account settings changes. Pin the PR head in the merge request and verify main did not move. Record the resulting merge commit, exact deployed head and Pages result before claiming the live game updated. Full release remains unapproved.

If the owner rejects the outcome, revert only this merge with the first-parent main baseline as the reference; preserve commit history and all evidence, and inspect newer main changes before applying the revert. Do not force-reset main. A code revert does not undo player save writes or guarantee that an offline cached page refreshes immediately. Do not tell the owner to clear app/browser storage.

## Preserved first hosted failure and test-baseline correction

Initial head a4a84bc8f276d4cd8c0c8fdb75af5667f75d3eb3 failed authored-hands in run39134164343, job117695175138, at the actual harvest-return wait (line47). Artifact12139077761, SHA2568d85d7d3d775fe907ea75c6768c5e31ef9e1681e3f5f4566222e3e5f3ce2c1e0, and its trace/screenshots are preserved. The trace pins the old adapter-only neutral quaternion to[-0.11913235485553741,0,0,0.9928783774375916].

An offline probe using the real bundled GLB, GLTFLoader, authored adapter and unchanged production overlay reproduced the mismatch without a browser/WebGL: accepted composed idle is[-0.16860670692458335,0,0,0.9856834018773867], exactly the native idle multiplied by the approved -0.10rad relaxed finger bend. After harvest, the difference from the old adapter-only expectation is0.049474352069045935, while composed-rest return error is0 and action departure is0.1952928046720827. This proves an inconsistent whole-game return baseline; it does not independently establish browser timing or visuals.

The authored-hands browser test retains nativeNeutral, computes the composed idle from that native sample and the explicit accepted rest contract, and first requires the live frame to match it. The actual action still must depart by more than0.1 and return for the last three samples within1e-6, with the same10000ms return timeout and harvest state assertion. Isolated adapter clip checks remain intact. No runtime code changes, looser tolerance, removed assertions or extended timeout are used to resolve the failure. The new head needs a fresh exact-head run.
