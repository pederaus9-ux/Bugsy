// Diagnostic: which owned pens/nooks can move at all under the approved validator rules?
// Usage: node mobility-probe.cjs <repo-farm3d-tests-dir>
const path=require('path');const {start}=require(path.join(process.argv[2],'browser-harness.cjs'));
(async()=>{const h=await start({deviceScaleFactor:.5});let s,out={};
 try{s=await h.setup({width:844,height:390},false,'pen-mobility');const p=s.page;
  await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  out=await p.evaluate(async()=>{const d=__dbg,G=d.G,t=Date.now();G.S.tut=99;G.S.level=20;
   for(const[k,n]of[['horse',4],['sheep',5],['chicken',6]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' P '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
   G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');
   const e=d.penEditor,result={},steps=[1,2,4,8];
   for(const kind of ['chicken','horse','sheep','dog','cat']){result[kind]={};for(const [name,dir] of [['east',[1,0]],['west',[-1,0]],['south',[0,1]],['north',[0,-1]]]){
     let best=null,reason=null;for(const m of steps){if(!e.begin(kind)){reason='cannot open';break;}e.dispatch({type:'movePen',kind,delta:[dir[0]*m,dir[1]*m]});const ok=await e.validateNow();const r=e.snapshot().reason;e.cancel();if(ok)best=m;else if(!reason)reason=r;}
     result[kind][name]={maxValidMetres:best,firstRefusal:reason};}}
   return {owned:d.penRuntime.world.owned,result};});
 }catch(err){out.error=String(err.stack||err);}finally{out.errors=s?.errors;await s?.finish(false);await h.close?.();console.log(JSON.stringify(out,null,1));}})();
