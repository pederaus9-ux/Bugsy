# Sunny Acres: progress

Last updated: 2026-09-26

## Where things live
- **Live 2D game:** `farm/` (published at `https://pederaus9-ux.github.io/Bugsy/farm/`)
- **New 3D game (in progress):** `farm3d/`
- **3D engine:** `farm3d/lib/` (three.js r186, minified, MIT license, no internet needed)
- **Art:** `farm/art/` (animals and crops, backgrounds removed). Approved environment assets will go in `assets/`.
- **Canva helper design:** "Farm game asset export" in the Canva account, used to export assets at full resolution (waiting for approval to save to it).

## Test links
- **3D barn test (phone):** https://claude.ai/artifact/1s6eqFAG4HAMnGvpSjjcfS (private to the account owner). Turn 360°, switch weather and time of day, paint the barn, tap animals.

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
- [x] **Barn lighting test** (`farm3d/barn-test.html`):
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

## Decisions
- **Work stays in this cloud chat, driven from the phone** (the PC plan was dropped). Everything is saved to GitHub, and test links are published after each milestone.
- **Buildings and props are real 3D models, not pictures.** The user wants full 360° rotation and everything reacting to sun and weather. Painted pictures can't do that, because their lighting is fixed and they only have one angle. Real 3D models with realistic textures can, and they also make paint colors and swappable parts easy.
- **Canva's role changes.** It will make textures (wood, shingles, stone, grass), style references and icons, instead of full building pictures.
- **Animals stay as the approved renders for now.** They turn to face the camera, and a separate hidden shape faces the sun so their shadows look right. A real-3D animal pipeline is a later option.
- **Full-resolution Canva images:** 1264×1264 originals are available through an export design (the user allowed `canva.com` on the network).

## Next
1. Get the user's feedback on the 3D barn look (lighting, weather, 360°, paint).
2. Building styles and sizes (the shapes and sizes from the user's barn mockup).
3. Remaining pieces from the building list: farmhouse, shed, market stall, windmill, water tank, sign board, truck, tractor.
4. Move the whole game (fields, orders, shop, events…) into the 3D world.
5. Animal customization: breeds, colors, sizes, accessories.

## Waiting on the user
- OK to save and export from the Canva helper design?
- Approve the 3D barn look (the painted barn picture is now only the design reference).
- Open a pull request to put the animals and pets update live?
