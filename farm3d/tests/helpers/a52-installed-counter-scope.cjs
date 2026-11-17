'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-installed-counter-scope.json'));
if(sha(raw)!=='7899a7e136111e3e259abe3650fb3f3c419657fd530820c6011fcbd02fb2d53f')throw Error('A52 installed counter receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52InstalledCounter(file,input){
 const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;
 let text=Buffer.isBuffer(input)?input.toString('utf8'):input;
 for(const h of [...e.hunks].reverse()){if(text.split(h.after).length!==2)throw Error('Counter inverse ambiguity');text=text.replace(h.after,h.before);}
 if(sha(text)!==e.beforeSha256)throw Error('Counter inverse mismatch');
 return Buffer.isBuffer(input)?Buffer.from(text):text;
}
module.exports={normalizeA52InstalledCounter,scope,sha};
