'use strict';
// Inert controls only: never require the browser entry or its harness.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=path.join(__dirname,'a52-installed-ui-cache.browser.cjs');
const source=()=>fs.readFileSync(file,'utf8');
test('approval accident guard precedes harness import; exact installed predecessor',()=>{
 const s=source();assert(s.indexOf('A52_INSTALLED_BROWSER_APPROVED')<s.indexOf("require('./browser-harness.cjs')"));
 assert(s.includes("BASE='38fa4706e41c40197b7afc32de693cb3901a80fb'"));assert(s.includes("serviceWorkers:'allow'"));assert(!s.includes('?testfarm'));
 new vm.Script(s);
});
test('real transition, byte checks, cleanup, native menus and offline assertions remain present',()=>{
 const s=source();for(const token of ['await updateWorker(p)','baselineGame.equals','cacheHashes','sunny-ui.css?v=1','compact-ui.css?v=1','corner-menu.js?v=1','index.html','sa3d-v85','sa3d-v93','foreign-a52-marker','await revealCornerAction','await p.keyboard.press(\'Escape\')','await session.context.setOffline(true)','nonWorkerResponses,0','serverResponseCount()','assert.deepEqual(await farm(p),before)','assert.deepEqual(session.errors,[])'])assert(s.includes(token),token);
 assert(!s.includes('console.error(error'));assert(!s.includes('result.error='));assert(!s.includes('force:true'));
});
test('representative projection compares substantive stable farm fields and excludes only unclaimed dynamics',()=>{
 const match=source().match(/function representative\(S\)\{[\s\S]*?\n\}/);assert(match);
 const project=vm.runInNewContext('('+match[0]+')');
 const a={v:3,coins:345,gems:5,xp:7,level:100,barn:{wheat:3},barnCap:1000,barnUps:0,decor:[{type:'lamp'}],gold:{milk:2},plots:[{crop:'wheat',water:1}],pens:{cow:{owned:true,list:[123],meta:[{name:'A'}]}},layout:{b:{}},buildings:{feedmill:{owned:true,jobs:[]}},lastSeen:1};
 const b=structuredClone(a);b.lastSeen=2;assert.equal(JSON.stringify(project(a)),JSON.stringify(project(b)));
 for(const mutate of [s=>s.coins++,s=>s.barn.wheat++,s=>s.decor=[],s=>s.plots[0].crop=null,s=>s.pens.cow.owned=false,s=>s.layout={b:{x:2}},s=>s.buildings.feedmill.owned=false]){const c=structuredClone(a);mutate(c);assert.notEqual(JSON.stringify(project(a)),JSON.stringify(project(c)));}
});
