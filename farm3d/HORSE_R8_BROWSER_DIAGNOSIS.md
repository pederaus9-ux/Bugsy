# R8 browser stall — bounded diagnosis and phone preview

Integrated main re-fetched unchanged: `205b25db0aab877aa6cf9a40adcbc766640c78cf`. Candidate before this documentation checkpoint: `9d9312171f5ae3af15343889e79e6c62f1bf70b9`. No production code changes in this diagnosis.

## Verified

- Earlier unchanged regression.browser.cjs failed on both main and R8 at the same 30-second walking-button click after successful farm boot.
- New isolated diagnostic on main uses the existing `?testfarm&debug&shot&sim=0` fixture, waits for snapshot completion, applies the same quiet/events/shadow settings as the original regression, then executes the unchanged `#walkBtn` locator click and waits for the real walking state. PASS; browser errors empty. Snapshot mode intentionally stops the animation loop.
- Second isolated diagnostic on main uses `?testfarm&debug&portrait`, leaves the continuous simulation loop enabled, and replaces only renderer.render with a no-op in that temporary browser page before the same click/state check. PASS; browser errors empty. This deliberately changes diagnostic drawing, so it is not a passing visual or full gameplay regression.
- /dev/shm inspection showed 4.9 GiB available and zero usage at inspection; no evidence of a full shared-memory filesystem.

## Interpretation

LIKELY: drawing load in this local SwiftShader environment is involved in the action stall. The successful drawing-suppressed diagnostic narrows the cause beyond horse motion and confirms the button/state transition can work on integrated main.

UNKNOWN: exact GPU/compositor bottleneck, contribution from Playwright action scheduling, behavior on hosted CI and real devices. Snapshot mode also changes fixture setup; therefore frozen-only success would not isolate drawing by itself. No claim that the original regression is cleared or irrelevant.

The original full-render tests and thresholds remain unchanged. Production drawing is unchanged. The shed panel assertion and final cow-preview navigation timeout remain separate unattributed failures.

## Authentic private phone preview

Deployment SUCCEEDED for source commit `0b9e2aa6d719da5d6408800fdcf564304eb8f92c`.
Site: `appgprj_6acb7e64bc90819187da2ab652acbb37`.
Saved version: `appgprj_6acb7e64bc90819187da2ab652acbb37~appgver_1faad5cbd7288191bbeccf925bf4bb69`.
Deployment: `appgdep_6acc17c36818819180d564293752e402`.

https://sunny-acres-horse-r8-review.ardentanole10.chatgpt.site/farm3d/?testfarm&perf

All402 tracked farm files were byte-compared with candidate9d93121 before packaging: zero mismatches. Separate landing page identifies the candidate. Existing owner-only audience preserved. Only the private preview source was pushed; Bugsy was not pushed or merged. Hosted Bugsy CI was not dispatched.

The existing optional `?perf` monitor shows FPS and median/p95 frame time over rolling windows. It does not save or upload measurements. Test farm avoids saving farm progression. Deployment/source validation does not establish phone performance or full live-browser acceptance.

Owner device check: use the same phone and selected graphics quality; walk/run/stop/turn and move the camera for at least five minutes. Record phone model, quality, FPS and p95 frame time during a busy scene, and visible pauses or input lag. Those are observations, not automatic release acceptance. Thermal/long-session qualification still requires broader device evidence later.

## Next action and stop condition

### Subsequent isolated browser validation

The original full-render regression completed sequentially with no concurrent browser suites:50 passing checkpoints, exit0, no timeout/assertion/screenshot warning in its log. Both main and the current candidate passed all three shed-touch viewports. The cow browser suite also passed all original checks and exited0, including final1280 preview navigation; one cleanup screenshot timed out at15s in the unchanged harness. The original failures remain recorded above as history, not current reproduced functional failures.

These results support the local competing-render-resource hypothesis but do not prove it or guarantee recurrence is eliminated. Functional gates pass on this isolated run; cleanup screenshot completeness and hosted exact-head results remain limitations. No production renderer, test timeout or threshold was altered. See R8_INTEGRATION_REVIEW.md for the current review state.

### Owner phone observations received

Two visible screenshots of the performance meter were supplied by the owner on2026-10-11. The second was accompanied by "Played longer this time". Exact elapsed session duration, phone model, temperature, active refresh rate and control smoothness are not confirmed. The local attachment-path error does not prevent reading the images displayed in the conversation; these numbers are transcribed from those visible images.

| Metric | First screenshot1791760627489.jpeg | Later screenshot13643.jpg |
| --- | ---: | ---: |
| FPS, last1s | 105.4 | 60.3 |
| Frames, last5s | 552 | 300 |
| Median frame time | 8.3ms | 16.7ms |
| p95 frame time | 15.2ms | 20.5ms |
| Worst frame, last5s | 27.2ms | 25.7ms |
| Draw calls | 603 | 549 |
| Triangles | 1189519 | 1186841 |
| Geometries/textures | 263/100 | 276/123 |

Both screenshots report scale100%, renderDPR2.0, viewport780x360, deviceDPR4.0, shadows2048x2048, bloom and tilt on, classic mode. They show different farm views and game activity, so this is not a controlled A/B comparison. Geometry/texture increases alone do not prove a leak.

VERIFIED: later captured rolling window runs near60FPS; its p95 exceeds the16.67ms frame budget corresponding to60FPS. These are short rolling windows captured after longer owner play, not a continuous session trace.

UNKNOWN: cause of the change (scene load, adaptive display/browser frame pacing, thermal behavior or other factors), actual input responsiveness, long-session stability and contribution of horse updates. Do not attribute this drop to the cache or declare a failed device gate from these images alone. Owner positive earlier visual feedback remains separate from these measurements; no new visual or merge approval inferred.

Smallest device follow-up: confirm control responsiveness and compare the same stationary scene before/after interaction if needed to distinguish a refresh-rate change from load. Preserve graphics settings; do not cut quality based only on these two snapshots.

Collect actual phone measurements from this exact preview; retain all numerical/cache evidence. Obtain owner direction before hosted CI, and resolve remaining browser failures without disabling rendering or loosening tests. Do not merge without explicit owner approval. No new animal phase or optional polish.
