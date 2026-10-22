// Saved custom pens survive a real page reload: own horses/sheep/pets, save a moved
// horse pen through the game's own save path, reload, then check installation and
// 60 simulated seconds of ordinary movement. Not yet part of a hosted workflow.
const assert=require('assert/strict');
const {start}=require('./browser-harness.cjs');
(async()=>{
 const h=await start({deviceScaleFactor:.5});const report={steps:[]};let s;
 try{
  s=await h.setup({width:844,height:390},false,'pen-restore-diag');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  const ready=()=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready();
  report.steps.push({step:'default boot',errors:[...s.errors]});
  // Own horses, sheep and both pets (same shape as remaining-care.browser.cjs), then save a translated horse pen.
  const saved=await p.evaluate(async()=>{const d=__dbg,G=d.G,t=Date.now(),L=await import('./animal-pen-layout.js?v=1');
   G.S.tut=99;G.S.level=20;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
   for(const[k,n]of[['horse',4],['sheep',5]])G.S.pens[k]={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Diag '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];
   G.view.refresh('all');
   const horse=L.defaultSiteRecord('horse'),delta=[0,1];
   horse.boundary.forEach(v=>{v.x+=delta[0];v.z+=delta[1];});for(const id in horse.structures){const q=horse.structures[id];horse.structures[id]=[q[0]+delta[0],q[1]+delta[1]];}
   G.S.layout={...(G.S.layout||{b:{},t:{}}),animalPens:{v:1,revision:1,sites:{horse}}};const ok=G.save();
   const raw=JSON.parse(localStorage.getItem('sunny-acres-3d-v1'));
   return {ok,v:raw.v,savedRevision:raw.layout?.animalPens?.revision,expectedPolygon:L.resolveAnimalPens(raw.layout.animalPens).sites.horse.polygon,defaultHorseCustom:!!d.remainingLayouts.horse.custom};});
  report.steps.push({step:'saved custom horse layout',saved,errors:[...s.errors]});
  await p.reload();await ready();
  const after=await p.evaluate(()=>{const d=__dbg,l=d.remainingLayouts.horse,pen=d.PEN_LIST.find(q=>q.kinds?.includes('horse')&&q.care==='horse');
   const horses=d.animals.filter(a=>a.kind==='horse'),sheep=d.animals.filter(a=>a.kind==='sheep');
   return {horseCustom:!!l.custom,horseRevision:l.revision,polygon:l.polygon,penCustom:!!pen?.custom,penPolyMatches:JSON.stringify(pen?.poly)===JSON.stringify(l.polygon),
    sites:Object.fromEntries(Object.entries(d.remainingSites).map(([k,x])=>[k,{active:x.active,issues:x.issues.length,needsReload:x.needsReload}])),
    horsesInside:horses.map(a=>d.inPen(pen,a.g.position.x,a.g.position.z,0)),sheepCount:sheep.length,horseCount:horses.length,saveRevision:JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision};});
  report.steps.push({step:'reloaded',after,errors:[...s.errors]});
  // Let the herd live for 60 simulated seconds through the ordinary per-frame update path.
  const lived=await p.evaluate(()=>{const d=__dbg,pen=d.PEN_LIST.find(q=>q.care==='horse');let t=d.clock(),outside=0;for(let n=0;n<1800;n++){t+=1/30;d.setClock(t);for(const a of d.animals)a.update(1/30,t);for(const a of d.animals.filter(a=>a.kind==='horse'))if(!d.inPen(pen,a.g.position.x,a.g.position.z,-.05))outside++;}return {simulatedSeconds:60,horseFramesOutside:outside};});
  report.steps.push({step:'60 simulated seconds',lived,errors:[...s.errors]});
  assert.equal(saved.ok,true);assert.equal(saved.v,4);assert.equal(after.horseCustom,true);assert.equal(after.penCustom,true);assert(after.penPolyMatches);
  assert.equal(JSON.stringify(after.polygon),JSON.stringify(saved.expectedPolygon));assert(after.horsesInside.every(Boolean),'horse spawned outside custom pen');
  assert.equal(after.saveRevision,1);assert.equal(lived.horseFramesOutside,0);assert.deepEqual(s.errors,[]);
  report.result='PASS';
 }catch(e){report.result='FAIL';report.error=String(e.stack||e);report.errors=s?.errors;}
 finally{await s?.finish(report.result!=='PASS');await h.close?.();console.log(JSON.stringify(report,null,1));process.exitCode=report.result==='PASS'?0:1;}
})();
