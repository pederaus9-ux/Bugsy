// One test-only pre-domain envelope experiment. No production integration.
import * as T from '../../lib/three.module.min.js';
import {cowMotionDomains} from './cow-motion-domains.mjs';
import {cacheCowCompound,compoundBounds,cowSweptQuery as referenceQuery} from './cow-hierarchical-sweep.mjs';
import {copyCowRig,captureCowPreviewBase,previewCowFrame} from './cow-pose-preview.mjs';
import {cowRigidSweepClear} from './cow-rigid-sweep.mjs';
export {cacheCowCompound,compoundBounds};
const saved=new WeakMap(),P=x=>[x,x],overlap=(a,b)=>a.every((x,k)=>x[0]<=b[k+3]&&x[1]>=b[k]);
const encode=x=>JSON.stringify(x,(k,v)=>typeof v==='number'?(Object.is(v,-0)?'negative-zero':Number.isFinite(v)?v:'nonfinite:'+String(v)):v);
const nodes=r=>[r.g,r.model,...r.card.skeleton.bones].map(n=>[n.position.toArray(),n.rotation.toArray(),n.quaternion.toArray(),n.scale.toArray(),n.matrix.toArray(),n.matrixWorld.toArray(),n.matrixAutoUpdate]);
export const envelopeStateKey=(r,q,displayed)=>encode({state:r.state,legs:r.legs.map(l=>Object.fromEntries(Object.entries(l).filter(([k])=>!['hip','knee','foot'].includes(k)))),base:nodes(r),displayed:displayed&&nodes(displayed),q});
const stamp=(r,boxes,options)=>encode({context:options.context,boxes,rootObstacles:options.rootObstacles||[],versions:['position','skinWeight','skinIndex'].map(k=>r.card.geometry.attributes[k].version)});
const displayedDomain=r=>{const inv=new T.Matrix4().copy(r.model.matrixWorld).invert();return{boneFrames:r.card.skeleton.bones.map(b=>new T.Matrix4().multiplyMatrices(inv,b.matrixWorld).elements.map(P)),yaw:P(r.model.rotation.y),rootPos:r.g.position.toArray().map(P),scale:r.model.scale.x};};
function rootClear(r,q,obstacles){const from={x:r.g.position.x,y:r.g.position.y,z:r.g.position.z,yaw:r.model.rotation.y},to={...from,x:from.x+(q.dx||0),y:from.y+(q.dy||0),z:from.z+(q.dz||0)};return cowRigidSweepClear({parts:[],from,to,solids:[],rootObstacles:obstacles,rootPad:.42});}

function prepare(r,cache,boxes,options){
 const begin=performance.now(),entry={geometry:r.card.geometry,stamp:stamp(r,boxes,options),cursor:0,states:[],clear:false,bounds:cache.groups.map(()=>[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]]),reason:null};
 let base=captureCowPreviewBase(r,{overlayState:'reset'}),displayed=copyCowRig(options.displayedStart),rt=options.requests[0].evaluatedRt;
 const absorb=d=>{const b=compoundBounds(cache,d);for(let i=0;i<cache.groups.length;i++){const a=b.bound(cache.groups[i]),out=entry.bounds[i];for(let k=0;k<3;k++){out[k][0]=Math.min(out[k][0],a[k][0]);out[k][1]=Math.max(out[k][1],a[k][1]);}}};
 try{
  for(const planned of options.requests){const q={...planned,evaluatedRt:rt};entry.states.push(envelopeStateKey(base.rig,q,displayed));
   if(!rootClear(base.rig,q,options.rootObstacles||[])){entry.reason='root-padding';break;}
   absorb(displayedDomain(displayed));absorb(cowMotionDomains(base.rig,q));
   if(base.rig.legs.some((l,i)=>!l.planted&&(l.rt<1||q.evaluatedRt?.[i]<l.rt)))absorb(cowMotionDomains(base.rig,{...q,recoveryFraction:[0,1]},0,0));
   const before=base.rig.legs.map(l=>({planted:l.planted,rt:l.rt})),next=previewCowFrame(base,q);rt=next.nextBase.rig.legs.map((l,i)=>before[i].planted&&!l.planted?0:before[i].rt);base.rig.dispose();displayed.dispose();base=next.nextBase;displayed=next.rig;
  }
  if(!entry.reason){outer:for(let i=0;i<entry.bounds.length;i++)for(let j=0;j<boxes.length;j++)if(overlap(entry.bounds[i],boxes[j])){entry.reason='conservative-envelope-overlap';entry.firstOverlap={group:i,solid:j,bounds:entry.bounds[i],box:boxes[j]};break outer;}}
  entry.clear=!entry.reason;
 }catch(e){entry.reason='unsupported-envelope';entry.error=String(e.message);}
 finally{base.rig.dispose();displayed.dispose();entry.buildMs=performance.now()-begin;}
 return entry;
}

export function envelopeQuery(r,cache,q,boxes,options={}){
 const fallback=extra=>({...referenceQuery(r,cache,q,boxes,options),fastHit:false,...extra});
 // A certificate is for one exact native forecast and installed environment,
 // never for arbitrary nearby poses. Misses keep the complete reference check.
 if(!options.displayedStart||!options.context||!Number.isInteger(options.context.layoutRevision)||!Number.isInteger(options.context.supportRevision)||!options.context.support||!Array.isArray(options.requests)||options.requests.length<1||options.requests.length>8)return fallback({fastReason:'missing-or-unsupported-provenance'});
 if(cache.geometry!==r.card.geometry||cache.versions.some((v,i)=>v!==[r.card.geometry.attributes.position.version,r.card.geometry.attributes.skinWeight.version,r.card.geometry.attributes.skinIndex.version][i]))return fallback({fastReason:'geometry-invalidated'});
 const currentStamp=stamp(r,boxes,options),key=envelopeStateKey(r,q,options.displayedStart);let e=saved.get(r),buildMs,invalidated=null;
 if(e&&(e.geometry!==r.card.geometry||e.stamp!==currentStamp||e.states[e.cursor]!==key)){invalidated=e.stamp!==currentStamp?'environment':'state-or-request';saved.delete(r);e=null;}
 if(!e||e.cursor>=e.states.length){e=prepare(r,cache,boxes,options);saved.set(r,e);buildMs=e.buildMs;}
 const matches=e.states[e.cursor]===key;e.cursor++;
 if(e.clear&&matches&&rootClear(r,q,options.rootObstacles||[]))return{clear:true,fastHit:true,domains:0,visited:0,fastReason:'validated-native-window',buildMs,invalidated};
 return fallback({fastReason:matches?e.reason:'forecast-state-mismatch',buildMs,invalidated,firstOverlap:e.firstOverlap,envelopeError:e.error});
}
export const cowSweptQuery=envelopeQuery;
