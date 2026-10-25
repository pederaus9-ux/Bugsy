// Bounded Task 8 matrix case: selected actual edit class, seed and rate, three nights.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const seed=Number(process.env.PEN_MATRIX_SEED??4242);if(![1,4242].includes(seed))throw Error('Unsupported three-night test seed');
const rateHz=Number(process.env.PEN_MATRIX_RATE_HZ??30);if(![30,60,120].includes(rateHz))throw Error('Unsupported three-night test rate');
const editClass=process.env.PEN_MATRIX_EDIT_CLASS??'wholePen';if(!['boundary','interior','gate'].includes(editClass))throw Error('Unsupported three-night edit class');
const deadlineFrames=500*rateHz,wakeDurationFrames=40*rateHz,observationBlocks=Math.ceil((500+40)*rateHz/300);
const file=path.join(artifacts,'results.json');
if(fs.existsSync(file))throw Error('Preserve previous three-night matrix evidence');
const report={status:'RUNNING',stage:'launch',source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),case:{edit:({boundary:'sheep boundary expansion',interior:'sheep interior fence and gate',gate:'sheep exterior gate relocation'})[editClass],editClass,seed,rateHz,nights:3,nightDeadlineSeconds:500,wakeDeadlineSeconds:500,continuousWakeSeconds:40},cycles:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
let h,s,p;
const identity=a=>a.kind+':'+(a.ref.i??a.ref.j??0);
(async()=>{try{
 h=await start({deviceScaleFactor:.5,...(seed===1?{gameplaySeed:1}:{})});s=await h.setup({width:844,height:390},false,'three-night-'+editClass+'-'+seed+'-'+rateHz);p=s.page;
 await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');
 await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 report.stage='full ownership and real '+editClass+' Apply';
 const setup=await p.evaluate(async edit=>{
  const d=__dbg,G=d.G,t=Date.now();G.close();G.S.tut=99;G.S.level=20;G.S.coins=9000;G.S.barnCap=1500;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
  for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Night '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
  G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');if(!G.save())throw Error('Setup save refused');
  const{defaultSiteRecord}=await import('./animal-pen-layout.js?v=1'),e=d.penEditor,base=defaultSiteRecord('sheep');if(!e.begin('sheep'))throw Error('Sheep editor refused');let commands,expected=structuredClone(base);
  if(edit==='boundary'){
   commands=[{type:'moveEdge',kind:'sheep',edge:['v1','v2'],delta:[1,0]}];
   expected.boundary=expected.boundary.map(v=>['v1','v2'].includes(v.id)?{...v,x:v.x+1}:v);
  }else if(edit==='gate'){
   commands=[{type:'setGate',kind:'sheep',id:'gate0',offset:9,width:4}];expected.gates[0].offset=9;
  }else if(edit==='interior'){
   commands=[{type:'addRun',kind:'sheep',id:'task8run',a:[8,-24],b:[18,-24]},{type:'addGate',kind:'sheep',gate:{id:'task8innerGate',edge:null,run:'task8run',offset:3,width:4}}];
   expected.runs.push({id:'task8run',a:[8,-24],b:[18,-24]});expected.gates.push({id:'task8innerGate',edge:null,run:'task8run',offset:3,width:4});
  }else throw Error('Unknown extra edit class '+edit);
  for(const command of commands)if(!e.dispatch(command))throw Error('Edit command refused: '+JSON.stringify(command));
  const draft=e.snapshot().draft.sites.sheep;if(JSON.stringify(draft)!==JSON.stringify(expected))throw Error('Edit changed unrelated site fields: '+JSON.stringify({edit,draft,expected}));
  const valid=await e.validateNow(),reason=e.snapshot().reason;if(!valid)throw Error('Edit invalid: '+reason);if(!await e.apply())throw Error('Edit Apply refused');
  const saved=G.S.layout.animalPens.sites.sheep;if(JSON.stringify(saved)!==JSON.stringify(expected))throw Error('Requested edit was not saved exactly');
  return{action:{type:edit,commands},seedWitness:window.__testGameplaySeed??null,ids:d.animals.map(a=>a.kind+':'+(a.ref.i??a.ref.j??0)).sort(),revision:d.penRuntime.revision,savedRevision:G.S.layout.animalPens.revision,paid:{coins:G.S.coins,pens:JSON.stringify(G.S.pens),pets:JSON.stringify(G.S.pets)}};
 },editClass);
 if(seed===1){assert.equal(setup.seedWitness?.value,1);assert.equal(setup.seedWitness.firstCall,16807/2147483647);assert(setup.seedWitness.calls>=46*4,'requested seed must feed the owned 46-animal constructor stream');}else assert.equal(setup.seedWitness,null,'default game must keep its unmodified RNG declaration');
 assert.equal(setup.ids.length,46);assert.equal(new Set(setup.ids).size,46);assert.equal(setup.revision,1);assert.equal(setup.savedRevision,1);report.setup={ids:setup.ids,revision:1,action:setup.action,seedWitness:setup.seedWitness};save();

 report.stage='captured ordinary sheep recovery capability';save();
 const captured=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-open-care-impact-20261025/boundary-4242-120-candidate/results.json')));
 report.observation=await p.evaluate(red=>{const d=__dbg,T0=0;d.setClock(T0);d.setPreset('noon');for(const row of red.failureState.animals){const a=d.animals.find(a=>a.kind+':'+(a.ref.i??a.ref.j??0)===row.key);if(!a)throw Error('Missing captured identity '+row.key);a.g.position.fromArray(row.pos);a.vel.set(0,0);}
 const a=d.animals.find(a=>a.kind==='sheep'&&a.ref.i===0),row=red.failureState.animals.find(a=>a.key==='sheep:0');d.remainingCare.release(a);a.need={hunger:0,tired:0,lonely:0};a.remainingNapAt=a.remainingMealAt=a.remainingDrinkAt=Infinity;a.mode='fair';a.until=0;a.go(...row.target,false,row.label,row.doing);
 const start=a.g.position.clone(),bed=d.remainingLayouts.sheep.stations.filter(s=>s.kind==='bed')[0],radius=d.remainingLayouts.sheep.margin,initial={root:a.g.position.toArray(),originalTarget:row.target,routedTarget:a.target?.toArray(),path:a.path?.map(p=>p.toArray()),bed:bed.dock,radius},trace=[];let firstOutside=null,firstHalfMetre=null,maxDisplacement=0;
 for(let frame=1;frame<=60*120;frame++){const t=frame/120;d.setClock(t);a.update(1/120,t);const dist=a.g.position.distanceTo(start);maxDisplacement=Math.max(maxDisplacement,dist);if(firstOutside===null&&Math.hypot(a.g.position.x-bed.dock[0],a.g.position.z-bed.dock[2])>radius)firstOutside=t;if(firstHalfMetre===null&&dist>.5)firstHalfMetre=t;if(frame%120===0)trace.push({time:t,pos:a.g.position.toArray(),act:a.act,task:a.remainingTask?.kind,target:a.target?.toArray(),path:a.path?.map(p=>p.toArray()),stuckT:a.stuckT});if(firstHalfMetre!==null&&t>=firstHalfMetre+5)break;}
 return{initial,firstOutside,firstHalfMetre,maxDisplacement,trace,limitations:'Captured46roots and target; neighbours frozen. Fresh native rig/ordinary route regenerated by go. Original ordinary path, pose, RNG/needs/timers and scheduler history not retained. Care schedule suppressed for isolated walking-capability check. Not exact continuation or original wake PASS.'};},captured);
 assert.deepEqual(s.errors,[]);report.status='OBSERVED';report.stage='bounded reconstruction finished';
 }catch(error){report.status='ERROR';report.error=String(error.stack||error);console.error(report.error);}finally{save();if(s)await s.finish(report.status==='ERROR');if(h)await h.close();console.log(JSON.stringify(report));process.exitCode=report.status==='ERROR'?1:0;}})();
