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

// meta.harvests: verified harvests ever; meta.bootstrapUsed: the one free bootstrap wheat planting has been used
const fresh = () => ({v: SCHEMA, coins: 0, items: {}, rev: 0, meta: {harvests: 0, bootstrapUsed: false}});

const econRef = (db, uid) => db.collection("economy").doc(uid);
const rowRef = (db, uid, key) => db.collection("ledger").doc(uid).collection("rows").doc(key);
const plotRef = (db, uid, plotId) => db.collection("plots").doc(uid).collection("items").doc(plotId);

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

// Run one action. ops[name] = {key(uid, req) -> string, run(ctx) -> {result, change?, meta?, writes?, rows?}}.
// run() may read through ctx.tx (all reads happen before any write) and returns the effects; act() writes them:
//   change: coins/items delta (apply() refuses negatives), meta: fields merged into economy.meta,
//   writes: [{ref, data}] set, creates: [{ref, data}] create-once, deletes: [ref], all in the same transaction
//   (data may be a function of the server timestamp sentinel), rows: [{key, data}] extra create-once ledger rows.
// opts.now: the server clock (ms). Tests pass a fake clock; the callable uses Date.now(). The client never sets time.
async function act(db, FieldValue, uid, name, req, ops, opts = {}) {
  if (typeof uid !== "string" || !uid) throw new EconomyError("unauthenticated", "SIGN_IN");
  const op = Object.prototype.hasOwnProperty.call(ops, name) ? ops[name] : null;
  if (!op) throw new EconomyError("invalid-argument", "UNKNOWN_OP");
  const key = op.key(uid, req || {});
  const clock = opts.now || (() => Date.now());
  return db.runTransaction(async (tx) => {
    const row = await tx.get(rowRef(db, uid, key));
    if (row.exists) return {...row.data().result, key, replay: true};
    const snap = await tx.get(econRef(db, uid));
    const econ = snap.exists ? {...fresh(), ...snap.data(), meta: {...fresh().meta, ...(snap.data().meta || {})}} : fresh();
    const out = await op.run({tx, db, uid, req: req || {}, econ, key, apply, now: clock()});
    const rev = (econ.rev || 0) + 1;
    const stamp = FieldValue.serverTimestamp();
    const next = out.change ? apply(econ, out.change) : econ;
    const meta = {...econ.meta, ...(out.meta || {})};
    tx.set(econRef(db, uid), {v: SCHEMA, coins: next.coins, items: next.items, meta, rev, createdAt: snap.exists && econ.createdAt ? econ.createdAt : stamp, updatedAt: stamp});
    for (const w of out.writes || []) tx.set(w.ref, typeof w.data === "function" ? w.data(stamp) : w.data);
    for (const c of out.creates || []) tx.create(c.ref, typeof c.data === "function" ? c.data(stamp) : c.data);
    for (const d of out.deletes || []) tx.delete(d);
    for (const r of out.rows || []) tx.create(rowRef(db, uid, r.key), {...r.data, key: r.key, rev, at: stamp});
    tx.create(rowRef(db, uid, key), {op: name, key, result: out.result, rev, at: stamp});
    return {...out.result, key, replay: false};
  });
}

// ---------- the actions (7I-A: open; 7I-B: plant, harvest; 7I-C: the market) ----------
const {CROPS, YIELD, BOOTSTRAP_CROP, PLOTS} = require("./catalog");

function plotId(v) {
  if (!PLOTS.includes(v)) throw new EconomyError("invalid-argument", "BAD_PLOT");
  return v;
}
function cropId(v) {
  if (typeof v !== "string" || !Object.prototype.hasOwnProperty.call(CROPS, v)) throw new EconomyError("invalid-argument", "BAD_CROP");
  return v;
}
const bootstrapKey = (uid) => "bootstrap-plant-" + uid;

const OPS = {
  // Creates the canonical account at zero. Nothing is granted and the legacy save is not looked at.
  open: {
    key: (uid) => "open-" + uid,
    run: async ({econ}) => ({result: {coins: econ.coins, items: econ.items}}),
  },

  // Verified planting (online only: it is a server call). The plot must be empty. It is paid with 1 canonical crop of
  // that kind if the player has one, otherwise with the seed price in canonical coins. Exception: a brand-new canonical
  // account (never harvested, bootstrap never used) plants its first WHEAT free, exactly once ever. That is proven by
  // meta.bootstrapUsed AND by a create-once ledger marker, both written in the same transaction as the planting.
  // The key includes the client's request id: a retry returns the original result and does not add a generation.
  plant: {
    key: (uid, r) => "plant-" + uid + "-" + plotId(r.plotId) + "-" + keyPart(r.requestId, "requestId"),
    run: async ({tx, db, uid, req, econ, now}) => {
      const id = plotId(req.plotId), crop = cropId(req.crop), c = CROPS[crop];
      const plotSnap = await tx.get(plotRef(db, uid, id));
      const marker = await tx.get(rowRef(db, uid, bootstrapKey(uid)));
      const plot = plotSnap.exists ? plotSnap.data() : {generation: 0, state: "empty"};
      if (plot.state === "growing") throw new EconomyError("failed-precondition", "PLOT_NOT_EMPTY");
      const bootstrap = crop === BOOTSTRAP_CROP && !econ.meta.bootstrapUsed && !marker.exists && (econ.meta.harvests || 0) === 0;
      let paid, change = null;
      if (bootstrap) paid = {bootstrap: true};
      else if ((econ.items[crop] || 0) >= 1) { paid = {item: crop}; change = {items: {[crop]: -1}}; }
      else if (econ.coins >= c.seed) { paid = {coins: c.seed}; change = {coins: -c.seed}; }
      else throw new EconomyError("failed-precondition", "NOT_ENOUGH_TO_PLANT");
      const generation = (plot.generation || 0) + 1, plantedAt = now, matureAt = now + c.time * 1000;
      const result = {plotId: id, crop, generation, plantedAt, matureAt, paid};
      return {
        result, change,
        meta: bootstrap ? {bootstrapUsed: true, bootstrapAt: now} : {},
        rows: bootstrap ? [{key: bootstrapKey(uid), data: {op: "bootstrap", result: {plotId: id, crop, generation}}}] : [],
        writes: [{ref: plotRef(db, uid, id), data: {state: "growing", crop, generation, plantedAt, matureAt, harvestedAt: null}}],
      };
    },
  },

  // Verified harvest. Names the plot AND the generation it was planted as. Accepted only if that generation is the
  // one growing there, the crop matches and SERVER time has reached matureAt. A refusal (NOT_MATURE_YET, ...) writes
  // nothing, so the same harvest can be tried again later. Once accepted, the key harvest-{uid}-{plot}-{generation}
  // exists for ever: any replay (another device, an old queued request, a re-sent request) returns that first result.
  harvest: {
    key: (uid, r) => "harvest-" + uid + "-" + plotId(r.plotId) + "-" + generationOf(r.generation),
    run: async ({tx, db, uid, req, econ, now}) => {
      const id = plotId(req.plotId), generation = generationOf(req.generation);
      const snap = await tx.get(plotRef(db, uid, id));
      const plot = snap.exists ? snap.data() : null;
      if (!plot || plot.generation !== generation) throw new EconomyError("failed-precondition", "NO_SUCH_GENERATION");
      if (plot.state !== "growing") throw new EconomyError("failed-precondition", "ALREADY_HARVESTED");
      if (req.crop != null && req.crop !== plot.crop) throw new EconomyError("failed-precondition", "WRONG_CROP");
      if (now < plot.matureAt) throw new EconomyError("failed-precondition", "NOT_MATURE_YET");
      const result = {plotId: id, crop: plot.crop, generation, granted: {[plot.crop]: YIELD}};
      return {
        result,
        change: {items: {[plot.crop]: YIELD}},
        meta: {harvests: (econ.meta.harvests || 0) + 1},
        writes: [{ref: plotRef(db, uid, id), data: {...plot, state: "empty", crop: null, harvestedAt: now, lastCrop: plot.crop}}],
      };
    },
  },
};
// ---------- 7I-C: the trading post. Listings are created, bought and taken back ONLY here. ----------
// market/{listingId}: {v:2, seller, sellerName, item, qty, price, at, state:"open"}. The goods are held (escrowed) out of
// the seller's canonical items while listed. A buy is one transaction: buyer pays, seller is paid at once (there is no
// "collect" any more), buyer gets the goods, the listing is deleted, and both accounts get a ledger row.
const MAX_LISTINGS = 4, MAX_QTY = 10;
const marketRef = (db, id) => db.collection("market").doc(id);
const priceRange = (item, qty) => {
  const p = CROPS[item].price; // same bounds as game.js marketPrice(): half to double the base price, per unit
  return {min: Math.max(1, Math.floor(p * .5)) * qty, max: Math.ceil(p * 2) * qty};
};
const listingId = (v) => {
  if (typeof v !== "string" || !/^[A-Za-z0-9_-]{1,140}$/.test(v)) throw new EconomyError("invalid-argument", "BAD_LISTING");
  return v;
};
async function nameOf(tx, db, uid) {
  const p = await tx.get(db.collection("players").doc(uid));
  const n = p.exists ? p.data().name : null;
  return typeof n === "string" && n.length >= 1 && n.length <= 16 ? n : "Farmer";
}

Object.assign(OPS, {
  marketList: {
    key: (uid, r) => "list-" + uid + "-" + keyPart(r.requestId, "requestId"),
    run: async ({tx, db, uid, req, econ, now, key}) => {
      const item = cropId(req.item), qty = req.qty, price = req.price;
      if (!Number.isSafeInteger(qty) || qty < 1 || qty > MAX_QTY) throw new EconomyError("invalid-argument", "BAD_QTY");
      const range = priceRange(item, qty);
      if (!Number.isSafeInteger(price) || price < range.min || price > range.max) throw new EconomyError("invalid-argument", "BAD_PRICE");
      const open = await tx.get(db.collection("market").where("seller", "==", uid).where("state", "==", "open"));
      if (open.size >= MAX_LISTINGS) throw new EconomyError("failed-precondition", "TOO_MANY_LISTINGS");
      if ((econ.items[item] || 0) < qty) throw new EconomyError("failed-precondition", "NOT_ENOUGH_ITEMS");
      const sellerName = await nameOf(tx, db, uid);
      const id = uid + "-" + req.requestId;
      const listing = {v: 2, seller: uid, sellerName, item, qty, price, at: now, state: "open"};
      return {result: {listingId: id, item, qty, price}, change: {items: {[item]: -qty}}, creates: [{ref: marketRef(db, id), data: listing}]};
    },
  },

  marketBuy: {
    key: (uid, r) => "buy-" + uid + "-" + listingId(r.listingId),
    run: async ({tx, db, uid, req, econ, now}) => {
      const id = listingId(req.listingId);
      const snap = await tx.get(marketRef(db, id));
      if (!snap.exists) throw new EconomyError("failed-precondition", "GONE");
      const L = snap.data();
      if (L.v !== 2 || L.state !== "open") throw new EconomyError("failed-precondition", L.v !== 2 ? "LEGACY_LISTING" : "GONE");
      if (L.seller === uid) throw new EconomyError("failed-precondition", "SELF_BUY");
      if (econ.coins < L.price) throw new EconomyError("failed-precondition", "NOT_ENOUGH_COINS");
      const sellerSnap = await tx.get(econRef(db, L.seller));
      if (!sellerSnap.exists) throw new EconomyError("failed-precondition", "GONE"); // a listing always has an escrowing seller
      const buyerName = await nameOf(tx, db, uid);
      const seller = sellerSnap.data(), sellerNext = apply({...fresh(), ...seller}, {coins: L.price});
      const sale = {listingId: id, item: L.item, qty: L.qty, price: L.price};
      return {
        result: {...sale, seller: L.seller},
        change: {coins: -L.price, items: {[L.item]: L.qty}},
        writes: [{ref: econRef(db, L.seller), data: (stamp) => ({...seller, coins: sellerNext.coins, rev: (seller.rev || 0) + 1, updatedAt: stamp})}],
        creates: [{ref: rowRef(db, L.seller, "sale-" + id), data: (stamp) => ({op: "sale", key: "sale-" + id, result: {...sale, buyer: uid, buyerName, soldAt: now}, rev: (seller.rev || 0) + 1, at: stamp})}],
        deletes: [marketRef(db, id)],
      };
    },
  },

  marketCancel: {
    key: (uid, r) => "cancel-" + uid + "-" + listingId(r.listingId),
    run: async ({tx, db, uid, req}) => {
      const id = listingId(req.listingId);
      const snap = await tx.get(marketRef(db, id));
      if (!snap.exists) throw new EconomyError("failed-precondition", "GONE"); // usually: it was just bought
      const L = snap.data();
      if (L.seller !== uid) throw new EconomyError("permission-denied", "NOT_YOURS");
      if (L.v !== 2 || L.state !== "open") throw new EconomyError("failed-precondition", L.v !== 2 ? "LEGACY_LISTING" : "GONE");
      return {result: {listingId: id, item: L.item, qty: L.qty}, change: {items: {[L.item]: L.qty}}, deletes: [marketRef(db, id)]};
    },
  },
});

function generationOf(v) {
  if (!Number.isSafeInteger(v) || v < 1) throw new EconomyError("invalid-argument", "BAD_GENERATION");
  return v;
}

module.exports = {act, apply, fresh, keyPart, econRef, rowRef, plotRef, bootstrapKey, EconomyError, OPS, SCHEMA};
