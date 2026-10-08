import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createLiveAnimal, updateLiveAnimal, createLiveFarmer, createLiveVillager, replaceRig, updateLiveFarmer} from '../live3d.js';
for (const kind of ['sheep','horse','dog','cat','chicken']) {
  test(kind + ' movement changes the gait', () => {
    const rig = createLiveAnimal(kind, 1, 0, 0);
    assert.equal(rig.liveKind, kind);
    const before = rig.legs[0].hip ? rig.legs[0].hip.rotation.x : rig.legs[0].rotation.x;
    for (let i = 0; i < 40; i++) {
      // Production animal movement translates rig.g before passing the delta.
      // The gait updater must not apply a second translation.
      const dz=-.4/60;
      rig.g.position.z+=dz;
      updateLiveAnimal(rig,0,dz,1/60,'moving');
    }
    const after = rig.legs[0].hip ? rig.legs[0].hip.rotation.x : rig.legs[0].rotation.x;
    assert.notEqual(after, before);
    assert.ok(Number.isFinite(after));
    rig.dispose();
  });
}

// Horse-specific semantics: world-space planted contact remains fixed as the
// model root advances; the leg moves because the torso moved over that plant.
test('horse translated root articulates hip without moving a planted hoof',()=>{
  const r=createLiveAnimal('horse',1,0,0);
  try{
    r.g.updateMatrixWorld(true);
    const leg=r.legs[0],beforeAngle=leg.hip.rotation.x;
    const beforeFoot=leg.foot.getWorldPosition(new THREE.Vector3());
    const dz=-.4/60;
    r.g.position.z+=dz;
    updateLiveAnimal(r,0,dz,1/60,'moving');
    r.g.updateMatrixWorld(true);
    const afterFoot=leg.foot.getWorldPosition(new THREE.Vector3());
    assert.notEqual(leg.hip.rotation.x,beforeAngle,'hip must articulate over world-space planted foot');
    assert.ok(afterFoot.distanceTo(beforeFoot)<.01,
      'moving-root stance foot moved '+afterFoot.distanceTo(beforeFoot)+'m');
    assert.ok(leg.track && leg.track.mode==='stance','first frame remains in stance');
  }finally{r.dispose();}
});

// Deliberately invalid caller behavior: a velocity argument is not permission
// for horse3d to translate the root itself or slide its planted-world anchor.
test('horse delta without root movement leaves the world contact fixed',()=>{
  const r=createLiveAnimal('horse',1,0,0);
  try{
    r.g.updateMatrixWorld(true);
    const leg=r.legs[0],before=leg.foot.getWorldPosition(new THREE.Vector3());
    const rootZ=r.g.position.z,plantX=leg.track.plantX,plantZ=leg.track.plantZ;
    updateLiveAnimal(r,0,-.4/60,1/60,'moving');
    r.g.updateMatrixWorld(true);
    assert.equal(r.g.position.z,rootZ,'animation updater must not translate root');
    assert.equal(leg.track.plantX,plantX);
    assert.equal(leg.track.plantZ,plantZ);
    assert.ok(leg.foot.getWorldPosition(new THREE.Vector3()).distanceTo(before)<1e-6,
      'without root translation the planted foot should not shift');
  }finally{r.dispose();}
});
test('two saved hair styles produce different hair meshes', () => {
  const a = createLiveFarmer({hair:'buzz', hairColor:0x1f1a17, hat:'none', overalls:false});
  const b = createLiveFarmer({hair:'braids', hairColor:0x1f1a17, hat:'none', overalls:false});
  assert.equal(a.hair, 'buzz');
  assert.equal(b.hair, 'braids');
  assert.notEqual(a.extras.length, b.extras.length);
  a.dispose(); b.dispose();
});
test('two saved looks produce different farmer materials', () => {
  const a = createLiveFarmer({shirt:0xd24d3f, hat:'straw', overalls:true, boots:0x4a3222, skin:0xf6d7c3, hairColor:0x1f1a17});
  const b = createLiveFarmer({shirt:0x5ea64a, hat:'none', overalls:false, boots:0xa8322a, skin:0x5b3822, hairColor:0xb4552a});
  assert.notEqual(a.look.shirt, b.look.shirt);
  assert.notEqual(a.look.hat, b.look.hat);
  assert.notEqual(a.extras.length, b.extras.length);
  a.dispose(); b.dispose();
});
test('live farmer idle update stays finite', () => {
  const rig = createLiveFarmer({hair:'bob', hat:'none', overalls:false});
  for (let i = 0; i < 30; i++) updateLiveFarmer(rig, 0, 0, 1/60, 'idle');
  assert.ok(Number.isFinite(rig.arms[0].rotation.x));
  assert.equal(rig.disposed, false);
  rig.dispose();
});
test('replacing a rig removes the old group and disposes it', () => {
  const scene = new THREE.Group();
  let current = createLiveVillager(0xcc6677); scene.add(current.g);
  for (let i = 0; i < 5; i++) current = replaceRig(scene, current, createLiveVillager(0x448866));
  assert.equal(scene.children.length, 1);
  assert.equal(current.disposed, false);
  current.dispose();
  assert.equal(current.disposed, true);
});
