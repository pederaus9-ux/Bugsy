// Diagnostic: which world.blocked owners refuse one-metre chicken-yard moves?
const path=require('path');const {start}=require(path.join(process.argv[2],'browser-harness.cjs'));
(async()=>{const h=await start({deviceScaleFactor:.5});let s,out={};
 try{s=await h.setup({width:844,height:390},false,'chicken-blockers');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  out=await p.evaluate(async()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;
   G.S.pens.chicken={...(G.S.pens.chicken||{}),owned:true,list:Array(6).fill(0),meta:Array.from({length:6},(_,i)=>({name:'hen '+i,love:50,loveAt:t,petAt:0}))};G.view.refresh('all');
   const L=await import('./animal-pen-layout.js?v=1'),Gm=await import('./animal-pen-geometry.js?v=1');
   const e=d.penEditor,res={};
   for(const [name,delta] of [['east',[1,0]],['west',[-1,0]],['south',[0,1]],['north',[0,-1]]]){
    e.begin('chicken');e.dispatch({type:'movePen',kind:'chicken',delta});await e.validateNow();const snap=e.snapshot(),world=d.penRuntime.world;
    const site=L.resolveAnimalPens(snap.draft).sites.chicken,base=L.resolveAnimalPens(undefined).sites.chicken;
    const seg=f=>({type:'capsule',a:[f[0],f[1]],b:[f[2],f[3]],r:0});
    res[name]={issues:snap.validation?.issues?.map(i=>i.code+':'+i.message),
     overlapsInterior:world.blocked.filter(b=>Gm.shapeIntersectsPolygon(b,site.polygon)).map(b=>({owner:b.owner,type:b.type,x:b.x,z:b.z,baseline:world.baselineBlocked.includes(b)||undefined,alsoOverDefaultYard:Gm.shapeIntersectsPolygon(b,base.polygon)})),
     pathHits:world.path.filter(c=>site.fenceSegments.some(f=>Gm.shapeIntersectsPolygon(c,[[f[0],f[1]],[f[2],f[3]],[f[2]+1e-3,f[3]+1e-3]]))).length};
    e.cancel();}
   return {blockedCount:d.penRuntime.world.blocked.length,baselineCount:d.penRuntime.world.baselineBlocked.length,res};});
 }catch(err){out.error=String(err.stack||err);}finally{out.errors=s?.errors;await s?.finish(false);await h.close?.();console.log(JSON.stringify(out,null,1));}})();
