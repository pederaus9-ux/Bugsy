import test from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createCow3D,updateCow3D} from '../cow3d.js';

const TRIS=10576, BUDGET=10592;
const triCount=g=>{const p=g.index?g.index.count:g.attributes.position.count;return p/3;};

test('B17 production topology stays inside the frozen cow envelope',()=>{
 const r=createCow3D();
 assert.equal(r.card.isSkinnedMesh,true);
 assert.equal(triCount(r.card.geometry),TRIS);
 assert.ok(triCount(r.card.geometry)<=BUDGET);
 assert.equal(r.card.skeleton.bones.length,24);
 r.dispose();
});

test('B17 herd instances share immutable render resources but own animation state',()=>{
 const herd=Array.from({length:12},(_,i)=>createCow3D(1.7,i%4,0,100+i));
 const geometry=herd[0].card.geometry,material=herd[0].card.material;
 for(const r of herd){assert.equal(r.card.geometry,geometry);assert.equal(r.card.material,material);assert.notEqual(r.card.skeleton,herd[(herd.indexOf(r)+1)%herd.length].card.skeleton);}
 herd.forEach(r=>r.dispose());
});

test('B17 twelve-cow mixed-state soak remains finite and records update cost',()=>{
 const herd=Array.from({length:12},(_,i)=>createCow3D(1.7,(i%4)*2,Math.floor(i/4)*2,200+i));
 const hz=60,dt=1/hz,seconds=30;let elapsed=0,updates=0;
 const t0=performance.now();
 for(let frame=0;frame<hz*seconds;frame++){const t=frame*dt;
  for(let i=0;i<herd.length;i++){const r=herd[i],mode=i%4,act=mode===0?'idle':mode===1?'eating':mode===2?'resting':'idle',speed=mode===3?.8:0,yaw=.15*Math.sin(t*.2+i),dx=-Math.sin(yaw)*speed*dt,dz=-Math.cos(yaw)*speed*dt;r.g.position.x+=dx;r.g.position.z+=dz;updateCow3D(r,dx,dz,dt,t,act);updates++;
   const s=r.state;assert.ok([s.time,s.phase,s.amount,s.run,s.blend,s.turnRatio,s.attention,s.chewAmount,s.look].every(Number.isFinite),`cow ${i} finite at frame ${frame}`);
  }
 }
 elapsed=performance.now()-t0;
 const msPerUpdate=elapsed/updates;
 console.log(JSON.stringify({b17Performance:{cows:herd.length,seconds,hz,updates,elapsedMs:+elapsed.toFixed(3),msPerUpdate:+msPerUpdate.toFixed(6)}}));
 assert.ok(msPerUpdate<1,`catastrophic CPU regression: ${msPerUpdate.toFixed(4)} ms/update`);
 herd.forEach(r=>r.dispose());
});
