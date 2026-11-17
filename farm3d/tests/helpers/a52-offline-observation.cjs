'use strict';
// Passive finite response attribution. Never retain URLs, bodies or request objects.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-offline-observation-scope.json'));
if(sha(raw)!=='3a5d4071cf9ce8d47cd86a3acce5e56d1f19b001f3a004b39f6d7390378047ac')throw Error('Offline observation scope mismatch');
const scope=JSON.parse(raw);
function normalizeA52OfflineObservation(file,input){const e=scope.files[file];if(!e||sha(input)!==e.afterSha256)return input;if(sha(e.before)!==e.beforeSha256)throw Error('Offline observation predecessor mismatch');return Buffer.isBuffer(input)?Buffer.from(e.before):e.before;}
function createOfflineObservation(){
 let observing=false;const rows=[],externalFulfillCalls={firebaseSdk:0,other:0};
 function localRequest(req,res){
  const beganBeforeOffline=!observing;let category='other';
  try{const pathname=new URL(req.url,'http://localhost').pathname;category=pathname==='/farm3d/sw.js'?'worker-script':pathname.startsWith('/farm3d/')?'app-asset':'other';}catch{}
  res.once('finish',()=>{if(!observing)return;const row=rows.find(r=>r.category===category&&r.beganBeforeOffline===beganBeforeOffline);if(row)row.count++;else rows.push({category,beganBeforeOffline,count:1});});
 }
 return {localRequest,begin(){observing=true;},externalFulfill(sdk){if(observing)externalFulfillCalls[sdk?'firebaseSdk':'other']++;},snapshot(){return {localResponses:rows.map(r=>({...r})),externalFulfillCalls:{...externalFulfillCalls}};}};
}
module.exports={createOfflineObservation,normalizeA52OfflineObservation,scope,sha};
