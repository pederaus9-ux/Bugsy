'use strict';
// Transient controller only. A certificate authorizes route insertion, never movement.
function createRecovery(createRepair,env){
 const LIMIT=512,REQUEST_LIMIT=8192,MAX_JOBS=16,MAX_PATH=64,keys=['x','z','hw','hd','c','s','radius'];
 let generation=0,epoch=null,remaining=0,used=0,maxUsed=0,cursor=0;let jobs=new WeakMap();const queue=[],corners=new WeakSet(),edges=new WeakSet();
 const stats={requests:0,applied:0,cancelled:0,failed:0,plannerVisits:0,snapshotVisits:0,validationVisits:0};
 function spend(n,j,kind){if(!Number.isSafeInteger(n)||n<0||n>remaining||j&&j.work+n>REQUEST_LIMIT)return false;remaining-=n;used+=n;maxUsed=Math.max(maxUsed,used);if(j)j.work+=n;if(kind)stats[kind]+=n;return true;}
 function scope(a,t){return a.cowTask===t&&t.kind==='bed'&&t.stage==='approach'&&!t.layoutReturn&&!env.custom()&&env.admitted(t)&&(!env.canContinue||env.canContinue(a,t))&&!!t.token&&!!t.station;}
 function basic(j){return (!env.farm||env.farm()===j.farm)&&scope(j.a,j.t)&&j.a.ref===j.ref&&j.a.ref.i===j.index&&j.t.token===j.token&&j.t.station===j.station&&j.a.g.position.x===j.from[0]&&j.a.g.position.z===j.from[1]&&j.t.path===j.path&&j.t.waypoints===j.waypoints;}
 function routeSame(j){return j.path.length===j.paths.length&&j.waypoints.length===j.ways.length&&j.paths.every((v,i)=>j.path[i]===v[0]&&v[0].x===v[1]&&v[0].y===v[2])&&j.ways.every((v,i)=>j.waypoints[i]===v[0]&&v[0].length===v.length-1&&v[0].every((x,k)=>x===v[k+1]));}
 function worldSame(j){const obs=env.obstacles(),poly=env.polygon();return obs.length===j.obs.length&&poly.length===4&&poly.every((p,i)=>p.length===2&&p[0]===j.poly[i][0]&&p[1]===j.poly[i][1])&&j.obs.every((o,i)=>keys.every(k=>o[k]===obs[i]?.[k]));}
 function cancel(j){jobs.delete(j.t);j.state='cancelled';stats.cancelled++;}
 function removeDone(){for(let i=queue.length-1;i>=0;i--)if(['cancelled','applied'].includes(queue[i].state))queue.splice(i,1);if(queue.length)cursor%=queue.length;else cursor=0;}
 function pump(nextEpoch){
  if(!Number.isFinite(nextEpoch)||nextEpoch===epoch)return;
  if(epoch!==null&&nextEpoch<epoch){for(const j of queue)cancel(j);queue.length=0;cursor=0;jobs=new WeakMap();}
  epoch=nextEpoch;generation++;remaining=LIMIT;used=0;
  const count=queue.length;for(let n=0;n<count&&queue.length;n++){
   const j=queue[(cursor+n)%queue.length];if(j.state==='cancelled')continue;
   if(!basic(j)){cancel(j);continue;}
   if(j.state==='failed'){if(generation%2===0)continue;const cost=j.obs.length+4+j.paths.length+j.ways.length;if(spend(cost,null,'validationVisits')&&(!routeSame(j)||!worldSame(j)))cancel(j);continue;}
   const routeCost=j.paths.length+j.ways.length;
   if(j.work+routeCost>REQUEST_LIMIT){j.state='failed';stats.failed++;continue;}if(!spend(routeCost,j,'validationVisits'))continue;
   if(!routeSame(j)){cancel(j);continue;}
   if(j.state==='planning'){
    const budget=Math.min(64,remaining,REQUEST_LIMIT-j.work);if(budget<=0){if(j.work>=REQUEST_LIMIT){j.state='failed';stats.failed++;}continue;}
    const r=j.planner.step(budget);spend(r.used,j,'plannerVisits');
    if(r.done){j.result=r.result;if(r.result.status==='path')j.state='ready';else{j.state='failed';stats.failed++;}}
   }
   if(j.state==='ready'){
    const cost=j.obs.length+4;if(j.work+cost>REQUEST_LIMIT){j.state='failed';stats.failed++;continue;}if(!spend(cost,j,'validationVisits'))continue;
    if(!basic(j)||!worldSame(j)){cancel(j);continue;}
    const path=j.result.path;if(!path?.length||path.length>5||path.at(-1)[0]!==j.goal[0]||path.at(-1)[1]!==j.goal[1]){j.state='failed';stats.failed++;continue;}
    // Keep original endpoint objects and the whole original suffix. Only add intermediates.
    const inserted=path.slice(0,-1).map(p=>{const v=env.vector(p[0],p[1]);corners.add(v);edges.add(v);return v;});edges.add(j.path[0]);j.t.path=[...inserted,...j.path];j.state='applied';jobs.delete(j.t);stats.applied++;
   }
  }
  if(count&&generation%2===1)cursor=(cursor+1)%count;removeDone();
 }
 function request(a,t,p){
  if(epoch===null||!scope(a,t)||!Array.isArray(t.path)||t.path.length<2||!Array.isArray(t.waypoints)||t.path.length+t.waypoints.length>MAX_PATH||p!==t.path[0]||t.path.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))||t.waypoints.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))return false;
  let previous=jobs.get(t);
  if(previous)return true;
  const obs=env.obstacles(),poly=env.polygon();if(queue.length>=MAX_JOBS||!Array.isArray(obs)||obs.length>256||!Array.isArray(poly)||poly.length!==4||poly.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return false;
  const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  if(new Set(poly.map(p=>p.join(','))).size!==4||!poly.every(p=>(p[0]===minX||p[0]===maxX)&&(p[1]===minZ||p[1]===maxZ)))return false;
  const cost=obs.length+4+t.path.length+t.waypoints.length;if(!spend(cost,null,'snapshotVisits'))return false;
  const copy=obs.map(o=>Object.fromEntries(keys.map(k=>[k,o?.[k]]))),from=[a.g.position.x,a.g.position.z],goal=[p.x,p.y];
  const j={a,t,farm:env.farm?.(),ref:a.ref,index:a.ref.i,token:t.token,station:t.station,from,goal,path:t.path,waypoints:t.waypoints,paths:t.path.map(p=>[p,p.x,p.y]),ways:t.waypoints.map(p=>[p,...p]),obs:copy,poly:poly.map(p=>[...p]),work:cost,state:'planning'};
  j.planner=createRepair({from,to:goal,obstacles:copy,pen:{minX,maxX,minZ,maxZ}},{maxVisits:REQUEST_LIMIT-cost});jobs.set(t,j);queue.push(j);stats.requests++;return true;
 }
 function wait(a,t){const j=jobs.get(t);if(!j)return false;if(!basic(j)){cancel(j);return false;}return true;}
 return{pump,request,wait,isCorner:p=>corners.has(p),isEdge:p=>edges.has(p),stats(){return{...stats,epoch,used,remaining,maxUsed,queued:queue.length};}};
}
module.exports={createRecovery};
