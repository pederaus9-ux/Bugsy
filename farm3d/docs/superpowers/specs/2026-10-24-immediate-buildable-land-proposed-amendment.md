# Proposed amendment: immediately usable grassy land

Status: **owner chose immediate unlock; named protected-file scope pending**. No runtime change, tree removal, purchase or deployment is authorized by this document.

The owner asked for the grassy map to become useful for building, with removable trees and a larger farm. When asked whether suitable ground should unlock immediately or through earned-coin parcels, the owner answered **“Immediately”** on 2026-10-24. This settles availability without a parcel purchase. It does not set a tree-clearing price or waive physical placement checks.

## First bounded playable slice proposed for review

Use the already level north-east clearing, x=14..25 m and z=-44..-28 m, as an initial immediate extension. Its ground sampler is exactly y=0 at sampled corners, yet current `onFarm(...,24)` rejects many points (for example x=24,z=-40). The captured fixed-block fixture has no blocks in x=14..27,z=-46..-25. This is a candidate tract, not a claim every full footprint or animal route fits. Keep terrain heights and the stone path unchanged. A feature-specific, explicitly bounded buildable-land mask in `farm-land.js` should include this tract while preserving the existing farm mask for unrelated systems; ordinary workshop and animal-pen placement would consume that single mask. The existing grid should expose the tract as unchecked until a selected whole footprint is validated.

Acceptance before a private-preview update: retain an exact RED for a workshop at a measured unobstructed position that is currently rejected solely by land membership; prove a saved/reloaded legal placement in the tract, with original footprint, ground support, path, tree/object/pen, entrance and care-route controls unchanged. Old saves, ownership, fixed chicken yard, tree positions and paid state remain intact. Invalid tree/object/path/support/cow-access samples remain rejected. Camera and touch can reach every added point, and the neutral grid never implies permission. No test seed, assertion or deadline is weakened.

## Protected-file consent needed

`farm3d/farm-land.js` is explicitly protected. Its only recorded exception A1 is the 10 m west horse strip; the adapter registry says no further land-byte changes are authorized. The owner's broad request and “Immediately” answer did not name this file or the first tract. Before editing, ask the owner to approve **a new narrow exception allowing only the buildable-land mask for the measured north-east tract in `farm3d/farm-land.js`, with no terrain-height change**. Record the exact old/new digest and negative lock controls like A1. Do not implement the same effective mask elsewhere to evade this gate.

After this slice, widening across outer hills requires separate support/terrain and camera decisions, not a blanket 220×220 buildable declaration. The two near trees have stable edit IDs and `layout.t` positions; 14 hill trees and 70 distant woods are decorative instances without equivalent saved-removal IDs. A separate tree-removal amendment should add stable IDs, confirmation, atomic persisted removal and old-save defaults. The owner allowed delete or pay; use free removal unless a future exact earned-coin cost is approved. No real-money path or Firebase change is proposed.
