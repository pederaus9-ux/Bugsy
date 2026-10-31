'use strict';
// A42 (owner-approved 2026-10-30 21:00 CDT): the pasture-fence rebuild adds exact hunks to index.html and
// sw.js (sa3d-v81, animal-pen-pasture.js?v=2, animal-pen-pasture-worker.js?v=1). Reverse only those exact
// hunks back to the accepted A41 bytes, so every earlier frozen receipt keeps checking accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/pasture-fence-scope.json'));
assert.equal(sha(raw),'951b2078932af82e5008fd2e9ccf0f4f74b7eb54d47b3ae29926bc720d78c8c9','Exact approved A42 scope receipt');
const scope=JSON.parse(raw);
function normalizePastureFenceScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A42 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A42 exact prior bytes: '+file);
 return source;
}
module.exports={normalizePastureFenceScope,scope,sha};
