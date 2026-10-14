// Distinct backup/restore probes; opt-in and isolated from production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {start,root}=require('./qualification-cdp.cjs');
const ref=process.env.QUALIFICATION_REF||'e2f2ab2edfdabdd0d9d78b896c21cad50fb82a9c';
const out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','qualification-recovery'));
const results=[];let stage='launch',h;
const pass=(name,detail)=>{results.push({name,status:'PASS',detail});console.log('PASS',name);};
const click=selector=>h.cdp.evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing control');el.click();})()`);
const state=()=>h.cdp.evaluate(`(()=>{const G=__dbg.G;return {farm:JSON.parse(JSON.stringify(G.S)),saved:localStorage.getItem(G.SAVE_KEY),flags:{restored:localStorage.getItem('sa3d-restored'),dirty:localStorage.getItem('sa3d-dirty')},weather:localStorage.getItem('sunny-acres-3d-v1-weather')};})()`);
const stable=farm=>{const s=structuredClone(farm);delete s.lastSeen;delete s.lastNag;delete s.lastBackup;return s;};
async function paste(code){await h.cdp.evaluate(`__dbg.G.openPanel('backup',{mode:'restore'});document.querySelector('#codeBox').value=${JSON.stringify(code)};document.querySelector('[data-act="restoreCode"]').click();`);}
(async()=>{
  let failed=true;
  try {
    h=await start(out,ref);
    await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('__qualifiedSeed')){localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');sessionStorage.setItem('__qualifiedSeed','1');}`});
    await h.boot();
    await h.cdp.evaluate(`(()=>{const G=__dbg.G;G.close();G.S.tut=99;G.S.nextEventAt=9e15;G.S.nextRushAt=9e15;G.S.nextVisitorAt=9e15;G.S.coins=432;G.S.look={skin:4,hat:1};G.plant(0,'wheat');G.save();G.openPanel('settings');})()`);
    stage='compressed export';
    const before=await state();
    await click('[data-act="backupCode"]');await h.cdp.until(`!!document.querySelector('#codeBox')?.value`);
    const code=await h.cdp.evaluate(`document.querySelector('#codeBox').value`);
    assert.ok(code.startsWith('SA2:'),'installed Chrome exports compressed SA2 code');
    const exported=JSON.parse(require('node:zlib').gunzipSync(Buffer.from(code.slice(4),'base64')).toString('utf8'));
    assert.deepEqual(exported.farm,before.farm);pass(stage,{format:'SA2',bytes:code.length,farmExact:true});
    stage='restore cancellation';
    await paste(code);await h.cdp.until(`__dbg.G.panel?.type==='confirm'`);await click('[data-act="closePanel"]');
    const cancelled=await state();assert.equal(cancelled.saved,before.saved);assert.deepEqual(cancelled.flags,before.flags);pass(stage,{storedFarmByteIdentical:true,flagsUnchanged:true});
    stage='invalid and truncated backup rejected';
    for(const bad of ['not a backup','SA2:AAAA','{"game":"sunny-acres","farm":','{"farm":{"level":2}}']){
      await paste(bad);await h.cdp.until(`document.querySelector('#toasts').textContent.includes("doesn't look like")`);
      assert.notEqual(await h.cdp.evaluate(`__dbg.G.panel?.type`),'confirm');const after=await state();assert.equal(after.saved,before.saved);assert.deepEqual(after.flags,before.flags);
    }pass(stage,{cases:4,storedFarmByteIdentical:true});
    stage='restore compressed export into changed farm';
    await h.cdp.evaluate(`__dbg.G.S.coins=99;__dbg.G.S.look.skin=1;__dbg.G.save();`);
    await paste(code);await h.cdp.until(`__dbg.G.panel?.type==='confirm'`);await click('[data-act="confirmYes"]');await h.cdp.until(`!!window.__dbg && !document.getElementById('loading') && __dbg.G.S.coins===${before.farm.coins}`);
    const restored=await state();assert.deepEqual(stable(restored.farm),stable(before.farm));assert.equal(restored.flags.restored,'1');assert.equal(restored.flags.dirty,'1');pass(stage,{farmExactExceptLifecycleTimestamps:true,coins:restored.farm.coins,crop:restored.farm.plots[0].crop,look:restored.farm.look});
    await h.reload();const reloaded=await state();assert.deepEqual(stable(reloaded.farm),stable(before.farm));pass('restored farm survives second reload',{farmExactExceptLifecycleTimestamps:true});
    stage='quota at primary restore write';
    const quotaBefore=await state();
    await h.cdp.evaluate(`window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='sunny-acres-3d-v1')throw new DOMException('test quota','QuotaExceededError');return window.__originalSetItem.call(this,k,v);};`);
    await paste(code);await h.cdp.until(`__dbg.G.panel?.type==='confirm'`);await click('[data-act="confirmYes"]');await h.cdp.until(`document.querySelector('#toasts').textContent.includes("Couldn't restore")`);
    await h.cdp.evaluate(`Storage.prototype.setItem=window.__originalSetItem;`);
    const quotaAfter=await state();assert.equal(quotaAfter.saved,quotaBefore.saved);assert.deepEqual(quotaAfter.flags,quotaBefore.flags);assert.equal(await h.cdp.evaluate('__dbg.G.save()'),true);pass(stage,{storedFarmByteIdentical:true,savingRecovers:true});
    assert.deepEqual(h.errors,[],'no uncaught page errors');await h.cdp.screenshot(path.join(out,'backup-restored.png'));failed=false;
  }catch(e){results.push({name:stage,status:'FAIL',error:e.stack});console.error(e.stack);process.exitCode=1;if(h)try{await h.cdp.screenshot(path.join(out,'first-failure.png'));}catch{}}
  finally{if(h)await h.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:failed?'FAIL':'PASS',sourceRef:ref,sourceTree:execFileSync('git',['rev-parse',ref+'^{tree}'],{cwd:root,encoding:'utf8'}).trim(),helperSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),node:process.version,results},null,2));}
})();
