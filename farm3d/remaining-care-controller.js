import {pointInPolygon,segmentInPolygon,pointSegmentDistance} from './animal-pen-geometry.js?v=1';
import * as T from './lib/three.module.min.js';
import {animalPenYardLayout} from './animal-pen-layout.js?v=1';
import {createStationScheduler} from './animal-stations.js?v=1';
import {careSegmentClear,carePointRuleClear} from './remaining-care-navigation.js?v=2';
import {createQuadrupedCarePose} from './quadruped-care-poses.js?v=1';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]),angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
// Physical care is ephemeral. No save, supplies, production, reward or wall-clock API.
export function createRemainingCareController({layouts,neighbours,active,obstacles,updateRig,segments=()=>[],clearPoint=()=>true,forbiddenPolygons=()=>[],groundY=()=>0}){
 const scheduler=createStationScheduler(Object.values(layouts).flatMap(l=>l.stations)),tasks=new Map();let wakeUntil=-Infinity,now=0,bedPriority=false;
 const slot=a=>a.ref.type==='pet'?0:a.ref.i,id=a=>a.ref.type==='pet'?'pet-'+a.kind:a.kind+'-'+a.ref.i;
 function inside(l,x,z,pad){return !l.polygon||pointInPolygon([x,z],l.polygon,pad);}
 function free(a,x,z,escape=false){const l=layouts[a.kind],ox=a.g.position.x,oz=a.g.position.z,pad=l.margin;
  if(!inside(l,x,z,pad)||!clearPoint(a,x,z))return false;
  for(const [ax,az,bx,bz]of segments()){const dx=bx-ax,dz=bz-az,dist=(px,pz)=>{const u=Math.max(0,Math.min(1,((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(px-ax-dx*u,pz-az-dz*u);};if(dist(x,z)<pad+.05&&!(escape&&dist(x,z)>dist(ox,oz)+1e-9))return false;}
  for(const [bx,bz,hw,hd]of obstacles(a)){const depth=(px,pz)=>Math.min(hw+pad-Math.abs(px-bx),hd+pad-Math.abs(pz-bz)),d=depth(x,z);if(d>0&&!(escape&&d<depth(ox,oz)-1e-9))return false;}
  for(const b of neighbours()){if(b===a||b.gone)continue;const min=pad+(layouts[b.kind]?.margin??Math.min(b.S?.r??.3,.8)),d=Math.hypot(x-b.g.position.x,z-b.g.position.z);if(d<min-1e-8&&!(escape&&d>Math.hypot(ox-b.g.position.x,oz-b.g.position.z)+1e-9))return false;}
  return true;
 }
 function line(a,from,to,escape=false){const l=layouts[a.kind],circles=neighbours().filter(b=>b!==a&&!b.gone).map(b=>({x:b.g.position.x,z:b.g.position.z,r:l.margin+(layouts[b.kind]?.margin??Math.min(b.S?.r??.3,.8))}));
  if(l.polygon&&!segmentInPolygon([from[0],from[2]],[to[0],to[2]],l.polygon,l.margin))return false;
  if(!careSegmentClear(from,to,{pad:l.margin,rectangles:obstacles(a),segments:segments(),circles,polygons:forbiddenPolygons(a),escape}))return false;
  if(!carePointRuleClear(from,to,{pad:l.margin,polygons:forbiddenPolygons(a),clearPoint:(x,z)=>clearPoint(a,x,z)}))return false;
  const d=distance(from,to),n=Math.max(1,Math.ceil(d/.08));for(let i=1;i<=n;i++){const x=from[0]+(to[0]-from[0])*i/n,z=from[2]+(to[2]-from[2])*i/n;if(!inside(l,x,z,l.margin)||!clearPoint(a,x,z))return false;}return true;
 }
 function plan(a,goal,startAligned=false){
  const from=a.g.position.toArray(),l=layouts[a.kind];if(!free(a,goal[0],goal[2]))return [];if(line(a,from,goal,true))return [goal];
  // Pets roam beyond the original yard (friends in the north field): the search box
  // also covers where the pet stands and where it is going.
  const xs=[-20,20,from[0]-1.5,from[0]+1.5,goal[0]-1.5,goal[0]+1.5],zs=[-15,23,from[2]-1.5,from[2]+1.5,goal[2]-1.5,goal[2]+1.5];
  // A fixed grid can miss a legal narrow gap containing the actor. Only after
  // that search fails, align one grid of the same spacing with its start.
  // Every node and edge still passes the identical physical predicates.
  const p=l.polygon||[[Math.min(...xs),Math.min(...zs)],[Math.max(...xs),Math.min(...zs)],[Math.max(...xs),Math.max(...zs)],[Math.min(...xs),Math.max(...zs)]],left=Math.min(...p.map(v=>v[0]))+.05,bottom=Math.min(...p.map(v=>v[1]))+.05,step=.3,x0=left+(startAligned?((from[0]-left)%step+step)%step:0),z0=bottom+(startAligned?((from[2]-bottom)%step+step)%step:0),x1=Math.max(...p.map(v=>v[0]))-.05,z1=Math.max(...p.map(v=>v[1]))-.05,nx=Math.ceil((x1-x0)/step),nz=Math.ceil((z1-z0)/step),n=nx*nz,dist=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1),closed=new Uint8Array(n),valid=new Int8Array(n),heap=[];
  const xy=i=>[x0+(i%nx)*step,0,z0+Math.floor(i/nx)*step],ok=i=>{if(!valid[i]){const q=xy(i);valid[i]=free(a,q[0],q[2])?1:-1;}return valid[i]===1;};
  function push(i,g){let at=heap.length;const item={i,f:g+distance(xy(i),goal)};heap.push(item);while(at){const parent=(at-1)>>1;if(heap[parent].f<=item.f)break;heap[at]=heap[parent];at=parent;}heap[at]=item;}
  function pop(){const first=heap[0],last=heap.pop();if(heap.length){let at=0;while(at*2+1<heap.length){let child=at*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(last.f<=heap[child].f)break;heap[at]=heap[child];at=child;}heap[at]=last;}return first.i;}
  const cx=Math.round((from[0]-x0)/step),cz=Math.round((from[2]-z0)/step);for(let iz=Math.max(0,cz-5);iz<=Math.min(nz-1,cz+5);iz++)for(let ix=Math.max(0,cx-5);ix<=Math.min(nx-1,cx+5);ix++){const i=iz*nx+ix;if(ok(i)&&line(a,from,xy(i),true)){dist[i]=distance(from,xy(i));push(i,dist[i]);}}
  let end=-1;while(heap.length){const i=pop();if(closed[i])continue;closed[i]=1;const q=xy(i);if(distance(q,goal)<.6&&line(a,q,goal)){end=i;break;}const x=i%nx,z=Math.floor(i/nx);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const xx=x+dx,zz=z+dz;if(xx<0||xx>=nx||zz<0||zz>=nz)continue;const j=zz*nx+xx;if(closed[j]||!ok(j))continue;const g=dist[i]+step*Math.hypot(dx,dz);if(g<dist[j]&&line(a,q,xy(j))){dist[j]=g;prev[j]=i;push(j,g);}}}
  if(end<0)return startAligned?[]:plan(a,goal,true);
  const path=[goal];for(let i=end;i>=0;i=prev[i])path.unshift(xy(i));const compact=[];let old=from;for(let i=0;i<path.length;){let j=path.length-1;while(j>i&&!line(a,old,path[j],i===0))j--;compact.push(path[j]);old=path[j];i=j+1;}return compact;
 }
 function release(a){const task=a.remainingTask;if(!task)return;a.remainingPose?.reset();scheduler.release(task.token);tasks.delete(id(a));a.remainingTask=null;a.target=null;a.path=null;a.act='idle';a.doing=null;a.vel.set(0,0);}
 function request(a,kind){
  const l=layouts[a.kind];if(!l||!active(a.kind)||!a.rig3d||a.remainingTask||now<wakeUntil&&!(kind==='bed'&&bedPriority))return false;const s=l.stations.find(s=>s.kind===kind&&s.slot===slot(a));if(!s)return false;const token=scheduler.request(id(a),kind,s.id);if(!token)return false;
  const task={kind,station:s,token,stage:'approach',weight:0,held:0,path:null,blocked:0,nextPlan:0};tasks.set(id(a),task);a.remainingTask=task;a.remainingPose??=createQuadrupedCarePose(a.rig3d);a.target=null;a.path=null;a.doing=null;a.vel.set(0,0);return true;
 }
 // One physical step toward p within the care speed and the three-dimensional ground limit.
 function step(a,p,dt){
  const ox=a.g.position.x,oz=a.g.position.z,dx=p[0]-ox,dz=p[2]-oz,d=Math.hypot(dx,dz),s=Math.min(d,layouts[a.kind].speed*dt),x=ox+dx/(d||1)*s,z=oz+dz/(d||1)*s;
  if(!free(a,x,z,true)||!line(a,[ox,a.g.position.y,oz],[x,a.g.position.y,z],true))return false;
  const budget=layouts[a.kind].speed*dt,oy=a.g.position.y,at=u=>[ox+(x-ox)*u,oz+(z-oz)*u];let fraction=1;
  if(Math.hypot(x-ox,groundY(x,z)-oy,z-oz)>budget){let lo=0,hi=1;for(let i=0;i<24;i++){const u=(lo+hi)/2,[xx,zz]=at(u);if(Math.hypot(xx-ox,groundY(xx,zz)-oy,zz-oz)<=budget)lo=u;else hi=u;}fraction=lo;}
  const [xx,zz]=at(fraction);a.g.position.set(xx,groundY(xx,zz),zz);return true;
 }
 // Right of way: two care walkers blocking each other used to replan in mirror image
 // forever. The later walker in a fixed order steps to the nearest free spot clear of
 // the other's remaining route and waits there until it has settled or moved on.
 const walking=b=>!!b.remainingTask&&['approach','exit'].includes(b.remainingTask.stage);
 const reach=(a,b)=>layouts[a.kind].margin+(layouts[b.kind]?.margin??Math.min(b.S?.r??.3,.8));
 function routeOf(b){const task=b.remainingTask,goal=task.stage==='approach'?task.station.dock:layouts[b.kind].turnouts[slot(b)];return[[b.g.position.x,b.g.position.z],...(task.path||[]).map(q=>[q[0],q[2]]),[goal[0],goal[2]]];}
 function clearOf(route,x,z,r){for(let i=1;i<route.length;i++)if(pointSegmentDistance([x,z],route[i-1],route[i])<r)return false;return true;}
 function refuge(a,b,r){
  const route=routeOf(b),from=a.g.position.toArray(),[ox,,oz]=from;if(clearOf(route,ox,oz,r))return from;
  for(let k=1;k<=14;k++)for(let j=0;j<16;j++){const x=ox+Math.cos(j*Math.PI/8)*k*.3,z=oz+Math.sin(j*Math.PI/8)*k*.3,p=[x,groundY(x,z),z];if(clearOf(route,x,z,r)&&free(a,x,z)&&line(a,from,p,true))return p;}
  return null;
 }
 function giveWay(a,task,goal,dt,t){
  let y=task.giveWay;
  // Released when the walker settles, leaves both my surroundings and my destination, or after a timeout.
  if(y&&(y.to.gone||!walking(y.to)||t>y.until||distance(a.g.position.toArray(),y.to.g.position.toArray())>y.r+2.5&&distance(goal,y.to.g.position.toArray())>=y.r)){if(t>y.until)task.calmUntil=t+3;task.giveWay=y=null;task.path=null;task.blocked=0;task.nextPlan=t;}
  if(!y){
   if(task.blocked<=.3||t<(task.calmUntil??-Infinity))return false;let best=null;
   // A blocker is a higher-priority walker beside me or standing on my destination.
   for(const b of neighbours()){if(b===a||b.gone||!walking(b)||id(b)>id(a))continue;const d=distance(a.g.position.toArray(),b.g.position.toArray());if((d<reach(a,b)+.6||distance(goal,b.g.position.toArray())<reach(a,b))&&(!best||d<best.d))best={b,d};}
   if(!best)return false;y=task.giveWay={to:best.b,r:reach(a,best.b),until:t+10,spot:null,at:-Infinity};
  }
  if(t>=y.at+.5&&(!y.spot||!clearOf(routeOf(y.to),y.spot[0],y.spot[2],y.r+.25))){y.spot=refuge(a,y.to,y.r+.25);y.at=t;}
  if(y.spot&&distance(a.g.position.toArray(),y.spot)>.002)step(a,y.spot,dt);
  return true;
 }
 function move(a,task,goal,dt,t){
  if(giveWay(a,task,goal,dt,t))return false;
  if((!task.path||!task.path.length||task.blocked>.6)&&t>=task.nextPlan){task.path=plan(a,goal);task.nextPlan=t+1;task.blocked=0;}
  const p=task.path[0];if(!p){task.blocked+=dt;return false;}
  if(Math.hypot(p[0]-a.g.position.x,p[2]-a.g.position.z)<.002){task.path.shift();return distance(a.g.position.toArray(),goal)<.008;}
  if(step(a,p,dt))task.blocked=0;else task.blocked+=dt;
  return distance(a.g.position.toArray(),goal)<.008;
 }
 function ageEmote(a,dt){if(a.emoteT>0){a.emoteT=Math.max(0,a.emoteT-dt);if(a.bubble){a.bubble.visible=a.emoteT>0;a.bubble.material.opacity=Math.min(1,a.emoteT*2);}}}
 function tick(a,dt,t,env){
  const l=layouts[a.kind];if(!l||!active(a.kind)){release(a);return false;}const wantsBed=!!(env.night||env.wet);now=t;bedPriority=wantsBed;
  if(!wantsBed&&[...tasks.values()].some(task=>task.kind==='bed'&&!task.nap))wakeUntil=t+2;
  if(!a.remainingTask){
   if(wantsBed||a.need.tired>.9&&t>(a.remainingNapAt??0)){if(request(a,'bed'))a.remainingTask.nap=!wantsBed;}
   else if(a.need.hunger>.35&&t>(a.remainingMealAt??0)||env.feedStamp&&env.feedStamp!==a.remainingFeedStamp){if(request(a,'feed'))a.remainingFeedStamp=env.feedStamp;}
   else if(t>(a.remainingDrinkAt??30+slot(a)))request(a,'drink');
  }
  const task=a.remainingTask;if(!task){if(!wantsBed&&t<wakeUntil){a.target=null;a.path=null;a.act='idle';a.label='Making room for waking animals';a.vel.set(0,0);updateRig(a.rig3d,0,0,dt);ageEmote(a,dt);return true;}return false;}
  a.remainingPose.reset();const s=task.station,ox=a.g.position.x,oz=a.g.position.z;
  if(wantsBed&&task.kind==='bed')task.nap=false;
  if(task.kind==='bed'&&!wantsBed&&!task.nap&&['approach','align'].includes(task.stage)){task.stage='exit';task.path=null;}
  if(task.stage==='hold'&&(task.kind==='bed'?(!wantsBed&&(!task.nap||task.held>=15)):task.held>=8||wantsBed))task.stage='stand';
  if(task.stage==='approach'&&move(a,task,s.dock,dt,t)){task.stage='align';task.path=null;}
  if(task.stage==='align'){
   const r=a.rig3d,d=angle(s.facing,r.model.rotation.y);r.model.rotation.y+=Math.sign(d)*Math.min(Math.abs(d),dt*1.4);if(Math.abs(d)<.008){task.stage='settle';scheduler.arrive(task.token);}
  }
  if(task.stage==='settle'){task.weight=Math.min(1,task.weight+dt/1.2);if(task.weight===1)task.stage='hold';}
  if(task.stage==='hold'){task.held+=dt;if(task.kind==='bed')a.need.tired=Math.max(0,a.need.tired-dt*.08);else if(task.kind==='feed')a.need.hunger=Math.max(0,a.need.hunger-dt*.14);}
  const finishingStand=task.stage==='stand';
  if(task.stage==='stand'){task.weight=Math.max(0,task.weight-dt/1.2);if(task.weight===0){task.stage='exit';task.path=null;}}
  if(task.stage==='exit'&&!finishingStand&&move(a,task,l.turnouts[slot(a)],dt,t)){
   if(task.kind==='bed'){a.need.tired=0;a.remainingNapAt=t+60;}if(task.kind==='feed')a.remainingMealAt=t+40;if(task.kind==='drink')a.remainingDrinkAt=t+45;release(a);
  }
  const dx=a.g.position.x-ox,dz=a.g.position.z-oz;a.vel.set(dx/Math.max(dt,.001),dz/Math.max(dt,.001));a.lastSpd=a.vel.length();
  const aligned=['align','settle','hold','stand'].includes(task.stage),yaw=a.rig3d.model.rotation.y;
  updateRig(a.rig3d,dx,dz,dt);if(aligned)a.rig3d.model.rotation.y=yaw;
  if(a.remainingTask){a.remainingPose.apply({mode:task.kind==='bed'?'lie':task.kind,weight:task.weight,surface:l.bedSurface,target:s.contact?new T.Vector3(...s.contact):null});a.act=task.stage==='hold'?(task.kind==='bed'?'sleeping':'eating'):'moving';a.label=task.stage==='hold'?(task.kind==='bed'?'Resting in a bed':task.kind==='feed'?'Eating at the feeder':'Drinking water'):task.stage==='exit'?'Making room at the care stations':'Heading to '+(task.kind==='bed'?'bed':task.kind==='feed'?'food':'water');}
  ageEmote(a,dt);
  return true;
 }
 function update(a,dt,t,env){if(!layouts[a.kind]||!active(a.kind)){release(a);return false;}if(!(dt>0)||!Number.isFinite(dt))return !!a.remainingTask;let consumed=false;for(let left=dt;left>1e-9;){const step=Math.min(1/30,left);consumed=tick(a,step,t-left+step,env)||consumed;left-=step;}return consumed;}
 function snapshotLayout(){
  return {tokens:scheduler.snapshot(),wakeUntil,now,bedPriority,revisions:Object.fromEntries(Object.entries(layouts).map(([kind,l])=>[kind,l.revision??0])),tasks:[...tasks].map(([animalId,t])=>({animalId,stationId:t.station.id,kind:t.kind,stage:t.stage,held:t.held,weight:t.weight,blocked:t.blocked,nap:t.nap}))};
 }
 function prepareLayoutRebind({site,now:resumeAt,placements}){
  if(!layouts[site.kind]||!Number.isFinite(resumeAt))throw new Error('Invalid care layout revision');
  const layout=animalPenYardLayout(site),byId=new Map(layout.stations.map(s=>[s.id,s])),updates=[];
  for(const a of neighbours().filter(a=>a.kind===site.kind&&!a.gone)){
   const position=placements[id(a)],task=a.remainingTask,station=task?byId.get(task.station.id):null;
   if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite))throw new Error('Missing validated actor placement '+id(a));
   if(task&&!station)throw new Error('Missing reserved care station');
   updates.push({a,task,station,position:[...position]});
  }
  let state='prepared';
  return {revision:site.revision,publish(){
   if(state==='published')return;if(state!=='prepared')throw new Error('Care revision '+state);
   if(updates.some(u=>u.a.remainingTask!==u.task))throw new Error('Stale care revision');
   // Merge just this species: sibling preparations may already have published.
   layouts={...layouts,[site.kind]:layout};now=resumeAt;
   for(const {a,task,station,position}of updates){
    a.g.position.fromArray(position);a.path=null;a.target=null;a.vel.set(0,0);
    if(task){task.station=station;task.path=null;task.blocked=0;task.nextPlan=resumeAt;}
   }
   state='published';
  },dispose(){if(state==='prepared')state='disposed';}};
 }
 return {request,release,update,scheduler,tasks,plan,free,snapshotLayout,prepareLayoutRebind};
}
