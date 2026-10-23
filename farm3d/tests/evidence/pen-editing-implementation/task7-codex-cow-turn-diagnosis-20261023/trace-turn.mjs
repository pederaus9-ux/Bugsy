import fs from 'node:fs';import assert from 'node:assert/strict';
import * as T from '../../../../lib/three.module.min.js';
import {createCow3D,updateCow3D,COW_GAIT} from '../../../../cow3d.js';
const input=JSON.parse(fs.readFileSync(new URL('../task7-codex-cow-support-fix-20261023/transitions-clock/results.json',import.meta.url)));
const foot=l=>l.foot.localToWorld(new T.Vector3(0,-COW_GAIT.hoof,0));
const state=r=>r.legs.map(l=>({planted:l.planted,slip:l.slip,p:foot(l).toArray(),ax:l.ax,az:l.az,rx:l.rx,rz:l.rz,r0:l.r0,rt:l.rt}));
const events=[];let clock=0;
for(const tr of input.transitions){const r=createCow3D(1.7,10.6,-39.1,'Directed support '+tr.hz);r.g.position.y=0;r.g.updateMatrixWorld(true);
 try{for(const f of tr.frames){if(f.position[0]<10.45)break;const before=state(r),old=r.g.position.clone(),yaw0=r.model.rotation.y;r.g.position.fromArray(f.position);const dx=r.g.position.x-old.x,dz=r.g.position.z-old.z,dt=1/tr.hz,d=Math.atan2(-dx,-dz)-yaw0,yaw=dx||dz?yaw0+Math.atan2(Math.sin(d),Math.cos(d))*(1-Math.exp(-dt*14)):yaw0;
  const incoming=r.legs.map((l,j)=>{const wx=(l.ax-r.g.position.x)/r.model.scale.x,wz=(l.az-r.g.position.z)/r.model.scale.x,tx=wx*Math.cos(yaw)-wz*Math.sin(yaw)-l.x,tz=wx*Math.sin(yaw)+wz*Math.cos(yaw)-l.z;return{leg:j,tx,tz,length:Math.hypot(tx,tz),predictedClampDisplacement:Math.max(0,Math.hypot(tx,tz)-.34)*r.model.scale.x};});
  updateCow3D(r,dx,dz,dt,clock+(f.i+1)*dt,f.i?'moving':'idle');r.g.updateMatrixWorld(true);const after=state(r);
  for(let j=0;j<4;j++){assert(Math.hypot(...after[j].p.map((v,k)=>v-f.feet[j].p[k]))<1e-10);if(before[j].planted&&!after[j].planted){const displacement=Math.hypot(...after[j].p.map((v,k)=>v-before[j].p[k]));events.push({hz:tr.hz,frame:f.i,leg:j,root:f.position,yawBefore:yaw0,yawAfter:r.model.rotation.y,before:before[j],after:after[j],incoming:incoming[j],displacement,predictionError:Math.abs(displacement-incoming[j].predictedClampDisplacement),passes:displacement<=.05});}}
 }}finally{r.dispose();}clock+=tr.frames.length/tr.hz;
}
// Supplemental hypotheses only: real original API, linear interpolation of the
// exact root displacement. Measure both substeps and unchanged outer frames.
function replay(tr,substep){const r=createCow3D(1.7,10.6,-39.1,'Directed support '+tr.hz),out={hz:tr.hz,maxStepSeconds:substep,outerLiftoff:0,innerLiftoff:0,outerPlantedDrift:0,innerPlantedDrift:0,soleError:0,frames:0,releaseCount:0};r.g.position.y=0;let prev=state(r),time=0;
 try{for(const f of tr.frames){if(f.position[0]<10.45)break;const from=r.g.position.clone(),steps=Math.ceil((1/tr.hz)/substep),dt=1/tr.hz/steps;let inner=prev;
  for(let i=1;i<=steps;i++){const before=r.g.position.clone();r.g.position.fromArray(f.position).sub(from).multiplyScalar(i/steps).add(from);time+=dt;updateCow3D(r,r.g.position.x-before.x,r.g.position.z-before.z,dt,time,f.i?'moving':'idle');r.g.updateMatrixWorld(true);const cur=state(r);
   for(let j=0;j<4;j++){const delta=Math.hypot(...cur[j].p.map((v,k)=>v-inner[j].p[k]));if(inner[j].planted&&!cur[j].planted){out.innerLiftoff=Math.max(out.innerLiftoff,delta);out.releaseCount++;}if(inner[j].planted&&cur[j].planted)out.innerPlantedDrift=Math.max(out.innerPlantedDrift,delta);if(cur[j].planted)out.soleError=Math.max(out.soleError,Math.abs(cur[j].p[1]));}inner=cur;
  }
  for(let j=0;j<4;j++){const delta=Math.hypot(...inner[j].p.map((v,k)=>v-prev[j].p[k]));if(prev[j].planted&&!inner[j].planted)out.outerLiftoff=Math.max(out.outerLiftoff,delta);if(prev[j].planted&&inner[j].planted)out.outerPlantedDrift=Math.max(out.outerPlantedDrift,delta);}prev=inner;out.frames++;
 }}finally{r.dispose();}out.passes=out.outerLiftoff<=.05&&out.outerPlantedDrift<1e-10&&out.innerPlantedDrift<1e-10&&out.soleError<1e-10;return out;
}
const hypotheses=input.transitions.flatMap(t=>[1/30,1/60,1/120,1/240].map(step=>replay(t,step)));
const result={source:'unchanged cow3d.js; no candidate code or rig-state overrides',events,hypotheses};
fs.writeFileSync(new URL('./turn-mechanism.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({events:events.map(e=>({hz:e.hz,frame:e.frame,leg:e.leg,reach:e.incoming.length,clampPrediction:e.incoming.predictedClampDisplacement,measured:e.displacement,predictionError:e.predictionError})),hypotheses},null,2));
