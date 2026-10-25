// Bounded integrated prerequisite: one installed sheep edit, all 46 animals, one night.
// The final five-class/two-seed/three-rate/three-night matrix remains separate.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process'),{start,artifacts,root}=require('./browser-harness.cjs');
const file=path.join(artifacts,'results.json');if(fs.existsSync(file))throw Error('Preserve previous full-herd night result');
const report={status:'RUNNING',stage:'launch',source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),viewport:[844,390],seed:4242,rateHz:30,deadlineSeconds:500,awakeSeconds:40,steps:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));const record=(name,value)=>{report.steps.push({name,value});save();console.log('PASS '+name+' '+JSON.stringify(value));};let h,s,p;
const goal=(a)=>a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;
(async()=>{try{
 h=await start({deviceScaleFactor:.5});s=await h.setup({width:844,height:390},false,'full-herd-night');p=s.page;
 await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 report.stage='maximum owned herd and installed sheep edit';const setup=await p.evaluate(async()=>{const d=__dbg,G=d.G,t=Date.now();G.close();G.S.tut=99;G.S.level=20;G.S.coins=9000;G.S.barnCap=1500;G.S.event=null;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={...(G.S.pens[k]||{}),owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:k+' Night '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};G.S.pets=[{kind:'dog',name:'Buddy',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t},{kind:'cat',name:'Whiskers',love:60,loveAt:t,petAt:0,playAt:0,treatAt:0,giftAt:t}];G.view.refresh('all');if(!G.save())throw Error('Setup save refused');const e=d.penEditor;if(!e.begin('sheep')||!e.dispatch({type:'movePen',kind:'sheep',delta:[-1,0]}))throw Error('Sheep edit refused');if(!await e.validateNow()||!await e.apply())throw Error('Sheep Apply refused');const counts=Object.fromEntries(['chicken','cow','horse','sheep','dog','cat'].map(k=>[k,d.animals.filter(a=>a.kind===k).length]));return{count:d.animals.length,counts,revision:d.penRuntime.revision,savedRevision:G.S.layout.animalPens.revision,paid:{coins:G.S.coins,pens:JSON.stringify(G.S.pens),pets:JSON.stringify(G.S.pets)}};});assert.equal(setup.count,46);assert.deepEqual(setup.counts,{chicken:30,cow:5,horse:4,sheep:5,dog:1,cat:1});assert.equal(setup.revision,1);assert.equal(setup.savedRevision,1);record('installed full herd',setup);
 report.stage='forty seconds awake';const awake=await p.evaluate(()=>{const d=__dbg,dt=1/30;let t=d.clock();for(let n=0;n<1200;n++){t+=dt;d.setClock(t);for(const a of d.animals)a.update(dt,t);if(n%30===0&&d.animals.some(a=>a.pen&&!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05)))throw Error('Pen containment failed awake frame '+n);}return{frames:1200,seconds:40,animals:d.animals.length,revision:d.penRuntime.revision};});record('full awake life',awake);
 report.stage='night beds, original 500-second bound';await p.evaluate(()=>{__dbg.setPreset('night');for(const a of __dbg.animals)a.need.tired=1;});
 let settled=false,nightFrames=0;for(let block=0;block<50&&!settled;block++){const progress=await p.evaluate(()=>{const d=__dbg,dt=1/30;let t=d.clock(),complete=false;for(let n=0;n<300;n++){t+=dt;d.setClock(t);for(const a of d.animals)a.update(dt,t);if(n%30===0&&d.animals.some(a=>a.pen&&!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05)))throw Error('Pen containment failed night frame '+n);if(d.animals.every(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;return task?.kind==='bed'&&task.stage==='hold'&&task.weight>.99;})){complete=true;return{frames:n+1,complete,animals:d.animals.length};}}return{frames:300,complete,animals:d.animals.length};});nightFrames+=progress.frames;settled=progress.complete;if((block+1)%5===0||settled){report.progress={phase:'night',frames:nightFrames,seconds:nightFrames/30,complete:settled};report.nightTrace??=[];report.nightTrace.push(await p.evaluate(()=>({clock:__dbg.clock(),lane:__dbg.chickenCare.snapshotLayout().lanes,entrants:__dbg.animals.filter(a=>a.kind==='chicken'&&a.chickenTask?.stage==='approach').map(a=>({id:a.ref.i,pos:[a.g.position.x,a.g.position.y,a.g.position.z],path:a.chickenTask.path?.slice(0,3),groundGoal:a.chickenTask.groundGoal,blocked:a.chickenTask.blocked,replans:a.chickenTask.replans,progressAt:a.chickenTask.progressAt})),waiting:__dbg.animals.filter(a=>a.kind==='chicken'&&a.chickenTask?.stage==='waiting').length,cows:__dbg.animals.filter(a=>a.kind==='cow').map(a=>({id:a.ref.i,pos:a.g.position.toArray(),stage:a.cowTask?.stage,station:a.cowTask?.station?.id,path:a.cowTask?.path?.slice(0,3).map(p=>[p.x,p.y]),waypoints:a.cowTask?.waypoints,avoidSide:a.cowTask?.avoidSide}))})));save();console.log('PROGRESS night '+nightFrames+'/15000 frames, complete='+settled);}}
 if(!settled)throw Error('Full herd did not settle by original 500-second deadline');
 const beds=await p.evaluate(()=>({animals:__dbg.animals.map(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;return{kind:a.kind,id:a.ref.i??a.ref.j??0,station:task.station?.id,stage:task.stage,weight:task.weight};}),revision:__dbg.penRuntime.revision,savedRevision:__dbg.G.S.layout.animalPens.revision}));assert.equal(beds.animals.length,46);for(const kind of Object.keys(setup.counts)){const stations=beds.animals.filter(a=>a.kind===kind).map(a=>a.station);assert(stations.every(Boolean),'missing '+kind+' bed station');assert.equal(new Set(stations).size,stations.length,'duplicate '+kind+' bed reservation');}assert.equal(beds.revision,1);assert.equal(beds.savedRevision,1);record('all distinct species beds', {frames:nightFrames,seconds:nightFrames/30,counts:setup.counts});
 report.stage='per-animal physical release and forty continuous seconds awake';
 await p.addScriptTag({path:path.join(__dirname,'animal-pen-wake-oracle.cjs')});
 const assigned=await p.evaluate(async()=>{
   const d=__dbg,site=d.penRuntime.layout.sites,{PEN_TEMPLATES}=await import('./animal-pen-templates.js?v=1');
   const beds=d.animals.map(a=>{
     const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;
     const support=site[a.kind].supports.find(s=>s.id===task?.station?.id);
     if(!support||task.kind!=='bed'||task.stage!=='hold'||task.weight<=.99)throw Error('Missing held overnight bed support for '+a.kind);
     return{key:a.kind+':'+(a.ref.i??a.ref.j??0),dock:support.dock,radius:PEN_TEMPLATES[a.kind].margin,station:support.id};
   });
   window.__wakeOracle=createAnimalPenWakeOracle(beds,{deadlineFrames:15000,wakeFrames:1200});
   window.__wakeFrame=0;window.__wakeCowTrace=[];d.setPreset('noon');
   return{animals:beds.length,stations:beds.map(b=>b.station)};
 });
 assert.equal(assigned.animals,46);
 assert.equal(new Set(assigned.stations).size,46,'overnight bed reservations must remain unique');
 let complete=false,wakeFrames=0;
 for(let block=0;block<54&&!complete;block++){
   const progress=await p.evaluate(()=>{
     const d=__dbg,dt=1/30;let t=d.clock();
     for(let n=0;n<300;n++){
       t+=dt;d.setClock(t);for(const a of d.animals)a.update(dt,t);
       const frame=++window.__wakeFrame,samples=d.animals.map(a=>({key:a.kind+':'+(a.ref.i??a.ref.j??0),pos:a.g.position.toArray(),taskKind:(a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask)?.kind??null,act:a.act,speed:a.lastSpd??0}));
       // Retain a bounded physical trace for the reproduced cow wake obstruction.
       if(frame>=40&&frame<=170&&frame%5===0){const a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===4);window.__wakeCowTrace.push({frame,pos:a.g.position.toArray(),act:a.act,label:a.label,doing:a.doing,target:a.target&&[a.target.x,a.target.y],pathLength:a.path?.length,velocity:[a.vel.x,a.vel.y],stuckT:a.stuckT,lastPos:[a.lastPos.x,a.lastPos.y],task:a.cowTask?.kind});}
       const done=window.__wakeOracle.observe(frame,samples);
       if(n%30===0&&d.animals.some(a=>a.pen&&!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05)))throw Error('Pen containment failed wake frame '+frame);
       const reserved=new Set();for(const a of d.animals){const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;if(task?.kind==='bed'){const key=a.kind+':'+task.station?.id;if(reserved.has(key))throw Error('Duplicate bed reservation wake frame '+frame);reserved.add(key);}}
       if(done)return{frames:n+1,complete:true,summary:window.__wakeOracle.snapshot()};
     }
     return{frames:300,complete:false,summary:window.__wakeOracle.snapshot()};
   });
   wakeFrames+=progress.frames;complete=progress.complete;
   if((block+1)%5===0||complete){report.progress={phase:'wake',frames:wakeFrames,seconds:wakeFrames/30,complete,firstReleased:progress.summary.firstReleased,fullWakes:progress.summary.fullWakes};save();console.log('PROGRESS wake '+wakeFrames+'/16200 frames, first='+progress.summary.firstReleased+'/46, full='+progress.summary.fullWakes+'/46');}
 }
 if(!complete)throw Error('All 46 did not complete individual physical 40-second wakes after the original 500-second release bound');
 const wake=await p.evaluate(()=>({trace:window.__wakeOracle.snapshot(),revision:__dbg.penRuntime.revision,savedRevision:__dbg.G.S.layout.animalPens.revision,paid:{coins:__dbg.G.S.coins,pens:JSON.stringify(__dbg.G.S.pens),pets:JSON.stringify(__dbg.G.S.pets)}}));
 assert.equal(wake.trace.animals,46);assert.equal(wake.trace.firstReleased,46);assert.equal(wake.trace.fullWakes,46);
 assert(wake.trace.maxFirstFrame<=15000,'physical release exceeded original 500-second deadline');
 assert(wake.trace.minWakeFrames>=1200,'individual wake shorter than 40 seconds');
 assert.equal(wake.revision,1);assert.equal(wake.savedRevision,1);assert.deepEqual(wake.paid,setup.paid);assert.deepEqual(s.errors,[]);
 record('all individual physical releases and full wakes',{wakeFrames,wakeSeconds:wakeFrames/30,wake});report.status='PASS';
 }catch(error){report.status='FAIL';report.error=String(error.stack||error);report.errors=s?.errors;console.error(report.error);if(p)try{report.failureState=await p.evaluate(()=>({cowTrace:window.__wakeCowTrace,animals:__dbg.animals.map(a=>{const task=a.kind==='chicken'?a.chickenTask:a.kind==='cow'?a.cowTask:a.remainingTask;return{kind:a.kind,id:a.ref.i??a.ref.j??0,pos:a.g.position.toArray(),stage:task?.stage,taskKind:task?.kind,station:task?.station?.id,blocked:task?.blocked,path:task?.path?.slice(0,3).map(p=>Array.isArray(p)?p:[p.x,p.y]),waypoints:task?.waypoints,avoidSide:task?.avoidSide,label:a.label};}),revision:__dbg.penRuntime.revision}));await p.screenshot({path:path.join(artifacts,'first-failure.png')});}catch(diag){report.diagnosticError=String(diag);}}
 finally{save();if(s)await s.finish(report.status!=='PASS');if(h)await h.close();console.log(JSON.stringify({status:report.status,stage:report.stage,file}));process.exitCode=report.status==='PASS'?0:1;}})();
