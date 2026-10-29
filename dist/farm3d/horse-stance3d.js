// World-space hoof stance and continuous swing planning for Horse R1.
// This module owns foot CONTACT state, never skeletal joint transforms.
// Leg IK must consume track.x/y/z and track.yaw without mutating this state.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function minimumJerk(u){
  u=clamp(u,0,1);
  return u*u*u*(10+u*(-15+6*u));
}
// Opt-in locomotion profile: smooth trapezoidal velocity. Speed ramps in and
// out with a smoothstep over GAIT_RAMP of the swing (zero endpoint velocity
// and acceleration) and is constant in between, so peak hoof speed is only
// 1/(1-GAIT_RAMP) of the average instead of minimum-jerk's 1.875.
const GAIT_RAMP=.10;
function gaitRamp(u){
  u=clamp(u,0,1);const a=GAIT_RAMP,peak=1/(1-a),ramp=s=>s*s*s-s*s*s*s/2;
  if(u<a)return peak*a*ramp(u/a);
  if(u>1-a)return 1-peak*a*ramp((1-u)/a);
  return peak*(a/2+u-a);
}
export const SWING_PEAK={minimumJerk:1.875,gait:1/(1-GAIT_RAMP)};
export function swingProfile(u,profile='minimumJerk'){
  return profile==='gait'?gaitRamp(u):minimumJerk(u);
}
export function createHoofTrack(x,y,z,yaw=0){
  return {x,y,z,yaw,mode:'stance',plantX:x,plantY:y,plantZ:z,plantYaw:yaw,
    startX:x,startY:y,startZ:z,startYaw:yaw,
    landX:x,landY:y,landZ:z,landYaw:yaw,
    swingElapsed:0,swingDuration:0,swingLift:0,cycle:0};
}
export function beginHoofSwing(t,landing,duration,lift,maxFootSpeed=Infinity,profile='minimumJerk'){
  if(t.mode==='swing')return false;
  if(!(duration>0)||!Number.isFinite(duration))throw new Error('positive swing duration required');
  // Capture the ACTUAL current world-space hoof pose at the lift event.
  t.startX=t.x;t.startY=t.y;t.startZ=t.z;t.startYaw=t.yaw;
  // The profile's peak time derivative (1.875 for the quintic curve) bounds
  // the distance requested for a single swing using a physical foot-speed
  // budget, rather than forcing an implausible leap during a sharp turn.
  const dx=landing.x-t.x,dz=landing.z-t.z,span=Math.hypot(dx,dz);
  const maxSpan=Number.isFinite(maxFootSpeed)?Math.max(0,maxFootSpeed)*duration/(SWING_PEAK[profile]??1.875):Infinity;
  const ratio=span>0?Math.min(1,maxSpan/span):1;
  t.landX=t.x+dx*ratio;t.landY=landing.y;t.landZ=t.z+dz*ratio;t.landYaw=landing.yaw;
  t.swingDuration=duration;t.swingElapsed=0;t.swingLift=Math.max(0,lift);
  t.profile=profile==='gait'?'gait':'minimumJerk';
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
// Opt-in gait profile only: re-aim a swing in flight without restarting it.
// The hoof keeps its current pose and its progress u through the profile, so
// it keeps moving instead of stalling at zero velocity as a restart would;
// only the landing and, optionally, the swing duration (u is preserved) and
// lift height change; the start pose absorbs every change so the hoof does
// not jump. The hoof's speed afterwards is the remaining distance over the
// remaining time times a bounded profile factor (at most ~3, in the final
// ramp), however late the re-aim. Returns false (nothing changed) where a
// re-aim is ill-conditioned: in the last 1% of the travel, or where the
// remaining yaw change could not be interpolated without wrapping.
export function reaimSwing(t,landing,duration=null,lift=null){
  if(t.mode!=='swing'||t.profile!=='gait')return false;
  const u=clamp(t.swingElapsed/t.swingDuration,0,1),s=swingProfile(u,t.profile);
  if(s>.99)return false;
  const k=1/(1-s),landYaw=t.yaw+angleDelta(t.yaw,landing.yaw);
  if(Math.abs(landYaw-t.yaw)*k>=Math.PI)return false;
  if(duration!==null){t.swingDuration=Math.max(duration,1e-4);t.swingElapsed=u*t.swingDuration;}
  if(lift!==null)t.swingLift=Math.max(0,lift);
  const bump=t.swingLift*16*u*u*(1-u)*(1-u);
  t.landX=landing.x;t.landY=landing.y;t.landZ=landing.z;t.landYaw=landYaw;
  t.startX=(t.x-landing.x*s)*k;t.startZ=(t.z-landing.z*s)*k;
  t.startY=(t.y-bump-landing.y*s)*k;t.startYaw=(t.yaw-landYaw*s)*k;
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
  const u=clamp(t.swingElapsed/t.swingDuration,0,1),s=swingProfile(u,t.profile);
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
