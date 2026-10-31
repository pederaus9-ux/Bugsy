import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import sound from './helpers/sound-scope.cjs';import art from './helpers/animal-art-scope.cjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
for(const f of ['game.js','index.html','sw.js']){
 test('A44 '+f+' differs from its prior accepted bytes only by the approved sound hunks',()=>{const cur=read(f),prior=sound.normalizeSoundScope(f,cur);assert.notEqual(prior,cur);assert.equal(sound.sha(prior),sound.scope.files[f].beforeSha256);});
 test('A44 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(sound.normalizeSoundScope(f,cur),cur);});
}
test('A44 worker uses sa3d-v83 and precaches game.js?v=36',()=>{const sw=art.normalizeAnimalArtCacheScope('sw.js',read('sw.js'));assert.match(sw,/const CACHE = "sa3d-v83";/);assert.equal(JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]).filter(p=>p==='game.js?v=36').length,1);});
test('A44 page wires gate creak to the barn doors and stone footsteps to the dairy path',()=>{const h=read('index.html');assert.match(h,/doorWant = 1; G\.sfx\("build"\); G\.sfx\("gate"\);/);assert.match(h,/inBarn = null; G\.sfx\("gate"\);/);assert.match(h,/dairyPath\.samples\.some\([^\n]*return "stone";/);});
