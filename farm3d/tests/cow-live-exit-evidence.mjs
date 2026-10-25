// Read-only reduction of the two retained native-controller traces. No replay.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import * as T from '../lib/three.module.min.js';
const base='780ab878d3bf02cb13ae17539e0725789561e9d2';
const dir='farm3d/tests/evidence/pen-editing-implementation/task8-codex-live-robot-exit-20261025';
const file=path.join(dir,'verification.json');
assert(!fs.existsSync(file),'Preserve retained verification');
const out={status:'LIVE_DEFECT_CONFIRMED_GEOMETRY_DECISION_REQUIRED',base,cases:[],witnessControls:{actual:0,farBoxRejected:0,oneMmInwardStillHit:0},protectedFiles:{}};
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const mode of ['default','custom']){
 const r=JSON.parse(fs.readFileSync(path.join(dir,mode+'.json'))),m=r.measure,g=m.geometry;
 assert.equal(r.head,base);assert.equal(r.status,'LIVE_ROUTE_PHYSICAL_RED');assert.equal(m.owned,46);assert.equal(m.nativeControllers,5);assert(m.other41Paused);
 assert(r.motionInvariantsPassed&&m.completed);assert.deepEqual(m.errors,[]);assert.deepEqual(r.errors,[]);
 const ids=['cow-1','cow-2','cow-3','cow-4','cow-5'],generation=m.exitStart.task.token.generation;
 for(const row of m.frames){assert.deepEqual(row.actors.map(a=>a.id),ids);if(row.task){assert.equal(row.task.token.animalId,m.id);assert.equal(row.task.token.generation,generation);assert.equal(row.task.jobId,m.job.id);}}
 const counts={};for(const h of m.hits){counts[h.hit.primitive]=(counts[h.hit.primitive]||0)+1;const tri=new T.Triangle(...h.hit.points.map(p=>new T.Vector3(...p))),b=new T.Box3(new T.Vector3(...h.box.slice(0,3)),new T.Vector3(...h.box.slice(3)));assert(b.intersectsTriangle(tri));out.witnessControls.actual++;assert(!b.clone().translate(new T.Vector3(100,0,0)).intersectsTriangle(tri));out.witnessControls.farBoxRejected++;if(b.clone().expandByScalar(-.001).intersectsTriangle(tri))out.witnessControls.oneMmInwardStillHit++;}
 assert.deepEqual(counts,{40:37,41:27});assert.equal(g.probes[0].registered.length,0);assert.equal(g.probes[1].registered.length,1);assert.equal(g.originalSegmentBlock,-1);assert(g.addedLeafSegmentBlock>=0);
 assert.deepEqual(g.originalExitTurnRoute,[[6.95,-39.2]]);assert.deepEqual(g.withGateExitTurnRoute,mode==='default'?[[6.95,-39.2]]:[]);
 // With actual opened leaves plus side rail registered, their XZ projections
 // separate the two root sides across the entire pen. This is a statement about
 // existing planar collision semantics, not a general 3D/topological certificate.
 const x=7.55,pad=.42,segmentMargin=pad-.05,zRange=[Math.min(...g.polygon.map(p=>p[1])),Math.max(...g.polygon.map(p=>p[1]))];
 const spans=[40,31,38].map(i=>{const b=g.boxes[i];assert(x>=b[0]&&x<=b[3]);return{primitive:i,rawZ:[b[2],b[5]],paddedZ:[b[2]-segmentMargin,b[5]+segmentMargin]};}).sort((a,b)=>a.paddedZ[0]-b.paddedZ[0]);
 let covered=spans[0].paddedZ[1];assert(spans[0].paddedZ[0]<zRange[0]);for(const s of spans.slice(1)){assert(s.paddedZ[0]<=covered);covered=Math.max(covered,s.paddedZ[1]);}assert(covered>zRange[1]);assert(g.robot.exit[0]>x&&g.robot.turn[0]<x);
 out.cases.push({mode,custom:!!r.setup.custom,browser:r.browser,setupSeconds:m.setupFrames/m.hz,exitSeconds:m.exitFrames/m.hz,originalSetupAndExitLimitSeconds:60,displayedFrames:m.exitFrames,hitFrames:m.hits.length,firstHit:m.hits[0].frame,lastHit:m.hits.at(-1).frame,firstWitness:m.hits[0].hit,counts,maxTargetSpeed:m.maxTargetSpeed,minFiveCowRootSeparation:m.minSeparation,maxRootSupportError:m.maxRootSupportError,stableCowIdentities:ids,robotReservationGeneration:generation,robotJobReleased:!m.end.job&&!m.end.task,missingOpenedLeaf:g.probes[0],registeredDivider:g.probes[1],existingRoute:g.originalExitTurnRoute,routeWithExitLeaf:g.withGateExitTurnRoute,planarBarrier:{x,penZ:zRange,unchangedSegmentMargin:segmentMargin,spans},limitations:'Only exiting target cow displayed skin checked; five native cows step, other41owned actors paused. Root support only, no hoof/contact/continuous safety, physical phone or full herd qualification. Custom fixture loads a default-shaped saved pen, not a new editor Apply journey.'});
}
const previous=JSON.parse(fs.readFileSync('farm3d/tests/evidence/pen-editing-implementation/task8-codex-radial-classification-20261025/verification.json'));
const protectedPaths=[...Object.keys(previous.protectedFiles),'farm3d/tests/helpers/cow-motion-domains.mjs','farm3d/tests/animal-pen-authorized-adapters.json','farm3d/tests/evidence/pen-editing-implementation/task8-codex-radial-classification-20261025/forward-classified-capture.json','farm3d/tests/evidence/pen-editing-implementation/task8-codex-radial-classification-20261025/grouped-classification.json'];
for(const p of protectedPaths){const before=execFileSync('git',['show',base+':'+p],{maxBuffer:50*1024*1024}),now=fs.readFileSync(p);assert(before.equals(now),p);out.protectedFiles[p]={unchanged:true,sha256:sha(now)};}
out.originalClassification={confirmed:65,uncertain:59,conditionalClear:1,invalidDomain:0,preserved:true};
out.runtimeChange='None. Geometry changes prohibited by current task; no amended digests registered.';
out.decision='Gate parking/exit arrangement in cow-yard.js requires exact owner scope. Dynamic actual gate blocker synchronization, fail-closed cow route handoff and swept body checks in index.html remain necessary; registering the current leaf alone strands cows (custom) or keeps unsafe fallback (default). No unsupported claim all arrangements are impossible.';
fs.writeFileSync(file,JSON.stringify(out,null,2)+'\n');
const g=JSON.parse(fs.readFileSync(path.join(dir,'custom.json'))).measure.geometry;
const sx=x=>80+(x-5)*115,sy=z=>80+(z+41)*65;
let svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="760" viewBox="0 0 900 760"><rect width="900" height="760" fill="#fff"/><g font-family="Arial" fill="#17252b"><text x="35" y="30" font-size="22">Live robot exit: measured XZ geometry</text><text x="35" y="55" font-size="14">Diagnostic plot of captured coordinates; not an in-game screenshot</text>';
svg+=`<rect x="${sx(5)}" y="${sy(-40.2)}" width="${sx(9.8)-sx(5)}" height="${sy(-32.8)-sy(-40.2)}" fill="#edf4e9" stroke="#263d29" stroke-width="2"/>`;
for(const i of [18,28,31,33,38,40]){const b=g.boxes[i],red=i===38||i===40;svg+=`<rect x="${sx(b[0])}" y="${sy(b[2])}" width="${(b[3]-b[0])*115}" height="${(b[5]-b[2])*65}" fill="${red?'#b42538':'#5d6973'}"/>`;}
const pts=['dock','exit','turn','clear'].map(k=>g.robot[k]);svg+=`<polyline points="${pts.map(p=>sx(p[0])+','+sy(p[2])).join(' ')}" fill="none" stroke="#1368c4" stroke-width="4"/>`;
for(const k of ['dock','exit','turn','clear']){const p=g.robot[k];svg+=`<circle cx="${sx(p[0])}" cy="${sy(p[2])}" r="5" fill="#1368c4"/><text x="${sx(p[0])+8}" y="${sy(p[2])-7}" font-size="14">${k}</text>`;}
svg+='<text x="660" y="170" font-size="15">Red: opened leaves</text><text x="660" y="195" font-size="15">Grey: rail / divider</text><text x="660" y="220" font-size="15">Blue: live root path</text><text x="660" y="250" font-size="14">Leaves unregistered</text><text x="660" y="273" font-size="14">Divider registered</text><text x="35" y="710" font-size="15">Both leaves + side rail span z = -40.3 to -32.3 at x = 7.55 m.</text><text x="35" y="738" font-size="15">Pen boundary: z = -40.2 to -32.8 m. Current exit-to-turn crosses the open leaf.</text></g></svg>';
fs.writeFileSync(path.join(dir,'live-exit-geometry.svg'),svg);
console.log(JSON.stringify({status:out.status,cases:out.cases.map(c=>({mode:c.mode,hits:c.hitFrames,setup:c.setupSeconds,exit:c.exitSeconds})),controls:out.witnessControls,unchangedFiles:protectedPaths.length}));
