'use strict';
// A40 (owner-approved 2026-10-30 17:15 CDT): the cow personal-space cushion adds exact hunks to
// index.html and sw.js (sa3d-v79 + cow-personal-space.js?v=1). Reverse only those exact hunks so the
// earlier frozen receipts (field rollback, A25/A26/A36 cow routes, A38/A39) still check accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/cow-space-scope.json'));
assert.equal(sha(raw),'44ad2b33c1e64edc1ab17d953b52db64b0bd9d194720fbebc2e8f34275d5e8e5','Exact approved A40 scope receipt');
const scope=JSON.parse(raw);
function normalizeCowSpaceScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A40 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A40 exact prior bytes: '+file);
 return source;
}
module.exports={normalizeCowSpaceScope,scope,sha};
