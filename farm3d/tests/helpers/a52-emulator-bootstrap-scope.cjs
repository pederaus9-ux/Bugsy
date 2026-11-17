
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-emulator-bootstrap-scope.json'));
if(sha(raw)!=='3a7f1fb1e571e7f2bccfd7dd7eea708d3ba77b48421afaea196b3d2c7bd7026d')throw Error('Emulator bootstrap receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52EmulatorBootstrap(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Emulator bootstrap inverse mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
module.exports={scope,sha,normalizeA52EmulatorBootstrap};
