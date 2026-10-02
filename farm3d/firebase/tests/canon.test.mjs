// Phase 7I-B: harvest reconciliation on the device (farm3d/canon.js) against the REAL economy core in the emulator.
// The network is simulated: "offline" makes every call fail like a dropped connection; "lose answer" lets the server
// act but loses the reply, as when a phone drops off Wi-Fi mid-request. Server time is a fake clock (t).
import {test} from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {createCanon} from "../../canon.js";

const require = createRequire(new URL("../functions/", import.meta.url));
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const E = require("./economy.js");
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085";
initializeApp({projectId: "demo-sunny-acres"});
const db = getFirestore();
const RUN = Date.now().toString(36);
let t = 1_900_000_000_000;

const memory = () => { const m = new Map(); return {getItem: (k) => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k)}; };
function device(uid, storage = memory()) {
  const net = {offline: false, loseAnswer: false, calls: 0};
  const call = async (data) => {
    net.calls++;
    if (net.offline) throw new Error("Failed to fetch");
    let out;
    try { out = await E.act(db, FieldValue, uid, data.op, data, E.OPS, {now: () => t}); }
    catch (e) { if (e instanceof E.EconomyError) throw {details: {reason: e.reason}}; throw e; }
    if (net.loseAnswer) { net.loseAnswer = false; throw new Error("connection reset"); }
    return out;
  };
  return {net, storage, canon: createCanon({call, storage, uid, online: () => !net.offline})};
}
const econ = async (uid) => (await db.doc("economy/" + uid).get()).data();

test("planting needs a connection: offline it is refused on the device and nothing reaches the server", async () => {
  const uid = "dev-a-" + RUN, d = device(uid);
  d.net.offline = true;
  assert.deepEqual(await d.canon.plant("p0", "wheat"), {ok: false, reason: "OFFLINE"});
  assert.equal(d.net.calls, 0); assert.equal(await econ(uid), undefined);
  d.net.offline = false;
  const r = await d.canon.plant("p0", "wheat");
  assert.equal(r.ok, true); assert.deepEqual(r.plot.paid, {bootstrap: true});
});

test("a planting whose answer was lost is re-sent with the same request id: one plot, one generation, one free bootstrap", async () => {
  const uid = "dev-b-" + RUN, d = device(uid);
  d.net.loseAnswer = true;
  const lost = await d.canon.plant("p0", "wheat");
  assert.deepEqual(lost, {ok: false, reason: "NETWORK"});
  const retry = await d.canon.plant("p0", "wheat");
  assert.equal(retry.ok, true); assert.equal(retry.plot.replay, true, "the server recognised the same request");
  assert.equal(retry.plot.generation, 1); assert.deepEqual(retry.plot.paid, {bootstrap: true});
  assert.equal((await db.doc(`plots/${uid}/items/p0`).get()).data().generation, 1);
});

test("offline harvest: queued and shown as provisional; confirmed once on reconnect; the queue empties", async () => {
  const uid = "dev-c-" + RUN, d = device(uid);
  const {plot} = await d.canon.plant("p0", "wheat");
  t += 20_000; d.net.offline = true;
  const w = await d.canon.harvest("p0", plot.generation, "wheat");
  assert.equal(w.waiting.length, 1);
  assert.deepEqual(d.canon.provisional(), {wheat: 2}, "shown, but not canonical yet");
  assert.deepEqual((await econ(uid)).items, {}, "nothing granted while offline");
  d.net.offline = false;
  const r = await d.canon.flush();
  assert.equal(r.confirmed.length, 1); assert.deepEqual(d.canon.queue(), []); assert.deepEqual(d.canon.provisional(), {});
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
  assert.equal((await d.canon.flush()).confirmed.length, 0, "nothing left to send");
});

test("a harvest sent too early stays queued (NOT_MATURE_YET is temporary) and succeeds later", async () => {
  const uid = "dev-d-" + RUN, d = device(uid);
  const {plot} = await d.canon.plant("p1", "wheat");
  t += 5_000;
  const early = await d.canon.harvest("p1", plot.generation, "wheat");
  assert.equal(early.waiting.length, 1); assert.equal(early.waiting[0].detail, "NOT_MATURE_YET");
  assert.equal(d.canon.queue().length, 1);
  t += 15_000;
  assert.equal((await d.canon.flush()).confirmed.length, 1);
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
});

test("two devices harvest the same crop offline: on reconnect there is ONE grant, and both queues clear", async () => {
  const uid = "dev-e-" + RUN, phone = device(uid), tablet = device(uid);
  const {plot} = await phone.canon.plant("p2", "wheat");
  t += 20_000; phone.net.offline = tablet.net.offline = true;
  await phone.canon.harvest("p2", plot.generation, "wheat");
  await tablet.canon.harvest("p2", plot.generation, "wheat");
  phone.net.offline = tablet.net.offline = false;
  const [a, b] = await Promise.all([phone.canon.flush(), tablet.canon.flush()]);
  assert.equal(a.confirmed.length + b.confirmed.length, 2, "both learn the outcome");
  assert.equal([...a.confirmed, ...b.confirmed].filter(h => !h.detail.replay).length, 1, "exactly one was the real grant");
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
  assert.deepEqual(phone.canon.provisional(), {}); assert.deepEqual(tablet.canon.provisional(), {});
});

test("a stale device: its old queued harvest replays after the crop was harvested and replanted elsewhere; no second grant", async () => {
  const uid = "dev-f-" + RUN, phone = device(uid), old = device(uid);
  const {plot} = await phone.canon.plant("p3", "wheat");
  t += 20_000; old.net.offline = true;
  await old.canon.harvest("p3", plot.generation, "wheat");       // queued on the old device, never sent
  await phone.canon.harvest("p3", plot.generation, "wheat");     // the phone harvests it for real
  const re = await phone.canon.plant("p3", "wheat");             // and replants (paid with 1 wheat): generation 2
  assert.equal(re.plot.generation, 2);
  old.net.offline = false;
  const r = await old.canon.flush();
  assert.equal(r.confirmed.length, 1); assert.equal(r.confirmed[0].detail.replay, true);
  assert.deepEqual((await econ(uid)).items, {wheat: 1}, "2 harvested - 1 replanted; the stale harvest added nothing");
  assert.equal((await db.doc(`plots/${uid}/items/p3`).get()).data().state, "growing", "the stale device did not touch generation 2");
});

test("a provisional harvest the server refuses for good is dropped, and its provisional grant disappears", async () => {
  const uid = "dev-g-" + RUN, d = device(uid);
  await d.canon.plant("p4", "wheat");
  d.net.offline = true;
  await d.canon.harvest("p4", 7, "wheat");          // a generation that never existed (an edited or confused device)
  await d.canon.harvest("p5", 1, "pumpkin");        // a plot the server never planted
  assert.deepEqual(d.canon.provisional(), {wheat: 2, pumpkin: 2});
  d.net.offline = false;
  const r = await d.canon.flush();
  assert.equal(r.dropped.length, 2); assert.deepEqual(r.dropped.map(x => x.detail).sort(), ["NO_SUCH_GENERATION", "NO_SUCH_GENERATION"]);
  assert.deepEqual(d.canon.provisional(), {}); assert.deepEqual((await econ(uid)).items, {});
});

test("the queue survives an app restart (it lives in storage) and is per account", async () => {
  const uid = "dev-h-" + RUN, storage = memory(), d1 = device(uid, storage);
  const {plot} = await d1.canon.plant("p0", "wheat");
  t += 20_000; d1.net.offline = true;
  await d1.canon.harvest("p0", plot.generation, "wheat");
  const restarted = device(uid, storage);                    // same phone storage, new app session
  assert.equal(restarted.canon.queue().length, 1);
  assert.equal(device("someone-else-" + RUN, storage).canon.queue().length, 0, "another account never sees this queue");
  assert.equal((await restarted.canon.flush()).confirmed.length, 1);
  assert.deepEqual((await econ(uid)).items, {wheat: 2});
});
