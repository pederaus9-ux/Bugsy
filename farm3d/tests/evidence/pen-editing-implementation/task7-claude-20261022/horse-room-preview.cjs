// Preview renders (diagnostic, local headless Chromium): the real game before and after moving
// the horse paddock 6 m west under amendment A1. Usage: node horse-room-preview.cjs <farm3d/tests dir> <out dir>
const path=require('path'),fs=require('fs');const {start}=require(path.join(process.argv[2],'browser-harness.cjs'));
const out=process.argv[3];
(async()=>{const h=await start({deviceScaleFactor:1});let s,report={};
 try{s=await h.setup({width:1280,height:900},false,'horse-room-preview');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await p.evaluate(()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
   for(const[k,n]of[['horse',4],['sheep',5],['cow',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' View '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.view.refresh('all');
   window.__shoot=(view)=>{const cam=d.camera;if(view==='top'){cam.position.set(-12,95,-30.01);cam.up.set(0,0,-1);cam.lookAt(-12,0,-30);cam.fov=40;}else{cam.up.set(0,1,0);cam.position.set(-6,11,-6);cam.lookAt(-22,0,-27);cam.fov=55;}cam.updateProjectionMatrix();d.renderScene();return d.renderer.domElement.toDataURL('image/png');};
   window.__live=sec=>{let t=d.clock();for(let n=0;n<sec*30;n++){t+=1/30;d.setClock(t);for(const a of d.animals)a.update(1/30,t);}};
   window.__live(8);});
  const save=async(name,view)=>{const url=await p.evaluate(v=>window.__shoot(v),view);fs.writeFileSync(path.join(out,name),Buffer.from(url.split(',')[1],'base64'));};
  await save('horse-room-before-top.png','top');await save('horse-room-before-ground.png','ground');
  report.apply=await p.evaluate(async()=>{const e=__dbg.penEditor;e.begin('horse');e.dispatch({type:'movePen',kind:'horse',delta:[-6,0]});const valid=await e.validateNow();const ok=valid&&await e.apply();window.__live(12);const pen=__dbg.PEN_LIST.find(q=>q.care==='horse');return {valid,ok,reason:e.snapshot().reason,inside:__dbg.animals.filter(a=>a.kind==='horse').map(a=>__dbg.inPen(pen,a.g.position.x,a.g.position.z,0))};});
  await save('horse-room-after-top.png','top');await save('horse-room-after-ground.png','ground');
 }catch(err){report.error=String(err.stack||err);}finally{report.errors=s?.errors;await s?.finish(false);await h.close?.();console.log(JSON.stringify(report));}})();
