
'use strict';
// Exact outer adapter only. Unknown bytes are never normalized.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-diagnostics-scope.json'));
if(sha(raw)!=='dfb5d145ca98b7e0d6437cbc75e6fd3ec1b92a168ac8e97bbb03aeec826f98a4')throw Error('A52 diagnostic scope receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52Diagnostics(file,input){
 const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;
 let text=Buffer.isBuffer(input)?input.toString('utf8'):input;
 for(const h of [...e.hunks].reverse()){
  if(text.split(h.after).length!==2)throw Error('A52 diagnostic inverse ambiguity');
  text=text.replace(h.after,h.before);
 }
 if(sha(text)!==e.beforeSha256)throw Error('A52 diagnostic inverse mismatch');
 return Buffer.isBuffer(input)?Buffer.from(text):text;
}
module.exports={normalizeA52Diagnostics,scope,sha};
