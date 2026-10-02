# Sunny Acres 3D — Firestore rules (Phase 7G)

`firestore.rules` is the version-controlled security ruleset for the game's Firestore database
(project `fir-config-18b64`, database **`default`**, not `(default)`). Ruleset version: **7G.1**.

Nothing in this folder deploys anything. GitHub Pages hosting is unchanged; `firebase.json` only
tells the Firebase CLI where the rules file is, for the local emulator and for a manual publish.

## Run the tests

Needs Node 22 and Java 21 (for the Firestore emulator, which the CLI downloads on first run).

```sh
cd farm3d/firebase
npm ci --ignore-scripts
npm test
```

`npm test` starts the local Firestore emulator under the demo project `demo-sunny-acres` (no
credentials, no network calls to the real project), runs `tests/rules.test.mjs`, and stops it.
The run prints `RULES ASSERTIONS: N allow, M deny` and writes `artifacts/rules-tally.json`.
CI runs the same thing in the `Firestore rules (emulator)` job of
`.github/workflows/farm3d-regression.yml`.

The tests do two things:

- **Game flows** repeat the exact Firestore code from `auth.js` and `friends.js` (cloud-save
  transaction and its conflict check, presence heartbeat, anonymous stats, username
  claim/rename transaction, friend search/add/remove, showcase publish/visit, help notes,
  listing/buying/taking back/collecting at the market, and the players page reads). They must be
  allowed. If game code changes one of these calls, update the copy in the test.
- **Allow/deny checks** for every collection: other accounts, signed-out users, extra fields,
  wrong types, out-of-range values and illegal market transitions are denied.

A test also fails if the market price table in the rules stops matching `ITEMS` in `game.js`, so a
price change in the game must update `basePrices()` in the rules (and be published) at the same
time, or listings of that item will be refused.

## Collections

| Path | Who reads | Who writes | Checks |
|---|---|---|---|
| `farms/{uid}` | owner of the save; the game owner may only **count** | owner of the save | fixed fields; `rev` = old `rev` + 1; save ≤ 1,000,000 chars; no delete |
| `presence/{uid}` | game owner | that player | `seen` = server time; level/joined types; known fields only |
| `players/{uid}` | any signed-in player | that player | `{name, nameLower}` only; name pattern; must hold `usernames/{nameLower}` |
| `players/{uid}/friends/{fid}` | that player | that player | `{name, addedAt}`; not yourself |
| `usernames/{nameLower}` | any signed-in player | claimant | for yourself; matches the id; written with your profile; only your own old name can be given back |
| `showcase/{uid}` | any signed-in player | that player | known fields; numbers ≥ 0; `name` = your username; save ≤ 1,000,000 chars |
| `help/{owner}/items/{id}` | that farm's owner (and deletes) | any other signed-in player | `from` = you; id starts with your uid; `name` = your username; one field number 0–63; time ≈ now |
| `market/{id}` | any signed-in player | see below | see below |
| `events/{id}` | game owner (counts) | anyone, including guests | `{e, d}` only; known milestone names; `YYYY-MM-DD` |
| anything else | nobody | nobody | |

Market: a seller creates an unsold listing under their own uid, id prefix and username, for a
known item, 1–10 of it, at a whole-coin price inside the game's band (half to double the barn
price, times the amount). Afterwards item, amount, price and seller never change. Another player
(not the seller) can mark it bought exactly once, changing only `buyer` (themselves),
`buyerName` (their username) and `soldAt`. Only the seller deletes it: taking it back unsold, or
collecting the coins once sold.

## What the rules do NOT make trustworthy

Rules check identity, ownership, shape, ranges and legal transitions. They cannot check numbers
the browser works out for itself:

- coins, inventory, XP and level inside a farm save (and the `level`/`coins` copies beside it);
- leaderboard/showcase stats (`earned`, `harvests`, `best`, `orders`) — friendly comparison only;
- whether a buyer really had the coins, or a seller really held back the goods;
- the 4-listings-per-seller and 12-help-notes-per-friend-per-day limits (counted on the phone);
- milestone events (anyone can add well-formed ones; the funnel is a rough guide).

Making any of those authoritative would need server code (for example Cloud Functions), which is
outside Phase 7G.

## Publishing (owner only, manual)

Production rules were **not** inspected or changed by Phase 7G; no one but the owner has access.
Before publishing:

1. In the Firebase console › Firestore › database `default` › Rules, copy the current published
   rules into a file and keep it (for example `published-before-7G.rules`) with its SHA-256
   (`sha256sum`). That is the rollback copy.
2. Compare it with `firestore.rules` here. If the console has a collection or a rule this file
   doesn't, stop and add a test for it first.
3. Publish, either by pasting `firestore.rules` into the console, or with the CLI from this folder:
   `npx firebase deploy --only firestore:rules --project fir-config-18b64`
   (`firebase.json` lists only the database named `default`, so only its rules are published).
4. Straight away, signed in on a phone: open the game (cloud save loads), change something and
   close/reopen (cloud save uploads), open 👥 Friends (username shows, friends list loads), visit
   a friend and water a field, list something at the trading post and take it back, buy a
   friend's listing, and open `players.html` with the owner account. Also open the game as a
   guest once. If anything fails, paste the rollback copy back into the console.

## App Check

Decision for 7G: **not enabled, not enforced.** App Check is abuse friction, not authentication,
and it does nothing for the trust limits above. Turning it on needs a reCAPTCHA Enterprise (or v3)
site key and a code change in `auth.js`/`players.html`, then a period in *monitoring* mode while
the console's App Check metrics show what share of real requests (Android Chrome, iPhone
Safari/PWA, desktop, guests) carry valid tokens. Enforce only after that share is near 100% and
the signed-in smoke test above passes with enforcement on. Recommended as its own small change
after these rules are published and have run cleanly for a while.
