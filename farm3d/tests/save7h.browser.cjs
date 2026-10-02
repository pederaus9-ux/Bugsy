// Phase 7H: old-save fixtures and save measurements.
// 1. Every fixture in fixtures/saves opens in today's game with no page errors, keeps its progress, and survives
//    save -> reload unchanged (the upgrade is stable). The 2D save goes through the "Bring my farm" import.
// 2. Measures save size and the cost of JSON.stringify / localStorage.setItem / JSON.parse for a normal, the
//    test (sandbox) and an extra-heavy farm, plus how often an idle farm saves.
// Results: artifacts/save7h.json. Findings that are real but not yet fixed are reported as NOTE, not failures.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const {start, artifacts, root} = require('./browser-harness.cjs');

const fixtures = path.join(__dirname, 'fixtures', 'saves');
const SAVE_KEY = 'sunny-acres-3d-v1';
const results = [], notes = [];
const pass = (name, detail = '') => { results.push({name, status: 'PASS', detail}); console.log('PASS', name, detail); };
const note = (name, detail = '') => { notes.push({name, detail}); console.log('NOTE', name, detail); };
const load = (f) => JSON.parse(fs.readFileSync(path.join(fixtures, f), 'utf8'));

async function seed(page, items) {
  // fill localStorage once for this browser context, before any game script runs (later reloads keep what the game saved)
  await page.addInitScript((it) => {
    if (sessionStorage.getItem('__seeded')) return;
    localStorage.clear();
    for (const [k, v] of Object.entries(it)) localStorage.setItem(k, v);
    sessionStorage.setItem('__seeded', '1');
  }, items);
}
async function boot(page, base, query = '?debug') {
  await page.goto(base + 'farm3d/' + query, {waitUntil: 'load'});
  await page.waitForFunction(() => window.__dbg && !document.getElementById('loading'), {}, {timeout: 120000});
}
const pick = (page) => page.evaluate(() => {
  const S = __dbg.G.S;
  return {coins: S.coins, gems: S.gems, level: S.level, xp: S.xp, v: S.v, wheat: S.barn && S.barn.wheat, plots: S.plots.length,
    crops: S.plots.filter(p => p.crop).length, chickens: S.pens.chicken.list.length, horsePen: !!S.pens.horse, pets: S.pets.length,
    placed: S.decor.placed.length, buildings: Object.keys(S.buildings).length, harvests: S.stats.harvests, owed: S.perks.owed,
    types: {coins: typeof S.coins, gems: typeof S.gems, sprinklers: typeof S.sprinklers, orders: Array.isArray(S.orders), streak: typeof S.streak}};
});
// paths that differ between two saves, ignoring timestamps (numbers after 2020) that move on their own
function diff(a, b, at = '') {
  const isTime = (v) => typeof v === 'number' && v > 1.6e12;
  if (isTime(a) && isTime(b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return JSON.stringify(a) === JSON.stringify(b) ? [] : [at || '/'];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]), out = [];
  for (const k of keys) out.push(...diff(a[k], b[k], at + '/' + k));
  return out;
}
const errorsOf = (session) => session.errors.filter(e => !/gstatic|firebase|Failed to load module script|net::ERR|fonts\.googleapis/i.test(e));

(async () => {
  const harness = await start();
  const out = {fixtures: {}, measure: {}, probes: {}};
  let failed = false;
  try {
    // ---------------- 1. old saves
    for (const f of fs.readdirSync(fixtures).filter(f => f.endsWith('.json')).sort()) {
      const fx = load(f), s = harness.setup({width: 844, height: 390}, false, 'save7h-' + f.replace('.json', ''));
      const session = await s, page = session.page;
      await seed(page, {[fx.key]: JSON.stringify(fx.save), 'sa3d-guest': '1', 'sa3d-seen': '1'});
      await boot(page, harness.base);
      if (fx.key !== SAVE_KEY) { // the 2D farm: the game offers to bring it over
        await page.waitForSelector('[data-act="import2d"]', {timeout: 30000});
        await page.click('[data-act="import2d"]');
        await page.waitForFunction(() => __dbg.G.S.level > 1, {}, {timeout: 15000});
      }
      const first = await pick(page);
      assert.deepEqual(errorsOf(session), [], f + ' page errors');
      const raw = await page.evaluate(() => { __dbg.G.save(); return localStorage.getItem('sunny-acres-3d-v1'); });
      assert.ok(raw && JSON.parse(raw).v === 1, f + ' saves back as v1 JSON');
      await page.reload({waitUntil: 'load'});
      await page.waitForFunction(() => window.__dbg && !document.getElementById('loading'), {}, {timeout: 120000});
      const second = await pick(page);
      const raw2 = await page.evaluate(() => { __dbg.G.save(); return localStorage.getItem('sunny-acres-3d-v1'); });
      const strip = (r) => { const o = JSON.parse(r); delete o.lastSeen; delete o.orders; delete o.nextEventAt; delete o.event; delete o.quests; delete o.visitor; delete o.nextVisitorAt; delete o.rush; delete o.nextRushAt; delete o.lastNag; return JSON.stringify(o); };
      const drift = diff(JSON.parse(strip(raw)), JSON.parse(strip(raw2)));
      assert.deepEqual(drift, [], f + ' changed across save -> reload -> save (timestamps ignored): ' + drift.slice(0, 8).join(', '));
      assert.deepEqual(errorsOf(session), [], f + ' page errors after reload');
      out.fixtures[f] = {first, second, bytes: raw.length};
      if (f.startsWith('3d-v1-first') || f.startsWith('2d')) {
        const e = fx.save;
        assert.equal(first.level, e.level); assert.equal(first.coins, e.coins); assert.equal(first.wheat, e.barn.wheat);
        assert.equal(first.plots, e.plots.length); assert.equal(first.chickens, e.pens.chicken.list.length);
        assert.equal(first.harvests, e.stats.harvests); assert.ok(first.horsePen, 'horse pen added');
        assert.equal(first.placed, 1, 'unknown decoration dropped, known one kept');
        assert.equal(first.buildings, 6, 'every building present');
        assert.equal(first.owed, 1, 'level 6 farm from before perks gets one pick');
        pass(f + ' opens, keeps progress and is stable', `level ${first.level}, ${first.coins} coins, ${first.plots} fields, ${raw.length} bytes`);
      } else {
        assert.equal(first.coins, 120, 'coins "120" repaired to the number 120');
        assert.equal(first.types.gems, 'number', 'gems repaired to a number');
        assert.equal(first.types.streak, 'object', 'streak repaired');
        pass(f + ' opens, is repaired (F3) and is stable', JSON.stringify(first.types) + ', coins ' + first.coins);
      }
      await session.finish();
    }

    // ---------------- 1b. risk probes (recorded as NOTE: these document today's behavior, they don't fail the suite)
    {
      // F1: a save that can't be read at all (cut off mid-write, or edited by hand)
      const session = await harness.setup({width: 844, height: 390}, false, 'save7h-probe-unreadable'), page = session.page;
      const broken = JSON.stringify(load('3d-v1-first-release.json').save).slice(0, 900); // a save cut off part way
      await seed(page, {[SAVE_KEY]: broken, 'sa3d-guest': '1', 'sa3d-seen': '1'});
      await boot(page, harness.base);
      await page.waitForFunction(() => document.body.textContent.includes("couldn't be read"), {}, {timeout: 10000});
      const after = await page.evaluate((k) => { __dbg.G.save(); return {level: __dbg.G.S.level, copy: localStorage.getItem(k + '-unreadable'), recover: localStorage.getItem('sa3d-recover')}; }, SAVE_KEY);
      out.probes.unreadable = {level: after.level, copyKept: after.copy === broken, recoverFlag: after.recover};
      assert.equal(after.copy, broken, 'the unreadable save is kept, byte for byte');
      assert.equal(after.recover, null, 'a guest farm (no account) does not ask for cloud recovery');
      pass('F1 unreadable save: a copy is kept and the player is told', 'new farm at level ' + after.level + ', copy under ' + SAVE_KEY + '-unreadable');
      // and the copy is never overwritten by a second bad save
      await page.evaluate((k) => localStorage.setItem(k, '{also broken'), SAVE_KEY);
      await page.reload({waitUntil: 'load'}); await page.waitForFunction(() => window.__dbg && !document.getElementById('loading'), {}, {timeout: 120000});
      assert.equal(await page.evaluate((k) => localStorage.getItem(k + '-unreadable'), SAVE_KEY), broken, 'the first kept copy is not replaced');
      pass('F1 the first kept copy is never replaced');
      await session.finish();
    }
    {
      // F6: a save that mentions an item the game no longer has (as would happen if an item were ever renamed or removed)
      const session = await harness.setup({width: 844, height: 390}, false, 'save7h-probe-unknown-item'), page = session.page;
      const fx = load('3d-v1-first-release.json').save; fx.stand.list[1] = {id: 'old_item', qty: 1, price: 5, sellAt: 9e15}; fx.barn.old_item = 2; fx.orders.push({items: {old_item: 1}, coins: 9, xp: 1, gem: 0});
      await seed(page, {[SAVE_KEY]: JSON.stringify(fx), 'sa3d-guest': '1', 'sa3d-seen': '1'});
      await page.goto(harness.base + 'farm3d/?debug', {waitUntil: 'load'});
      const started = await page.waitForFunction(() => window.__dbg && !document.getElementById('loading'), {}, {timeout: 60000}).then(() => true, () => false);
      out.probes.unknownItem = {started, errors: session.errors.slice(0, 2)};
      assert.ok(started, 'a save with an unknown item still starts: ' + (session.errors[0] || ''));
      const left = await page.evaluate(() => { const S = __dbg.G.S; return {barn: 'old_item' in S.barn, stand: S.stand.list.some(L => L && L.id === 'old_item'), orders: S.orders.some(o => o.items && 'old_item' in o.items), bread: S.stand.list[0] && S.stand.list[0].id}; });
      assert.deepEqual([left.barn, left.stand, left.orders], [false, false, false], 'unknown item removed from barn, stand and orders');
      assert.equal(left.bread, 'bread', 'known stand item kept');
      assert.deepEqual(errorsOf(session), [], 'no page errors');
      pass('F6 a save with an unknown item starts; the unknown item is removed, everything else kept');
      await session.finish();
    }
    {
      // F1 for an account: the stand-in farm must never be uploaded; auth.js brings the cloud farm back (emulator flow covers the cloud side)
      const session = await harness.setup({width: 844, height: 390}, false, 'save7h-probe-unreadable-account'), page = session.page;
      await seed(page, {[SAVE_KEY]: '{"v":1,"coins":5', 'sa3d-save-owner': 'acct123', 'sa3d-seen': '1', 'sa3d-guest': '1'});
      await boot(page, harness.base);
      assert.equal(await page.evaluate(() => localStorage.getItem('sa3d-recover')), '1', 'an account farm asks for cloud recovery');
      pass('F1 an unreadable account farm marks itself for cloud recovery');
      await session.finish();
    }
    {
      // F4: a farm saved by a newer game version (opened by an older cached copy) is played but never written back older
      const session = await harness.setup({width: 844, height: 390}, false, 'save7h-probe-newer'), page = session.page;
      const fx = load('3d-v1-first-release.json').save; fx.v = 99;
      const raw = JSON.stringify(fx);
      await seed(page, {[SAVE_KEY]: raw, 'sa3d-guest': '1', 'sa3d-seen': '1'});
      await boot(page, harness.base);
      const r = await page.evaluate(() => { const G = __dbg.G; G.S.coins += 1; return {ok: G.save(), level: G.S.level}; });
      assert.equal(r.ok, false, 'save() refuses'); assert.equal(r.level, 6, 'the newer farm still opens');
      assert.equal(await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY), raw, 'the newer save is left exactly as it was');
      await page.waitForFunction(() => document.body.textContent.includes('newer version'), {}, {timeout: 10000});
      pass('F4 a newer save opens but is never written back by older code');
      await session.finish();
    }
    {
      // F2: storage full: save() reports it once, and saving works again when space is back
      const session = await harness.setup({width: 844, height: 390}, false, 'save7h-probe-quota'), page = session.page;
      await seed(page, {'sa3d-guest': '1', 'sa3d-seen': '1'});
      await boot(page, harness.base);
      const q = await page.evaluate(async () => {
        const G = __dbg.G, orig = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (k === 'sunny-acres-3d-v1') throw new DOMException('full', 'QuotaExceededError'); return orig.call(this, k, v); };
        const a = G.save(), b = G.save();
        await new Promise(r => setTimeout(r, 300));
        const warned = document.body.textContent.includes("isn't saving");
        Storage.prototype.setItem = orig;
        return {a, b, warned, c: G.save()};
      });
      assert.deepEqual([q.a, q.b, q.warned, q.c], [false, false, true, true]);
      assert.deepEqual(errorsOf(session), [], 'no page errors');
      pass('F2 storage full: save() fails visibly and recovers');
      await session.finish();
    }

    // ---------------- 2. measurements
    const session = await harness.setup({width: 844, height: 390}, false, 'save7h-measure'), page = session.page;
    await seed(page, {'sa3d-guest': '1', 'sa3d-seen': '1'});
    await boot(page, harness.base);
    out.measure = await page.evaluate(() => {
      const G = __dbg.G, time = (fn, n = 40) => { fn(); const t0 = performance.now(); for (let i = 0; i < n; i++) fn(); return (performance.now() - t0) / n; };
      const measure = (S) => {
        const raw = JSON.stringify(S);
        return {bytes: raw.length, stringifyMs: +time(() => JSON.stringify(S)).toFixed(3),
          setItemMs: +time(() => localStorage.setItem('__save7h', raw), 20).toFixed(3), parseMs: +time(() => JSON.parse(raw)).toFixed(3)};
      };
      const normal = measure(G.S);
      // the heaviest farm the game allows today, roughly: every field, every decoration, a full barn, every animal
      const H = JSON.parse(JSON.stringify(G.S)), t = Date.now();
      H.level = 60; H.plots = Array.from({length: 60}, (_, i) => ({crop: 'wheat', end: t + i * 1000, water: 1, fert: 1, soil: 80, soilAt: t, last: 'corn', dur: 60000}));
      H.barn = Object.fromEntries(Object.keys(G.ITEMS).map(k => [k, 99])); H.barnCap = 3000;
      H.decor.placed = Array.from({length: 200}, (_, i) => ({id: 'tulips', x: i % 40, y: Math.floor(i / 40), r: 0}));
      for (const k in H.pens) H.pens[k] = {owned: true, list: Array.from({length: 12}, () => t + 5000)};
      for (const k in H.buildings) H.buildings[k] = {owned: true, jobs: Array.from({length: 6}, () => ({item: 'bread', end: t + 9000}))};
      H.ach = Object.fromEntries(Array.from({length: 120}, (_, i) => ['a' + i, 3])); H.museum = Object.fromEntries(Array.from({length: 80}, (_, i) => ['m' + i, 1]));
      const heavy = measure(H);
      localStorage.removeItem('__save7h');
      let used = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); used += k.length + (localStorage.getItem(k) || '').length; }
      return {normal, heavy, localStorageChars: used};
    });
    // how often an idle farm writes its save, over 60 s
    out.measure.idle = await page.evaluate(async () => {
      let n = 0, ms = 0; const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) { const t0 = performance.now(); try { return orig.call(this, k, v); } finally { if (k === 'sunny-acres-3d-v1') { n++; ms += performance.now() - t0; } } };
      await new Promise(r => setTimeout(r, 60000));
      Storage.prototype.setItem = orig;
      return {savesPerMinute: n, setItemMsTotal: +ms.toFixed(2)};
    });
    await session.finish();
    const m = out.measure;
    pass('save measurements', `normal ${m.normal.bytes} B (stringify ${m.normal.stringifyMs} ms, setItem ${m.normal.setItemMs} ms, parse ${m.normal.parseMs} ms); ` +
      `heavy ${m.heavy.bytes} B (stringify ${m.heavy.stringifyMs} ms, setItem ${m.heavy.setItemMs} ms, parse ${m.heavy.parseMs} ms); idle saves/min ${m.idle.savesPerMinute}`);
    assert.ok(m.heavy.bytes < 900000, 'heavy farm fits the 900,000-character cloud limit in the Firestore rules');
    pass('heaviest farm fits the cloud-save size limit', m.heavy.bytes + ' of 900000 characters');
  } catch (e) { failed = true; console.error('FAIL', e.message); }
  fs.writeFileSync(path.join(artifacts, 'save7h.json'), JSON.stringify({results, notes, ...out}, null, 1));
  await harness.close(failed);
  process.exit(failed ? 1 : 0);
})();
