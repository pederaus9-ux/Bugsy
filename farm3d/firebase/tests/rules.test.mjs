// Firestore rules tests for Sunny Acres 3D (farm3d/firebase/firestore.rules), run against the local Firestore emulator.
// npm test (inside farm3d/firebase) starts the emulator, runs this file and stops it. No production credentials are used:
// the project id starts with "demo-", which keeps the emulator fully offline.
//
// Each test mirrors what the real game code does (auth.js, friends.js, players.html) and then tries the abuse cases.
import {readFileSync} from "node:fs";
import {test, before, after, beforeEach} from "node:test";
import {initializeTestEnvironment, assertSucceeds, assertFails} from "@firebase/rules-unit-testing";
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, limit,
  runTransaction, serverTimestamp, getCountFromServer, writeBatch,
} from "firebase/firestore";

const OWNER_EMAIL = "pederaus9@gmail.com";
const OWNER_UID = "wqPP4uUThWTmhqi9g5YdgyLfGQ93"; // Austin's Firebase Authentication UID (firestore.rules isOwner)
let env;
const counts = {allow: 0, deny: 0};
const ok = async (p) => { counts.allow++; return assertSucceeds(p); };
// MUTATION=1 (run against wide-open rules): count deny checks the open rules let through instead of stopping at the first one
const MUTATION = process.env.MUTATION === "1";
const no = async (p) => { counts.deny++; if (!MUTATION) return assertFails(p); try { await p; counts.openAllowed = (counts.openAllowed || 0) + 1; } catch (e) { console.log("MUTATION-SURVIVOR", e.code || e.message, new Error().stack.split("\n")[2]); } };

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-sunny-acres",
    firestore: {rules: readFileSync(process.env.RULES_FILE || new URL("../firestore.rules", import.meta.url), "utf8"), host, port: +port},
  });
});
after(async () => {
  console.log(`\nRULES CHECKS: ${counts.allow} allow + ${counts.deny} deny = ${counts.allow + counts.deny}` + (MUTATION ? ` | open rules let ${counts.openAllowed || 0} of ${counts.deny} deny cases through` : ""));
  await env.cleanup();
});
beforeEach(async () => { await env.clearFirestore(); });

const as = (uid, email) => env.authenticatedContext(uid, email ? {email} : {}).firestore();
const anon = () => env.unauthenticatedContext().firestore();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));
const NOW = 1790000000000;
const save = (level = 3, coins = 120) => JSON.stringify({level, coins, xp: 5, stats: {earned: 900, harvests: 40, bestCombo: 6, orders: 7}});

// the same transaction auth.js runs for a cloud save
const cloudPut = (db, uid, raw, s, expect) => runTransaction(db, async (tx) => {
  const ref = doc(db, "farms", uid), d = await tx.get(ref), cur = d.exists() ? d.data().rev || 0 : 0;
  if (expect != null && cur !== expect) return null;
  tx.set(ref, {save: raw, level: s.level, coins: s.coins, rev: cur + 1, updatedAt: NOW});
  return cur + 1;
});
// the same transaction friends.js runs to claim or change a username
const claim = (db, uid, name) => runTransaction(db, async (tx) => {
  const lower = name.toLowerCase();
  const taken = await tx.get(doc(db, "usernames", lower)), mine = await tx.get(doc(db, "players", uid));
  if (taken.exists() && taken.data().uid !== uid) throw new Error("taken");
  const old = mine.exists() ? mine.data().nameLower : null;
  if (old && old !== lower) tx.delete(doc(db, "usernames", old));
  tx.set(doc(db, "usernames", lower), {uid, name});
  tx.set(doc(db, "players", uid), {name, nameLower: lower});
});
const listing = (seller, over = {}) => Object.assign({seller, sellerName: "Grandma", item: "wheat", qty: 3, price: 6, at: NOW,
  buyer: null, buyerName: null, soldAt: null}, over);

// ---------------------------------------------------------------- farms/{uid}
test("farms: owner saves, reads and updates with the revision transaction", async () => {
  const db = as("alice");
  await ok(cloudPut(db, "alice", save(), {level: 3, coins: 120}, 0));
  await ok(getDoc(doc(db, "farms", "alice")));
  await ok(cloudPut(db, "alice", save(4), {level: 4, coins: 130}, 1));
  await ok(cloudPut(db, "alice", save(5), {level: 5, coins: 140}, null)); // forced upload (restore / first link)
  const d = await getDoc(doc(db, "farms", "alice"));
  if (d.data().rev !== 3) throw new Error("rev should be 3, got " + d.data().rev);
});
test("farms: a save from before revisions (no rev field) can still be updated", async () => {
  await seed((db) => setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, updatedAt: NOW}));
  await ok(cloudPut(as("alice"), "alice", save(), {level: 3, coins: 1}, 0));
});
test("farms: nobody else, and nobody signed out, can read or write", async () => {
  await seed((db) => setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 1, updatedAt: NOW}));
  await no(getDoc(doc(as("bob"), "farms", "alice")));
  await no(getDoc(doc(anon(), "farms", "alice")));
  await no(setDoc(doc(as("bob"), "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 2, updatedAt: NOW}));
  await no(setDoc(doc(anon(), "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 2, updatedAt: NOW}));
  await no(deleteDoc(doc(as("alice"), "farms", "alice")));
  await no(getDocs(collection(as("bob"), "farms")));
});
test("farms: rev must move forward by exactly one; shape and size are checked", async () => {
  const db = as("alice");
  await seed((d) => setDoc(doc(d, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 5, updatedAt: NOW}));
  await no(setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 5, updatedAt: NOW}));   // same rev
  await no(setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 1, updatedAt: NOW}));   // older rev
  await no(setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 6, updatedAt: NOW, admin: true}));
  await no(setDoc(doc(db, "farms", "alice"), {save: 42, level: 3, coins: 1, rev: 6, updatedAt: NOW}));
  await no(setDoc(doc(db, "farms", "alice"), {save: "x".repeat(900001), level: 3, coins: 1, rev: 6, updatedAt: NOW}));
  await ok(setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 6, updatedAt: NOW}));
});
test("farms: nobody can list or count farms, not even the owner (a count needs list, and list returns every save)", async () => {
  await seed((db) => setDoc(doc(db, "farms", "alice"), {save: save(), level: 3, coins: 1, rev: 1, updatedAt: NOW}));
  const owner = as(OWNER_UID, OWNER_EMAIL);
  await no(getDocs(collection(owner, "farms")));                       // the read the old "count but not read" test never tried
  await no(getDocs(query(collection(owner, "farms"), limit(1))));
  await no(getCountFromServer(collection(owner, "farms")));
  await no(getDoc(doc(owner, "farms", "alice")));
  await no(getCountFromServer(collection(as("bob", "bob@example.com"), "farms")));
  await no(getDocs(collection(as("alice"), "farms")));                   // not even the farm's own player can list
});

// ---------------------------------------------------------------- authorization matrix: get / list / count separately
// Each operation is checked on its own: allowing (or denying) one never proves anything about the others.
test("authorization matrix: get, list and count for every collection and role", async () => {
  const sv = save();
  await seed(async (db) => {
    await setDoc(doc(db, "farms/alice"), {save: sv, level: 3, coins: 5, rev: 1, updatedAt: NOW});
    await setDoc(doc(db, "showcase/alice"), {save: sv, name: "Al", level: 3, earned: 1, harvests: 1, best: 1, orders: 1, updatedAt: NOW});
    await setDoc(doc(db, "usernames/al"), {uid: "alice", name: "Al"});
    await setDoc(doc(db, "players/alice"), {name: "Al", nameLower: "al"});
    await setDoc(doc(db, "presence/alice"), {seen: NOW, level: 3});
    await setDoc(doc(db, "help/alice/items/bob-1-1"), {from: "bob", name: "B", plots: [1], at: NOW});
    await setDoc(doc(db, "players/alice/friends/bob"), {name: "B", addedAt: NOW});
    await setDoc(doc(db, "market/alice-1"), listing("alice"));
    await setDoc(doc(db, "events/e1"), {e: "open", d: "2026-10-01"});
    await setDoc(doc(db, "economy/alice"), {v: 1, coins: 0, items: {}, rev: 1});
    await setDoc(doc(db, "ledger/alice/rows/open-alice"), {op: "open", key: "open-alice", result: {}, rev: 1});
    await setDoc(doc(db, "plots/alice/items/p0"), {crop: "wheat", generation: 1, plantedAt: NOW, matureAt: NOW + 20000});
  });
  const R = {owner: as(OWNER_UID, OWNER_EMAIL), alice: as("alice", "alice@example.com"), bob: as("bob", "bob@example.com"), anon: anon()};
  // [collection, one doc, {role: [get, list, count]}]  (A = allow, D = deny)
  const M = [
    ["farms", "farms/alice", {owner: "DDD", alice: "ADD", bob: "DDD", anon: "DDD"}],
    ["showcase", "showcase/alice", {owner: "ADD", alice: "ADD", bob: "ADD", anon: "DDD"}],
    ["usernames", "usernames/al", {owner: "ADD", alice: "ADD", bob: "ADD", anon: "DDD"}],
    ["players", "players/alice", {owner: "AAA", alice: "AAA", bob: "AAA", anon: "DDD"}],           // search needs list
    ["presence", "presence/alice", {owner: "AAA", alice: "DDD", bob: "DDD", anon: "DDD"}],          // owner dashboard
    ["help/alice/items", "help/alice/items/bob-1-1", {owner: "DDD", alice: "AAA", bob: "DDD", anon: "DDD"}],
    ["players/alice/friends", "players/alice/friends/bob", {owner: "DDD", alice: "AAA", bob: "DDD", anon: "DDD"}],
    ["market", "market/alice-1", {owner: "AAA", alice: "AAA", bob: "AAA", anon: "DDD"}],
    ["events", "events/e1", {owner: "AAA", alice: "DDD", bob: "DDD", anon: "DDD"}],
    // Phase 7I: the canonical economy. Your own only; the game owner gets nothing special.
    ["economy", "economy/alice", {owner: "DDD", alice: "ADD", bob: "DDD", anon: "DDD"}],
    ["ledger/alice/rows", "ledger/alice/rows/open-alice", {owner: "DDD", alice: "AAA", bob: "DDD", anon: "DDD"}],
    ["plots/alice/items", "plots/alice/items/p0", {owner: "DDD", alice: "AAA", bob: "DDD", anon: "DDD"}],
  ];
  const run = {get: (db, c, d) => getDoc(doc(db, d)), list: (db, c) => getDocs(collection(db, c)), count: (db, c) => getCountFromServer(collection(db, c))};
  for (const [c, d, roles] of M) for (const [role, want] of Object.entries(roles)) for (const [i, op] of ["get", "list", "count"].entries()) {
    const p = run[op](R[role], c, d);
    try { await (want[i] === "A" ? ok(p) : no(p)); } catch (e) { throw new Error(`${c} ${op} as ${role}: expected ${want[i] === "A" ? "allow" : "deny"} (${e.message})`); }
  }
});

// The owner is recognized by account id (UID), never by the email claim: the game never verifies addresses.
test("owner check: only the owner's UID; the owner email on any other account, verified or not, is refused", async () => {
  await seed((db) => setDoc(doc(db, "presence/alice"), {seen: NOW, level: 3}));
  const ctx = (uid, token) => env.authenticatedContext(uid, token).firestore();
  await ok(getDocs(collection(ctx(OWNER_UID, {email: OWNER_EMAIL}), "presence")));
  await ok(getDocs(collection(ctx(OWNER_UID, {}), "presence")));                                                    // no email claim needed
  await no(getDocs(collection(ctx("x", {email: OWNER_EMAIL, email_verified: false}), "presence")));               // the old residual risk: now refused
  await no(getDocs(collection(ctx("x2", {email: OWNER_EMAIL, email_verified: true}), "presence")));                // even a verified owner email
  await no(getDocs(collection(ctx("y", {email: "PEDERAUS9@gmail.com", email_verified: true}), "presence")));
  await no(getDocs(collection(ctx(OWNER_UID.toLowerCase(), {email: OWNER_EMAIL}), "presence")));                   // the UID is exact
  await no(getDocs(collection(ctx(OWNER_UID + "x", {}), "presence")));
  await no(getDocs(collection(ctx("z", {email_verified: true}), "presence")));
  await no(getDocs(collection(ctx("x", {email: OWNER_EMAIL}), "events")));
  await ok(getDocs(collection(ctx(OWNER_UID, {}), "events")));
});

// ---------------------------------------------------------------- presence/{uid}
test("presence: heartbeat by its own player; only the owner reads it", async () => {
  const beat = (db, uid, extra = {}) => setDoc(doc(db, "presence", uid), Object.assign({seen: serverTimestamp(), level: 4, joined: NOW}, extra), {merge: true});
  await ok(beat(as("alice"), "alice"));
  await ok(beat(as("alice"), "alice", {joined: null}));
  await no(beat(as("bob"), "alice"));
  await no(beat(anon(), "alice"));
  await no(beat(as("alice"), "alice", {seen: NOW}));            // must be the server's clock
  await no(beat(as("alice"), "alice", {coins: 1e9}));           // extra field
  await no(getDoc(doc(as("alice"), "presence", "alice")));
  await ok(getDocs(collection(as(OWNER_UID, OWNER_EMAIL), "presence")));
  await no(getDocs(collection(as("bob", "bob@example.com"), "presence")));
});

// ---------------------------------------------------------------- players / usernames
test("usernames: claim, re-save, and rename all work through the game's transaction", async () => {
  const db = as("alice");
  await ok(claim(db, "alice", "SunnyGrandma"));
  await ok(claim(db, "alice", "SunnyGrandma"));        // re-saving the same name
  await ok(claim(db, "alice", "sunnygrandma"));        // changing only the capitals
  await ok(claim(db, "alice", "FarmerAl"));            // rename: the old name is given back
  const old = await getDoc(doc(db, "usernames", "sunnygrandma"));
  if (old.exists()) throw new Error("old name should have been released");
  await ok(claim(as("bob"), "bob", "SunnyGrandma"));   // the released name is free again
});
test("usernames: a name somebody else has can't be taken or deleted", async () => {
  await claim(as("alice"), "alice", "SunnyGrandma");
  const bob = as("bob");
  await no(setDoc(doc(bob, "usernames", "sunnygrandma"), {uid: "bob", name: "SunnyGrandma"}));
  await no(deleteDoc(doc(bob, "usernames", "sunnygrandma")));
  await no(updateDoc(doc(bob, "usernames", "sunnygrandma"), {uid: "bob"}));
  await no(setDoc(doc(as("alice"), "usernames", "sunnygrandma"), {uid: "bob", name: "SunnyGrandma"})); // giving it to someone else
  await no(deleteDoc(doc(as("alice"), "usernames", "sunnygrandma"))); // not while the profile still uses it
});
test("usernames + players: both halves must agree, with a valid name", async () => {
  const db = as("alice");
  // a username entry with no matching profile, or a profile with no username entry
  await no(setDoc(doc(db, "usernames", "lonely"), {uid: "alice", name: "Lonely"}));
  await no(setDoc(doc(db, "players", "alice"), {name: "Ghost", nameLower: "ghost"}));
  // mismatched lowercase, bad characters, too short, extra fields
  for (const [name, lower] of [["Bad Name", "bad name"], ["ab", "ab"], ["x".repeat(17), "x".repeat(17)], ["Mixed", "mixed2"]]) {
    await no(runTransaction(db, async (tx) => { tx.set(doc(db, "usernames", lower), {uid: "alice", name}); tx.set(doc(db, "players", "alice"), {name, nameLower: lower}); }));
  }
  await no(runTransaction(db, async (tx) => { tx.set(doc(db, "usernames", "okname"), {uid: "alice", name: "OkName", admin: true}); tx.set(doc(db, "players", "alice"), {name: "OkName", nameLower: "okname"}); }));
  await no(runTransaction(db, async (tx) => { tx.set(doc(db, "usernames", "okname"), {uid: "alice", name: "OkName"}); tx.set(doc(db, "players", "alice"), {name: "OkName", nameLower: "okname", role: "admin"}); }));
});
test("players: profiles are readable and searchable by signed-in players only, writable by their owner only", async () => {
  await claim(as("alice"), "alice", "SunnyGrandma");
  const bob = as("bob");
  await ok(getDoc(doc(bob, "players", "alice")));
  await ok(getDocs(query(collection(bob, "players"), where("nameLower", ">=", "sun"), where("nameLower", "<=", "sun"), limit(10))));
  await no(getDoc(doc(anon(), "players", "alice")));
  await no(setDoc(doc(bob, "players", "alice"), {name: "Hacked", nameLower: "hacked"}));
  await no(deleteDoc(doc(as("alice"), "players", "alice")));
  await no(updateDoc(doc(bob, "players", "alice"), {name: "Hacked"}));
});

// ---------------------------------------------------------------- friends
test("friends: your own list only", async () => {
  const alice = as("alice"), bob = as("bob");
  await ok(setDoc(doc(alice, "players", "alice", "friends", "bob"), {name: "Bobby", addedAt: NOW}));
  await ok(getDocs(collection(alice, "players", "alice", "friends")));
  await ok(deleteDoc(doc(alice, "players", "alice", "friends", "bob")));
  await no(getDocs(collection(bob, "players", "alice", "friends")));
  await no(setDoc(doc(bob, "players", "alice", "friends", "bob"), {name: "Bobby", addedAt: NOW}));
  await seed((db) => setDoc(doc(db, "players", "alice", "friends", "carol"), {name: "Carol", addedAt: NOW}));
  await no(deleteDoc(doc(bob, "players", "alice", "friends", "carol")));
  await no(setDoc(doc(alice, "players", "alice", "friends", "alice"), {name: "Me", addedAt: NOW}));      // yourself
  await no(setDoc(doc(alice, "players", "alice", "friends", "dave"), {name: "Dave", addedAt: NOW, x: 1})); // extra field
  await no(setDoc(doc(alice, "players", "alice", "friends", "dave"), {name: "", addedAt: NOW}));
});

// ---------------------------------------------------------------- showcase
test("showcase: publish your own, friends can visit, nobody can overwrite yours", async () => {
  const show = (over = {}) => Object.assign({save: save(), name: "SunnyGrandma", level: 3, earned: 900, harvests: 40, best: 6, orders: 7, updatedAt: NOW}, over);
  await ok(setDoc(doc(as("alice"), "showcase", "alice"), show()));
  await ok(getDoc(doc(as("bob"), "showcase", "alice")));
  await no(getDoc(doc(anon(), "showcase", "alice")));
  await no(setDoc(doc(as("bob"), "showcase", "alice"), show({name: "Bob"})));
  await no(deleteDoc(doc(as("alice"), "showcase", "alice")));
  await no(setDoc(doc(as("alice"), "showcase", "alice"), show({earned: -5})));
  await no(setDoc(doc(as("alice"), "showcase", "alice"), show({level: "99"})));
  await no(setDoc(doc(as("alice"), "showcase", "alice"), show({verified: true})));
  await no(setDoc(doc(as("alice"), "showcase", "alice"), show({save: "x".repeat(900001)})));
  await no(setDoc(doc(as("alice"), "showcase", "alice"), show({name: "<script>"})));
});

// ---------------------------------------------------------------- help
test("help: a friend waters your crops; only you read and clear the notes", async () => {
  const id = "bob-" + NOW + "-3", note = {from: "bob", name: "Bobby", plots: [3], at: NOW};
  await ok(setDoc(doc(as("bob"), "help", "alice", "items", id), note));
  await ok(getDocs(collection(as("alice"), "help", "alice", "items")));
  await ok(deleteDoc(doc(as("alice"), "help", "alice", "items", id)));
  await seed((db) => setDoc(doc(db, "help", "alice", "items", id), note));
  await no(getDocs(collection(as("carol"), "help", "alice", "items")));
  await no(deleteDoc(doc(as("bob"), "help", "alice", "items", id)));          // even the sender can't delete it
  await no(updateDoc(doc(as("bob"), "help", "alice", "items", id), {plots: [1, 2, 3]}));
  await no(setDoc(doc(anon(), "help", "alice", "items", "x-1-1"), note));
});
test("help: no forged senders, self-help or oversized notes", async () => {
  const bob = as("bob"), id = "bob-" + NOW + "-1";
  await no(setDoc(doc(bob, "help", "alice", "items", id), {from: "carol", name: "Carol", plots: [1], at: NOW}));   // pretends to be carol
  await no(setDoc(doc(bob, "help", "alice", "items", "carol-" + NOW + "-1"), {from: "bob", name: "Bobby", plots: [1], at: NOW})); // id not his
  await no(setDoc(doc(as("alice"), "help", "alice", "items", "alice-" + NOW + "-1"), {from: "alice", name: "Me", plots: [1], at: NOW}));
  await no(setDoc(doc(bob, "help", "alice", "items", id), {from: "bob", name: "Bobby", plots: [1, 2, 3, 4, 5], at: NOW}));
  await no(setDoc(doc(bob, "help", "alice", "items", id), {from: "bob", name: "Bobby", plots: [], at: NOW}));
  await no(setDoc(doc(bob, "help", "alice", "items", id), {from: "bob", name: "Bobby", plots: ["all"], at: NOW}));
  await no(setDoc(doc(bob, "help", "alice", "items", id), {from: "bob", name: "Bobby", plots: [1], at: NOW, coins: 999}));
});

// ---------------------------------------------------------------- market
// Phase 7I-C: the trading post is server-only. Every client write that 7G allowed (list, buy, take back, collect) is
// now refused; the old deny cases stay as they were. The real flow is tested through economyAct in economy.test.mjs.
test("market (7I-C): signed-in players can read listings; signed-out visitors can't", async () => {
  await seed((db) => setDoc(doc(db, "market", "alice-r1"), listing("alice", {v: 2, state: "open"})));
  await ok(getDocs(query(collection(as("bob"), "market"), limit(60))));
  await ok(getDocs(query(collection(as("alice"), "market"), where("seller", "==", "alice"))));
  await ok(getDoc(doc(as("bob"), "market", "alice-r1")));
  await no(getDocs(collection(anon(), "market")));
});
test("market (7I-C): no client can create a listing, not even a well-formed one in their own name", async () => {
  const alice = as("alice"), id = "alice-" + NOW;
  await no(setDoc(doc(alice, "market", id), listing("alice")));                                    // what friends.js used to do
  await no(setDoc(doc(alice, "market", "alice-r2"), {v: 2, seller: "alice", sellerName: "Grandma", item: "wheat", qty: 3, price: 6, at: NOW, state: "open"}));
  await no(setDoc(doc(alice, "market", id), listing("bob")));                                    // in someone else's name
  await no(setDoc(doc(alice, "market", "bob-" + NOW), listing("alice")));                        // id not yours
  await no(setDoc(doc(anon(), "market", id), listing("alice")));
  await no(setDoc(doc(alice, "market", id), listing("alice", {buyer: "alice", buyerName: "A", soldAt: NOW}))); // already "sold"
  for (const bad of [{qty: 0}, {qty: 11}, {qty: 2.5}, {qty: "3"}, {price: 0}, {price: 100001}, {price: -6}, {item: "WHEAT!"}, {item: 7},
    {sellerName: ""}, {at: "now"}, {extra: 1}]) {
    await no(setDoc(doc(alice, "market", id), listing("alice", bad)));
  }
  const missing = listing("alice"); delete missing.soldAt;
  await no(setDoc(doc(alice, "market", id), missing));
});
test("market (7I-C): no client can buy, take back, collect, reprice or delete a listing", async () => {
  const id = "alice-" + NOW, bob = as("bob"), carol = as("carol"), alice = as("alice");
  const ref = (db) => doc(db, "market", id);
  const fresh = () => seed((db) => setDoc(doc(db, "market", id), listing("alice")));
  await fresh();
  // the old friends.js buy (read in a transaction, write it back with buyer fields) and the plain update
  await no(runTransaction(bob, async (tx) => { const d = await tx.get(ref(bob)); tx.set(ref(bob), Object.assign({}, d.data(), {buyer: "bob", buyerName: "Bobby", soldAt: NOW + 5})); }));
  await no(updateDoc(ref(bob), {buyer: "bob", buyerName: "Bobby", soldAt: NOW}));
  await no(updateDoc(ref(alice), {buyer: "alice", buyerName: "Grandma", soldAt: NOW}));             // buying your own
  await no(updateDoc(ref(bob), {buyer: "carol", buyerName: "Carol", soldAt: NOW}));                  // in someone else's name
  await no(updateDoc(ref(bob), {buyer: "bob", buyerName: "Bobby", soldAt: NOW, price: 1}));          // and a discount
  await no(updateDoc(ref(bob), {buyer: "bob", buyerName: "Bobby", soldAt: NOW, qty: 10}));
  await no(updateDoc(ref(bob), {buyer: "bob", buyerName: "Bobby", soldAt: NOW, item: "cake"}));
  await no(updateDoc(ref(bob), {buyer: "bob", buyerName: "Bobby", soldAt: NOW, seller: "bob"}));
  await no(updateDoc(ref(bob), {price: 1}));
  await no(updateDoc(ref(alice), {price: 600}));                                                     // the seller can't reprice
  await no(updateDoc(ref(anon()), {buyer: "x", buyerName: "X", soldAt: NOW}));
  // take back (the seller deleting an unsold listing) and deletes by anyone else
  await fresh(); await no(deleteDoc(ref(alice)));
  await fresh(); await no(deleteDoc(ref(bob)));
  await fresh(); await no(deleteDoc(ref(anon())));
  // collect (the seller deleting a sold listing in a transaction) and anyone undoing or taking over a sale
  // (re-seeded before every attempt, so with wide-open rules each one really reaches an existing listing)
  const sold = () => seed((db) => setDoc(doc(db, "market", id), listing("alice", {buyer: "bob", buyerName: "Bobby", soldAt: NOW})));
  await sold(); await no(runTransaction(alice, async (tx) => { const x = await tx.get(ref(alice)); if (x.exists() && x.data().buyer) tx.delete(ref(alice)); }));
  await sold(); await no(deleteDoc(ref(bob)));
  await sold(); await no(updateDoc(ref(carol), {buyer: "carol", buyerName: "Carol", soldAt: NOW + 1}));
  await sold(); await no(updateDoc(ref(bob), {buyer: null, buyerName: null, soldAt: null}));
  await sold(); await no(updateDoc(ref(alice), {buyer: null, buyerName: null, soldAt: null}));
});

// ---------------------------------------------------------------- events
test("economy, ledger, plots (7I): no client can create, change or delete them, not even for their own account", async () => {
  const seedAll = () => seed(async (db) => {
    await setDoc(doc(db, "economy/alice"), {v: 1, coins: 0, items: {}, rev: 1});
    await setDoc(doc(db, "ledger/alice/rows/open-alice"), {op: "open", key: "open-alice", result: {}, rev: 1});
    await setDoc(doc(db, "plots/alice/items/p0"), {crop: "wheat", generation: 1, plantedAt: NOW, matureAt: NOW + 20000});
  });
  const alice = as("alice", "alice@example.com"), bob = as("bob", "bob@example.com"), owner = as(OWNER_UID, OWNER_EMAIL);
  for (const db of [alice, bob, owner, anon()]) {
    await seedAll(); // fresh documents for every role (so with wide-open rules every deny below really gets through)
    await no(setDoc(doc(db, "economy/alice"), {v: 1, coins: 1000000, items: {wheat: 999}, rev: 2}));
    await no(updateDoc(doc(db, "economy/alice"), {coins: 1000000}));
    await no(deleteDoc(doc(db, "economy/alice")));
    await no(setDoc(doc(db, "economy/carol"), {v: 1, coins: 5, items: {}, rev: 1}));
    await no(setDoc(doc(db, "ledger/alice/rows/harvest-alice-p0-1"), {op: "harvest", key: "harvest-alice-p0-1", result: {}, rev: 2}));
    await no(deleteDoc(doc(db, "ledger/alice/rows/open-alice")));
    await no(setDoc(doc(db, "ledger/alice"), {any: 1}));
    await no(updateDoc(doc(db, "plots/alice/items/p0"), {matureAt: NOW}));
    await no(setDoc(doc(db, "plots/alice/items/p1"), {crop: "pumpkin", generation: 1, plantedAt: NOW, matureAt: NOW}));
    await no(deleteDoc(doc(db, "plots/alice/items/p0")));
  }
  // the owner of the data can read it (what the game shows); nobody else can
  await ok(getDoc(doc(alice, "economy/alice")));
  await no(getDoc(doc(bob, "economy/alice")));
  await no(getDocs(collection(owner, "economy")));
});

test("events: guests and players can add a milestone; nothing else, and only the owner reads", async () => {
  await ok(addDoc(collection(anon(), "events"), {e: "open", d: "2026-10-01"}));
  await ok(addDoc(collection(as("alice"), "events"), {e: "lvl_5", d: "2026-10-01"}));
  await ok(addDoc(collection(anon(), "events"), {e: "tut_done", d: "2026-10-01"}));
  for (const bad of [{e: "open"}, {e: "open", d: "today"}, {e: "Open Game", d: "2026-10-01"}, {e: "x".repeat(25), d: "2026-10-01"},
    {e: "open", d: "2026-10-01", uid: "alice"}, {e: 5, d: "2026-10-01"}]) {
    await no(addDoc(collection(anon(), "events"), bad));
  }
  await seed((db) => setDoc(doc(db, "events", "e1"), {e: "open", d: "2026-10-01"}));
  await no(getDocs(collection(anon(), "events")));
  await no(getDocs(collection(as("alice", "alice@example.com"), "events")));
  await no(updateDoc(doc(anon(), "events", "e1"), {e: "lvl_20"}));
  await no(deleteDoc(doc(as(OWNER_UID, OWNER_EMAIL), "events", "e1")));
  await ok(getCountFromServer(query(collection(as(OWNER_UID, OWNER_EMAIL), "events"), where("e", "==", "open"))));
});

// ---------------------------------------------------------------- everything else
test("unknown collections are closed", async () => {
  await no(setDoc(doc(as("alice"), "admin", "config"), {open: true}));
  await no(getDoc(doc(as(OWNER_UID, OWNER_EMAIL), "secrets", "x")));
  await no(setDoc(doc(anon(), "anything", "x"), {a: 1}));
  const a = as("alice"), b = writeBatch(a); b.set(doc(a, "farms", "alice", "sub", "x"), {a: 1});
  await no(b.commit());
});
