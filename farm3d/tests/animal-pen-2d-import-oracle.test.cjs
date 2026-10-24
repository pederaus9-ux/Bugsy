const test=require('node:test'),assert=require('node:assert/strict');
const {assertImportedFarmReload}=require('./animal-pen-2d-import-oracle.cjs');
const day='2026-10-24',clock={day,reloadStart:1090,reloadEnd:1110};
const before={v:1,coins:845,gems:11,xp:37,level:6,pens:{chicken:{owned:true,list:[0,0,0]}},pets:[{kind:'dog'}],layout:{b:{},t:{}},lastSeen:1000};
const after={...structuredClone(before),lastSeen:1100,lastNag:day};
const check=(value,base=before,window=clock)=>assertImportedFarmReload(JSON.stringify(base),JSON.stringify(value),window);
test('due current-day reminder and only lifecycle timestamp/reminder changes pass',()=>check(after));
test('recent backup retains the exact prior reminder',()=>{const base={...structuredClone(before),lastBackup:1080,lastNag:'2026-10-20'},value={...structuredClone(base),lastSeen:1100};check(value,base);});
for(const [name,mutate] of [
 ['coins',s=>{s.coins++;}],['gems',s=>{s.gems++;}],['xp',s=>{s.xp++;}],
 ['chicken ownership',s=>{s.pens.chicken.owned=false;}],['chicken count',s=>{s.pens.chicken.list.pop();}],
 ['dog ownership',s=>{s.pets=[];}],['layout',s=>{s.layout.animalPens={v:1,revision:1,sites:{}};}],
 ['missing due reminder',s=>{delete s.lastNag;}],['wrong reminder day',s=>{s.lastNag='2026-10-23';}],
 ['stale lastSeen',s=>{s.lastSeen=1000;}],['future lastSeen',s=>{s.lastSeen=1111;}],
 ['invalid lastSeen',s=>{s.lastSeen=null;}]
])test('oracle rejects deliberate '+name,()=>{const changed=structuredClone(after);mutate(changed);assert.throws(()=>check(changed));});
