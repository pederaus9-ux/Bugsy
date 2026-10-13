# One full-sequence ambient diagnostic

Owner requested one original full sequence with render/frame logging, unchanged
game code and test limits, to check whether earlier programs affect rendering.
No correction or merge is proposed by this diagnostic.

Base main2bb0daebea1fb7d8e34df4d7b7325faba76f66ce, tree55e8e13146e2c78fc0647d2b07e97c6cfbf1ef5b.
The earlier standalone diagnostic528f0a9/run38335774387 passed4/4comparisons,
but1280reduced mode had no callback. Originalmain199 still failed resume.

## Discriminating experiment

Run the **unchanged** npm command `npm run test:core:characters` once:

1. farmer3d.browser.cjs
2. farmer3d-walk.browser.cjs
3. farmer3d-evidence.browser.cjs
4. recovery-startup.browser.cjs
5. farmer-depth.browser.cjs
6. scene-polish.browser.cjs
7. phase7m-color.browser.cjs

Use the same Ubuntu24.04/Node22/pinned dependencies/SwiftShader setup and
original20minute job limit as the failed character job. The full scene fixture
runs, including both viewports, weather/material/wardrobe/action/marker/resource
checks and the visuallegacy case. Normal fail-fast sequencing remains intact;
if an earlier program fails, later programs stay unrun and the failure is reported.

A Node preload intercepts compilation of **only** scene-polish.browser.cjs,
adding the existing observation hooks in memory. No preceding program, npm
script, dependency, original fixture or production file changes. Its original
700ms waits/comparisons remain literal and static verification fails if anchors
change. Original fixture SHA256:
88f0a77329ee7129ab5701ee07cf72e08714d4931dcfc4572296df4e84e6f435.
No bounded-case skip/early return from the first diagnostic is used here.

Capture actual callback counts/timestamps/positions, renderer counters, rAF
intervals/delivery, visibility/frustum and motion-state changes after each original
comparison. Native callback invocation/return remains intact. Observational
streams stay bounded; no extra wait or assertion-threshold change.

Compare with the standalone run: callback opportunities and frame gaps after
identical700ms windows, and whether the original resume failure now occurs.
A difference supports investigating cumulative sequence/resource effects;
a single run cannot by itself prove that preceding tests caused a difference.
If failure again does not reproduce, report the limits and avoid blind retries.

Only a dedicated branch push runs this diagnostic. No integration PR, public
deployment, game fix, production account/data write, threshold weakening or
merge. Preserve raw observations and original failure traces in the artifact,
then report evidence before any correction proposal.

Status: static checks passed; one hosted execution pending.
