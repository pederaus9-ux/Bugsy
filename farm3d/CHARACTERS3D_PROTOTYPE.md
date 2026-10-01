# Sunny Acres: first true 3D cow

Owner request, 2026-10-01: replace painted animal cards with true 3D characters,
including natural head turns and ear movement. Start with one cow for visual
approval before extending to other species. This changes the roadmap order;
Phase 7G is still deferred. Baseline: main `7ed0c9908ce97c03d5a5de1f6c855a7dcace4b69`
(merged Phase 7F PR #30). This prototype is pending owner approval.

## Review

Open `characters3d.html`. Drag around Bessie to inspect front, flank and rear;
try Stand, Walk, Run and Graze. Watch the neck/head turn, independent ear flicks,
blinks, chewing, breathing, tail joints, knees and split hooves. The preview uses
the same rig as the game. This is an original stylized Holstein prototype; it
does not claim photorealism or final approved proportions.

Then use **Try on the farm** (`?testfarm&characters3d&loco&perf`) for a throwaway
farm with locomotion parade and performance readings. `?characters3d` alone also
works with an ordinary farm. Only cows change; no saved flag or schema change.
Default gameplay keeps the approved Phase 7F animals until the owner approves
this style and device cost. Review images are in `docs/characters3d/`.

On the S26 Ultra, check side/rear silhouettes, head/ear movement, hoof contact,
starts/stops and turns; pet a cow and inspect normal menus. Compare the same
loaded farm, quality, weather and camera with and without `characters3d` using
`?perf`. Record FPS/frame time and renderer counts over a sustained session.
The earlier Phase 7C 60-FPS result predates this geometry and is not a measurement
of this prototype. Stop here for owner feedback; do not roll out other species.

## Implementation

`cow3d.js?v=1` creates a real volume: one vertex-colored skinned mesh, 24 bones,
shared geometry/material and independent skeleton/state per cow. Original
procedural geometry requires no downloaded model, atlas or additional runtime
dependency. It is lazy imported only when `characters3d` is present.

The farm retains its existing AI, personality, routes, pens, needs, progression,
collision, grass and adaptive quality. Animation receives actual displacement
after movement/pen fitting. Phase advances by travel distance/stride length;
stationary/blocked cows settle. A small analytic two-joint leg solve places feet
on the floor and anchors stance hooves in world space. Tight turns release an
overextended stance instead of stretching a leg. Teleports reset anchors.

Head glances, alternating independent ear flicks, blink and tail timing vary by
animal name; grazing lowers the neck and moves the jaw. Sleeping is a quiet
standing doze, not a complete lying-down animation. Petting retains the existing
game reaction and brief happy hop. Bounds are conservative and static; no
per-frame mesh/material rebuilding or vertex scans. Removed cows dispose their
individual skeleton GPU resources; the shared model remains reusable.

## Validation and measured cost

Local full suite passed: 11 unit tests, existing 50 game checkpoints, shed
switching and focused cow/preview scenarios at 740×360, 844×390 and 1280×720.
In-farm visual review caught picture glow washing out the new coat. Cows now use
scene lighting, while painted animals retain their preset glow. A regression
covers noon, golden hour, rain, snow and night. Angle checks follow the cow's
heading for genuine front/flank/rear views. Browser external services are
isolated and service workers blocked; this does not verify Firebase, Safari,
PWA cache recovery, thermals or real phone FPS. The existing CI runs the additions.

Isolated animal comparison in desktop headless Chrome, DPR 0.5:

| Rendering | Phase 7F card plus shadow mesh | True 3D cow |
| --- | --- | --- |
| Shadows off | 2 calls, 4 triangles | 1 call, 9,920 triangles |
| Shadows on | 3 calls, 6 triangles | 2 calls, 19,840 triangles including shadow pass |

Geometry/textures stayed stable after 2,000 pose updates in each comparison.
The warmed pose-update loop averaged roughly 0.0028–0.0042 ms per cow on this PC.
That CPU timer excludes rendering, GPU skinning and full scene traversal. Fewer
draw calls do **not** establish lower total GPU cost: the additional geometry,
shadow triangles and each skeleton need real-device review before rollout.

Service-worker cache advances from `sa3d-v25` to `sa3d-v26`, precaching the module
and standalone preview. Unchanged game/auth/friends module versions remain as-is.
All changes are under `farm3d/`; no backend rules, money, save migration or
repository settings change is included.
