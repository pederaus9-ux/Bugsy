'use strict';
// A53 exact outer accounting inverse only. Package output checks keep actual release bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a53-cow-recovery-scope.json'));
assert.equal(sha(raw),'880cd554a8be8b874fae3df28934fc8c069137258a56131804af8737b8b5ff89','Exact frozen A53 cow-recovery scope');
const scope=JSON.parse(raw);
const deltaRaw=fs.readFileSync(path.join(__dirname,'../fixtures/a53-custom-nearest-scope.json'));
assert.equal(sha(deltaRaw),'0a238b9599176194279d94370d65f586098799d3d0ab8b7bf9171a8ad4571be1','Exact custom nearest scope');
const delta=JSON.parse(deltaRaw),entry=scope.files['farm3d/index.html'];
assert.equal(delta.schema,1);assert.equal(delta.file,'farm3d/index.html');assert.equal(delta.beforeSha256,entry.afterSha256);
assert.equal(delta.hunks.length,1);assert(delta.hunks[0].before&&delta.hunks[0].after);
entry.hunks.push(...delta.hunks);entry.afterSha256=delta.afterSha256;
function normalizeA53CowRecovery(file,bytes){
 const full=file.startsWith('farm3d/')?file:'farm3d/'+file,entry=scope.files[full];
 if(!entry)return bytes;
 assert.equal(sha(bytes),entry.afterSha256,'Exact current A53 runtime: '+full);
 let text=bytes.toString();for(const h of [...entry.hunks].reverse()){assert.equal(text.split(h.after).length,2,'Unique exact A53 inverse hunk');text=text.replace(h.after,()=>h.before);}
 assert.equal(sha(text),entry.beforeSha256,'Exact A53 predecessor: '+full);
 return Buffer.isBuffer(bytes)?Buffer.from(text):text;
}
module.exports={scope,sha,normalizeA53CowRecovery};
