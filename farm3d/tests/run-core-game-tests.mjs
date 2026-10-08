// Diagnostic-preserving Farm3D core runner: every original test file and browser probe executes.
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const cwd=dirname(fileURLToPath(import.meta.url));
const nodeFiles=[
 'perf.test.mjs','cow3d.test.mjs','cow-b17-performance.test.mjs','cow-anatomy.test.mjs',
 'versions.test.mjs','animal-modules.test.mjs','horse-c1-baseline.test.mjs',
 'horse-rebuild.test.mjs','horse-stance-core.test.mjs','horse-locomotion-contract.test.mjs','sheep3d.test.mjs','live3d.test.mjs','farmer3d.test.mjs',
 'animal-visual.test.mjs','features.test.mjs','sdk.test.mjs','scene-polish.test.mjs',
 'asset-policy.test.mjs'
];
const browserFiles=['regression.browser.cjs','shed-switch.browser.cjs','cow3d.browser.cjs','cow-anatomy.browser.cjs'];
let active=null;
function memorySnapshot(){
 let cgroup='unknown';
 try{
  const used=Number(readFileSync('/sys/fs/cgroup/memory.current','utf8').trim());
  const max=readFileSync('/sys/fs/cgroup/memory.max','utf8').trim();
  cgroup=(used/1048576).toFixed(0)+' MiB / '+(max==='max'?'unlimited':(Number(max)/1048576).toFixed(0)+' MiB');
 }catch{}
 let top='';
 try{top=execFileSync('ps',['-eo','pid,ppid,rss,etime,comm','--sort=-rss'],{encoding:'utf8',timeout:2000}).split('\n').slice(0,7).join(' | ');}
 catch{}
 return 'cgroup='+cgroup+'; processes='+top;
}
for(const signal of ['SIGINT','SIGTERM']){
 process.on(signal,()=>{console.error('[CI-ISOLATION] Received '+signal+' while executing '+(active?.name??'none'));active?.process.kill(signal);process.exitCode=1;});
}
async function run(name,args){
 const t0=Date.now();
 console.log('[CI-ISOLATION] START '+name+' '+new Date().toISOString());
 const child=spawn(process.execPath,args,{cwd,stdio:'inherit',env:process.env});
 active={name,process:child};
 const heartbeat=setInterval(()=>console.log('[CI-ISOLATION] RUNNING '+name+' elapsed='+((Date.now()-t0)/1000).toFixed(0)+'s '+memorySnapshot()),10000);
 heartbeat.unref();
 let result;
 try{
  result=await new Promise((resolve,reject)=>{
   child.once('error',reject);
   child.once('exit',(code,signal)=>resolve({code,signal}));
  });
 }finally{clearInterval(heartbeat);active=null;}
 console.log('[CI-ISOLATION] END '+name+' code='+result.code+' signal='+result.signal+' elapsed='+((Date.now()-t0)/1000).toFixed(1)+'s');
 if(result.code!==0 || result.signal)process.exit(result.code||1);
}
// Run each heavyweight animal-visual assertion as an isolated process. Preserve all four checks.
const visualNames=[
 'all six have an exposed',
 'six species keep flat feet',
 'new rigs preserve distance cadence',
 'actual shin geometry reaches'
];
for(const f of nodeFiles){
 if(f==='animal-visual.test.mjs'){
  for(const name of visualNames){
   await run(f+' :: '+name,['--max-old-space-size=2048','--test','--test-concurrency=1','--test-name-pattern='+name,f]);
  }
 }else await run(f,['--test','--test-concurrency=1',f]);
}
for(const f of browserFiles)await run(f,[...(f==='regression.browser.cjs'?['--experimental-vm-modules']:[]),f]);
console.log('[CI-ISOLATION] ALL 18 Node test files and 4 browser suites passed.');
