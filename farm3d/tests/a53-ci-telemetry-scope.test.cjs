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
