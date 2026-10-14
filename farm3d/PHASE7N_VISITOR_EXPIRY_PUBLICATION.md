# Phase 7N visitor-expiry patch publication, 2026-10-14

**PR82 is merged and the approved expiry guard is live. Exact-main Regression206 passed all seven jobs; Pages79 and Pages80 succeeded; five live static responses match the merged source. Automatic Regression205 was cancelled by existing concurrency after an unnecessary manual dispatch; its full receipt is preserved. This completes the bounded patch, not a broader game release.**

## Authorization and guarded merge

Owner approved merge/publication at 2026-10-14 13:26:12 UTC ("Yes merge"). Final preflight verified reviewed head **`1d2343b5c69dd2f5b3a907d82566625598979c59`**, unchanged base **`e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`**, all eight exact-head checks successful, clean mergeability, zero review submissions/threads and an active supported merge method. Existing Pages source was still legacy `main`, path `/`, normal HTTPS; no route/settings/access change. [Preflight/merge receipt](tests/evidence/phase7n-visitor-expiry-publication/preflight-merge.json).

PR82 was marked ready, then its head/base/eligibility checked again, and merged through the supported merge-commit API with expected-head guard. [PR82](https://github.com/pederaus9-ux/Bugsy/pull/82) merge is **`d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`**, parents base above and exact reviewed head. Tree **`05ac4ee6c3ff982ba2e8925d68fd5077667d058f`** equals the tested candidate. Merge was performed once; GitHub state was checked after a transient executor notification before any further action.

Local executor responded, preserved the clean checkout and switched only to separate `codex/phase7n-visitor-expiry-publication`. The single-branch clone's original fetch mapping updated FETCH_HEAD but left origin/main stale; an explicit main-to-origin/main tracking fetch corrected only that local tracking ref. No config/security change or local branch reset. [Completed pre-merge review](https://github.com/pederaus9-ux/Bugsy/blob/add23d8ce78fab18b74c2d70a4720854f0f48b35/farm3d/PHASE7N_VISITOR_EXPIRY_FIX.md) credits nine local PASS, Regression204 all 7 and conflict qualification3 SUCCESS.

## Publication and post-merge CI: all outcomes retained

Initial GitHub/CLI reads showed no runs for the merge and Pages' latest build still at old base. Automatic events later appeared. I should have refreshed the run/build list immediately before requesting the existing manual routes. One manual dispatch of the unchanged regression workflow and one request of the configured legacy main/root Pages build were sent, within the owner-approved publish/verify scope. [Full reconciliation](tests/evidence/phase7n-visitor-expiry-publication/dispatch-reconciliation.json).

| Run | Event/result | Exact source |
| --- | --- | --- |
| [Regression205](https://github.com/pederaus9-ux/Bugsy/actions/runs/38572874381) | Automatic push; CANCELLED by existing cancel-in-progress concurrency after 206 dispatch. All seven job cancellation receipts preserved; no successful 205 claim. | merged main above |
| [Regression206](https://github.com/pederaus9-ux/Bugsy/actions/runs/38573086601) | Existing workflow_dispatch; SUCCESS, all 7/7, attempt 1. Selected full post-merge verification. | merged main above |
| [Pages79](https://github.com/pederaus9-ux/Bugsy/actions/runs/38572873804) | Automatic build/deployment SUCCESS. | merged main above |
| [Pages80](https://github.com/pederaus9-ux/Bugsy/actions/runs/38573101602) | Requested existing Pages route; build/deploy/report status SUCCESS, attempt 1. Same source, no new runtime content. | merged main above |

[Terminal full verification receipt](tests/evidence/phase7n-visitor-expiry-publication/post-merge-ci.json). No additional dispatch/rerun, retry, rollback, workflow/test alteration or lowered criterion followed reconciliation. The duplicate initiation is an operational diagnostic; it is not hidden or credited as a successful automatic 205 check. All seven gates completed in 206. Existing hosted-runner dependency setup is separate from installations on this PC.

| Regression206 job | Terminal result |
| --- | --- |
| Anonymous analytics + owner dashboard | SUCCESS |
| Mobile accessibility + motion + focus | SUCCESS |
| Farmer + first-person + visual polish | SUCCESS |
| Six-species animal visual review | SUCCESS |
| Old saves + save measurements | SUCCESS |
| Firestore rules + economy functions + game flows + save recovery (emulator) | SUCCESS |
| Farm3D regression | SUCCESS |

[Pages latest-build API receipt](tests/evidence/phase7n-visitor-expiry-publication/pages-latest-build.json) reports `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`, status built, error null, updated at 13:36:43Z. The route remains the existing public main/root GitHub Pages site; no Firebase/rules/settings publish occurred.

## Live verification actually performed

At **2026-10-14T13:38:19.615Z**, five fresh anonymous static GETs used normal TLS, no-cache request header, no redirects and 20-second bounds. Plain game.js, actual page-declared game.js?v=25, game page, worker and page-declared auth.js?v=19 all returned HTTP200, appropriate MIME and exact merged Git SHA256 bytes. No JavaScript executed and no player/account/analytics data was accessed or written.

Both game responses are 152,426 bytes, SHA256 **`9a20b80f0e491d976cfe26f1163658f98c30e2f493550429a2ab5d3c9adc91f4`**. The served module includes the approved `v.end <= now()` visitor condition and both preserved audio visibility statements. Page/worker/auth controls retain merged bytes. [Live receipt](tests/evidence/phase7n-visitor-expiry-publication/live-verification.json), [exact imported response headers](tests/evidence/phase7n-visitor-expiry-publication/imported-game.headers.json).

This proves served source identity. Nine local functional contracts apply through identical runtime blobs; no new phone round, installed/offline PWA-cache adoption, physical Safari/OS behavior, real 30-minute balance or sustained performance is claimed. No existing passing local/phone/rules qualification was repeated.

## Preserved scope and relay handoff

Only the already-approved visitor condition changes runtime relative to base; the published tree is exactly reviewed. Earlier audio patch and accepted animals, auth/rules/saves/economy, renderer/worker, all original tests/assertions and frozen failures are preserved. The original expired-visitor failure, native-Date confirmation, event-accounting diagnostic, earlier Node EAI_AGAIN/curl evidence, phone round and owner manual Firebase rules review remain credited. No unrelated workspace/project/FS25 or production data/security setting was changed.

Final publication/relay metadata is saved on a separate evidence-only branch, without another main merge or runtime change. [The record scope check](tests/evidence/phase7n-visitor-expiry-publication/record-scope.json) verifies that this branch changes only coordination documents and new publication receipts. Review remains ChatGPT/Codex self-review, not an independent external-agent audit.

- Approved PR head: `1d2343b5c69dd2f5b3a907d82566625598979c59`; base main: `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`.
- Merge/main: `d5ed6a96c50914320f30a7b74b799b7f66a9b6e0`; tree: `05ac4ee6c3ff982ba2e8925d68fd5077667d058f`.
- PR82 merged through expected-head guard; bounded patch live.
- Results: local nine PASS and pre-merge 204/conflict3 credited; post-merge 206 all 7 SUCCESS; 205 CANCELLED retained; Pages79/80 SUCCESS; live 5/5 PASS.
- Remaining patch blocker: none. No further approval is needed for this completed merge/publication.
- Stop this bounded task. Additional development or full release needs separate owner scope. Physical device/cache/performance/shared-account and broader balance/operational release limits remain open; no phone retest requested.

Publication record finalized at 2026-10-14T13:58:02.569Z.
