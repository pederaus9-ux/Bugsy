import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import field from './helpers/field-support-scope.cjs';
import {normalizeReleaseBlockerScope} from './helpers/release-blocker-scope.mjs';
const root=new URL('../../',import.meta.url);
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
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
