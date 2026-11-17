'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-editbar-layout-scope.json'));
if(sha(raw)!=='65c372af4e67f1d2341c13528e78dd1f35211edc07afa1ea53975cfbee8ea580')throw Error('Edit bar scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52EditBar(file,input){if(file==='compact-ui.css')file='farm3d/'+file;if(file!==scope.file||sha(input)!==scope.afterSha256)return input;if(sha(scope.before)!==scope.beforeSha256)throw Error('Edit bar predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(scope.before):scope.before;}
module.exports={scope,sha,normalizeA52EditBar};
