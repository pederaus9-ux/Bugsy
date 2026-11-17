'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-analytics-report-scope.json'));
if(sha(raw)!=='bbe49f9163a10faf452cc8a5ef4f4d0430b61611400868b4902035d93cd87e1f')throw Error('Analytics report scope mismatch');
const scope=JSON.parse(raw);
function normalize(file,input){const e=scope.files[file.replace(/^farm3d\/tests\//,'')];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Report predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
module.exports={normalize,scope,sha};
