# Stale target guard correction

Base: main `d0407833d98bde01841ea8df9d92164a51bd5667`. The isolated review branch
incorporated this base through a normal history-preserving branch update. The PR
diff against it remains entirely under `dashboard/`; game and workflow bytes
match main. No reset, force push, timeout change, or workflow rerun was used.

The reproduced defect was a PR API response whose base still reported
`fe7af2b`, while current main was `d040783`. The old merge commit's parents matched
that stale PR snapshot, so the old guard accepted its results. The new browser
regression failed against the original guard with **3 passed versus expected 2**.
The corrected guard checks the independent fresh target and performs a final
reference read after evidence collection. Movement or failed verification makes
merge evidence unavailable and clears cached merge passes; source-head results
remain separate. Non-main targets are checked independently.

Focused validation:

```text
node --test dashboard/dashboard.test.mjs             11/11 PASS
node dashboard/browser.test.mjs ../guard-final-evidence  27/27 PASS
node --check dashboard/dashboard.mjs                 PASS
git diff --check                                     PASS
```

Cases include stale base without requesting its merge runs; movement during
refresh; clearing previously valid cached merge passes; failed initial/final main
fetch; stale cached main; inverse race and consistent recovery; another target
branch; and all existing status, attempt, pagination, offline, accessibility and
layout cases. No existing assertion or tolerance was weakened. Full local logs
and 320/390/1440px captures are retained in the isolated task's
`guard-red.log`, `guard-final.log` and `guard-final-evidence/` paths.

## Preserved original hosted result

The [original run 39607180180](https://github.com/pederaus9-ux/Bugsy/actions/runs/39607180180)
on head `92698cf8392652e3d0c6aa873cc39322317b66ba`, attempt 1, ended at
2026-10-21 13:42:24 UTC: **15 successful jobs, one cancelled job**. The emulator
job succeeded. No complete regression-suite pass is claimed.

[Regression job 119246284966](https://github.com/pederaus9-ux/Bugsy/actions/runs/39607180180/job/119246284966)
ran from 13:20:48 to 13:41:05 UTC. Its annotation states: "The job has exceeded
the maximum execution time of 20m0s". It was still executing
`settings-motion.browser.cjs` when cancelled. Earlier regression, shed-switch,
cow3d and cow-anatomy browser children ended with code 0. No assertion-failure
record was found before cancellation; the unfinished suite remains unqualified.
The original log and terminal JSON receipt are preserved outside the repository
as `pr93-regression-job-clean.log` and `pr93-final-ci.json`.

Current main already contains the independently merged split Node/browser core
jobs. Publishing this guard correction starts normal CI on the refreshed branch;
it does not rerun the unchanged cancelled job. No merge or deployment of this
dashboard is authorized by these receipts. Earlier screenshot evidence is
unchanged. The Library screenshot upload route remains stopped after preparation
failed; no Library file IDs were returned.
