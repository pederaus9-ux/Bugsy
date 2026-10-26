// Bounded native entry/pause/Apply/Discard journey. Full edit-operation journeys
// remain separate; viewport emulation is not physical-device qualification.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {start,artifacts,root}=require('./browser-harness.cjs');
const view=process.env.PEN_VIEWPORT||'390x844';
if(!['390x844','844x390','768x1024','1280x720'].includes(view))throw Error('Unknown PEN_VIEWPORT');
const [width,height]=view.split('x').map(Number),file=path.join(artifacts,'results.json');
if(fs.existsSync(file))throw Error('Preserve earlier entry evidence');
const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task7-codex-cow-validator-20261023/browser-final/results.json')));
const saved=prior.steps.find(x=>x.value.initialSave).value.initialSave;
const report={status:'RUNNING',view,input:'Trusted Playwright pointer/keyboard through real controls; debug API only for setup and observation',hashes:Object.fromEntries(['index.html','animal-pen-editor-view.js','animal-pen-editor.js','sw.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'farm3d',f))).digest('hex')])),steps:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');let h,s,p,stage='launch';save();
const record=(name,value)=>{report.steps.push({name,value});save();};
const state=()=>p.evaluate(()=>{const d=__dbg;return{save:localStorage.getItem(d.G.SAVE_KEY),camera:{yaw:d.cam.yaw,pitch:d.cam.pitch,dist:d.cam.dist,target:d.cam.target.toArray()},animals:d.animals.map(a=>({kind:a.kind,ref:a.ref,pos:a.g.position.toArray(),phase:a.phase,act:a.act,need:a.need,yaw:a.rig3d?.model.rotation.y,task:(a.chickenTask||a.remainingTask||a.cowTask)?{kind:(a.chickenTask||a.remainingTask||a.cowTask).kind,stage:(a.chickenTask||a.remainingTask||a.cowTask).stage,weight:(a.chickenTask||a.remainingTask||a.cowTask).weight,held:(a.chickenTask||a.remainingTask||a.cowTask).held}:null})),tokens:{chicken:d.chickenCare.snapshotLayout().tokens,remaining:d.remainingCare.snapshotLayout().tokens,cow:d.cowStations.snapshot()},editor:d.penEditor.snapshot()};});
async function chooseSheep(){const select=p.getByRole('combobox',{name:'Animal',exact:true});await select.focus();await p.keyboard.press('Home');for(let i=0;i<3;i++)await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForFunction(()=>__dbg.penEditor.snapshot().selection?.kind==='sheep',null,{timeout:10000});}
(async()=>{try{
 h=await start({deviceScaleFactor:.5});s=await h.setup({width,height},width<1000,'entry-'+view);p=s.page;report.browser=s.context.browser().version();report.playwright=require('playwright/package.json').version;
 await p.addInitScript(saved=>{window.__entryNow=1792594800000;Date.now=()=>window.__entryNow;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');if(!localStorage.getItem('sunny-acres-3d-v1'))localStorage.setItem('sunny-acres-3d-v1',saved);window.__entryInputs=[];for(const type of ['pointerdown','pointerup','click','keydown'])document.addEventListener(type,e=>window.__entryInputs.push({type,trusted:e.isTrusted,key:e.key,target:e.target.id||e.target.getAttribute?.('aria-label')||e.target.dataset?.action||e.target.tagName}),true);},saved);
 await p.goto(h.base+'farm3d/?debug&portrait&preset=noon');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 await p.evaluate(()=>{const G=__dbg.G;G.opts.quiet=true;G.close();G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;G.tick();});
 stage='native Edit > Animal pens entry';await p.locator('#editBtn').click();
 assert.equal(await p.getByRole('button',{name:'Animal pens',exact:true}).count(),1,'Edit menu must expose Animal pens');
 await p.waitForFunction(()=>__dbg.cam.pitch===1.53,null,{timeout:10000});const cameraBefore=(await state()).camera;await p.getByRole('button',{name:'Animal pens',exact:true}).click();
 await p.getByRole('region',{name:'Animal pen editor'}).waitFor({state:'visible',timeout:10000});
 const opened=await state();record(stage,opened);assert(opened.editor.open);assert.equal(opened.animals.length,46);
 stage='physical pause with normal production tick';
 await p.evaluate(()=>{__dbg.G.S.orders[0].wait=Date.now()+1000;window.__entryNow+=1200;});
 await p.waitForFunction(()=>!__dbg.G.S.orders[0].wait,null,{timeout:5000});
 const paused=await state();record(stage,paused);assert.deepEqual(paused.animals,opened.animals,'animal physical state advanced during draft');assert.deepEqual(paused.tokens,opened.tokens);
 stage='gameplay input isolation';await p.mouse.click(width*.85,height*.15);await p.keyboard.press('KeyF');
 const isolated=await state();record(stage,isolated);assert.deepEqual(isolated.animals,paused.animals);assert.equal(isolated.save,paused.save);assert.equal(await p.evaluate(()=>__dbg.G.panel),null);assert.equal(await p.evaluate(()=>__dbg.farmDrag),null);
 stage='native sheep nudge and real valid preview';await chooseSheep();await p.getByRole('button',{name:'Move left 1 metre',exact:true}).click();
 await p.waitForFunction(()=>__dbg.penEditor.snapshot().canApply,null,{timeout:30000});
 const draft=await state();record(stage,draft);assert(draft.editor.dirty);assert.equal(draft.save,paused.save);
 const targets=await p.getByRole('region',{name:'Animal pen editor'}).locator('button,select').evaluateAll(nodes=>nodes.filter(n=>!n.hidden&&n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return{label:n.getAttribute('aria-label')||n.textContent,w:r.width,h:r.height};}));assert(targets.every(t=>t.w>=43.9&&t.h>=43.9),JSON.stringify(targets));record('touch target sizes',targets);
 await p.screenshot({path:path.join(artifacts,'valid-sheep-draft.png')});
 stage='dirty close Keep editing and Discard';await p.getByRole('button',{name:'Close animal pen editor',exact:true}).click();
 const exit=p.locator('[data-exit]');await exit.waitFor({state:'visible'});assert.equal(await exit.getByRole('button').count(),3);await exit.getByRole('button',{name:'Keep editing',exact:true}).click();assert.deepEqual((await state()).editor.draft,draft.editor.draft);
 await p.getByRole('button',{name:'Close animal pen editor',exact:true}).click();await exit.getByRole('button',{name:'Discard',exact:true}).click();
 const discarded=await state();record(stage,discarded);assert(!discarded.editor.open);assert.equal(discarded.save,paused.save);assert.deepEqual(discarded.camera,cameraBefore);
 stage='native Apply and reload';await p.getByRole('button',{name:'Animal pens',exact:true}).click();await chooseSheep();await p.getByRole('button',{name:'Move left 1 metre',exact:true}).click();await p.waitForFunction(()=>__dbg.penEditor.snapshot().canApply,null,{timeout:30000});
 await p.locator('[data-action="apply"]').click();await p.waitForFunction(()=>!__dbg.penEditor.snapshot().open,null,{timeout:30000});
 const applied=await state();record(stage,applied);const appliedSave=JSON.parse(applied.save);assert.equal(appliedSave.layout.animalPens.revision,1);assert.deepEqual(appliedSave.layout.animalPens.sites.sheep,draft.editor.draft.sites.sheep);
 report.inputs=await p.evaluate(()=>window.__entryInputs);assert(report.inputs.some(e=>e.type==='click')&&report.inputs.some(e=>e.type==='keydown'));assert(report.inputs.every(e=>e.trusted),'native input trust');save();
 await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 const reloaded=await p.evaluate(()=>({revision:__dbg.penRuntime.revision,sheep:__dbg.penRuntime.layout.sites.sheep.record??__dbg.G.S.layout.animalPens.sites.sheep,count:__dbg.animals.length}));record('reload',reloaded);assert.equal(reloaded.revision,1);assert.equal(reloaded.count,46);assert.deepEqual(reloaded.sheep,appliedSave.layout.animalPens.sites.sheep);
 assert.deepEqual(s.errors,[]);report.status='PASS';
}catch(e){report.status='FAIL';report.stage=stage;report.error=String(e.stack||e);try{report.failureState=await state();report.inputs=await p.evaluate(()=>window.__entryInputs);}catch{}console.error(report.error);}
finally{save();if(h)await h.close(report.status!=='PASS');console.log(JSON.stringify({status:report.status,stage,file}));process.exitCode=report.status==='PASS'?0:1;}})();
