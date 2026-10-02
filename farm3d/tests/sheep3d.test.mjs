import test from 'node:test';
import assert from 'node:assert/strict';
import {createSheep3D,updateSheep3D,SHEEP_GAIT} from '../sheep3d.js';
test('sheep hips stay on the body and the gait stays finite',()=>{
  const r=createSheep3D();
  assert.equal(r.card.skeleton.bones.length,16);
  for(const l of r.legs)assert.equal(l.hip.parent,r.body);
  for(let i=0;i<120;i++)updateSheep3D(r,0,-.4/60,1/60);
  for(const l of r.legs)assert.ok(Math.abs(l.hip.position.y-(SHEEP_GAIT.hip-.72))<1e-6);
  for(let i=0;i<30;i++)updateSheep3D(r,0,0,1/60);
  assert.ok(r.state.amount===0);
  r.dispose();
});
