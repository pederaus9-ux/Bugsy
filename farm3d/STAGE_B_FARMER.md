# Stage B farmer rebuild and independent QA gate

Base: PR #41, `019b9710568a05d45c8c60faecf8bbb030eea94b`.
Branch: `chatgpt/stage-b-farmer-recovery`. Owner: Build chat under the supplied Stage B handoff.
Muse Order 002 independently passed the farmer scope. The owner subsequently authorized full implementation ownership and continued work without the Muse approval gate on 2026-10-03. Merge remains conditional on required automated checks.

## Change and contracts

- `farmer3d.js`: one skinned visual with owned geometry and 15 independent bones; eyes, nose, smile, ears; eight preserved hair names and six preserved hat names; clothing and exposed skin use the selected colors. Hair crowns tuck under solid hats, with bun/ponytail/long/bob/braids retained behind/below them.
- Hip -> knee -> ankle solves a planted target, raises the swinging foot, and counter-rotates boots flat. Shoulders -> elbows articulate, with a timed interaction reach and an occasional outward idle wave. Distance drives cadence; invalid movement/teleports do not advance it.
- `live3d.js` forwards the existing walk phase/run values; `index.html` passes those values without changing speed, turning, collision, footsteps, camera movement, or action rewards. The interaction timer also runs when third person hides the mitten hands.
- Wardrobe rig replacement disposes geometry/skeleton/material exactly once. The fitting view renders the farmer last and clears depth for that draw, preserving self-depth while preventing foreground animals/bubbles from obscuring the model. Closing restores normal depth rendering. Selected skin/shirt also update first-person mittens.
- The five villagers retain their IDs/coats and use the same rig. Live visitors now face the camera with their actual face and use the idle update. The painted comparison path remains available.
- No new save fields: `game.js`, wardrobe mappings/categories/unlocks, `S.look`, upgrade/migration, auth, Firebase, economy, market, animal modules/AI, `/farm`, service-worker behavior/cache name, and root application are unchanged. The `index.html` edits are scoped to the authorized farmer/villager integration.

## Reproduction

From `farm3d/tests`, install the pinned dependencies, then run:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
node stage-a-live3d.browser.cjs
npm run test:saves
```

Local Windows used installed Chrome via `CHROME_PATH`, Node and the workspace npm runtime. Browser fixtures isolate external services, block service workers, use SwiftShader and reduced drawing-buffer resolution. These establish deterministic browser contracts, **not** S26 Ultra/thermal/battery acceptance or production cloud behavior. The existing hosted workflow runs real emulator tests separately; no Firebase production publish is part of Stage B.

## Evidence generated in `tests/artifacts/`

- `farmer-matrix-front.png`, `farmer-matrix-rear.png`: all 48 combinations.
- `farmer-skin-tones.png`, `farmer-gait-poses.png`: rendered tones and stride poses.
- `farmer-wardrobe-1280.png`, `farmer-wardrobe-844.png`, `farmer-wardrobe-390.png`: actual wardrobe at 1280x720, 844x390, 390x844, with framing checks against the visible sheet.
- `farmer-walk.png`, `farmer-first-person.png`: active game loop and hands.
- `farmer3d-results.json`, `farmer-walk-results.json`, `farmer-performance.json`: UI/save/gait/pet/resource evidence.
- Workflow artifact downloads also include existing regression/save screenshots and measurements.

Six targeted unit cases verify real first-visible face triangles over the entire matrix, selected skin on all exposed vertices, actual joint hierarchy/positions/flat soles, planted slip under 2 mm after settling at .5/3/5.4 m/s at 30/60 Hz, equal-distance cadence at 30/60/120 Hz, interaction/reset/teleport behavior, idle wave/head turn, independent villagers, idempotent disposal, and local fitting-material cleanup.

The browser checks exercise actual pointer/touch wardrobe opening, every category's options, level locks and reasons, rejected selections, rebuilding, closing, normal guest save -> hard reload, the shared five-villager rig, actual third-person gait phase, first-person mitten colors, and the real E-key pet action. The normal walking entry intentionally starts in first person; the fixture switches through the actual POV button before checking third-person joints. Pet setup uses noon, a calm actor and an asserted crosshair identity so weather/player reactions cannot invalidate the prepared target.

## Rendering tradeoff

Measured isolated farmer + five villagers at 640x360, shadows off:

| Metric | PR #41 baseline | Stage B |
| --- | ---: | ---: |
| Draw calls | 38 | 6 |
| Triangles | 3,116 | 22,564 |
| Renderer geometries (including shared internal resource) | 33 | 7 |
| Renderer textures | 7 | 7 |

The baseline fixture is the exact PR #41 source with only its import path relocated. Pose CPU timing and a warmed software-render sample are recorded per run in JSON. Their very small timings are illustrative, not hardware FPS claims. Thirty replacement/render cycles keep geometry/texture counts constant. Triangle count increased deliberately for faces/clothing/joints; Muse should assess the tradeoff and retain a physical-phone visual/performance follow-up if needed.

## Findings fixed during implementation

The new rig fixes the pre-existing hardcoded arm skin, generic hats, missing face, rigid limbs and missing live idle wave. Rendered inspection also found foreground wardrobe occlusion and a small shin-to-boot gap; both are fixed. Live villagers previously oriented their backs toward the camera once a face existed; their live orientation now matches the model's -Z forward direction. No product failures were hidden or thresholds reduced. Early new-test failures were fixture errors (panel selector, Playwright's ARIA-disabled click guard, wrong bone count, initial POV, unstable prepared pet target), corrected without changing protected gameplay.

## Muse Order 002 scope

Independently compare requirements -> diff -> tests -> visual evidence -> save compatibility -> regressions -> protected systems at the exact PR head. Verify the full matrix from front and rear, all skin tones, camera framing, normal/wardrobe depth restoration, real walking and interaction poses, five villagers, disposal and rendering costs. Distinguish automated evidence from owner/physical-device acceptance. Report blockers with file/line and reproduction, or an explicit independent approval with remaining limitations. Do not implement competing changes or merge the PR.

## Local validation result (2026-10-03)

- Final `npm test`: **PASS**, 39/39 unit tests and 66 browser/fixture checkpoints, zero failures.
- `node stage-a-live3d.browser.cjs`: **PASS**, both viewports and saved Buzz hairstyle reload.
- `npm run test:saves`: **PASS**, 13 checkpoints including three old-save files, migration idempotence, unreadable-copy preservation, newer-save protection, quota/cloud guards and measurements.
- Evidence fixture repeated after correcting its strip cropping/labels: **PASS**. The supplied images and JSON below are from this validated implementation.
- `git diff --check`: **PASS**. No protected gameplay/security/save files changed.
- Hosted regression, old-save and Firebase emulator outcomes must be read from the PR checks at the current head; they are not replaced by local offline fixtures.

## Committed review images and measurements

The checked-in `evidence/stage-b/` snapshot lets independent reviewers inspect the images without a local workspace. CI also regenerates the evidence and uploads its fresh artifacts.

[Full front matrix](evidence/stage-b/farmer-matrix-front.png) · [Full rear matrix](evidence/stage-b/farmer-matrix-rear.png)

[Six skin tones, Porcelain to Espresso](evidence/stage-b/farmer-skin-tones.png) · [Eight gait phases](evidence/stage-b/farmer-gait-poses.png)

[Desktop wardrobe](evidence/stage-b/farmer-wardrobe-1280.png) · [Landscape wardrobe](evidence/stage-b/farmer-wardrobe-844.png) · [Portrait wardrobe](evidence/stage-b/farmer-wardrobe-390.png)

[Active walk](evidence/stage-b/farmer-walk.png) · [First-person hands](evidence/stage-b/farmer-first-person.png)

[Wardrobe/save results](evidence/stage-b/farmer3d-results.json) · [Active walk/pet results](evidence/stage-b/farmer-walk-results.json) · [Measured rendering comparison](evidence/stage-b/farmer-performance.json)

## Continuation and additional rendered evidence

Recovery PR #43 fixes a startup race independently reproduced on main: a missing-cloud answer could clear recovery before the game read a damaged save, which then marked recovery again. This branch includes that fix for combined validation; PR #43 must merge first so the final farmer diff remains scoped. Both original failed CI attempts remain recorded in PR #42. No farmer production code changed after Muse's audit.

The additional `tests/farmer-depth.browser.cjs` uses the actual fitting/closing integration and reads rendered pixels with a foreground red blocker. Fitting renders the farmer above the blocker; after closing, the blocker occludes the farmer normally (open [11,38,94,255], closed [255,0,0,255] locally). The same fixture captures all five real in-game visitors. These close the two browser evidence gaps recorded by Muse; physical S26 Ultra acceptance is still not claimed.

[Depth pixels](evidence/stage-b/farmer-depth-result.json) · [Rosa](evidence/stage-b/visitor-rosa.png) · [Joe](evidence/stage-b/visitor-joe.png) · [Mia](evidence/stage-b/visitor-mia.png) · [Sam](evidence/stage-b/visitor-sam.png) · [Lily](evidence/stage-b/visitor-lily.png)
