'use strict';
const {normalizeA52OfflineObservation}=require('./helpers/a52-offline-observation.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {countResponseClass,normalizeA52ResponseProbe,scope,sha}=require('./helpers/a52-installed-response-probe.cjs');
const file='farm3d/tests/a52-installed-ui-cache.browser.cjs',read=()=>normalizeA52OfflineObservation(file,fs.readFileSync(path.resolve(__dirname,'../..',file),'utf8'));
test('exact response-only delta preserves snapshot2 offline assertions and waits',()=>{
 assert.deepEqual(Object.keys(scope.files),[file]);const e=scope.files[file],s=read();assert.equal(sha(s),e.afterSha256);assert.equal(e.beforeSha256,'94b55d6e417df3cb7a5761d9f5661c54892f227d2e8009640e057d3ea0c54368');assert.equal(sha(normalizeA52ResponseProbe(file,s)),e.beforeSha256);
 assert.deepEqual(s.match(/assert\.[^;]+;/g),e.before.match(/assert\.[^;]+;/g));assert.deepEqual(s.match(/timeout:\d+/g),e.before.match(/timeout:\d+/g));assert.equal(normalizeA52ResponseProbe(file,s+'\n'),s+'\n');
});
test('fixed classes distinguish external scripts/local HTTP/data/blob without retaining URLs',()=>{
 const rows=[],base='http://127.0.0.1:1234/',secret='PRIVATE_CANARY';
 for(let i=0;i<3;i++)countResponseClass(rows,'https://example.invalid/'+secret,'script',base);
 countResponseClass(rows,base+secret,'document',base);countResponseClass(rows,'data:text/plain,'+secret,'image',base);countResponseClass(rows,'blob:'+base+secret,'fetch',base);countResponseClass(rows,'not a URL '+secret,secret,base);
 assert.deepEqual(rows,[{protocol:'https',scope:'external',resourceType:'script',count:3},{protocol:'http',scope:'local',resourceType:'document',count:1},{protocol:'data',scope:'non-network',resourceType:'image',count:1},{protocol:'blob',scope:'non-network',resourceType:'fetch',count:1},{protocol:'other',scope:'unknown',resourceType:'other',count:1}]);assert(!JSON.stringify(rows).includes(secret));
});
