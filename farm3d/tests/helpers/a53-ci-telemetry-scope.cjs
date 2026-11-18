'use strict';
// Exact test-only outer inverse for historical accounting; never changes runtime/output bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a53-ci-telemetry-scope.json'));
assert.equal(sha(raw),'dcf393e4320fa40f7b2d5edce88e73969136cebe47aca42c0a8afaab19b2691e','Exact telemetry inverse fixture');
const scope=JSON.parse(raw);assert.equal(scope.schema,1);assert.equal(scope.parent,'72dd08158ca41a1b59d101ee9b09d9172971ecd6');assert.equal(Object.keys(scope.files).length,8);
function normalizeA53CITelemetry(file,bytes){
 const full=file.startsWith('farm3d/')||file.startsWith('.github/')?file:'farm3d/'+file,entry=scope.files[full];
 if(!entry||sha(bytes)!==entry.afterSha256)return bytes;
 let text=bytes.toString();for(const h of [...entry.hunks].reverse()){assert.equal(text.split(h.after).length,2,'Unique telemetry inverse');text=text.replace(h.after,()=>h.before);}
 assert.equal(sha(text),entry.beforeSha256,'Exact telemetry predecessor');return Buffer.isBuffer(bytes)?Buffer.from(text):text;
}
module.exports={scope,sha,normalizeA53CITelemetry};
