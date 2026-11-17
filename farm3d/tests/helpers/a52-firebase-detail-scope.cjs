'use strict';
const {normalize:normalize15}=require('./a52-diagnostic15-scope.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-firebase-detail-scope.json'));if(sha(raw)!=='1fff835f9c4e6092b2fe9812dee40b7acb2b1d732fb573c9df91991ee63c2f27')throw Error('Firebase detail scope mismatch');const scope=JSON.parse(raw);
function normalize(file,input){input=normalize15(file,input);if(file!==scope.path||sha(input)!==scope.postimageSha256)return input;let text=input.toString();for(const e of [...scope.edits].reverse()){if(text.split(e.new).length!==2)throw Error('Firebase detail inverse count');text=text.replace(e.new,e.old);}if(sha(text)!==scope.sourceSha256)throw Error('Firebase detail predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(text):text;}module.exports={normalize,scope,sha};
