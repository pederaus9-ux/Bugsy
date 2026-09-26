# Bugsy Brain (standalone)

Your self-training AI buddy with its own website. It runs on Google Gemini with your own API key, searches Google when it needs current info, learns about you, studies topics, and reacts to screenshots. No Claude sign-in needed.

## Put it online for free (GitHub Pages, about 10 minutes)

1. Go to **github.com** and sign in (or make a free account).
2. Click the **+** at the top right, then **New repository**.
   - Name it `bugsy`.
   - Choose **Public**. (Free GitHub Pages needs a public repo. That's fine: your API key and your buddy's memory are never in these files. They stay on your own phone.)
   - Click **Create repository**.
3. On the new page, click **uploading an existing file**.
4. Unzip `bugsy.zip` on your PC. Open the `bugsy` folder, select **all the files inside it**, and drag them onto the GitHub page. Click **Commit changes**.
5. In your repo, click **Settings** (top), then **Pages** (left side).
   - Under **Build and deployment**, set **Source** to **Deploy from a branch**.
   - Set **Branch** to **main** and the folder to **/ (root)**, then click **Save**.
6. Wait a minute or two, then refresh that Pages screen. It shows your link, like:
   `https://YOUR-GITHUB-NAME.github.io/bugsy/`

That's Bugsy's website. It works in any browser.

## Put it on your home screen

1. Open your link in **Chrome** on your phone.
2. Tap the **three dots**, then **Add to Home screen** or **Install app**.
3. It opens full screen like a real app.

## First time you open it

1. It asks for your Gemini API key. Get one at **aistudio.google.com/apikey** (make a fresh one if the old one was shared anywhere).
2. Paste it in and tap **Connect**. The key is saved only in that browser on that device.

## Good to know

- **Each device has its own brain.** To use the same buddy on your PC, go to Brain > **Download backup** on your phone, send the file to your PC, then open Bugsy there and use **Import backup**.
- **Screenshots:** tap the picture button next to the message box to send a screenshot and get a reaction.
- **Free limits:** Gemini's free tier has daily limits. "Think harder" uses the Pro model, which has much lower free limits. If it says a model wasn't found, change it under Brain > AI settings.
- **Clearing Chrome's site data erases the brain**, so download a backup now and then.
- **Optional extra safety:** in Google Cloud Console, you can restrict your API key to your `github.io` address so it only works from your Bugsy site.

## Updating it later

When Claude sends you a new `index.html`, open your `bugsy` repo on GitHub, click **Add file > Upload files**, drop the new file in, and **Commit changes**. Your site updates in a minute, and your buddy's memory stays put.

---

# Sunny Acres (farm game)

A cozy Hay Day–style farm game in the `farm/` folder. **No real money, ever.** There is no store. Coins and 💎 gems are only earned by playing.

Once the repo is on GitHub Pages, the game is at:
`https://YOUR-GITHUB-NAME.github.io/bugsy/farm/`

Open that link in Chrome on your phone and use **Add to Home screen** to get it as its own app.

## How to play

- **Look around:** drag the farm to move, pinch (or use + / −) to zoom.
- **Plant:** tap an empty field, then drag a seed across your fields. Crops go from seeds to sprouts to full plants. Every harvest gives 2.
- **Harvest:** tap a ripe field and swipe the sickle over the crops.
- **Orders 🚚:** tap the truck or the order board. Orders pay better than selling in the barn.
- **Animals:** chickens 🥚 (level 2), cows 🥛 (level 4), sheep 🧶 (level 7). Tap a pen and drag feed onto hungry animals. Tap to collect what they make.
- **Buildings:** tap the Feed Mill, Bakery, Sugar Mill, Dairy, Kitchen or Loom to make goods. Empty lots show what unlocks next.
- **Roadside shop:** the striped stall by the road. Put items out at your own price. People walking by buy them over time, and cheaper items sell faster.
- **Move things:** press and hold a building, pen, field or the stall, then drag it. Green means it fits; red means something's in the way.
- **Real weather:** tap the weather button (top left) and use your location or type your town. Rain, snow, fog, storms and night show up on the farm, and rain makes crops grow 10% faster. The weather comes from Open-Meteo, a free service, and your location stays on your phone.
- **Special events 🎪:** from level 2, a random challenge (like Harvest Festival or Egg Hunt) runs for a day. Hit the 3 goals to win decorations you can't buy.
- **Decor 🌷:** buy flowers, trees, benches, lanterns and fountains, or place prizes from events. Tap one to put it away; press and hold to move it.
- **Bigger land:** buy more land east or south from the Shop, or tap the "Expand" signs past the edge of the island.
- **Seasons & holidays:** the farm changes with the seasons and dresses up for Halloween, Thanksgiving, Christmas, New Year, Valentine's Day, Easter and St. Patrick's Day, each with its own holiday event and prizes.
- **Sound:** 🔊 turns sound on or off. Tap the farmhouse to switch the music on or off.
- **Barn 📦 and Shop 🛒:** sell extras, upgrade storage, buy fields, animals and buildings.
- **Gems 💎:** earned from leveling up (+2), the daily gift 🎁 by the farmhouse (+1), every 10th order, and some orders. Use them to finish things right away.

All the art is original and drawn in code (plus your phone's own emoji). No Hay Day artwork or names are used.

Crops keep growing while the game is closed. Progress is saved in that browser on that device.
