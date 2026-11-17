'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),h=require('./helpers/a52-walk-phase.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('sample classification and observation exact inverse preserve every original action assertion deadline',()=>{
 const raw=fs.readFileSync(path.join(__dirname,'fixtures/a52-walk-mismatch-scope.json'));assert.equal(sha(raw),'76c498e6983388f923545fdb4a7e72c240b43b855b7b5f2f8bc1fcc73c6c6896');const scope=JSON.parse(raw);
 for(const [f,e]of Object.entries(scope.files)){let s=fs.readFileSync(path.join(__dirname,'../..',f),'utf8');new vm.Script(s);assert.equal(sha(s),e.afterSha256);for(const d of [...e.edits].reverse()){assert.equal(s.split(d.new).length,2);s=s.replace(d.new,d.old);}assert.equal(s,e.before);assert.equal(sha(s),e.beforeSha256);}
});
test('finite stride counters discard poses and arbitrary data',()=>{
 const rows=[{phase:.1,walkPhase:.1,speedClass:'low'},{phase:.1,walkPhase:.2,speedClass:'low'},{phase:.2,walkPhase:.3,speedClass:'moving'},{phase:NaN,walkPhase:1,speedClass:'SECRET',raw:'PRIVATE'}];
 assert.deepEqual(h.summarizeStride(rows),{samples:4,mismatches:3,lowSpeed:1,moving:1,unknown:1});
 const s=h.summarizeStride(Array(400).fill(rows[1]));assert.deepEqual(s,{samples:255,mismatches:255,lowSpeed:255,moving:0,unknown:0});assert(h.validStride(s));
 for(const patch of [{raw:'PRIVATE'},{samples:256},{lowSpeed:-1},{mismatches:0},{moving:'1'}])assert(!h.validStride({...s,...patch}));
 assert(!h.validProjection({schema:1,checkpoint:16,state:'entered',error:null,cleanup:'not_observed',cleanupError:null,stride:s}));
 assert(h.validProjection({schema:1,checkpoint:22,state:'failed',error:'assertion',cleanup:'completed',cleanupError:null,stride:s}));
});
