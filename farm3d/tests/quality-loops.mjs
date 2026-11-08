import {spawn, execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {HORSE_CONTACT_FILE,expandFileSteps,validateHorseCases,prepareCaseArtifacts,validateCaseEvidence} from './quality-loop-cases.mjs';
export {expandFileSteps,validateHorseCases,inspectCaseTap} from './quality-loop-cases.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const hash = value => createHash('sha256').update(value).digest('hex');
const terminalBad = new Set(['failed', 'timed_out', 'blocked', 'interrupted']);
export function finalizeRunnerError(report, message) {
  if(report?.status!=='running')return;
  report.status='blocked';report.finishedAt=new Date().toISOString();report.runnerError=message;
  for(const lane of report.lanes){for(const step of lane.steps){if(['pending','running'].includes(step.status)){step.status='blocked';step.reason='Runner error: '+message;}}lane.status=summarize(lane.steps);}
}
export function campaignStatus({interrupted,completed,requested,failed}) {
  return interrupted?'interrupted':failed?'failed':completed<requested?'incomplete':'passed';
}
export function summarize(steps) {
  if (steps.some(s => s.status === 'interrupted')) return 'interrupted';
  if (steps.some(s => s.status === 'timed_out')) return 'timed_out';
  if (steps.some(s => s.status === 'failed')) return 'failed';
  if (steps.some(s => s.status === 'blocked')) return 'blocked';
  if (steps.some(s => s.status === 'running')) return 'running';
  return steps.length && steps.every(s => s.status === 'passed') ? 'passed' : 'pending';
}
export function compareReports(previous, current) {
  const result = {regressions: [], fixes: [], unchanged: [], notComparable: [], durationIsGamePerformance: false};
  if (!previous) { result.notComparable.push('No baseline selected'); return result; }
  if (previous.manifestHash !== current.manifestHash) {
    result.notComparable.push('Test manifest changed; refusing pass/fail comparison'); return result;
  }
  for (const key of ['testFingerprint','runnerFingerprint','node','platform','hardware']) {
    if (!previous[key] || previous[key] !== current[key]) result.notComparable.push('Incompatible or missing ' + key);
  }
  if (result.notComparable.length) return result;
  const prior = new Map(previous.lanes.map(l => [l.id, l]));
  for (const lane of current.lanes) {
    const before = prior.get(lane.id);
    if (lane.kind === 'browser') {result.notComparable.push(lane.id + ': rendered measurement identity must be reviewed separately');continue;}
    if (!before || !['passed', 'failed'].includes(before.status) || !['passed', 'failed'].includes(lane.status)) {
      result.notComparable.push(lane.id); continue;
    }
    if (before.status === 'passed' && lane.status === 'failed') result.regressions.push(lane.id);
    if (before.status === 'failed' && lane.status === 'passed') result.fixes.push(lane.id);
    if (before.status === lane.status) result.unchanged.push(lane.id);
  }
  return result;
}
export function parseOptions(args) {
  const opts = {lanes: null, repeat: 1, budgetMinutes: 30, includeBrowser: false, baseline: null, baselineDirectory: null, output: path.join(here, 'artifacts/quality-loops'), list: false};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--list') opts.list = true;
    else if (key === '--include-browser') opts.includeBrowser = true;
    else if (['--lanes','--repeat','--budget-minutes','--baseline','--baseline-directory','--output'].includes(key)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw Error('Missing value for ' + key);
      if (key === '--lanes') opts.lanes = value.split(',');
      if (key === '--repeat') opts.repeat = Number(value);
      if (key === '--budget-minutes') opts.budgetMinutes = Number(value);
      if (key === '--baseline') opts.baseline = path.resolve(value);
      if (key === '--baseline-directory') opts.baselineDirectory = path.resolve(value);
      if (key === '--output') opts.output = path.resolve(value);
    } else throw Error('Unknown option ' + key);
  }
  if (!Number.isInteger(opts.repeat) || opts.repeat < 1 || opts.repeat > 3) throw Error('Repeat must be 1..3');
  if (opts.baseline && opts.baselineDirectory) throw Error('Select baseline file or directory, not both');
  if (!Number.isFinite(opts.budgetMinutes) || opts.budgetMinutes <= 0 || opts.budgetMinutes > 60) throw Error('Budget must be >0 and <=60 minutes');
  return opts;
}
export function loadBaselineDirectory(directory, expected = {}) {
  if(!directory)return {report:null,status:'not_selected',reason:'No baseline directory selected'};
  try{
    const root=path.resolve(directory);
    const safeRead=relative=>{
      let current=root;
      if(fs.lstatSync(current).isSymbolicLink())throw Error('Linked baseline root');
      for(const part of relative.split('/')){if(!/^[A-Za-z0-9_.-]+$/.test(part) || part==='.' || part==='..')throw Error('Unsafe baseline path');current=path.join(current,part);if(fs.lstatSync(current).isSymbolicLink())throw Error('Linked baseline path');}
      const real=fs.realpathSync(current),realRoot=fs.realpathSync(root);
      if(!real.startsWith(realRoot+path.sep))throw Error('Baseline path escapes root');
      const stat=fs.statSync(real);if(!stat.isFile() || stat.size>8*1024*1024)throw Error('Invalid baseline file');
      return JSON.parse(fs.readFileSync(real,'utf8'));
    };
    const latest=safeRead('latest.json');
    if(typeof latest.id!=='string' || !/^[A-Za-z0-9_-]+$/.test(latest.id))throw Error('Invalid baseline run id');
    const report=safeRead(latest.id+'/report.json');
    if(report.id!==latest.id || !Array.isArray(report.lanes) || !['passed','failed'].includes(report.status))throw Error('Incomplete or invalid baseline report');
    const ids=new Set();for(const lane of report.lanes){if(!lane || typeof lane.id!=='string' || ids.has(lane.id))throw Error('Invalid baseline lanes');ids.add(lane.id);}
    const hasExpected=Object.values(expected).some(Boolean);
    if(hasExpected && (!/^[a-f0-9]{40}$/.test(expected.headSha || '') || !/^[1-9]\d*$/.test(expected.runId || '') || !/^[1-9]\d*$/.test(expected.artifactId || '')))throw Error('Invalid expected baseline provenance');
    if(hasExpected && report.head!==expected.headSha)throw Error('Baseline head does not match selected artifact source');
    return {report,status:'loaded',id:report.id,head:report.head,...(hasExpected?{sourceRunId:expected.runId,artifactId:expected.artifactId}:{})};
  }catch(error){return {report:null,status:'unavailable',reason:error.code==='ENOENT'?'No downloaded baseline available':'Baseline rejected: '+error.message};}
}
function git(args) {
  return execFileSync('git', args, {cwd:repo, encoding:'utf8', maxBuffer:16*1024*1024, windowsHide:true}).trim();
}
export function validateManifest(manifest, testRoot = here) {
  if (!Array.isArray(manifest.visualPatterns) || manifest.visualPatterns.length !== 4 || new Set(manifest.visualPatterns).size !== 4 || manifest.visualPatterns.some(p=>typeof p!=='string' || !p)) throw Error('Exactly four unique visual patterns required');
  if(manifest.lanes.some(lane=>lane.files.includes(HORSE_CONTACT_FILE)))validateHorseCases(manifest,testRoot);
  const ids = new Set();
  for (const lane of manifest.lanes) {
    if (!/^[a-z0-9-]+$/.test(lane.id) || ids.has(lane.id)) throw Error('Invalid/duplicate lane id');
    ids.add(lane.id);
    if (!['node','browser'].includes(lane.kind) || !lane.files.length) throw Error('Invalid lane');
    if (!Number.isFinite(lane.timeoutSeconds) || lane.timeoutSeconds < 1 || lane.timeoutSeconds > 1200) throw Error('Invalid timeout');
    for (const file of lane.files) {
      if (!/^[a-z0-9-]+\.(test\.mjs|test\.cjs|browser\.cjs)$/.test(file)) throw Error('Unsafe file: ' + file);
      if ((lane.kind === 'browser') !== file.endsWith('.browser.cjs')) throw Error('File kind bypasses browser opt-in: ' + file);
      if (!fs.existsSync(path.join(testRoot,file))) throw Error('Missing file: ' + file);
    }
  }
}
function testFingerprint(manifest) {
  const files=new Set(manifest.lanes.flatMap(l=>l.files));
  const excluded=new Set(['artifacts','evidence','node_modules','.git']);
  const walk=relative=>{for(const entry of fs.readdirSync(path.join(here,relative),{withFileTypes:true})){const p=path.join(relative,entry.name);if(entry.isDirectory() && !excluded.has(entry.name))walk(p);else if(entry.isFile() && /\.(?:json|[mc]?js|html|css)$/.test(entry.name))files.add(p);}};
  walk('');
  return hash([...files].sort().map(file=>file+':'+hash(fs.readFileSync(path.join(here,file)))).join('\n'));
}
function atomicJson(file, value) {
  const tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value,null,2) + '\n');
  fs.renameSync(tmp, file);
}
function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true,timeout:5000}); } catch { child.kill('SIGKILL'); }
  } else {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); }
  }
}
export async function runCommand(args, {cwd, log, artifacts, timeoutMs, caseDefinition, onChild = () => {}}) {
  const started = Date.now();
  fs.mkdirSync(path.dirname(log), {recursive:true});
  fs.mkdirSync(artifacts, {recursive:true});
  const fd = fs.openSync(log, 'wx');
  fs.writeSync(fd, 'COMMAND: node ' + args.join(' ') + '\nSTART: ' + new Date().toISOString() + '\n');
  let child, timedOut = false, capture;
  try {
    if(caseDefinition)capture=prepareCaseArtifacts(cwd,artifacts);
    child = spawn(process.execPath, args, {cwd, shell:false, windowsHide:true, detached:process.platform !== 'win32', stdio:['ignore',fd,fd], env:{...process.env,TEST_ARTIFACTS:artifacts,PERF_ARTIFACTS:artifacts}});
    onChild(child);
    const timer = setTimeout(() => {timedOut = true; stopChild(child);}, timeoutMs);
    const outcome = await new Promise(resolve => {
      child.once('error', error => resolve({code:null,signal:null,error:error.message}));
      child.once('close', (code,signal) => resolve({code,signal}));
    });
    clearTimeout(timer);
    const status = timedOut ? 'timed_out' : outcome.error ? 'blocked' : outcome.code === 0 ? 'passed' : 'failed';
    const result={...outcome,status,durationMs:Date.now()-started};
    if(capture){
      try{
        const evidence=capture();
        Object.assign(result,{evidenceFile:evidence.evidenceFile,evidenceSha256:evidence.evidenceSha256,measurements:evidence.measurements});
        if(result.status==='passed')Object.assign(result,validateCaseEvidence(fs.readFileSync(log,'utf8'),caseDefinition,evidence));
      }catch(error){result.evidenceError=error.message;if(result.status==='passed')result.status='failed';}
    }
    return result;
  } finally {
    try{capture?.();}finally{onChild(null);fs.closeSync(fd);}
  }
}
export async function main(args = process.argv.slice(2)) {
  const opts = parseOptions(args);
  const raw = fs.readFileSync(path.join(here,'quality-loops.json'),'utf8');
  const manifest = JSON.parse(raw); validateManifest(manifest);
  if (opts.list) { console.log(manifest.coverage); for (const l of manifest.lanes) console.log(l.id + ': ' + l.files.length + ' ' + l.kind + ' files' + (l.kind === 'browser' ? ' [opt-in]' : '')); return 0; }
  const selected = opts.lanes || manifest.lanes.filter(l=>l.kind==='node').map(l=>l.id);
  for (const id of selected) if (!manifest.lanes.some(l=>l.id===id)) throw Error('Unknown lane ' + id);
  const baselineInput=opts.baseline?{report:JSON.parse(fs.readFileSync(opts.baseline,'utf8')),status:'explicit_file'}:loadBaselineDirectory(opts.baselineDirectory,{headSha:process.env.QUALITY_BASELINE_HEAD,runId:process.env.QUALITY_BASELINE_RUN,artifactId:process.env.QUALITY_BASELINE_ARTIFACT});
  const baseline=baselineInput.report;
  fs.mkdirSync(opts.output,{recursive:true});
  const lockPath=path.join(opts.output,'.run.lock');
  let lock;
  try { lock=fs.openSync(lockPath,'wx'); fs.writeSync(lock,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})); }
  catch { throw Error('Another run owns this output folder, or its previous lock remains. Inspect the recorded PID before removing a stale lock.'); }
  let active=null, interrupted=false;
  const onSignal=()=>{interrupted=true;stopChild(active);};
  process.on('SIGINT',onSignal); process.on('SIGTERM',onSignal);
  const deadline=Date.now()+opts.budgetMinutes*60000;
  let code=0, completedIterations=0, currentReport=null, saveCurrent=null;
  const campaign={pid:process.pid,startedAt:new Date().toISOString(),requestedIterations:opts.repeat,completedIterations:0,status:'running',runIds:[]};
  const campaignPath=path.join(opts.output,'campaign-'+Date.now()+'-'+process.pid+'.json');
  try {
    atomicJson(campaignPath,campaign);
    for(let iteration=1;iteration<=opts.repeat;iteration++) {
      if(interrupted || Date.now()>=deadline) {code=1;break;}
      const head=git(['rev-parse','HEAD']), branch=git(['branch','--show-current']);
      const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+head.slice(0,8)+'-'+iteration;
      const folder=path.join(opts.output,id); fs.mkdirSync(folder);
      const sourceStatus=git(['status','--porcelain']);
      const report={schemaVersion:1,id,status:'running',startedAt:new Date().toISOString(),finishedAt:null,head,branch,dirty:!!sourceStatus,sourceStatus,manifestHash:hash(raw),testFingerprint:testFingerprint(manifest),runnerFingerprint:hash(fs.readFileSync(fileURLToPath(import.meta.url))),runtimeTree:git(['rev-parse','HEAD:farm3d']),node:process.version,platform:process.platform,hardware:os.cpus()[0]?.model,executionContext:process.env.GITHUB_ACTIONS==='true'?'GitHub Actions':'local',iteration,budgetMinutes:opts.budgetMinutes,scope:manifest.coverage,notQualification:['No autonomous code changes or merges','Does not replace existing required hosted CI gates','Not owner visual acceptance','Not physical phone performance','No recurring schedule installed'],lanes:[],comparison:null};
      report.baseline={...baselineInput,report:undefined};
      currentReport=report;campaign.runIds.push(id);
      for(const lane of manifest.lanes.filter(l=>selected.includes(l.id))) {
        report.lanes.push({...lane,status:'pending',steps:lane.files.flatMap(file=>expandFileSteps(manifest,file).map(step=>({...step,status:'pending'})))});
      }
      const save=()=>{atomicJson(path.join(folder,'report.json'),report);atomicJson(path.join(opts.output,'latest.json'),{id});}; saveCurrent=save;save();
      console.log('RUN '+id+' | '+folder);
      for(const lane of report.lanes) {
        if(lane.kind==='browser' && !opts.includeBrowser) {
          lane.status='blocked'; lane.reason='Browser lane requires explicit --include-browser and a qualified local browser setup; no test ran.';
          lane.steps.forEach(s=>{s.status='blocked';s.reason=lane.reason;}); save(); continue;
        }
        lane.status='running'; save();
        for(let index=0;index<lane.steps.length;index++) {
          const step=lane.steps[index];
          if(interrupted || Date.now()>=deadline) {step.status=interrupted?'interrupted':'blocked';step.reason=interrupted?'Run interrupted':'Total run budget exhausted; not executed';save();continue;}
          const leaf=String(index+1).padStart(3,'0')+'-'+step.file;
          step.log=[id,lane.id,leaf+'.log'].join('/');
          step.artifacts=[id,lane.id,leaf+'-artifacts'].join('/');
          step.status='running'; step.startedAt=new Date().toISOString(); save();
          console.log('START '+lane.id+' / '+step.file+(step.pattern?' / '+step.pattern:''));
          const nodeArgs=lane.kind==='node'?['--max-old-space-size=2048','--test','--test-concurrency=1',...(step.caseName?['--test-reporter=tap']:[]),...(step.pattern?['--test-name-pattern='+step.pattern]:[]),step.file]:[...(step.file==='regression.browser.cjs'?['--experimental-vm-modules']:[]),step.file];
          Object.assign(step,await runCommand(nodeArgs,{cwd:here,log:path.join(opts.output,step.log),artifacts:path.join(opts.output,step.artifacts),caseDefinition:step.caseName?{name:step.caseName,measurements:step.expectedMeasurements}:undefined,timeoutMs:Math.min(lane.timeoutSeconds*1000,Math.max(1,deadline-Date.now())),onChild:child=>{active=child;}}));
          if(interrupted) step.status='interrupted';
          step.finishedAt=new Date().toISOString(); save();
          console.log(step.status.toUpperCase()+' '+step.file+' '+(step.durationMs/1000).toFixed(1)+'s');
        }
        lane.status=summarize(lane.steps); save();
      }
      report.status=summarize(report.lanes);
      report.finishedAt=new Date().toISOString(); report.comparison=compareReports(baseline,report); save();
      completedIterations++;campaign.completedIterations=completedIterations;atomicJson(campaignPath,campaign);
      console.log('RESULT '+report.status+' | '+path.join(folder,'report.json'));
      if(terminalBad.has(report.status)) {code=1;break;}
    }
    campaign.status=campaignStatus({interrupted,completed:completedIterations,requested:opts.repeat,failed:code!==0 && currentReport && terminalBad.has(currentReport.status)});
    if(completedIterations<opts.repeat)code=1;
    campaign.finishedAt=new Date().toISOString();atomicJson(campaignPath,campaign);
  } catch(error) {
    if(currentReport?.status==='running') {
      finalizeRunnerError(currentReport,error.message);
      try{saveCurrent?.();}catch{/* A failing disk cannot guarantee a final receipt. */}
    }
    campaign.status='blocked';campaign.error=error.message;campaign.finishedAt=new Date().toISOString();
    try{atomicJson(campaignPath,campaign);}catch{}
    throw error;
  } finally {
    stopChild(active);process.off('SIGINT',onSignal);process.off('SIGTERM',onSignal);
    fs.closeSync(lock);fs.unlinkSync(lockPath);
  }
  return interrupted?130:code;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().then(code=>{process.exitCode=code;}).catch(error=>{console.error(error.message);process.exitCode=1;});
