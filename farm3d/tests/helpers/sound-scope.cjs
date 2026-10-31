'use strict';
// A44 (owner-approved 2026-10-30 21:06 CDT): sound polish adds exact hunks to game.js, index.html
// (gate creak, stone footsteps, game.js?v=36) and sw.js (sa3d-v83, game.js?v=36). Reverse only those exact hunks
// so the earlier frozen receipts (A43, A42, A41, A40, A39, A28, A7 and older) still check accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/sound-scope.json'));
assert.equal(sha(raw),'b2ec69558e49939a39d022ee17cefbaff2a7c77ac1d393c182b1264e06cc1f16','Exact approved A44 scope receipt');
const scope=JSON.parse(raw);
const {normalizeAnimalArtCacheScope}=require('./animal-art-scope.cjs'); // A45 art cache bump (sa3d-v84) sits on top of A44
function normalizeSoundScope(file,source){
 source=normalizeAnimalArtCacheScope(file,source);
 const text=Buffer.isBuffer(source)?source.toString():source;
 const e=scope.files[file];if(!e||sha(text)!==e.afterSha256)return source;
 let s=text;for(const h of e.hunks){assert.equal(s.split(h.after).length,2,'Unique A44 hunk');s=s.replace(h.after,h.before);}
 assert.equal(sha(s),e.beforeSha256,'A44 exact prior bytes: '+file);
 return Buffer.isBuffer(source)?Buffer.from(s):s;
}
module.exports={normalizeSoundScope,scope,sha};
