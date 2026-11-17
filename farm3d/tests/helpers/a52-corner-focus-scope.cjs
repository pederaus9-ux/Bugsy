'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-corner-focus-scope.json'));
if(sha(raw)!=='b461a1225290d7a7aadd9be4fa893631942724db2c899b137e07a855f86d0ed8')throw Error('Corner focus scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52CornerFocus(file,input){if(file==='corner-menu.js')file='farm3d/'+file;if(file!==scope.file||sha(input)!==scope.afterSha256)return input;if(sha(scope.before)!==scope.beforeSha256)throw Error('Corner focus predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(scope.before):scope.before;}
module.exports={scope,sha,normalizeA52CornerFocus};
