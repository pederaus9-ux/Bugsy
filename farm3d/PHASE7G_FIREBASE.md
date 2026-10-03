# Sunny Acres 3D — Phase 7G Firebase hardening

Status: **MERGED IN REPO** (PR #35, merge commit `036bfb4`, 2026-10-02; main CI green). **Production publish NOT done** (owner, Firebase console); phone smoke test NOT RUN. Evidence below.

Baseline main: `97cb54055e3284d5ec2a063a48d7991658075c73` (PR #32 merged; 3D cows are default on the normal game link).

## Goal

Harden Firebase/Firestore access without changing game design, wiping saves, breaking guest mode, or pretending client-authored gameplay values are server-trusted.

## Existing Firebase surface

Current code uses Firebase Authentication + Cloud Firestore from the browser. Known collections/paths include:

- `farms/{uid}` — cloud save owned by that account
- `players/{uid}` — public player profile / username metadata
- `players/{uid}/friends/{fid}` — owner's friends list
- `usernames/{nameLower}` — username uniqueness mapping
- `showcase/{uid}` — visitable farm snapshot + leaderboard fields
- `help/{uid}/items/{id}` — friend crop-watering messages
- `market/{id}` — trading-post listings and sales state
- `events/{id}` — lightweight anonymous/milestone analytics
- presence/player-dashboard paths referenced by auth/dashboard code must be included in the audit before rules are finalized

## Security model

### Hard rule

Authentication proves which Firebase user issued a request. It does **not** prove that client-supplied gameplay values are legitimate.

The browser currently calculates important state such as inventory, coins, market price/quantity, showcase stats and some progression. Firestore rules can enforce ownership, shape, ranges and legal state transitions, but cannot make arbitrary browser-computed gameplay values cheat-proof.

Do not claim server-authoritative economy/leaderboards in Phase 7G.

### Desired Phase 7G result

1. Every collection has an explicit read/write policy.
2. User-owned documents cannot be written by another UID.
3. Public/shared documents expose only intended fields.
4. Username claims remain atomic and ownership-safe.
5. Market transitions prevent obvious cross-user mutation, self-buy, seller rewriting a sold listing, buyer changing price/item/qty, and unrelated users deleting listings.
6. Help writes require authentication and target bounded schemas; owners alone read/delete their inbox.
7. Cloud saves remain owner-only.
8. Events use a deliberately limited schema and do not become a general unauthenticated write sink.
9. Showcase/profile writes are UID-bound and field/range constrained.
10. Rules are versioned in Git and exercised by emulator tests before deployment.

## Required implementation artifacts

- `firestore.rules` (or equivalent clearly named rule file) committed to the repository.
- `firebase.json` only if needed for local emulator/rules testing; do not disturb GitHub Pages hosting.
- Automated Firestore Rules tests using the Firebase emulator / Rules Unit Testing library or another official supported mechanism.
- A documented ruleset version and deployment procedure.
- `farm3d/PHASE7G_FIREBASE.md` updated with final evidence.

## Required test matrix

### farms/{uid}

- owner read: PASS
- owner create/update: PASS
- different signed-in user read/write: DENY
- unauthenticated read/write: DENY
- cross-account revision overwrite path remains compatible with current cloud-save transaction logic

### players/{uid}

- signed-in player may read intended public profile fields
- profile owner may write only allowed profile fields
- another user cannot modify profile
- reject unexpected/admin-like fields
- validate username/nameLower shape and length

### players/{uid}/friends/{fid}

- only owner can list/read/write/delete own friend documents
- another signed-in user cannot mutate them

### usernames/{nameLower}

- reads needed for search/claim flow remain possible for signed-in clients
- create/update must bind document UID to `request.auth.uid`
- reassignment of another user's claimed name is denied
- delete must be limited to the current owner
- transaction-based rename flow must still work

### showcase/{uid}

- signed-in reads permitted only if intended by the product
- only matching UID writes its showcase
- schema/size/range checks for name, level, earned, harvests, best, orders, updatedAt
- `save` payload size must be bounded to a documented safe limit
- note explicitly: these client-authored stats are display/social data, not server-verified competitive results

### help/{owner}/items/{id}

- authenticated friend can create only bounded help records
- `from` must equal authenticated UID
- target plot array and timestamp shape/ranges validated
- recipient alone can read/delete
- unrelated users cannot read another inbox
- rule design must not trust local daily-help limit as a security boundary

### market/{id}

Test seller lifecycle:

1. Seller creates unsold listing with `seller == request.auth.uid`.
2. Unrelated user cannot edit item/qty/price/seller identity.
3. Buyer transition may set only buyer/buyerName/soldAt on an existing unsold listing; core listing fields stay immutable.
4. Buyer cannot buy own listing.
5. Second buyer cannot overwrite an already sold listing.
6. Seller can delete only their own unsold listing.
7. Seller can collect/delete their own sold listing only if this matches current client flow and cannot alter sale economics.
8. Unrelated user cannot delete listing.
9. Numeric/string bounds reject malformed/abusive payloads.

Important: Firestore rules cannot verify that the buyer actually had enough in-game coins or that the seller actually escrowed the goods because those balances live in client saves. Phase 7G should prevent document tampering, not claim a cheat-proof marketplace.

### events/{id}

- decide deliberately whether guest/unauthenticated milestone writes remain supported
- if unauthenticated writes are required, constrain exact allowed event names, date format and field set; no reads from clients unless required
- prefer authenticated or App Check-assisted writes where compatible, but do not break guest telemetry without measuring impact
- never allow arbitrary extra fields or large payloads

### presence / dashboard paths

Audit auth.js and players dashboard for every additional collection. No production collection may be omitted from the rules matrix.

## App Check

Evaluate App Check only after rules tests are green.

- Start with monitoring/metrics if supported by the chosen web setup.
- Do not enable enforcement blindly.
- Verify Android Chrome, iPhone Safari/PWA, desktop, guest mode, sign-in, cloud save, friends, market and analytics before enforcement.
- Treat App Check as abuse friction, not authentication or proof that gameplay values are honest.

## Regression requirements

Keep the existing Sunny Acres regression workflow green, including:

- normal/testfarm boot
- no page errors
- planting/harvest/orders
- walk/interact
- save/reload
- mobile layouts
- shed switching
- 3D cow default mode
- painted-cow comparison mode
- save preservation

Add emulator-based Firebase tests to CI if they are stable and do not require production credentials.

## Protected behavior

Do not break:

- existing local saves
- cloud-save revisions/conflict chooser
- guest mode
- account migration
- current username flow
- friends list/visits/help
- market UI behavior
- existing analytics semantics without a documented decision
- GitHub Pages deployment
- 3D cow/locomotion work

## Exit gate

Phase 7G passes only when:

- production Firestore rules are versioned in Git
- all known collections are covered
- emulator rules tests cover allow + deny cases
- malformed/cross-user writes are denied
- current signed-in flows still pass
- guest behavior is explicitly tested/documented
- App Check decision is evidence-based; enforcement is optional, not required
- remaining client-authoritative trust limits are documented clearly
- current full Sunny Acres regression/CI remains green

After a clean Phase 7G merge, proceed automatically to **Phase 7H — Save + update hardening**.


## Evidence (Claude, branch `claude/sunny-acres-phase7g-firebase`)

### Collection/path inventory (from current main: `auth.js`, `friends.js`, `players.html`; `game.js`/`index.html` make no direct Firestore calls)

| Path | Operations in code | Where |
|---|---|---|
| `farms/{uid}` | get; transaction get + set `{save, level, coins, rev, updatedAt}`; owner dashboard count | auth.js `cloud.get/put`; players.html |
| `presence/{uid}` | set merge `{seen: serverTimestamp, level, joined}`; owner dashboard live list | auth.js `beat`; players.html |
| `players/{uid}` | get; prefix search query; transaction set `{name, nameLower}`; dashboard name lookups | friends.js; players.html |
| `players/{uid}/friends/{fid}` | set `{name, addedAt}`, delete, list | friends.js |
| `usernames/{nameLower}` | transaction get / set `{uid, name}` / delete old name | friends.js `claimUsername` |
| `showcase/{uid}` | set `{save, name, level, earned, harvests, best, orders, updatedAt}`; get (visit, leaderboard) | friends.js |
| `help/{owner}/items/{id}` | set `{from, name, plots, at}` with id `helper-millis-plot`; list + delete by owner | friends.js |
| `market/{id}` | create (id `seller-millis`); list (limit 60, `where seller ==`); buy transaction; take-back / collect transaction delete | friends.js |
| `events/{id}` | addDoc `{e, d}` (guests too); owner dashboard count queries | auth.js `flushStats`; players.html |

No other collection, collection group or path is used.

### Current deployed rules

Not accessible from this session (no Firebase console/CLI credentials). Partial copies exist in the PR #18 (help, market) and
PR #20 (events) descriptions only; the deployed set was never in Git. **Per the deployment-safety rule nothing was deployed.**
The owner must save the currently published rules as the rollback copy before publishing (procedure in `farm3d/firebase/README.md`).

### Changed files

- `farm3d/firebase/firestore.rules` (new): ruleset 7G-1, every collection explicit, default deny
- `farm3d/firebase/tests/rules.test.mjs` (new): emulator rules tests
- `farm3d/firebase/tests/flows.browser.cjs` (new): the real game code against the emulators
- `farm3d/firebase/{package.json, package-lock.json, firebase.json, README.md, .gitignore}` (new): isolated test tooling and the publish procedure; `firebase.json` is only for the emulators (GitHub Pages is untouched)
- `.github/workflows/farm3d-regression.yml`: new `firebase-rules` job
- `farm3d/HANDOFF.md`, this file, `farm3d/OWNER.lock`, `progress.md`: docs

Protected files touched: **none** (no change to game.js, auth.js, friends.js, index.html, players.html, cow3d.js, sw.js, lib, /farm, root app).

### Rules tests (emulator) — PASS

20 tests, **143 checks: 36 allow + 107 deny**, all pass. Mutation check against wide-open rules: 104 of 107 deny cases
are let through (so they really test the rules); the other 3 are edits whose document an earlier wrongly allowed delete had already removed.

### Real game flows (emulator, real auth.js/friends.js/players.html in Chromium) — PASS 17/17

Sign up two accounts; cloud save through the revision transaction (rev 1); presence heartbeat; username claims; showcase
publish; search + add friend; leaderboard reads the friend's showcase; list for sale (goods escrowed); buyer buys
(transaction; coins and goods move); seller collects (coins arrive, listing deleted); visit the friend's farm; guest
milestones (`open`, `guest`) without sign-in; owner dashboard loads (presence, farm count, funnel); a non-owner is refused;
no permission errors anywhere in the game.

### Full game regression — PASS

`farm3d/tests` `npm test` locally: 11/11 unit tests and 60/60 browser checks (boot, testfarm, no page errors, planting,
harvest, orders, walking/interactions, save/reload, panel fit at 740×360 / 844×390 / 1280×720, shed switching, 3D cows
default, painted-cow comparison mode, save preservation). Hosted CI: see the PR checks (both jobs).

### Market transition tests

Seller-only create with own id; 13 malformed listings rejected (qty 0/11/2.5/"3", price 0/100001/-6, bad item, empty
name, bad time, extra field, missing field, pre-sold); self-buy, buying in another's name, buying with a changed
price/qty/item/seller, seller repricing, unauthenticated buy, second buyer, un-selling by buyer or seller: all denied;
unrelated and buyer deletes denied; seller take-back and collect allowed.

### Guest + account + cloud save

Guests: not signed in, so they can only create `events` with the exact `{e, d}` shape (unchanged product behavior; tested in
both suites). Accounts: farm owner-only, rev must equal stored rev + 1 (works for normal, forced and pre-revision saves),
size cap 900,000 characters, no deletes. Cloud-save conflict logic, guest migration and save keys are unchanged (no
client code changed).

### Hardening beyond the old published rules (as far as they are known)

- usernames ⇄ players must agree in the same transaction (`getAfter`), so a profile can't claim a name it doesn't own and a name can't be deleted while it is still in use
- market: no self-buy, ids bound to the seller, numeric/string bounds, exact field set
- help: id bound to the sender, at most 4 plots, exact field set, no updates, no deletes by the sender
- showcase/presence/farms: exact field sets, types and ranges; presence `seen` must be the server clock
- events: name `^[a-z0-9_]{1,24}$`, date `YYYY-MM-DD`
- every unknown path: denied

### App Check decision

**Not enabled in 7G.** Web App Check needs a reCAPTCHA Enterprise/v3 site key registered in the console plus a client
change in protected files (`auth.js`, `players.html`), and enforcement could block guests on older phones. Recommended
for a later phase in *monitoring only* mode first (console › App Check › Firestore › Unenforced) for at least a week,
then decide. Treat it as abuse friction, not as proof of honest gameplay.

### Client-authoritative limits still remaining

Coins, gems, inventory, levels, XP, leaderboard numbers, showcase stats, market coin balances and goods escrow, the daily
help limit (12/day) and the 4-listing limit are all computed in the browser. A player can falsify **their own** values.
Rules stop cross-account tampering, malformed documents and illegal market transitions; they do not make the economy or
leaderboards cheat-proof. Server-verified economy would need Cloud Functions (not in scope).

### Failed approaches / do not retry

- `firebase.json` with a `firestore` **array** (per-database rules): the emulator ignores it ("does not support multiple databases yet") and runs with open rules. Use the single-object form; the emulator applies it to the `default` database too (proved by the non-owner dashboard denial).
- Running two or more 3D game pages at once in the flow test: with 2 CPU cores and software WebGL the second page never finishes loading. The flow test keeps one game page open at a time.
- Rules numeric literals like `1e15` don't compile; write the digits out.

### Risks

- **The published production rules are unknown.** Publishing 7G-1 could reveal a flow the old rules allowed that these don't. The emulator flows cover every path in the current code, but keep the rollback copy and run the smoke test.
- `isOwner()` trusts the email claim without `email_verified` (unchanged from before; the address is already registered to the owner, so nobody else can sign up with it).
- `events` stays an unauthenticated write path (shape-locked and tiny). Abuse would only inflate the funnel counts.

### Next exact step

1. ChatGPT audits this packet.
2. **Owner (Austin):** copy the currently published rules (rollback), publish `farm3d/firebase/firestore.rules` in the console (database `default`), run the 2-minute phone smoke test in `farm3d/firebase/README.md`.
3. After merge: Phase 7H (save + update hardening).
