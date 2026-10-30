'use strict';
// A41 (owner-approved 2026-10-30 17:57 CDT): bigger pastures add exact hunks to
// index.html and sw.js (sa3d-v80 + animal-pen-pasture.js?v=1). Reverse only those exact hunks so the
// earlier frozen receipts (field rollback, A25/A26/A36 cow routes, A38/A39) still check accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/pasture-scope.json'));
assert.equal(sha(raw),'c31ef93262830d79bfd87aa390126ab26b2c2935e0f93fc1778610858d6215ec','Exact approved A41 scope receipt');
const scope=JSON.parse(raw);
function normalizePastureScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A41 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A41 exact prior bytes: '+file);
 return source;
}
module.exports={normalizePastureScope,scope,sha};
