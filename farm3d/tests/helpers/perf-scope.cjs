'use strict';
// A46 (owner Austin approved 2026-10-31, relayed to Performance): mobile-stutter performance change adds exact
// hunks to index.html (render/raycast hot paths) and bumps sw.js to sa3d-v85. It sits on top of A45 (sa3d-v84):
// normalizeAnimalArtCacheScope calls this first. Reverse only those exact hunks so earlier frozen receipts still
// check their accepted bytes; any other edit leaves the source unchanged (whole-file verified).
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/perf-scope.json'));
assert.equal(sha(raw),'ca2e276041be3bafed5c647e26edd16ff7be61bb7f268625f1e35ec3417e22eb','Exact approved A46 scope receipt');
const scope=JSON.parse(raw);
function normalizePerfScope(file,source){
 const text=Buffer.isBuffer(source)?source.toString():source;
 const e=scope.files[file];if(!e||sha(text)!==e.afterSha256)return source;
 let s=text;for(const h of e.hunks){assert.equal(s.split(h.after).length,2,'Unique A46 hunk');s=s.replace(h.after,h.before);}
 assert.equal(sha(s),e.beforeSha256,'A46 exact prior bytes (main plus A45): '+file);
 return Buffer.isBuffer(source)?Buffer.from(s):s;
}
module.exports={normalizePerfScope,scope,sha};
