import {teatTriangleIds,withoutTeats,attachmentQueries,cupContact} from './cow-robot-attachment-query.mjs';
import * as T from '../../lib/three.module.min.js';
import {cacheCowTriangles,cowDiscreteQuery} from './cow-cached-solid-query.mjs';
const vec=p=>p?.toArray?.()??p;
const task=a=>a.cowTask?{kind:a.cowTask.kind,stage:a.cowTask.stage,station:a.cowTask.station.id,jobId:a.cowTask.jobId,token:{...a.cowTask.token},weight:a.cowTask.weight,waypoints:structuredClone(a.cowTask.waypoints),path:a.cowTask.path?.map(vec)}:null;
export function installLiveExitDiagnostic(d,hz=30){
 const G=d.G,dt=1/hz,cows=d.animals.filter(a=>a.kind==='cow'),a=cows.find(a=>a.ref.i===4),nav=d.diagnosticNav;
 if(cows.length!==5||d.animals.length!==46)throw Error('Expected original46/5cow ownership');
 G.close();G.opts.quiet=true;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;
 if(G.fillCowFeed(5)!==5||!G.fillCowWater())throw Error('Original paid stock setup');
 window.__liveNow+=180001;G.save();d.syncCowYard();const id=d.cowStatus.cows[4].id;if(!d.cowStatus.cows[4].ready||!G.milkCow(id))throw Error('Original ready cow job setup');d.syncCowYard();
 const measure={hz,owned:d.animals.length,nativeControllers:5,other41Paused:true,id,job:structuredClone(d.cowStatus.job),phase:'setup',setupFrames:0,exitFrames:0,frames:[],hits:[],maxTargetSpeed:0,minSeparation:Infinity,maxRootSupportError:0,errors:[],tokens:[],fullFrames:0,fullHits:[],gateHits:[],solidHits:[],nonTeatCupHits:[],contactFailures:[],contactFrames:0,maxContactError:0};let cache=null,fullCache=cacheCowTriangles(a.rig3d),firstHit=null,priorPath='',finished=false;
 const snapshot=()=>({clock:d.clock(),now:Date.now(),job:structuredClone(d.cowStatus.job),root:a.g.position.toArray(),yaw:a.rig3d.model.rotation.y,act:a.act,task:task(a),actors:cows.map(c=>({id:d.cowStatus.cows[c.ref.i].id,root:c.g.position.toArray(),task:task(c)})),reservations:d.cowStations.snapshot()});
 const teatIds=teatTriangleIds(a.rig3d),nonTeat=withoutTeats(fullCache,teatIds);if(teatIds.size!==320)throw Error("Unexpected authored teat triangles");
 function geometry(){const v=d.cowYard.componentVolumes();return [...v.shelter.slice(2,15),...v.shelter.slice(20),...v.feedBunk.slice(0,3),...v.trough.slice(0,5),...v.robot];}
 function navEvidence(){const n=d.diagnosticNav,l=d.cowYard.layout,boxes=geometry(),toObstacle=b=>({x:(b[0]+b[3])/2,z:(b[2]+b[5])/2,hw:(b[3]-b[0])/2,hd:(b[5]-b[2])/2,c:1,s:0}),leaves=[40,41].map(i=>toObstacle(boxes[i])),from=new T.Vector2(l.robot.exit[0],l.robot.exit[2]),to=new T.Vector2(l.robot.turn[0],l.robot.turn[2]);
  const probes=[{name:'open-leaf-middle',p:new T.Vector2(leaves[0].x,(boxes[40][2]+boxes[40][5])/2)},{name:'bed-divider-middle',p:new T.Vector2((boxes[18][0]+boxes[18][3])/2,(boxes[18][2]+boxes[18][5])/2)}];
  return{custom:l.custom,polygon:l.polygon,robot:l.robot,boxes,gateRotation:[d.cowYard.robot.entryGate.rotation.y,d.cowYard.robot.exitGate.rotation.y],blocks:structuredClone(d.BLOCKS),obstacles:structuredClone(n.obstacles),probes:probes.map(p=>({name:p.name,point:p.p.toArray(),registered:n.obstacles.map((o,i)=>({o,i})).filter(({o})=>n.insideObst(o,p.p,0))})),originalExitTurnRoute:n.route(from,to,.42,n.pen).map(vec),withGateExitTurnRoute:n.route(from,to,.42,n.pen,leaves).map(vec),originalSegmentBlock:n.hitsBlock(from,to,.42,null),addedLeafSegmentBlock:n.hitsBlock(from,to,.42,null,[...n.obstacles,...leaves]),limited:'Read-only point-planner comparison; not swept skin feasibility. Existing start/goal exemptions retained, never proposed as safety proof.'};
 }
 return window.__liveExit={measure,snapshot,navEvidence,get firstHit(){return firstHit;},get done(){return finished;},
  stepChunk(count=30){for(let n=0;n<count&&!finished;n++){
   const before=snapshot(),t=d.clock()+dt;window.__liveNow+=dt*1000;d.setClock(t);G.settleCows(true);d.syncCowYard();for(const c of cows)c.update(dt,t);const job=d.cowStatus.job;d.cowYard.setRobotPose(job?.stage==='milking'?(Date.now()-job.startedAt)/12000:0);d.cowYard.group.updateMatrixWorld(true);for(const c of cows)c.g.updateMatrixWorld(true);
   measure.fullFrames++;const fullBoxes=geometry(),fullQuery=cowDiscreteQuery(a.rig3d,fullCache,fullBoxes),gateQuery=cowDiscreteQuery(a.rig3d,fullCache,fullBoxes.slice(38,42));
   if(fullQuery.hit)measure.fullHits.push({frame:measure.fullFrames,phase:measure.phase,job:job?.stage,stage:a.cowTask?.stage,root:a.g.position.toArray(),hit:fullQuery.hit,box:fullBoxes[fullQuery.hit.primitive]});
   if(gateQuery.hit)measure.gateHits.push({frame:measure.fullFrames,job:job?.stage,root:a.g.position.toArray(),hit:gateQuery.hit});
   const physical=attachmentQueries(a.rig3d,fullCache,nonTeat,fullBoxes),pose=d.cowYard.robot.arm.position.toArray();for(const [key,hit]of [['solidHits',physical.solid],['nonTeatCupHits',physical.cup]])if(hit)measure[key].push({frame:measure.fullFrames,job:job?.stage,stage:a.cowTask?.stage,pose,hit,box:fullBoxes[hit.primitive]});
   if(job?.stage==='milking'&&Math.abs(pose[0]+2.3)<1e-12&&Math.abs(pose[1]-.35)<1e-12&&Math.abs(pose[2]+11.0072222222)<1e-12){const contacts=cupContact(a.rig3d,d.cowYard);measure.contactFrames++;measure.maxContactError=Math.max(measure.maxContactError,...contacts.map(c=>c.horizontal));if(contacts.some(c=>!c.valid))measure.contactFailures.push({frame:measure.fullFrames,contacts});}
   if(measure.phase==='setup'){
    measure.setupFrames++;if(a.cowTask?.stage==='exit'&&job?.stage==='exiting'){measure.phase='exit';measure.exitStart=snapshot();measure.geometry=navEvidence();cache=cacheCowTriangles(a.rig3d);}
    else if(measure.setupFrames>=60*hz){measure.errors.push('Original60s setup deadline');finished=true;}
   }else{
    measure.exitFrames++;const current=snapshot(),speed=Math.hypot(current.root[0]-before.root[0],current.root[2]-before.root[2])/dt;measure.maxTargetSpeed=Math.max(measure.maxTargetSpeed,speed);measure.maxRootSupportError=Math.max(measure.maxRootSupportError,Math.abs(current.root[1]-d.cowYard.layout.floor));
    for(let i=0;i<cows.length;i++)for(let j=0;j<i;j++)measure.minSeparation=Math.min(measure.minSeparation,cows[i].g.position.distanceTo(cows[j].g.position));
    const boxes=geometry(),q=cowDiscreteQuery(a.rig3d,cache,boxes),pathKey=JSON.stringify(current.task?.path);const row={frame:measure.exitFrames,...current,speed,pathChanged:pathKey!==priorPath};priorPath=pathKey;measure.frames.push(row);
    if(q.hit){const hit={...row,hit:q.hit,box:boxes[q.hit.primitive]};measure.hits.push(hit);if(!firstHit){firstHit=hit;measure.firstHitGeometry=navEvidence();d.cam.target.set(a.g.position.x,1,a.g.position.z);d.cam.dist=8;d.cam.pitch=.62;d.cam.yaw=-.8;d.placeCamera(1);d.renderScene();return{phase:measure.phase,setup:measure.setupFrames,exit:measure.exitFrames,firstHit:true};}}
    if(!job&&!a.cowTask){measure.completed=true;measure.end=current;finished=true;}
    else if(measure.exitFrames>=60*hz){measure.errors.push('Original60s exit deadline');measure.end=current;finished=true;}
   }
  }return{phase:measure.phase,setup:measure.setupFrames,exit:measure.exitFrames,done:finished,hits:measure.hits.length,job:d.cowStatus.job?.stage,task:a.cowTask?.stage};}
 };
}
