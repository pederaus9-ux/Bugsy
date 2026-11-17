'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {normalize:normalizePrerequisites}=require('./helpers/a52-analytics-prerequisites-scope.cjs');
const h=require('./helpers/a52-ordinary-progress.cjs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('finite summary projects fixed counts and schema only',()=>{
 const r=h.reportSummary({orders:1,stored:'PRIVATE_STORAGE',rows:[{data:{e:'a_open_0',d:'PRIVATE_DATE'}},{data:{e:'a_harv_0',d:'PRIVATE_DATE'}}]});
 assert.deepEqual(r,{prerequisites:{online:false,fbPresent:false,setDocCallable:false,docCallable:false,queueObserved:false,queueCount:0},ordersAtLeastOne:true,storedPresent:true,rows:2,counts:{open:1,harv:1,ord:0,sess:0},payloadSchema:true});assert(h.validSummary(r));assert(!JSON.stringify(r).includes('PRIVATE'));
 for(const patch of [{rows:256},{rows:NaN},{raw:'private'},{counts:{open:1,harv:1,ord:0,sess:0,secret:2}}])assert(!h.validSummary({...r,...patch}));
 const many=h.reportSummary({rows:Array(300).fill({data:{e:'_sess_',d:''}})});assert.equal(many.rows,255);assert.equal(many.counts.sess,255);
});
test('summary allowed only in analytics real-game/sandbox fixed contexts',()=>{
 const good={schema:1,test:'analytics',phase:'game-report-kind-open',viewport:7,status:'running',category:'none',reports:h.reportSummary({rows:[],orders:0,stored:null})};assert(h.valid(good));
 assert(!h.valid({...good,viewport:1}));assert(!h.valid({...good,test:'authored-hands'}));assert(!h.valid({...good,phase:'private'}));assert(!h.valid({...good,reports:{...good.reports,secret:'private'}}));
});
test('all original assertions actions and deadlines are exact reversible source',()=>{
 const raw=fs.readFileSync(require.resolve('./fixtures/a52-analytics-report-scope.json'));assert.equal(sha(raw),'bbe49f9163a10faf452cc8a5ef4f4d0430b61611400868b4902035d93cd87e1f');const r=JSON.parse(raw);
 for(const [f,e]of Object.entries(r.files)){let s=normalizePrerequisites(f,fs.readFileSync(path.join(__dirname,f),'utf8'));new vm.Script(s);assert.equal(sha(s),e.afterSha256);assert.equal(sha(e.before),e.beforeSha256);if(e.edits){for(const edit of [...e.edits].reverse()){assert.equal(s.split(edit.after).length,2);s=s.replace(edit.after,edit.before);}assert.equal(s,e.before);}}
});
