// Phase 7H recovery invariant, against the Firestore + Auth emulators with the real game code (game.js, auth.js):
//
//   A damaged/unreadable save on the phone must NEVER overwrite a known-good cloud save.
//
// How it's proved (not "coins look right at the end"):
// - the good cloud farm carries a unique random sentinel; the stand-in farm the game opens in its place can't have it
// - the damage is written "at rest" by an init script before any game script runs on the next load (no __saHold tricks)
// - every farms/ write the page SENDS is captured (emu-harness farmWrites); a stand-in write is a violation even if
//   the server would refuse it
// - the cloud doc is sampled every second through each window, well past auth.js's 15 s upload delay
// - page loads are counted exactly, so a reload loop can't drift into a good state and pass
// Every page's console goes to artifacts/console-<phone>.log with timestamps. REPEAT=n repeats scenario 1 n times.
const fs = require('fs');
const path = require('path');
const {startEmu, readDoc, resetEmulators, fsUrl, artifacts, loads} = require('./emu-harness.cjs');
const {startRecoveryTiming} = require('./recovery-timing.cjs');

// A30 timing-only: bounded event records, no page state writes or renderer release.
async function beginQuotaTiming(page) {
  const clock = require('node:perf_hooks').performance, started = clock.now(), rows = [];
  let dropped = 0;
  const mark = (event, detail = {}) => {
    if (rows.length < 2048) rows.push({event, ms: clock.now() - started, utc: new Date().toISOString(), ...detail});
    else dropped++;
  };
  const relevant = url => /^http:\/\/127\.0\.0\.1:(8085|9099)\//.test(url);
  const safeUrl = url => { const u = new URL(url); return u.origin + u.pathname; };
  const listeners = [];
  const listen = (event, handler) => { page.on(event, handler); listeners.push([event, handler]); };
  listen('request', r => { if (r.isNavigationRequest() || relevant(r.url())) mark('request', {url: safeUrl(r.url()), method: r.method(), navigation: r.isNavigationRequest()}); });
  listen('response', r => { if (r.request().isNavigationRequest() || relevant(r.url())) mark('response', {url: safeUrl(r.url()), status: r.status()}); });
  listen('requestfailed', r => { if (r.isNavigationRequest() || relevant(r.url())) mark('request-failed', {url: safeUrl(r.url()), reason: r.failure()?.errorText}); });
  listen('framenavigated', f => { if (f === page.mainFrame()) mark('document-commit'); });
  listen('domcontentloaded', () => mark('dom-content-loaded'));
  listen('load', () => mark('document-load'));
  listen('console', m => { if (m.text().includes("Couldn't put the cloud farm on this phone")) mark('playwright-refusal-delivery'); });
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Runtime.consoleAPICalled', e => {
    if (e.args.some(a => typeof a.value === 'string' && a.value.includes("Couldn't put the cloud farm on this phone")))
      mark('cdp-refusal-delivery', {browserEpochMs: e.timestamp});
  });
  await cdp.send('Runtime.enable');
  mark('observer-ready');
  const flush = () => fs.writeFileSync(path.join(artifacts, 'quota-timing.jsonl'), rows.concat({event: 'record-count', count: rows.length, dropped}).map(r => JSON.stringify(r)).join('\n') + '\n');
  return {mark, flush, async finish() {
    for (const [event, handler] of listeners) page.off(event, handler);
    try { await cdp.detach(); } catch (e) { mark('diagnostic-detach-after-close', {message: e.message}); }
    mark('observer-finished'); flush();
  }};
}

const SAVE_KEY = 'sunny-acres-3d-v1';
const results = [];
const check = (name, cond, detail = '') => { results.push({name, ok: !!cond, detail}); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };
const cloud = async (uid) => { const d = await readDoc('farms/' + uid); return d ? {save: d.save, rev: d.rev} : null; };
const restWrite = (uid, save, rev) => fetch(fsUrl('farms/' + uid), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'},
  body: JSON.stringify({fields: {save: {stringValue: save}, level: {integerValue: '3'}, coins: {integerValue: '1'}, rev: {integerValue: String(rev)}, updatedAt: {integerValue: String(Date.now())}}})});
const restDelete = (uid) => fetch(fsUrl('farms/' + uid), {method: 'DELETE', headers: {Authorization: 'Bearer owner'}});
// the farm's real progress (the game re-saves a restored farm straight away with a new lastSeen and orders, so the phone
// copy is compared on this; the CLOUD copy is compared byte for byte)
const cowProgress=o=>{const c=o.pens?.cow?.care;return c?[c.feed,c.waterUntil,c.tank,c.queue,c.job,c.receipts,c.cows.map(b=>[b.id,b.cycle,b.ready]),o.gold?.milk,o.decor]:null;};
const progress = (raw) => { try { const o = JSON.parse(raw); return JSON.stringify([o.__sentinel, o.level, o.xp, o.coins, o.gems, o.barn, o.plots && o.plots.length, o.stats,cowProgress(o),o.layout?.animalPens,o.pens?.horse,o.v]); } catch (e) { return 'unreadable'; } };
const has = (save, token) => typeof save === 'string' && save.includes('"__sentinel":"' + token + '"');

async function main() {
  for (const f of fs.existsSync(artifacts) ? fs.readdirSync(artifacts).filter(f => f.startsWith('console-')) : []) fs.unlinkSync(path.join(artifacts, f));
  await resetEmulators();
  const E = await startEmu(), {P} = E;
  const g = await E.phone('grandma');
  const st = () => P(g, (k) => ({sentinel: window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel, level: window.__dbg && window.__dbg.G.S.level,
    coins: window.__dbg && window.__dbg.G.S.coins, recover: localStorage.getItem('sa3d-recover'), sync: localStorage.getItem('sa3d-sync-rev'),
    boot:localStorage.getItem('sa3d-boot'),ready:!!window.__ready,navigation:performance.getEntriesByType('navigation').map(n=>({duration:n.duration,dom:n.domContentLoadedEventEnd,load:n.loadEventEnd})),kept: localStorage.getItem(k + '-unreadable'), raw: localStorage.getItem(k), user: window.saAuth && window.saAuth.user && window.saAuth.user.email}), SAVE_KEY);
  const loaded = (pred, arg, timeout = 180000) => g.page.waitForFunction(pred, arg, {timeout, polling: 250}).then(() => true, () => false);
  const gameUp = () => loaded(() => window.__ready && window.__dbg && window.__dbg.G.S && window.saAuth && window.saAuth.user);
  // give the farm a fresh sentinel and wait until the cloud holds exactly this phone's save, with nothing pending
  async function establish(uid, tag) {
    const token = tag + '-' + Math.random().toString(36).slice(2, 10);
    await P(g, (t) => { const G = window.__dbg.G; G.S.__sentinel = t; G.S.xp += 1; G.commit(); }, token);
    for (let i = 0; i < 60; i++) {
      const c = await cloud(uid), s = await st();
      if (c && has(c.save, token) && c.save === s.raw && !(await P(g, () => localStorage.getItem('sa3d-dirty')))) return {token, save: c.save, rev: c.rev};
      await g.page.waitForTimeout(1000);
    }
    throw new Error('the cloud never settled on the sentinel save ' + token);
  }
  // sample the cloud doc every second for ms: every sample must satisfy ok(sample)
  async function watch(uid, ms, ok) { const bad = [], t0 = Date.now(); while (Date.now() - t0 < ms) { const c = await cloud(uid); if (!ok(c)) bad.push({t: ((Date.now() - t0) / 1000).toFixed(0) + 's', rev: c && c.rev, save: c && c.save.slice(0, 50)}); await new Promise(r => setTimeout(r, 1000)); } return bad; }
  const standInWrites = (token) => (g.farmWrites || []).filter(w => !has(w.save, token)).length;
  // the next load finds this text as the saved farm (written before any game script runs)
  const corruptOnNextLoad = (text) => P(g, (t) => localStorage.setItem('__corrupt_once', t), text);
  let failed = false, timing = null, quotaTiming = null;
  try {
    const uid = await E.register(g, 'grandma@example.com');
    await P(g, () => { const G = window.__dbg.G; G.S.coins += 100; G.commit(); });

    // Chicken envelope traverses the existing authenticated snapshot path. No
    // Firebase/auth/rules code is substituted or enabled on the public farm.
    await P(g, () => {
      const G=__dbg.G;G.S.pens.chicken={owned:true,list:[Date.now()-1,...Array(29).fill(0)],meta:Array.from({length:30},(_,i)=>({name:i?'Snapshot Hen '+i:'Snapshot Hen',love:50,loveAt:Date.now()}))};G.S.barn.chicken_feed=31;
      if(!G.refillChickens('feed',G.chickenRefillQuote('feed').revision)||!G.refillChickens('water',G.chickenRefillQuote('water').revision))throw Error('chicken fixture refill failed');
      if(!G.setChickenAppearance({walls:'sage',roof:'red',trim:'cream',roofType:'metal'}))throw Error('chicken fixture appearance failed');
    });
    const chickenBase=await establish(uid,'chicken-snapshot');
    const chickenCloud=JSON.parse((await cloud(uid)).save).pens.chicken;
    check('chicken care and appearance survive authenticated cloud upload',chickenCloud.list.length===30&&chickenCloud.care?.v===1&&chickenCloud.care.birds.length===30&&chickenCloud.care.normal===1&&chickenCloud.care.feedUntil>0&&chickenCloud.care.waterUntil>0&&chickenCloud.appearance?.walls==='sage');
    await g.page.reload({waitUntil:'load'});await gameUp();
    const chickenRestored=await P(g,()=>__dbg.G.S.pens.chicken);
    check('chicken snapshot restores without losing supplies, stock or appearance',JSON.stringify(chickenRestored.care)===JSON.stringify(chickenCloud.care)&&JSON.stringify(chickenRestored.appearance)===JSON.stringify(chickenCloud.appearance)&&chickenRestored.meta[0].name==='Snapshot Hen'&&chickenRestored.meta[29].name==='Snapshot Hen 29'&&chickenRestored.list.length===30);

    // Exercise the new minimum-writer marker through actual Auth/Firestore,
    // then retain it through the original corruption/race recovery scenarios.
    await P(g,()=>{const G=__dbg.G;G.S.decor.inv.utilitylamp=1;G.S.decor.placed.push({id:'utilitylamp',x:-18,z:8,rotation:.57});G.view.refresh('decor');G.commit();});
    const lampBase=await establish(uid,'utility-writer');
    const lampCloud=JSON.parse(lampBase.save),lampDecor=JSON.stringify(lampCloud.decor);
    check('paid utility lamp uploads through authenticated cloud with minimum writer2 and30 birds',lampCloud.v===2&&lampCloud.decor.inv.utilitylamp===1&&lampCloud.decor.placed.some(d=>d.id==='utilitylamp'&&d.rotation===.57)&&lampCloud.pens.chicken.list.length===30);
    await g.page.reload({waitUntil:'load'});await gameUp();
    const lampRestored=await P(g,()=>({v:__dbg.G.S.v,decor:__dbg.G.S.decor,birds:__dbg.G.S.pens.chicken.list.length}));
    check('minimum-writer2 paid lamp restores from authenticated snapshot exactly',lampRestored.v===2&&JSON.stringify(lampRestored.decor)===lampDecor&&lampRestored.birds===30);

    // A quiescent approaching job retains its actual tank/queue through cloud
    // recovery. The synthetic paid lamp occupies the site, so the renderer may
    // not silently dock/milk it while the upload/reload assertions are running.
    await P(g,()=>{
      const G=__dbg.G;G.S.level=Math.max(4,G.S.level);G.S.barnCap=400;G.S.barn.cow_feed=20;G.S.barn.milk=7;G.S.gold.milk=2;
      const site=__dbg.cowYard.layout.footprint;
      G.S.decor.placed.push({id:'utilitylamp',x:(site[0][0]+site[1][0])/2,z:(site[0][1]+site[2][1])/2,rotation:.31});
      G.S.pens.cow={owned:true,list:[Date.now()-1,Date.now()-1],meta:[{name:'Snapshot Bessie',love:50,loveAt:Date.now()},{name:'Snapshot Clover',love:50,loveAt:Date.now()}]};
      G.view.refresh('all');if(__dbg.cowYardActive||!__dbg.cowYardIssues.some(c=>c.type==='decor'))throw Error('cow snapshot fixture must occupy the current courtyard');
      if(G.fillCowFeed(12)!==12||!G.fillCowWater())throw Error('cow snapshot supplies failed');
      G.S.pens.cow.care.tank={normal:11,gold:2};
      const ids=G.getCowCareStatus().cows.map(c=>c.id);if(!G.milkCow(ids[0])||!G.milkCow(ids[1]))throw Error('cow snapshot queue failed');G.commit();
    });
    const cowBase=await establish(uid,'cow-writer3'),cowCloud=JSON.parse(cowBase.save);
    check('cow writer3 uploads paid feed/water, quality tank and manual queue without touching barn milk',cowCloud.v===3&&cowCloud.pens.cow.care.feed===12&&cowCloud.pens.cow.care.waterUntil>Date.now()&&cowCloud.pens.cow.care.tank.normal===11&&cowCloud.pens.cow.care.tank.gold===2&&cowCloud.pens.cow.care.job.stage==='approaching'&&cowCloud.pens.cow.care.queue.length===1&&cowCloud.barn.milk===7&&cowCloud.gold.milk===2&&cowCloud.pens.chicken.list.length===30);
    await g.page.reload({waitUntil:'load'});await gameUp();
    const cowRestored=await P(g,()=>({save:JSON.parse(JSON.stringify(__dbg.G.S)),site:__dbg.cowYardActive,conflicts:__dbg.cowYardIssues}));
    check('authenticated cow snapshot restores exactly while preserving the occupied paid-lamp footprint',JSON.stringify(cowProgress(cowRestored.save))===JSON.stringify(cowProgress(cowCloud))&&cowRestored.save.v===3&&cowRestored.save.pens.cow.meta[0].name==='Snapshot Bessie'&&cowRestored.save.pens.cow.meta[1].name==='Snapshot Clover'&&!cowRestored.site&&cowRestored.conflicts.some(c=>c.type==='decor')&&cowRestored.save.pens.chicken.list.length===30);

    // A27: use the already-qualified west horse boundary as a serialized recovery
    // fixture. This is not an additional native Apply claim: the original cow
    // snapshot deliberately contains a paid lamp occupying the cow site.
    await P(g,async()=>{const G=__dbg.G,L=await import('./animal-pen-layout.js?v=1'),horse=L.defaultSiteRecord('horse');for(const v of horse.boundary)if(['v0','v3'].includes(v.id))v.x=-37;
      G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Recovery Horse '+i,love:50,loveAt:Date.now()}))};G.S.layout.animalPens={v:1,revision:2,sites:{horse}};G.view.refresh('all');G.commit();});
    const editedBase=await establish(uid,'edited-writer4');
    const editedExpected=JSON.parse(editedBase.save);
    check('edited pen uploads writer4, stable horse ownership and exact paid cow snapshot',editedExpected.v===4&&editedExpected.layout.animalPens.revision===2&&editedExpected.pens.horse.list.length===4&&JSON.stringify(cowProgress(editedExpected))===JSON.stringify(cowProgress(cowCloud)));
    await g.page.reload({waitUntil:'load'});await gameUp();
    const installed=await P(g,()=>({raw:localStorage.getItem(__dbg.G.SAVE_KEY),custom:__dbg.remainingLayouts.horse.custom,revision:__dbg.penRuntime.revision,polygon:__dbg.remainingLayouts.horse.polygon,horses:__dbg.animals.filter(a=>a.kind==='horse'&&!a.gone).length}));
    check('edited cloud snapshot reload installs exact boundary and four owned horses',progress(installed.raw)===progress(editedBase.save)&&installed.custom===true&&installed.revision===2&&installed.horses===4&&JSON.stringify(installed.polygon)===JSON.stringify(editedExpected.layout.animalPens.sites.horse.boundary.map(v=>[v.x,v.z])));

    // Later recovery scenarios compare a quiescent snapshot byte-for-byte.
    // Pause this test fixture's supplies after proving active-state round-trip;
    // keep its already-paid egg on the pallet through subsequent recovery.
    await P(g,()=>{const G=__dbg.G;G.S.pens.chicken.care.feedUntil=0;G.S.pens.chicken.care.waterUntil=0;G.commit();});

    // A27 quota negative control: damaged phone cannot replace edited cloud
    // when the cloud restore cannot persist. Retain the original 15s debounce
    // and observe 25s without changing any existing recovery deadlines.
    {
      const base=await establish(uid,'edited-quota');g.farmWrites=[];
      await g.context.addInitScript(()=>{if(sessionStorage.getItem('a27-block-save')){const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='sunny-acres-3d-v1'&&v!=='{"a27 quota cut')throw new DOMException('A27 fixture quota','QuotaExceededError');return set.call(this,k,v);};}});
      await P(g,()=>sessionStorage.setItem('a27-block-save','1'));await corruptOnNextLoad('{"a27 quota cut');
      quotaTiming=await beginQuotaTiming(g.page);
      quotaTiming.mark('wait-arm',{deadlineMs:30000});
      const refusal=g.page.waitForEvent('console',{predicate:m=>m.text().includes("Couldn't put the cloud farm on this phone"),timeout:30000});
      void refusal.then(()=>quotaTiming.mark('wait-resolved'),e=>quotaTiming.mark('wait-rejected',{message:e.message}));
      quotaTiming.mark('reload-call');
      await g.page.reload({waitUntil:'load'});
      quotaTiming.mark('reload-return');
      await refusal;
      quotaTiming.mark('refusal-await-return');
      const bad=await watch(uid,25000,c=>c&&c.save===base.save&&c.rev===base.rev),blocked=await st();
      check('edited cloud recovery with blocked primary storage preserves exact cloud and pending recovery',blocked.recover==='1'&&blocked.raw==='{"a27 quota cut'&&bad.length===0&&standInWrites(base.token)===0);
      await P(g,()=>sessionStorage.removeItem('a27-block-save'));await g.page.reload({waitUntil:'load'});await gameUp();const restored=await st();
      check('edited cloud recovery succeeds after storage becomes writable',restored.recover===null&&progress(restored.raw)===progress(base.save)&&(await cloud(uid)).save===base.save);
      await quotaTiming.finish();quotaTiming=null;
    }

    // ---- 0. the race: auth.js signs in before game.js has read the save (cow3d.js held back 25 s)
    {
      const base = await establish(uid, 'race'), n0 = loads.grandma || 0; g.farmWrites = [];
      timing = await startRecoveryTiming(g, artifacts);
      // The SwiftShader trace proves old-context destruction takes9-19s.
      // Complete that fixture lifecycle before timing this25s startup race.
      // Keep the original reload deadline, import delay and recovery assertions.
      await timing.releaseRenderer();
      g.delayGame = 25000; g.authFile = process.env.AUTH_FILE || null;
      await corruptOnNextLoad('{"race cut');
      timing?.mark('reload-call', {deadlineMs: 30000, importDelayMs: 25000});
      const t0 = Date.now(); await g.page.reload({waitUntil: 'load'});
      timing?.mark('reload-return');
      if (timing) await timing.stopChromeTrace();
      const sampling = watch(uid, 45000, (c) => c && has(c.save, base.token));
      const back = await loaded((t) => window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel === t && window.__ready && window.saAuth.user, base.token, 120000);
      const c = await cloud(uid), s = await st(); const bad = await sampling;
      g.delayGame = 0; g.authFile = null;
      check('0 race (sign-in before the game reads the save): the cloud farm still comes back' + (process.env.AUTH_FILE ? ' [auth.js = ' + process.env.AUTH_FILE + ']' : ''),
        back && progress(s.raw) === progress(base.save) && c.save === base.save && bad.length === 0 && standInWrites(base.token) === 0,
        `restored ${back} after ${((Date.now() - t0) / 1000).toFixed(0)}s, page loads +${(loads.grandma || 0) - n0}, recover ${s.recover}, cloud rev ${base.rev}->${c.rev}, bad samples ${bad.length}, stand-in writes ${standInWrites(base.token)}`);
      if (process.env.ONLY === 'race') throw new Error('ONLY=race: stopping after the race scenario');
      if (!back) { await g.page.reload({waitUntil: 'load'}); await loaded((t) => window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel === t && window.__ready, base.token); }
    }

    // ---- 1 (x REPEAT). corrupt local + good cloud -> cloud farm back, byte-identical; never a stand-in write; then 7. a normal save
    for (let k = 1; k <= (+process.env.REPEAT || 2); k++) {
      const base = await establish(uid, 'one' + k), n0 = loads.grandma || 0; g.farmWrites = [];
      // the game keeps only the FIRST unreadable copy (scenario 3 checks that); start this scenario with the slot empty
      await P(g, (k) => localStorage.removeItem(k), SAVE_KEY + '-unreadable');
      await corruptOnNextLoad('{"v":1,"coins":12');
      const t0 = Date.now(); await g.page.reload({waitUntil: 'load'});
      const sampling = watch(uid, 40000, (c) => c && has(c.save, base.token));
      const back = await loaded((t) => window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel === t && window.__ready && window.saAuth.user, base.token);
      const atRecovery = await cloud(uid), s = await st(), took = ((Date.now() - t0) / 1000).toFixed(1);
      const bad = await sampling;
      check(`1.${k} corrupt local + good cloud: the cloud farm is restored (same progress + sentinel), exactly one recovery reload`,
        back && progress(s.raw) === progress(base.save) && (loads.grandma || 0) - n0 === 2 && s.recover === null && s.kept === '{"v":1,"coins":12',
        `restored ${back} in ${took}s, same progress ${progress(s.raw) === progress(base.save)}, page loads +${(loads.grandma || 0) - n0}, recover ${s.recover}`);
      check(`1.${k} cloud untouched until recovery, and never without the sentinel for 40 s (> 15 s upload delay)`,
        atRecovery.save === base.save && atRecovery.rev === base.rev && bad.length === 0 && standInWrites(base.token) === 0,
        `rev ${base.rev}->${atRecovery.rev}, bad samples ${bad.length}, stand-in writes sent ${standInWrites(base.token)}`);
      if (!back) { console.log('STATE', JSON.stringify(await st())); break; }
      // 7. recovery followed by a normal save: it uploads the restored farm (sentinel kept) one revision on
      await P(g, () => { const G = window.__dbg.G; G.S.coins += 3; G.commit(); });
      let after = null; for (let i = 0; i < 40; i++) { after = await cloud(uid); if (after.rev > base.rev) break; await g.page.waitForTimeout(1000); }
      check(`1.${k} a normal save after recovery uploads the restored farm`, after.rev > base.rev && has(after.save, base.token) && JSON.parse(after.save).coins === JSON.parse(base.save).coins + 3, `rev ${base.rev}->${after.rev}`);
    }

    // ---- 2. good local + corrupt cloud -> no reload loop, phone farm kept, cloud repaired from the phone
    {
      const base = await establish(uid, 'two'), n0 = loads.grandma || 0; g.farmWrites = [];
      await restWrite(uid, '{"cloud cut off', base.rev + 1);
      await g.page.reload({waitUntil: 'load'}); await gameUp(); await g.page.waitForTimeout(20000);
      const s = await st(), c = await cloud(uid);
      check('2 good local + corrupt cloud: phone farm kept, one page load, cloud repaired with it',
        has(s.raw, base.token) && (loads.grandma || 0) - n0 === 1 && c && has(c.save, base.token) && c.rev === base.rev + 2 && standInWrites(base.token) === 0,
        `page loads +${(loads.grandma || 0) - n0}, cloud rev ${c && c.rev} (corrupt was ${base.rev + 1}), cloud has sentinel ${c && has(c.save, base.token)}`);
    }

    // ---- 3. corrupt local + missing cloud -> nothing to recover: stand-in becomes the farm and may start the cloud save
    {
      await restDelete(uid); const n0 = loads.grandma || 0; g.farmWrites = [];
      await corruptOnNextLoad('{"no cloud');
      await g.page.reload({waitUntil: 'load'}); await gameUp(); await g.page.waitForTimeout(12000);
      const s = await st();
      await P(g, () => { const G = window.__dbg.G; G.S.coins += 1; G.commit(); });
      let c = null; for (let i = 0; i < 30 && !c; i++) { await g.page.waitForTimeout(1000); c = await cloud(uid); }
      check('3 corrupt local + missing cloud: no recovery reload, copy kept, the farm starts a new cloud save',
        (loads.grandma || 0) - n0 === 1 && s.recover === null && s.kept === '{"v":1,"coins":12' && c && c.rev === 1,
        `page loads +${(loads.grandma || 0) - n0}, recover ${s.recover}, sync-rev ${s.sync}, kept first copy ${s.kept === '{"v":1,"coins":12'}, new cloud rev ${c && c.rev}`);
    }

    // ---- 3b. the same missing-cloud case with game startup deliberately delayed.
    // Account linking must not clear RECOVER before load() can set it again.
    {
      await restDelete(uid); const n0 = loads.grandma || 0;
      await timing.releaseRenderer();
      g.delayGame = 25000;
      try {
        await corruptOnNextLoad('{"early missing cloud');
        await g.page.reload({waitUntil: 'load'}); await gameUp();
      } finally { g.delayGame = 0; }
      const s = await st();
      await P(g, () => { const G = window.__dbg.G; G.S.coins += 1; G.commit(); });
      let c = null; for (let i = 0; i < 30 && !c; i++) { await g.page.waitForTimeout(1000); c = await cloud(uid); }
      check('3b missing cloud + delayed game startup: recovery clears after load, first copy kept, new cloud save starts',
        (loads.grandma || 0) - n0 === 1 && s.recover === null && s.kept === '{"v":1,"coins":12' && c && c.rev === 1,
        `page loads +${(loads.grandma || 0) - n0}, recover ${s.recover}, first copy kept ${s.kept === '{"v":1,"coins":12'}, new cloud rev ${c && c.rev}`);
    }

    // The preceding missing-cloud cases intentionally create a fresh farm.
    // Re-establish an edited disposable farm for the later offline/read-timeout
    // and sign-out recovery cases instead of claiming they cover the lost layout.
    await P(g,async()=>{const G=__dbg.G,L=await import('./animal-pen-layout.js?v=1'),horse=L.defaultSiteRecord('horse');for(const v of horse.boundary)if(['v0','v3'].includes(v.id))v.x=-37;
      G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Second Recovery Horse '+i,love:50,loveAt:Date.now()}))};G.S.layout.animalPens={v:1,revision:3,sites:{horse}};G.S.decor.inv.utilitylamp=1;G.S.decor.placed.push({id:'utilitylamp',x:20,z:20,rotation:.57});G.view.refresh('all');G.commit();});
    const laterEdited=await establish(uid,'later-edited');check('later recovery scenarios start with edited layout and paid object',JSON.parse(laterEdited.save).layout.animalPens.revision===3&&JSON.parse(laterEdited.save).decor.inv.utilitylamp===1);

    // ---- 11. no recovery, but the cloud can't be reached when the game opens: the same visit still syncs once it's back
    {
      const base = await establish(uid, 'eleven'), n0 = loads.grandma || 0; g.farmWrites = [];
      g.offline = true;
      await g.page.reload({waitUntil: 'load'}); await gameUp(); await g.page.waitForTimeout(15000);
      await P(g, () => { const G = window.__dbg.G; G.S.coins += 5; G.commit(); });
      const s = await st(); g.offline = false;
      let c = null; for (let i = 0; i < 120; i++) { c = await cloud(uid); if (c.rev > base.rev) break; await g.page.waitForTimeout(1000); }
      check('11 cloud unreachable at start (no recovery): the same visit syncs when it comes back, no reload',
        s.recover === null && c.rev > base.rev && has(c.save, base.token) && JSON.parse(c.save).coins === JSON.parse(base.save).coins + 5 && (loads.grandma || 0) - n0 === 1,
        `recover ${s.recover}, cloud rev ${base.rev}->${c.rev}, page loads +${(loads.grandma || 0) - n0}`);
    }

    // ---- 12. the first cloud read's answer is held back (no answer, no error) past 20 s: auth.js must give up on it
    // (__hold_cloud_once: the harness makes auth.js delay its first farm read's real answer; a network hold doesn't do it,
    // because Firestore itself fails a read after 10 s without a reply, while the hang seen in a real run had no reply
    // and no error at all)
    const logf = path.join(artifacts, 'console-grandma.log');
    const logFrom = () => (fs.existsSync(logf) ? fs.statSync(logf).size : 0);
    const logSince = (at) => (fs.existsSync(logf) ? fs.readFileSync(logf, 'utf8').slice(at) : '');
    // 12a/5. corrupt phone + good cloud + slow cloud: timeout, no upload, recovery stays safe, the retry restores the real farm
    {
      const base = await establish(uid, 'twelve-a'), n0 = loads.grandma || 0; g.farmWrites = [];
      await P(g, (k) => localStorage.removeItem(k), SAVE_KEY + '-unreadable');
      await P(g, () => localStorage.setItem('__hold_cloud_once', '30000'));
      await corruptOnNextLoad('{"v":1,"coins":12');
      const mark = logFrom(), t0 = Date.now();
      await g.page.reload({waitUntil: 'load'});
      const sampling = watch(uid, 45000, (c) => c && c.save === base.save && c.rev === base.rev);
      const back = await loaded((t) => window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel === t && window.__ready && window.saAuth.user, base.token, 150000);
      const took = (Date.now() - t0) / 1000, bad = await sampling, log = logSince(mark), s = await st(), c = await cloud(uid);
      check('12a slow cloud read (held 30 s): gave up after 20 s, retried, real farm restored, nothing uploaded meanwhile',
        /got no answer in 20 s; giving up/.test(log) && /Farm recovery is waiting for the cloud/.test(log) && back && took > 20 &&
        progress(s.raw) === progress(base.save) && c.save === base.save && bad.length === 0 && standInWrites(base.token) === 0 && s.recover === null,
        `timeout logged ${/got no answer in 20 s/.test(log)}, restored ${back} after ${took.toFixed(0)}s, page loads +${(loads.grandma || 0) - n0}, bad samples ${bad.length}, stand-in writes ${standInWrites(base.token)}`);
    }
    // 12b/3/6. healthy farm + slow cloud: the timed-out read answers LATE, after the retry already linked: it is ignored
    {
      const base = await establish(uid, 'twelve-b'), n0 = loads.grandma || 0; g.farmWrites = [];
      await P(g, () => localStorage.setItem('__hold_cloud_once', '32000'));
      const mark = logFrom();
      await g.page.reload({waitUntil: 'load'}); await gameUp();
      // wait until the held read was let go and has answered (well after the retry linked)
      let log = ''; for (let i = 0; i < 90 && !/answered after it was given up; ignored/.test(log); i++) { await g.page.waitForTimeout(1000); log = logSince(mark); }
      await P(g, () => { const G = window.__dbg.G; G.S.coins += 9; G.commit(); });
      // sync keeps working: the change reaches the cloud (the game may also re-save once after loading, so wait for THIS change)
      const want = JSON.parse(base.save).coins + 9;
      let c = null; for (let i = 0; i < 45; i++) { c = await cloud(uid); if (JSON.parse(c.save).coins === want) break; await g.page.waitForTimeout(1000); }
      const s = await st(), cond = {timeout: /got no answer in 20 s/.test(log), lateIgnored: /answered after it was given up; ignored/.test(log),
        retried: /Cloud sync is waiting/.test(log), notRecovering: s.recover === null, synced: JSON.parse(c.save).coins === want && c.rev > base.rev,
        sentinel: has(c.save, base.token), oneLoad: (loads.grandma || 0) - n0 === 1};
      check('12b late answer of the timed-out read is ignored; the newer read stands; sync keeps working; no reload',
        Object.values(cond).every(Boolean), JSON.stringify(cond) + ` cloud rev ${base.rev}->${c.rev}`);
    }

    // ---- 4/9/10/8. reload during recovery while the cloud can't be reached; same coins, different state; past the upload delay
    // ---- 6. sign-out during recovery; 5. sign-in during recovery
    {
      const base = await establish(uid, 'four'); g.farmWrites = [];
      const baseCoins = JSON.parse(base.save).coins;
      g.offline = true;
      await corruptOnNextLoad('{"offline cut');
      await g.page.reload({waitUntil: 'load'}); await gameUp(); await g.page.waitForTimeout(15000);
      // the stand-in now has the SAME coins as the good farm but a different state: coins equality can't tell them apart
      await P(g, (c) => { const G = window.__dbg.G; G.S.coins = c; G.S.xp += 7; G.commit(); }, baseCoins);
      const s1 = await st();
      await g.page.reload({waitUntil: 'load'}); await gameUp(); await g.page.waitForTimeout(15000);
      const s2 = await st();
      // the network comes back, but reading this farm keeps failing (writes work): recovery must stay pending, and the
      // stand-in (changed again here) must not be uploaded through 25 s, well past the 15 s upload delay
      g.blockFarmRead = uid; g.blockedReads = 0; g.offline = false;
      await P(g, () => { const G = window.__dbg.G; G.S.xp += 1; G.commit(); });
      const bad = await watch(uid, 25000, (c) => c && c.save === base.save && c.rev === base.rev);
      const s2b = await st();
      check('4/9/10/8 reload during recovery: still pending after a reload, same coins/different state, nothing uploaded through 25 s online (> 15 s delay)',
        s1.recover === '1' && s2.recover === '1' && s2b.recover === '1' && s1.sentinel !== base.token && s1.coins === baseCoins && g.blockedReads > 0 && bad.length === 0 && standInWrites(base.token) === 0,
        `pending ${s1.recover}/${s2.recover}/${s2b.recover}, stand-in coins ${s1.coins} = good ${baseCoins}, farm reads refused ${g.blockedReads}, bad samples ${bad.length}, stand-in writes ${standInWrites(base.token)}`);
      // 6. sign out while recovery is pending and online: signOut() uploads first, which must be refused
      await P(g, () => window.saAuth.signOut());
      await g.page.waitForSelector('#authGate:not([hidden])', {timeout: 30000});
      const bad2 = await watch(uid, 20000, (c) => c && c.save === base.save && c.rev === base.rev);
      const s2c = await st();
      check('6 sign-out during recovery: nothing uploaded, recovery still pending', s2c.recover === '1' && bad2.length === 0 && standInWrites(base.token) === 0,
        `pending ${s2c.recover}, bad samples ${bad2.length}, stand-in writes ${standInWrites(base.token)}`);
      // 5. sign back in while recovery is still pending (reads work again): the cloud farm comes back byte-identical
      g.blockFarmRead = null;
      const n0 = loads.grandma || 0;
      await g.page.fill('#authEmail', 'grandma@example.com'); await g.page.fill('#authPass', 'hunter22'); await g.page.click('#authGo');
      const back = await loaded((t) => window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel === t && window.__ready && window.saAuth.user, base.token);
      const s3 = await st(), c3 = await cloud(uid);
      check('5 sign-in during recovery: cloud farm restored, cloud copy byte-identical',
        back && (loads.grandma || 0) - n0 === 1 && progress(s3.raw) === progress(base.save) && c3.save === base.save && c3.rev === base.rev && s3.recover === null && standInWrites(base.token) === 0,
        `restored ${back}, page loads +${(loads.grandma || 0) - n0}, cloud rev ${c3.rev}`);
    }
  } catch (e) {
    quotaTiming?.mark('outer-catch',{message:e.message});quotaTiming?.flush();
    timing?.mark('recovery-error', {message: e.message});
    failed = true; console.log('RECOVERY ERROR', e.message); try { console.log('STATE', JSON.stringify(await st())); } catch (_) {}
    try { await g.page.screenshot({path: path.join(artifacts, 'recovery-failure.png')}); } catch (_) {}
  }
  if (timing) await timing.finish();
  quotaTiming?.mark('emulator-browser-close-call');
  await E.close();
  quotaTiming?.mark('emulator-browser-close-return');
  if (quotaTiming) await quotaTiming.finish();
  const bad = results.filter(r => !r.ok);
  console.log(`\nRECOVERY: ${results.length - bad.length}/${results.length} passed (console logs: artifacts/console-*.log)`);
  fs.writeFileSync(path.join(artifacts, 'recovery.json'), JSON.stringify(results, null, 1));
  process.exit(bad.length || failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
