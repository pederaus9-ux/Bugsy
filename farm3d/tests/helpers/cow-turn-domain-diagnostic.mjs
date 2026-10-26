import * as T from '../../lib/three.module.min.js';
import {updateCow3D} from '../../cow3d.js';
import {copyCowRig} from './cow-pose-preview.mjs';
import {cacheCowTriangles,cowDiscreteQuery} from './cow-cached-solid-query.mjs';

const plainLeg=l=>Object.fromEntries(Object.entries(l).filter(([k])=>!['hip','knee','foot'].includes(k)));
const snapshot=r=>({root:r.g.position.toArray(),yaw:r.model.rotation.y,state:{...r.state},legs:r.legs.map(plainLeg),matrices:[r.g,r.model,...r.card.skeleton.bones].map(n=>({local:n.matrix.toArray(),world:n.matrixWorld.toArray()}))});
const key=r=>JSON.stringify(snapshot(r),(_,v)=>typeof v==='number'&&Object.is(v,-0)?'-0':v);
export function installTurnDiagnostic(){
 const d=window.__turnDiag={history:[],rejected:[],phaseMismatches:[],guard:null,current:null,lastNative:new Map(),native:null,activeDomain:null,domainCalls:0,nonmutationChecks:0,
  before(c,q,frame,stage,boxes){this.current={c,q:structuredClone(q),frame,stage,boxes,pre:snapshot(c.r),key:key(c.r)};
   const prior=this.lastNative.get(c.s.id);if(prior)for(let i=0;i<4;i++)if(!c.r.legs[i].planted&&prior.legs[i].evaluatedRt!==null&&c.evaluatedRt[i]!==prior.legs[i].evaluatedRt)this.phaseMismatches.push({frame,station:c.s.id,leg:i,fixture:c.evaluatedRt[i],actual:prior.legs[i].evaluatedRt,stored:c.r.legs[i].rt});
   if(frame>=149)this.history.push({frame,stage,station:c.s.id,request:structuredClone(q),pre:this.current.pre,priorNative:prior||null});
  },
  result(result){const a=this.current;if(key(a.c.r)!==a.key)throw Error('Diagnostic found query mutation');this.nonmutationChecks++;if(!result.clear){const row={frame:a.frame,stage:a.stage,station:a.c.s.id,q:a.q,pre:a.pre,result:structuredClone(result),base:copyCowRig(a.c.r),displayed:copyCowRig(a.c.displayed),boxes:a.boxes,end:null};this.rejected.push(row);a.row=row;}},
  nativeBegin(c,frame){this.native={rig:c.r,station:c.s.id,frame,recovery:new Map(),legs:[]};},
  recovery(r,l,rt){if(this.native?.rig===r)this.native.recovery.set(l,rt);},
  pose(r,l,tx,tz,lift){const n=this.native;if(n?.rig===r)n.legs.push({index:r.legs.indexOf(l),tx,tz,lift,planted:l.planted,storedRt:l.rt,evaluatedRt:n.recovery.has(l)?n.recovery.get(l):null});},
  after(c){const n=this.native;if(n?.rig===c.r){this.lastNative.set(c.s.id,{frame:n.frame,legs:n.legs});this.native=null;}if(this.current?.row)this.current.row.end=copyCowRig(c.r);},
  domain(r,request,lo,hi,i,tx,tz,lift,extra){this.domainCalls++;this.activeDomain={request:structuredClone(request),fraction:[lo,hi],leg:i,tx:[...tx],tz:[...tz],lift:[...lift],extra:structuredClone(extra)};},
  fail(p){const a=this.current;this.guard={frame:a?.frame,station:a?.c.s.id,request:a?.q,pre:a?.pre,priorNative:a&&this.lastNative.get(a.c.s.id),offending:structuredClone(p),domain:this.activeDomain};if(a){this.failed={base:copyCowRig(a.c.r),q:a.q,displayed:copyCowRig(a.c.displayed),boxes:a.boxes};if(key(a.c.r)!==a.key)throw Error('Failed query mutated rig');}},
  export(){return{guard:this.guard,history:this.history,phaseMismatches:this.phaseMismatches,domainCalls:this.domainCalls,nonmutationChecks:this.nonmutationChecks,rejections:this.rejected.map(({base,displayed,end,boxes,...row})=>row)};}
 };return d;
}

function matrixDifference(a,b){let maximum=0;for(const [i,n]of[a.g,a.model,...a.card.skeleton.bones].entries()){const m=[b.g,b.model,...b.card.skeleton.bones][i];for(const field of['matrix','matrixWorld'])for(let k=0;k<16;k++)maximum=Math.max(maximum,Math.abs(n[field].elements[k]-m[field].elements[k]));}return maximum;}
function nativeFraction(base,q,f,diagnostic){const r=copyCowRig(base),poses=[];diagnostic.native={rig:r,station:'shadow',frame:f,recovery:new Map(),legs:poses};r.g.position.x+=(q.dx||0)*f;r.g.position.y+=(q.dy||0)*f;r.g.position.z+=(q.dz||0)*f;updateCow3D(r,(q.dx||0)*f,(q.dz||0)*f,q.dt*f,0,q.act);r.g.updateMatrixWorld(true);diagnostic.native=null;return{r,poses};}
export function classifyRejection(index){
 const d=window.__turnDiag,row=d.rejected[index];if(!row)throw Error('Missing rejection');const before=key(row.base),cache=cacheCowTriangles(row.base),range=row.result.hit?.fraction||[];
 const fractions=[...new Set([1e-6,.25,.5,.75,1,...range,...(range.length?[(range[0]+range[1])/2]:[])])].sort((a,b)=>a-b),samples=[];
 const displayed=cowDiscreteQuery(row.displayed,cache,row.boxes);let endpointDifference=null;
 for(const f of fractions){const {r,poses}=nativeFraction(row.base,row.q,f,d),query=cowDiscreteQuery(r,cache,row.boxes);if(f===1&&row.end)endpointDifference=matrixDifference(r,row.end);samples.push({fraction:f,hit:query.hit,poses});r.dispose();}
 if(key(row.base)!==before)throw Error('Native sampling mutated captured base');
 if(endpointDifference!==0)throw Error('Shadow endpoint differs from actual next displayed pose: '+endpointDifference);
 const actual=displayed.hit||samples.find(s=>s.hit)?.hit,classification=actual?'ACTUAL_SAMPLED_SKIN_INTERSECTION':row.result.reason==='displayed-start-uncertain'?'CONSERVATIVE_DISPLAYED_REJECTION':'NO_SAMPLED_INTERSECTION_TEMPORAL_UNRESOLVED';
 return{frame:row.frame,station:row.station,reason:row.result.reason||row.result.hit?.kind,classification,displayedHit:displayed.hit,samples,endpointDifference,actualWitness:actual?{...actual,box:row.boxes[actual.primitive]}:null};
}
export function examineFailedNative(){
 const d=window.__turnDiag,{base,q,displayed,boxes}=d.failed,cache=cacheCowTriangles(base),before=key(base),samples=[];
 for(const f of[1e-9,1e-6,.125,.25,.375,.5,.625,.75,.875,1]){const{r,poses}=nativeFraction(base,q,f,d);samples.push({fraction:f,poses,state:{...r.state},legs:r.legs.map(plainLeg),query:cowDiscreteQuery(r,cache,boxes)});r.dispose();}
 if(key(base)!==before)throw Error('Failed-state sample mutation');return{samples,displayedQuery:cowDiscreteQuery(displayed,cache,boxes),guard:d.guard,nonmutation:true,limits:'Finite native samples; not universal temporal clearance. Exact original assertion unchanged.'};
}
