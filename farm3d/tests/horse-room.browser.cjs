// Amendment A1 on a running farm: the horse paddock moves west onto the levelled strip
// through the real editor core and game.js transaction (debug editor API, not trusted UI input).
// Not yet part of a hosted workflow.
const assert=require('assert/strict');
const {start}=require('./browser-harness.cjs');
(async()=>{
 const h=await start({deviceScaleFactor:.5});const report={steps:[]};let s;
 try{
  s=await h.setup({width:844,height:390},false,'horse-room');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  const ready=()=>p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await ready();
  const ground=await p.evaluate(()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
   for(const[k,n]of[['horse',4],['sheep',5],['cow',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Room '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');G.save();
   const trees=[];d.scene.traverse(o=>{if(o.userData?.canopy&&o.position.x>=-37&&o.position.x<=-19&&o.position.z>-50&&o.position.z<-21)trees.push([o.position.x,o.position.z]);});
   // Rendered ground mesh vertices inside the levelled strip.
   const pos=d.ground.geometry.attributes.position,flat=[];d.ground.updateMatrixWorld(true);for(let i=0;i<pos.count;i++){const x=pos.getX(i)+d.ground.position.x,z=pos.getZ(i)+d.ground.position.z;if(x>=-33&&x<=-23&&z>=-46&&z<=-25)flat.push(Math.abs(pos.getY(i)+d.ground.position.y));}
   return {treesInStrip:trees,stripVertices:flat.length,maxStripHeight:Math.max(...flat),cowYardActive:d.cowYardActive};});
  report.steps.push({step:'levelled strip',ground});
  const herd=()=>p.evaluate(()=>{const d=__dbg,pen=d.PEN_LIST.find(q=>q.care==='horse'),horses=d.animals.filter(a=>a.kind==='horse');return {custom:!!d.remainingLayouts.horse.custom,penCustom:!!pen.custom,inside:horses.map(a=>d.inPen(pen,a.g.position.x,a.g.position.z,0)),horses:horses.length,west:Math.min(...pen.poly.map(v=>v[0]))};});
  const before=await herd();
  // Past the strip is refused; six metres west applies.
  const applied=await p.evaluate(async()=>{const e=__dbg.penEditor,tryMove=async m=>{e.begin('horse');e.dispatch({type:'movePen',kind:'horse',delta:[-m,0]});const ok=await e.validateNow();const reason=e.snapshot().reason;return {ok,reason};};
   const far=await tryMove(10);e.cancel();
   const six=await tryMove(6);window.__herdBefore=__dbg.animals.slice();const ok=six.ok&&await e.apply(),raw=JSON.parse(localStorage.getItem('sunny-acres-3d-v1'));
   return {farRefused:!far.ok,farReason:far.reason,sixValid:six.ok,sixReason:six.reason,ok,open:e.snapshot().open,v:raw.v,revision:raw.layout?.animalPens?.revision,savedKinds:Object.keys(raw.layout?.animalPens?.sites||{})};});
  report.steps.push({step:'refuse 10 m, apply 6 m west',applied,errors:[...s.errors]});
  assert.equal(applied.sixValid,true,'6 m west does not validate: '+applied.sixReason);
  const afterApply=await herd();report.steps.push({step:'after apply',before,afterApply});
  const kept=await p.evaluate(()=>{const d=__dbg;d.G.view.refresh('all');const same=d.animals.filter(a=>a.kind==='horse').every(a=>window.__herdBefore.includes(a));const pen=d.PEN_LIST.find(q=>q.care==='horse');let t=d.clock(),outside=0;for(let n=0;n<900;n++){t+=1/30;d.setClock(t);for(const a of d.animals)a.update(1/30,t);for(const a of d.animals.filter(a=>a.kind==='horse'))if(!d.inPen(pen,a.g.position.x,a.g.position.z,-.05))outside++;}return {sameHerd:same,horseFramesOutside:outside};});
  report.steps.push({step:'refresh keeps herd, 30 simulated seconds',kept,errors:[...s.errors]});
  await p.reload();await ready();
  const reloaded=await herd();report.steps.push({step:'reloaded',reloaded,revision:await p.evaluate(()=>__dbg.penRuntime.revision),errors:[...s.errors]});
  assert.deepEqual(ground.treesInStrip,[]);assert(ground.stripVertices>50);assert.equal(ground.maxStripHeight,0);assert.equal(ground.cowYardActive,true);
  assert.equal(applied.farRefused,true);assert(applied.farReason);assert.equal(applied.ok,true);assert.equal(applied.open,false);assert.equal(applied.v,4);assert.equal(applied.revision,1);assert.deepEqual(applied.savedKinds,['horse']);
  assert.equal(afterApply.custom,true);assert.equal(afterApply.penCustom,true);assert.equal(afterApply.horses,4);assert(afterApply.inside.every(Boolean),'horse outside the moved paddock');assert(Math.abs(afterApply.west-(before.west-6))<1e-9,'paddock did not move 6 m west');
  assert.equal(kept.sameHerd,true);assert.equal(kept.horseFramesOutside,0);
  assert.equal(reloaded.custom,true);assert.equal(reloaded.horses,4);assert(reloaded.inside.every(Boolean));assert(Math.abs(reloaded.west-afterApply.west)<1e-9);assert.deepEqual(s.errors,[]);
  report.result='PASS';
 }catch(e){report.result='FAIL';report.error=String(e.stack||e);report.errors=s?.errors;}
 finally{await s?.finish(report.result!=='PASS');await h.close?.();console.log(JSON.stringify(report,null,1));process.exitCode=report.result==='PASS'?0:1;}
})();
