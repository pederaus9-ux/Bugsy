const test=require('node:test'),assert=require('node:assert/strict');
const {createAnimalPenWakeOracle}=require('./animal-pen-wake-oracle.cjs');
const beds=()=>Array.from({length:46},(_,i)=>({key:'animal:'+i,dock:[i*4,0,0],radius:.5}));
const samples=(n,options={})=>beds().map((b,i)=>({key:b.key,pos:[b.dock[0]+(i===0&&options.stuck?0:n>=options.leaveAt?1:0),0,0],taskKind:i===0&&options.rebedAt&&n>=options.rebedAt?'bed':n>=options.leaveAt?null:'bed',act:n>=options.leaveAt?'moving':'sleeping',speed:n>=options.leaveAt?.5:0}));
const run=(oracle,end,options)=>{for(let n=1;n<=end;n++)oracle.observe(n,samples(n,options));};
test('all 46 physically exit by the original deadline and complete 1200 consecutive awake frames; a later nap is allowed',()=>{
 const o=createAnimalPenWakeOracle(beds(),{deadlineFrames:15000,wakeFrames:1200});
 run(o,1201,{leaveAt:1});assert.equal(o.snapshot().fullWakes,46);assert.equal(o.snapshot().minWakeFrames,1200);
 assert.equal(o.observe(1202,samples(1202,{leaveAt:1,rebedAt:1202})),true);
});
test('a task-cleared animal physically stuck on its bed fails at the original 500-second deadline',()=>{
 const o=createAnimalPenWakeOracle(beds());assert.throws(()=>run(o,15000,{leaveAt:1,stuck:true}),/physically leave/);
});
test('a first physical release one frame after 500 seconds fails',()=>{
 const o=createAnimalPenWakeOracle(beds());assert.throws(()=>run(o,15000,{leaveAt:15001}),/physically leave/);
});
test('resuming a bed task at 39.9 seconds fails even if every identity has left',()=>{
 const o=createAnimalPenWakeOracle(beds());assert.throws(()=>run(o,1198,{leaveAt:1,rebedAt:1198}),/resumed resting/);
});
test('awake travel and a brief route pause across the old bed core remain awake',()=>{
 const o=createAnimalPenWakeOracle(beds());o.observe(1,samples(1,{leaveAt:1}));
 for(let n=2;n<=31;n++){
   const all=samples(n,{leaveAt:1});all[0].pos=[n<8?.1:.48,0,0];all[0].act=n<8?'moving':'idle';all[0].speed=0;
   assert.equal(o.observe(n,all),false);
 }
 const outside=samples(32,{leaveAt:1});assert.equal(o.observe(32,outside),false);
});
test('measured slow awake travel through an old bed is not confused with a route replan',()=>{
 const o=createAnimalPenWakeOracle(beds());o.observe(1,samples(1,{leaveAt:1}));
 for(let n=2;n<=110;n++){
   const all=samples(n,{leaveAt:1});all[0].pos=[.1+(n-2)*.001,0,0];all[0].act='moving';all[0].speed=0;
   assert.equal(o.observe(n,all),false);
 }
});
test('a task-cleared animal that returns to the bed core and stays immobile fails the existing 2.5-second stuck window',()=>{
 const o=createAnimalPenWakeOracle(beds());o.observe(1,samples(1,{leaveAt:1}));
 for(let n=2;n<77;n++){
   const all=samples(n,{leaveAt:1});all[0].pos=[0,0,0];all[0].act='idle';all[0].speed=0;
   assert.equal(o.observe(n,all),false);
 }
 const stuck=samples(77,{leaveAt:1});stuck[0].pos=[0,0,0];stuck[0].act='idle';stuck[0].speed=0;
 assert.throws(()=>o.observe(77,stuck),/physically stuck in its old sleeping core/);
});
test('premature daytime resting pose fails even without a bed task',()=>{
 const o=createAnimalPenWakeOracle(beds());o.observe(1,samples(1,{leaveAt:1}));
 const all=samples(2,{leaveAt:1});all[0].act='resting';all[0].speed=0;
 assert.throws(()=>o.observe(2,all),/resumed resting/);
});
test('a disappearing or duplicated identity fails',()=>{
 const lost=createAnimalPenWakeOracle(beds());assert.throws(()=>lost.observe(1,samples(1,{leaveAt:1}).slice(1)),/lost/);
 const duplicated=createAnimalPenWakeOracle(beds());const all=samples(1,{leaveAt:1});all[1]={...all[0]};assert.throws(()=>duplicated.observe(1,all),/duplicate/);
});
test('a cleared task while still on the bed does not count as physical departure',()=>{
 const o=createAnimalPenWakeOracle(beds(),{deadlineFrames:2,wakeFrames:1});
 assert.equal(o.observe(1,samples(1,{leaveAt:1,stuck:true})),false);
 assert.throws(()=>o.observe(2,samples(2,{leaveAt:1,stuck:true})),/physically leave/);
});
test('walking to a drink dock on shared shelter flooring stays awake outside the occupied bed core',()=>{
 const fixture=beds();fixture[0].radius=.8;
 const o=createAnimalPenWakeOracle(fixture,{deadlineFrames:2,wakeFrames:2});
 const atDrink=samples(1,{leaveAt:1});atDrink[0].pos=[.85,0,0];
 assert.equal(o.observe(1,atDrink),false);
 assert.equal(o.observe(2,atDrink),false);
 assert.equal(o.observe(3,atDrink),true);
});
test('a skipped observation frame fails instead of manufacturing a continuous wake',()=>{
 const o=createAnimalPenWakeOracle(beds());o.observe(1,samples(1,{leaveAt:1}));assert.throws(()=>o.observe(3,samples(3,{leaveAt:1})),/skipped/);
});
test('60 Hz keeps 40 actual awake seconds and rejects the old 30 Hz count and a 39.9-second return',()=>{
 const config={rateHz:60,deadlineFrames:30000,wakeFrames:2400};
 const o=createAnimalPenWakeOracle(beds(),config);
 run(o,1201,{leaveAt:1});assert.equal(o.snapshot().fullWakes,0,'1200 frames are only 20 seconds at 60 Hz');
 runFrom(o,1202,2394,{leaveAt:1});assert.equal(o.snapshot().fullWakes,0);
 assert.throws(()=>o.observe(2395,samples(2395,{leaveAt:1,rebedAt:2395})),/resumed resting/);
 const complete=createAnimalPenWakeOracle(beds(),config);run(complete,2401,{leaveAt:1});assert.equal(complete.snapshot().minWakeFrames,2400);
});
test('60 Hz retains the 500-second physical-departure deadline',()=>{
 const o=createAnimalPenWakeOracle(beds(),{rateHz:60,deadlineFrames:30000,wakeFrames:2400});
 assert.throws(()=>run(o,30000,{leaveAt:30001}),/physically leave/);
});
function runFrom(oracle,start,end,options){for(let n=start;n<=end;n++)oracle.observe(n,samples(n,options));}
