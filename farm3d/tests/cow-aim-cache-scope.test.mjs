import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import cowAimCache from './helpers/cow-aim-cache-scope.cjs';
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
test('A39 worker differs from the accepted v77 worker only by its cache name',()=>{
 assert.match(sw,/const CACHE = "sa3d-v78";/);
 assert.notEqual(cowAimCache.normalizeCowAimCacheScope('sw.js',sw),sw);
});
for(const [name,mutate] of [
 ['unrelated suffix',s=>s+'\n/* unrelated */'],
 ['duplicate cache hunk',s=>s.replace('const CACHE = "sa3d-v78";','const CACHE = "sa3d-v78";\nconst CACHE = "sa3d-v78";')],
 ['shell change',s=>s.replace('"game.js?v=34",','')],
])test('A39 cache scope rejects '+name,()=>assert.throws(()=>cowAimCache.normalizeCowAimCacheScope('sw.js',mutate(sw))));
