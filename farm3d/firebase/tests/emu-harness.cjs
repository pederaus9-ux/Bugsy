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
const PROJECT = 'demo-sunny-acres', FS = '127.0.0.1:8085', AUTH = '127.0.0.1:9099', FN = '127.0.0.1:5001';
const CDN = 'https://www.gstatic.com/firebasejs/9.23.0/';
const OWNER_EMAIL = 'pederaus9@gmail.com';
const OWNER_UID = 'wqPP4uUThWTmhqi9g5YdgyLfGQ93'; // firestore.rules isOwner(): the owner is this exact account

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
  'firebase-functions.js': `export * from "./real-firebase-functions.js";
import {getFunctions as _g, connectFunctionsEmulator as _c} from "./real-firebase-functions.js";
const done = new WeakSet();
export function getFunctions(app, ...a) { const f = _g(app, ...a); if (!done.has(f)) { done.add(f); _c(f, "127.0.0.1", 5001); } return f; }`,
};
function cdnFile(name) {
  if (shims[name]) return shims[name];
  const m = name.match(/^real-(firebase-(app|auth|firestore|functions)\.js)$/);
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
// an account with a chosen UID (the Auth emulator's admin endpoint), e.g. the owner's real UID for the dashboard tests
async function createUser(uid, email, password) {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`, {method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: 'Bearer owner'}, body: JSON.stringify({localId: uid, email, password})});
  const j = await r.json(); if (j.localId !== uid) throw new Error('createUser failed: ' + JSON.stringify(j));
  return j.localId;
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

const T0 = Date.now();
const loads = {};

// starts the static server + Chromium and returns the helpers both emulator browser tests use
async function startEmu() {
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
    const stamp = () => ((Date.now() - T0) / 1000).toFixed(1).padStart(7) + 's ';
    const logf = path.join(artifacts, 'console-' + name + '.log');
    const write = (line) => { fs.appendFileSync(logf, stamp() + line + '\n'); if (process.env.FLOW_DEBUG) console.log('[' + name + '] ' + line.slice(0, 300)); };
    page.on('console', m => { const t = m.text(); if (!/WebGL|GPU stall|GL Driver/.test(t)) write(m.type() + ': ' + t); if (/permission|insufficient/i.test(t)) denials.push(name + ': ' + t); });
    page.on('pageerror', e => { write('pageerror: ' + e.message); if (/permission|insufficient/i.test(e.message)) denials.push(name + ': ' + e.message); });
    page.on('load', () => { loads[name] = (loads[name] || 0) + 1; write('--- page load #' + loads[name] + ' ' + page.url()); });
    // every economy call (Phase 7I) and its answer
    page.on('request', r => { if (r.url().startsWith('http://' + FN) && r.method() === 'POST') write('economy call ' + (r.postData() || '').slice(0, 200)); });
    page.on('response', async r => { if (!r.url().startsWith('http://' + FN) || r.request().method() !== 'POST') return; let t = ''; try { t = await r.text(); } catch (e) {} write('economy answer ' + r.status() + ' ' + t.slice(0, 300)); });
    page.on('request', r => {
      if (!r.url().startsWith('http://' + FS)) return;
      if (/documents\/farms\/|:commit|:beginTransaction|:batchGet/.test(r.url())) write('fs-request ' + r.method() + ' ' + r.url().split('/documents')[1]);
      // every attempt to write a farms/ doc, with the save text it carries (whether or not the server accepts it)
      if (/:commit/.test(r.url())) { try { const body = JSON.parse(r.postData() || '{}');
        for (const w of body.writes || []) { const name = (w.update && w.update.name) || ''; if (!/\/farms\//.test(name)) continue;
          const save = w.update.fields && w.update.fields.save && w.update.fields.save.stringValue;
          (p.farmWrites = p.farmWrites || []).push({t: Date.now(), save}); write('FARM WRITE sent: ' + (save || '').slice(0, 60)); } } catch (e) {} }
    });
    page.on('requestfailed', r => { if (r.url().startsWith('http://' + FS) || r.url().startsWith('http://' + AUTH)) write('request FAILED ' + r.url().slice(0, 120) + ' ' + (r.failure() && r.failure().errorText)); });
    await page.route('**/*', route => {
      const url = route.request().url();
      if (p.offline && (url.startsWith('http://' + FS) || url.startsWith('http://' + AUTH) || url.startsWith('http://' + FN))) return route.abort('internetdisconnected');
      // online, but reading ONE player's farm fails (the Listen request that asks for farms/<uid>); writes still go through,
      // so anything the page tries to upload would really reach the cloud
      if (p.blockFarmRead && url.startsWith('http://' + FS) && /\/Listen\//.test(url)) {
        let body = ''; try { body = decodeURIComponent((route.request().postData() || '').replace(/\+/g, ' ')); } catch (e) {}
        if (body.includes('farms/' + p.blockFarmRead)) { p.blockedReads = (p.blockedReads || 0) + 1; write('farm read BLOCKED ' + p.blockFarmRead); return route.abort('failed'); }
      }
      // hold back a file the game awaits before G.start(), so auth.js's sign-in step runs before game.js reads the save
      if (p.delayGame && /\/cow3d\.js/.test(url)) return new Promise(r => setTimeout(r, p.delayGame)).then(() => route.continue());
      // serve a different auth.js (e.g. an older revision) to show what a fix changes
      if (p.authFile && /\/farm3d\/auth\.js/.test(url)) return route.fulfill({contentType: 'text/javascript', body: fs.readFileSync(p.authFile, 'utf8')});
      if (url.startsWith(base) || url.startsWith('http://' + FS) || url.startsWith('http://' + AUTH) || url.startsWith('http://' + FN)) return route.continue();
      if (url.startsWith(CDN)) return route.fulfill({contentType: 'text/javascript', body: cdnFile(url.slice(CDN.length).split('?')[0])});
      return route.fulfill({contentType: 'application/json', body: '{}'}); // weather, error reports, fonts: never leave the machine
    });
    p.page = page; return page;
  }
  async function phone(name) {
    const context = await browser.newContext({viewport: {width: 640, height: 360}, deviceScaleFactor: .25, serviceWorkers: 'block'});
    // a damaged save written "at rest": on the next page load, before any game script runs (see corruptOnNextLoad)
    await context.addInitScript(() => { try { const t = localStorage.getItem('__corrupt_once'); if (t !== null) { localStorage.setItem('sunny-acres-3d-v1', t); localStorage.removeItem('__corrupt_once'); } } catch (e) {} });
    // a slow cloud answer on the next load: auth.js delays its first farm read's answer by this many ms (see readCloud)
    await context.addInitScript(() => { try { const h = localStorage.getItem('__hold_cloud_once'); if (h !== null) { window.__saTestHoldCloudRead = +h; localStorage.removeItem('__hold_cloud_once'); } } catch (e) {} });
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

  const close = async () => { await browser.close(); await new Promise(r => server.close(r)); };
  return {base, browser, denials, loads, newPage, phone, sleep, wake, P, until, register, friends, claimName, give, barn, coins, bodyText, close};
}
module.exports = {startEmu, readDoc, listDocs, signUp, createUser, resetEmulators, cdnFile, PROJECT, FS, AUTH, CDN, OWNER_EMAIL, OWNER_UID, artifacts, fsUrl, loads};
