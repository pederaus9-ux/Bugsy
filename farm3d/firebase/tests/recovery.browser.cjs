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

const SAVE_KEY = 'sunny-acres-3d-v1';
const results = [];
const check = (name, cond, detail = '') => { results.push({name, ok: !!cond, detail}); console.log((cond ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); };
const cloud = async (uid) => { const d = await readDoc('farms/' + uid); return d ? {save: d.save, rev: d.rev} : null; };
const restWrite = (uid, save, rev) => fetch(fsUrl('farms/' + uid), {method: 'PATCH', headers: {Authorization: 'Bearer owner', 'Content-Type': 'application/json'},
  body: JSON.stringify({fields: {save: {stringValue: save}, level: {integerValue: '3'}, coins: {integerValue: '1'}, rev: {integerValue: String(rev)}, updatedAt: {integerValue: String(Date.now())}}})});
const restDelete = (uid) => fetch(fsUrl('farms/' + uid), {method: 'DELETE', headers: {Authorization: 'Bearer owner'}});
// the farm's real progress (the game re-saves a restored farm straight away with a new lastSeen and orders, so the phone
// copy is compared on this; the CLOUD copy is compared byte for byte)
const progress = (raw) => { try { const o = JSON.parse(raw); return JSON.stringify([o.__sentinel, o.level, o.xp, o.coins, o.gems, o.barn, o.plots && o.plots.length, o.stats]); } catch (e) { return 'unreadable'; } };
const has = (save, token) => typeof save === 'string' && save.includes('"__sentinel":"' + token + '"');

async function main() {
  for (const f of fs.existsSync(artifacts) ? fs.readdirSync(artifacts).filter(f => f.startsWith('console-')) : []) fs.unlinkSync(path.join(artifacts, f));
  await resetEmulators();
  const E = await startEmu(), {P} = E;
  const g = await E.phone('grandma');
  const st = () => P(g, (k) => ({sentinel: window.__dbg && window.__dbg.G.S && window.__dbg.G.S.__sentinel, level: window.__dbg && window.__dbg.G.S.level,
    coins: window.__dbg && window.__dbg.G.S.coins, recover: localStorage.getItem('sa3d-recover'), sync: localStorage.getItem('sa3d-sync-rev'),
    kept: localStorage.getItem(k + '-unreadable'), raw: localStorage.getItem(k), user: window.saAuth && window.saAuth.user && window.saAuth.user.email}), SAVE_KEY);
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
  let failed = false;
  try {
    const uid = await E.register(g, 'grandma@example.com');
    await P(g, () => { const G = window.__dbg.G; G.S.coins += 100; G.commit(); });

    // ---- 0. the race: auth.js signs in before game.js has read the save (cow3d.js held back 25 s)
    {
      const base = await establish(uid, 'race'), n0 = loads.grandma || 0; g.farmWrites = [];
      g.delayGame = 25000; g.authFile = process.env.AUTH_FILE || null;
      await corruptOnNextLoad('{"race cut');
      const t0 = Date.now(); await g.page.reload({waitUntil: 'load'});
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
    failed = true; console.log('RECOVERY ERROR', e.message); try { console.log('STATE', JSON.stringify(await st())); } catch (_) {}
    try { await g.page.screenshot({path: path.join(artifacts, 'recovery-failure.png')}); } catch (_) {}
  }
  await E.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\nRECOVERY: ${results.length - bad.length}/${results.length} passed (console logs: artifacts/console-*.log)`);
  fs.writeFileSync(path.join(artifacts, 'recovery.json'), JSON.stringify(results, null, 1));
  process.exit(bad.length || failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
