import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {createChickenYard,CHICKEN_YARD_LAYOUT} from '../chicken-yard.js';import {createCowYard,cowYardLayout} from '../cow-yard.js';
import {createRemainingCareYards} from '../remaining-care-yard.js';import {remainingCareLayouts} from '../remaining-care-layout.js';
import {NORTH_EXTENSION} from '../farm-land.js';import {createStationScheduler} from '../animal-stations.js';
import {createAnimalPenSceneRegistry} from '../animal-pen-scene.js';import {resolveAnimalPens,defaultSiteRecord,decodeAnimalPens} from '../animal-pen-layout.js';import {preparePenYards,prepareAnimalPenRevision} from '../animal-pen-runtime.js';
// Drives the actual index.html installAnimalPenScene through the actual
// registry/startup wiring, in index order, with only grass/pet-bowl/save fakes.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function slice(start,end,inclusive=true){const a=html.indexOf(start);assert(a>=0,'missing index marker '+start);const b=html.indexOf(end,a+start.length);assert(b>=0,'missing index marker '+end);return html.slice(a,inclusive?b+end.length:b)+'\n';}
const fn=start=>slice(start,'\n}\n');
// The single source line that follows a unique marker (which may span lines).
const lineAfter=marker=>{const a=html.indexOf(marker);assert(a>=0,'missing index marker '+marker);const s=html.indexOf('\n',a+marker.length-1)+1;return html.slice(s,html.indexOf('\n',s))+'\n';};
// Boot registers route obstacles for blocks added after startup right after the first full refresh.
const lateRegistration=lineAfter('bootStep("putting your farm in place");\nGV.refresh("all");');
// Values created inside the VM realm have their own Array prototype.
const plain=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const source=[
 'let CHICKEN_YARD_LAYOUT=DEFAULT_CHICKEN_YARD_LAYOUT,COW_YARD_LAYOUT=cowYardLayout(NORTH_EXTENSION);',
 fn('function clearGrass('),fn('function moveClear('),
 slice('let chickenYard=createChickenYard();','fenceSegs.push(...CHICKEN_YARD_LAYOUT.fenceSegments);'),
 slice('const PENS = {','|| null;'),
 slice('const BLOCKS = [','let installedAnimalPens=resolveAnimalPens(),penSceneBindings=null;'),lineAfter('let installedAnimalPens=resolveAnimalPens(),penSceneBindings=null;'),
 fn('function setCowGrass('),fn('// Called only by a prepared scene revision'),fn('// Saved custom pens install before herds spawn'),fn('function moveBlock('),
 html.includes('// Remove an animal through its care controllers')?fn('// Remove an animal through its care controllers'):'',
 'globalThis.live={restoreSavedAnimalPens,get animals(){return animals},get chickenYard(){return chickenYard},get cowYard(){return cowYard},get chickenLayout(){return CHICKEN_YARD_LAYOUT},get cowLayout(){return COW_YARD_LAYOUT},get installed(){return installedAnimalPens},get bindings(){return penSceneBindings},get cowActive(){return cowYardActive},get cowChecked(){return cowYardChecked},setCowStatus(v){cowStatus=v},PENS,remainingPens,PEN_LIST,penOf,BLOCKS,OBST,fenceSegs,CLEARS,cowSurfaces,cowBlocks,remainingBlocks,remainingSites,remainingYards,fenceRouteObstacles,legacyPetBowlBlock,penSceneRegistry};'
].join('\n');
function fixture({pets=['dog','cat'],synced=true,animals=[{kind:'chicken'},{kind:'cow'},{kind:'horse'},{kind:'sheep'}],animalPens}={}){
 const unrelatedBlock=[-30,-30,1,1],unrelatedFence=[-40,-40,-39,-40],scene=new THREE.Scene(),events=[];
 // Care controllers are spies here; their own rebind contracts have dedicated suites.
 const care=kind=>({release(a){events.push('release '+a.kind);},prepareLayoutRebind({site,now,placements}){events.push('prepare '+site.kind);assert.equal(site.kind,kind);assert(Number.isFinite(now));assert.deepEqual(Object.keys(placements),[]);return{revision:site.revision,publish(){events.push('care '+site.kind+(c.live.installed.revision===site.revision?' after registries':' before registries'));},dispose(){events.push('discard '+site.kind);}};}});
 const remainingCare={release(a){events.push('release '+a.kind);},prepareLayoutRebind:a=>care(a.site.kind).prepareLayoutRebind(a)};
 const c=vm.createContext({releaseCowTask:a=>events.push('release cow task'),chickenCare:care('chicken'),cowPenCare:care('cow'),remainingCare,clockT:0,decodeAnimalPens,prepareAnimalPenRevision,preparePenYards,structuredClone,THREE,scene,createChickenYard,DEFAULT_CHICKEN_YARD_LAYOUT:CHICKEN_YARD_LAYOUT,createCowYard,cowYardLayout,createRemainingCareYards,remainingCareLayouts,NORTH_EXTENSION,createStationScheduler,createAnimalPenSceneRegistry,resolveAnimalPens,
  BLOCKS_EXTRA:[unrelatedBlock],fenceSegs:[unrelatedFence],CLEARS:new Map(),GRASS:{},animals,chickenSupplies:{feedMs:0,waterMs:0},chickenPreview:null,petBowl:{visible:true},
  G:{S:{pens:{chicken:{}},pets:pets.map(kind=>({kind})),layout:{b:{},t:{},...(animalPens===undefined?{}:{animalPens})}},CHICKEN_DEFAULT_STYLE:{}}});
 vm.runInContext(source,c);const live=c.live;
 // Runtime Apply follows syncCowYard, which always stores getCowCareStatus()'s object.
 if(synced)live.setCowStatus({cows:[],queue:[],job:null,tank:{normal:0,gold:0},feed:0,waterUntil:0,capacity:6,reason:'unavailable'});
 const before={blocks:[...live.BLOCKS],obstacles:[...live.OBST],fences:[...live.fenceSegs],yards:{chicken:live.chickenYard,cow:live.cowYard,...live.remainingYards},
  penBlocks:[...live.chickenLayout.obstacles,...live.cowBlocks,...live.remainingBlocks],penFences:[...live.chickenLayout.fenceSegments,...Object.values(live.remainingSites).flatMap(s=>s.fences)]};
 return {c,live,before,animals,events,unrelatedBlock,unrelatedFence,dispose(){for(const y of Object.values(before.yards))y.dispose();}};
}
function customLayout(){const cow=defaultSiteRecord('cow'),horse=defaultSiteRecord('horse');cow.boundary[1].z+=1;return resolveAnimalPens({v:1,revision:1,sites:{cow,horse}});}
const all={chicken:true,cow:true,horse:true,sheep:true,dog:true,cat:true};
test('actual index installs a published custom revision into every live pen consumer',()=>{
 const f=fixture(),{live}=f,layout=customLayout(),next=preparePenYards(layout);
 try{
  const p=live.penSceneRegistry.prepare(layout,next.yards,all);
  assert.equal(live.installed.sites.cow.custom,false,'preparation must not install');assert.equal(live.cowYard,f.before.yards.cow);
  p.publish();
  assert.equal(live.installed,layout);assert.equal(live.chickenYard,next.yards.chicken);assert.equal(live.cowYard,next.yards.cow);
  assert.equal(live.chickenLayout,next.yards.chicken.layout);assert.equal(live.cowLayout,next.yards.cow.layout);
  for(const kind of ['horse','sheep','dog','cat'])assert.equal(live.remainingYards[kind],next.yards[kind]);
  assert.deepEqual(plain(live.PENS.courtyard.poly),plain(layout.sites.cow.polygon));assert.equal(live.PENS.courtyard.custom,true);
  assert.deepEqual(plain(live.remainingPens.horse.poly),plain(layout.sites.horse.polygon));assert.equal(live.remainingPens.horse.custom,true);
  assert.equal(live.PENS.yard.custom,false);assert.equal(live.remainingPens.sheep.custom,false);
  for(const pen of [live.PENS.yard,live.PENS.courtyard,live.remainingPens.horse,live.remainingPens.sheep,live.PENS.paddock])assert(live.PEN_LIST.includes(pen));
  assert.equal(live.cowActive,true);assert.equal(live.cowChecked,true);
  assert.deepEqual(f.animals.map(a=>a.pen),[live.PENS.yard,live.PENS.courtyard,live.remainingPens.horse,live.remainingPens.sheep]);
  // Collision/routing: unrelated entries keep identity, previous pen entries leave, new bindings are live.
  assert(live.BLOCKS.includes(f.unrelatedBlock));assert(live.fenceSegs.includes(f.unrelatedFence));assert(live.BLOCKS.includes(live.legacyPetBowlBlock));
  for(const b of f.before.penBlocks)assert(!live.BLOCKS.includes(b),'previous pen block remains solid');
  for(const fence of f.before.penFences)assert(!live.fenceSegs.includes(fence),'previous pen fence remains solid');
  for(const [kind,binding]of Object.entries(live.bindings)){
   for(const b of binding.blocks)assert(live.BLOCKS.includes(b),kind+' block not live');
   binding.fences.forEach((fence,i)=>{assert(live.fenceSegs.includes(fence),kind+' fence not live');const o=live.fenceRouteObstacles.get(fence);assert.equal(o,binding.fenceObstacles[i]);assert(live.OBST.includes(o),kind+' fence route obstacle not live');});
  }
  assert(same(live.cowBlocks,live.bindings.cow.blocks));assert(same(live.remainingBlocks,['horse','sheep','dog','cat'].flatMap(k=>live.bindings[k].blocks)));
  for(const kind of ['horse','sheep','dog','cat']){const s=live.remainingSites[kind];assert.equal(s.active,true);assert.equal(s.fences,live.bindings[kind].fences);assert.equal(s.blocks,live.bindings[kind].blocks);}
  // Cow feed/drink contact surfaces follow the installed yard's stations.
  const stations=next.yards.cow.stations.filter(s=>s.kind==='feed'||s.kind==='drink');assert.deepEqual([...live.cowSurfaces.keys()].sort(),stations.map(s=>s.id).sort());
  for(const s of stations.filter(s=>s.kind==='feed'))assert.equal(live.cowSurfaces.get(s.id).x,s.dock[0]);
  // Meadow clearings belong to the installed sites only.
  next.yards.chicken.layout.obstacles.forEach(([x,z],i)=>assert.deepEqual(plain(live.CLEARS.get('chicken:'+i).slice(0,2)),[x,z]));
  assert(![...live.CLEARS.keys()].some(k=>k.startsWith('chicken:')&&Number(k.slice(8))>=next.yards.chicken.layout.obstacles.length));
  assert([...live.CLEARS.keys()].some(k=>k.startsWith('cow-yard:')));for(const kind of ['horse','sheep','dog','cat'])assert([...live.CLEARS.keys()].some(k=>k.startsWith('remaining-'+kind+':')),kind+' clearing missing');
  // Both pets have active nooks, so the legacy shared bowl and its collision leave the farm.
  assert.equal(f.c.petBowl.visible,false);assert.deepEqual(plain(live.legacyPetBowlBlock.slice(0,2)),[1400,1400]);
  p.retire();
 }finally{next.dispose();f.dispose();}
});
test('actual index keeps inactive sites out of pens, clearings and collision while retaining fallback care',()=>{
 const f=fixture({pets:['dog','cat']}),{live}=f,layout=customLayout(),next=preparePenYards(layout),active={...all,cow:false,cat:false};
 try{
  const p=live.penSceneRegistry.prepare(layout,next.yards,active);p.publish();
  assert.equal(live.cowActive,false);assert(!live.PEN_LIST.includes(live.PENS.courtyard));assert.notEqual(f.animals[1].pen,live.PENS.courtyard);
  assert(![...live.CLEARS.keys()].some(k=>k.startsWith('cow-yard:')),'inactive cow site keeps meadow clearings');
  assert(![...live.CLEARS.keys()].some(k=>k.startsWith('remaining-cat:')),'inactive cat site keeps meadow clearings');
  for(const b of live.bindings.cow.blocks)assert(b[0]>=10000,'inactive cow collision must stay off-farm');
  assert.equal(live.remainingSites.cat.active,false);
  // The owned cat still uses the legacy shared bowl, so it remains visible and solid.
  assert.equal(f.c.petBowl.visible,true);assert.deepEqual(plain(live.legacyPetBowlBlock.slice(0,2)),[-3.1,7.1]);
  p.retire();
 }finally{next.dispose();f.dispose();}
});
test('a boot-time install before the first cow sync leaves cow status display to syncCowYard',()=>{
 const f=fixture({synced:false}),{live}=f,layout=customLayout(),next=preparePenYards(layout);
 try{const p=live.penSceneRegistry.prepare(layout,next.yards,all);p.publish();assert.equal(live.cowYard,next.yards.cow);assert.equal(live.installed,layout);p.retire();}
 finally{next.dispose();f.dispose();}
});
function bootWithLaterBlocks(restore){
 const f=fixture(),{live}=f,late=[[-10,17.5,6.6,8],[9,30,1.9,1.7],[3.3,11.4,1.5,.6]];live.BLOCKS.push(...late); // field area, a building spot, the board
 const layout=customLayout(),next=preparePenYards(layout);let p=null;
 if(restore){p=live.penSceneRegistry.prepare(layout,next.yards,all);p.publish();} // saved layout restored inside GV.refresh("all")
 vm.runInContext(lateRegistration,f.c);
 const rects=live.OBST.filter(o=>o.c===1&&o.s===0),count=b=>rects.filter(o=>o.x===b[0]&&o.z===b[1]&&o.hw===b[2]&&o.hd===b[3]).length;
 return {f,live,late,next,p,count};
}
for(const restore of [false,true])test((restore?'a saved layout restored at boot':'a default boot')+' keeps every later farm block and pen block solid exactly once',()=>{
 const {f,live,late,next,p,count}=bootWithLaterBlocks(restore);
 try{
  for(const b of late)assert.equal(count(b),1,'later farm block '+JSON.stringify(b)+' must have exactly one route obstacle');
  const penBlocks=restore?Object.values(live.bindings).flatMap(b=>b.blocks.filter(x=>x[0]<1000)):[...live.chickenLayout.obstacles];
  for(const b of penBlocks)assert.equal(count(b),1,'pen block '+JSON.stringify(b)+' must have exactly one route obstacle');
  p?.retire();
 }finally{next.dispose();f.dispose();}
});
const savedRecord=()=>{const cow=defaultSiteRecord('cow'),horse=defaultSiteRecord('horse');cow.boundary[1].z+=1;return {v:1,revision:1,sites:{cow,horse}};};
test('a saved custom layout installs before herds spawn and rebinds every care controller after registries publish',()=>{
 const record=savedRecord(),f=fixture({animals:[],animalPens:record}),{live}=f,copy=structuredClone(record);
 try{
  live.restoreSavedAnimalPens();
  assert.equal(live.installed.revision,1);assert.equal(live.installed.sites.cow.custom,true);assert.equal(live.installed.sites.horse.custom,true);assert.equal(live.installed.sites.sheep.custom,false);
  assert.deepEqual(plain(live.PENS.courtyard.poly),plain(live.installed.sites.cow.polygon));
  const kinds=['chicken','cow','horse','sheep','dog','cat'];
  assert.deepEqual([...f.events.filter(e=>e.startsWith('prepare'))].sort(),kinds.map(k=>'prepare '+k).sort());
  assert.deepEqual([...f.events.filter(e=>e.startsWith('care'))].sort(),kinds.map(k=>'care '+k+' after registries').sort());
  assert(!f.events.some(e=>e.startsWith('discard')));
  for(const y of Object.values(f.before.yards))assert.equal(y.group.parent,null,'previous default yards must leave the scene');
  const n=f.events.length;live.restoreSavedAnimalPens();assert.equal(f.events.length,n,'restoring the same saved layout again must be a no-op');
  assert.deepEqual(plain(f.c.G.S.layout.animalPens),copy,'restore must not rewrite the saved layout');
 }finally{f.dispose();for(const y of Object.values(live.bindings?{chicken:live.chickenYard,cow:live.cowYard,...live.remainingYards}:{}))y.dispose();}
});
for(const [name,animalPens] of [['absent',undefined],['future schema',{v:2,revision:4,sites:{}}],['unknown template',{v:1,revision:2,sites:{cow:{...savedRecord().sites.cow,template:'sa3d-pr99-cow-v9'}}}],['invalid geometry',{v:1,revision:1,sites:{cow:{...savedRecord().sites.cow,structures:{}}}}]])test('a '+name+' saved pen layout keeps the accepted default without rewriting the save',()=>{
 const f=fixture({animals:[],animalPens}),{live}=f,copy=animalPens===undefined?undefined:structuredClone(animalPens);
 try{live.restoreSavedAnimalPens();assert.equal(live.installed.revision,0);assert.equal(live.installed.sites.cow.custom,false);assert.deepEqual(f.events,[]);assert.equal(live.cowYard,f.before.yards.cow);if(copy===undefined)assert.equal(f.c.G.S.layout.animalPens,undefined);else assert.deepEqual(plain(f.c.G.S.layout.animalPens),copy);}
 finally{f.dispose();}
});
const liveHerd=(scene,events)=>['chicken','cow','horse'].map(kind=>{const g=new THREE.Group();scene.add(g);return {kind,g,ref:{type:'pen',kind,i:0},rig3d:{dispose(){events.push('rig '+kind);}},...(kind==='cow'?{carePose:{reset(){events.push('pose reset');}}}:{})};});
test('a different saved layout arriving with a live herd retires it through the ordinary removal path and rebinds no live animal',()=>{
 const f=fixture({animals:[],animalPens:savedRecord()}),{live}=f,herd=liveHerd(f.c.scene,f.events);f.animals.push(...herd);
 try{
  live.restoreSavedAnimalPens();
  assert.equal(live.animals.length,0,'the previous herd must be retired before installation');
  for(const a of herd){assert.equal(a.gone,true);assert.equal(a.g.parent,null);}
  for(const e of ['release chicken','pose reset','release cow task','release horse','rig chicken','rig cow','rig horse'])assert(f.events.includes(e),'missing '+e);
  assert(f.events.indexOf('release horse')<f.events.indexOf('prepare chicken'),'retirement precedes preparation');
  assert.equal(live.installed.revision,1);assert.equal(live.installed.sites.cow.custom,true);
  assert.equal(f.events.filter(e=>e.startsWith('care')&&!e.endsWith('after registries')).length,0);
 }finally{f.dispose();}
});
test('the same saved layout on a later refresh keeps the live herd untouched',()=>{
 const f=fixture({animals:[],animalPens:savedRecord()}),{live}=f;
 try{
  live.restoreSavedAnimalPens();const herd=liveHerd(f.c.scene,f.events);f.animals.push(...herd);const n=f.events.length;
  live.restoreSavedAnimalPens();
  assert.equal(f.events.length,n);assert.equal(live.animals.length,3);for(const a of herd){assert.notEqual(a.gone,true);assert.equal(a.g.parent,f.c.scene);}
 }finally{f.dispose();}
});
test('the full farm refresh restores saved pens after the saved object layout and before herds spawn',()=>{
 const body=slice('  refresh(what) {','\n  },',false),layoutAt=body.indexOf('applyLayout();'),restoreAt=body.indexOf('restoreSavedAnimalPens();'),herdAt=body.indexOf('syncHerd();');
 assert(layoutAt>=0&&restoreAt>layoutAt&&herdAt>restoreAt,'refresh("all") must call applyLayout, then restoreSavedAnimalPens, then syncHerd');
});
const onFarmBlockAt=(live,x,z)=>live.BLOCKS.filter(b=>b[0]===x&&b[1]===z);
test('the invisible legacy hen water pan block stays for the accepted chicken yard and leaves with a customised one',()=>{
 for(const custom of [false,true]){
  const f=fixture({animals:[]}),{live}=f,chicken=defaultSiteRecord('chicken'),delta=[0,-1];
  if(custom){chicken.boundary.forEach(v=>{v.x+=delta[0];v.z+=delta[1];});for(const r of chicken.runs||[]){r.a=[r.a[0]+delta[0],r.a[1]+delta[1]];r.b=[r.b[0]+delta[0],r.b[1]+delta[1]];}for(const id in chicken.structures){const q=chicken.structures[id];chicken.structures[id]=[q[0]+delta[0],q[1]+delta[1]];}}
  const layout=resolveAnimalPens(custom?{v:1,revision:1,sites:{chicken}}:{v:1,revision:1,sites:{horse:defaultSiteRecord('horse')}}),next=preparePenYards(layout);
  try{
   assert.equal(onFarmBlockAt(live,-9.6,-2.4).length,1,'accepted startup keeps the legacy block');
   const p=live.penSceneRegistry.prepare(layout,next.yards,all);p.publish();
   assert.equal(onFarmBlockAt(live,-9.6,-2.4).length,custom?0:1,custom?'a moved chicken yard must not leave an invisible wall behind':'an unedited chicken yard keeps its accepted collision');
   const rects=live.OBST.filter(o=>o.c===1&&o.s===0&&o.x===-9.6&&o.z===-2.4);assert.equal(rects.length,custom?0:1,'route planner agrees with collision');
   p.retire();
  }finally{next.dispose();f.dispose();}
 }
});
