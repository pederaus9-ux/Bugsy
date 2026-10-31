'use strict';
// A42 (owner-approved 2026-10-30 20:46 CDT): clock-only cow settle no longer dirties restored saves.
// Exact hunks in game.js, index.html (game.js?v=35) and sw.js (sa3d-v81). Reverse only those hunks so
// earlier frozen receipts (A28, field rollback, A39-A41) still check accepted bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/cow-settle-scope.json'));
assert.equal(sha(raw),'7f76e16c401b592b68a8fa1507332ec26c02455224133c80823a6faae40c4557','Exact approved A42 scope receipt');
const scope=JSON.parse(raw);
function normalizeCowSettleScope(file,source){
 const e=scope.files[file];if(!e||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique A42 hunk');source=source.replace(h.after,h.before);}
 assert.equal(sha(source),e.beforeSha256,'A42 exact prior bytes: '+file);
 return source;
}
module.exports={normalizeCowSettleScope,scope,sha};
