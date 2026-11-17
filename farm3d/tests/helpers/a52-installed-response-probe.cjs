'use strict';
// Test-only finite classification. Raw URL/type are not retained or returned.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-installed-response-scope.json'));
if(sha(raw)!=='749b4acbe97eb1583fb4cf00ef15f668406ab1cc764721765ab23177b020b3cf')throw Error('Response probe scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52ResponseProbe(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Response probe predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
function countResponseClass(rows,url,type,base){
 let protocol='other',scope='unknown';
 try{const u=new URL(url);protocol=({'http:':'http','https:':'https','data:':'data','blob:':'blob'})[u.protocol]||'other';scope=['http','https'].includes(protocol)?(u.origin===new URL(base).origin?'local':'external'):['data','blob'].includes(protocol)?'non-network':'unknown';}catch{}
 const resourceType=['document','stylesheet','image','media','font','script','texttrack','xhr','fetch','eventsource','websocket','manifest','other'].includes(type)?type:'other';
 const previous=rows.find(r=>r.protocol===protocol&&r.scope===scope&&r.resourceType===resourceType);
 if(previous)previous.count++;else rows.push({protocol,scope,resourceType,count:1});
}
module.exports={countResponseClass,normalizeA52ResponseProbe,scope,sha};
