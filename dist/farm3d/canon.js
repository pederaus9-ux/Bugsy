// Sunny Acres 3D, Phase 7I: the device side of the canonical (server-verified) farm economy.
//
// The server (Cloud Function economyAct) is the only authority for canonical coins, items and verified plots. This
// module only asks it to act, and keeps the one thing that may wait for a connection: HARVESTS of crops the server has
// already accepted as planted. Everything else (planting, selling, buying) needs to be online, and is refused here
// straight away when offline. Nothing is queued behind a provisional harvest.
//
//   const canon = createCanon({call, storage: localStorage, uid, online: () => navigator.onLine});
//   await canon.plant("p0", "wheat")             -> {ok:true, plot} | {ok:false, reason}
//   canon.harvest("p0", 1, "wheat")              -> queues it; the grant is PROVISIONAL until the server accepts it
//   await canon.flush()                          -> sends the queue: accepted/replayed -> confirmed, refused -> dropped
//   canon.provisional()                          -> {wheat: 2, ...} still waiting for the server (shown, never spendable)
//   await canon.sell("wheat", 2)                 -> online only; offline it does nothing and nothing is queued
//
// call(data) must perform the callable (httpsCallable(functions, "economyAct")) and resolve to its result, or reject
// with {details: {reason}} for a refusal, or with any other error when the network is down.

const QUEUE = "sa3d-canon-harvests-";   // + uid: [{plotId, generation, crop, at}]
const PLANTING = "sa3d-canon-plant-";   // + uid: {plotId, crop, requestId} for a planting not yet answered (retried with the same id)
// refusals that will never change for that harvest: drop the provisional grant
const FINAL = new Set(["NO_SUCH_GENERATION", "ALREADY_HARVESTED", "WRONG_CROP", "BAD_PLOT", "BAD_GENERATION", "BAD_CROP", "UNKNOWN_OP"]);
// refusals that can change with time: keep it queued and try later
const LATER = new Set(["NOT_MATURE_YET"]);

const newId = () => (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).replace(/[^a-z0-9]/g, "").slice(0, 32);
const reasonOf = (e) => (e && e.details && e.details.reason) || (e && e.reason) || null;

export function createCanon({call, storage, uid, online = () => true, onChange = () => {}}) {
  if (!uid) throw new Error("createCanon needs the signed-in account");
  const read = (k, d) => { try { const v = storage.getItem(k + uid); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const write = (k, v) => { try { if (v == null) storage.removeItem(k + uid); else storage.setItem(k + uid, JSON.stringify(v)); } catch (e) {} };
  let flushing = null;

  async function plant(plotId, crop) {
    if (!online()) return {ok: false, reason: "OFFLINE"};
    // a planting that got no answer (connection dropped) is re-sent with the SAME request id: the server returns the
    // original result instead of planting twice
    let p = read(PLANTING, null);
    if (!p || p.plotId !== plotId || p.crop !== crop) { p = {plotId, crop, requestId: newId()}; write(PLANTING, p); }
    try {
      const plot = await call({op: "plant", plotId, crop, requestId: p.requestId});
      write(PLANTING, null); onChange(); return {ok: true, plot};
    } catch (e) {
      const reason = reasonOf(e);
      if (reason) write(PLANTING, null); // a refusal is an answer: the next try is a new request
      return {ok: false, reason: reason || "NETWORK"};
    }
  }

  // Selling verified goods to the game needs a connection and is never queued (a provisional harvest can't be sold).
  async function sell(item, qty) {
    if (!online()) return {ok: false, reason: "OFFLINE"};
    try { const r = await call({op: "sell", item, qty, requestId: newId()}); onChange(); return {ok: true, sale: r}; }
    catch (e) { return {ok: false, reason: reasonOf(e) || "NETWORK"}; }
  }

  function harvest(plotId, generation, crop) {
    const q = read(QUEUE, []);
    if (!q.some(h => h.plotId === plotId && h.generation === generation)) q.push({plotId, generation, crop, at: Date.now()});
    write(QUEUE, q); onChange();
    return flush();
  }

  function provisional() {
    const out = {};
    for (const h of read(QUEUE, [])) out[h.crop] = (out[h.crop] || 0) + 2;
    return out;
  }

  // Sends every queued harvest once. Accepted or replayed: confirmed. Refused for good: dropped (its provisional grant
  // disappears). Not mature yet, or no connection: stays queued for the next flush.
  function flush() {
    if (flushing) return flushing;
    flushing = (async () => {
      const done = {confirmed: [], dropped: [], waiting: []};
      if (!online()) { done.waiting = read(QUEUE, []); return done; }
      for (const h of read(QUEUE, [])) {
        let outcome = "waiting", detail = null;
        try { detail = await call({op: "harvest", plotId: h.plotId, generation: h.generation, crop: h.crop}); outcome = "confirmed"; }
        catch (e) { const r = reasonOf(e); detail = r; outcome = r && FINAL.has(r) ? "dropped" : "waiting"; } // LATER reasons and network errors wait
        if (outcome !== "waiting") write(QUEUE, read(QUEUE, []).filter(x => !(x.plotId === h.plotId && x.generation === h.generation)));
        done[outcome].push({...h, detail});
      }
      if (done.confirmed.length || done.dropped.length) onChange();
      return done;
    })().finally(() => { flushing = null; });
    return flushing;
  }

  return {plant, harvest, sell, flush, provisional, queue: () => read(QUEUE, [])};
}
