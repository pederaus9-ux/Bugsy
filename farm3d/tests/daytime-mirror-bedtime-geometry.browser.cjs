'use strict';
// Bounded observer of the shipped Beast.update path in an offline, disposable
// guest. No saved farm is loaded and no animal decision is intercepted.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const hash=x=>createHash('sha256').update(x).digest('hex');
const base='9e6f2763dd7781b761ccaef2f2cfa680d57b4783',candidate='ba02621a9d9805c4fcf9d017be5921e2955fa517';
const originalSHA=['6ed974f5d0571ef070d50fa81d0f30c8b840f5f283e5a75e46fc8d424225131b','c3124b2679e0a49183d22607f32122986453a5c306a475ea7667c5efc3ca0f23'];
const repairedSHA=['fb7f11d91c42d53e69766e391d829ec9335ba2b698cb9e93ec24a53a57e4bfc4','a14decdb3cc4fff6c724507036831c6b56ff483f62c1397026c0530d1ee1436d'];
const indexFile='farm3d/index.html';
const patchOld="  const nodes=[from,to];for(const [sx,sz]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=sx*(blocker.hw+PAD+CORNER),z=sz*(blocker.hd+PAD+CORNER);nodes.push([blocker.x+x*blocker.c-z*blocker.s,blocker.z+x*blocker.s+z*blocker.c]);}\n  const valid=[true,true];for(let i=2;i<6;i++){valid[i]=poly?(yield* polygonClear(nodes[i],nodes[i])):inside(nodes[i]);if(valid[i])for(const o of obs){const bad=pointBlocked(o,nodes[i]);yield 1;if(bad){valid[i]=false;break;}}}\n  const edges=Array.from({length:6},()=>Array(6).fill(Infinity));\n  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(valid[i]&&valid[j]){\n   let clear=yield* polygonClear(nodes[i],nodes[j]);if(!clear)continue;for(const o of obs){const bad=segmentBlocked(o,nodes[i],nodes[j]);yield 1;if(bad){clear=false;break;}}\n   if(clear)edges[i][j]=edges[j][i]=Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1]);\n  }\n  const dist=[0,...Array(5).fill(Infinity)],prev=Array(6).fill(-1),done=Array(6).fill(false);\n  for(let k=0;k<6;k++){let u=-1;for(let i=0;i<6;i++)if(!done[i]&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u])||u===1)break;done[u]=true;for(let v=0;v<6;v++){const d=dist[u]+edges[u][v];if(!done[v]&&d<dist[v]){dist[v]=d;prev[v]=u;}}}\n  if(prev[1]<0)return{status:'no-route'};\n  const path=[];for(let v=1;v>0;v=prev[v])path.unshift(nodes[v]);\n  return{status:'path',path,snapshot:obs,from,to,pen};",patchNew="  // Stable range tree: prune only conservative nonintersections, never change order.\n  function boxOf(o){\n   const det=o.c*o.c+o.s*o.s;\n   const rw=(o.hw+PAD),rh=(o.hd+PAD),r=o.radius!==undefined?(o.radius+PAD)/Math.sqrt(det):0;\n   const ex=r||(Math.abs(o.c)*rw+Math.abs(o.s)*rh)/det;\n   const ez=r||(Math.abs(o.s)*rw+Math.abs(o.c)*rh)/det;\n   const eps=1e-7+1e-12*Math.max(Math.abs(o.x),Math.abs(o.z),ex,ez,1);\n   return [o.x-ex-eps,o.z-ez-eps,o.x+ex+eps,o.z+ez+eps];\n  }\n  const union=(a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])];\n  const overlaps=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];\n  const extent=(a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];\n  function* makeIndex(nodes){\n   let envelope=extent(nodes[0],nodes[0]);\n   for(const p of nodes){envelope=union(envelope,extent(p,p));yield 1;}\n   const leaves=[];\n   for(const o of obs){const box=boxOf(o);if(overlaps(box,envelope))leaves.push({box,o});yield 1;}\n   function* build(lo,hi){\n    if(hi-lo===1)return leaves[lo];\n    const mid=(lo+hi)>>1,left=yield* build(lo,mid),right=yield* build(mid,hi);\n    yield 1;\n    return {box:union(left.box,right.box),left,right};\n   }\n   return leaves.length?yield* build(0,leaves.length):null;\n  }\n  function* firstHit(node,ext,test){\n   if(!node)return false;\n   yield 1;\n   if(!overlaps(ext,node.box))return false;\n   if(node.o){yield 1;return test(node.o);}\n   return (yield* firstHit(node.left,ext,test))||(yield* firstHit(node.right,ext,test));\n  }\n  function* solveGraph(blockers,indexed=false){\n   const nodes=[from,to];for(const blocker of blockers)for(const [sx,sz]of [[-1,-1],[1,-1],[1,1],[-1,1]]){const x=sx*(blocker.hw+PAD+CORNER),z=sz*(blocker.hd+PAD+CORNER);nodes.push([blocker.x+x*blocker.c-z*blocker.s,blocker.z+x*blocker.s+z*blocker.c]);if(indexed)yield 1;}\n   const index=indexed?yield* makeIndex(nodes):null;\n   const n=nodes.length,valid=[true,true];for(let i=2;i<n;i++){valid[i]=poly?(yield* polygonClear(nodes[i],nodes[i])):inside(nodes[i]);if(valid[i]&&indexed)valid[i]=!(yield* firstHit(index,extent(nodes[i],nodes[i]),o=>pointBlocked(o,nodes[i])));\n    else if(valid[i])for(const o of obs){const bad=pointBlocked(o,nodes[i]);yield 1;if(bad){valid[i]=false;break;}}}\n   const edges=Array.from({length:n},()=>Array(n).fill(Infinity));\n   if(indexed)for(let j=0;j<n;j++)yield 1;\n   for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(valid[i]&&valid[j]){\n    let clear=yield* polygonClear(nodes[i],nodes[j]);if(!clear)continue;if(indexed)clear=!(yield* firstHit(index,extent(nodes[i],nodes[j]),o=>segmentBlocked(o,nodes[i],nodes[j])));\n    else for(const o of obs){const bad=segmentBlocked(o,nodes[i],nodes[j]);yield 1;if(bad){clear=false;break;}}\n    if(clear)edges[i][j]=edges[j][i]=Math.hypot(nodes[i][0]-nodes[j][0],nodes[i][1]-nodes[j][1]);\n   }\n   const dist=[0,...Array(n-1).fill(Infinity)],prev=Array(n).fill(-1),done=Array(n).fill(false);\n   for(let k=0;k<n;k++){let u=-1;for(let i=0;i<n;i++){if(indexed)yield 1;if(!done[i]&&(u<0||dist[i]<dist[u]))u=i;}if(u<0||!Number.isFinite(dist[u])||u===1)break;done[u]=true;for(let v=0;v<n;v++){if(indexed)yield 1;const d=dist[u]+edges[u][v];if(!done[v]&&d<dist[v]){dist[v]=d;prev[v]=u;}}}\n   if(prev[1]<0)return null;\n   const path=[];for(let v=1;v>0;v=prev[v])path.unshift(nodes[v]);\n   return path.length<=5?path:null;\n  }\n  let path=yield* solveGraph([blocker]);\n  // Default stock yard only: the original blocker may be clustered with nearby\n  // rectangles whose corners are required. Keep a single bounded second attempt.\n  if(!path&&!poly){\n   const nearby=[];\n   const blockerRadius=Math.hypot(blocker.hw+PAD,blocker.hd+PAD);\n   for(const o of obs){\n    if(o!==blocker&&o.radius===undefined){\n     const gap=Math.hypot(o.x-blocker.x,o.z-blocker.z)-blockerRadius-Math.hypot(o.hw+PAD,o.hd+PAD);\n     if(gap<=.25)nearby.push({o,gap});\n    }\n    yield 1;\n   }\n   nearby.sort((a,b)=>a.gap-b.gap);\n   if(nearby.length)path=yield* solveGraph([blocker,...nearby.slice(0,3).map(c=>c.o)],true);\n  }\n  return path?{status:'path',path,snapshot:obs,from,to,pen}:{status:'no-route'};";
function splice(src,from,to){assert(src.split(from).length===2,'exact single test-source anchor required');return src.replace(from,()=>to);}
function transform(src,i){
 const patched=splice(src,patchOld,patchNew);
 assert.equal(hash(patched),repairedSHA[i],'exact reviewed repair source');
 assert.equal(splice(patched,patchNew,patchOld),src);
 const fail=(s,why)=>[s,s.replace("stats.failed++;","stats.failed++;fixtureBedControllerFailure(j,"+why+");")];
 const changes=[
  ['const cowStaticPlanner=(()=>',`const fixtureBedPlannerWitness=new WeakMap();
 function fixtureBedControllerFailure(j,reason){
  const m=fixtureBedPlannerWitness.get(j.planner);
  window.__fixtureBedControllerFailure?.(j.index+1,reason,j.work,j.obs.length,m?.[0]??0,m?.[1]??0,m?.[2]??0);
  if(j.index===1&&reason===3&&j.result?.status==='no-route'&&m?.[1]===1&&m?.[2]===1)
   window.__fixtureBedGeometry?.(j.from,j.goal,j.obs,j.poly,m[3],m[4],j.work,m[0]);
 }
 const cowStaticPlanner=(()=>`],
  [`let total=0,result=null;
 function* work(){`,`let total=0,result=null;
 let probeCount=-1,probeEligible=false,probeNear=0,probeAttempt=false,probeSent=false,probeSubtype=0,probeHops=0;
 function* work(){`],
  [`input.obstacles.length>MAX_OBSTACLES)return{status:'invalid'};`,`input.obstacles.length>MAX_OBSTACLES)return{status:'invalid'};
  probeCount=input.obstacles.length;`],
  [`if(!path&&!poly){
   const nearby=[];`,`if(!path&&!poly){
   probeEligible=true;
   const nearby=[];`],
  [`   if(nearby.length)path=yield* solveGraph([blocker,...nearby.slice(0,3).map(c=>c.o)],true);`,`   probeNear=Math.min(3,nearby.length);
   if(nearby.length){probeAttempt=true;path=yield* solveGraph([blocker,...nearby.slice(0,3).map(c=>c.o)],true);}`],
  [`if(prev[1]<0)return null;`,`if(prev[1]<0){if(indexed)probeSubtype=1;return null;}`],
  [`return path.length<=5?path:null;`,`if(indexed){probeHops=path.length;if(path.length>5)probeSubtype=2;}return path.length<=5?path:null;`],
  ['return{step(budget){if(!Number.isSafeInteger(budget)||budget<0||budget>512)', 'const observedPlanner={step(budget){if(!Number.isSafeInteger(budget)||budget<0||budget>512)'],
  [`return{done:!!result,used,total,result:result?{...result,visits:total}:null};}};
}`,`if(window.__fixtureBedControllerFailure) fixtureBedPlannerWitness.set(observedPlanner,[total,+probeEligible,+probeAttempt,probeSubtype,probeHops]);if(result&&!probeSent){probeSent=true;window.__fixtureBedRepairResult?.(probeCount,+probeEligible,probeNear,+probeAttempt,total,['path','no-route','unsupported','budget','invalid'].indexOf(result.status));}return{done:!!result,used,total,result:result?{...result,visits:total}:null};}};return observedPlanner;
}`],
  fail("if(j.work+routeCost>REQUEST_LIMIT){j.state='failed';stats.failed++;continue;}",1),
  fail("if(budget<=0){if(j.work>=REQUEST_LIMIT){j.state='failed';stats.failed++;}continue;}",2),
  fail("if(r.done){j.result=r.result;if(r.result.status==='path')j.state='ready';else{j.state='failed';stats.failed++;}}",3),
  fail("if(j.work+cost>REQUEST_LIMIT){j.state='failed';stats.failed++;continue;}",4),
  fail("if(!path?.length||path.length>5||path.at(-1)[0]!==j.goal[0]||path.at(-1)[1]!==j.goal[1]){j.state='failed';stats.failed++;continue;}",5),
  ['penEditor,get cowYardActive()', 'penEditor,__fixtureBedRepairStats:()=>cowStaticRecovery.stats(),get cowYardActive()']
 ];
 let output=patched;
 for(const [from,to] of changes)output=splice(output,from,to);
 let restored=output;
 for(const [from,to] of changes.reverse())restored=splice(restored,to,from);
 assert.equal(restored,patched,'only passive ephemeral taps permitted');
 return output;
}
function git(args,input){
 return execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never',...args],{input,maxBuffer:1048576,stdio:['pipe','pipe','pipe'],
  env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}});
}
const str=(args,input)=>git(args,input).toString().trim();
function replaceTree(tree,name,old,newId){
 const bytes=git(['ls-tree','-z',tree]),needle=Buffer.from(old+'\t'+name+'\0'),value=Buffer.from(newId+'\t'+name+'\0'),at=bytes.indexOf(needle);
 assert(at>=0&&bytes.indexOf(needle,at+1)===-1);
 return str(['mktree','-z'],Buffer.concat([bytes.subarray(0,at),value,bytes.subarray(at+needle.length)]));
}
function trees(mode,supplied=[]){
 const out=[];
 for(const [i,source] of [[1,candidate]]){
  const original=git(['show',source+':'+indexFile]);assert.equal(hash(original),originalSHA[i]);
  const observed=Buffer.from(transform(original.toString('utf8'),i));
  const blob=str(['hash-object',...(mode==='--prepare'?['-w']:[]),'--stdin'],observed);
  const input=str(['rev-parse',source+'^{tree}']);
  if(mode==='--prepare'){
   const farm=str(['rev-parse',source+':farm3d']),old=str(['rev-parse',source+':'+indexFile]);
   const newFarm=replaceTree(farm,'index.html',old,blob);out.push(replaceTree(input,'farm3d',farm,newFarm));
  }else{
   const tree=supplied[0];assert(/^[a-f0-9]{40}$/.test(tree)&&tree!==input);
   assert.equal(str(['cat-file','-t',tree]),'tree');
   assert.equal(str(['diff-tree','-r','--no-renames','--name-status',input,tree]),'M\t'+indexFile);
   assert.equal(str(['rev-parse',tree+':'+indexFile]),blob);
   assert.deepEqual(git(['show',tree+':'+indexFile]),observed);out.push(tree);
  }
 }
 if(mode==='--prepare')assert.deepEqual(trees('--verify',out),out);
 return out;
}
if(process.argv[2]==='--prepare'&&process.argv.length===3){process.stdout.write(trees('--prepare').join(' ')+'\n');return;}

function trackRepair(s,d){
 const rows=Array.from({length:5},()=>({countBins:Array(258).fill(0),nearBins:[0,0,0,0],resultBins:[0,0,0,0,0],
  secondaryResults:[0,0,0,0,0],completed:0,eligible:0,secondary:0,maxVisits:0,secondaryMaxVisits:0}));
 const controllerFailures=[];let geometry=null;
 const names=['early','day1','night1','day2','night2'];
 const callback=(count,eligible,near,used,visits,result)=>{
  const row=rows[names.indexOf(s.phase)];
  if(!row||![count,eligible,near,used,visits,result].every(Number.isInteger)||count< -1||count>256||eligible<0||eligible>1||
   near<0||near>3||used<0||used>eligible||visits<0||visits>8192||result<0||result>4)
   throw Error('out-of-range solver observation');
  row.completed++;row.eligible+=eligible;row.secondary+=used;row.countBins[count+1]++;row.nearBins[near]++;row.resultBins[result]++;
  row.maxVisits=Math.max(row.maxVisits,visits);
  if(used){row.secondaryResults[result]++;row.secondaryMaxVisits=Math.max(row.secondaryMaxVisits,visits);}
 };
 Object.defineProperty(window,'__fixtureBedRepairResult',{value:callback,configurable:true});
 Object.defineProperty(window,'__fixtureBedControllerFailure',{value:(cow,reason,work,obstacles,plannerVisits,eligible,secondary)=>{
  const phase=names.indexOf(s.phase);
  if(controllerFailures.length>=64||![cow,reason,work,obstacles,plannerVisits,eligible,secondary,phase].every(Number.isInteger)||
   cow<1||cow>5||reason<1||reason>5||work<0||work>8192||obstacles<0||obstacles>256||plannerVisits<0||plannerVisits>work||
   eligible<0||eligible>1||secondary<0||secondary>eligible||phase<0)throw Error('out-of-range controller failure');
  controllerFailures.push([phase,cow,reason,work,obstacles,plannerVisits,eligible,secondary]);
 },configurable:true});
 Object.defineProperty(window,'__fixtureBedGeometry',{value:(from,to,obs,poly,kind,hops,work,visits)=>{
  if(geometry!==null||s.phase!=='night2'||![1,2].includes(kind)||!Number.isInteger(hops)||
   (kind===1?hops!==0:hops<6||hops>17)||work!==5121||visits!==4690||obs.length!==202)throw Error('exact frozen geometry witness refused');
  const xy=p=>[p[0],p[1]], xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]);
  const [minX,maxX,minZ,maxZ]=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)];
  geometry={from:xy(from),to:xy(to),pen:{minX,maxX,minZ,maxZ},
   obs:obs.map(({x,z,hw,hd,c,s,radius})=>({x,z,hw,hd,c,s,...(radius===undefined?{}:{radius})})),kind,hops,work,visits};
 },configurable:true});
 return {finish(){
  const {requests,applied,cancelled,failed,plannerVisits,maxUsed,queued}=d.__fixtureBedRepairStats();
  delete window.__fixtureBedRepairResult;
  delete window.__fixtureBedControllerFailure;
  delete window.__fixtureBedGeometry;
  return {rows,geometry,controllerFailures,controller:{requests,applied,cancelled,failed,plannerVisits,maxUsed,queued}};
 }};
}

const {topologySafe,capabilityStateSafe}=require('./helpers/ci-isolated-runner.cjs');
const read=p=>fs.readFileSync(p,'utf8');
// Defense in depth: the workflow's reviewed runner is still required to
// establish and attest separate kernel namespaces and non-egress probes.
assert(topologySafe(os.networkInterfaces(),read('/proc/net/route'),read('/proc/net/ipv6_route')),'local-only network namespace required');
assert(capabilityStateSafe(read('/proc/self/status')),'restricted capability state required');
if(process.argv[2]==='--verify'&&process.argv.length===4){process.stdout.write(trees('--verify',process.argv.slice(3)).join(' ')+'\n');return;}
assert(path.isAbsolute(process.env.TEST_ARTIFACTS||''),'private artifact directory required');
const {start}=require('./browser-harness.cjs');
const {makeObserver}=require('./helpers/cow-distribution-observer.cjs');
assert(/^[a-f0-9]{40}$/.test(candidate),'candidate fixture tree not pinned');
const lane=process.argv[2];
assert(lane==='candidateRepair'&&process.argv.length===4,'expected diagnostic lane');
const mirrored=lane==='candidate'||lane==='candidateRepair', repaired=lane==='repair'||lane==='candidateRepair';
const source=mirrored?candidate:base, repairTrees=trees('--verify',process.argv.slice(3));
const served=repairTrees[0];
const file=path.join(process.env.TEST_ARTIFACTS,'daytime-mirror-bedtime-geometry.json');
const phases=[['early',false,40],['day1',false,200],['night1',true,120],['day2',false,240],['night2',true,120]];
const hz=30;

async function setup(page,base,{herd,layout,seed}) {
  await page.addInitScript(()=>{
    Date.now=()=>1792594800000;
    localStorage.setItem('sa3d-guest','1');
    localStorage.setItem('sa3d-seen','1');
  });
  await page.goto(base+'farm3d/?debug&portrait&shot&sim=0&preset=noon',{timeout:45000});
  await page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await page.addScriptTag({content:'window.__makeDistributionObserver=('+makeObserver.toString()+');'});
  return page.evaluate(async ({herd,layout,seed})=>{
    const d=__dbg,G=d.G,t=Date.now();
    const q=new URLSearchParams(location.search);
    if(!q.has('debug')||!q.has('shot')||q.get('sim')!=='0'||q.get('preset')!=='noon'||window.__done!==true)throw Error('controlled fixture flags refused');
    if(d.animals.length!==0||d.cowStations.snapshot().length||d.cowStatus?.job||d.penEditor.snapshot().open||window.__testGameplaySeed?.calls!==0)throw Error('initial process fixture refused');
    d.setClock(0);
    G.close(); G.S.tut=99; G.S.level=20; G.S.coins=9000; G.S.event=null;
    G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
    G.S.pets=[];
    for(const kind of ['chicken','horse','sheep']) if(G.S.pens[kind]) G.S.pens[kind].owned=false;
    G.S.pens.cow={...(G.S.pens.cow||{}),owned:true,list:Array(herd).fill(0),meta:Array.from({length:herd},(_,i)=>({name:'Test Cow '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
    G.view.refresh('all');
    const cows=d.animals.filter(a=>a.kind==='cow'&&!a.gone);
    if(cows.length!==herd||d.animals.length!==herd||!d.cowYardActive||!d.cowStatus||d.cowStatus.job||d.cowStatus.feed>0||d.cowStatus.waterUntil>t||d.cowStatus.cows.some(c=>c.feedCharged))throw Error('herd fixture refused');
    const rng=window.__testGameplaySeed;
    if(rng?.value!==seed||rng.firstCall!==seed*16807/2147483647||rng.calls<herd*4)throw Error('RNG witness refused');
    const original=cows[0].pen.poly.map(p=>p.slice());
    let moved=false;
    const edit={editAttempts:0,editDispatched:0,editValidated:0,editApplied:0,editChoice:0,editStage:0,editKind:0,editIssueMask:0};
    if(layout==='moved'){
      // Save only into this disposable guest profile. Refusal is a reported
      // setup limitation, not ordinary-behavior evidence.
      if(!G.save())throw Error('fixture save refused');
      const {defaultSiteRecord,resolveAnimalPens}=await import('./animal-pen-layout.js?v=1');
      const defaultRecord=defaultSiteRecord('cow');
      const v=defaultRecord.boundary[1];
      // Controls 1–3 are the original unsuccessful whole-pen candidates.
      // Control 9 is the existing cow-runtime fixture's +3 X vertex expansion.
      // These are tested against the actual guest world, not granted approval
      // by the earlier fixture. Never install an invalid candidate directly.
      const commands=[
        [-1,0],[0,-1],[1,0],[0,1],[-2,0],[2,0],[0,-2],[0,2],
      ].map(delta=>({type:'movePen',kind:'cow',delta}));
      commands.push(...[3,1,2].map(dx=>({type:'moveVertex',kind:'cow',id:v.id,to:[Math.round(v.x+dx),Math.round(v.z)]})));
      const bits={LAND:1,OVERLAP:2,PATH:4,SUPPORT:8,ROUTE:16,STAGING:32,ROAMING:64};
      for(const [i,command] of commands.entries()){
        const e=d.penEditor;
        edit.editAttempts++;
        edit.editStage=1;
        if(!e.begin('cow'))break;
        edit.editStage=2;
        if(e.dispatch(command)){
          edit.editDispatched++;
          edit.editStage=3;
          if(await e.validateNow()){
            edit.editValidated++;
            const preview=e.snapshot();
            if(!preview.canApply)throw Error('validated draft not applicable');
            const expected=structuredClone(preview.draft);
            expected.revision++;
            edit.editStage=4;
            if(await e.apply()){
              const saved=G.S.layout.animalPens;
              const solved=resolveAnimalPens(expected).sites.cow;
              if(JSON.stringify(saved)!==JSON.stringify(expected)||saved.revision!==1||d.penRuntime.revision!==saved.revision||
                JSON.stringify(d.penRuntime.layout.sites.cow.polygon)!==JSON.stringify(solved.polygon))throw Error('saved or installed revision did not match validated draft');
              edit.editApplied=1;
              edit.editChoice=i+1;
              edit.editKind=command.type==='movePen'?1:2;
              edit.editStage=5;
              moved=true;
              break;
            }
          }
          for(const issue of e.snapshot().validation?.issues||[])edit.editIssueMask|=(Object.hasOwn(bits,issue.code)?bits[issue.code]:128);
        }
        e.cancel();
      }
      if(!moved)return {accepted:false,edit};
    }
    const active=d.animals;
    const poly=active[0]?.pen?.poly;
    if(active.length!==herd||active.some(a=>a.kind!=='cow'||a.pen?.poly!==poly)||!poly||poly.length<3||!d.cowYardActive)throw Error('installed pen fixture refused');
    if(moved&&(!active[0].pen.custom||JSON.stringify(poly)===JSON.stringify(original)||!active.every(a=>d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05))))throw Error('moved geometry witness refused');
    if(!moved&&active[0].pen.custom)throw Error('default layout unexpectedly custom');
    d.camera.updateMatrixWorld(true);
    const camera=d.camera.clone(), v=active[0].g.position.clone();
    const projectX=(x,z)=>v.set(x,0,z).project(camera).x;
    const xs=poly.map(p=>p[0]), mid=(Math.min(...xs)+Math.max(...xs))/2;
    const half=x=>x<mid-1?-1:x>mid+1?1:0;
    window.__cowDistribution={active,poly,projectX,half,phase:null,night:false,observer:null,travel:null,totals:null};
    return {accepted:true,edit:layout==='moved'?edit:null,initialLowX:active.filter(a=>a.g.position.x<mid).length};
  },{herd,layout,seed});
}

async function observe(page,phase,night,secs,trace=false) {
  await page.evaluate(({phase,night,trace})=>{
    const d=__dbg,s=window.__cowDistribution;
    if(night!==s.night)d.setPreset(night?'night':'noon');
    s.phase=phase;s.night=night;
    s.meetings.begin(phase);
    s.observer=window.__makeDistributionObserver({polygon:s.poly,projectX:s.projectX});
    s.observer.sample(s.active,0,night);
    s.meetings.sample();
    s.travel=new WeakMap();
    s.bedArrived=new Set();
    s.boundary=trace?window.__makeNightTrace(d,s):null;
    s.nightTrace=phase==='night2'?window.__makeNightReplayTrace(d,s):null;
    s.totals={ordinaryLowToHigh:0,ordinaryHighToLow:0,socialSelected:0,socialPlanned:0,socialAbandoned:0,socialUnresolved:0,containmentViolations:0,containmentOutsideFrames:0,physicalBedArrivals:0,bedHoldAwayFrames:0,frames:0};
  },{phase,night,trace});
  for(let frames=secs*hz;frames>0;frames-=300) {
    await page.evaluate(({frames,hz})=>{
      const d=__dbg,s=window.__cowDistribution, dt=1/hz;
      let t=d.clock();
      for(let n=0;n<frames;n++){
        t+=dt; d.setClock(t);
        for(const a of s.active){
          const visiting=()=>!a.cowTask&&a.doing==='social'&&a.label?.startsWith('Visiting ');
          const wasVisiting=visiting(), wasTarget=!!a.target;
          const ox=s.boundary?a.g.position.x:0, oz=s.boundary?a.g.position.z:0;
          s.nightTrace?.before(a);
          a.update(dt,t);
          const visit=visiting(), hasTarget=!!a.target;
          if(visit&&!wasVisiting){s.totals.socialSelected++;if(hasTarget)s.totals.socialPlanned++;}
          if(wasVisiting&&wasTarget&&!hasTarget&&a.doing==='social')s.totals.socialAbandoned++;
          const {x,z}=a.g.position;
          if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('nonfinite position');
          const outside=!d.inPen(a.pen,x,z,-.05);
          s.nightTrace?.after(a,s.totals.frames+1,outside);
          const bad=n%hz===0&&outside;
          if(outside)s.totals.containmentOutsideFrames++;
          // A sleep label is not arrival: check the real station dock after update.
          const bed=a.cowTask;
          if(s.night&&bed?.kind==='bed'&&bed.stage==='hold'&&bed.weight>=1-1e-6){
            const dock=bed.station?.dock;
            if(!Array.isArray(dock)||dock.length!==3||!dock.every(Number.isFinite))throw Error('invalid bed dock');
            const reservation=d.cowStations.snapshot().filter(r=>r.stationId===bed.station.id);
            const valid=reservation.length===1&&reservation[0].arrived===true&&
              reservation[0].animalId===d.cowStatus.cows[a.ref.i]?.id&&
              reservation[0].generation===bed.token?.generation&&bed.token?.stationId===bed.station.id&&
              s.active.filter(b=>b.cowTask?.station?.id===bed.station.id).length===1;
            const arrived=valid&&Math.hypot(x-dock[0],a.g.position.y-dock[1],z-dock[2])<=.05&&!outside;
            if(arrived)s.bedArrived.add(a);
            else s.totals.bedHoldAwayFrames++;
          }
          if(bad)s.totals.containmentViolations++;
          s.boundary?.observe(a,s.totals.frames+1,ox,oz,bad);
          const ordinary=!s.night&&!a.cowTask&&!['eat','drink','sleep','shelter'].includes(a.doing)&&!['eating','sleeping','resting','fleeing'].includes(a.act);
          if(!ordinary){s.travel.delete(a);continue;}
          const prior=s.travel.get(a), side=s.half(x);
          if(side) {
            if(prior&&side!==prior) s.totals[side>0?'ordinaryLowToHigh':'ordinaryHighToLow']++;
            s.travel.set(a,side);
          }
        }
        s.observer.sample(s.active,dt,s.night);
        s.meetings.sample();
        s.totals.frames++;
      }
    },{frames:Math.min(frames,300),hz});
  }
  return page.evaluate(()=>{
    const s=window.__cowDistribution;
    s.totals.physicalBedArrivals=s.bedArrived.size;
    s.totals.socialUnresolved=s.active.filter(a=>a.doing==='social'&&a.target).length;
    return [...Object.entries(s.totals),...Object.entries(s.observer.tally)].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[s.phase+'/'+k,Math.round(v*1e6)/1e6]);
  });
}

function installMeetingLedger(s){
 const make=()=>({attempts:0,repeatedBeforeConfirmation:0,confirmed:0,confirmedAttempt:0,unmatchedConfirmation:0,worldL:0,worldR:0,screenL:0,screenR:0});
 let prior=new WeakMap(),phase=null;
 const attempts=new WeakMap(),directed=new Set(),pairs=new Set(),world={L:new Set(),R:new Set()},screen={L:new Set(),R:new Set()},totals=make();
 const xs=s.poly.map(p=>p[0]),zs=s.poly.map(p=>p[1]),mid=(Math.min(...xs)+Math.max(...xs))/2,screenMid=s.projectX(mid,(Math.min(...zs)+Math.max(...zs))/2);
 const wrappers=[];
 for(const a of s.active){
  const go=a.go;
  if(Object.hasOwn(a,'go')||typeof go!=='function')throw Error('unexpected meeting override');
  function observed(...args){
   if(!s.night&&args[4]==='social'&&typeof args[3]==='string'&&args[3].startsWith('Visiting ')&&!this.cowTask&&s.active.includes(this.friend)&&this.friend!==this&&this.friend.kind==='cow'){
    totals.attempts++;const old=attempts.get(this);
    if(old?.friend===this.friend&&!old.confirmed)totals.repeatedBeforeConfirmation++;
    attempts.set(this,{friend:this.friend,confirmed:false});
   }
   return Reflect.apply(go,this,args);
  }
  a.go=observed;wrappers.push([a,observed]);
 }
 return {
  begin(p){phase=p;prior=new WeakMap();},
  sample(){for(const [i,a] of s.active.entries()){
   const hanging=a.label?.startsWith('Hanging out with ')&&a.friend!=null,prev=prior.get(a),task=a.cowTask;
   if(!s.night&&hanging&&prev&&!prev.hanging&&prev.seeking===a.friend&&!task&&s.active.includes(a.friend)){
    const b=a.friend,gap=Math.hypot(a.g.position.x-b.g.position.x,a.g.position.z-b.g.position.z);
    if(gap<=2.5){
     totals.confirmed++;const pending=attempts.get(a);
     if(pending?.friend===b&&!pending.confirmed){totals.confirmedAttempt++;pending.confirmed=true;}else totals.unmatchedConfirmation++;
     const j=s.active.indexOf(b),pair=[Math.min(i,j),Math.max(i,j)].join(':');directed.add(i+':'+j);pairs.add(pair);
     const w=a.g.position.x>=mid?'R':'L',sc=s.projectX(a.g.position.x,a.g.position.z)>=screenMid?'R':'L';
     totals['world'+w]++;totals['screen'+sc]++;world[w].add(pair);screen[sc].add(pair);
    }
   }
   prior.set(a,{hanging:!!hanging,seeking:a.doing==='social'&&!task?a.friend:null});
  }},
  finish(){if(wrappers.some(([a,fn])=>a.go!==fn))throw Error('meeting wrapper replaced');return {...totals,distinctDirectedPairs:directed.size,distinctUnorderedPairs:pairs.size,repeatConfirmedPairs:totals.confirmed-pairs.size,worldDistinctL:world.L.size,worldDistinctR:world.R.size,screenDistinctL:screen.L.size,screenDistinctR:screen.R.size};}
 };
}
// All live geometry is read-only. Only bounded synthetic-fixture summaries leave the page.
function makeNightTrace(d,s){
 const rows=s.active, beds=d.cowYard.stations.filter(b=>b.kind==='bed');
 if(rows.length!==5||beds.length<5||beds.length>20||!rows.every((a,i)=>a.ref.i===i))throw Error('fixed cow/bed ordering refused');
 const bounds=k=>{const raw=s.poly.map(p=>p[k]);return (Math.min(...raw)+Math.max(...raw))/2;};
 const cx=bounds(0),cz=bounds(1),points=[0,30,150,450,900,1800,2700,3600];
 const units=(n,signed=false)=>{
  if(!Number.isFinite(n)||Math.abs(n)>500||(!signed&&n<0))throw Error('fixture measurement range refused');
  return Math.round(n*100);
 };
 const planar=(a,b,c,e)=>Math.hypot(a-c,b-e);
 const enumVal=(x,arr)=>x==null?0:arr.includes(x)?arr.indexOf(x)+1:arr.length+1;
 const ords=new Map(rows.map((a,i)=>[d.cowStatus.cows[a.ref.i]?.id,i+1]));
 if(ords.size!==5||ords.has(undefined))throw Error('fixture cow identities refused');
 const summaries=rows.map((_,i)=>({cow:i+1,
  firstBed:null,firstBedOrdinal:0,stationChanges:0,lastStation:0,firstReservationArrived:null,firstDock:null,firstFullHold:null,firstPhysical:null,firstSustainedApproachStop:null,
  movingApproachFrames:0,stillApproachFrames:0,movingNoBedFrames:0,
  approachPathFrames:0,approachPendingFrames:0,approachEmptyFrames:0,approachClosePeerFrames:0,
  waypointCloserFrames:0,waypointFartherFrames:0,waypointFlatFrames:0,approachDistance:0,streak:0,checkpoints:[]}));
 function snap(a,res){
  const t=a.cowTask, g=a.g.position, bed=t?.kind==='bed'?t:null;
  const path=bed?.path||[],pending=bed?.waypoints||[];
  const node=path.length?[path[0].x,path[0].y]:pending.length?[pending[0][0],pending[0][2]]:null;
  const dock=bed?.station?.dock;
  const st=bed?beds.findIndex(x=>x.id===bed.station?.id)+1:0;
  if(bed&&(!st||!Array.isArray(dock)||dock.length!==3||!dock.every(Number.isFinite)))throw Error('fixture bed refused');
  const reservation=bed?res.filter(r=>r.stationId===bed.station.id):[];
  const record=reservation.length===1?reservation[0]:null;
  const owns=record!==null&&ords.get(record.animalId)===a.ref.i+1&&record.generation===bed.token?.generation&&bed.token?.stationId===bed.station.id;
  const unique=!!bed&&rows.filter(b=>b.cowTask?.station?.id===bed.station.id).length===1;
  const dXZ=dock?planar(g.x,g.z,dock[0],dock[2]):null, dY=dock?g.y-dock[1]:null;
  const atDock=dock?Math.hypot(dXZ,dY)<=.05:false;
  const full=bed?.stage==='hold'&&bed.weight>=1-1e-6;
  let peer=0,nearest=Infinity;
  for(const b of rows)if(b!==a){
   const distance=planar(g.x,g.z,b.g.position.x,b.g.position.z);
   if(distance<nearest){nearest=distance;peer=b.ref.i+1;}
  }
  return {x:g.x,z:g.z,node,nearest,approach:bed?.stage==='approach',
   projected:[units(g.x-cx,true),units(g.z-cz,true),
    enumVal(t?.kind,['bed','robot','feed','drink']),enumVal(t?.stage,['approach','align','hold','stand','exit']),
    enumVal(a.doing,['social','eat','drink','sleep','shelter']),enumVal(a.act,['idle','moving','sleeping','resting','eating','fleeing']),
    a.target?1:0,st,record?(ords.get(record.animalId)??6):0,
    owns?1:0,record?.arrived===true?1:0,unique?1:0,atDock?1:0,full?1:0,
    dXZ==null?null:units(dXZ),dY==null?null:units(dY,true),
    Math.min(path.length,200),Math.min(pending.length,200),node?units(planar(g.x,g.z,...node)):null,
    peer,units(nearest)]};
 }
 function onFrame(a,frame,before,after,outside){
  const c=summaries[a.ref.i],p=after.projected;
  if(p[7]&&c.firstBed===null){c.firstBed=frame;c.firstBedOrdinal=p[7];}
  if(p[7]!==c.lastStation){if(frame>0)c.stationChanges++;c.lastStation=p[7];}
  if(p[9]&&p[10]&&c.firstReservationArrived===null)c.firstReservationArrived=frame;
  if(p[12]&&c.firstDock===null)c.firstDock=frame;
  if(p[13]&&c.firstFullHold===null)c.firstFullHold=frame;
  if(!outside&&p[9]&&p[10]&&p[11]&&p[12]&&p[13]&&c.firstPhysical===null)c.firstPhysical=frame;
  if(points.includes(frame)) c.checkpoints.push([frame,...p]);
  if(!before)return;
  const moved=planar(before.x,before.z,after.x,after.z);
  if(before.approach||after.approach){
   c[moved>1e-6?'movingApproachFrames':'stillApproachFrames']++;
   c.approachDistance+=moved;
   if(before.nearest<.85)c.approachClosePeerFrames++;
   if(p[16])c.approachPathFrames++;else if(p[17])c.approachPendingFrames++;else c.approachEmptyFrames++;
   if(before.node){
    const change=planar(before.x,before.z,...before.node)-planar(after.x,after.z,...before.node);
    c[change>1e-6?'waypointCloserFrames':change<-1e-6?'waypointFartherFrames':'waypointFlatFrames']++;
   }
   c.streak=moved<=1e-6&&before.approach&&after.approach?c.streak+1:0;
   if(c.streak===30&&c.firstSustainedApproachStop===null)c.firstSustainedApproachStop=frame-29;
  }else{
   c.streak=0;
   if(!p[7]&&moved>1e-6)c.movingNoBedFrames++;
  }
 }
 const state=new WeakMap();
 // Dusk is sampled after installing the original night preset, before the first night update.
 const reservations=d.cowStations.snapshot();
 for(const a of rows)onFrame(a,0,null,snap(a,reservations),!d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05));
 return {
  before(a){state.set(a,snap(a,d.cowStations.snapshot()));},
  after(a,frame,outside){onFrame(a,frame,state.get(a),snap(a,d.cowStations.snapshot()),outside);},
  finish(){return summaries.map(({streak,lastStation,approachDistance,...c})=>({...c,terminalApproachStillFrames:streak,approachDistanceCm:Math.round(approachDistance*100)}));}
 };
}

async function main(){
 const seed=1,fixture={herd:5,layout:'default'};
 const row={seed,...fixture,status:'pass',counters:[],meetings:null};
 const h=await start({ref:served,deviceScaleFactor:.5,gameplaySeed:seed});
 try{
  const guest=await h.setup({width:844,height:390},false,'day-candidate-unused');
  try{
   const p=guest.page,prepared=await setup(p,h.base,{...fixture,seed});
   assert(prepared.accepted&&!prepared.edit,'original fixture refused');
   row.counters.push(['initialLowX',prepared.initialLowX]);
   await p.addScriptTag({content:'window.__installMeetingLedger=('+installMeetingLedger.toString()+');'});
   await p.evaluate(()=>{const s=window.__cowDistribution;s.meetings=window.__installMeetingLedger(s);});
   await p.addScriptTag({content:'window.__makeNightReplayTrace=('+makeNightTrace.toString()+');'});
   if(repaired){
    await p.addScriptTag({content:'window.__trackBedRepair=('+trackRepair.toString()+');'});
    await p.evaluate(()=>{const s=window.__cowDistribution;s.repairDiagnostic=window.__trackBedRepair(s,__dbg);});
   }
   for(const [phase,night,secs] of phases) row.counters.push(...await observe(p,phase,night,secs));
   row.meetings=await p.evaluate(()=>window.__cowDistribution.meetings.finish());
   const cows=await p.evaluate(()=>window.__cowDistribution.nightTrace.finish());
   const planner=repaired?await p.evaluate(()=>window.__cowDistribution.repairDiagnostic.finish()):null;
   assert.equal(guest.errors.length,0,'diagnostic browser errors');
   fs.writeFileSync(file,JSON.stringify({schema:1,source,served,lane,row,cows,planner})+'\n',{mode:0o600,flag:'wx'});
  }finally{await guest.page.close();}
 }finally{await h.close();}
}
main().catch(()=>{console.error('daytime mirror bedtime diagnostic failed before finite export');process.exitCode=1;});
