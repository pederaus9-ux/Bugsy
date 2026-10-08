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
test('every wardrobe hat and hairstyle builds its own shape', () => {
  const shape = (look) => { const r = createLiveFarmer(look); const sig = r.extras.map(m => m.geometry.type + ':' + m.position.toArray().map(v => v.toFixed(2)).join(',')).sort().join('|'); r.dispose(); return sig; };
  const hats = ['straw','cap','beanie','cowboy','flowers','none'].map(hat => shape({hat, hair:'short'}));
  assert.equal(new Set(hats).size, hats.length, 'six hats, six different farmers');
  const hairs = ['short','long','pony','bun','curly','buzz','bob','braids'].map(hair => shape({hair, hat:'none'}));
  assert.equal(new Set(hairs).size, hairs.length, 'eight hairstyles, eight different farmers');
});
test('skin, shirt and overall colours reach the farmer', () => {
  const r = createLiveFarmer({skin:0x5b3822, shirt:0x9c7cd4, overalls:true, overallColor:0x7a5334});
  assert.equal(r.card.material.color.getHex(), 0x5b3822, 'skinned body wears the skin tone');
  const colours = new Set(r.extras.map(m => m.material.color.getHex()));
  assert.ok(colours.has(0x9c7cd4) && colours.has(0x7a5334));
  const plain = createLiveFarmer({shirt:0x9c7cd4, overalls:false});
  assert.ok(!new Set(plain.extras.map(m => m.material.color.getHex())).has(0x3d6fa8), 'no overalls, no denim');
  r.dispose(); plain.dispose();
});
test('walking bends the knees and stopping eases back to standing', () => {
  const r = createLiveFarmer({});
  let bent = 0;
  for (let i = 0; i < 90; i++) { updateLiveFarmer(r, 0, -1.4 / 60, 1 / 60, 'walk'); bent = Math.min(bent, r.knees[0].rotation.x, r.knees[1].rotation.x); }
  assert.ok(bent < -.3, 'a swinging leg bends at the knee');
  for (let i = 0; i < 120; i++) updateLiveFarmer(r, 0, 0, 1 / 60, 'idle');
  assert.ok(Math.abs(r.legs[0].rotation.x) < .02 && Math.abs(r.knees[0].rotation.x) < .02, 'legs settle when standing');
  updateLiveFarmer(r, 0, -30, 1 / 60, 'walk'); // a teleport is not a stride
  assert.ok(Number.isFinite(r.body.position.y));
  r.dispose();
});
