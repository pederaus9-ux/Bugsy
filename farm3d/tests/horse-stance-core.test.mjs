import test from 'node:test';
import assert from 'node:assert/strict';
import {createHoofTrack,beginHoofSwing,updateHoofTrack,minimumJerk,resetHoofTrack,settleHoofOnStop} from '../horse-stance3d.js';
const near=(a,b,epsilon=1e-9)=>assert.ok(Math.abs(a-b)<=epsilon, 'expected '+a+' ~= '+b);
test('world-space stance anchor never drifts when updated',()=>{
  const t=createHoofTrack(1,.12,-2,.3);
  for(let n=0;n<1000;n++)updateHoofTrack(t,1/60);
  near(t.x,1);near(t.y,.12);near(t.z,-2);near(t.yaw,.3);
});
test('swing captures actual pose, has smooth endpoint velocities and lands without a jump',()=>{
  const t=createHoofTrack(0,.12,0,-.1);
  assert.ok(beginHoofSwing(t,{x:1,y:.12,z:-1,yaw:.35},.4,.09));
  updateHoofTrack(t,1e-5);
  assert.ok(Math.hypot(t.x,t.z)<1e-8,'lift-off moves continuously');
  for(let n=0;n<39;n++)updateHoofTrack(t,.01);
  assert.equal(t.mode,'swing');
  assert.ok(t.y>=.12-1e-9);
  updateHoofTrack(t,.01);
  assert.equal(t.mode,'stance');near(t.x,1);near(t.z,-1);near(t.y,.12);near(t.yaw,.35);
  for(let n=0;n<30;n++)updateHoofTrack(t,.01);
  near(t.x,1);near(t.z,-1);near(t.y,.12);
  near(minimumJerk(0),0);near(minimumJerk(1),1);
});
test('swing touchdown matches across 30, 60 and 120 Hz',()=>{
  const end=[];
  for(const hz of [30,60,120]){
    const t=createHoofTrack(0,.09,0,0);
    beginHoofSwing(t,{x:.4,y:.09,z:-.7,yaw:Math.PI/3},.5,.1);
    for(let n=0;n<hz;n++)updateHoofTrack(t,1/hz);
    end.push([t.x,t.y,t.z,t.yaw,t.cycle,t.mode]);
  }
  for(const e of end)assert.deepEqual(e,end[0]);
});
test('ordinary gait changes do not reset a swinging hoof; teleport explicitly resets it',()=>{
  const t=createHoofTrack(.2,.09,.5,.1);
  beginHoofSwing(t,{x:.6,y:.09,z:.2,yaw:.4},.3,.1);
  updateHoofTrack(t,.08);const x=t.x,z=t.z;
  assert.equal(beginHoofSwing(t,{x:4,y:0,z:4,yaw:1},.1,.5),false);
  near(t.x,x);near(t.z,z);
  resetHoofTrack(t,10,.09,10,0);
  assert.equal(t.mode,'stance');near(t.x,10);near(t.z,10);
});

test('stopping midway through a fast swing lands vertically without a hoof teleport',()=>{
  const t=createHoofTrack(0,.09,0,0);
  beginHoofSwing(t,{x:2,y:.09,z:-2,yaw:1},.25,.12);
  updateHoofTrack(t,.06);
  const x=t.x,z=t.z,angle=t.yaw;
  assert.equal(settleHoofOnStop(t,.09),true);
  let worst=0,priorX=t.x,priorY=t.y,priorZ=t.z;
  for(let i=0;i<30;i++){
    updateHoofTrack(t,1/60);
    worst=Math.max(worst,Math.hypot(t.x-priorX,t.y-priorY,t.z-priorZ));
    priorX=t.x;priorY=t.y;priorZ=t.z;
  }
  assert.ok(worst<.10,'stop-frame movement '+worst);
  near(t.x,x);near(t.z,z);near(t.y,.09);near(t.yaw,angle);
  assert.equal(t.mode,'stance');
});

test('high-speed turning footstep respects bounded swing velocity instead of teleporting',()=>{
  const t=createHoofTrack(0,.1,0,0),speedLimit=9,duration=.24;
  beginHoofSwing(t,{x:3,y:.1,z:3,yaw:Math.PI/2},duration,.08,speedLimit);
  assert.ok(Math.hypot(t.landX,t.landZ)<=speedLimit*duration/1.875+1e-9);
  let previousX=t.x,previousZ=t.z,worst=0;
  for(let n=0;n<30;n++){
    updateHoofTrack(t,1/120);
    worst=Math.max(worst,Math.hypot(t.x-previousX,t.z-previousZ));
    previousX=t.x;previousZ=t.z;
  }
  assert.ok(worst<=speedLimit/120+1e-9,'swing displacement '+worst);
  assert.equal(t.mode,'stance');
});

// Opt-in 'gait' swing profile and in-flight re-aim (default stays minimum-jerk).
import {swingProfile,SWING_PEAK,reaimSwing} from '../horse-stance3d.js';
test('gait profile: zero-velocity endpoints, monotone, peak rate 1/(1-ramp), default unchanged',()=>{
  near(swingProfile(0,'gait'),0);near(swingProfile(1,'gait'),1);near(swingProfile(.5,'gait'),.5);
  let peak=0,prev=0;
  for(let i=1;i<=10000;i++){const u=i/10000,v=swingProfile(u,'gait');assert.ok(v>=prev-1e-12,'monotone');peak=Math.max(peak,(v-prev)*10000);prev=v;}
  near(peak,SWING_PEAK.gait,1e-3);assert.ok(SWING_PEAK.gait<SWING_PEAK.minimumJerk);
  near((swingProfile(1e-4,'gait')-swingProfile(0,'gait'))/1e-4,0,1e-5);
  near((swingProfile(1,'gait')-swingProfile(1-1e-4,'gait'))/1e-4,0,1e-5);
  for(const u of [0,.1,.37,.5,.9,1])near(swingProfile(u),minimumJerk(u));
  const t=createHoofTrack(0,.1,0,0);beginHoofSwing(t,{x:1,y:.1,z:0,yaw:0},.4,.05);
  assert.equal(t.profile,'minimumJerk','beginHoofSwing defaults to minimum-jerk');
  const g=createHoofTrack(0,.1,0,0);beginHoofSwing(g,{x:3,y:.1,z:0,yaw:0},.3,.05,3,'gait');
  near(g.landX,3*.3/SWING_PEAK.gait,1e-9);
});
test('re-aiming a gait swing keeps pose and progress, lands exactly, and refuses minimum-jerk tracks',()=>{
  const t=createHoofTrack(0,.1,0,0);beginHoofSwing(t,{x:1,y:.1,z:0,yaw:.2},.4,.08,Infinity,'gait');
  for(let n=0;n<4;n++)updateHoofTrack(t,1/30);
  const pose=[t.x,t.y,t.z,t.yaw],u=t.swingElapsed/t.swingDuration;
  assert.equal(reaimSwing(t,{x:1.3,y:.1,z:.2,yaw:.5},.5,.04),true);
  near(t.swingElapsed/t.swingDuration,u);
  const probe={...t};updateHoofTrack(probe,1e-12);
  [probe.x,probe.y,probe.z,probe.yaw].forEach((v,i)=>near(v,pose[i],1e-9));
  let prev=[t.x,t.y,t.z],worst=0;
  while(t.mode==='swing'){updateHoofTrack(t,1/60);worst=Math.max(worst,Math.hypot(t.x-prev[0],t.y-prev[1],t.z-prev[2]));prev=[t.x,t.y,t.z];}
  near(t.x,1.3);near(t.z,.2);near(t.y,.1);near(t.yaw,.5);assert.ok(worst<.1,'re-aimed step '+worst);
  const m=createHoofTrack(0,.1,0,0);beginHoofSwing(m,{x:1,y:.1,z:0,yaw:0},.4,.08);updateHoofTrack(m,.1);
  const x=m.x;assert.equal(reaimSwing(m,{x:2,y:.1,z:0,yaw:0}),false);near(m.x,x);near(m.landX,1);
});
test('a late re-aim of a gait swing stays continuous and lands where asked',()=>{
  const t=createHoofTrack(0,.1,0,0);beginHoofSwing(t,{x:.6,y:.1,z:0,yaw:0},.3,.06,Infinity,'gait');
  while(swingProfile(t.swingElapsed/t.swingDuration,'gait')<.95)updateHoofTrack(t,1/120);
  const pose=[t.x,t.y,t.z],rest=.1;
  assert.equal(reaimSwing(t,{x:.75,y:.1,z:.05,yaw:0},rest/(1-t.swingElapsed/t.swingDuration)),true);
  const probe={...t};updateHoofTrack(probe,1e-12);
  [probe.x,probe.y,probe.z].forEach((v,i)=>near(v,pose[i],1e-9));
  let prev=[t.x,t.y,t.z],worst=0;const dist=Math.hypot(.75-pose[0],.1-pose[1],.05-pose[2]);
  while(t.mode==='swing'){updateHoofTrack(t,1/120);worst=Math.max(worst,Math.hypot(t.x-prev[0],t.y-prev[1],t.z-prev[2]));prev=[t.x,t.y,t.z];}
  near(t.x,.75);near(t.z,.05);near(t.y,.1);
  assert.ok(worst<=3.2*dist/rest/120,'late re-aim step '+worst+' for '+dist+' m in '+rest+' s');
});
