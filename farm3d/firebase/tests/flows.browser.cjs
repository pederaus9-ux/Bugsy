// Sunny Acres 3D: the real game code (auth.js, friends.js, players.html) against the local Firebase emulators,
// with farm3d/firebase/firestore.rules loaded. This proves the rules allow everything the game actually does.
// Run through `npm test` in farm3d/firebase (it starts the Firestore + Auth emulators first).
//
// The game loads the Firebase 9.23.0 browser builds from gstatic. Here those exact files come from the npm package
// (node_modules/firebase9), wrapped so the game talks to the emulators and to the offline demo project.
const fs = require('fs');
const http = require('http');
const path = require('path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../../..');
const sdk = path.resolve(__dirname, '../node_modules/firebase9');
const artifacts = path.resolve(__dirname, '../artifacts');
fs.mkdirSync(artifacts, {recursive: true});
const PROJECT = 'demo-sunny-acres', FS = '127.0.0.1:8085', AUTH = '127.0.0.1:9099';
const CDN = 'https://www.gstatic.com/firebasejs/9.23.0/';
const OWNER_EMAIL = 'pederaus9@gmail.com';

const shims = {
  'firebase-app.js': `export * from "./real-firebase-app.js";
import {initializeApp as _i} from "./real-firebase-app.js";
export function initializeApp(cfg, ...a) { return _i(Object.assign({}, cfg, {projectId: "${PROJECT}"}), ...a); }`,
  'firebase-firestore.js': `export * from "./real-firebase-firestore.js";
import {getFirestore as _g, connectFirestoreEmulator as _c} from "./real-firebase-firestore.js";
const done = new WeakSet();
export function getFirestore(app, ...a) { const db = _g(app, ...a); if (!done.has(db)) { done.add(db); _c(db, "127.0.0.1", 8085); } return db; }`,
  'firebase-auth.js': `export * from "./real-firebase-auth.js";
import {getAuth as _g, connectAuthEmulator as _c} from "./real-firebase-auth.js";
const done = new WeakSet();
export function getAuth(app) { const a = _g(app); if (!done.has(a)) { done.add(a); _c(a, "http://127.0.0.1:9099", {disableWarnings: true}); } return a; }`,
};
function cdnFile(name) {
  if (shims[name]) return shims[name];
  const m = name.match(/^real-(firebase-(app|auth|firestore)\.js)$/);
  let src = fs.readFileSync(path.join(sdk, m ? m[1] : name), 'utf8');
  // the real builds import firebase-app by its full URL: send them to the real one too, so there is one app module
  return src.split(CDN + 'firebase-app.js').join(CDN + 'real-firebase-app.js');
}

// Firestore/Auth emulator REST, as the emulator "owner" (bypasses rules) for checking results
const fsUrl = (p) => `http://${FS}/v1/projects/${PROJECT}/databases/default/documents/${p}`;
async function readDoc(p) {
  const r = await fetch(fsUrl(p), {headers: {Authorization: 'Bearer owner'}});
  if (r.status === 404) return null;
  const j = await r.json(); const out = {};
  for (const [k, v] of Object.entries(j.fields || {})) out[k] = v.stringValue ?? (v.integerValue != null ? +v.integerValue : v.doubleValue ?? v.booleanValue ?? (v.nullValue !== undefined ? null : v));
  return out;
}
async function listDocs(p) {
  const r = await fetch(fsUrl(p) + '?pageSize=300', {headers: {Authorization: 'Bearer owner'}});
  return ((await r.json()).documents || []).map(d => ({id: d.name.split('/').pop(), fields: d.fields}));
}
async function signUp(email, password) {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {method: 'POST',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password, returnSecureToken: true})});
  return (await r.json()).localId;
}
async function resetEmulators() {
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/default/documents`, {method: 'DELETE'});
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, {method: 'DELETE'});
}

const results = [];
const check = (name, cond, detail = '') => { results.push({name, ok: !!cond, detail}); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };

async function main() {
  await resetEmulators();
  const server = http.createServer((req, res) => {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({'.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.webmanifest': 'application/manifest+json'})[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const denials = [];
  // one game page at a time (software WebGL is heavy): a "phone" keeps its storage and sign-in between pages
  async function newPage(p) {
    const page = await p.context.newPage(), name = p.name;
    page.on('console', m => { const t = m.text(); if (process.env.FLOW_DEBUG) console.log('[' + name + '] ' + m.type() + ': ' + t.slice(0, 300)); if (/permission|insufficient/i.test(t)) denials.push(name + ': ' + t); });
    page.on('pageerror', e => { if (process.env.FLOW_DEBUG) console.log('[' + name + '] pageerror: ' + e.message); if (/permission|insufficient/i.test(e.message)) denials.push(name + ': ' + e.message); });
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(base) || url.startsWith('http://' + FS) || url.startsWith('http://' + AUTH)) return route.continue();
      if (url.startsWith(CDN)) return route.fulfill({contentType: 'text/javascript', body: cdnFile(url.slice(CDN.length).split('?')[0])});
      return route.fulfill({contentType: 'application/json', body: '{}'}); // weather, error reports, fonts: never leave the machine
    });
    p.page = page; return page;
  }
  async function phone(name) {
    const context = await browser.newContext({viewport: {width: 640, height: 360}, deviceScaleFactor: .25, serviceWorkers: 'block'});
    const p = {name, context, page: null};
    await newPage(p); return p;
  }
  async function sleep(p) { if (p.page) { await p.page.close({runBeforeUnload: true}); p.page = null; } }
  async function wake(p) {
    await newPage(p); await p.page.goto(base + 'farm3d/?debug');
    await p.page.waitForFunction(() => window.saAuth && window.saAuth.user && window.__ready && window.saAuth.fb, null, {timeout: 180000, polling: 500});
  }
  const P = (p, fn, arg) => p.page.evaluate(fn, arg);
  const until = (p, fn, arg, timeout = 30000) => p.page.waitForFunction(fn, arg, {timeout, polling: 250});
  async function register(p, email) {
    await p.page.goto(base + 'farm3d/?debug');
    await p.page.waitForSelector('#authGate:not([hidden])', {timeout: 180000});
    await p.page.click('[data-mode="register"]');
    await p.page.fill('#authEmail', email); await p.page.fill('#authPass', 'hunter22'); await p.page.fill('#authPass2', 'hunter22');
    await p.page.click('#authGo');
    await until(p, () => window.saAuth && window.saAuth.user && window.saAuth.user.uid && window.__ready, null, 60000);
    return P(p, () => window.saAuth.user.uid);
  }
  async function friends(p, tab) {
    await P(p, () => { const b = document.getElementById('friendsBox'); if (b.hidden) document.getElementById('friendsBtn').click(); });
    if (tab) { await until(p, (t) => !!document.querySelector(`#friendsBox [data-tab="${t}"]`), tab); await P(p, (t) => document.querySelector(`#friendsBox [data-tab="${t}"]`).click(), tab); }
  }
  async function claimName(p, name) {
    await friends(p);
    await until(p, () => !!document.getElementById('fName'));
    await p.page.fill('#fName', name);
    await P(p, () => document.querySelector('#friendsBox form[data-f="claim"]').requestSubmit());
    await until(p, (n) => document.getElementById('friendsBody').textContent.includes('@' + n), name);
  }
  const give = (p, item, n) => P(p, ([i, k]) => { const G = window.__dbg.G; G.S.barn[i] = (G.S.barn[i] || 0) + k; G.commit(); }, [item, n]);
  const barn = (p, item) => P(p, (i) => window.__dbg.G.S.barn[i] || 0, item);
  const coins = (p) => P(p, () => window.__dbg.G.S.coins);
  const bodyText = (p) => P(p, () => document.getElementById('friendsBody').textContent);

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
    // grandma puts wheat up for sale, then closes the game
    await P(grandma, () => { document.getElementById('friendsBox').hidden = true; });
    await give(grandma, 'wheat', 5);
    const gWheat0 = await barn(grandma, 'wheat');
    await friends(grandma, 'market');
    await until(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
    await P(grandma, () => { const s = document.getElementById('mItem'); if (s && s.value !== 'wheat') { s.value = 'wheat'; s.dispatchEvent(new Event('change', {bubbles: true})); } });
    await until(grandma, () => !!document.querySelector('#friendsBox [data-list]'));
    await P(grandma, () => document.querySelector('#friendsBox [data-list]').click());
    await until(grandma, () => document.getElementById('friendsBody').textContent.includes('Up for sale'));
    const listings = await listDocs('market');
    check('listing created', listings.length === 1 && listings[0].fields.seller.stringValue === gUid, listings.length + ' listing(s)');
    check('seller escrowed the goods', (await barn(grandma, 'wheat')) === gWheat0 - 1);
    const price = listings.length ? +listings[0].fields.price.integerValue : 0;
    const gCoins0 = await coins(grandma);
    await sleep(grandma);

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

    // ---- trading post: niece buys grandma's wheat
    const nCoins0 = await coins(niece), nWheat0 = await barn(niece, 'wheat');
    await friends(niece, 'market');
    await until(niece, () => !!document.querySelector('#friendsBox [data-buy]'));
    await P(niece, () => document.querySelector('#friendsBox [data-buy]').click());
    await until(niece, () => document.getElementById('friendsBody').textContent.includes('Bought'));
    const sold = listings.length ? await readDoc('market/' + listings[0].id) : null;
    check('buyer bought it (transaction)', sold && sold.buyer === nUid);
    check('buyer paid and got the goods', (await coins(niece)) === nCoins0 - price && (await barn(niece, 'wheat')) === nWheat0 + 1);

    await sleep(niece);
    await wake(grandma);
    await friends(grandma, 'market');
    let gone = false; for (let i = 0; i < 20 && !gone; i++) { await grandma.page.waitForTimeout(500); gone = (await listDocs('market')).length === 0; }
    check('seller collected the coins and the listing is gone', gone && (await coins(grandma)) === gCoins0 + price, `coins ${gCoins0} -> ${await coins(grandma)}, price ${price}`);

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

  // ---- the owner dashboard: the owner sees it, other players are turned away
  await signUp(OWNER_EMAIL, 'ownerpass1');
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

  const unexpected = denials.filter(t => !t.startsWith('dash-player'));
  check('no permission errors in the game', unexpected.length === 0, unexpected.slice(0, 3).join(' | '));
  await browser.close(); await new Promise(r => server.close(r));
  const bad = results.filter(r => !r.ok);
  console.log(`\nGAME FLOWS: ${results.length - bad.length}/${results.length} passed`);
  fs.writeFileSync(path.join(artifacts, 'flows.json'), JSON.stringify(results, null, 1));
  process.exit(bad.length || failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
