'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),receipt=require('./fixtures/a54-daytime-social-scope.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const parent='9e6f2763dd7781b761ccaef2f2cfa680d57b4783';
for(const f of ['farm3d/index.html','farm3d/sw.js'])test('A54 only the approved replacement exists: '+f,()=>{
 const r=receipt.files[f], old=cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',parent+':'+f],{cwd:root,maxBuffer:2e6}), cur=fs.readFileSync(path.join(root,f));
 assert.equal(hash(old),r.beforeSha256);assert.equal(hash(cur),r.afterSha256);
 const replaceOnce=(src,a,b)=>{const text=src.toString('utf8');assert.equal(text.split(a).length,2);return Buffer.from(text.replace(a,()=>b))};
 assert.deepEqual(replaceOnce(old,r.before,r.after),cur);
 assert.deepEqual(replaceOnce(cur,r.after,r.before),old);
 if(f.endsWith('sw.js')){assert.equal(r.before,'const CACHE = "sa3d-v94";');assert.equal(r.after,'const CACHE = "sa3d-v95";');}
});
