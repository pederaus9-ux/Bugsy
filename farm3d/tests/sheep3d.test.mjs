import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createSheep3D,updateSheep3D,SHEEP_GAIT} from '../sheep3d.js';
test('sheep hips stay on the body and the gait stays finite',()=>{
  const r=createSheep3D();
  assert.equal(r.card.skeleton.bones.length,19);
  assert.equal(r.ears.length,2);assert.equal(r.tail.length,1);
  for(const ear of r.ears)assert.equal(ear.parent,r.head);
  assert.equal(r.tail[0].parent,r.body);
  for(const l of r.legs)assert.equal(l.hip.parent,r.body);
  for(let i=0;i<120;i++)updateSheep3D(r,0,-.4/60,1/60);
  for(const l of r.legs){
    assert.ok(l.hip.position.y<=SHEEP_GAIT.hip-.72,'hip stays within reach');
    const foot=l.foot.getWorldPosition(new THREE.Vector3());
    assert.ok(foot.y>=SHEEP_GAIT.hoof-1e-6,'hoof never penetrates ground');
    const up=new THREE.Vector3(0,1,0).applyQuaternion(l.foot.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(up.y>.99999,'hoof stays flat');
  }
  for(let i=0;i<30;i++)updateSheep3D(r,0,0,1/60);
  assert.ok(r.state.amount===0);
  r.dispose();
});
