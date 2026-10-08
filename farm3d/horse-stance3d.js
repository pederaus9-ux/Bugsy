// World-space hoof stance and continuous swing planning for Horse R1.
// This module owns foot CONTACT state, never skeletal joint transforms.
// Leg IK must consume track.x/y/z and track.yaw without mutating this state.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function minimumJerk(u){
  u=clamp(u,0,1);
  return u*u*u*(10+u*(-15+6*u));
}
export function createHoofTrack(x,y,z,yaw=0){
  return {x,y,z,yaw,mode:'stance',plantX:x,plantY:y,plantZ:z,plantYaw:yaw,
    startX:x,startY:y,startZ:z,startYaw:yaw,
    landX:x,landY:y,landZ:z,landYaw:yaw,
    swingElapsed:0,swingDuration:0,swingLift:0,cycle:0};
}
export function beginHoofSwing(t,landing,duration,lift){
  if(t.mode==='swing')return false;
  if(!(duration>0)||!Number.isFinite(duration))throw new Error('positive swing duration required');
  // Capture the ACTUAL current world-space hoof pose at the lift event.
  t.startX=t.x;t.startY=t.y;t.startZ=t.z;t.startYaw=t.yaw;
  t.landX=landing.x;t.landY=landing.y;t.landZ=landing.z;t.landYaw=landing.yaw;
  t.swingDuration=duration;t.swingElapsed=0;t.swingLift=Math.max(0,lift);
  t.mode='swing';
  return true;
}
export function retargetSwing(t,landing,duration=null,lift=null){
  if(t.mode!=='swing')return false;
  // A replan does not reset elapsed or move the current hoof. The next step
  // proceeds smoothly toward the new landing pose from the current position.
  const remaining=t.swingDuration-t.swingElapsed;
  if(remaining<=0)return false;
  t.startX=t.x;t.startY=t.y;t.startZ=t.z;t.startYaw=t.yaw;
  t.landX=landing.x;t.landY=landing.y;t.landZ=landing.z;t.landYaw=landing.yaw;
  t.swingElapsed=0;t.swingDuration=duration===null?remaining:Math.max(duration,1e-4);
  if(lift!==null)t.swingLift=Math.max(0,lift);
  return true;
}
export function settleHoofOnStop(t,soleHeight){
  if(t.mode!=='swing')return false;
  // Only the initial stop event calls this: preserve current world XZ/yaw,
  // smoothly lower the suspended hoof instead of finishing a long run step.
  return retargetSwing(t,{x:t.x,y:soleHeight,z:t.z,yaw:t.yaw},.24,0);
}
export function updateHoofTrack(t,dt){
  if(!(dt>0)||!Number.isFinite(dt))return t;
  if(t.mode==='stance'){
    // Stance is an immutable contact anchor until explicitly lifted.
    t.x=t.plantX;t.y=t.plantY;t.z=t.plantZ;t.yaw=t.plantYaw;
    return t;
  }
  t.swingElapsed=Math.min(t.swingDuration,t.swingElapsed+dt);
  const u=clamp(t.swingElapsed/t.swingDuration,0,1),s=minimumJerk(u);
  t.x=t.startX+(t.landX-t.startX)*s;
  t.z=t.startZ+(t.landZ-t.startZ)*s;
  t.y=t.startY+(t.landY-t.startY)*s+t.swingLift*16*u*u*(1-u)*(1-u);
  t.yaw=t.startYaw+angleDelta(t.startYaw,t.landYaw)*s;
  if(u>=1){
    // The last swing pose IS the first stance anchor. No re-anchoring jump.
    t.x=t.plantX=t.landX;t.y=t.plantY=t.landY;t.z=t.plantZ=t.landZ;
    t.yaw=t.plantYaw=t.landYaw;t.mode='stance';t.cycle++;
  }
  return t;
}
export function resetHoofTrack(t,x,y,z,yaw=0){
  // Explicit reset only for teleports / fresh spawn, never ordinary stop.
  t.x=t.plantX=t.startX=t.landX=x;
  t.y=t.plantY=t.startY=t.landY=y;
  t.z=t.plantZ=t.startZ=t.landZ=z;
  t.yaw=t.plantYaw=t.startYaw=t.landYaw=yaw;
  t.mode='stance';t.swingElapsed=0;t.swingDuration=0;t.swingLift=0;
  return t;
}
