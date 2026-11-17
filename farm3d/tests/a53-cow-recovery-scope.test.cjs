'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const h=require('./helpers/a53-cow-recovery-scope.cjs'),root=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.join(root,f));
for(const file of Object.keys(h.scope.files))test('exact release inverse and corruption rejection '+file,()=>{
 const current=read(file),entry=h.scope.files[file];assert.equal(h.sha(current),entry.afterSha256);
 const previous=h.normalizeA53CowRecovery(file,current);assert.equal(h.sha(previous),entry.beforeSha256);
 assert.equal(h.normalizeA53CowRecovery(file,current.toString()),previous.toString());
 let replay=previous.toString();for(const x of entry.hunks){assert.equal(replay.split(x.before).length,2);replay=replay.replace(x.before,()=>x.after);}assert.equal(replay,current.toString());
 const active=entry.hunks.at(-1),mutated=Buffer.from(current.toString().replace(active.after,()=>active.before));assert.notEqual(mutated.toString(),current.toString(),'Negative mutation must change current bytes');
 for(const bytes of [previous,Buffer.concat([current,Buffer.from('\n/* unrelated */')]),mutated])assert.throws(()=>h.normalizeA53CowRecovery(file,bytes));
});
test('non-target UI save auth and helper bytes remain untouched by outer inverse',()=>{for(const f of ['farm3d/game.js','farm3d/auth.js','farm3d/a52-ui.js']){const b=Buffer.from('synthetic unchanged bytes');assert.equal(h.normalizeA53CowRecovery(f,b),b);}});
test('cache delta only exact v93 to v94 with no shell or lifecycle change',()=>{const b=read('farm3d/sw.js'),old=h.normalizeA53CowRecovery('sw.js',b);assert.equal(b.toString().replace('const CACHE = "sa3d-v94";','const CACHE = "sa3d-v93";'),old.toString());for(const v of ['v92','v93','v95'])assert.throws(()=>h.normalizeA53CowRecovery('sw.js',Buffer.from(b.toString().replace('sa3d-v94','sa3d-'+v))));});
test('real package verifier checks actual release output not reconstructed predecessor',()=>{
 const text=read('farm3d/tests/pages-package.verify.cjs').toString();
 const c={assert,Buffer,LIMIT:1_000_000_000,sha:h.sha,path,EVIDENCE:'farm3d/tests/evidence/',CACHE_SNAPSHOTS:'farm3d/tests/fixtures/cache-source-snapshots/'};vm.createContext(c);vm.runInContext(text.slice(text.indexOf('function localPath('),text.indexOf('function negativeControls()'))+';globalThis.api={dependencies,localPath,verifyPackage};',c);
 const source=new Map(Object.keys(h.scope.files).map(f=>[f,read(f)])),output=new Map(source);
 for(const [f,b]of source){for(const dep of c.api.dependencies(f,b))if(!output.has(dep))output.set(dep,Buffer.from('synthetic dependency'));if(f.endsWith('/sw.js'))for(const spec of JSON.parse(b.toString().match(/const SHELL\s*=\s*(\[[^;]+\]);/)[1])){const dep=c.api.localPath(f,spec);if(!output.has(dep))output.set(dep,Buffer.from('synthetic cached dependency'));}}
 c.api.verifyPackage(source,output,1234);
 for(const file of source.keys()){const bad=new Map(output);bad.set(file,h.normalizeA53CowRecovery(file,source.get(file)));assert.throws(()=>c.api.verifyPackage(source,bad,1234),/Changed runtime asset/);}
 assert.match(text,/source=new Map\(\[\.\.\.source\]/);assert.match(text,/ui\.verifyA52Asset\(file,source\.get\(file\)\)/);assert.match(text,/Exact current A52 runtime/);
});
test('production does not include qualification receipt APIs',()=>{const s=read('farm3d/index.html').toString();for(const name of ['__cowCareGuardCost','__cowRecoveryReceipt','__cowSocialReceipt'])assert(!s.includes(name));});
test('shared historical entry applies exact A53 inverse before predecessor accounting and preserves old fixtures',()=>{
 const text=read('farm3d/tests/helpers/pen-scope-history.mjs').toString();
 const start=text.indexOf('export function normalizePenScope('),end=text.indexOf("  assert(['A25', 'A26']",start);
 assert(start>=0&&end>start);const prefix=text.slice(start,end).replace('export function','function')+'return source;}';
 const before=h.normalizeA53CowRecovery('index.html',read('farm3d/index.html')).toString(),seen=[];
 const c={cowRecovery:h,sha:h.sha,normalizeReleaseBlockerScope(file,s){assert.equal(file,'index.html');assert.equal(h.sha(s),h.scope.files['farm3d/index.html'].beforeSha256);seen.push(s);return s;}};
 vm.createContext(c);vm.runInContext(prefix+';globalThis.call=normalizePenScope;',c);
 assert.equal(c.call('A26',read('farm3d/index.html').toString()),before);assert.equal(c.call('A26',before),before);
 assert.throws(()=>c.call('A26',read('farm3d/index.html').toString()+'<!-- drift -->'));
 assert.equal(seen.length,2);
});
