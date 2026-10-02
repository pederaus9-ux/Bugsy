// Sunny Acres 3D: the real game code (auth.js, friends.js, players.html) against the local Firebase emulators,
// with farm3d/firebase/firestore.rules loaded. This proves the rules allow everything the game actually does.
// Run through `npm test` in farm3d/firebase (it starts the Firestore + Auth emulators first). Helpers: emu-harness.cjs.
const fs = require('fs');
const path = require('path');
const {startEmu, economyCalls, readDoc, listDocs, signUp, createUser, resetEmulators, OWNER_EMAIL, OWNER_UID, artifacts, fsUrl} = require('./emu-harness.cjs');
const fsUrlFor = fsUrl;

// Phase 7I: verified (canonical) coins and goods live in economy/{uid}, written only by the server. Here an account is
// given verified goods directly (admin access), standing in for verified harvests, so the real trading post can run.
const int = (n) => ({integerValue: String(n)});
async function setEconomy(uid, coins, items) {
  const fields = {v: int(1), coins: int(coins), rev: int(1), items: {mapValue: {fields: Object.fromEntries(Object.entries(items).map(([k, n]) => [k, int(n)]))}},
    meta: {mapValue: {fields: {harvests: int(1), bootstrapUsed: {booleanValue: true}}}}};
  const r = await fetch(fsUrl('economy/' + uid), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields})});
  if (!r.ok) throw new Error('setEconomy ' + r.status);
}
async function economy(uid) {
  const r = await fetch(fsUrl('economy/' + uid), {headers: {Authorization: 'Bearer owner'}});
  if (r.status === 404) return null;
  const f = (await r.json()).fields || {};
  return {coins: +(f.coins?.integerValue || 0), items: Object.fromEntries(Object.entries(f.items?.mapValue?.fields || {}).map(([k, v]) => [k, +v.integerValue]))};
}

const results = [];
// ECONOMY=1: the dormant Phase 7I economy switched on (test harness only). Default: the Spark/production shape, where
// it is off and no page may ever call economyAct.
const ECONOMY = process.env.ECONOMY === '1';
const check = (name, cond, detail = '') => { results.push({name, ok: !!cond, detail}); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

async function main() {
  await resetEmulators();
  const {base, browser, denials, newPage, phone, sleep, wake, P, until, register, friends, claimName, give, barn, coins, bodyText, close} = await startEmu({economy: ECONOMY});
  console.log('MODE ' + (ECONOMY ? 'economy on (7I, test harness only)' : 'Spark / production: verified economy off'));
  let failed = false;
  const grandma = await phone('grandma'), niece = await phone('niece');
  await sleep(niece);
  try {
    // ---- accounts + cloud save
    const gUid = await register(grandma, 'grandma@example.com');
    await P(grandma, () => { const G = window.__dbg.G; G.S.coins += 7; G.commit(); });       // a real change, so a cloud save follows
    let farm = null; for (let i = 0; i < 40 && !(farm && farm.rev >= 1); i++) { await grandma.page.waitForTimeout(1000); farm = await readDoc('farms/' + gUid); }
    check('cloud save written through the revision transaction', farm && farm.rev >= 1 && typeof farm.save === 'string', farm ? 'rev ' + farm.rev : 'no farm doc');
    const pres = await readDoc('presence/' + gUid);
    check('presence heartbeat written', pres && pres.seen, pres ? JSON.stringify(Object.keys(pres)) : 'none');

    // ---- usernames, profile, showcase
    await claimName(grandma, 'SunnyGrandma');
    let show = null; for (let i = 0; i < 20 && !show; i++) { await grandma.page.waitForTimeout(500); show = await readDoc('showcase/' + gUid); }
    check('showcase published', show && show.name === 'SunnyGrandma' && typeof show.save === 'string');
    let price = 0, gCoinsLegacy0 = 0;
    if (ECONOMY) {
      // grandma puts VERIFIED wheat up for sale through the server, then closes the game
      await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await give(grandma, 'wheat', 5);                                  // farm-on-this-phone wheat: must NOT be tradable
      const gWheat0 = await barn(grandma, 'wheat'); gCoinsLegacy0 = await coins(grandma);
      await setEconomy(gUid, 0, {wheat: 3});
      await friends(grandma, 'market');
      await until(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
      check('trading post offers only verified goods', await P(grandma, () => [...document.querySelectorAll('#mItem option')].map(o => o.textContent).join('|')).then(t => t.includes('(3)') && !t.includes('(5)')),
        'the select shows verified wheat (3), not the phone barn (5)');
      await P(grandma, () => { const s = document.getElementById('mItem'); if (s && s.value !== 'wheat') { s.value = 'wheat'; s.dispatchEvent(new Event('change', {bubbles: true})); } });
      await until(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
      await P(grandma, () => document.querySelector('#friendsBox [data-list]').click());
      await until(grandma, () => document.getElementById('friendsBody').textContent.includes('Up for sale'));
      const hud = await P(grandma, () => ({v: !document.getElementById('vcoinsBox').hidden, vc: document.getElementById('vcoins').textContent, legacy: document.getElementById('coinsBox').dataset.legacy}));
      check('HUD shows verified coins separately; phone coins labelled LEGACY_UNVERIFIED', hud.v && hud.vc === '0' && hud.legacy === 'LEGACY_UNVERIFIED', JSON.stringify(hud));
      const listings = await listDocs('market');
      const L0 = listings[0] ? listings[0].fields : null;
      check('listing created by the server', listings.length === 1 && L0.seller.stringValue === gUid && +L0.v.integerValue === 2 && L0.state.stringValue === 'open', listings.length + ' listing(s)');
      check('seller\'s verified goods held by the server; phone barn untouched', (await economy(gUid)).items.wheat === 2 && (await barn(grandma, 'wheat')) === gWheat0,
        JSON.stringify(await economy(gUid)) + ' phone wheat ' + (await barn(grandma, 'wheat')));
      price = L0 ? +L0.price.integerValue : 0;
      await sleep(grandma);
    } else {
      // ---- Spark (production): no Verified Field, no trading post, no verified counter, and no way to switch them on
      const hidden = () => P(grandma, () => ({field: document.getElementById('verifiedBtn').hidden, counter: document.getElementById('vcoinsBox').hidden,
        legacyLabel: document.getElementById('coinsBox').dataset.legacy || null}));
      await friends(grandma);
      await until(grandma, () => !!document.querySelector('#friendsBox [data-tab="board"]'));
      const h0 = await hidden(), tabs0 = await P(grandma, () => [...document.querySelectorAll('#friendsBox [data-tab]')].map(b => b.dataset.tab));
      check('Spark: no Verified Field button, no verified counter or label, no Trading tab', h0.field && h0.counter && !h0.legacyLabel && !tabs0.includes('market'), JSON.stringify({...h0, tabs: tabs0}));
      await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await grandma.page.goto(base + 'farm3d/?debug&economy&verifiedEconomy=1');
      await until(grandma, () => window.saAuth && window.saAuth.user && window.__ready && window.saAuth.fb, null, 180000);
      await grandma.page.waitForTimeout(3000);
      const h1 = await hidden();
      await friends(grandma); await until(grandma, () => !!document.querySelector('#friendsBox [data-tab="board"]'));
      const tabs1 = await P(grandma, () => [...document.querySelectorAll('#friendsBox [data-tab]')].map(b => b.dataset.tab));
      check('Spark: URL parameters (?debug&economy) cannot switch the economy on', h1.field && h1.counter && !tabs1.includes('market'), JSON.stringify({...h1, tabs: tabs1}));
      // things left at the OLD (client-written, pre-7I) trading post go back to this phone's farm only
      const int = (n) => ({integerValue: String(n)}), str = (v) => ({stringValue: v}), nul = {nullValue: null};
      const putListing = (id, f) => fetch(fsUrl('market/' + id), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields: f})});
      const old = (item, qty, price, buyer) => ({seller: str(gUid), sellerName: str('SunnyGrandma'), item: str(item), qty: int(qty), price: int(price), at: int(1), buyer: buyer ? str(buyer) : nul, buyerName: buyer ? str('Old buyer') : nul, soldAt: buyer ? int(2) : nul});
      await putListing(gUid + '-1790000000000', old('wheat', 2, 4, null));
      await putListing(gUid + '-1790000000001', old('corn', 1, 5, 'someone-else'));
      await putListing(gUid + '-1790000000002', old('wheat', 99, 4, null));          // not the old shape: must be left alone
      await putListing(gUid + '-req2', {...old('wheat', 1, 2, null), v: int(2), state: str('open')}); // server-made: not "old"
      await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await friends(grandma, 'friends');
      await until(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 2);
      const wheat0 = await barn(grandma, 'wheat'), coins0 = await coins(grandma);
      await P(grandma, (id) => document.querySelector(`[data-old-back="${id}"]`).click(), gUid + '-1790000000000');
      await until(grandma, () => document.getElementById('fMsg').textContent.includes('Back on your farm'));
      await until(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 1);
      await P(grandma, (id) => document.querySelector(`[data-old-back="${id}"]`).click(), gUid + '-1790000000001');
      await until(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 0);
      const left = (await listDocs('market')).map(d => d.id).sort();
      check('Spark: an old unsold listing returns its goods to the phone barn; an old sold one pays the phone coins; each once',
        (await barn(grandma, 'wheat')) === wheat0 + 2 && (await coins(grandma)) === coins0 + 5 && !left.includes(gUid + '-1790000000000') && !left.includes(gUid + '-1790000000001'),
        `phone wheat ${wheat0} -> ${await barn(grandma, 'wheat')}, phone coins ${coins0} -> ${await coins(grandma)}, left ${left.join(',')}`);
      check('Spark: a listing of unexpected shape and a server-made one are left alone; nothing verified appears',
        left.includes(gUid + '-1790000000002') && left.includes(gUid + '-req2') && (await economy(gUid)) === null && (await listDocs('ledger/' + gUid + '/rows')).length === 0);
      await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      // the roadside shop (the game's own selling, which Market Day quests and events count) still pays out
      const rs0 = await coins(grandma);
      await P(grandma, () => { const G = window.__dbg.G; G.S.stand.list[0] = {id: 'wheat', qty: 1, price: 3, sellAt: Date.now() - 1000}; G.standCollectAll(); });
      check('Spark: the roadside shop still pays out', (await coins(grandma)) === rs0 + 3, `coins ${rs0} -> ${await coins(grandma)}`);
      await sleep(grandma);
    }

    // niece signs up on her own phone
    await newPage(niece);
    const nUid = await register(niece, 'niece@example.com');
    check('sign up (two accounts)', gUid && nUid && gUid !== nUid);
    await claimName(niece, 'Niece');
    check('usernames claimed', (await readDoc('usernames/sunnygrandma'))?.uid === gUid && (await readDoc('usernames/niece'))?.uid === nUid);


    // ---- search + add friend
    await friends(niece, 'friends');
    await until(niece, () => !!document.getElementById('fSearch'));
    await niece.page.fill('#fSearch', 'sunny');
    await P(niece, () => document.querySelector('#friendsBox form[data-f="search"]').requestSubmit());
    await until(niece, () => !!document.querySelector('#friendsBox [data-add]'));
    await P(niece, () => document.querySelector('#friendsBox [data-add]').click());
    await until(niece, () => document.getElementById('friendsBody').textContent.includes('Added') || !!document.querySelector('#friendsBox [data-visit]'));
    const fr = await listDocs(`players/${nUid}/friends`);
    check('friend added to own list', fr.length === 1 && fr[0].id === gUid);

    // ---- leaderboard reads the friend's showcase
    await friends(niece, 'board');
    await until(niece, () => document.getElementById('friendsBody').textContent.includes('SunnyGrandma'));
    check('leaderboard shows the friend', (await bodyText(niece)).includes('SunnyGrandma'));

    if (ECONOMY) {
      // ---- trading post: niece buys grandma's wheat with VERIFIED coins; grandma is paid at once (no collect)
      await setEconomy(nUid, 20, {});
      const nCoinsLegacy0 = await coins(niece), nWheatLegacy0 = await barn(niece, 'wheat');
      await friends(niece, 'market');
      await until(niece, () => !!document.querySelector('#friendsBox [data-buy]'));
      await P(niece, () => document.querySelector('#friendsBox [data-buy]').click());
      await until(niece, () => document.getElementById('friendsBody').textContent.includes('Bought'));
      const nE = await economy(nUid), gE = await economy(gUid);
      check('buyer paid with verified coins and got verified goods (one server transaction)', nE.coins === 20 - price && nE.items.wheat === 1, JSON.stringify(nE));
      check('seller paid at once while away (no collect step)', gE.coins === price, 'grandma verified coins ' + gE.coins + ', price ' + price);
      check('the sold listing is gone', (await listDocs('market')).length === 0);
      check('phone coins and barn untouched by trading', (await coins(niece)) === nCoinsLegacy0 && (await barn(niece, 'wheat')) === nWheatLegacy0);

      await sleep(niece);
      await wake(grandma);
      check('seller\'s phone farm was not paid in phone coins', (await coins(grandma)) === gCoinsLegacy0, 'legacy coins ' + gCoinsLegacy0 + ' -> ' + (await coins(grandma)));
      await until(grandma, (p) => document.getElementById('vcoins').textContent === String(p), price, 30000).catch(() => {});
      check('seller sees the sale in the verified counter after waking', await P(grandma, () => document.getElementById('vcoins').textContent) === String(price));
      // a 7G listing of grandma's (phone-farm wheat, from before verified trading) goes back to the phone only
      await fetch(fsUrlFor('market/' + gUid + '-1790000000000'), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields: {
        seller: {stringValue: gUid}, sellerName: {stringValue: 'SunnyGrandma'}, item: {stringValue: 'wheat'}, qty: int(2), price: int(4), at: int(1), buyer: {nullValue: null}, buyerName: {nullValue: null}, soldAt: {nullValue: null}}})});
      const gPhoneWheat = await barn(grandma, 'wheat'), gVerified = await economy(gUid);
      await friends(grandma, 'market');
      await until(grandma, () => !!document.querySelector('#friendsBox [data-legacy-back]'));
      await P(grandma, () => document.querySelector('#friendsBox [data-legacy-back]').click());
      await until(grandma, () => document.getElementById('friendsBody').textContent.includes('Back on this phone'));
      check('a 7G listing goes back to the PHONE barn only (nothing verified moves)', (await barn(grandma, 'wheat')) === gPhoneWheat + 2 && JSON.stringify(await economy(gUid)) === JSON.stringify(gVerified),
        'phone wheat ' + gPhoneWheat + ' -> ' + (await barn(grandma, 'wheat')));
      await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
    } else { await sleep(niece); await wake(grandma); }

    // ---- Phase 7H F1: this phone's copy of the farm can't be read: the cloud farm comes back, and is never overwritten
    let cloudBefore = null; for (let i = 0; i < 40; i++) { cloudBefore = await readDoc('farms/' + gUid); if (cloudBefore && JSON.parse(cloudBefore.save).coins === await coins(grandma)) break; await grandma.page.waitForTimeout(1000); }
    const cb = JSON.parse(cloudBefore.save);
    await P(grandma, () => { window.__saHold = true; localStorage.setItem('sunny-acres-3d-v1', '{"v":1,"coins":12'); }); // damaged, and the page mustn't save over it on the way out
    await grandma.page.reload({waitUntil: 'load'});
    const back = await grandma.page.waitForFunction((c) => window.saAuth && window.saAuth.user && window.__ready && window.__dbg && window.__dbg.G.S && window.__dbg.G.S.coins === c, cb.coins, {timeout: 120000, polling: 500}).then(() => true, () => false);
    if (!back) console.log('RECOVERY DEBUG', JSON.stringify(await P(grandma, () => ({coins: window.__dbg && window.__dbg.G.S.coins, level: window.__dbg && window.__dbg.G.S.level, recover: localStorage.getItem('sa3d-recover'), owner: localStorage.getItem('sa3d-save-owner'), rev: localStorage.getItem('sa3d-sync-rev'), dirty: localStorage.getItem('sa3d-dirty'), kept: localStorage.getItem('sunny-acres-3d-v1-unreadable'), raw: (localStorage.getItem('sunny-acres-3d-v1') || '').slice(0, 80)}))), 'cloud coins', cb.coins, 'cloud rev', cloudBefore.rev);
    await grandma.page.waitForTimeout(3000);
    const cloudAfter = await readDoc('farms/' + gUid), kept = await P(grandma, () => localStorage.getItem('sunny-acres-3d-v1-unreadable'));
    check('damaged phone save: the cloud farm comes back and is not overwritten',
      cloudAfter && JSON.parse(cloudAfter.save).coins === cb.coins && cloudAfter.rev >= cloudBefore.rev && kept === '{"v":1,"coins":12',
      `coins ${cb.coins} -> ${await coins(grandma)}, cloud rev ${cloudBefore.rev} -> ${cloudAfter && cloudAfter.rev}`);

    await sleep(grandma);
    // ---- visit a friend's farm (reads their showcase)
    await wake(niece);
    await friends(niece, 'friends');
    await until(niece, () => !!document.querySelector('#friendsBox [data-visit]'));
    await P(niece, () => document.querySelector('#friendsBox [data-visit]').click());
    await until(niece, () => window.__dbg.G.isVisiting && window.__dbg.G.isVisiting());
    check('visited the friend\'s farm', await P(niece, () => window.__dbg.G.isVisiting()));
    await sleep(niece);
  } catch (e) {
    failed = true; console.log('FLOW ERROR', e.message, (e.stack || '').split('\n').filter(l => l.includes('flows.browser')).join(' <- '));
    for (const p of [grandma, niece].filter(x => x.page)) { try { console.log('STATE', p.name, await Promise.race([new Promise(r => setTimeout(() => r('evaluate timed out'), 5000)), p.page.evaluate(() => JSON.stringify({gate: document.getElementById('authGate').hidden, title: document.getElementById('authTitle').textContent, user: window.saAuth && window.saAuth.user, guest: window.saAuth && window.saAuth.guest, fb: !!(window.saAuth && window.saAuth.fb), ready: window.__ready, url: location.href}))])); } catch (e) { console.log('STATE', p.name, 'n/a', e.message); } try { await p.page.screenshot({path: path.join(artifacts, 'flow-' + p.name + '-failure.png')}); } catch (_) {} }
  }

  for (const p of [grandma, niece]) await sleep(p).catch(() => {});
  // ---- a guest (not signed in) still reports milestones
  const guest = await phone('guest');
  try {
    await guest.page.goto(base + 'farm3d/');
    await guest.page.waitForSelector('#authGuest:not([hidden])', {timeout: 60000});
    await guest.page.click('#authGuest');
    let ev = []; for (let i = 0; i < 20; i++) { await guest.page.waitForTimeout(500); ev = (await listDocs('events')).map(d => d.fields.e.stringValue); if (ev.includes('guest')) break; }
    check('guest play still reports milestones (open, guest)', ev.includes('open') && ev.includes('guest'), ev.join(','));
  } catch (e) { failed = true; console.log('GUEST ERROR', e.message); }
  await sleep(guest);

  if (ECONOMY) {
    // ---- Phase 7I-D: the VERIFIED FIELD, by a brand-new account (the real bootstrap path, nothing given by the test)
    const farmer = await phone('farmer');
    try {
      const fUid = await register(farmer, 'farmer@example.com');
      const vText = () => P(farmer, () => document.getElementById('vfieldBody').textContent);
      const phoneFarm = () => P(farmer, () => JSON.stringify({barn: window.__dbg.G.S.barn, plots: window.__dbg.G.S.plots.map(p => [p.crop, p.end])}));
      await until(farmer, () => !document.getElementById('verifiedBtn').hidden, null, 30000);
      await P(farmer, () => document.getElementById('verifiedBtn').click());
      await until(farmer, () => document.querySelectorAll('#vfieldBody [data-vplot]').length === 6);
      check('verified field: a separate area with six plots, online status shown', /Online/.test(await vText()) && (await P(farmer, () => document.querySelectorAll('[data-vplant]').length)) === 6);
      const farm0 = await phoneFarm();
      await P(farmer, () => document.querySelector('[data-vplant="p0"]').click());
      await until(farmer, () => !!document.querySelector('[data-vseed="wheat"]'));
      const wheatLabel = await P(farmer, () => document.querySelector('[data-vseed="wheat"]').textContent);
      await P(farmer, () => document.querySelector('[data-vseed="wheat"]').click());
      await until(farmer, () => document.getElementById('vMsg').textContent.includes('Planted'));
      let p0 = null; for (let i = 0; i < 20 && !(p0 && p0.state === 'growing'); i++) { await farmer.page.waitForTimeout(500); p0 = await readDoc(`plots/${fUid}/items/p0`); }
      const e0 = await economy(fUid);
      check('first wheat is free (server bootstrap), shown as such, planted on the SERVER with server times',
        /free/.test(wheatLabel) && p0 && p0.state === 'growing' && p0.crop === 'wheat' && p0.generation === 1 && p0.matureAt - p0.plantedAt === 20000 && e0.coins === 0 && JSON.stringify(e0.items) === '{}',
        `label "${wheatLabel.trim()}", plot ${JSON.stringify(p0 && {state: p0.state, gen: p0.generation})}, economy ${JSON.stringify(e0)}`);
      await until(farmer, () => /\d+s/.test(document.querySelector('[data-vplot="p0"]').textContent));
      check('a growing verified crop shows its time left', true);
      await until(farmer, () => !!document.querySelector('[data-vharvest="p0"]'), null, 45000);
      await P(farmer, () => document.querySelector('[data-vharvest="p0"]').click());
      let e1 = null; for (let i = 0; i < 30; i++) { e1 = await economy(fUid); if ((e1.items.wheat || 0) === 2) break; await farmer.page.waitForTimeout(500); }
      check('harvest goes to VERIFIED goods only; the phone barn and normal fields are unchanged', e1.items.wheat === 2 && (await phoneFarm()) === farm0, JSON.stringify(e1));
      // replant: now it costs 1 verified wheat (no second free planting)
      await P(farmer, () => document.querySelector('[data-vplant="p1"]').click());
      await until(farmer, () => !!document.querySelector('[data-vseed="wheat"]'));
      const paidLabel = await P(farmer, () => document.querySelector('[data-vseed="wheat"]').textContent);
      await P(farmer, () => document.querySelector('[data-vseed="wheat"]').click());
      await until(farmer, () => document.getElementById('vMsg').textContent.includes('Planted'));
      let e2 = null; for (let i = 0; i < 20; i++) { e2 = await economy(fUid); if ((e2.items.wheat || 0) === 1) break; await farmer.page.waitForTimeout(500); }
      check('the second planting is paid with 1 verified wheat', /1 🌾/.test(paidLabel) && !/free/.test(paidLabel) && e2.items.wheat === 1, `label "${paidLabel.trim()}", ${JSON.stringify(e2)}`);
      // offline: planting is off; a ready crop can still be picked and is checked when the connection is back
      await farmer.context.setOffline(true);
      await until(farmer, () => /Offline/.test(document.getElementById('vfieldBody').textContent));
      check('offline: the field says so and planting is switched off', await P(farmer, () => [...document.querySelectorAll('[data-vplant]')].every(b => b.disabled)));
      await until(farmer, () => !!document.querySelector('[data-vharvest="p1"]'), null, 45000);
      await P(farmer, () => document.querySelector('[data-vharvest="p1"]').click());
      await until(farmer, () => document.getElementById('vMsg').textContent.includes('back online'));
      const e3 = await economy(fUid);
      check('offline harvest is kept on the phone as "checking", nothing verified yet', e3.items.wheat === 1 && /checking/.test(await vText()), JSON.stringify(e3));
      await farmer.context.setOffline(false);
      let e4 = null; for (let i = 0; i < 40; i++) { e4 = await economy(fUid); if ((e4.items.wheat || 0) === 3) break; await farmer.page.waitForTimeout(500); }
      const left = await P(farmer, (u) => localStorage.getItem('sa3d-canon-harvests-' + u), fUid);
      check('back online: the harvest is checked and granted once; the queue is empty; phone farm still untouched',
        e4.items.wheat === 3 && (left === '[]' || left === null) && (await phoneFarm()) === farm0, JSON.stringify(e4) + ' queue ' + left);
    } catch (e) { failed = true; console.log('VERIFIED FIELD ERROR', e.message); try { await farmer.page.screenshot({path: path.join(artifacts, 'flow-farmer-failure.png')}); } catch (_) {} }
    await sleep(farmer);
  }

  // ---- the owner dashboard: the owner sees it, other players are turned away
  await createUser(OWNER_UID, OWNER_EMAIL, 'ownerpass1'); // the owner is recognized by this exact UID (firestore.rules)
  for (const [who, email, pw, want] of [['owner', OWNER_EMAIL, 'ownerpass1', 'stats'], ['player', 'grandma@example.com', 'hunter22', 'denied']]) {
    const d = await phone('dash-' + who);
    try {
      await d.page.goto(base + 'farm3d/players.html');
      await d.page.waitForSelector('#email', {state: 'visible', timeout: 60000});
      await d.page.fill('#email', email); await d.page.fill('#pass', pw);
      await d.page.click('#form button[type="submit"], #form button');
      await d.page.waitForFunction((w) => { const el = document.getElementById(w); return el && !el.hidden; }, want, {timeout: 30000});
      if (who === 'owner') {
        await d.page.waitForFunction(() => +document.getElementById('nTotal').textContent >= 2, null, {timeout: 20000});
        check('owner dashboard loads presence, farm count and funnel', true, 'total ' + await d.page.textContent('#nTotal'));
      } else check('dashboard refuses a non-owner', true);
    } catch (e) { check('dashboard as ' + who, false, e.message); }
    await d.context.close();
  }

  if (!ECONOMY) check('Spark: not one request reached economyAct during the whole run', economyCalls.length === 0, economyCalls.length + ' call(s)' + (economyCalls[0] ? ' first from ' + economyCalls[0].page : ''));
  else check('economy mode really reached economyAct', economyCalls.length > 0, economyCalls.length + ' call(s)');
  const unexpected = denials.filter(t => !t.startsWith('dash-player'));
  check('no permission errors in the game', unexpected.length === 0, unexpected.slice(0, 3).join(' | '));
  await close();
  const bad = results.filter(r => !r.ok);
  console.log(`\nGAME FLOWS: ${results.length - bad.length}/${results.length} passed`);
  fs.writeFileSync(path.join(artifacts, 'flows.json'), JSON.stringify(results, null, 1));
  process.exit(bad.length || failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
