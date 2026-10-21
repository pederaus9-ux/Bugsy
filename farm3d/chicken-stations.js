import * as T from './lib/three.module.min.js';
import {createStationScheduler} from './animal-stations.js?v=1';
import {getAnimalCarePose} from './animal-care-poses.js?v=2';

// Cosmetic care adapter. The existing scheduler owns occupancy. No game,
// inventory, clock, save or production API is reachable from this module.
export function createChickenStationController({yard,route,neighbours,updateRig,clearPoint=()=>true}){
 const scheduler=createStationScheduler(yard.stations),byId=new Map(yard.stations.map(s=>[s.id,s])),tasks=new Map();let lane=null,wakeUntil=-Infinity;
 const steering=Array.from({length:64},(_,i)=>[Math.cos(i*Math.PI/32),Math.sin(i*Math.PI/32)]);
 const pos=a=>new T.Vector2(a.g.position.x,a.g.position.z),world=p=>new T.Vector2(p[0],p[2]);
 const eligible=t=>t.kind==='bed'&&['waiting','waitExit'].includes(t.stage);
 function nextLane(){const all=[...tasks.values()].filter(eligible),exiting=all.filter(t=>t.stage==='waitExit');return (exiting.length?exiting.sort((a,b)=>b.order-a.order):all.sort((a,b)=>a.order-b.order))[0];}
 function release(a){const t=a.chickenTask;if(!t)return;a.chickenPose?.reset();scheduler.release(t.token);tasks.delete(t.token.animalId);if(lane===t)lane=null;a.chickenTask=null;a.rig3d.sampleSupport=null;}
 function returnPoint(a){
  for(const radius of [0,.55,1.1,1.65,2.2,2.75,3.3])for(let k=0;k<12;k++){
   const x=a.g.position.x+Math.cos(k*Math.PI/6)*radius,z=a.g.position.z+Math.sin(k*Math.PI/6)*radius;
   if(x<-16.2||x>-5.2||z<-5.5||z>4.7||!clearPoint(x,z)||yard.layout.obstacles.some(([bx,bz,hw,hd])=>Math.abs(x-bx)<hw+.2&&Math.abs(z-bz)<hd+.2))continue;
   if([...tasks.values()].some(t=>Math.hypot(x-t.returnPoint[0],z-t.returnPoint[2])<.5)||neighbours().some(b=>b!==a&&Math.hypot(x-b.g.position.x,z-b.g.position.z)<.34))continue;
   return [x,0,z];
  }
  return null;
 }
 function request(a,kind){
  if(a.chickenTask)return a.chickenTask.kind===kind;
  const back=returnPoint(a);if(!back)return false;
  const token=scheduler.request('hen-'+a.ref.i,kind);if(!token)return false;
  const station=byId.get(token.stationId),t={kind,token,station,stage:kind==='bed'?'waiting':'approach',weight:0,held:0,order:yard.stations.indexOf(station),path:null,blocked:0,contact:station.contact?new T.Vector3(...station.contact):null,returnPoint:back,access:a.g.position.y>1e-6};
  a.chickenTask=t;tasks.set(token.animalId,t);a.chickenPose??=getAnimalCarePose('chicken',a.rig3d);a.rig3d.sampleSupport=(x,z)=>t.access?yard.sampleStationSupport(station.id,x,z).height:0;a.target=null;a.path=null;a.vel.set(0,0);
  return true;
 }
 function pathTo(a,p,avoid=neighbours().filter(b=>b!==a&&!b.gone&&b.g.position.y<.1)){return route(pos(a),world(p),.26,a.pen,avoid.map(b=>({x:b.g.position.x,z:b.g.position.z,hw:.08,hd:.08,radius:.08,c:1,s:0}))).map(v=>[v.x,0,v.y]);}
 function exitPath(a,task){const p=a.g.position,A=yard.access,avoid=neighbours().filter(b=>b!==a&&b.g.position.y<.1).map(b=>({x:b.g.position.x,z:b.g.position.z,hw:.08,hd:.08,radius:.08,c:1,s:0})),back=route(world(A.outside),world(task.returnPoint),.26,a.pen,avoid).map(v=>[v.x,0,v.y]);return [...(p.z>A.rampEnd[2]?[[A.rampStart[0],0,Math.max(p.z,A.rampStart[2])]]:[[-11.6,A.floor,p.z],A.entry,A.rampEnd,A.rampStart]),A.outside,...back];}
 function update(a,dt,t,{night,wet,supplies}){
  if(!a.rig3d)return false;
  // Departing sleepers have the lane first; cosmetic visits resume afterward.
  if(!night&&!wet&&[...tasks.values()].some(task=>task.kind==='bed'&&!task.nap))wakeUntil=t+2;
  if(!a.chickenTask&&t>wakeUntil){
   if(night||wet||a.need.tired>.85){if(request(a,'bed'))a.chickenTask.nap=!night&&!wet;}
   else if(a.need.hunger>.35&&supplies.feedMs>0&&t>(a.chickenMealAt||0))request(a,'feed');
   else if(t>(a.chickenDrinkAt??25+a.ref.i)&&supplies.waterMs>0)request(a,'drink');
  }
  const task=a.chickenTask;if(!task)return false;
  if(a.emoteT>0){a.emoteT=Math.max(0,a.emoteT-dt);if(a.bubble){a.bubble.visible=a.emoteT>0;a.bubble.material.opacity=Math.min(1,a.emoteT*2);if(Number.isFinite(a.S?.h))a.bubble.position.y=a.S.h+.35+Math.sin(t*3)*.04;}}
  a.chickenPose.reset();const s=task.station,ox=a.g.position.x,oz=a.g.position.z;
  if(task.kind==='bed'&&task.stage==='waiting'&&!night&&!wet&&a.need.tired<.85){release(a);return false;}
  if(task.stage==='hold'&&((task.kind==='bed'&&!night&&!wet&&(!task.nap||task.held>=12))||(task.kind==='feed'&&supplies.feedMs<=0)||(task.kind==='drink'&&supplies.waterMs<=0)))task.stage='stand';
  if(task.stage==='waiting'||task.stage==='waitExit'){
   if(!lane&&nextLane()===task){lane=task;if(task.stage==='waiting'){task.stage='approach';task.path=[...pathTo(a,yard.access.outside),...s.path];}else{task.stage='exit';task.path=exitPath(a,task);}}
  }
  if(task.stage==='approach'||task.stage==='exit'){
   task.path??=[...pathTo(a,s.approach),s.dock];
   // Elevated support is authorized only by a bed access leg, never a ground return.
   const p=task.path[0];task.access=task.kind==='bed'&&((p?.[1]||0)>0||a.g.position.y>1e-6);if(p){const dx=p[0]-ox,dz=p[2]-oz,d=Math.hypot(dx,dz),step=Math.min(d,.65*dt),nx=ox+dx/(d||1)*step,nz=oz+dz/(d||1)*step;
    // Resting rows leave the centre aisle clear. A blocked bird yields rather
    // than advancing through a neighbour or teleporting to an arrival point.
    const other=neighbours().filter(b=>b!==a&&!b.gone),here=yard.sampleStationSupport(s.id,ox,oz),clear=(x,z)=>{
     const next=yard.sampleStationSupport(s.id,x,z);if((!task.access&&next.height>1e-8)||Math.abs(next.height-here.height)>.08||!clearPoint(x,z))return false;
     if(x<-16.2||x>-5.2||z<-5.5||z>4.7)return false;
     const rampGoal=p[0]===yard.access.rampStart[0]&&p[2]===yard.access.rampStart[2],outsideGoal=p[0]===yard.access.outside[0]&&p[2]===yard.access.outside[2],accessLeg=task.access||rampGoal||(outsideGoal&&z>=oz-1e-8);
     if(yard.layout.obstacles.some(([bx,bz,hw,hd],i)=>!(i===0&&next.inside&&here.inside)&&!(i===1&&accessLeg&&((next.inside&&here.inside)||(Math.abs(x+11.6)<=.6&&z>=yard.access.rampEnd[2]&&z<=yard.access.outside[2])))&&Math.abs(x-bx)<hw+.18&&Math.abs(z-bz)<hd+.18))return false;
     return other.every(b=>Math.hypot(b.g.position.x-x,b.g.position.z-z)>=.34||Math.hypot(b.g.position.x-x,b.g.position.z-z)>Math.hypot(b.g.position.x-ox,b.g.position.z-oz)+1e-6);
    };
    // Keep a safe detour briefly; greedy per-frame choices can oscillate at an edge.
    const detour=task.detour,tx=detour?ox+detour.ux*step:ox,tz=detour?oz+detour.uz*step:oz;
    if(detour&&t<detour.until&&clear(tx,tz)){a.g.position.x=tx;a.g.position.z=tz;}else if(clear(nx,nz)){a.g.position.x=nx;a.g.position.z=nz;task.blocked=0;task.detour=null;}else{
     task.blocked+=dt;if(task.blocked>1&&here.height===0&&(task.replans||0)<3){task.path=[...pathTo(a,p,other.filter(b=>Math.hypot(b.g.position.x-ox,b.g.position.z-oz)<3)),...task.path.slice(1)];task.replans=(task.replans||0)+1;task.blocked=0;}let best=null,bestScore=-Infinity;for(const [ux,uz]of steering){const x=ox+ux*step,z=oz+uz*step,score=ux*dx+uz*dz;if(score>bestScore&&clear(x,z)){best=[x,z,ux,uz];bestScore=score;}}if(best){a.g.position.x=best[0];a.g.position.z=best[1];task.detour={ux:best[2],uz:best[3],until:t+.8};}
    }
    if(d<.008){task.path.shift();task.detour=null;}
   }else if(task.stage==='exit'){release(a);a.need.tired=0;a.act='idle';a.until=t+1;}
   else{task.stage='align';scheduler.arrive(task.token);}
  }else if(task.stage==='stand'){
   task.weight=Math.max(0,task.weight-dt/.8);if(task.weight===0){if(task.kind==='bed')task.stage='waitExit';else{release(a);a.act='idle';a.until=t+1;}}
  }
  // Root height and the two individually planted contacts share one authored
  // ramp/floor sampler. Ordinary ground locomotion never opts into it.
  if(a.chickenTask)a.g.position.y=task.access?yard.sampleStationSupport(s.id,a.g.position.x,a.g.position.z).height:0;
  const dx=a.g.position.x-ox,dz=a.g.position.z-oz;a.vel.set(dx/Math.max(dt,.001),dz/Math.max(dt,.001));a.lastSpd=Math.hypot(dx,dz)/Math.max(dt,.001);
  updateRig(a.rig3d,dx,dz,dt);
  if(a.chickenTask&&(task.stage==='align'||task.stage==='hold')){
   const d=s.facing-a.rig3d.model.rotation.y;a.rig3d.model.rotation.y+=Math.atan2(Math.sin(d),Math.cos(d))*Math.min(1,dt*6);
   if(task.stage==='align'&&Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))<.04){task.stage='hold';task.held=0;if(lane===task)lane=null;}
   if(task.stage==='hold'){
    task.held+=dt;task.weight=Math.min(1,task.weight+dt/.8);
    if(task.kind!=='bed'&&task.held>(task.kind==='feed'?7:5)){task.stage='stand';if(task.kind==='feed'){a.need.hunger=0;a.chickenMealAt=t+40;}else a.chickenDrinkAt=t+45;}
   }
  }
  if(a.chickenTask){
   a.act=a.lastSpd>.01?'moving':task.kind==='bed'&&task.stage==='hold'?'sleeping':'idle';a.label=task.blocked>3?'Waiting for a clear care route':task.stage==='waiting'?'Waiting to enter the coop':task.stage==='waitExit'?'Waiting to leave the coop':task.stage==='exit'?'Walking out of the coop':task.stage==='hold'?task.kind==='bed'?'Sleeping in the coop':task.kind==='feed'?'Pecking at the feeder':'Sipping at the waterer':task.kind==='bed'?'Walking to coop bedding':task.kind==='feed'?'Walking to the feeder':'Walking to the waterer';
   if(task.weight>0)a.chickenPose.apply({mode:task.kind==='bed'?'lie':task.kind,weight:task.weight,target:task.contact});
  }
  return true;
 }
 return {scheduler,request,update,release};
}
