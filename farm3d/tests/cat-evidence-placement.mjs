// Test-only horizontal relocation. Preserve the pose and persistent world contacts.
import {updateCat3D} from '../cat3d.js';

// Neutral staging is a reset, unlike camera recentering of an articulated pose.
export function resetCatEvidencePose(r,x,z){
  r.g.position.set(x,0,z);r.model.rotation.set(0,0,0);
  r.state.phase=0;r.state.amount=0;r.state.catStop=null;r.state.catResume=null;
  for(const l of r.legs)l.planted=false;
  updateCat3D(r,0,0,1/60,'idle');r.g.updateMatrixWorld(true);
}

export function translateCatEvidencePose(r,x,z){
  const dx=x-r.g.position.x,dz=z-r.g.position.z;
  for(const l of r.legs){
    if(Number.isFinite(l.ax))l.ax+=dx;
    if(Number.isFinite(l.az))l.az+=dz;
  }
  if(r.state.catStop)for(const target of r.state.catStop.legs){target.x+=dx;target.z+=dz;}
  if(r.state.catResume)for(const target of r.state.catResume.legs){target.x+=dx;target.z+=dz;}
  r.g.position.x=x;r.g.position.z=z;r.g.updateMatrixWorld(true);
}
