'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createOfflineTransport}=require('./helpers/a52-offline-transport.cjs');
const {diagnosticText}=require('./helpers/playwright-diagnostics.cjs');
const {normalizeA52OfflineConsole,scope,sha}=require('./helpers/a52-offline-console.cjs');
const exact='Failed to load resource: net::ERR_INTERNET_DISCONNECTED';
test('console scope exact inverse preserves predecessors and rejects altered bytes',()=>{for(const [f,e]of Object.entries(scope.files)){const s=fs.readFileSync(path.resolve(__dirname,'../..',f),'utf8');assert.equal(sha(s),e.afterSha256);assert.equal(normalizeA52OfflineConsole(f,s),e.before);assert.equal(normalizeA52OfflineConsole(f,s+' '),s+' ');}});
test('only exact offline SDK console with prior matching abort is expected; all lookalikes retained',async()=>{
 const server={listening:true},map=new WeakMap([[server,new Set()]]),t=createOfflineTransport(server,map,async()=>{server.listening=false;});
 const url='https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
 assert.equal(t.observeConsole(exact,url),false);await t.enter();assert.equal(t.observeConsole(exact,url),false);
 const route={abort:async()=>{}};
 for(const name of ['app','auth','firestore']){const u='https://www.gstatic.com/firebasejs/12.19.0/firebase-'+name+'.js';await t.abortExternal(route,u);t.observeFailure(u,'net::ERR_INTERNET_DISCONNECTED');assert.equal(t.observeConsole(exact,u),true);assert.equal(t.observeConsole(exact,u),false);}
 for(const u of ['',undefined,url+'?CANARY',url+'#CANARY',url.replace('www.gstatic.com','evil.invalid'),url.replace('12.19.0','12.18.0')])assert.equal(t.observeConsole(exact,u),false);
 for(const msg of [exact+' CANARY',' '+exact,exact.toLowerCase(),'net::ERR_INTERNET_DISCONNECTED'])assert.equal(t.observeConsole(msg,url),false);
 assert.deepEqual(t.snapshot().expectedConsole,{firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:0});assert(!JSON.stringify(t.snapshot()).includes('CANARY'));
 assert.equal(diagnosticText(exact),exact);assert.notEqual(diagnosticText(exact+' CANARY'),exact);assert(!diagnosticText(exact+' CANARY').includes('CANARY'));
});
test('fresh abort quota cannot mask wrong text or wrong SDK URL rejection',async()=>{
 const url='https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
 const cases=[
  ...[exact+' CANARY',' '+exact,exact.toLowerCase(),'net::ERR_INTERNET_DISCONNECTED'].map(text=>[text,url]),
  ...['',undefined,url+'?CANARY',url+'#CANARY',url.replace('www.gstatic.com','evil.invalid'),url.replace('12.19.0','12.18.0'),url.replace('firebase-app.js','firebase-auth.js')].map(u=>[exact,u])
 ];
 for(const [text,u]of cases){
  const server={listening:true},map=new WeakMap([[server,new Set()]]),t=createOfflineTransport(server,map,async()=>{server.listening=false;});
  await t.enter();await t.abortExternal({abort:async()=>{}},url);
  assert.equal(t.observeConsole(text,u),false,'Lookalike rejected with quota available');
  assert.deepEqual(t.snapshot().expectedConsole,{firebaseApp:0,firebaseAuth:0,firebaseFirestore:0,other:0});
  assert.equal(t.observeConsole(exact,url),true,'Valid event still consumes the untouched quota');
  assert.deepEqual(t.snapshot().expectedConsole,{firebaseApp:1,firebaseAuth:0,firebaseFirestore:0,other:0});
 }
});
