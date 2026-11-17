'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const helper=require('./helpers/a52-ordinary-progress.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('every diagnostic insertion reverses to exact frozen source',()=>{
 const receipt=JSON.parse(fs.readFileSync(require.resolve('./fixtures/a52-authanalytics-progress-scope.json')));
 for(const [file,e]of Object.entries(receipt.files)){
  let current=fs.readFileSync(path.join(__dirname,file),'utf8');new vm.Script(current);assert.equal(sha(current),e.afterSha256);assert.equal(sha(e.before),e.beforeSha256);
  for(const a of [...e.additions].reverse()){assert.equal(current.split(a.after).length,2);current=current.replace(a.after,a.before);}
  assert.equal(current,e.before);
 }
});
test('fixed schema rejects raw source strings and unknown phase labels',()=>{
 const good={schema:1,test:'analytics',phase:'game-metrics',viewport:7,status:'running',category:'none'};assert(helper.valid(good));
 for(const patch of [{test:'secret'},{phase:'private'},{viewport:9},{category:'private'},{raw:'private'}])assert(!helper.valid({...good,...patch}));
});
test('failure taxonomy does not read raw message or stack',()=>{
 const e={name:'TimeoutError',get message(){throw Error('must not read');},get stack(){throw Error('must not read');}};assert.equal(helper.category(e),'timeout');
 assert.equal(helper.category(new assert.AssertionError({message:'private'})),'assertion');assert.equal(helper.category({name:'TargetClosedError'}),'browser-operation');assert.equal(helper.category(Error('private')),'other');
});
test('finite writer uses only fixed job path and no error payload',()=>{
 const root=fs.mkdtempSync('/tmp/a52-progress-test-'),prior=process.env.RUNNER_TEMP;process.env.RUNNER_TEMP=root;
 try{const p=helper.createProgress('authored-hands');p.mark('source-sentinel',1);p.fail(Error('PRIVATE_CANARY'));const data=fs.readFileSync(path.join(root,'a52-ci-safe/authored-hands/diagnostic.json'),'utf8');assert(!data.includes('PRIVATE_CANARY'));assert(helper.valid(JSON.parse(data)));}finally{if(prior===undefined)delete process.env.RUNNER_TEMP;else process.env.RUNNER_TEMP=prior;}
});
