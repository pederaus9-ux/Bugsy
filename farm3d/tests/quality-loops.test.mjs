import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as runner from './quality-loops.mjs';
import {compareReports,parseOptions,summarize,validateManifest,runCommand,finalizeRunnerError,campaignStatus,loadBaselineDirectory} from './quality-loops.mjs';
// Keep capture-integrity controls in the existing hosted tooling command. The
// actual rendered gallery remains explicit opt-in and needs a browser executor.
import './visual-review-capture.test.cjs';
import './hosted-browser-receipts.test.mjs';

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

// Case registration is evaluated without running callbacks. The original matrix,
// names and scenario count are the coverage oracle, not a duplicate fixture list.
test('horse partition covers every original registered case exactly once without changing its source', async()=>{
  const vm=await import('node:vm');
  const {scenarios}=await import('./horse-contact-scenarios.mjs');
  const manifest=JSON.parse(fs.readFileSync(path.join(here,'quality-loops.json'),'utf8'));
  const names=[];
  const register=(name,callback)=>{assert.equal(typeof callback,'function');names.push(name);};
  register.after=()=>{};
  const original=fs.readFileSync(path.join(here,'horse-contact-feasibility.test.mjs'),'utf8');
  const registrationSource=original.replace(/^import .*;\r?$/gm,'').replaceAll('import.meta.url',JSON.stringify('file:///registration-only.mjs'));
  vm.runInNewContext(registrationSource,{test:register,scenarios},{timeout:1000});
  assert.equal(names.length,9);
  assert.deepEqual(manifest.horseContactCases?.map(c=>c.name),names);
  assert.deepEqual(manifest.horseContactCases.map(c=>c.measurements),[312,312,56,7,0,8,32,18,0]);
  assert.equal(manifest.lanes.find(l=>l.id==='horse').timeoutSeconds,180);
});

test('partition expansion retains four visual patterns and exactly nine anchored horse cases',()=>{
  assert.equal(typeof runner.expandFileSteps,'function');
  const m=JSON.parse(fs.readFileSync(path.join(here,'quality-loops.json'),'utf8'));
  const steps=runner.expandFileSteps(m,'horse-contact-feasibility.test.mjs');
  assert.equal(steps.length,9);
  for(const step of steps){
    const matches=m.horseContactCases.filter(c=>new RegExp(step.pattern).test(c.name));
    assert.deepEqual(matches.map(c=>c.name),[step.caseName]);
    assert.equal(new RegExp(step.pattern).test(step.caseName+' extra'),false);
  }
  assert.equal(runner.expandFileSteps(m,'animal-visual.test.mjs').length,4);
  assert.deepEqual(runner.expandFileSteps(m,'plain.test.mjs'),[{file:'plain.test.mjs'}]);
});
test('partition validation fails closed for added original checks, missing or duplicate cases',()=>{
  assert.equal(typeof runner.validateHorseCases,'function');
  const m=JSON.parse(fs.readFileSync(path.join(here,'quality-loops.json'),'utf8'));
  runner.validateHorseCases(m,here);
  for(const mutate of [x=>x.horseContactCases.pop(),x=>x.horseContactCases[1]=x.horseContactCases[0],x=>x.horseContactCases[0].measurements=-1,x=>delete x.horseContactSources]){
    const changed=structuredClone(m);mutate(changed);assert.throws(()=>runner.validateHorseCases(changed,here));
  }
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'horse-partition-source-'));
  try{
    for(const name of ['horse-contact-feasibility.test.mjs','horse-contact-scenarios.mjs'])fs.copyFileSync(path.join(here,name),path.join(temp,name));
    runner.validateHorseCases(m,temp);
    fs.appendFileSync(path.join(temp,'horse-contact-feasibility.test.mjs'),"\ntest('new check',()=>{});\n");
    assert.throws(()=>runner.validateHorseCases(m,temp),/source.*changed/i);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('isolated case receipts require one non-skipped original test and preserve each after-hook artifact',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'horse-partition-run-'));
  const parentTestContext=process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT; // These are separate CLI children, not nested node:test runs.
  try{
    fs.mkdirSync(path.join(temp,'artifacts'));
    const generated=path.join(temp,'artifacts/horse-contact-feasibility.json');
    fs.writeFileSync(generated,'{"preserved":"previous run"}\n');
    const old=fs.readFileSync(generated,'utf8');
    fs.writeFileSync(path.join(temp,'fixture.test.mjs'),`import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const rows=[];
test('first (case)',()=>{rows.push({scenario:'first',violations:[]});assert.equal(1,1);});
test('second case',()=>{rows.push({scenario:'second',violations:[]});assert.equal(2,2);});
test.after(()=>fs.writeFileSync(new URL('./artifacts/horse-contact-feasibility.json',import.meta.url),JSON.stringify(rows)));\n`);
    for(const [i,name] of ['first (case)','second case','no matching case'].entries()){
      const pattern='^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$';
      const artifactDir=path.join(temp,'receipt-'+i);
      const result=await runCommand(['--test','--test-reporter=tap','--test-name-pattern='+pattern,'fixture.test.mjs'],{cwd:temp,log:path.join(temp,'receipt-'+i+'.log'),artifacts:artifactDir,timeoutMs:10000,caseDefinition:{name,measurements:1}});
      assert.equal(result.status,i<2?'passed':'failed',JSON.stringify(result)+'\n'+fs.readFileSync(path.join(temp,'receipt-'+i+'.log'),'utf8'));
      assert.equal(fs.readFileSync(generated,'utf8'),old,'pre-existing artifact must survive');
      if(i<2){
        assert.equal(result.matchedTests,1);
        assert.equal(result.measurements,1);
        assert.match(result.evidenceSha256,/^[a-f0-9]{64}$/);
        assert.equal(JSON.parse(fs.readFileSync(path.join(artifactDir,'horse-contact-feasibility.json')))[0].scenario,i===0?'first':'second');
      }else assert.match(result.evidenceError,/matched|test receipt/i);
    }
    // A successful process cannot inherit an earlier artifact as fresh proof.
    fs.writeFileSync(path.join(temp,'empty.test.mjs'),"import test from 'node:test';test('empty',()=>{});\n");
    const missing=await runCommand(['--test','--test-reporter=tap','empty.test.mjs'],{cwd:temp,log:path.join(temp,'empty.log'),artifacts:path.join(temp,'empty'),timeoutMs:10000,caseDefinition:{name:'empty',measurements:0}});
    assert.equal(missing.status,'failed');assert.match(missing.evidenceError,/artifact/i);
    assert.equal(fs.readFileSync(generated,'utf8'),old);
  }finally{if(parentTestContext!==undefined)process.env.NODE_TEST_CONTEXT=parentTestContext;fs.rmSync(temp,{recursive:true,force:true});}
});
test('TAP receipt guard rejects zero matches, skipped, todo, duplicate, truncated and wrong-name output',()=>{
  assert.equal(typeof runner.inspectCaseTap,'function');
  const valid='TAP version 13\n# Subtest: original\nok 1 - original\n1..1\n# tests 1\n# suites 0\n# pass 1\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
  assert.equal(runner.inspectCaseTap(valid,'original'),1);
  for(const bad of [valid.replace('# pass 1','# pass 0'),valid.replace('# skipped 0','# skipped 1'),valid.replace('# todo 0','# todo 1'),valid+'ok 2 - original\n',valid.replace('ok 1 - original','ok 1 - other'),valid.replace('# tests 1','# tests 0'),valid.replace('# cancelled 0','# cancelled 1'),'TAP version 13\n',valid.replace('ok 1 - original','ok 1 - original # SKIP')])assert.throws(()=>runner.inspectCaseTap(bad,'original'));
});
