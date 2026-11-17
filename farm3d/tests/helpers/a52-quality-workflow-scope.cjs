'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-quality-workflow-scope.json'));
if(sha(raw)!=='d8f738469aadfd3903449168b82ed18afcbf4695270d4c6d077b1436dc38d561')throw Error('A52 quality workflow receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52QualityWorkflow(file,input){
 const row=scope.files[file];if(!row||sha(input)!==row.afterSha256)return input;
 if(sha(row.before)!==row.beforeSha256)throw Error('Quality workflow inverse mismatch');
 return Buffer.isBuffer(input)?Buffer.from(row.before):row.before;
}
module.exports={normalizeA52QualityWorkflow,scope,sha};
