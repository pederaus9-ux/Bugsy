// Phase 7I-A: the canonical economy, ledger, idempotency and the zero cutover.
// Runs under: firebase emulators:exec --only firestore,auth,functions (see package.json "test:economy").
// Run it on its own (package.json runs it after rules.test.mjs, never alongside): rules.test.mjs wipes the whole
// emulator database before every test, which would delete this file's data mid-test if both ran at the same time.
// Two layers: the economy core (functions/economy.js) driven directly with admin access against the Firestore
// emulator, and the real deployed-to-emulator callable economyAct over HTTP with Auth-emulator ID tokens.
import {test} from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const E = require("./economy.js");

const PROJECT = "demo-sunny-acres";
const FS = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const FN = "http://127.0.0.1:5001/" + PROJECT + "/us-central1/economyAct";
process.env.FIRESTORE_EMULATOR_HOST = FS;
initializeApp({projectId: PROJECT});
const db = getFirestore("default"); // the game's database is named "default" (same as functions/index.js and auth.js)
const RUN = Date.now().toString(36);

async function signUp(name) {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: `${name}-${RUN}@example.com`, password: "hunter22", returnSecureToken: true})});
  const j = await r.json(); if (!j.idToken) throw new Error("sign-up failed: " + JSON.stringify(j));
  return {uid: j.localId, token: j.idToken};
}
async function call(token, data) {
  const r = await fetch(FN, {method: "POST", headers: {"Content-Type": "application/json", ...(token ? {Authorization: "Bearer " + token} : {})}, body: JSON.stringify({data})});
  const j = await r.json(); return {status: r.status, ...j};
}
const econ = async (uid) => { const s = await db.doc("economy/" + uid).get(); return s.exists ? s.data() : null; };
const rows = async (uid) => (await db.collection("ledger").doc(uid).collection("rows").get()).docs.map(d => d.data());

// test-only actions for the core (never exported by the callable)
const TEST_OPS = {
  grant5: {key: (uid, r) => "grant5-" + uid + "-" + E.keyPart(r.requestId, "requestId"), run: async () => ({result: {ok: 1}, change: {coins: 5}})},
  notYet: {key: (uid, r) => "notyet-" + uid + "-" + E.keyPart(r.requestId, "requestId"),
    run: async ({tx, db, uid}) => { const g = await tx.get(db.doc("gate/" + uid)); if (!g.exists) throw new E.EconomyError("failed-precondition", "NOT_MATURE_YET"); return {result: {ok: 1}, change: {items: {wheat: 2}}}; }},
  spend: {key: (uid, r) => "spend-" + uid + "-" + E.keyPart(r.requestId, "requestId"), run: async ({req}) => ({result: {ok: 1}, change: {coins: -req.n}})},
};
const core = (uid, op, req) => E.act(db, FieldValue, uid, op, req, TEST_OPS);

test("core: an accepted action writes its effect and its ledger row together; a replay returns the stored result and changes nothing", async () => {
  const uid = "core-a-" + RUN;
  const first = await core(uid, "grant5", {requestId: "r1"});
  assert.equal(first.replay, false); assert.equal(first.key, "grant5-" + uid + "-r1");
  const again = await core(uid, "grant5", {requestId: "r1"});
  assert.equal(again.replay, true); assert.deepEqual({...again, replay: false}, first);
  const e = await econ(uid); assert.equal(e.coins, 5); assert.equal(e.rev, 1);
  assert.equal((await rows(uid)).length, 1);
  await core(uid, "grant5", {requestId: "r2"}); // a different key is a different action
  assert.equal((await econ(uid)).coins, 10); assert.equal((await rows(uid)).length, 2);
});

test("core: a refused action (NOT_MATURE_YET) writes nothing and does NOT use up its key; the same key succeeds later", async () => {
  const uid = "core-b-" + RUN;
  await assert.rejects(core(uid, "notYet", {requestId: "h1"}), (e) => e.reason === "NOT_MATURE_YET");
  assert.equal(await econ(uid), null, "no economy document written by a refusal");
  assert.equal((await rows(uid)).length, 0, "no ledger row written by a refusal");
  await db.doc("gate/" + uid).set({open: true});
  const ok = await core(uid, "notYet", {requestId: "h1"});
  assert.equal(ok.replay, false);
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
  const replay = await core(uid, "notYet", {requestId: "h1"});
  assert.equal(replay.replay, true); assert.deepEqual((await econ(uid)).items, {wheat: 2}, "granted once");
});

test("core: ten simultaneous calls with one key apply exactly once", async () => {
  const uid = "core-c-" + RUN;
  const out = await Promise.all(Array.from({length: 10}, () => core(uid, "grant5", {requestId: "same"})));
  assert.equal(out.filter(o => o.replay === false).length, 1);
  assert.equal((await econ(uid)).coins, 5);
  assert.equal((await rows(uid)).length, 1);
});

test("core: balances never go negative, fractional or unknown; a refused spend changes nothing", async () => {
  const uid = "core-d-" + RUN;
  await core(uid, "grant5", {requestId: "g"});
  await assert.rejects(core(uid, "spend", {requestId: "s1", n: 6}), (e) => e.reason === "NOT_ENOUGH_COINS");
  await assert.rejects(core(uid, "spend", {requestId: "s2", n: 0.5}), (e) => e.reason === "BAD_AMOUNT");
  assert.equal((await econ(uid)).coins, 5); assert.equal((await rows(uid)).length, 1);
  await core(uid, "spend", {requestId: "s3", n: 5});
  assert.equal((await econ(uid)).coins, 0);
  assert.throws(() => E.apply(E.fresh(), {items: {wheat: -1}}), (e) => e.reason === "NOT_ENOUGH_ITEMS");
  assert.throws(() => E.apply(E.fresh(), {items: {"bad id!": 1}}), (e) => e.reason === "BAD_ITEM");
  assert.deepEqual(E.apply({...E.fresh(), items: {wheat: 2}}, {items: {wheat: -2}}).items, {}, "a count that reaches 0 is removed");
  await assert.rejects(core(uid, "grant5", {requestId: "has space"}), (e) => e.reason === "BAD_REQUESTID");
  await assert.rejects(core(uid, "toString", {}), (e) => e.reason === "UNKNOWN_OP");
  await assert.rejects(core("", "grant5", {requestId: "x"}), (e) => e.reason === "SIGN_IN");
});

test("callable economyAct: signed out is refused; unknown and test-only actions are refused", async () => {
  const anon = await call(null, {op: "open"});
  assert.equal(anon.status, 401); assert.equal(anon.error.status, "UNAUTHENTICATED");
  const {token} = await signUp("caller");
  for (const op of ["grant5", "spend", "notYet", "constructor", "__proto__", ""]) {
    const r = await call(token, {op, requestId: "x1"});
    assert.equal(r.status, 400, op); assert.equal(r.error.status, "INVALID_ARGUMENT", op);
  }
});

test("cutover is zero: a hacked legacy save (1e9 coins, 999999 wheat) is not copied; nothing is granted; no starter document", async () => {
  const {uid, token} = await signUp("hacked");
  const save = JSON.stringify({v: 1, coins: 1e9, gems: 99999, level: 99, barn: {wheat: 999999, corn: 999999}});
  await db.doc("farms/" + uid).set({save, level: 99, coins: 1e9, rev: 1, updatedAt: Date.now()});
  const before = (await db.listCollections()).map(c => c.id).sort();
  const r = await call(token, {op: "open", uid: "someone-else", coins: 1e9, items: {wheat: 999999}});
  assert.equal(r.status, 200, JSON.stringify(r)); assert.deepEqual(r.result.coins, 0); assert.deepEqual(r.result.items, {});
  const e = await econ(uid);
  assert.equal(e.coins, 0); assert.deepEqual(e.items, {}); assert.equal(e.v, 1); assert.equal(e.rev, 1);
  assert.equal(await econ("someone-else"), null, "the body cannot pick another account");
  assert.deepEqual((await rows(uid)).map(x => x.key), ["open-" + uid]);
  const after = (await db.listCollections()).map(c => c.id).sort();
  assert.deepEqual(after.filter(c => !before.includes(c)).filter(c => !["economy", "ledger"].includes(c)), [], "no other collection (no starter document) appears");
  const legacy = (await db.doc("farms/" + uid).get()).data();
  assert.equal(legacy.coins, 1e9, "the legacy save is left exactly as it was (still legacy, still unverified)");
  const again = await call(token, {op: "open"});
  assert.equal(again.result.replay, true); assert.equal((await econ(uid)).rev, 1, "opening twice changes nothing");
});

// ======================= Phase 7I-B: verified plots, bootstrap, server time, generations =======================
// The core runs with a fake SERVER clock (t) so maturity can be tested without waiting; one test below uses the real
// callable and real time. Nothing the client sends (a time, a matureAt, a flag) can change server time.
let t = 1_800_000_000_000;
const real = (uid, op, req) => E.act(db, FieldValue, uid, op, req, E.OPS, {now: () => t});
const plot = async (uid, id) => { const s = await db.doc(`plots/${uid}/items/${id}`).get(); return s.exists ? s.data() : null; };
const refused = (reason) => (e) => { assert.equal(e.reason, reason); return true; };
const WHEAT_MS = 20_000;

test("catalog: the server's crop rules match game.js exactly (grow time, seed price, sale price)", async () => {
  const {readFileSync} = await import("node:fs");
  const game = readFileSync(new URL("../../game.js", import.meta.url), "utf8");
  const {CROPS} = require("./catalog.js");
  const crops = Function("return " + game.match(/export const CROPS = (\{[\s\S]*?\n\});/)[1])();
  for (const [id, c] of Object.entries(CROPS)) {
    assert.ok(crops[id], id + " is a game crop");
    assert.equal(c.time, crops[id].time, id + " time"); assert.equal(c.seed, crops[id].seed, id + " seed");
    const p = game.match(new RegExp("\\b" + id + ":\\{n:\"[^\"]+\",e:\"[^\"]+\",p:(\\d+)"));
    assert.equal(c.price, +p[1], id + " sale price");
  }
  assert.deepEqual(Object.keys(CROPS).sort(), Object.keys(crops).sort(), "every game crop is known to the server");
  assert.match(game, /add\(crop, 2\)/, "the game's harvest yield is still 2 (the server's YIELD)");
});

test("bootstrap: a new canonical account plants ONE wheat free; it costs 0; a retry returns the original; a second is refused", async () => {
  const uid = "boot-a-" + RUN;
  const r = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "first"});
  assert.deepEqual(r.paid, {bootstrap: true}); assert.equal(r.generation, 1); assert.equal(r.plantedAt, t); assert.equal(r.matureAt, t + WHEAT_MS);
  let e = await econ(uid); assert.equal(e.coins, 0); assert.deepEqual(e.items, {}); assert.equal(e.meta.bootstrapUsed, true);
  assert.ok((await db.doc(`ledger/${uid}/rows/bootstrap-plant-${uid}`).get()).exists, "permanent bootstrap marker in the ledger");
  const again = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "first"});
  assert.equal(again.replay, true); assert.equal(again.generation, 1, "retry does not add a generation");
  assert.equal((await plot(uid, "p0")).generation, 1);
  await assert.rejects(real(uid, "plant", {plotId: "p1", crop: "wheat", requestId: "second"}), refused("NOT_ENOUGH_TO_PLANT"));
  e = await econ(uid); assert.equal(e.coins, 0); assert.deepEqual(e.items, {});
  assert.equal(await plot(uid, "p1"), null, "the refused planting left no plot");
});

test("bootstrap: only wheat; a refused attempt (other crop, busy plot) does not use it up", async () => {
  const uid = "boot-b-" + RUN;
  for (const crop of ["corn", "pumpkin", "carrot"]) await assert.rejects(real(uid, "plant", {plotId: "p0", crop, requestId: "c-" + crop}), refused("NOT_ENOUGH_TO_PLANT"));
  await db.doc(`plots/${uid}/items/p1`).set({state: "growing", crop: "wheat", generation: 4, plantedAt: t, matureAt: t + 1});
  await assert.rejects(real(uid, "plant", {plotId: "p1", crop: "wheat", requestId: "busy"}), refused("PLOT_NOT_EMPTY"));
  assert.equal((await econ(uid)), null, "no refusal wrote anything");
  const ok = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "w"});
  assert.deepEqual(ok.paid, {bootstrap: true}, "the entitlement survived every refusal");
});

test("bootstrap: two devices at the same moment (different requests, different plots): exactly one free planting", async () => {
  const uid = "boot-c-" + RUN;
  const out = await Promise.allSettled([
    real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "phone"}),
    real(uid, "plant", {plotId: "p1", crop: "wheat", requestId: "tablet"}),
    real(uid, "plant", {plotId: "p2", crop: "wheat", requestId: "laptop"}),
  ]);
  const won = out.filter(o => o.status === "fulfilled");
  assert.equal(won.length, 1, JSON.stringify(out.map(o => o.status === "fulfilled" ? "ok" : o.reason.reason)));
  for (const o of out.filter(o => o.status === "rejected")) assert.equal(o.reason.reason, "NOT_ENOUGH_TO_PLANT");
  const plots = await Promise.all(["p0", "p1", "p2"].map(id => plot(uid, id)));
  assert.equal(plots.filter(Boolean).length, 1, "exactly one plot is growing");
});

test("economy bootstraps itself: free wheat -> harvest 2 -> replant with 1 wheat -> harvest -> 3 wheat, 0 coins, no more free plants", async () => {
  const uid = "boot-d-" + RUN;
  const p1 = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "a"});
  t += WHEAT_MS;
  const h1 = await real(uid, "harvest", {plotId: "p0", generation: p1.generation});
  assert.deepEqual(h1.granted, {wheat: 2}); assert.deepEqual((await econ(uid)).items, {wheat: 2});
  const p2 = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "b"});
  assert.deepEqual(p2.paid, {item: "wheat"}, "later wheat uses the normal cost: one canonical wheat");
  assert.equal(p2.generation, 2);
  assert.deepEqual((await econ(uid)).items, {wheat: 1});
  t += WHEAT_MS;
  await real(uid, "harvest", {plotId: "p0", generation: 2, crop: "wheat"});
  const e = await econ(uid); assert.deepEqual(e.items, {wheat: 3}); assert.equal(e.coins, 0); assert.equal(e.meta.harvests, 2);
  // with no wheat and no coins, a planting is refused (nothing free after the bootstrap)
  await db.doc(`economy/${uid}`).update({items: {}});
  await assert.rejects(real(uid, "plant", {plotId: "p1", crop: "wheat", requestId: "c"}), refused("NOT_ENOUGH_TO_PLANT"));
  // with coins, the seed price is charged
  await db.doc(`economy/${uid}`).update({coins: 3});
  const p3 = await real(uid, "plant", {plotId: "p1", crop: "corn", requestId: "d"});
  assert.deepEqual(p3.paid, {coins: 2}); assert.equal((await econ(uid)).coins, 1);
});

test("harvest: server time only; early, wrong crop, wrong or unknown generation are refused and use nothing up", async () => {
  const uid = "harv-a-" + RUN;
  const p = await real(uid, "plant", {plotId: "p3", crop: "wheat", requestId: "a"});
  t += WHEAT_MS - 1;
  await assert.rejects(real(uid, "harvest", {plotId: "p3", generation: 1, now: t + 1e9, matureAt: 0, clientTime: 9e15}), refused("NOT_MATURE_YET"));
  await assert.rejects(real(uid, "harvest", {plotId: "p3", generation: 1, crop: "pumpkin"}), refused("WRONG_CROP"));
  await assert.rejects(real(uid, "harvest", {plotId: "p3", generation: 2}), refused("NO_SUCH_GENERATION"));
  await assert.rejects(real(uid, "harvest", {plotId: "p4", generation: 1}), refused("NO_SUCH_GENERATION"));
  await assert.rejects(real(uid, "harvest", {plotId: "p9", generation: 1}), refused("BAD_PLOT"));
  await assert.rejects(real(uid, "harvest", {plotId: "p3", generation: 0}), refused("BAD_GENERATION"));
  await assert.rejects(real(uid, "harvest", {plotId: "p3", generation: "1"}), refused("BAD_GENERATION"));
  assert.equal((await db.doc(`ledger/${uid}/rows/harvest-${uid}-p3-1`).get()).exists, false, "NOT_MATURE_YET did not use up the harvest key");
  t += 1;
  const h = await real(uid, "harvest", {plotId: "p3", generation: p.generation});
  assert.equal(h.replay, false); assert.deepEqual((await econ(uid)).items, {wheat: 2});
});

test("harvest: replays and an old generation never grant twice; two devices harvesting one generation get one grant", async () => {
  const uid = "harv-b-" + RUN;
  await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "g1"});
  t += WHEAT_MS;
  const out = await Promise.all([1, 2, 3, 4].map(() => real(uid, "harvest", {plotId: "p0", generation: 1})));
  assert.equal(out.filter(o => !o.replay).length, 1, "one accepted, the others are replays");
  for (const o of out) assert.deepEqual(o.granted, {wheat: 2}, "every device learns the same, single result");
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
  const g2 = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "g2"});
  assert.equal(g2.generation, 2);
  const old = await real(uid, "harvest", {plotId: "p0", generation: 1});
  assert.equal(old.replay, true, "an old queued harvest of generation 1 replays the stored result");
  assert.deepEqual((await econ(uid)).items, {wheat: 1}, "and grants nothing (2 harvested - 1 replanted)");
  await assert.rejects(real(uid, "harvest", {plotId: "p0", generation: 2}), refused("NOT_MATURE_YET"));
  assert.equal((await rows(uid)).filter(r => r.op === "harvest").length, 1);
});

test("callable, real time: plant online, wait offline past maturity (nothing sent), harvest later: granted once", async () => {
  const {uid, token} = await signUp("realtime");
  const p = await call(token, {op: "plant", plotId: "p0", crop: "wheat", requestId: "rt1", plantedAt: 0, matureAt: 0});
  assert.equal(p.status, 200, JSON.stringify(p));
  assert.deepEqual(p.result.paid, {bootstrap: true});
  assert.ok(Math.abs(p.result.plantedAt - Date.now()) < 10_000, "plantedAt is server receipt time, not the client's");
  assert.equal(p.result.matureAt - p.result.plantedAt, WHEAT_MS, "base grow time; the client's matureAt is ignored");
  const early = await call(token, {op: "harvest", plotId: "p0", generation: p.result.generation});
  assert.equal(early.status, 400); assert.equal(early.error.details.reason, "NOT_MATURE_YET");
  await new Promise(r => setTimeout(r, Math.max(0, p.result.matureAt - Date.now()) + 1500)); // the device is "offline": no calls at all
  const h = await call(token, {op: "harvest", plotId: "p0", generation: p.result.generation});
  assert.equal(h.status, 200, JSON.stringify(h)); assert.deepEqual(h.result.granted, {wheat: 2});
  const dup = await call(token, {op: "harvest", plotId: "p0", generation: p.result.generation});
  assert.equal(dup.result.replay, true);
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
});

test("callable: sign out and back in, a new device, or an edited legacy save cannot bring the bootstrap back", async () => {
  const {uid, token} = await signUp("reinstall");
  const first = await call(token, {op: "plant", plotId: "p0", crop: "wheat", requestId: "dev1"});
  assert.deepEqual(first.result.paid, {bootstrap: true});
  // the "reinstalled" client: a fresh sign-in (new ID token), no local state at all, and a legacy save claiming a fresh farm
  await new Promise(r => setTimeout(r, 1100)); // the Auth emulator issues an identical token within the same second
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, {method: "POST",
    headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: `reinstall-${RUN}@example.com`, password: "hunter22", returnSecureToken: true})});
  const token2 = (await r.json()).idToken; assert.ok(token2 && token2 !== token);
  await db.doc("farms/" + uid).set({save: JSON.stringify({v: 1, coins: 0, barn: {}, bootstrapUsed: false, harvests: 0}), level: 1, coins: 0, rev: 1, updatedAt: Date.now()});
  const again = await call(token2, {op: "plant", plotId: "p1", crop: "wheat", requestId: "dev2", bootstrap: true, bootstrapUsed: false});
  assert.equal(again.status, 400); assert.equal(again.error.details.reason, "NOT_ENOUGH_TO_PLANT");
  const e = await econ(uid); assert.equal(e.meta.bootstrapUsed, true); assert.equal(e.coins, 0); assert.deepEqual(e.items, {});
});

// ======================= Phase 7I-C: function-created listings, escrow, atomic buy, no collect =======================
// Canonical goods only come from verified harvests; here two accounts are given canonical wheat/coins directly
// (admin access, as a finished 7I-B harvest/sale would leave them) so the market can be exercised on its own.
const give = (uid, coins, items) => db.doc("economy/" + uid).set({v: 1, coins, items, rev: 1, meta: {harvests: 1, bootstrapUsed: true}});
const listingDoc = async (id) => { const s = await db.doc("market/" + id).get(); return s.exists ? s.data() : null; };
const ledgerKeys = async (uid) => (await rows(uid)).map(r => r.key).sort();

test("market: the server creates the listing and holds the goods; refusals change nothing", async () => {
  const s = "sell-a-" + RUN;
  await give(s, 0, {wheat: 5}); await db.doc("players/" + s).set({name: "Grandma", nameLower: "grandma"});
  const L = await real(s, "marketList", {item: "wheat", qty: 3, price: 6, requestId: "l1"});
  assert.equal(L.listingId, s + "-l1");
  assert.deepEqual((await econ(s)).items, {wheat: 2}, "3 wheat held out of the seller's canonical items");
  const doc1 = await listingDoc(L.listingId);
  assert.deepEqual({...doc1}, {v: 2, seller: s, sellerName: "Grandma", item: "wheat", qty: 3, price: 6, at: t, state: "open"});
  for (const [req, reason] of [
    [{item: "wheat", qty: 3, price: 6}, "NOT_ENOUGH_ITEMS"],            // only 2 left
    [{item: "wheat", qty: 0, price: 1}, "BAD_QTY"], [{item: "wheat", qty: 11, price: 22}, "BAD_QTY"], [{item: "wheat", qty: 1.5, price: 3}, "BAD_QTY"],
    [{item: "wheat", qty: 1, price: 0}, "BAD_PRICE"], [{item: "wheat", qty: 1, price: 5}, "BAD_PRICE"], // wheat: 1..4 each
    [{item: "wheat", qty: 1, price: "2"}, "BAD_PRICE"], [{item: "cake", qty: 1, price: 2}, "BAD_CROP"], [{item: "__proto__", qty: 1, price: 2}, "BAD_CROP"],
  ]) await assert.rejects(real(s, "marketList", {...req, requestId: "bad-" + reason + Math.random().toString(36).slice(2, 6)}), refused(reason));
  assert.deepEqual((await econ(s)).items, {wheat: 2}); assert.equal((await rows(s)).filter(r => r.op === "marketList").length, 1);
  // at most 4 open listings
  await give(s, 0, {wheat: 10});
  for (const n of [2, 3, 4]) await real(s, "marketList", {item: "wheat", qty: 1, price: 2, requestId: "l" + n});
  await assert.rejects(real(s, "marketList", {item: "wheat", qty: 1, price: 2, requestId: "l5"}), refused("TOO_MANY_LISTINGS"));
});

test("market: buying is one atomic step: buyer pays, seller is paid at once (no collect), goods move, listing is gone", async () => {
  const s = "sell-b-" + RUN, b = "buy-b-" + RUN;
  await give(s, 1, {wheat: 3}); await give(b, 10, {});
  const L = await real(s, "marketList", {item: "wheat", qty: 3, price: 6, requestId: "x"});
  const r = await real(b, "marketBuy", {listingId: L.listingId, price: 1, qty: 10, item: "pumpkin"}); // only the stored listing counts
  assert.deepEqual({item: r.item, qty: r.qty, price: r.price, seller: r.seller}, {item: "wheat", qty: 3, price: 6, seller: s});
  const eb = await econ(b), es = await econ(s);
  assert.equal(eb.coins, 4); assert.deepEqual(eb.items, {wheat: 3});
  assert.equal(es.coins, 7, "the seller has the coins straight away"); assert.deepEqual(es.items, {});
  assert.equal(await listingDoc(L.listingId), null);
  assert.ok((await ledgerKeys(b)).includes("buy-" + b + "-" + L.listingId));
  assert.ok((await ledgerKeys(s)).includes("sale-" + L.listingId), "the seller's ledger records the sale");
  const again = await real(b, "marketBuy", {listingId: L.listingId});
  assert.equal(again.replay, true); assert.equal((await econ(b)).coins, 4, "a replayed buy charges nothing");
});

test("market: self-buy, not enough canonical coins, legacy wealth and legacy listings are refused without side effects", async () => {
  const s = "sell-c-" + RUN, b = "buy-c-" + RUN;
  await give(s, 0, {wheat: 4}); await give(b, 2, {});
  const L = await real(s, "marketList", {item: "wheat", qty: 2, price: 8, requestId: "y"});
  await assert.rejects(real(s, "marketBuy", {listingId: L.listingId}), refused("SELF_BUY"));
  // the buyer's legacy save is rich; the canonical balance (2) is what counts
  await db.doc("farms/" + b).set({save: JSON.stringify({v: 1, coins: 1e9, barn: {wheat: 999999}}), level: 50, coins: 1e9, rev: 1, updatedAt: Date.now()});
  await assert.rejects(real(b, "marketBuy", {listingId: L.listingId}), refused("NOT_ENOUGH_COINS"));
  await assert.rejects(real(b, "marketList", {item: "wheat", qty: 1, price: 2, requestId: "z"}), refused("NOT_ENOUGH_ITEMS"));
  assert.equal((await econ(b)).coins, 2); assert.deepEqual((await econ(s)).items, {wheat: 2});
  assert.equal((await listingDoc(L.listingId)).state, "open");
  // a 7G listing (client-written against legacy coins) can't be bought or taken back canonically
  await db.doc("market/" + s + "-" + NOW_LEGACY).set({seller: s, sellerName: "G", item: "wheat", qty: 3, price: 6, at: 1, buyer: null, buyerName: null, soldAt: null});
  await give(b, 100, {});
  await assert.rejects(real(b, "marketBuy", {listingId: s + "-" + NOW_LEGACY}), refused("LEGACY_LISTING"));
  await assert.rejects(real(s, "marketCancel", {listingId: s + "-" + NOW_LEGACY}), refused("LEGACY_LISTING"));
  assert.equal((await econ(b)).coins, 100); assert.equal((await econ(s)).coins, 0);
});
const NOW_LEGACY = 1790000000000;

test("market: two buyers at the same moment: exactly one gets it; the seller is paid once", async () => {
  const s = "sell-d-" + RUN, b1 = "buy-d1-" + RUN, b2 = "buy-d2-" + RUN, b3 = "buy-d3-" + RUN;
  await give(s, 0, {corn: 2}); for (const b of [b1, b2, b3]) await give(b, 50, {});
  const L = await real(s, "marketList", {item: "corn", qty: 2, price: 10, requestId: "c"});
  const out = await Promise.allSettled([b1, b2, b3].map(b => real(b, "marketBuy", {listingId: L.listingId})));
  assert.equal(out.filter(o => o.status === "fulfilled").length, 1);
  for (const o of out.filter(o => o.status === "rejected")) assert.equal(o.reason.reason, "GONE");
  const coinsAfter = await Promise.all([b1, b2, b3].map(async b => (await econ(b)).coins));
  assert.deepEqual(coinsAfter.sort((x, y) => x - y), [40, 50, 50]);
  assert.equal((await econ(s)).coins, 10, "paid exactly once");
  const corn = await Promise.all([b1, b2, b3].map(async b => (await econ(b)).items.corn || 0));
  assert.equal(corn.reduce((a, c) => a + c, 0), 2, "the goods exist exactly once");
});

test("market: the seller takes back an unsold listing (goods return); nobody else can; a sold one is gone", async () => {
  const s = "sell-e-" + RUN, b = "buy-e-" + RUN;
  await give(s, 0, {carrot: 3}); await give(b, 50, {});
  const L1 = await real(s, "marketList", {item: "carrot", qty: 2, price: 12, requestId: "k1"});
  await assert.rejects(real(b, "marketCancel", {listingId: L1.listingId}), refused("NOT_YOURS"));
  const back = await real(s, "marketCancel", {listingId: L1.listingId});
  assert.deepEqual({item: back.item, qty: back.qty}, {item: "carrot", qty: 2});
  assert.deepEqual((await econ(s)).items, {carrot: 3}); assert.equal(await listingDoc(L1.listingId), null);
  const L2 = await real(s, "marketList", {item: "carrot", qty: 1, price: 6, requestId: "k2"});
  await real(b, "marketBuy", {listingId: L2.listingId});
  await assert.rejects(real(s, "marketCancel", {listingId: L2.listingId}), refused("GONE"), "too late: it sold");
  assert.deepEqual((await econ(s)).items, {carrot: 2}); assert.equal((await econ(s)).coins, 6);
  await assert.rejects(real(b, "marketBuy", {listingId: "nope-1"}), refused("GONE"));
  await assert.rejects(real(b, "marketBuy", {listingId: "bad id!"}), refused("BAD_LISTING"));
});

test("market end to end through the callable: one player lists canonical wheat, another buys it, self-buy refused", async () => {
  const sell = await signUp("e2e-seller"), buyer = await signUp("e2e-buyer");
  await give(sell.uid, 0, {wheat: 2}); await give(buyer.uid, 9, {});
  const L = await call(sell.token, {op: "marketList", item: "wheat", qty: 2, price: 4, requestId: "e2e"});
  assert.equal(L.status, 200, JSON.stringify(L));
  const B = await call(buyer.token, {op: "marketBuy", listingId: L.result.listingId});
  assert.equal(B.status, 200, JSON.stringify(B));
  assert.equal((await econ(sell.uid)).coins, 4); assert.equal((await econ(buyer.uid)).coins, 5); assert.deepEqual((await econ(buyer.uid)).items, {wheat: 2});
  const self = await call(sell.token, {op: "marketBuy", listingId: L.result.listingId});
  assert.equal(self.status, 400);
});

test("the server writes to the game's database (named \"default\"), not to the admin SDK's unnamed \"(default)\" one", async () => {
  // regression: the browser flow test caught the function using a different database from the one the game reads
  const {uid, token} = await signUp("which-db");
  const r = await call(token, {op: "open"});
  assert.equal(r.status, 200, JSON.stringify(r));
  assert.ok((await db.doc("economy/" + uid).get()).exists, "visible in \"default\", where auth.js and friends.js read");
  assert.equal((await getFirestore().doc("economy/" + uid).get()).exists, false, "nothing in the unnamed \"(default)\" database");
});

// ======================= Phase 7I-D: canonical sale, legacy close-out =======================
test("sell: verified crops sell at the base price for verified coins; legacy goods can't be sold; replays pay once", async () => {
  const uid = "sale-a-" + RUN;
  await give(uid, 0, {wheat: 2});
  await db.doc("farms/" + uid).set({save: JSON.stringify({v: 1, coins: 5, barn: {wheat: 999999}, perks: {sell: 9}}), level: 9, coins: 5, rev: 1, updatedAt: Date.now()});
  const r = await real(uid, "sell", {item: "wheat", qty: 2, requestId: "s1"});
  assert.deepEqual({item: r.item, qty: r.qty, coins: r.coins}, {item: "wheat", qty: 2, coins: 4}, "base price 2 each; phone-farm perks don't count");
  assert.equal((await econ(uid)).coins, 4); assert.deepEqual((await econ(uid)).items, {});
  assert.equal((await real(uid, "sell", {item: "wheat", qty: 2, requestId: "s1"})).replay, true);
  assert.equal((await econ(uid)).coins, 4, "a replayed sale pays once");
  await assert.rejects(real(uid, "sell", {item: "wheat", qty: 1, requestId: "s2"}), refused("NOT_ENOUGH_ITEMS"), "the phone barn's 999999 wheat is not sellable");
  for (const [req, reason] of [[{item: "wheat", qty: 0}, "BAD_QTY"], [{item: "wheat", qty: 1.5}, "BAD_QTY"], [{item: "egg", qty: 1}, "BAD_CROP"]])
    await assert.rejects(real(uid, "sell", {...req, requestId: "b" + reason}), refused(reason));
});

test("the bootstrap path B: free wheat -> harvest 2 -> sell 2 (4 coins) -> buy a wheat seed (1 coin) -> 3 coins left", async () => {
  const uid = "boot-sell-" + RUN;
  await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "a"});
  t += 20_000; await real(uid, "harvest", {plotId: "p0", generation: 1});
  await real(uid, "sell", {item: "wheat", qty: 2, requestId: "s"});
  assert.equal((await econ(uid)).coins, 4);
  const p = await real(uid, "plant", {plotId: "p0", crop: "wheat", requestId: "b"});
  assert.deepEqual(p.paid, {coins: 1}); assert.equal((await econ(uid)).coins, 3);
});

test("legacy close-out: a 7G listing goes back to the PHONE farm only; nothing canonical moves; it can't be closed twice", async () => {
  const s = "legacy-a-" + RUN, other = "legacy-b-" + RUN;
  await give(s, 0, {}); await give(other, 0, {});
  await db.doc(`market/${s}-1`).set({seller: s, sellerName: "G", item: "wheat", qty: 3, price: 6, at: 1, buyer: null, buyerName: null, soldAt: null});
  await db.doc(`market/${s}-2`).set({seller: s, sellerName: "G", item: "corn", qty: 2, price: 8, at: 2, buyer: other, buyerName: "B", soldAt: 3});
  await assert.rejects(real(other, "legacyClose", {listingId: s + "-1"}), refused("NOT_YOURS"));
  const unsold = await real(s, "legacyClose", {listingId: s + "-1"});
  assert.deepEqual(unsold.phone, {item: "wheat", qty: 3}, "unsold: the goods go back to the phone barn");
  const sold = await real(s, "legacyClose", {listingId: s + "-2"});
  assert.deepEqual(sold.phone, {coins: 8}, "sold by a 7G buyer: the phone farm gets the 7G price");
  assert.equal((await econ(s)).coins, 0); assert.deepEqual((await econ(s)).items, {}, "no canonical coins or goods");
  assert.equal(await listingDoc(s + "-1"), null); assert.equal(await listingDoc(s + "-2"), null);
  assert.equal((await real(s, "legacyClose", {listingId: s + "-1"})).replay, true, "closing again replays the first answer: no second payout");
  const v2 = await (async () => { await give(s, 0, {wheat: 1}); return real(s, "marketList", {item: "wheat", qty: 1, price: 2, requestId: "v2"}); })();
  await assert.rejects(real(s, "legacyClose", {listingId: v2.listingId}), refused("NOT_LEGACY"));
});
