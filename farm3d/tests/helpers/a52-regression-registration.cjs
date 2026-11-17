'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-regression-registration.json'));
if(sha(raw)!=='e0f9c044e27f66496addbe34696c426d8be7a16c84168fd0ea0084e174ce9260')throw Error('A52 registration receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52Registration(file,input){
 const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;
 if(sha(e.before)!==e.beforeSha256)throw Error('Registration predecessor mismatch');
 return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;
}
module.exports={normalizeA52Registration,scope,sha};
