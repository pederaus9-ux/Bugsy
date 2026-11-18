'use strict';
const {normalize:normalizeCurrentCache}=require('./a53-current-cache-scope.cjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-cache-progress-scope.json'));
if(sha(raw)!=='114f297a059d1573ede61340fd20da976c2fc7f7745f7f9672a4ed5f7d9169ae')throw Error('Cache progress scope mismatch');
const scope=JSON.parse(raw);
function normalize(file,input){input=normalizeCurrentCache(file,input);const record=scope.files.find(x=>x.file===file);if(!record||sha(input)!==record.afterSha256)return input;let text=input.toString();for(const edit of [...record.edits].reverse()){if(text.split(edit.after).length!==2)throw Error('Nonunique inverse');text=text.replace(edit.after,edit.before);}if(text.split('sa3d-v93').length-1!==record.currentCacheReplacements)throw Error('Cache inverse mismatch');text=text.replaceAll('sa3d-v93','sa3d-v85');if(sha(text)!==record.beforeSha256)throw Error('Baseline mismatch');return Buffer.isBuffer(input)?Buffer.from(text):text;}
module.exports={scope,sha,normalize};
