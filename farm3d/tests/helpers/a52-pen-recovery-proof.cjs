'use strict';
const TARGETS=Object.freeze({controlHigh1:11.658899999999907,controlHigh2:11.658899999999907,recoveryHigh1:11.658899999999907,recoveryHigh2:11.658899999999907,controlLow:6.941699999999997,recoveryLow:6.941699999999997});
const COUNTS=['animals','rngCalls','cowTokens','chickenTokens','remainingTokens','chickenTasks','remainingTasks','chickenLanes','baits'];
const FLAGS=['fixture','shotDone','loadingGone','chickenWakeEmpty','remainingWakeEmpty','remainingClockZero','remainingBedPriorityOff','cowJobEmpty','walkingEmpty','editorClosed'];
const CHECK_KEYS=[...COUNTS,...FLAGS].sort().join('|');
function validClockProof(v){
 if(!v||Object.keys(v).sort().join('|')!=='applied|case|checks|observedAfter|observedBefore|retained|schema|target'||v.schema!==1||!Object.hasOwn(TARGETS,v.case)||v.target!==TARGETS[v.case]||!Number.isFinite(v.observedBefore)||v.observedBefore<0||v.observedBefore>1e7||!(v.observedAfter===null||Number.isFinite(v.observedAfter)&&v.observedAfter>=0&&v.observedAfter<=1e7)||typeof v.applied!=='boolean'||typeof v.retained!=='boolean'||!v.checks||Object.keys(v.checks).sort().join('|')!==CHECK_KEYS)return false;
 if(!COUNTS.every(k=>Number.isInteger(v.checks[k])&&v.checks[k]>=0&&v.checks[k]<=100000000)||!FLAGS.every(k=>typeof v.checks[k]==='boolean'))return false;
 const ready=COUNTS.every(k=>v.checks[k]===0)&&FLAGS.every(k=>v.checks[k]);
 return (!v.applied||ready)&&(!v.retained||v.applied&&v.observedAfter===v.target)&&(!v.applied?v.observedAfter===null&&!v.retained:true);
}
module.exports={TARGETS,COUNTS,FLAGS,validClockProof};
