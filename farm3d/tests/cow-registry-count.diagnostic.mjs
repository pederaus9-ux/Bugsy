// Supplemental diagnosis only. The original failing scene-registry test is unchanged.
import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../lib/three.module.min.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';import {preparePenYards} from '../animal-pen-runtime.js';import {createAnimalPenSceneRegistry} from '../animal-pen-scene.js';
const cow=defaultSiteRecord('cow');cow.boundary[1].z+=1;
const layout=resolveAnimalPens({v:1,revision:1,sites:{cow}}),old=preparePenYards(resolveAnimalPens()),next=preparePenYards(layout),scene=new T.Scene();scene.add(...Object.values(old.yards).map(y=>y.group));let published;
const registry=createAnimalPenSceneRegistry({scene,blocks:[],obstacles:[],fences:[],initial:{yards:old.yards,blocks:[],obstacles:[],fences:[]},onPublish:p=>published=p});
const prepared=registry.prepare(layout,next.yards,Object.fromEntries(Object.keys(next.yards).map(k=>[k,true])));
try{
 prepared.publish();const b=published.bindings.cow,staticBounds=layout.sites.cow.obstacles,gateBounds=next.yards.cow.gateObstacleBounds(),expected=[...staticBounds,...gateBounds];
 function verify(binding){assert.deepEqual(binding.blocks,expected,'exact static blocks plus both actual gate leaves only');assert.deepEqual(binding.bounds,expected);assert.deepEqual(binding.fences,layout.sites.cow.fenceSegments);assert.equal(binding.fenceObstacles.length,binding.fences.length);for(let i=0;i<binding.fences.length;i++){const[ax,az,bx,bz]=binding.fences[i],o=binding.fenceObstacles[i];assert(Math.abs(o.hw-Math.hypot(bx-ax,bz-az)/2)<1e-9);assert(Math.abs(o.c-Math.cos(Math.atan2(bz-az,bx-ax)))<1e-9);}}
 verify(b);const controls=[];function reject(name,mutate){const copy=structuredClone(b);mutate(copy);assert.throws(()=>verify(copy));controls.push(name);}
 reject('omit robot leaf',c=>c.blocks.pop());reject('duplicate robot leaf',c=>c.blocks.push([...gateBounds[0]]));
 reject('solid diagonal bounding box',c=>{const[ax,az,bx,bz]=c.fences.find(([ax,az,bx,bz])=>ax!==bx&&az!==bz);c.blocks.push([(ax+bx)/2,(az+bz)/2,Math.abs(bx-ax)/2,Math.abs(bz-az)/2]);});
 reject('unexpected block fills gate gap',c=>c.blocks.push([0,0,2,2]));reject('wrong oriented fence',c=>c.fenceObstacles[0].hw+=.01);
 const report={status:'SUPPLEMENTAL_IDENTITY_AND_FENCE_CONTROLS_PASS_ORIGINAL_ASSERTION_REMAINS_FAIL',staticCount:staticBounds.length,publishedCount:b.blocks.length,gateBounds,extraBlocks:b.blocks.slice(staticBounds.length),exactExpected:true,fences:b.fences.length,negativeControls:controls,originalTest:'animal-pen-scene-registry.test.mjs line5 still expects blocks.length === site.obstacles.length (24!==22)',cause:'A21 deliberately registers entry/exit gate leaves; no diagonal fence was turned into an extra solid rectangle.',scope:'No production or original test edits'};
 fs.writeFileSync('farm3d/tests/evidence/pen-editing-implementation/task8-codex-boundary-final-20261025/registry-count-diagnosis.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));prepared.retire();
}finally{next.dispose();old.dispose();}
