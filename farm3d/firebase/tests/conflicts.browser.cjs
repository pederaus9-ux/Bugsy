// Phase 7N: two independent browser devices, one account, real production
// auth/game code and pinned SDK against demo-only Firestore/Auth emulators.
// Rendering is paused on the inactive page, not save/auth logic. No live writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {startEmu, resetEmulators, readDoc, artifacts, economyCalls} = require('./emu-harness.cjs');
const SAVE = 'sunny-acres-3d-v1', results = [];

(async () => {
  await resetEmulators();
  const E = await startEmu(); let failed = true;
  const devices = [];
  try {
    const state = p => E.P(p, () => ({raw:localStorage.getItem('sunny-acres-3d-v1'),
      dirty:localStorage.getItem('sa3d-dirty'), rev:+localStorage.getItem('sa3d-sync-rev'),
      marker:__dbg.G.S.__sentinel, coins:__dbg.G.S.coins, uid:window.saAuth.user?.uid,
      backupPhone:localStorage.getItem('sunny-acres-3d-v1-backup-phone'),
      backupAccount:localStorage.getItem('sunny-acres-3d-v1-backup-account'),
      linkReads:window.__conflictLinkReads || []}));
    async function freeze(p, notify = false) {
      await E.P(p, notify => {
        Object.defineProperty(document, 'hidden', {configurable:true,get:()=>true});
        if (notify) document.dispatchEvent(new Event('visibilitychange'));
      }, notify);
    }
    async function settled(p, uid, marker) {
      for (let i = 0; i < 60; i++) {
        const c = await readDoc('farms/' + uid), s = await state(p);
        if (c && JSON.parse(c.save).__sentinel === marker && s.dirty === null && s.rev === c.rev) return c;
        await p.page.waitForTimeout(500);
      }
      throw new Error('Cloud did not settle on ' + marker);
    }
    async function edit(p, marker, coins) {
      await E.P(p, ({marker,coins}) => {
        const G = __dbg.G; G.opts.quiet = true; G.close();
        G.S.__sentinel = marker; G.S.coins = coins; G.S.xp += 1;
        G.S.nextEventAt = G.S.nextVisitorAt = G.S.nextRushAt = 9e15;
        G.commit();
      }, {marker,coins});
    }
    for (const choice of ['cloud', 'phone']) {
      const a = await E.phone('conflict-' + choice + '-a');
      const b = await E.phone('conflict-' + choice + '-b'); devices.push(a,b);
      // Log exactly the save bytes consumed by linkFarm, without changing reads.
      // This distinguishes the backup contract from timestamps written on exit.
      await b.context.addInitScript(() => {
        const read = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
          const value = read.call(this,key);
          if (key === 'sunny-acres-3d-v1' && new Error().stack?.includes('linkFarm'))
            (window.__conflictLinkReads ||= []).push(value);
          return value;
        };
      });
      const email = 'conflict-' + choice + '@example.com';
      const uid = await E.register(a,email);
      await freeze(a); await edit(a,choice+'-base',120); await freeze(a,true);
      const base = await settled(a,uid,choice+'-base'); await E.sleep(a);
      await b.page.goto(E.base+'farm3d/?debug');
      await b.page.waitForSelector('#authGate:not([hidden])',{timeout:180000});
      await b.page.fill('#authEmail',email); await b.page.fill('#authPass','hunter22');
      await b.page.click('#authGo');
      await E.until(b, marker => window.__ready && window.__dbg?.G.S.__sentinel === marker && window.saAuth.user,
        choice+'-base',180000);
      await freeze(b); const common = await state(b);
      assert.equal(common.uid,uid); assert.equal(common.rev,base.rev);
      // B changes its farm offline. A can then save a different, newer revision.
      b.offline = true; await edit(b,choice+'-phone',220);
      const phoneLocal = await state(b);
      assert.equal(phoneLocal.dirty,'1'); assert.equal(phoneLocal.rev,base.rev);
      assert.equal((await readDoc('farms/'+uid)).save,base.save,'offline edit never overwrites cloud');
      await E.wake(a); await freeze(a); await edit(a,choice+'-cloud',320); await freeze(a,true);
      const cloud = await settled(a,uid,choice+'-cloud');
      assert.ok(cloud.rev > base.rev); await E.sleep(a);
      // Restore B's connection without reloading: force the real upload() via
      // its existing background event and wait for its revision-refusal warning.
      b.farmWrites = [];
      const refused = b.page.waitForEvent('console',{predicate:m=>m.text().includes('saved from another phone meanwhile'),timeout:30000});
      b.offline = false; await freeze(b,true); await refused;
      const stale = await state(b), unchanged = await readDoc('farms/'+uid);
      assert.equal(stale.dirty,'1'); assert.equal(stale.rev,base.rev);
      assert.equal(stale.marker,choice+'-phone'); assert.equal(stale.coins,220);
      assert.equal(unchanged.rev,cloud.rev); assert.equal(unchanged.save,cloud.save);
      assert.equal(b.farmWrites.length,0,'stale transaction sends no farm update');
      // Reopening must offer both farms; neither is silently selected.
      await b.page.reload({waitUntil:'load'});
      await b.page.waitForSelector('#authChoose:not([hidden])',{timeout:180000});
      await E.until(b,()=>window.__ready&&window.__dbg,null,180000); await freeze(b);
      const shown = await state(b);
      const exactPhone = shown.linkReads.at(-1);
      assert.ok(exactPhone,'capture the actual original phone bytes passed to conflict choice');
      assert.equal(JSON.parse(exactPhone).__sentinel,choice+'-phone');
      assert.match(await b.page.locator('[data-pick="phone"] small').textContent(),/220/);
      assert.match(await b.page.locator('[data-pick="cloud"] small').textContent(),/320/);
      assert.equal((await readDoc('farms/'+uid)).save,cloud.save,'showing chooser changes no cloud farm');
      // The inactive document is hidden, so dispatch through the actual DOM
      // handler rather than asking Playwright to bring it to the foreground.
      await E.P(b,pick=>document.querySelector('[data-pick="'+pick+'"]').click(),choice);
      const selected = choice+'-'+choice;
      await E.until(b,marker=>window.__ready&&window.__dbg?.G.S.__sentinel===marker&&window.saAuth.user,selected,180000);
      await freeze(b);
      let c = await readDoc('farms/'+uid), s = await state(b);
      assert.equal(JSON.parse(c.save).__sentinel,selected);
      assert.equal(s.coins,choice==='cloud'?320:220);
      if(choice==='cloud') {
        assert.equal(s.backupPhone,exactPhone,'unselected phone save backed up byte for byte');
        assert.equal(c.save,cloud.save); assert.equal(c.rev,cloud.rev);
      } else {
        assert.equal(s.backupAccount,cloud.save,'unselected cloud save backed up byte for byte');
        assert.ok(c.rev>cloud.rev);
      }
      const backup = choice==='cloud'?s.backupPhone:s.backupAccount;
      await b.page.reload({waitUntil:'load'});
      await E.until(b,marker=>window.__ready&&window.__dbg?.G.S.__sentinel===marker&&window.saAuth.user,selected,180000);
      await freeze(b); s = await state(b); c = await readDoc('farms/'+uid);
      assert.equal(choice==='cloud'?s.backupPhone:s.backupAccount,backup,'backup survives reload');
      assert.equal(JSON.parse(c.save).__sentinel,selected); assert.equal(s.marker,selected);
      results.push({choice,uid,baseRev:base.rev,newCloudRev:cloud.rev,selectedRev:c.rev,
        selectedMarker:s.marker,coins:s.coins,backupBytes:Buffer.byteLength(backup),staleFarmWrites:0});
      fs.writeFileSync(path.join(artifacts,'conflicts-results.json'),JSON.stringify({results,failed:true},null,2));
      console.log('PASS same-account '+choice+' choice: stale upload refused, progress and byte-exact backup survive reload');
      await E.sleep(b); await a.context.close(); await b.context.close();
    }
    assert.deepEqual(E.denials,[],'no permissions errors in intended game operations');
    assert.equal(economyCalls.length,0,'production-shaped test never enables verified economy');
    failed = false;
  } finally {
    fs.writeFileSync(path.join(artifacts,'conflicts-results.json'),JSON.stringify({results,failed},null,2));
    if(failed)for(const p of devices)if(p.page&&!p.page.isClosed())
      await p.page.screenshot({path:path.join(artifacts,p.name+'-failure.png'),timeout:15000}).catch(()=>{});
    await E.close();
  }
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
