'use strict';
// A43 (owner-approved 2026-10-30 20:46 CDT; was A42 before the fence repair took A42): clock-only cow settle no longer dirties restored saves.
// Exact hunks in game.js, index.html (game.js?v=35) and sw.js (sa3d-v82). Reverse only those hunks so
// earlier frozen receipts (A28, field rollback, A39-A42) still check accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/cow-settle-scope.json'));
assert.equal(sha(raw),'ae8fb182f16e86eb727d1e510f18d9f9c05adead96ffb7e9d7a6427164b9a312','Exact approved A43 scope receipt');
const scope=JSON.parse(raw);
function normalizeCowSettleScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A43 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A43 exact prior bytes: '+file);
 return source;
}
module.exports={normalizeCowSettleScope,scope,sha};
