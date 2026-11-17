'use strict';
const fields=['edgeCalls','edgeVisits','edgeClear','edgeBlocked','edgeTimedCalls','edgeElapsedMs','edgeMaxMs','edgeMaxObstacles'];
const controllerFields=['requests','applied','cancelled','failed','plannerVisits','snapshotVisits','validationVisits','epoch','used','remaining','maxUsed','queued'];
const runtime=`
// Recovery diagnostics only; errors invalidate evidence, never select movement.
const cowRecoveryCost={schema:1,valid:true,${fields.map(k=>k+':0').join(',')}};
function cowRecoveryBad(){try{cowRecoveryCost.valid=false;}catch{}}
function cowRecoveryAdd(k,n=1){try{const v=cowRecoveryCost[k]+n;if(!Number.isFinite(v)||v<0||v>1e12)throw Error('counter');cowRecoveryCost[k]=v;}catch{cowRecoveryBad();}}
function cowRecoveryMax(k,n){try{if(!Number.isFinite(n)||n<0||n>1e12)throw Error('maximum');cowRecoveryCost[k]=Math.max(cowRecoveryCost[k],n);}catch{cowRecoveryBad();}}
function cowRecoveryNow(){try{const t=performance.now();if(!Number.isFinite(t))throw Error('clock');return t;}catch{cowRecoveryBad();return null;}}
function cowRecoveryEnd(start){if(start===null)return;const end=cowRecoveryNow();if(end===null)return;const dt=end-start;if(!Number.isFinite(dt)||dt<0){cowRecoveryBad();return;}cowRecoveryAdd('edgeTimedCalls');cowRecoveryAdd('edgeElapsedMs',dt);cowRecoveryMax('edgeMaxMs',dt);}
function cowRecoveryReceipt(){try{const c=cowStaticRecovery.stats(),keys=${JSON.stringify(controllerFields)};if(Object.keys(c).sort().join('|')!==keys.slice().sort().join('|')||!keys.every(k=>k==='epoch'?(c[k]===null||Number.isFinite(c[k])):Number.isSafeInteger(c[k])&&c[k]>=0&&c[k]<=1e12)||c.maxUsed>512||c.used+c.remaining!==512&&c.epoch!==null||c.queued>16)throw Error('controller evidence');return {...cowRecoveryCost,controller:{...c}};}catch{cowRecoveryBad();return {...cowRecoveryCost,controller:null};}}
try{window.__cowRecoveryReceipt=cowRecoveryReceipt;}catch{cowRecoveryBad();}
`;
const original='function cowStaticEdgeClear(from,to){const a=[from.x,from.y],b=[to.x,to.y];return !OBST.some(o=>cowStaticPlanner.segmentBlocked(o,a,b));}';
const replacement=runtime+`function cowStaticEdgeClear(from,to){const start=cowRecoveryNow();cowRecoveryAdd('edgeCalls');cowRecoveryMax('edgeMaxObstacles',OBST.length);try{const a=[from.x,from.y],b=[to.x,to.y];const clear=!OBST.some(o=>{cowRecoveryAdd('edgeVisits');return cowStaticPlanner.segmentBlocked(o,a,b);});cowRecoveryAdd(clear?'edgeClear':'edgeBlocked');return clear;}finally{cowRecoveryEnd(start);}}`;
function once(s,a,b){if(s.split(a).length!==2)throw Error('recovery telemetry occurrence');return s.replace(a,b);}
function decorate(input){return Buffer.from(once(Buffer.from(input).toString(),original,replacement));}
function strip(input){return Buffer.from(once(Buffer.from(input).toString(),replacement,original));}
function validate(v){return !!v&&v.schema===1&&v.valid===true&&Object.keys(v).sort().join('|')===[...fields,'schema','valid','controller'].sort().join('|')&&fields.every(k=>typeof v[k]==='number'&&Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1e12&&(k.endsWith('Ms')||Number.isSafeInteger(v[k])))&&v.edgeCalls===v.edgeClear+v.edgeBlocked&&v.edgeTimedCalls===v.edgeCalls&&v.edgeVisits<=v.edgeCalls*v.edgeMaxObstacles&&v.edgeMaxMs<=v.edgeElapsedMs&&!!v.controller&&Object.keys(v.controller).sort().join('|')===controllerFields.slice().sort().join('|')&&controllerFields.every(k=>k==='epoch'?(v.controller[k]===null||Number.isFinite(v.controller[k])):Number.isSafeInteger(v.controller[k])&&v.controller[k]>=0&&v.controller[k]<=1e12)&&v.controller.maxUsed<=512&&v.controller.queued<=16&&(v.controller.epoch===null||v.controller.used+v.controller.remaining===512);}
module.exports={decorate,strip,validate,fields,controllerFields};
