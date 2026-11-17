'use strict';
const fields=['statusCalls','timedCalls','guardedSteps','suspendedSteps','stepChecks','admissions','pointVisits','segmentTests','segmentVisits','toLocalVectorConstructions','desiredSelections','normalCommits','lateralCommits','completedLegs','maxObstacles','elapsedMs','maxCallMs'];
const runtime=`
// Diagnostic-only counters; errors invalidate evidence, never change movement.
window.__cowCareGuardCost={schema:1,valid:true,${fields.map(k=>k+':0').join(',')}};
function cowCareCostBad(){try{window.__cowCareGuardCost.valid=false;}catch{}}
function cowCareCostAdd(k,n=1){try{const c=window.__cowCareGuardCost;if(!c.valid)return;const v=c[k]+n;if(!Number.isFinite(v)||v<0||v>1e12)throw Error();c[k]=v;}catch{cowCareCostBad();}}
function cowCareCostMax(k,n){try{const c=window.__cowCareGuardCost;if(!c.valid)return;if(!Number.isFinite(n)||n<0||n>1e12)throw Error();c[k]=Math.max(c[k],n);}catch{cowCareCostBad();}}
function cowCareCostNow(){try{return performance.now();}catch{cowCareCostBad();return null;}}
function cowCareCostEnd(start){if(start===null)return;const end=cowCareCostNow();if(end===null)return;const elapsed=end-start;if(!Number.isFinite(elapsed)||elapsed<0){cowCareCostBad();return;}cowCareCostAdd('timedCalls');cowCareCostAdd('elapsedMs',elapsed);cowCareCostMax('maxCallMs',elapsed);}
function cowCareGuardHitsBlock(from,to){const hit=hitsBlock(from,to,.42,null),visits=hit<0?OBST.length:hit+1;cowCareCostAdd('segmentTests');cowCareCostAdd('segmentVisits',visits);cowCareCostAdd('toLocalVectorConstructions',2*visits);return hit;}
function cowCareTransitStatus(a,task,p){const start=cowCareCostNow();try{cowCareCostAdd('statusCalls');cowCareCostMax('maxObstacles',OBST.length);const status=cowCareTransitStatusImpl(a,task,p);if(status)cowCareCostAdd('guardedSteps');if(status===2)cowCareCostAdd('suspendedSteps');return status;}finally{cowCareCostEnd(start);}}
function cowCareTransitStepClear(from,to,status){const start=cowCareCostNow();try{cowCareCostAdd('stepChecks');cowCareCostMax('maxObstacles',OBST.length);return cowCareTransitStepClearImpl(from,to,status);}finally{cowCareCostEnd(start);}}
`;
const transforms=[
 ['// Narrow default-bed transit safety;',runtime+'// Narrow default-bed transit safety;'],
 ['function cowCareTransitStatus(a,task,p){','function cowCareTransitStatusImpl(a,task,p){'],
 ['function cowCareTransitStepClear(from,to,status){','function cowCareTransitStepClearImpl(from,to,status){'],
 ['!OBST.some(o=>insideObst(o,p,.42))',"!OBST.some(o=>{cowCareCostAdd('pointVisits');cowCareCostAdd('toLocalVectorConstructions');return insideObst(o,p,.42);})"],
 ['cowCareTransitGuards.set(task,guard);return 1;',"cowCareTransitGuards.set(task,guard);cowCareCostAdd('admissions');return 1;"],
 ['&&hitsBlock(from,to,.42,null)<0;', '&&cowCareGuardHitsBlock(from,to)<0;'],
 ['transitClear=true;}','transitClear=true;cowCareCostAdd(\'desiredSelections\');}'],
 ['a.g.position.z=next.y;transitCommitted=true;',"a.g.position.z=next.y;transitCommitted=true;if(transitStatus)cowCareCostAdd('normalCommits');"],
 ['task.avoidSide=sign;transitCommitted=true;',"task.avoidSide=sign;transitCommitted=true;if(transitStatus)cowCareCostAdd('lateralCommits');"],
 ['if(transitStatus&&task.path.length<2)cowCareTransitGuards.delete(task);',"if(transitStatus&&task.path.length<2){cowCareTransitGuards.delete(task);cowCareCostAdd('completedLegs');}"]
];
// Rename implementations before introducing wrappers with their original names.
const order=[1,2,3,4,5,6,7,8,9,0];
function once(s,a,b){if(s.split(a).length!==2)throw Error('cost occurrence');return s.replace(a,b);}
function decorate(b){let s=Buffer.from(b).toString();for(const i of order)s=once(s,...transforms[i]);return Buffer.from(s);}
function strip(b){let s=Buffer.from(b).toString();for(const i of [...order].reverse())s=once(s,transforms[i][1],transforms[i][0]);return Buffer.from(s);}
function validate(v){return !!v&&Object.keys(v).sort().join('|')===[...fields,'schema','valid'].sort().join('|')&&v.schema===1&&v.valid===true&&fields.every(k=>typeof v[k]==='number'&&Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1e12&&(k==='elapsedMs'||k==='maxCallMs'||Number.isSafeInteger(v[k])))&&v.timedCalls===v.statusCalls+v.stepChecks&&v.segmentTests<=v.stepChecks&&v.admissions<=v.guardedSteps&&v.normalCommits+v.lateralCommits<=v.guardedSteps&&v.completedLegs<=v.normalCommits+v.lateralCommits&&v.maxCallMs<=v.elapsedMs&&v.suspendedSteps<=v.guardedSteps&&v.guardedSteps<=v.statusCalls&&v.toLocalVectorConstructions===v.pointVisits+2*v.segmentVisits;}
module.exports={fields,runtime,decorate,strip,validate};
