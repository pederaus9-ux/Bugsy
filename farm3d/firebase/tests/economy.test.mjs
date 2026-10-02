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
