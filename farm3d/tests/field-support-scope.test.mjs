import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import currentField from './helpers/field-support-scope.cjs';
import {normalizeReleaseBlockerScope} from './helpers/release-blocker-scope.mjs';
const root=new URL('../../',import.meta.url);
const fieldRef='0d0542bf93e4e010b5543e81a40fae4bca2dd5f9';
const immutable=file=>execFileSync('git',['show',fieldRef+':farm3d/'+file],{cwd:root,encoding:'utf8'});
// Run the original field assertions against their exact accepted source/helper.
// The approved rollback must not make the old v76 -> v77 corruption check pass.
const historicalHelper=immutable('tests/helpers/field-support-scope.cjs');
assert.equal(currentField.sha(historicalHelper),'2d6903dbd97805e657b41f1d3d7809c12a95aad1b6aff0bfac546100db2cc922');
const helperPath=fileURLToPath(new URL('./helpers/field-support-scope.cjs',import.meta.url));
const historicalModule={exports:{}};
new Function('require','__dirname','module',historicalHelper)(createRequire(import.meta.url),path.dirname(helperPath),historicalModule);
const field=historicalModule.exports;
const read=file=>immutable(file);
for(const file of ['index.html','sw.js'])test(file+' reconstructs the exact accepted v75 source and rejects unapproved bytes',()=>{
 const current=read(file),prior=execFileSync('git',['show',field.scope.base+':farm3d/'+file],{cwd:root,encoding:'utf8'});
 assert.equal(field.normalizeFieldScope(file,current),prior);
 assert.equal(field.normalizeFieldScope(file,prior),prior);
 assert.throws(()=>field.normalizeFieldScope(file,current+'\n/* unrelated */'));
 const h=field.scope.files[file].hunks[0];
 assert.throws(()=>field.normalizeFieldScope(file,current.replace(h.after,h.after+h.after)),'duplicate hunk');
 assert.throws(()=>field.normalizeFieldScope(file,'/* unrelated prefix */\n'+current));
});
test('new module is exact and unknown/missing/corrupt helpers are rejected',()=>{
 const bytes=fs.readFileSync(new URL('../plot-support.js',import.meta.url));
 field.verifyFieldAsset('plot-support.js',bytes);
 assert.throws(()=>field.verifyFieldAsset('plot-support.js',Buffer.concat([bytes,Buffer.from('corrupt')])));
 assert.throws(()=>field.verifyFieldAsset('plot-support.js',Buffer.alloc(0)));
 assert.throws(()=>field.verifyFieldAsset('unknown.js',bytes));
});
test('A38 and field accounting compose without accepting unrelated changes',()=>{
 assert.equal(field.sha(normalizeReleaseBlockerScope('index.html',read('index.html'))),'8e6804c1b63c15f283dddbc6f815e2b21288449daef77a403b7fc08ba3aa6652');
 assert.throws(()=>normalizeReleaseBlockerScope('index.html',read('index.html').replace('plot-support.js?v=1','plot-support.js?v=2')));
 assert.throws(()=>field.normalizeFieldScope('sw.js',read('sw.js').replace('sa3d-v76','sa3d-v77')));
});
test('historical cache journeys differ only by the immutable currentRef pin',()=>{
 for(const file of ['animal-pen-cache-v73-to-v74.browser.cjs','animal-pen-cache-v74-to-v75.browser.cjs']){
  const prior=execFileSync('git',['show',field.scope.base+':farm3d/tests/'+file],{cwd:root,encoding:'utf8'});
  const current=fs.readFileSync(new URL(file,import.meta.url),'utf8');
  const pinned="const currentRef='"+field.scope.base+"'; // Immutable accepted v75 source; every historical assertion/input retained.";
  const original="const currentRef=execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim();";
  assert.equal(current.split(pinned).length,2);
  assert.equal(current.replace(pinned,original),prior,'all predecessor bytes and every original assertion remain exact');
 }
});

test('current rollback still reconstructs exact pre-field sources without unrelated edits',()=>{
 for(const file of ['index.html','sw.js']){
  const current=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const prior=execFileSync('git',['show',field.scope.base+':farm3d/'+file],{cwd:root,encoding:'utf8'});
  assert.equal(currentField.normalizeFieldScope(file,current),prior);
  assert.throws(()=>currentField.normalizeFieldScope(file,current+'\n/* unrelated */'));
 }
});
