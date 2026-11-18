const __conflictProbe=require('../../tests/helpers/a53-conflict-progress.cjs').create();
// Phase 7N: two independent browser devices, one account, real production
// auth/game code and pinned SDK against demo-only Firestore/Auth emulators.
// Rendering is paused on the inactive page, not save/auth logic. No live writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {startEmu, resetEmulators, readDoc, artifacts, economyCalls} = require('./emu-harness.cjs');
const SAVE = 'sunny-acres-3d-v1', results = [];
const assertEdited=(raw,expected)=>{const o=JSON.parse(raw);assert.deepEqual(o.layout.animalPens,expected.layout);assert.deepEqual(o.pens.horse,expected.horses);assert.deepEqual(o.decor,expected.decor);assert.equal(o.v,expected.v);};
const edited=raw=>{const o=JSON.parse(raw);return {layout:o.layout.animalPens,horses:o.pens.horse,decor:o.decor,v:o.v};};

(async () => {
  __conflictProbe.mark(1);
  const sample={v:4,layout:{animalPens:{v:1,revision:2,sites:{horse:{boundary:[{id:'v0',x:-37,z:1}]}}}},pens:{horse:{owned:true,list:[0,0,0,0]}},decor:{inv:{utilitylamp:1},placed:[]}},expected=edited(JSON.stringify(sample));
  for(const mutate of [o=>o.layout.animalPens.revision++,o=>o.layout.animalPens.sites.horse.boundary[0].x++,o=>o.pens.horse.list.pop(),o=>o.decor.inv.utilitylamp=0,o=>o.v=3]){const bad=structuredClone(sample);mutate(bad);assert.throws(()=>assertEdited(JSON.stringify(bad),expected));}console.log('PASS five edited-save corruption controls');
  __conflictProbe.mark(2);
  await resetEmulators();
  __conflictProbe.mark(3);
  const E = await startEmu(); let failed = true;
  const devices = [], diagnostics = [];
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
      await E.P(p, async ({marker,coins}) => {
        const G = __dbg.G; G.opts.quiet = true; G.close();
        G.S.__sentinel = marker; G.S.coins = coins; G.S.xp += 1;
        G.S.nextEventAt = G.S.nextVisitorAt = G.S.nextRushAt = 9e15;
        G.S.tut=99;G.S.level=Math.max(20,G.S.level);
        if(!G.S.pens.horse?.owned){G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Conflict Horse '+i,love:50,loveAt:Date.now()}))};G.S.decor.inv.utilitylamp=1;G.S.decor.placed.push({id:'utilitylamp',x:20,z:20,rotation:.57});G.view.refresh('all');}
        const e=__dbg.penEditor,L=await import('./animal-pen-layout.js?v=1');if(!e.begin('horse'))throw Error('Editor refused conflict fixture');
        const site=e.snapshot().draft.sites.horse??L.defaultSiteRecord('horse'),x=marker.endsWith('-base')?-37:marker.endsWith('-phone')?-36:-35;
        for(const id of ['v0','v3']){const v=site.boundary.find(v=>v.id===id);if(!e.dispatch({type:'moveVertex',kind:'horse',id,to:[x,v.z]}))throw Error('Conflict vertex refused');}
        if(!await e.validateNow())throw Error('Invalid conflict pen: '+e.snapshot().reason);if(!await e.apply())throw Error('Conflict Apply refused');G.commit();
      }, {marker,coins});
    }
    for (const mode of ['ordinary','equal-clock']) for (const choice of ['cloud', 'phone']) {
      __conflictProbe.mark(4);
      __conflictProbe.begin(mode,choice);
      const a = await E.phone('conflict-' + mode + '-' + choice + '-a');
      __conflictProbe.mark(5);
      const b = await E.phone('conflict-' + mode + '-' + choice + '-b'); devices.push(a,b);
      // Log exactly the save bytes consumed by linkFarm, without changing reads.
      // This distinguishes the backup contract from timestamps written on exit.
      __conflictProbe.mark(6);
      await b.context.addInitScript(() => {
        const read = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
          const value = read.call(this,key);
          if (key === 'sunny-acres-3d-v1' && new Error().stack?.includes('linkFarm'))
            (window.__conflictLinkReads ||= []).push(value);
          return value;
        };
      });
      // Fixed per-device fixture clocks prevent incidental boot timestamps from
      // racing the common baseline. Real timeout/debounce timers are unchanged.
      // Ordinary branches advance independently; equal-clock branches do not.
      __conflictProbe.mark(7);
      const clock=Date.now();for(const p of [a,b])await p.context.addInitScript(t=>{Date.now=()=>Number(sessionStorage.getItem('a27-clock')||t);},clock);
      const email = 'conflict-' + mode + '-' + choice + '@example.com';
      __conflictProbe.mark(8);
      const uid = await E.register(a,email);
      __conflictProbe.mark(9);
      await freeze(a); await edit(a,choice+'-base',120); await freeze(a,true);
      __conflictProbe.mark(10);
      await settled(a,uid,choice+'-base');
      // Initialize the artificially raised level through the real boot path
      // before capturing the common revision (perks/holiday/order initialization).
      __conflictProbe.mark(11);
      await a.page.reload({waitUntil:'load'});await E.until(a,()=>window.__ready&&window.__dbg&&window.saAuth.user,null,180000);await freeze(a);await freeze(a,true);
      __conflictProbe.mark(12);
      const base = await settled(a,uid,choice+'-base'); await E.sleep(a);
      __conflictProbe.mark(13);
      await b.page.goto(E.base+'farm3d/?debug');
      __conflictProbe.mark(14);
      await b.page.waitForSelector('#authGate:not([hidden])',{timeout:180000});
      __conflictProbe.mark(15);
      await b.page.fill('#authEmail',email); await b.page.fill('#authPass','hunter22');
      __conflictProbe.mark(16);
      await b.page.click('#authGo');
      __conflictProbe.mark(17);
      await E.until(b, marker => window.__ready && window.__dbg?.G.S.__sentinel === marker && window.saAuth.user,
        choice+'-base',180000);
      __conflictProbe.mark(18);
      await freeze(b); const common = await state(b);
      fs.writeFileSync(path.join(artifacts,'conflict-base-capture.json'),JSON.stringify({mode,choice,base,common,current:await readDoc('farms/'+uid)},null,2));
      __conflictProbe.mark(19);
      assert.equal(common.uid,uid); assert.equal(common.rev,base.rev);
      // B changes its farm offline. A can then save a different, newer revision.
      __conflictProbe.mark(20);
      b.offline = true;if(mode==='ordinary')await E.P(b,t=>sessionStorage.setItem('a27-clock',String(t)),clock+1000); await edit(b,choice+'-phone',220);
      __conflictProbe.mark(21);
      const phoneLocal = await state(b);
      __conflictProbe.mark(22);
      assert.equal(phoneLocal.dirty,'1'); assert.equal(phoneLocal.rev,base.rev);
      __conflictProbe.mark(23);
      assert.equal((await readDoc('farms/'+uid)).save,base.save,'offline edit never overwrites cloud');
      __conflictProbe.mark(24);
      await E.wake(a); await freeze(a);if(mode==='ordinary')await E.P(a,t=>sessionStorage.setItem('a27-clock',String(t)),clock+2000); await edit(a,choice+'-cloud',320); await freeze(a,true);
      __conflictProbe.mark(25);
      const cloud = await settled(a,uid,choice+'-cloud');
      __conflictProbe.mark(26);
      if(mode==='equal-clock')assert.equal(JSON.parse(cloud.save).lastSeen,JSON.parse(phoneLocal.raw).lastSeen,'competing saves have equal clocks');
      __conflictProbe.mark(27);
      const expectedPhone=edited(phoneLocal.raw),expectedCloud=edited(cloud.save);assert.notDeepEqual(expectedPhone.layout,expectedCloud.layout);assert.equal(expectedPhone.layout.revision,expectedCloud.layout.revision);assertEdited(base.save,edited(common.raw));
      __conflictProbe.mark(28);
      assert.ok(cloud.rev > base.rev); await E.sleep(a);
      // Restore B's connection without reloading: force the real upload() via
      // its existing background event and wait for its revision-refusal warning.
      b.farmWrites = [];
      __conflictProbe.mark(29);
      const refused = b.page.waitForEvent('console',{predicate:m=>m.text().includes('saved from another phone meanwhile'),timeout:30000});
      __conflictProbe.mark(30);
      b.offline = false; await freeze(b,true); await refused;
      __conflictProbe.mark(31);
      const stale = await state(b), unchanged = await readDoc('farms/'+uid);
      __conflictProbe.mark(32);
      assert.equal(stale.dirty,'1'); assert.equal(stale.rev,base.rev);
      assert.equal(stale.marker,choice+'-phone'); assert.equal(stale.coins,220);
      assert.equal(unchanged.rev,cloud.rev); assert.equal(unchanged.save,cloud.save);
      assert.equal(b.farmWrites.length,0,'stale transaction sends no farm update');
      // Reopening must offer both farms; neither is silently selected.
      __conflictProbe.mark(33);
      await b.page.reload({waitUntil:'load'});
      __conflictProbe.mark(34);
      await b.page.waitForSelector('#authChoose:not([hidden])',{timeout:180000});
      __conflictProbe.mark(35);
      await E.until(b,()=>window.__ready&&window.__dbg,null,180000); await freeze(b);
      __conflictProbe.mark(36);
      const shown = await state(b);
      const exactPhone = shown.linkReads.at(-1);
      __conflictProbe.mark(37);
      assert.ok(exactPhone,'capture the actual original phone bytes passed to conflict choice');
      assert.equal(JSON.parse(exactPhone).__sentinel,choice+'-phone');
      __conflictProbe.mark(38);
      assert.match(await b.page.locator('[data-pick="phone"] small').textContent(),/220/);
      assert.match(await b.page.locator('[data-pick="cloud"] small').textContent(),/320/);
      __conflictProbe.mark(39);
      assert.equal((await readDoc('farms/'+uid)).save,cloud.save,'showing chooser changes no cloud farm');
      // The inactive document is hidden, so dispatch through the actual DOM
      // handler rather than asking Playwright to bring it to the foreground.
      __conflictProbe.mark(40);
      const diagnostic=await require('./conflict-choice-diagnostic.cjs').choiceDiagnostic(b.page,artifacts,mode+'-'+choice);diagnostics.push(diagnostic);diagnostic.choice();
      __conflictProbe.mark(41);
      await E.P(b,pick=>document.querySelector('[data-pick="'+pick+'"]').click(),choice);
      const selected = choice+'-'+choice;
      __conflictProbe.mark(42);
      await E.until(b,marker=>window.__ready&&window.__dbg?.G.S.__sentinel===marker&&window.saAuth.user,selected,180000);
      await freeze(b);
      __conflictProbe.mark(43);
      let c = await readDoc('farms/'+uid), s = await state(b);
      __conflictProbe.mark(44);
      try{assert.equal(JSON.parse(c.save).__sentinel,selected);diagnostic.assertion(c,s,selected,false);}
      catch(error){diagnostic.assertion(c,s,selected,true);await diagnostic.follow(()=>readDoc('farms/'+uid));throw error;}
      __conflictProbe.mark(45);
      assert.equal(s.coins,choice==='cloud'?320:220);
      __conflictProbe.mark(46);
      if(choice==='cloud') {
        assert.equal(s.backupPhone,exactPhone,'unselected phone save backed up byte for byte');
        assert.equal(c.save,cloud.save); assert.equal(c.rev,cloud.rev);
      } else {
        assert.equal(s.backupAccount,cloud.save,'unselected cloud save backed up byte for byte');
        assert.ok(c.rev>cloud.rev);
      }
      __conflictProbe.mark(47);
      assertEdited(s.raw,choice==='cloud'?expectedCloud:expectedPhone);assertEdited(c.save,choice==='cloud'?expectedCloud:expectedPhone);
      const backup = choice==='cloud'?s.backupPhone:s.backupAccount;
      __conflictProbe.mark(48);
      await b.page.reload({waitUntil:'load'});
      __conflictProbe.mark(49);
      await E.until(b,marker=>window.__ready&&window.__dbg?.G.S.__sentinel===marker&&window.saAuth.user,selected,180000);
      __conflictProbe.mark(50);
      await freeze(b); s = await state(b); c = await readDoc('farms/'+uid);
      __conflictProbe.mark(51);
      assert.equal(choice==='cloud'?s.backupPhone:s.backupAccount,backup,'backup survives reload');
      assert.equal(JSON.parse(c.save).__sentinel,selected); assert.equal(s.marker,selected);
      __conflictProbe.mark(52);
      assertEdited(s.raw,choice==='cloud'?expectedCloud:expectedPhone);assertEdited(c.save,choice==='cloud'?expectedCloud:expectedPhone);
      __conflictProbe.mark(53);
      results.push({mode,choice,uid,editedLayout:edited(s.raw),baseRev:base.rev,newCloudRev:cloud.rev,selectedRev:c.rev,
        selectedMarker:s.marker,coins:s.coins,backupBytes:Buffer.byteLength(backup),staleFarmWrites:0});
      __conflictProbe.mark(54);
      fs.writeFileSync(path.join(artifacts,'conflicts-results.json'),JSON.stringify({results,failed:true},null,2));
      console.log('PASS same-account '+mode+' '+choice+' choice: stale upload refused, progress and byte-exact backup survive reload');
      __conflictProbe.mark(55);
      __conflictProbe.completed();
      await diagnostic.finish();await E.sleep(b); await a.context.close(); await b.context.close();
    }
    __conflictProbe.mark(56);
    assert.deepEqual(E.denials,[],'no permissions errors in intended game operations');
    __conflictProbe.mark(57);
    assert.equal(economyCalls.length,0,'production-shaped test never enables verified economy');
    __conflictProbe.mark(58);
    failed = false;
  } catch(error) { __conflictProbe.caught(error,'body');throw error; } finally {
    __conflictProbe.cleanup('diagnostics');
    for(const diagnostic of diagnostics)await diagnostic.finish();
    __conflictProbe.cleanup('write-results');
    fs.writeFileSync(path.join(artifacts,'conflicts-results.json'),JSON.stringify({results,failed},null,2));
    __conflictProbe.cleanup('screenshots');
    if(failed)for(const p of devices)if(p.page&&!p.page.isClosed())
      await p.page.screenshot({path:path.join(artifacts,p.name+'-failure.png'),timeout:15000}).catch(()=>{});
    __conflictProbe.cleanup('close');
    await E.close();
    __conflictProbe.cleanup('complete');
  }
})().catch(error=>{__conflictProbe.caught(error,'top');console.error(error.stack||error);process.exitCode=1;});
