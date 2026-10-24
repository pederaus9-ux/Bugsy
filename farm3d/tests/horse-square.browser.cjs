// Amendment A2 on a running farm: the default horse paddock is square and the stone
// path turns a right angle south of it. Not yet part of a hosted workflow.
const assert=require('assert/strict');
const {start}=require('./browser-harness.cjs');
(async()=>{
 const h=await start({deviceScaleFactor:.5});const report={steps:[]};let s;
 try{
  s=await h.setup({width:844,height:390},false,'horse-square');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  const farm=await p.evaluate(()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
   for(const[k,n]of[['horse',4],['sheep',5],['cow',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Sq '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');
   const pen=d.PEN_LIST.find(q=>q.care==='horse'),pts=d.dairyPath.points.map(q=>[...q]);
   // Stones sit on the new corner leg and none remain on the old diagonal's midpoint.
   const onNewLeg=d.dairyPath.contains(-10,-18.6,0),onOldDiagonal=d.dairyPath.contains(-10.8,-23,0);
   let t2=d.clock(),outside=0;for(let n=0;n<900;n++){t2+=1/30;d.setClock(t2);for(const a of d.animals)a.update(1/30,t2);for(const a of d.animals.filter(a=>a.kind==='horse'))if(!d.inPen(pen,a.g.position.x,a.g.position.z,-.05))outside++;}
   const v=d.penRuntime;return {poly:pen.poly.map(q=>[...q]),custom:!!pen.custom,path:pts,onNewLeg,onOldDiagonal,horses:d.animals.filter(a=>a.kind==='horse').length,horseFramesOutside:outside,revision:v.revision};});
  report.steps.push({step:'default farm',farm,errors:[...s.errors]});
  const valid=await p.evaluate(async()=>{const V=await import('./animal-pen-validation.js?v=3'),L=await import('./animal-pen-layout.js?v=1'),r=V.validateAnimalPens(L.resolveAnimalPens(),__dbg.penRuntime.world);return {ok:r.ok,issues:r.issues.map(i=>i.code+'/'+i.kind+'/'+i.target)};});
  report.steps.push({step:'default validates against the live snapshot',valid});
  assert.deepEqual(farm.poly,[[-23.5,-31.8],[-4.8,-31.8],[-4.8,-19.8],[-23.5,-19.8]]);assert.equal(farm.custom,false);
  assert.equal(farm.path.length,5);assert.deepEqual(farm.path[2],[-18.4,-18.6]);assert.equal(farm.path[3][1],-18.6);for(let i=1;i<5;i++)assert(farm.path[i][0]===farm.path[i-1][0]||farm.path[i][1]===farm.path[i-1][1],'diagonal path segment '+i);
  assert.equal(farm.onNewLeg,true);assert.equal(farm.onOldDiagonal,false);assert.equal(farm.horses,4);assert.equal(farm.horseFramesOutside,0);
  assert.equal(valid.ok,true,JSON.stringify(valid.issues));assert.deepEqual(s.errors,[]);
  report.result='PASS';
 }catch(e){report.result='FAIL';report.error=String(e.stack||e);report.errors=s?.errors;}
 finally{await s?.finish(report.result!=='PASS');await h.close?.();console.log(JSON.stringify(report,null,1));process.exitCode=report.result==='PASS'?0:1;}
})();
