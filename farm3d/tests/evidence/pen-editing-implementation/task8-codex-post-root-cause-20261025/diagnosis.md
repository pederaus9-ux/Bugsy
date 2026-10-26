# Cow post-entry root cause — evidence-only checkpoint

Runtime baseline: A20 `3954a08a9645a2afd7d9bb252e7028c582fd4845` on `codex/safe-test-preview-20261023`. Protected `index.html` SHA-256 remains `c68f7dd240c4dd724453d3bad914ec213e8d30e4c01ff01c3ef195556fc401d0`. No game, rig, accepted test, seed, tolerance or deadline changed in this investigation. No new protected-file amendment was needed because all additions are diagnostic/evidence files. Any future runtime amendment must be recorded before editing.

## Required invariant

The approved pen design, `docs/superpowers/specs/2026-10-21-player-editable-pens-design.md:103–104`, requires complete shapes and continuous segments, a body-clearance route, and explicitly says: “Actual standing/turning skin and existing contact assertions remain part of validation/qualification; a centre-point route alone is insufficient.” Its revision/install contract at lines 91–96 requires rendered and physical objects to share the resolved layout. A4 defers animal exterior passage; it does not relax internal physical safety.

Preserve the existing 0.85 m cow separation, 0.8 m/s directed speed, all support/hoof/contact limits, reserved station identities, containment, 500-second care/departure goals and 40-second individual wakes. Root padding is a routing guard, not proof that the rendered body clears a post.

## Bounded reproductions

Both diagnostics use the original real sheep exterior-gate relocation, all 46 animals, seed 1 and 30 Hz. The normal night/wake setup and limits remain. A separate observer records Cow 3/4 movement without changing RNG, actor motion or animation, then deliberately stops at a specified root-padding entry. These are retained safety REDs, not completed matrix cases.

| Evidence | Runtime served | Diagnostic stop | Result |
| --- | --- | --- | --- |
| `first-entry/results.json`, trace ZIP, rendered failure PNG, frozen `observer.js` | A20 `3954a08` | First crossing into the post's 0.42 m padded rectangle | Cow 3, clock 635.9471333334243; 6 deformed mesh vertex records inside the real post while the root remains outside the 0.4 m padded rectangle |
| `a19-point4-entry/results.json`, trace ZIP, rendered failure PNG, frozen `observer.js` | Immutable A19 `01d399d318b6013d2dc3b0d22534b0467791f521` | Log 0.42 m crossings, stop at first 0.4 m crossing | Same defect predates A20; 473 vertex records inside the real post at clock 636.144933333436 while the root remains outside the 0.4 m rectangle; direct movement then crosses that rectangle at 636.911600000102 |

The observer versions differ only in the documented stop condition and recording vertex coordinates. Original matrix assertions and historical files are untouched. Both tests completed their first night and wake before the targeted second-night observation. These clocks identify the first *observed padded-root crossing*, not the earliest possible mesh contact: the longer body may contact before its root reaches that boundary. Vertex records can duplicate geometric vertices, so the count is not penetration depth or contact area.

The local browser harness used installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and the existing Playwright module/isolated loopback harness. This is local Chromium evidence, not hosted CI or physical-device qualification. No diagnostic process remains active.

## Geometry: actual penetration, not merely padding overlap

The resolved layout and installed `__dbg.BLOCKS` both contain post 4 exactly as `[2.2,-36.45,0.065,0.065]`. `cow-yard.js:76` renders a 0.13 × 2.7 × 0.13 m post centred at local y=1.43, with its bottom at y=0.08 and top at y=2.78. The northern site's resolved position matches the browser blocker. This trace does not support a stale installed-block hypothesis.

The observer reads the actual deformed skinned mesh with current world matrices and skeleton, using the bundled Three.js `SkinnedMesh.getVertexPosition`, then transforms each point to world space. For example A19 vertex 76 is `[2.2486467802703305,1.2736877235801989,-36.51146478055825]`. All three coordinates are strictly inside the actual post volume. Vertex 82 and the other retained samples independently confirm this. Translating these exact witness points by +3 m in x makes every inclusion check false. A positive vertex witness proves intersection; zero included vertices would **not** prove two meshes disjoint and is not proposed as a complete future safety oracle.

The unchanged cow's measured resting footprint in its own frame is x `[-0.4061111179,0.4061111179]`, z `[-1.0927221709,0.7224930265]`, maximum planar radius `1.0960786925` m. This resting measurement is not a certified gait/care envelope. It establishes why a 0.42 m point radius cannot represent the cow's length or turning sweep. Simply inflating to a universal 1.096 m disk could overblock the roughly 2.1 m robot rail spacing; that is a compatibility risk, not a demonstrated safe remedy.

## Causal chain and exact integration points

1. **A static route becomes stale after avoidance.** `index.html::updateCowTaskStep`, lines 2226–2230, permits a lateral step around another cow. It checks only the proposed root endpoint against yard obstacles using 0.4 m padding. It leaves the original route nodes in place. The retained recent-frame rings show sideways travel away from the previously planned segment.
2. **Direct rejoining trusts that stale segment.** Lines 2217–2221 compute the next step toward the old waypoint and check other cows, but perform no static swept-obstacle or body check before writing the root position. The A19 first 0.4 m entry is exactly the normalized direct step toward `[0.2,-36.8]` at `0.8/30` m: residual `2.4808971774513893e-16`. This is not a support snap or unexplained teleport.
3. **Replanning can exempt the post after entry.** `route` at lines 1674–1687 constructs `skipA`/`skipB` for every obstacle containing an endpoint under the requested padding, and ignores those obstacles on incident edges. In the retained A19 state, the remaining segment intersects post 4. A fresh plan just before the 0.42 m crossing detours through `[1.595,-35.845]`; immediately after crossing it returns the direct `[0.2,-36.8]` path. Thus replan alone is not a safe recovery.
4. **Planner and executor use different geometric guards.** `insideObst` at line 1660 uses full padding; rectangular `hitsBlock` at line 1662 subtracts 0.05 m. With the cow route's 0.42 m request, the latter checks only 0.37 m. The retained entry step returns clear under that existing predicate and obstructed when a diagnostic compensates for the shrink. That diagnostic is evidence only; no margin was changed in production. The lateral executor separately uses 0.4 m.
5. **None of these guards bounds the actual turning body.** `updateCowTaskStep` commits translation, then calls the unchanged `Cow3D.updateCow3D` at line 2255. `cow3d.js:259–280` independently limits heading change using its 4 rad/s cap and planted-hoof reach. The route/direct/side checks contain no oriented skin envelope for that resulting heading. The align/hold heading update at `index.html:2241` is another stationary-turn path the eventual predicate must cover; it is not the cause of the captured approach entry.

The A18 and A20 diffs add restricted cow-traffic detours; they do not change the underlying route exemption, rectangular shrink, direct rejoin or turning-body contract. A20 improves care completion for this case but does not establish physical safety. The A19 comparison proves this is not solely an A20-introduced incursion. It does not identify the earliest historical commit with the defect or quantify all affected sites.

## Why earlier focused passes were insufficient

The A18 post controls in `tests/cow-scene.test.mjs:258,275` test root coordinates against 0.4 m padded rectangles; they do not inspect the deformed body. The A20 captured fixture begins after an already-penetrating entry. Its new post assertion failed at the starting fixture and was explicitly excluded from that new fixture; existing assertions remained. Those 37/37 checks demonstrate their recorded separation/speed/support/traffic conditions, not post-skin safety. Historical passes and all original REDs remain preserved, without relabelling them.

## Smallest coherent correction to prove next

Do not add another shared-corner/final-bed exception. The selected direction is a **cow-specific motion contract in the existing controller/navigation adapter**, used for route edges, each actual direct step, lateral avoidance and route rejoining. It must check the installed immutable site, complete swept root clearance, and an oriented conservative body/turn envelope compatible with the unchanged rig. Normal travel must not blanket-exempt a containing post. Any recovery from an already-invalid historical state needs a separately proven nonpenetrating physical exit, never teleportation or ignored collision.

Keep generic routing for other species unchanged initially. The intended runtime integration is `index.html` cow routing/task functions (`beginCowTask` only if route construction requires it, `cowSharedCornerDetour`, `updateCowTaskStep` and cow-specific helper calls); a small pure geometry helper can keep the contract testable. Preserve station contact geometry and the rig. The existing broad A14 owner pen-fix grant covers routine pen adapter work, but record the exact named-file preimages and proposed changes before editing. This is a selected design direction, **not an implemented or verified candidate**.

The immediate bounded next step is a pure/captured-replay proof of the envelope and valid route around this post, including its turn, followed by the same predicates on all existing bed/feed/drink/robot approach corridors. A constant enlarged disk, root-only sweep, endpoint replan alone, or permanent stopping would each leave a demonstrated safety or liveness gap. If the unchanged rig cannot execute a proven safe turn through an accepted corridor, preserve that failure and identify the exact additional scope; do not widen a route, change a rig limit, or call stopped cows a success.

Before runtime integration, controls must establish:

- The two retained direct/sidestep/rejoin entries are rejected; clear parallel paths and legitimate dock/contact approaches remain executable.
- Longitudinal body overlap and rotation beside a post fail even with a clear root; genuinely disjoint shapes pass. Use swept shape intersection plus real rendered mesh witnesses, not absence of included vertices alone.
- Installed post relocation/revision is read consistently; a genuine external obstacle blocks, and no blanket start/goal exemption masks it.
- Replay both stable identities and update orders at 30/60/120 Hz, preserving 0.85 m separation, existing speed/hoof/support/contact tolerances, original station tokens and the 500-second goal. Blocked yield space cannot produce overlap, teleportation, unbounded replanning or a false completion.
- Re-run the original gate and directly affected dog-nook/shared-corner care cases only after the focused physical proof. Care/wake and physical evidence must be reported separately. Broad 30-case requalification remains paused meanwhile.

## Research and limits

The authoritative [OMPL state/motion validation documentation](https://ompl.kavrakilab.org/stateValidation.html) distinguishes valid states from valid connecting motion and warns that coarse interpolation can miss invalid intermediate states. This supports checking executed sweeps rather than only endpoints; adopting OMPL is not proposed. The [Three.js SkinnedMesh documentation](https://threejs.org/docs/pages/SkinnedMesh.html) describes animated skinning and bounds updates; the diagnostic uses this repository's actual bundled implementation, not a substituted library.

`cow-post-geometry-analysis.mjs` passed its causal assertions and translated negative control; `geometry-analysis.json` explicitly reports `DIAGNOSTIC_ASSERTIONS_PASS_RUNTIME_SAFETY_RED`. A safe fix, whole-body turn envelope and complete motion oracle remain unproven. Current A20 care/wake credit remains **1/30**, with full physical qualification blocked; older runtime passes are historical. Other Task 7/8 recovery/cloud, hosted/device and release gates remain open. No remote writes, Site update, merge or deployment. A read-only GitHub ref check failed DNS resolution; it was not retried and did not affect local diagnosis.
