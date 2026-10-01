# Phase 7C — device baseline and shed switching

Base: merged Phase 7B on main, `3f06eae623a6d0dba04560c62812054fcaa2f9d6`.
Branch: `codex/sunny-acres-shed-switch`. Changes are limited to `farm3d/`.
Repair merged as PR #27, commit `a26fb18292336a4d4b8bf370c28d658287939cb2`.
Page, versioned game/perf modules and service worker matched the tested repair
source on the live site at 2026-10-01 02:41 UTC. The owner's subsequent "good
continue" is taken as phone confirmation and authorization for Phase 7D.

## Owner-reported device result

The owner tested on an S26 Ultra and reported essentially 60 FPS throughout the
stress session, with no more than slight warmth. Performance, Auto quality,
thermals, battery behavior for the test duration, background recovery and
orientation recovery passed. Classic, Walk, weather stress and the loaded farm
were reported strong. Interaction/UI had one reproducible shed-switching defect.

This is the owner's summary, not a desktop-captured device trace. Exact session
duration, Android/Chrome versions, brightness/charging/power-saver conditions,
battery percentages, per-condition median/p95/worst, quality scale/effect states
and exact loaded-farm counts were not supplied. CPU/GPU/memory/network/save
bottlenecks remain unmeasured. The summary supports a successful performance
baseline for this device/session; it does not establish results for other phones.
No performance optimization was indicated or added.

## Defect, cause and repair

Owner's reproduction: tap Shed A, immediately tap Shed B; B sometimes fails to
open, and another tap opens it.

Desktop Chrome touch reproduction confirmed that A's menu backdrop receives the
tap intended for the visible B and only dismisses A. It also showed a touch's
generated click landing on the newly created backdrop, immediately dismissing
a menu opened on pointer release. The exact second-tap outcome varies with event
targeting; the lost first B tap was reproduced at both mobile sizes and desktop.

With a shed menu open, a backdrop tap now uses the existing world hit test to open
the visible owned shed at that point. A tap on the already selected shed is
consumed without recreating or dismissing its menu. Only shed-menu backdrops use
this route; menu contents and explicit close buttons retain normal behavior.
Other menus/non-building targets dismiss normally. Visiting, edit, photo,
wardrobe and barn-interior states do not use this route.

Switching opens B's menu without collecting goods. Ordinary direct shed taps
retain their existing collect-first behavior. Saves, progression, visual quality,
grass, effects and performance sampling are unchanged. Changed game module:
`game.js?v=22`; service-worker cache: `sa3d-v23`, precaching that exact game query.
Auth/friends/perf modules retain versions 12/4/1.

## Validation

- `node farm3d/tests/shed-switch.browser.cjs` passes at 740×360, 844×390 and
  1280×720. It uses real Chrome touch dispatch, projected 3D building hits and
  actual menu handlers. Each layout checks immediate and repeated A-to-B changes,
  same-shed menu stability, finished-goods preservation during switching, ordinary
  direct collection, menu-content taps, explicit close, Settings dismissal and
  non-building backdrop dismissal without changing crops. No page/console errors.
- Playwright is supplied externally; the game gains no build dependencies. With
  an existing Playwright installation and Chromium browser, run the command above.
  `PLAYWRIGHT_MODULE` and `CHROME_PATH` optionally select the desktop's bundled
  Playwright module and installed Chrome. `SHED_RESULTS` optionally saves JSON.
  `--repro` is for comparison against the pre-fix checkout.
- This focused test uses the existing `?shot&sim=0` fixture and redraws its selected
  camera once. Pausing continuous 3D rendering avoids software-renderer stalls
  being mistaken for long presses; menu CSS and touch events remain active. It
  verifies input/menu behavior, not real-device FPS. External endpoints are isolated.
- All modules/inline scripts parse, six perf unit tests pass, and the existing 27
  gameplay smoke checks pass: normal/testfarm boot, WASD/Q/arrows/E/Enter, mobile
  joystick, planting/cancelled drag, panels and local v1 save/reload.
- Service-worker simulation passes v23 install/activation, v22-only cleanup,
  unrelated-cache preservation and offline page/versioned game/perf responses.

The owner's "good continue" after the phone retest instructions is taken as
confirmation of the repair. No numeric device trace was added. Live account/cloud
behavior, iPhone and other Android hardware were not tested here. Phase 7D follows
in a separate regression-testing PR.
