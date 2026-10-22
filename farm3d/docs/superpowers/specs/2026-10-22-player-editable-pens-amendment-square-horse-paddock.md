# Player-editable pens — Amendment A2: square horse paddock

Status: **chosen by the owner on 2026-10-22**. The owner asked "I want horse fence to be squared and not slanted". Shown real-game previews of the options, the owner chose **"Option 2: square in place"**. That option was described as changing the locked path file, so choosing it also authorizes that change. Visual approval of the implemented result is a separate owner decision.

Applies on top of the approved specification and amendment A1 (horse room). Where they disagree, this amendment wins for the items below only.

## Why the fence was slanted

The accepted stone path ran diagonally from (−18.4, −20.5) to (−3.25, −25.5), right along the paddock's south-east side, and the paddock's fourth edge followed it.

A rectangle of the same depth in place would sit on the path. Keeping the path, the only legal rectangle was 9.25 m west, 8.8 m deep and unable to move afterwards (measured with the real validator). The owner rejected that option.

## Changes

1. **Stone path.** The diagonal leg becomes a right-angle corner. The points change from `[-18.4,-20.5],[gate,-25.5]` to `[-18.4,-18.6],[gate,-18.6]`; every other point is unchanged. The path now runs north along x = −18.4 to z = −18.6, east along z = −18.6, and north along the existing x = −3.25 leg to the cow yard. Stones, grass clearing and flower clearing follow the path automatically.
2. **Default horse paddock.** The paddock is the full rectangle x ∈ [−23.5, −4.8], z ∈ [−31.8, −19.8] (224.4 m², up from 161.755 m²). It contains the old outline entirely, so no horse has to be relocated on update.
   - The stable, beds, feeders, waterers, stations, turnouts and stable obstacles are unchanged.
   - The 4.25 m gate is on the south edge, centred at x = −18.45, opening onto the path corner.
   - The species minimum area follows the approved rule that a pen's area "stays at least the species baseline", as it does for every other species. It becomes 224.4 m², the new baseline, replacing 161.755 m² (the old slanted area). Players can reshape or move the paddock but not shrink it.
3. **Template identity.** The horse template becomes `sa3d-horse-v2`. Saved horse records naming `sa3d-pr95-horse-v1` decode as read-only (none exist in production; the editor has not shipped). The PR95 fixtures stay as the historical record of what shipped. New fixtures captured from the actual factories freeze the v2 horse geometry.
4. **Protected path file.** `farm-path.js` is registered through the existing adapter mechanism as the sole path exception: the frozen previous digest is kept and the reviewed digest is recorded. A negative control shows any further edit still fails.

Unchanged: the chicken yard (fixed by owner decision), cow yard, sheep meadow, pet nooks, terrain (amendment A1 stays), saves, economy and every animal model.

## Known effect on existing farms

New decorations are already kept off the path. A decoration a player placed before this change on the new straight stretch (z ≈ −18.6, x −18.4 to −3.25) stays where it is and may overlap the stones. The overlap is cosmetic and nothing is lost. The old diagonal strip becomes ordinary grass.

## Acceptance criteria

- **B1.** Default horse polygon is the rectangle above, with every edge axis-aligned. The gate is 4.25 m on the south edge, centred at x = −18.45.
- **B2.** Stable, stations, turnouts and stable obstacles equal the PR95 values exactly. The old outline lies inside the new rectangle.
- **B3.** Path points are exactly as above, every segment axis-aligned, and the other points equal PR95.
- **B4.** The accepted default layout validates with every species owned and with any one unowned (fixture world with the new path), and against the live snapshot.
- **B5.** Horse paddock moves of 1–9 m west still validate and 10 m is refused (amendment A1 kept).
- **B6.** Real browser: the default boot shows the square paddock and the L-shaped path. All horses stay inside for 30 simulated seconds and through a 6 m west apply, refresh and reload, with zero page errors.
- **B7.** Previews are shown to the owner; visual approval is separate.
- **B8.** All suites stay green. Fixture changes come only from the capture script run against the actual factories; no assertion is weakened.
