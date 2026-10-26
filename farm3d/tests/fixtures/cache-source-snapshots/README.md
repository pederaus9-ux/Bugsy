# Immutable cache-test source inputs

This publication branch intentionally does not include the unpublished original
commit ancestry. `manifest.json` preserves each original commit/tree ID and each
served file's original Git blob ID, SHA-256 and byte count. `blobs/*.gz` are
lossless, deduplicated contents; the resolver checks both hashes and length before
serving a registered snapshot. Missing or corrupt registered inputs fail closed.
These snapshots are not complete historical repositories or replacement saves.

The unchanged browser assertions exercise:

- v72 (`268d3100`) to the exact historical v73 target (`51bcd0f`) recorded in the
  retained passing receipt.
- v73 (`1e6dd960`) to the current publication HEAD's v74 source.

Set `CHROME_PATH` to an existing supported Chromium executable, then run from the
repository root (each `TEST_ARTIFACTS` destination should be new):

```text
node --test farm3d/tests/qualification-source.test.cjs
node farm3d/tests/animal-pen-cache-v72-to-v73.browser.cjs
node farm3d/tests/animal-pen-cache-v73-to-v74.browser.cjs
```

The browser harness uses a disposable profile and loopback server, isolates
external requests, and does not use real account/save data. No network dependency
installation is required for these two tests. Source mapping and its exact inverse
are recorded in the publication evidence; assertions and deadlines were not
changed. Historical failures remain in their original evidence directories.
