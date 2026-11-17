'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-workflow-publication-scope.json'));
if(sha(raw)!=='f21103c490b94c738dc2e82112c56470ff63f41f5eac866d2b06f9e962ea0ddd')throw Error('Publication scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52WorkflowPublication(file,input){const row=scope.files[file];if(!row||sha(input)!==row.afterSha256)return input;if(sha(row.before)!==row.beforeSha256)throw Error('Publication inverse mismatch');return Buffer.isBuffer(input)?Buffer.from(row.before):row.before;}
module.exports={scope,sha,normalizeA52WorkflowPublication};
