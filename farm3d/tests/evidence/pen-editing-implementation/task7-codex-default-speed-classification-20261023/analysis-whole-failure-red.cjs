// Read-only analysis of frozen browser captures. No game or fixture execution.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p))),sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const a=read('controlled-before-60/results.json'),b=read('controlled-current-60/results.json'),live=read('original-boot-current-60/results.json');
const historic='../task7-codex-cow-separation-20261023/',oldA=read(historic+'default-control-before-60/results.json'),oldB=read(historic+'default-control-after-60/results.json');
const step=(r,name)=>r.steps.find(s=>s.name===name).value;
assert.equal(a.status,'FAIL');assert.equal(b.status,'FAIL');assert.equal(live.status,'FAIL');
for(const r of [a,b,live])assert.equal(r.defaultDiagnostic.customOrdinaryEntries,0);
assert.deepEqual(step(a,'default boot diagnostic'),step(b,'default boot diagnostic'));
assert.deepEqual(a.defaultDiagnostic,b.defaultDiagnostic);assert.deepEqual(a.metrics,b.metrics);assert.deepEqual(a.failure,b.failure);
assert.equal(a.metrics.frames,1001);assert.equal(live.metrics.frames,1002);
assert.equal(a.metrics.maxSpeedExcess,oldA.metrics.maxSpeedExcess);assert.equal(a.metrics.maxSpeedExcess,oldB.metrics.maxSpeedExcess);assert.equal(a.metrics.maxSpeedExcess,live.metrics.maxSpeedExcess);
// A changed trajectory must fail the exact same strict comparison.
const altered=structuredClone(b.defaultDiagnostic);altered.frames[0].cows[0].p[0]+=.001;
assert.throws(()=>assert.deepEqual(a.defaultDiagnostic,altered));
const s=a.defaultDiagnostic.steps.filter(s=>s.i===0).at(-1),before=s.before,after=s.after;
assert.equal(s.dt,1/60);assert.equal(before.task,null);assert.equal(after.task,null);assert.equal(before.act,'moving');assert.equal(after.act,'moving');assert.equal(before.running,false);assert.equal(after.running,false);assert.equal(before.penCustom,false);assert.equal(after.penCustom,false);assert.deepEqual(before.P,after.P);assert.deepEqual(before.S,after.S);
assert.equal(before.p[1],after.p[1]);assert.equal(s.fits.length,1);assert.deepEqual(s.fits[0].before,s.fits[0].after);
const nominal=after.S.walk*(.8+after.P.energy*.4),budget=nominal*s.dt,delta=after.p.map((n,i)=>n-before.p[i]),distance=Math.hypot(...delta),velocity=Math.hypot(...after.vel),alpha=s.dt*4;
assert.equal(distance-budget,a.metrics.maxSpeedExcess);assert(Math.abs(distance-velocity*s.dt)<1e-14);
const overBudget=d=>d>budget+1e-9; // Exact retained physical assertion, not a widened limit.
assert.equal(overBudget(distance),true);assert.equal(overBudget(budget),false);assert.equal(overBudget(budget+1e-9),false);assert.equal(overBudget(budget+2e-9),true);
const desired=after.vel.map((n,i)=>(n-before.vel[i]*(1-alpha))/alpha),target=[before.target.x-before.p[0],before.target.y-before.p[2]],targetLength=Math.hypot(...target),nominalDesired=target.map(n=>n/targetLength*nominal),addedSteering=desired.map((n,i)=>n-nominalDesired[i]);
const positions=r=>r.failure.actors.filter(x=>x.kind==='cow').map(x=>x.p),pa=positions(oldA),pb=positions(oldB),diff=pa.map((p,i)=>p.map((v,j)=>v-pb[i][j])),maxDifference=Math.max(...diff.flat().map(Math.abs));
assert(maxDifference>1e-10);assert.equal(maxDifference,.013246064507612232);
const ha=step(oldA,'default occupied starting state'),hb=step(oldB,'default occupied starting state');
assert.notDeepEqual(ha,hb);
const historicalInputs=[ha,hb].map(x=>({lastAt:x.care.lastAt,bedUntil:x.actors.filter(a=>a.kind==='cow').map(a=>a.task.until)}));
assert.notEqual(historicalInputs[0].lastAt,historicalInputs[1].lastAt);assert.notDeepEqual(historicalInputs[0].bedUntil,historicalInputs[1].bedUntil);
const output={status:'PASS analysis assertions; physical runs remain RED',controlled:{refs:[a.servedRef,b.servedRef],allFramesExactlyEqual:a.metrics.frames,allDiagnosticInputsAndOutputsExactlyEqual:true,allMetricsAndFailureStateExactlyEqual:true,customOrdinaryEntries:0,trajectorySha256:sha(a.defaultDiagnostic.frames),diagnosticSha256:sha(a.defaultDiagnostic)},speed:{classification:'Pre-existing ordinary default-cow speed-budget breach; no regression from792f87c',cow:1,frame:1001,originalStartupFrame:1002,dt:s.dt,taskBefore:before.task,taskAfter:after.task,nominalMetersPerSecond:nominal,budgetMeters:budget,actualMeters:distance,actualMetersPerSecond:velocity,excessMeters:distance-budget,fitUnchanged:true,heightUnchanged:true,oldVelocity:before.vel,newVelocity:after.vel,inferredSteeringDesired:desired,nominalDesired,addedSteering,mechanism:'Ordinary steering adds repulsion to nominal desired velocity, then lerps and integrates without a default-cow final speed cap. No projection, care transition, rig translation or custom guard involvement.'},strictHistorical:{classification:'Real failed comparison, invalid matched-input regression premise',maxPositionDifference:maxDifference,positionDifferences:diff,initialControllerInputs:historicalInputs,oldAssertionRetained:true,exactHistoricalCow2TickBranch:'Not reconstructable: original evidence did not capture cowTickAt; no claim of a proven exact historical branch.'},originalStartup:{boot:step(live,'default boot diagnostic'),customOrdinaryEntries:live.defaultDiagnostic.customOrdinaryEntries,frame:live.metrics.frames},negativeControls:{changedTrajectoryRejected:true,originalSpeedBoundaryAccepted:true,originalSpeedBoundaryPlusOneNanometerAccepted:true,twoNanometersOverBudgetRejected:true,actualBreachRejected:true},limitations:['Controlled boot comparison is separate diagnostic evidence; original startup/strict failures remain unchanged.','Accepted main steering source matches exactly; entire main browser journey was not reproduced.','Local pinned browser/manual five-cow updates, other41 actors static; not hosted/device/cloud/full-farm qualification.','Default queue completion beyond the first speed failure is unknown; no deadline extension or continued failed run used as success.']};
fs.writeFileSync(path.join(__dirname,'analysis.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({status:output.status,controlled:output.controlled,speed:output.speed,strictHistorical:output.strictHistorical,negativeControls:output.negativeControls},null,2));
