'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=()=>fs.readFileSync(path.join(__dirname,'a52-installed-ui-cache.browser.cjs'),'utf8');
const raw=fs.readFileSync(path.join(__dirname,'fixtures/a52-installed-probe-scope.json'));
const scope=JSON.parse(raw);
test('exact bounded diagnostic-only delta preserves predecessor and deadline assertions',()=>{
 assert.equal(sha(raw),'97020baeee34b12c19bf8debfe0f0ab575e839fd631583fdbffec6df0b776099');const e=scope.files['farm3d/tests/a52-installed-ui-cache.browser.cjs'],s=read();assert.equal(sha(s),e.afterSha256);assert.equal(sha(e.before),e.beforeSha256);new vm.Script(s);
 assert.equal(s.slice(0,s.indexOf('// Finite diagnostics only;')),e.before.slice(0,e.before.indexOf('async function menus(p){')));
 assert(s.includes("assert.deepEqual(afterOffline,before)"));assert(s.includes('assert.deepEqual(offlineHashes,expected)'));assert(s.includes("assert.equal(h.serverResponseCount(),served,'Zero server responses during offline reload')"));assert(s.includes('assert.equal(nonWorkerResponses,0)'));assert(s.includes('assert.deepEqual(session.errors,[])'));
 assert.deepEqual(s.match(/timeout:\d+/g),e.before.match(/timeout:\d+/g));assert(!s.includes('result.error='));
});
function fn(name){const m=read().match(new RegExp('function '+name+'\\([^]*?\\n}'));assert(m);return vm.runInNewContext('('+m[0]+')',{require});}
test('farm differences publish fixed field IDs only, never values or unknown keys',()=>{
 const f=fn('farmDifferenceFields'),secret='PRIVATE_CANARY';assert.equal(JSON.stringify(f({coins:1},{coins:2,unknown:secret})),JSON.stringify(['coins']));assert.equal(JSON.stringify(f({barn:{a:secret}},{barn:{a:'changed'}})),JSON.stringify(['barn']));assert.equal(JSON.stringify(f({unknown:secret},{})),'[]');
});
test('error classification exposes only numeric category counts',()=>{
 const counts=fn('errorCategoryCounts')(['pageerror: PRIVATE','console: PRIVATE','HTTP PRIVATE','request: PRIVATE','PRIVATE',null]);assert.equal(JSON.stringify(counts),JSON.stringify({page:1,console:1,http:1,request:1,other:2}));
});
