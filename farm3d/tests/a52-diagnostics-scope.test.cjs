'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {normalizeA52Diagnostics,scope,sha}=require('./helpers/a52-diagnostics-scope.cjs');
const {normalizeA52InstalledCounter}=require('./helpers/a52-installed-counter-scope.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>normalizeA52InstalledCounter(f,fs.readFileSync(path.join(root,f)));
test('two diagnostic harness changes reverse exactly; original CSS MIME and waits survive',()=>{
 assert.deepEqual(Object.keys(scope.files).sort(),['farm3d/tests/browser-harness.cjs','farm3d/tests/qualification-cdp.cjs']);
 for(const [f,e] of Object.entries(scope.files)){
  const current=read(f);assert.equal(sha(current),e.afterSha256);
  const before=normalizeA52Diagnostics(f,current);assert.equal(sha(before),e.beforeSha256);
  for(const source of [before.toString(),current.toString()]){new vm.Script(source);assert(source.includes("'.css':'text/css'"));}
  // Existing explicit scenario timeouts are not altered by diagnostic suppression.
  assert.deepEqual(current.toString().match(/timeout\s*[:=]\s*\d+/g),before.toString().match(/timeout\s*[:=]\s*\d+/g));
 }
});
test('unknown or modified harness bytes never receive historical normalization',()=>{
 for(const f of Object.keys(scope.files)){
  const bad=Buffer.concat([read(f),Buffer.from('\n/* unreviewed */')]);assert.equal(normalizeA52Diagnostics(f,bad),bad);
 }
 const b=Buffer.from('unknown');assert.equal(normalizeA52Diagnostics('farm3d/game.js',b),b);
});
test('diagnostic helpers match exact reviewed hashes and parse without execution',()=>{
 assert.equal(Object.keys(scope.newHelpers).length,2);
 for(const [f,expected] of Object.entries(scope.newHelpers)){const b=read(f);assert.equal(sha(b),expected);new vm.Script(b.toString());}
});
