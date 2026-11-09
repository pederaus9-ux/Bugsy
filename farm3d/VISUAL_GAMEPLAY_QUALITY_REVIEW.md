# Visual and gameplay quality review

## Authorized hosted execution candidate, 2026-11-09

Austin explicitly approved preparing the bounded GitHub testing workflow,
publishing this tests-only candidate in a public draft PR, and running its checks.
No merge, live-game change or deployment is authorized. The source base is still
`38fa4706e41c40197b7afc32de693cb3901a80fb`. Draft branch:
`codex/visual-gameplay-hosted-validation-20261109`. Publication and hosted results
are pending at this preparation checkpoint.

The new `farm3d-visual-gameplay-candidate.yml` workflow runs only for the exact
same-repository candidate PR branch or an explicit manual invocation. It has
read-only repository permission, no schedule/main-push trigger, and no deployment
step. Its three jobs run serially, with independent failures and fresh artifact
directories:

- **Gallery:** all 12 overview/first-person captures at 844x390 and 1280x720, using
  the existing full-resolution capture contract. Image pixels still need review.
- **Earned progression:** unchanged 14 receipt groups, starting from the preserved
  historical earned level-8 receipt and earning levels 9-20 under accelerated time.
- **Boundary progression:** unchanged 17 explicit boundary/persistence/reward
  groups, separately labeled seeded checks rather than ordinary earned play.

Each job checks out and verifies the exact PR head (not a synthetic merge ref),
installs the pinned browser dependency through the existing lockfile, records
source/script/browser versions, and runs the unchanged fixture with an explicit
source ref. Browser processes retain a 20-minute limit within a 25-minute job.
Partial evidence uploads run after failures. Full-receipt verification requires
all expected groups/files and matching source/script/image hashes; it cannot turn
empty, duplicate, stale or failed receipts into a pass. It never grants owner
visual acceptance. The new controls are registered through the existing tooling
entry point, and all **62** controls pass locally on Node24.

The original private patch and all prior failures remain retained separately.
Additional pure Node checks pass identically on verified clean baseline and
candidate: **27** gameplay controls and **26** save/performance-metric controls.
This remains a partial-source local validation, not full-tree or hosted Node22
qualification. No fresh browser assertion or image has yet executed. The prior
cloud Chromium socket/ptrace startup failures were not retried or bypassed; no
PC operation was performed for this candidate.

The workflow changes test orchestration only. Runtime, approved art/style,
service-worker cache, amendment registry, original progression assertions and
frozen evidence remain unchanged. Sustained frame measurements, physical-device
behavior and final owner visual acceptance remain separate gates.

## Retained private-candidate review, 2026-11-08

The following sections retain the earlier implementation and failed cloud-launch
checkpoint. References to private-only status and unchanged workflow describe
that earlier checkpoint; the authorized workflow above is the subsequent change.

Source inspected: GitHub main `38fa4706e41c40197b7afc32de693cb3901a80fb`, after PR #113.
This review and the small scorecard correction are a private, tests-only candidate.
No runtime, artwork, frozen evidence, workflow, cache or amendment is changed.
No new publication, merge or deployment has been performed by this work.

## Follow-up implementation and execution checkpoint

The separate opt-in `tests/visual-review.browser.cjs` gallery is now implemented
as a private candidate. It requests 12 captures: overview and first-person path,
each at 844x390 and 1280x720 with three lighting presets per view. It serves the
explicit immutable source commit through the existing harness, requests the real
Best setting, retains production shadows, waits for rendered-frame advancement
and the first-person camera transition, and records camera/renderer/quality
metadata and image hashes. It does not move or redesign scene meshes.

`visual-review-capture.cjs` rejects under-resolution drawing buffers/PNGs,
disabled shadows, automatic quality reductions, stale frames, covering dialogs
and lost contexts. Its PNG checks cover the signature/header/dimensions, not
decoded image content. The gallery only claims `captured`; every image's visual
verdict remains `pending_review`. Actual pixel inspection is still required.
Dedicated animal/care and wardrobe closeups remain separate coverage.

Capture controls were written first and all three failed against the empty
implementation. All **58** tooling controls now pass, including these new checks
through the existing `quality-loops.test.mjs` entry point. Independent review
found no actionable correctness/security issue in the scorecard or gallery;
this is not an independent browser execution or visual approval.

**Execution blocked before gameplay:** the unchanged current-source earned
progression test and the new gallery both failed while starting Chromium in
this cloud executor. Chromium reported `socket() failed: Operation not permitted`
and Crashpad errors. A narrowly scoped elevated retry of the unchanged progression
harness also failed before startup. Original failures and new partial results
are retained separately. Zero progression assertions and zero gallery captures
executed. The boundaries mode was not repeated because it uses the same blocked
launch. This is an executor limitation, not a demonstrated game regression.

No browser security flags, runtime files or original assertions were changed.
The current-source attempt explicitly used
`QUALIFICATION_REF=38fa4706e41c40197b7afc32de693cb3901a80fb`; it did not run the
fixture's historical default. Exact upstream commit/tree objects and 297 local
source files have now been imported and hash-verified; unrelated repository blobs
remain absent. The working branch's baseline is still synthetic. This is not a
full checkout or full-suite qualification.

Next execution on a permitted browser-capable executor, from the repository root:

```sh
VISUAL_REVIEW_REF=38fa4706e41c40197b7afc32de693cb3901a80fb \
  TEST_ARTIFACTS=/absolute/fresh/gallery-directory \
  node farm3d/tests/visual-review.browser.cjs
QUALIFICATION_REF=38fa4706e41c40197b7afc32de693cb3901a80fb \
  QUALIFICATION_MODE=earned CHROME_PATH=/path/to/chrome \
  TEST_ARTIFACTS=/absolute/fresh/progression-directory \
  node farm3d/tests/qualification-later-progression.browser.cjs
```

Use the existing README's pinned browser dependencies and appropriate shell
environment-variable syntax. Preserve the original process limits and receipts.
The gallery intentionally remains opt-in, outside routine browser lanes.
All external endpoints, including Google Fonts, are stubbed by the existing
harness, so typography uses fallback fonts. The portrait query also bypasses
rotation/fullscreen behavior. The gallery cannot qualify those behaviors,
physical-device performance or final owner aesthetic acceptance.

## Verified current evidence

- [Main regression run 42487054995](https://github.com/pederaus9-ux/Bugsy/actions/runs/42487054995)
  completed successfully: all 17 jobs passed. This includes rendered browser
  gameplay, planting, saves, accessibility, animal/player/scene checks, market,
  decoration/lighting checks, chicken touch/update scenarios and the Firebase emulator.
- [Main quality-loop run 42487054756](https://github.com/pederaus9-ux/Bugsy/actions/runs/42487054756)
  passed 16 Node lanes / 139 isolated executions, including all nine original
  horse cases and 745 measurement rows. Its baseline comparison was unavailable.
  Those process durations are not game frame-time or FPS measurements.
- The browser lanes in the quality-loop manifest are opt-in. Their absence from
  this Node-only report does not erase the separate regression workflow's browser
  results. Conversely, a successful browser command is not owner visual acceptance.

## What the existing checks already cover

Do not duplicate the current crop/order/market transactions, repeated planting,
guest save/reload, keyboard/touch movement, seed-drag cleanup, shed switching,
modal focus/Escape, reduced motion, simulated background input release, animal
geometry/contact, rendered scene material and resource-lifetime assertions.
See `tests/README.md`, `tests/run-core-game-tests.mjs`, the dedicated browser
fixtures and `.github/workflows/farm3d-regression.yml` for the exact test contracts.

There are 133 top-level browser fixture files in main. Many are historical,
targeted diagnostics or explicit release qualification, not default loop lanes.
File presence alone is not proof of recent execution or a current-source pass.

## Confirmed visual evidence gap

The exact-main [character/scene artifact](https://github.com/pederaus9-ux/Bugsy/actions/runs/42487054995/artifacts/13619679680)
was downloaded and its actual pixels inspected. Examples:

- `polish-1280.png` is 640x360; `polish-844-rain-hands.png` is 422x195. Both
  first-person views are heavily obstructed by nearby foreground foliage.
- `vegetation-color-1280.png` is 640x360 with a large event dialog obscuring the
  farm. The vegetation fixture correctly tests isolated rendered palette pixels;
  its final scene screenshot is not a clear composition-review image.
- The common harness defaults to device scale factor 0.5. Some fixtures also
  disable shadows or use isolated/manual-step scenes. These limitations are
  already documented and must remain attached to their results.

These observations establish a review-evidence gap, not a diagnosed production
camera/foliage defect. Original test setup deliberately positions the player
near plots and moves a cow for marker assertions. Do not alter production assets
or approved styling on the strength of these fixture screenshots alone.

### Next bounded visual check

Add a separate opt-in gallery, retaining existing captures and tests unchanged:

1. Pin current source and record renderer/browser version, viewport, device pixel
   ratio, drawing-buffer size, graphics setting, shadow state, preset and camera.
2. Capture supported landscape gameplay at 844x390 and 1280x720 with a drawing
   buffer at least as large as the CSS viewport, full production shadows and no
   test-only graphics downgrade. Use the real Best setting in a disposable context.
3. Include unobstructed farm overview, an ordinary first-person crop approach and
   animal/care views at noon, golden hour and night/rain. Clear test popups without
   changing geometry, materials, progression, routes or animal locomotion.
4. After camera or wardrobe changes, wait for actual rendered-frame advancement,
   record the final state and verify that no modal/loading/rotation layer covers
   the subject. Check PNG dimensions and record image hashes. A screenshot existing
   is insufficient to pass the capture contract.
5. Inspect the resulting pixels for silhouette, ground contact, skin/clothing,
   materials, lighting, readability and occlusion. Retain an explicit owner-review
   verdict separately from automated capture/geometry results. Present visual
   direction options before any aesthetic redesign.

Portrait UI checks must be labeled separately: ordinary gameplay is landscape;
the existing `?portrait` test bypass is not proof of supported portrait gameplay.

## Gameplay and performance priorities

1. **Current-source longer play session:** the opt-in later-progression fixture
   already contains substantial earned progression and duplicate/stale reward
   checks, but defaults to historical source `e3b59b7a65a3d9c8710bad3e4a2659d9d76be765`.
   Review its prerequisites and run a separately named current-source continuation
   rather than relabeling the old receipt or writing a duplicate suite. Accelerated
   deterministic time does not validate real-time pacing or whether play is fun.
2. **Sustained frame and interaction measurements:** reuse `performance7k.browser.cjs`
   before adding another benchmark. Its five injection anchors still occur exactly
   once in this main source. It records full-farm CPU stage times, GPU query
   availability, memory, weather/mode variants and a three-minute rain sample.
   It is opt-in and not part of the verified default CI run. It lacks an approved
   target-device pass budget; same-device baseline and p95/worst-frame results are
   needed before claiming a performance improvement. SwiftShader and isolated
   actor timing do not qualify physical-phone performance or thermals.
3. **Interrupted input and layout transitions:** preserve existing repeated-click,
   close/Escape, focus and background-key tests. Before adding cases, inspect the
   specialized pen gesture fixtures too. Prioritize any uncovered resize/orientation
   or interrupted-touch transition that can leave movement, planting or an overlay
   stuck, then verify save state remains unchanged after cancellation.

No live user save, production account, cloud data or security setting is needed
for these disposable-context checks. Physical-device and owner acceptance remain
separate decisions; this review does not request a redesign or authorize one.

## Small implemented correction

The quality scorecard previously rendered browser lane status without its manifest
definition. A fabricated/incomplete lane with just one passing command could be
shown as passed even when two required browser files were missing. This is a
report-integrity defect; no actual CI false pass or game defect is claimed.

The candidate now requires exactly the manifest's browser files, rejects duplicate
lanes/files/definitions, wrong kinds and missing definitions, and explicitly shows
expected-but-unrun browser lanes as missing. It preserves real failure statuses
and leaves the Node scorecard and browser opt-in execution policy unchanged.
Its wording separates command coverage from visual quality and device performance.

Initial validation: four new control tests first failed on the unchanged implementation.
The first runner/baseline/dashboard/scorecard suite passed **55/55 tests**, with
zero failures/skips, on cloud Node 24.22.1. Syntax and whitespace checks pass.
The local source snapshot is partial: 181 materialized files were verified against
main Git blob IDs. The local Git baseline is synthetic, not upstream main.
At that checkpoint, no fresh game/browser execution or exact-candidate hosted CI
had been run. See the follow-up checkpoint above for the later failed launches
and expanded source/control validation. No new browser qualification is claimed.
Full-tree review and authorized draft publication/exact-head CI remain future gates.
