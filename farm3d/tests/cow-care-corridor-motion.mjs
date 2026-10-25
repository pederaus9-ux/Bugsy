// Bounded feasibility, not a full-herd acceptance replacement. Actual rig walk
// and dock alignment at authored sites, recording positive solid penetration.
import fs from 'node:fs';import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';
const y=createCowYard({layout:resolveAnimalPens().sites.cow}),solids=Object.entries(y.componentVolumes()).flatMap(([owner,boxes])=>boxes.flatMap((box,i)=>owner==='shelter'&&[0,1,15,16,17,18,19].includes(i)?[]:[{owner,primitive:i,box}])),v=new T.Vector3(),cases=[];
const file=new URL('./evidence/pen-editing-implementation/task8-codex-cow-motion-contract-20261025/corridor-motion.json',import.meta.url);if(fs.existsSync(file))throw Error('Preserve evidence');
function witness(r){r.g.updateMatrixWorld(true);r.card.skeleton.update();const bounds=r.card.boundingBox.clone().applyMatrix4(r.card.matrixWorld),near=solids.filter(s=>bounds.intersectsBox(new T.Box3(new T.Vector3(...s.box.slice(0,3)),new T.Vector3(...s.box.slice(3)))));for(let i=0;i<r.card.geometry.attributes.position.count;i++){r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);for(const s of near){const b=s.box;if(v.x>b[0]&&v.y>b[1]&&v.z>b[2]&&v.x<b[3]&&v.y<b[4]&&v.z<b[5])return{...s,vertex:i,point:v.toArray()};}}return null;}
for(const hz of [30,60,120])for(const station of y.stations){
 const start=performance.now(),dt=1/hz,r=createCow3D(1.7,station.approach[0],station.approach[2],0);r.g.position.y=station.approach[1];r.model.rotation.y=Math.atan2(station.approach[0]-station.dock[0],station.approach[2]-station.dock[2]);for(const leg of r.legs)leg.planted=false;
 let frame=0,hit=null,stage='approach';
 while(frame<5*hz){frame++;const dx=station.dock[0]-r.g.position.x,dz=station.dock[2]-r.g.position.z,d=Math.hypot(dx,dz),step=Math.min(.8*dt,d);let sx=0,sz=0;
  if(d>1e-12){sx=dx/d*step;sz=dz/d*step;r.g.position.x+=sx;r.g.position.z+=sz;}else{stage='align';const angle=station.facing+Math.PI-r.model.rotation.y;r.model.rotation.y+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*5);}
  updateCow3D(r,sx,sz,dt,frame*dt,'moving');hit=witness(r);if(hit)break;
  if(stage==='align'&&Math.abs(Math.atan2(Math.sin(station.facing+Math.PI-r.model.rotation.y),Math.cos(station.facing+Math.PI-r.model.rotation.y)))<.08)break;
 }
 const result={station:station.id,hz,frames:frame,simulatedSeconds:frame/hz,stage,root:r.g.position.toArray(),yaw:r.model.rotation.y,hit,wallMs:performance.now()-start};cases.push(result);console.log(JSON.stringify({station:station.id,hz,frames:frame,hit:hit?{owner:hit.owner,primitive:hit.primitive}:null,wallMs:result.wallMs}));r.dispose();fs.writeFileSync(file,JSON.stringify({status:cases.some(c=>c.hit)?'POSITIVE_COLLISION_WITNESS':'NO_VERTEX_WITNESS_NOT_A_SAFETY_PROOF',runtime:'7017109',cases,limitations:'Synthetic aligned start, seed0 rig, no care pose or other animals; finite straight approach plus align. Primitive AABBs may overbound curved/tilted geometry. Positive witness requires primitive classification; zero vertices is not clearance proof.'},null,2));
}
y.dispose();
