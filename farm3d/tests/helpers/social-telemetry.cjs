'use strict';
const fields=['qualifyingRedirects','trials','positiveCandidates','commits','rejections','extraSteerCalls','extraNeighborVisits','maxExtraCallsPerStep','timedCalls','elapsedMs','maxMs'];
const runtime=`
// Social recovery evidence only; diagnostic failure never vetoes movement.
const cowSocialCost={schema:1,valid:true,${fields.map(k=>k+':0').join(',')}};
function cowSocialBad(){try{cowSocialCost.valid=false;}catch{}}
function cowSocialAdd(k,n=1){try{const v=cowSocialCost[k]+n;if(!Number.isFinite(v)||v<0||v>1e12)throw Error('counter');cowSocialCost[k]=v;}catch{cowSocialBad();}}
function cowSocialMax(k,v){try{if(!Number.isFinite(v)||v<0||v>1e12)throw Error('maximum');cowSocialCost[k]=Math.max(cowSocialCost[k],v);}catch{cowSocialBad();}}
function cowSocialNow(){try{const t=performance.now();if(!Number.isFinite(t))throw Error('clock');return t;}catch{cowSocialBad();return null;}}
function cowSocialEnd(t){if(t===null)return;const end=cowSocialNow();if(end===null)return;const dt=end-t;if(!Number.isFinite(dt)||dt<0){cowSocialBad();return;}cowSocialAdd('timedCalls');cowSocialAdd('elapsedMs',dt);cowSocialMax('maxMs',dt);}
function cowSocialTrial(pos,want,others,state,t){cowSocialAdd('extraSteerCalls');cowSocialAdd('extraNeighborVisits',others.length);cowSocialMax('maxExtraCallsPerStep',1);const start=cowSocialNow();try{return steerCowPersonalSpace(pos,want,others,state,t);}finally{cowSocialEnd(start);}}
function cowSocialReceipt(){try{return {...cowSocialCost};}catch{return {schema:1,valid:false};}}
try{window.__cowSocialReceipt=cowSocialReceipt;}catch{cowSocialBad();}
`;
const transforms=[
 ['function updateCowTaskStep(a,dt,t){',runtime+'function updateCowTaskStep(a,dt,t){'],
 ['let transitCommitted=false,pendingCowSpace=null;','let transitCommitted=false,pendingCowSpace=null,socialTrialAttempted=false;'],
 ['const trial={...a.cowSpace,side:-a.cowSpace.side};',"socialTrialAttempted=true;cowSocialAdd('qualifyingRedirects');cowSocialAdd('trials');const trial={...a.cowSpace,side:-a.cowSpace.side};"],
 ['const alternate=steerCowPersonalSpace(a.pos,{x:nx/(dt||1),y:nz/(dt||1)},others,trial,t);','const alternate=cowSocialTrial(a.pos,{x:nx/(dt||1),y:nz/(dt||1)},others,trial,t);'],
 ['{sv=alternate;pendingCowSpace=trial;}',"{sv=alternate;pendingCowSpace=trial;cowSocialAdd('positiveCandidates');}"],
 ['if(pendingCowSpace&&preferredClear)a.cowSpace=pendingCowSpace;',"if(pendingCowSpace&&preferredClear){a.cowSpace=pendingCowSpace;cowSocialAdd('commits');}"],
 ['      // Finish the final robot approach physically:',"      if(socialTrialAttempted&&(!pendingCowSpace||a.cowSpace!==pendingCowSpace))cowSocialAdd('rejections');\n      // Finish the final robot approach physically:"]
];
function once(s,a,b){if(s.split(a).length!==2)throw Error('social telemetry occurrence');return s.replace(a,b);}
function decorate(input){let s=Buffer.from(input).toString();for(const[a,b]of transforms)s=once(s,a,b);return Buffer.from(s);}
function strip(input){let s=Buffer.from(input).toString();for(const[a,b]of [...transforms].reverse())s=once(s,b,a);return Buffer.from(s);}
function validate(v){return !!v&&v.schema===1&&v.valid===true&&Object.keys(v).sort().join('|')===[...fields,'schema','valid'].sort().join('|')&&fields.every(k=>Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1e12&&(k.endsWith('Ms')||Number.isSafeInteger(v[k])))&&v.qualifyingRedirects===v.trials&&v.extraSteerCalls===v.trials&&v.timedCalls===v.extraSteerCalls&&v.positiveCandidates<=v.trials&&v.commits<=v.positiveCandidates&&v.commits+v.rejections===v.trials&&v.maxExtraCallsPerStep===(v.trials?1:0)&&v.maxMs<=v.elapsedMs;}
module.exports={decorate,strip,validate,fields};
