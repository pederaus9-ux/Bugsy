import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import settle from './helpers/cow-settle-scope.cjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
for(const f of ['game.js','index.html','sw.js']){
 test('A43 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=settle.normalizeCowSettleScope(f,cur);assert.notEqual(prior,cur);assert.equal(settle.sha(prior),settle.scope.files[f].beforeSha256);});
 test('A43 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(settle.normalizeCowSettleScope(f,cur),cur);});
}
test('A43 worker uses sa3d-v81 and precaches game.js?v=35 once',()=>{const sw=read('sw.js');assert.match(sw,/const CACHE = "sa3d-v82";/);assert.equal(JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]).filter(p=>p==='game.js?v=35').length,1);});
test('A43 settleCows publishes progress changes but not clock-only settles',()=>{const g=read('game.js');assert.match(g,/next\.cows\.some\(\(b,i\)=>b\.progress!==old\.cows\[i\]\?\.progress\)/);assert.match(g,/settleChickens\(\);\n  settleCows\(\);/);});
