# Sunny Acres: progress

Last updated: 2026-09-26

## Where things live
- **Live 2D game:** `farm/` (published at `https://pederaus9-ux.github.io/Bugsy/farm/`)
- **New 3D game (in progress):** `farm3d/`
- **3D engine:** `farm3d/lib/` (three.js r186, minified, MIT license, no internet needed)
- **Art:** `farm/art/` (animals and crops, backgrounds removed). Approved environment assets will go in `assets/`.
- **Canva helper design:** "Farm game asset export" in the Canva account, used to export assets at full resolution (waiting for approval to save to it).

## Test links
- **3D barn test (phone):** https://claude.ai/artifact/1s6eqFAG4HAMnGvpSjjcfS (private to the account owner). Turn 360°, switch weather and time of day, paint the barn.

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

## Decisions
- **Work stays in this cloud chat, driven from the phone** (the PC plan was dropped). Everything is saved to GitHub, and test links are published after each milestone.
- **Buildings and props are real 3D models, not pictures.** The user wants full 360° rotation and everything reacting to sun and weather. Painted pictures can't do that, because their lighting is fixed and they only have one angle. Real 3D models with realistic textures can, and they also make paint colors and swappable parts easy.
- **Canva's role changes.** It will make textures (wood, shingles, stone, grass), style references and icons, instead of full building pictures.
- **Animals stay as the approved renders for now.** They turn to face the camera, and a separate hidden shape faces the sun so their shadows look right. A real-3D animal pipeline is a later option.
- **Full-resolution Canva images:** 1264×1264 originals are available through an export design (the user allowed `canva.com` on the network).

## Next
1. Get the user's feedback on the 3D barn look (lighting, weather, 360°, paint).
2. Building styles and sizes (the shapes and sizes from the user's barn mockup).
3. More environment pieces in the same 3D style: silo, fences, trees, bushes, rocks, crop plots, hay bales, water trough, dirt paths.
4. Move the whole game (fields, orders, shop, events…) into the 3D world.
5. Animal customization: breeds, colors, sizes, accessories.

## Waiting on the user
- OK to save and export from the Canva helper design?
- Approve the 3D barn look (the painted barn picture is now only the design reference).
- Open a pull request to put the animals and pets update live?
