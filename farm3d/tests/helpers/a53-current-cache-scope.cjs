'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a53-current-cache-scope.json'));
if(sha(raw)!=='663afe89445cb9818bd0ca77bc4280f4c0484ed1ddcc0055891ead32de9aab91')throw Error('A53 current cache scope mismatch');
const scope=JSON.parse(raw);
function normalize(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;let text=input.toString();for(const [before,after]of [...(e.phaseHunks||[])].reverse()){if(text.split(after).length!==2)throw Error('Phase inverse mismatch');text=text.replace(after,before);}if(e.cacheOnlySha256&&sha(text)!==e.cacheOnlySha256)throw Error('Phase predecessor mismatch');if(text.split('sa3d-v94').length-1!==e.count)throw Error('Current cache count mismatch');text=text.replaceAll('sa3d-v94','sa3d-v93');if(sha(text)!==e.beforeSha256)throw Error('Current cache inverse mismatch');return Buffer.isBuffer(input)?Buffer.from(text):text;}
module.exports={normalize,scope,sha};
