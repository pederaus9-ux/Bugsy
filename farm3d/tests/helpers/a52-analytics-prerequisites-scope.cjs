'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-analytics-prerequisites-scope.json'));
if(sha(raw)!=='b4f15baf54b615b458f6e69b6a1a3a874fbf5d214422dbc26e128bcef72b9808')throw Error('Analytics prerequisites scope mismatch');
const scope=JSON.parse(raw);
function normalize(file,input){const e=scope.files[file.replace(/^farm3d\/tests\//,'')];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Prerequisites predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
module.exports={normalize,scope,sha};
