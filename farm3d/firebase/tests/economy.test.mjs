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
const db = getFirestore();
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
