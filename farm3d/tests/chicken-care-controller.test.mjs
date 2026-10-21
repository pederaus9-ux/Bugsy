import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../lib/three.module.min.js';
import {createChickenYard} from '../chicken-yard.js';import {createChickenYard as createSingleDoorYard} from './fixtures/chicken-yard-single-door.mjs';import {createChicken3D,updateChicken3D} from '../chicken3d.js';
import fs from 'node:fs';import vm from 'node:vm';
let M={};try{M=await import('../chicken-stations.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
function setup(count=1,fullWorld=false,fixtureBlocks=null,singleDoor=false){const yard=(singleDoor?createSingleDoorYard:createChickenYard)(),hens=Array.from({length:count},(_,i)=>({ref:{i},g:null,rig3d:createChicken3D(.72,-8.3+(i%3)*.66,-4.9+Math.floor(i/3)*.66),need:{hunger:0,tired:0},vel:new T.Vector2(),S:{walk:.8},act:'idle'}));hens.forEach(a=>a.g=a.rig3d.g);assert.equal(typeof M.createChickenStationController,'function');
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('const toLocal ='),end=html.indexOf('const blocked =',start);
 const extraLine=html.split('\n').find(l=>l.includes('BLOCKS_EXTRA.push([x, z, r * .8')),extra=vm.runInNewContext(extraLine.match(/of (\[\[.*?\]\])/)[1]).map(([x,z,r])=>[x,z,r*.8,r*.8]),blockSource=html.slice(html.indexOf('const BLOCKS = '),html.indexOf('const cowBlockBounds='));
 const oldYard=[[-11.6,-2.2,2.5,2.9],[-11.6,1.55,.82,1.63],[-7.6,3,.65,.65],[-6,3.15,.65,.65],[-7.6,6.3,1.15,.88]];
 // Keep captured non-yard blockers; apply the owner-approved new yard footprint.
 const blocks=fixtureBlocks?[...fixtureBlocks.filter(b=>!oldYard.some(q=>q.every((v,i)=>v===b[i]))),...yard.layout.obstacles]:(fullWorld?vm.runInNewContext(blockSource+';BLOCKS',{BLOCKS_EXTRA:extra,CHICKEN_YARD_LAYOUT:yard.layout}):yard.layout.obstacles);const OBST=blocks.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0}));if(fullWorld)for(const[ax,az,bx,bz]of yard.layout.fenceSegments){const angle=Math.atan2(bz-az,bx-ax);OBST.push({x:(ax+bx)/2,z:(az+bz)/2,hw:Math.hypot(bx-ax,bz-az)/2,hd:.1,c:Math.cos(angle),s:Math.sin(angle)});}
 const actualRoute=vm.runInNewContext(html.slice(start,end)+';route',{THREE:T,OBST,PENS:{courtyard:{}},HOME:new T.Vector2(1,3),ROAM:19,fitsPen:(_,x,z)=>x>-16.2&&x<-5.2&&z>-5.5&&z<4.7});
 const routes=[];const observedRoute=(...args)=>{const out=actualRoute(...args);routes.push({from:args[0].toArray(),to:args[1].toArray(),avoid:args[4]?.length||0,path:out.map(p=>p.toArray())});return out;};const care=M.createChickenStationController({yard,route:observedRoute,clearPoint:(x,z)=>!fullWorld||yard.sampleStationSupport(yard.stations[0].id,x,z).inside||!blocks.some(b=>!yard.layout.obstacles.some(q=>q.every((v,i)=>v===b[i]))&&Math.abs(x-b[0])<b[2]+.18&&Math.abs(z-b[1])<b[3]+.18),neighbours:()=>hens,updateRig:(r,dx,dz,dt)=>updateChicken3D(r,dx,dz,dt,'walk')});return {yard,hens,care,routes,dispose(){hens.forEach(a=>a.rig3d.dispose());yard.dispose();}};}
test('physical visit walks to reserved feed, stops, then releases without changing game supplies',()=>{const x=setup(),a=x.hens[0];try{const supplies={feedMs:100000,waterMs:100000,total:3},before=JSON.stringify(supplies);assert(x.care.request(a,'feed'));const start=a.g.position.clone();let held=false;for(let i=0;i<1800;i++){x.care.update(a,1/60,i/60,{night:false,wet:false,supplies});held||=a.chickenTask?.stage==='hold';if(held&&!a.chickenTask)break;}assert(held);assert(a.g.position.distanceTo(start)>1);assert.equal(a.chickenTask,null);assert.equal(x.care.scheduler.snapshot().length,0);assert.equal(JSON.stringify(supplies),before);}finally{x.dispose();}});
test('thirty hens queue through the ramp to distinct beds and walk back out on waking',()=>{const x=setup(30);try{let last=x.hens.map(a=>a.g.position.clone());for(let i=0;i<18000;i++){for(const a of x.hens)x.care.update(a,.1,i*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});for(let n=0;n<30;n++){const a=x.hens[n];assert.ok(a.g.position.distanceTo(last[n])<.12,'care must not teleport');last[n].copy(a.g.position);}if(x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99))break;}assert.equal(x.care.scheduler.snapshot().length,30);assert(x.hens.every(a=>a.chickenTask?.stage==='hold'),'every hen reaches a bed: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='waiting').map(a=>({i:a.ref.i,stage:a.chickenTask?.stage,p:a.g.position.toArray(),next:a.chickenTask?.path?.[0],blocked:a.chickenTask?.blocked}))));for(const a of x.hens){assert.equal(a.act,'sleeping');assert.ok(a.g.position.y>.6);}
 for(let i=0;i<18000;i++){for(const a of x.hens)x.care.update(a,.1,1800+i*.1,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});if(x.hens.every(a=>!a.chickenTask))break;}assert(x.hens.every(a=>!a.chickenTask),'every hen exits: '+JSON.stringify(x.hens.filter(a=>a.chickenTask).map(a=>({i:a.ref.i,stage:a.chickenTask?.stage,p:a.g.position.toArray(),next:a.chickenTask?.path?.[0],blocked:a.chickenTask?.blocked}))));assert.equal(x.care.scheduler.snapshot().length,0);assert(x.hens.every(a=>Math.abs(a.g.position.y)<1e-8));}finally{x.dispose();}});
test('empty stations never start a feeding or drinking visit; removed animals release occupancy',()=>{const x=setup(),a=x.hens[0];try{a.need.hunger=1;for(let i=0;i<20;i++)x.care.update(a,.1,i*.1,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});assert.equal(x.care.scheduler.snapshot().length,0);assert(x.care.request(a,'bed'));x.care.release(a);assert.equal(x.care.scheduler.snapshot().length,0);assert.equal(a.chickenTask,null);}finally{x.dispose();}});
test('nearby ordinary spawn positions do not make waking hens compete for one return point',()=>{const x=setup(2);try{x.hens[1].g.position.copy(x.hens[0].g.position).add(new T.Vector3(.05,0,0));for(const night of [true,false]){for(let i=0;i<6000;i++){for(const a of x.hens)x.care.update(a,.1,(night?0:600)+i*.1,{night,wet:false,supplies:{feedMs:0,waterMs:0}});if(night?x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99):x.hens.every(a=>!a.chickenTask))break;}assert(night?x.hens.every(a=>a.chickenTask?.stage==='hold'):x.hens.every(a=>!a.chickenTask),'crowded spawn must enter and exit');}assert.ok(x.hens[0].g.position.distanceTo(x.hens[1].g.position)>=.34);}finally{x.dispose();}});
test('a tired hen can finish a physical daytime coop nap before standing and leaving',()=>{const x=setup(),a=x.hens[0];try{a.need.tired=1;let settled=false;for(let i=0;i<3000;i++){x.care.update(a,.1,i*.1,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});settled||=a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99;if(settled&&!a.chickenTask)break;}assert(settled,'daytime rest must actually settle in bedding');assert.equal(a.chickenTask,null);assert.equal(a.need.tired,0);}finally{x.dispose();}});

test('the retained native thirty-hen blockage reaches the coop without moving waiting birds through obstacles',()=>{const x=setup(30,true);try{const observed=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-blocked-flock.json',import.meta.url),'utf8'));for(let i=0;i<30;i++)x.hens[i].g.position.fromArray(observed[i].p);for(let n=0;n<18000;n++){for(const a of x.hens)x.care.update(a,.1,n*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});if(x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99))break;}assert(x.hens.every(a=>a.chickenTask?.stage==='hold'),'routes='+JSON.stringify(x.routes.slice(-4))+'; retained native flock still blocked: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='waiting').map(a=>({i:a.ref.i,p:a.g.position.toArray(),stage:a.chickenTask?.stage,next:a.chickenTask?.path?.[0],replans:a.chickenTask?.replans,blocked:a.chickenTask?.blocked}))));}finally{x.dispose();}});

test('retained overlapping neighbours allow a bounded physical escape at30/60/120Hz',()=>{const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-neighbour-overlap.json',import.meta.url),'utf8'));for(const hz of [30,60,120]){const x=setup(30,true,fixture.blocks);try{for(const observed of fixture.hens)x.hens[observed.i].g.position.fromArray(observed.p);const a=x.hens[fixture.active],initial=a.g.position.clone();assert(x.care.request(a,'bed'));a.chickenTask.stage='approach';a.chickenTask.path=structuredClone(fixture.hens[fixture.active].path);a.chickenTask.replans=3;for(let i=0;i<5*hz;i++){const before=a.g.position.clone();x.care.update(a,1/hz,i/hz,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});assert.ok(a.g.position.distanceTo(before)<=.66/hz,'no escape teleport');}assert.ok(a.g.position.distanceTo(initial)>.8,'must escape retained crowd at'+hz+'Hz: '+a.g.position.toArray());assert(x.hens.every(b=>b===a||a.g.position.distanceTo(b.g.position)>=.34),'escaped hen must keep original bird clearance');}finally{x.dispose();}}});

test('ground return routes cannot re-enter raised coop access after the exit is clear',()=>{const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-exit-access.json',import.meta.url),'utf8'));const x=setup(30,true,fixture.blocks,true);try{for(const observed of fixture.hens)x.hens[observed.i].g.position.fromArray(observed.p);const a=x.hens[fixture.active];a.g.position.set(-11.6,0,3.55);assert(x.care.request(a,'bed'));a.chickenTask.stage='exit';a.chickenTask.path=[structuredClone(fixture.hens[fixture.active].returnPoint)];for(let i=0;i<900;i++){x.care.update(a,1/60,i/60,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});assert.ok(Math.abs(a.g.position.y)<1e-8,'ground return must not climb back onto ramp');if(!a.chickenTask)break;}assert.equal(a.chickenTask,null,'ground return completes: '+JSON.stringify({p:a.g.position.toArray(),path:a.chickenTask?.path,blocked:a.chickenTask?.blocked}));}finally{x.dispose();}});
test('the full wake queue leaves safely before new cosmetic feed/drink/nap admissions resume',()=>{const x=setup(2),supplies={feedMs:100000,waterMs:100000};try{for(let i=0;i<3000;i++){for(const a of x.hens)x.care.update(a,.1,i*.1,{night:true,wet:false,supplies});if(x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99))break;}for(const a of x.hens){a.need.hunger=1;a.chickenDrinkAt=0;}let now=300;for(let i=0;i<6000;i++){now+=.1;for(const a of x.hens)x.care.update(a,.1,now,{night:false,wet:false,supplies});const leaving=x.hens.some(a=>a.chickenTask?.kind==='bed'&&!a.chickenTask.nap);if(leaving)assert(x.hens.every(a=>!a.chickenTask||a.chickenTask.kind==='bed'),'new station visits must yield to wake exits');if(x.hens.every(a=>!a.chickenTask))break;}assert.equal(x.care.scheduler.snapshot().length,0,'all original sleep reservations released');for(const a of x.hens){a.need.hunger=1;x.care.update(a,.1,now+3,{night:false,wet:false,supplies});}assert(x.hens.some(a=>a.chickenTask?.kind==='feed'),'normal care resumes after waking');}finally{x.dispose();}});
test('ordinary emotes finish their lifetime while a physical care task owns movement',()=>{const x=setup(),a=x.hens[0];a.emoteT=.2;a.bubble=new T.Sprite(new T.SpriteMaterial());a.bubble.visible=true;try{assert(x.care.request(a,'feed'));for(let i=0;i<4;i++)x.care.update(a,.1,i*.1,{night:false,wet:false,supplies:{feedMs:100000,waterMs:100000}});assert.equal(a.bubble.visible,false,'old emote must expire during care');assert.equal(a.emoteT,0);}finally{a.bubble.material.dispose();x.dispose();}});

test('ordinary yard targets cannot use the flat ramp guard carve reserved for access legs',()=>{const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-ground-guard.json',import.meta.url),'utf8')),x=setup(30,true,fixture.blocks);try{for(const observed of fixture.hens)x.hens[observed.i].g.position.fromArray(observed.p);const a=x.hens[fixture.active];a.g.position.set(-11.6,0,3.55);assert(x.care.request(a,'bed'));a.chickenTask.stage='exit';a.chickenTask.path=[structuredClone(fixture.hens[fixture.active].returnPoint)];const[bx,bz,hw,hd]=x.yard.layout.obstacles[1];for(let i=0;i<900;i++){x.care.update(a,1/60,i/60,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});assert.ok(!(Math.abs(a.g.position.x-bx)<hw+.18&&Math.abs(a.g.position.z-bz)<hd+.18),'ordinary return must respect the ramp collision guard');if(!a.chickenTask)break;}assert.equal(a.chickenTask,null,'actual captured ground destination reached');}finally{x.dispose();}});

test('two doors admit and release birds concurrently while each lane stays exclusive',()=>{const x=setup(30);try{let concurrentIn=false,concurrentOut=false;for(const night of [true,false]){for(let n=0;n<18000;n++){for(const a of x.hens)x.care.update(a,.1,(night?0:1800)+n*.1,{night,wet:false,supplies:{feedMs:0,waterMs:0}});const moving=x.hens.filter(a=>a.chickenTask?.kind==='bed'&&['approach','align','exit'].includes(a.chickenTask.stage));const lanes=moving.map(a=>a.chickenTask.station.lane);assert.equal(new Set(lanes).size,lanes.length,'one active bird per doorway');if(moving.length===2){if(night)concurrentIn=true;else concurrentOut=true;}if(night?x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99):x.hens.every(a=>!a.chickenTask))break;}assert(night?x.hens.every(a=>a.chickenTask?.stage==='hold'):x.hens.every(a=>!a.chickenTask),'both lanes must complete '+night+': '+JSON.stringify(x.hens.filter(a=>night?a.chickenTask?.stage!=='hold':a.chickenTask).map(a=>({i:a.ref.i,p:a.g.position.toArray(),stage:a.chickenTask?.stage,path:a.chickenTask?.path,blocked:a.chickenTask?.blocked}))));}assert(concurrentIn,'both entrances must work at the same time');assert(concurrentOut,'both exits must work at the same time');assert.equal(x.care.scheduler.snapshot().length,0);}finally{x.dispose();}});

test('retained second-bedtime crowd yields physically instead of enclosing the active entrant',()=>{const f=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-second-bedtime.json',import.meta.url),'utf8')).failureState,x=setup(30,true);try{for(const observed of f.hens){const a=x.hens[observed.i];a.g.position.fromArray(observed.p);assert(x.care.request(a,'bed'));if(observed.stage==='hold'){a.chickenTask.stage='hold';a.chickenTask.weight=1;a.g.position.fromArray(a.chickenTask.station.dock);x.care.scheduler.arrive(a.chickenTask.token);}}let yielded=false;for(let n=0;n<18000;n++){for(const a of x.hens){const before=a.g.position.clone(),waiting=a.chickenTask?.stage==='waiting';x.care.update(a,.1,n*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});assert.ok(a.g.position.distanceTo(before)<.12,'no queue teleport');yielded||=waiting&&a.g.position.distanceTo(before)>.001;}if(x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99))break;}assert(yielded,'waiting birds must make room');assert(x.hens.every(a=>a.chickenTask?.stage==='hold'),'captured second bedtime must settle all30: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='hold').map(a=>({i:a.ref.i,p:a.g.position.toArray(),stage:a.chickenTask?.stage,path:a.chickenTask?.path,blocked:a.chickenTask?.blocked}))));}finally{x.dispose();}});

test('every feed and water place remains physically reachable beside both access ramps',()=>{const definition=createChickenYard(),slots=definition.stations.filter(s=>s.kind!=='bed');definition.dispose();for(const slot of slots){const x=setup(1,true),a=x.hens[0];try{a.g.position.set(-7.8,0,.5);for(const other of slots.filter(s=>s.kind===slot.kind&&s.id!==slot.id))assert(x.care.scheduler.request('occupied-'+other.id,other.kind,other.id));assert(x.care.request(a,slot.kind));assert.equal(a.chickenTask.station.id,slot.id);for(let n=0;n<1200;n++){x.care.update(a,.1,n*.1,{night:false,wet:false,supplies:{feedMs:100000,waterMs:100000}});if(a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99)break;}assert.equal(a.chickenTask?.stage,'hold',slot.id+' unreachable at '+a.g.position.toArray());}finally{x.dispose();}}});

test('retained wake return north of the barn stays accessible beside the enlarged coop',()=>{const x=setup(1,true),a=x.hens[0],target=[-7.088880707500912,0,-5.217853876912522];try{a.g.position.fromArray(x.yard.accesses[1].outside);assert(x.care.request(a,'bed'));Object.assign(a.chickenTask,{stage:'exit',path:[target],groundGoal:target,groundTail:[],groundLeg:true});for(let n=0;n<600;n++){const before=a.g.position.clone();x.care.update(a,.1,n*.1,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});assert.ok(a.g.position.distanceTo(before)<.066,'no wake-return teleport');assert.equal(a.g.position.y,0);if(!a.chickenTask)break;}assert.equal(a.chickenTask,null,'retained north return blocked at '+a.g.position.toArray());assert.equal(x.care.scheduler.snapshot().length,0);}finally{x.dispose();}});

// Immutable actual-game failure from head ab61c9a, artifact12342799742.
test('retained portrait full flock clears the feeder pocket and reaches all thirty beds',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-dual-door-portrait.json',import.meta.url),'utf8')).failureState;
 const x=setup(30,true,f.blocks);
 try{
  for(const observed of f.hens)x.hens[observed.i].g.position.fromArray(observed.p);
  for(const token of f.stations){
   const a=x.hens[Number(token.animalId.slice(4))],observed=f.hens.find(h=>h.i===a.ref.i);
   assert(x.care.request(a,'bed'));assert.equal(a.chickenTask.station.id,token.stationId);
   a.chickenTask.returnPoint=structuredClone(observed.returnPoint);
   if(observed.stage==='hold'){a.chickenTask.stage='hold';a.chickenTask.weight=1;x.care.scheduler.arrive(a.chickenTask.token);}
  }
  for(let n=0;n<18000;n++){
   for(const a of x.hens){const before=a.g.position.clone();x.care.update(a,.1,n*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});assert(Math.hypot(a.g.position.x-before.x,a.g.position.z-before.z)<=.06500001,'entry must retain horizontal speed');assert(a.g.position.distanceTo(before)<.12,'no ramp teleport');}
   if(x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99))break;
  }
  assert(x.hens.every(a=>a.chickenTask?.stage==='hold'),'captured portrait flock remains blocked: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='hold').map(a=>({i:a.ref.i,p:a.g.position.toArray(),stage:a.chickenTask?.stage,path:a.chickenTask?.path,replans:a.chickenTask?.replans}))));
 }finally{x.dispose();}
});

for(const hz of [30,60,120])test('portrait crowd completes three sleep/wake cycles at '+hz+'Hz',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-dual-door-portrait.json',import.meta.url),'utf8')).failureState;
 const x=setup(30,true,f.blocks);
 try{
  for(const observed of f.hens)x.hens[observed.i].g.position.fromArray(observed.p);
  for(const token of f.stations){
   const a=x.hens[Number(token.animalId.slice(4))],observed=f.hens.find(h=>h.i===a.ref.i);
   assert(x.care.request(a,'bed'));assert.equal(a.chickenTask.station.id,token.stationId);
   a.chickenTask.returnPoint=structuredClone(observed.returnPoint);
   if(observed.stage==='hold'){a.chickenTask.stage='hold';a.chickenTask.weight=1;x.care.scheduler.arrive(a.chickenTask.token);}
  }
  for(let cycle=0;cycle<3;cycle++)for(const night of [true,false]){
  for(let n=0;n<1800*hz;n++){
   for(const a of x.hens){const before=a.g.position.clone();x.care.update(a,1/hz,(cycle*3600+(night?0:1800))+n/hz,{night,wet:false,supplies:{feedMs:0,waterMs:0}});assert(Math.hypot(a.g.position.x-before.x,a.g.position.z-before.z)<=.65/hz+1e-8,'entry must retain horizontal speed');assert(a.g.position.distanceTo(before)<.12,'no ramp teleport');}
   if(night?x.hens.every(a=>a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99):x.hens.every(a=>!a.chickenTask))break;
  }
  assert(night?x.hens.every(a=>a.chickenTask?.stage==='hold'):x.hens.every(a=>!a.chickenTask),'cycle'+cycle+' night'+night+' captured portrait flock remains blocked: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='hold').map(a=>({i:a.ref.i,p:a.g.position.toArray(),stage:a.chickenTask?.stage,path:a.chickenTask?.path,replans:a.chickenTask?.replans}))));
  if(night){const beds=x.hens.map(a=>a.chickenTask.station.id);assert.equal(new Set(beds).size,30,'separate reserved beds');}else assert.equal(x.care.scheduler.snapshot().length,0,'all exit reservations released');
 }
 }finally{x.dispose();}
});

test('a departed idle bird yields from the waking flock return corridor',()=>{
 const x=setup(2,true),a=x.hens[0],idle=x.hens[1],goal=[-5.65,0,4.602627944162882];
 try{
  a.g.position.set(-9.5,0,2.75);idle.g.position.set(-7.45,0,4.602627944162882);assert(x.care.request(a,'bed'));
  Object.assign(a.chickenTask,{stage:'exit',path:[goal],groundGoal:goal,groundTail:[],groundLeg:true});
  let yielded=false;for(let n=0;n<1200;n++){for(const bird of x.hens){const before=bird.g.position.clone();x.care.update(bird,.05,n*.05,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});assert(Math.hypot(bird.g.position.x-before.x,bird.g.position.z-before.z)<=.03250001);if(bird===idle)yielded||=bird.g.position.distanceTo(before)>.001;}if(!a.chickenTask)break;}
  assert(yielded,'departed birds must make room for the remaining flock');assert.equal(a.chickenTask,null,'waking bird must finish its ground return');assert.equal(x.care.scheduler.snapshot().length,0);
 }finally{x.dispose();}
});

test('a legal north-boundary position can leave the strip behind the coop',()=>{
 const x=setup(1,true),a=x.hens[0];try{
  a.g.position.set(-10.592485780781036,0,-5.430030867704881);assert(x.care.request(a,'bed'));
  for(let n=0;n<1200;n++){const before=a.g.position.clone();x.care.update(a,.05,n*.05,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});assert(Math.hypot(a.g.position.x-before.x,a.g.position.z-before.z)<=.03250001);if(a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99)break;}
  assert.equal(a.chickenTask?.stage,'hold','north boundary strip must connect to the traversable yard: '+a.g.position.toArray());
 }finally{x.dispose();}
});

test('idle traffic yielding still expires an existing interaction emote',()=>{
 const x=setup(2,true),a=x.hens[0],idle=x.hens[1],goal=[-5.65,0,4.602627944162882];
 idle.emoteT=.2;idle.bubble=new T.Sprite(new T.SpriteMaterial());idle.bubble.visible=true;
 try{a.g.position.set(-9.5,0,2.75);idle.g.position.set(-7.45,0,4.602627944162882);assert(x.care.request(a,'bed'));Object.assign(a.chickenTask,{stage:'exit',path:[goal],groundGoal:goal,groundTail:[],groundLeg:true});
 let handled=0;for(let n=0;n<1200;n++){x.care.update(a,.05,n*.05,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}});if(x.care.update(idle,.05,n*.05,{night:false,wet:false,supplies:{feedMs:0,waterMs:0}})&&++handled===5)break;}assert(handled>=5);assert.equal(idle.emoteT,0);assert.equal(idle.bubble.visible,false);
 }finally{idle.bubble.material.dispose();x.dispose();}
});

test('one doorway can admit a daytime nap while the other releases a waking bird',()=>{
 const x=setup(2,true),a=x.hens[0],b=x.hens[1],supplies={feedMs:0,waterMs:0};
 try{
  a.g.position.set(-11.6,0,4.5);b.g.position.set(-8.2,0,1.9);assert(x.care.request(a,'bed'));
  for(let n=0;n<18000;n++){x.care.update(a,.1,n*.1,{night:true,wet:false,supplies});if(a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99)break;}
  assert.equal(a.chickenTask?.stage,'hold');b.need.tired=1;assert(x.care.request(b,'bed'));b.chickenTask.nap=true;
  let mixed=false,arrived=false;for(let n=0;n<18000;n++){
   for(const bird of x.hens)x.care.update(bird,.1,1800+n*.1,{night:false,wet:false,supplies});
   if(a.chickenTask?.stage==='exit'&&b.chickenTask?.stage==='approach'){assert.notEqual(a.chickenTask.station.lane,b.chickenTask.station.lane);mixed=true;}
   arrived||=b.chickenTask?.stage==='hold'&&b.chickenTask.weight>.99;
   if(arrived&&x.hens.every(bird=>!bird.chickenTask))break;
  }
  assert(mixed,'entry and exit must coexist in different doorways');assert(arrived,'nap reaches its supported bed');assert(x.hens.every(bird=>!bird.chickenTask));assert.equal(x.care.scheduler.snapshot().length,0);
 }finally{x.dispose();}
});

test('a daytime nap joins the overnight flock and wake exits exclude new care admissions',()=>{
 const x=setup(3),a=x.hens[0],supplies={feedMs:100000,waterMs:100000};try{
  a.need.tired=1;for(let n=0;n<3000;n++){x.care.update(a,.1,n*.1,{night:false,wet:false,supplies});if(a.chickenTask?.stage==='hold'&&a.chickenTask.weight>.99)break;}
  assert.equal(a.chickenTask?.stage,'hold');assert.equal(a.chickenTask.nap,true);
  for(let n=0;n<18000;n++){for(const bird of x.hens)x.care.update(bird,.1,300+n*.1,{night:true,wet:false,supplies});if(x.hens.every(bird=>bird.chickenTask?.stage==='hold'&&bird.chickenTask.weight>.99))break;}
  assert.equal(a.chickenTask.nap,false,'nightfall must promote an existing day nap to overnight rest');
  for(const bird of x.hens){bird.need.hunger=1;bird.chickenDrinkAt=0;}
  for(let n=0;n<18000;n++){for(const bird of x.hens)x.care.update(bird,.1,2100+n*.1,{night:false,wet:false,supplies});if(x.hens.some(bird=>bird.chickenTask?.kind==='bed'))assert(x.hens.every(bird=>!bird.chickenTask||bird.chickenTask.kind==='bed'),'no new care while overnight flock still leaving');if(x.hens.every(bird=>!bird.chickenTask))break;}
  assert(x.hens.every(bird=>!bird.chickenTask),'the complete overnight flock wakes and exits');assert.equal(x.care.scheduler.snapshot().length,0);
 }finally{x.dispose();}
});


// Actual native844 failure: a late allocation behind a sleeping neighbour.
test('late interior entry reaches its free bed without traversing a sleeping neighbour',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-interior-late-entry.json',import.meta.url),'utf8')).failureState;
 const active=f.hens.find(h=>h.i===8),sleeper=f.hens.find(h=>h.i===2),x=setup(2,true,f.blocks),a=x.hens[0],b=x.hens[1];
 try{assert(x.care.scheduler.restore([{stationId:'hen-bed-0',animalId:'hen-0',generation:1,arrived:false},{stationId:'hen-bed-4',animalId:'hen-1',generation:2,arrived:true}]));a.g.position.fromArray(active.p);b.g.position.fromArray(sleeper.p);assert(x.care.request(a,'bed'));assert(x.care.request(b,'bed'));Object.assign(a.chickenTask,{stage:'approach',path:structuredClone(active.path),groundLeg:false,access:true});Object.assign(b.chickenTask,{stage:'hold',weight:1,held:100,access:true});
  assert(a.g.position.distanceTo(b.g.position)>=.34);for(let n=0;n<18000;n++){const before=a.g.position.clone();x.care.update(a,.1,n*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});x.care.update(b,.1,n*.1,{night:true,wet:false,supplies:{feedMs:0,waterMs:0}});assert(a.g.position.distanceTo(before)<=.06500001,'no interior teleport');assert(a.g.position.distanceTo(b.g.position)>=.34-1e-9,'sleeping body clearance');if(a.chickenTask?.stage==='hold')break;}
  assert.equal(a.chickenTask?.stage,'hold','late entrant remains blocked by occupied authored waypoint: '+JSON.stringify({p:a.g.position.toArray(),path:a.chickenTask?.path}));assert.equal(b.chickenTask.stage,'hold');assert.deepEqual(b.g.position.toArray(),sleeper.p,'sleeper must stay in its own bed');
 }finally{x.dispose();}
});

test('the complete captured late-entry flock reaches all thirty separate beds',()=>{
 const f=JSON.parse(fs.readFileSync(new URL('./fixtures/chicken-care-interior-late-entry.json',import.meta.url),'utf8')).failureState,x=setup(30,true,f.blocks);
 try{assert(x.care.scheduler.restore(f.stations));for(const h of f.hens)x.hens[h.i].g.position.fromArray(h.p);
  for(const h of f.hens){const a=x.hens[h.i];assert(x.care.request(a,h.kind));assert.equal(a.chickenTask.station.id,f.stations.find(s=>s.animalId==='hen-'+h.i).stationId);Object.assign(a.chickenTask,{stage:h.stage,path:structuredClone(h.path),returnPoint:structuredClone(h.returnPoint),weight:h.stage==='hold'?1:0,held:h.stage==='hold'?100:0,groundLeg:h.p[1]<.1,access:h.p[1]>.1});}
  const entrant=x.hens[8],observed=f.hens.find(h=>h.i===8);entrant.chickenTask.stage='waiting';x.care.update(entrant,0,0,{night:true,wet:false,supplies:{feedMs:100000,waterMs:100000}});assert.equal(entrant.chickenTask.stage,'approach');Object.assign(entrant.chickenTask,{path:structuredClone(observed.path),groundLeg:false,access:true});
  for(let n=0;n<18000;n++){for(const a of x.hens){const before=a.g.position.clone();x.care.update(a,.1,n*.1,{night:true,wet:false,supplies:{feedMs:100000,waterMs:100000}});assert(Math.hypot(a.g.position.x-before.x,a.g.position.z-before.z)<=.06500001,'original horizontal speed');assert(a.g.position.distanceTo(before)<.12,'no ramp teleport');}if(x.hens.every(a=>a.chickenTask?.kind==='bed'&&a.chickenTask.stage==='hold'&&a.chickenTask.weight>.99))break;}
  assert(x.hens.every(a=>a.chickenTask?.kind==='bed'&&a.chickenTask.stage==='hold'),'captured late-entry flock remains blocked: '+JSON.stringify(x.hens.filter(a=>a.chickenTask?.stage!=='hold').map(a=>({i:a.ref.i,p:a.g.position.toArray(),path:a.chickenTask?.path}))));assert.equal(new Set(x.hens.map(a=>a.chickenTask.station.id)).size,30);
 }finally{x.dispose();}
});
