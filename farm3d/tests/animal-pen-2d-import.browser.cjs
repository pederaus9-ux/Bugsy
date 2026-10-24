// Independent historical 2D import through the visible control, in a disposable guest context.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/2d-v1.json'),'utf8')).save;
const report={status:'RUNNING',steps:[]};
const record=(name,value)=>{report.steps.push({name,value});fs.writeFileSync(path.join(artifacts,'import-results.json'),JSON.stringify(report,null,2));console.log('PASS '+name);};
const state=p=>p.evaluate(()=>{const d=__dbg,S=d.G.S;return {coins:S.coins,gems:S.gems,xp:S.xp,level:S.level,chickenOwned:S.pens.chicken.owned,chickenCount:S.pens.chicken.list.length,renderedChickens:d.animals.filter(a=>a.kind==='chicken'&&!a.gone).length,pets:S.pets.map(a=>({kind:a.kind,name:a.name})),renderedDogs:d.animals.filter(a=>a.kind==='dog'&&!a.gone).length,customHorse:!!d.remainingLayouts.horse.custom,customHorseInstalled:!!d.PEN_LIST.find(a=>a.care==='horse')?.custom,penRevision:S.layout?.animalPens?.revision??null,raw:localStorage.getItem('sunny-acres-3d-v1')};});
(async()=>{const h=await start({deviceScaleFactor:.5});let s;
 try{
  s=await h.setup({width:844,height:390},false,'pen-2d-import');const p=s.page;
  await p.addInitScript(farm=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-v1',JSON.stringify(farm));},fixture);
  const ready=()=>p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.goto(h.base+'farm3d/?debug&portrait&sim=0&preset=noon');await ready();
  assert.equal(await p.getByRole('button',{name:'Bring my farm',exact:true}).isVisible(),true);
  const source=await p.evaluate(()=>localStorage.getItem('sunny-acres-v1'));
  assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-3d-v1')),null);
  record('visible historical 2D import offered',{sourceBytes:source.length});
  await p.getByRole('button',{name:'Bring my farm',exact:true}).click();
  await p.waitForFunction(()=>!!localStorage.getItem('sunny-acres-3d-v1'));
  const imported=await state(p);
  for(const key of ['coins','gems','xp','level'])assert.equal(imported[key],fixture[key],key);
  assert.equal(imported.chickenOwned,true);assert.equal(imported.chickenCount,fixture.pens.chicken.list.length);assert.equal(imported.renderedChickens,fixture.pens.chicken.list.length);
  assert.deepEqual(imported.pets.map(a=>a.kind),fixture.pets.map(a=>a.kind));assert.equal(imported.renderedDogs,1);
  assert.equal(imported.penRevision,null);assert.equal(imported.customHorse,false);assert.equal(imported.customHorseInstalled,false);
  assert.equal(await p.evaluate(()=>localStorage.getItem('sunny-acres-v1')),source);
  record('actual 2D import installs paid state and default animal facilities',{coins:imported.coins,level:imported.level,chickens:imported.renderedChickens,dogs:imported.renderedDogs});
  await p.reload();await ready();const reloaded=await state(p);
  for(const key of ['coins','gems','xp','level','chickenOwned','chickenCount','renderedChickens','renderedDogs','customHorse','customHorseInstalled','penRevision'])assert.deepEqual(reloaded[key],imported[key],key);
  assert.deepEqual(reloaded.pets,imported.pets);assert.deepEqual(s.errors,[]);
  record('imported farm persists through reload',{chickens:reloaded.renderedChickens,dogs:reloaded.renderedDogs,pageErrors:s.errors.length});report.status='PASS';
 }catch(error){report.status='FAIL';report.error=String(error.stack||error);report.errors=s?.errors;}
 finally{fs.writeFileSync(path.join(artifacts,'import-results.json'),JSON.stringify(report,null,2));await s?.finish(report.status!=='PASS');await h.close();console.log(JSON.stringify({status:report.status,steps:report.steps.map(x=>x.name),error:report.error??null}));process.exitCode=report.status==='PASS'?0:1;}
})();
