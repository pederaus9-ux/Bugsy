// Sunny Acres 3D: friends. Pick a username, search for players, keep a friends list, and visit a friend's farm
// (read-only: you can look around, nothing can be changed and nothing is saved).
// Firestore (the same Firebase app auth.js signs in with):
//   players/{uid}                 {name, nameLower}           a player's public profile (any signed-in player can read)
//   players/{uid}/friends/{fid}   {name, addedAt}             your own friends list (only you)
//   usernames/{nameLower}         {uid, name}                 makes every username unique
//   showcase/{uid}                {save, name, level, updatedAt}  the read-only copy of your farm friends can visit
const NAME_OK = /^[A-Za-z0-9_]{3,16}$/;
const SAVE_KEY = "sunny-acres-3d-v1";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));

export function initFriends(G, hooks) {
  const $ = (id) => document.getElementById(id);
  const box = $("friendsBox"), body = $("friendsBody");
  let me = null, published = false;
  const fb = () => (window.saAuth && window.saAuth.fb && window.saAuth.user ? window.saAuth.fb : null);
  const uid = () => window.saAuth.user.uid;

  // ---------- Firestore ----------
  async function myProfile() {
    const {F, db} = fb(), d = await F.getDoc(F.doc(db, "players", uid()));
    return d.exists() ? d.data() : null;
  }
  // claim a username: the usernames/ entry makes sure nobody else has it; an old name is given back
  async function claimUsername(name) {
    if (!NAME_OK.test(name)) throw new Error("3 to 16 letters, numbers or _");
    const {F, db} = fb(), lower = name.toLowerCase(), id = uid();
    await F.runTransaction(db, async (tx) => {
      const taken = await tx.get(F.doc(db, "usernames", lower)), mine = await tx.get(F.doc(db, "players", id));
      if (taken.exists() && taken.data().uid !== id) throw new Error("That name is taken. Try another.");
      const old = mine.exists() ? mine.data().nameLower : null;
      if (old && old !== lower) tx.delete(F.doc(db, "usernames", old));
      tx.set(F.doc(db, "usernames", lower), {uid:id, name});
      tx.set(F.doc(db, "players", id), {name, nameLower:lower});
    });
    return {name, nameLower:lower};
  }
  // names starting with what was typed (Firestore matches from the start of a word, not in the middle)
  async function searchPlayers(text) {
    const {F, db} = fb(), q = text.trim().toLowerCase(); if (!q) return [];
    const snap = await F.getDocs(F.query(F.collection(db, "players"), F.where("nameLower", ">=", q), F.where("nameLower", "<=", q + ""), F.limit(10)));
    return snap.docs.filter(d => d.id !== uid()).map(d => ({uid:d.id, name:d.data().name}));
  }
  async function addFriend(p) { const {F, db} = fb(); await F.setDoc(F.doc(db, "players", uid(), "friends", p.uid), {name:p.name, addedAt:Date.now()}); }
  async function removeFriend(fid) { const {F, db} = fb(); await F.deleteDoc(F.doc(db, "players", uid(), "friends", fid)); }
  async function listFriends() {
    const {F, db} = fb(), snap = await F.getDocs(F.collection(db, "players", uid(), "friends"));
    return snap.docs.map(d => ({uid:d.id, name:d.data().name})).sort((a, b) => a.name.localeCompare(b.name));
  }
  // a friend's farm, as they last saved it
  async function fetchFarm(fid) {
    const {F, db} = fb(), d = await F.getDoc(F.doc(db, "showcase", fid));
    if (!d.exists()) return null;
    const x = d.data(); return {farm:JSON.parse(x.save), name:x.name, level:x.level, updatedAt:x.updatedAt};
  }
  // share a read-only copy of your farm (after each cloud save, and when Friends opens)
  async function publishShowcase(raw) {
    if (!fb() || !me || !raw) return;
    let level = 1; try { level = JSON.parse(raw).level || 1; } catch (e) { return; }
    const {F, db} = fb(); await F.setDoc(F.doc(db, "showcase", uid()), {save:raw, name:me.name, level, updatedAt:Date.now()});
  }
  addEventListener("sa3d:uploaded", (e) => { publishShowcase(e.detail).catch(() => {}); });

  // ---------- the Friends window ----------
  const row = (inner) => `<div class="frow">${inner}</div>`;
  async function render() {
    if (!fb()) { body.innerHTML = `<p class="fnote">Sign in to play with friends.</p>`; return; }
    body.innerHTML = `<p class="fnote">Loading…</p>`;
    try { me = me || await myProfile(); } catch (e) { body.innerHTML = `<p class="fnote">Couldn't reach Friends. Check your internet.</p>`; return; }
    if (!me) {
      body.innerHTML = `<p class="fnote">Pick a username so friends can find you.</p>
        <form class="fform" data-f="claim"><input id="fName" maxlength="16" placeholder="e.g. SunnyGrandma" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn sm" type="submit">Save</button></form><p class="fmsg" id="fMsg"></p>`;
      return;
    }
    if (!published) { published = true; publishShowcase(localStorage.getItem(SAVE_KEY)).catch(() => {}); }
    body.innerHTML = `<p class="fnote">You are <b>@${esc(me.name)}</b></p>
      <form class="fform" data-f="search"><input id="fSearch" maxlength="16" placeholder="Search by username" autocomplete="off" autocapitalize="off" spellcheck="false">
      <button class="btn sm" type="submit">🔍</button></form>
      <div id="fResults"></div><h4>Your friends</h4><div id="fList"><p class="fnote">Loading…</p></div><p class="fmsg" id="fMsg"></p>`;
    renderList();
  }
  async function renderList() {
    const el = $("fList"); if (!el) return;
    try {
      const list = await listFriends();
      el.innerHTML = list.length ? list.map(f => row(`<span>👤 ${esc(f.name)}</span><button class="btn sm" data-visit="${f.uid}" data-name="${esc(f.name)}">👀 Visit</button><button class="frm" data-remove="${f.uid}" aria-label="Remove ${esc(f.name)}">✕</button>`)).join("")
        : `<p class="fnote">No friends yet. Search for someone's username above.</p>`;
    } catch (e) { el.innerHTML = `<p class="fnote">Couldn't load your friends.</p>`; }
  }
  const say = (t) => { const m = $("fMsg"); if (m) m.textContent = t || ""; };

  box.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target.dataset.f;
    if (f === "claim") {
      try { me = await claimUsername($("fName").value.trim()); G.sfx("collect"); render(); } catch (err) { say(err.message.includes("permission") ? "Couldn't save that name." : err.message); }
    }
    if (f === "search") {
      const out = $("fResults"); out.innerHTML = `<p class="fnote">Searching…</p>`;
      try {
        const found = await searchPlayers($("fSearch").value);
        out.innerHTML = found.length ? found.map(p => row(`<span>👤 ${esc(p.name)}</span><button class="btn sm" data-add="${p.uid}" data-name="${esc(p.name)}">➕ Add</button>`)).join("")
          : `<p class="fnote">Nobody found with that name.</p>`;
      } catch (err) { out.innerHTML = `<p class="fnote">Search didn't work. Check your internet.</p>`; }
    }
  });
  box.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.f === "close") return open(false);
    if (b.dataset.add) { b.disabled = true; try { await addFriend({uid:b.dataset.add, name:b.dataset.name}); b.textContent = "✔ Added"; G.sfx("pop"); renderList(); } catch (err) { b.disabled = false; say("Couldn't add them. Try again."); } }
    if (b.dataset.remove) { try { await removeFriend(b.dataset.remove); renderList(); } catch (err) { say("Couldn't remove them. Try again."); } }
    if (b.dataset.visit) {
      b.disabled = true; b.textContent = "Loading…";
      try {
        const got = await fetchFarm(b.dataset.visit);
        if (!got) { say(`${b.dataset.name} hasn't shared their farm yet. It appears once they open the game.`); b.disabled = false; b.textContent = "👀 Visit"; return; }
        open(false); hooks.enterVisit(got.farm, got.name || b.dataset.name);
      } catch (err) { say("Couldn't load their farm. Check your internet."); b.disabled = false; b.textContent = "👀 Visit"; }
    }
  });
  function open(on) { box.hidden = !on; if (on) { G.close(); render(); } }
  $("friendsBtn").addEventListener("click", () => open(true));
  addEventListener("keydown", (e) => { if (e.code === "Escape" && !box.hidden) open(false); });
  return {open, searchPlayers, addFriend, listFriends, fetchFarm, claimUsername, publishShowcase};
}
