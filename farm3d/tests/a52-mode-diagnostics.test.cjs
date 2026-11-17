'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {modeHit,nativeProgress}=require('./helpers/a52-ci-evidence.cjs');
test('mode evidence has exact finite schema and phases only',()=>{
 for(const mode of ['walking','editing','photo']){
  assert.deepEqual(modeHit({schema:1,mode,snapshot:{observed:false}}),{schema:1,mode,snapshot:{observed:false}});
  for(const step of ['select','enter-wait','exit-action','exit-wait'])nativeProgress({schema:1,status:'running',stage:'mode-'+mode+'-'+step,viewport:2,completedViewports:1});
 }
 for(const v of [{schema:1,mode:'secret',snapshot:{observed:false}},{schema:1,mode:'editing',snapshot:{observed:false,url:'private'}},{schema:1,mode:'editing',snapshot:{observed:false},raw:'private'}])assert.throws(()=>modeHit(v));
});
test('mode diagnostics exact inverse keeps original native journey',()=>{
 const {scope,sha}=require('./helpers/a52-native-keyboard-scope.cjs'),s=fs.readFileSync(require.resolve('./a52-corner-menus.browser.cjs'),'utf8'),e=scope.modePhaseExtension;
 assert.equal(sha(s),scope.afterSha256);assert.equal(sha(e.before),e.previousAfterSha256);assert.equal(s.split(e.replacement.after).length,2);assert.equal(s.replace(e.replacement.after,e.replacement.before),e.before);
 const r=JSON.parse(fs.readFileSync(require.resolve('./fixtures/a52-mode-evidence-scope.json')));assert.equal(sha(fs.readFileSync(require.resolve('./fixtures/a52-mode-evidence-scope.json'))),'91e6945bbc792a706d667c2ef6d4104c09d7a9b240cdfe773826b62a34ee4d78');assert.equal(sha(r.before),r.beforeSha256);assert.equal(sha(fs.readFileSync(require.resolve('./helpers/a52-ci-evidence.cjs'))),r.afterSha256);
});
