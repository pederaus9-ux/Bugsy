# Sunny Acres 3D: development continuation handoff

Written 2026-09-30, from an inspection of the repository at commit `714a896`.

It is written for the next developer or AI. Read it together with `farm3d/DESIGN.md` (the game-design rules and chosen values) and `/progress.md` (the change log by phase).

---

## 1. Project identity

### Game and technology

| | |
|---|---|
| **Game name** | Sunny Acres 3D. A 2D predecessor, "Sunny Acres", lives in `/farm`. |
| **Genre** | A cozy Hay Day–style farming game. **No real money, ever**: coins and gems are earned only by playing. This is a hard product rule. |
| **Engine / framework** | No game engine. It is a hand-written **three.js** web app using plain ES modules. There is no build step, no bundler and no npm. |
| **three.js version** | **r186**. It is vendored in `farm3d/lib/three.module.min.js` and `three.core.min.js`, with `REVISION = "186"` in the file header. |
| **three.js addons** | Vendored in `farm3d/lib/addons/`: EffectComposer, RenderPass, ShaderPass, MaskPass, Pass, **UnrealBloomPass**, OutputPass, and the Copy, LuminosityHighPass and Output shaders. |
| **Backend** | **Firebase v9.23.0 modular SDK**, loaded at runtime from `https://www.gstatic.com/firebasejs/9.23.0/`. It provides Authentication (email/password) and **Cloud Firestore**. |
| **Other services** | Open-Meteo (real weather and geocoding, no key needed). A Discord webhook receives player feedback and automatic error reports. |
| **Language** | JavaScript (ES2020+), HTML and CSS. No TypeScript. |

### Platforms

| | |
|---|---|
| **Mobile targets** | Primary. Android Chrome, the main tested path; the error reports show real players on Android Chrome 153. iPhone Safari is also a target, but it cannot run pages fullscreen (see known issues). |
| **Orientation** | **Landscape only.** Portrait shows a "Rotate your phone sideways to play" overlay and pauses the game. |
| **Installability** | It is a PWA: `farm3d/manifest.webmanifest` sets `display: fullscreen` and `orientation: landscape`, and the service worker is `farm3d/sw.js`. |
| **PC targets** | Desktop browsers (Chrome, Edge, Firefox, Safari). The game works with a mouse and has keyboard controls for walk mode. It is not a native build. |
| **Current platform support** | The web only, served by GitHub Pages. There are **no native iOS or Android store builds**; a store launch was mentioned for a future "Phase 9". |

### Repository

| | |
|---|---|
| **Live URL** | https://pederaus9-ux.github.io/Bugsy/farm3d/ |
| **Test farm** | https://pederaus9-ux.github.io/Bugsy/farm3d/?testfarm — a throwaway level-12 farm that is never saved. |
| **Owner dashboard** | https://pederaus9-ux.github.io/Bugsy/farm3d/players.html |
| **Repository** | GitHub `pederaus9-ux/Bugsy`. The local clone is at `/home/user/Bugsy`. |
| **Game folder** | `farm3d/`. Everything for this game is in there. |
| **Other folders** | `/farm` is the older 2D game. The repo root (`/index.html`, `/sw.js`, `/manifest.webmanifest`, `README.md`) is an **unrelated** app ("Bugsy Brain", a Gemini chat assistant): **don't touch it**. |
| **Development branch** | `claude/hayday-style-game-currency-hq3vi4` |
| **Branch HEAD** | `714a896` "3D farm: fix a crash when a seed drag is cancelled part-way (paintAlong on a null drag)" |
| **origin/main** | `bd4669aa7e373fde7f6d90fab9ac398afab07808`, merged PR #24 on 2026-09-30 (Phase 7A baseline audit). |
| **PR #24** | **Merged** on 2026-09-30. Main contains the entry and mid-loop `paintAlong()` guards and seed-tray cancellation cleanup. |
| **Deploy** | GitHub Pages serves `main` from the repo root, so merging to `main` deploys within about 1–2 minutes. There is no CI. |

---

## 2. Current development state

Legend:
- **IMPLEMENTED** — built, tested in headless Chromium, and live.
- **PARTIAL** — works, with known gaps.
- **BROKEN** — a known defect.
- **PLANNED** — agreed but not built.
- **UNKNOWN** — not verifiable here, for example real-device performance.

### Player — PARTIAL (the player is represented, not simulated)

There is no player entity or health. The "player" is the farm owner, represented by:

- **Farmer avatar — IMPLEMENTED.**
  - It is a low-poly model, rebuilt from the wardrobe by `buildFarmer()` in `index.html`.
  - In the classic view it stands at `FARMER_HOME (-1.8, 0, 8.4)` by the barn doors, with idle animation; tapping it opens the wardrobe.
  - It is visible in third-person walk mode and in photo mode.
- **Wardrobe / customization — IMPLEMENTED.**
  - Choices: 6 skin tones, 8 hairstyles, 8 hair colours, 8 shirts, 6 hats, overalls on/off with 4 colours, and 6 boot colours.
  - The data is `WARDROBE` in `game.js`; the look is saved as `S.look`, and season unlocks as `S.unlocks`.
  - Unlocks come from levels 2, 5, 8, 12, 16 and 20, and from the spring and fall season tracks.
  - **Gem-priced items show "Coming soon" and are intentionally not purchasable**; the gem shop is PLANNED for Phase 8.
- **First-person hands — IMPLEMENTED.** Mitten hands are children of the camera, with sleeves in the shirt colour.

### Movement — IMPLEMENTED (walk mode only)

- The classic view has no avatar movement; it is a camera-only farm view.
- **Walk mode:**
  - Speed is 3.4 m/s walking and 6 m/s running.
  - Collision is circle-vs-AABB against `BLOCKS` (buildings, pens, board, stall, gift), plus fence segments and placed decorations.
  - A world radius of 40 m around `HOME` keeps the player on the farm.
  - Fields can be walked over (`FIELD_BLOCKS` are skipped).
  - The logic is in `updateWalk()` and `collideWalker()` in `index.html`.
- **Animals:**
  - Each has an autonomous AI in the `Animal` class in `index.html`, with needs (hunger, tiredness, loneliness), personalities, A* routing (`route()`), and pens.
  - In walk mode they react to the player: they step aside, and the dog follows.
  - An animal the player is aiming at stays put, and a petted animal stays calm for 4 s.

### Camera — IMPLEMENTED

- **Classic view:**
  - An orbit camera (`cam` holds target, yaw, pitch and dist; `view` is its eased copy) placed by `placeCamera()`.
  - Pitch is clamped to 0.12–1.25 rad and distance to 10–70 (2.8–9 in the wardrobe).
  - A tilt-shift post pass and bloom are applied.
- **Walk mode:**
  - First person: eye height `EYE = 1.6`, FOV 70, near 0.1.
  - Third person over the shoulder is a toggle (the 👁️ button); the choice is saved in `sa3d-pov`.
- **Camera swoop:** `startTween()` / `applyTween()` give a 1.2 s eased blend on entering or leaving walk mode, and when stepping into or out of the barn.
- **Other views:**
  - Edit mode: a top-down view with a grid.
  - Photo mode.
  - A first-launch intro fly-in (`playIntro()`).
  - Visiting a friend's farm: the camera is saved and restored.

### Controls, general — IMPLEMENTED

- **Tap** uses things: `onTap()` → `hitAt()`, a raycast plus a 34 px tolerance around animals.
- **Swipe** from a ripe crop harvests every ripe crop it crosses ("Fruit Ninja"). A drag that starts anywhere else rotates the camera.
- With a seed armed, one finger paints-plants fields.
- Press and hold on grass drops animal bait; press and hold on a decoration moves it.

### Touch controls — IMPLEMENTED

- **Classic view:** one finger rotates, pinch zooms, two fingers pan (`pointerdown`/`pointermove` on `renderer.domElement`).
- **Walk mode:**
  - A full-screen `#fpsPad`.
  - **Left half:** a dynamic joystick that appears where the thumb lands; the edge (>93%) runs.
  - **Right half:** 1:1 look, with pitch limited to ±80°.
  - A short tap uses what was tapped, or what the crosshair is on.
- **Crosshair and contextual action button** (`#actBtn`, bottom right): Harvest, Water, Plant, Pet, Collect, Gift, Open, Orders, Shop, Talk, Buy, Look. The logic is in `aimScan()` and `interact()`.
- The walk-mode UI is two small round buttons on the right (`#walkBar`: 👁️ and ✕), plus a hint that fades after 3.5 s.

### Keyboard / mouse — PARTIAL

- **Mouse:** click taps, drag rotates, right-drag or Shift-drag pans, and the wheel zooms.
- **Keyboard in walk mode:**
  - WASD or arrows move; Shift runs.
  - Q and ArrowLeft turn left; ArrowRight turns right. E and Enter interact only.
  - Space or F throws bait.
  - Esc exits walk, edit, panels and trays.
- **FIXED in Phase 7A:** `KeyE` no longer turns right in `updateWalk()`; E and Enter still trigger `interact()`. Touch controls are unchanged.
- There is no key rebinding and no pointer-lock mouse-look in walk mode (mouse-drag is used instead).

### Controller / gamepad — PLANNED (not started)

There is no Gamepad API code (`getGamepads` doesn't appear anywhere).

### UI — IMPLEMENTED

- **HUD:** level star and XP bar; coins and gems, with flying coins/gems/stars on gain; weather and event chips; the side button column; the dock (Orders, Barn, Decor, Shop).
- **Landscape layout rules** live under `@media (orientation: landscape) and (max-height: 560px)` at the **end** of the `<style>` in `index.html`; they must stay last to win the cascade.
  - Side buttons form a 2-column grid; the dock is 2×2; trays sit between them; panels are capped at `100vh - 46px`.
  - Toasts and the tutorial card are at the top; the wardrobe is a side closet.
- **Other screens:** a portrait rotate overlay (`#rotate`); the iPhone "Add to Home Screen" tip; a guest "create an account" bar; and the "🧪 Test farm" badge.

### Menus — IMPLEMENTED

Panels are rendered by `renderPanel()` in `game.js`:

- orders, barn, shop, settings, quests (tabs: today, season, achievements, collection), daily, perk, visitor
- building, lot, penLot, stand, weather, decor, event, prize, level, welcome
- backup, confirm, rename, import2d, away

DOM overlays in `index.html`:

- the sign-in gate (`#authGate`), friends (`#friendsBox`), feedback (`#fbBox`), wardrobe (`#wardrobe`), photo bar and photo result, and the seed and info trays.

### Gameplay loop — IMPLEMENTED

The loop is: plant → grow (real-time) → harvest → make goods in buildings → deliver truck orders or sell → level up → unlock more.

- **Crops:** 8 crops (`CROPS`). Growth depends on season (out of season = half speed), soil health, watering (−25%), heatwave, and perks.
- **Gold quality:** crops come out 🥇 gold with some probability; fertilizer helps a lot. Gold sells for double.
- **Soil:** crop rotation affects it (`soilNow`).
- **Buildings:** 6 buildings, including Feed Mill, Bakery and Kitchen, with recipes in `RECIPES`. The chain is wheat → flour → bread / cake / pizza. Each building has a 3-slot job queue.
- **Animals:** 4 kinds (chicken, cow, sheep, horse) plus 2 pets (dog, cat). Feeding produces goods; happiness (pet, brush, feed) speeds production and gives double or gold output.
- **Selling:** truck orders, ⏰ rush orders (20 min), the roadside stand (player-set prices), and selling from the barn.
- **Progression:** levels (`xpNeed = 15·L^1.6`); more fields (to 30, then land deeds to 48); sprinklers from level 5; level-up perks every 5 levels.
- **Events and quests:** random 24 h events with prize tiers; holiday events; the free season track; daily quests; 15 achievements; the collection (museum).
- **Other:** real weather (Open-Meteo) or a manual look; seasons from the real date; decorations placed freely in edit mode; buildings and big trees are movable.

### Enemies / NPCs — IMPLEMENTED (there are no enemies, by design)

- **Villagers:** 5 (Rosa, Joe, Mia, Sam, Lily). They visit with requests, and each has 5 hearts of friendship. The data is `VILLAGERS` in `game.js`; the 3D card with a coloured body is `visitorCard` in `index.html`.
- **Animals and pets** are ambient characters with AI; the dog chases hens.
- There are no combat, enemy or fail states.

### Progression — IMPLEMENTED

Progression covers:

- XP and levels, unlock tables (`unlocksAt`), perks (`S.perks`), achievements (`ACH`), and the collection (`S.museum`).
- The season track (`seasonNow()`, 10 prizes per season) and the 7-day daily gift streak (`STREAK`).
- Wardrobe unlocks.

The details are in `DESIGN.md`.

### Save / load — IMPLEMENTED

- **Local save:**
  - The whole game state `S` is serialized to `localStorage["sunny-acres-3d-v1"]` by `save()` in `game.js`; `load()` + `upgrade()` read it.
  - `upgrade()` fills in missing fields, so **every new state field must be defaulted in `fresh()` and repaired in `upgrade()`**.
- **Cloud save** (`auth.js`, Firestore `farms/{uid}`):
  - Revision-based sync: `SYNC_REV`, `DIRTY` and a versioned transaction.
  - A pre-account farm migrates into a new account.
  - A two-farm chooser (`pickFarm`) appears when needed.
  - Another owner's farm is kept aside as `SAVE_KEY@uid`.
  - Restoring a backup force-uploads (`sa3d-restored`).
- **Guest mode:** local-only save (`sa3d-guest`); making an account migrates the farm.
- **Backup / restore:** a gzip + base64 code (`SA2:`), or a JSON file. It also imports 2D-game saves (`SAVE_2D = "sunny-acres-v1"`).
- **Showcase copy:** `showcase/{uid}` holds a read-only copy for friends to visit.
- **Settings** are stored separately: `…-prefs`, `…-sound`, `…-weather`.

### Audio — IMPLEMENTED

- **All sound is synthesized with the Web Audio API.** There are no audio files: `tone()`, `noise()` and the `SOUNDS` table in `game.js`.
- There is also generative background music (pentatonic, `musicTick()`).
- **Ambience:** wind and rain noise loops, birds by day and crickets at night, and occasional animal calls panned to the animal's on-screen position (`sfxAt()`, `ambience()`).
- **Walk mode:** footsteps by surface (grass, dirt, wood, from `surfaceAt()`) and a wind rush when running.
- Android vibration via `buzz()` (not on iOS).
- Settings toggles: sounds, music, farm sounds, vibration, reminders.

### Graphics — IMPLEMENTED; real-phone frame rate is UNKNOWN

- **Rendering:** three.js WebGL with ACES tone mapping, PCF soft shadows (2048, or 1024 after scale-down), and a sky shader with clouds.
- **Grass:** 22,000 instanced grass clumps (about 176k wind-animated blades).
- **Textures:** procedural canvas textures (planks, shingles, stone, dirt), plus the photo textures `tex/grass.jpg` and `bark.jpg` and `tex/leaves.webp`.
- **Art:** painted crop and animal cards in `art/*.webp` (14 files). Animals are camera-facing cards, not 3D models.
- **Presets:** morning, noon, golden, rain, snow and night (`PRESETS`, `setPreset()`), plus seasonal and holiday props.
- **Post-processing:** bloom and a tilt-shift miniature effect in the classic view.
- **Effects:** particles for harvest bursts, soil dust, ripe-crop twinkles and gold sparkles.
- **Dynamic resolution** (Settings › Graphics › Auto):
  - It judges the median frame over 40 frames and scales the pixel ratio from 100% down to about 45%, then softer shadows, then no bloom or tilt-shift. It scales back up when there's time to spare.
  - Walk mode also uses it.
  - Measured only in headless SwiftShader. **The 30 fps target on a mid-range phone is UNKNOWN: it needs a real-device check.**

### Other systems

| System | State | Notes |
|---|---|---|
| Accounts (email/password), guest mode | IMPLEMENTED | `auth.js`. Settings has a "Create account" row for guests. |
| Friends: usernames, search, list, visit, water a friend's crops, leaderboard, trading post | IMPLEMENTED | `friends.js`. Firestore `players`, `usernames`, `showcase`, `help`, `market`. |
| "While you were away" recap | IMPLEMENTED | After 10+ minutes away (`panelAway`). |
| Reminders (notifications) | PARTIAL | Work only while the page is alive in the background (a `setTimeout` plus a service-worker `showNotification`). **True push to a closed app is PLANNED**; it needs Firebase Blaze and Cloud Functions/FCM. |
| Photo mode | IMPLEMENTED | Filters, caption, save/share. |
| Tutorial | IMPLEMENTED | 9 steps (`TUT`), with auto camera focus. |
| Owner dashboard (`players.html`) | IMPLEMENTED | Live presence (now / today / week / total), recent players, and the "Where players stop" funnel. Only the owner email `pederaus9@gmail.com` can read it, per the rules. |
| Anonymous analytics | IMPLEMENTED | Firestore `events/{auto}` holds `{e, d}` only, one report per milestone per device (`window.saStats`). |
| Error reporting | IMPLEMENTED | The safety-net script at the top of `index.html` posts 🐞 reports to Discord: at most 3 per visit and 10 per day, filtered, and only from github.io. |
| Feedback box | IMPLEMENTED | 💬 posts to Discord, once per minute. |
| Landscape-only + fullscreen | IMPLEMENTED | The first tap requests fullscreen and a landscape lock, and it re-requests after an exit. **iPhone Safari can't do fullscreen for pages** (a platform limit). |
| Seed-drag crash (`paintAlong` null) | FIXED on `main` | PR #24 merged as `bd4669a`; cancellation guards verified during Phase 7A. |
| Gem shop / gem sales | PLANNED | Phase 8. Gem-priced wardrobe items wait for it. Still no real money. |
| Native store apps | PLANNED | Phase 9. |
| Gamepad | PLANNED | — |
| Barn interior | PARTIAL | A visual interior plus the Barn panel. There are no other walkable interiors; the house/stats room from the brief was not built. |

---

## 3. Architecture and file map (`farm3d/`)

| File | Lines | What it is |
|---|---|---|
| `index.html` | about 3,610 | **The 3D world and all view code.** It contains: CSS; HTML overlays; the boot safety net with error reporting; and one big `<script type="module">` holding scene setup, procedural textures, the barn/buildings/fields/animals, the `Animal` AI class, weather presets, input, walk and edit modes, photo, wardrobe, first person, the rotate overlay, fullscreen, dynamic resolution and the render loop (`frame()`). |
| `game.js` | about 2,000 | **Rules, state and UI panels.** Data tables (ITEMS, CROPS, ANIMALS, PETS, BUILDINGS, RECIPES, DECOR, EVENTS, VILLAGERS, WARDROBE, ACH, QUESTS); the state `S`; save/load/upgrade; the economy functions; panels (`renderPanel`); the tutorial; the synthesized sound engine; backup/restore; `start()`. It is imported as `G`. |
| `auth.js` | about 290 | Firebase init; the sign-in gate; guest mode; cloud save sync; presence heartbeat; anonymous stats (`saStats`). Exposes `window.saAuth = {user, guest, signOut, upgrade, fb:{F, db, auth}}`. |
| `friends.js` | about 270 | The Friends window: usernames, search, list, visit, co-op watering, leaderboard, trading post. `initFriends(G, hooks)` returns `{water, …}`. |
| `players.html` | about 195 | A standalone owner dashboard with its own Firebase init. |
| `sw.js` | 23 | Service worker. The cache name is `sa3d-vNN`; code files are network-first, and `lib/`, `art/` and `tex/` are cache-first. |
| `manifest.webmanifest` | — | The PWA manifest (fullscreen, landscape). Icons are reused from `../farm/`. |
| `DESIGN.md` | — | Design rules and the decisions taken. **Update it when you change rules.** |
| `lib/`, `art/`, `tex/` | — | Vendored three.js, painted cards, and textures. |

### Communication between the view and the rules

- `game.js` exports `view` (stub methods).
- `index.html` fills it in with `Object.assign(GV, {...})`: `fx`, `focus`, `refresh(what)`, `sparkle`, `fly`, `wardrobe`, `resolution`, `setQuality`, `applyWeather`, `screenPos`, and others.
- `refresh()` takes `"plots"`, `"herd"`, `"buildings"`, `"decor"`, `"stand"`, `"style"`, `"visitor"`, `"look"` or `"all"`.
- Rules call `view.*`; the world calls `G.*`.
- `GS()` in `index.html` returns `G.S`, the current state, which is the friend's farm while visiting.

### Cache-busting (required)

Every change to a module must bump its query in `index.html`:

- `game.js?v=21` (also `window.__gameVer = 21`)
- `auth.js?v=12`
- `friends.js?v=4`

**and** the `CACHE` name in `sw.js` (currently `sa3d-v21`). Otherwise phones may mix an old module with a new page.

### Debug and test URL flags

- `?debug` exposes `window.__dbg` (scene, cam, walk getter, plots, animals, `G`, `hitAt`, `keyPos`, …).
- `?testfarm` loads a sandbox farm that is never saved; auth is skipped.
- `?portrait` disables the rotate overlay and fullscreen.
- `?preset=noon|golden|night|rain|snow|morning`
- `?shot` is snapshot mode.
- `?intro` forces the intro under `debug`.
- `?weather=`, `?night=1`, `?season=`, `?theme=`

---

## 4. Backend (Firebase project `fir-config-18b64`)

- **Config:** the web config is hard-coded in `auth.js` and `players.html`. That is normal for Firebase; security comes from the rules.
- **Database name:** the Firestore database is named **`default`**, not `(default)`. Code uses `getFirestore(app, "default")`, and REST paths use `databases/default`.

### Collections

| Collection | Contents |
|---|---|
| `farms/{uid}` | `{save, level, coins, rev, updatedAt}` |
| `presence/{uid}` | `{seen, level, joined}` |
| `players/{uid}` | `{name, nameLower}` |
| `players/{uid}/friends/{fid}` | `{name, addedAt}` |
| `usernames/{nameLower}` | `{uid, name}` |
| `showcase/{uid}` | `{save, name, level, earned, harvests, best, orders, updatedAt}` |
| `help/{owner}/items/{id}` | `{from, name, plots, at}` |
| `market/{id}` | `{seller, sellerName, item, qty, price, at, buyer, buyerName, soldAt}` |
| `events/{id}` | `{e, d}` |

### Rules

The rules are published by the owner in the Firebase console; they are **not stored in the repo**. The current full set is the last one given in the conversation. It includes an `isOwner()` function, true when the email is `pederaus9@gmail.com`, and a block for every collection above. A copy is in the PR #18 and PR #20 descriptions.

**When adding a collection, write the rule, give it to the owner to publish, then verify it live.** The pattern used: create two throwaway accounts through Identity Toolkit `accounts:signUp` with the API key, run allowed and denied REST calls, then delete the accounts.

### Discord

The webhook URL is in `index.html` (`window.__ERR_HOOK`); it's public by necessity, and can be rotated in Discord.

---

## 5. How to test

- **Local server:** `cd /home/user/Bugsy && python3 -m http.server 8765`, then open `http://localhost:8765/farm3d/index.html?testfarm&debug`.
- **Headless:** Playwright plus Chromium (preinstalled; `require('/opt/node22/lib/node_modules/playwright')`, launch args `--use-angle=swiftshader`).
  - Use a **landscape** viewport (for example 844×390 with `isMobile`/`hasTouch`), or add `?portrait` for tall windows.
  - SwiftShader is slow (about 0.6 s per frame), so give animations and timers generous waits.
- **Firebase in tests:** route `https://www.gstatic.com/firebasejs/**` to fake modules. Past sessions used fake auth and Firestore modules backed by an in-memory store served from `https://fakecloud.test/`; they are not in the repo. Abort the route to run offline.
- **Syntax check:** copy each module to `.mjs` and run `node --check`. For the inline module, extract it from `index.html` first.
- **Checklist before shipping:**
  1. Fresh load → guest → tutorial → plant/harvest/deliver → reload persists.
  2. Walk mode.
  3. Every panel on screen at 740×360 and at 844×390.
  4. No `pageerror`s.

---

## 6. Workflow conventions (for AI sessions)

- **Branch:** develop on `claude/hayday-style-game-currency-hq3vi4`. After a PR merges, restart the branch from main: `git fetch origin main && git checkout -B claude/hayday-style-game-currency-hq3vi4 origin/main`, then push.
- **Pull requests:** only when the user says so; this user always wants one per feature. Each PR describes its changes and testing.
- **Commit messages** end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01AydneU2WrhweFowRjZ5rKG
  ```
- **After a merge:** confirm the live site serves the new version (`curl` the page and grep for the new `game.js?v=`).
- **The user:**
  - Austin works from an Android phone and plays with his wife and niece.
  - He relays requests from Gemini and QA lists.
  - Explain changes in plain language, with steps to try them on a phone.
- **Code style:** match the existing code. Dense single-line helpers, and comments written in plain English for a non-programmer ("the farm", "your fields").

---

## 7. Known issues and immediate next steps

1. **PR #24 merged:** the seed-drag cancellation guards are on main and verified in Phase 7A. Preserve them.
2. **KeyE conflict fixed in Phase 7A:** E/Enter interact; Q/ArrowLeft turn left and ArrowRight turns right.
3. **Real-device performance** of first-person walking (30 fps target) is unverified. Check on a mid-range Android; if it's too slow, lower grass density near the camera in walk mode or cap `PR_MIN` lower.
4. **iPhone Safari fullscreen** is impossible from the browser. Only Add to Home Screen (PWA) or a store build solves it.
5. **Closed-app push notifications** need Firebase Blaze plus Cloud Functions/FCM; not started.
6. **Planned phases, from the user's builder brief numbering:**
   - Phase 7: see `PHASE7_PLAN.md` for the authoritative 7A–7N roadmap and approval gates.
   - Phase 8: gem shop. Gems must remain earn-only; buying gems with real money is forbidden.
   - Phase 9: store launch (native wrapper).
   - Controller support: not requested yet.
7. **Firestore rules are not in version control.** Consider adding `farm3d/firestore.rules` as documentation.
