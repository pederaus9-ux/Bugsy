# Sunny Acres 3D regression suite

Requires Node 22 and npm. Test dependencies are isolated here; the game still
uses plain browser modules with no build step or runtime package dependencies.
From the repository root:

```sh
cd farm3d/tests
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

Tests run sequentially against an ephemeral localhost server. The pinned
Playwright lockfile selects its matching Chromium with its current headless mode.
On an existing developer
machine, `CHROME_PATH` can select installed Chrome and `PLAYWRIGHT_MODULE` can
select an external Playwright installation; neither is needed in CI.
`TEST_ARTIFACTS` overrides the ignored `artifacts/` output directory.

## Coverage

- Six performance-monitor unit tests: statistics, bounded windows, resume reset,
  complete composer counts and throttled overlay updates.
- Five 3D cow unit tests: actual joint/hoof position, planted-foot travel,
  stopped cadence, head/ear/blink/tail gestures, shared skin with independent
  skeletons, disposal, teleport and equal-distance cadence at 30/60/120 Hz.
- Game modules and inline scripts parse; cancelled planting/harvesting guards.
- At **740×360, 844×390 and 1280×720**: test-farm boot, planting through the seed
  tray, pointer harvest/inventory/XP, order delivery/inventory/rewards/cooldown,
  disabled unaffordable orders, and Orders/Barn/Shop/Settings fit and close.
- Desktop WASD movement, Q/arrow turning, E/Enter harvest interaction without
  turning, and interrupted seed drag/ghost/tray cleanup.
- Both mobile layouts: real Chromium touch joystick movement and walk action
  button harvest of the aimed crop.
- Each layout: normal offline guest boot and local v1 save/reload retaining
  planted crop, coins and guest identity. Sandbox play does not write a farm save;
  desktop also verifies an existing normal save is preserved by sandbox play.
- Shed touch regression at all three sizes: immediate/repeated A-to-B switch,
  same-shed menu stability, finished goods preserved during switching, ordinary
  collection, explicit close, menu contents and other/non-building backdrops.
- At all three sizes: regular-link cow integration (no `characters3d` parameter)
  measures final AI displacement,
  frozen gait at a blocked boundary, mesh picking, sandbox save preservation and
  scene-lit coats with existing picture glow preserved across five weather presets;
  standalone preview movement buttons/orbit/layout and geometry raycasts from
  front, flank and rear. Isolated rendered old-card/new-cow counts and stable
  renderer resources are checked with shadows on and off.
- The optional `?characters2d` comparison restores painted cows without writing
  a sandbox save.
- Missing-cloud recovery with account linking before game startup, game startup
  before the cloud answer, and sign-out during startup. The real game/auth code
  runs against a deterministic SDK boundary; the hosted emulator suite separately
  verifies real Firestore behavior, including delayed-startup recovery.
- Fail on page exceptions, console errors and failed/HTTP-error local resources.

`regression.browser.cjs` keeps the animated 3D loop active. CSS viewports stay
exact, while the test context uses DPR 0.5 and disables renderer shadow maps after
boot to keep the software GPU responsive. These are test-only fixture settings,
not game changes or full-graphics performance claims. The focused
shed test uses the existing static `?shot&sim=0` scene, redraws its selected camera
once and sends real Chrome touch events. This avoids software-renderer stalls
turning a short tap into a long press. It does not measure phone performance.
The cow fixture uses manual animation steps for deterministic travel/pose checks
and a warmed CPU pose-update sample. That timer excludes rendering/GPU skinning;
draw/triangle comparisons cover one isolated animal, not a loaded farm.
Debug hooks prepare deterministic inventory, ripe crops and unobstructed camera
positions; planting, harvest, orders and interactions still use the actual UI.

All external endpoints are isolated, including Firebase, weather, analytics and
feedback. The general fixtures exercise the offline guest path; the focused
startup fixture supplies an in-memory SDK boundary for ordering and cancellation.
Service workers are blocked in browser contexts. This suite does **not** establish
cloud/account behavior, real service-worker updates, Safari/iPhone support or
thermal/performance results; those remain separate manual/integration work.

## CI and diagnostics

`.github/workflows/farm3d-regression.yml` runs on **every PR to main** so a future
required check is never skipped because of path filters. Push runs on main are
limited to the game/workflow, and manual dispatch is available after merging.
One job, `Farm3D regression`, uses read-only repository permissions and no secrets,
with a 20-minute bound. No repository settings are changed.

Screenshots and JSON results are written to `artifacts/`; a failed browser session
also saves a Playwright trace (`*-failure.zip`). CI uploads these for seven days.
Open a downloaded trace locally with `npx playwright show-trace <file.zip>`.
The console log remains the source for failures before browser startup.

Run the complete suite once more after fixing a failure. Do not hide intermittent
failures with automatic retries. Only recommend making `Farm3D regression`
required after repeated green hosted runs; owner approval is needed to change
branch protection.

Workflow setup follows [Playwright CI guidance](https://playwright.dev/docs/ci)
and [GitHub workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax).
