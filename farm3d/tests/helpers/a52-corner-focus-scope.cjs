'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-corner-focus-scope.json'));
if(sha(raw)!=='1440b9cc251e36866a37c7c52f424b73cb6b73b7da7e857cfd12761ed0516811')throw Error('Corner focus scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52CornerFocus(file,input){if(file==='corner-menu.js')file='farm3d/'+file;if(file!==scope.file||sha(input)!==scope.afterSha256)return input;if(sha(scope.before)!==scope.beforeSha256)throw Error('Corner focus predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(scope.before):scope.before;}
module.exports={scope,sha,normalizeA52CornerFocus};
