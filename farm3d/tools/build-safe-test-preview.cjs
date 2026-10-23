// Publish a disposable Sunny Acres test build to a dedicated origin only.
// This changes generated files, never the game's checked-in runtime sources.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const source = path.join(root, 'farm3d');
const out = path.join(root, 'safe-test-preview');
if (fs.existsSync(out)) throw new Error('Refusing to reuse an existing preview output directory');
fs.mkdirSync(out);
for (const name of fs.readdirSync(source)) {
  if (name.endsWith('.js') || name === 'index.html' || name === 'manifest.webmanifest') {
    fs.copyFileSync(path.join(source, name), path.join(out, name));
  }
}
for (const name of ['art', 'assets', 'lib', 'tex']) {
  fs.cpSync(path.join(source, name), path.join(out, name), {recursive: true});
}
fs.mkdirSync(path.join(out, 'farm'));
for (const name of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) {
  fs.copyFileSync(path.join(root, 'farm', name), path.join(out, 'farm', name));
}
function replaceOnce(file, before, after) {
  const target = path.join(out, file);
  const text = fs.readFileSync(target, 'utf8');
  if (text.split(before).length !== 2) throw new Error(`Unexpected ${file} source for preview replacement`);
  fs.writeFileSync(target, text.replace(before, after));
}
function replaceSection(file, start, end, replacement) {
  const target = path.join(out, file);
  const text = fs.readFileSync(target, 'utf8');
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  if (a < 0 || b < 0 || text.indexOf(start, a + 1) >= 0 || text.indexOf(end, b + 1) >= 0) {
    throw new Error(`Unexpected ${file} section for preview replacement`);
  }
  fs.writeFileSync(target, text.slice(0, a) + replacement + text.slice(b));
}

// Seed the ordinary save path with a ready-made test farm. The editor's Apply
// remains usable and reloadable, but all saves belong only to this new origin.
replaceOnce('game.js',
  '  let raw = null; try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}',
  '  let raw = null; try { raw = localStorage.getItem(SAVE_KEY); if (!raw) { raw = JSON.stringify(Object.assign(sandboxFarm(), {event:null,nextEventAt:9e15,nextVisitorAt:9e15,nextRushAt:9e15,perks:{grow:1,sell:1,owed:0},holidayDone:Object.fromEntries(Object.keys(HOLIDAY_EVENTS).map(k=>[k+new Date().getFullYear(),1]))})); localStorage.setItem(SAVE_KEY, raw); } } catch (e) {}');
replaceOnce('game.js',
  '  try { if (localStorage.getItem(SAVE_2D)) return "has2d"; } catch (e) {} // the 2D game lives on the same site: offer to bring it over',
  '  // Preview never reads or imports a 2D farm.');
replaceOnce('game.js',
  'function panelBackup({mode, code}) {',
  'function panelBackup({mode, code}) { if (mode !== "show") return {title:"Import disabled",body:"This disposable preview cannot import a real farm."};');
replaceSection('game.js', 'async function restoreFrom(text) {', 'function import2D() {',
  'async function restoreFrom(text) { toast("Farm import is disabled in this preview."); }\n');
replaceSection('game.js', 'function import2D() {', '// ---------- start ----------',
  'function import2D() { toast("2D import is disabled in this preview."); }\n');
for (const [before, after] of [
  ['case "restoreFile": $("#restoreInput").click(); break;', 'case "restoreFile": toast("Farm import is disabled in this preview."); break;'],
  ['case "restorePaste": openPanel("backup", {mode:"restore"}); break;', 'case "restorePaste": toast("Farm import is disabled in this preview."); break;'],
  ['case "restoreCode": restoreFrom(($("#codeBox") || {}).value || ""); break;', 'case "restoreCode": toast("Farm import is disabled in this preview."); break;'],
  ['case "import2d": import2D(); break;', 'case "import2d": toast("2D import is disabled in this preview."); break;'],
]) replaceOnce('game.js', before, after);

// No Firebase SDK, login, cloud sync, statistics, or production account state.
fs.writeFileSync(path.join(out, 'auth.js'), `window.saAuth = {user:null, guest:false, fb:null, signOut:async()=>{}};
window.saStats = ()=>{};
document.getElementById('authGate').hidden = true;
`);

const policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-src 'none'";
replaceOnce('index.html', '<head>', `<head>\n<meta http-equiv="Content-Security-Policy" content="${policy}">`);
replaceOnce('index.html',
  'window.__ERR_HOOK = "https://discord.com/api/webhooks/1553556609853165587/S1nd5bv2-4Qv3CPEfHq1TdzxxaYDi2-14obt-ok2oxm476D7vxPPdTXK-IlWzqpgVpxQ";',
  'window.__ERR_HOOK = "";');
replaceOnce('index.html',
  'if ("serviceWorker" in navigator && location.protocol === "https:" && !qs.has("shot")) navigator.serviceWorker.register("sw.js").catch(() => {});',
  '// The disposable preview does not install a persistent service worker.');
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
html = html.replaceAll('../farm/icon-', 'farm/icon-');
html = html.replace('<title>Sunny Acres 3D</title>', '<title>Sunny Acres — disposable test preview</title>');
html = html.replace('</body>', `<style>body.pen-editing #previewNotice{display:none!important}</style><div id="previewNotice" style="position:fixed;bottom:8px;left:8px;z-index:99999;background:#192b20;color:white;padding:8px 10px;border:2px solid white;border-radius:8px;font:700 13px system-ui;max-width:min(92vw,420px)">TEST PREVIEW · This farm saves only on this preview site. No cloud account or live farm. <button id="previewReset" type="button" style="margin-left:5px;padding:5px">Reset test farm</button></div><script>document.getElementById('previewReset').onclick=()=>{if(confirm('Reset this disposable preview farm?')){localStorage.removeItem('sunny-acres-3d-v1');location.reload()}};</script></body>`);
fs.writeFileSync(path.join(out, 'index.html'), html);
let manifest = fs.readFileSync(path.join(out, 'manifest.webmanifest'), 'utf8');
manifest = manifest.replaceAll('../farm/icon-', 'farm/icon-');
manifest = manifest.replace('"start_url": "./"', '"start_url": "./index.html"');
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), manifest);

for (const file of ['auth.js', 'index.html', 'game.js']) {
  const text = fs.readFileSync(path.join(out, file), 'utf8');
  for (const forbidden of ['fir-config-18b64', 'firebaseapp.com', 'discord.com/api/webhooks']) {
    if (text.includes(forbidden)) throw new Error(`${file} still contains ${forbidden}`);
  }
}
console.log('Built disposable preview from committed game source');
