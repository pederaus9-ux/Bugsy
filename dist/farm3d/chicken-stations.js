import {animalPenYardLayout} from './animal-pen-layout.js?v=1';
import {pointInPolygon,segmentInPolygon} from './animal-pen-geometry.js?v=1';
import * as T from './lib/three.module.min.js';
import {createStationScheduler} from './animal-stations.js?v=1';
import {getAnimalCarePose} from './animal-care-poses.js?v=3';

// Cosmetic care adapter. The existing scheduler owns occupancy. No game,
// inventory, clock, save or production API is reachable from this module.
export function createChickenStationController({yard,route,neighbours,updateRig,clearPoint=()=>true}){
 const scheduler=createStationScheduler(yard.stations),byId=new Map(yard.stations.map(s=>[s.id,s])),tasks=new Map(),lanes=new Map();let wakeUntil=-Infinity,revision=yard.layout.revision??0;
 const inside=(x,z)=>yard.layout.custom?pointInPolygon([x,z],yard.layout.polygon,.3):x>=-16.2&&x<=-5.2&&z>=-5.5&&z<=4.7;
 const steering=Array.from({length:64},(_,i)=>[Math.cos(i*Math.PI/32),Math.sin(i*Math.PI/32)]);
 const pos=a=>new T.Vector2(a.g.position.x,a.g.position.z),world=p=>new T.Vector2(p[0],p[2]);
 const eligible=t=>t.kind==='bed'&&['waiting','waitExit'].includes(t.stage);
 const accessFor=task=>(yard.accesses||[yard.access]).find(A=>A.id===task.station.lane)||yard.access;
 function nextLane(id){const all=[...tasks.values()].filter(t=>eligible(t)&&accessFor(t).id===id),exiting=all.filter(t=>t.stage==='waitExit');return (exiting.length?exiting.sort((a,b)=>b.order-a.order):all.sort((a,b)=>a.order-b.order))[0];}
 function release(a){const t=a.chickenTask;if(!t)return;a.chickenPose?.reset();scheduler.release(t.token);tasks.delete(t.token.animalId);if(lanes.get(accessFor(t).id)===t)lanes.delete(accessFor(t).id);a.chickenTask=null;a.rig3d.sampleSupport=null;}
 function returnPoint(a){
  for(const radius of [0,.55,1.1,1.65,2.2,2.75,3.3,3.85,4.4,4.95,5.5])for(let k=0;k<12;k++){
   const x=a.g.position.x+Math.cos(k*Math.PI/6)*radius,z=a.g.position.z+Math.sin(k*Math.PI/6)*radius;
   if(!inside(x,z)||!clearPoint(x,z)||yard.layout.obstacles.some(([bx,bz,hw,hd])=>Math.abs(x-bx)<hw+.3&&Math.abs(z-bz)<hd+.3))continue;
   if([...tasks.values()].some(t=>Math.hypot(x-t.returnPoint[0],z-t.returnPoint[2])<.5)||neighbours().some(b=>b!==a&&Math.hypot(x-b.g.position.x,z-b.g.position.z)<.34))continue;
   return [x,0,z];
  }
  return null;
 }
 function request(a,kind){
  if(a.chickenTask)return a.chickenTask.kind===kind;
  const back=returnPoint(a);if(!back)return false;
  const token=scheduler.request('hen-'+a.ref.i,kind);if(!token)return false;
  const station=byId.get(token.stationId),t={kind,token,station,stage:kind==='bed'?'waiting':'approach',weight:0,held:0,order:yard.stations.indexOf(station),path:null,blocked:0,contact:station.contact?new T.Vector3(...station.contact):null,returnPoint:back,access:a.g.position.y>1e-6,groundLeg:true,groundOverlap:a.g.position.y===0&&yard.sampleStationSupport(station.id,a.g.position.x,a.g.position.z).height>0};
  a.chickenTask=t;tasks.set(token.animalId,t);a.chickenPose??=getAnimalCarePose('chicken',a.rig3d);a.rig3d.sampleSupport=(x,z)=>t.access?yard.sampleStationSupport(station.id,x,z).height:0;a.target=null;a.path=null;a.vel.set(0,0);
  return true;
 }
 function groundRoute(a,from,to,avoid=neighbours().filter(b=>b!==a&&!b.gone&&b.g.position.y<.1)){
  const blockers=yard.layout.obstacles,depth=(p,b)=>Math.min(b[2]+.18-Math.abs(p[0]-b[0]),b[3]+.18-Math.abs(p[1]-b[1]));
  const support=p=>yard.sampleStationSupport(yard.stations[0].id,p[0],p[1]).height;
  const point=p=>inside(p[0],p[1])&&clearPoint(...p)&&support(p)===0&&blockers.every(b=>depth(p,b)<=0)&&avoid.every(b=>Math.hypot(p[0]-b.g.position.x,p[1]-b.g.position.z)>=.34);
  const line=(start,end,escape=false)=>{if(yard.layout.custom&&!segmentInPolygon(start,end,yard.layout.polygon,.3))return false;let prev=start;const n=Math.max(1,Math.ceil(Math.hypot(end[0]-start[0],end[1]-start[1])/.04));for(let k=1;k<=n;k++){const p=[start[0]+(end[0]-start[0])*k/n,start[1]+(end[1]-start[1])*k/n];if(!point(p)){
   if(!escape||!inside(p[0],p[1])||!clearPoint(...p)||support(p)>support(prev)+1e-8||blockers.some(b=>depth(p,b)>0&&!(depth(prev,b)>0&&depth(p,b)<depth(prev,b)-1e-8))||avoid.some(b=>{const d=Math.hypot(p[0]-b.g.position.x,p[1]-b.g.position.z),old=Math.hypot(prev[0]-b.g.position.x,prev[1]-b.g.position.z);return d<.34&&d<=old+1e-8;}))return false;
  }prev=p;}return true;};
  const original=route(new T.Vector2(...from),new T.Vector2(...to),.26,a.pen,avoid.map(b=>({x:b.g.position.x,z:b.g.position.z,hw:.08,hd:.08,radius:.08,c:1,s:0}))).map(v=>[v.x,v.y]);
  let previous=from;if(original.every((p,i)=>{const valid=line(previous,p,i===0);previous=p;return valid;}))return original.map(p=>[p[0],0,p[1]]);
  // Bounded fallback for this small enclosure only. The shared visibility
  // planner may ignore an obstacle containing either endpoint; care cannot.
  const step=.16,x0=yard.layout.custom?Math.min(...yard.layout.polygon.map(p=>p[0]))+.4:-16.1,z0=yard.layout.custom?Math.min(...yard.layout.polygon.map(p=>p[1]))+.4:-5.4,nx=yard.layout.custom?Math.ceil((Math.max(...yard.layout.polygon.map(p=>p[0]))-.3-x0)/step):69,nz=yard.layout.custom?Math.ceil((Math.max(...yard.layout.polygon.map(p=>p[1]))-.3-z0)/step):64,count=nx*nz,valid=new Int8Array(count),dist=new Float64Array(count).fill(Infinity),parent=new Int32Array(count).fill(-1),done=new Uint8Array(count),heap=[],seedVia=new Map();
  const xy=i=>[x0+(i%nx)*step,z0+Math.floor(i/nx)*step],free=i=>{if(!valid[i])valid[i]=point(xy(i))?1:-1;return valid[i]===1;};
  const push=(i,g)=>{const p=xy(i),item={i,f:g+Math.hypot(p[0]-to[0],p[1]-to[1])};heap.push(item);let n=heap.length-1;while(n){const up=(n-1)>>1;if(heap[up].f<=item.f)break;heap[n]=heap[up];n=up;}heap[n]=item;};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let n=0;while(n*2+1<heap.length){let child=n*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[n]=heap[child];n=child;}heap[n]=last;}return first.i;};
  const cx=Math.round((from[0]-x0)/step),cz=Math.round((from[1]-z0)/step);
  for(let z=Math.max(0,cz-5);z<=Math.min(nz-1,cz+5);z++)for(let x=Math.max(0,cx-5);x<=Math.min(nx-1,cx+5);x++){const i=z*nx+x,p=xy(i);if(free(i)&&line(from,p,true)){dist[i]=Math.hypot(p[0]-from[0],p[1]-from[1]);push(i,dist[i]);}}
  // A legal boundary strip can be narrower than a grid cell. Connect its
  // start through real inflated obstacle corners, retaining the same physical
  // clearance and line checks, rather than leaving it outside the graph.
  if(!heap.length)for(const [bx,bz,hw,hd]of blockers)for(const sx of [-1,1])for(const sz of [-1,1]){
   const corner=[bx+sx*(hw+.181),bz+sz*(hd+.181)];if(!point(corner)||!line(from,corner,true))continue;
   const xx=Math.round((corner[0]-x0)/step),zz=Math.round((corner[1]-z0)/step),lead=Math.hypot(corner[0]-from[0],corner[1]-from[1]);
   for(let z=Math.max(0,zz-5);z<=Math.min(nz-1,zz+5);z++)for(let x=Math.max(0,xx-5);x<=Math.min(nx-1,xx+5);x++){
    const i=z*nx+x,p=xy(i),g=lead+Math.hypot(p[0]-corner[0],p[1]-corner[1]);if(g<dist[i]&&free(i)&&line(corner,p)){dist[i]=g;seedVia.set(i,corner);push(i,g);}
   }
  }
  let end=-1;while(heap.length){const i=pop();if(done[i])continue;done[i]=1;const p=xy(i);if(Math.hypot(p[0]-to[0],p[1]-to[1])<.4&&line(p,to)){end=i;break;}
   const x=i%nx,z=Math.floor(i/nx);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const j=zz*nx+xx;if(done[j]||!free(j))continue;const g=dist[i]+step*Math.hypot(dx,dz);if(g<dist[j]&&line(p,xy(j))){dist[j]=g;parent[j]=i;push(j,g);}}}
  if(end<0){
   // Waiting birds can close a narrow passage before the entrant is near
   // enough for proximity yielding. Keep a real static route to that passage;
   // its waiting occupants yield to the forward corridor below. Moving birds
   // and all physical step/clearance checks remain obstacles.
   const fixed=avoid.filter(b=>b.chickenTask&&b.chickenTask.stage!=='waiting');
   if(fixed.length!==avoid.length)return groundRoute(a,from,to,fixed);
   return [[to[0],0,to[1]]]; // Physical steps still refuse an unavailable route.
  }
  const path=[to];for(let i=end;i>=0;i=parent[i]){path.unshift(xy(i));if(parent[i]<0&&seedVia.has(i))path.unshift(seedVia.get(i));}const compact=[];previous=from;for(let i=0;i<path.length;){let j=path.length-1;while(j>i&&!line(previous,path[j],i===0))j--;compact.push([path[j][0],0,path[j][1]]);previous=path[j];i=j+1;}return compact;
 }
 function pathTo(a,p,avoid){return groundRoute(a,[a.g.position.x,a.g.position.z],[p[0],p[2]],avoid);}
 function exitPath(a,task){task.groundGoal=task.returnPoint;task.groundTail=[];task.groundLeg=false;const p=a.g.position,A=accessFor(task),back=groundRoute(a,[A.outside[0],A.outside[2]],[task.returnPoint[0],task.returnPoint[2]]);return [...(p.z>A.rampEnd[2]?[[A.rampStart[0],0,Math.max(p.z,A.rampStart[2])]]:[[A.entry[0],A.floor,p.z],A.entry,A.rampEnd,A.rampStart]),A.outside,...back];}
 function clearStep(a,task,p,x,z){
  const ox=a.g.position.x,oz=a.g.position.z,A=accessFor(task),s=task.station,here=yard.sampleStationSupport(s.id,ox,oz),next=yard.sampleStationSupport(s.id,x,z);
  if(task.groundOverlap&&here.height===0)task.groundOverlap=false;
  if((!task.access&&next.height>1e-8&&!(task.groundOverlap&&next.height<=here.height))||(!task.groundOverlap&&Math.abs(next.height-here.height)>.08)||!clearPoint(x,z))return false;
  if(!inside(x,z))return false;
  const rampGoal=p[0]===A.rampStart[0]&&p[2]===A.rampStart[2],outsideGoal=p[0]===A.outside[0]&&p[2]===A.outside[2],accessLeg=task.access||rampGoal||(outsideGoal&&z>=oz-1e-8);
  if(yard.layout.obstacles.some(([bx,bz,hw,hd],i)=>!(i===0&&next.inside&&here.inside)&&!(i===(A.obstacle??1)&&accessLeg&&((next.inside&&here.inside)||(Math.abs(x-A.entry[0])<=.6&&z>=A.rampEnd[2]&&z<=A.outside[2])))&&Math.abs(x-bx)<hw+.18&&Math.abs(z-bz)<hd+.18&&!(Math.abs(ox-bx)<hw+.18&&Math.abs(oz-bz)<hd+.18&&Math.min(hw+.18-Math.abs(x-bx),hd+.18-Math.abs(z-bz))<Math.min(hw+.18-Math.abs(ox-bx),hd+.18-Math.abs(oz-bz))-1e-6)))return false;
  return neighbours().every(b=>b===a||b.gone||Math.hypot(b.g.position.x-x,b.g.position.z-z)>=.34||Math.hypot(b.g.position.x-x,b.g.position.z-z)>Math.hypot(b.g.position.x-ox,b.g.position.z-oz)+1e-6);
 }
 function walk(a,task,p,dt,t,yielding=false){
  const ox=a.g.position.x,oz=a.g.position.z,dx=p[0]-ox,dz=p[2]-oz,d=Math.hypot(dx,dz),step=Math.min(d,.65*dt),nx=ox+dx/(d||1)*step,nz=oz+dz/(d||1)*step;
  const key=p.join(',');if(task.progressKey!==key){task.progressKey=key;task.bestDistance=d;task.progressAt=t;}else if(d<task.bestDistance-.03){task.bestDistance=d;task.progressAt=t;}if(!yielding&&t-task.progressAt>2){task.blocked=2;task.detour=null;}
  const clear=(x,z)=>clearStep(a,task,p,x,z),detour=task.detour,tx=detour?ox+detour.ux*step:ox,tz=detour?oz+detour.uz*step:oz;
  if(detour&&t<detour.until&&clear(tx,tz)){a.g.position.x=tx;a.g.position.z=tz;}
  else if(clear(nx,nz)){a.g.position.x=nx;a.g.position.z=nz;task.blocked=0;task.detour=null;}
  else{
   task.blocked+=dt;
   if(!yielding&&task.groundLeg!==false&&(task.blocked>1||!task.replans)&&a.g.position.y===0&&t>(task.replanAt||0)){
    const close=neighbours().filter(b=>b!==a&&!b.gone&&b.g.position.y<.1&&Math.hypot(b.g.position.x-ox,b.g.position.z-oz)<3),stamp=close.map(b=>[b.ref.i,Math.round(b.g.position.x*4),Math.round(b.g.position.z*4)].join(':')).join('|');
    // Replan when yielding changes the crowd, at most once a second.
    if((task.replans||0)<3||stamp!==task.crowdStamp||t-task.progressAt>2){task.path=[...pathTo(a,task.groundGoal||p,close),...(task.groundTail||task.path.slice(1))];task.detour=null;task.replans=(task.replans||0)+1;task.crowdStamp=stamp;task.blocked=0;task.progressAt=t;}task.replanAt=t+1;
   }
   let best=null,bestScore=-Infinity;for(const [ux,uz]of steering){const x=ox+ux*step,z=oz+uz*step,score=ux*dx+uz*dz;if(score>bestScore&&clear(x,z)){best=[x,z,ux,uz];bestScore=score;}}
   if(best){a.g.position.x=best[0];a.g.position.z=best[1];task.detour={ux:best[2],uz:best[3],until:t+(yielding?.25:.8)};}
  }
 }
 function yieldToEntrants(a,task,dt,t){
  if(a.g.position.y>.01)return;
  const active=[];
  for(const b of neighbours()){
   if(b===a||b.chickenTask?.kind!=='bed'||!['approach','exit'].includes(b.chickenTask.stage)||b.g.position.y>=.1)continue;
   let x=b.g.position.x,z=b.g.position.z;
   if(Math.hypot(x-a.g.position.x,z-a.g.position.z)<1.15){active.push([x,z]);continue;}
   // Look ahead along the actual ground route so a bird occupying a narrow
   // passage starts moving before the entrant gets trapped behind scenery.
   let remaining=2,nearest=null,best=.55;
   for(const p of b.chickenTask.path||[]){
    if(p[1]>0||remaining<=0)break;
    const dx=p[0]-x,dz=p[2]-z,length=Math.hypot(dx,dz),span=Math.min(length,remaining);
    if(length>1e-8){const u=Math.max(0,Math.min(span/length,((a.g.position.x-x)*dx+(a.g.position.z-z)*dz)/(length*length))),qx=x+dx*u,qz=z+dz*u,d=Math.hypot(a.g.position.x-qx,a.g.position.z-qz);if(d<best){best=d;nearest=[qx,qz];}}
    remaining-=span;x=p[0];z=p[2];
   }
   if(nearest)active.push(nearest);
  }
  if(!active.length)return;
  let dx=0,dz=0;for(const p of active){const x=a.g.position.x-p[0],z=a.g.position.z-p[1],d=Math.hypot(x,z)||.001;dx+=x/d*3;dz+=z/d*3;}
  for(const b of neighbours()){if(b===a||b.g.position.y>.1)continue;const x=a.g.position.x-b.g.position.x,z=a.g.position.z-b.g.position.z,d=Math.hypot(x,z);if(d>1e-6&&d<.6){dx+=x/d*(.6-d)*4;dz+=z/d*(.6-d)*4;}}
  const d=Math.hypot(dx,dz);if(d<1e-6)return;task.access=false;walk(a,task,[a.g.position.x+dx/d,0,a.g.position.z+dz/d],dt,t,true);
 }
 function ageEmote(a,dt,t){if(a.emoteT>0){a.emoteT=Math.max(0,a.emoteT-dt);if(a.bubble){a.bubble.visible=a.emoteT>0;a.bubble.material.opacity=Math.min(1,a.emoteT*2);if(Number.isFinite(a.S?.h))a.bubble.position.y=a.S.h+.35+Math.sin(t*3)*.04;}}}
 function update(a,dt,t,{night,wet,supplies}){
  if(!a.rig3d)return false;
  // Existing daytime naps become part of the overnight/sheltering flock.
  // Otherwise the wake barrier can end while those same birds still depart.
  if((night||wet)&&a.chickenTask?.kind==='bed')a.chickenTask.nap=false;
  // Departing sleepers have the lane first; cosmetic visits resume afterward.
  if(!night&&!wet&&[...tasks.values()].some(task=>task.kind==='bed'&&!task.nap))wakeUntil=t+2;
  if(!a.chickenTask&&t>wakeUntil){
   if((night||wet||a.need.tired>.85)&&t>=(a.postNightAwakeUntil??0)){if(request(a,'bed'))a.chickenTask.nap=!night&&!wet;}
   else if(a.need.hunger>.35&&supplies.feedMs>0&&t>(a.chickenMealAt||0))request(a,'feed');
   else if(t>(a.chickenDrinkAt??25+a.ref.i)&&supplies.waterMs>0)request(a,'drink');
  }
  const task=a.chickenTask;
  if(!task){
   if(!tasks.size){a.chickenYield=null;return false;}
   // A bird that has already woken is still part of doorway traffic. Let it
   // clear the return corridor without claiming a station or starting care.
   const ox=a.g.position.x,oz=a.g.position.z;
   const traffic=a.chickenYield??={station:yard.stations[0],access:false,groundLeg:true,blocked:0};
   yieldToEntrants(a,traffic,dt,t);
   const dx=a.g.position.x-ox,dz=a.g.position.z-oz;
   if(Math.hypot(dx,dz)<1e-8)return false;
   ageEmote(a,dt,t);
   a.vel.set(dx/Math.max(dt,.001),dz/Math.max(dt,.001));a.lastSpd=Math.hypot(dx,dz)/Math.max(dt,.001);
   updateRig(a.rig3d,dx,dz,dt);a.act='moving';a.label='Making room for the flock';return true;
  }
  a.chickenYield=null;
  ageEmote(a,dt,t);
  a.chickenPose.reset();const s=task.station,ox=a.g.position.x,oz=a.g.position.z;
  if(task.kind==='bed'&&task.stage==='waiting'&&!night&&!wet&&a.need.tired<.85){release(a);return false;}
  if(task.stage==='hold'&&((task.kind==='bed'&&!night&&!wet&&(!task.nap||task.held>=12))||(task.kind==='feed'&&supplies.feedMs<=0)||(task.kind==='drink'&&supplies.waterMs<=0)))task.stage='stand';
  const A=accessFor(task);
  if(task.stage==='waiting'||task.stage==='waitExit'){
   if(!lanes.has(A.id)&&nextLane(A.id)===task){lanes.set(A.id,task);if(task.stage==='waiting'){task.stage='approach';task.groundGoal=A.outside;task.groundTail=s.path;task.groundLeg=true;task.path=[...pathTo(a,A.outside),...s.path];}else{task.stage='exit';task.path=exitPath(a,task);}}
  }
  if(task.stage==='waiting')yieldToEntrants(a,task,dt,t);
  if(task.stage==='approach'||task.stage==='exit'){
   if(!task.path){task.groundGoal=s.approach;task.groundTail=[s.dock];task.path=[...pathTo(a,s.approach),s.dock];}
   // Late bed allocations can put an occupied bed on an authored interior
   // waypoint. Aim beyond that intermediate point; the same physical steps
   // still steer around the sleeper, walls and support edges. Never skip docks
   // or height transitions needed for the doorway/ramp.
   // A later bedtime can begin while a bird is already on the raised floor.
   // In that case groundLeg may still be true even though both next waypoints
   // are on the same supported floor. Only bypass an occupied intermediate
   // waypoint; the dock and every physical step remain mandatory.
   if(task.stage==='approach'&&task.kind==='bed'&&a.g.position.y>.1)while(task.path.length>1){const p=task.path[0],next=task.path[1];if(p[1]<=.1||p[1]!==next[1]||!neighbours().some(b=>b!==a&&b.chickenTask?.kind==='bed'&&b.chickenTask.stage==='hold'&&Math.abs(b.g.position.y-p[1])<.08&&Math.hypot(b.g.position.x-p[0],b.g.position.z-p[2])<.34))break;task.path.shift();task.detour=null;}
   const p=task.path[0];task.access=task.kind==='bed'&&((p?.[1]||0)>0||a.g.position.y>1e-6);
   if(p){const d=Math.hypot(p[0]-ox,p[2]-oz);walk(a,task,p,dt,t);if(d<.008){task.path.shift();task.detour=null;if(task.kind==='bed'&&p===A.rampStart)task.groundLeg=false;if(task.stage==='exit'&&p===A.outside)task.groundLeg=true;}}
   else if(task.stage==='exit'){release(a);a.need.tired=0;a.act='idle';a.until=t+1;}
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
   if(task.stage==='align'&&Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))<.04){task.stage='hold';task.held=0;if(lanes.get(A.id)===task)lanes.delete(A.id);}
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
 function snapshotLayout(){
  return {revision,tokens:scheduler.snapshot(),wakeUntil,lanes:[...lanes].map(([lane,t])=>({lane,animalId:t.token.animalId})),tasks:[...tasks].map(([animalId,t])=>({animalId,stationId:t.station.id,kind:t.kind,stage:t.stage,held:t.held,weight:t.weight,blocked:t.blocked,nap:t.nap,order:t.order}))};
 }
 function prepareLayoutRebind({site,now,placements,waiting}){
  if(site.kind!=='chicken'||!Number.isFinite(now))throw new Error('Invalid chicken care revision');
  const layout=animalPenYardLayout(site),stations=site.stations,accesses=site.accesses,delta=site.components.coop.delta;
  // Capture immutable layout data only; retaining the previous yard here would
  // retain its disposed meshes across every subsequent edit.
  function sampleStationSupport(id,x,z){
   if(!stations.some(s=>s.id===id))return {height:0,normal:[0,1,0],inside:false};
   for(const A of accesses)if(Math.abs(x-A.entry[0])<=.6&&z>=A.rampEnd[2]-1e-8&&z<=A.rampStart[2]+1e-8)return {height:A.floor*Math.max(0,Math.min(1,(A.rampStart[2]-z)/(A.rampStart[2]-A.rampEnd[2]))),normal:[0,Math.cos(A.pitch),Math.sin(A.pitch)],inside:true};
   if(x>=-14.25+delta[0]&&x<=-8.55+delta[0]&&z>=-4.58+delta[1]&&z<=.35+delta[1])return {height:accesses[0].floor,normal:[0,1,0],inside:true};
   return {height:0,normal:[0,1,0],inside:false};
  }
  const next={layout,stations,accesses,access:accesses[0],sampleStationSupport},updates=[];
  for(const a of neighbours().filter(a=>!a.gone)){
   const id='hen-'+a.ref.i,position=placements[id],task=a.chickenTask,station=task?stations.find(s=>s.id===task.station.id):null,back=waiting?.[id];
   if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw new Error('Missing validated chicken placement '+id);
   if(task&&(!station||!Array.isArray(back)||back.length!==3||!back.every(Number.isFinite)))throw new Error('Missing reserved station or validated waiting position '+id);
   updates.push({a,task,station,position:[...position],back:back?[...back]:null});
  }
  let state='prepared';
  return {revision:site.revision,publish(){
   if(state==='published')return;if(state!=='prepared')throw new Error('Chicken revision '+state);
   if(updates.some(u=>u.a.chickenTask!==u.task))throw new Error('Stale chicken care revision');
   yard=next;revision=site.revision;byId.clear();for(const s of stations)byId.set(s.id,s);
   for(const {a,task,station,position,back}of updates){
    a.g.position.fromArray(position);a.path=null;a.target=null;a.vel.set(0,0);a.chickenYield=null;
    if(!task)continue;
    task.station=station;task.returnPoint=back;task.contact=station.contact?new T.Vector3(...station.contact):null;
    task.path=null;task.detour=null;task.progressKey=null;task.blocked=0;task.replans=0;task.replanAt=now;task.groundGoal=null;task.groundTail=[];
    a.rig3d.sampleSupport=(x,z)=>task.access?sampleStationSupport(station.id,x,z).height:0;
    if(task.stage==='exit'){task.path=exitPath(a,task);}
    else if(task.stage==='approach'&&task.kind==='bed'){
     const A=accessFor(task);
     if(position[1]===0){task.groundLeg=true;task.groundGoal=A.outside;task.groundTail=station.path;task.path=[...pathTo(a,A.outside),...station.path];}
     else{
      // Resume on the nearest authored ramp/interior segment, retaining its
      // forward waypoints and the original physical per-frame step checks.
      let best=Infinity,index=0;const path=station.path;
      for(let i=0;i<path.length-1;i++){const p=path[i],q=path[i+1],v=q.map((n,k)=>n-p[k]),length=v.reduce((n,k)=>n+k*k,0),u=Math.max(0,Math.min(1,position.reduce((n,k,j)=>n+(k-p[j])*v[j],0)/(length||1))),d=Math.hypot(...position.map((n,k)=>n-p[k]-v[k]*u));if(d<best){best=d;index=i+1;}}
      task.path=path.slice(index);task.groundLeg=false;
     }
    }
   }
   state='published';
  },dispose(){if(state==='prepared')state='disposed';}};
 }
 return {scheduler,request,update,release,snapshotLayout,prepareLayoutRebind};
}
