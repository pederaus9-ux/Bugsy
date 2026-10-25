// One logical page-termination boundary; not a physical power-loss/disk-durability test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const backup=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-edited-recovery-20261025/browser-first/disposable-backup.json')));
const current=structuredClone(backup.farm);current.coins+=17;current.layout.animalPens.revision++;for(const v of current.layout.animalPens.sites.horse.boundary)if(['v0','v3'].includes(v.id))v.x=-36;
const keys=['sunny-acres-3d-v1','sa3d-restored','sa3d-dirty','sunny-acres-3d-v1-weather'];
const report={source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),status:'RUNNING',boundary:'after SAVE_KEY succeeds, before sa3d-restored',scope:'disposable guest; logical tab close, not physical crash; no cloud claim'};
const write=()=>fs.writeFileSync(path.join(artifacts,'interruption.json'),JSON.stringify(report,null,2));
const ready=p=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
let h,session;
(async()=>{try{
 h=await start({deviceScaleFactor:.25});session=await h.setup({width:844,height:390},true,'interruption');const p=session.page;write();
 // Context-level interception also isolates the replacement tab.
 await session.context.route('**/*',route=>{const u=route.request().url();if(u.startsWith(h.base))return route.continue();return route.fulfill({contentType:u.includes('gstatic.com/firebasejs/')?'text/javascript':'application/json',body:u.includes('gstatic.com/firebasejs/')?'export {};':'{}'});});
 await p.addInitScript(({current,now})=>{Date.now=()=>now;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(current));},{current,now:backup.at});
 await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready(p);await p.evaluate(()=>{__dbg.G.close();__dbg.G.save();localStorage.removeItem('sa3d-restored');localStorage.removeItem('sa3d-dirty');});
 report.before=await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),keys);write();
 const cdp=await session.context.newCDPSession(p);await cdp.send('Debugger.enable');
 await p.evaluate(()=>{window.__restoreTrace=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const result=original.call(this,k,v);window.__restoreTrace.push(k);if(k==='sunny-acres-3d-v1')debugger;return result;};});
 await p.locator('#restoreInput').setInputFiles({name:'edited-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await p.waitForFunction(()=>__dbg.G.panel?.type==='confirm',null,{timeout:10000});
 let timer;const paused=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('Restore did not pause at the selected boundary')),10000);cdp.once('Debugger.paused',e=>{clearTimeout(timer);resolve(e);});});
 const click=p.locator('[data-act="confirmYes"]').click({timeout:10000}).catch(e=>{report.clickTermination=String(e.message);});
 const stop=await paused;
 const state=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:stop.callFrames[0].callFrameId,expression:`JSON.stringify({storage:Object.fromEntries(${JSON.stringify(keys)}.map(k=>[k,localStorage.getItem(k)])),trace:window.__restoreTrace,live:__dbg.G.S})`,returnByValue:true});
 assert.equal(state.exceptionDetails,undefined);report.atBoundary=JSON.parse(state.result.value);report.stack=stop.callFrames.map(f=>({function:f.functionName,url:f.url,location:f.location}));write();
 assert.deepEqual(report.atBoundary.trace,[keys[0]]);assert.equal(report.atBoundary.storage['sa3d-restored'],null);assert.equal(report.atBoundary.storage['sa3d-dirty'],null);
 assert.deepEqual(JSON.parse(report.atBoundary.storage[keys[0]]),backup.farm);assert.equal(report.atBoundary.live.coins,current.coins);
 // Closing a paused tab alone resumes its stack (retained first harness ERROR).
 // CDP's documented termination at resume aborts the paused restore stack first.
 await cdp.send('Debugger.resume',{terminateOnResume:true});
 report.termination='Debugger.resume terminateOnResume=true';
 await p.close({runBeforeUnload:false});await click;report.closedAtBoundary=true;write();
 const next=await session.context.newPage();await next.addInitScript(({now,keys})=>{Date.now=()=>now;window.__storageAtBoot=Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));},{now:backup.at,keys});
 await next.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready(next);
 report.reopened=await next.evaluate(()=>({atBoot:window.__storageAtBoot,farm:JSON.parse(JSON.stringify(__dbg.G.S)),revision:__dbg.penRuntime.revision,ids:__dbg.animals.filter(a=>!a.gone).map(a=>a.kind+':'+(a.ref.i??a.ref.j??0)).sort(),polygon:__dbg.remainingLayouts.horse.polygon}));
 assert.deepEqual(report.reopened.atBoot,report.atBoundary.storage,'no post-boundary restore writes ran');assert.deepEqual(report.reopened.farm,backup.farm,'guest boot installs complete restored farm exactly');assert.equal(report.reopened.ids.length,46);assert.equal(new Set(report.reopened.ids).size,46);assert.equal(report.reopened.revision,backup.farm.layout.animalPens.revision);
 await next.screenshot({path:path.join(artifacts,'interrupted-restore-reopened.png')});report.guestBoot='PASS';
 try{assert.equal(report.reopened.atBoot['sa3d-restored'],'1','durable restore intent must survive interruption before account handoff');report.restoreIntent='PASS';}catch(e){report.restoreIntent='FAIL';report.error=e.message;}
 report.status=report.restoreIntent==='PASS'?'PASS':'FAIL';
}catch(e){report.status='ERROR';report.error=String(e.stack||e);console.error(report.error);}finally{write();if(h)await h.close(report.status!=='PASS');process.exitCode=report.status==='PASS'?0:1;console.log(JSON.stringify({status:report.status,guestBoot:report.guestBoot,restoreIntent:report.restoreIntent,error:report.error}));}})();
