'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(require('node:path').join(__dirname,'../fixtures/field-rollback-scope.json'));
assert.equal(sha(raw),'47171802d167f5c0c603d8b9b689ed93065d924e472125f1af0e0ac94591152d','Exact approved field rollback receipt');
const scope=JSON.parse(raw);
function normalizeRollbackScope(file,source){
 const e=scope.files[file];
 if(file!=='sw.js'||sha(source)!==e.afterSha256)return source;
 assert.equal(source.split(e.after).length,2,'Unique rollback cache hunk');
 source=source.replace(e.after,e.before);
 assert.equal(sha(source),e.beforeSha256,'Exact pre-rollback service worker');
 return source;
}
function verifyRollbackAsset(file,bytes){
 const expected=scope.files[file]?.afterSha256??scope.assets[file];
 assert(expected,'Unknown rollback asset');
 assert.equal(sha(bytes),expected,'Exact rollback asset: '+file);
}
module.exports={normalizeRollbackScope,verifyRollbackAsset,scope,sha};
