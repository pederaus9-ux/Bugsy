import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import cowSpace from './helpers/cow-space-scope.cjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
for(const f of ['index.html','sw.js']){
 test('A40 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=cowSpace.normalizeCowSpaceScope(f,cur);assert.notEqual(prior,cur);assert.equal(cowSpace.sha(prior),cowSpace.scope.files[f].beforeSha256);});
 test('A40 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(cowSpace.normalizeCowSpaceScope(f,cur),cur);});
}
test('A40 worker precaches the cushion module under sa3d-v79',()=>{const sw=read('sw.js');assert.match(sw,/const CACHE = "sa3d-v79";/);assert.equal(JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]).filter(p=>p==='cow-personal-space.js?v=1').length,1);});
