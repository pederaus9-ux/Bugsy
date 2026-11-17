'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const h=require('./helpers/a52-pen-recovery.cjs'),root=path.resolve(__dirname,'../..'),head='a'.repeat(40),{baseReceipt}=require('./helpers/ci-isolated-runner.cjs');
test('overlay has exact reviewed source hashes and original predicate inverse',()=>{const m=h.overlay(root);assert(m.size===15);assert(h.scope.runtimePaths.controlHigh1.length===124);assert(h.scope.runtimePaths.recoveryHigh1.length===124);const text=m.get('farm3d/tests/animal-pen-three-night-extra-classes.browser.cjs').toString();assert(!text.includes('start({ref:'));});
function fixture(t){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-pen-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));const dest=path.join(temp,'pen-recovery-runtime');fs.mkdirSync(dest);const entries=h.scope.runtimePaths.controlHigh1.map(f=>{const b=Buffer.from('fixture:'+f),p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);return '100644 blob '+h.blob(b)+'\t'+f;});for(const [f,b]of h.overlay(root)){const p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}fs.writeFileSync(path.join(dest,'.git'),'fixture only');const git=(r,a)=>a[0]==='ls-tree'?entries.join('\0')+'\0':a[1]==='HEAD'?r===root?head:h.REFS.controlHigh1:h.REFS.controlHigh1;const proof=h.checkSnapshot(root,dest,'controlHigh1',git);fs.mkdirSync(path.join(temp,'a52-pen-recovery-proof'));fs.writeFileSync(path.join(temp,'a52-pen-recovery-proof/before.json'),JSON.stringify(proof));const source=path.join(temp,'a52-ci-safe/pen_cache');fs.mkdirSync(source,{recursive:true});const receipt={...baseReceipt('command_failed'),isolationVerified:true,commandStarted:true,commandResultAvailable:true,cleanupVerified:true,exitCode:1};fs.writeFileSync(path.join(source,'step-6.json'),JSON.stringify(receipt));return{temp,dest,git,proof,source,receipt};}
test('positive before/after covers every runtime and only exact overlay',t=>{const f=fixture(t);assert(h.validProof(f.proof,'controlHigh1'));assert.equal(h.collect(root,f.temp,'controlHigh1',head,f.git),4);const id=JSON.parse(fs.readFileSync(path.join(f.temp,'a52-pen-recovery-public/identity.json')));assert.equal(id.runtimeSource,h.REFS.controlHigh1);assert.equal(id.testSource,head);assert.equal(id.mode,'CONTROLLED_EGRESS_DECISION_DIAGNOSTIC');});
for(const mode of ['runtime','missing','extra','overlay','symlink','badHead','badCleanup','unstarted','raw','proof'])test('fails closed '+mode,t=>{const f=fixture(t),p=path.join(f.dest,'farm3d/index.html');if(mode==='runtime')fs.writeFileSync(p,'changed');if(mode==='missing')fs.unlinkSync(p);if(mode==='extra')fs.writeFileSync(path.join(f.dest,'untracked.js'),'private');if(mode==='overlay')fs.appendFileSync(path.join(f.dest,'farm3d/tests/browser-harness.cjs'),'changed');if(mode==='symlink'){fs.unlinkSync(p);fs.symlinkSync('/tmp',p);}if(mode==='badHead')f.git=()=> 'b'.repeat(40);if(mode==='raw')fs.writeFileSync(path.join(f.source,'raw.log'),'PRIVATE');if(mode==='proof')fs.writeFileSync(path.join(f.temp,'a52-pen-recovery-proof/before.json'),'{}');if(mode==='badCleanup'||mode==='unstarted'){f.receipt[mode==='badCleanup'?'cleanupVerified':'commandStarted']=false;fs.writeFileSync(path.join(f.source,'step-6.json'),JSON.stringify(f.receipt));}assert.throws(()=>h.collect(root,f.temp,'controlHigh1',head,f.git));assert(!fs.existsSync(path.join(f.temp,'a52-pen-recovery-public')));});
test('setup witness bounded and writes once outside runtime',t=>{const f=fixture(t),v={seedWitness:{value:1,calls:200},clockExperiment:sampleClockProof(),setupBefore:{clock:11.658899999999907,rngCalls:184,state:sampleState()},setupAfter:{clock:11.658899999999907,rngCalls:200,state:sampleState()},setupCounts:sampleCounts()};assert(h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(!h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(h.validSetup(JSON.parse(fs.readFileSync(path.join(f.source,'setup.json')))));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:Infinity}));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:3,raw:'PRIVATE'}));});
test('real synthetic sparse worktree materializes exact named files without runtime refs',t=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-worktree-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const repo=path.join(tmp,'repo'),dest=path.join(tmp,'work');fs.mkdirSync(repo);const g=(cwd,args,input)=>cp.execFileSync('git',args,{cwd,input,stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH,HOME:tmp,GIT_CONFIG_NOSYSTEM:'1'}});g(repo,['init']);for(const [f,b]of [['root.txt','held'],['farm3d/index.html','synthetic'],['farm3d/art/x.png','synthetic asset'],['farm3d/tests/evidence/held.zip','held']]){const p=path.join(repo,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}g(repo,['add','.']);g(repo,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','synthetic']);g(repo,['worktree','add','--detach','--no-checkout',dest,'HEAD']);g(dest,['sparse-checkout','init','--no-cone']);g(dest,['sparse-checkout','set','--no-cone','--stdin'],'/farm3d/index.html\n/farm3d/art/x.png\n');g(dest,['read-tree','-mu','HEAD']);assert.deepEqual(h.allFiles(dest),['.git','farm3d/art/x.png','farm3d/index.html']);});

test('all literal local requires and dirname fixture reads exist in exact overlay',()=>{
 const m=h.overlay(root);
 for(const [file,b]of m){if(!file.endsWith('.cjs')||file.endsWith('/a52-pen-recovery.cjs'))continue;const text=b.toString();
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
 const f=fixture(t),state=sampleState();assert(h.writeSetup({seedWitness:{value:1},clockExperiment:sampleClockProof(),setupBefore:{clock:11.658899999999907,rngCalls:184,state},setupAfter:{clock:11.658899999999907,rngCalls:484,state},setupCounts:sampleCounts()},{RUNNER_TEMP:f.temp}));
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

function sampleClockProof(){const p=require('./helpers/a52-pen-recovery-proof.cjs');return{schema:1,case:'controlHigh1',target:p.TARGETS.controlHigh1,observedBefore:12,observedAfter:p.TARGETS.controlHigh1,checks:Object.fromEntries([...p.COUNTS.map(k=>[k,0]),...p.FLAGS.map(k=>[k,true])]),applied:true,retained:true};}
function clockContext(){
 let clock=12,sets=0;
 const chicken={tokens:[],tasks:[],lanes:[],wakeUntil:-Infinity},remaining={tokens:[],tasks:[],wakeUntil:-Infinity,now:0,bedPriority:false};
 const d={animals:[],cowStations:{snapshot:()=>[]},chickenCare:{snapshotLayout:()=>chicken},remainingCare:{snapshotLayout:()=>remaining},baits:[],cowStatus:{job:null},walk:null,penEditor:{snapshot:()=>({open:false})},clock:()=>clock,setClock:v=>{clock=v;sets++;}};
 return{ctx:{d,window:{__done:true,__testGameplaySeed:{calls:0}},document:{getElementById:()=>null},location:{search:'?debug&portrait&shot&sim=0&preset=noon'},URLSearchParams,clockCase:'controlHigh1',clockTarget:11.658899999999907},chicken,remaining,sets:()=>sets,clock:()=>clock};
}
test('clock setter only occurs after every exact empty-state invariant, without await',()=>{
 const vm=require('node:vm');assert(!h.scope.clockBeforeInsertion.includes('await'));
 const good=clockContext();vm.runInNewContext(h.scope.clockBeforeInsertion,good.ctx);assert.equal(good.sets(),1);assert.equal(good.clock(),11.658899999999907);vm.runInNewContext(h.scope.clockAfterInsertion,good.ctx);assert(good.ctx.window.__penClockProof.retained);
 const changes=[f=>f.ctx.d.animals.push({}),f=>f.ctx.window.__testGameplaySeed.calls=1,f=>f.ctx.d.cowStations.snapshot=()=>[{}],f=>f.chicken.tokens.push({}),f=>f.remaining.tokens.push({}),f=>f.chicken.tasks.push({}),f=>f.remaining.tasks.push({}),f=>f.chicken.lanes.push({}),f=>f.ctx.d.baits.push({}),f=>f.ctx.location.search='?shot&sim=1&preset=noon',f=>f.ctx.window.__done=false,f=>f.ctx.document.getElementById=()=>({}),f=>f.chicken.wakeUntil=0,f=>f.remaining.wakeUntil=0,f=>f.remaining.now=1,f=>f.remaining.bedPriority=true,f=>f.ctx.d.cowStatus.job={},f=>f.ctx.d.walk={},f=>f.ctx.d.penEditor.snapshot=()=>({open:true})];
 for(const change of changes){const f=clockContext();change(f);assert.throws(()=>vm.runInNewContext(h.scope.clockBeforeInsertion,f.ctx));assert.equal(f.sets(),0);assert.equal(f.clock(),12);assert.equal(f.ctx.window.__penClockProof.applied,false);}
});
test('after Apply drift refuses without another reset',()=>{
 const vm=require('node:vm'),f=clockContext();vm.runInNewContext(h.scope.clockBeforeInsertion,f.ctx);f.ctx.d.clock=()=>99;assert.throws(()=>vm.runInNewContext(h.scope.clockAfterInsertion,f.ctx));assert.equal(f.sets(),1);assert.equal(f.ctx.window.__penClockProof.retained,false);
});
test('clock proof uses only fixed exact target values and rejects raw or inconsistent fields',()=>{
 const p=require('./helpers/a52-pen-recovery-proof.cjs'),v=sampleClockProof();assert(p.validClockProof(v));assert.deepEqual(Object.values(p.TARGETS),[11.658899999999907,11.658899999999907,11.658899999999907,11.658899999999907,6.941699999999997,6.941699999999997]);
 for(const change of [x=>x.raw='PRIVATE',x=>x.case='arbitrary',x=>x.target=6.9417,x=>x.checks.animals=1,x=>x.observedAfter=99,x=>x.observedBefore=Infinity]){const w=structuredClone(v);change(w);assert(!p.validClockProof(w));}
 const refused=structuredClone(v);refused.checks.animals=1;refused.applied=false;refused.retained=false;refused.observedAfter=null;assert(p.validClockProof(refused));
});
test('all six cases share pinned main base with explicit patch cases',()=>{
 assert.deepEqual(Object.keys(h.REFS),['controlHigh1','controlHigh2','recoveryHigh1','recoveryHigh2','controlLow','recoveryLow']);assert.equal(new Set(Object.values(h.REFS)).size,1);assert(Object.hasOwn(h.scope,'patch'));assert.equal(h.provenance('controlHigh1'),null);assert.equal(h.provenance('controlHigh2'),null);assert.deepEqual(h.provenance('recoveryHigh1'),h.provenance('recoveryHigh2'));
 for(const k of Object.keys(h.REFS))assert.deepEqual(h.scope.runtimePaths[k],h.scope.runtimePaths.controlHigh1);
});

test('exact pinned main bounded recovery patch and inverse; malformed preimages fail',()=>{
 const pre=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':'+h.scope.patch.path],{cwd:root,stdio:['ignore','pipe','pipe']});
 const post=h.patchBytes(pre);assert.equal(h.sha(pre),h.scope.patch.preimageSha256);assert.equal(h.sha(post),h.scope.patch.postimageSha256);assert.equal(h.blob(post),h.scope.patch.postimageBlob);
 let inverse=post.toString();for(const x of [...h.scope.observationTransforms].reverse()){assert.equal(inverse.split(x.new).length,2);inverse=inverse.replace(x.new,x.old);}assert.equal(h.sha(Buffer.from(inverse)),h.scope.unobservedEgressSha256);assert.equal(inverse.replace(h.scope.patch.new,h.scope.patch.old),pre.toString());
 for(const bad of [post,Buffer.from(pre+'changed'),Buffer.from(pre.toString().replace(h.scope.patch.old,''))])assert.throws(()=>h.patchBytes(bad));
});
test('patched provenance is explicit and cannot claim untouched main',t=>{
 const f=fixture(t),pre=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':'+h.scope.patch.path],{cwd:root,stdio:['ignore','pipe','pipe']}),post=h.patchBytes(pre);
 const rows=h.scope.runtimePaths.recoveryHigh1.map(file=>{const b=file===h.scope.patch.path?pre:Buffer.from('fixture:'+file);return '100644 blob '+h.blob(b)+'\t'+file;});
 const git=(r,a)=>a[0]==='ls-tree'?rows.join('\0')+'\0':a[1]==='HEAD'?r===root?head:h.REFS.controlHigh1:h.REFS.controlHigh1;
 fs.writeFileSync(path.join(f.dest,h.scope.patch.path),post);
 const proof=h.checkSnapshot(root,f.dest,'recoveryHigh1',git);assert(h.validProof(proof,'recoveryHigh1'));assert(!h.validProof(proof,'controlHigh1'));
 assert.equal(proof.runtimeVariant,'MAIN_PLUS_EGRESS_DECISION_OBSERVATIONS');assert.deepEqual(proof.patch,h.provenance('recoveryHigh1'));assert.notEqual(proof.runtimeManifestSha256,proof.baseRuntimeManifestSha256);
 fs.writeFileSync(path.join(f.temp,'a52-pen-recovery-proof/before.json'),JSON.stringify(proof));
 assert.equal(h.collect(root,f.temp,'recoveryHigh1',head,git),4);
 const id=JSON.parse(fs.readFileSync(path.join(f.temp,'a52-pen-recovery-public/identity.json')));assert.equal(id.runtimeSource,h.REFS.controlHigh1);assert.equal(id.runtimeVariant,'MAIN_PLUS_EGRESS_DECISION_OBSERVATIONS');assert.deepEqual(id.patch,h.provenance('recoveryHigh1'));
 fs.writeFileSync(path.join(f.dest,h.scope.patch.path),pre);assert.throws(()=>h.checkSnapshot(root,f.dest,'recoveryHigh1',git));
});
function evaluateStep({pos=[0,-39.775],target=[-6.405,-35.845],step=.01,steered=[0,-.01],others=[],gate=true,obstacle=false,code=h.scope.patch.new}={}){
 const a={kind:'cow',pos:{x:pos[0],y:pos[1]},g:{position:{x:pos[0],z:pos[1]}}},dx=target[0]-pos[0],dz=target[1]-pos[1],d=Math.hypot(dx,dz),calls={obstacle:0,detour:0};
 const ctx={OBST:obstacle?[{x:0,z:-39.2,hw:.1,hd:.1,c:1,s:0}]:[{x:100,z:100,hw:1,hd:1,c:1,s:0}],toLocal:(o,p)=>({x:p.x-o.x,y:p.y-o.z}),a,animals:[a,...others.map(p=>({kind:'cow',g:{position:{x:p[0],z:p[1]}}}))],THREE:{Vector2:class{constructor(x,y){this.x=x;this.y=y;}}},ox:pos[0],oz:pos[1],dx,dz,d,step:Math.min(step,d),nx:steered[0],nz:steered[1],PENS:{courtyard:{}},task:{avoidSide:0},t:0,COW_YARD_LAYOUT:{obstacles:[]},cowSharedCornerDetour:()=>{calls.detour++;return true;},fitsPen:(_p,x,z,m)=>{assert.equal(m,.42);return x>=-14+m&&x<=9.8-m&&z>=-40.2+m&&z<=-32.8-m;},cowGateSegmentClear:()=>gate,hitsBlock:(_a,_b,m)=>{assert.equal(m,.42);calls.obstacle++;return obstacle?0:-1;}};
 require('node:vm').runInNewContext(code,ctx);
 return{position:[a.g.position.x,a.g.position.z],calls};
}
test('recorded boundary-stall coordinates recover toward existing route with no teleport',()=>{
 const cases=[{pos:[.492881942935413,-39.77431507584558],target:[-6.405,-35.845],others:[[-.8676680803214121,-39.77755377129291]]},{pos:[-.8676680803214121,-39.77755377129291],target:[2.805,-35.845],others:[[.492881942935413,-39.77431507584558]]}];
 for(const c of cases){const q=evaluateStep(c),distance=p=>Math.hypot(c.target[0]-p[0],c.target[1]-p[1]);assert(distance(q.position)<distance(c.pos));assert(Math.hypot(q.position[0]-c.pos[0],q.position[1]-c.pos[1])<=.010000000001);assert(q.position[1]>=-39.78);assert(Math.hypot(q.position[0]-c.others[0][0],q.position[1]-c.others[0][1])>=.85);}
});
test('fallback cannot bypass boundary, gate, static obstruction or cow contact clearance',()=>{
 for(const c of [{target:[0,-45]},{gate:false},{obstacle:true},{others:[[0,-39.5]]}])assert.deepEqual(evaluateStep(c).position,[0,-39.775]);
 const near=evaluateStep({pos:[0,-39.775],target:[0,-39.774],steered:[0,-.01]});assert(Math.hypot(near.position[0],near.position[1]+39.775)<=.001000000001);
});
test('legal ordinary steered motion remains unchanged and never invokes fallback obstruction test',()=>{
 const q=evaluateStep({pos:[0,-35],target:[5,-35],steered:[.006,.008]});assert.deepEqual(q.position,[.006,-34.992]);assert.equal(q.calls.obstacle,0);
 const blocked=evaluateStep({pos:[0,-35],target:[5,-35],steered:[.006,.008],others:[[.1,-35]]});assert.deepEqual(blocked.position,[0,-35]);
});
test('real steering with full original rejection branch hands off hard blockers without bypass',()=>{
 const source=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':farm3d/cow-personal-space.js'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}),ctx={};require('node:vm').runInNewContext(source.replace(/export /g,'')+';globalThis.steer=steerCowPersonalSpace;',ctx);
 const main=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':farm3d/index.html'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}),patched=main.replace(h.scope.patch.old,h.scope.patch.new),full=patched.slice(patched.indexOf('// A social-avoidance step'),patched.indexOf('// Finish the final robot approach physically:'));assert(full.includes('cowSharedCornerDetour'));
 const cows=[{pos:[.492881942935413,-39.77431507584558],target:[-6.405,-35.845],state:{selfId:1}},{pos:[-.8676680803214121,-39.77755377129291],target:[2.805,-35.845],state:{selfId:4}}],starts=cows.map(c=>[...c.pos]);let recoveries=0,handoffs=0;
 for(let i=0;i<1200&&!handoffs;i++)for(let n=0;n<2;n++){
  const c=cows[n],other=cows[1-n],dx=c.target[0]-c.pos[0],dz=c.target[1]-c.pos[1],d=Math.hypot(dx,dz),step=Math.min(d,1.2/120),sv=ctx.steer({x:c.pos[0],y:c.pos[1]},{x:dx/d*1.2,y:dz/d*1.2},[{id:other.state.selfId,x:other.pos[0],y:other.pos[1]}],c.state,1714+i/120),sl=Math.hypot(sv.x,sv.y),steered=[sv.x/sl*step,sv.y/sl*step],q=evaluateStep({pos:c.pos,target:c.target,step,steered,others:[other.pos],code:full});
  recoveries+=q.calls.obstacle;handoffs+=q.calls.detour;assert(Math.hypot(q.position[0]-c.pos[0],q.position[1]-c.pos[1])<=step+1e-10);assert(q.position[1]>=-39.78&&q.position[1]<=-33.22);assert(Math.hypot(q.position[0]-other.pos[0],q.position[1]-other.pos[1])>=.85);c.pos=q.position;
 }
 assert(recoveries>0);assert(handoffs>0,'must invoke original blocker recovery rather than accept colliding fallback');
});
test('outside preferred step with only direct-route cow blocker reaches original detour without moving through cow',()=>{
 const main=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':farm3d/index.html'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}),patched=main.replace(h.scope.patch.old,h.scope.patch.new),full=patched.slice(patched.indexOf('// A social-avoidance step'),patched.indexOf('// Finish the final robot approach physically:'));
 const q=evaluateStep({pos:[0,-39.775],target:[0,-35],steered:[0,-.01],others:[[0,-38.92]],code:full});
 assert.equal(q.calls.detour,1);assert.deepEqual(q.position,[0,-39.775]);assert(Math.hypot(q.position[0],q.position[1]+38.92)>=.85);
});

function egressFixture(){
 const source=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':farm3d/index.html'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}),local=source.slice(source.indexOf('const toLocal ='),source.indexOf('// shortest way from -> to')),ctx={OBST:[],THREE:{Vector2:class{constructor(x,y){this.x=x;this.y=y;}},MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}}};
 require('node:vm').runInNewContext(local+h.scope.egressPredicate+';globalThis.testEgress=cowStaticStepClear;globalThis.testHits=hitsBlock;',ctx);
 return (shapes,a,b)=>{ctx.OBST=shapes;return ctx.testEgress({x:a[0],y:a[1]},{x:b[0],y:b[1]});};
}
test('exact source geometry permits recorded gradual departure from existing wall envelope',()=>{
 const f=egressFixture(),wall={x:-3.6,z:-40.1,hw:10.3,hd:.1,c:1,s:0};
 for(const [a,b] of [[[.492881942935413,-39.77431507584558],[.48708919952780405,-39.77101529278313]],[[-.8676680803214121,-39.77755377129291],[-.8631177794744318,-39.77268148162094]]]){assert(f([wall],a,b));assert(!f([wall],b,a));}
});
test('box egress forbids entry, deeper motion, opposite traversal and all conflicting overlaps',()=>{
 const f=egressFixture(),box={x:0,z:0,hw:1,hd:1,c:1,s:0};
 assert(f([box],[1.2,0],[1.3,.2]));assert(!f([box],[1.2,0],[1.1,0]));assert(!f([box],[1.2,0],[-2,0]));
 assert(!f([box],[2,0],[1.3,0]));assert(!f([box],[-2,0],[2,0]));assert(!f([box],[1.2,0],[1.2,.1]));
 assert(f([box],[1.2,1.2],[1.21,1.19])); // tie: x face strictly improves despite z face switch
 assert(!f([box],[1.2,1.2],[1.19,1.19]));assert(!f([box],[1.2,0],[1.2,0]));
 const other={...box,x:2.5};assert(!f([box,other],[1.2,0],[1.3,0]));assert(!f([other,box],[1.2,0],[1.3,0]));
 const ahead={x:1.9,z:0,hw:.1,hd:.1,c:1,s:0};assert(!f([box,ahead],[1.2,0],[1.5,0]));
});
test('rotated box and circle use full-segment outward criteria, not endpoint-only distance',()=>{
 const f=egressFixture(),rotated={x:0,z:0,hw:1,hd:1,c:Math.SQRT1_2,s:Math.SQRT1_2},w=(x,y)=>[(x-y)*Math.SQRT1_2,(x+y)*Math.SQRT1_2];
 assert(f([rotated],w(1.2,0),w(1.3,.1)));assert(!f([rotated],w(1.2,0),w(1.1,0)));
 const circle={x:0,z:0,radius:1,c:1,s:0};
 assert(f([circle],[1,0],[1.01,.01]));assert(!f([circle],[1,0],[-2,0]));assert(!f([circle],[1,0],[.99,.3]));assert(!f([circle],[2,0],[1.3,0]));assert(!f([circle],[0,0],[.01,0]));assert(!f([circle],[1,0],[1,.01])); // tangent deliberately fails closed
});
test('permitted convex egress monotonically decreases penetration across whole sampled segment',()=>{
 const f=egressFixture(),box={x:0,z:0,hw:1,hd:.5,c:1,s:0},circle={x:0,z:0,radius:1,c:1,s:0};
 for(const [o,a,b]of [[box,[1.2,.1],[1.8,-.7]],[box,[0,.7],[.4,1.1]],[circle,[1,.1],[1.4,.4]]]){
  assert(f([o],a,b));let prior=Infinity;
  for(let n=0;n<=100;n++){const u=n/100,x=a[0]+u*(b[0]-a[0]),y=a[1]+u*(b[1]-a[1]),depth=o.radius!==undefined?Math.max(0,o.radius+.42-1e-8-Math.hypot(x,y)):Math.max(0,Math.min(o.hw+.42-.05-Math.abs(x),o.hd+.42-.05-Math.abs(y)));assert(depth<=prior+1e-12);prior=depth;}
 }
});

test('egress fails closed on nonfinite endpoints and every invalid obstacle before no-hit continuation',()=>{
 const f=egressFixture(),box={x:100,z:100,hw:1,hd:1,c:1,s:0},circle={x:100,z:100,radius:1,c:1,s:0};
 for(const a of [[NaN,0],[Infinity,0],[0,-Infinity]])assert(!f([box],a,[1,0]));
 for(const b of [[NaN,0],[Infinity,0],[0,-Infinity]])assert(!f([box],[0,0],b));
 for(const k of ['x','z','hw','hd','c','s'])for(const v of [NaN,Infinity,-Infinity])assert(!f([{...box,[k]:v}],[0,0],[1,0]));
 for(const v of [NaN,Infinity,-Infinity,-1])assert(!f([{...circle,radius:v}],[0,0],[1,0]));
 for(const bad of [null,{...box,c:0,s:0},{...box,c:2},{...box,hw:-1},{...box,hd:-1}])assert(!f([bad],[0,0],[1,0]));
 assert(!f([box,{...box,x:NaN}],[0,0],[1,0]));assert(f([box],[0,0],[1,0]));
});
test('finite world geometry that overflows transformed coordinates or delta fails before intersection',()=>{
 const f=egressFixture(),box={x:-1e308,z:0,hw:1,hd:1,c:1,s:0};
 assert(!f([box],[1e308,0],[1e308,1]));
 assert(!f([{...box,x:0}],[-1e308,0],[1e308,0]));
 assert(!f([{...box,x:0,z:0,c:Math.SQRT1_2,s:Math.SQRT1_2}],[1.7e308,1.7e308],[1.7e308,1.7e308]));
});

test('decision observations preserve short circuit, return values, movement and task handoff',()=>{
 const pre=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.controlHigh1+':farm3d/index.html'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}),unobserved=pre.replace(h.scope.patch.old,h.scope.patch.new),observed=h.patchBytes(Buffer.from(pre)).toString(),cut=(s,start)=>s.slice(s.indexOf(start),s.indexOf('// Finish the final robot approach physically:'));
 for(const config of [{},{gate:false},{obstacle:true},{boundary:false},{blocked:true},{blocked:true,detour:false},{legal:true},{legal:true,blocked:true}]){
  const run=(code)=>{const calls=[],a={ref:{i:1},kind:'cow',pos:{x:0,y:-39.775},g:{position:{x:0,z:-39.775}}},task={kind:'bed',stage:'approach',avoidSide:0},ctx={window:{},OBST:[{x:0,z:-39.2,hw:.1,hd:.1,c:1,s:0}],toLocal:(o,p)=>({x:p.x-o.x,y:p.y-o.z}),a,task,t:1714,ox:0,oz:-39.775,dx:0,dz:4.775,d:4.775,step:.01,nx:0,nz:config.legal?.01:-.01,animals:[a,...(config.blocked?[{kind:'cow',g:{position:{x:0,z:-38.92}}}]:[])],THREE:{Vector2:class{constructor(x,y){this.x=x;this.y=y;}}},PENS:{courtyard:{}},COW_YARD_LAYOUT:{obstacles:[]},fitsPen:(_p,x,z,m)=>{calls.push(['boundary',x,z,m]);return config.boundary!==false&&z>=-39.78;},cowGateSegmentClear:(_p,n)=>{calls.push(['gate',n.x,n.y]);return config.gate!==false;},hitsBlock:(_p,n,m)=>{calls.push(['static',n.x,n.y,m]);return config.obstacle?0:-1;},cowSharedCornerDetour:()=>{calls.push(['detour']);return config.detour!==false;}};require('node:vm').runInNewContext(code,ctx);return {calls,position:[a.g.position.x,a.g.position.z],task,observation:ctx.window.__penDecisions};};
  const a=run(cut(unobserved,'// A social-avoidance step')),b=run(cut(observed,'// Diagnostic-only observations'));
  assert.deepEqual(b.calls,a.calls);assert.deepEqual(b.position,a.position);assert.deepEqual(b.task,a.task);assert(require('./helpers/a52-pen-report.cjs').validDecisions(b.observation));assert(JSON.stringify(b.observation).length<2000);
 }
});
test('finite decisions reject raw keys, unknown identities, unbounded values and malformed arrays',()=>{
 const v={schema:1,animals:[{index:1,counts:Array(18).fill(0),first:null,last:null}]},valid=require('./helpers/a52-pen-report.cjs').validDecisions;
 assert(valid(v));for(const bad of [{...v,raw:'private'},{schema:1,animals:[{...v.animals[0],index:3}]},{schema:1,animals:[{...v.animals[0],counts:[Infinity]}]},{schema:1,animals:[{...v.animals[0],first:{raw:'private'}}]}])assert(!valid(bad));
});
