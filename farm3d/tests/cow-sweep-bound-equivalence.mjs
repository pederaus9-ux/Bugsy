import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
import * as T from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';
import {createCowYard} from '../cow-yard.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';
import {copyCowRig} from './helpers/cow-pose-preview.mjs';
import {cowMotionDomains} from './helpers/cow-motion-domains.mjs';
import {cacheCowCompound,compoundBounds} from './helpers/cow-hierarchical-sweep.mjs';

const baselineHead='525cdccf4afc52346603aaa0802498fb31204472';
const name=process.argv[2];
if(!/^[a-z0-9-]+$/.test(name||''))throw Error('Unique evidence name required');
const file=new URL('./evidence/pen-editing-implementation/task8-codex-sweep-performance-20261025/'+name+'.json',import.meta.url);
if(fs.existsSync(file))throw Error('Preserve evidence');
const helper=new URL('./helpers/cow-hierarchical-sweep.mjs',import.meta.url);
const original=execFileSync('git',['show',baselineHead+':farm3d/tests/helpers/cow-hierarchical-sweep.mjs'],{encoding:'utf8'});
// Load the immutable Git preimage. Rebase only import URLs; never copy or edit
// the saved implementation or its arithmetic.
const source=original.replace(/from '([^']+)'/g,(_,p)=>`from '${new URL(p,helper).href}'`);
const baseline=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const yard=createCowYard({layout:resolveAnimalPens().sites.cow}),initial=createCow3D(),cache=cacheCowCompound(initial),dt=1/30;
const q={dx:0,dz:0,dt,act:'idle'},cases=[{name:'idle',r:initial,q},{name:'walk-start',r:copyCowRig(initial),q:{...q,dz:-.8*dt,act:'moving'}}];
const moving=createCow3D();let evaluatedRt;
for(let i=0;i<60;i++){evaluatedRt=moving.legs.map(l=>l.rt);moving.g.position.z-=.8*dt;updateCow3D(moving,0,-.8*dt,dt,i*dt,'moving');}
cases.push({name:'walking',r:moving,q:{...q,dz:-.8*dt,act:'moving',evaluatedRt}},{name:'turn',r:copyCowRig(moving),q:{...q,dx:.8*dt,act:'moving',evaluatedRt}},{name:'stop-recovery',r:copyCowRig(moving),q:{...q,evaluatedRt}});
for(const s of yard.stations.filter(s=>['feed','drink'].includes(s.kind))){const r=createCow3D(1.7,s.dock[0],s.dock[2],0);r.g.position.y=s.dock[1];r.model.rotation.y=s.facing+Math.PI;const object=yard.targets.find(t=>t.kind===(s.kind==='feed'?'feed':'water')).object,c=new T.Box3().setFromObject(object).getCenter(new T.Vector3());cases.push({name:s.id+'-onset',r,q:{...q,act:'eating',care:{mode:s.kind,weightFrom:0,weight:dt/1.1,target:[s.kind==='feed'?s.dock[0]:c.x,s.surface,s.kind==='feed'?c.z:s.dock[2]]}}});}
cases.push({name:'lie-onset',r:copyCowRig(initial),q:{...q,act:'resting',care:{mode:'lie',weightFrom:0,weight:dt/1.1}}},{name:'support-height-event',r:copyCowRig(initial),q:{...q,support:{kind:'height-union',heights:[0,.08]}}});
const wrap=copyCowRig(initial);wrap.state.chewPhase=2*Math.PI-.02;wrap.state.chewAmount=.8;wrap.state.chewDrive=.8;cases.push({name:'chew-wrap',r:wrap,q:{...q,act:'eating'}});
const rows=[],nodes=[...cache.nodes,...cache.pointNodes];let error=null,coefficients=0;
const widen=d=>{const expand=v=>[v[0]-.002,v[1]+.002];return{...d,yaw:expand(d.yaw),rootPos:d.rootPos.map(expand),boneFrames:d.boneFrames.map(m=>m.map((v,k)=>k%4===3?[...v]:expand(v)))};};
const equal=(a,b,context)=>{for(let k=0;k<3;k++)for(let j=0;j<2;j++){assert(Object.is(a[k][j],b[k][j]),JSON.stringify({context,k,j,baseline:a[k][j],candidate:b[k][j]}));coefficients++;}};
try{
 for(const c of cases){const domain=cowMotionDomains(c.r,c.q),variants=[['whole',domain],['certificate',widen(domain)],['interior',cowMotionDomains(c.r,c.q,.17,.63)]];if(c.q.evaluatedRt)variants.push(['recovery-event',cowMotionDomains(c.r,{...c.q,recoveryFraction:[0,1]},0,0)]);
  for(const [variant,d]of variants){const a=baseline.compoundBounds(cache,d),b=compoundBounds(cache,d);for(const n of nodes)equal(a.bound(n),b.bound(n),{case:c.name,variant,node:n.id});rows.push({case:c.name,variant,nodes:nodes.length,status:'BITWISE_EQUAL'});}
  console.log(c.name+' exact bounds PASS');
 }
 const d=cowMotionDomains(initial,q),a=baseline.compoundBounds(cache,d).bound(cache.root),broken=structuredClone(a);broken[0][0]+=1e-8;assert.throws(()=>equal(a,broken,'deliberate-bound-error'));
}catch(e){error=e.stack;console.error(e.message);}
fs.writeFileSync(file,JSON.stringify({status:error?'RED':'PASS',baselineHead,baselineSha256:crypto.createHash('sha256').update(original).digest('hex'),candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(helper)).digest('hex'),rows,coefficients,negativeControl:'1e-8 bound change rejected with exact Object.is, no tolerance',error,limits:'Finite differential evidence plus operation-order-preserving implementation review. The motion provider, traversal, predicates, guards and cache validity rules are unchanged. Not live runtime or phone evidence.'},null,2));
yard.dispose();for(const c of cases)c.r.dispose();if(error)process.exitCode=1;
