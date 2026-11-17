'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{EventEmitter}=require('node:events');
const {createOwnedServerStop,createOfflineTransport,sdkCategory,normalizeA52OfflineTransport,scope,sha}=require('./helpers/a52-offline-transport.cjs');
test('test-only transport inverse retains every original assertion and wait',()=>{
 for(const [file,e]of Object.entries(scope.files)){
  const s=fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8');assert.equal(sha(s),e.afterSha256);assert.equal(normalizeA52OfflineTransport(file,s),e.before);assert.equal(normalizeA52OfflineTransport(file,s+'\n'),s+'\n');
  for(const re of [/assert\.[^;]+;/g,/timeout:\d+/g,/waitForTimeout\([^)]*\)/g])assert.deepEqual(s.match(re),e.before.match(re));
 }
 const s=fs.readFileSync(path.join(__dirname,'browser-harness.cjs'),'utf8');assert(s.includes("if(offlineTransport.active())return offlineTransport.abortExternal(route,url);"));assert(s.indexOf('offlineTransport.abortExternal(route,url)')<s.indexOf('offlineObservation.externalFulfill(sdk)'));assert(s.includes("if (message.type() === 'error') errors.push"));assert(s.includes("errors.push('pageerror: '"));assert(s.includes("serverResponseCount(){return servedResponses;}"));
});
test('owned shutdown closes only tracked server/sockets, verifies closure and is idempotent',async()=>{
 const own=new Set(),foreign=new EventEmitter();foreign.destroy=()=>{throw Error('foreign socket touched');};
 const sock=new EventEmitter();sock.destroy=()=>queueMicrotask(()=>sock.emit('close'));sock.once('close',()=>own.delete(sock));own.add(sock);
 const server={listening:true,closes:0,close(done){this.closes++;this.listening=false;queueMicrotask(()=>done());},closeAllConnections(){this.allClosed=true;}};
 const map=new WeakMap([[server,own]]),stop=createOwnedServerStop(map,()=>Error('closed failure')),p=stop(server);assert.equal(stop(server),p);await p;await stop(server);assert.equal(server.closes,1);assert.equal(own.size,0);assert(server.allClosed);
});
test('shutdown rejects callback failure and never claims closed success',async()=>{
 const server={listening:true,close(done){queueMicrotask(()=>done({code:'EFAIL'}));}},map=new WeakMap([[server,new Set()]]),stop=createOwnedServerStop(map,()=>Error('finite'));
 const t=createOfflineTransport(server,map,stop);await assert.rejects(t.enter(),/finite/);assert.equal(t.snapshot().serverClosed,false);
});
test('offline barrier awaits server closure, rejects external requests without fulfillment',async()=>{
 const server={listening:true},set=new Set(),map=new WeakMap([[server,set]]);let release;
 const t=createOfflineTransport(server,map,()=>new Promise(r=>{release=()=>{server.listening=false;r();};}));const entering=t.enter();assert(t.active());assert.equal(t.snapshot().serverClosed,false);release();await entering;
 const calls=[],route={abort:async reason=>calls.push(reason),fulfill:()=>{throw Error('must not fulfill offline');}};
 for(const name of ['app','auth','firestore']){const url='https://www.gstatic.com/firebasejs/12.19.0/firebase-'+name+'.js';await t.abortExternal(route,url);t.observeFailure(url,'net::ERR_INTERNET_DISCONNECTED');}
 await t.abortExternal(route,'https://private.invalid/SECRET');t.observeFailure('https://private.invalid/SECRET','net::ERR_OTHER');
 assert.deepEqual(calls,Array(4).fill('internetdisconnected'));assert.deepEqual(t.snapshot(),{serverClosed:true,activeOwnedSockets:0,externalAborts:{firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:1},observedDisconnected:{firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:0}});assert(!JSON.stringify(t.snapshot()).includes('SECRET'));
});
test('SDK identities are exact; online failure observation remains empty',async()=>{
 for(const u of ['https://evil.invalid/firebasejs/12.19.0/firebase-app.js','https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js?private','https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js'])assert.equal(sdkCategory(u),'other');
 const s={},m=new WeakMap([[s,new Set()]]),t=createOfflineTransport(s,m,()=>{});t.observeFailure('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js','net::ERR_INTERNET_DISCONNECTED');assert.equal(t.snapshot().observedDisconnected.firebaseApp,0);await assert.rejects(t.abortExternal({},'x'),/while online/);
});
