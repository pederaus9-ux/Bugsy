// Test-only horizontal relocation. Preserve the pose and persistent world contacts.
import {updateDog3D} from '../dog3d.js';

// Neutral staging is a reset, unlike camera recentering of an articulated pose.
export function resetDogEvidencePose(r,x,z){
  r.g.position.set(x,0,z);r.model.rotation.set(0,0,0);
  r.state.phase=0;r.state.amount=0;r.state.dogStop=null;r.state.dogResume=null;
  for(const l of r.legs)l.planted=false;
  updateDog3D(r,0,0,1/60,'idle');r.g.updateMatrixWorld(true);
}

export function translateDogEvidencePose(r,x,z){
  const dx=x-r.g.position.x,dz=z-r.g.position.z;
  for(const l of r.legs){
    if(Number.isFinite(l.ax))l.ax+=dx;
    if(Number.isFinite(l.az))l.az+=dz;
  }
  if(r.state.dogStop)for(const target of r.state.dogStop.legs){target.x+=dx;target.z+=dz;}
  if(r.state.dogResume)for(const target of r.state.dogResume.legs){target.x+=dx;target.z+=dz;}
  r.g.position.x=x;r.g.position.z=z;r.g.updateMatrixWorld(true);
}
