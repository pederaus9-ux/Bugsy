# Proposed amendment: immediately usable grassy land

Status: **owner-approved land-mask exception; first tract implemented and locally qualified**. Tree removal, further suitable ground and private publication remain separate.

On 2026-10-24 the parent asked: “may I edit farm3d/farm-land.js to expand buildable land, starting with a level northeast section, without changing terrain heights? That section is the first test step, not the final limit. The goal remains all suitable grassy ground unlocked immediately, with tree clearing handled separately.” The owner answered **“Yes”** at 11:56 UTC (Sentinel_6d56f28a74f88191beec988e25e39d39). This is the new named-file exception. `farm-land.js` SHA-256 changed from `6a739a8a18ed838f7e23fd37cfaad1768a2e21185fbb1ee6b3cb2f089ac45b70` to `d736eb4e62d24d2402ff1a12ab0edcd8feca45f2372cf471f25698a922d5b947`. The exact unchanged prefix and suffix digests are registered and checked with negative lock controls; A1 terrain, old `onFarm`, player clamp and other protected bytes remain intact.

The owner asked for the grassy map to become useful for building, with removable trees and a larger farm. When asked whether suitable ground should unlock immediately or through earned-coin parcels, the owner answered **“Immediately”** on 2026-10-24. This settles availability without a parcel purchase. It does not set a tree-clearing price or waive physical placement checks.

## First bounded playable slice

The already level north-east clearing, x=14..25 m and z=-44..-28 m, is the initial immediate extension. Its ground sampler is y=0 at all four tract corners. A workshop at (20,-40) failed the old land boundary and passes the new whole-footprint check. This is a first tract, not a claim every grassy hill supports a building. Terrain heights and stone path remain unchanged. A feature-specific mask in `farm-land.js` preserves `onFarm` for unrelated systems; ordinary workshop and animal-pen placement consume the new tract. The grid exposes it as unchecked until a selected whole footprint is validated.

Acceptance before a private-preview update: retain an exact RED for a workshop at a measured unobstructed position that is currently rejected solely by land membership; prove a saved/reloaded legal placement in the tract, with original footprint, ground support, path, tree/object/pen, entrance and care-route controls unchanged. Old saves, ownership, fixed chicken yard, tree positions and paid state remain intact. Invalid tree/object/path/support/cow-access samples remain rejected. Camera and touch can reach every added point, and the neutral grid never implies permission. No test seed, assertion or deadline is weakened.

## Protected-file exception

`farm3d/farm-land.js` is explicitly protected. Its previous sole exception A1 is the 10 m west horse strip. The new explicit owner answer above permits only the buildable-land mask, starting on the measured north-east tract and expanding to other suitable grassy ground after independent safety checks; it does **not** authorize terrain-height changes. Record the exact old/new digest and negative lock controls like A1. Do not implement the same effective mask elsewhere to evade this gate.

After this slice, widening across outer hills requires separate support/terrain and camera decisions, not a blanket 220×220 buildable declaration. The two near trees have stable edit IDs and `layout.t` positions; 14 hill trees and 70 distant woods are decorative instances without equivalent saved-removal IDs. A separate tree-removal amendment should add stable IDs, confirmation, atomic persisted removal and old-save defaults. The owner allowed delete or pay; use free removal unless a future exact earned-coin cost is approved. No real-money path or Firebase change is proposed.
