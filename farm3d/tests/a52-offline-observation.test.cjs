'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');
const {createOfflineObservation,normalizeA52OfflineObservation,scope,sha}=require('./helpers/a52-offline-observation.cjs');
test('exact passive probe preserves all original assertions/actions/deadlines',()=>{
 assert.deepEqual(Object.keys(scope.files),['farm3d/tests/browser-harness.cjs','farm3d/tests/a52-installed-ui-cache.browser.cjs']);
 for(const [file,e] of Object.entries(scope.files)){
  const s=fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8');assert.equal(sha(s),e.afterSha256);assert.equal(sha(normalizeA52OfflineObservation(file,s)),e.beforeSha256);assert.equal(normalizeA52OfflineObservation(file,s+'\n'),s+'\n');
  for(const regex of [/assert\.[^;]+;/g,/timeout:\d+/g,/await [^;]+/g]){
   // Remove only the explicitly additive passive observation from awaited statement text.
   const clean=s.replace('h.beginOfflineObservation();','');assert.deepEqual(clean.match(regex),e.before.match(regex));
  }
 }
});
test('response tracking is finite, passive, phase-aware and waits for actual finish',()=>{
 const p=createOfflineObservation(),before=new EventEmitter(),after=new EventEmitter(),other=new EventEmitter();
 p.localRequest({url:'/farm3d/sw.js?PRIVATE_CANARY'},before);p.externalFulfill(true);p.begin();
 p.localRequest({url:'/farm3d/index.html?PRIVATE_CANARY'},after);p.localRequest({url:'/PRIVATE_CANARY'},other);
 assert.deepEqual(p.snapshot(),{localResponses:[],externalFulfillCalls:{firebaseSdk:0,other:0}});
 before.emit('finish');before.emit('finish');after.emit('finish');other.emit('close');p.externalFulfill(true);p.externalFulfill(true);p.externalFulfill(true);p.externalFulfill(false);
 assert.deepEqual(p.snapshot(),{localResponses:[{category:'worker-script',beganBeforeOffline:true,count:1},{category:'app-asset',beganBeforeOffline:false,count:1}],externalFulfillCalls:{firebaseSdk:3,other:1}});
 const snapshot=p.snapshot();snapshot.localResponses[0].count=999;snapshot.externalFulfillCalls.firebaseSdk=999;assert.equal(p.snapshot().localResponses[0].count,1);assert.equal(p.snapshot().externalFulfillCalls.firebaseSdk,3);assert(!JSON.stringify(p.snapshot()).includes('PRIVATE_CANARY'));
});
test('category cardinality is bounded at six and arbitrary URLs are not retained',()=>{
 const p=createOfflineObservation();for(let phase=0;phase<2;phase++){
 const responses=[];for(let i=0;i<50;i++){const r=new EventEmitter();responses.push(r);p.localRequest({url:i%3===0?'/farm3d/sw.js?'+i:i%3===1?'/farm3d/'+i:'/private/'+i},r);}p.begin();for(const r of responses)r.emit('finish');
 }assert(p.snapshot().localResponses.length<=6);
});
