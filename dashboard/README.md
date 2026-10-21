# Sunny Acres build command center

The existing `index.html` visual design now uses `dashboard.mjs` for public,
read-only GitHub evidence. It requires no account, token, browser storage,
dependencies, or build step. Serve this directory over HTTP; ES modules do not
run reliably from `file:` URLs.

## What the board reports

- An owner overview first: What is live (unknown unless verified), Current work,
  Blocked / needs attention, and Next step. Failure counts and freshness warnings
  stay visible. Larger phone text and a single overview replace competing metric
  cards. CI/jobs, revision IDs, open PRs and release evidence use accessible
  disclosures below, and the CI shortcut opens the relevant disclosure.
- Live open work, CI runs/jobs, release evidence, and a sourced manual
  roadmap. The default is the most recently updated Sunny Acres work PR, excluding
  dashboard work when another relevant PR exists. `?pr=92` or `?pr=main` pins a
  selection in a shareable URL.
- Full main and selected-head SHAs. A PR merge-test SHA is shown only after its
  commit parents match the current PR head and base. Unverified merge evidence is
  never credited to the PR head.
- Every returned workflow, including dispatched diagnostics. Queries are scoped
  by exact SHA, with 50-run pages and explicit next-page buttons. The summary uses
  the newest loaded run per workflow, event, and revision; older runs remain in a
  disclosure. GitHub's filtered-search cap is 1,000 runs. External checks and the
  repository's complete required-check policy are not inferred.
- Latest attempt per run, links to previous attempts (five inline, with older
  attempts on GitHub), estimated run durations, and attempt-specific job links and
  durations. Failures sort first. One failed run's jobs load automatically; other
  jobs load on expansion, 100 per page with explicit pagination. A failed job fetch
  remains visibly unavailable while successful run evidence is retained.
- Current-main integration runs are separate and exclude `pull_request` events.
  Deployment evidence is the latest API deployment record/status among up to ten
  records for that main SHA. This does not verify currently served bytes, all
  environments, or owner acceptance. Owner approval remains manual/unknown.

Times are UTC. Each source retains its own fetch time and errors. A failed refresh
preserves previous evidence for the same revision and marks it incomplete. Changing
revisions clears that revision's prior evidence. Data older than 15 minutes is
marked stale, including in copied status text.

Auto-refresh only starts while the page is visible, every 15 minutes. Errors back
off to 30 and then 60 minutes. HTTP 403/429 responses honor retry/reset headers.
The page caps requests at 40 per rolling hour **per page session**; reload starts a
new session, while GitHub's shared unauthenticated IP limit still applies. Manual
full refreshes require 45 seconds between attempts. Jobs and pagination share the
same request budget. No mutation endpoints, token entry, credential storage,
merge/rerun/cancel controls, or third-party scripts are used.

GitHub endpoint contracts: [workflow runs](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository),
[attempt jobs](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt),
and [deployment statuses](https://docs.github.com/en/rest/deployments/statuses#list-deployment-statuses).

## Verification and local preview

From the repository root, using existing Node 22+ and Chrome:

```powershell
node --test dashboard/dashboard.test.mjs
node dashboard/browser.test.mjs ../dashboard-evidence
node dashboard/browser.test.mjs ../dashboard-live-evidence --live
node dashboard/browser.test.mjs --serve 4173
```

Open `http://127.0.0.1:4173/dashboard/`. The preview binds only to localhost. The
browser harness uses an isolated temporary profile and the installed Chrome
DevTools protocol. Set `DASHBOARD_CHROME` to a different installed Chrome executable
if needed. Nothing is installed. Test browser processes stop after qualification;
the explicit `--serve` mode stays running until stopped.

The deterministic browser scenarios cover successful, active, failed, cancelled,
skipped, unknown and empty evidence; stale head/merge commits; attempts and direct
job links; partial run/job errors; pagination; rate limits; offline refresh;
selection changes; deployment/approval separation; copy fallback; hidden-page
refresh; and 320/390/1440px layouts with keyboard focus. Fixture screenshots are
separate from `--live` captures. The live mode records actual GitHub data and does
not assert that project CI has passed.

This is a dashboard-only change based on `fe7af2bae8da8ab18497153965a31e53d4377b4a`.
No game, workflow, security, credential, relay, or previously frozen evidence files
are changed. The owner handoff roadmap is explicitly historical as of 21 October
2026; the actively changing chicken PR is read from GitHub. Implementation and
adversarial self-review are by the same author. Physical-phone performance and
screen-reader use have not been tested; browser rendering uses emulated sizes.
