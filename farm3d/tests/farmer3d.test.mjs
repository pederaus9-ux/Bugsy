import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from '../lib/three.module.min.js';
import {createFarmer3D, updateFarmer3D, createVillager3D} from '../farmer3d.js';
const hairs=['short','long','pony','bun','curly','buzz','bob','braids'];
const hats=['straw','none','cap','beanie','cowboy','flowers'];
const near=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e, `${a} != ${b}`);
const signature=r=>createHash('sha256').update(Buffer.from(r.card.geometry.attributes.position.array.buffer)).digest('hex');
test('all eight hair styles and all six hat states remain distinct; faces clear in the full matrix',()=>{
  const hairSignatures=new Set(),hatSignatures=new Set();
  for(const hair of hairs)for(const hat of hats) {
    const r=createFarmer3D({look:{hair,hat}}); r.head.rotation.set(0,0,0); r.g.updateMatrixWorld(true); r.card.skeleton.update();
    if(hat==='none')hairSignatures.add(signature(r));
    if(hair==='short')hatSignatures.add(signature(r));
    assert.equal(r.parts.some(p=>p.name.startsWith('hat-')),hat!=='none');
    // Actual first visible triangle at each face feature, rather than just checking that a mesh exists.
    for(const [x,y,role]of [[-.066,.026,'eye'],[.066,.026,'eye'],[0,-.012,'nose'],[0,-.11,'mouth']]) {
      const ray=new THREE.Raycaster(new THREE.Vector3(x,1.72+y,-1),new THREE.Vector3(0,0,1));
      const hit=ray.intersectObject(r.card)[0]; assert.ok(hit, `${hair}/${hat} ${role} visible`);
      const part=r.parts.find(p=>hit.faceIndex*3>=p.start&&hit.faceIndex*3<p.start+p.count);
      assert.equal(part.name,role,`${hair}/${hat} occludes ${role} with ${part.name}`);
    }
    r.dispose();
  }
  assert.equal(hairSignatures.size,8); assert.equal(hatSignatures.size,6);
});
test('every exposed skin vertex matches the selected tone, including arms and head',()=>{
  for(const tone of [0xf6d7c3,0xf0c6a0,0xd9a577,0xb57c52,0x8a5635,0x5b3822]) {
    const r=createFarmer3D({look:{skin:tone}}),expected=new THREE.Color(tone),a=r.card.geometry.attributes.color;
    for(const p of r.parts.filter(p=>['face','ear','neck','upper-arm','elbow','forearm','hand','nose'].includes(p.name)))
      for(let i=p.start;i<p.start+p.count;i++) {near(a.getX(i),expected.r);near(a.getY(i),expected.g);near(a.getZ(i),expected.b);}
    r.dispose();
  }
});
test('real knees and elbows articulate; planted soles stay on the ground through walk/run at 30/60 Hz',()=>{
  for(const hz of [30,60])for(const speed of [.5,3,5.4]) {
    const r=createFarmer3D(); let plantedFrames=0,lifted=false; const knees=new Set(),elbows=new Set();
    for(let i=0;i<hz*3;i++) {
      const was=r.feet.map(f=>f.userData.planted),before=r.feet.map(f=>f.getWorldPosition(new THREE.Vector3()));
      r.g.position.z-=speed/hz; updateFarmer3D(r,0,-speed/hz,1/hz,'walk'); r.g.updateMatrixWorld(true);
      knees.add(r.knees[0].rotation.x.toFixed(3)); elbows.add(r.elbows[0].rotation.x.toFixed(3));
      for(let j=0;j<2;j++) {
        const foot=r.feet[j],p=foot.getWorldPosition(new THREE.Vector3()),up=new THREE.Vector3(0,1,0).applyQuaternion(foot.getWorldQuaternion(new THREE.Quaternion()));
        near(up.y,1); assert.ok(p.y>=.11999,'sole penetrates floor'); lifted ||= p.y>.17;
        if(i>hz && was[j]&&foot.userData.planted) {assert.ok(p.distanceTo(before[j])<.002,`planted slip at ${hz} Hz / ${speed}: ${p.distanceTo(before[j])}`); plantedFrames++;}
        assert.equal(r.knees[j].parent,r.legs[j]); assert.equal(r.elbows[j].parent,r.arms[j]);
      }
    }
    assert.ok(plantedFrames>20&&lifted); assert.ok(knees.size>10&&elbows.size>10);
    const phase=r.state.phase; for(let i=0;i<hz*2;i++)updateFarmer3D(r,0,0,1/hz,'idle');
    near(r.state.phase,phase); near(r.state.amount,0); r.g.updateMatrixWorld(true);
    for(const f of r.feet)near(f.getWorldPosition(new THREE.Vector3()).y,.12);
    r.dispose();
  }
});
test('equal-distance cadence is frame-rate independent; caller phase and interaction poses are honored',()=>{
  const runs=[30,60,120].map(hz=>{const r=createFarmer3D();for(let i=0;i<hz*2;i++)updateFarmer3D(r,0,-3/hz,1/hz,'walk');return r;});
  for(const r of runs) {near(r.state.distance,6);near(r.state.phase,runs[0].state.phase);near(r.knees[0].rotation.x,runs[0].knees[0].rotation.x); r.dispose();}
  const r=createFarmer3D();updateFarmer3D(r,0,-.05,1/60,'walk',{phase:10.25,run:1});near(r.state.phase,.25);
  updateFarmer3D(r,0,0,1/60,'interact'); assert.ok(r.arms[1].rotation.x<-1&&r.elbows[1].rotation.x<-.5);
  const phase=r.state.phase;updateFarmer3D(r,30,30,1/60,'walk');near(r.state.phase,phase);
  updateFarmer3D(r,NaN,0,1/60,'walk');assert.ok(Number.isFinite(r.state.phase));r.dispose();
});
test('idle head turn and wave return to neutral; villagers have independent skeletons and owned geometry',()=>{
  const a=createFarmer3D(),b=createVillager3D({tint:0xffaaaa}); let wave=false,turn=false;
  assert.notEqual(a.card.geometry,b.card.geometry);assert.equal(a.card.material,b.card.material);
  assert.notEqual(a.elbows[0],b.elbows[0]);
  for(let i=0;i<60*19;i++){updateFarmer3D(a,0,0,1/60);wave ||= a.arms[1].rotation.z>1.5;turn ||= Math.abs(a.head.rotation.y)>.15;}
  assert.ok(wave&&turn);assert.ok(a.arms[1].rotation.z>0);near(a.elbows[1].rotation.x,0);
  let disposed=0,skeletonDisposed=0;a.card.geometry.addEventListener('dispose',()=>disposed++);
  const dispose=a.card.skeleton.dispose.bind(a.card.skeleton);a.card.skeleton.dispose=()=>{skeletonDisposed++;dispose();};
  a.dispose();a.dispose();assert.equal(disposed,1);assert.equal(skeletonDisposed,1);assert.equal(b.disposed,false);b.dispose();
});
test('wardrobe foreground material is local, self-depth is retained and cleanup is idempotent',()=>{
  const a=createFarmer3D(),b=createVillager3D();const shared=a.card.material;
  a.setWardrobe(true);assert.notEqual(a.card.material,shared);assert.equal(b.card.material,shared);
  assert.equal(a.card.material.depthTest,true);assert.equal(a.card.renderOrder,100);
  let clears=0,disposed=0;const overlay=a.card.material;overlay.addEventListener('dispose',()=>disposed++);
  a.card.onBeforeRender({clearDepth(){clears++;}});assert.equal(clears,1);
  a.setWardrobe(false);a.setWardrobe(false);assert.equal(a.card.material,shared);assert.equal(a.card.renderOrder,0);assert.equal(disposed,1);
  a.card.onBeforeRender({clearDepth(){clears++;}});assert.equal(clears,1);
  a.setWardrobe(true);const next=a.card.material;next.addEventListener('dispose',()=>disposed++);a.dispose();a.dispose();assert.equal(disposed,2);b.dispose();
});
