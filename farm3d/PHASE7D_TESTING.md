# Phase 7D — automated regression testing and CI

Base: merged main `a26fb18292336a4d4b8bf370c28d658287939cb2` (PR #27).
Branch: `codex/sunny-acres-regression-ci`. Owner authorization: "good continue"
after the live shed-fix retest instructions.

## Result and scope

The previously local smoke checks are now a portable, committed browser suite,
expanded to cover the complete farming loop at both phone landscape sizes and
desktop. The existing performance unit tests and shed touch regression run with
it through one `npm test` command. See `tests/README.md` for coverage and setup.

The game retains its handwritten browser-module architecture. npm/Playwright
are confined to `farm3d/tests/` and are not imported by the game. Production game,
save, rendering and cache files are unchanged; no release-version bump is needed.
The one necessary file outside `farm3d/` is the GitHub Actions workflow under
`.github/workflows/`. The old `/farm` and unrelated root application are untouched.

## Repeatability and evidence

- Complete local `npm test` passed using the clean installed dependencies and
  Chrome: 50 regression checkpoints, six performance unit tests and three shed
  viewport runs. No page, console or local-resource errors were recorded.
- Playwright 1.62.1 is pinned with an npm lockfile and matching Chromium install.
  The lockfile was verified with a clean `npm ci --ignore-scripts`.
- Sequential browser sessions use isolated storage and an ephemeral localhost
  port. External endpoints are intercepted; there are no cloud writes or secrets.
- Checks use the actual UI with prepared debug fixtures. Ripe crops and known
  inventory avoid waiting for growth or relying on random order generation.
- Movement waits for rendered frames. Interaction checks require exactly one
  cleared crop, inventory reward and harvest count; moving crop geometry can make
  a separately sampled ray point at a neighboring crop between aim scans.
- Leaving a normal page can legitimately update `lastSeen`; the sandbox test
  preserves every other saved field across navigation and then requires the
  complete saved JSON to remain unchanged during sandbox planting/saving.
- The broad browser suite keeps ordinary 3D rendering active. The focused shed
  check retains its documented static-scene touch fixture.
- Screenshots and JSON summaries are saved locally and uploaded by CI. Failures
  also produce Playwright traces; failure screenshot/trace generation was observed
  during test development. The suite has no automatic retries.

## CI and next gate

The workflow runs on every PR to main and on game/workflow pushes to main. It
uses read-only repository permissions, a 20-minute timeout and seven-day artifact
retention. Its check is named `Farm3D regression`. Hosted Linux runs must be
observed on the PR before calling CI validated; repeated hosted green results
are needed before recommending it as required.

No branch protection, repository permissions or deployment settings are changed.
Normal guest/local-save behavior is covered; live login/cloud/social behavior,
actual service-worker updates, Safari/iPhone and real-phone thermal/performance
remain separate integration/manual checks.

Stop for owner review and merging of the Phase 7D PR. Phase 7E (cow, chicken and
farmer locomotion prototype) requires a separate go-ahead and human visual review.
