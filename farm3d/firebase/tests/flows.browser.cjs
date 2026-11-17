require('../../tests/helpers/a52-firebase-script-events.cjs').observe(process.env.ECONOMY === '1' ? 'flows-economy' : 'flows-spark');
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
  const r = await (__fbDetail.mark(1),fetch)(fsUrl('economy/' + uid), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields})});
  if (!r.ok) throw new Error('setEconomy ' + r.status);
}
async function economy(uid) {
  const r = await (__fbDetail.mark(2),fetch)(fsUrl('economy/' + uid), {headers: {Authorization: 'Bearer owner'}});
  if (r.status === 404) return null;
  const f = (await r[(__fbDetail.mark(3),'json')]()).fields || {};
  return {coins: +(f.coins?.integerValue || 0), items: Object.fromEntries(Object.entries(f.items?.mapValue?.fields || {}).map(([k, v]) => [k, +v.integerValue]))};
}

const __fbDetail=require('../../tests/helpers/a52-firebase-detail.cjs').create();
const results = [];
// ECONOMY=1: the dormant Phase 7I economy switched on (test harness only). Default: the Spark/production shape, where
// it is off and no page may ever call economyAct.
const ECONOMY = process.env.ECONOMY === '1';
const check = (name, cond, detail = '') => { __fbDetail.check(name,!!cond);results.push({name, ok: !!cond, detail}); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

async function main() {
  await (__fbDetail.mark(4),resetEmulators)();
  const {base, browser, denials, newPage, phone, sleep, wake, P, until, register, friends, claimName, give, barn, coins, bodyText, close} = await (__fbDetail.mark(5),startEmu)({economy: ECONOMY});
  console.log('MODE ' + (ECONOMY ? 'economy on (7I, test harness only)' : 'Spark / production: verified economy off'));
  let failed = false;
  const grandma = await (__fbDetail.mark(6),phone)('grandma'), niece = await (__fbDetail.mark(7),phone)('niece');
  await (__fbDetail.mark(8),sleep)(niece);
  try {
    // ---- accounts + cloud save
    const gUid = await (__fbDetail.mark(9),register)(grandma, 'grandma@example.com');
    await (__fbDetail.mark(10),P)(grandma, () => { const G = window.__dbg.G; G.S.coins += 7; G.commit(); });       // a real change, so a cloud save follows
    let farm = null; for (let i = 0; i < 40 && !(farm && farm.rev >= 1); i++) { await grandma.page[(__fbDetail.mark(11),'waitForTimeout')](1000); farm = await (__fbDetail.mark(12),readDoc)('farms/' + gUid); }
    check('cloud save written through the revision transaction', farm && farm.rev >= 1 && typeof farm.save === 'string', farm ? 'rev ' + farm.rev : 'no farm doc');
    const pres = await (__fbDetail.mark(13),readDoc)('presence/' + gUid);
    check('presence heartbeat written', pres && pres.seen, pres ? JSON.stringify(Object.keys(pres)) : 'none');

    // ---- usernames, profile, showcase
    await (__fbDetail.mark(14),claimName)(grandma, 'SunnyGrandma');
    let show = null; for (let i = 0; i < 20 && !show; i++) { await grandma.page[(__fbDetail.mark(15),'waitForTimeout')](500); show = await (__fbDetail.mark(16),readDoc)('showcase/' + gUid); }
    check('showcase published', show && show.name === 'SunnyGrandma' && typeof show.save === 'string');
    let price = 0, gCoinsLegacy0 = 0;
    if (ECONOMY) {
      // grandma puts VERIFIED wheat up for sale through the server, then closes the game
      await (__fbDetail.mark(17),P)(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await (__fbDetail.mark(18),give)(grandma, 'wheat', 5);                                  // farm-on-this-phone wheat: must NOT be tradable
      const gWheat0 = await (__fbDetail.mark(19),barn)(grandma, 'wheat'); gCoinsLegacy0 = await (__fbDetail.mark(20),coins)(grandma);
      await (__fbDetail.mark(21),setEconomy)(gUid, 0, {wheat: 3});
      await (__fbDetail.mark(22),friends)(grandma, 'market');
      await (__fbDetail.mark(23),until)(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
      check('trading post offers only verified goods', await (__fbDetail.mark(24),P)(grandma, () => [...document.querySelectorAll('#mItem option')].map(o => o.textContent).join('|')).then(t => t.includes('(3)') && !t.includes('(5)')),
        'the select shows verified wheat (3), not the phone barn (5)');
      await (__fbDetail.mark(25),P)(grandma, () => { const s = document.getElementById('mItem'); if (s && s.value !== 'wheat') { s.value = 'wheat'; s.dispatchEvent(new Event('change', {bubbles: true})); } });
      await (__fbDetail.mark(26),until)(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
      await (__fbDetail.mark(27),P)(grandma, () => document.querySelector('#friendsBox [data-list]').click());
      await (__fbDetail.mark(28),until)(grandma, () => document.getElementById('friendsBody').textContent.includes('Up for sale'));
      const hud = await (__fbDetail.mark(29),P)(grandma, () => ({v: !document.getElementById('vcoinsBox').hidden, vc: document.getElementById('vcoins').textContent, legacy: document.getElementById('coinsBox').dataset.legacy}));
      check('HUD shows verified coins separately; phone coins labelled LEGACY_UNVERIFIED', hud.v && hud.vc === '0' && hud.legacy === 'LEGACY_UNVERIFIED', JSON.stringify(hud));
      const listings = await (__fbDetail.mark(30),listDocs)('market');
      const L0 = listings[0] ? listings[0].fields : null;
      check('listing created by the server', listings.length === 1 && L0.seller.stringValue === gUid && +L0.v.integerValue === 2 && L0.state.stringValue === 'open', listings.length + ' listing(s)');
      check('seller\'s verified goods held by the server; phone barn untouched', (await (__fbDetail.mark(31),economy)(gUid)).items.wheat === 2 && (await (__fbDetail.mark(32),barn)(grandma, 'wheat')) === gWheat0,
        JSON.stringify(await (__fbDetail.mark(33),economy)(gUid)) + ' phone wheat ' + (await (__fbDetail.mark(34),barn)(grandma, 'wheat')));
      price = L0 ? +L0.price.integerValue : 0;
      await (__fbDetail.mark(35),sleep)(grandma);
    } else {
      // ---- Spark (production): no Verified Field, no trading post, no verified counter, and no way to switch them on
      const hidden = () => P(grandma, () => ({field: document.getElementById('verifiedBtn').hidden, counter: document.getElementById('vcoinsBox').hidden,
        legacyLabel: document.getElementById('coinsBox').dataset.legacy || null}));
      await (__fbDetail.mark(36),friends)(grandma);
      await (__fbDetail.mark(37),until)(grandma, () => !!document.querySelector('#friendsBox [data-tab="board"]'));
      const h0 = await (__fbDetail.mark(38),hidden)(), tabs0 = await (__fbDetail.mark(39),P)(grandma, () => [...document.querySelectorAll('#friendsBox [data-tab]')].map(b => b.dataset.tab));
      check('Spark: no Verified Field button, no verified counter or label, no Trading tab', h0.field && h0.counter && !h0.legacyLabel && !tabs0.includes('market'), JSON.stringify({...h0, tabs: tabs0}));
      await (__fbDetail.mark(40),P)(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await grandma.page[(__fbDetail.mark(41),'goto')](base + 'farm3d/?debug&economy&verifiedEconomy=1');
      await (__fbDetail.mark(42),until)(grandma, () => window.saAuth && window.saAuth.user && window.__ready && window.saAuth.fb, null, 180000);
      await grandma.page[(__fbDetail.mark(43),'waitForTimeout')](3000);
      const h1 = await (__fbDetail.mark(44),hidden)();
      await (__fbDetail.mark(45),friends)(grandma); await (__fbDetail.mark(46),until)(grandma, () => !!document.querySelector('#friendsBox [data-tab="board"]'));
      const tabs1 = await (__fbDetail.mark(47),P)(grandma, () => [...document.querySelectorAll('#friendsBox [data-tab]')].map(b => b.dataset.tab));
      check('Spark: URL parameters (?debug&economy) cannot switch the economy on', h1.field && h1.counter && !tabs1.includes('market'), JSON.stringify({...h1, tabs: tabs1}));
      // things left at the OLD (client-written, pre-7I) trading post go back to this phone's farm only
      const int = (n) => ({integerValue: String(n)}), str = (v) => ({stringValue: v}), nul = {nullValue: null};
      const putListing = (id, f) => fetch(fsUrl('market/' + id), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields: f})});
      const old = (item, qty, price, buyer) => ({seller: str(gUid), sellerName: str('SunnyGrandma'), item: str(item), qty: int(qty), price: int(price), at: int(1), buyer: buyer ? str(buyer) : nul, buyerName: buyer ? str('Old buyer') : nul, soldAt: buyer ? int(2) : nul});
      await (__fbDetail.mark(48),putListing)(gUid + '-1790000000000', old('wheat', 2, 4, null));
      await (__fbDetail.mark(49),putListing)(gUid + '-1790000000001', old('corn', 1, 5, 'someone-else'));
      await (__fbDetail.mark(50),putListing)(gUid + '-1790000000002', old('wheat', 99, 4, null));          // not the old shape: must be left alone
      await (__fbDetail.mark(51),putListing)(gUid + '-req2', {...old('wheat', 1, 2, null), v: int(2), state: str('open')}); // server-made: not "old"
      await (__fbDetail.mark(52),P)(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      await (__fbDetail.mark(53),friends)(grandma, 'friends');
      await (__fbDetail.mark(54),until)(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 2);
      const wheat0 = await (__fbDetail.mark(55),barn)(grandma, 'wheat'), coins0 = await (__fbDetail.mark(56),coins)(grandma);
      await (__fbDetail.mark(57),P)(grandma, (id) => document.querySelector(`[data-old-back="${id}"]`).click(), gUid + '-1790000000000');
      await (__fbDetail.mark(58),until)(grandma, () => document.getElementById('fMsg').textContent.includes('Back on your farm'));
      await (__fbDetail.mark(59),until)(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 1);
      await (__fbDetail.mark(60),P)(grandma, (id) => document.querySelector(`[data-old-back="${id}"]`).click(), gUid + '-1790000000001');
      await (__fbDetail.mark(61),until)(grandma, () => document.querySelectorAll('#friendsBox [data-old-back]').length === 0);
      const left = (await (__fbDetail.mark(62),listDocs)('market')).map(d => d.id).sort();
      check('Spark: an old unsold listing returns its goods to the phone barn; an old sold one pays the phone coins; each once',
        (await (__fbDetail.mark(63),barn)(grandma, 'wheat')) === wheat0 + 2 && (await (__fbDetail.mark(64),coins)(grandma)) === coins0 + 5 && !left.includes(gUid + '-1790000000000') && !left.includes(gUid + '-1790000000001'),
        `phone wheat ${wheat0} -> ${await (__fbDetail.mark(65),barn)(grandma, 'wheat')}, phone coins ${coins0} -> ${await (__fbDetail.mark(66),coins)(grandma)}, left ${left.join(',')}`);
      check('Spark: a listing of unexpected shape and a server-made one are left alone; nothing verified appears',
        left.includes(gUid + '-1790000000002') && left.includes(gUid + '-req2') && (await (__fbDetail.mark(67),economy)(gUid)) === null && (await (__fbDetail.mark(68),listDocs)('ledger/' + gUid + '/rows')).length === 0);
      await (__fbDetail.mark(69),P)(grandma, () => { document.getElementById('friendsBox').hidden = true; });
      // the roadside shop (the game's own selling, which Market Day quests and events count) still pays out
      const rs0 = await (__fbDetail.mark(70),coins)(grandma);
      await (__fbDetail.mark(71),P)(grandma, () => { const G = window.__dbg.G; G.S.stand.list[0] = {id: 'wheat', qty: 1, price: 3, sellAt: Date.now() - 1000}; G.standCollectAll(); });
      check('Spark: the roadside shop still pays out', (await (__fbDetail.mark(72),coins)(grandma)) === rs0 + 3, `coins ${rs0} -> ${await (__fbDetail.mark(73),coins)(grandma)}`);
      await (__fbDetail.mark(74),sleep)(grandma);
    }

    // niece signs up on her own phone
    await (__fbDetail.mark(75),newPage)(niece);
    const nUid = await (__fbDetail.mark(76),register)(niece, 'niece@example.com');
    check('sign up (two accounts)', gUid && nUid && gUid !== nUid);
    await (__fbDetail.mark(77),claimName)(niece, 'Niece');
    check('usernames claimed', (await (__fbDetail.mark(78),readDoc)('usernames/sunnygrandma'))?.uid === gUid && (await (__fbDetail.mark(79),readDoc)('usernames/niece'))?.uid === nUid);


    // ---- search + add friend
    await (__fbDetail.mark(80),friends)(niece, 'friends');
    await (__fbDetail.mark(81),until)(niece, () => !!document.getElementById('fSearch'));
    await niece.page[(__fbDetail.mark(82),'fill')]('#fSearch', 'sunny');
    await (__fbDetail.mark(83),P)(niece, () => document.querySelector('#friendsBox form[data-f="search"]').requestSubmit());
    await (__fbDetail.mark(84),until)(niece, () => !!document.querySelector('#friendsBox [data-add]'));
    await (__fbDetail.mark(85),P)(niece, () => document.querySelector('#friendsBox [data-add]').click());
    await (__fbDetail.mark(86),until)(niece, () => document.getElementById('friendsBody').textContent.includes('Added') || !!document.querySelector('#friendsBox [data-visit]'));
    const fr = await (__fbDetail.mark(87),listDocs)(`players/${nUid}/friends`);
    check('friend added to own list', fr.length === 1 && fr[0].id === gUid);

    // ---- leaderboard reads the friend's showcase
    await (__fbDetail.mark(88),friends)(niece, 'board');
    await (__fbDetail.mark(89),until)(niece, () => document.getElementById('friendsBody').textContent.includes('SunnyGrandma'));
    check('leaderboard shows the friend', (await (__fbDetail.mark(90),bodyText)(niece)).includes('SunnyGrandma'));

    if (ECONOMY) {
      // ---- trading post: niece buys grandma's wheat with VERIFIED coins; grandma is paid at once (no collect)
      await (__fbDetail.mark(91),setEconomy)(nUid, 20, {});
      const nCoinsLegacy0 = await (__fbDetail.mark(92),coins)(niece), nWheatLegacy0 = await (__fbDetail.mark(93),barn)(niece, 'wheat');
      await (__fbDetail.mark(94),friends)(niece, 'market');
      await (__fbDetail.mark(95),until)(niece, () => !!document.querySelector('#friendsBox [data-buy]'));
      await (__fbDetail.mark(96),P)(niece, () => document.querySelector('#friendsBox [data-buy]').click());
      await (__fbDetail.mark(97),until)(niece, () => document.getElementById('friendsBody').textContent.includes('Bought'));
      const nE = await (__fbDetail.mark(98),economy)(nUid), gE = await (__fbDetail.mark(99),economy)(gUid);
      check('buyer paid with verified coins and got verified goods (one server transaction)', nE.coins === 20 - price && nE.items.wheat === 1, JSON.stringify(nE));
      check('seller paid at once while away (no collect step)', gE.coins === price, 'grandma verified coins ' + gE.coins + ', price ' + price);
      check('the sold listing is gone', (await (__fbDetail.mark(100),listDocs)('market')).length === 0);
      check('phone coins and barn untouched by trading', (await (__fbDetail.mark(101),coins)(niece)) === nCoinsLegacy0 && (await (__fbDetail.mark(102),barn)(niece, 'wheat')) === nWheatLegacy0);

      await (__fbDetail.mark(103),sleep)(niece);
      await (__fbDetail.mark(104),wake)(grandma);
      check('seller\'s phone farm was not paid in phone coins', (await (__fbDetail.mark(105),coins)(grandma)) === gCoinsLegacy0, 'legacy coins ' + gCoinsLegacy0 + ' -> ' + (await (__fbDetail.mark(106),coins)(grandma)));
      await (__fbDetail.mark(107),until)(grandma, (p) => document.getElementById('vcoins').textContent === String(p), price, 30000).catch(() => {});
      check('seller sees the sale in the verified counter after waking', await (__fbDetail.mark(108),P)(grandma, () => document.getElementById('vcoins').textContent) === String(price));
      // a 7G listing of grandma's (phone-farm wheat, from before verified trading) goes back to the phone only
      await (__fbDetail.mark(109),fetch)(fsUrlFor('market/' + gUid + '-1790000000000'), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'}, body: JSON.stringify({fields: {
        seller: {stringValue: gUid}, sellerName: {stringValue: 'SunnyGrandma'}, item: {stringValue: 'wheat'}, qty: int(2), price: int(4), at: int(1), buyer: {nullValue: null}, buyerName: {nullValue: null}, soldAt: {nullValue: null}}})});
      const gPhoneWheat = await (__fbDetail.mark(110),barn)(grandma, 'wheat'), gVerified = await (__fbDetail.mark(111),economy)(gUid);
      await (__fbDetail.mark(112),friends)(grandma, 'market');
      await (__fbDetail.mark(113),until)(grandma, () => !!document.querySelector('#friendsBox [data-legacy-back]'));
      await (__fbDetail.mark(114),P)(grandma, () => document.querySelector('#friendsBox [data-legacy-back]').click());
      await (__fbDetail.mark(115),until)(grandma, () => document.getElementById('friendsBody').textContent.includes('Back on this phone'));
      check('a 7G listing goes back to the PHONE barn only (nothing verified moves)', (await (__fbDetail.mark(116),barn)(grandma, 'wheat')) === gPhoneWheat + 2 && JSON.stringify(await (__fbDetail.mark(117),economy)(gUid)) === JSON.stringify(gVerified),
        'phone wheat ' + gPhoneWheat + ' -> ' + (await (__fbDetail.mark(118),barn)(grandma, 'wheat')));
      await (__fbDetail.mark(119),P)(grandma, () => { document.getElementById('friendsBox').hidden = true; });
    } else { await (__fbDetail.mark(120),sleep)(niece); await (__fbDetail.mark(121),wake)(grandma); }

    // ---- Phase 7H F1: this phone's copy of the farm can't be read: the cloud farm comes back, and is never overwritten
    let cloudBefore = null; for (let i = 0; i < 40; i++) { cloudBefore = await (__fbDetail.mark(122),readDoc)('farms/' + gUid); if (cloudBefore && JSON.parse(cloudBefore.save).coins === await (__fbDetail.mark(123),coins)(grandma)) break; await grandma.page[(__fbDetail.mark(124),'waitForTimeout')](1000); }
    const cb = JSON.parse(cloudBefore.save);
    await (__fbDetail.mark(125),P)(grandma, () => { window.__saHold = true; localStorage.setItem('sunny-acres-3d-v1', '{"v":1,"coins":12'); }); // damaged, and the page mustn't save over it on the way out
    await grandma.page[(__fbDetail.mark(126),'reload')]({waitUntil: 'load'});
    const back = await grandma.page[(__fbDetail.mark(127),'waitForFunction')]((c) => window.saAuth && window.saAuth.user && window.__ready && window.__dbg && window.__dbg.G.S && window.__dbg.G.S.coins === c, cb.coins, {timeout: 120000, polling: 500}).then(() => true, () => false);
    if (!back) console.log('RECOVERY DEBUG', JSON.stringify(await (__fbDetail.mark(128),P)(grandma, () => ({coins: window.__dbg && window.__dbg.G.S.coins, level: window.__dbg && window.__dbg.G.S.level, recover: localStorage.getItem('sa3d-recover'), owner: localStorage.getItem('sa3d-save-owner'), rev: localStorage.getItem('sa3d-sync-rev'), dirty: localStorage.getItem('sa3d-dirty'), kept: localStorage.getItem('sunny-acres-3d-v1-unreadable'), raw: (localStorage.getItem('sunny-acres-3d-v1') || '').slice(0, 80)}))), 'cloud coins', cb.coins, 'cloud rev', cloudBefore.rev);
    await grandma.page[(__fbDetail.mark(129),'waitForTimeout')](3000);
    const cloudAfter = await (__fbDetail.mark(130),readDoc)('farms/' + gUid), kept = await (__fbDetail.mark(131),P)(grandma, () => localStorage.getItem('sunny-acres-3d-v1-unreadable'));
    check('damaged phone save: the cloud farm comes back and is not overwritten',
      cloudAfter && JSON.parse(cloudAfter.save).coins === cb.coins && cloudAfter.rev >= cloudBefore.rev && kept === '{"v":1,"coins":12',
      `coins ${cb.coins} -> ${await (__fbDetail.mark(132),coins)(grandma)}, cloud rev ${cloudBefore.rev} -> ${cloudAfter && cloudAfter.rev}`);

    await (__fbDetail.mark(133),sleep)(grandma);
    // ---- visit a friend's farm (reads their showcase)
    await (__fbDetail.mark(134),wake)(niece);
    await (__fbDetail.mark(135),friends)(niece, 'friends');
    await (__fbDetail.mark(136),until)(niece, () => !!document.querySelector('#friendsBox [data-visit]'));
    await (__fbDetail.mark(137),P)(niece, () => document.querySelector('#friendsBox [data-visit]').click());
    await (__fbDetail.mark(138),until)(niece, () => window.__dbg.G.isVisiting && window.__dbg.G.isVisiting());
    check('visited the friend\'s farm', await (__fbDetail.mark(139),P)(niece, () => window.__dbg.G.isVisiting()));
    await (__fbDetail.mark(140),sleep)(niece);
  } catch (e) {
    __fbDetail.error('main-flow',e);failed = true; console.log('FLOW ERROR', e.message, (e.stack || '').split('\n').filter(l => l.includes('flows.browser')).join(' <- '));
    for (const p of [grandma, niece].filter(x => x.page)) { try { console.log('STATE', p.name, await Promise[(__fbDetail.mark(141),'race')]([new Promise(r => setTimeout(() => r('evaluate timed out'), 5000)), p.page.evaluate(() => JSON.stringify({gate: document.getElementById('authGate').hidden, title: document.getElementById('authTitle').textContent, user: window.saAuth && window.saAuth.user, guest: window.saAuth && window.saAuth.guest, fb: !!(window.saAuth && window.saAuth.fb), ready: window.__ready, url: location.href}))])); } catch (e) { console.log('STATE', p.name, 'n/a', e.message); } try { await p.page[(__fbDetail.mark(142),'screenshot')]({path: path.join(artifacts, 'flow-' + p.name + '-failure.png')}); } catch (_) {} }
  }

  for (const p of [grandma, niece]) await (__fbDetail.mark(143),sleep)(p).catch(() => {});
  // ---- a guest (not signed in) still reports milestones
  const guest = await (__fbDetail.mark(144),phone)('guest');
  try {
    await guest.page[(__fbDetail.mark(145),'goto')](base + 'farm3d/');
    await guest.page[(__fbDetail.mark(146),'waitForSelector')]('#authGuest:not([hidden])', {timeout: 60000});
    await guest.page[(__fbDetail.mark(147),'click')]('#authGuest');
    let ev = []; for (let i = 0; i < 20; i++) { await guest.page[(__fbDetail.mark(148),'waitForTimeout')](500); ev = (await (__fbDetail.mark(149),listDocs)('events')).map(d => d.fields.e.stringValue); if (ev.includes('guest')) break; }
    check('guest play still reports milestones (open, guest)', ev.includes('open') && ev.includes('guest'), ev.join(','));
  } catch (e) { __fbDetail.error('guest',e);failed = true; console.log('GUEST ERROR', e.message); }
  await (__fbDetail.mark(150),sleep)(guest);

  if (ECONOMY) {
    // ---- Phase 7I-D: the VERIFIED FIELD, by a brand-new account (the real bootstrap path, nothing given by the test)
    const farmer = await (__fbDetail.mark(151),phone)('farmer');
    await farmer.context.addInitScript(() => { let online=true;Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>online});addEventListener('offline',()=>{online=false;},true);addEventListener('online',()=>{online=true;},true); });
    try {
      const fUid = await (__fbDetail.mark(152),register)(farmer, 'farmer@example.com');
      const vText = () => P(farmer, () => document.getElementById('vfieldBody').textContent);
      const phoneFarm = () => P(farmer, () => JSON.stringify({barn: window.__dbg.G.S.barn, plots: window.__dbg.G.S.plots.map(p => [p.crop, p.end])}));
      await (__fbDetail.mark(153),until)(farmer, () => !document.getElementById('verifiedBtn').hidden, null, 30000);
      await (__fbDetail.mark(154),P)(farmer, () => document.getElementById('verifiedBtn').click());
      await (__fbDetail.mark(155),until)(farmer, () => document.querySelectorAll('#vfieldBody [data-vplot]').length === 6);
      check('verified field: a separate area with six plots, online status shown', __fbDetail.fieldOnline(/Online/.test(await (__fbDetail.mark(156),vText)())) && __fbDetail.fieldCount((await (__fbDetail.mark(157),P)(farmer, () => document.querySelectorAll('[data-vplant]').length))) === 6);
      const farm0 = await (__fbDetail.mark(158),phoneFarm)();
      await (__fbDetail.mark(159),P)(farmer, () => document.querySelector('[data-vplant="p0"]').click());
      await (__fbDetail.mark(160),until)(farmer, () => !!document.querySelector('[data-vseed="wheat"]'));
      const wheatLabel = await (__fbDetail.mark(161),P)(farmer, () => document.querySelector('[data-vseed="wheat"]').textContent);
      await (__fbDetail.mark(162),P)(farmer, () => document.querySelector('[data-vseed="wheat"]').click());
      await (__fbDetail.mark(163),until)(farmer, () => document.getElementById('vMsg').textContent.includes('Planted'));
      let p0 = null; for (let i = 0; i < 20 && !(p0 && p0.state === 'growing'); i++) { await farmer.page[(__fbDetail.mark(164),'waitForTimeout')](500); p0 = await (__fbDetail.mark(165),readDoc)(`plots/${fUid}/items/p0`); }
      const e0 = await (__fbDetail.mark(166),economy)(fUid);
      check('first wheat is free (server bootstrap), shown as such, planted on the SERVER with server times',
        /free/.test(wheatLabel) && p0 && p0.state === 'growing' && p0.crop === 'wheat' && p0.generation === 1 && p0.matureAt - p0.plantedAt === 20000 && e0.coins === 0 && JSON.stringify(e0.items) === '{}',
        `label "${wheatLabel.trim()}", plot ${JSON.stringify(p0 && {state: p0.state, gen: p0.generation})}, economy ${JSON.stringify(e0)}`);
      await (__fbDetail.mark(167),until)(farmer, () => /\d+s/.test(document.querySelector('[data-vplot="p0"]').textContent));
      check('a growing verified crop shows its time left', true);
      await (__fbDetail.mark(168),until)(farmer, () => !!document.querySelector('[data-vharvest="p0"]'), null, 45000);
      await (__fbDetail.mark(169),P)(farmer, () => document.querySelector('[data-vharvest="p0"]').click());
      let e1 = null; for (let i = 0; i < 30; i++) { e1 = await (__fbDetail.mark(170),economy)(fUid); if ((e1.items.wheat || 0) === 2) break; await farmer.page[(__fbDetail.mark(171),'waitForTimeout')](500); }
      check('harvest goes to VERIFIED goods only; the phone barn and normal fields are unchanged', e1.items.wheat === 2 && (await (__fbDetail.mark(172),phoneFarm)()) === farm0, JSON.stringify(e1));
      // replant: now it costs 1 verified wheat (no second free planting)
      await (__fbDetail.mark(173),P)(farmer, () => document.querySelector('[data-vplant="p1"]').click());
      await (__fbDetail.mark(174),until)(farmer, () => !!document.querySelector('[data-vseed="wheat"]'));
      const paidLabel = await (__fbDetail.mark(175),P)(farmer, () => document.querySelector('[data-vseed="wheat"]').textContent);
      await (__fbDetail.mark(176),P)(farmer, () => document.querySelector('[data-vseed="wheat"]').click());
      await (__fbDetail.mark(177),until)(farmer, () => document.getElementById('vMsg').textContent.includes('Planted'));
      let e2 = null; for (let i = 0; i < 20; i++) { e2 = await (__fbDetail.mark(178),economy)(fUid); if ((e2.items.wheat || 0) === 1) break; await farmer.page[(__fbDetail.mark(179),'waitForTimeout')](500); }
      check('the second planting is paid with 1 verified wheat', /1 🌾/.test(paidLabel) && !/free/.test(paidLabel) && e2.items.wheat === 1, `label "${paidLabel.trim()}", ${JSON.stringify(e2)}`);
      // offline: planting is off; a ready crop can still be picked and is checked when the connection is back
      await farmer.context[(__fbDetail.mark(180),'setOffline')](true);
      if(!await farmer.page.evaluate(offline => {const expected=!offline;if(navigator.onLine!==expected)dispatchEvent(new Event(offline?'offline':'online'));return navigator.onLine===expected;},true))throw Error('Emulated connectivity state mismatch');
      await (__fbDetail.mark(181),until)(farmer, () => /Offline/.test(document.getElementById('vfieldBody').textContent));
      check('offline: the field says so and planting is switched off', await (__fbDetail.mark(182),P)(farmer, () => [...document.querySelectorAll('[data-vplant]')].every(b => b.disabled)));
      await (__fbDetail.mark(183),until)(farmer, () => !!document.querySelector('[data-vharvest="p1"]'), null, 45000);
      await (__fbDetail.mark(184),P)(farmer, () => document.querySelector('[data-vharvest="p1"]').click());
      await (__fbDetail.mark(185),until)(farmer, () => document.getElementById('vMsg').textContent.includes('back online'));
      const e3 = await (__fbDetail.mark(186),economy)(fUid);
      check('offline harvest is kept on the phone as "checking", nothing verified yet', e3.items.wheat === 1 && /checking/.test(await (__fbDetail.mark(187),vText)()), JSON.stringify(e3));
      await farmer.context[(__fbDetail.mark(188),'setOffline')](false);
      if(!await farmer.page.evaluate(offline => {const expected=!offline;if(navigator.onLine!==expected)dispatchEvent(new Event(offline?'offline':'online'));return navigator.onLine===expected;},false))throw Error('Emulated connectivity state mismatch');
      let e4 = null; for (let i = 0; i < 40; i++) { e4 = await (__fbDetail.mark(189),economy)(fUid); if ((e4.items.wheat || 0) === 3) break; await farmer.page[(__fbDetail.mark(190),'waitForTimeout')](500); }
      const left = await (__fbDetail.mark(191),P)(farmer, (u) => localStorage.getItem('sa3d-canon-harvests-' + u), fUid);
      check('back online: the harvest is checked and granted once; the queue is empty; phone farm still untouched',
        e4.items.wheat === 3 && (left === '[]' || left === null) && (await (__fbDetail.mark(192),phoneFarm)()) === farm0, JSON.stringify(e4) + ' queue ' + left);
    } catch (e) { __fbDetail.error('verified-field',e);failed = true; console.log('VERIFIED FIELD ERROR', e.message); try { await farmer.page[(__fbDetail.mark(193),'screenshot')]({path: path.join(artifacts, 'flow-farmer-failure.png')}); } catch (_) {} }
    await (__fbDetail.mark(194),sleep)(farmer);
  }

  // ---- the owner dashboard: the owner sees it, other players are turned away
  await (__fbDetail.mark(195),createUser)(OWNER_UID, OWNER_EMAIL, 'ownerpass1'); // the owner is recognized by this exact UID (firestore.rules)
  for (const [who, email, pw, want] of [['owner', OWNER_EMAIL, 'ownerpass1', 'stats'], ['player', 'grandma@example.com', 'hunter22', 'denied']]) {
    const d = await (__fbDetail.mark(196),phone)('dash-' + who);
    try {
      await d.page[(__fbDetail.mark(197),'goto')](base + 'farm3d/players.html');
      await d.page[(__fbDetail.mark(198),'waitForSelector')]('#email', {state: 'visible', timeout: 60000});
      await d.page[(__fbDetail.mark(199),'fill')]('#email', email); await d.page[(__fbDetail.mark(200),'fill')]('#pass', pw);
      await d.page[(__fbDetail.mark(201),'click')]('#form button[type="submit"], #form button');
      await d.page[(__fbDetail.mark(202),'waitForFunction')]((w) => { const el = document.getElementById(w); return el && !el.hidden; }, want, {timeout: 30000});
      if (who === 'owner') {
        await d.page[(__fbDetail.mark(203),'waitForFunction')](() => +document.getElementById('nTotal').textContent >= 2, null, {timeout: 20000});
        check('owner dashboard loads presence, farm count and funnel', true, 'total ' + await d.page[(__fbDetail.mark(204),'textContent')]('#nTotal'));
      } else check('dashboard refuses a non-owner', true);
    } catch (e) { __fbDetail.error(who==='owner'?'dashboard-owner':'dashboard-player',e);check('dashboard as ' + who, false, e.message); }
    await d.context[(__fbDetail.mark(205),'close')]();
  }

  if (!ECONOMY) check('Spark: not one request reached economyAct during the whole run', economyCalls.length === 0, economyCalls.length + ' call(s)' + (economyCalls[0] ? ' first from ' + economyCalls[0].page : ''));
  else check('economy mode really reached economyAct', economyCalls.length > 0, economyCalls.length + ' call(s)');
  const unexpected = denials.filter(t => !t.startsWith('dash-player'));
  check('no permission errors in the game', unexpected.length === 0, unexpected.slice(0, 3).join(' | '));
  await (__fbDetail.mark(206),close)();
  const bad = results.filter(r => !r.ok);
  console.log(`\nGAME FLOWS: ${results.length - bad.length}/${results.length} passed`);
  fs.writeFileSync(path.join(artifacts, 'flows.json'), JSON.stringify(results, null, 1));
  process.exit(bad.length || failed ? 1 : 0);
}
main().catch(e => { __fbDetail.error('outer',e);console.error(e); process.exit(1); });
