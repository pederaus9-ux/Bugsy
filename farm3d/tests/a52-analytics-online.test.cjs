'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'fixtures/a52-analytics-online-scope.json'));
assert.equal(sha(raw),'d540c42d07b74434d3ac07f893a61857f07e19ff33d3e5267c366c8d03ac31b1');
const scope=JSON.parse(raw),source=fs.readFileSync(path.join(__dirname,'analytics.browser.cjs'),'utf8');
test('only explicit mocked online fixture added: exact original actions/assertions restored',()=>{
 new vm.Script(source);assert.equal(sha(source),scope.postimageSha256);let before=source;
 for(const e of [...scope.edits].reverse()){assert.equal(before.split(e.new).length,2);before=before.replace(e.new,e.old);}
 assert.equal(sha(before),scope.sourceSha256);
 assert.equal((source.match(/Object.defineProperty\(navigator,'onLine'/g)||[]).length,1);
 assert(source.indexOf(scope.edits[0].new)>source.indexOf('for(const sandbox of [false,true])'));
});
test('online mock only runs for nonsandbox case and touches only navigator online getter',async()=>{
 const line=scope.edits[0].new.split('\n').find(x=>x.includes('if(!sandbox)'));
 for(const sandbox of [false,true]){
  const navigator={existing:42},calls=[];
  const context=vm.createContext({navigator,sandbox,p:{addInitScript:fn=>{calls.push('init');fn();return Promise.resolve();}}});
  await new vm.Script('(async()=>{'+line+'})()').runInContext(context);
  assert.equal(calls.length,sandbox?0:1);assert.equal(navigator.existing,42);
  assert.equal(navigator.onLine,sandbox?undefined:true);
  assert.deepEqual(Object.keys(navigator),['existing']);
 }
});
