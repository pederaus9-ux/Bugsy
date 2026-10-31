// Independent installed field v76 -> forward rollback v77 -> offline reboot. Historical field assertions remain separate.
// Local isolated Chromium only; never an owner profile or production save.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,root}=require('./qualification-cdp.cjs');
const {readSource}=require('./qualification-source.cjs');
const oldRef='0d0542bf93e4e010b5543e81a40fae4bca2dd5f9';
const currentRef=execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim();
const out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','field-rollback-cache'));
const report={status:'RUNNING',oldRef,currentRef,steps:[]};let h,stage='launch';
const record=(name,value)=>{report.steps.push({name,value});fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log('PASS '+name);};
const digest=file=>crypto.createHash('sha256').update(readSource(currentRef,'farm3d/'+file)).digest('hex');
const snapshot=()=>h.cdp.evaluate(`(()=>{const d=__dbg,S=d.G.S;return {raw:localStorage.getItem(d.G.SAVE_KEY),horses:d.animals.filter(a=>a.kind==='horse'&&!a.gone).length,owned:!!S.pens.horse?.owned,custom:!!d.remainingLayouts.horse.custom,revision:S.layout?.animalPens?.revision??null,polygon:d.PEN_LIST.find(p=>p.care==='horse')?.poly};})()`);
function sameFarm(before,after,window){
 const a=JSON.parse(before.raw),b=JSON.parse(after.raw),prior=a.lastSeen;
 assert(Number.isSafeInteger(b.lastSeen)&&b.lastSeen>=prior&&b.lastSeen>=window.start&&b.lastSeen<=window.end,'lastSeen advances inside reload window');
 if(b.lastNag!==a.lastNag)assert.equal(b.lastNag,window.day,'backup reminder may only initialize to the current day');
 for(const s of [a,b]){delete s.lastSeen;delete s.lastNag;}
 assert.deepEqual(b,a,'all other saved fields remain exact');
 assert.equal(after.owned,true);assert.equal(after.horses,4);assert.equal(after.custom,true);assert.equal(after.revision,1);assert.deepEqual(after.polygon,before.polygon);
}
(async()=>{try{
 h=await start(out,oldRef);await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');`});
 stage='predecessor saved custom pen';await h.boot();
 const seeded=await h.cdp.evaluate(`(async()=>{const G=__dbg.G,L=await import('./animal-pen-layout.js?v=1'),t=Date.now();G.S.tut=99;const plot=structuredClone(G.S.plots[0]);Object.assign(plot,{crop:null,end:0,water:0,fert:0});G.S.plots=Array.from({length:30},()=>structuredClone(plot));G.S.plots[25].crop='wheat';G.S.plots[25].end=t+3600000;G.S.barn.wheat=9;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Horse '+i,love:50,loveAt:t}))};const horse=L.defaultSiteRecord('horse');horse.boundary.forEach(v=>v.z+=1);for(const id of Object.keys(horse.structures))horse.structures[id]=[horse.structures[id][0],horse.structures[id][1]+1];G.S.layout.animalPens={v:1,revision:1,sites:{horse}};return G.save();})()`);
 assert.equal(seeded,true);await h.reload();const before=await snapshot();assert.equal(before.owned,true);assert.equal(before.horses,4);assert.equal(before.custom,true);assert.equal(before.revision,1);
 const old=await h.cdp.evaluate(`(async()=>{await(await caches.open('foreign-farm-cache')).put('foreign-marker',new Response('preserve'));const r=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(ok=>navigator.serviceWorker.addEventListener('controllerchange',ok,{once:true}));return {keys:await caches.keys(),controlled:!!navigator.serviceWorker.controller,script:r.active?.scriptURL};})()`);
 assert(old.controlled);assert(old.keys.includes('sa3d-v76'));record(stage,{horses:before.horses,revision:before.revision,cache:old.keys});
 stage='distinct current worker activation';h.setRef(currentRef);
 await h.cdp.evaluate(`(async()=>{window.__penRegistration=await navigator.serviceWorker.getRegistration();window.__penOldWorker=window.__penRegistration.active;await window.__penRegistration.update();})()`);
 await h.cdp.until(`window.__penRegistration.active&&window.__penRegistration.active!==window.__penOldWorker&&window.__penRegistration.active.state==='activated'&&navigator.serviceWorker.controller===window.__penRegistration.active`);
 const cache=await h.cdp.evaluate(`(async()=>{const keys=await caches.keys(),c=await caches.open('sa3d-v80'),files=['game.js?v=34','auth.js?v=21','restore-recovery.js?v=1','index.html'],sha={};for(const file of files){const r=await c.match(new URL(file,location.href));if(!r){sha[file]=null;continue;}const d=await crypto.subtle.digest('SHA-256',await r.arrayBuffer());sha[file]=Array.from(new Uint8Array(d),n=>n.toString(16).padStart(2,'0')).join('');}return {keys,urls:(await c.keys()).map(r=>r.url),sha,foreign:await(await(await caches.open('foreign-farm-cache')).match('foreign-marker')).text(),controlled:!!navigator.serviceWorker.controller};})()`);
 assert(!cache.urls.some(url=>url.endsWith('plot-support.js?v=1')),'obsolete helper is not precached by the restored startup');assert.equal(digest('plot-support.js'),'8a7790c4323adb2baa0bc6fbea91919e1e8c68c0643f05ad7c6b8ddb8d2e53d6','compatibility file remains exact and available in the package');assert(cache.keys.includes('sa3d-v80'));assert(!cache.keys.includes('sa3d-v76'));assert(!cache.keys.includes('sa3d-v75'));assert.equal(cache.foreign,'preserve');assert(cache.controlled);assert(!cache.urls.some(url=>url.endsWith('farm-land.js?v=3')));
 for(const module of ['animal-pen-validation','animal-pen-placement','animal-pen-placement-worker','animal-pen-placement-controller','animal-pen-editor-view'])assert(!cache.urls.some(url=>url.endsWith(module+'.js?v=3')),module+' stale v3 entry');
 for(const [url,file]of [['game.js?v=34','game.js'],['auth.js?v=21','auth.js'],['restore-recovery.js?v=1','restore-recovery.js'],['index.html','index.html']])assert.equal(cache.sha[url],digest(file),url+' exact cached bytes');
 assert(!cache.urls.some(url=>url.endsWith('game.js?v=33')||url.endsWith('auth.js?v=19')),'old game/auth cache entries removed');
 record(stage,{keys:cache.keys,sha:cache.sha,foreign:cache.foreign});
 stage='online reload preserves custom pen';let startAt=await h.cdp.evaluate('Date.now()');await h.reload();let after=await snapshot(),endAt=await h.cdp.evaluate('Date.now()'),day=await h.cdp.evaluate(`new Date().toLocaleDateString('en-CA')`);sameFarm(before,after,{start:startAt,end:endAt,day});record(stage,{horses:after.horses,revision:after.revision});
 const field=await h.cdp.evaluate(`(()=>{const d=__dbg;return {count:d.plots.length,crop:d.G.S.plots[25].crop,wheat:d.G.have('wheat'),roots:d.plots.map(p=>p.g.position.y)};})()`);assert.equal(field.count,30);assert.equal(field.crop,'wheat');assert.equal(field.wheat,9);for(const y of field.roots)assert.equal(y,0,'exact restored baseline plot root after rollback');record('all30 restored baseline roots and exact saved crop',{count:field.count,crop:field.crop,wheat:field.wheat,roots:field.roots});
 stage='offline reload preserves custom pen';const served=h.requests.length;h.setOffline(true);await h.cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});startAt=await h.cdp.evaluate('Date.now()');await h.reload();const offline=await snapshot();endAt=await h.cdp.evaluate('Date.now()');sameFarm(after,offline,{start:startAt,end:endAt,day});assert.equal(h.requests.length,served,'zero server responses during offline reload');assert.equal(await h.cdp.evaluate('!!navigator.serviceWorker.controller'),true);assert.deepEqual(h.errors,[]);record(stage,{horses:offline.horses,serverResponses:0,errors:0});
 report.status='PASS';await h.cdp.screenshot(path.join(out,'updated-offline.png'));
}catch(error){report.status='FAIL';report.stage=stage;report.error=String(error.stack||error);process.exitCode=1;console.error(report.error);if(h)try{await h.cdp.screenshot(path.join(out,'first-failure.png'));}catch{}}
finally{if(h)await h.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,stage,steps:report.steps.map(s=>s.name)}));}})();
