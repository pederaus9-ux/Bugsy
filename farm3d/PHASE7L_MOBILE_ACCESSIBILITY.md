# Phase 7L — mobile UX and accessibility

Status: local verification passed; exact-head hosted checks pending. Merge and physical
S26 acceptance remain required. Base: `1bb571bd7d6ec5cd89baf7d2c4aecd81bf4786a8`.

Phase 7K is accepted: PR #47 was specifically approved, merged, deployed with
the tested tree, checked against live source and physically passed on the S26.
The post-merge cloud job passed on its unchanged second attempt. Its first
registration failure remains preserved; a separate reproduction showed a real
delayed-focus problem, without proving that it caused that hosted failure.

## Repairs

- All button boxes have a minimum 44×44 CSS-pixel target. Landscape side buttons
  no longer shrink to 40 pixels; the dock no longer scales down. Close buttons,
  small actions and colour choices retain the existing visual language.
- Left/right notch insets protect the HUD, side controls, dock, trays, panels,
  auth forms and wardrobe edges. Short panels scroll vertically rather than
  overflowing horizontally. Auth forms scroll in portrait and short landscape.
- Visible keyboard focus, main-panel Tab/Shift+Tab containment, focus return to
  the opener and focus preservation when the panel regenerates. Escape closes
  a menu while retaining Walk mode. Enter/Space on controls operate those
  controls; walking starts with focus on the farm canvas.
- Auth tabs announce their selected state. Delayed default focus is cancelled
  when another field/control is selected or another form mode opens. Touch
  devices do not automatically open the keyboard. Auth also contains keyboard
  focus while its gate is visible. SDK/account/recovery logic is unchanged.
- Settings offers **Use device setting**, **Reduced motion**, **Full motion**,
  with spoken pressed states. The default follows live device preference
  changes. Explicit choices persist in the existing separate preferences key,
  without changing the farm save schema. Invalid/old values default to System.
- Reduced motion removes CSS pop/bounce/flash transitions, introductory camera
  sweeps, view-transition sweeps, first-person head bob/idle hand sway, camera
  shake and flying counter rewards. Animal gait, meaningful hand interactions,
  weather and normal navigation remain animated. Rewards/counters still update.
- Hidden pages skip rendering and cosmetic/UI polling; held walk/joystick input
  is cleared. Existing visibility save, wall-clock progression, cloud recovery,
  notification scheduling and foreground catch-up remain in place. This is a
  code/automated recovery check, not a measured battery-duration claim.
- Selected graphics/paint choices announce pressed state as well as colour.

Cache/release 37; game query 25; auth query 18; analytics and dashboard queries 2.
Analytics logic only changes its current release label. Production SDK remains
12.19.0. Rules, verified economy activation, animal AI and `/farm` are untouched.

## Verification and limits

The new browser suite runs separately in CI, preserving all five existing jobs
and their limits. It checks actual game UI at 740×360, 844×390 and 1280×720:
button targets, Settings/Barn/Orders/Shop/Weather/Decor panel bounds and horizontal
fit, focus loops/return/regeneration, motion persistence/device changes/overrides,
walking keys, head bob, hidden/resumed rendering and cleared held input. Simulated
notch values exercise the CSS inset calculations. Actual device insets still need
physical inspection, particularly Safari/PWA.

Actual auth markup and handlers are isolated with SDK startup substituted for
form-specific tests at 740×360, 390×844 and 1280×720. Rapid password entry,
mode switches, selected-field focus and keyboard containment are verified.
This does not replace real-SDK/emulator authentication tests in the existing job.

Screenshots are inspected and evidence retained. The first new-suite attempt
failed on an incorrect test selector; the selectors were repaired without
changing assertions or timeouts. Prior cloud and new-suite failures are not erased.
Visual inspection also found the isolated phone-form fixture lacked the production
viewport meta tag; it was corrected, an exact viewport assertion added and the
full suite rerun. Superseded images/logs remain in the local evidence directory.

Local results: 44 existing unit tests, 50 general game browser checkpoints,
9 analytics unit tests, all 8 analytics browser scenarios and all 11 groups in
the new accessibility browser suite passed. Final screenshots/results are in
`tests/evidence/phase7l/`. Full hosted checks include old saves, six-species
visuals, farmer/extra game regression and the real SDK/emulator suite.

This is a focused improvement, not a claim of complete screen-reader navigation
of the 3D farm or full WCAG certification. Thumb comfort, real keyboard/browser
behavior, OS motion preference, notch fit, background recovery and saving require
owner acceptance after the approved PR deploys. Long battery/thermal and PWA
update stress remain Phase 7N. Phase 7M visual polish remains separate.
