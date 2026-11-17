'use strict';
const {normalize:normalize15}=require('./a52-diagnostic15-scope.cjs');

const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-pen-report-scope.json'));
if(sha(raw)!=='3a04c3efad24a3b9d03300fec1d513150b8f77d265a706f04f5c0e3f40e1e1d7')throw Error('Pen diagnostic scope mismatch');const scope=JSON.parse(raw);
function normalize(file,input){input=normalize15(file,input);if(file!==scope.path||sha(input)!==scope.postimageSha256)return input;let text=input.toString();if(text.split(scope.new).length!==2)throw Error('Pen inverse count');text=text.replace(scope.new,scope.old);if(sha(text)!==scope.sourceSha256)throw Error('Pen predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(text):text;}module.exports={normalize,scope,sha};
