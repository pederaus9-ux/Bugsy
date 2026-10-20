import test from 'node:test';import assert from 'node:assert/strict';import {G,T,at,reset} from './chicken-game-fixture.mjs';
function farm(n=1){const s=reset(30);s.pens.cow={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:'Cow '+i,love:20,loveAt:T}))};s.barn={cow_feed:30,milk:4};s.gold={milk:1};s.xp=0;assert.equal(typeof G.fillCowFeed,'function');G.settleCows(true,true);return s;}
test('shared stations spend only accepted real inventory and cow output cannot bypass robot',()=>{
 const s=farm();assert.equal(G.fillCowFeed(30),30);assert.equal(G.have('cow_feed'),0);assert.equal(G.fillCowWater(),true);at(T+180000);G.save();const cow=G.getCowCareStatus().cows[0];assert(cow.ready);assert.equal(G.collectAnimal('cow',0),false);assert.equal(G.collectAll('cow'),0);assert.equal(G.have('milk'),4);assert.equal(s.xp,0);assert.equal(G.feedOne('cow',0),false);
});
test('robot completion credits tank and XP once; barn pickup cannot grant another reward',()=>{
 const s=farm();G.fillCowFeed(1);G.fillCowWater();at(T+180000);assert.equal(G.milkCow(G.getCowCareStatus().cows[0].id),true);assert.equal(G.milkCow(G.getCowCareStatus().cows[0].id),false);const id=G.getCowCareStatus().job.id;assert.equal(G.reportCowRobotDock(id),true);at(T+192000);G.save();assert.equal(s.xp,3);assert.equal(G.getCowCareStatus().tank.normal,1);assert.equal(G.have('milk'),4);G.save();G.load();G.save();assert.equal(G.S.xp,3);assert.equal(G.collectCowTank(50),1);assert.equal(G.have('milk'),5);assert.equal(G.S.xp,3);assert.equal(G.collectCowTank(50),0);assert.equal(G.S.gold.milk,1);
});
test('full barn retains tank milk and partial pickup preserves gold',()=>{
 const s=farm();G.save();s.pens.cow.care.tank={normal:2,gold:2};s.barnCap=G.barnUsed();assert.equal(G.collectCowTank(50),0);assert.deepEqual(G.getCowCareStatus().tank,{normal:2,gold:2});s.barnCap+=3;assert.equal(G.collectCowTank(50),3);assert.deepEqual(G.getCowCareStatus().tank,{normal:0,gold:1});assert.equal(G.S.gold.milk,2);
});
test('cow state promotes only owning farms to writer3 while lamp-only2 and ordinary1 stay compatible',()=>{
 farm();G.save();assert.equal(G.S.v,3);const raw=localStorage.getItem(G.SAVE_KEY);G.load();assert.equal(G.S.v,3);assert.equal(JSON.stringify(G.S.pens.cow),JSON.stringify(JSON.parse(raw).pens.cow));
 reset(1);G.save();assert.equal(G.S.v,1);G.S.decor.inv.utilitylamp=1;G.save();assert.equal(G.S.v,2);
});
test('malformed future care refuses save and purchases without erasing raw paid state',()=>{
 const s=farm();G.save();const raw=localStorage.getItem(G.SAVE_KEY);s.pens.cow.care.v=99;s.coins=500;assert.equal(G.save(),false);assert.equal(localStorage.getItem(G.SAVE_KEY),raw);assert.equal(G.buyAnimal('cow'),false);assert.equal(s.coins,500);assert.equal(G.fillCowFeed(1),0);
});
test('cow actions are read-only during a visit and stable IDs survive purchase and rename',()=>{
 const s=farm();G.save();const id=s.pens.cow.care.cows[0].id;s.coins=500;assert.equal(G.buyAnimal('cow'),true);assert.equal(s.pens.cow.care.cows[0].id,id);assert.equal(s.pens.cow.care.cows.length,2);s.pens.cow.meta[0].name='Renamed';G.save();G.load();assert.equal(G.S.pens.cow.care.cows[0].id,id);const home=JSON.stringify(G.S);G.visitFarm(JSON.parse(home));assert.equal(G.fillCowWater(),false);assert.equal(G.fillCowFeed(1),0);assert.equal(G.milkCow(id),false);assert.equal(G.collectCowTank(1),0);G.leaveVisit();assert.equal(JSON.stringify(G.S),home);
});
test('untouched legacy cow farm retains its writer1 and paid timer until a cow station action',()=>{
 const s=reset(1);s.pens.cow={owned:true,list:[T+180000],meta:[{name:'Legacy',love:20,loveAt:T}]};G.save();assert.equal(s.v,1);assert.equal(s.pens.cow.care,undefined);assert.equal(s.pens.cow.list[0],T+180000);G.fillCowWater();assert.equal(s.v,3);assert.equal(s.pens.cow.care.cows[0].legacyAt,T+180000);
});
