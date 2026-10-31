import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import perf from './helpers/perf-scope.cjs';import art from './helpers/animal-art-scope.cjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
for(const f of ['index.html','sw.js']){
 test('A46 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=perf.normalizePerfScope(f,cur);assert.notEqual(prior,cur);assert.equal(perf.sha(prior),perf.scope.files[f].beforeSha256);});
 test('A46 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(perf.normalizePerfScope(f,cur),cur);});
 test('A46 '+f+' is reversed by the A45 cache helper stack',()=>{const cur=read(f);assert.equal(art.normalizeAnimalArtCacheScope(f,perf.normalizePerfScope(f,cur)),art.normalizeAnimalArtCacheScope(f,cur));});
}
test('A46 worker uses sa3d-v85',()=>{assert.match(read('sw.js'),/const CACHE = "sa3d-v85";/);});
test('A46 page keeps phone-only antialias and Balanced shadow limits',()=>{const h=read('index.html');assert.match(h,/antialias:!PHONE/);assert.match(h,/PHONE && q !== "best"/);});
