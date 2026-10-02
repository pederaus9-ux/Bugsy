# Sunny Acres 3D — Phase 7H save audit (part 1: measurements + old saves)

Branch `claude/sunny-acres-phase7h-saves`. This part adds **tests and documentation only**: no game code and no
protected file changed. The fixes below touch `game.js` (save/load), and F1 also touches the cloud-save hand-off in
`auth.js`. Those are protected systems, so they wait for a ChatGPT 7H handoff.

## What was added

| File | What it does |
|---|---|
| `farm3d/tests/fixtures/saves/3d-v1-first-release.json` | Save written by the first 3D release (commit e360589): no soil, perks, gold, streak, layout, horse pen |
| `farm3d/tests/fixtures/saves/2d-v1.json` | The 2D game's save (`sunny-acres-v1`): x/y grid fields, `pos`, `land` as an object |
| `farm3d/tests/fixtures/saves/3d-v1-damaged.json` | Wrong types and missing parts (null plots/barn/buildings, string coins, array pens, unknown pet) |
| `farm3d/tests/save7h.browser.cjs` | Opens every fixture in today's game; 2D goes through "Bring my farm"; checks progress kept, no page errors, save → reload → save stable; risk probes; measurements |
| `farm3d/tests/versions.test.mjs` | Release/cache consistency: one version per script, `__gameVer` = game.js version, `sw.js` shell = imported versions, cache name format |

## Results

- **Old saves: PASS.** First-release 3D save and the 2D import both open at level 6 / 845 coins / 7 fields with crops,
  chickens, stats, stand, orders and jobs kept. They gain a horse pen and one level-5 perk pick, unknown decorations are
  dropped, and the result is stable across save → reload → save (only timestamps move, plus the daily `lastNag` marker).
- **Damaged save: opens** without errors (repairs plots, barn, buildings, pens, pets, stats).
- **Version consistency: PASS** (4/4) on current main.

### Measurements (headless Chromium, software GPU)

| Farm | Save size | JSON.stringify | localStorage.setItem | JSON.parse |
|---|---|---|---|---|
| New guest farm | ~2.0 KB | 0.003 ms | 0.03 ms | 0.01–0.04 ms |
| Heaviest farm the game allows (60 fields, every item ×99, 200 decorations, 12 animals per pen, every building busy, 200 achievement/museum entries) | ~19 KB | 0.04–0.06 ms | 0.04–0.13 ms | 0.08–0.14 ms |

- An idle farm wrote **0 saves per minute** (saves only follow player actions).
- The cloud upload is the same text, so it's ~2–19 KB, far under the 900,000-character limit in the Firestore rules.
- **Decision: IndexedDB is not justified.** Saves are tiny and fast; localStorage stays.

## Findings

| # | Finding | Severity | Evidence |
|---|---|---|---|
| **F1** | A save that can't be read (cut off mid-write, hand-edited, storage glitch) is **silently replaced by a brand-new farm**, with no copy kept. For a signed-in player the next change marks the farm dirty and `upload()` can then **send the new empty farm over the good cloud copy** (the phone's sync revision still matches). | **High** | Probe: boots as level 1 with 60 coins and the original text is gone. Code: `game.js` `load()` catches the parse error → `fresh()`; `auth.js` `sa3d:saved` → DIRTY → `upload()` |
| **F2** | `save()` swallows every `localStorage.setItem` error (`catch (e) {}`): with storage full the game keeps playing but **stops saving with no warning**. The backup copies auth.js keeps (`-backup-account`, `-backup-phone`, `@owner`) use the same quota. | Medium | Code review; restore already shows "Is the phone's storage full?" but normal saves don't |
| **F3** | `upgrade()` fills in missing parts but **doesn't fix wrong types**: coins `"120"` stays text (so +5 coins would make `"1205"`), and `gems: null` stays null. | Low (only damaged or hand-edited saves) | Damaged fixture: coins string, gems object |
| **F4** | There is a version field (`v: 1`) but **no explicit migrations**. `upgrade()` only fills in defaults, which is fine for added fields but can't handle a rename, a move or a unit change. | Medium (future changes) | Code review |
| **F5** | Releases bump `?v=` by hand in `index.html` (imports + `__gameVer`) and `sw.js` (`SHELL`, `CACHE`). | Low (now guarded by `versions.test.mjs`) | Test |
| **F6** | **One unknown item id stops the game from starting** (blank "The farm couldn't start" screen). That happens if an item is ever renamed or removed while a farm still has it in the barn, an order or an unsold stand slot. It can also come from a visited friend's farm saved by a newer game version. | **High for any future item change** | Probe: `Cannot read properties of undefined (reading 'e')`, game never starts (index.html `syncStand` reads `G.ITEMS[id].e`) |

## Proposed fixes (need the 7H handoff; protected: `game.js` save/load, `auth.js` cloud hand-off)

1. **F1:** in `load()`, if the stored text can't be parsed or upgraded, keep it as `sunny-acres-3d-v1-unreadable-<date>` before
   starting fresh, tell the player, and mark this phone "not in step" (clear `sa3d-sync-rev`) so a signed-in player gets
   the cloud farm back instead of uploading the empty one. Tests: unreadable probe flips from NOTE to PASS; the emulator flow
   proves the cloud copy survives.
2. **F2:** `save()` returns success; on failure show a one-time "Your phone's storage is full, your farm isn't being saved"
   toast and keep retrying; never delete backups automatically.
3. **F3:** coerce the core numbers (coins, gems, xp, level, barnCap, stats) to finite non-negative numbers in `upgrade()`.
4. **F4:** add `SAVE_VERSION` and an ordered `MIGRATIONS` table (`v` → `v + 1`), run before `upgrade()`. Future
   breaking changes add a migration plus a fixture; old migrations are never edited. A save newer than the game
   (old cached code) opens read-only instead of being written back older.
5. **F5:** keep manual bumps but enforced by `versions.test.mjs` in CI (already added).
6. **F6:** `upgrade()` drops (or maps, via a migration) unknown item ids from barn, gold, stand, orders, rush and jobs, and the 3D view guards `ITEMS[id]` lookups. Never rename or remove an item without a migration plus a fixture.
