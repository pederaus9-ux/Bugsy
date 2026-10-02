// Sunny Acres 3D: Firestore rules tests against the local emulator (Phase 7G).
// Run from farm3d/firebase with `npm test` (which starts the emulator). Nothing here talks to the real Firebase project.
//
// Two kinds of checks:
// - "flow" tests repeat the exact reads, writes and transactions that auth.js and friends.js make, and must be ALLOWED,
//   so tightening the rules can't quietly break sign-in, cloud saves, usernames, friends, help or the trading post;
// - allow/deny tests try each collection's legal and illegal writes and reads.
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {after, before, beforeEach, describe, test} from "node:test";
import assert from "node:assert/strict";
import {initializeTestEnvironment, assertSucceeds, assertFails} from "@firebase/rules-unit-testing";
import {
  doc, collection, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, runTransaction, query, where, limit,
  getCountFromServer, serverTimestamp, Timestamp,
} from "firebase/firestore";

const here = dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(resolve(here, "../firestore.rules"), "utf8");
const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");

// players: two ordinary players, an outsider with no username, and the owner account that reads the players page
const ALICE = "aliceUid0000000000000000001", BOB = "bobUid00000000000000000002", EVE = "eveUid00000000000000000003", OWNER = "ownerUid000000000000000004";
let env;
const tally = {allow:0, deny:0};
const allow = async (p) => { tally.allow++; return assertSucceeds(p); };
const deny = async (p) => { tally.deny++; return assertFails(p); };
const as = (uid, token) => env.authenticatedContext(uid, token).firestore();
const guest = () => env.unauthenticatedContext().firestore();
const alice = () => as(ALICE, {email:"alice@example.com"});
const bob = () => as(BOB, {email:"bob@example.com"});
const eve = () => as(EVE, {email:"eve@example.com"});
const owner = () => as(OWNER, {email:"pederaus9@gmail.com"});
const admin = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const SAVE = JSON.stringify({level:3, coins:120, xp:40, stats:{earned:300, harvests:25, bestCombo:4, orders:6}, plots:[]});
// existing usernames for Alice and Bob, as claimUsername leaves them
async function seedPlayers() {
  await admin(async (db) => {
    await setDoc(doc(db, "players", ALICE), {name:"Alice", nameLower:"alice"});
    await setDoc(doc(db, "usernames", "alice"), {uid:ALICE, name:"Alice"});
    await setDoc(doc(db, "players", BOB), {name:"Bob_2", nameLower:"bob_2"});
    await setDoc(doc(db, "usernames", "bob_2"), {uid:BOB, name:"Bob_2"});
  });
}

// ---------- copies of the game's own Firestore code (auth.js / friends.js), unchanged except for passing db/uid ----------
const client = {
  // auth.js cloud.put
  put: (db, uid, raw, s, expect) => runTransaction(db, async (tx) => {
    const ref = doc(db, "farms", uid), d = await tx.get(ref), cur = d.exists() ? d.data().rev || 0 : 0;
    if (expect != null && cur !== expect) return null;
    tx.set(ref, {save:raw, level:s.level, coins:s.coins, rev:cur + 1, updatedAt:Date.now()});
    return cur + 1;
  }),
  get: async (db, uid) => { const d = await getDoc(doc(db, "farms", uid)); return d.exists() ? d.data() : null; },
  // auth.js beat
  beat: (db, uid, level, joined) => setDoc(doc(db, "presence", uid), {seen:serverTimestamp(), level, joined}, {merge:true}),
  // auth.js flushStats
  stat: (db, e) => addDoc(collection(db, "events"), {e, d:new Date().toLocaleDateString("en-CA")}),
  // friends.js claimUsername
  claim: (db, id, name) => runTransaction(db, async (tx) => {
    const lower = name.toLowerCase();
    const taken = await tx.get(doc(db, "usernames", lower)), mine = await tx.get(doc(db, "players", id));
    if (taken.exists() && taken.data().uid !== id) throw new Error("That name is taken. Try another.");
    const old = mine.exists() ? mine.data().nameLower : null;
    if (old && old !== lower) tx.delete(doc(db, "usernames", old));
    tx.set(doc(db, "usernames", lower), {uid:id, name});
    tx.set(doc(db, "players", id), {name, nameLower:lower});
  }),
  search: (db, text) => { const q = text.trim().toLowerCase(); return getDocs(query(collection(db, "players"), where("nameLower", ">=", q), where("nameLower", "<=", q + ""), limit(10))); },
  addFriend: (db, uid, p) => setDoc(doc(db, "players", uid, "friends", p.uid), {name:p.name, addedAt:Date.now()}),
  removeFriend: (db, uid, fid) => deleteDoc(doc(db, "players", uid, "friends", fid)),
  listFriends: (db, uid) => getDocs(collection(db, "players", uid, "friends")),
  fetchFarm: (db, fid) => getDoc(doc(db, "showcase", fid)),
  publish: (db, uid, raw, name) => { const s = JSON.parse(raw), st = s.stats || {};
    return setDoc(doc(db, "showcase", uid), {save:raw, name, level:s.level || 1, earned:st.earned || 0, harvests:st.harvests || 0, best:st.bestCombo || 0, orders:st.orders || 0, updatedAt:Date.now()}); },
  water: (db, me, name, fid, i) => setDoc(doc(db, "help", fid, "items", me + "-" + Date.now() + "-" + i), {from:me, name, plots:[i], at:Date.now()}),
  receiveHelp: async (db, uid) => { const snap = await getDocs(collection(db, "help", uid, "items")); for (const d of snap.docs) await deleteDoc(d.ref); return snap.size; },
  marketList: (db) => getDocs(query(collection(db, "market"), limit(60))),
  list: async (db, uid, name, item, qty, price) => { const id = uid + "-" + Date.now();
    await setDoc(doc(db, "market", id), {seller:uid, sellerName:name, item, qty, price, at:Date.now(), buyer:null, buyerName:null, soldAt:null}); return id; },
  buy: (db, uid, name, id) => runTransaction(db, async (tx) => {
    const ref = doc(db, "market", id), d = await tx.get(ref);
    if (!d.exists() || d.data().buyer) throw new Error("Someone else just bought that.");
    tx.set(ref, Object.assign({}, d.data(), {buyer:uid, buyerName:name, soldAt:Date.now()}));
  }),
  takeBack: async (db, id) => { const ref = doc(db, "market", id); let ok = false;
    await runTransaction(db, async (tx) => { const d = await tx.get(ref); if (d.exists() && !d.data().buyer) { tx.delete(ref); ok = true; } }); return ok; },
  collectSales: async (db, uid) => {
    const snap = await getDocs(query(collection(db, "market"), where("seller", "==", uid))); let coins = 0;
    for (const d of snap.docs) { if (!d.data().buyer) continue; const ref = doc(db, "market", d.id); let price = 0;
      await runTransaction(db, async (tx) => { const x = await tx.get(ref); if (x.exists() && x.data().buyer) { price = x.data().price; tx.delete(ref); } });
      coins += price; }
    return coins;
  },
};
const listing = (over = {}) => Object.assign({seller:ALICE, sellerName:"Alice", item:"wheat", qty:3, price:6, at:Date.now(), buyer:null, buyerName:null, soldAt:null}, over);
const mid = () => ALICE + "-" + Date.now();

before(async () => {
  env = await initializeTestEnvironment({projectId:"demo-sunny-acres", firestore:{rules:RULES, host, port:+port}});
});
beforeEach(async () => { await env.clearFirestore(); await seedPlayers(); });
after(async () => {
  console.log(`\nRULES ASSERTIONS: ${tally.allow} allow, ${tally.deny} deny`);
  const out = process.env.TEST_ARTIFACTS || resolve(here, "../artifacts");
  try { mkdirSync(out, {recursive:true}); writeFileSync(resolve(out, "rules-tally.json"), JSON.stringify(tally, null, 2)); } catch (e) {}
  await env.cleanup();
});

// ---------- price table in the rules must match the game ----------
describe("rules mirror game.js", () => {
  test("market base prices equal ITEMS[id].p for every item", () => {
    const game = readFileSync(resolve(here, "../../game.js"), "utf8");
    const block = game.slice(game.indexOf("export const ITEMS = {"), game.indexOf("};", game.indexOf("export const ITEMS = {")));
    const items = Object.fromEntries([...block.matchAll(/([a-z_]+):\{n:"[^"]*",e:"[^"]*",p:(\d+)/g)].map(m => [m[1], +m[2]]));
    const rules = RULES.slice(RULES.indexOf("function basePrices()"), RULES.indexOf("function legalPrice"));
    const mirrored = Object.fromEntries([...rules.matchAll(/'([a-z_]+)':\s*(\d+)/g)].map(m => [m[1], +m[2]]));
    assert.ok(Object.keys(items).length >= 29, "parsed ITEMS from game.js");
    assert.deepEqual(mirrored, items);
  });
  test("username pattern matches friends.js NAME_OK", () => {
    const friends = readFileSync(resolve(here, "../../friends.js"), "utf8");
    assert.match(friends, /const NAME_OK = \/\^\[A-Za-z0-9_\]\{3,16\}\$\/;/);
    assert.match(RULES, /\^\[A-Za-z0-9_\]\{3,16\}\$/);
  });
});

// ---------- current game flows (must keep working) ----------
describe("game flows", () => {
  test("guest: anonymous milestone stats are accepted", async () => {
    for (const e of ["open", "guest", "tut_1", "tut_9", "tut_done", "lvl_2", "lvl_20", "back_d1", "back_d7"]) await allow(client.stat(guest(), e));
    await allow(client.stat(alice(), "account"));
    await allow(client.stat(alice(), "friend"));
  });
  test("cloud save: first upload, later uploads and the conflict check", async () => {
    const db = alice(), s = {level:3, coins:120};
    assert.equal(await client.get(db, ALICE), null);
    assert.equal(await allow(client.put(db, ALICE, SAVE, s, 0)), 1);
    assert.equal(await allow(client.put(db, ALICE, SAVE, s, 1)), 2);
    assert.equal(await allow(client.put(db, ALICE, SAVE, s, null)), 3); // a forced upload (the player chose this farm)
    // another phone still thinks it's at version 2: nothing is written, the player chooses next time
    assert.equal(await client.put(db, ALICE, SAVE, s, 2), null);
    assert.equal((await client.get(db, ALICE)).rev, 3);
  });
  test("cloud save: a farm saved before revisions existed (no rev) still uploads", async () => {
    await admin((db) => setDoc(doc(db, "farms", ALICE), {save:SAVE, level:2, coins:5, updatedAt:1}));
    assert.equal(await allow(client.put(alice(), ALICE, SAVE, {level:3, coins:120}, 0)), 1);
  });
  test("presence heartbeat (create, then merge)", async () => {
    await allow(client.beat(alice(), ALICE, 3, 1759000000000));
    await allow(client.beat(alice(), ALICE, 4, 1759000000000));
    await allow(client.beat(alice(), ALICE, 4, null)); // creationTime couldn't be read
  });
  test("username: claim, re-case, rename, and the old name is given back", async () => {
    await allow(client.claim(eve(), EVE, "SunnyGrandma"));
    await allow(client.claim(eve(), EVE, "sunnygrandma"));      // same name, new capitals
    await allow(client.claim(eve(), EVE, "Niece_7"));            // rename: frees "sunnygrandma"
    let freed; await admin(async (db) => { freed = await getDoc(doc(db, "usernames", "sunnygrandma")); });
    assert.equal(freed.exists(), false);
    await allow(client.claim(alice(), ALICE, "SunnyGrandma"));   // and now someone else can have it
  });
  test("username: a name someone else holds is refused by the game", async () => {
    await assert.rejects(client.claim(eve(), EVE, "ALICE"), /taken/);
  });
  test("friends: search, add, list, visit, leaderboard, remove", async () => {
    const db = alice();
    const found = await allow(client.search(db, "bo"));
    assert.equal(found.docs.map(d => d.id).join(), BOB);
    await allow(client.addFriend(db, ALICE, {uid:BOB, name:"Bob_2"}));
    assert.equal((await allow(client.listFriends(db, ALICE))).size, 1);
    await allow(client.publish(bob(), BOB, SAVE, "Bob_2"));
    const farm = await allow(client.fetchFarm(db, BOB));
    assert.equal(farm.data().earned, 300);
    await allow(client.removeFriend(db, ALICE, BOB));
  });
  test("help: water a friend's field; the friend applies and clears the notes", async () => {
    await allow(client.water(bob(), BOB, "Bob_2", ALICE, 4));
    await allow(client.water(bob(), BOB, "Bob_2", ALICE, 47)); // the last field on the biggest farm
    assert.equal(await allow(client.receiveHelp(alice(), ALICE)), 2);
  });
  test("market: list, browse, buy, collect", async () => {
    const id = await allow(client.list(alice(), ALICE, "Alice", "wheat", 3, 6));
    assert.ok((await allow(client.marketList(bob()))).docs.some(d => d.id === id));
    await allow(client.buy(bob(), BOB, "Bob_2", id));
    assert.equal(await allow(client.collectSales(alice(), ALICE)), 6);
  });
  test("market: list then take back while unsold", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "pizza", 10, 2800);
    assert.equal(await allow(client.takeBack(alice(), id)), true);
  });
  test("market: the second buyer is told it's gone", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "egg", 1, 10);
    await client.buy(bob(), BOB, "Bob_2", id);
    await assert.rejects(client.buy(eve(), EVE, "Eve", id), /Someone else/);
  });
  test("players page: the owner reads presence, counts farms and events", async () => {
    await client.beat(alice(), ALICE, 3, null); await client.put(alice(), ALICE, SAVE, {level:3, coins:1}, 0); await client.stat(guest(), "open");
    const db = owner();
    await allow(getDocs(collection(db, "presence")));
    await allow(getDoc(doc(db, "players", ALICE)));
    assert.equal((await allow(getCountFromServer(collection(db, "farms")))).data().count, 1);
    assert.equal((await allow(getCountFromServer(query(collection(db, "events"), where("e", "==", "open"))))).data().count, 1);
  });
});

// ---------- farms/{uid} ----------
describe("farms", () => {
  const good = (rev) => ({save:SAVE, level:3, coins:120, rev, updatedAt:Date.now()});
  test("only the owner reads a cloud save", async () => {
    await admin((db) => setDoc(doc(db, "farms", ALICE), good(1)));
    await allow(getDoc(doc(alice(), "farms", ALICE)));
    await deny(getDoc(doc(bob(), "farms", ALICE)));
    await deny(getDoc(doc(guest(), "farms", ALICE)));
    await deny(getDoc(doc(owner(), "farms", ALICE)));           // the owner can count farms, not read them
    await deny(getDocs(collection(bob(), "farms")));
  });
  test("nobody writes someone else's save; signed-out players write nothing", async () => {
    await deny(setDoc(doc(bob(), "farms", ALICE), good(1)));
    await deny(setDoc(doc(guest(), "farms", ALICE), good(1)));
    await admin((db) => setDoc(doc(db, "farms", ALICE), good(1)));
    await deny(setDoc(doc(bob(), "farms", ALICE), good(2)));
    await deny(deleteDoc(doc(bob(), "farms", ALICE)));
    await deny(deleteDoc(doc(alice(), "farms", ALICE)));
  });
  test("the version only ever goes up by one", async () => {
    await deny(setDoc(doc(alice(), "farms", ALICE), good(5)));   // a new save must be version 1
    await allow(setDoc(doc(alice(), "farms", ALICE), good(1)));
    await deny(setDoc(doc(alice(), "farms", ALICE), good(1)));   // same version again: another phone already wrote it
    await deny(setDoc(doc(alice(), "farms", ALICE), good(9)));   // jumping ahead
    await deny(setDoc(doc(alice(), "farms", ALICE), good(0)));   // going back
  });
  test("shape: required fields, types and sizes", async () => {
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {admin:true})));
    await deny(setDoc(doc(alice(), "farms", ALICE), {save:SAVE, level:3, coins:1, rev:1}));
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {save:123})));
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {save:"x".repeat(1000001)})));
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {level:0})));
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {level:"3"})));
    await deny(setDoc(doc(alice(), "farms", ALICE), Object.assign(good(1), {coins:-1})));
  });
});

// ---------- presence/{uid} ----------
describe("presence", () => {
  test("only the owner account reads presence", async () => {
    await client.beat(alice(), ALICE, 3, null);
    await deny(getDocs(collection(alice(), "presence")));
    await deny(getDoc(doc(alice(), "presence", ALICE)));
    await deny(getDocs(collection(guest(), "presence")));
    await deny(getDocs(collection(as(EVE, {email:"pederaus9@gmail.co"}), "presence")));
  });
  test("only your own heartbeat, with the server's time and the known fields", async () => {
    await deny(client.beat(bob(), ALICE, 3, null));
    await deny(client.beat(guest(), ALICE, 3, null));
    await deny(setDoc(doc(alice(), "presence", ALICE), {seen:Timestamp.fromMillis(Date.now() + 864e5), level:3, joined:null}));
    await deny(setDoc(doc(alice(), "presence", ALICE), {seen:serverTimestamp(), level:3, joined:null, email:"x"}));
    await deny(setDoc(doc(alice(), "presence", ALICE), {seen:serverTimestamp(), level:-2, joined:null}));
    await deny(setDoc(doc(alice(), "presence", ALICE), {seen:serverTimestamp(), level:3, joined:"yesterday"}));
    await client.beat(alice(), ALICE, 3, null);
    await deny(deleteDoc(doc(alice(), "presence", ALICE)));
  });
});

// ---------- players/{uid} and friends ----------
describe("players", () => {
  test("signed-in players can read profiles; signed-out cannot", async () => {
    await allow(getDoc(doc(bob(), "players", ALICE)));
    await deny(getDoc(doc(guest(), "players", ALICE)));
    await deny(getDocs(collection(guest(), "players")));
  });
  test("nobody else can change a profile", async () => {
    await deny(setDoc(doc(bob(), "players", ALICE), {name:"Alice", nameLower:"alice"}));
    await deny(updateDoc(doc(bob(), "players", ALICE), {name:"Hacked"}));
    await deny(deleteDoc(doc(alice(), "players", ALICE)));
  });
  test("a profile name must be a username this account holds", async () => {
    await deny(setDoc(doc(alice(), "players", ALICE), {name:"Bob_2", nameLower:"bob_2"}));   // Bob's name
    await deny(setDoc(doc(eve(), "players", EVE), {name:"Ghost", nameLower:"ghost"}));       // no usernames/ entry
    await deny(setDoc(doc(alice(), "players", ALICE), {name:"Alice", nameLower:"ALICE"}));   // nameLower not lower
  });
  test("shape: no extra or admin-like fields, names 3 to 16 letters/numbers/_", async () => {
    await deny(setDoc(doc(alice(), "players", ALICE), {name:"Alice", nameLower:"alice", admin:true}));
    await deny(setDoc(doc(alice(), "players", ALICE), {name:"Alice", nameLower:"alice", coins:9e9}));
    await deny(client.claim(eve(), EVE, "ab"));
    await deny(client.claim(eve(), EVE, "a".repeat(17)));
    await deny(client.claim(eve(), EVE, "<script>"));
    await deny(client.claim(eve(), EVE, "has space"));
  });
  test("friends lists are private to their owner", async () => {
    await client.addFriend(alice(), ALICE, {uid:BOB, name:"Bob_2"});
    await deny(getDocs(collection(bob(), "players", ALICE, "friends")));
    await deny(getDoc(doc(bob(), "players", ALICE, "friends", BOB)));
    await deny(client.addFriend(bob(), ALICE, {uid:EVE, name:"Eve"}));
    await deny(client.removeFriend(bob(), ALICE, BOB));
    await deny(getDocs(collection(guest(), "players", ALICE, "friends")));
  });
  test("friend entries: known fields only, and not yourself", async () => {
    await deny(setDoc(doc(alice(), "players", ALICE, "friends", BOB), {name:"Bob_2", addedAt:Date.now(), x:1}));
    await deny(setDoc(doc(alice(), "players", ALICE, "friends", BOB), {name:"<b>Bob</b>", addedAt:Date.now()}));
    await deny(setDoc(doc(alice(), "players", ALICE, "friends", BOB), {name:"Bob_2", addedAt:"now"}));
    await deny(client.addFriend(alice(), ALICE, {uid:ALICE, name:"Alice"}));
  });
});

// ---------- usernames/{nameLower} ----------
describe("usernames", () => {
  test("signed-in players can read the name list; signed-out cannot", async () => {
    await allow(getDoc(doc(eve(), "usernames", "alice")));
    await deny(getDoc(doc(guest(), "usernames", "alice")));
  });
  test("a name another account holds cannot be taken, changed or deleted", async () => {
    await deny(setDoc(doc(eve(), "usernames", "alice"), {uid:EVE, name:"Alice"}));
    await deny(updateDoc(doc(eve(), "usernames", "alice"), {uid:EVE}));
    await deny(deleteDoc(doc(eve(), "usernames", "alice")));
    // even inside a transaction that also points Eve's profile at it
    const db = eve();
    await deny(runTransaction(db, async (tx) => {
      tx.set(doc(db, "usernames", "alice"), {uid:EVE, name:"Alice"});
      tx.set(doc(db, "players", EVE), {name:"Alice", nameLower:"alice"});
    }));
  });
  test("a claim must be for yourself, match its document and go with your profile", async () => {
    const db = eve();
    await deny(setDoc(doc(eve(), "usernames", "ghost"), {uid:BOB, name:"Ghost"}));            // for someone else
    await deny(runTransaction(db, async (tx) => {                                               // name doesn't match id
      tx.set(doc(db, "usernames", "ghost"), {uid:EVE, name:"Other"});
      tx.set(doc(db, "players", EVE), {name:"Other", nameLower:"ghost"});
    }));
    await deny(setDoc(doc(eve(), "usernames", "ghost"), {uid:EVE, name:"Ghost"}));            // hoarding: no profile change
    await deny(runTransaction(db, async (tx) => {
      tx.set(doc(db, "usernames", "ghost"), {uid:EVE, name:"Ghost", admin:true});
      tx.set(doc(db, "players", EVE), {name:"Ghost", nameLower:"ghost"});
    }));
  });
  test("you can only give back your own old name when moving to a new one", async () => {
    await deny(deleteDoc(doc(alice(), "usernames", "alice")));          // the profile still uses it
    await deny(deleteDoc(doc(guest(), "usernames", "alice")));
  });
});

// ---------- showcase/{uid} ----------
describe("showcase", () => {
  test("signed-in players can visit; signed-out cannot", async () => {
    await client.publish(bob(), BOB, SAVE, "Bob_2");
    await allow(getDoc(doc(alice(), "showcase", BOB)));
    await deny(getDoc(doc(guest(), "showcase", BOB)));
  });
  test("only your own showcase, under your own username", async () => {
    await deny(client.publish(alice(), BOB, SAVE, "Bob_2"));
    await deny(client.publish(guest(), BOB, SAVE, "Bob_2"));
    await deny(client.publish(alice(), ALICE, SAVE, "Bob_2"));    // pretending to be Bob
    await deny(client.publish(eve(), EVE, SAVE, "Eve"));           // no username yet
    await client.publish(bob(), BOB, SAVE, "Bob_2");
    await deny(deleteDoc(doc(alice(), "showcase", BOB)));
  });
  test("shape: fields, types, ranges and the farm size limit", async () => {
    const base = {save:SAVE, name:"Alice", level:3, earned:1, harvests:1, best:1, orders:1, updatedAt:Date.now()};
    await deny(setDoc(doc(alice(), "showcase", ALICE), Object.assign({}, base, {verified:true})));
    await deny(setDoc(doc(alice(), "showcase", ALICE), Object.assign({}, base, {level:0})));
    await deny(setDoc(doc(alice(), "showcase", ALICE), Object.assign({}, base, {earned:-5})));
    await deny(setDoc(doc(alice(), "showcase", ALICE), Object.assign({}, base, {harvests:"lots"})));
    await deny(setDoc(doc(alice(), "showcase", ALICE), Object.assign({}, base, {save:"x".repeat(1000001)})));
    await deny(setDoc(doc(alice(), "showcase", ALICE), {name:"Alice", level:3, updatedAt:Date.now()}));
    await allow(setDoc(doc(alice(), "showcase", ALICE), base));
  });
});

// ---------- help/{owner}/items/{id} ----------
describe("help", () => {
  test("only the farm's owner reads and clears their notes", async () => {
    await client.water(bob(), BOB, "Bob_2", ALICE, 1);
    await deny(getDocs(collection(bob(), "help", ALICE, "items")));
    await deny(getDocs(collection(eve(), "help", ALICE, "items")));
    await deny(getDocs(collection(guest(), "help", ALICE, "items")));
    const id = (await getDocs(collection(alice(), "help", ALICE, "items"))).docs[0].id;
    await deny(deleteDoc(doc(bob(), "help", ALICE, "items", id)));
    await deny(updateDoc(doc(bob(), "help", ALICE, "items", id), {plots:[2]}));
  });
  test("help must be signed in, from yourself, under your name, for someone else", async () => {
    await deny(client.water(guest(), BOB, "Bob_2", ALICE, 1));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", BOB + "-1-1"), {from:EVE, name:"Bob_2", plots:[1], at:Date.now()}));
    await deny(client.water(bob(), BOB, "Alice", ALICE, 1));              // signing as someone else
    await deny(client.water(alice(), ALICE, "Alice", ALICE, 1));          // watering your own farm
    await deny(client.water(eve(), EVE, "Eve", ALICE, 1));                // no username yet
    await deny(setDoc(doc(bob(), "help", ALICE, "items", EVE + "-1-1"), {from:BOB, name:"Bob_2", plots:[1], at:Date.now()}));
  });
  test("shape: one field number in range, a current time, nothing else", async () => {
    const at = Date.now(), id = (i) => BOB + "-" + at + "-" + i;
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[1, 2, 3], at}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[], at}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[64], at}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:["1"], at}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[1], at:at + 30 * 864e5}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[1], at, coins:500}));
    await deny(setDoc(doc(bob(), "help", ALICE, "items", id(1)), {from:BOB, name:"Bob_2", plots:[1]}));
  });
});

// ---------- market/{id} ----------
describe("market", () => {
  const put = (db, id, data) => setDoc(doc(db, "market", id), data);
  test("signed-in players browse; signed-out cannot", async () => {
    await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await allow(getDocs(collection(bob(), "market")));
    await deny(getDocs(collection(guest(), "market")));
  });
  test("seller can create only their own listing, under their own name", async () => {
    await deny(put(bob(), mid(), listing()));                                   // Bob listing as Alice
    await deny(put(alice(), BOB + "-" + Date.now(), listing()));               // in Bob's id space
    await deny(put(alice(), mid(), listing({sellerName:"Bob_2"})));
    await deny(put(guest(), mid(), listing()));
    await deny(put(eve(), EVE + "-" + Date.now(), listing({seller:EVE, sellerName:"Eve"}))); // no username
  });
  test("a new listing must be unsold", async () => {
    await deny(put(alice(), mid(), listing({buyer:BOB, buyerName:"Bob_2", soldAt:Date.now()})));
    await deny(put(alice(), mid(), listing({soldAt:Date.now()})));
  });
  test("malformed items, amounts, prices and times are rejected", async () => {
    await deny(put(alice(), mid(), listing({item:"diamond"})));
    await deny(put(alice(), mid(), listing({item:"__proto__"})));
    await deny(put(alice(), mid(), listing({qty:0})));
    await deny(put(alice(), mid(), listing({qty:11})));
    await deny(put(alice(), mid(), listing({qty:2.5})));
    await deny(put(alice(), mid(), listing({qty:"3"})));
    await deny(put(alice(), mid(), listing({price:2})));                       // wheat ×3: at least 3
    await deny(put(alice(), mid(), listing({price:13})));                      // wheat ×3: at most 12
    await deny(put(alice(), mid(), listing({price:6.5})));
    await deny(put(alice(), mid(), listing({price:-6})));
    await deny(put(alice(), mid(), listing({at:Date.now() + 30 * 864e5})));
    await deny(put(alice(), mid(), listing({note:"extra"})));
    const {soldAt, ...missing} = listing(); await deny(put(alice(), mid(), missing));
    await allow(put(alice(), mid(), listing({price:3})));                      // the edges are legal
    await allow(put(alice(), ALICE + "-" + (Date.now() + 1), listing({price:12})));
  });
  test("item, amount, price and seller can't change after listing", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await deny(updateDoc(doc(alice(), "market", id), {price:12}));
    await deny(updateDoc(doc(alice(), "market", id), {qty:10}));
    await deny(updateDoc(doc(alice(), "market", id), {item:"pizza"}));
    await deny(updateDoc(doc(bob(), "market", id), {seller:BOB}));
    await deny(updateDoc(doc(bob(), "market", id), {sellerName:"Bob_2"}));
  });
  test("a buyer can only mark an unsold listing bought, for themselves, under their own name", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await deny(updateDoc(doc(bob(), "market", id), {buyer:EVE, buyerName:"Bob_2", soldAt:Date.now()}));
    await deny(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Alice", soldAt:Date.now()}));
    await deny(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:Date.now(), price:1}));
    await deny(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:Date.now(), qty:10}));
    await deny(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:"now"}));
    await deny(updateDoc(doc(guest(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:Date.now()}));
    await allow(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:Date.now()}));
  });
  test("a seller cannot buy their own listing", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await deny(client.buy(alice(), ALICE, "Alice", id));
  });
  test("a sold listing can't be bought again or changed by anyone", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await client.buy(bob(), BOB, "Bob_2", id);
    await deny(updateDoc(doc(eve(), "market", id), {buyer:EVE, buyerName:"Eve", soldAt:Date.now()}));
    await deny(updateDoc(doc(bob(), "market", id), {buyer:BOB, buyerName:"Bob_2", soldAt:Date.now()}));
    await deny(updateDoc(doc(alice(), "market", id), {buyer:null, buyerName:null, soldAt:null}));   // seller un-selling it
    await deny(updateDoc(doc(alice(), "market", id), {price:12}));
  });
  test("only the seller removes a listing (taking it back, or collecting the coins)", async () => {
    const id = await client.list(alice(), ALICE, "Alice", "wheat", 3, 6);
    await deny(deleteDoc(doc(bob(), "market", id)));
    await deny(deleteDoc(doc(guest(), "market", id)));
    await client.buy(bob(), BOB, "Bob_2", id);
    await deny(deleteDoc(doc(bob(), "market", id)));                          // not even the buyer
    await deny(deleteDoc(doc(eve(), "market", id)));
    await allow(deleteDoc(doc(alice(), "market", id)));
  });
});

// ---------- events/{id} ----------
describe("events", () => {
  test("only a milestone name and a date; no other fields, names or sizes", async () => {
    const d = new Date().toLocaleDateString("en-CA");
    await deny(addDoc(collection(guest(), "events"), {e:"open", d, uid:ALICE}));
    await deny(addDoc(collection(guest(), "events"), {e:"open"}));
    await deny(addDoc(collection(guest(), "events"), {e:"buy_gems", d}));
    await deny(addDoc(collection(guest(), "events"), {e:"x".repeat(5000), d}));
    await deny(addDoc(collection(guest(), "events"), {e:"open", d:"27/09/2026"}));
    await deny(addDoc(collection(guest(), "events"), {e:123, d}));
  });
  test("nobody but the owner reads; nobody changes or deletes", async () => {
    const ref = await addDoc(collection(guest(), "events"), {e:"open", d:"2026-10-02"});
    await deny(getDocs(collection(guest(), "events")));
    await deny(getDocs(collection(alice(), "events")));
    await deny(getDoc(doc(alice(), "events", ref.id)));
    await deny(updateDoc(doc(guest(), "events", ref.id), {e:"lvl_20"}));
    await deny(deleteDoc(doc(owner(), "events", ref.id)));
  });
});

// ---------- anything else ----------
describe("everything else is closed", () => {
  test("unknown collections deny reads and writes", async () => {
    await deny(setDoc(doc(alice(), "admins", ALICE), {on:true}));
    await deny(getDoc(doc(alice(), "config", "x")));
    await deny(setDoc(doc(owner(), "gems", OWNER), {n:999}));
    await deny(setDoc(doc(guest(), "anything", "x"), {a:1}));
  });
});
