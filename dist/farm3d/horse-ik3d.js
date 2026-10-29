import * as THREE from './lib/three.module.min.js';

// Pole-vector two-bone IK. The body and hip rest positions are immutable;
// only hip/knee rotations and foot orientation are solved each frame.
const DOWN=new THREE.Vector3(0,-1,0);
const UP=new THREE.Vector3(0,1,0);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createHorseIKScratch(){
  return {
    hip:new THREE.Vector3(),target:new THREE.Vector3(),dir:new THREE.Vector3(),
    pole:new THREE.Vector3(),knee:new THREE.Vector3(),local:new THREE.Vector3(),
    qWorld:new THREE.Quaternion(),qYaw:new THREE.Quaternion(),
    residual:new THREE.Vector3()
  };
}

export function solveHorseLegIK(r,l,x,y,z,yaw){
  const ik=r.ik,scale=r.model.scale.x;
  // Three.js does not immediately propagate bone rotations to matrixWorld.
  // Update before using each parent space, then update again after each solve.
  r.g.updateMatrixWorld(true);
  l.hip.getWorldPosition(ik.hip);
  ik.target.set(x,y,z);
  ik.dir.subVectors(ik.target,ik.hip);
  const upper=r.spec.upper*scale,lower=r.spec.lower*scale;
  const length=ik.dir.length();
  if(!Number.isFinite(length))throw new Error('horse IK target not finite');
  const d=clamp(length,Math.abs(upper-lower)+1e-5,upper+lower-1e-5);
  if(length>1e-9)ik.dir.multiplyScalar(1/length);
  else ik.dir.set(0,-1,0);
  // Clamp unreachable targets only for the IK math. Do not relocate the
  // persistent stance anchor; the scheduler must release overextended legs.
  ik.target.copy(ik.hip).addScaledVector(ik.dir,d);

  // Forward carpus for forelegs (-Z), backward hock for hindlegs (+Z).
  const poleSign=l.z<0?-1:1,modelYaw=r.model.rotation.y;
  ik.pole.set(Math.sin(modelYaw)*poleSign,0,Math.cos(modelYaw)*poleSign);
  ik.pole.addScaledVector(ik.dir,-ik.pole.dot(ik.dir));
  if(ik.pole.lengthSq()<1e-8){
    ik.pole.set(1,0,0).addScaledVector(ik.dir,-ik.dir.x);
  }
  ik.pole.normalize();
  const cosA=clamp((upper*upper+d*d-lower*lower)/(2*upper*d),-1,1);
  const sinA=Math.sqrt(Math.max(0,1-cosA*cosA));
  ik.knee.copy(ik.hip).addScaledVector(ik.dir,upper*cosA).addScaledVector(ik.pole,upper*sinA);

  // Shoulder rest position is never changed; solve in body-bone local space.
  ik.local.copy(ik.knee);r.body.worldToLocal(ik.local);
  ik.local.sub(l.hip.position).normalize();
  l.hip.quaternion.setFromUnitVectors(DOWN,ik.local);
  l.hip.updateWorldMatrix(true,false);

  ik.local.copy(ik.target);l.hip.worldToLocal(ik.local);
  ik.local.sub(l.knee.position).normalize();
  l.knee.quaternion.setFromUnitVectors(DOWN,ik.local);
  l.knee.updateWorldMatrix(true,false);

  // Cancel the entire knee-to-world rotation; preserve world-flat hoof with
  // its persistent stance yaw, not an offset multiplied in foot-local space.
  l.knee.getWorldQuaternion(ik.qWorld);
  ik.qYaw.setFromAxisAngle(UP,yaw);
  l.foot.quaternion.copy(ik.qWorld).invert().multiply(ik.qYaw);
}
