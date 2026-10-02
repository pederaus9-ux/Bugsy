import {createSheep3D, updateSheep3D} from './sheep3d.js';
import {createHorse3D, updateHorse3D} from './horse3d.js';
import {createDog3D, updateDog3D} from './dog3d.js';
import {createCat3D, updateCat3D} from './cat3d.js';
import {createChicken3D, updateChicken3D} from './chicken3d.js';
import {createFarmer3D, updateFarmer3D, createVillager3D} from './farmer3d.js';
const makers = {sheep:[createSheep3D, updateSheep3D], horse:[createHorse3D, updateHorse3D], dog:[createDog3D, updateDog3D], cat:[createCat3D, updateCat3D], chicken:[createChicken3D, updateChicken3D]};
export function createLiveAnimal(kind, height, x, z) {
  const pair = makers[kind]; if (!pair) return null;
  const rig = pair[0](height, x, z); rig.liveKind = kind; rig.card.castShadow = rig.card.receiveShadow = true; return rig;
}
export function updateLiveAnimal(rig, dx, dz, dt, act) {
  const pair = makers[rig.liveKind]; if (!pair) return;
  const mode = act === 'moving' || act === 'fleeing' ? 'run' : 'walk';
  pair[1](rig, dx, dz, dt, mode);
}
export function createLiveFarmer(look) { const rig = createFarmer3D({look: look || {}}); rig.look = rig.look; return rig; }
export function updateLiveFarmer(rig, dx, dz, dt, act) { updateFarmer3D(rig, dx, dz, dt, act || 'idle'); }
export function createLiveVillager(tint) { const rig = createVillager3D({tint, look:{shirt:tint, overalls:false, hat:'none'}}); rig.liveKind = 'villager'; return rig; }
export function replaceRig(parent, previous, next) {
  if (previous) { parent.remove(previous.g); previous.dispose(); }
  parent.add(next.g); return next;
}
