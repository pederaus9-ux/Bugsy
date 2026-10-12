// Keep failures visible: actual feet, not only planted flags or hidden targets.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
for(const hz of [30,60,120]){
 test(`chicken first walk frame cannot jump farther than root travel hz=${hz}`,()=>{
  const r=createChicken3D(.72),dt=1/hz,dz=-.8*dt;
  try{
   r.g.updateMatrixWorld(true);const before=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
   r.g.position.z+=dz;updateChicken3D(r,0,dz,dt,'walk');r.g.updateMatrixWorld(true);
   for(const[i,l]of r.legs.entries()){
    const jump=l.foot.getWorldPosition(new T.Vector3()).distanceTo(before[i]);
    assert.ok(jump<=Math.abs(dz)+1e-9,`leg${i} jumped${(jump*1000).toFixed(3)}mm; root traveled${(-dz*1000).toFixed(3)}mm`);
   }
  }finally{r.dispose();}
 });
 test(`chicken right turn retains real grounded contacts even if a flag resets hz=${hz}`,()=>{
  const r=createChicken3D(.72),dt=1/hz,g=r.card.geometry;
  const ids=r.legs.map(l=>{const b=r.card.skeleton.bones.indexOf(l.foot);return Array.from({length:g.attributes.position.count},(_,i)=>i).filter(i=>g.attributes.skinIndex.getX(i)===b);});
  const measure=()=>r.legs.map((l,j)=>({foot:l.foot.getWorldPosition(new T.Vector3()),planted:l.planted,sole:Math.min(...ids[j].map(i=>r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld).y))}));
  try{
   r.g.updateMatrixWorld(true);let previous=measure();
   for(let n=0;n<hz*3;n++){
    const dx=n<hz?0:.8*dt,dz=n<hz?-.8*dt:0;r.g.position.x+=dx;r.g.position.z+=dz;
    updateChicken3D(r,dx,dz,dt,'walk');r.g.updateMatrixWorld(true);const now=measure();
    for(let i=0;i<r.legs.length;i++){
     assert.ok(now[i].sole>=-.002,'actual toe sole penetration exceeds2mm');
     // The stricter plane measurement distinguishes touching ground from a
     // swinging toe merely within the existing2mm rendering/contact band.
     if(n>0&&previous[i].planted&&previous[i].sole<=1e-7&&now[i].sole<=1e-7){
      const slip=Math.hypot(now[i].foot.x-previous[i].foot.x,now[i].foot.z-previous[i].foot.z);
      assert.ok(slip<=.002,`frame${n} leg${i} grounded slip${(slip*1000).toFixed(3)}mm; current planted=${now[i].planted}`);
     }
    }
    previous=now;
   }
  }finally{r.dispose();}
 });
}
