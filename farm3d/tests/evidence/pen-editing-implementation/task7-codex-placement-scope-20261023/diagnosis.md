# Occupied facility placement and rebind diagnosis

Base `95a21337e3e140c4c383a09964256a0f4c58fa38`; sole worker, parent-selected/disclosed Astra / xhigh. This checkpoint changes no runtime, old tests or physical limits. The separate default-cow authority finding is in `authority-audit.md`: that proposed correction remains held for owner approval and is not needed to reproduce this new contact defect.

## Retained placement failures reproduce exactly

`animal-pen-placement-diagnosis.mjs` replays the captured real World/actors from the original shelter and active-feed failures through the unchanged production validator. It restores only the unserializable `groundY` function with the exact production `farmGroundY`; `index.html` defines `groundY=farmGroundY`. No actors/tasks/reservations are created, removed or relocated by these read-only evaluations.

- Original occupied shelter `[-3,-38]`: the complete issue list matches exactly: PATH, physical component OVERLAP and robot-exit ROUTE.
- Original active-feed bunk `[-8,-34]`: the complete issue list matches exactly: ROAMING for cow-3 and cow-5.

The shelter's full supporting slab/footprint must remain clear of the path and on accepted land. The unchanged-component exception preserves the accepted overlap only at the default position. The recorded primitive intersections are real positive-volume intersections for the rejected moves, not permission to ignore slabs or nearby hardware. Five additional shelter-only north candidates and five coherent whole-cow relocations remain invalid. The whole moves are separate candidate journeys, not substitutes for independent shelter installation. This finite search proves neither global impossibility nor a validator defect; no placement rule is changed.

## A separate approved-layout journey reaches Apply

The two free waiting cows in the active-feed capture sit approximately 1.50 m and 1.46 m from the south boundary. The ordinary route contract requires the existing 1.6 m inset. They remain legal care-clearance placements but fail the ordinary witness. The validator therefore correctly rejects the original unchanged-boundary draft.

Three separate south-boundary expansions to Z=-32.6/-32.4/-32.2 validate with the same active-feed World and bunk move. These are read-only geometric candidates, not native editor proof. Native snapping is tested separately:

- Moving the entire south edge down 1 m reaches Z=-31.8 and overlaps the neighbouring pen: rejected, preserved.
- Moving both south posts down 1 m snaps them to `[10,-32]` and `[-14,-32]`. That draft shifts the gate span and intersects the fixed path: rejected, preserved.
- Widening the existing gate by 1 m, to 3.3000000000000003 m, clears the path. Full validation passes without changing path, margins, obstacles or any validator code.

The actual browser journey uses trusted native selection/nudge/widen controls: south posts v2/v3 down 1 m, existing gate0 widen 1 m, feed bunk up 1 m to `[-8,-34]`. It preserves all other structures, north posts, runs and gate identity/offset. Every original assertion in `animal-pen-feed-bunk.browser.cjs` remains in the executed source; the new wrapper only adds those separate draft operations, matching expected geometry and passive failure captures.

Both native attempts pass full validation, Apply, exact equal-clock paid state and scheduler tokens, actual bunk/station geometry, and all 46 publication placements. There are 74 trusted input events per run. They then fail the original first-resumed-frame contact assertion. They are **FAIL**, not successful facility qualification. Save/reload and visit completion are not reached; 30/120 Hz continuation is not run after the 60 Hz failure.

## New genuine defect: publication preserves a hold at the wrong position

Primary evidence: `native-expanded-feed-60/results.json` and `rebind-analysis.json`.

| Measurement | Value |
| --- | --- |
| Cow | cow-2, actual feed station cow-feed-2 |
| Before Apply root | `[-7.199998680169886,0.08,-34.01280794733201]` |
| Before Apply mouth error | 0.006759888037204301 m |
| World component | null; careStationId is cow-feed-2 |
| Validated/published staging root | `[-7.579999999999988,0.08,-34.68000000000005]` |
| New station dock | `[-7.000000000000001,0.08,-34.95]` |
| Task after publication/resume | hold, weight 1, same token and until |
| Publication mouth error | 0.6505323896767691 m |
| First resumed-frame mouth error | **0.6653708561248657 m**, limit **0.08 m** |
| Camera-only side replay | **0.6650242500687762 m**, same failure |

The relevant code chain is:

1. `index.html::snapshotPenWorld` associates a component only if the actor root lies inside its footprint. The feeding cow stands on the unchanged shelter slab outside the bunk footprint, so it has no moved support component.
2. `animal-pen-validation.js::validateAnimalPens` treats a recognized care station separately from free roaming. When the old root is invalid after the bunk move, it chooses generic separate clear staging and proves care routes. It does not prove that this staging position can continue an already full-weight contact.
3. `animal-pen-cow-adapter.js::prepareLayoutRebind` publishes the validated staging point and the new station, clears paths/targets, and retains stage/weight/until. Only an existing approach stage receives new approach waypoints.
4. `index.html::updateCowTaskStep` processes hold without root approach. The root remains exactly at the staging point on the first resumed frame and the existing pose cannot contact the moved bunk.

The new failure is therefore a placement/contact/rebind contract mismatch. It occurs with `currentLayout.sites.cow.custom=true`, before ordinary cow movement or the default speed failure. Exact paid state and tokens matching does not imply physical care validity. Original historical default whole-herd/whole-save comparisons remain unchanged and are not made green by this evidence.

## Next bounded integration action

Task4 already requires revision-aware care preparation, retaining pose/barriers/reservations and resuming through actual stand/entry/exit behavior. The smallest follow-up is contact-aware handling of displaced feed/drink holds across `snapshotPenWorld`, validation placement and `createCowPenCareAdapter.prepareLayoutRebind`, with only the necessary custom care transition in `updateCowTaskStep` if needed. Preserve the original RED first. A validator cannot publish a generic staging point as a valid full-weight hold merely because a route to the station exists.

Choose and prove the precise transition before implementing it. A supported bed/robot occupant has an expressly authorized support-local edit relocation; a cow standing on unchanged ground beside a moved bunk does not automatically inherit that exception. Do not silently teleport it to the new dock, widen mouth tolerance, label an off-contact hold successful, clear/reissue its reservation, reset paid cycles, or increase the timer/deadline. Physical disengage/reapproach may be possible through existing stages while preserving authoritative paid state; its reservation, pose-continuity and valid-contact timing semantics still need exact design and tests. Rejecting all occupied moves or redefining edit relocation would be a product decision, not an assumed fix.

No runtime candidate is applied in this bounded diagnosis. The follow-up is independent of the held default-speed proposal and requests no cow-rig, land/path or economy/auth scope. If a valid transition cannot preserve the approved contracts, report the precise owner decision needed before implementation.

## Evidence limits and remaining work

Pinned local Windows Chromium 151.0.7922.34 / Playwright 1.62.1, 1280x720, drawing scale 0.5. Full46 ownership, five actual cows manually updated, other41 static; original fixture stock/time/seed behavior retained. Native input applies the draft; debug APIs only establish the existing care fixture/observations/camera. No synthetic care task or actor relocation is injected by the probe.

The first actual render is roof-occluded. The separate side replay (`native-expanded-feed-side-60/occupied-feed-resumed.png`) shows the real installed scene and cows, but the body/fixture angle still limits direct mouth-gap inspection. Measured world-space muzzle/target coordinates are the primary evidence. No physical-device, hosted CI, cloud, full-farm, independent-audit or owner visual acceptance claim.

Occupied shelter/slab legal placement and functional support remain unresolved. The original active-feed single-move rejection remains valid; the separate combined draft proves Apply is reachable and exposes the contact defect. It does not replace either original acceptance case or the previously credited bed-occupied bunk journey. Other facilities, internal mixed traffic, imports and Task8 remain pending. A4 exterior trips/transfers remain deferred.

All owned commands/browser/server pairs completed; no executor disconnect or new tool denial. Prior external CIM inventory unavailable/not retried. No merge or deployment.
