import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import rollback from './helpers/field-rollback-scope.cjs';
import field from './helpers/field-support-scope.cjs';
import {normalizeReleaseBlockerScope} from './helpers/release-blocker-scope.mjs';
const root=new URL('../../',import.meta.url);
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const prior=(ref,file)=>execFileSync('git',['show',ref+':farm3d/'+file],{cwd:root,encoding:'utf8'});

test('rollback receipt keeps the frozen field receipt byte-for-byte',()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/field-support-scope.json',import.meta.url));
 assert.equal(rollback.sha(bytes),rollback.scope.frozenFieldReceiptSha256);
 assert.equal(rollback.scope.baseline,field.scope.base);
});

test('approved correction preserves the exact published rollback receipt preimage',()=>{
 assert.equal(rollback.scope.publishedPreimage.head,'bfbe32661f68d043b78fa25741c6f96d7ac1ca0d');
 assert.equal(rollback.scope.publishedPreimage.sha256,'47171802d167f5c0c603d8b9b689ed93065d924e472125f1af0e0ac94591152d');
 assert.equal(rollback.sha(rollback.scope.publishedPreimage.raw),rollback.scope.publishedPreimage.sha256);
 assert.equal(JSON.parse(rollback.scope.publishedPreimage.raw).files['sw.js'].afterSha256,'4f2524f22ea1ff8c354f635c08ce1d06ea4dee07bbb04185cb834ea2f72eadf7');
});

test('rollback index is the exact accepted pre-field renderer',()=>{
 const current=read('index.html');
 rollback.verifyRollbackAsset('index.html',current);
 assert.equal(current,prior(rollback.scope.baseline,'index.html'));
 assert(!current.includes("import {plotSupport} from './plot-support.js?v=1';"));
 assert.equal(field.normalizeFieldScope('index.html',current),current);
 assert.equal(rollback.sha(normalizeReleaseBlockerScope('index.html',current)),'8e6804c1b63c15f283dddbc6f815e2b21288449daef77a403b7fc08ba3aa6652');
});

test('forward worker reconstructs exact v76 and only precaches current startup modules',()=>{
 const current=read('sw.js');
 rollback.verifyRollbackAsset('sw.js',current);
 assert.equal(rollback.normalizeRollbackScope('sw.js',current),prior(rollback.scope.fieldHead,'sw.js'));
 assert.equal(field.normalizeFieldScope('sw.js',current),prior(rollback.scope.baseline,'sw.js'));
 assert(!current.includes('"plot-support.js?v=1"'));
 assert(current.includes('"auth.js?v=21"'));
 assert(current.includes('"game.js?v=34"'));
});

test('retained compatibility helper is exact; missing, corrupt and unknown assets fail',()=>{
 const bytes=fs.readFileSync(new URL('../plot-support.js',import.meta.url));
 rollback.verifyRollbackAsset('plot-support.js',bytes);
 field.verifyFieldAsset('plot-support.js',bytes);
 assert.throws(()=>rollback.verifyRollbackAsset('plot-support.js',Buffer.alloc(0)));
 assert.throws(()=>rollback.verifyRollbackAsset('plot-support.js',Buffer.concat([bytes,Buffer.from('corrupt')])));
 assert.throws(()=>rollback.verifyRollbackAsset('unknown.js',bytes));
});

const sw=read('sw.js');
for(const [name,mutate] of [
 ['wrong forward cache version',s=>s.replace('sa3d-v77','sa3d-v78')],
 ['duplicate cache hunk',s=>s.replace('const CACHE = "sa3d-v77";','const CACHE = "sa3d-v77";\nconst CACHE = "sa3d-v77";')],
 ['obsolete compatibility shell entry',s=>s.replace('const SHELL = [','const SHELL = ["plot-support.js?v=1",')],
 ['missing required startup dependency',s=>s.replace('"game.js?v=34",','')],
 ['unapproved prefix',s=>'/* unrelated prefix */\n'+s],
 ['unapproved suffix',s=>s+'\n/* unrelated suffix */'],
 ['auth version regression',s=>s.replace('auth.js?v=21','auth.js?v=20')],
])test('rollback rejects '+name,()=>{
 const changed=mutate(sw);
 assert.notEqual(changed,sw,'negative control must mutate actual source');
 assert.throws(()=>rollback.verifyRollbackAsset('sw.js',changed));
 assert.throws(()=>field.normalizeFieldScope('sw.js',changed));
});

test('rollback index refuses position changes, prefix and suffix corruption',()=>{
 const current=read('index.html');
 for(const changed of [current.replace('g.position.set(p.x, 0, p.y);','g.position.set(p.x, 1, p.y);'),'<!-- unrelated prefix -->\n'+current,current+'\n<!-- unrelated suffix -->']){
  assert.notEqual(changed,current,'negative control must mutate actual source');
  assert.throws(()=>rollback.verifyRollbackAsset('index.html',changed));
  assert.throws(()=>field.normalizeFieldScope('index.html',changed));
 }
});
