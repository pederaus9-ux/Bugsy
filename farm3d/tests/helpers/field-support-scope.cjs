'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const raw=fs.readFileSync(require('node:path').join(__dirname,'../fixtures/field-support-scope.json'));
assert.equal(sha(raw),'325cd027b9287b4dca02632bd0a84624cd8bf4bbd02d48c5b6c74266ab0a80f7','Exact approved field scope receipt');
const scope=JSON.parse(raw);
const {normalizeRollbackScope}=require('./field-rollback-scope.cjs');
function normalizeFieldScope(file,source){source=normalizeRollbackScope(file,source);const e=scope.files[file];if(!e)return source;if(sha(source)===e.beforeSha256)return source;assert.equal(sha(source),e.afterSha256,'Unknown field postimage: '+file);for(const h of e.hunks){assert.equal(source.split(h.after).length,2,'Unique field hunk');source=source.replace(h.after,h.before);}assert.equal(sha(source),e.beforeSha256,'Exact pre-field reconstruction');return source;}
function verifyFieldAsset(file,bytes){assert(Object.hasOwn(scope.assets,file),'Unknown field asset');assert.equal(sha(bytes),scope.assets[file],'Exact field asset');}
module.exports={normalizeFieldScope,verifyFieldAsset,scope,sha};
