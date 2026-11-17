'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {normalize:normalizeOrdinary}=require('./a52-ordinary-diagnostics-scope.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-regression-registration.json'));
if(sha(raw)!=='35671a131669320111b65cd333714ad499b48b67e9d4b41b1d29df586fe86713')throw Error('A52 registration receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52Registration(file,input){
 input=normalizeOrdinary(file,input);
 const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;
 if(sha(e.before)!==e.beforeSha256)throw Error('Registration predecessor mismatch');
 return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;
}
module.exports={normalizeA52Registration,scope,sha};
