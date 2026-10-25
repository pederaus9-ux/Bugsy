import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Session} from 'node:inspector/promises';
import * as T from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';
import {createCowYard} from '../cow-yard.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';
import {getAnimalCarePose} from '../animal-care-poses.js';
import {copyCowRig} from './helpers/cow-pose-preview.mjs';
import {cacheCowCompound,cowSweptQuery} from './helpers/cow-hierarchical-sweep.mjs';

const name=process.argv[2],alloc=process.argv[3]==='alloc';
if(!/^[a-z0-9-]+$/.test(name||''))throw Error('Unique evidence name required');
const dir=new URL('./evidence/pen-editing-implementation/task8-codex-sweep-performance-20261025/',import.meta.url),file=new URL(name+'.json',dir);
if(fs.existsSync(file))throw Error('Preserve evidence');
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),v=yard.componentVolumes();
// Same authored solids for every cow, including distant fixtures. Shelter[0:2]
// is floor/walkway support and[15:20] bedding, not solid movement obstacles.
// Grain[3] and water[5] are intentional care contact media, as in prior probes.
const boxes=[...v.shelter.slice(2,15),...v.shelter.slice(20),...v.feedBunk.slice(0,3),...v.trough.slice(0,5),...v.robot];
const rootObstacles=v.shelter.slice(2,10).map(b=>[(b[0]+b[3])/2,(b[2]+b[5])/2,(b[3]-b[0])/2,(b[5]-b[2])/2]);
const ids=['cow-feed-1','cow-feed-2','cow-drink','cow-robot'],stations=ids.map(id=>yard.stations.find(s=>s.id===id));
stations.push({id:'free-cow',kind:'free',dock:[0,.08,-34.1],facing:-Math.PI});
assert.equal(new Set(stations.map(s=>s.id)).size,5);
const records=stations.map((s,i)=>{
 const r=createCow3D(1.7,s.dock[0],s.dock[2],i),isCare=['feed','drink'].includes(s.kind),act=isCare?'eating':'idle';
 r.g.position.y=s.dock[1];r.model.rotation.y=s.facing+Math.PI;
 for(let j=0;j<60;j++)updateCow3D(r,0,0,1/30,j/30,act);
 const overlay=getAnimalCarePose('cow',r);let care;
 if(isCare){const object=yard.targets.find(t=>t.kind===(s.kind==='feed'?'feed':'water')).object,center=new T.Box3().setFromObject(object).getCenter(new T.Vector3()),target=[s.kind==='feed'?s.dock[0]:center.x,s.surface,s.kind==='feed'?center.z:s.dock[2]],weight=[.35,.55,.75][i];care={mode:s.kind,weightFrom:weight,weight,target};overlay.apply({...care,target:new T.Vector3(...target)});}
 r.g.updateMatrixWorld(true);const displayed=copyCowRig(r);overlay.reset();
 return{r,displayed,overlay,s,q:{dt:1/30,act,evaluatedRt:r.legs.map(l=>l.rt),...(care?{care}:{})}};
});
let minSeparation=Infinity;
for(let i=0;i<5;i++)for(let j=0;j<i;j++){const d=records[i].r.g.position.distanceTo(records[j].r.g.position);minSeparation=Math.min(minSeparation,d);assert(d>=.85);}
global.gc?.();const beforeCache=process.memoryUsage().heapUsed,buildStart=performance.now(),cache=cacheCowCompound(records[0].r),cacheBuildMs=performance.now()-buildStart;
global.gc?.();const cacheRetainedHeapBytes=process.memoryUsage().heapUsed-beforeCache,heapStart=process.memoryUsage().heapUsed;
const times=[],cold=[],counters={domains:0,visited:0,leafVisits:0,certificateHits:0,nodeCertificateHits:0},perCow=records.map(c=>({id:c.s.id,kind:c.s.kind,root:c.r.g.position.toArray(),samples:[],max:0}));
let error=null,sampler=null,allocation=null,completed=0;
try{
 for(let k=0;k<120;k++){
  if(alloc&&k===20){sampler=new Session();sampler.connect();await sampler.post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
  const begin=performance.now();
  for(let i=0;i<5;i++){
   const c=records[i],start=performance.now(),displayed=copyCowRig(c.displayed),result=cowSweptQuery(c.r,cache,c.q,boxes,{rootObstacles,displayedStart:displayed}),ms=performance.now()-start;
   assert(result.clear,JSON.stringify({id:c.s.id,frame:k,result}));displayed.dispose();
   if(k>=20){perCow[i].samples.push(ms);perCow[i].max=Math.max(perCow[i].max,ms);for(const key of Object.keys(counters))counters[key]+=result[key]||0;}
  }
  const ms=performance.now()-begin;(k<20?cold:times).push(ms);completed++;
  // Production updates are outside timed collision-query work. Advance every
  // cow's real channels; do not benchmark a frozen pose as moving gameplay.
  for(const c of records){const rt=c.r.legs.map(l=>l.rt);updateCow3D(c.r,0,0,1/30,k/30,c.q.act);c.q.evaluatedRt=rt;if(c.q.care)c.overlay.apply({...c.q.care,target:new T.Vector3(...c.q.care.target)});c.r.g.updateMatrixWorld(true);c.displayed.dispose();c.displayed=copyCowRig(c.r);c.overlay.reset();}
 }
}catch(e){error=e.stack;console.error(e.message);}
if(sampler){const {profile}=await sampler.post('HeapProfiler.stopSampling');sampler.disconnect();fs.writeFileSync(new URL(name+'.heapprofile',dir),JSON.stringify(profile));let query=0,copy=0,total=0;const top=[];function walk(n,inQuery=false,inCopy=false){inQuery ||= n.callFrame.functionName==='cowSweptQuery';inCopy ||= n.callFrame.functionName==='copyCowRig';total+=n.selfSize;if(inQuery)query+=n.selfSize;if(inCopy)copy+=n.selfSize;if(n.selfSize)top.push({fn:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,bytes:n.selfSize});for(const c of n.children)walk(c,inQuery,inCopy);}walk(profile.head);allocation={method:'V8 sampling,16384-byte interval; collected minor/major objects included; estimates, not exact byte counts',totalEstimatedBytes:total,queryEstimatedBytes:query,copyEstimatedBytes:copy,estimatedQueryBytesPerFive:query/Math.max(1,times.length),estimatedCopyBytesPerFive:copy/Math.max(1,times.length),top:top.sort((a,b)=>b.bytes-a.bytes).slice(0,15)};}
const heapBeforeFinalGC=process.memoryUsage().heapUsed;global.gc?.();const retainedAfterQueries=process.memoryUsage().heapUsed-heapStart;
const stats=a=>{const s=[...a].sort((x,y)=>x-y);return{median:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1)}};
const result={status:error?'RED':'CAPACITY_VALID_QUERY_COST_MEASURED',name,allocationInstrumented:alloc,engine:process.versions,completedFrames:completed,measuredFrames:times.length,fixtures:perCow.map(c=>({id:c.id,kind:c.kind,root:c.root,costMs:stats(c.samples)})),minSeparation,obstacles:boxes.length,rootObstacles:rootObstacles.length,addedFiveCowMs:stats(times),warmupWorstMs:Math.max(...cold),averageCounters:Object.fromEntries(Object.entries(counters).map(([k,n])=>[k,n/Math.max(1,times.length)])),memory:{cacheBuildMs,cacheRetainedHeapBytes,heapBeforeFinalGC,retainedAfterQueries},allocation,error,sourceHashes:Object.fromEntries(['helpers/cow-hierarchical-sweep.mjs','helpers/cow-motion-domains.mjs'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')])),limits:'Capacity-valid independent scene fixture, no live controller/reservation completion claim. Same obstacle set for all five; two feed, one drink, one robot, one free awake cow. All queries include displayed copy and complete temporal traversal. Excludes renderer, ordinary animation and controller. Node desktop only. Allocation-profiled timing is diagnostic, not the uninstrumented performance comparison.'};
fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,completed,result:result.addedFiveCowMs,memory:result.memory,allocation:allocation&&{queryPerFive:allocation.estimatedQueryBytesPerFive,copyPerFive:allocation.estimatedCopyBytesPerFive}}));
for(const c of records){c.displayed.dispose();c.r.dispose();}yard.dispose();if(error)process.exitCode=1;
