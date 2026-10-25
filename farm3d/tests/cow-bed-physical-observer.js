// Test-only native bed movement observation, matching A26 limits. No skin/proxy work.
(async()=>{
 const d=__dbg,support=await import('./animal-pen-cow-support.js');
 const cows=d.animals.filter(a=>a.kind==='cow');
 if(cows.length!==5)throw Error('Expected all five owned cows');
 const q=window.__cowBedPhysical={bedSteps:0,minSeparation:Infinity,maxSpeed:0,maxSupportError:0};
 for(const cow of cows){const native=cow.update;cow.update=function(dt,t){
  const x=cow.g.position.x,z=cow.g.position.z;native.call(cow,dt,t);
  if(cow.cowTask?.kind!=='bed')return;
  q.bedSteps++;q.maxSpeed=Math.max(q.maxSpeed,Math.hypot(cow.g.position.x-x,cow.g.position.z-z)/dt);
  const height=support.cowPenSupportHeight(d.penRuntime.layout.sites.cow,cow.g.position.x,cow.g.position.z,d.groundY);
  q.maxSupportError=Math.max(q.maxSupportError,Math.abs(cow.g.position.y-height));
  for(const other of cows)if(other!==cow)q.minSeparation=Math.min(q.minSeparation,cow.g.position.distanceTo(other.g.position));
  if(q.maxSpeed>.8+1e-9||q.minSeparation<.85-1e-9||!Number.isFinite(height)||q.maxSupportError>1e-7)throw Error('Bed physical invariant '+JSON.stringify(q));
 };}
})();
