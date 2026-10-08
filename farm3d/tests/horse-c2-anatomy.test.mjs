import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D} from '../horse3d.js';
import {createQuadruped,DOG,CAT} from '../quadruped3d.js';

function boundsIn(root,object){
  root.updateMatrixWorld(true);
  const inv=root.matrixWorld.clone().invert(), box=new THREE.Box3();
  object.geometry.computeBoundingBox();
  const local=object.geometry.boundingBox.clone();
  const m=object.matrixWorld.clone().premultiply(inv);
  return local.applyMatrix4(m);
}

test('C2 horse silhouette remains finite and materially horse-shaped',()=>{
  const r=createHorse3D();
  const box=boundsIn(r.g,r.card), size=new THREE.Vector3(); box.getSize(size);
  assert.ok([size.x,size.y,size.z].every(Number.isFinite));
  assert.ok(size.z>size.x*1.5,'horse should retain a longitudinal body silhouette');
  assert.equal(r.card.skeleton.bones.length,21,'C2 does not change the frozen skeleton contract');
  assert.equal(r.g.children.length,1);
  r.dispose();
});

test('C2 horse anatomy changes do not alter dog/cat species contracts',()=>{
  const dog=createQuadruped(DOG,.55),cat=createQuadruped(CAT,.4);
  assert.equal(dog.spec,DOG); assert.equal(cat.spec,CAT);
  assert.equal(dog.card.skeleton.bones.length,20);
  assert.equal(cat.card.skeleton.bones.length,21);
  assert.notEqual(dog.card.geometry,cat.card.geometry);
  dog.dispose();cat.dispose();
});

test('C2 removes the legacy forward-projecting horse mane link source',async()=>{
  const src=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../quadruped3d.js',import.meta.url),'utf8'));
  assert.doesNotMatch(src,/link\(spec\.face,\[0,-spec\.neck\[1\]\*\.5,\.07\]/);
  assert.match(src,/old long mane link crossed the face volume/);
});
