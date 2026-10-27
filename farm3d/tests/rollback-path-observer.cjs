// External observer for the immutable historical native journey. It never edits
// the tested source, changes assertions, or persists child output/save contents.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');

const historicalSource = '0d0542bf93e4e010b5543e81a40fae4bca2dd5f9';
const nativeHash = '2c977d52463be77e27856994221fe4bdf6082d3c3f5a406c7d317834293f2b7d';
const phases = new Set(['setup', 'selection', 'plant', 'plant-reload', 'harvest', 'harvest-reload']);
const statuses = new Set(['RUNNING', 'PASS', 'FAIL']);
const errorTypes = new Set(['Error', 'AssertionError', 'TypeError', 'RangeError', 'SyntaxError', 'TimeoutError']);
const signals = new Set(['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGABRT']);
const boundedInteger = (value, max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
function sanitizeResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !statuses.has(value.status)) return {valid:false};
  const result = {valid:true, status:value.status};
  if (Array.isArray(value.steps) && value.steps.length <= 5) result.completedStepCount = value.steps.length;
  if (Array.isArray(value.events) && value.events.length <= 96) {
    result.eventCount = value.events.length;
    result.phasesObserved = [...new Set(value.events.map(event => event?.phase).filter(phase => phases.has(phase)))];
  }
  if (phases.has(value.firstFailingPhase)) result.firstFailingPhase = value.firstFailingPhase;
  if (errorTypes.has(value.errorType)) result.errorType = value.errorType;
  if (typeof value.disposable === 'boolean') result.disposable = value.disposable;
  if (typeof value.cloudBlocked === 'boolean') result.cloudBlocked = value.cloudBlocked;
  return result;
}
function controls() {
  let count = 0;
  const check = fn => {fn(); count++;};
  check(() => assert.deepEqual(sanitizeResult(null), {valid:false}));
  check(() => assert.deepEqual(sanitizeResult([]), {valid:false}));
  check(() => assert.deepEqual(sanitizeResult({status:'SECRET'}), {valid:false}));
  check(() => assert.equal(sanitizeResult({status:'PASS',steps:['a','b']}).completedStepCount,2));
  check(() => assert.equal(sanitizeResult({status:'PASS',steps:Array(6)}).completedStepCount,undefined));
  check(() => assert.equal(sanitizeResult({status:'FAIL',firstFailingPhase:'selection'}).firstFailingPhase,'selection'));
  check(() => assert.equal(sanitizeResult({status:'FAIL',firstFailingPhase:'secret'}).firstFailingPhase,undefined));
  check(() => assert.equal(sanitizeResult({status:'FAIL',errorType:'AssertionError'}).errorType,'AssertionError'));
  check(() => assert.equal(sanitizeResult({status:'FAIL',errorType:'secret'}).errorType,undefined));
  check(() => assert.equal(sanitizeResult({status:'PASS',events:Array(97)}).eventCount,undefined));
  check(() => assert.deepEqual(sanitizeResult({status:'PASS',events:[{phase:'setup'},{phase:'secret'},{phase:'setup'},{phase:'plant'}]}).phasesObserved,['setup','plant']));
  check(() => assert.equal(sanitizeResult({status:'PASS',disposable:'secret'}).disposable,undefined));
  check(() => assert(!JSON.stringify(sanitizeResult({status:'FAIL',steps:['secret'],events:[{url:'secret'}],save:'secret',request:'secret'})).includes('secret')));
  console.log(JSON.stringify({observerControlsPassed:count, nativeExecuted:false}));
}
async function main() {
  const root = process.cwd();
  const target = path.join(root, 'farm3d/tests/plot-support.browser.cjs');
  const receiptPath = path.resolve(process.env.OBSERVER_RECEIPT || path.join(root,'artifacts/field/diagnostic/native-observer.json'));
  const resultPath = path.resolve(process.env.TEST_ARTIFACTS || path.join(root,'artifacts/field/native'), 'result.json');
  const start = performance.now();
  const receipt = {schema:1, historicalSource, nativeHash, status:'STARTING', rawOutputPersisted:false, hardDeadlineUploadGuaranteed:false, observations:[]};
  const candidate = process.env.DIAGNOSTIC_SOURCE;
  if (/^[0-9a-f]{40}$/.test(candidate || '')) receipt.diagnosticSource = candidate;
  fs.mkdirSync(path.dirname(receiptPath), {recursive:true});
  const save = () => fs.writeFileSync(receiptPath, JSON.stringify(receipt,null,2)+'\n');
  const observe = (event, fields = {}) => {
    if (receipt.observations.length < 128) receipt.observations.push({event, elapsedMs:Math.round(performance.now()-start), ...fields});
    save();
  };
  save();
  const nativeHashMatches=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')===nativeHash;
  const priorResultExists=fs.existsSync(resultPath);
  if (!nativeHashMatches || priorResultExists) {
    receipt.status='REFUSED';observe('preconditionRefused',{nativeHashMatches,priorResultExists});process.exitCode=1;return;
  }
  let last = '', child, finished = false;
  const sample = () => {
    try {
      const stat=fs.statSync(resultPath);
      if (!stat.isFile() || stat.size>65536) {if(last!=='invalid'){last='invalid';observe('resultRejected');}return;}
      const safe=sanitizeResult(JSON.parse(fs.readFileSync(resultPath,'utf8'))), encoded=JSON.stringify(safe);
      if(encoded!==last){last=encoded;observe('resultObserved',safe);}
    } catch (error) {
      // File absence or a concurrent partial write is not an assertion outcome.
      if(error.code!=='ENOENT' && !(error instanceof SyntaxError) && last!=='unreadable'){last='unreadable';observe('resultUnreadable');}
    }
  };
  receipt.status='RUNNING';observe('nativeChildStart');
  child=spawn(process.execPath,[target],{cwd:root,env:process.env,stdio:'ignore',windowsHide:true});
  const poll=setInterval(sample,250);poll.unref();
  const onSignal = signal => {
    if(finished)return;
    sample();receipt.status='INTERRUPTED';observe('observerSignal',{signal});
    child.kill(signal);process.exitCode=1;
  };
  const sigint=()=>onSignal('SIGINT'),sigterm=()=>onSignal('SIGTERM');
  process.on('SIGINT',sigint);process.on('SIGTERM',sigterm);
  const outcome=await new Promise(resolve=>{
    child.once('error',()=>resolve({spawnError:true}));
    child.once('exit',(code,signal)=>resolve({code,signal}));
  });
  finished=true;clearInterval(poll);sample();
  process.removeListener('SIGINT',sigint);process.removeListener('SIGTERM',sigterm);
  receipt.status=outcome.spawnError?'SPAWN_ERROR':outcome.code===0&&!outcome.signal?'EXIT_ZERO':'EXIT_NONZERO';
  const safeExit={};
  if(boundedInteger(outcome.code,255))safeExit.exitCode=outcome.code;
  if(signals.has(outcome.signal))safeExit.signal=outcome.signal;
  if(outcome.spawnError)safeExit.spawnError=true;
  observe('nativeChildEnd',safeExit);
  process.exitCode=outcome.code===0&&!outcome.signal&&!outcome.spawnError?0:1;
  console.log(JSON.stringify({observerStatus:receipt.status,resultObserved:receipt.observations.some(row=>row.event==='resultObserved')}));
}
module.exports={sanitizeResult};
if(require.main===module){
  if(process.argv.includes('--controls'))controls();
  else main().catch(()=>{console.error('Native observer stopped before a complete lifecycle receipt');process.exitCode=1;});
}
