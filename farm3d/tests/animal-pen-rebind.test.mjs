import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createRemainingCareController} from '../remaining-care-controller.js';
import {remainingCareLayouts} from '../remaining-care-layout.js';
import {createLiveAnimal} from '../live3d.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
function setup(){
 const layouts=remainingCareLayouts(),actors=['horse','sheep'].map(kind=>{const p=layouts[kind].turnouts[0],rig=createLiveAnimal(kind,kind==='horse'?2.3:1.2,p[0],p[2]);return{kind,ref:{type:'pen',i:0},g:rig.g,rig3d:rig,vel:new T.Vector2(),need:{hunger:0,tired:1}};});
 const care=createRemainingCareController({layouts,neighbours:()=>actors,active:()=>true,obstacles:()=>[],updateRig:()=>{}});
 return{actors,care,dispose:()=>actors.forEach(a=>a.rig3d.dispose())};
}
function moved(kind,dx,dz){const record=defaultSiteRecord(kind);for(const p of Object.values(record.structures)){p[0]+=dx;p[1]+=dz;}return resolveAnimalPens({v:1,revision:4,sites:{[kind]:record}}).sites[kind];}
test('resolved sites carry their immutable parent revision',()=>{const site=moved('horse',2,1);assert.equal(site.revision,4);assert(Object.isFrozen(site));});
test('remaining care preparation retains reservations and progress and moves an occupied unit exactly once',()=>{
 const f=setup();try{const a=f.actors[0];assert(f.care.request(a,'bed'));const task=a.remainingTask;Object.assign(task,{stage:'hold',weight:.8,held:6,nap:true,path:[[999,0,999]]});a.g.position.fromArray(task.station.dock);const old=a.g.position.toArray(),before=f.care.snapshotLayout(),site=moved('horse',2,1),placement=[old[0]+2,old[1],old[2]+1];
 const prepared=f.care.prepareLayoutRebind({site,actors:[{id:'horse-0',kind:'horse',position:old}],now:20,placements:{'horse-0':placement}});
 assert.deepEqual(f.care.snapshotLayout(),before);assert.deepEqual(a.g.position.toArray(),old);
 prepared.publish();prepared.publish();prepared.dispose();const after=f.care.snapshotLayout();
 assert.deepEqual(after.tokens,before.tokens);assert.equal(a.remainingTask,task);assert.equal(task.held,6);assert.equal(task.weight,.8);assert.equal(task.nap,true);assert.equal(task.stage,'hold');assert.equal(task.path,null);assert.deepEqual(task.station.dock,site.stations.find(s=>s.id===task.station.id).dock);assert.deepEqual(a.g.position.toArray(),placement);assert.equal(after.revisions.horse,4);
 }finally{f.dispose();}
});
test('preparing two species together cannot overwrite the other species published layout',()=>{
 const f=setup();try{for(const a of f.actors)assert(f.care.request(a,'bed'));
 const prepared=f.actors.map(a=>f.care.prepareLayoutRebind({site:moved(a.kind,1,1),actors:[],now:20,placements:{[a.kind+'-0']:a.g.position.toArray()}}));
 for(const p of prepared)p.publish();assert.deepEqual(f.care.snapshotLayout().revisions,{horse:4,sheep:4,dog:0,cat:0});
 for(const a of f.actors)assert.deepEqual(a.remainingTask.station.dock,moved(a.kind,1,1).stations.find(s=>s.id===a.remainingTask.station.id).dock);
 }finally{f.dispose();}
});
test('discarded preparation and missing placements cannot mutate live care',()=>{
 const f=setup();try{const a=f.actors[0];assert(f.care.request(a,'bed'));const before=f.care.snapshotLayout(),position=a.g.position.toArray();assert.throws(()=>f.care.prepareLayoutRebind({site:moved('horse',1,1),actors:[],now:20,placements:{}}),/placement/i);const p=f.care.prepareLayoutRebind({site:moved('horse',1,1),actors:[],now:20,placements:{'horse-0':position}});p.dispose();assert.throws(()=>p.publish(),/disposed/i);assert.deepEqual(f.care.snapshotLayout(),before);assert.deepEqual(a.g.position.toArray(),position);}finally{f.dispose();}
});

import {createChickenYard} from '../chicken-yard.js';
import {createChickenStationController} from '../chicken-stations.js';
import {createChicken3D} from '../chicken3d.js';
test('chicken rebind preserves bed reservation and held pose without retaining old yard resources',()=>{
 const yard=createChickenYard(),rig=createChicken3D(.72,-8,0),a={kind:'chicken',ref:{i:0},rig3d:rig,g:rig.g,vel:new T.Vector2(),need:{hunger:0,tired:1}};
 const care=createChickenStationController({yard,route:(a,b)=>[b],neighbours:()=>[a],updateRig:()=>{}});
 try{assert(care.request(a,'bed'));const task=a.chickenTask;Object.assign(task,{stage:'hold',weight:1,held:7,nap:false,access:true});a.g.position.fromArray(task.station.dock);care.scheduler.arrive(task.token);
 const site=moved('chicken',1,0),before=care.snapshotLayout(),old=a.g.position.toArray(),placement=[old[0]+1,old[1],old[2]];
 const prepared=care.prepareLayoutRebind({site,actors:[],now:30,placements:{'hen-0':placement},waiting:{'hen-0':[-7,0,0]}});
 assert.deepEqual(care.snapshotLayout(),before);assert.deepEqual(a.g.position.toArray(),old);prepared.publish();prepared.publish();
 assert.deepEqual(care.snapshotLayout().tokens,before.tokens);assert.deepEqual(care.snapshotLayout().lanes,before.lanes);assert.equal(a.chickenTask,task);assert.equal(task.held,7);assert.equal(task.weight,1);assert.deepEqual(a.g.position.toArray(),placement);assert.deepEqual(task.returnPoint,[-7,0,0]);
 yard.dispose();assert.equal(a.rig3d.sampleSupport(placement[0],placement[2]),placement[1]);
 }finally{yard.dispose();rig.dispose();}
});

test('a translated chicken enclosure completes three physical sleep and wake cycles outside old bounds',()=>{
 const record=defaultSiteRecord('chicken');for(const p of Object.values(record.structures))p[0]+=20;for(const p of record.boundary)p.x+=20;
 const site=resolveAnimalPens({v:1,revision:4,sites:{chicken:record}}).sites.chicken,yard=createChickenYard({layout:site}),rig=createChicken3D(.72,11.7,-4.9),a={kind:'chicken',ref:{i:0},rig3d:rig,g:rig.g,vel:new T.Vector2(),need:{hunger:0,tired:0},S:{walk:.8}};
 const care=createChickenStationController({yard,route:(a,b)=>[b],neighbours:()=>[a],updateRig:()=>{}});let t=0;
 try{for(let cycle=0;cycle<3;cycle++)for(const night of [true,false]){
  let complete=false;for(let n=0;n<5000;n++){const old=a.g.position.clone();t+=.1;care.update(a,.1,t,{night,wet:false,supplies:{feedMs:0,waterMs:0}});assert(Math.hypot(a.g.position.x-old.x,a.g.position.z-old.z)<=.06500001);assert(a.g.position.distanceTo(old)<.12);if(night?a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99:!a.chickenTask){complete=true;break;}}
  assert(complete,'cycle '+cycle+' night '+night+' '+JSON.stringify({position:a.g.position.toArray(),stage:a.chickenTask?.stage,path:a.chickenTask?.path}));
  if(!night)for(let n=0;n<400;n++){t+=.1;care.update(a,.1,t,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});}
 }}finally{yard.dispose();rig.dispose();}
});
