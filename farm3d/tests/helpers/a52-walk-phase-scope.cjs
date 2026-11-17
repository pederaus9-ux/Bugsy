'use strict';
const {normalize:normalize15}=require('./a52-diagnostic15-scope.cjs');

const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-walk-phase-scope.json'));
if(sha(raw)!=='36881a347bdaa94a3f298032fe695b73a74dee7a49a05ffd52b3d71bcef17cdd')throw Error('Walk phase scope mismatch');
const scope=JSON.parse(raw);
function normalize(file,input){input=normalize15(file,input);if(file!=='farm3d/tests/farmer3d-walk.browser.cjs'||sha(input)!==scope.postimageSha256)return input;let text=input.toString();for(const e of [...scope.edits].reverse()){if(text.split(e.new).length!==2)throw Error('Walk inverse mismatch');text=text.replace(e.new,e.old);}if(sha(text)!==scope.sourceSha256)throw Error('Walk predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(text):text;}
module.exports={normalize,scope,sha};
