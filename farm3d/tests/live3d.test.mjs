import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveAnimal, updateLiveAnimal, createLiveFarmer, createLiveVillager} from '../live3d.js';
for (const kind of ['sheep','horse','dog','cat','chicken']) {
  test(kind + ' live module has one mesh and stays finite', () => {
    const rig = createLiveAnimal(kind, 1, 0, 0);
    assert.ok(rig.card.isSkinnedMesh); assert.equal(rig.card.parent !== null || rig.g.children.length > 0, true);
    updateLiveAnimal(rig, 0, -.2, 1/60, 'moving');
    assert.ok(Number.isFinite(rig.g.position.x)); rig.dispose();
  });
}
test('farmer and villager share the human rig', () => {
  const f = createLiveFarmer(), v = createLiveVillager(0x88aa66);
  assert.equal(f.card.skeleton.bones.length, v.card.skeleton.bones.length);
  f.dispose(); v.dispose();
});
