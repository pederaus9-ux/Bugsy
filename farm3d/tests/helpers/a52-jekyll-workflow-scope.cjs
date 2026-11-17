'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-jekyll-workflow-scope.json'));
if(sha(raw)!=='c308083a7985b54ad4241beff076f53e89c668d6e580f12bf9528729c5dbfd49')throw Error('Jekyll outer workflow receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52JekyllWorkflow(file,input){const row=scope.files[file];if(!row||sha(input)!==row.afterSha256)return input;if(sha(row.before)!==row.beforeSha256)throw Error('Jekyll workflow inverse mismatch');return Buffer.isBuffer(input)?Buffer.from(row.before):row.before;}
module.exports={normalizeA52JekyllWorkflow,scope,sha};
