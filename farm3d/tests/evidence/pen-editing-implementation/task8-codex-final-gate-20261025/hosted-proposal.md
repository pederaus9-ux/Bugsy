# Smallest hosted qualification amendment — proposal only

No workflow, test or runtime file was edited and no external job was dispatched.
Exact published9d1ce4d has zero Actions runs (all events queried), check runs and
commit statuses. Absence of CI is not a PASS; see ci-status.json.

## Existing supported route

`.github/workflows/farm3d-release-qualification.yml` already has
`workflow_dispatch`, contents:read, checkout with persist-credentials:false,
Ubuntu24.04, Temurin21, Node22, locked npm installation and pinned Chromium. Its
single current job runs `npm run test:conflicts` on demo-sunny-acres emulators.
The workflow exists in immutable default-main1115f931 as well as the publication
branch. A manual dispatch targeting the publication branch can exercise that
existing conflict job without a code/workflow amendment; it is not dispatched in
this task. Recheck the target SHA immediately before/after any later dispatch.

The old `cow-cloud-recovery-diagnostic.yml` runs only for pushes to
codex/cow-courtyard-20261020. `animal-pen-diagnostic.yml` does not exist. Creating
a new manual-only workflow solely on this feature branch would not solve default
branch discovery. GitHub documents that workflow_dispatch requires the workflow
on the default branch and allows selecting a branch for its run:
https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow

## Recommended one-file amendment

Change **only `.github/workflows/farm3d-release-qualification.yml`** on the
publication branch. Keep its original conflict job, assertions,20-minute timeout,
PR trigger and permissions unchanged. Add two jobs guarded by
`github.event_name == 'workflow_dispatch'`, with no production credentials/secrets:

1. **Targeted pen/cache** on a disposable Ubuntu runner: Node22;
   `npm ci --ignore-scripts` in farm3d/firebase and its locked Playwright Chromium
   install; set PLAYWRIGHT_MODULE to that installed package and CHROME_PATH from
   `require('playwright').chromium.executablePath()`. Run the49 already-selected
   restore/save/transaction/integration/version/SDK checks, the five snapshot
   resolver control groups, both installed v72→v73 and v73→current cache tests,
   and original animal-pen-three-night-extra-classes.browser.cjs with
   PEN_MATRIX_EDIT_CLASS=gate, PEN_MATRIX_SEED=1, PEN_MATRIX_RATE_HZ=120.
   Use separate TEST_ARTIFACTS directories, keep all original per-test limits,
   and a20-minute job cap matching the existing release runner. No other29-case
   matrix or whole-game scan. The unchanged49-check files are explicitly:
   restore-recovery.test.mjs, restore-recovery-scope.test.mjs,
   save-writer-compatibility.test.mjs, ordinary-layout-transaction.test.mjs,
   animal-pen-save.test.mjs, remaining-care-integration.test.mjs,
   versions.test.mjs and sdk.test.mjs (all under farm3d/tests).
   Resolver controls use qualification-source.test.cjs. Do not use a broad glob.
   The current local original gate journey now has a retained third-wake Cow1
   failure: all three beds and two wakes passed, but the whole journey did not.
   Keep that original check and failure visible; this proposal does not promise
   a green run or authorize skipping it. Impact classification is still open.
2. **Recovery/restore** on a separate disposable runner: same existing
   Node/Java/browser setup, only localhost Firestore/Auth demo emulators. Command
   from farm3d/firebase:

   ```text
   npx firebase emulators:exec --only firestore,auth --project demo-sunny-acres "node tests/recovery.browser.cjs && node tests/manual-restore.browser.cjs"
   ```

   Keep the existing27 recovery assertions and all three A28 manual-restore
   groups, SDK equality checks,30s recovery/25s import delays and60s manual
   settle limits. Use the existing recovery job's25-minute outer cap. The suites
   reset only their demo emulator state. No production project/login/rule deploy.
   The manual-restore test currently writes its fixed evidence path inside the
   disposable checkout: retain/copy the freshly produced manual-restore.json and
   restored.png as this run's artifacts, not a source commit or an overwrite of
   historical evidence in the repository. No test-path edit is required.

Both jobs should assert the checked-out SHA in their receipts, upload failure
evidence with `if: always()` and14-day retention, and preserve test exit codes.
Existing conflicts run on a separate runner, so localhost ports do not conflict.
No skipped/replaced assertions, extra runtime scope, broader permissions, permanent
PC installs or production networking/settings changes are part of this proposal.

**Approval needed:** that one named workflow amendment, its normal branch upload,
and one manual exact-branch run/inspection. A supported existing conflict-only
dispatch needs no workflow edit, but would leave the missing recovery/pen coverage
unresolved. Current instruction explicitly forbids all dispatches/uploads, so both
routes remain proposals, not executed work. If implementation reveals another
required protected change, report it rather than expanding this bundle silently.
