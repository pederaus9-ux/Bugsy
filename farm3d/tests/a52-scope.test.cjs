'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
let a52;try{a52=require('./helpers/a52-scope.cjs');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
const helper=()=>{assert(a52,'A52 scope helper is missing');return a52;};
test('A52 exact source inverse restores pinned main without changing the accepted receipt',()=>{
 const {scope,sha,normalizeA52Source,applyA52Source}=helper();
 for(const [file,e] of Object.entries(scope.files).filter(([,v])=>v.hunks)){
  const current=fs.readFileSync(path.join(root,file));assert.equal(sha(current),e.afterSha256);
  const old=normalizeA52Source(file,current);assert(Buffer.isBuffer(old));assert.equal(sha(old),e.beforeSha256);
  assert.deepEqual(applyA52Source(file,old),current);assert.equal(normalizeA52Source(file,old),old);
  assert.equal(sha(normalizeA52Source(file,current.toString())),e.beforeSha256);
 }
});
test('A52 rejects wrong source, unknown files, appended edits and wrong cache',()=>{
 const {scope,normalizeA52Source,applyA52Source}=helper();
 for(const [file,e] of Object.entries(scope.files).filter(([,v])=>v.hunks)){
  const current=fs.readFileSync(path.join(root,file));const bad=Buffer.concat([current,Buffer.from('\n/* corruption */')]);
  assert.equal(normalizeA52Source(file,bad),bad);assert.equal(applyA52Source(file,bad),bad);
  assert.equal(normalizeA52Source('unknown',current),current);
 }
 const sw=fs.readFileSync(path.join(root,'farm3d/sw.js'),'utf8');
 for(const version of ['sa3d-v85','sa3d-v86','sa3d-v89','sa3d-v91','sa3d-v92','sa3d-v94']){const bad=sw.replace('sa3d-v93',version);assert.equal(normalizeA52Source('sw.js',bad),bad);}
});
test('A52 verifies every added production asset and rejects tampering',()=>{
 const {scope,verifyA52Asset}=helper();
 for(const file of Object.keys(scope.assets)){const b=fs.readFileSync(path.join(root,file));verifyA52Asset(file,b);assert.throws(()=>verifyA52Asset(file,Buffer.concat([b,Buffer.from(' ')])));}
 assert.throws(()=>verifyA52Asset('unknown',Buffer.from('x')));
});
test('A52 keeps main game modules outside the approved UI delta',()=>{
 const {scope}=helper();
 assert.deepEqual(Object.keys(scope.files).filter(p=>p.startsWith('farm3d/')&&!p.includes('/tests/')&&!p.includes('/tools/')&&!/\.(?:md|json|lock)$/.test(p)).sort(),['farm3d/index.html','farm3d/sw.js']);
 assert.deepEqual(Object.keys(scope.assets).sort(),['farm3d/compact-ui.css','farm3d/corner-menu.js','farm3d/sunny-ui.css']);
});
