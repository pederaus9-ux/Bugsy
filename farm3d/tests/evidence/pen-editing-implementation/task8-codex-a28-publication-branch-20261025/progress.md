# A28 separate publication branch

Owner approved this packaging/upload at 19:22:14 UTC (Sentinel_bc5790ce45d08191bd95ef5b22d4861e). Acceptance and pre-edit hashes preceded the three test-only source-mapping edits. No runtime, assertion, tolerance, seed or deadline change.

## Source and evidence

Branch codex/a28-publication-20261025 starts at verified remote 4c3335a, not the unpublished original ancestry. Runtime is byte-identical to tested 888383b across all121 static game/asset files. All4056 unchanged retained prior files also match 2deffa9. Three harness files differ only by the invertible source resolution/explicit historical target mapping documented in harness-scope.json.

Only three trace archives over100MiB are excluded from this new publication tree. All remain in the original clean Bugsy-safe-preview worktree and its original Git history. provenance.json records exact original commit/tree IDs, archive paths, byte sizes, SHA-256 and Git blob IDs. This branch has a new full tree/commit identity; it does not claim to recreate the entire original tree or remotely back up those three archives.

Three exact historical source snapshots preserve360 file inputs from268d3100 (v72),51bcd0f (the originally tested v73 target), and1e6dd960 (v73 predecessor ofA28). Lossless content-addressed gzip deduplicates them to128 blobs. Each decoded file is checked against original Git blob ID, SHA-256 and length. No unpublished Git object is needed to serve these snapshots. Current-v74 reads still use the publication Git HEAD. Registered corrupt/missing snapshot input fails closed; it cannot silently fall back to another source.

## Bounded verification

- Source equivalence/inverse mapping PASS; source-equivalence.json.
- Five snapshot control groups PASS: all360 byte checks without historical Git lookup, immutable buffer copies, missing-file/path rejection, exact current-ref lookup, and four deliberate corruptions (bytes/length/blob/identity). snapshot-controls.txt.
-49 unchanged focused restore, save, transaction, integration, SDK/version checks PASS; focused.txt.
- Installed v72-to-v73 historical transition PASS: saved custom pen, distinct worker, exact cached bytes, foreign-cache preservation, online and offline reload. cache-v72-v73-permitted/results.json.
- Installed v73-to-current-v74 PASS with the same invariants; cache-v73-v74/results.json.
- The first restricted Chromium launch failed before any journey (crash-server named pipe); evidence retained under cache-v72-v73. The same existing binary/harness passed through permitted execution. No browser download or sandbox/security configuration change.
- Incoming object preflight PASS: zero blobs over100MiB. Largest97,874,190bytes; eight blobs exceed50MiB but remain below the hard limit. About1.35GB uncompressed incoming blobs, including all other retained evidence. No unchanged retry of the old unpublishable branch.

These are local isolated Chromium/disposable-save checks, not official hosted CI or physical-phone acceptance. No new care/wake result: A26 remains1/30 and all historical/deferredREDs remain. No whole-game scan.

## Publication and remaining gates

The approved new-branch upload follows the final object/remote preflight. Exact upload outcome and remote SHA will be recorded separately. Existing preview branch4c3335a, main1115f93 and owner-private Sitev5 must remain unchanged. No force-push, merge, live deployment, Site update, credentials or production Firebase change.

After upload: official exact-source hosted qualification, current-phone review/performance, and owner release/merge decisions remain. The three omitted raw archives have local/hash-verified preservation, not independent remote backup. Snapshot README contains the reproducible cache-test commands.
