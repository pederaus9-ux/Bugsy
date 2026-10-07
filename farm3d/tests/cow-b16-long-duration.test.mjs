import test from 'node:test';
import assert from 'node:assert/strict';
import {createCow3D, updateCow3D} from '../cow3d.js';

const HZS=[30,60,120], DURATION=180;
const schedule=t=>{const p=t%36;if(p<6)return {act:'idle',speed:0,turn:0};if(p<12)return {act:'eating',speed:0,turn:0};if(p<18)return {act:'idle',speed:.8,turn:0};if(p<24)return {act:'idle',speed:1.8,turn:.22};if(p<30)return {act:'resting',speed:0,turn:0};return {act:'idle',speed:.65,turn:-.18};};
function run(hz,seed=7){
 const r=createCow3D(1.7,0,0,seed),dt=1/hz; let yaw=0,finite=true,minPhase=1,maxPhase=0,maxAmount=0,blinkEvents=0,earEvents=0,prevBlink=0,prevEar=r.state.earEvent;
 for(let i=0;i<DURATION*hz;i++){const t=i*dt,{act,speed,turn}=schedule(t);yaw+=turn*dt;const dx=-Math.sin(yaw)*speed*dt,dz=-Math.cos(yaw)*speed*dt;r.g.position.x+=dx;r.g.position.z+=dz;updateCow3D(r,dx,dz,dt,t,act);r.g.updateMatrixWorld(true);r.card.skeleton.update();
  const s=r.state,vals=[s.time,s.phase,s.amount,s.run,s.blend,s.turnRatio,s.attention,s.tailAlert,s.chewDrive,s.chewAmount,s.chewPhase,s.look,s.earFocus,s.blinkAlert,r.model.rotation.y,r.neck.rotation.x,r.jaw.rotation.x,r.jaw.rotation.y,...r.g.position.toArray()];
  finite&&=vals.every(Number.isFinite);minPhase=Math.min(minPhase,s.phase);maxPhase=Math.max(maxPhase,s.phase);maxAmount=Math.max(maxAmount,s.amount);
  if(s.blinkTime>0&&prevBlink<=0)blinkEvents++;prevBlink=s.blinkTime;if(s.earEvent!==prevEar){earEvents++;prevEar=s.earEvent;}
 }
 const s=r.state,out={finite,minPhase,maxPhase,maxAmount,blinkEvents,earEvents,time:s.time,phase:s.phase,amount:s.amount,run:s.run,blend:s.blend,turnRatio:s.turnRatio,attention:s.attention,tailAlert:s.tailAlert,chewDrive:s.chewDrive,chewAmount:s.chewAmount,chewPhase:s.chewPhase,look:s.look,earFocus:s.earFocus,blinkAlert:s.blinkAlert,pos:r.g.position.toArray(),yaw:r.model.rotation.y};r.dispose();return out;
}
const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,`${msg}: ${a} vs ${b}`);
test('B16 long-duration cow state remains finite and bounded for 180s at 30/60/120 Hz',()=>{for(const hz of HZS){const x=run(hz);assert.ok(x.finite,`${hz}Hz finite`);assert.ok(x.minPhase>=0&&x.maxPhase<1,`${hz}Hz phase bounded`);assert.ok(x.maxAmount<=1,`${hz}Hz amount bounded`);assert.ok(x.blinkEvents>10&&x.blinkEvents<90,`${hz}Hz plausible blink count ${x.blinkEvents}`);assert.ok(x.earEvents>10&&x.earEvents<100,`${hz}Hz plausible ear-event count ${x.earEvents}`);}});
test('B16 repeated run is deterministic at each frame rate',()=>{for(const hz of HZS)assert.deepEqual(run(hz,11),run(hz,11),`${hz}Hz repeatable`);});
test('B16 terminal state stays frame-rate consistent',()=>{const base=run(120,19);for(const hz of [30,60]){const x=run(hz,19);near(x.time,base.time,.03,`${hz}Hz time`);near(x.phase,base.phase,.01,`${hz}Hz phase`);near(x.amount,base.amount,.01,`${hz}Hz amount`);near(x.blend,base.blend,.02,`${hz}Hz blend`);near(x.attention,base.attention,.02,`${hz}Hz attention`);near(x.chewAmount,base.chewAmount,.03,`${hz}Hz chew`);near(x.look,base.look,.03,`${hz}Hz look`);near(x.yaw,base.yaw,.03,`${hz}Hz yaw`);for(let i=0;i<3;i++)near(x.pos[i],base.pos[i],.03,`${hz}Hz pos[${i}]`);}});
