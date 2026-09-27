# Sunny Acres: progress

Last updated: 2026-09-26

## Where things live
- **Live 2D game:** `farm/` (published at `https://pederaus9-ux.github.io/Bugsy/farm/`)
- **3D game (launch-ready):** `farm3d/index.html` (the 3D world, taps, looks) and `farm3d/game.js` (the rules and menus, carried over from the 2D game). Will be at `https://pederaus9-ux.github.io/Bugsy/farm3d/` once merged.
- **3D engine:** `farm3d/lib/` (three.js r186, minified, MIT license, no internet needed)
- **Art:** `farm/art/` (animals and crops, backgrounds removed). Approved environment assets will go in `assets/`.
- **Canva helper design:** "Farm game asset export" (DAHWTGE7Wk0) in the Canva account: one full-size page per asset, exported at 1264 px.

## Test links
- **3D game (phone):** https://claude.ai/artifact/1s6eqFAG4HAMnGvpSjjcfS (private to the account owner). The whole game. Weather lookups, the location button and backup *files* don't work on this test link (the page is locked down); backup *codes* do.

## Done
### 2D game (live)
- [x] Farming, animals, buildings, orders, barn, shop, levels. No real money; gems are only earned by playing.
- [x] Isometric farm, drag-to-plant, sickle harvesting, moving things, roadside shop
- [x] Sounds and music, crop growth stages
- [x] Real weather (Open-Meteo), seasons, holidays, special events, decorations, land expansion
- [x] Backup and restore (file or code)
- [x] Graphics polish pass
- [x] Canva art: 6 animals and 8 crops; horses, pets (dog and cat), animal care (names, happiness, petting)
  - The last item is pushed to the branch but **not merged yet** (needs a pull request).

### 3D game
- [x] three.js bundled into the project
- [x] **Barn lighting test** (was `farm3d/barn-test.html`, now `farm3d/index.html`):
  - a real 3D barn (planks, shingles, stone base, trim, doors, windows, cupola), a tree made of leaf cards, fences, and the animal renders
  - full 360° orbit, pinch zoom and pan
  - sun with real-time shadows, sky light, ACES tone mapping, bloom, haze, sky reflections
  - weather presets: morning, noon, golden hour, rain (wet and shiny surfaces), snow (snow settles on upward-facing surfaces), night (lit windows, lamp)
  - thousands of grass blades that sway in the wind; natural color patches in the ground; trees on the hills
  - paint panel: walls (grain kept), trim and roof colors
  - published as a phone test link (see above)
- [x] **More farm pieces, all real 3D:** grain silo (ribbed metal, ladder, dome), round hay bales, water trough (freezes in snow), rocks (granite with moss), bushes, a ploughed wheat field that sways, and a lamp post that lights up at night

- [x] **Realistic trees, grass and sky** (after the user's feedback): photo leaf clusters, bark and meadow textures made in Canva (`farm3d/tex/`); branching trees with one soft canopy that glows when backlit; 170k thin grass blades with dark roots, sunlit tips and wildflowers; drifting clouds that change with the weather, and stars at night
- [x] **Animals live on their own** (`farm3d/barn-test.html`, `class Beast`):
  - 13 named animals: cows Bessie and Clover, horses Spirit and Maple, sheep Woolly and Cotton, chickens Pip, Goldie, Nugget, Henrietta and Peep, Buddy the dog and Whiskers the cat
  - 7 personalities (Lazy, Curious, Shy, Playful, Grumpy, Friendly, Greedy) that shape energy, friendliness, curiosity, bravery and appetite
  - needs that grow over time (hunger, thirst, tiredness, company); animals graze or peck, drink at the trough, nap, visit friends, wander and play; Buddy chases the chickens and they scatter
  - weather and time: they run to shelter by the barn in rain and snow, and go to bed together at night
  - they find their way around the barn, silo, bales and fences (shortest path around corners), walk and run with a bob, and show little mood bubbles
  - tap an animal for its card (name, personality, mood, what it's doing) with **Pet** and **Call over**; tap the grass and the curious ones come to look
- [x] **Diorama look** (suggested by Gemini): grass is now 22,000 clumps of 8 blades each (tufts that still bend in the wind); tilt-shift blur that keeps the middle sharp and softens the top, bottom and corners; a colour grade after ACES tone mapping (gentle contrast curve, a touch more colour, soft vignette), tuned per weather
- [x] **Game feel**: tapped things (animals, barn, silo, trees, bushes, bales, rocks, trough, fences, lamp, field) squash down and bulge out, then spring back in 250 ms; the camera glides after your fingers with an ease-out instead of snapping
- [x] **Full-resolution Canva art**: the helper design "Farm game asset export" is saved with 9 full-size pages (1264 px). The 3D game now uses its own sharper copies: animals in `farm3d/art/` (512 px WebP, about 3x sharper), and leaves, bark and grass in `farm3d/tex/` at 1024 px (bark and grass made seamless). The 2D game keeps its small, fast art.
- [x] **Economy HUD in 3D** (Gemini's suggestion): the 2D game's level star, XP bar, coins and gems, same look and same rules (start 60 coins and 5 gems, XP curve 15·level^1.6, level-up gives +2 gems and +20×level coins). Saved on the phone. Petting an animal gives +2 XP (once per 45 s per animal) and sometimes a coin. The hint moved to the bottom and fades on first touch; the paint panel sits under the money.
- [x] **Pens and a better walk**:
  - Cows, horses and sheep live in a closed paddock: the barn's east wall plus fences, with the trough, silo and an oak inside.
  - Chickens live in a fenced yard on the barn's west side, with the hay bales, the oak and their own water pan.
  - Buddy and Whiskers roam everywhere outside the pens, with a water bowl by the barn door.
  - Every target, route and step is held to the animal's pen. A 12,000-step test in noon, rain, night and golden hour had zero escapes.
  - Each pen has its own bed spot at night and its own shelter in the rain; the dog runs along the fence when it chases the hens.
  - Walking: a footfall bob with a slight squash, a lean into the direction of travel (more at speed, extra when speeding up, sitting back when braking), and smooth turn-arounds instead of an instant flip. The old side-to-side rock is gone.
- [x] **Polish from Gemini's review**:
  - Checked: emoji bubbles were already cached, so there was no leak; the grass never cast shadows.
  - Added: the renderer and post-processing now always share the same pixel ratio; automatic quality steps down (sharpness 1.6, 1.3, shadows 1024, sharpness 1) only if the phone can't hold ~45 fps.
  - Turns: animals flip inside a tiny hop instead of narrowing (the narrowing showed their flat edge).
- [x] **Launch stage 1: planting and harvesting in 3D** (Gemini approved the code with zero blockers):
  - The decorative wheat field is replaced by 6 real fields of tilled soil with rounded furrows.
  - Same crops, level unlocks, seed prices, grow times and XP as the 2D game. Planting uses a crop from the barn first, then coins; a harvest gives 2; rain speeds growth 10%.
  - Tap an empty field → seed tray (crops, how many you have or the seed price, grow time; locked ones show their level). Tap or drag across empty fields to plant; tap or drag across ripe fields to harvest. The camera stays still while a finger plants or harvests; two fingers always move the camera.
  - Tap a growing field for time left and "Finish now" (1 gem per 5 minutes left, as in 2D).
  - Crops grow visibly: plants rise and fill out, ripen from green to their harvest colour (wheat turns gold), and produce (corn cobs, tomatoes, strawberries, pumpkins…) appears as they ripen. "+2 🌾" floats up on harvest.
  - 📦 Barn button: storage used out of 50, and what's inside. Saved on the phone.
  - Tested with real taps and drags: every step follows the 2D rules.

- [x] **The whole game in 3D** (launch list items 2 to 7):
  - `game.js` holds the 2D game's data, rules and menus: crops, animals and their products, pets and gifts, the six production buildings and 14 recipes, truck orders, roadside shop, barn and upgrades, the Shop, 30 fields, decorations, special and holiday events with prizes, real weather, sounds and music, backup and restore. Same numbers as the 2D game.
  - The save has the same shape as the 2D save. A 2D backup code restores straight into 3D, and on the real site (same address) the 3D game offers to **bring the 2D farm over** on first visit. The 2D Settings has a "Play Sunny Acres 3D" button.
  - In the world: fields in a grid west of the path; six buildings east of the path (roped-off lots with price or level signs until bought; chimney smoke while working; a bubble when goods are ready); an order board with a daily gift box; a striped Farm Shop stall showing what's for sale; pen signs; decorations (real 3D oak and pine; pictures for the rest) that you place where you're looking and press-and-hold to move.
  - Animals are bought as in 2D (chicken coop at level 2, and so on). Bought animals and pets walk in with a name from the save and a personality from their name. Tap one for its card: feed, pet, brush, ride, rename, buy another; tap when ready to collect (a bubble shows 🥚 🥛 🧶 or 🎁).
  - New: a 6-step **tutorial** with a pointer, a **Settings** menu (sound, music, graphics Auto/Best/Balanced/Battery saver, weather and fixed looks, barn colours saved with the farm, backup, restart tutorial, new farm), in-game confirm and rename dialogs, a loading screen, holiday props, bubbles that dim at night.
  - Faster: still pieces are merged, from 1,225 drawn objects to 300; the 70 distant trees are two pieces.
  - Installable (home-screen app) and quick to reopen offline (`farm3d/manifest.webmanifest`, `farm3d/sw.js`).
  - Land expansion is not in 3D: the 3D farm is already large, and fields and decorations have room.
  - Tested with real taps in a test browser: new farm with the tutorial; planting and harvesting by dragging; orders; feed mill; level-up; buying the coop; feeding a chicken and collecting the egg; stall; buying, placing and moving decorations; settings; backup code and restore; bringing over a 2D farm (level, coins, barn, fields, animals, pet, buildings, decorations); pet gift; pen test (0 escapes).

## Launch list (agreed with Gemini)
Keep the realistic picture animals (billboards). In order:
1. [x] Planting and harvesting
2. [x] Animal products: feeding, eggs, milk, wool
3. [x] Production buildings, orders, the roadside shop and the Shop; levels and unlocks
4. [x] Buying more fields, barn upgrades, decorations (land expansion not needed in 3D)
5. [x] Real weather, seasons and holidays, special events with decoration prizes
6. [x] Sounds and music
7. [x] Tutorial and Settings menu
8. [x] Go live: merged into main; GitHub Pages serves `farm3d/` and the 2D game stays up

## Fixes from playing on the phone
- [x] Start-up safety net, old 2D saves without horses, versioned `game.js` import (PRs #4 to #6)
- [x] Seeds: tapping a field only opens the seed tray, and the seed you pick is the one planted (it used to plant the last crop straight away)
- [x] Planting by dragging: drag a seed out of the tray onto the fields, or, once a seed is picked, slide one finger from anywhere across the fields (two fingers move the camera). The seed tray is two rows with no sideways scrolling, so the phone never mistakes a seed drag for a scroll. While a finger drags to plant, the tray fades away so the fields under it show; it closes after planting, or comes back if nothing was planted
- [x] Moving decorations: a Move mode (the Move button, holding a decoration, or right after placing one) with ✔ Done and Put away. One finger drags it, a blocked spot springs back to the last free one, and a phone cancelling the touch no longer loses the move

## Decisions
- **Work stays in this cloud chat, driven from the phone** (the PC plan was dropped). Everything is saved to GitHub, and test links are published after each milestone.
- **Buildings and props are real 3D models, not pictures.** The user wants full 360° rotation and everything reacting to sun and weather. Painted pictures can't do that, because their lighting is fixed and they only have one angle. Real 3D models with realistic textures can, and they also make paint colors and swappable parts easy.
- **Canva's role changes.** It will make textures (wood, shingles, stone, grass), style references and icons, instead of full building pictures.
- **Real 3D animals: researched, not started.** Gemini suggested KayKit, but KayKit has no farm animals; the free CC0 farm packs (Quaternius) are low-poly cartoon style and would clash with the realistic scene. Realistic rigged animals mostly need buying (e.g. the Sketchfab Store) and a download by the user. Waiting on the user's choice.
- **Animals stay as the approved renders for now.** They turn to face the camera, and a separate hidden shape faces the sun so their shadows look right. A real-3D animal pipeline is a later option.
- **Full-resolution Canva images:** 1264×1264 originals are available through an export design (the user allowed `canva.com` on the network).

## "Minecraft meets Hay Day" update (planned with Gemini)
### Phase 1: spatial sandbox and first-person graphics (done)
- [x] Walk mode (🚶 button): eye height 1.8 m, thumbstick on phones and WASD / arrow keys (Shift to run, Q/E to turn), drag to look. You bump into buildings, fences, bushes and decorations and can walk over the fields; taps still harvest, plant and pet. ✕ Exit brings the farm view back over where you walked to.
- [x] Ultra graphics while walking: full screen resolution (no automatic quality drop), 2048 shadows in a tight box around you, maximum texture sharpening, distance haze instead of tilt-shift, and 2.6x surface detail on wood, stone and roofs plus a new bump map on the grass ground. Your normal graphics setting comes back when you stop walking.
- [x] Edit mode (🏗️ button): straight-down camera over a 1 m grid; drag buildings (bought or not), the two big trees and decorations. They snap to the grid; green means it fits, red means something's in the way. Positions are saved with the farm in the browser.
### Phase 2: tactile physics (done)
- [x] Swipe harvesting (Fruit Ninja style): when something is ripe, a swipe that starts on any field draws a glowing blade trail; every ripe crop it crosses splits into two halves that fly apart across the cut with juice and leaf bits, bounce, and zip into the Barn button. Three or more in one swipe shows a combo.
- [x] Physical drops: goods pop out of a building's door one by one and bounce; eggs, milk and wool tumble off the animals (horse ride coins fly to the coin counter); pet gifts pop up too. They settle, then fly into the Barn button. While walking they wait on the ground until you come close (Minecraft-style pickup).
- [x] Bait: the 🌾 Bait button in Walk mode throws feed in an arc (Space or F on a computer); in the farm view, press and hold on the grass. Hungry and greedy animals race to it and munch; penned animals crowd the nearest fence and beg.
- [x] Herding: while you walk, timid animals move out of your way (so you can herd them into a corner), curious ones come over for a look, and the dog follows you.

## Player accounts (Firebase Authentication)
- [x] Sign in / Create account window (email and password, show-password eye, forgot-password email) that covers the game until the player is signed in. Friendly error messages. Sign out lives in Settings.
- [x] Stays signed in on each phone; a phone that has signed in before can keep playing offline.
- [ ] Waiting on the Firebase config: until `farm3d/auth.js` has the real values (it still says YOUR_…), accounts stay off and the game plays as before. Then turn on Email/Password under Authentication › Sign-in method.
- [x] Cloud saves (Firestore, farms/{uid}): a farm from before accounts moves into the new account; a new phone gets the account's farm; saves are versioned so an older phone never overwrites newer progress; if two phones both changed the farm the player chooses and the other is kept as a backup; another family member's farm on the same phone is kept aside for them.
- [x] The sign-in screen tells players their farm is safe (with its level and coins when this phone has one).

## Builder brief, Phase 1: fix what's broken
- [x] Guest mode: "Play as a guest" on the sign-in screen; the farm is saved on this phone only. A small reminder (after the tutorial) and the Settings Account row offer "Create account"; the guest farm moves into the new account.
- [x] A drag harvests only if it starts on a ripe crop; a drag anywhere else turns the camera.
- [x] New farms show morning light during the tutorial; at night the fields glow softly and the night is a little brighter.
- [x] "Welcome!" for new players, "Welcome back!" for people who have played on this phone.
- [x] Pinch zoom allowed in the page (the farm itself still zooms with two fingers).
- [x] Seed tray: seeds you have show a green "×N", seeds you'd buy show "🛒 price".
- [x] Taps: bigger tap area on the daily gift; taps near an animal count; the empty lots' posts and ropes no longer steal Feed Mill taps.
- [x] Tutorial: 9 steps, now also explaining coins and gems, the barn's space and what each building makes; it turns the camera to whatever it points at.
- [x] Order notes show each item's name under its count.
- [x] Empty building lots: bigger signs, and a 🔨 over the lots you can already build.

## Next big update (after launch)
1. First-person walk mode (planned with the user and Gemini).
2. Real 3D animals, if the user picks a model pack.
3. More buildings from the list: farmhouse, windmill, water tank, truck, tractor; building styles and sizes.
4. Animal customization: breeds, colors, sizes, accessories.

## Waiting on the user
- OK to open the pull request for the phone fixes (seeds, drag planting, moving decorations).
