# Sunny Acres 3D — Phase 7G Firebase hardening

Status: ACTIVE — architecture/security entry gate.

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
