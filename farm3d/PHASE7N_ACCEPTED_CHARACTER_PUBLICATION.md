# Accepted character baseline — owner-authorized in-game review

Status: prepared for exact-head hosted checks and guarded merge under the owner's explicit October18,2026 request. This is a bounded provisional publication, not full release or performance clearance.

## Owner scope

At08:55:37 America/Chicago the owner instructed: "Just merge and let me see it in game and we can unmerge if it dont approve". Publish the previously accepted corrected arm/character work so the owner can inspect it in the actual game. Earlier screenshot-before-merge restriction is superseded for this change. The owner retains product acceptance. No unrelated roadmap feature is included.

Base main: `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`; base tree: `05ac4ee6c3ff982ba2e8925d68fd5077667d058f`. Branch: `codex/accepted-character-owner-review-20261018`. The final reviewed head is the immutable PR head; exact commit/check/merge identities are recorded by GitHub and the completion handoff, rather than inventing this commit's own SHA inside itself.

## Runtime and tests

Five runtime files are byte-for-byte the recovered accepted reference`70e7085c744acc3a8d7b83ba601753e055c2e9a3`: index.html,scene-polish.js,sw.js,player-motion.js,player-arm-attachment.js. The accepted attachment is5937bytes with SHA256`dff17b03ff3c485fa87d214293705d85ad513820b59cf1847db31660d37b6511`; the shelved optimization is excluded.

The page installs the existing motion overlay and body-to-elbow sleeve attachment after the native hands, evaluates them in native frame order, and restores procedural constructor rotations before evaluating fallback actions. The worker moves sa3d-v43 to sa3d-v45, precaches both new modules and scene-polish.js?v=2, and retains its existing algorithms.

Seven original focused test files and their two fixtures are added unchanged. test:player-motion runs those tests and is prepended to the existing test:core:characters command. Existing browser/regression tests, tolerances, timeouts and workflow files are unchanged. No browser integration helper requiring a separate local CDP environment is introduced into hosted CI.

Fresh local Nodev24.19.0 verification:89tests passed,0failed,0skipped,0cancelled. The seven focused test files plus farmer3d.test.mjs,live3d.test.mjs,scene-polish.test.mjs and versions.test.mjs ran together. Four runtime modules passed node --check. Source/module and fixture checks are not actual browser or device evidence. Exact-head hosted checks are pending at this candidate record and must be inspected before merging.

## Preserved boundaries and evidence

All paths not in this focused change retain current-main blobs. game.js,auth.js,Firebase,save formats,cloud conflict behavior,economy,controls,animals,assets and the unrelated root app are unchanged. New source files are recovered from a hash-verified export, not a recovered original Git history. Current main and its later visitor/audio fixes remain the base; no whole archived tree replaces main.

The cloud preview failed before any game request with ERR_BLOCKED_BY_CLIENT, followed by a browser URL-policy denial. Its error tab and server were stopped, no screenshots were produced, and all350 source hashes remained unchanged. That failure is not visual validation. The subsequent PC transfer did not produce reviewed live screenshots. Prior accepted visual evidence remains distinct from this unreviewed publication.

Known broader integration CPU/GPU failures (including the reported approximately+9.11% GPU result versus5%), other phase failures/control drift, reference/reference pixel variation and six unqualified views remain unresolved. These are not attributed solely to the normal optimization, and this publication does not clear them. No performance improvement is claimed. The recorder remains shelved and BLOCKED with its eight findings and capacity/native-behavior gaps preserved. No recorder launches, recorder fixes or benchmark are part of this change.

## Publication and rollback

Use the existing main/root Pages route; no hosting/security/account settings changes. Pin the PR head in the merge request and verify main did not move. Record the resulting merge commit, exact deployed head and Pages result before claiming the live game updated. Full release remains unapproved.

If the owner rejects the outcome, revert only this merge with the first-parent main baseline as the reference; preserve commit history and all evidence, and inspect newer main changes before applying the revert. Do not force-reset main. A code revert does not undo player save writes or guarantee that an offline cached page refreshes immediately. Do not tell the owner to clear app/browser storage.
