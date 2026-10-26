import test from 'node:test';
import assert from 'node:assert/strict';
import * as runtime from '../animal-pen-runtime.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';
const layout=resolveAnimalPens({v:1,revision:7,sites:{}});
const validation={ok:true,revision:7};
test('preparation does not publish; publish installs once and retires previous resources last',()=>{
 const events=[];let yards;
 const prepared=runtime.prepareAnimalPenRevision(layout,validation,{
  prepareCare(l,v){assert.equal(l,layout);assert.equal(v,validation);events.push('prepare');return[{publish(){events.push('care');},dispose(){events.push('discard care');}}];},
  publishRegistries(l,y,v){assert.equal(l,layout);assert.equal(v,validation);yards=y;events.push('registries');},
  disposePrevious(){events.push('retire');}
 });
 assert.deepEqual(events,['prepare']);assert.equal(prepared.revision,7);
 prepared.publish();prepared.publish();prepared.dispose();
 assert.deepEqual(events,['prepare','registries','care','retire']);assert.equal(Object.keys(yards).length,6);
 for(const y of Object.values(yards))y.dispose();
});
test('cancel disposes care once and cannot subsequently publish',()=>{
 const events=[];const prepared=runtime.prepareAnimalPenRevision(layout,validation,{prepareCare:()=>[{publish(){events.push('publish');},dispose(){events.push('dispose');}}],publishRegistries(){events.push('registries');},disposePrevious(){events.push('retire');}});
 prepared.dispose();prepared.dispose();assert.throws(()=>prepared.publish(),/disposed/i);assert.deepEqual(events,['dispose']);
});
test('invalid or stale validation cannot prepare resources or care',()=>{
 let calls=0;const live={prepareCare(){calls++;return[];}};
 for(const v of [{ok:false,revision:7},{ok:true,revision:6}])assert.throws(()=>runtime.prepareAnimalPenRevision(layout,v,live),/validation/i);
 assert.equal(calls,0);
});
test('publication failure is terminal and does not dispose possibly installed resources or old revision',()=>{
 const events=[];let yards;
 const prepared=runtime.prepareAnimalPenRevision(layout,validation,{prepareCare:()=>[{publish(){events.push('care');throw Error('care publication failure');},dispose(){events.push('discard');}}],publishRegistries(l,y){yards=y;events.push('registries');},disposePrevious(){events.push('retire');}});
 assert.throws(()=>prepared.publish(),/care publication failure/);prepared.dispose();assert.throws(()=>prepared.publish(),/failed/i);
 assert.deepEqual(events,['registries','care']);for(const y of Object.values(yards))y.dispose();
});
test('live registry preparation finishes before publication and is discarded on care preparation failure',()=>{
 const events=[];assert.throws(()=>runtime.prepareAnimalPenRevision(layout,validation,{prepareRegistries(){events.push('prepare registries');return {publish(){events.push('publish');},dispose(){events.push('discard registries');},retire(){events.push('retire');}};},prepareCare(){events.push('prepare care');throw Error('care prep fault');}}),/care prep fault/);assert.deepEqual(events,['prepare registries','prepare care','discard registries']);
});
test('prepared registry publishes before care and retires after care, with cancellation isolated',()=>{
 const events=[];let yards;const live={prepareRegistries(l,y){yards=y;events.push('prepare registries');return {publish(){events.push('registries');},retire(){events.push('retire');},dispose(){events.push('discard');}};},prepareCare(){return[{publish(){events.push('care');},dispose(){events.push('discard care');}}];}};
 const prepared=runtime.prepareAnimalPenRevision(layout,validation,live);assert.deepEqual(events,['prepare registries']);try{prepared.publish();prepared.dispose();assert.deepEqual(events,['prepare registries','registries','care','retire']);}finally{for(const y of Object.values(yards))y.dispose();}
});
