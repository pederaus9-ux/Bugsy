'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{EventEmitter}=require('node:events');
const {normalizeA52InstalledCounter,scope,sha}=require('./helpers/a52-installed-counter-scope.cjs');
const {normalizeA52Diagnostics,scope:diagnostics}=require('./helpers/a52-diagnostics-scope.cjs');
const file='farm3d/tests/browser-harness.cjs',read=()=>fs.readFileSync(path.resolve(__dirname,'../..',file));
test('exact counter inverse precedes diagnostic inverse without weakening either receipt',()=>{
 assert.deepEqual(Object.keys(scope.files),[file]);const current=read(),e=scope.files[file];assert.equal(sha(current),e.afterSha256);
 const before=normalizeA52InstalledCounter(file,current);assert.equal(sha(before),e.beforeSha256);assert.equal(sha(before),diagnostics.files[file].afterSha256);
 assert.equal(sha(normalizeA52Diagnostics(file,before)),diagnostics.files[file].beforeSha256);
 new vm.Script(current.toString());
 for(const bad of [Buffer.concat([current,Buffer.from('\n')]),Buffer.from(current.toString().replace('servedResponses++','servedResponses+=2'))])assert.equal(normalizeA52InstalledCounter(file,bad),bad);
});
test('actual counter counts completed responses once, not requests, without retaining metadata',()=>{
 const s=read().toString(),match=s.match(/  let servedResponses=0;[\s\S]*?(?=  const sockets=)/);assert(match);
 assert.equal(match[0],"  let servedResponses=0;\n  server.on('request',(_req,res)=>res.once('finish',()=>{servedResponses++;}));\n");
 const server=new EventEmitter(),count=vm.runInNewContext(match[0]+'\n(()=>servedResponses)',{server});
 const req=new Proxy({},{get(){throw Error('Request metadata accessed');}}),a=new EventEmitter(),b=new EventEmitter();
 server.emit('request',req,a);server.emit('request',req,b);assert.equal(count(),0);a.emit('finish');assert.equal(count(),1);a.emit('finish');assert.equal(count(),1);b.emit('close');assert.equal(count(),1);b.emit('finish');assert.equal(count(),2);
 assert(s.includes('serverResponseCount(){return servedResponses;}'));
});
