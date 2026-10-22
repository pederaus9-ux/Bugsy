// Apply a pen edit through the real editor core and game.js transaction on a running farm
// (debug editor API, not trusted UI input; native touch journeys come with the Edit UI).
// Not yet part of a hosted workflow.
const assert=require('assert/strict');
const {start}=require('./browser-harness.cjs');
(async()=>{
 const h=await start({deviceScaleFactor:.5});const report={steps:[]};let s;
 try{
  s=await h.setup({width:844,height:390},false,'pen-apply');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  const ready=()=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready();
  await p.evaluate(()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
   for(const[k,n]of[['horse',4],['sheep',5]])G.S.pens[k]={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Apply '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');G.save();});
  const herd=()=>p.evaluate(()=>{const d=__dbg,pen=d.PEN_LIST.find(q=>q.care==='sheep'),sheep=d.animals.filter(a=>a.kind==='sheep');return {custom:!!d.remainingLayouts.sheep.custom,penCustom:!!pen.custom,inside:sheep.map(a=>d.inPen(pen,a.g.position.x,a.g.position.z,0)),sheep:sheep.length,horseCustom:!!d.remainingLayouts.horse.custom};});
  // Observation only (owner decision pending): which one-metre horse moves the approved rules refuse.
  const horseProbe=await p.evaluate(async()=>{const e=__dbg.penEditor,out=[];for(const delta of [[0,1],[1,0],[-1,0],[0,-1]]){e.begin('horse');e.dispatch({type:'movePen',kind:'horse',delta});const valid=await e.validateNow();out.push({delta,valid,reason:e.snapshot().reason});e.cancel();}return out;});
  report.steps.push({step:'observe one-metre horse moves (not asserted)',horseProbe});
  // Valid edit: move the whole sheep meadow one metre west, a move the mobility probe found legal.
  const applied=await p.evaluate(async()=>{const e=__dbg.penEditor,before=localStorage.getItem('sunny-acres-3d-v1');
   e.begin('sheep');e.dispatch({type:'movePen',kind:'sheep',delta:[-1,0]});const valid=await e.validateNow(),reason=e.snapshot().reason;
   window.__herdBefore=__dbg.animals.slice();const ok=valid&&await e.apply(),raw=JSON.parse(localStorage.getItem('sunny-acres-3d-v1'));
   return {valid,reason,ok,open:e.snapshot().open,v:raw.v,revision:raw.layout?.animalPens?.revision,savedChanged:before!==localStorage.getItem('sunny-acres-3d-v1'),savedKinds:Object.keys(raw.layout?.animalPens?.sites||{})};});
  report.steps.push({step:'apply valid sheep move',applied,errors:[...s.errors]});
  assert.equal(applied.valid,true,'sheep west 1 m no longer validates: '+applied.reason);assert.equal(applied.ok,true);
  const afterApply=await herd();report.steps.push({step:'after apply',afterApply});
  // A later full refresh keeps the same live herd; walking stays inside the moved meadow.
  const kept=await p.evaluate(()=>{const d=__dbg;d.G.view.refresh('all');const same=d.animals.filter(a=>a.kind==='sheep').every(a=>window.__herdBefore.includes(a));const pen=d.PEN_LIST.find(q=>q.care==='sheep');let t=d.clock(),outside=0;for(let n=0;n<900;n++){t+=1/30;d.setClock(t);for(const a of d.animals)a.update(1/30,t);for(const a of d.animals.filter(a=>a.kind==='sheep'))if(!d.inPen(pen,a.g.position.x,a.g.position.z,-.05))outside++;}return {sameHerd:same,sheepFramesOutside:outside};});
  report.steps.push({step:'refresh keeps herd, 30 simulated seconds',kept,errors:[...s.errors]});
  // Invalid edit: the cat nook moved off the farm cannot apply and changes nothing.
  const refused=await p.evaluate(async()=>{const e=__dbg.penEditor,before=localStorage.getItem('sunny-acres-3d-v1');e.begin('cat');e.dispatch({type:'movePen',kind:'cat',delta:[40,0]});const valid=await e.validateNow(),ok=await e.apply(),snap=e.snapshot();const unchanged=before===localStorage.getItem('sunny-acres-3d-v1');e.cancel();return {valid,ok,openAfterRefusal:snap.open,reason:snap.reason,unchanged,closedAfterCancel:!e.snapshot().open,unchangedAfterCancel:before===localStorage.getItem('sunny-acres-3d-v1'),catSaved:!!JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.sites?.cat};});
  report.steps.push({step:'refuse invalid cat move',refused,errors:[...s.errors]});
  await p.reload();await ready();
  const reloaded=await herd();report.steps.push({step:'reloaded',reloaded,revision:await p.evaluate(()=>__dbg.penRuntime.revision),errors:[...s.errors]});
  assert.equal(applied.open,false);assert.equal(applied.v,4);assert.equal(applied.revision,1);assert.equal(applied.savedChanged,true);assert.deepEqual(applied.savedKinds,['sheep']);
  assert.equal(afterApply.custom,true);assert.equal(afterApply.penCustom,true);assert.equal(afterApply.sheep,5);assert(afterApply.inside.every(Boolean),'sheep outside the moved meadow after apply');assert.equal(afterApply.horseCustom,false);
  assert.equal(kept.sameHerd,true,'a later refresh must not rebuild the herd after apply');assert.equal(kept.sheepFramesOutside,0);
  assert.equal(refused.valid,false);assert.equal(refused.ok,false);assert.equal(refused.openAfterRefusal,true);assert(refused.reason);assert.equal(refused.unchanged,true);assert.equal(refused.closedAfterCancel,true);assert.equal(refused.unchangedAfterCancel,true);assert.equal(refused.catSaved,false);
  assert.equal(reloaded.custom,true);assert.equal(reloaded.sheep,5);assert(reloaded.inside.every(Boolean));assert.equal(reloaded.horseCustom,false);assert.deepEqual(s.errors,[]);
  report.result='PASS';
 }catch(e){report.result='FAIL';report.error=String(e.stack||e);report.errors=s?.errors;}
 finally{await s?.finish(report.result!=='PASS');await h.close?.();console.log(JSON.stringify(report,null,1));process.exitCode=report.result==='PASS'?0:1;}
})();
