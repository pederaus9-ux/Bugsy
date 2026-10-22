import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {remainingWorld} from './remaining-care-world.mjs';
import * as N from '../remaining-care-navigation.js';
import {pointInPolygon} from '../animal-pen-geometry.js';
const retained=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task7-codex-pet-pocket-20261022/source-five-snapshots.json',import.meta.url),'utf8'));

for(const kind of ['dog','cat'])for(const hz of [30,60,120])test(`ordinary ${kind} at ${hz}Hz cannot steer into the real barn`,()=>{
 const f=remainingWorld(41),a=f.animals.find(a=>a.kind===kind),dt=1/hz;
 try{
  a.g.position.set(0,0,-5.9-a.S.r-.001);a.target=a.pos.clone().set(0,12);a.path=[];a.mode='fair';a.act='moving';a.running=true;a.vel.set(0,a.S.run);a.lastPos.copy(a.pos);
  for(let n=0;n<hz*2;n++){
   const before=a.g.position.toArray();a.update(dt,(n+1)*dt);const after=a.g.position.toArray();
   assert(N.careSegmentClear(before,after,{pad:a.S.r,rectangles:f.c.BLOCKS,segments:f.c.fenceSegs}),`penetration at frame ${n}: ${before} -> ${after}`);
   assert(f.c.acceptsPoint(null,after[0],after[2],a.S.r+.15));
   assert(Math.hypot(after[0]-before[0],after[2]-before[2])<=a.S.run*1.2*dt+1e-9,'collision response must not teleport');
  }
 }finally{f.dispose();}
});

for(const kind of ['dog','cat'])for(const hz of [30,60,120])for(const obstacle of ['fence','neighbour','default pen','custom concave pen'])test(`ordinary ${kind} ${hz}Hz respects ${obstacle} continuously`,()=>{
 const f=remainingWorld(41),a=f.animals.find(a=>a.kind===kind),other=f.animals.find(b=>b!==a&&b.kind==='dog'||b!==a&&b.kind==='cat'),dt=1/hz;
 try{
  f.c.BLOCKS.length=0;f.c.fenceSegs.length=0;f.c.PEN_LIST.length=0;
  for(const [i,b]of f.animals.entries())if(b!==a)b.g.position.set(100+i*5,0,100);
  let clearance=a.S.r;
  if(obstacle==='fence'){f.c.fenceSegs.push([0,-5,0,5]);clearance+=.05;}
  if(obstacle==='neighbour'){other.g.position.set(0,0,0);clearance+=other.S.r;}
  if(obstacle.endsWith('pen')){f.c.PEN_LIST.push({poly:obstacle==='default pen'?[[0,-2],[4,-2],[4,2],[0,2]]:[[0,-2],[4,-2],[4,0],[2,0],[2,2],[0,2]],custom:obstacle==='custom concave pen'});clearance+=.15;}
  a.g.position.set(-clearance-.001,0,0);a.target=a.pos.clone().set(5,0);a.path=[];a.mode='fair';a.act='moving';a.running=true;a.vel.set(a.S.run,0);a.lastPos.copy(a.pos);
  for(let n=0;n<hz*2;n++){
   const before=a.g.position.toArray();a.update(dt,(n+1)*dt);const after=a.g.position.toArray();
   assert(N.careSegmentClear(before,after,{pad:a.S.r,rectangles:f.c.BLOCKS,segments:f.c.fenceSegs,polygons:f.c.PEN_LIST.map(p=>p.poly),circles:f.animals.filter(b=>b!==a).map(b=>({x:b.g.position.x,z:b.g.position.z,r:a.S.r+b.S.r}))}),`new penetration at frame ${n}`);
   assert(f.c.acceptsPoint(null,after[0],after[2],a.S.r+.15));
   assert(Math.hypot(after[0]-before[0],after[2]-before[2])<=a.S.run*1.2*dt+1e-9,'collision response must not teleport');
  }
 }finally{f.dispose();}
});

test('ordinary pet route refuses the old direct fallback through a closed barrier',()=>{
 const f=remainingWorld(),a=f.animals.find(a=>a.kind==='dog');
 try{
  f.c.BLOCKS.push([0,-9,100,.25]);f.c.OBST.push({x:0,z:-9,hw:100,hd:.25,c:1,s:0});
  a.g.position.set(0,0,-10.5);a.go(0,-7.5,false,'blocked');
  assert.equal(a.target,undefined);assert.deepEqual(Array.from(a.path),[]);
 }finally{f.dispose();}
});

for(const kind of ['dog','cat'])test(`zero-time ordinary ${kind} update preserves finite motion state`,()=>{
 const f=remainingWorld(),a=f.animals.find(a=>a.kind===kind);
 try{
  a.target=a.pos.clone().addScalar(2);a.path=[];a.mode='fair';a.act='moving';a.vel.set(.1,.1);
  const before=a.g.position.toArray(),velocity=a.vel.toArray();a.update(0,0);
  assert.deepEqual(a.g.position.toArray(),before);assert.deepEqual(a.vel.toArray(),velocity);
  assert(Number.isFinite(a.phase));
 }finally{f.dispose();}
});

for(const seed of [62,69])for(const hz of [30,60,120])test(`retained corner ${seed} reaches food at ${hz}Hz with full clearance`,()=>{
 const s=retained.find(s=>s.seed===seed),f=remainingWorld(seed),dt=1/hz;
 try{
  s.report.forEach((r,i)=>f.animals[i].g.position.fromArray(r.p));const a=f.animals.find(a=>a.kind==='dog'),pad=f.layouts.dog.margin;
  const route=f.c.remainingCare.plan(a,s.goal);assert(route.length,'must find an executable route');
  const next=route[0],from=a.g.position.toArray(),d=Math.hypot(next[0]-from[0],next[2]-from[2]),step=Math.min(d,f.layouts.dog.speed*dt);
  assert(f.c.remainingCare.free(a,from[0]+(next[0]-from[0])/d*step,from[2]+(next[2]-from[2])/d*step,true),'planned first step must be executable');
  assert(f.c.remainingCare.request(a,'feed'));let arrived=false;
  for(let n=0;n<500*hz;n++){
   const before=a.g.position.toArray();f.c.remainingCare.update(a,dt,(n+1)*dt,{});const after=a.g.position.toArray();
   assert(a.g.position.distanceTo({x:before[0],y:before[1],z:before[2]})<=f.layouts.dog.speed*dt+1e-7);
   assert(N.careSegmentClear(before,after,{pad,rectangles:f.c.BLOCKS,segments:f.c.fenceSegs,polygons:f.c.PEN_LIST.map(p=>p.poly),circles:f.animals.filter(b=>b!==a).map(b=>({x:b.g.position.x,z:b.g.position.z,r:pad+f.layouts[b.kind].margin}))}));
   assert(f.c.acceptsPoint(null,after[0],after[2],pad));
   if(a.remainingTask?.stage==='hold'&&a.remainingTask.weight===1){arrived=true;break;}
  }
  assert(arrived,'original 500-second deadline');
 }finally{f.dispose();}
});

test('polygon point-rule boundary events retain default miters and custom radial/concave clearance',()=>{
 assert.equal(typeof N.carePointRuleClear,'function');
 const square=[[0,0],[4,0],[4,4],[0,4]],pad=.42,from=[-.5,0,-.2],to=[-.2,0,-.5];
 const miter=(x,z)=>!(x>=-pad&&x<=4+pad&&z>=-pad&&z<=4+pad),radial=(x,z)=>!pointInPolygon([x,z],square,-pad);
 assert(N.careSegmentClear(from,to,{pad,polygons:[square]}),'radial clearance is insufficient for the default corner');
 assert.equal(N.carePointRuleClear(from,to,{pad,polygons:[square],clearPoint:miter}),false);
 assert(N.carePointRuleClear(from,to,{pad,polygons:[square],clearPoint:radial}),'custom radial corner must remain legal');
 const concave=[[0,0],[6,0],[6,2],[2,2],[2,6],[0,6]],rule=(x,z)=>!pointInPolygon([x,z],concave,-pad);
 assert(N.carePointRuleClear([3,0,3],[5,0,5],{pad,polygons:[concave],clearPoint:rule}));
 assert.equal(N.carePointRuleClear([3,0,3],[3,0,-1],{pad,polygons:[concave],clearPoint:rule}),false);
 // An arbitrarily short forbidden interval between clear endpoints cannot be skipped by fixed samples.
 assert.equal(N.carePointRuleClear([-.420001,0,-.419999],[-.419999,0,-.420001],{pad,polygons:[square],clearPoint:miter}),false);
});

test('full clearance still rejects the retained pocket, footprints, fences, pens and neighbours',()=>{
 const s=retained.find(s=>s.seed===41),pad=s.pad,options={pad,...s.world,escape:true};
 assert.equal(pad,.42);assert.equal(s.report.find(a=>a.kind==='dog').p[0],-4.25);
 assert.equal(N.careSegmentClear([-4.65,0,-4],[-4.65,0,4],options),false);
 const left=-4.9+pad+.05,right=-4.25,north=s.world.rectangles.find(([x,z])=>x===-5.3&&z===-6.5),south=s.world.rectangles.find(([x,z])=>x===-4.9&&z===6.2);
 const nz=north[1]+north[3]+pad,sz=south[1]-south[3]-pad;
 for(const[from,to]of [[[right-.01,0,0],[right+.01,0,0]],[[left+.01,0,0],[left-.01,0,0]],[[-4.3,0,nz+.01],[-4.3,0,nz-.01]],[[-4.3,0,sz-.01],[-4.3,0,sz+.01]]])assert.equal(N.careSegmentClear(from,to,options),false);
 assert.equal(N.careSegmentClear([-6,0,0],[6,0,0],{pad,rectangles:[[0,0,4.4,5.9]],escape:true}),false);
 assert.equal(N.careSegmentClear([-5.5,0,0],[-4.3,0,0],{pad,segments:[[-4.9,-5.8,-4.9,5]],escape:true}),false);
 assert.equal(N.careSegmentClear([-17.5,0,0],[-4,0,0],{pad,polygons:[s.world.polygons.find(p=>p[0][0]===-16.5)],escape:true}),false);
 assert.equal(N.careSegmentClear([0,0,0],[3,0,0],{pad,circles:[{x:1.5,z:0,r:pad+.32}],escape:true}),false);
 assert(N.careSegmentClear([0,0,2],[3,0,2],{pad,circles:[{x:1.5,z:0,r:pad+.32}],escape:true}));
});
