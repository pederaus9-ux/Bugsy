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


Offline setup correction: the native script atf122b8e waits on serviceWorker.ready
on the harness HTTP origin without registering any worker. The unchanged page
auto-registers only when location.protocol is HTTPS. A source-VM counterexample
executes the actual page guard and test callbacks: HTTP auto-register0, HTTPS1;
old setup reads ready with0register calls and never resolves. The corrected test
explicitly registers sw.js, as existing installed-update suites do, then waits
up to90seconds for the activated predecessor to control the page. No production
worker, registration policy, save assertion or update assertion changes. Native
proof of the corrected offline path remains pending; source-VM proof is not a
browser result. Thef122hosted job was still running when this guaranteed setup
hang was identified; preserve its eventual cancellation/timeout logs separately.


Isolated native offline proof now passes atcc2274bd, run39422484072/job118626666214
(exit0, artifact12265065857/SHA256851a76f83c514020898eed68fe64dff5cf761fa4ec23e7ee484b63dc91b2136d).
The actual50worker is activated and controls localhost; requested51worker then
replaces it, cached moduleSHA256matches81d49f5e3a7f4717df4653b3c577ebc569359b3c45267a81a521fc6ad9705dd7,
and online/offline reload preserves paid inventory, stocks, farm and rotation.
The full test receives the exact synchronous readiness fix. Diagnostic workflow
and subset script remain on the separate branch; they are not added to this PR.
No product source changes follow any of these fixture corrections. One full
final PR-head native run and all19checks are still required before owner review.


## Final exact-head qualification — 2026-10-20

PR88 head f0a043f620d634c164f94c27ddd546609d7f32c2, tree
5d912e6a5489133a1076c911f20073ba38f8945a. CI merge65c0e30e6e98efbbdd6b174b2fd5f2a748f75fd5 has the identical tree.
All19 checks and all3 workflows39423140872/39423140835/39423140795 SUCCESS.
Core job118629370887:296 Node assertions across43 files/46 processes, all5
original browser suites ENDcode0, full completion footer. Catalog job118629370830
passes10 native groups and91 Node contracts. Actual final artifact12264844029
SHA25646ff4eff8a2d5c09c2aa7ceeda128886867f452d4a365d8eaf0aad2fe10b8473.

All31 front/side/back actual model studies and actual390sunflower/844lantern/
1280maple farm orbits reviewed. Models are complete, grounded and fixed in world
orientation. Real buy/move/done/reload/put-away and50->51worker online/offline
paid-save retention pass.127 owned geometries are released; exact memory returns
to independently warmed0geometry/1sharedDFG_LUT texture baseline.

The third fixture failure was an async polling predicate returning a truthy
Promise before activation; retained source counterexample uses actual installed
Playwright polling semantics. Synchronous Boolean registration/activation/control
wait fixes the observer. No runtime change, assertion relaxation, timeout
extension or skipped original test followed any fixture correction.

All previous pending fields above are historical checkpoints superseded here.
Failure logs/traces and cancelled partial result are retained. Physical phones
remain untested. This is lead self-review, not owner acceptance. Farm Utility
real-light feature remains next, separate from this PR. PR88 stays draft/open/
unmerged pending owner appearance acceptance and explicit merge approval.
Final evidence is on a separate branch so the tested PR head remains unchanged.
