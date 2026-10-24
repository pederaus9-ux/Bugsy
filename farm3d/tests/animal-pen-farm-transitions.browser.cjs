// New-farm and historical 2D-import transitions after a custom pen exists.
// Disposable guest contexts only; no account, cloud or production save access.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const {assertNewFarmReload}=require('./animal-pen-farm-transition-oracle.cjs');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/2d-v1.json'),'utf8')).save;
const report={status:'RUNNING',steps:[]};
const record=(name,value)=>{report.steps.push({name,value});fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify(report,null,2));console.log('PASS '+name);};
const ready=p=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
const snapshot=p=>p.evaluate(()=>{const d=__dbg,S=d.G.S,horse=d.PEN_LIST.find(q=>q.care==='horse');return {raw:localStorage.getItem('sunny-acres-3d-v1'),coins:S.coins,level:S.level,horseOwned:!!S.pens.horse?.owned,horseCount:d.animals.filter(a=>a.kind==='horse'&&!a.gone).length,horseCustom:!!d.remainingLayouts.horse.custom,installedHorseCustom:!!horse?.custom,horsePolygon:horse?.poly,revision:S.layout?.animalPens?.revision??null,chickens:d.animals.filter(a=>a.kind==='chicken'&&!a.gone).length,dogs:d.animals.filter(a=>a.kind==='dog'&&!a.gone).length,pets:S.pets.map(a=>({kind:a.kind,name:a.name}))};});
(async()=>{
 const h=await start({deviceScaleFactor:.5});let current;
 try{
  current=await h.setup({width:844,height:390},false,'pen-new-farm');let p=current.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready(p);
  const seeded=await p.evaluate(async()=>{const d=__dbg,G=d.G,L=await import('./animal-pen-layout.js?v=1'),t=Date.now();G.S.tut=99;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Horse '+i,love:50,loveAt:t}))};const horse=L.defaultSiteRecord('horse');horse.boundary.forEach(v=>v.z+=1);for(const id of Object.keys(horse.structures))horse.structures[id]=[horse.structures[id][0],horse.structures[id][1]+1];G.S.layout.animalPens={v:1,revision:1,sites:{horse}};return G.save();});
  assert.equal(seeded,true);await p.reload();await ready(p);const before=await snapshot(p);
  assert.equal(before.horseOwned,true);assert.equal(before.horseCount,4);assert.equal(before.horseCustom,true);assert.equal(before.installedHorseCustom,true);assert.equal(before.revision,1);record('saved custom live horse pen precondition',{horses:before.horseCount,revision:before.revision});
  await p.getByRole('button',{name:'Settings',exact:true}).click();await p.getByRole('button',{name:/Start a new farm/}).click();await p.getByRole('button',{name:'Cancel',exact:true}).click();const cancelled=await snapshot(p);
  assert.equal(cancelled.raw,before.raw);assert.equal(cancelled.horseCount,4);assert.equal(cancelled.horseCustom,true);assert.equal(cancelled.installedHorseCustom,true);assert.deepEqual(cancelled.horsePolygon,before.horsePolygon);record('cancelled new farm preserves bytes layout and herd',{savedBytesSame:true,horses:cancelled.horseCount});
  await p.getByRole('button',{name:'Settings',exact:true}).click();await p.getByRole('button',{name:/Start a new farm/}).click();await p.getByRole('button',{name:'Start over',exact:true}).click();await p.waitForFunction(()=>!__dbg.G.S.pens.horse?.owned&&!__dbg.remainingLayouts.horse.custom);const fresh=await snapshot(p);
  assert.equal(fresh.horseOwned,false);assert.equal(fresh.horseCount,0);assert.equal(fresh.horseCustom,false);assert.equal(fresh.installedHorseCustom,false);assert.equal(fresh.revision,null);assert.notEqual(fresh.raw,before.raw);record('confirmed new farm retires custom pen and herd',{coins:fresh.coins,level:fresh.level,horses:fresh.horseCount,revision:fresh.revision});
  const reloadStart=await p.evaluate(()=>Date.now());await p.reload();await ready(p);const freshReload=await snapshot(p),reloadEnd=await p.evaluate(()=>Date.now()),day=await p.evaluate(()=>new Date().toLocaleDateString('en-CA'));assertNewFarmReload(fresh.raw,freshReload.raw,{day,reloadStart,reloadEnd});assert.equal(freshReload.horseCount,0);assert.equal(freshReload.installedHorseCustom,false);assert.equal(freshReload.revision,null);assert.deepEqual(current.errors,[]);record('new farm remains default after reload',{horses:freshReload.horseCount,errors:current.errors.length,quests:'valid current-day three',lastSeen:'advanced within reload window'});
  await current.finish();current=await h.setup({width:844,height:390},false,'pen-2d-import');p=current.page;
  await p.addInitScript(saved=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-v1',JSON.stringify(saved));},fixture);
  const readyImport=()=>p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.goto(h.base+'farm3d/?debug&portrait&sim=0&preset=noon');await readyImport();assert.equal(await p.getByRole('button',{name:'Bring my farm',exact:true}).isVisible(),true);
  const original2D=await p.evaluate(()=>localStorage.getItem('sunny-acres-v1'));assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-3d-v1')),null);
  await p.getByRole('button',{name:'Bring my farm',exact:true}).click();await p.waitForFunction(()=>!!localStorage.getItem('sunny-acres-3d-v1'));const imported=await snapshot(p);
  assert.equal(imported.coins,fixture.coins);assert.equal(imported.level,fixture.level);assert.equal(imported.chickens,fixture.pens.chicken.list.length);assert.equal(imported.dogs,1);assert.deepEqual(imported.pets.map(a=>a.kind),['dog']);assert.equal(imported.revision,null);assert.equal(imported.horseCustom,false);assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-v1')),original2D);record('visible 2D import preserves paid ownership and default pens',{coins:imported.coins,level:imported.level,chickens:imported.chickens,dogs:imported.dogs});
  await p.reload();await readyImport();const importedReload=await snapshot(p);assert.equal(importedReload.raw,imported.raw);assert.equal(importedReload.chickens,imported.chickens);assert.equal(importedReload.dogs,1);assert.equal(importedReload.revision,null);assert.deepEqual(current.errors,[]);record('2D-imported farm survives reload without custom pen',{chickens:importedReload.chickens,dogs:importedReload.dogs,errors:current.errors.length});
  report.status='PASS';
 }catch(error){report.status='FAIL';report.error=String(error.stack||error);report.errors=current?.errors;}
 finally{fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify(report,null,2));await current?.finish(report.status!=='PASS');await h.close();console.log(JSON.stringify({status:report.status,stages:report.steps.map(x=>x.name),error:report.error??null}));process.exitCode=report.status==='PASS'?0:1;}
})();
