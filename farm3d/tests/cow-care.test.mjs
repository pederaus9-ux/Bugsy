import test from 'node:test';
import assert from 'node:assert/strict';
let M={};try{M=await import('../cow-care.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const pen=(list=[0])=>({owned:true,list:[...list],meta:list.map((_,i)=>({name:'Bessie '+i,love:60,loveAt:1000}))});
test('legacy paid running and ready cows import once without spending feed or losing names',()=>{
 assert.equal(typeof M.ensureCowCare,'function');const p=pen([0,900,2000]);const meta=structuredClone(p.meta),c=M.ensureCowCare(p,1000);
 assert.deepEqual(p.list,[0,0,0]);assert.deepEqual(c.cows.map(b=>b.legacyAt),[null,900,2000]);assert.equal(c.feed,0);assert.deepEqual(p.meta,meta);
 const snapshot=structuredClone(p);assert.deepEqual(M.ensureCowCare(p,1000),snapshot.care);assert.deepEqual(p,snapshot);assert.equal(M.validateCowCare(c),true);
});
test('five identities survive rename, serialized reload and newly purchased cow without reuse',()=>{
 assert.equal(typeof M.ensureCowCare,'function');const p=pen([0,0,0,0]),c=M.ensureCowCare(p,1000),ids=c.cows.map(b=>b.id);p.meta[0].name='Renamed';
 const copy=JSON.parse(JSON.stringify(p));copy.list.push(0);M.ensureCowCare(copy,2000);assert.deepEqual(copy.care.cows.slice(0,4).map(b=>b.id),ids);assert.equal(new Set(copy.care.cows.map(b=>b.id)).size,5);assert.equal(M.validateCowCare(copy.care),true);
});
test('missing pen, invalid timestamp, oversized herd and damaged legacy data remain untouched',()=>{
 assert.equal(typeof M.ensureCowCare,'function');for(const p of [{owned:false,list:[]},pen([0,0,0,0,0,0]),pen([-1]),pen(['paid'])]){const original=structuredClone(p);assert.equal(M.ensureCowCare(p,1000),null);assert.deepEqual(p,original);}
 const p=pen();assert.equal(M.ensureCowCare(p,NaN),null);assert.equal(p.care,undefined);
});
test('future or malformed valuable care is preserved exactly rather than reset',()=>{
 assert.equal(typeof M.ensureCowCare,'function');for(const care of [{v:2,tank:{normal:45,gold:5}},{v:1,feed:29,tank:{normal:45,gold:5}}]){const p={...pen(),care},raw=JSON.stringify(p);assert.equal(M.ensureCowCare(p,1000),null);assert.equal(JSON.stringify(p),raw);}
 const p=pen();M.ensureCowCare(p,1000);for(const mutate of [c=>c.cows.push({...c.cows[0]}),c=>c.tank.normal=51,c=>c.nextId=0,c=>c.queue.push('missing')]){const x=structuredClone(p);mutate(x.care);const raw=JSON.stringify(x);assert.equal(M.ensureCowCare(x,1000),null);assert.equal(JSON.stringify(x),raw);}
});
