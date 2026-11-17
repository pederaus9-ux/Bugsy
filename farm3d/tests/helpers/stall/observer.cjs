'use strict';
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {encode}=require('./projector.cjs');
const samples=[];let invalid=false;
const hook=`globalThis.__stallRead=()=>({stats:cowStaticRecovery.stats(),actors:animals.map(a=>{const t=a.cowTask,g=t?cowCareTransitGuards.get(t):null,from=[a.g.position.x,a.g.position.z],p=t?.path?.[0],to=p?[p.x,p.y]:null,paths=t?.path||[],ways=t?.waypoints||[],clear=q=>!OBST.some(o=>cowStaticPlanner.segmentBlocked(o,q,q)),edge=()=>!OBST.some(o=>cowStaticPlanner.segmentBlocked(o,from,to));return{id:a.ref.i,position:from,kind:t?.kind==='bed'?'bed':t?'other':'none',stage:['approach','align','hold','exit'].includes(t?.stage)?t.stage:t?'other':'none',weight:t?.weight??0,custom:!!COW_YARD_LAYOUT.custom,guardPresent:!!g,guardIdentityMatches:!!g&&g.actor===a&&g.ref===a.ref&&g.index===a.ref.i&&g.token===t.token&&g.station===t.station&&g.custom===!!COW_YARD_LAYOUT.custom,nonfinal:!!t&&(paths.length>1||ways.length>0),rootStaticClear:clear(from),rootPenClear:pointInPolygon(from,PENS.courtyard.poly,.42),nextStaticClear:!to||clear(to),nextPenClear:!to||pointInPolygon(to,PENS.courtyard.poly,.42),edgeStaticClear:!to||edge(),edgePenClear:!to||segmentInPolygon(from,to,PENS.courtyard.poly,.42),pathCount:paths.length,waypointCount:ways.length,pathPrefix:paths.slice(0,3).map(p=>[p.x,p.y]),waypointPrefix:ways.slice(0,3).map(p=>[p[0],p[2]]),goal:ways.length?[ways.at(-1)[0],ways.at(-1)[2]]:paths.length?[paths.at(-1).x,paths.at(-1).y]:null};})});`;
function observer(c,hz,reverse,output){let previous=null,still=Array(5).fill(0),captured=false;
 const write=()=>{if(!output)throw Error('missing telemetry destination');fs.writeFileSync(output,invalid?JSON.stringify({schema:1,scope:'synthetic-v1-stall-only',valid:false}):encode(samples));};
 const safe=f=>{try{if(!invalid)f();}catch{invalid=true;try{write();}catch{}}};
 safe(()=>{vm.runInContext(hook,c);});
 const take=(checkpoint,t)=>safe(()=>{samples.push({...c.__stallRead(),hz,reverse,checkpoint,simSeconds:t});write();});
 take('start',0);
 return{tick(frame){if(captured||frame%(10*hz)!==0)return;safe(()=>{const current=c.animals.map(a=>({p:[a.g.position.x,a.g.position.z],active:a.cowTask?.stage==='approach'}));if(previous)for(let i=0;i<5;i++)still[i]=current[i].active&&Math.hypot(current[i].p[0]-previous[i].p[0],current[i].p[1]-previous[i].p[1])<.01?still[i]+10:0;previous=current;if(still.some(v=>v>=30)){captured=true;take('first-stall',frame/hz);}});},terminal(t){take('terminal',t);}};
}
module.exports={observer,hook};
