import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';
import {createDog3D,updateDog3D} from '../dog3d.js';
import {createCat3D,updateCat3D} from '../cat3d.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
import {createFarmer3D,updateFarmer3D,createVillager3D} from '../farmer3d.js';
function cycle(create,update,speed){const r=create();for(let i=0;i<90;i++)update(r,0,-speed/60,1/60,'run');for(let i=0;i<30;i++)update(r,0,0,1/60,'idle');assert.equal(r.state.amount,0);for(const l of r.legs)assert.equal(l.hip.parent,r.body);assert.ok(r.model.scale.x>0);r.dispose();return r;}
test('horse head and neck geometry stay attached and finite',()=>{
  const r=createHorse3D();
  const geo=r.card.geometry, skin=geo.attributes.skinIndex, pos=geo.attributes.position;
  const head=r.head, neck=r.neck;
  const bounds=(bone)=>{const b=new THREE.Box3();let n=0;for(let i=0;i<pos.count;i++){if(skin.getX(i)!==bone)continue;n++;b.expandByPoint(new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i)));}return {n,size:b.getSize(new THREE.Vector3())};};
  const headB=bounds(r.card.skeleton.bones.indexOf(head)), neckB=bounds(r.card.skeleton.bones.indexOf(neck));
  assert.ok(headB.n>20,'head-weighted vertices');
  assert.ok(neckB.n>20,'neck-weighted vertices');
  assert.ok(headB.size.x>0&&headB.size.y>0&&headB.size.z>0);
  assert.ok(neckB.size.length()>0.2);
  r.g.updateMatrixWorld(true);
  const headPos=new THREE.Vector3(), body=new THREE.Box3();
  head.getWorldPosition(headPos);
  for(let i=0;i<pos.count;i++){if(skin.getX(i)!==r.card.skeleton.bones.indexOf(r.body))continue;body.expandByPoint(r.card.localToWorld(new THREE.Vector3(pos.getX(i),pos.getY(i),pos.getZ(i))));}
  assert.ok(headPos.z<body.min.z+0.05,'head sits forward of the torso');
  for(const mode of ['idle','walk','run']){for(let i=0;i<40;i++)updateHorse3D(r,0,mode==='idle'?0:-.4/60,1/60,mode);assert.ok(Number.isFinite(r.neck.rotation.x));assert.ok(Number.isFinite(r.head.position.z));}
  assert.equal(r.card.isSkinnedMesh,true);assert.equal(r.g.children.length,1);r.dispose();
});
test('horse hips stay on the body and planted drift stays bounded',()=>{
  const r=createHorse3D();let worst=0;const pts=r.legs.map(()=>new THREE.Vector3());
  for(let i=0;i<180;i++){r.legs.forEach((l,j)=>l.foot.getWorldPosition(pts[j]));r.g.position.z-=1/60;updateHorse3D(r,0,-1/60,1/60,'walk');r.g.updateMatrixWorld(true);r.legs.forEach((l,j)=>{const now=l.foot.getWorldPosition(new THREE.Vector3());worst=Math.max(worst,now.distanceTo(pts[j]));assert.ok(now.y>=-0.02);});}
  assert.ok(worst<1.2);assert.equal(r.neck.parent,r.body);r.dispose();
});
test('dog and cat are not scaled sheep and return to neutral',()=>{cycle(createDog3D,updateDog3D,.4);cycle(createCat3D,updateCat3D,.3);const dog=createDog3D(),cat=createCat3D();assert.ok(dog.spec.body[2]<HORSE.body[2]);assert.ok(cat.spec.hip<dog.spec.hip);dog.dispose();cat.dispose();});
test('chicken and farmer modules load and return to neutral',()=>{cycle(createChicken3D,updateChicken3D,.2);const f=createFarmer3D(),v=createVillager3D({tint:0xffddbb,scale:.95});assert.equal(f.card.skeleton.bones.length,v.card.skeleton.bones.length);updateFarmer3D(f,0,-.2/60,1/60,'interact');assert.ok(f.arms[1].rotation.x<-1);f.dispose();v.dispose();});
