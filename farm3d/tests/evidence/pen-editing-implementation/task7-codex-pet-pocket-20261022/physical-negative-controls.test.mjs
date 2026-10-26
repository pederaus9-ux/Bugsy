import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {remainingWorld} from '../../../remaining-care-world.mjs';
import {careSegmentClear} from '../../../../remaining-care-navigation.js';
const snapshots=JSON.parse(fs.readFileSync(new URL('source-five-snapshots.json',import.meta.url),'utf8'));
const trapped=snapshots.find(s=>s.seed===41),world=trapped.world,pad=trapped.pad;
const options={pad,rectangles:world.rectangles,segments:world.segments,polygons:world.polygons,escape:true};

test('retained seed 41 starts inside the real barn footprint; the gap is narrower than the unchanged dog body',()=>{
 const p=trapped.report.find(a=>a.kind==='dog').p,barn=trapped.nearRects[0];
 assert.deepEqual(barn.rectangle,[0,0,4.4,5.9]);
 assert.equal(p[0],-4.25);assert(Math.abs(p[2]-4.549263291012599)<1e-12);
 assert(barn.footprintPenetration>0);assert.equal(pad,.42);
 const fenceX=-4.9,barnWest=-4.4;
 assert(world.segments.some(([ax,az,bx,bz])=>ax===fenceX&&bx===fenceX&&Math.min(az,bz)<=p[2]&&Math.max(az,bz)>=p[2]));
 assert.equal(barnWest-fenceX,.5);
 assert(barnWest-pad<fenceX+pad+.05,'a full-body dog must not fit through this gap');
});

test('reducing the planner pad to zero legalizes a route that penetrates the actual body keep-outs',()=>{
 const from=[-4.65,0,-4],to=[-4.65,0,4];
 assert(careSegmentClear(from,to,{...options,pad:0}),'diagnostic must expose the proposed shortcut');
 assert.equal(careSegmentClear(from,to,options),false,'original full body radius rejects the shortcut');
});

test('seed 41 has a closed collision cage under the existing monotone escape invariant',()=>{
 // In the barn the original body penetration is .57 m. Keeping it from growing
 // requires x <= -4.25 until |z| >= 5.75. The fence requires x >= -4.43.
 // Both ends of that strip close before |z| reaches 5.75:
 // north bush top -5.2, south bush bottom 4.98, each covers the strip's full width.
 const north=world.rectangles.find(([x,z])=>x===-5.3&&z===-6.5),south=world.rectangles.find(([x,z])=>x===-4.9&&z===6.2);
 assert(north);assert(south);
 const left=-4.9+pad+.05,right=-4.25,depth=trapped.nearRects[0].bodyPenetration;
 const northZ=north[1]+north[3]+pad,southZ=south[1]-south[3]-pad;
 assert(Math.abs(left+4.43)<1e-12);assert(Math.abs(depth-.57)<1e-12);
 assert(north[0]-north[2]-pad<left&&north[0]+north[2]+pad>right);
 assert(south[0]-south[2]-pad<left&&south[0]+south[2]+pad>right);
 assert(northZ>-(5.9+pad-depth));assert(southZ<5.9+pad-depth);
 for(const [from,to]of [
  [[right-.01,0,0],[right+.01,0,0]],
  [[left+.01,0,0],[left-.01,0,0]],
  [[-4.3,0,northZ+.01],[-4.3,0,northZ-.01]],
  [[-4.3,0,southZ-.01],[-4.3,0,southZ+.01]],
 ])assert.equal(careSegmentClear(from,to,options),false,'one side of the collision cage became passable');
});

test('full clearance rejects new building penetration, fence crossing, a closed pen and an occupied route',()=>{
 assert.equal(careSegmentClear([-6,0,0],[6,0,0],{pad,rectangles:[[0,0,4.4,5.9]],escape:true}),false);
 assert.equal(careSegmentClear([-5.5,0,0],[-4.3,0,0],{pad,segments:[[-4.9,-5.8,-4.9,5]],escape:true}),false);
 assert.equal(careSegmentClear([-17.5,0,0],[-4,0,0],{pad,polygons:[world.polygons.find(p=>p[0][0]===-16.5)],escape:true}),false);
 assert.equal(careSegmentClear([0,0,0],[3,0,0],{pad,circles:[{x:1.5,z:0,r:pad+.32}],escape:true}),false);
 assert(careSegmentClear([0,0,2],[3,0,2],{pad,circles:[{x:1.5,z:0,r:pad+.32}],escape:true}));
});

for(const seed of [62,69])test('retained corner '+seed+' has a planner/physical-step disagreement, not an empty plan',()=>{
 const s=snapshots.find(s=>s.seed===seed),f=remainingWorld(seed);
 try{
  s.report.forEach((r,i)=>f.animals[i].g.position.fromArray(r.p));const a=f.animals.find(a=>a.kind==='dog');
  const path=f.c.remainingCare.plan(a,s.goal);assert(path.length);const from=a.g.position.toArray(),to=path[0],length=Math.hypot(to[0]-from[0],to[2]-from[2]),step=f.layouts.dog.speed/30;
  const x=from[0]+(to[0]-from[0])/length*step,z=from[2]+(to[2]-from[2])/length*step;
  assert.equal(f.c.remainingCare.free(a,x,z,true),false,'this diagnostic must retain the first-step rejection');
  assert.equal(f.c.acceptsPoint(null,x,z,pad),false);
  assert(careSegmentClear(from,[x,0,z],{...options,rectangles:s.world.rectangles,segments:s.world.segments,polygons:s.world.polygons}),'continuous radial padding clears the mitered default-pen corner');
 }finally{f.dispose();}
});
