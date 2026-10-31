import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import settle from './helpers/cow-settle-scope.cjs';
import pasture from './helpers/pasture-scope.cjs';
const read=f=>settle.normalizeCowSettleScope(f,fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
for(const f of ['index.html','sw.js']){
 test('A41 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=pasture.normalizePastureScope(f,cur);assert.notEqual(prior,cur);assert.equal(pasture.sha(prior),pasture.scope.files[f].beforeSha256);});
 test('A41 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(pasture.normalizePastureScope(f,cur),cur);});
}
test('A41 worker precaches the pasture module under sa3d-v80',()=>{const sw=read('sw.js');assert.match(sw,/const CACHE = "sa3d-v80";/);assert.equal(JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]).filter(p=>p==='animal-pen-pasture.js?v=1').length,1);});
