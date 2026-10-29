// Physical proof is deliberately separate from the persistent milk ledger.
export function createCowDockGate(){
 let job=null,held=0;
 return {reset(){job=null;held=0;},update(s,dt){
  if(!s||s.jobId!==job){job=s?.jobId??null;held=0;}
  const angle=s?Math.abs(Math.atan2(Math.sin(s.yaw-s.facing),Math.cos(s.yaw-s.facing))):Infinity;
  const distance=s?Math.hypot(...s.position.map((v,i)=>v-s.dock[i])):Infinity;
  if(!s||!Number.isFinite(dt)||dt<=0||!Number.isFinite(s.speed)||s.speed>.03||angle>.10||distance>.10){held=0;return false;}
  held+=Math.min(dt,.1);return held>=.25-1e-9;
 }};
}
