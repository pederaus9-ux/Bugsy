// Exercise actual downloaded JSON -> file-input restore, plus legacy SA1 code.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {start,wait}=require('./qualification-cdp.cjs');
const ref=process.env.QUALIFICATION_REF||'e2f2ab2edfdabdd0d9d78b896c21cad50fb82a9c';
const out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','qualification-file-restore'));
const results=[];let h,stage='launch';
const stable=f=>{const s=structuredClone(f);delete s.lastSeen;delete s.lastNag;delete s.lastBackup;return s;};
(async()=>{let failed=true;try{
  h=await start(out,ref);await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`if(!sessionStorage.getItem('__qualifiedSeed')){localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');sessionStorage.setItem('__qualifiedSeed','1');}`});await h.boot();
  await h.cdp.evaluate(`(()=>{const G=__dbg.G;G.close();G.S.tut=99;G.S.nextEventAt=9e15;G.S.nextRushAt=9e15;G.S.nextVisitorAt=9e15;G.S.coins=765;G.wear('skin',5);G.plant(0,'corn');G.save();G.openPanel('settings');})()`);
  stage='actual JSON backup download';const downloads=path.join(out,'downloads');fs.mkdirSync(downloads,{recursive:true});
  await h.cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  const before=await h.cdp.evaluate('JSON.parse(JSON.stringify(__dbg.G.S))');await h.cdp.evaluate(`document.querySelector('[data-act="backupFile"]').click()`);
  let file;for(let i=0;i<100;i++){file=fs.readdirSync(downloads).find(f=>f.endsWith('.json'));if(file)break;await wait(100);}assert(file,'actual download completed');file=path.join(downloads,file);
  const bytes=fs.readFileSync(file),backup=JSON.parse(bytes);assert.deepEqual(backup.farm,before);results.push({name:stage,status:'PASS',detail:{bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),farmExact:true}});console.log('PASS actual JSON backup download');
  stage='restore downloaded file via file input';await h.cdp.evaluate('__dbg.G.S.coins=12;__dbg.G.S.look.skin=1;__dbg.G.save();');
  const {root}=await h.cdp.send('DOM.getDocument');const {nodeId}=await h.cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'#restoreInput'});assert(nodeId,'production file input');
  await h.cdp.send('DOM.setFileInputFiles',{nodeId,files:[file]});await h.cdp.until(`__dbg.G.panel?.type==='confirm'`);
  await h.cdp.evaluate(`document.querySelector('[data-act="confirmYes"]').click()`);await h.cdp.until(`!!window.__dbg&&!document.getElementById('loading')&&__dbg.G.S.coins===765`);
  const restored=await h.cdp.evaluate('JSON.parse(JSON.stringify(__dbg.G.S))');assert.deepEqual(stable(restored),stable(before));assert.equal(await h.cdp.evaluate(`document.querySelector('#restoreInput').value`),'');results.push({name:stage,status:'PASS',detail:{farmExactExceptLifecycleTimestamps:true,inputCleared:true}});console.log('PASS restore downloaded file via file input');
  stage='uncompressed SA1 fallback export and restore';await h.cdp.evaluate(`window.CompressionStream=undefined;__dbg.G.openPanel('settings');document.querySelector('[data-act="backupCode"]').click();`);await h.cdp.until(`!!document.querySelector('#codeBox')?.value`);
  const code=await h.cdp.evaluate(`document.querySelector('#codeBox').value`);assert(code.startsWith('SA1:'));const exported=JSON.parse(Buffer.from(code.slice(4),'base64').toString('utf8'));assert.deepEqual(stable(exported.farm),stable(before));
  await h.cdp.evaluate(`__dbg.G.S.coins=13;__dbg.G.save();__dbg.G.openPanel('backup',{mode:'restore'});document.querySelector('#codeBox').value=${JSON.stringify(code)};document.querySelector('[data-act="restoreCode"]').click();`);await h.cdp.until(`__dbg.G.panel?.type==='confirm'`);await h.cdp.evaluate(`document.querySelector('[data-act="confirmYes"]').click()`);await h.cdp.until(`!!window.__dbg&&!document.getElementById('loading')&&__dbg.G.S.coins===765`);
  assert.deepEqual(stable(await h.cdp.evaluate('JSON.parse(JSON.stringify(__dbg.G.S))')),stable(before));assert.deepEqual(h.errors,[]);results.push({name:stage,status:'PASS',detail:{format:'SA1',farmExactExceptLifecycleTimestamps:true}});console.log('PASS SA1 fallback export and restore');await h.cdp.screenshot(path.join(out,'file-restored.png'));failed=false;
}catch(e){results.push({name:stage,status:'FAIL',error:e.stack});console.error(e.stack);process.exitCode=1;if(h)try{await h.cdp.screenshot(path.join(out,'first-failure.png'));}catch{}}
finally{if(h)await h.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({status:failed?'FAIL':'PASS',sourceRef:ref,helperSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),node:process.version,results},null,2));}})();
