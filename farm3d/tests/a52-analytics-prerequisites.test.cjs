'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const h=require('./helpers/a52-ordinary-progress.cjs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('prerequisites project only fixed booleans and capped queue length',()=>{
 const r=h.reportSummary({rows:[],orders:1,stored:JSON.stringify({queue:Array(300).fill({secret:'PRIVATE'})}),prerequisites:{online:false,fbPresent:true,setDocCallable:true,docCallable:true,raw:'PRIVATE'}});
 assert(h.validSummary(r));assert.deepEqual(r.prerequisites,{online:false,fbPresent:true,setDocCallable:true,docCallable:true,queueObserved:true,queueCount:255});assert(!JSON.stringify(r).includes('PRIVATE'));
 for(const patch of [{queueCount:256},{queueCount:1,queueObserved:false},{online:'private'},{secret:'private'}])assert(!h.validPrerequisites({...r.prerequisites,...patch}));
 assert.deepEqual(h.reportSummary({stored:'INVALID'}).prerequisites,{online:false,fbPresent:false,setDocCallable:false,docCallable:false,queueObserved:false,queueCount:0});
});
test('only snapshot fields added; original assertions actions timeouts untouched',()=>{
 const raw=fs.readFileSync(require.resolve('./fixtures/a52-analytics-prerequisites-scope.json'));assert.equal(sha(raw),'b4f15baf54b615b458f6e69b6a1a3a874fbf5d214422dbc26e128bcef72b9808');const r=JSON.parse(raw);
 for(const [f,e] of Object.entries(r.files)){let s=fs.readFileSync(path.join(__dirname,f),'utf8');new vm.Script(s);assert.equal(sha(s),e.afterSha256);assert.equal(sha(e.before),e.beforeSha256);if(e.edits){for(const d of [...e.edits].reverse()){assert.equal(s.split(d.after).length,2);s=s.replace(d.after,d.before);}assert.equal(s,e.before);}}
});
