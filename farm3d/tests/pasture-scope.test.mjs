import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import settle from './helpers/cow-settle-scope.cjs';
import pasture from './helpers/pasture-scope.cjs';
const read=f=>settle.normalizeCowSettleScope(f,fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
for(const f of ['index.html','sw.js']){
 test('A41 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=pasture.normalizePastureScope(f,cur);assert.notEqual(prior,cur);assert.equal(pasture.sha(prior),pasture.scope.files[f].beforeSha256);});
 test('A41 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(pasture.normalizePastureScope(f,cur),cur);});
}
test('A42 worker precaches the pasture module and its worker under sa3d-v81',()=>{const sw=read('sw.js');assert.match(sw,/const CACHE = "sa3d-v81";/);const shell=JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]);assert.equal(shell.filter(p=>p==='animal-pen-pasture.js?v=2').length,1);assert.equal(shell.filter(p=>p==='animal-pen-pasture-worker.js?v=1').length,1);assert(!shell.includes('animal-pen-pasture.js?v=1'));});
import fence from './helpers/pasture-fence-scope.cjs';
for(const f of ['index.html','sw.js']){
 test('A42 '+f+' differs from its A41 accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=fence.normalizePastureFenceScope(f,cur);assert.notEqual(prior,cur);assert.equal(fence.sha(prior),fence.scope.files[f].beforeSha256);});
 test('A42 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(fence.normalizePastureFenceScope(f,cur),cur);});
}
