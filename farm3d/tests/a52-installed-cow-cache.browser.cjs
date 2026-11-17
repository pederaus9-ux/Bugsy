'use strict';
// PREPARED, NOT EXECUTED. This opt-in is an accident guard, NOT permission.
// Requires separately approved hosted execution and isolation qualification.
// v93 -> v94 only; new test, historical UI journey remains unchanged.
// Fresh synthetic guest only. Not personal-save, account, installed-PWA/phone,
// rollback, interrupted update, multi-tab, all-field/time advancement or Jekyll proof.
if(process.env.A52_COW_RELEASE_BROWSER_APPROVED!=='1')throw Error('A52 cow release journey not approved for execution');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const {updateWorker}=require('./worker-transition.cjs');
const {countResponseClass}=require('./helpers/a52-installed-response-probe.cjs');
const {revealCornerAction}=require('./helpers/a52-browser-navigation.cjs');
const BASE='40a8fb8797989b2b45393d70368a00a01af9a289';
const files=['index.html','sunny-ui.css?v=1','compact-ui.css?v=1','corner-menu.js?v=1','game.js?v=36'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Deliberately bounded representative fields, not a claim of full raw-save equality.
// Excludes evolving timestamps, care simulation, offers and randomized daily state.
function representative(S){
 return {v:S.v,coins:S.coins,gems:S.gems,xp:S.xp,level:S.level,barn:S.barn,barnCap:S.barnCap,barnUps:S.barnUps,decor:S.decor,gold:S.gold,plots:S.plots.map(p=>({crop:p.crop})),cowIds:(S.pens.cow?.care?.cows||[]).map(c=>c.id),pets:S.pets,pens:Object.fromEntries(Object.entries(S.pens).map(([k,p])=>[k,{owned:p.owned,count:p.list.length,names:(p.meta||[]).map(m=>m.name)}])),layout:S.layout,buildings:Object.fromEntries(Object.entries(S.buildings).map(([k,b])=>[k,{owned:b.owned,jobs:b.jobs}]))};
}
const ready=p=>p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
async function farm(p){
 // Save the normalized in-memory farm using the original writer. Never log raw data.
 const S=await p.evaluate(()=>{const G=__dbg.G;if(!G.save())throw Error('Synthetic save failed');return JSON.parse(localStorage.getItem(G.SAVE_KEY));});
 return representative(S);
}
async function cacheHashes(p){
 return p.evaluate(async files=>{const c=await caches.open('sa3d-v94'),hashes={};for(const file of files){const r=await c.match(new URL(file,location.href));if(!r)throw Error('Required cache entry missing');hashes[file]=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');}return hashes;},files);
}
// Finite diagnostics only; never serialize field values, error text or request URLs.
function farmDifferenceFields(before,after){
 const fields=['v','coins','gems','xp','level','barn','barnCap','barnUps','decor','gold','plots','cowIds','pets','pens','layout','buildings'];
 return fields.filter(k=>!require('node:util').isDeepStrictEqual(before[k],after[k]));
}
function errorCategoryCounts(errors){
 const counts={page:0,console:0,http:0,request:0,other:0};
 for(const error of errors){const key=typeof error==='string'?(error.startsWith('pageerror: ')?'page':error.startsWith('console: ')?'console':error.startsWith('HTTP ')?'http':error.startsWith('request: ')?'request':'other'):'other';counts[key]++;}
 return counts;
}
async function menus(p){
 assert.equal(await p.locator('.preview-menu[open]').count(),0);
 for(const selector of ['#walkBtn','[data-p="barn"]']){
  await revealCornerAction(p,selector,'keyboard');
  assert.equal(await p.locator('dialog[open]').count(),1);
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>!document.querySelector('dialog[open]'));
 }
}
let h,stage='source',failed=true;
const out=path.join(artifacts,'a52-installed-cow-cache');
const result={status:'RUNNING',base:BASE,physicalPhone:false,stages:[],hashes:{}};
const record=()=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));};
(async()=>{try{
 const baselineGame=execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',BASE+':farm3d/game.js'],{cwd:root,maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1'}});
 const baselineWorker=execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',BASE+':farm3d/sw.js'],{cwd:root,maxBuffer:1024*1024,stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1'}}).toString();
 assert.equal(baselineWorker.split('sa3d-v93').length,2);
 assert.equal(fs.readFileSync(path.join(root,'farm3d/sw.js'),'utf8'),baselineWorker.replace('sa3d-v93','sa3d-v94'),'Only cache version changes');
 assert.equal(sha(fs.readFileSync(path.join(root,'farm3d/index.html'))),'95f54aaea8b9720225a444451d2262d7ab9540e8ad91de5490879c455017c9df','Exact uninstrumented qualified candidate');
 assert(baselineGame.equals(fs.readFileSync(path.join(root,'farm3d/game.js'))),'Original game module remains byte-exact');
 const expected=Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(path.join(root,'farm3d',f.split('?')[0])))]));
 stage='predecessor';record();h=await start({ref:BASE,serviceWorkers:'allow',deviceScaleFactor:1});
 // A literal server-side counter is required; do not silently substitute page events.
 assert.equal(typeof h.serverResponseCount,'function','Guarded harness server response counter required');
 const session=await h.setup({width:390,height:844},true,'a52-installed-cow-cache',true),p=session.page;
 const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/3d-v3-cow-robot.json'),'utf8')).save;
 await p.addInitScript(fixture=>{
  if(sessionStorage.getItem('__a52CowReleaseSeeded'))return;
  if(localStorage.length)throw Error('Expected fresh synthetic origin');
  sessionStorage.setItem('__a52CowReleaseSeeded','1');
  fixture.lastSeen=Date.now();fixture.tut=99;fixture.event=null;fixture.nextEventAt=fixture.nextRushAt=fixture.nextVisitorAt=9e15;
  localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(fixture));localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');
 },fixture);
 await p.goto(h.base+'farm3d/?debug&portrait&preset=noon');await ready(p);
 const before=await farm(p);assert.equal(before.coins,345);assert.equal(before.barn.wheat,3);assert.equal(before.pens.chicken.count,30);
 await p.evaluate(async()=>{window.__a52CowReleaseRegistration=await navigator.serviceWorker.register('./sw.js');});
 await p.waitForFunction(()=>{const r=window.__a52CowReleaseRegistration;return r?.active?.state==='activated'&&!r.installing&&!r.waiting&&navigator.serviceWorker.controller===r.active;},null,{timeout:90000});
 assert.equal(await p.evaluate(()=>caches.has('sa3d-v93')),true);
 await p.evaluate(async()=>{await(await caches.open('foreign-a52-marker')).put('foreign-marker',new Response('preserve'));});
 result.stages.push(stage);record();
 stage='update';h.serveRef(null);const transition=await updateWorker(p);assert(transition.requestedWorkerControls);assert(transition.predecessorReplaced);assert.equal(transition.state,'activated');
 const cacheState=await p.evaluate(async()=>({keys:await caches.keys(),foreign:await(await(await caches.open('foreign-a52-marker')).match('foreign-marker')).text()}));
 assert.deepEqual(cacheState.keys.filter(k=>k.startsWith('sa3d-')),['sa3d-v94']);assert.equal(cacheState.foreign,'preserve');
 assert.deepEqual(await cacheHashes(p),expected);result.hashes=expected;result.stages.push(stage);record();
 stage='updated-online';await p.reload();await ready(p);assert.deepEqual(await farm(p),before);await menus(p);assert.deepEqual(await cacheHashes(p),expected);result.stages.push(stage);record();
 stage='offline';result.offlineProbe={step:'set-offline'};record();await session.context.setOffline(true);result.offlineProbe.transport=await h.enforceOfflineTransport();record();h.beginOfflineObservation();
 const markOffline=step=>{result.offlineProbe.step=step;record();};
 const responseClasses=[];let nonWorkerResponses=0;const count=r=>{if(!r.fromServiceWorker()){nonWorkerResponses++;countResponseClass(responseClasses,r.url(),r.request().resourceType(),h.base);}};p.on('response',count);
 const served=h.serverResponseCount();markOffline('reload');await p.reload();markOffline('ready');await ready(p);
 markOffline('control');const controlled=await p.evaluate(()=>!!navigator.serviceWorker.controller);result.offlineProbe.controlled=controlled;record();assert.equal(controlled,true);
 markOffline('save');const afterOffline=await farm(p);result.offlineProbe.differentFields=farmDifferenceFields(before,afterOffline);result.offlineProbe.farmMatches=result.offlineProbe.differentFields.length===0;record();assert.deepEqual(afterOffline,before);
 markOffline('menus');await menus(p);
 markOffline('cache');const offlineHashes=await cacheHashes(p);result.offlineProbe.cacheMatches=require('node:util').isDeepStrictEqual(offlineHashes,expected);record();assert.deepEqual(offlineHashes,expected);
 markOffline('responses');result.offlineProbe.transport=h.offlineTransportState();result.offlineProbe.responseObservation=h.offlineResponseObservation();result.offlineProbe.serverResponses=h.serverResponseCount()-served;result.offlineProbe.nonWorkerResponses=nonWorkerResponses;result.offlineProbe.responseClasses=responseClasses;record();assert.equal(h.serverResponseCount(),served,'Zero server responses during offline reload');assert.equal(nonWorkerResponses,0);
 p.off('response',count);const expectedSdkFailures={firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:0};for(const key of ['externalAborts','observedDisconnected','expectedConsole'])assert.deepEqual(result.offlineProbe.transport[key],expectedSdkFailures,'Exact offline SDK failure contract: '+key);markOffline('errors');result.offlineProbe.errorCounts=errorCategoryCounts(session.errors);record();assert.deepEqual(session.errors,[]);markOffline('complete');result.stages.push(stage);result.status='PASS';failed=false;record();
}catch{result.status='FAIL';result.failedStage=stage;process.exitCode=1;record();console.error('A52 installed cow release journey failed; stage='+stage);}
finally{if(h)try{await h.close(failed);}catch{result.status='FAIL';result.failedStage='cleanup';process.exitCode=1;record();}}
})();

