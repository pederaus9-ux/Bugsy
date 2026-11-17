'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),h=require('./helpers/a52-release-companion.cjs');
const root=path.resolve(__dirname,'../..');
// Original workflow must be retained unmodified alongside this companion.
const sourcePath=path.join(root,'.github/workflows/farm3d-release-qualification.yml');
const source=fs.readFileSync(sourcePath,'utf8');
test('companion exactly equals hash-pinned specialization',()=>assert.equal(fs.readFileSync(path.join(root,'.github/workflows/a52-release-companion.yml'),'utf8'),h.specialize(source)));
test('any original source drift rejects generation',()=>assert.throws(()=>h.specialize(source+'\n'),/hash mismatch/));
test('fixed runset sequence and exact PR branch',()=>{assert.equal(h.BRANCH,'codex/a52-two-corner-ui-20261117');assert.deepEqual(h.PLAN.map(x=>x[2]),['all','all','all','a35-fixtures-integrity','a38-cache-only']);assert.deepEqual(h.PLAN[3][3],h.PLAN.slice(0,3).map(x=>x[0]));assert.deepEqual(h.PLAN[4][3],['a35_fixtures_integrity']);});
test('no new inputs secrets or elevated permission trigger',()=>{const text=h.specialize(source);assert(!/workflow_dispatch:|pull_request:|inputs\.|secrets\.|write-all|contents: write/.test(text));assert(text.includes('cancel-in-progress: false'));assert.equal((text.match(/ref: \$\{\{ github.sha \}\}/g)||[]).length,5);});
