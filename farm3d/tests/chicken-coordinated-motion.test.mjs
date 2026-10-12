import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
import {measureChickenTurns} from './chicken-turn-matrix.mjs';

test('coordinated chicken meets every original 96-cell turn gate',()=>{
 const result=measureChickenTurns();assert.equal(result.cases,96);assert.deepEqual(result.failures,[]);
});
import {roamChicken} from './chicken-motion-probes.mjs';
test('seeded chicken changes, stops and reversals preserve physical contacts at 30/60/120 Hz',()=>{
 for(const h of [.35,.72])for(const hz of [30,60,120])for(const seed of [7,33,101])roamChicken(seed,h,hz);
});

test('restart during partial settling retains first-frame continuity',()=>{
 for(const height of [.35,.72])for(const hz of [30,60,120])for(const run of [false,true])for(const idleFrames of [1,2,4]){
  const r=createChicken3D(height),dt=1/hz,v=height===.72?(run?2.4:.8):height*(run?1.4:.65),dz=-v*dt;
  try{
   for(let n=0;n<Math.round(hz*.7);n++){r.g.position.z+=dz;updateChicken3D(r,0,dz,dt,run?'run':'walk');}
   for(let n=0;n<idleFrames;n++)updateChicken3D(r,0,0,dt,'idle');
   r.g.updateMatrixWorld(true);const before=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
   r.g.position.z+=dz;updateChicken3D(r,0,dz,dt,run?'run':'walk');r.g.updateMatrixWorld(true);
   for(let i=0;i<2;i++)assert.ok(r.legs[i].foot.getWorldPosition(new T.Vector3()).distanceTo(before[i])<=v*dt+1e-9,`partial restart h${height} hz${hz} run${run} idleFrames${idleFrames}`);
  }finally{r.dispose();}
 }
});

test('chicken geometry, skinning and factory rest transforms preserve frozen main',async()=>{
 const {createHash}=await import('node:crypto'),{readFileSync}=await import('node:fs');
 const frozen=JSON.parse(readFileSync(new URL('./baselines/chicken-motion-protected.json',import.meta.url))),r=createChicken3D(frozen.height);
 try{
  for(const [name,hash] of Object.entries(frozen.attributes)){
   const a=r.card.geometry.attributes[name];assert.equal(createHash('sha256').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength)).digest('hex'),hash,name);
  }
  assert.equal(r.card.skeleton.bones.length,frozen.bones.length);
  for(let i=0;i<frozen.bones.length;i++){
   const b=r.card.skeleton.bones[i],f=frozen.bones[i];assert.equal(b.name,f.name);
   for(const [actual,expected] of [[b.position.toArray(),f.position],[b.quaternion.toArray(),f.quaternion]])for(let j=0;j<actual.length;j++)assert.ok(Math.abs(actual[j]-expected[j])<1e-12,'rest transform '+b.name);
  }
 }finally{r.dispose();}
});
