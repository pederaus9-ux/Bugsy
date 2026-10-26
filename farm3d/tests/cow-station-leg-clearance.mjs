// Bounded diagnostic, not an executable care-route qualification. Compare
// forward gait, a stop from the last sampled clear frame, and static dock.
import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';import {createCow3D,updateCow3D} from '../cow3d.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';
import {copyCowRig} from './helpers/cow-pose-preview.mjs';
const path=new URL('./evidence/pen-editing-implementation/task8-codex-cow-shadow-bounds-20261025/station-leg-comparison.json',import.meta.url);if(fs.existsSync(path))throw Error('Preserve evidence');
const box=new T.Box3(new T.Vector3(-1,-1,-1),new T.Vector3(1,1,1));
assert(box.intersectsTriangle(new T.Triangle(new T.Vector3(-2,0,0),new T.Vector3(2,0,0),new T.Vector3(0,2,0))),'edge-only crossing must be detected');
assert(!box.intersectsTriangle(new T.Triangle(new T.Vector3(2,0,0),new T.Vector3(3,0,0),new T.Vector3(2,1,0))),'separated control');
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),volumes=yard.componentVolumes(),cases=[];
const v=new T.Vector3(),tri=new T.Triangle();
function observer(r,owner){const joints=new Set(r.legs.flatMap(l=>[l.knee,l.foot]).map(b=>r.card.skeleton.bones.indexOf(b))),idx=r.card.geometry.attributes.skinIndex.array,weights=r.card.geometry.attributes.skinWeight.array,ids=[];
 for(let i=0;i<idx.length/4;i+=3)if([i,i+1,i+2].some(j=>[0,1,2,3].some(k=>weights[j*4+k]>0&&joints.has(idx[j*4+k]))))ids.push(i);
 const solids=volumes[owner].map(b=>new T.Box3(new T.Vector3(...b.slice(0,3)),new T.Vector3(...b.slice(3))));
 return ()=>{r.g.updateMatrixWorld(true);for(const i of ids){for(let j=0;j<3;j++){r.card.getVertexPosition(i+j,v).applyMatrix4(r.card.matrixWorld);[tri.a,tri.b,tri.c][j].copy(v);}for(let j=0;j<solids.length;j++)if(solids[j].intersectsTriangle(tri))return{triangle:i/3,primitive:j,vertices:[tri.a.toArray(),tri.b.toArray(),tri.c.toArray()],box:volumes[owner][j]};}return null;};
}
function start(s){const r=createCow3D(1.7,s.approach[0],s.approach[2],0);r.g.position.y=s.approach[1];r.model.rotation.y=Math.atan2(s.approach[0]-s.dock[0],s.approach[2]-s.dock[2]);for(const l of r.legs)l.planted=false;return r;}
for(const hz of[30,60,120])for(const s of yard.stations.filter(s=>['feed','drink'].includes(s.kind))){
 const wall=performance.now(),r=start(s),hit=observer(r,s.kind==='feed'?'feedBunk':'trough'),dt=1/hz;let first=null,lastClear=null;
 assert.equal(hit(),null,'initial approach must be clear');
 for(let frame=1;frame<=5*hz;frame++){
  lastClear?.dispose();lastClear=copyCowRig(r);const dx=s.dock[0]-r.g.position.x,dz=s.dock[2]-r.g.position.z,d=Math.hypot(dx,dz),step=Math.min(.8*dt,d),sx=dx/(d||1)*step,sz=dz/(d||1)*step;r.g.position.x+=sx;r.g.position.z+=sz;updateCow3D(r,sx,sz,dt,frame*dt,'moving');const h=hit();
  if(h){first={frame,time:frame/hz,root:r.g.position.toArray(),...h};break;}if(d<=step)break;
 }
 assert(first,'original forward leg/solid witness must remain');
 const stop=lastClear,stopHit=observer(stop,s.kind==='feed'?'feedBunk':'trough'),stopRoot=stop.g.position.toArray();let stopFirst=null,clearFrom=null;
 for(let frame=1;frame<=hz;frame++){updateCow3D(stop,0,0,dt,frame*dt,'idle');const h=stopHit();if(h){stopFirst??={frame,time:frame/hz,...h};clearFrom=null;}else clearFrom??=frame/hz;}
 const dock=start(s);dock.g.position.fromArray(s.dock);updateCow3D(dock,0,0,dt,0,'idle');const dockHit=observer(dock,s.kind==='feed'?'feedBunk':'trough')();
 const result={station:s.id,hz,firstForward:first,stopRoot,stopFirst,clearFromThroughOneSecond:clearFrom,staticDockHit:dockHit,wallMs:performance.now()-wall};cases.push(result);console.log(JSON.stringify({station:s.id,hz,firstForwardFrame:first.frame,stoppingStillHits:!!stopFirst,staticDockHits:!!dockHit,wallMs:result.wallMs}));
 fs.writeFileSync(path,JSON.stringify({status:'DIAGNOSTIC_NOT_CONTINUOUS_CLEARANCE',source:'b096b29',cases,limitations:'Actual unchanged rig and triangle/box SAT at displayed sample frames; aligned seed0, no care overlay/full controller. A stop that intersects is not a permitted remedy. Static dock test is geometric feasibility only, never teleport acceptance. No between-frame guarantee or geometry-redesign conclusion.'},null,2));r.dispose();stop.dispose();dock.dispose();
}
yard.dispose();
