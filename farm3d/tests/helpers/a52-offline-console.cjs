'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-offline-console-scope.json'));
if(sha(raw)!=='84892cd6033922f3644bd14ddf29c5afda0ada482a8fad0e74bf3cf56b45f61b')throw Error('Offline console scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52OfflineConsole(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Offline console predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
module.exports={normalizeA52OfflineConsole,scope,sha};
