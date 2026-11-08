import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compareReports,parseOptions,summarize,validateManifest,runCommand,finalizeRunnerError,campaignStatus,loadBaselineDirectory} from './quality-loops.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
test('bounded CLI rejects unbounded work and arbitrary options',()=>{
  assert.equal(parseOptions([]).repeat,1);
  for(const args of [['--repeat','0'],['--repeat','4'],['--repeat','1.5'],['--budget-minutes','61'],['--budget-minutes','NaN'],['--lanes'],['--command','rm']]) assert.throws(()=>parseOptions(args));
  assert.throws(()=>parseOptions(['--baseline','a','--baseline-directory','b']));
});
test('status never treats empty, blocked, timed-out or incomplete work as passed',()=>{
  assert.equal(summarize([]),'pending');
  for(const status of ['blocked','timed_out','failed','interrupted','running','pending']) assert.notEqual(summarize([{status:'passed'},{status}]),'passed');
  assert.equal(summarize([{status:'passed'}]),'passed');
});
test('comparison preserves regressions and fixes, rejects changed manifest and unrun baseline',()=>{
  const identity={manifestHash:'a',testFingerprint:'t',runnerFingerprint:'r',node:'v22',platform:'linux',hardware:'same-host'};
  const before={...identity,lanes:[{id:'x',status:'passed'},{id:'y',status:'failed'},{id:'z',status:'blocked'}]};
  const after={...identity,lanes:[{id:'x',status:'failed'},{id:'y',status:'passed'},{id:'z',status:'passed'}]};
  assert.deepEqual(compareReports(before,after),{regressions:['x'],fixes:['y'],unchanged:[],notComparable:['z'],durationIsGamePerformance:false});
  assert.deepEqual(compareReports({...before,manifestHash:'b'},after).regressions,[]);
  assert.ok(compareReports(null,after).notComparable.length);
  assert.deepEqual(compareReports({...before,node:'v24'},after).fixes,[]);
  assert.deepEqual(compareReports({...before,testFingerprint:'changed'},after).fixes,[]);
  const browser=compareReports({...identity,lanes:[{id:'b',kind:'browser',status:'failed'}]},{...identity,lanes:[{id:'b',kind:'browser',status:'passed'}]});
  assert.deepEqual(browser.fixes,[]);assert.ok(browser.notComparable.length);
  assert.deepEqual(compareReports(before,before).unchanged,['x','y']);
});
test('downloaded baseline loads only a complete confined report and rejects traversal',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sunny-baseline-read-'));
  try{
    assert.equal(loadBaselineDirectory(root).status,'unavailable');
    const id='prior-run';fs.mkdirSync(path.join(root,id));
    fs.writeFileSync(path.join(root,'latest.json'),JSON.stringify({id}));
    const report={id,status:'passed',head:'a'.repeat(40),lanes:[{id:'scope',status:'passed'}]};
    fs.writeFileSync(path.join(root,id,'report.json'),JSON.stringify(report));
    assert.deepEqual(loadBaselineDirectory(root).report,report);
    const expected={headSha:report.head,runId:'123',artifactId:'456'};
    assert.equal(loadBaselineDirectory(root,expected).sourceRunId,'123');
    assert.equal(loadBaselineDirectory(root,expected).artifactId,'456');
    assert.equal(loadBaselineDirectory(root,{...expected,headSha:'b'.repeat(40)}).status,'unavailable');
    assert.equal(loadBaselineDirectory(root,{headSha:report.head}).status,'unavailable');
    fs.writeFileSync(path.join(root,id,'report.json'),JSON.stringify({...report,status:'running'}));
    assert.equal(loadBaselineDirectory(root).status,'unavailable');
    fs.writeFileSync(path.join(root,'latest.json'),JSON.stringify({id:'../outside'}));
    assert.equal(loadBaselineDirectory(root).status,'unavailable');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('runner exception finalization retains failures and blocks unfinished work',()=>{
  const report={status:'running',lanes:[{status:'running',steps:[{status:'passed'},{status:'failed'},{status:'running'},{status:'pending'}]}]};
  finalizeRunnerError(report,'disk failure');
  assert.equal(report.status,'blocked');assert.ok(report.finishedAt);
  assert.deepEqual(report.lanes[0].steps.map(s=>s.status),['passed','failed','blocked','blocked']);
  assert.equal(report.lanes[0].status,'failed');
});
test('campaign cannot pass incomplete repetitions and retains a failed iteration',()=>{
  assert.equal(campaignStatus({completed:1,requested:3,failed:false}),'incomplete');
  assert.equal(campaignStatus({completed:1,requested:3,failed:true}),'failed');
  assert.equal(campaignStatus({completed:3,requested:3,failed:false}),'passed');
  assert.equal(campaignStatus({completed:0,requested:1,interrupted:true}),'interrupted');
});
test('manifest includes every original core Node file and all four isolated visual checks',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(here,'quality-loops.json'),'utf8'));
  validateManifest(manifest);
  const original=fs.readFileSync(path.join(here,'run-core-game-tests.mjs'),'utf8');
  const core=[...original.match(/const nodeFiles=\[([\s\S]*?)\];/)[1].matchAll(/'([^']+\.test\.[mc]js)'/g)].map(m=>m[1]);
  const selected=manifest.lanes.filter(l=>l.kind==='node').flatMap(l=>l.files);
  assert.equal(new Set(selected).size,selected.length);
  for(const file of core)assert.ok(selected.includes(file),file);
  assert.equal(new Set(manifest.visualPatterns).size,4);
  for(const pattern of manifest.visualPatterns)assert.ok(original.includes("'"+pattern+"'"));
  assert.ok(manifest.lanes.filter(l=>l.kind==='browser').every(l=>l.defaultEnabled===false));
});
test('manifest rejects traversal and duplicate lanes',()=>{
  const visualPatterns=['one','two','three','four'];
  const lane={id:'test',kind:'node',timeoutSeconds:1,files:['../secret.test.mjs']};
  assert.throws(()=>validateManifest({visualPatterns,lanes:[lane]}));
  lane.files=['quality-loops.test.mjs'];
  assert.throws(()=>validateManifest({visualPatterns,lanes:[lane,lane]}));
  lane.files=['regression.browser.cjs'];
  assert.throws(()=>validateManifest({visualPatterns,lanes:[lane]}),/browser opt-in/);
  assert.throws(()=>validateManifest({visualPatterns:['a','a','b','c'],lanes:[]}),/unique/);
});
test('process wrapper preserves successful/failed logs and kills bounded timeout',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sunny-quality-loop-test-'));
  try{
    for(const [name,source,status,timeoutMs] of [['pass','console.log("receipt")','passed',10000],['fail','process.exitCode=7','failed',10000],['slow','setInterval(()=>{},1000)','timed_out',100]]){
      fs.writeFileSync(path.join(temp,name+'.cjs'),source);
      const log=path.join(temp,name+'.log');
      const result=await runCommand([name+'.cjs'],{cwd:temp,log,artifacts:path.join(temp,name),timeoutMs});
      assert.equal(result.status,status);
      assert.ok(fs.readFileSync(log,'utf8').includes('COMMAND: node'));
      if(name==='fail')assert.equal(result.code,7);
      if(name==='pass')assert.ok(fs.readFileSync(log,'utf8').includes('receipt'));
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
