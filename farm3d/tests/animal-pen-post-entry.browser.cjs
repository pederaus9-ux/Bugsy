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
const report={status:'RUNNING',stage:'launch',source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),servedRef:process.env.PEN_POST_REF||null,case:{edit:({boundary:'sheep boundary expansion',interior:'sheep interior fence and gate',gate:'sheep exterior gate relocation'})[editClass],editClass,seed,rateHz,nights:3,nightDeadlineSeconds:500,wakeDeadlineSeconds:500,continuousWakeSeconds:40},cycles:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
let h,s,p;
const identity=a=>a.kind+':'+(a.ref.i??a.ref.j??0);
(async()=>{try{
 h=await start({ref:process.env.PEN_POST_REF||null,deviceScaleFactor:.5,...(seed===1?{gameplaySeed:1}:{})});s=await h.setup({width:844,height:390},false,'three-night-'+editClass+'-'+seed+'-'+rateHz);p=s.page;
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
 await p.addScriptTag({path:path.join(__dirname,'cow-post-entry-observer.js')});
 await p.waitForFunction(()=>window.__postDiagnosis);
 await p.addScriptTag({path:path.join(__dirname,'animal-pen-wake-oracle.cjs')});
 for(let cycle=1;cycle<=3;cycle++){
  report.stage='cycle '+cycle+' night';report.progress={cycle,phase:'night',frames:0};save();
  await p.evaluate(()=>{__dbg.setPreset('night');for(const a of __dbg.animals)a.need.tired=1;});
  let nightFrames=0,settled=false;
  for(let block=0;block<deadlineFrames/300&&!settled;block++){
   const q=await p.evaluate(hz=>{const d=__dbg,dt=1/hz;let t=d.clock();for(let n=0;n<300;n++){t+=dt;d.setClock(t);for(const a of d.animals)a.update(dt,t);if(n%hz===0&&d.animals.some(a=>a.pen&&!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05)))throw Error('Pen containment failed during night');if(d.animals.every(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;return task?.kind==='bed'&&task.stage==='hold'&&task.weight>.99;}))return{frames:n+1,complete:true};}return{frames:300,complete:false};},rateHz);
   nightFrames+=q.frames;settled=q.complete;if((block+1)%5===0||settled){report.progress={cycle,phase:'night',frames:nightFrames,complete:settled};save();console.log('PROGRESS cycle '+cycle+' night '+nightFrames+'/'+deadlineFrames+' complete='+settled);}
  }
  if(!settled)throw Error('Cycle '+cycle+' full herd did not settle by original 500-second deadline');
  const beds=await p.evaluate(async()=>{const d=__dbg,site=d.penRuntime.layout.sites,{PEN_TEMPLATES}=await import('./animal-pen-templates.js?v=1');return d.animals.map(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask,support=site[a.kind].supports.find(x=>x.id===task?.station?.id);if(!support||task.kind!=='bed'||task.stage!=='hold'||task.weight<=.99)throw Error('Missing held installed bed support for '+a.kind);return{key:a.kind+':'+(a.ref.i??a.ref.j??0),dock:support.dock,radius:PEN_TEMPLATES[a.kind].margin,station:support.id};});});
  assert.deepEqual(beds.map(b=>b.key).sort(),setup.ids,'stable identities at night '+cycle);assert.equal(new Set(beds.map(b=>b.station)).size,46,'unique bed reservations at night '+cycle);
  report.stage='cycle '+cycle+' physical release and 40-second wake';
  const assigned=await p.evaluate(({beds,hz})=>{window.__wakeOracle=createAnimalPenWakeOracle(beds,{deadlineFrames:500*hz,wakeFrames:40*hz,rateHz:hz});window.__wakeFrame=0;window.__cow4Trace=[];__dbg.setPreset('noon');return beds.length;},{beds,hz:rateHz});assert.equal(assigned,46);
  let wakeFrames=0,complete=false;
  for(let block=0;block<observationBlocks&&!complete;block++){
   const q=await p.evaluate(hz=>{const d=__dbg,dt=1/hz;let t=d.clock();for(let n=0;n<300;n++){t+=dt;d.setClock(t);for(const a of d.animals)a.update(dt,t);const frame=++window.__wakeFrame,samples=d.animals.map(a=>({key:a.kind+':'+(a.ref.i??a.ref.j??0),pos:a.g.position.toArray(),taskKind:(a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask)?.kind??null,act:a.act,speed:a.lastSpd??0}));if(window.__testGameplaySeed?.value===1&&frame<=930&&(frame===1||frame%15===0)){const a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===4);window.__cow4Trace.push({frame,pos:a.g.position.toArray(),act:a.act,label:a.label,doing:a.doing,target:a.target?.toArray(),path:a.path?.slice(0,3).map(p=>p.toArray()),until:a.until,stuckT:a.stuckT,lastPos:a.lastPos.toArray(),velocity:a.vel.toArray(),task:a.cowTask?.kind});}const done=window.__wakeOracle.observe(frame,samples);if(n%hz===0&&d.animals.some(a=>a.pen&&!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05)))throw Error('Pen containment failed during wake');const reserved=new Set();for(const a of d.animals){const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;if(task?.kind==='bed'){const key=a.kind+':'+task.station?.id;if(reserved.has(key))throw Error('Duplicate bed reservation during wake');reserved.add(key);}}if(done)return{frames:n+1,complete:true,summary:window.__wakeOracle.snapshot()};}return{frames:300,complete:false,summary:window.__wakeOracle.snapshot()};},rateHz);
   wakeFrames+=q.frames;complete=q.complete;if((block+1)%5===0||complete){report.progress={cycle,phase:'wake',frames:wakeFrames,firstReleased:q.summary.firstReleased,fullWakes:q.summary.fullWakes,complete};save();console.log('PROGRESS cycle '+cycle+' wake '+wakeFrames+'/'+(observationBlocks*300)+' first='+q.summary.firstReleased+'/46 full='+q.summary.fullWakes+'/46');}
  }
  if(!complete)throw Error('Cycle '+cycle+' did not complete all physical 40-second wakes with original 500-second release deadline');
  const end=await p.evaluate(()=>({trace:window.__wakeOracle.snapshot(),ids:__dbg.animals.map(a=>a.kind+':'+(a.ref.i??a.ref.j??0)).sort(),revision:__dbg.penRuntime.revision,savedRevision:__dbg.G.S.layout.animalPens.revision,paid:{coins:__dbg.G.S.coins,pens:JSON.stringify(__dbg.G.S.pens),pets:JSON.stringify(__dbg.G.S.pets)}}));
  assert.equal(end.trace.firstReleased,46);assert.equal(end.trace.fullWakes,46);assert(end.trace.maxFirstFrame<=deadlineFrames);assert(end.trace.minWakeFrames>=wakeDurationFrames);assert.deepEqual(end.ids,setup.ids);assert.equal(end.revision,1);assert.equal(end.savedRevision,1);assert.deepEqual(end.paid,setup.paid);assert.deepEqual(s.errors,[]);
  report.cycles.push({cycle,nightFrames,nightSeconds:nightFrames/rateHz,wakeFrames,wakeSeconds:wakeFrames/rateHz,trace:end.trace,revision:end.revision});save();console.log('PASS cycle '+cycle+' night='+nightFrames+' wake='+wakeFrames);
 }
 report.status='PASS';report.stage='three cycles complete';
}catch(error){report.status='FAIL';report.error=String(error.stack||error);report.errors=s?.errors;console.error(report.error);if(p)try{report.failureState=await p.evaluate(()=>({postDiagnosis:window.__postDiagnosis,cycle:window.__wakeFrame,cow4Trace:window.__cow4Trace,chickenLanes:__dbg.chickenCare.snapshotLayout().lanes,chickenTasks:__dbg.chickenCare.snapshotLayout().tasks,animals:__dbg.animals.map(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;return{key:a.kind+':'+(a.ref.i??a.ref.j??0),pos:a.g.position.toArray(),act:a.act,label:a.label,doing:a.doing,target:a.target?.toArray(),until:a.until,task:task?.kind,stage:task?.stage,station:task?.station?.id,path:task?.path?.slice(0,5),groundLeg:task?.groundLeg,access:task?.access,groundGoal:task?.groundGoal,blocked:task?.blocked,replans:task?.replans,replanAt:task?.replanAt,progressAt:task?.progressAt,detour:task?.detour,returnPoint:task?.returnPoint};}),revision:__dbg.penRuntime.revision,wake:window.__wakeOracle?.snapshot()}));}catch(diag){report.diagnosticError=String(diag);}}
finally{save();if(s)await s.finish(report.status!=='PASS');if(h)await h.close();console.log(JSON.stringify({status:report.status,stage:report.stage,file}));process.exitCode=report.status==='PASS'?0:1;}})();
