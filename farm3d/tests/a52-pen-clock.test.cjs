'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const h=require('./helpers/a52-pen-clock.cjs'),root=path.resolve(__dirname,'../..'),head='a'.repeat(40),{baseReceipt}=require('./helpers/ci-isolated-runner.cjs');
test('overlay has exact reviewed source hashes and original predicate inverse',()=>{const m=h.overlay(root);assert(m.size===15);assert(h.scope.runtimePaths.low1.length===127);assert(h.scope.runtimePaths.high1.length===127);const text=m.get('farm3d/tests/animal-pen-three-night-extra-classes.browser.cjs').toString();assert(!text.includes('start({ref:'));});
function fixture(t){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-pen-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));const dest=path.join(temp,'pen-clock-runtime');fs.mkdirSync(dest);const entries=h.scope.runtimePaths.low1.map(f=>{const b=Buffer.from('fixture:'+f),p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);return '100644 blob '+h.blob(b)+'\t'+f;});for(const [f,b]of h.overlay(root)){const p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}fs.writeFileSync(path.join(dest,'.git'),'fixture only');const git=(r,a)=>a[0]==='ls-tree'?entries.join('\0')+'\0':a[1]==='HEAD'?r===root?head:h.REFS.low1:h.REFS.low1;const proof=h.checkSnapshot(root,dest,'low1',git);fs.mkdirSync(path.join(temp,'a52-pen-clock-proof'));fs.writeFileSync(path.join(temp,'a52-pen-clock-proof/before.json'),JSON.stringify(proof));const source=path.join(temp,'a52-ci-safe/pen_cache');fs.mkdirSync(source,{recursive:true});const receipt={...baseReceipt('command_failed'),isolationVerified:true,commandStarted:true,commandResultAvailable:true,cleanupVerified:true,exitCode:1};fs.writeFileSync(path.join(source,'step-6.json'),JSON.stringify(receipt));return{temp,dest,git,proof,source,receipt};}
test('positive before/after covers every runtime and only exact overlay',t=>{const f=fixture(t);assert(h.validProof(f.proof,'low1'));assert.equal(h.collect(root,f.temp,'low1',head,f.git),4);const id=JSON.parse(fs.readFileSync(path.join(f.temp,'a52-pen-clock-public/identity.json')));assert.equal(id.runtimeSource,h.REFS.low1);assert.equal(id.testSource,head);assert.equal(id.mode,'CONTROLLED_PREOWNERSHIP_CLOCK_DIAGNOSTIC');});
for(const mode of ['runtime','missing','extra','overlay','symlink','badHead','badCleanup','unstarted','raw','proof'])test('fails closed '+mode,t=>{const f=fixture(t),p=path.join(f.dest,'farm3d/index.html');if(mode==='runtime')fs.writeFileSync(p,'changed');if(mode==='missing')fs.unlinkSync(p);if(mode==='extra')fs.writeFileSync(path.join(f.dest,'untracked.js'),'private');if(mode==='overlay')fs.appendFileSync(path.join(f.dest,'farm3d/tests/browser-harness.cjs'),'changed');if(mode==='symlink'){fs.unlinkSync(p);fs.symlinkSync('/tmp',p);}if(mode==='badHead')f.git=()=> 'b'.repeat(40);if(mode==='raw')fs.writeFileSync(path.join(f.source,'raw.log'),'PRIVATE');if(mode==='proof')fs.writeFileSync(path.join(f.temp,'a52-pen-clock-proof/before.json'),'{}');if(mode==='badCleanup'||mode==='unstarted'){f.receipt[mode==='badCleanup'?'cleanupVerified':'commandStarted']=false;fs.writeFileSync(path.join(f.source,'step-6.json'),JSON.stringify(f.receipt));}assert.throws(()=>h.collect(root,f.temp,'low1',head,f.git));assert(!fs.existsSync(path.join(f.temp,'a52-pen-clock-public')));});
test('setup witness bounded and writes once outside runtime',t=>{const f=fixture(t),v={seedWitness:{value:1,calls:200},clockExperiment:sampleClockProof(),setupBefore:{clock:6.941699999999997,rngCalls:184,state:sampleState()},setupAfter:{clock:6.941699999999997,rngCalls:200,state:sampleState()},setupCounts:sampleCounts()};assert(h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(!h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(h.validSetup(JSON.parse(fs.readFileSync(path.join(f.source,'setup.json')))));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:Infinity}));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:3,raw:'PRIVATE'}));});
test('real synthetic sparse worktree materializes exact named files without runtime refs',t=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-worktree-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const repo=path.join(tmp,'repo'),dest=path.join(tmp,'work');fs.mkdirSync(repo);const g=(cwd,args,input)=>cp.execFileSync('git',args,{cwd,input,stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH,HOME:tmp,GIT_CONFIG_NOSYSTEM:'1'}});g(repo,['init']);for(const [f,b]of [['root.txt','held'],['farm3d/index.html','synthetic'],['farm3d/art/x.png','synthetic asset'],['farm3d/tests/evidence/held.zip','held']]){const p=path.join(repo,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}g(repo,['add','.']);g(repo,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','synthetic']);g(repo,['worktree','add','--detach','--no-checkout',dest,'HEAD']);g(dest,['sparse-checkout','init','--no-cone']);g(dest,['sparse-checkout','set','--no-cone','--stdin'],'/farm3d/index.html\n/farm3d/art/x.png\n');g(dest,['read-tree','-mu','HEAD']);assert.deepEqual(h.allFiles(dest),['.git','farm3d/art/x.png','farm3d/index.html']);});

test('all literal local requires and dirname fixture reads exist in exact overlay',()=>{
 const m=h.overlay(root);
 for(const [file,b]of m){if(!file.endsWith('.cjs')||file.endsWith('/a52-pen-clock.cjs'))continue;const text=b.toString();
  for(const re of [/require\(['"](\.[^'"]+)['"]\)/g,/path\.join\(__dirname,\s*['"]([^'"]+)['"]\)/g]){
   for(const match of text.matchAll(re)){if(!/\.(?:cjs|json)$/.test(match[1]))continue;const rel=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));assert(m.has(rel),'Missing inert dependency '+rel);}
  }
 }
});

test('exact overlay initializes harness with mocked Playwright and no browser',t=>{
 const f=fixture(t),out=path.join(f.temp,'outside-artifacts');
 const script=`const Module=require('node:module');const orig=Module._load;Module._load=function(id,...args){if(id==='inert-playwright')return {chromium:{launch(){throw Error('Browser forbidden')}}};return orig.call(this,id,...args)};const h=require(process.argv[1]);if(typeof h.start!=='function')throw Error('No harness');`;
 cp.execFileSync(process.execPath,['-e',script,path.join(f.dest,'farm3d/tests/browser-harness.cjs')],{env:{PATH:process.env.PATH,PLAYWRIGHT_MODULE:'inert-playwright',TEST_ARTIFACTS:out},stdio:'pipe'});
 assert(fs.statSync(out).isDirectory());
});

test('literal recursive runtime dependency closure rejects missing static/dynamic/resource files',()=>{
 const files=new Map([['farm3d/index.html',Buffer.from('<script type="module" src="a.js"></script><img src="./p.png">')],['farm3d/a.js',Buffer.from("import './b.js'; import('./c.js');")],['farm3d/b.js',Buffer.from("export {x} from './c.js';")],['farm3d/c.js',Buffer.from('export const x=1;')],['farm3d/p.png',Buffer.from('image')]]);
 assert.equal(h.validateRuntimeClosure(files),4);
 for(const key of ['farm3d/a.js','farm3d/b.js','farm3d/c.js','farm3d/p.png']){const copy=new Map(files);copy.delete(key);assert.throws(()=>h.validateRuntimeClosure(copy));}
});
const reportHelper=require('./helpers/a52-pen-report.cjs');
function sampleSettling(){return{clock:500,total:1,truncated:false,animals:[{kind:'cow',index:1,position:[0,-39.7],task:'bed',stage:'approach',weight:0,routeCount:1,route:[[1,-35]],waypointCount:0,stuckTime:0,progressAt:null,replanAt:null,avoidSide:1,spaceUntil:499}]};}
test('exact full herd deadline classified without broad error copying',()=>{
 assert.equal(reportHelper.category('Error: Cycle 3 full herd did not settle by original 500-second deadline'),'night-deadline');
 assert.equal(reportHelper.category('Error: Cycle 3 did not settle by original 500-second deadline'),'night-deadline');
 assert.equal(reportHelper.category('PRIVATE Cycle 3 full herd did not settle by original 500-second deadline'),'other');
});
test('settling witness finite allowlist rejects excess, labels and nonfinite values',()=>{
 const w=sampleSettling();assert(reportHelper.validSettling(w));
 for(const change of [v=>v.raw='PRIVATE',v=>v.animals[0].name='PRIVATE',v=>v.animals[0].position[0]=Infinity,v=>v.total=47,v=>v.animals[0].task='PRIVATE',v=>v.animals[0].route.push([0,0]),v=>v.animals[0].routeCount=5000,v=>v.animals[0].avoidSide=3]){const v=structuredClone(w);change(v);assert(!reportHelper.validSettling(v));}
 const four={...w,total:7,truncated:true,animals:Array.from({length:4},(_,index)=>({...w.animals[0],index}))};assert(reportHelper.validSettling(four));four.animals.push({...w.animals[0],index:4});assert(!reportHelper.validSettling(four));
});
test('failure-only settling projection exports no arbitrary report fields',()=>{
 const r={case:{editClass:'gate',seed:1,rateHz:120,nights:3},cycles:[{},{}],stage:'cycle 3 night',status:'FAIL',error:'Error: Cycle 3 full herd did not settle by original 500-second deadline',failureState:{settling:sampleSettling(),private:'PRIVATE'}};
 const v=reportHelper.project(r);assert.equal(v.category,'night-deadline');assert.deepEqual(v.settling,r.failureState.settling);assert(!JSON.stringify(v).includes('PRIVATE'));assert(reportHelper.validProjection(v));assert(!reportHelper.validProjection({...v,status:'RUNNING',category:'none'}));
});
test('setup fingerprint is deterministic, mechanics-sensitive and validated before hashing',()=>{
 const a=sampleState();assert.equal(h.setupStateHash(a),h.setupStateHash([...a].reverse()));const b=structuredClone(a);b[0].until+=.1;assert.notEqual(h.setupStateHash(a),h.setupStateHash(b));b[0].name='PRIVATE';assert.throws(()=>h.setupStateHash(b));const c=structuredClone(a);c[0].position[0]=Infinity;assert.throws(()=>h.setupStateHash(c));
});
test('setup export contains only bounded counts, clocks and checksums',t=>{
 const f=fixture(t),state=sampleState();assert(h.writeSetup({seedWitness:{value:1},clockExperiment:sampleClockProof(),setupBefore:{clock:6.941699999999997,rngCalls:184,state},setupAfter:{clock:6.941699999999997,rngCalls:484,state},setupCounts:sampleCounts()},{RUNNER_TEMP:f.temp}));
 const v=JSON.parse(fs.readFileSync(path.join(f.source,'setup.json')));assert(h.validSetup(v));assert.equal(v.schema,4);assert(!Object.hasOwn(v.after,'state'));assert(!h.validSetup({...v,raw:'PRIVATE'}));v.counts[0].new++;assert(!h.validSetup(v));
});
test('observational setup snippets distinguish replaced cows from retained chickens without changing mechanics',()=>{
 const animals=sampleState().map(a=>({kind:a.kind,ref:{i:a.index},g:{position:{x:a.position[0],z:a.position[1]}},vel:{x:0,y:0},until:12,need:{hunger:.3,tired:.2,lonely:.1}})),ctx={d:{animals,clock:()=>10},window:{__testGameplaySeed:{calls:484}}},vm=require('node:vm');
 const before=JSON.stringify(animals);vm.runInNewContext(h.scope.setupBeforeInsertion+'globalThis.result=()=>({'+h.scope.setupCaptureInsertion+'});',ctx);assert.equal(JSON.stringify(animals),before);
 ctx.d.animals=animals.map(a=>a.kind==='cow'?structuredClone(a):a);
 const v=JSON.parse(JSON.stringify(ctx.result()));assert.equal(v.setupCounts.find(c=>c.kind==='cow').retained,0);assert.equal(v.setupCounts.find(c=>c.kind==='cow').new,16);assert.equal(v.setupCounts.find(c=>c.kind==='chicken').retained,30);assert.equal(v.setupBefore.state[0].until,2);assert.equal(h.setupStateHash(v.setupBefore.state),h.setupStateHash(v.setupAfter.state));
});
function sampleState(){return Array.from({length:46},(_,i)=>({kind:i<30?'chicken':'cow',index:i<30?i:i-30,position:[0,-35],velocity:[0,0],until:1,spaceUntil:null,spaceSince:null,progressAt:null,replanAt:null,hunger:.3,tired:.2,lonely:.1,task:'none',stage:'none',weight:null}));}
function sampleCounts(){return ['chicken','cow','horse','sheep','dog','cat'].map((kind,i)=>({kind,before:i===0?30:i===1?16:0,after:i===0?30:i===1?16:0,retained:i===0?30:i===1?16:0,new:0}));}

function sampleClockProof(){const p=require('./helpers/a52-pen-clock-proof.cjs');return{schema:1,case:'low1',target:p.TARGETS.low1,observedBefore:12,observedAfter:p.TARGETS.low1,checks:Object.fromEntries([...p.COUNTS.map(k=>[k,0]),...p.FLAGS.map(k=>[k,true])]),applied:true,retained:true};}
function clockContext(){
 let clock=12,sets=0;
 const chicken={tokens:[],tasks:[],lanes:[],wakeUntil:-Infinity},remaining={tokens:[],tasks:[],wakeUntil:-Infinity,now:0,bedPriority:false};
 const d={animals:[],cowStations:{snapshot:()=>[]},chickenCare:{snapshotLayout:()=>chicken},remainingCare:{snapshotLayout:()=>remaining},baits:[],cowStatus:{job:null},walk:null,penEditor:{snapshot:()=>({open:false})},clock:()=>clock,setClock:v=>{clock=v;sets++;}};
 return{ctx:{d,window:{__done:true,__testGameplaySeed:{calls:0}},document:{getElementById:()=>null},location:{search:'?debug&portrait&shot&sim=0&preset=noon'},URLSearchParams,clockCase:'low1',clockTarget:6.941699999999997},chicken,remaining,sets:()=>sets,clock:()=>clock};
}
test('clock setter only occurs after every exact empty-state invariant, without await',()=>{
 const vm=require('node:vm');assert(!h.scope.clockBeforeInsertion.includes('await'));
 const good=clockContext();vm.runInNewContext(h.scope.clockBeforeInsertion,good.ctx);assert.equal(good.sets(),1);assert.equal(good.clock(),6.941699999999997);vm.runInNewContext(h.scope.clockAfterInsertion,good.ctx);assert(good.ctx.window.__penClockProof.retained);
 const changes=[f=>f.ctx.d.animals.push({}),f=>f.ctx.window.__testGameplaySeed.calls=1,f=>f.ctx.d.cowStations.snapshot=()=>[{}],f=>f.chicken.tokens.push({}),f=>f.remaining.tokens.push({}),f=>f.chicken.tasks.push({}),f=>f.remaining.tasks.push({}),f=>f.chicken.lanes.push({}),f=>f.ctx.d.baits.push({}),f=>f.ctx.location.search='?shot&sim=1&preset=noon',f=>f.ctx.window.__done=false,f=>f.ctx.document.getElementById=()=>({}),f=>f.chicken.wakeUntil=0,f=>f.remaining.wakeUntil=0,f=>f.remaining.now=1,f=>f.remaining.bedPriority=true,f=>f.ctx.d.cowStatus.job={},f=>f.ctx.d.walk={},f=>f.ctx.d.penEditor.snapshot=()=>({open:true})];
 for(const change of changes){const f=clockContext();change(f);assert.throws(()=>vm.runInNewContext(h.scope.clockBeforeInsertion,f.ctx));assert.equal(f.sets(),0);assert.equal(f.clock(),12);assert.equal(f.ctx.window.__penClockProof.applied,false);}
});
test('after Apply drift refuses without another reset',()=>{
 const vm=require('node:vm'),f=clockContext();vm.runInNewContext(h.scope.clockBeforeInsertion,f.ctx);f.ctx.d.clock=()=>99;assert.throws(()=>vm.runInNewContext(h.scope.clockAfterInsertion,f.ctx));assert.equal(f.sets(),1);assert.equal(f.ctx.window.__penClockProof.retained,false);
});
test('clock proof uses only fixed exact target values and rejects raw or inconsistent fields',()=>{
 const p=require('./helpers/a52-pen-clock-proof.cjs'),v=sampleClockProof();assert(p.validClockProof(v));assert.deepEqual(Object.values(p.TARGETS),[6.941699999999997,6.941699999999997,11.658899999999907,11.658899999999907]);
 for(const change of [x=>x.raw='PRIVATE',x=>x.case='arbitrary',x=>x.target=6.9417,x=>x.checks.animals=1,x=>x.observedAfter=99,x=>x.observedBefore=Infinity]){const w=structuredClone(v);change(w);assert(!p.validClockProof(w));}
 const refused=structuredClone(v);refused.checks.animals=1;refused.applied=false;refused.retained=false;refused.observedAfter=null;assert(p.validClockProof(refused));
});
test('all four cases serve untouched same main; no patch metadata or changed source expectations',()=>{
 assert.deepEqual(Object.keys(h.REFS),['low1','low2','high1','high2']);assert.equal(new Set(Object.values(h.REFS)).size,1);assert(!Object.hasOwn(h.scope,'patch'));
 for(const k of Object.keys(h.REFS))assert.deepEqual(h.scope.runtimePaths[k],h.scope.runtimePaths.low1);
});

// BEGIN MERGED MAIN REPRODUCTION CONTROLS
const addedUI=['farm3d/compact-ui.css','farm3d/corner-menu.js','farm3d/sunny-ui.css'];
test('two-arm workflow is exact authorized specialization of pinned original',()=>{
 let w=fs.readFileSync(path.join(root,'.github/workflows/a52-pen-clock-baseline.yml'),'utf8');const helperHash=h.sha(fs.readFileSync(path.join(__dirname,'helpers/a52-pen-clock.cjs')));assert(w.includes('case: [high1, low1]'));assert(!w.includes('workflow_dispatch'));assert(w.includes('branches: [codex/a52-main-pen-reproduction-20261117]'));
 w=w.replace('A52 merged-main two-clock reproduction','A52 controlled preownership clock diagnosis').replace('codex/a52-main-pen-reproduction-20261117','codex/a52-pen-clock-diagnostic-20261117').replace('case: [high1, low1]','case: [low1, low2, high1, high2]').split(helperHash).join('3af030cbfb6c1301193850ac1ccde07ca27e404a4277e44f180bc7fc3c50231b');assert.equal(h.sha(Buffer.from(w)),'3573c00d2ffa8971dcaf3d6126e1231bc1c801bfb223fda8ba4698e318ebae2e');
});
test('materializer and finite collector differ only by exact main ref and scope hash',()=>{
 const s=fs.readFileSync(path.join(__dirname,'helpers/a52-pen-clock.cjs'),'utf8').replace('40a8fb8797989b2b45393d70368a00a01af9a289','38fa4706e41c40197b7afc32de693cb3901a80fb').replace('358556b35a2100b3c1b563fc8c01bf261c61865dfd159d29a06565aa8f77c6a5','81a26b26f6e15882e0e83f994671b7ae3c2c112603cf0314b12348306f93e293');assert.equal(h.sha(Buffer.from(s)),'3af030cbfb6c1301193850ac1ccde07ca27e404a4277e44f180bc7fc3c50231b');assert.equal(new Set(Object.values(h.REFS)).size,1);assert.equal(h.REFS.high1,'40a8fb8797989b2b45393d70368a00a01af9a289');
});
test('scope changes only three runtime dependencies with no overlay/predicate relaxation',()=>{
 const s=JSON.parse(JSON.stringify(h.scope));for(const [k,a]of Object.entries(s.runtimePaths)){assert.equal(a.length,127);for(const f of addedUI)assert(a.includes(f));s.runtimePaths[k]=a.filter(f=>!addedUI.includes(f));}assert.equal(h.sha(Buffer.from(JSON.stringify(s,null,2)+'\n')),'81a26b26f6e15882e0e83f994671b7ae3c2c112603cf0314b12348306f93e293');assert.equal(s.originalTestSha256,'65e44d782b0559ef9f8724edaf049f7b02afd71049d74b9ef92e7a4da046b2ea');
});
test('all original inert controls remain exact apart from runtime count',()=>{const s=fs.readFileSync(__filename,'utf8').split('// BEGIN MERGED MAIN REPRODUCTION CONTROLS')[0].trimEnd()+'\n';assert.equal(h.sha(Buffer.from(s.replaceAll('length===127','length===124'))),'e6abfa3e16bccca6e286affacdc321320ba9d6829a9e3aa4367d141c32ba6762');});
