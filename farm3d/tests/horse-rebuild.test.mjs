import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';
import {createQuadruped,DOG,CAT} from '../quadruped3d.js';

const triangles=g=>g.index?g.index.count/3:g.attributes.position.count/3;

test('ground-up horse is dedicated, finite, and keeps integration contracts',()=>{
  const r=createHorse3D();
  assert.equal(r.spec,HORSE);assert.equal(r.g.children.length,1);assert.equal(r.card.skeleton.bones.length,24);
  assert.ok(triangles(r.card.geometry)>1000&&triangles(r.card.geometry)<12000);
  r.card.geometry.computeBoundingBox();const s=new THREE.Vector3();r.card.geometry.boundingBox.getSize(s);
  assert.ok([s.x,s.y,s.z].every(Number.isFinite));assert.ok(s.z>s.x*1.5);
  r.dispose();
});

test('ground-up horse no longer depends on generic quadruped implementation',async()=>{
  const src=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../horse3d.js',import.meta.url),'utf8'));
  assert.doesNotMatch(src,/from ['"]\.\/quadruped3d\.js['"]/);
  assert.doesNotMatch(src,/createQuadruped|updateQuadruped/);
});

test('dog and cat remain on their unchanged generic production path',()=>{
  const dog=createQuadruped(DOG,.55),cat=createQuadruped(CAT,.4);
  assert.equal(dog.spec,DOG);assert.equal(cat.spec,CAT);dog.dispose();cat.dispose();
});

test('horse gait state distinguishes idle walk trot and canter without non-finite joints',()=>{
  const r=createHorse3D(),dt=1/60;
  updateHorse3D(r,0,0,dt,'idle');assert.equal(r.state.gait,'idle');
  for(let i=0;i<60;i++)updateHorse3D(r,0,-.8*dt,dt,'walk');assert.equal(r.state.gait,'walk');
  for(let i=0;i<60;i++)updateHorse3D(r,0,-1.0*dt,dt,'run');assert.equal(r.state.gait,'trot');
  for(let i=0;i<60;i++)updateHorse3D(r,0,-1.5*dt,dt,'run');assert.equal(r.state.gait,'canter');
  for(const l of r.legs)for(const v of [l.hip.rotation.x,l.hip.rotation.y,l.knee.rotation.x])assert.ok(Number.isFinite(v));
  r.dispose();
});


test('horse gait phase map encodes four-beat walk, diagonal trot, and three-beat left-lead canter',async()=>{
  const src=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../horse3d.js',import.meta.url),'utf8'));
  assert.match(src,/gait==='trot'\?\[0,\.5,\.5,0\]/,'trot keeps diagonal pairs');
  assert.match(src,/gait==='canter'\?\[\.5,\.75,\.75,0\]/,'canter keeps hind -> diagonal pair -> leading fore sequence');
  assert.match(src,/gait==='walk'\?\[\.75,\.25,0,\.5\]/,'walk keeps four distinct quarter-cycle footfalls');
});