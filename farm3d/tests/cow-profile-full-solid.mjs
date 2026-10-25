// Full displayed-pose counterpart to the earlier lower-leg experiment.
// Does not authorize a temporal-clearance result or a gameplay integration.
import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';import {getAnimalCarePose} from '../animal-care-poses.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';import {cacheCowTriangles,cowDiscreteQuery} from './helpers/cow-cached-solid-query.mjs';
const file=new URL('./evidence/pen-editing-implementation/task8-codex-cow-restricted-provider-20261025/full-solid-profile-final.json',import.meta.url);if(fs.existsSync(file))throw Error('Preserve evidence');
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),volumes=yard.componentVolumes(),centers=new Map(yard.targets.filter(t=>['feed','water'].includes(t.kind)).map(t=>[t.kind,new T.Box3().setFromObject(t.object).getCenter(new T.Vector3())])),cases=[];let cache;
for(const hz of [30,60,120])for(const s of yard.stations.filter(s=>['feed','drink'].includes(s.kind))){const start=performance.now(),r=createCow3D(1.7,s.approach[0],s.approach[2],0),dt=1/hz,care=getAnimalCarePose('cow',r),boxes=volumes[s.kind==='feed'?'feedBunk':'trough'].slice(0,s.kind==='feed'?3:5),target=new T.Vector3(s.kind==='feed'?s.dock[0]:centers.get('water').x,s.surface,s.kind==='feed'?centers.get('feed').z:s.dock[2]);r.g.position.y=s.approach[1];r.model.rotation.y=Math.atan2(s.approach[0]-s.dock[0],s.approach[2]-s.dock[2]);for(const l of r.legs)l.planted=false;cache??=cacheCowTriangles(r);
 let stage='approach',wait=0,weight=0,firstHit=null,completed=false,frame=0,approachFrames=null,contactFrames=0,maxContact=0,maxSpeed=0,checks=0;
 for(frame=1;frame<=60*hz;frame++){care.reset();const dx=s.dock[0]-r.g.position.x,dz=s.dock[2]-r.g.position.z,d=Math.hypot(dx,dz);let speed=0;
  if(stage==='approach'){if(d<=.4){stage='settle';wait=1;}else speed=.8;}else if(stage==='settle'){wait-=dt;if(wait<=0)stage='creep';}
  if(stage==='creep')speed=.01;
  const step=Math.min(d,speed*dt,stage==='approach'?Math.max(0,d-.4):Infinity),sx=dx/(d||1)*step,sz=dz/(d||1)*step,consumed=stage==='approach'&&step===Math.max(0,d-.4);
  r.g.position.x+=sx;r.g.position.z+=sz;maxSpeed=Math.max(maxSpeed,Math.hypot(sx,sz)/dt);
  if(stage==='hold'){weight=Math.min(1,weight+dt/1.1);wait-=dt;if(wait<=0)stage='stand';}else if(stage==='stand'){weight=Math.max(0,weight-dt/.9);if(weight===0)completed=true;}
  updateCow3D(r,sx,sz,dt,frame*dt,step?'moving':stage==='hold'||stage==='stand'?'eating':'idle');if(weight>0)care.apply({mode:s.kind,weight,target});r.g.updateMatrixWorld(true);
  const query=cowDiscreteQuery(r,cache,boxes);checks++;if(query.hit){firstHit={frame,stage,weight,root:r.g.position.toArray(),...query.hit};break;}
  if(weight===1){const distance=r.jaw.localToWorld(new T.Vector3(0,-.05,-.33)).distanceTo(target);maxContact=Math.max(maxContact,distance);assert(distance<=.08,'unchanged full-weight mouth limit');contactFrames++;}
  if(consumed){stage='settle';wait=1;}
  if(stage==='creep'&&Math.hypot(r.g.position.x-s.dock[0],r.g.position.z-s.dock[2])<=1e-8){approachFrames=frame;assert(frame/hz<=50);stage='hold';wait=s.kind==='feed'?8:6;}
  if(completed)break;
 }
 const result={station:s.id,hz,completed,firstHit,frames:Math.min(frame,60*hz),approachFrames,contactFrames,maxContact,maxSpeed,checks,wallMs:performance.now()-start};cases.push(result);console.log(JSON.stringify(result));fs.writeFileSync(file,JSON.stringify({source:'42dc5c5',status:cases.every(c=>c.completed&&!c.firstHit&&c.contactFrames>0)?'DISPLAYED_FULL_SKIN_PROFILE_PASS_NOT_CONTINUOUS':'DISPLAYED_PROFILE_RED',cases,limits:'Seed0 synthetic aligned fixture, flat slab, no other animals/task reservations/live route controller. All full-skin triangles checked each displayed frame against solid walls/bases. Food(grain primitive3)/water(primitive5) are contact media, retained separately in endpoint diagnostic. Original500s deadline untouched; additional50s approach/60s total diagnostic caps. No between-frame or herd qualification.'},null,2));care.reset();r.dispose();if(firstHit||!completed)throw Error('Retained profile RED; investigate before another run');assert(contactFrames>0);assert(maxSpeed<=.8+1e-12);
}
yard.dispose();
