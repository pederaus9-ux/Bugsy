// Sunny Acres 3D: friends. Pick a username, search for players, keep a friends list, visit a friend's farm (look around and
// water their crops for them), compare on the leaderboard, and buy and sell goods at the trading post.
// Firestore (the same Firebase app auth.js signs in with):
//   players/{uid}                 {name, nameLower}           a player's public profile (any signed-in player can read)
//   players/{uid}/friends/{fid}   {name, addedAt}             your own friends list (only you)
//   usernames/{nameLower}         {uid, name}                 makes every username unique
//   showcase/{uid}                {save, name, level, earned, harvests, best, updatedAt}  the read-only copy of your farm friends can visit
//   help/{uid}/items/{id}         {from, name, plots, at}     friends who watered your crops (anyone signed in can add; only you read and clear)
//   market/{id}                   {v:2, seller, sellerName, item, qty, price, at, state}  the trading post (read here; written only by
//                                 the economyAct Cloud Function: marketList / marketBuy / marketCancel)
//   economy/{uid}                 {coins, items, ...}         your VERIFIED coins and goods (read here; written only by the server)
const NAME_OK = /^[A-Za-z0-9_]{3,16}$/;
const SAVE_KEY = "sunny-acres-3d-v1";
const HELP_PER_DAY = 12, MAX_LISTINGS = 4;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]));

export function initFriends(G, hooks) {
  const $ = (id) => document.getElementById(id);
  const box = $("friendsBox"), body = $("friendsBody");
  let me = null, published = false, tab = "friends", visitingUid = null, sell = null, friendIds = new Set();
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
  async function addFriend(p) { const {F, db} = fb(); await F.setDoc(F.doc(db, "players", uid(), "friends", p.uid), {name:p.name, addedAt:Date.now()}); if (window.saStats) window.saStats("friend"); }
  async function removeFriend(fid) { const {F, db} = fb(); await F.deleteDoc(F.doc(db, "players", uid(), "friends", fid)); }
  async function listFriends() {
    const {F, db} = fb(), snap = await F.getDocs(F.collection(db, "players", uid(), "friends"));
    const list = snap.docs.map(d => ({uid:d.id, name:d.data().name})).sort((a, b) => a.name.localeCompare(b.name));
    friendIds = new Set(list.map(f => f.uid));
    return list;
  }
  // a friend's farm, as they last saved it
  async function fetchFarm(fid) {
    const {F, db} = fb(), d = await F.getDoc(F.doc(db, "showcase", fid));
    if (!d.exists()) return null;
    const x = d.data(); return {farm:JSON.parse(x.save), name:x.name, level:x.level, updatedAt:x.updatedAt};
  }
  // share a read-only copy of your farm (after each cloud save, and when Friends opens), with the numbers for the leaderboard
  async function publishShowcase(raw) {
    if (!fb() || !me || !raw) return;
    let s; try { s = JSON.parse(raw); } catch (e) { return; }
    const st = s.stats || {};
    const {F, db} = fb(); await F.setDoc(F.doc(db, "showcase", uid()), {save:raw, name:me.name, level:s.level || 1, earned:st.earned || 0, harvests:st.harvests || 0,
      best:st.bestCombo || 0, orders:st.orders || 0, updatedAt:Date.now()});
  }
  addEventListener("sa3d:uploaded", (e) => { publishShowcase(e.detail).catch(() => {}); });

  // ---------- helping: water a friend's crops while visiting ----------
  const helpKey = (fid) => "sa3d-helped-" + fid + "-" + new Date().toLocaleDateString("en-CA");
  function waterForFriend(i) {
    if (!fb() || !me || !visitingUid) return false;
    let n = 0; try { n = +localStorage.getItem(helpKey(visitingUid)) || 0; } catch (e) {}
    if (n >= HELP_PER_DAY) { G.toast("💧 You've watered plenty for them today. Come back tomorrow!"); return false; }
    try { localStorage.setItem(helpKey(visitingUid), n + 1); } catch (e) {}
    const {F, db} = fb(), fid = visitingUid;
    F.setDoc(F.doc(db, "help", fid, "items", uid() + "-" + Date.now() + "-" + i), {from:uid(), name:me.name, plots:[i], at:Date.now()})
      .then(() => G.helpedFriend(1)).catch(() => G.toast("Couldn't send your help. Check your internet."));
    return true;
  }
  // friends who watered my crops: water those fields here, say thank you, and clear the notes
  let helpBusy = false;
  async function receiveHelp() {
    if (!fb() || helpBusy || G.isVisiting()) return; helpBusy = true;
    try {
      const {F, db} = fb(), snap = await F.getDocs(F.collection(db, "help", uid(), "items")), by = {};
      for (const d of snap.docs) { const x = d.data(), plots = x.plots || []; G.applyHelp(plots); by[x.name] = (by[x.name] || 0) + plots.length; await F.deleteDoc(d.ref || F.doc(db, "help", uid(), "items", d.id)); } // (crops that ripened meanwhile don't need it, but the thank-you still counts)
      const list = Object.entries(by).map(([name, n]) => ({name, n}));
      if (list.length) G.noteHelp(list);
    } catch (e) {}
    helpBusy = false;
  }

  // ---------- the trading post ----------
  // ---------- trading post (Phase 7I-C): the server's canonical economy ----------
  // Listing, buying and taking back all go through the economyAct Cloud Function. It holds the goods, moves VERIFIED
  // coins in one transaction and pays the seller at once (there is no "collect"). The farm on this phone (its coins and
  // barn) is not tradable: only verified coins and verified harvests are.
  const REASON = {NOT_ENOUGH_ITEMS:"You don't have that many verified goods.", NOT_ENOUGH_COINS:"Not enough verified coins.",
    TOO_MANY_LISTINGS:"You can have " + MAX_LISTINGS + " things for sale at once.", GONE:"Someone else just bought that.",
    SELF_BUY:"That's your own listing.", NOT_YOURS:"That isn't yours.", LEGACY_LISTING:"That's an old listing from before verified trading.",
    BAD_PRICE:"That price isn't allowed.", BAD_QTY:"That amount isn't allowed.", BAD_CROP:"That can't be traded yet."};
  const why = (e, fallback) => REASON[e && e.details && e.details.reason] || fallback;
  const reqId = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).replace(/[^a-z0-9]/g, "");
  const act = (data) => { const f = fb(); if (!f || !f.call) throw new Error("offline"); return f.call(data); };
  let canonEcon = {coins:0, items:{}};
  async function loadEconomy() {
    const {F, db} = fb(), ref = F.doc(db, "economy", uid());
    let d = await F.getDoc(ref);
    if (!d.exists()) { await act({op:"open"}); d = await F.getDoc(ref); } // first visit: the verified account opens at 0
    canonEcon = d.exists() ? {coins:d.data().coins || 0, items:d.data().items || {}} : {coins:0, items:{}};
    return canonEcon;
  }
  const vHave = (id) => canonEcon.items[id] || 0;
  async function marketList() {
    const {F, db} = fb(), snap = await F.getDocs(F.query(F.collection(db, "market"), F.limit(60)));
    return snap.docs.map(d => Object.assign({id:d.id}, d.data())).sort((a, b) => b.at - a.at); // v:2 = verified; others are 7G (phone farm)
  }
  async function listForSale(item, qty, price) {
    try { await act({op:"marketList", item, qty, price, requestId:reqId()}); }
    catch (e) { throw new Error(why(e, "Couldn't put it up for sale. Check your internet.")); }
  }
  async function buyListing(L) {
    if (canonEcon.coins < L.price) { G.toast("Need " + L.price + " verified 🪙"); G.sfx("error"); return false; }
    try { await act({op:"marketBuy", listingId:L.id}); }
    catch (e) { throw new Error(why(e, "Couldn't buy it. Check your internet.")); }
    G.sfx("coin"); return true;
  }
  // a 7G listing (from before verified trading): the server closes it and says what goes back to THIS PHONE's farm
  async function legacyBack(L) {
    let r; try { r = await act({op:"legacyClose", listingId:L.id}); } catch (e) { throw new Error(why(e, "Couldn't take it back. Check your internet.")); }
    if (r.replay) return;
    if (r.phone.coins) G.soldAtMarket(r.phone.coins, 1); else if (r.phone.item && G.ITEMS[r.phone.item] && r.phone.qty > 0) G.unEscrow(r.phone.item, r.phone.qty);
  }
  async function sellNow(item, qty) {
    try { return await act({op:"sell", item, qty, requestId:reqId()}); } catch (e) { throw new Error(why(e, "Couldn't sell. Check your internet.")); }
  }
  async function takeBack(L) {
    try { await act({op:"marketCancel", listingId:L.id}); }
    catch (e) { if (e && e.details && e.details.reason === "GONE") return G.toast("Too late: it's already sold!"); throw e; }
  }
  // check for help and sales soon after signing in, then every few minutes
  let bg = setInterval(() => { if (fb()) { clearInterval(bg); receiveHelp(); setInterval(() => { receiveHelp(); }, 5 * 60e3); } }, 2000);
  // ---------- Phase 7I-D: the verified balance, shown next to the phone coins (which are labelled as not verified) ----------
  let econWatch = null, econFor = null;
  setInterval(() => {
    const f = fb(), id = f ? uid() : null;
    if (id === econFor) return;
    if (econWatch) { econWatch(); econWatch = null; }
    econFor = id;
    const vbox = $("vcoinsBox"), cbox = $("coinsBox");
    if (!id) { if (vbox) vbox.hidden = true; if (cbox) { cbox.title = "Coins"; delete cbox.dataset.legacy; } return; }
    if (cbox) { cbox.title = "Coins on this phone: not verified, so they can't be traded"; cbox.dataset.legacy = "LEGACY_UNVERIFIED"; }
    econWatch = f.F.onSnapshot(f.F.doc(f.db, "economy", id), (d) => {
      const e = d.exists() ? d.data() : {coins:0, items:{}};
      canonEcon = {coins:e.coins || 0, items:e.items || {}};
      if (vbox) { vbox.hidden = false; $("vcoins").textContent = canonEcon.coins.toLocaleString(); }
    }, () => {});
  }, 2000);

  // ---------- the Friends window ----------
  const row = (inner) => `<div class="frow">${inner}</div>`;
  const tabs = () => `<div class="ftabs">${[["friends", "👥 Friends"], ["board", "🏆 Leaderboard"], ["market", "🏪 Trading"]].map(([k, n]) => `<button class="btn ${tab === k ? "" : "plain"} sm" data-tab="${k}">${n}</button>`).join("")}</div>`;
  async function render() {
    if (!fb()) { body.innerHTML = `<p class="fnote">Sign in to play with friends.</p>${window.saAuth && window.saAuth.guest ? `<p class="fnote"><button class="btn sm" data-f="account">☁️ Create an account</button></p>` : ""}`; return; }
    body.innerHTML = `<p class="fnote">Loading…</p>`;
    try { me = me || await myProfile(); } catch (e) { body.innerHTML = `<p class="fnote">Couldn't reach Friends. Check your internet.</p>`; return; }
    if (!me) {
      body.innerHTML = `<p class="fnote">Pick a username so friends can find you.</p>
        <form class="fform" data-f="claim"><input id="fName" maxlength="16" placeholder="e.g. SunnyGrandma" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="btn sm" type="submit">Save</button></form><p class="fmsg" id="fMsg"></p>`;
      return;
    }
    if (!published) { published = true; publishShowcase(localStorage.getItem(SAVE_KEY)).catch(() => {}); }
    if (tab === "board") return renderBoard();
    if (tab === "market") return renderMarket();
    body.innerHTML = tabs() + `<p class="fnote">You are <b>@${esc(me.name)}</b></p>
      <form class="fform" data-f="search"><input id="fSearch" maxlength="16" placeholder="Search by username" autocomplete="off" autocapitalize="off" spellcheck="false">
      <button class="btn sm" type="submit">🔍</button></form>
      <div id="fResults"></div><h4>Your friends</h4><div id="fList"><p class="fnote">Loading…</p></div>
      <p class="fnote" style="font-size:12px">👀 Visit a friend's farm and tap their growing crops to 💧 water them (+2 🪙 each).</p><p class="fmsg" id="fMsg"></p>`;
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
  // ---------- leaderboard: you and your friends ----------
  let boardBy = "earned";
  async function renderBoard() {
    body.innerHTML = tabs() + `<p class="fnote">Loading…</p>`;
    try {
      const {F, db} = fb(), list = await listFriends(), S = G.S;
      const rows = [{name:me.name, you:true, level:S.level, earned:S.stats.earned, harvests:S.stats.harvests, best:S.stats.bestCombo || 0}];
      for (const f of list) {
        const d = await F.getDoc(F.doc(db, "showcase", f.uid)); if (!d.exists()) { rows.push({name:f.name, level:0, earned:0, harvests:0, best:0, none:true}); continue; }
        const x = d.data(); let st = {}; if (x.earned == null) { try { st = JSON.parse(x.save).stats || {}; } catch (e) {} }
        rows.push({name:f.name, level:x.level || 1, earned:x.earned ?? st.earned ?? 0, harvests:x.harvests ?? st.harvests ?? 0, best:x.best ?? st.bestCombo ?? 0});
      }
      const cats = [["earned", "🪙 Coins earned"], ["harvests", "🌾 Harvests"], ["level", "⭐ Level"], ["best", "✂️ Best swipe"]];
      rows.sort((a, b) => b[boardBy] - a[boardBy]);
      body.innerHTML = tabs() + `<div class="ftabs">${cats.map(([k, n]) => `<button class="btn ${boardBy === k ? "gold" : "plain"} sm" data-by="${k}">${n}</button>`).join("")}</div>` +
        rows.map((r, k) => row(`<span class="rank">${["🥇", "🥈", "🥉"][k] || k + 1}</span><span class="who">${r.you ? "⭐ " : "👤 "}${esc(r.name)}${r.you ? " (you)" : ""}</span><b class="score">${r.none ? "—" : r[boardBy].toLocaleString()}${boardBy === "best" && !r.none ? "×" : ""}</b>`)).join("") +
        (list.length ? "" : `<p class="fnote">Add friends to see how you compare!</p>`) + `<p class="fnote" style="font-size:12px">Friends' numbers update when they play.</p>`;
    } catch (e) { body.innerHTML = tabs() + `<p class="fnote">Couldn't load the leaderboard. Check your internet.</p>`; }
  }
  // ---------- trading post ----------
  async function renderMarket(msg) {
    body.innerHTML = tabs() + `<p class="fnote">Loading…</p>`;
    let all;
    let raw;
    try { if (!friendIds.size) await listFriends(); [raw] = await Promise.all([marketList(), loadEconomy()]); }
    catch (e) { body.innerHTML = tabs() + `<p class="fnote">Couldn't reach the trading post. Check your internet.</p>`; return; }
    all = raw.filter(l => l.v === 2 && l.state === "open");
    const legacyMine = raw.filter(l => l.v !== 2 && l.seller === uid());
    const ITEMS = G.ITEMS, mine = all.filter(l => l.seller === uid());
    const forSale = all.filter(l => l.seller !== uid() && ITEMS[l.item]).sort((a, b) => (friendIds.has(b.seller) - friendIds.has(a.seller)) || b.at - a.at);
    let h = tabs() + `<p class="fnote">Trade verified goods with other farmers. The coins arrive the moment someone buys.</p>`
      + `<p class="fnote" id="mVerified">✅ Verified: <b>${canonEcon.coins} 🪙</b>${Object.keys(canonEcon.items).length ? " · " + Object.entries(canonEcon.items).map(([id, n]) => (ITEMS[id] ? ITEMS[id].e : id) + " " + n).join(" ") : ""}</p>`;
    h += `<h4>For sale</h4>` + (forSale.length ? forSale.slice(0, 20).map(L => row(`<span class="e">${ITEMS[L.item].e}</span><span class="who">${L.qty}× ${ITEMS[L.item].n}<small>${friendIds.has(L.seller) ? "👥 " : "👤 "}${esc(L.sellerName)}</small></span><button class="btn gold sm" data-buy="${L.id}">${L.price} 🪙</button>`)).join("")
      : `<p class="fnote">Nothing for sale right now.</p>`);
    if (legacyMine.length) h += `<h4>From before verified trading</h4><p class="fnote">These used this phone's coins and barn. Take them back to this phone.</p>` + legacyMine.map(L => row(`<span class="e">${ITEMS[L.item] ? ITEMS[L.item].e : "📦"}</span><span class="who">${L.qty}× ${ITEMS[L.item] ? ITEMS[L.item].n : esc(L.item)}<small>${L.buyer ? "sold: " + L.price + " phone 🪙 to collect" : "unsold"}</small></span><button class="btn plain sm" data-legacy-back="${L.id}">${L.buyer ? "Collect" : "Take back"}</button>`)).join("");
    h += `<h4>Your stand (${mine.length}/${MAX_LISTINGS})</h4>` + mine.map(L => row(`<span class="e">${ITEMS[L.item].e}</span><span class="who">${L.qty}× ${ITEMS[L.item].n}<small>${L.price} 🪙 · waiting for a buyer</small></span><button class="frm" data-back="${L.id}" aria-label="Take it back">✕</button>`)).join("");
    if (mine.length < MAX_LISTINGS) {
      const ids = Object.keys(ITEMS).filter(id => vHave(id) > 0);
      if (!sell || !vHave(sell.id)) sell = ids.length ? {id:ids[0], qty:1} : null;
      if (sell) {
        const pr = G.marketPrice(sell.id), q = Math.min(sell.qty, vHave(sell.id), 10); sell.qty = q;
        sell.price = Math.min(Math.max(sell.price || pr.base * q, pr.min * q), pr.max * q);
        h += `<div class="sellform slot"><select id="mItem">${ids.map(id => `<option value="${id}" ${id === sell.id ? "selected" : ""}>${ITEMS[id].e} ${ITEMS[id].n} (${vHave(id)})</option>`).join("")}</select>
          <div class="frow"><span>Amount</span><button class="btn plain sm" data-q="-1">−</button><b>${q}</b><button class="btn plain sm" data-q="1">+</button></div>
          <div class="frow"><span>Price</span><button class="btn plain sm" data-pr="-1">−</button><b>${sell.price} 🪙</b><button class="btn plain sm" data-pr="1">+</button></div>
          <button class="btn gold" data-list="1">Put up for sale</button>
          <button class="btn plain sm" data-sellnow="1">Or sell now to the market: ${ITEMS[sell.id].p * q} 🪙</button></div>`;
      } else h += `<p class="fnote">No verified goods yet. Verified harvests can be sold here.</p>`;
    }
    body.innerHTML = h + `<p class="fmsg" id="fMsg">${msg ? esc(msg) : ""}</p>`;
    market = {all, raw};
  }
  let market = {all:[]};
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
  box.addEventListener("change", (e) => { if (e.target.id === "mItem") { sell = {id:e.target.value, qty:1}; renderMarket(); } });
  box.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const d = b.dataset;
    if (d.f === "close") return open(false);
    if (d.f === "account") { open(false); if (window.saAuth.upgrade) window.saAuth.upgrade(); return; }
    if (d.tab) { tab = d.tab; G.sfx("tick"); return render(); }
    if (d.by) { boardBy = d.by; return renderBoard(); }
    if (d.add) { b.disabled = true; try { await addFriend({uid:d.add, name:d.name}); b.textContent = "✔ Added"; G.sfx("pop"); renderList(); } catch (err) { b.disabled = false; say("Couldn't add them. Try again."); } }
    if (d.remove) { try { await removeFriend(d.remove); renderList(); } catch (err) { say("Couldn't remove them. Try again."); } }
    if (d.visit) {
      b.disabled = true; b.textContent = "Loading…";
      try {
        const got = await fetchFarm(d.visit);
        if (!got) { say(`${d.name} hasn't shared their farm yet. It appears once they open the game.`); b.disabled = false; b.textContent = "👀 Visit"; return; }
        open(false); visitingUid = d.visit; hooks.enterVisit(got.farm, got.name || d.name);
      } catch (err) { say("Couldn't load their farm. Check your internet."); b.disabled = false; b.textContent = "👀 Visit"; }
    }
    // trading post
    if (d.q && sell) { sell.qty = Math.max(1, Math.min(10, vHave(sell.id), sell.qty + +d.q)); sell.price = null; G.sfx("tick"); return renderMarket(); }
    if (d.pr && sell) { const pr = G.marketPrice(sell.id); sell.price = Math.min(pr.max * sell.qty, Math.max(pr.min * sell.qty, sell.price + +d.pr * Math.max(1, Math.round(pr.base * sell.qty * .1)))); G.sfx("tick"); return renderMarket(); }
    if (d.list && sell) { b.disabled = true; try { await listForSale(sell.id, sell.qty, sell.price); G.sfx("place"); sell = null; renderMarket("Up for sale! The coins arrive the moment someone buys it."); } catch (err) { renderMarket(err.message); } }
    if (d.buy) { const L = market.all.find(x => x.id === d.buy); if (!L) return; b.disabled = true; try { if (await buyListing(L)) renderMarket("Bought! It's in your verified goods."); else b.disabled = false; } catch (err) { renderMarket(err.message || "Couldn't buy it."); } }
    if (d.sellnow && sell) { b.disabled = true; try { const r = await sellNow(sell.id, sell.qty); G.sfx("coin"); sell = null; renderMarket("Sold for " + r.coins + " verified 🪙."); } catch (err) { renderMarket(err.message); } }
    if (d.legacyBack) { const L = (market.raw || []).find(x => x.id === d.legacyBack); if (!L) return; b.disabled = true; try { await legacyBack(L); renderMarket("Back on this phone."); } catch (err) { renderMarket(err.message); } }
    if (d.back) { const L = market.all.find(x => x.id === d.back); if (!L) return; b.disabled = true; try { await takeBack(L); renderMarket(); } catch (err) { renderMarket("Couldn't take it back. Check your internet."); } }
  });
  function open(on) { box.hidden = !on; if (on) { G.close(); render(); } }
  $("friendsBtn").addEventListener("click", () => open(true));
  addEventListener("keydown", (e) => { if (e.code === "Escape" && !box.hidden) open(false); });
  addEventListener("sa3d:leftvisit", () => { visitingUid = null; });
  return {open, searchPlayers, addFriend, listFriends, fetchFarm, claimUsername, publishShowcase, water:waterForFriend, receiveHelp, marketList, buyListing, loadEconomy};
}
