# All placed world decorations — candidate review

Base9214e564f64c43ab4ccf3eb1175a075d34e32a70. Owner request06:27Chicago,
October20: extend the accepted pumpkin treatment to every remaining flat,
camera-following decoration. Farm Utility is separately selected for new lights.

The catalog has54IDs. Existing21holiday models and2procedural trees are retained.
The remaining31shop/event/season props now use owned, merged, solid geometry.
Placed orientation is independent of camera orbit; the old fallback/card loop is
removed. All31fit their existing circular bounds, have complete above-ground
geometry, at most12draws/6500triangles, and deterministic resource disposal.
Existing material/normal/terrain APIs are used. Grass clearing/restoration extends
to these solid props. Save schema, game.js, catalog IDs/costs/prizes, controls,
Firebase, animals, characters and accepted holiday models are not changed.

Cache50to51 adds decor-models.js?v=1; game28 and worker algorithms stay unchanged.
Three existing tests follow the intended cache identity only. All original tests,
assertions, tolerances and timeouts remain; the new native job is separate.

Baseline55PASS. New tests first expose31billboards/rotation and missing factory.
An initial test-loop selector was corrected to target the actual camera-facing
loop; its raw error is retained. First model run88/89PASS fails blossom6540tris.
Reducing blossom clusters brings it to5940under the unchanged6500cap. Grass
clearing has its own old-condition RED/new-condition GREEN. Current101focused
checks pass, including all54legacy IDs/paidcounts/positions/rotations through the
actual save/load path. See tests/evidence/decor-catalog-20261020/local.

Native capture/appearance/GPU/native input/offline and full CI are pending. Local
Chromium is absent; no local browser result is invented. All browser evidence
must use disposable synthetic farms, not owner profiles or saves. Owner reference
images were inspected inline; original attachment paths were unavailable and are
not claimed as recovered or published. No real player data is put in evidence.

The model study is actual engine rendering, labeled separately from actual farm
screenshots. Neither is generated concept art. Review front/side/back silhouettes
before owner acceptance. Geometry tests alone do not establish visual quality or
physical Android/iPhone performance. Keep draft/unmerged until final exact-head
checks, actual render inspection and explicit owner approval.


Native attempt1 at2e804feb: all3widths pass actual volume/ground/orientation and
native buy/move/done/reload/put-away. All31front/side/back renders were inspected;
no cards or cut-off geometry observed. The separate model study fails cleanup:
127geometries→0,1texture→1, while the new test incorrectly expected every renderer
texture to reach0. Actual Three r186 source creates the shared16x16 DFG_LUT for
standard materials; model factory creates no textures. Next test-only observer
renders/disposes an independent plain cube before any model, records that LUT
and baseline, then requires exact model cleanup equality. This preserves zero
owned-geometry/texture leakage; hosted baseline proof and offline stage remain
pending. Original exit1/log/artifact retained under native-attempt-1. No runtime
change follows this test finding, and no whole-job pass is claimed.
