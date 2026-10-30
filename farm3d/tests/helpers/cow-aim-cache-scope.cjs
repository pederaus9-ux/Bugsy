'use strict';
// A39 (owner-approved 2026-10-30): the first-person cow aim pick fix changes cow3d.js/quadruped3d.js
// bytes, so the service worker cache moves sa3d-v77 -> sa3d-v78. That single line is the only change
// to sw.js; reverse it so earlier field/rollback receipts still check their exact accepted bytes.
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const AFTER='const CACHE = "sa3d-v78";',BEFORE='const CACHE = "sa3d-v77";';
const PRIOR_SW_SHA256='2244b6dee9b350c9968a14cb4703ebafe4451859395678ce648e04ca471af529';
function normalizeCowAimCacheScope(file,source){
 if(file!=='sw.js'||!source.includes(AFTER))return source;
 assert.equal(source.split(AFTER).length,2,'Unique A39 cache hunk');
 const prior=source.replace(AFTER,BEFORE);
 assert.equal(sha(prior),PRIOR_SW_SHA256,'A39 changes only the cache name');
 return prior;
}
module.exports={normalizeCowAimCacheScope,PRIOR_SW_SHA256};
