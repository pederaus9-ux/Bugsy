# Barn scene study

These are actual game captures, not concept images. The existing game compositor,
HUD, camera, test farm and noon/golden/rain presets are used. CSS viewport and
drawing buffer are 844×390 or 1280×720 at DPR1; there is no physical S26 claim.
Camera/farm/weather match within each pair; animal poses and interaction bubbles
can differ as the simulation continues. The original barn is the control.

Six representative paired daylight/golden overview and daylight Walk images are
checked in. Full 24-image weather/view/viewport matrix and rejected local attempts
are preserved in workspace outputs. Reproduce with
`node farm3d/tools/capture-barn-scene.cjs`; optional `POLISH_QUICK=1` is a local
preview only and is not used by the hosted workflow.

Capture instruments a served copy of the animation loop, waits for three real
composer frames and a completed GPU fence, then holds that frame only during
screenshot readback. Each frame from boot onward waits for its predecessor's
GPU fence before submitting more rendering, including mode transitions. The
drawing buffer must exactly match the CSS viewport and automatic cuts stay zero;
quality and the 30-second screenshot limit are unchanged. `CAPTURE_SOFTWARE=1`
also exercises this path with SwiftShader on Windows. This is capture preparation,
not a production frame-rate change or a performance result. The checked-in
representative images were captured at the preceding scene revision `e94b6d4`;
the capture repair changes no model, materials, camera or production source.

The proof adds a canopy/corbels, UV-based canvas wood/stone studies, sculpted entry
flowers/leaves, stone edging, hay and an irregular apron. It hides misplaced old
ivy and temporarily masks grass instances within the yard, then restores both
exactly. These static masks are not production clearing/ownership integration.
The model remains a code-authored recipe, not Blender source. Canvas texture maps
are experimental and do not fulfill the contract's baked embedded-KTX2 gate.
Hands, doors, interior, customization, LODs and cache integration remain pending.

Local checks: 52 existing core unit tests passed. Actual loader/old candidate
browser check passed at 844/1280. Added scene browser checks exercise 30 visible
toggles and ten real load/dispose rebuilds per viewport; geometries/textures return
to baseline and grass matrices/old ivy restore. Current GLB: 8,116 triangles,
four material surfaces, 1,075,236 bytes. Khronos 2.0.0-dev.3.10: no errors/warnings,
four unsuppressed informational unused-UV findings (the standalone GLB has no maps).
These results establish sandbox correctness, not mobile frame-time or acceptance.

Failure history retained: the first aggregate disposal check restored the original
barn before observation, causing unrelated lazy geometry allocation. The repaired
observation keeps it hidden until after verifying all eight geometries and two
textures are released, retaining exact expectations. A later flower batch mixed
UV/no-UV layouts and failed merge; unused yard UVs were removed. Grass masking
initially cleared only matrix diagonals; all rotated basis entries now collapse.
The dark roof/air spots were old ivy above the wall, not resolved by roof shadow
tweaks; those tweaks were removed and the obsolete ivy is restored in controls.
Earlier rejected captures/validator evidence remain historical, not current proof.
Two hosted full-resolution capture attempts at `e94b6d4` failed on the first
30-second screenshot readback; all seven regression jobs passed at that head.
Both failed logs/artifacts remain preserved. A local SwiftShader diagnostic
captured all four quick-preview images but exposed unrelated texture allocations
between aggregate disposal samples. The capture tool now samples exact resource
release while holding the completed frame; the separate browser suite still
checks thirty toggles and ten rebuilds with actual rendering after disposal.
The hosted timeout's underlying cause remains unverified until the repaired
capture is exercised there; continuous queued rendering is a working hypothesis.
At `e41d4ea`, hosted capture produced both noon overview images, then timed out
waiting for the GPU fence after entering Walk. That log and those partial images
are also preserved. The later repair gates rendering throughout boot and Walk,
not just while reading back a screenshot. These capture-only GPU waits make its
frame cadence unsuitable for benchmarking; no performance inference is made.

This is a revised candidate, not accepted final art or a finished 7M-X program.
