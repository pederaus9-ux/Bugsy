'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {scope,sha,normalizeA53CITelemetry}=require('./helpers/a53-ci-telemetry-scope.cjs');
const root=path.resolve(__dirname,'../..');
for(const [f,e]of Object.entries(scope.files)){
 test('Exact telemetry inverse '+f,()=>{const b=fs.readFileSync(path.join(root,f));assert.equal(sha(b),e.afterSha256);for(const v of [b,b.toString()]){const p=normalizeA53CITelemetry(f,v);assert.equal(sha(p),e.beforeSha256);assert.equal(Buffer.isBuffer(p),Buffer.isBuffer(v));assert.equal(normalizeA53CITelemetry(f,p),p);}});
 test('Unknown changed bytes preserved '+f,()=>{const b=Buffer.concat([fs.readFileSync(path.join(root,f)),Buffer.from('\n// unknown')]);assert.equal(normalizeA53CITelemetry(f,b),b);});
}
test('Unknown runtime bytes never transformed',()=>{const x=Buffer.from('runtime');for(const f of ['farm3d/index.html','farm3d/farmer3d.js','farm3d/sw.js'])assert.equal(normalizeA53CITelemetry(f,x),x);});
for(const [file,fn,next]of [['a52-installed-counter-scope.cjs','normalizeA52InstalledCounter','normalizeA52OfflineObservation'],['a52-workflow-publication-scope.cjs','normalizeA52WorkflowPublication',null]])test('Outer hook precedes historical hash matching '+file,()=>{
 const src=fs.readFileSync(path.join(__dirname,'helpers',file),'utf8'),calls=[],fixture={files:{}};
 const crypto=require('node:crypto'),realCreate=crypto.createHash;
 const sandbox={module:{exports:{}},Buffer,require(n){if(n==='./a53-ci-telemetry-scope.cjs')return{normalizeA53CITelemetry(f,b){calls.push('new');return b;}};if(n==='./a52-offline-observation.cjs')return{normalizeA52OfflineObservation(f,b){calls.push('old');return b;}};if(n==='node:fs')return{readFileSync(){return JSON.stringify(fixture);}};if(n==='node:path')return path;if(n==='node:crypto')return{createHash(){return{update(){return{digest(){return file.startsWith('a52-installed')?'7899a7e136111e3e259abe3650fb3f3c419657fd530820c6011fcbd02fb2d53f':'e270cfbbff5a2cfba26fbba0e19b76d556f154429e338948d81119e040045e5a';}}}}}};throw Error(n);},__dirname:path.join(__dirname,'helpers')};vm.runInNewContext(src,sandbox);const b=Buffer.from('unknown');assert.equal(sandbox.module.exports[fn]('unknown',b),b);assert.deepEqual(calls,next?['new','old']:['new']);});

// Shared-entry regressions stay in the durable original-CI contract file.
const {createRequire}=require('node:module');
const {normalizeA52OfflineConsole}=require('./helpers/a52-offline-console.cjs');
const {normalizeA52OfflineObservation}=require('./helpers/a52-offline-observation.cjs');
const oldCounter=require('./helpers/a52-installed-counter-scope.cjs').scope;
const file='farm3d/tests/browser-harness.cjs',raw=()=>fs.readFileSync(path.join(__dirname,'browser-harness.cjs'));
test('Confirmed predecessor bypass fails before and passes at shared entry, original counter assertion unchanged',()=>{const helper=path.join(__dirname,'helpers/a52-offline-console.cjs');const current=fs.readFileSync(helper,'utf8');const before=current.replace("const {normalizeA53CITelemetry}=require('./a53-ci-telemetry-scope.cjs');\n",'').replace('input=normalizeA53CITelemetry(file,input);','');const m={exports:{}};vm.runInNewContext(before,{module:m,exports:m.exports,__dirname:path.dirname(helper),require:createRequire(helper),Buffer});assert.equal(m.exports.normalizeA52OfflineConsole(file,raw()).toString(),raw().toString());assert.notEqual(sha(m.exports.normalizeA52OfflineConsole(file,raw())),oldCounter.files[file].afterSha256);assert.equal(sha(normalizeA52OfflineObservation(file,raw())),oldCounter.files[file].afterSha256);});
test('Actual new raw hashes remain mandatory before exact history accounting',()=>{for(const f of ['farm3d/tests/browser-harness.cjs','farm3d/tests/helpers/playwright-diagnostics.cjs']){const b=fs.readFileSync(path.resolve(__dirname,'../..',f));assert.equal(sha(b),scope.files[f].afterSha256);assert.notEqual(sha(b),scope.files[f].beforeSha256);assert.equal(sha(normalizeA53CITelemetry(f,b)),scope.files[f].beforeSha256);}});
test('Common entry never normalizes corruption or unknown runtime',()=>{for(const x of [Buffer.concat([raw(),Buffer.from('\n')]),Buffer.from(raw().toString().replace('servedResponses++','servedResponses+=2'))]){assert.equal(normalizeA52OfflineConsole(file,x),x);assert.equal(normalizeA52OfflineObservation(file,x),x);}const b=Buffer.from('runtime');assert.equal(normalizeA52OfflineConsole('farm3d/index.html',b),b);});
