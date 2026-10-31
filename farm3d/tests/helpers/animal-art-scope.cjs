'use strict';
// A45 (owner Austin approved 2026-10-30: art 20:47 CDT, frozen-baseline update 21:09 CDT): animal art pass adds exact hunks to cow3d.js,
// quadruped3d.js, sheep3d.js and chicken3d.js (segment counts + baked vertex-colour shading). Its cache bump (sa3d-v84,
// cow3d.js?v=6, chicken3d.js?v=2; Austin 21:09 CDT) sits on top of A44 sound polish: normalizeSoundScope reverses it first.
// Reverse only those exact hunks so earlier frozen receipts still check their accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/animal-art-scope.json'));
assert.equal(sha(raw),'bc172f82e6ad1b86ddc03fe62676f5c17fa159a09d2174316bb7e168de638e54','Exact approved A45 scope receipt');
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
// Diagnostics only (never accepts bytes): when a lock guard has already rejected or will re-check a file
// with its own exact prefix/suffix/prior-file digests, undo whichever A45 hunks are still present so the
// guard reports the region that actually changed instead of the A45 region.
function locateAnimalArtHunks(file,source){
 const e=scope.files[file];if(!e)return source;
 for(const h of e.hunks)if(source.split(h.after).length===2)source=source.replace(h.after,h.before);
 return source;
}
// A45 cache bump (top of the stack, above A44): whole-file verified reversal of only the version hunks.
const {normalizePerfScope}=require('./perf-scope.cjs'); // A46 performance (sa3d-v85) sits on top of A45
function normalizeAnimalArtCacheScope(file,source){
 source=normalizePerfScope(file,source);
 const text=Buffer.isBuffer(source)?source.toString():source;
 const e=(scope.cacheFiles||{})[file];if(!e||sha(text)!==e.afterSha256)return source;
 let s=text;for(const h of e.hunks){assert.equal(s.split(h.after).length,2,'Unique A45 cache hunk');s=s.replace(h.after,h.before);}
 assert.equal(sha(s),e.beforeSha256,'A45 exact prior bytes (main plus A44): '+file);
 return Buffer.isBuffer(source)?Buffer.from(s):s;
}
module.exports={normalizeAnimalArtScope,normalizeAnimalArtCacheScope,reverseAnimalArtHunks,locateAnimalArtHunks,scope,sha};
