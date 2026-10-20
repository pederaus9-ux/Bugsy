import test from 'node:test';import assert from 'node:assert/strict';import * as M from '../cow-care.js';
const t0=1_000_000;
function setup(n=1,feed=1,happy=false){const p={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},()=>({love:happy?100:20,loveAt:t0}))};M.ensureCowCare(p,t0);assert.equal(typeof M.refillCowWater,'function');M.refillCowWater(p,t0);M.stockCowFeed(p,feed,t0);return p;}
function ready(p,happy=false){M.settleCowCare(p,t0+(happy?144000:180000));return p.care.cows[0];}
test('one paid feed creates one ready batch at the exact normal boundary without more offline batches',()=>{
 const p=setup(),c=p.care;M.settleCowCare(p,t0+179999);assert.equal(c.cows[0].ready,null);assert.equal(c.feed,0);M.settleCowCare(p,t0+180000);assert.equal(c.cows[0].ready.n,1);const b=structuredClone(c.cows[0].ready);M.settleCowCare(p,t0+86_400_000);assert.deepEqual(c.cows[0].ready,b);assert.equal(c.tank.normal,0);assert.equal(c.receipts.length,0);
});
test('happy cycle is144seconds and batch quality never rerolls on duplicate commands or reload',()=>{
 const p=setup(1,1,true),b=ready(p,true);assert.equal(b.duration,144000);const batch=structuredClone(b.ready);M.requestCowMilking(p,b.id,t0+144000);const q=JSON.parse(JSON.stringify(p));M.requestCowMilking(q,b.id,t0+144001);assert.deepEqual(q.care.cows[0].ready,batch);
});
test('water exhaustion pauses earned progress and refill resumes without charging another feed',()=>{
 const p=setup();p.care.waterUntil=t0+60000;M.settleCowCare(p,t0+120000);assert.equal(p.care.cows[0].progress,60000);M.refillCowWater(p,t0+120000);M.settleCowCare(p,t0+240000);assert.equal(p.care.cows[0].ready.n,1);assert.equal(p.care.feed,0);
});
test('stock capacity, invalid inputs, backwards time and free water duration are bounded',()=>{
 const p=setup(1,0);assert.equal(M.stockCowFeed(p,100,t0),30);assert.equal(p.care.feed,29);assert.equal(M.stockCowFeed(p,1.2,t0),0);assert.equal(p.care.waterUntil,t0+43200000);const snapshot=structuredClone(p);M.settleCowCare(p,t0-1);M.refillCowWater(p,t0-1);M.stockCowFeed(p,2,t0-1);assert.deepEqual(p,snapshot);
});
test('manual request alone never milks; physical docking starts the12second service',()=>{
 const p=setup(),cow=ready(p),at=t0+180000;assert.equal(M.requestCowMilking(p,cow.id,at).ok,true);assert.equal(M.requestCowMilking(p,cow.id,at).ok,false);const job=p.care.job.id;M.settleCowCare(p,at+60000);assert.deepEqual(p.care.tank,{normal:0,gold:0});assert.equal(M.dockCowMilking(p,job+1,at+60000),false);assert.equal(M.dockCowMilking(p,job,at+60000),true);M.settleCowCare(p,at+71999);assert.equal(p.care.tank.normal,0);M.settleCowCare(p,at+72000);assert.equal(p.care.tank.normal,1);assert.equal(p.care.job.stage,'exiting');assert.equal(p.care.receipts.length,1);M.settleCowCare(p,at+74000);assert.equal(p.care.tank.normal,1);assert.equal(p.care.receipts.length,1);assert.equal(M.validateCowCare(p.care),true);
});
test('single robot holds the exit until acknowledged, then serves FIFO with stable cow IDs',()=>{
 const p=setup(3,3);ready(p);const at=t0+180000,ids=p.care.cows.map(c=>c.id);for(const id of ids)assert.equal(M.requestCowMilking(p,id,at).ok,true);const first=p.care.job.id;assert.deepEqual(p.care.queue,ids.slice(1));M.dockCowMilking(p,first,at);M.settleCowCare(p,at+12000);assert.equal(p.care.job.cowId,ids[0]);assert.equal(M.finishCowRobotExit(p,first+10,at+12000),false);M.finishCowRobotExit(p,first,at+12000);assert.equal(p.care.job.cowId,ids[1]);assert.equal(p.care.job.stage,'approaching');assert.deepEqual(p.care.queue,[ids[2]]);assert.equal(M.dockCowMilking(p,first,at+12000),false);
});
test('tank room includes the reserved active batch and a happy double cannot be truncated',()=>{
 const p=setup(2,2);ready(p);const [a,b]=p.care.cows;a.ready.n=2;b.ready.n=2;p.care.tank.normal=49;const raw=JSON.stringify(a.ready);assert.deepEqual(M.requestCowMilking(p,a.id,t0+180000),{ok:false,reason:'tankFull'});assert.equal(JSON.stringify(a.ready),raw);p.care.tank.normal=47;assert.equal(M.requestCowMilking(p,a.id,t0+180000).ok,true);assert.equal(M.requestCowMilking(p,b.id,t0+180000).ok,false);assert.equal(p.care.queue.length,0);
});
test('reload before/after robot completion credits output and XP receipt once; pickup is bounded and quality preserved',()=>{
 let p=setup(),cow=ready(p),at=t0+180000;cow.ready.gold=true;M.requestCowMilking(p,cow.id,at);const id=p.care.job.id;M.dockCowMilking(p,id,at);p=JSON.parse(JSON.stringify(p));M.settleCowCare(p,at+12000);assert.deepEqual(p.care.tank,{normal:0,gold:1});const receipt=p.care.receipts[0].id;p=JSON.parse(JSON.stringify(p));M.settleCowCare(p,at+13000);assert.equal(p.care.tank.gold,1);assert.equal(p.care.receipts.length,1);assert.equal(M.acknowledgeCowReward(p,receipt),true);assert.equal(M.acknowledgeCowReward(p,receipt),false);assert.deepEqual(M.takeCowMilk(p,50,at+13000),{normal:0,gold:1});assert.deepEqual(M.takeCowMilk(p,50,at+13000),{normal:0,gold:0});assert.equal(p.care.receipts.length,0);
});
test('already-paid legacy output becomes ready with no fresh supplies and remains stable',()=>{
 const p={owned:true,list:[t0+100],meta:[{love:20,loveAt:t0}]};M.ensureCowCare(p,t0);M.settleCowCare(p,t0+99);assert.equal(p.care.cows[0].ready,null);M.settleCowCare(p,t0+100);assert.equal(p.care.cows[0].ready.n,1);assert.equal(p.care.feed,0);assert.equal(p.care.waterUntil,0);assert.equal(p.care.cows[0].legacyAt,null);
});
test('new cow gets no production for time before purchase',()=>{
 const p=setup(1,3);p.list.push(0);p.meta.push({love:20,loveAt:t0+100000});M.ensureCowCare(p,t0+100000);M.settleCowCare(p,t0+180000);assert.equal(p.care.cows[1].progress,80000);assert.equal(p.care.cows[1].ready,null);
});
test('damaged robot stage, reserved capacity and queue state cannot manufacture milk',()=>{
 const p=setup(2,2);ready(p);M.requestCowMilking(p,p.care.cows[0].id,t0+180000);
 for(const mutate of [c=>{c.job.stage='milking';c.job.startedAt=null;},c=>{c.job.credited=true;},c=>{c.job.batch.id='wrong';},c=>{c.tank.normal=50;},c=>{c.cows[1].ready=null;c.queue.push(c.cows[1].id);}]){const x=structuredClone(p);mutate(x.care);const raw=JSON.stringify(x);assert.equal(M.validateCowCare(x.care),false);assert.equal(M.settleCowCare(x,t0+300000),null);assert.equal(JSON.stringify(x),raw);}
});
