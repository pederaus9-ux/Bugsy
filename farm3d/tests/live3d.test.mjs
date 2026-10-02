import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createLiveAnimal, updateLiveAnimal, createLiveFarmer, createLiveVillager, replaceRig, updateLiveFarmer} from '../live3d.js';
for (const kind of ['sheep','horse','dog','cat','chicken']) {
  test(kind + ' movement changes the gait', () => {
    const rig = createLiveAnimal(kind, 1, 0, 0);
    assert.equal(rig.liveKind, kind);
    const before = rig.legs[0].hip ? rig.legs[0].hip.rotation.x : rig.legs[0].rotation.x;
    for (let i = 0; i < 40; i++) updateLiveAnimal(rig, 0, -.4 / 60, 1 / 60, 'moving');
    const after = rig.legs[0].hip ? rig.legs[0].hip.rotation.x : rig.legs[0].rotation.x;
    assert.notEqual(after, before);
    assert.ok(Number.isFinite(after));
    rig.dispose();
  });
}
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
