# Sunny Acres 3D: design spec (what the live game does)

This is the reference for QA and for the builder brief. When the brief and the game disagree, this file says which one was chosen.

No real money, ever. Coins and gems are only earned by playing.

## Testing

- **Test farm:** open `https://pederaus9-ux.github.io/Bugsy/farm3d/?testfarm`.
  - It's a throwaway level 12 farm: all buildings, a chicken coop (4 hens: two hungry, one working, one ready), cows, a sheep, a horse, a dog and a cat, and fields at every growth stage (ripe, 20%, 50%, 80%).
  - A visitor arrives in about 20 seconds and a rush order in about 45 seconds.
  - Nothing is saved and nothing reaches the cloud. Your own farm isn't touched: remove `?testfarm` to go back to it.
- **First-run / guest path:** open the game in a private (incognito) window, or tap ⚙️ › Sign out.
  - The sign-in card shows **Welcome!**, Sign in / Create account, and **🌱 Play as a guest**.
  - A guest's farm is saved on that phone only (localStorage `sunny-acres-3d-v1`).
  - Creating an account later moves the guest farm into it.

## Fields and crops

- 6 fields to start, then bought one at a time in the Shop: 40 🪙 + 35 🪙 per field after the sixth.
- **Land:** 30 fields on the starting land. **🗺️ More land** deeds (Shop) add 6 fields each, in new columns to the west:
  - level 8: 1,500 🪙
  - level 12: 3,000 🪙
  - level 16: 6,000 🪙
  - Maximum: **48 fields**.
  - (Chosen over "cap at 30": the brief asked for expansions beyond 30.)
- **Harvesting:**
  - Tapping a ripe crop harvests it.
  - A swipe that starts on a ripe crop harvests every ripe crop it crosses; a drag that starts anywhere else turns the camera.
  - Each harvest gives 2 of the crop and XP.
  - Feedback: the crop splits in two and flies to the 📦 Barn button, with a burst of juice, leaves and a soil puff, and a ⭐ that flies to the level star.
- **Growth stages:** sprout (0–33%), leafy (33–66%), nearly there (66–99%), ripe.
  - Each new stage gives a little bounce.
  - Ripe fields twinkle with blinking stars and the odd rising glint.
- **Watering:** tap a growing field, then 💧 Water (or Water all). The crop finishes 25% sooner. Rain waters every growing field.
- **💦 Sprinklers:** Shop, from **level 5**. The first costs **200 🪙**, then 400, 600…
  - Each sprinkler covers the next **6 fields** in the order they were bought (fields 1–6, 7–12, …) and waters them when planted.
  - A small sprinkler head shows on each covered field.
  - (Chosen: level 5, 200 🪙, 6 fields each. The "level 6 / 250 🪙 / 3×3" numbers were never in the game; fields aren't placed on a 3×3 grid, so "6 fields each" is the rule.)
- **Fertilizer** (made at the Feed Mill from wheat + corn): +35% chance of a 🥇 gold harvest and +25 soil.
- **Gold crops** sell for double. Chance per harvest:
  - 5% base;
  - +10% if watered;
  - +35% if fertilized;
  - +5% on healthy soil.
- **Soil:**
  - Growing the same crop again costs 15 soil; a different crop adds 10.
  - An empty field recovers 10 an hour.
  - Below 40, crops grow 25% slower and the soil looks pale.
- **Seasons:** these follow the real date (flipped in the southern hemisphere). **Out-of-season crops grow at half speed** and can't be gold. They are **not** greyed out.
  - (Chosen over "greyed out": a family game shouldn't lock someone out of strawberries for 9 months.)
  - In the seed tray an out-of-season seed has a dashed, faded card, the seasons it likes in the corner (🌸☀️🍂❄️), and "🐢 ½ speed" with its real (doubled) time.
- **Heatwave** (real weather ≥ 32 °C / 90 °F): unwatered crops grow 20% slower.

## Animals

- **Chicken coop:** level 2, 100 🪙, comes with the first hen (more hens 40 🪙 each, up to 6).
- **Other pens:** cows at level 4, a horse paddock at level 5, sheep at level 7.
- **Pets:** a dog at level 2 and a cat at level 3 (300 🪙 each). They roam the farm and bring gifts when happy.
- **Tapping an animal:**
  - If it has something ready, everyone in the pen drops their goods.
  - Otherwise its card opens: name, ❤️ happiness meter (5 hearts), mood, what it's doing, and buttons for Feed, 🤚 Pet, ✨ Brush (🏇 Ride for horses) and buying more.
- **Happiness:**
  - Feed +5, pet +15, brush +25, play +20, treat +30.
  - Fades by about 10 a day.
  - At 70+ (4 hearts), animals work 20% faster and can make double or 🥇 gold goods.
  - (There is no "water" for animals; feeding and care fill the meter.)
- **Idle life:** hens peck, cows and sheep graze, the dog roams and chases hens, and cats nap. Standing animals fidget: hens peck twice, the dog wiggles, the cat stretches, the big ones nod.

## Coins, gems and rewards

- Coins and gems that go up fly from where you tapped into their counters (selling, orders, quests, visitors, gifts).
- **Daily gift:** a 7-day streak calendar.
  - Every day also gives +1 💎.
  - Days 1, 2, 4 and 6: coins ×1, ×1.5, ×2 and ×3.
  - Day 3: +1 💎 extra; day 5: 3 🧪 fertilizer; day 7: +3 💎 and a prize decoration.
  - Missing a day restarts the calendar.
- **Gems also come from:** +2 per level-up, every 10th order, some orders, quests, achievements, event tiers, best-friend villagers and the season track.
- **Level-up perks** every 5 levels: 🌱 Green thumb (crops 10% faster) or 💰 Haggler (10% better prices).

## Backup

- **⚙️ › Backup code** makes a code (gzip + base64). **Restore from code** replaces the farm on this phone and reloads.
  - For a signed-in player, the restored farm is also saved to their account, so it stays after a reload and on their other phones.

## Walking (Phase 6)

- **Phone sideways:** landscape on a touch screen starts first-person walking, depending on Settings › Phone sideways.
  - Default for new players: walk (only once the tutorial is done).
  - Default for existing players: ask once with a card; the answer becomes the setting unless "Ask every time" is picked in Settings.
  - Turning back to portrait swoops back to the classic view where you were.
- **Controls:**
  - Left half of the screen: a joystick where your thumb lands; the edge runs at 6 m/s, otherwise 3.4 m/s.
  - Right half: drag to look, 1:1 (a full screen height = the field of view), with pitch limited to ±80°.
  - The big button bottom-right uses what the crosshair is on. Keyboard: WASD, Shift to run, E to use.
- **Reach:** 5 m, 6 m for animals and 8 m for the barn (more in the over-the-shoulder view).
- **Petting in first person** uses the same Pet as the classic view: +15 happiness, with the 20-minute cooldown.
- **Barn interior:** reuses the Barn panel.
- **Wardrobe unlocks:**
  - Skin tones and hairstyles are always free.
  - Level unlocks: 2 (sunflower shirt, cap, red boots), 5 (lavender shirt, beanie, brown overalls), 8 (cream shirt, pink hair, yellow boots), 12 (blue hair, cowboy hat), 16 (forest overalls), 20 (white boots).
  - Season prizes (win 3 prizes on that season's track): spring flower crown, fall pumpkin shirt.
  - 💎 items (teal shirt, rose overalls, purple boots) wait for the gem shop.

## Landscape and fullscreen

- **The game is played in landscape.** In portrait, a "Rotate your phone sideways to play" screen covers everything, and the farm stops drawing and ignores taps until the phone is turned.
  - For testing on a tall window, add `?portrait` to the link; this also skips fullscreen.
- **Fullscreen:** the first tap requests fullscreen (and a landscape lock). Any later exit, such as a swipe, the back gesture or locking the phone, is undone by the next tap.
- **iPhone:** iPhone Safari has no fullscreen for web pages. "Add to Home Screen" opens the game fullscreen (manifest `display: fullscreen`), and a one-time tip explains this.
- **Walking:** the 🚶 button (not rotation) enters first-person walking.
