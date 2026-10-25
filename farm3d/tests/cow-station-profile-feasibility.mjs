// Test-only alternative, not a runtime correction or continuous certificate.
// Retain the actual rig; test settle + slow straight arrival with finite work.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';
const drinksOnly=process.env.COW_PROFILE_CASE==='drink';if(process.env.COW_PROFILE_CASE&&!drinksOnly)throw Error('Unsupported case selector');
const file=new URL('./evidence/pen-editing-implementation/task8-codex-cow-continuous-feasibility-20261025/'+(drinksOnly?'station-profile-drink-corrected.json':'station-profile.json'),import.meta.url);if(fs.existsSync(file))throw Error('Preserve evidence');
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),volumes=yard.componentVolumes(),cases=[],v=new T.Vector3(),tri=new T.Triangle();
function observer(r,owner){const joints=new Set(r.legs.flatMap(l=>[l.knee,l.foot]).map(b=>r.card.skeleton.bones.indexOf(b))),idx=r.card.geometry.attributes.skinIndex.array,w=r.card.geometry.attributes.skinWeight.array,ids=[];
 for(let i=0;i<idx.length/4;i+=3)if([i,i+1,i+2].some(j=>[0,1,2,3].some(k=>w[j*4+k]>0&&joints.has(idx[j*4+k]))))ids.push(i);
 const solids=volumes[owner].map(b=>new T.Box3(new T.Vector3(...b.slice(0,3)),new T.Vector3(...b.slice(3))));return()=>{r.g.updateMatrixWorld(true);for(const i of ids){for(let j=0;j<3;j++){r.card.getVertexPosition(i+j,v).applyMatrix4(r.card.matrixWorld);[tri.a,tri.b,tri.c][j].copy(v);}for(let j=0;j<solids.length;j++)if(solids[j].intersectsTriangle(tri))return{triangle:i/3,primitive:j,vertices:[tri.a.toArray(),tri.b.toArray(),tri.c.toArray()],box:volumes[owner][j]};}return null;};
}
for(const hz of[30,60,120])for(const s of yard.stations.filter(s=>drinksOnly?s.kind==='drink':['feed','drink'].includes(s.kind))){const start=performance.now(),r=createCow3D(1.7,s.approach[0],s.approach[2],0),dt=1/hz,hit=observer(r,s.kind==='feed'?'feedBunk':'trough');r.g.position.y=s.approach[1];r.model.rotation.y=Math.atan2(s.approach[0]-s.dock[0],s.approach[2]-s.dock[2]);for(const l of r.legs)l.planted=false;
 let stage='approach',wait=0,firstHit=null,frame=0,processedFrames=0,maxSpeed=0,maxAmountDuringCreep=0,completed=false;
 // Existing 500s care ceiling remains an assertion. The diagnostic additionally
 // stops after 50s of simulated work and reports incomplete, never passes it.
 for(frame=1;frame<=50*hz;frame++){processedFrames=frame;const dx=s.dock[0]-r.g.position.x,dz=s.dock[2]-r.g.position.z,d=Math.hypot(dx,dz);let speed=0;
  if(stage==='approach'){if(d<=.4){stage='settle';wait=1;}else speed=.8;}
  else if(stage==='settle'){wait-=dt;if(wait<=0)stage='creep';}
  if(stage==='creep')speed=.01;
  const step=Math.min(d,speed*dt,stage==='approach'?Math.max(0,d-.4):Infinity),sx=dx/(d||1)*step,sz=dz/(d||1)*step;
  const approachConsumed=stage==='approach'&&step===Math.max(0,d-.4);
  r.g.position.x+=sx;r.g.position.z+=sz;updateCow3D(r,sx,sz,dt,frame*dt,step?'moving':'idle');maxSpeed=Math.max(maxSpeed,Math.hypot(sx,sz)/dt);if(stage==='creep')maxAmountDuringCreep=Math.max(maxAmountDuringCreep,r.state.amount);
  const collision=hit();if(collision){firstHit={frame,stage,root:r.g.position.toArray(),...collision};break;}
  if(approachConsumed){stage='settle';wait=1;}
  if(stage==='creep'&&Math.hypot(r.g.position.x-s.dock[0],r.g.position.z-s.dock[2])<=1e-8){completed=true;break;}
 }
 const result={station:s.id,hz,completed,simulatedSeconds:processedFrames/hz,firstHit,maxSpeed,maxAmountDuringCreep,finalStage:stage,finalRoot:r.g.position.toArray(),wallMs:performance.now()-start};cases.push(result);console.log(JSON.stringify(result));fs.writeFileSync(file,JSON.stringify({source:'3be40d3',status:cases.every(c=>c.completed&&!c.firstHit)?'DISPLAYED_LEG_APPROACH_PASS_NOT_CONTINUOUS_OR_CARE_QUALIFICATION':'PROFILE_FEASIBILITY_RED',cases,parameters:{stopDistance:.4,settleSeconds:1,creepSpeed:.01,diagnosticMaxSeconds:50,originalCareDeadlineSeconds:500},limits:'Seed0 aligned rig, legs versus destination fixture only, no care pose/other cows/controller/reservations/support transition. No runtime change or motion-contract proof; the stop/speed parameters are experimental, not accepted production constants.'},null,2));
 assert(maxSpeed<=.8+1e-12);assert(processedFrames/hz<=500);r.dispose();if(firstHit||!completed)break;
}
yard.dispose();
