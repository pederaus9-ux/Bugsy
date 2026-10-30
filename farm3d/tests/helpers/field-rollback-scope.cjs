'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(require('node:path').join(__dirname,'../fixtures/field-rollback-scope.json'));
assert.equal(sha(raw),'b560641f89064fe1651f1d0c507c072f776f17a421d57a9a26a7f678d345792b','Exact approved field rollback receipt');
const scope=JSON.parse(raw);
function normalizeRollbackScope(file,source){
 const e=scope.files[file];
 if(file!=='sw.js'||sha(source)!==e.afterSha256)return source;
 for(const h of e.hunks){
  assert.equal(source.split(h.after).length,2,'Unique rollback cache/shell hunk');
  source=source.replace(h.after,h.before);
 }
 assert.equal(sha(source),e.beforeSha256,'Exact pre-rollback service worker');
 return source;
}
function verifyRollbackAsset(file,bytes){
 const expected=scope.files[file]?.afterSha256??scope.assets[file];
 assert(expected,'Unknown rollback asset');
 assert.equal(sha(bytes),expected,'Exact rollback asset: '+file);
}
module.exports={normalizeRollbackScope,verifyRollbackAsset,scope,sha};
