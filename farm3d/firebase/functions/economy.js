// Sunny Acres 3D, Phase 7I: the canonical farm economy.
//
// The server is the only authority for spendable coins, tradable items, verified plots and the ledger. Clients can
// read their own documents (firestore.rules) but never write them; every change goes through act() below, inside one
// Firestore transaction.
//
// Documents (all written only here, with admin access):
//   economy/{uid}            {v, coins, items:{id:n}, rev, createdAt, updatedAt}   starts at 0 coins, no items
//   ledger/{uid}/rows/{key}  {op, key, result, rev, at}                           create-once: the key IS the idempotency key
//   plots/{uid}/items/{id}   (Phase 7I-B)
//
// Idempotency: an action names its key (for example "plant-{uid}-{plotId}-{clientRequestId}"). The transaction reads
// the ledger row for that key first. If it exists, the stored result is returned and nothing changes. If the action is
// accepted, the row is created in the SAME transaction as its effects, so an effect without its row (or a row without
// its effect) cannot exist. If the action is refused (an HttpsError such as NOT_MATURE_YET), the transaction writes
// nothing at all, so a temporary refusal never uses up the key.
//
// Cutover: the legacy cloud save (farms/{uid}) is never read here. Its coins and barn stay "legacy, unverified".

const SCHEMA = 1;
const MAX_COINS = 1e12; // far beyond anything reachable; a guard against arithmetic going wrong, not a game rule
const KEY_PART = /^[A-Za-z0-9_-]{1,64}$/;

class EconomyError extends Error {
  // code: an HttpsError code (invalid-argument, failed-precondition, ...); reason: a stable machine-readable word
  constructor(code, reason, message) { super(message || reason); this.code = code; this.reason = reason; }
}

const fresh = () => ({v: SCHEMA, coins: 0, items: {}, rev: 0});

const econRef = (db, uid) => db.collection("economy").doc(uid);
const rowRef = (db, uid, key) => db.collection("ledger").doc(uid).collection("rows").doc(key);

function keyPart(v, what) {
  if (typeof v !== "string" || !KEY_PART.test(v)) throw new EconomyError("invalid-argument", "BAD_" + what.toUpperCase(), what + " must be 1-64 letters, digits, _ or -");
  return v;
}

// Apply a change to coins and items, refusing anything that would go negative, fractional or absurd.
function apply(econ, {coins = 0, items = {}} = {}) {
  if (!Number.isSafeInteger(coins)) throw new EconomyError("invalid-argument", "BAD_AMOUNT");
  const next = {...econ, items: {...econ.items}};
  next.coins = econ.coins + coins;
  if (next.coins < 0) throw new EconomyError("failed-precondition", "NOT_ENOUGH_COINS");
  if (next.coins > MAX_COINS) throw new EconomyError("failed-precondition", "TOO_MANY_COINS");
  for (const [id, n] of Object.entries(items)) {
    if (!KEY_PART.test(id) || !Number.isSafeInteger(n)) throw new EconomyError("invalid-argument", "BAD_ITEM");
    const have = next.items[id] || 0, left = have + n;
    if (left < 0) throw new EconomyError("failed-precondition", "NOT_ENOUGH_ITEMS");
    if (left === 0) delete next.items[id]; else next.items[id] = left;
  }
  return next;
}

// Run one action. ops[name] = {key(uid, req) -> string, run(ctx) -> {result, change?, writes?}}.
// run() may read through ctx.tx (all reads happen before any write) and returns the effects; act() writes them.
async function act(db, FieldValue, uid, name, req, ops) {
  if (typeof uid !== "string" || !uid) throw new EconomyError("unauthenticated", "SIGN_IN");
  const op = Object.prototype.hasOwnProperty.call(ops, name) ? ops[name] : null;
  if (!op) throw new EconomyError("invalid-argument", "UNKNOWN_OP");
  const key = op.key(uid, req || {});
  return db.runTransaction(async (tx) => {
    const row = await tx.get(rowRef(db, uid, key));
    if (row.exists) return {...row.data().result, key, replay: true};
    const snap = await tx.get(econRef(db, uid));
    const econ = snap.exists ? snap.data() : fresh();
    const out = await op.run({tx, db, uid, req: req || {}, econ, key, apply});
    const rev = (econ.rev || 0) + 1;
    const now = FieldValue.serverTimestamp();
    const next = out.change ? apply(econ, out.change) : econ;
    tx.set(econRef(db, uid), {v: SCHEMA, coins: next.coins, items: next.items, rev, createdAt: snap.exists ? econ.createdAt : now, updatedAt: now});
    for (const w of out.writes || []) tx.set(w.ref, w.data);
    tx.create(rowRef(db, uid, key), {op: name, key, result: out.result, rev, at: now});
    return {...out.result, key, replay: false};
  });
}

// ---------- the actions (7I-A: opening the account only; 7I-B adds plant/harvest, 7I-C the market) ----------
const OPS = {
  // Creates the canonical account at zero. Nothing is granted and the legacy save is not looked at.
  open: {
    key: (uid) => "open-" + uid,
    run: async ({econ}) => ({result: {coins: econ.coins, items: econ.items}}),
  },
};

module.exports = {act, apply, fresh, keyPart, econRef, rowRef, EconomyError, OPS, SCHEMA};
