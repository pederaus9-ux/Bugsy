# First barn candidate evidence

Baseline: PR50 d24fd518, runtime identical to merged PR49 e080aee.
Candidate: original offline recipe in tools/build-barn.mjs; static scene-only swap.
These are actual Three.js renders, not generated illustrations.

At 844 × 390 the existing browser harness uses deviceScaleFactor 0.5/SwiftShader.
Overview screenshots are scaled to CSS dimensions and include the normal game
compositor/HUD. Hero images are drawing-buffer captures (422 × 195) from a fixed
48-degree camera at (12,6,17), looking at (0,3.7,0), using the game's lights,
environment and scene, but rendering directly without EffectComposer. Do not
confuse these captures with full-resolution S26 visual proof.

Camera/weather/farm state match within each pair. Live animal poses/ambient motion
can differ between captures. Local browser is Chromium 153 via a transient package,
not the pinned Playwright download used in hosted CI. The standard download failed
with truncated archives; Ubuntu Chromium installation also failed in this workspace.
The captured model contains no texture maps, skins, LODs or animated doors. It
replaces the whole barn in the sandbox view, so these are NOT gameplay-equivalent
performance comparisons. Observed calls/triangles are diagnostics only, without
GPU timings or physical FPS claims. The original barn remains deployed.

Local validation: all 61 unit tests; policy preflight; Khronos validator
2.0.0-dev.3.10 zero findings; 844 scene model load/bounds/four material surfaces;
visibility resource stability; disposal releases four geometries. Results JSON
records actual counts. 1280 and exact-head hosted checks remain pending.

Initial attempt: overview images are retained in initial-attempt/. Its planned
30 visibility renders overloaded the software-render queue; that incomplete run
was interrupted. Roof seam geometry was then refined. The new test uses a single
hide/show pair and checks actual resource disposal; no prior accepted-test deadlines
or thresholds were altered. The final 844 assertions completed and evidence was
written. The shared harness's optional final screenshot then timed out at 15 seconds;
it logs that condition without failing, and teardown completed. This is a limitation
of the local run, not evidence that every capture/recovery path passed.

Visual review: cleaner red/cream separation and geometry relief, but roof speckling
remains and broad paint/stone shading needs authored material work. This is NOT
accepted final barn art, a premium-quality claim, a completed Blender production
pipeline or the finished 7M-X transformation. Vegetation remains pending.
