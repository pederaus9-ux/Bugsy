import * as T from '../../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../../cow3d.js';
import {createCowYard} from '../../cow-yard.js';
import {resolveAnimalPens} from '../../animal-pen-layout.js';
import {pointInPolygon} from '../../animal-pen-geometry.js';
import {createStationScheduler} from '../../animal-stations.js';
import {copyCowRig} from './cow-pose-preview.mjs';
import {cacheCowCompound,cowSweptQuery} from './cow-hierarchical-sweep.mjs';

export function installMovingFixture(d,mode){
 const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),v=yard.componentVolumes();
 const boxes=[...v.shelter.slice(2,15),...v.shelter.slice(20),...v.feedBunk.slice(0,3),...v.trough.slice(0,5),...v.robot];
 const rootObstacles=v.shelter.slice(2,10).map(b=>[(b[0]+b[3])/2,(b[2]+b[5])/2,(b[3]-b[0])/2,(b[5]-b[2])/2]);
 const scheduler=createStationScheduler(yard.stations),ids=['cow-feed-1','cow-feed-2','cow-drink','cow-robot','cow-bed-5'];
 const records=ids.map((id,i)=>{
  const s=yard.stations.find(s=>s.id===id),token=scheduler.request('cow-'+(i+1),s.kind,s.id);
  if(!token)throw Error('Reservation failed');
  const r=createCow3D(1.7,s.approach[0],s.approach[2],i);r.g.position.y=s.approach[1];
  r.model.rotation.y=Math.atan2(s.approach[0]-s.dock[0],s.approach[2]-s.dock[2]);
  r.g.updateMatrixWorld(true);return{r,s,token,start:[...s.approach],evaluatedRt:r.legs.map(l=>l.rt),displayed:copyCowRig(r),distance:0};
 });
 if(scheduler.request('duplicate-control','feed','cow-feed-1')!==null)throw Error('Occupied station accepted twice');
 const reservations=scheduler.snapshot(),reservationKey=JSON.stringify(reservations);
 for(const a of d.animals.filter(a=>a.kind==='cow')){a.g.visible=false;a.update=()=>{};}
 for(const c of records)d.scene.add(c.r.g);
 const measure={mode,reservations,solids:boxes.length,rootObstacles:rootObstacles.length,frames:[],warmup:[],errors:[],rejections:[],firstRejected:{},eventCounts:{},movingCowFrames:0,recoveryCowFrames:0,releaseEvents:0,plantEvents:0,maxSpeed:0,minSeparation:Infinity,maxRootHeightError:0,cacheBuildMs:0,queryCalls:0,clearQueries:0};
 let cache=null;if(mode==='reference'){const begin=performance.now();cache=cacheCowCompound(records[0].r);measure.cacheBuildMs=performance.now()-begin;}
 let frame=0,start=0,last=null,gpu=null;const dt=1/30,gl=d.renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
 const probe=window.__movingProbe={done:false,paused:true,measure,
  beginFrame(){if(!this.paused&&!this.done)start=performance.now();},
  step(){if(this.done||this.paused)return;const begin=performance.now();frame++;const f=frame-30,stage=f<=0?'warmup':f<=60?'approach':f<=120?'stop-recovery':'return-turn';this.stage=stage;
   try{for(const c of records){
    d.scene.remove(c.r.g);let dx=0,dz=0;
    if(stage==='approach'||stage==='return-turn'){
     const target=stage==='approach'?c.s.dock:c.start,x=target[0]-c.r.g.position.x,z=target[2]-c.r.g.position.z,distance=Math.hypot(x,z),step=Math.min(.8*dt,Math.max(0,distance-(stage==='approach'?.4:0)));
     dx=x/(distance||1)*step;dz=z/(distance||1)*step;
    }
    const q={dx,dz,dt,act:dx||dz?'moving':'idle',evaluatedRt:c.evaluatedRt,support:{kind:'plane',heights:[.08]}};
    if(mode==='reference'){
     const result=cowSweptQuery(c.r,cache,q,boxes,{rootObstacles,displayedStart:c.displayed});measure.queryCalls++;
     for(const event of result.events||[])measure.eventCounts[event]=(measure.eventCounts[event]||0)+1;
     if(result.clear)measure.clearQueries++;else{measure.rejections.push({frame,stage,station:c.s.id,reason:result.reason||result.hit?.kind||'uncertain',visited:result.visited,domains:result.domains});measure.firstRejected[c.s.id]??={frame,stage,request:q,root:c.r.g.position.toArray(),yaw:c.r.model.rotation.y,result};}
    }
    const before=c.r.legs.map(l=>({planted:l.planted,rt:l.rt}));c.r.g.position.x+=dx;c.r.g.position.z+=dz;
    updateCow3D(c.r,dx,dz,dt,frame*dt,q.act);c.evaluatedRt=c.r.legs.map((l,i)=>before[i].planted&&!l.planted?0:before[i].rt);c.r.g.updateMatrixWorld(true);
    if(dx||dz)measure.movingCowFrames++;if(c.r.legs.some(l=>!l.planted&&l.rt<1))measure.recoveryCowFrames++;
    c.r.legs.forEach((l,i)=>{if(before[i].planted&&!l.planted)measure.releaseEvents++;if(!before[i].planted&&l.planted)measure.plantEvents++;});
    const speed=Math.hypot(dx,dz)/dt;measure.maxSpeed=Math.max(measure.maxSpeed,speed);c.distance+=Math.hypot(dx,dz);
    if(speed>.8+1e-12)throw Error('Original speed limit');if(!pointInPolygon([c.r.g.position.x,c.r.g.position.z],yard.layout.polygon))throw Error('Containment');
    measure.maxRootHeightError=Math.max(measure.maxRootHeightError,Math.abs(c.r.g.position.y-.08));if(c.r.g.position.y!==.08)throw Error('Unsupported root');
    c.displayed.dispose();c.displayed=copyCowRig(c.r);d.scene.add(c.r.g);
   }
   for(let i=0;i<5;i++)for(let j=0;j<i;j++){const dist=records[i].r.g.position.distanceTo(records[j].r.g.position);measure.minSeparation=Math.min(measure.minSeparation,dist);if(dist<.85)throw Error('Original separation limit');}
   if(JSON.stringify(scheduler.snapshot())!==reservationKey)throw Error('Reservation changed');
   }catch(e){measure.errors.push(String(e.stack||e));this.done=true;}
   this.queryMs=performance.now()-begin;
  },
  gpuBegin(){if(this.paused||this.done||!ext)return;if(gpu&&gl.getQueryParameter(gpu,gl.QUERY_RESULT_AVAILABLE)){if(!gl.getParameter(ext.GPU_DISJOINT_EXT))this.gpuMs=gl.getQueryParameter(gpu,gl.QUERY_RESULT)/1e6;gl.deleteQuery(gpu);gpu=null;}if(!gpu){gpu=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,gpu);this.gpuActive=true;}},
  gpuEnd(){if(this.gpuActive){gl.endQuery(ext.TIME_ELAPSED_EXT);this.gpuActive=false;}},
  endFrame(){if(this.done||this.paused)return;const now=performance.now(),sample={frame,stage:this.stage,cpu:now-start,interval:last===null?null:now-last,query:this.queryMs,gpu:this.gpuMs??null,heap:performance.memory?.usedJSHeapSize??null};last=now;(frame<=30?measure.warmup:measure.frames).push(sample);if(frame%60===0)console.log('MOVING_PROGRESS '+JSON.stringify({mode,frame,stage:this.stage,rejections:measure.rejections.length}));if(frame>=210){this.done=true;measure.distances=records.map(c=>({id:c.token.animalId,station:c.s.id,metres:c.distance,root:c.r.g.position.toArray()}));}},
  resume(){this.paused=false;},
  dispose(){for(const c of records){d.scene.remove(c.r.g);c.displayed.dispose();c.r.dispose();}yard.dispose();}
 };
 return{mode,animals:d.animals.length,scriptedNativeCows:5,ordinaryControllers:41,reservations,quality:d.QUALITY,renderer:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)};
}
