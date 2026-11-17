'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-native-keyboard-scope.json'));
if(sha(raw)!=='a1e93816996060840903508ce493d6759a7099ee590cabaefdd303f487455a64')throw Error('Native keyboard receipt mismatch');
const scope=JSON.parse(raw);
function normalizeA52NativeKeyboard(file,input){if(file!==scope.file||sha(input)!==scope.afterSha256)return input;if(sha(scope.before)!==scope.beforeSha256)throw Error('Native keyboard inverse mismatch');return Buffer.isBuffer(input)?Buffer.from(scope.before):scope.before;}
module.exports={sha,scope,normalizeA52NativeKeyboard};
