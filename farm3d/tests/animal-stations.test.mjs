import test from 'node:test';import assert from 'node:assert/strict';let M={};try{M=await import('../animal-stations.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const stations=[{id:'bed1',kind:'bed',approach:[0,0,1],dock:[0,0,0],facing:0},{id:'bed2',kind:'bed',approach:[2,0,1],dock:[2,0,0],facing:0},{id:'water',kind:'drink',approach:[4,0,1],dock:[4,0,0],facing:0}];
test('each animal and station has one stable reservation and occupied capacity cannot be exceeded',()=>{
 assert.equal(typeof M.createStationScheduler,'function');const s=M.createStationScheduler(stations),a=s.request('cow-1','bed'),b=s.request('cow-2','bed');assert(a&&b);assert.notEqual(a.stationId,b.stationId);assert.deepEqual(s.request('cow-1','bed'),a);assert.equal(s.request('cow-3','bed'),null);assert.equal(s.request('cow-1','drink'),null);assert.equal(s.arrive(a),true);assert.equal(s.snapshot().find(t=>t.animalId==='cow-1').arrived,true);
});
test('wrong owner, stale generation and repeated release cannot steal a station',()=>{
 assert.equal(typeof M.createStationScheduler,'function');const s=M.createStationScheduler(stations),a=s.request('cow-1','bed');assert.equal(s.release({...a,animalId:'cow-2'}),false);assert.equal(s.release(a),true);const b=s.request('cow-2','bed');assert.equal(s.release(a),false);assert.equal(s.arrive(a),false);assert.equal(s.snapshot()[0].animalId,'cow-2');assert(b.generation>a.generation);
});
test('snapshot restoration is validated atomically and retains ownership without stale resets',()=>{
 assert.equal(typeof M.createStationScheduler,'function');const s=M.createStationScheduler(stations),a=s.request('cow-1','bed');s.arrive(a);const saved=s.snapshot(),other=M.createStationScheduler(stations);assert.equal(other.restore(saved),true);assert.deepEqual(other.snapshot(),saved);assert.equal(other.restore([...saved,{...saved[0],animalId:'cow-2'}]),false);assert.deepEqual(other.snapshot(),saved);assert.equal(other.release(a),true);assert(other.request('cow-2','bed').generation>a.generation);
});
