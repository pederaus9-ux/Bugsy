import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {createChickenYard,CHICKEN_YARD_LAYOUT} from '../chicken-yard.js';import {createCowYard,cowYardLayout} from '../cow-yard.js';
import {createRemainingCareYards} from '../remaining-care-yard.js';import {remainingCareLayouts} from '../remaining-care-layout.js';
import {NORTH_EXTENSION} from '../farm-land.js';import {createStationScheduler} from '../animal-stations.js';
import {createAnimalPenSceneRegistry} from '../animal-pen-scene.js';import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';import {preparePenYards} from '../animal-pen-runtime.js';
// Drives the actual index.html installAnimalPenScene through the actual
// registry/startup wiring, in index order, with only grass/pet-bowl/save fakes.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function slice(start,end,inclusive=true){const a=html.indexOf(start);assert(a>=0,'missing index marker '+start);const b=html.indexOf(end,a+start.length);assert(b>=0,'missing index marker '+end);return html.slice(a,inclusive?b+end.length:b)+'\n';}
const fn=start=>slice(start,'\n}\n');
// Values created inside the VM realm have their own Array prototype.
const plain=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const source=[
 'let CHICKEN_YARD_LAYOUT=DEFAULT_CHICKEN_YARD_LAYOUT,COW_YARD_LAYOUT=cowYardLayout(NORTH_EXTENSION);',
 fn('function clearGrass('),fn('function moveClear('),
 slice('let chickenYard=createChickenYard();','fenceSegs.push(...CHICKEN_YARD_LAYOUT.fenceSegments);'),
 slice('const PENS = {','|| null;'),
 slice('const BLOCKS = [','let installedAnimalPens=resolveAnimalPens(),penSceneBindings=null;'),
 fn('function setCowGrass('),fn('// Called only by a prepared scene revision'),fn('function moveBlock('),
 'globalThis.live={get chickenYard(){return chickenYard},get cowYard(){return cowYard},get chickenLayout(){return CHICKEN_YARD_LAYOUT},get cowLayout(){return COW_YARD_LAYOUT},get installed(){return installedAnimalPens},get bindings(){return penSceneBindings},get cowActive(){return cowYardActive},get cowChecked(){return cowYardChecked},setCowStatus(v){cowStatus=v},PENS,remainingPens,PEN_LIST,penOf,BLOCKS,OBST,fenceSegs,CLEARS,cowSurfaces,cowBlocks,remainingBlocks,remainingSites,remainingYards,fenceRouteObstacles,legacyPetBowlBlock,penSceneRegistry};'
].join('\n');
function fixture({pets=['dog','cat'],synced=true}={}){
 const unrelatedBlock=[-30,-30,1,1],unrelatedFence=[-40,-40,-39,-40],scene=new THREE.Scene(),animals=[{kind:'chicken'},{kind:'cow'},{kind:'horse'},{kind:'sheep'}];
 const c=vm.createContext({THREE,scene,createChickenYard,DEFAULT_CHICKEN_YARD_LAYOUT:CHICKEN_YARD_LAYOUT,createCowYard,cowYardLayout,createRemainingCareYards,remainingCareLayouts,NORTH_EXTENSION,createStationScheduler,createAnimalPenSceneRegistry,resolveAnimalPens,
  BLOCKS_EXTRA:[unrelatedBlock],fenceSegs:[unrelatedFence],CLEARS:new Map(),GRASS:{},animals,chickenSupplies:{feedMs:0,waterMs:0},chickenPreview:null,petBowl:{visible:true},
  G:{S:{pens:{chicken:{}},pets:pets.map(kind=>({kind}))},CHICKEN_DEFAULT_STYLE:{}}});
 vm.runInContext(source,c);const live=c.live;
 // Runtime Apply follows syncCowYard, which always stores getCowCareStatus()'s object.
 if(synced)live.setCowStatus({cows:[],queue:[],job:null,tank:{normal:0,gold:0},feed:0,waterUntil:0,capacity:6,reason:'unavailable'});
 const before={blocks:[...live.BLOCKS],obstacles:[...live.OBST],fences:[...live.fenceSegs],yards:{chicken:live.chickenYard,cow:live.cowYard,...live.remainingYards},
  penBlocks:[...live.chickenLayout.obstacles,...live.cowBlocks,...live.remainingBlocks],penFences:[...live.chickenLayout.fenceSegments,...Object.values(live.remainingSites).flatMap(s=>s.fences)]};
 return {c,live,before,animals,unrelatedBlock,unrelatedFence,dispose(){for(const y of Object.values(before.yards))y.dispose();}};
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
