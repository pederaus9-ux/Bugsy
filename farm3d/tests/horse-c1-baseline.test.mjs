import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D} from '../horse3d.js';

function triangles(g){return g.index?g.index.count/3:g.attributes.position.count/3;}
function snap(r){return {phase:r.state.phase,amount:r.state.amount,time:r.state.time,yaw:r.model.rotation.y,legs:r.legs.map(l=>[l.hip.rotation.x,l.hip.rotation.y,l.knee.rotation.x,l.planted])};}
function run(hz=60,seconds=12){
  const r=createHorse3D(),dt=1/hz;
  for(let i=0;i<hz*seconds;i++){
    const t=i*dt, speed=t<2?0:t<6?.8:t<9?1.6:0;
    const mode=t<2||t>=9?'idle':t<6?'walk':'run';
    const yaw=t<7?0:.18, dx=Math.sin(yaw)*speed*dt, dz=-Math.cos(yaw)*speed*dt;
    r.g.position.x+=dx;r.g.position.z+=dz;updateHorse3D(r,dx,dz,dt,mode);r.g.updateMatrixWorld(true);
    for(const v of [r.state.phase,r.state.amount,r.model.rotation.y,...r.legs.flatMap(l=>[l.hip.rotation.x,l.hip.rotation.y,l.knee.rotation.x])])assert.ok(Number.isFinite(v));
  }
  const out=snap(r);r.dispose();return out;
}

test('C1 freezes production horse topology and render structure',()=>{
  const r=createHorse3D();
  const meshes=[];r.g.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
  const tri=triangles(r.card.geometry),bones=r.card.skeleton.bones.length;
  console.log(JSON.stringify({horseC1:{triangles:tri,bones,skinnedMeshes:meshes.length,height:r.spec.height}}));
  assert.equal(meshes.length,1);
  assert.equal(bones,24); // Owner-requested six-bone tail adds three bones.
  assert.equal(r.tail.length,6);
  assert.ok(tri>1000&&tri<12000);
  r.dispose();
});

test('C1 horse instances share render resources but own skeleton state',()=>{
  const herd=Array.from({length:8},(_,i)=>createHorse3D(1.6,i,0));
  const geo=herd[0].card.geometry,mat=herd[0].card.material;
  for(let i=0;i<herd.length;i++){assert.equal(herd[i].card.geometry,geo);assert.equal(herd[i].card.material,mat);if(i)assert.notEqual(herd[i].card.skeleton,herd[0].card.skeleton);}
  herd.forEach(r=>r.dispose());
});

test('C1 horse runtime is repeatable at the same frame rate and remains finite',()=>{
  assert.deepEqual(run(60),run(60));
  for(const hz of [30,60,120])run(hz);
});
