# Sunny Acres — R8 integration review

## Candidate and authority

Working branch: `codex/settings-motion-flash`, based on the locally validated R8 cache branch.
Main re-fetched unchanged: `205b25db0aab877aa6cf9a40adcbc766640c78cf`.
Runtime candidate reviewed in private phone preview: `e565ac4a8f578952cf36f4f654644fcaaacea130`. Later commits record evidence and owner feedback only. The test-runner change adds the already-passing settings-motion browser test to the existing sequential browser list.

GitHub search confirms separate open PRs34,37,54,60. No remote R8 PR currently exists. No other PR was changed. No Bugsy branch pushed, hosted CI dispatched or merge performed. ChatGPT/Codex is the sole active AI engineer under the owner instruction; this is an adversarial self-review, not independent external-agent review.

## Implemented scope

- Claude's R8 horse contact/support/turn planner and diagnostic tests, already independently exercised locally.
- Opt-in stance swing profile and re-aim helper; default minimumJerk remains. This file differs from main and must be disclosed in final integration approval.
- Bounded last-query reach memoization in horse3d.js: invalidate per update, retain identical miss arithmetic and all planner checks.
- Owner-reported Settings Motion flash repair: update controls in place and prevent replay of the open panel's entrance animation. Existing preference persistence and resolution semantics preserved.
- Add the new settings-motion browser regression to the core runner, keeping all old files, timeouts and assertions intact.

Protected production IK, anatomy/hip/sole geometry, gameplay root speeds/collision, cow and other animal implementations, Firebase/auth/cloud, economy/progression, farm-save schema, renderer interfaces, service worker and loader unchanged from integrated main. The Settings handler is a specific owner-reported UI correction, not general UI polish.

## Verified evidence

- Unchanged motion/contact tests11/11; both height matrices624/624 cells; independent45-session roaming and known/figure-eight/stop/reversal reproductions passed.
- Full output-trace comparison against unmodified R8:343/343 runs,159468 frames matched (selected-output bit hashes).
- Six-horse6x Chromium workload: result cache median5.4/p9510.1ms versus R8median6.3/p9514.2ms. Single emulated comparison, not physical-device FPS. Node case results mixed.
- Previously completed six-species isolated54 and actual-farm54 captures at each844/1280 viewport; cow anatomy16 views and rebuild/budget tests passed. Captured code, not generated imagery.
- Settings Motion test fails on original code, passes14 selections across two device-motion configurations on candidate; owner confirms "Fixed" on deployed phone preview.
- Owner phone screenshots: first105.4FPS/p9515.2ms; after longer play60.3FPS/p9520.5ms. Different farm views and short rolling windows; cause of change, exact duration, input responsiveness and thermal/long-session qualification are not established.
- Module/cache consistency tests5/5 passed. No service-worker change.
- Current controlled shed-touch suite: unchanged main PASS all740/844/1280 viewports; candidate PASS all three, both exits0. Earlier844 assertion failure remains preserved; it was not reproduced in these isolated runs. Do not label its cause proven.

## Current browser investigation

Earlier full-render click/navigation timeouts occurred while multiple software-browser suites were active. Two main diagnostics passed when animation was frozen or drawing was suppressed while the normal loop remained enabled. Those diagnostic changes were temporary page instrumentation, not production or test-runner fixes.

Current unchanged full-render regression and cow-preview suites completed sequentially with the original assertions, rendering and timeouts. This tests the specific competing-resource hypothesis:

- regression.browser.cjs:50/50 PASS checkpoints, exit0; no assertion, action/navigation timeout or screenshot warning in this run. Includes desktop keyboard movement/rotation/interaction and both mobile sizes, farming, orders, panel controls, guest/save reload and existing-farm preservation.
- cow3d.browser.cjs:all original farm/preview checks at740/844/1280 and optional comparison PASS, exit0. Earlier final navigation timeout did not recur. One cleanup page.screenshot timed out at15s and was caught by the existing unchanged harness. This screenshot failure is retained and disclosed; it is not proof that every artifact was produced.
- shed-switch.browser.cjs:main and candidate each PASS all three viewports, exit0.
- versions.test.mjs:5/5 PASS.

No test assertions, timeouts or rendering quality were changed to obtain these results. Functional browser checks now pass locally, with the cow cleanup screenshot limitation. Earlier failures are retained. Successful isolation supports but does not prove the competing-resource explanation. No random rerun loop is authorized.

LIKELY: local software-render resource pressure contributed to earlier action/navigation stalls.
UNKNOWN: exact underlying scheduling/compositor cause and recurrence on hosted CI/other devices.
The commit-workflow-run connector filters to PR-triggered runs; its empty response for main's merge SHA does not establish absence of main-push CI. Candidate hosted results remain unknown.

## Next bounded step

Owner update,2026-10-11 19:49 America/Chicago: ChatGPT may initiate reviews and hosted tests when ready, without asking again. Publish this reviewed candidate on a dedicated branch/draft PR and run exact-head hosted regression under that standing authority. This supersedes the original delivery's separate CI permission requirement, not merge authorization. If hosted results fail, capture the exact job/log/artifact and diagnose the first failure; no relaxed gates or blind retries.

No next animal phase, optional realism work, graphics reduction or release-complete declaration. Owner merge authorization remains pending.

## Publication checkpoint

Draft PR73: https://github.com/pederaus9-ux/Bugsy/pull/73
Remote branch: codex/horse-r8-validated-integration. Initial reviewed runtime commit12616357f277ce665aea4be6dec920e153bd6e9e, treec0884f3c9e2e424aeae0c1863693a1df9b54471e matches local source exactly. Hosted regression176/run38189640123 began automatically. This relay-only follow-up records the PR; hosted validation must correspond to the final current PR head, not the superseded publication head. No merge.
