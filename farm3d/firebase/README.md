# Sunny Acres 3D — Firestore rules

`firestore.rules` is the source of truth for who may read and write what in the game's Firestore database
(Firebase project `fir-config-18b64`, database **`default`**). Ruleset version: **7G-2** (not yet published; production still runs whatever was published before).

## What the rules protect (and what they can't)

They check **who** is writing, **which** document they may touch, the **shape** of what they write, and **legal state
changes** (a market listing can only go from unsold to sold, once, by someone other than the seller).

They can't check that coins, goods, levels or leaderboard numbers are honest. The player's own browser calculates
those, so a determined player can still edit **their own** farm. What the rules stop is changing **somebody else's** data.

| Path | Who can read | Who can write |
|---|---|---|
| `farms/{uid}` | that player only (nobody can list or count farms) | that player; `rev` must go up by exactly 1 |
| `presence/{uid}` | owner dashboard | that player; `seen` must be the server clock |
| `players/{uid}` | any signed-in player | that player, only together with their `usernames` entry |
| `players/{uid}/friends/{fid}` | that player | that player |
| `usernames/{nameLower}` | any signed-in player, one name at a time (no listing) | claim a free name, re-save or give back your own |
| `showcase/{uid}` | any signed-in player, one farm at a time (no listing) | that player, fixed fields and sizes |
| `help/{owner}/items/{id}` | the owner of that inbox | any other signed-in player, as themselves, small fixed note |
| `market/{id}` | any signed-in player | seller creates/deletes; a different player can mark it bought, once |
| `events/{id}` | owner dashboard | anyone (guests aren't signed in), exactly `{e, d}` |
| anything else | nobody | nobody |

**Reading one document vs. listing a collection.** Firestore checks these separately: `get` is one document,
`list` is a query, and a **count is a list** (it needs list permission, and list permission returns whole documents).
7G-1 allowed the owner to list `farms` so the dashboard could count them, which also let the owner download every
player's whole save; it also let any signed-in player list every showcase and username. 7G-2 (Phase 7H finding F1)
turns listing off there. The dashboard's "total players" now comes from `presence` (everyone who has opened the game
signed in), and `rules.test.mjs` checks get / list / count separately for every collection and role.

**The owner check is pinned to the owner's account id (UID).** The dashboard data (`presence/`, `events/`) can be read
only by the Firebase Authentication account whose UID is in `isOwner()`. Austin supplied it from the Firebase console.
The email claim is no longer trusted: the game never verifies addresses, so an email is not proof of identity. The
rules tests check that the owner email on any other account is refused, whether verified or not.

## Tests

```sh
cd farm3d/firebase
npm ci --ignore-scripts
npx playwright install chromium   # once
npm test
```

`npm test` starts the Firestore and Auth emulators (needs Java 21+) for the offline `demo-sunny-acres` project, then runs:

1. `tests/rules.test.mjs`: allow + deny checks for every collection, including a get / list / count matrix for every
   role, two buyers racing for one listing, and the owner-email limit (23 tests, 260 checks).
2. `tests/flows.browser.cjs`: the real game (`auth.js`, `friends.js`, `players.html`) in Chromium against the emulators.
   It covers sign-up, cloud save, presence, usernames, showcase, friends, leaderboard, selling, buying, collecting,
   visiting, guest milestones and the owner dashboard (owner allowed, other players refused).
3. `tests/recovery.browser.cjs`: the save-recovery promise, *an unreadable phone save never overwrites a good cloud
   save*. Each scenario marks the good farm with a unique sentinel, then samples the cloud copy every second for longer
   than the 15 s upload delay and records every farm write the page sends. Scenarios: sign-in racing the game's first
   read, corrupt phone + good cloud (twice), good phone + corrupt cloud, corrupt phone + no cloud, cloud unreachable at
   start, reload during recovery with same-coins/different-state, sign-out and sign-in during recovery. Console logs
   per page go to `artifacts/console-*.log`. `npm run test:recovery` runs only this part; `REPEAT=n` repeats scenario 1.

`npm run test:rules` runs only the first part. The same tests run in GitHub Actions (`firebase-rules` job).

To check that the deny tests prove something, run them against wide-open rules. Every deny case should get through,
apart from the 3 edits whose document an earlier, wrongly allowed delete already removed:

```sh
printf "rules_version = '2';\nservice cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }\n" > /tmp/open.rules
MUTATION=1 RULES_FILE=/tmp/open.rules npx firebase emulators:exec --only firestore --project demo-sunny-acres "node --test tests/rules.test.mjs"
```

## Publishing the rules (Firebase console)

Nothing in this repo publishes rules automatically. To publish:

1. Firebase console › **Firestore Database** › pick the database **`default`** › **Rules**.
2. **Copy the rules that are there now** into a safe place (that is the rollback).
3. Paste the whole of `firestore.rules`, then **Publish**.
4. Smoke test straight away on a phone signed in to a real account:
   - open the game: the farm loads, no "couldn't save" warning;
   - change something, close the app, reopen: still there (cloud save);
   - Friends: your username shows, your friends list loads, a friend's farm opens;
   - Trading: the list loads (if you can, sell one cheap item and take it back);
   - `players.html`: numbers load for the owner account.
5. If anything breaks, paste the copy from step 2 back and publish. That restores the old rules immediately.
