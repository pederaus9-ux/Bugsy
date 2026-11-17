
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-ci-workflows.json'));
if(sha(raw)!=='fba72a9d7221cec28c8de56a5034af87e7a05f1581f27ce85ffd841d27f9d9c9')throw Error('A52 CI workflow receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52CiWorkflows(file,input){
 const row=scope.files[file];if(!row||sha(input)!==row.afterSha256)return input;
 if(sha(row.before)!==row.beforeSha256)throw Error('A52 CI workflow predecessor mismatch');
 return Buffer.isBuffer(input)?Buffer.from(row.before):row.before;
}
module.exports={normalizeA52CiWorkflows,scope,sha};
