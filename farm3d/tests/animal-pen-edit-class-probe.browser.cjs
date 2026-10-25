// Diagnostic only: find real validator-accepted commands for the three
// Task 8 edit classes not yet supported by the three-night browser harness.
const fs=require('node:fs'),path=require('node:path');
const{start,artifacts,root}=require('./browser-harness.cjs');
const file=path.join(artifacts,'results.json');if(fs.existsSync(file))throw Error('Preserve previous edit-class probe evidence');
const report={status:'RUNNING',source:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),cases:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));let h,s,p;
(async()=>{try{
 h=await start({deviceScaleFactor:.5});s=await h.setup({width:844,height:390},false,'edit-class-probe');p=s.page;
 await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');
 await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 report.cases=await p.evaluate(async()=>{
  const d=__dbg,G=d.G,t=Date.now();G.close();G.S.tut=99;G.S.level=20;G.S.coins=9000;G.S.barnCap=1500;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
  for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Probe '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
  G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');if(!G.save())throw Error('Disposable setup save refused');
  if(d.animals.length!==46)throw Error('Probe lacks full owned herd');
  const specs=[
   {name:'boundaryEast1',commands:[{type:'moveEdge',kind:'sheep',edge:['v1','v2'],delta:[1,0]}]},
   {name:'gateOffset9',commands:[{type:'setGate',kind:'sheep',id:'gate0',offset:9,width:4}]},
   {name:'innerNorthRun',commands:[{type:'addRun',kind:'sheep',id:'task8run',a:[8,-24],b:[18,-24]},{type:'addGate',kind:'sheep',gate:{id:'task8innerGate',edge:null,run:'task8run',offset:3,width:4}}]},
   {name:'innerSouthRun',commands:[{type:'addRun',kind:'sheep',id:'task8run',a:[7,-29],b:[19,-29]},{type:'addGate',kind:'sheep',gate:{id:'task8innerGate',edge:null,run:'task8run',offset:4,width:4}}]}
  ];
  const out=[];for(const spec of specs){const e=d.penEditor;if(!e.begin('sheep'))throw Error('Editor refused '+spec.name);const sent=spec.commands.map(command=>e.dispatch(command));const ok=sent.every(Boolean)?await e.validateNow():false,snap=e.snapshot();out.push({name:spec.name,commands:spec.commands,sent,ok,reason:snap.reason,validation:snap.validation,draft:snap.draft?.sites?.sheep});e.cancel();}
  return out;
 });
 report.status='PASS';report.errors=s.errors;
}catch(e){report.status='FAIL';report.error=String(e.stack||e);report.errors=s?.errors;console.error(report.error);}
finally{save();if(s)await s.finish(report.status!=='PASS');if(h)await h.close();console.log(JSON.stringify({status:report.status,file,cases:report.cases.map(c=>({name:c.name,ok:c.ok,reason:c.reason}))}));process.exitCode=report.status==='PASS'?0:1;}})();
