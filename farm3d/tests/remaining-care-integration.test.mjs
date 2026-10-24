import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync}from'node:child_process';
import vm from 'node:vm';import {remainingCareLayouts,remainingCareConflicts}from'../remaining-care-layout.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('remaining physical care is installed before ordinary Beast behavior and herd synchronization',()=>{assert.match(html,/createRemainingCareYards/);assert.match(html,/createRemainingCareController/);const update=html.slice(html.indexOf('  update(dt, t) {'));assert(update.indexOf('remainingCare.update')<update.indexOf('const ox = this.g.position.x'));assert.match(html,/syncRemainingCareYards\(\);/);assert.match(html,/remainingCare\.release\(a\)/);assert.match(html,/remainingCareConflicts/);});
test('protected implementations and approved pen adapters retain exact reviewed bytes',()=>{
 const original=JSON.parse(fs.readFileSync(new URL('./remaining-care-protected.json',import.meta.url),'utf8')).files,adapters=JSON.parse(fs.readFileSync(new URL('./animal-pen-authorized-adapters.json',import.meta.url),'utf8'));
 // cow3d.js: A3 approves only the bounded heading/release block; prefix/suffix remain frozen.
 // farm-land.js / farm-path.js: owner-authorized land and path exceptions for amendments A1 and A2 (horse paddock).
 const authorized=new Set(['cow-yard.js','chicken-yard.js','chicken-stations.js','game.js','farm-land.js','farm-path.js','cow3d.js']);
 for(const f of Object.keys(adapters.files))assert(authorized.has(f),f+' is outside the owner-approved pen adapters');
 for(const f of ['game.js','auth.js','canon.js','farm-land.js','farm-path.js','cow3d.js','horse3d.js','horse-stance3d.js','horse-ik3d.js','sheep3d.js','dog3d.js','cat3d.js','quadruped3d.js','live3d.js','cow-care.js','cow-yard.js','chicken-care.js','chicken-yard.js','chicken-stations.js','animal-care-poses.js']){
  const entry=adapters.files[f];if(entry)assert.equal(entry.previousSha256,original[f],f+' lost its frozen predecessor digest');
  const expected=entry?.reviewedSha256??original[f],actual=fs.readFileSync(new URL('../'+f,import.meta.url));assert.equal(crypto.createHash('sha256').update(actual).digest('hex'),expected,f+' changed outside the reviewed source checkpoint');
  if(f==='game.js'){
   assert.equal(entry.amendment,'A7-suitable-grass');const scope=entry.scope,source=actual.toString(),start=source.indexOf(scope.start),end=source.indexOf(scope.end);
   assert(start>=0&&end>start,'A7 save source boundaries exist');
   assert.equal(crypto.createHash('sha256').update(source.slice(0,start)).digest('hex'),scope.prefixSha256,'A7 cannot change paid game definitions');
   assert.equal(crypto.createHash('sha256').update(source.slice(end)).digest('hex'),scope.suffixSha256,'A7 cannot change game economy or unrelated gameplay');
  }
  if(f==='cow3d.js'){
   assert.equal(entry.amendment,'A3');const scope=entry.scope,source=actual.toString(),start=source.indexOf(scope.start),end=source.indexOf(scope.end);
   assert(start>=0&&end>start,'A3 source boundaries exist');
   assert.equal(crypto.createHash('sha256').update(source.slice(0,start)).digest('hex'),scope.prefixSha256,'A3 cannot change anatomy, solver or gait constants');
   assert.equal(crypto.createHash('sha256').update(source.slice(end)).digest('hex'),scope.suffixSha256,'A3 cannot change face/tail behavior');
  }
  if(f==='farm-land.js'){
   const scope=entry.scope,source=actual.toString(),start=source.indexOf(scope.start),end=source.indexOf(scope.end);
   assert.equal(entry.amendment,'A6-buildable-mask-A8-player-clamp');assert(start>=0&&end>start,'land-mask source boundaries exist');
   assert.equal(crypto.createHash('sha256').update(source.slice(0,start)).digest('hex'),scope.prefixSha256,'A6 cannot change A1 prefix');
   const player=source.indexOf(scope.playerStart,end),terrain=source.indexOf(scope.terrainStart,player);
   assert(player>end&&terrain>player,'A8 movement and frozen terrain boundaries exist');
   assert.equal(crypto.createHash('sha256').update(source.slice(end,player)).digest('hex'),scope.oldFarmSha256,'A8 cannot change old farm membership');
   assert.equal(crypto.createHash('sha256').update(source.slice(player,terrain)).digest('hex'),scope.playerSha256,'A8 reviewed movement clamp changed');
   assert.equal(crypto.createHash('sha256').update(source.slice(terrain)).digest('hex'),scope.terrainSha256,'A8 cannot change terrain heights');
  }
 }
});
import {createCowYard} from '../cow-yard.js';import {createChickenYard} from '../chicken-yard.js';import {meshReceipt} from './fixtures/animal-pen-mesh-probe.mjs';
test('authorized yard adapters retain exact accepted default rendered geometry',()=>{const expected=JSON.parse(fs.readFileSync(new URL('./fixtures/animal-pen-render-pr95.json',import.meta.url),'utf8')).sites,yards={cow:createCowYard({north:25}),chicken:createChickenYard()};try{for(const[k,y]of Object.entries(yards))assert.deepEqual(meshReceipt(y.group),expected[k],k+' default rendered geometry changed');}finally{Object.values(yards).forEach(y=>y.dispose());}});

test('one obstructed pet nook retains the shared bowl for that existing pet while the other nook operates',()=>{for(const blocked of ['dog','cat',null]){const layouts=remainingCareLayouts(),S={pets:[{kind:'dog'},{kind:'cat'}],decor:{placed:[]}},sites=Object.fromEntries(['dog','cat'].map(k=>[k,{active:k!==blocked,checked:false,farm:S}])),legacy=[-3.1,7.1,.25,.25],blocks=blocked?[[...layouts[blocked].footprint[0],.1,.1]]:[],petBowl={visible:true},moves=[];const context={G:{S,DECOR:{}},remainingBlocks:[],cowBlocks:[],legacyPetBowlBlock:legacy,remainingYards:Object.fromEntries(['dog','cat'].map(k=>[k,{layout:layouts[k],group:{}}])),remainingSites:sites,remainingPens:{},remainingCareConflicts,BLOCKS:blocks,animals:[],petBowl,moveBlock:(...args)=>moves.push(args)};const source=html.slice(html.indexOf('function syncRemainingCareYards(){'),html.indexOf('function syncChickenYard(){'));vm.runInNewContext(source+';syncRemainingCareYards()',context);assert.equal(petBowl.visible,!!blocked,'fallback pet lost its existing bowl when only '+blocked+' is obstructed');assert.equal(sites.dog.active,blocked!=='dog');assert.equal(sites.cat.active,blocked!=='cat');assert.equal(moves.at(-1)[1],blocked?-3.1:1400);}});
