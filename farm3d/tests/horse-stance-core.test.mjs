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
