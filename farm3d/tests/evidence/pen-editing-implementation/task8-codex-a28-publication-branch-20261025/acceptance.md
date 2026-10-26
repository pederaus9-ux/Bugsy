# A28 separate publication packaging

Owner approval: Sentinel_bc5790ce45d08191bd95ef5b22d4861e, Yes at 19:22:14 UTC October 25. The parent asked to prepare, verify and upload a separate branch with identical tested game code, smaller evidence, preserved original history/all three large archives, provenance hashes and exact older cache-test inputs. No force-push, deletion, merge, live game or Site change.

Recorded before harness edits. Branch codex/a28-publication-20261025 starts at verified remote 4c3335ac80393aaf261ebac87a5c3da062982ba7. Source 888383b082eb5d83dda6f274a86e267ee5071b9a; later publication receipts from 2deffa95f92c4ab91be2860064dea5909ab774e6. Original worktree/history and large archives remain unchanged.

Acceptance:
1. Every game source and asset blob equals 888383b082eb5d83dda6f274a86e267ee5071b9a; all retained prior files equal 2deffa95f92c4ab91be2860064dea5909ab774e6 except this documented test-source mapping and relay updates. No test assertions, seeds, tolerances or deadlines change.
2. Only the three oversized raw trace archives are absent from this new publication tree. Record their exact Git IDs, SHA-256, bytes and original local paths; original files/history remain present. Do not imply remote archival backup.
3. Preserve exact static source inputs for v72 predecessor 268d3100, historical v73 target 51bcd0f, and v73 predecessor 1e6dd960, with original commit/tree/blob IDs and SHA-256. Content-addressed gzip storage is lossless. Registered snapshot corruption must fail closed, never silently fall back to a different source.
4. Test-only mapping: qualification-cdp.cjs reads registered immutable fixture inputs; two cache tests use the same resolver for expected-byte checks; historical v72-to-v73 selects its originally tested v73 target explicitly. v73-to-current still verifies the publication HEAD. Original assertion bodies remain exact. Add resolver corruption/path/unknown-file controls; preserve original files' hashes.
5. Run both installed online/offline cache transitions from this publication tree, and relevant unchanged restore/scope/version controls. Verify source identity and all incoming object sizes before the one normal new-branch push. Verify the remote result; no existing remote ref is changed.
6. No broader herd matrix, whole-game scan, phone acceptance or live deployment claim.
