# A28 private publication and GitHub blocker

Owner approved upload of tested checkpoint `888383b082eb5d83dda6f274a86e267ee5071b9a`, update of the existing private phone Site, and hosted verification at 18:41:53 UTC, Sentinel_546671e735f0819197f3d7dd95bfdc3e ("Okay"). No gameplay expansion, main change, merge or live-game deployment.

## Delivered

Existing owner-private Site **version 5** successfully published through the installed Sites source helper and native private-deployment operation:

https://sunny-acres-phone-test-20261023.ardentanole10.chatgpt.site

- Site: `appgprj_6adb7f0aa0388191aa0ddab595515d06`; access revision 1, exactly the owner, zero groups/external visitors. Sharing unchanged.
- Site source: `94b6e9cbf8014c3e1427fa2d5441af124dc87872`; native deployment `appgdep_6ade504584cc8191af51119d433c307c` succeeded.
- Game source checkpoint: `888383b`; runtime `bcb7c0c`. Original game worktree runtime hashes remain exact.
- Supported helper archive: `C:\Users\peder\Documents\Codex\2026-10-22\task\SunnyAcres-a28-site-20261025.tar.gz`. Candidate: sibling `SunnyAcres-preview-a28-20261025`; Site checkout: sibling `SunnyAcres-phone-preview-sites`, clean at the Site source above. No second Site or duplicate deployment.
- `publication.json` records exact deployment/source IDs, local archive checksum and native stored-tar receipt separately. Their container hashes differ; do not claim byte-identical containers. A subsequent direct hosted comparison verified **all 115 static assets plus preview-build.json** against the generated files.

Generated preview-only changes remain explicit: auth is an inert stub, real backup/file/code/2D imports are disabled, new test data is seeded only if this dedicated origin has no test save, CSP permits only same-origin connections, and service-worker registration is disabled. Every shipped JS/HTML was scanned for production Firebase/SDK/webhook endpoints; none remain. No real farm or credential was uploaded. The original source contains the production runtime normally; it is not the private-preview auth/import behavior.

One preview-only usability correction was necessary: the disposable-save notice covered native Animal pens entry in landscape. Its generated CSS now hides it in `body.editing` as well as `body.pen-editing`. This changes only generated index.html, not the tested game source. The original failure is retained in `local-first-failure.json`; `preview-build.json` records this additional transform.

## Verification and limits

`local/results.json` and `hosted/results.json`: six groups PASS — exact source manifest/critical assets, game34 and isolation, native landscape editor entry, rejected stone-path placement plus exact Cancel, supported west-boundary Apply/reload, preserved coins/animal count, no page errors or production requests. The edit itself uses the existing editor API fixture; entry uses real button clicks. This is local Chromium viewport emulation, not an actual phone. Preview seed has its normal small herd, not 46-animal qualification.

`hosted-assets/results.json`: 116 served files verified. Cache file v74, game34, auth20 stub and restore helper1 are accounted for. The preview deliberately does not install a service worker, so this is not a hosted offline-worker transition claim. Original A28 installed v73-to-v74 tests remain local evidence. Real restore/cloud fault paths are intentionally unavailable in the preview; their qualification remains the local disposable/emulator evidence, not hosted CI.

Retained harness/setup findings:

- The new smoke initially queried visibility of a zero-height wrapper with fixed-position children. Corrected to assert the actual visible section, wrapper presence and editing state; no game change. `local-host-wrapper-fixture-failure.json`.
- A proposed whole-pen +1m move correctly failed on the stone path. This remains a negative control; the positive fixture is the already-qualified x=-37m west-boundary expansion. `local-stone-path-refusal.json`.
- A Windows terminal CR input was initially not consumed; the owned waiting process was stopped before any browser test, then the parser was corrected to accept CR/LF.
- Sites canonically redirects index.html to the same-origin root. Cloudflare then adds one JSD script to HTML. The entire original page is byte-exact after extracting only that captured insertion; only its request/time fields vary. Three controls reject original-page edits, extra scripts and changed injection implementation. This is test comparison only; no security configuration or delivered script was altered. See `hosted-canonical-redirect.json`, `hosted-html-wrapper-failure.json`, `hosted-root.html`, `html-controls.json`. Authoritative context: https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/ .

## GitHub: upload not completed

One normal push of exactly `888383b` was attempted after checking clean state and ancestry. Sandbox DNS failed; the permitted network route resolved GitHub normally. The remote preview branch was and remains **`4c3335ac80393aaf261ebac87a5c3da062982ba7`**; main remains `1115f93101a0e86fdcc9780e053c17b73dd6dac5`.

The incoming 64-commit history contains exactly three blobs above GitHub's 100 MiB limit. All are under `farm3d/tests/evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/`:

| Relative archive | Bytes | MiB |
| --- | ---: | ---: |
| assembly-4242-120/three-night-assembly-4242-120-failure.zip | 106500924 | 101.57 |
| boundary-4242-120/three-night-boundary-4242-120-failure.zip | 173171586 | 165.15 |
| gate-1-120/three-night-gate-1-120-failure.zip | 164906469 | 157.27 |

Exact Git blob IDs and SHA-256 hashes are in `publication.json`. The packing/HTTP processes showed byte advancement; this was not an unexplained stall. After identifying the hard limit, only the verified upload transport was stopped. `send-pack: unexpected disconnect` was this cancellation, **not a claimed server rejection**. Remote state was checked afterward. All local files/history are intact. No unchanged retry, force-push, LFS change, billing or evidence deletion. Policy: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github . Size preflight should have preceded the transfer.

## Read-only publication proposal — not implemented

Prepare a separate publication branch/worktree from remote `4c3335a`, leaving this original branch/history untouched. Copy the exact `888383b` game source and all small tests/evidence. Verify every retained source blob against `888383b`; include a provenance manifest with its original commit/tree and the three archives' paths, sizes, Git IDs and SHA-256 hashes. Keep the original ZIPs independently retained at their current local paths, and obtain approval for a separate artifact upload/location before describing their remote backup as complete. No LFS billing is needed for this proposal.

That publication copy would intentionally have a **new commit and full-tree ID**, never masquerade as `888383b`. Runtime source identity can remain exact; the entire historical tree cannot remain identical while omitting those Git blobs. Do not implement omission, branch creation or a new upload until the owner approves this packaging decision. If the owner requires all raw evidence remotely at the same step, approve the artifact destination first (or explicitly approve lossless split-archive storage plus reassembly verification).

Compatibility caveat: `animal-pen-cache-v73-to-v74.browser.cjs` serves predecessor `1e6dd960...`; v72-to-v73 serves `268d3100...`. Both are in the unpublished history. A clean publication branch alone does not provide those commit objects. Before running these unchanged cache tests from a fresh hosted checkout, preserve/export their exact predecessor inputs with checked hashes and approve any precise fixture/harness mapping needed. Do not alter their assertions or silently substitute the new parent. Current helper/restore/conflict tests read current files and do not depend on these predecessor SHAs; the existing release-qualification workflow can run conflicts on a supported published ref. No workflow was changed or dispatched here.

## Owner phone check and remaining gates

Open the existing link while signed into the owning ChatGPT account. Keep the old disposable test farm or use Reset test farm if desired. Check landscape and portrait Edit > Animal pens entry, move/reshape a supported pen, Cancel, Apply and online reload. Check that compact options leave the ground visible and report major control/care glitches. Real cloud saves/imports and offline worker installation remain disabled here.

Current-phone acceptance and performance remain pending. Official exact-source hosted CI is blocked by repository publication; this Site smoke is not CI. A26 care/wake coverage remains 1/30, historical/deferred REDs stay unchanged, and no full-game scan was resumed. Fresh owner merge/live-deployment authority remains absent. All owned verification/upload sessions finished; no further remote action is running.
