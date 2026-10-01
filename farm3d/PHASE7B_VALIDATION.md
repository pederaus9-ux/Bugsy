# Phase 7B validation

Base: merged Phase 7A on main, `84e75d58d6e30a95e58b451dd35e08b1bcd6f1a8`.
Branch: `codex/sunny-acres-perf`. Scope: `farm3d/` only.
The owner reviews and merges this PR; Phase 7C requires a separate go-ahead.

## Change

`?perf` imports the new `perf.js?v=1` module and displays the requested frame,
renderer, quality, mode and viewport readings. Frame intervals are measured at
composer completion with unclamped monotonic timestamps. Hidden/portrait pauses
reset history. Renderer counters span the full composer instead of only its last
fullscreen pass, with `info.autoReset` restored after each render.

The display updates at most twice per second, can collapse, passes body touches
through and stays below blocking menus. Existing gameplay, save schema, quality
decisions, grass and effects are unchanged. No sampling, sorting or diagnostic DOM
is created without the flag. The 4792-byte module is precached even without the
flag so diagnostics can work offline. The service-worker cache is `sa3d-v22`;
unchanged game/auth/friends module versions remain 21/12/4.

## Verified locally

- Six focused tests pass with `node --test farm3d/tests/perf.test.mjs` using Node
  24. They cover empty data, median and nearest-rank p95, foreground hitches,
  bounded ring/window expiration, reset gaps, 30 FPS intervals, complete composer
  counts, reset restoration on errors, display throttling and collapse controls.
- Inline scripts and game/auth/friends/service-worker/perf modules parse.
- Existing gameplay smoke checks pass (27 assertions): normal guest and testfarm
  boot, WASD, Q/arrows, E/Enter interaction without rotation, seed-tray planting,
  interrupted drag cleanup, local v1 save/reload and both mobile joystick sizes.
- `?testfarm&debug&portrait&perf` boots at 1280×720, 740×360 and 844×390. The
  overlay fits, shows every metric, collapses, lets body taps pass through, tracks
  Best/Battery settings and classic/first-person/third-person changes. Mobile
  emulation uses device DPR 3 and correctly reports Best render DPR 2 / scale 100%.
  Settings remain usable above the overlay. No page/console errors were observed.
- Without `?perf`, a local HTTP page imports no perf module and has no overlay;
  the renderer retains its normal reset policy. HTTPS installation separately
  precaches the optional file as described above.
- A service-worker lifecycle simulation passes: v22 precache, activation/claim,
  v21 cleanup, unrelated cache preservation and offline responses for both the
  current page and the versioned perf module.
- The diff contains only scoped instrumentation, cache, documentation and focused
  unit tests. No Firebase, analytics, root app or older `/farm` edits.

Browser checks used installed desktop Chrome through Playwright with SwiftShader
software rendering. External Firebase/other endpoints were isolated; guest
fallback was exercised, not live account/cloud behavior. Browser smoke scripts
are local validation aids; a committed general regression suite/CI is Phase 7D.

## Measurements and limits

The sample buffers use 19,200 bytes (two 1200-entry Float64 arrays), plus a reused
sorting array and the display. Sampling is constant work per rendered frame;
sorting and formatting run at most twice per second. This establishes bounded
overhead, not a measured real-phone overhead percentage.

An illustrative Best-quality desktop software-renderer sample reported 639 calls
and 1,053,461 triangles across the complete composer. Counts vary with the farm,
visibility, effects, shadows and quality. This verifies that diagnostics capture
scene/effect work rather than a final pass's single fullscreen triangle. Software
FPS is not a claim about mobile or hardware-accelerated performance.

See `HANDOFF.md` for exact windows and metric meanings. Timings include browser
scheduling/CPU/render work, not GPU timestamps; geometry/texture counts are not
memory bytes. Startup hitches are included; snapshot renders outside the composer
are excluded. Real Android/iPhone performance, thermal behavior, long sessions
and live PWA update behavior remain unverified and belong to later device checks.

## Owner check after merging

Open the game with `?perf` (or `&perf` if other query flags are present). Check
Classic and Walk, Best/Battery/Auto, viewport changes and background/resume.
For sandbox checks use `?testfarm&perf`. Remove the flag to return to the usual UI.
