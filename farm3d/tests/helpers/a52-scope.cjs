'use strict';
// A52 outer accounting layer. Credentials in prior source exist only in pinned Git/in memory.
// Unrecognized bytes are never normalized. Current-output checks still use actual bytes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {normalizeA52CornerFocus}=require('./a52-corner-focus-scope.cjs');
const root=path.resolve(__dirname,'../../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(__dirname,'../fixtures/a52-corner-ui-scope.json'));
assert.equal(sha(raw),'56a195d42b3878cf319f5889c487b69874b020d9e02348d5da5a76292d225ac7','Exact A52 scope receipt');
const scope=JSON.parse(raw),cache=new Map();
const full=file=>file.startsWith('farm3d/')||file==='_config.yml'?file:'farm3d/'+file;
function pinned(file){
 assert(scope.files[file]?.hunks,'Only explicitly pinned A52 predecessor files');
 if(cache.has(file))return cache.get(file);
 let bytes;try{bytes=execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',scope.baseCommit+':'+file],{cwd:root,stdio:['ignore','pipe','pipe'],timeout:10000,maxBuffer:2*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'}});}catch{throw Error('A52 immutable source unavailable locally; no network fallback');}
 assert.equal(sha(bytes),scope.files[file].beforeSha256,'Exact A52 predecessor hash');cache.set(file,bytes);return bytes;
}
function before(h){
 let text=h.before;
 if(h.beforeFromGit){const p=h.beforeFromGit;text=pinned('farm3d/'+p.file).toString().slice(p.start,p.end);}
 if(h.beforeAssignmentFromGit){const p=h.beforeAssignmentFromGit,found=[...pinned('farm3d/'+p.file).toString().matchAll(/window\.__ERR_HOOK\s*=\s*"(?:[^"\\]|\\.)*"\s*;/g)];assert.equal(found.length,1,'One pinned historical assignment');text=p.prefix+found[0][0]+p.suffix;}
 assert.equal(typeof text,'string','Known exact source hunk');
 if(h.beforeSha256)assert.equal(sha(text),h.beforeSha256,'Exact historical hunk hash');
 return text;
}
function replay(file,bytes){
 let text=bytes.toString();for(const h of scope.files[file].hunks){const old=before(h);assert.equal(text.split(old).length,2,'Unique exact A52 hunk');text=text.replace(old,()=>h.after);}
 assert.equal(sha(text),scope.files[file].afterSha256,'Exact A52 postimage');return Buffer.from(text);
}
function normalizeA52Source(file,source){
 file=full(file);const entry=scope.files[file];if(!entry?.hunks||sha(source)!==entry.afterSha256)return source;
 const old=pinned(file);assert.equal(sha(replay(file,old)),sha(source),'Exact current A52 bytes');
 return Buffer.isBuffer(source)?Buffer.from(old):old.toString();
}
function applyA52Source(file,source){
 file=full(file);const entry=scope.files[file];if(!entry?.hunks||sha(source)!==entry.beforeSha256)return source;
 const result=replay(file,source);return Buffer.isBuffer(source)?result:result.toString();
}
function verifyA52Asset(file,source){file=full(file);assert(Object.hasOwn(scope.assets,file),'Known A52 asset');assert.equal(sha(normalizeA52CornerFocus(file,source)),scope.assets[file],'Exact A52 asset');}
module.exports={scope,sha,normalizeA52Source,applyA52Source,verifyA52Asset};
