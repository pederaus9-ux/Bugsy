'use strict';
// A45 (owner Austin approved 2026-10-30: art 20:47 CDT, frozen-baseline update 21:09 CDT): animal art pass adds exact hunks to cow3d.js,
// quadruped3d.js, sheep3d.js and chicken3d.js (segment counts + baked vertex-colour shading) (no cache-name change).
// Reverse only those exact hunks so earlier frozen receipts still check their accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/animal-art-scope.json'));
assert.equal(sha(raw),'c057e3188f46bd365291dfce27b3ce5bbe811fb240ffb272025d319bbf5c59a4','Exact approved A45 scope receipt');
const scope=JSON.parse(raw);
function normalizeAnimalArtScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A45 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A45 exact prior bytes: '+file);
 return source;
}
// Lock-guard form of the reversal. Like the other scope helpers it is whole-file verified: it reverses
// only when the source is exactly the approved A45 postimage, and the result must hash to the prior bytes.
function reverseAnimalArtHunks(file,source){return normalizeAnimalArtScope(file,source);}
module.exports={normalizeAnimalArtScope,reverseAnimalArtHunks,scope,sha};
