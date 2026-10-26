const fs=require('node:fs'),path=require('node:path');
module.exports=async function observe(page,report,hz){
 const dir=process.env.TEST_ARTIFACTS,out=path.join(dir,'impact.json');
 const original=JSON.parse(fs.readFileSync(process.env.PEN_ORIGINAL_FAILURE));
 const data={status:'RUNNING',kind:'Fresh same-case native failure followed in its live session; not resumed original browser',source:report.source,originalSource:original.source,hz,limitSeconds:90,originalFailure:report.error,originalTestStatus:report.status,trace:[]};
 const save=()=>fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
 data.initial=await page.evaluate(()=>{const d=__dbg,a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===0),bed=window.__impactBeds.find(b=>b.key==='cow:0');
  const row=()=>({clock:d.clock(),pos:a.g.position.toArray(),act:a.act,label:a.label,doing:a.doing,target:a.target?.toArray(),path:a.path?.map(x=>x.toArray()),vel:a.vel.toArray(),stuckT:a.stuckT,lastPos:a.lastPos.toArray(),until:a.until,need:{...a.need},task:a.cowTask?.kind,stage:a.cowTask?.stage,weight:a.cowTask?.weight});
  window.__cowImpact={startTime:d.clock(),frames:0,bed,start:a.g.position.toArray(),firstMotion:null,firstOutside:null,firstArrival:null,firstCare:null,maxDisplacement:0,trace:[{seconds:0,...row()}],paid:JSON.stringify({coins:d.G.S.coins,pens:d.G.S.pens,pets:d.G.S.pets}),ids:d.animals.map(x=>x.kind+':'+(x.ref.i??x.ref.j??0)).sort(),revision:d.penRuntime.revision};
  return{...row(),bed,history:window.__impactHistory,seedWitness:window.__testGameplaySeed,nearBlocks:d.BLOCKS.filter(b=>Math.hypot(a.g.position.x-b[0],a.g.position.z-b[1])<5),neighbours:d.animals.filter(x=>x!==a&&a.pos.distanceTo(x.pos)<5).map(x=>({key:x.kind+':'+(x.ref.i??x.ref.j??0),pos:x.g.position.toArray(),act:x.act,label:x.label,until:x.until,target:x.target?.toArray(),task:x.cowTask?.kind,stage:x.cowTask?.stage}))};
 });
 const old=original.failureState.animals.find(x=>x.key==='cow:0');
 data.comparison={originalPosition:old.pos,newPosition:data.initial.pos,positionDelta:Math.hypot(...data.initial.pos.map((x,i)=>x-old.pos[i])),originalTarget:old.target,newTarget:data.initial.target,originalFrame:original.failureState.cycle,newFrame:report.failureState.cycle,originalLabel:old.label,newLabel:data.initial.label};save();
 for(let block=0;block<36;block++){
  const q=await page.evaluate(hz=>{const d=__dbg,x=window.__cowImpact,a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===0),dt=1/hz;let t=d.clock();
   const snap=()=>({seconds:x.frames/hz,pos:a.g.position.toArray(),act:a.act,label:a.label,doing:a.doing,target:a.target?.toArray(),path:a.path?.map(p=>p.toArray()),vel:a.vel.toArray(),stuckT:a.stuckT,coreDistance:Math.hypot(a.g.position.x-x.bed.dock[0],a.g.position.z-x.bed.dock[2]),task:a.cowTask?.kind,stage:a.cowTask?.stage,weight:a.cowTask?.weight});
   for(let i=0;i<300;i++){const priorTarget=a.target?.toArray(),priorDoing=a.doing,priorAct=a.act;t+=dt;d.setClock(t);for(const b of d.animals)b.update(dt,t);x.frames++;
    const secs=x.frames/hz,dist=Math.hypot(a.g.position.x-x.start[0],a.g.position.z-x.start[2]),core=Math.hypot(a.g.position.x-x.bed.dock[0],a.g.position.z-x.bed.dock[2]);x.maxDisplacement=Math.max(x.maxDisplacement,dist);
    if(x.firstMotion===null&&dist>=.025)x.firstMotion={seconds:secs,...snap()};
    if(x.firstOutside===null&&core>x.bed.radius)x.firstOutside={seconds:secs,...snap()};
    if(x.firstArrival===null&&priorTarget&&!a.target&&Math.hypot(a.g.position.x-priorTarget[0],a.g.position.z-priorTarget[1])<.35)x.firstArrival={seconds:secs,priorTarget,priorDoing,priorAct,...snap()};
    if(x.firstCare===null&&a.cowTask?.stage==='hold'&&a.cowTask.weight>.99)x.firstCare={seconds:secs,...snap()};
    if(d.animals.length!==46||JSON.stringify(d.animals.map(b=>b.kind+':'+(b.ref.i??b.ref.j??0)).sort())!==JSON.stringify(x.ids))throw Error('Impact observation identity drift');
    if(d.animals.some(b=>b.pen&&!d.inPen(b.pen,b.g.position.x,b.g.position.z,-.05)))throw Error('Impact observation containment failure');
    if(a.act==='sleeping'||a.act==='resting'||a.cowTask?.kind==='bed')throw Error('Observed forbidden daytime cow rest');
    if(x.frames%15===0)x.trace.push(snap());
    const reached=x.firstCare||x.firstArrival;if(x.firstOutside&&reached&&secs>=reached.seconds+5&&core>x.bed.radius)break;
   }
   if(d.penRuntime.revision!==x.revision||JSON.stringify({coins:d.G.S.coins,pens:d.G.S.pens,pets:d.G.S.pets})!==x.paid)throw Error('Impact observation paid/revision drift');
   const reached=x.firstCare||x.firstArrival;return{frames:x.frames,seconds:x.frames/hz,firstMotion:x.firstMotion,firstOutside:x.firstOutside,firstArrival:x.firstArrival,firstCare:x.firstCare,maxDisplacement:x.maxDisplacement,done:!!(x.firstOutside&&reached&&x.frames/hz>=reached.seconds+5&&Math.hypot(a.g.position.x-x.bed.dock[0],a.g.position.z-x.bed.dock[2])>x.bed.radius),end:snap(),trace:x.trace.splice(0)};
  },hz);
  data.trace.push(...q.trace);delete q.trace;Object.assign(data,q);save();console.log('IMPACT '+JSON.stringify({seconds:q.seconds,motion:q.firstMotion?.seconds,outside:q.firstOutside?.seconds,arrival:q.firstArrival?.seconds,care:q.firstCare?.seconds,done:q.done,pos:q.end.pos}));if(q.done)break;
 }
 data.status=data.done?'OBSERVED_RECOVERY_ORIGINAL_RED_RETAINED':'BOUNDED_NO_COMPLETE_RECOVERY';data.errors=report.errors;save();report.impact={status:data.status,file:out,seconds:data.seconds,comparison:data.comparison,firstMotion:data.firstMotion?.seconds,firstOutside:data.firstOutside?.seconds,firstArrival:data.firstArrival?.seconds,firstCare:data.firstCare?.seconds};
};
