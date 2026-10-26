const test=require('node:test');
const assert=require('node:assert/strict');
const {assertNewFarmReload}=require('./animal-pen-farm-transition-oracle.cjs');
const day='2026-10-24',window={day,reloadStart:1090,reloadEnd:1110};
const before={v:1,coins:60,gems:5,xp:0,pens:{horse:{owned:false,list:[]}},layout:{b:{},t:{}},quests:null,lastSeen:1000};
const after={...structuredClone(before),quests:{day,list:[{m:'harvest',n:12,prog:0,got:0},{m:'water',n:7,prog:0,got:0},{m:'orders',n:2,prog:0,got:0}],bonus:0},lastSeen:1100};
const check=(value,base=before)=>assertNewFarmReload(JSON.stringify(base),JSON.stringify(value),window);
test('expected daily initialization and only that change passes at the original strict field equality',()=>check(after));
for(const [name,mutate] of [
 ['coin change',s=>{s.coins++;}],
 ['ownership change',s=>{s.pens.horse.owned=true;}],
 ['pen revision change',s=>{s.layout.animalPens={v:1,revision:1,sites:{}};}],
 ['pen polygon change',s=>{s.layout.animalPens={v:1,revision:0,sites:{horse:{boundary:[{id:'v0',x:1,z:1}]}}};}],
 ['wrong quest day',s=>{s.quests.day='2026-10-23';}],
 ['unknown quest',s=>{s.quests.list[0].m='invented';}],
 ['wrong quest target',s=>{s.quests.list[0].n++;}],
 ['credited quest progress',s=>{s.quests.list[0].prog=1;}],
 ['claimed quest bonus',s=>{s.quests.bonus=1;}],
 ['duplicate quest',s=>{s.quests.list[1].m='harvest';s.quests.list[1].n=12;}],
 ['stale lastSeen',s=>{s.lastSeen=1000;}],
 ['future lastSeen',s=>{s.lastSeen=1111;}],
 ['invalid lastSeen',s=>{s.lastSeen=null;}]
])test('oracle rejects deliberate '+name,()=>{const changed=structuredClone(after);mutate(changed);assert.throws(()=>check(changed));});
