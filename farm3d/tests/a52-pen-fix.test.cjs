'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const h=require('./helpers/a52-pen-fix.cjs'),root=path.resolve(__dirname,'../..'),head='a'.repeat(40),{baseReceipt}=require('./helpers/ci-isolated-runner.cjs');
test('overlay has exact reviewed source hashes and original predicate inverse',()=>{const m=h.overlay(root);assert(m.size===14);assert(h.scope.runtimePaths.baseline.length===124);assert(h.scope.runtimePaths.patched.length===124);const text=m.get('farm3d/tests/animal-pen-three-night-extra-classes.browser.cjs').toString();assert(!text.includes('start({ref:'));});
function fixture(t){const temp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-pen-'));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));const dest=path.join(temp,'pen-fix-runtime');fs.mkdirSync(dest);const entries=h.scope.runtimePaths.baseline.map(f=>{const b=Buffer.from('fixture:'+f),p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);return '100644 blob '+h.blob(b)+'\t'+f;});for(const [f,b]of h.overlay(root)){const p=path.join(dest,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}fs.writeFileSync(path.join(dest,'.git'),'fixture only');const git=(r,a)=>a[0]==='ls-tree'?entries.join('\0')+'\0':a[1]==='HEAD'?r===root?head:h.REFS.baseline:h.REFS.baseline;const proof=h.checkSnapshot(root,dest,'baseline',git);fs.mkdirSync(path.join(temp,'a52-pen-fix-proof'));fs.writeFileSync(path.join(temp,'a52-pen-fix-proof/before.json'),JSON.stringify(proof));const source=path.join(temp,'a52-ci-safe/pen_cache');fs.mkdirSync(source,{recursive:true});const receipt={...baseReceipt('command_failed'),isolationVerified:true,commandStarted:true,commandResultAvailable:true,cleanupVerified:true,exitCode:1};fs.writeFileSync(path.join(source,'step-6.json'),JSON.stringify(receipt));return{temp,dest,git,proof,source,receipt};}
test('positive before/after covers every runtime and only exact overlay',t=>{const f=fixture(t);assert(h.validProof(f.proof,'baseline'));assert.equal(h.collect(root,f.temp,'baseline',head,f.git),4);const id=JSON.parse(fs.readFileSync(path.join(f.temp,'a52-pen-fix-public/identity.json')));assert.equal(id.runtimeSource,h.REFS.baseline);assert.equal(id.testSource,head);assert.equal(id.mode,'DIRECT_FILE_MAIN_BOUNDARY_PATCH_COMPARISON');});
for(const mode of ['runtime','missing','extra','overlay','symlink','badHead','badCleanup','unstarted','raw','proof'])test('fails closed '+mode,t=>{const f=fixture(t),p=path.join(f.dest,'farm3d/index.html');if(mode==='runtime')fs.writeFileSync(p,'changed');if(mode==='missing')fs.unlinkSync(p);if(mode==='extra')fs.writeFileSync(path.join(f.dest,'untracked.js'),'private');if(mode==='overlay')fs.appendFileSync(path.join(f.dest,'farm3d/tests/browser-harness.cjs'),'changed');if(mode==='symlink'){fs.unlinkSync(p);fs.symlinkSync('/tmp',p);}if(mode==='badHead')f.git=()=> 'b'.repeat(40);if(mode==='raw')fs.writeFileSync(path.join(f.source,'raw.log'),'PRIVATE');if(mode==='proof')fs.writeFileSync(path.join(f.temp,'a52-pen-fix-proof/before.json'),'{}');if(mode==='badCleanup'||mode==='unstarted'){f.receipt[mode==='badCleanup'?'cleanupVerified':'commandStarted']=false;fs.writeFileSync(path.join(f.source,'step-6.json'),JSON.stringify(f.receipt));}assert.throws(()=>h.collect(root,f.temp,'baseline',head,f.git));assert(!fs.existsSync(path.join(f.temp,'a52-pen-fix-public')));});
test('setup witness bounded and writes once outside runtime',t=>{const f=fixture(t),v={seedWitness:{value:1,calls:200},setupBefore:{clock:3.25,rngCalls:184,state:sampleState()},setupAfter:{clock:3.25,rngCalls:200,state:sampleState()},setupCounts:sampleCounts()};assert(h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(!h.writeSetup(v,{RUNNER_TEMP:f.temp}));assert(h.validSetup(JSON.parse(fs.readFileSync(path.join(f.source,'setup.json')))));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:Infinity}));assert(!h.validSetup({schema:1,seed:1,rngCalls:200,clock:3,raw:'PRIVATE'}));});
test('real synthetic sparse worktree materializes exact named files without runtime refs',t=>{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'direct-worktree-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));const repo=path.join(tmp,'repo'),dest=path.join(tmp,'work');fs.mkdirSync(repo);const g=(cwd,args,input)=>cp.execFileSync('git',args,{cwd,input,stdio:['pipe','pipe','pipe'],env:{PATH:process.env.PATH,HOME:tmp,GIT_CONFIG_NOSYSTEM:'1'}});g(repo,['init']);for(const [f,b]of [['root.txt','held'],['farm3d/index.html','synthetic'],['farm3d/art/x.png','synthetic asset'],['farm3d/tests/evidence/held.zip','held']]){const p=path.join(repo,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b);}g(repo,['add','.']);g(repo,['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','synthetic']);g(repo,['worktree','add','--detach','--no-checkout',dest,'HEAD']);g(dest,['sparse-checkout','init','--no-cone']);g(dest,['sparse-checkout','set','--no-cone','--stdin'],'/farm3d/index.html\n/farm3d/art/x.png\n');g(dest,['read-tree','-mu','HEAD']);assert.deepEqual(h.allFiles(dest),['.git','farm3d/art/x.png','farm3d/index.html']);});

test('all literal local requires and dirname fixture reads exist in exact overlay',()=>{
 const m=h.overlay(root);
 for(const [file,b]of m){if(!file.endsWith('.cjs')||file.endsWith('/a52-pen-fix.cjs'))continue;const text=b.toString();
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
test('exact pinned main one-line patch and inverse; malformed preimages fail',()=>{
 const pre=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.baseline+':'+h.scope.patch.path],{cwd:root,stdio:['ignore','pipe','pipe']});
 const post=h.patchBytes(pre);assert.equal(h.sha(pre),h.scope.patch.preimageSha256);assert.equal(h.sha(post),h.scope.patch.postimageSha256);assert.equal(h.blob(post),h.scope.patch.postimageBlob);
 assert.equal(post.toString().replace(h.scope.patch.new,h.scope.patch.old),pre.toString());
 for(const bad of [post,Buffer.from(pre+'changed'),Buffer.from(pre.toString().replace(h.scope.patch.old,''))])assert.throws(()=>h.patchBytes(bad));
});
test('patched provenance is explicit and cannot claim untouched main',t=>{
 const f=fixture(t),pre=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',h.REFS.baseline+':'+h.scope.patch.path],{cwd:root,stdio:['ignore','pipe','pipe']}),post=h.patchBytes(pre);
 const rows=h.scope.runtimePaths.patched.map(file=>{const b=file===h.scope.patch.path?pre:Buffer.from('fixture:'+file);return '100644 blob '+h.blob(b)+'\t'+file;});
 const git=(r,a)=>a[0]==='ls-tree'?rows.join('\0')+'\0':a[1]==='HEAD'?r===root?head:h.REFS.baseline:h.REFS.baseline;
 fs.writeFileSync(path.join(f.dest,h.scope.patch.path),post);
 const proof=h.checkSnapshot(root,f.dest,'patched',git);assert(h.validProof(proof,'patched'));assert(!h.validProof(proof,'baseline'));
 assert.equal(proof.runtimeVariant,'MAIN_PLUS_BOUNDARY_PREDICATE');assert.deepEqual(proof.patch,h.provenance('patched'));assert.notEqual(proof.runtimeManifestSha256,proof.baseRuntimeManifestSha256);
 fs.writeFileSync(path.join(f.temp,'a52-pen-fix-proof/before.json'),JSON.stringify(proof));
 assert.equal(h.collect(root,f.temp,'patched',head,git),4);
 const id=JSON.parse(fs.readFileSync(path.join(f.temp,'a52-pen-fix-public/identity.json')));assert.equal(id.runtimeSource,h.REFS.baseline);assert.equal(id.runtimeVariant,'MAIN_PLUS_BOUNDARY_PREDICATE');assert.deepEqual(id.patch,h.provenance('patched'));
 fs.writeFileSync(path.join(f.dest,h.scope.patch.path),pre);assert.throws(()=>h.checkSnapshot(root,f.dest,'patched',git));
});
function run(code,next,blocked=false,gate=true){const a={pos:{x:0,y:-35},g:{position:{x:0,z:-35}}},pen={};let fitsCalls=0;const c={a,next,blockingCows:blocked?[{}]:[],PENS:{courtyard:pen},fitsPen:(p,x,z,margin)=>{fitsCalls++;assert.equal(p,pen);assert.equal(margin,.42);return x>=-14+margin&&x<=9.8-margin&&z>=-40.2+margin&&z<=-32.8-margin;},cowGateSegmentClear:()=>gate};require("node:vm").runInNewContext(code,c);return {position:a.g.position,fitsCalls};}
test('witness outside candidates accepted before and rejected after',()=>{for(const [x,z]of [[.673395561924801,-40.446712707563556],[-.6589612622530208,-40.74189425847652]]){assert.deepEqual(run(h.scope.patch.old,{x,y:z}).position,{x,z});assert.deepEqual(run(h.scope.patch.new,{x,y:z}).position,{x:0,z:-35});}});
test('legal forward step retained; existing cow and gate collision gates unchanged',()=>{assert.deepEqual(run(h.scope.patch.new,{x:1,y:-35}).position,{x:1,z:-35});for(const [blocked,gate]of [[true,true],[false,false]])assert.deepEqual(run(h.scope.patch.new,{x:1,y:-35},blocked,gate).position,{x:0,z:-35});});

function sampleState(){return Array.from({length:46},(_,i)=>({kind:i<30?'chicken':'cow',index:i<30?i:i-30,position:[0,-35],velocity:[0,0],until:1,spaceUntil:null,spaceSince:null,progressAt:null,replanAt:null,hunger:.3,tired:.2,lonely:.1,task:'none',stage:'none',weight:null}));}
function sampleCounts(){return ['chicken','cow','horse','sheep','dog','cat'].map((kind,i)=>({kind,before:i===0?30:i===1?16:0,after:i===0?30:i===1?16:0,retained:i===0?30:i===1?16:0,new:0}));}
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
 const f=fixture(t),state=sampleState();assert(h.writeSetup({seedWitness:{value:1},setupBefore:{clock:1,rngCalls:184,state},setupAfter:{clock:1,rngCalls:484,state},setupCounts:sampleCounts()},{RUNNER_TEMP:f.temp}));
 const v=JSON.parse(fs.readFileSync(path.join(f.source,'setup.json')));assert(h.validSetup(v));assert.equal(v.schema,3);assert(!Object.hasOwn(v.after,'state'));assert(!h.validSetup({...v,raw:'PRIVATE'}));v.counts[0].new++;assert(!h.validSetup(v));
});
test('observational setup snippets distinguish replaced cows from retained chickens without changing mechanics',()=>{
 const animals=sampleState().map(a=>({kind:a.kind,ref:{i:a.index},g:{position:{x:a.position[0],z:a.position[1]}},vel:{x:0,y:0},until:12,need:{hunger:.3,tired:.2,lonely:.1}})),ctx={d:{animals,clock:()=>10},window:{__testGameplaySeed:{calls:484}}},vm=require('node:vm');
 const before=JSON.stringify(animals);vm.runInNewContext(h.scope.setupBeforeInsertion+'globalThis.result=()=>({'+h.scope.setupCaptureInsertion+'});',ctx);assert.equal(JSON.stringify(animals),before);
 ctx.d.animals=animals.map(a=>a.kind==='cow'?structuredClone(a):a);
 const v=JSON.parse(JSON.stringify(ctx.result()));assert.equal(v.setupCounts.find(c=>c.kind==='cow').retained,0);assert.equal(v.setupCounts.find(c=>c.kind==='cow').new,16);assert.equal(v.setupCounts.find(c=>c.kind==='chicken').retained,30);assert.equal(v.setupBefore.state[0].until,2);assert.equal(h.setupStateHash(v.setupBefore.state),h.setupStateHash(v.setupAfter.state));
});
