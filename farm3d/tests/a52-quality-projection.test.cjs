'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const p=require('./helpers/a52-quality-projection.cjs'),s=require('./helpers/a52-quality-summary.cjs');
const canary='PRIVATE_CANARY_DO_NOT_PUBLISH';
function report(){const m=p.manifest(),def=m.lanes.find(l=>l.kind==='node');return {schemaVersion:1,id:'2026-11-17T12-00-00-000Z-aaaaaaaa-1',head:'a'.repeat(40),manifestHash:p.MANIFEST_SHA,dirty:false,testFingerprint:'b'.repeat(64),runnerFingerprint:'c'.repeat(64),runtimeTree:'d'.repeat(40),node:process.version,platform:process.platform,hardware:os.cpus()[0].model,iteration:1,startedAt:'2026-11-17T12:00:00.000Z',finishedAt:'2026-11-17T12:00:01.000Z',status:'passed',executionContext:'GitHub Actions',budgetMinutes:30,lanes:[{...def,status:'passed',steps:def.files.flatMap(f=>p.identities(m,f)).map(i=>({...i,status:'passed',durationMs:1}))}],comparison:{regressions:[],fixes:[],unchanged:[def.id],notComparable:[],durationIsGamePerformance:false},baseline:{status:'unavailable',reason:canary},sourceStatus:canary,runnerError:canary};}
const env={GITHUB_SERVER_URL:'https://github.com',GITHUB_REPOSITORY:'pederaus9-ux/Bugsy',GITHUB_RUN_ID:'123',GITHUB_SHA:'b'.repeat(40),A52_EXPECTED_HEAD:'a'.repeat(40)};
test('preserves original finite comparisons and strips private diagnostics at every permitted level',()=>{
 const r=report();Object.assign(r.lanes[0].steps[0],{error:canary,reason:canary,log:canary,artifacts:canary,evidenceError:canary});
 const out=p.projectReport(r);assert.deepEqual(out.comparison,r.comparison);assert.equal(JSON.stringify(out).includes(canary),false);assert.deepEqual(p.projectReport(out),out);
});
test('rejects arbitrary comparison reasons, lane IDs and forged host identity',()=>{
 for(const mutate of [r=>r.comparison.notComparable.push(canary),r=>r.comparison.fixes.push(canary),r=>r.comparison.durationIsGamePerformance=true,r=>r.hardware=canary,r=>r.lanes[0].title=canary,r=>r.publicProjection={error:canary}]){const r=report();mutate(r);assert.throws(()=>p.projectReport(r));}
});
test('comparison projection preserves each actual compareReports result unchanged',async()=>{
 const {compareReports}=await import('./quality-loops.mjs');const r=report(),prior=structuredClone(r);
 for(const old of [null,prior,{...prior,manifestHash:'e'.repeat(64)},{...prior,hardware:'different'},{...prior,lanes:[]}]){const comparison=compareReports(old,r);assert.deepEqual(p.projectReport({...r,comparison}).comparison,comparison);}
});
test('baseline layout and safe unchanged renderer work; raw input and forged public context rejected',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-quality-')),source=path.join(dir,'raw'),out=path.join(dir,'projected');fs.mkdirSync(source);const r=report();fs.mkdirSync(path.join(source,r.id));fs.writeFileSync(path.join(source,'latest.json'),JSON.stringify({id:r.id}));fs.writeFileSync(path.join(source,r.id,'report.json'),JSON.stringify(r));
 try{p.collect(source,out);assert(fs.existsSync(path.join(out,r.id,'report.json')));// PR merge SHA intentionally differs from the checked-out head.
  assert.notEqual(env.GITHUB_SHA,env.A52_EXPECTED_HEAD);const markdown=await s.summary(out,env);assert(markdown.includes('Game quality-loop scorecard'));assert(!markdown.includes(canary));
  const {renderScorecard}=await import('./quality-loop-scorecard.mjs');assert.equal(markdown,renderScorecard(p.projectReport(r),{manifest:p.manifest(),env:s.publicContext(env)}));
  await assert.rejects(s.summary(source,env));for(const change of [{GITHUB_REPOSITORY:'other/repo'},{GITHUB_SERVER_URL:'https://evil.test'},{GITHUB_RUN_ID:canary},{A52_EXPECTED_HEAD:'b'.repeat(40)},{A52_EXPECTED_HEAD:'invalid'},{A52_EXPECTED_HEAD:undefined}])await assert.rejects(s.summary(out,{...env,...change}));
  assert.throws(()=>p.collect(source,out));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('unknown fields, changed manifest identity and symlinked input rejected',()=>{
 for(const mutate of [r=>r.extra=canary,r=>r.manifestHash='0'.repeat(64),r=>r.lanes[0].steps[0].extra=canary]){const r=report();mutate(r);assert.throws(()=>p.projectReport(r));}
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'a52-link-'));try{fs.writeFileSync(path.join(d,'real'),'{}');fs.symlinkSync(path.join(d,'real'),path.join(d,'latest.json'));assert.throws(()=>p.collect(d,path.join(d,'out')));}finally{fs.rmSync(d,{recursive:true,force:true});}
});
