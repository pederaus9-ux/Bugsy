# Bounded cow separation correction

The original edited-layout RED is reproduced unchanged in `red-60`: frame2722/45.3667s, gap .8451317882721067m against .85m. Actual native bunk Apply, five charged feeding demands, herd/seed4242 and all deadlines remain unchanged. The earlier occupied shelter and active-feed placement rejections remain unresolved in170347b.

## Mechanism and exact correction

The retained trace identifies ordinary Cow4 moving toward reserved-approach Cow3. The final ordinary block had only support/speed limiting after soft steering and pen projection; directed care already checks .85m. New actual-source position tests reproduce four failures (retained breach, segment tunnelling, closer movement from an existing overlap and second-neighbor collision), with three controls passing.

Only `index.html::Beast.update`'s existing ordinary custom-cow final block changes. It first computes the same support/speed-limited candidate. It then checks the minimum horizontal distance along that actual displacement against every other cow. A clear pair cannot cross .85m; an already-overlapping starting pair may only move without getting closer, allowing recovery without teleportation. An unsafe displacement is rejected, and velocity is derived from the resulting actual displacement as before. No alternate step, route rewrite, priority, reservation mutation, footprint relaxation or geometry edit is introduced. Default cows and other species do not enter this branch. All code outside this block matches the baseline byte-for-byte.

The candidate initially stops an unsafe ordinary step, but is not credited merely for stopping: all five original paid feeding visits finish and release under the original60s bound at30/60/120Hz. Normal directed/ordinary decisions continue to clear the queue. One candidate only; its exact runtime is retained in `candidate1-index.html`.

## Results

| Rate | Five visits finished | Minimum separation | Full-weight feed frames | Maximum muzzle error |
|---|---:|---:|---:|---:|
|30Hz|56.8667s|.850108992m|1038|.015472887m|
|60Hz|57.4333s|.850098165m|2076|.015747513m|
|120Hz|54.8333s|.850004719m|4145|.033575085m|

All three original fixture runs pass native Apply/46 validated placements, occupied-bed tasks/tokens/paid state, installed geometry, continuous containment/full3D speed,1e-10 planted support/drift,.05 liftoff,.08 feeding contact, actual five-visit completion/reservation release and save/reload46. Max support2.152e-15m, drift1.519e-14m, liftoff.019719481m. These are five actual cows with other41 actors present/static, not full-farm traffic.

Focused Node group:76/76 PASS, zero skips, including the seven new physical step tests, existing support/runtime crossings, roaming, rebind/resume/wait/route, robot arrival/phase/station/contact and A3 negative lock controls. Initial new step suite3PASS/4FAIL retained, then7/7PASS. These overlap the76 group; do not sum as83 distinct tests. Core runner adds one file only,108 registered; no full-core rerun claimed.

Directly affected existing browser regressions at60Hz: live trough with all-cow motion guards PASS29.55s, minimum separation1.371891945m across8865 actor updates and3534 ordinary moving updates. Occupied robot installation/service/exit/reload PASS17.4s,449 cup-contact frames, max radial.000277777m below.025m, exactly one gallon and3XP. All original assertions retained. Other old robot/trough rate cases remain credited on prior bytes, not falsely rerun here.

## Baseline versus edited layout

The default-layout control uses the same real occupied-bed positions/tokens and normal feed/water actions, with no editor Apply. Before and after the patch it fails an earlier ordinary Cow1 speed assertion at frame1002/16.7s, with identical .0020047129475116426m excess and offending position. Therefore it cannot establish the default farm's eventual separation or all-five queue outcome. It is not a passing default-farm qualification or proof that the exact edited collision occurs there.

An attempted strict all-herd before/after comparison failed and remains retained in `default-comparison-red.cjs/log`: another cow differs by one directed step (.0132461m X/.00152301m Z). Setup reached the same bed state in37 versus1 manually observed updates; the browser fixture does not fix all startup timing. No tolerance or assertion was relaxed to make this comparison pass. `default-comparison.json` reports the partial match only. The isolated actual final-block replay separately confirms identical default-policy behavior for the retained input, and byte audit confirms no code outside the custom block changed. No default-speed correction is included in this scope.

## Rendered evidence and limits

Initial canonical screenshots preserve an obstructed camera angle. The camera-only `preview-60` supplement retains every original physics/assertion and passes. Its `first-feed.png` and `retained-red-frame.png` show actual runtime cows under the canopy; no meshes hidden or actors repositioned. The latter captures frame2722, the former RED time, after correction. Some rail/cow occlusion remains; positions/contact measurements establish numeric limits. No visual approval inferred.

Pinned local Windows Chromium151.0.7922.34/Playwright1.62.1 revision1234,1280x720,DPR.5. Native mouse/keyboard editor; API preset/stock/fixed-wall-clock fixture; manually stepped five real cows, others static. Not hosted CI, physical device, cloud, full46 physics, independent audit or final visual acceptance.

## Remaining work

This closes the reproduced custom ordinary-versus-directed separation defect for the retained case and tested rates. It does not establish every arbitrary layout or long-duration mixed queue. Occupied shelter/slab placement/support/reload and active-feed-hold move/rebind remain unresolved; the bed-occupied bunk success never replaces them. Held/off-slab facilities, other species' functional edits, full internal mixed traffic/both coop doors, new-farm/2D import and Task8 qualification remain pending. The new default-control speed RED is preserved separately and needs scope/triage before any default behavior change. A4 containment-only, all A1/A2/A3 bytes and historical evidence remain. No merge/deploy.
