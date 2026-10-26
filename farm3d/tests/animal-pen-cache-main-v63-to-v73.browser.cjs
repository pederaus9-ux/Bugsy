// Real main v63 predecessor worker -> v73 cache update -> offline guest-farm reboot.
// Local isolated Chromium only; never an owner profile or production save.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,root}=require('./qualification-cdp.cjs');
const {readSource}=require('./qualification-source.cjs');
const oldRef='1115f93101a0e86fdcc9780e053c17b73dd6dac5';
const currentRef='51bcd0f9eb8a3bab26efe166121d7539e51ec1f4'; // Immutable historical candidate; not the current HEAD.
const out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts','animal-pen-cache-predecessor'));
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
 assert.equal(after.owned,true);assert.equal(after.horses,4);assert.equal(after.custom,before.custom);assert.equal(after.revision,before.revision);assert.deepEqual(after.polygon,before.custom?before.polygon:[[-23.5,-31.8],[-4.8,-31.8],[-4.8,-19.8],[-23.5,-19.8]],'custom pen exact, or exact owner-approved A2 square default');
}
(async()=>{try{
 h=await start(out,oldRef);await h.cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');`});
 stage='main predecessor saved ownership';await h.boot();
 const seeded=await h.cdp.evaluate(`(async()=>{const G=__dbg.G,t=Date.now();G.S.tut=99;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;G.S.pens.horse={owned:true,list:[0,0,0,0],meta:Array.from({length:4},(_,i)=>({name:'Horse '+i,love:50,loveAt:t}))};return G.save();})()`);
 assert.equal(seeded,true);await h.reload();const before=await snapshot();assert.equal(before.owned,true);assert.equal(before.horses,4);assert.equal(before.custom,false);assert.equal(before.revision,null);assert.deepEqual(before.polygon,[[-23.5,-31.8],[-4.8,-31.8],[-4.8,-26.5],[-23.5,-19.8]],'actual main-v63 slanted predecessor');
 const old=await h.cdp.evaluate(`(async()=>{await(await caches.open('foreign-farm-cache')).put('foreign-marker',new Response('preserve'));const r=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(ok=>navigator.serviceWorker.addEventListener('controllerchange',ok,{once:true}));return {keys:await caches.keys(),controlled:!!navigator.serviceWorker.controller,script:r.active?.scriptURL};})()`);
 assert(old.controlled);assert(old.keys.includes('sa3d-v63'));record(stage,{horses:before.horses,revision:before.revision,cache:old.keys});
 stage='distinct current worker activation';h.setRef(currentRef);
 await h.cdp.evaluate(`(async()=>{window.__penRegistration=await navigator.serviceWorker.getRegistration();window.__penOldWorker=window.__penRegistration.active;await window.__penRegistration.update();})()`);
 await h.cdp.until(`window.__penRegistration.active&&window.__penRegistration.active!==window.__penOldWorker&&window.__penRegistration.active.state==='activated'&&navigator.serviceWorker.controller===window.__penRegistration.active`);
 const cache=await h.cdp.evaluate(`(async()=>{const keys=await caches.keys(),c=await caches.open('sa3d-v73'),files=['animal-pen-validation.js?v=4','animal-pen-placement-worker.js?v=4','farm-land.js?v=5'],sha={};for(const file of files){const r=await c.match(new URL(file,location.href));if(!r){sha[file]=null;continue;}const d=await crypto.subtle.digest('SHA-256',await r.arrayBuffer());sha[file]=Array.from(new Uint8Array(d),n=>n.toString(16).padStart(2,'0')).join('');}return {keys,urls:(await c.keys()).map(r=>r.url),sha,foreign:await(await(await caches.open('foreign-farm-cache')).match('foreign-marker')).text(),controlled:!!navigator.serviceWorker.controller};})()`);
 assert(cache.keys.includes('sa3d-v73'));assert(!cache.keys.includes('sa3d-v63'));assert.equal(cache.foreign,'preserve');assert(cache.controlled);assert(!cache.urls.some(url=>url.endsWith('farm-land.js?v=3')));
 for(const module of ['animal-pen-validation','animal-pen-placement','animal-pen-placement-worker','animal-pen-placement-controller','animal-pen-editor-view'])assert(!cache.urls.some(url=>url.endsWith(module+'.js?v=3')),module+' stale v3 entry');
 for(const [url,file]of [['animal-pen-validation.js?v=4','animal-pen-validation.js'],['animal-pen-placement-worker.js?v=4','animal-pen-placement-worker.js'],['farm-land.js?v=5','farm-land.js']])assert.equal(cache.sha[url],digest(file),url+' exact cached bytes');
 record(stage,{keys:cache.keys,sha:cache.sha,foreign:cache.foreign});
 stage='online main-save upgrade preserves every farm field';let startAt=await h.cdp.evaluate('Date.now()');await h.reload();let after=await snapshot(),endAt=await h.cdp.evaluate('Date.now()'),day=await h.cdp.evaluate(`new Date().toLocaleDateString('en-CA')`);sameFarm(before,after,{start:startAt,end:endAt,day});record(stage,{horses:after.horses,revision:after.revision});
 stage='upgraded editor applies outer-map pen';
 const applied=await h.cdp.evaluate(`(async()=>{const d=__dbg,G=d.G,e=d.penEditor;G.close();if(!e.begin('horse'))throw Error('Editor refused');const L=await import('./animal-pen-layout.js?v=1'),site=e.snapshot().draft.sites.horse??L.defaultSiteRecord('horse');for(const id of ['v0','v3']){const v=site.boundary.find(v=>v.id===id);if(!e.dispatch({type:'moveVertex',kind:'horse',id,to:[-37,v.z]}))throw Error('Vertex refused');}if(!await e.validateNow())throw Error('Invalid edit: '+e.snapshot().reason);if(!await e.apply())throw Error('Apply refused');return {revision:G.S.layout.animalPens.revision,v:G.S.v};})()`);
 assert.equal(applied.revision,1);assert.equal(applied.v,4);after=await snapshot();assert.equal(after.custom,true);assert.equal(after.horses,4);assert.deepEqual(JSON.parse(after.raw).layout.animalPens.sites.horse.boundary.filter(v=>['v0','v3'].includes(v.id)).map(v=>v.x),[-37,-37]);record(stage,applied);
 stage='offline reload preserves custom pen';const served=h.requests.length;h.setOffline(true);await h.cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});startAt=await h.cdp.evaluate('Date.now()');await h.reload();const offline=await snapshot();endAt=await h.cdp.evaluate('Date.now()');sameFarm(after,offline,{start:startAt,end:endAt,day});assert.equal(h.requests.length,served,'zero server responses during offline reload');assert.equal(await h.cdp.evaluate('!!navigator.serviceWorker.controller'),true);assert.deepEqual(h.errors,[]);record(stage,{horses:offline.horses,serverResponses:0,errors:0});
 report.status='PASS';await h.cdp.screenshot(path.join(out,'updated-offline.png'));
}catch(error){report.status='FAIL';report.stage=stage;report.error=String(error.stack||error);process.exitCode=1;console.error(report.error);if(h)try{await h.cdp.screenshot(path.join(out,'first-failure.png'));}catch{}}
finally{if(h)await h.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,stage,steps:report.steps.map(s=>s.name)}));}})();
