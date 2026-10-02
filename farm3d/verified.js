// Sunny Acres 3D, Phase 7I: the VERIFIED FIELD.
//
// Six extra plots (p0..p5) whose crops live on the server, not on this phone. Harvests here become VERIFIED goods:
// the only goods (and, once sold, the only coins) that can be traded at the trading post. The normal farm is untouched:
// its fields, barn, orders, feed and recipes keep working exactly as before and can never create verified goods.
//
// - Planting needs a connection (economyAct "plant"). Its price: 1 verified crop of that kind, otherwise its seed price
//   in verified coins. A brand-new account's first wheat is free (once ever, decided by the server).
// - Growing uses the server's clock and each crop's base time. Watering, weather and perks do not apply here.
// - Picking a ready crop works offline too: it is kept on this phone and checked by the server when the connection is
//   back (canon.js). Until then it shows as "checking" and can't be sold.
// Server documents read here (rules: your own only): plots/{uid}/items/{plotId}, economy/{uid}.
import {createCanon} from "./canon.js?v=1";

const PLOTS = ["p0", "p1", "p2", "p3", "p4", "p5"];
const SAY = {OFFLINE:"Planting needs an internet connection.", NETWORK:"Couldn't reach the farm server. Try again in a moment.",
  NOT_ENOUGH_TO_PLANT:"Not enough verified goods or coins for those seeds.", PLOT_NOT_EMPTY:"Something is already growing there.",
  BAD_CROP:"That crop can't grow here."};

export function initVerified(G) {
  const $ = (id) => document.getElementById(id);
  const box = $("vfieldBox"), body = $("vfieldBody"), btn = $("verifiedBtn");
  if (!box || !body || !btn) return null;
  const fb = () => (window.saAuth && window.saAuth.fb && window.saAuth.user ? window.saAuth.fb : null);
  const uid = () => window.saAuth.user.uid;
  let who = null, canon = null, plots = {}, econ = {coins:0, items:{}, meta:{}}, unsub = [], skew = 0, picking = null, msg = "";

  function attach() {
    const f = fb(), id = f ? uid() : null;
    if (id === who) return;
    for (const u of unsub) u(); unsub = []; plots = {}; econ = {coins:0, items:{}, meta:{}}; canon = null; who = id;
    btn.hidden = !id; if (!id) { box.hidden = true; return; }
    canon = createCanon({call:f.call, storage:localStorage, uid:id, online:() => navigator.onLine, onChange:draw});
    unsub.push(f.F.onSnapshot(f.F.collection(f.db, "plots", id, "items"), (snap) => { plots = {}; snap.forEach(d => { plots[d.id] = d.data(); }); draw(); }, () => {}));
    unsub.push(f.F.onSnapshot(f.F.doc(f.db, "economy", id), (d) => { econ = d.exists() ? {coins:d.data().coins || 0, items:d.data().items || {}, meta:d.data().meta || {}} : {coins:0, items:{}, meta:{}}; draw(); }, () => {}));
    if (canon.queue().length) canon.flush().then(report);
  }
  setInterval(attach, 2000);
  addEventListener("online", () => { if (canon) canon.flush().then(report); draw(); });
  addEventListener("offline", draw);
  let lastFlush = 0;
  setInterval(() => {
    if (!box.hidden) draw();
    if (canon && navigator.onLine && canon.queue().length && Date.now() - lastFlush > 5000) { lastFlush = Date.now(); canon.flush().then(report); }
  }, 1000);

  const serverNow = () => Date.now() + skew;
  const item = (id) => G.ITEMS[id] || {e:"🌱", n:id};
  const bootstrapFree = () => !econ.meta.bootstrapUsed && !(econ.meta.harvests > 0);
  function costOf(crop) {
    if (crop === "wheat" && bootstrapFree()) return {label:"free (first planting)", ok:true};
    if ((econ.items[crop] || 0) > 0) return {label:"1 " + item(crop).e, ok:true};
    const c = G.CROPS[crop].seed; return {label:c + " 🪙", ok:econ.coins >= c};
  }
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 60 ? Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s" : s + "s"; };

  function draw() {
    if (box.hidden || !who) return;
    const online = navigator.onLine, waiting = canon ? canon.queue() : [];
    const goods = Object.entries(econ.items).map(([id, n]) => item(id).e + " " + n).join("  ");
    let h = `<p class="fnote vstatus ${online ? "on" : "off"}">${online ? "🟢 Online" : "📴 Offline"} · Crops here are checked by the farm server. Their harvest is verified: you can trade it.</p>`
      + `<p class="fnote" id="vGoods">✅ Verified: <b>${econ.coins} 🪙</b>${goods ? " · " + goods : ""}</p><div class="vgrid">`;
    for (const id of PLOTS) {
      const p = plots[id], q = waiting.find(w => w.plotId === id && p && w.generation === p.generation);
      if (p && p.state === "growing") {
        const left = p.matureAt - serverNow(), total = p.matureAt - p.plantedAt, e = item(p.crop).e;
        if (q) h += `<div class="vplot picked" data-vplot="${id}"><span class="ve">${e}</span><small>Picked ✓<br>checking…</small></div>`;
        else if (left <= 0) h += `<div class="vplot ready" data-vplot="${id}"><span class="ve">${e}</span><button class="btn gold sm" data-vharvest="${id}">Harvest</button></div>`;
        else h += `<div class="vplot" data-vplot="${id}"><span class="ve">${e}</span><small>${mmss(left)}</small><div class="bar"><i style="width:${Math.min(100, 100 * (1 - left / total)).toFixed(0)}%"></i></div></div>`;
      } else h += `<div class="vplot empty" data-vplot="${id}"><button class="btn plain sm" data-vplant="${id}" ${online ? "" : "disabled"}>${online ? "🌱 Plant" : "📴"}</button></div>`;
    }
    h += `</div>`;
    if (picking) {
      h += `<h4>Plant in field ${PLOTS.indexOf(picking) + 1}</h4><div class="vseeds">` + Object.keys(G.CROPS).map(c => { const k = costOf(c);
        return `<button class="btn ${k.ok ? "" : "plain"} sm" data-vseed="${c}" ${k.ok && online ? "" : "disabled"}>${item(c).e} ${item(c).n}<small> · ${k.label} · ${mmss(G.CROPS[c].time * 1000)}</small></button>`; }).join("") + `</div>`;
    }
    if (waiting.length) h += `<p class="fnote">🕓 ${waiting.length} harvest${waiting.length > 1 ? "s" : ""} waiting to be checked${online ? "…" : " (when you're back online)"}.</p>`;
    body.innerHTML = h + `<p class="fmsg" id="vMsg">${msg}</p>`;
  }
  const say = (t) => { msg = t || ""; draw(); };
  function report(r) {
    if (!r) return;
    for (const h of r.confirmed) if (!h.detail.replay) { G.toast("✅ +" + Object.values(h.detail.granted)[0] + " " + item(h.crop).e + " verified"); G.sfx("harvest"); }
    for (const h of r.dropped) say("That harvest couldn't be checked (" + h.detail + "), so it was not added.");
    draw();
  }

  box.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const d = b.dataset;
    if (d.v === "close") return open(false);
    if (d.vplant) { picking = picking === d.vplant ? null : d.vplant; msg = ""; return draw(); }
    if (d.vseed && picking) {
      const id = picking; b.disabled = true;
      const r = await canon.plant(id, d.vseed);
      if (r.ok) { skew = r.plot.plantedAt - Date.now(); picking = null; G.sfx("plant"); say(r.plot.paid.bootstrap ? "Planted! Your first wheat is on the house." : "Planted!"); }
      else say(SAY[r.reason] || "Couldn't plant (" + r.reason + ").");
    }
    if (d.vharvest) {
      const p = plots[d.vharvest]; if (!p) return; b.disabled = true;
      const r = await canon.harvest(d.vharvest, p.generation, p.crop);
      if (!navigator.onLine || r.waiting.length) say(navigator.onLine ? "Almost ready: it'll be checked again in a moment." : "Picked! It'll be checked when you're back online.");
      report(r);
    }
  });
  function open(on) { box.hidden = !on; if (on) { G.close(); msg = ""; draw(); } }
  btn.addEventListener("click", () => open(true));
  addEventListener("keydown", (e) => { if (e.code === "Escape" && !box.hidden) open(false); });
  return {open, flush:() => canon && canon.flush()};
}
