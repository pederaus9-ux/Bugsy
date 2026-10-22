// Diagnostic-preserving Farm3D core runner: every original test file and browser probe executes.
import {spawn,execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const cwd=dirname(fileURLToPath(import.meta.url));
const nodeFiles=[
 // Player-editable pen checks supplement every original isolated suite.
 'animal-pen-concave-care.test.mjs','animal-pen-cow-rebind.test.mjs','animal-pen-cow-support.test.mjs','animal-pen-editor-view.test.mjs','animal-pen-editor.test.mjs','animal-pen-geometry.test.mjs','animal-pen-layout.test.mjs','animal-pen-preview.test.mjs','animal-pen-publication.test.mjs','animal-pen-rebind.test.mjs','animal-pen-save.test.mjs','animal-pen-scene-install.test.mjs','animal-pen-scene-registry.test.mjs','animal-pen-scene-routing.test.mjs','animal-pen-validation.test.mjs','animal-pen-world.test.mjs','animal-pen-writer-compatibility.test.mjs','animal-pen-yards.test.mjs',
 'remaining-care-beast.test.mjs','remaining-care-decisions.test.mjs','remaining-care-navigation.test.mjs','remaining-care-layout.test.mjs','remaining-care-pose.test.mjs','remaining-care-yard.test.mjs','remaining-care-controller.test.mjs','remaining-care-integration.test.mjs','north-land.test.mjs','horse-room-land.test.mjs','horse-square.test.mjs','farm-path.test.mjs','seasonal-leaves.test.mjs','animal-stations.test.mjs','cow-yard.test.mjs','cow-room.test.mjs','cow-rest-pose.test.mjs','cow-stations.test.mjs','cow-scene.test.mjs','cow-clearings.test.mjs','cow-controls.test.mjs','cow-ready-action.test.mjs','cow-robot-contact.test.mjs','cow-care.test.mjs','cow-milking.test.mjs','cow-care-integration.test.mjs','cow-writer-compatibility.test.mjs','save-writer-compatibility.test.mjs','utility-lights.test.mjs','decor-models.test.mjs','decor-save.test.mjs','market-sales.test.mjs','seed-target-readiness.test.mjs','cow-test-preset.test.mjs',
 'chicken-stations.test.mjs','chicken-care-controller.test.mjs','chicken-care.test.mjs','chicken-care-integration.test.mjs','chicken-yard.test.mjs','chicken-yard-interaction.test.mjs','seed-selection.test.mjs','perf.test.mjs','cow3d.test.mjs','cow-b17-performance.test.mjs','cow-anatomy.test.mjs',
 'versions.test.mjs','animal-modules.test.mjs','horse-c1-baseline.test.mjs',
 'horse-rebuild.test.mjs','horse-r2-anatomy.test.mjs','horse-evidence-placement.test.mjs','horse-stance-core.test.mjs','horse-locomotion-contract.test.mjs','horse-contact-feasibility.test.mjs','horse-motion-evidence.test.mjs','sheep3d.test.mjs','dog-face.test.mjs','dog-stop-continuity.test.mjs','dog-evidence-placement.test.mjs','cat-visual.test.mjs','cat-stop-continuity.test.mjs','cat-evidence-placement.test.mjs','chicken-coordinated-motion.test.mjs','chicken-start-turn.test.mjs','chicken-stop-continuity.test.mjs','chicken-evidence-placement.test.mjs','live3d.test.mjs','farmer3d.test.mjs',
 'animal-visual.test.mjs','features.test.mjs','sdk.test.mjs','scene-polish.test.mjs',
 'asset-policy.test.mjs','ambient-render-observation.test.mjs'
];
const browserFiles=['regression.browser.cjs','shed-switch.browser.cjs','cow3d.browser.cjs','cow-anatomy.browser.cjs','settings-motion.browser.cjs'];
const group=process.env.FARM3D_CORE_GROUP||'all';
if(!['all','node','browser'].includes(group))throw Error('Unknown core test group: '+group);
const selectedNodes=group==='browser'?[]:nodeFiles,selectedBrowsers=group==='node'?[]:browserFiles;
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
for(const f of selectedNodes){
 if(f==='animal-visual.test.mjs'){
  for(const name of visualNames){
   await run(f+' :: '+name,['--max-old-space-size=2048','--test','--test-concurrency=1','--test-name-pattern='+name,f]);
  }
 }else await run(f,['--test','--test-concurrency=1',f]);
}
for(const f of selectedBrowsers)await run(f,[...(f==='regression.browser.cjs'?['--experimental-vm-modules']:[]),f]);
console.log('[CI-ISOLATION] ALL '+selectedNodes.length+' Node test files and '+selectedBrowsers.length+' browser suites passed (group '+group+').');
