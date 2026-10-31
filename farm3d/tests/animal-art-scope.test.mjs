import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import art from './helpers/animal-art-scope.cjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
for(const f of Object.keys(art.scope.files)){
 test('A45 '+f+' differs from its prior accepted bytes only by the approved hunks',()=>{const cur=read(f),prior=art.normalizeAnimalArtScope(f,cur);assert.notEqual(prior,cur);assert.equal(art.sha(prior),art.scope.files[f].beforeSha256);});
 test('A45 '+f+' with an unrelated edit is not normalized',()=>{const cur=read(f)+'\n/* unrelated */';assert.equal(art.normalizeAnimalArtScope(f,cur),cur);});
}
test('A45 lock-guard reversal is whole-file verified',()=>{for(const f of Object.keys(art.scope.files)){const cur=read(f);assert.equal(art.sha(art.reverseAnimalArtHunks(f,cur)),art.scope.files[f].beforeSha256);const bad=cur.replace(/\n$/,'\n// unrelated\n');assert.equal(art.reverseAnimalArtHunks(f,bad),bad);}});
