# Player-editable pens — Amendment A1: room for the horse paddock

Status: **proposed — awaiting explicit owner authority for the protected land change** (candidate patch: `tests/evidence/pen-editing-implementation/task7-claude-20261022/horse-room-A1-candidate.patch`).

Date: 2026-10-22. Applies to the approved specification `2026-10-21-player-editable-pens-design.md` (commit `a2f0b8c`, SHA-256 `f4b63398…ba49`), which stays byte-identical. Where they disagree, this amendment wins for the items below only.

## Owner decision

After being shown that the chicken yard and the horse paddock had no legal whole-pen move, the owner decided (2026-10-22): **"Chickens can stay horse needs to move"**.

- Chicken yard: no change. It stays fixed as a whole; reshaping remains subject to the approved rules.
- Horse paddock: must be movable as a whole on an ordinary farm.

## Measured cause (local diagnostics, live World snapshot, real validator)

- The horse paddock fills its slot. The stone path is 0.5 m east and runs along its diagonal edge. The cow yard is 0.5 m north. The levelled north field ends at x = −23, and the accepted stable already overhangs that edge by 0.65 m (its two west corners sit 7.4 cm and 3.6 cm into the slope). South of z = −25 the ground slopes.
- Pen buildings are built for level ground at y = 0 (no yard builder reads ground height). The approved support rule therefore keeps every moved footprint and station point at its accepted ground height. That is correct physically, and it means the paddock can only move onto level ground.
- Even with unlimited pen land, only a 1 m north move validated. Land alone does not free the paddock; it needs more level ground.

## Changes

1. **Terrain.** The north clearing's level ground extends 10 m further west. Ground is fully level for x ≥ −33 (previously x ≥ −23) within the existing z band, fading over the next 4 m (to x = −37). The east side, the north and south fades and all other ground are unchanged. The ground mesh size is unchanged; no new world area is added.
2. **Pen-editable land.** Adds the west strip polygon x ∈ [−33, −19], z ∈ [−46, −17]. It overlaps the farm capsule so that clearances crossing the seam stay contained, and it reaches z = −17 so the horse gate's outside approach stays on land. Ordinary decor placement (`onFarm`), the player movement clamp and plot deeds are unchanged.
3. **Hill trees.** The existing rule that keeps hill trees out of the north band widens on the west side, so no hill tree stands in the levelled strip or its fade. Only one tree moves, from x ≈ −27.1 to x = −40.
4. **Cache.** `farm-land.js` ships on main, so its import version becomes `?v=2` everywhere.

## Protected file — needs explicit owner authority

`farm-land.js` is a protected file. The reviewed-bytes guard (`tests/remaining-care-integration.test.mjs`) pins its digest, and the owner-approved pen adapter registry (`tests/animal-pen-authorized-adapters.json`) states "No authority to change rig, ledger, auth, land or path bytes". Change 1 is a land-bytes change. It is held as an uncommitted, locally verified candidate until the owner explicitly authorizes it. On authorization, it is registered through the existing mechanism: the frozen predecessor digest `a699c58b…c35a` stays pinned, and the reviewed digest is recorded, so any further edit still fails the guard. The guard is not loosened in any other way.

Unchanged: the stone path, the cow yard, the sheep meadow, the chicken yard, the pet nooks, the approved support, path, separation and route rules, saves, economy and every accepted model.

## Related correction (within the approved specification)

While measuring this, a validator defect was found and fixed separately. An unowned site was invisible to validation, so another pen could be moved onto the empty (still installed) chicken yard or into the unbuilt cow yard. Unowned sites now stay reserved at their saved or accepted position, which is required by the approved "clear of … neighbouring pens" rule.

## Acceptance criteria

- **A1.** The accepted default layout still validates, both with every species owned and with any one species unowned, and against the live snapshot.
- **A2.** With horses owned (cows owned or not), whole horse paddock moves of 1–9 m west validate. A 10 m move is refused.
- **A3.** Ground heights equal the approved terrain everywhere outside x ∈ (−37, −23) × z ∈ (−50, −21), and are exactly 0 for x ∈ [−33, −23] × z ∈ [−46, −25].
- **A4.** No hill tree stands within x ∈ [−37, −19] × z ∈ (−50, −21). Every other hill tree keeps its approved position.
- **A5.** Real browser: a 6 m west horse move applies. The save is writer v4, all horses are inside, and they stay inside after a refresh, reload and 30 simulated seconds, with zero page errors.
- **A6.** Actual in-game previews (top-down before and after, plus a ground-level view) are shown to the owner. Visual approval is a separate owner decision.
- **A7.** Pen suites, index-reading suites and the core runner stay green. No assertion is weakened; the land fixture changes only as recorded here.
