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
