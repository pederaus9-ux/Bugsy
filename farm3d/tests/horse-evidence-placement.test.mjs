import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D} from '../horse3d.js';
import {resetHorseEvidencePose,translateHorseEvidencePose} from './horse-evidence-placement.mjs';
function maxError(r){
 r.g.updateMatrixWorld(true);
 return Math.max(...r.legs.map(l=>l.foot.getWorldPosition(new Vector3()).distanceTo(new Vector3(l.track.x,l.track.y,l.track.z))));
}
test('negative control: raw capture relocation leaves world anchors behind',()=>{
 const r=createHorse3D(2.3,8,3);
 try{r.g.position.set(0,0,14);updateHorse3D(r,0,0,1/60,'idle');assert.ok(maxError(r)>1);}
 finally{r.dispose();}
});
test('capture placement resets idle contacts at both horse sizes',()=>{
 for(const h of [1.6,2.3]){
  const r=createHorse3D(h,8,3);
  try{
   resetHorseEvidencePose(r,0,0,14);
   for(let n=0;n<24;n++)updateHorse3D(r,0,0,1/60,'idle');
   assert.ok(maxError(r)<.002);
   for(const l of r.legs)assert.ok(Math.abs(l.foot.getWorldPosition(new Vector3()).y-(.07425*r.model.scale.x+.0005))<.002);
  }finally{r.dispose();}
 }
});
test('capture recentering preserves articulated pose and contacts for all modes',()=>{
 for(const mode of ['idle','walk','run']){
  const r=createHorse3D(2.3,8,3);
  try{
   resetHorseEvidencePose(r,0,0,14);
   for(let n=0;n<24;n++){
    const dz=mode==='idle'?0:-2.3*(mode==='run'?1.4:.65)/60;
    r.g.position.z+=dz;updateHorse3D(r,0,dz,1/60,mode);
   }
   const before=r.legs.map(l=>[...l.hip.quaternion.toArray(),...l.knee.quaternion.toArray()]);
   translateHorseEvidencePose(r,0,0,14);
   assert.ok(maxError(r)<.002,mode+' recentered contact error '+maxError(r));
   assert.deepEqual(r.legs.map(l=>[...l.hip.quaternion.toArray(),...l.knee.quaternion.toArray()]),before);
  }finally{r.dispose();}
 }
});
