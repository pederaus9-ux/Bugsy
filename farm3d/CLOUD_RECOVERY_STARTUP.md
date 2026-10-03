# Missing-cloud startup recovery

When account linking receives a missing-cloud answer before game startup consumes an unreadable local save, it previously cleared `sa3d-recover` first. The later `game.js load()` set that flag again, so every upload remained blocked throughout the visit. This reproduces deterministically on main `019b9710`, without the Stage B farmer changes.

`auth.js` now waits for the game's existing readiness signal before clearing recovery for a missing cloud farm. It verifies the linking attempt and signed-in UID after waiting, so signing out or starting a newer attempt cannot finish the older decision. Good-cloud restoration, unavailable-cloud retries, ownership, revision checks and saved data remain unchanged. No save fields or schema were added.

The owner authorized full implementation ownership and continued recovery work on 2026-10-03, replacing the Muse approval gate. This focused fix is separate from farmer PR #42. Its two original failed CI attempts and artifacts remain recorded in that PR; neither failure was concealed or turned into a passing result.

## Validation

The new `tests/recovery-startup.browser.cjs` runs real game and auth source with a deterministic SDK boundary, holding the game module so the missing answer arrives first. On the unchanged main baseline it fails with `recover = 1`; with the fix it preserves the unreadable copy, clears recovery after load and uploads a valid fresh farm. It also covers the reverse ordering and sign-out while startup is held. This is an ordering test, not proof of production Firebase or physical-phone behavior.

The existing emulator recovery case 3 remains unchanged. New case 3b repeats missing-cloud recovery with a 25-second game-module delay and checks one page load, the unchanged first unreadable copy, cleared recovery and a new cloud save at revision 1. Existing good-cloud, late-response, offline, sign-out, revision and no-overwrite checks continue to run with their original thresholds.

Required checks before merging: full Farm3D regression, old-save compatibility and the complete hosted Firebase emulator suite. Do not accept a repeated rerun alone as a fix or weaken recovery safeguards.
