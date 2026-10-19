// Observation only. Original browser scripts, runtime, assertions and deadlines unchanged.
const fs=require('node:fs'),path=require('node:path');
const harness=require('./browser-harness.cjs'),start=harness.start;
const rows=[],cap=2500;let dropped=0;
const file=path.join(harness.artifacts,'precise-observations.json');
const add=(type,data)=>{if(rows.length<cap)rows.push({at:Date.now(),type,data});else dropped++;};
const save=()=>fs.writeFileSync(file,JSON.stringify({observationOnly:true,perturbation:'CDP lifecycle observation and250ms cache reads; no cache opens/writes; page animation samples',dropped,rows},null,2)+'\n');
process.on('exit',save);
harness.start=async(...args)=>{
 const h=await start(...args),setup=h.setup,close=h.close;
 h.setup=async(...a)=>{
  const s=await setup(...a),p=s.page;
  await p.exposeBinding('__preciseObservation',(_,data)=>add('page',data));
  const cdp=await s.context.newCDPSession(p);
  cdp.on('ServiceWorker.workerVersionUpdated',data=>add('workerVersions',data));
  await cdp.send('ServiceWorker.enable');
  s.context.on('serviceworker',w=>{w.evaluate(()=>({cache:typeof CACHE==='undefined'?null:CACHE,shell:typeof SHELL==='undefined'?null:SHELL.length})).then(x=>add('workerIdentity',x)).catch(e=>add('workerIdentityError',String(e)));});
  await p.addInitScript(()=>{
   let busy=false,count=0;
   const emit=data=>window.__preciseObservation(data).catch(()=>{});
   navigator.serviceWorker?.addEventListener('controllerchange',()=>emit({event:'controllerchange',url:location.href}));
   setInterval(async()=>{if(busy||++count>1200)return;busy=true;try{
    const keys=await caches.keys(),r=await navigator.serviceWorker?.getRegistration();
    const present=!!await caches.match(new URL('game.js?v=27',location.href),{cacheName:'sa3d-v48'});
    const d=window.__dbg,h=d?.camera?.children.find(o=>o.userData.skin);
    emit({event:'sample',keys,present,version:window.__gameVer,controller:navigator.serviceWorker?.controller?.state,active:r?.active?.state,installing:r?.installing?.state,waiting:r?.waiting?.state,fingers:h?.children.map(o=>o.userData.fingers?.rotation.x),punch:d?.punch});
   }catch(e){emit({event:'sampleError',error:String(e)});}finally{busy=false;}},250);
  });
  return s;
 };
 h.close=async(...a)=>{try{return await close(...a);}finally{save();}};
 return h;
};
