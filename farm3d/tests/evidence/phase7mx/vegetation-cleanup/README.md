# Production vegetation cleanup

The two Walk images show the original, working gameplay barn: before is the
hosted f9b2e73 capture; after is the same camera/weather/test farm with only the
production vegetation repair. The sandbox GLB replacement is disabled in both.
Animal poses/bubbles and transient instructions can differ. These are actual
844x390 DPR1 compositor captures, not physical S26 acceptance.

The renderer reproduced black output from both real instanced materials: ivy
565 visible pixels / zero lit or green; flower heads 61 / zero lit. They requested
vertex colors despite having no geometry color attribute. Instance palettes
already exist, so removing that extra shader flag restores their intended colors.
Ivy placement also changes from scattered points above the wall to two trails
below the eaves, outside the door and trim. Counts remain 58 leaves / 132 flowers
and nine environment draws, with no new resources or gameplay changes.

The GPU readback regression renders the real production geometry/materials in
isolation and asserts visible, colored output and front-wall placement at both
844/1280 viewports. Its initial fixed attempt sampled linear RGB bytes using a
display-brightness threshold; dark but green pixels triggered that diagnostic.
The corrected target uses sRGB, as the canvas does. The >30 brightness and >95%
color thresholds, geometry count and placement assertions are unchanged. Both
failed attempts and their outputs remain preserved in workspace evidence.

Local: 52 core units; actual GPU color check at both viewports; unchanged complete
scene-polish browser checks; all 24 noon/golden/rain overview/first-person images
at full CSS drawing resolution with zero cuts and exact 8-geometry/2-texture
sandbox cleanup. Fresh hosted results are required for this changed head.
phase7m v3 / sa3d-v39 is deliberately synchronized; deployment awaits merge.
Authored hands, ground/grass refinement and full barn integration remain pending.
