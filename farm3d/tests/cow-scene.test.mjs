import {cowPenSupportHeight,cowPenStep,applyCowPenSupport} from '../animal-pen-cow-support.js';
import {farmGroundY} from '../farm-land.js';
import {createCowPenCareAdapter} from '../animal-pen-cow-adapter.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
import {prepareCowStroll} from './cow-rig-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as THREE from '../lib/three.module.min.js';import * as Cow3D from '../cow3d.js';import {createCowYard,COW_YARD_LAYOUT} from '../cow-yard.js';import {createStationScheduler} from '../animal-stations.js';import {createCowDockGate} from '../cow-stations.js';import {getAnimalCarePose} from '../animal-care-poses.js';import {G,reset,at,T} from './chicken-game-fixture.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function scene(n=1,north=0){const s=reset(1);s.pens.cow={owned:true,list:Array(n).fill(0),meta:Array.from({length:n},(_,i)=>({name:'Scene Cow '+i,love:50,loveAt:T}))};s.barn.cow_feed=n;G.fillCowFeed(n);G.fillCowWater();at(T+180000);G.settleCows(true);const y=createCowYard({north}),PENS={courtyard:{poly:y.layout.polygon}},animals=[];const c={cowPenSupportHeight,cowPenStep,applyCowPenSupport,groundY:farmGroundY,installedAnimalPens:resolveAnimalPens(),createCowPenCareAdapter,syncRemainingCareYards:()=>{},THREE,Cow3D,G,COW_YARD_LAYOUT:y.layout,cowYard:y,cowYardActive:true,cowStatus:G.getCowCareStatus(),cowStations:createStationScheduler(y.stations),cowStationById:new Map(y.stations.map(s=>[s.id,s])),cowSurfaces:new Map(),createCowDockGate,getAnimalCarePose,animals,PRESET:{},clockT:0,nowMs:()=>Date.now(),PENS,HOME:new THREE.Vector2(1,3),ROAM:19,OBST:y.layout.obstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0})),fitsPen:(p,x,z,m)=>x>=p.poly[0][0]+m&&x<=p.poly[1][0]-m&&z>=p.poly[0][1]+m&&z<=p.poly[2][1]-m};c.syncCowYard=()=>{c.cowStatus=G.getCowCareStatus();};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('const toLocal ='),html.indexOf('const blocked =')),c);vm.runInContext(html.slice(html.indexOf('function cowIdOf('),html.indexOf('bootStep("making the sky")')),c);
for(let i=0;i<n;i++){const b=y.stations[i],r=Cow3D.createCow3D(1.7,b.dock[0],b.dock[2],'scene-'+i);r.g.position.y=.08;const a={kind:'cow',ref:{i},rig3d:r,g:r.g,vel:new THREE.Vector2(),need:{hunger:0,tired:0},S:{walk:.8},get pos(){return new THREE.Vector2(this.g.position.x,this.g.position.z);}};animals.push(a);}return{c,y,s};}
test('actual scene adapter walks each bay to the robot without crossing static walls and credits once after docking',()=>{for(const north of [0,25])for(const bay of [0,1,2,3,4]){const{c,y,s}=scene(5,north),a=c.animals[bay],id=c.cowStatus.cows[bay].id;assert(G.milkCow(id));c.syncCowYard();assert(c.chooseCowTask(a));y.group.updateMatrixWorld(true);const solid=[];y.group.traverse(o=>{if(o.isMesh)solid.push(o);});let docked=false,credited=false;for(let i=0;i<3600;i++){at(T+180000+i*1000/60);c.clockT=i/60;G.settleCows(true);c.syncCowYard();const before=a.g.position.clone().setY(.55);if(a.cowTask)c.updateCowTask(a,1/60,c.clockT);const delta=a.g.position.clone().setY(.55).sub(before),len=delta.length();if(len>.0001){const hit=new THREE.Raycaster(before,delta.normalize(),0,len).intersectObjects(solid,false)[0];assert(!hit,'actual model collision from bay '+bay+' at '+a.g.position.toArray());}const state=G.getCowCareStatus();if(state.job?.stage==='milking')docked=true;if(state.tank.normal===1)credited=true;assert.equal(state.tank.normal,credited?1:0);if(!a.cowTask&&credited)break;}assert(docked,'never docked from bed '+bay);assert(credited,'never credited from bed '+bay);assert.equal(G.getCowCareStatus().job,null,'never cleared exit '+bay);assert.equal(s.barn.milk,undefined);for(const b of c.animals)b.rig3d.dispose();y.dispose();}});
test('restoring an already-docked job rebuilds its cow at the saved physical dock, not another walk through the entry',()=>{const{c,y}=scene(1),id=c.cowStatus.cows[0].id;assert(G.milkCow(id));assert(G.reportCowRobotDock(G.getCowCareStatus().job.id));G.save();G.load();c.syncCowYard();c.animals.length=0;c.syncChickenYard=()=>{};c.scene={remove(){}};c.rnd=()=>.5;c.persOf=()=> 'Calm';c.PERSONALITY={Calm:{}};c.PENS.courtyard.bed=COW_YARD_LAYOUT.bed;c.penOf=()=>c.PENS.courtyard;c.freePoint=()=>new THREE.Vector2();c.Beast=function(kind,name,pers,x,z,ref){Object.assign(this,{kind,name,pers,ref,g:new THREE.Group()});this.g.position.set(x,0,z);};vm.runInContext(html.slice(html.indexOf('const refKey ='),html.indexOf('let chickenPreview=')),c);c.syncHerd();assert.deepEqual(c.animals.find(a=>a.kind==='cow').g.position.toArray(),COW_YARD_LAYOUT.robot.dock);y.dispose();});
test('a sleeping cow stands before walking and night/rain cannot cancel its requested robot visit',()=>{const{c,y}=scene(1),a=c.animals[0];c.PRESET.night=true;a.cowDrinkAt=9e15;assert(c.chooseCowTask(a));for(let i=0;i<600;i++){c.clockT=i/60;c.updateCowTask(a,1/60,c.clockT);}assert.equal(a.cowTask.kind,'bed');assert.equal(a.cowTask.weight,1);assert(a.rig3d.body.position.y<.5);assert(G.milkCow(c.cowStatus.cows[0].id));c.syncCowYard();let stood=false,docked=false;for(let i=0;i<3600;i++){at(T+190000+i*1000/60);c.clockT=10+i/60;if(i===100)c.PRESET={night:false,rain:true};G.settleCows(true);c.syncCowYard();const wasLying=a.cowTask?.kind==='bed'&&a.cowTask.weight>0,old=a.g.position.clone();if(a.cowTask)c.updateCowTask(a,1/60,c.clockT);else c.chooseCowTask(a);if(wasLying)assert(a.g.position.distanceTo(old)<1e-8,'walking before standing');else stood=true;if(G.getCowCareStatus().job?.stage==='milking')docked=true;if(!G.getCowCareStatus().job&&G.getCowCareStatus().tank.normal===1)break;}assert(stood);assert(docked);assert.equal(G.getCowCareStatus().tank.normal,1);assert.equal(G.getCowCareStatus().job,null);a.carePose?.reset();a.rig3d.dispose();y.dispose();});

test('cows request straw beds only at effective night and stand at dawn even in rain',()=>{
 const{c,y}=scene(1,25),a=c.animals[0];
 try{
  c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};a.cowDrinkAt=9e15;a.need.tired=1;
  for(const preset of [{night:false},{night:false,rain:true},{night:false,snowing:true}]){c.PRESET=preset;assert.equal(c.chooseCowTask(a),false,'daytime weather or fatigue requested a bed');assert(!a.cowTask,'daytime cow owns an unrequested task');}
  c.PRESET={night:true};assert(c.chooseCowTask(a));assert.equal(a.cowTask.kind,'bed');
  for(let i=0;i<900&&a.cowTask?.weight<1;i++){c.clockT=i/60;c.updateCowTask(a,1/60,c.clockT);}assert.equal(a.cowTask?.stage,'hold');assert.equal(a.cowTask.weight,1);
  c.PRESET={night:false,rain:true};const old=a.g.position.clone();c.clockT+=1/60;c.updateCowTask(a,1/60,c.clockT);assert.equal(a.cowTask?.stage,'stand','rainy daylight retained a night bed');assert(a.cowTask.weight<1);assert(a.g.position.distanceTo(old)<1e-8,'cow walked before standing');
  for(let i=0;i<120&&a.cowTask;i++){c.clockT+=1/60;c.updateCowTask(a,1/60,c.clockT);}assert.equal(a.cowTask,null);assert.equal(c.cowStations.snapshot().length,0);assert.equal(c.chooseCowTask(a),false,'daytime re-requested the released bed');
 }finally{a.carePose?.reset();a.rig3d.dispose();y.dispose();}
});
test('eating cannot satisfy the separate drinking visit before the cow goes to bed',()=>{const{c,y}=scene(1),a=c.animals[0];G.S.barn.cow_feed=1;G.fillCowFeed(1);c.syncCowYard();a.need.hunger=1;c.PRESET.night=true;assert(c.chooseCowTask(a));assert.equal(a.cowTask.kind,'feed');for(let i=0;i<2400&&a.cowTask;i++){c.clockT=i/60;c.updateCowTask(a,1/60,c.clockT);}assert.equal(a.cowTask,null);assert.equal(a.cowDrinkAt||0,0,'feed visit falsely marked water as already visited');assert(c.chooseCowTask(a));assert.equal(a.cowTask.kind,'drink');a.carePose?.reset();a.rig3d.dispose();y.dispose();});
test('slow rendered frames preserve station walking pace while returning from a hidden tab cannot catch up an approach',()=>{const{c,y}=scene(1),a=c.animals[0];assert(G.milkCow(c.cowStatus.cows[0].id));c.syncCowYard();assert(c.chooseCowTask(a));const from=a.g.position.clone();c.updateCowTask(a,.1,1);assert(Math.abs(a.g.position.distanceTo(from)-.8)<.02,'capped frame delta stretches a one-second walk');const before=a.g.position.clone();c.updateCowTask(a,0,1001);assert(a.g.position.distanceTo(before)<1e-8,'hidden-tab return advanced an approaching cow');c.updateCowTask(a,1/60,1001+1/60);assert(a.g.position.distanceTo(before)<.02,'old hidden interval leaked into next frame');a.carePose?.reset();a.rig3d.dispose();y.dispose();});
test('display removal releases the departing cow reservation before disposing its rig',()=>{const{c,y}=scene(1),a=c.animals[0];a.ref={type:'pen',kind:'cow',i:0};assert(c.beginCowTask(a,'bed'));assert.equal(c.cowStations.snapshot().length,1);G.S.pens.cow.owned=false;G.S.pens.chicken.owned=false;c.syncChickenYard=()=>{};c.scene={remove(){}};vm.runInContext(html.slice(html.indexOf('const refKey ='),html.indexOf('let chickenPreview=')),c);c.syncHerd();assert.equal(c.cowStations.snapshot().length,0,'departing cow left an occupied station');assert.equal(c.animals.length,0);y.dispose();});
test('all five hungry cows complete distinct feed and water visits before settling into nighttime beds',()=>{const{c,y}=fullHerdScene();c.PRESET={night:true};const seen={feed:new Set(),drink:new Set(),bed:new Set()};for(let i=0;i<12000;i++){c.clockT=i/30;for(const a of c.animals){a.update(1/30,c.clockT);const task=a.cowTask;if(task?.stage==='hold'&&task.weight>.99)seen[task.kind]?.add(a.ref.i);}if(Object.values(seen).every(s=>s.size===5))break;}for(const kind of ['feed','drink','bed'])assert.equal(seen[kind].size,5,'not every cow reached '+kind+': '+[...seen[kind]]+' '+JSON.stringify(c.animals.map(a=>({i:a.ref.i,pos:a.g.position.toArray(),task:a.cowTask,label:a.label}))));for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();});
test('a newly paid production cycle gets a real feed visit even when transient hunger is low',()=>{const{c,y}=scene(1),a=c.animals[0],id=c.cowStatus.cows[0].id;G.S.barn.cow_feed=1;G.fillCowFeed(1);assert(G.milkCow(id));const job=G.getCowCareStatus().job.id;assert(G.reportCowRobotDock(job));at(T+192000);G.settleCows(true);assert(G.reportCowRobotExit(job));c.syncCowYard();assert(c.cowStatus.cows[0].feedCharged&&!c.cowStatus.cows[0].ready);a.need.hunger=0;a.cowDrinkAt=9e15;assert(c.chooseCowTask(a));assert.equal(a.cowTask.kind,'feed');assert.equal(c.cowStatus.feed,0,'the paid portion was charged exactly once');a.rig3d.dispose();y.dispose();});

function fullHerdScene(north=0){const{c,y}=scene(5,north);for(const a of c.animals)a.rig3d.dispose();c.animals.length=0;G.S.barn.cow_feed=5;G.fillCowFeed(5);c.syncCowYard();Object.assign(c,{Live3D:null,contact(){},scene:new THREE.Scene(),emoteMat:()=>new THREE.SpriteMaterial(),sensePlayer(){},walk:null,tapPoint:null,rnd:()=>.5,fenceSegs:y.layout.fenceSegments,PEN_LIST:[c.PENS.courtyard]});Object.assign(c.PENS.courtyard,{bed:y.layout.bed,shelter:y.layout.shelter,water:y.layout.water});c.BLOCKS=y.layout.obstacles.map(b=>[...b]);vm.runInContext(html.slice(html.indexOf('const PERSONALITY ='),html.indexOf('// where each kind lives')),c);vm.runInContext(html.slice(html.indexOf('function edgeDepths('),html.indexOf('// where the animals may not walk')),c);vm.runInContext(html.slice(html.indexOf('const blocked ='),html.indexOf('// little mood bubbles')),c);c.penOf=()=>c.PENS.courtyard;vm.runInContext(html.slice(html.indexOf('function ordinaryDayTarget('),html.indexOf('class Beast {')),c);vm.runInContext(html.slice(html.indexOf('class Beast {'),html.indexOf('let clockT ='))+'\nglobalThis.TestBeast=Beast;',c);for(let i=0;i<5;i++){const p=y.stations[i].dock,a=new c.TestBeast('cow','Care Cow '+i,'Friendly',p[0],p[2],{type:'pen',kind:'cow',i});a.need={hunger:1,tired:1,lonely:0};c.animals.push(a);}return{c,y};}
test('ordinary cow grass targets reject the existing pillar clearance, not only its small visual footprint',()=>{
 const{c,y}=fullHerdScene();
 try{
  // First draw is 0.85 m from the pillar: legal under the old .5 m
  // sampling clearance, unreachable under the cow's 1.5 m steering pad.
  const draw=[(-6+13.3)/10.5,(-11.45+14.5)/6,.6,.6];let i=0;
  const p=c.freePoint(()=>draw[i++%draw.length],-6,-11.45,5,c.PENS.courtyard,1.5);
  assert(Math.abs(p.x+5.15)>=.065+1.5||Math.abs(p.y+11.45)>=.065+1.5,'cow target entered pillar clearance: '+JSON.stringify([p.x,p.y]));
 }finally{for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();}
});
test('an awake cow leaving its occupied bed takes the existing station exit before crossing the yard',()=>{
 const{c,y}=fullHerdScene(),a=c.animals[4],bed=y.stations.filter(s=>s.kind==='bed')[4];
 try{
  a.go(-4,-13,false,'Off to graze','eat');
  assert.deepEqual([a.target.x,a.target.y],[bed.approach[0],bed.approach[2]],'ordinary movement cut through its own bed row');
  a.g.position.set(bed.approach[0]+1.1,.08,bed.approach[2]);
  a.go(-4,-13,false,'Off to graze','eat');
  assert.notDeepEqual([a.target.x,a.target.y],[bed.approach[0],bed.approach[2]],'already-exited cow was routed back into its bed');
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});
test('seed-1 daytime cow wander cannot choose its old sleeping core as an idle destination',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[4],bed=y.stations.filter(s=>s.kind==='bed')[4],captured=[3.94904062806118,-38.4752225470614];
 try{
  a.g.position.set(bed.approach[0],.08,bed.approach[2]);c.PRESET={night:false};
  a.go(captured[0],captured[1],false,'Going for a stroll');
  const end=a.path?.at(-1)??a.target;
  assert(end,'daytime cow lost every route');
  assert(Math.hypot(end.x-bed.dock[0],end.y-bed.dock[2])>.65,'ordinary destination remained in the exact captured bed core');
  c.PRESET={night:true};a.go(captured[0],captured[1],false,'Heading to bed','sleep');
  const nightEnd=a.path?.at(-1)??a.target;
  assert(Math.hypot(nightEnd.x-bed.dock[0],nightEnd.y-bed.dock[2])<.65,'night bed access was disabled');
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});
test('five manual requests pass the actual moving herd through the single robot in FIFO order',()=>{const{c,y}=fullHerdScene(),ids=c.cowStatus.cows.map(b=>b.id);for(const id of ids)assert(G.milkCow(id));c.syncCowYard();const order=[];for(let i=0;i<15000;i++){at(T+180000+i*1000/30);c.clockT=i/30;G.settleCows(true);c.syncCowYard();for(const a of c.animals)a.update(1/30,c.clockT);const state=G.getCowCareStatus();if(state.job?.stage==='milking'&&!order.includes(state.job.cowId))order.push(state.job.cowId);assert(state.tank.normal<=5,'duplicate robot credit');if(state.tank.normal===5&&!state.job&&!state.queue.length)break;}const final=G.getCowCareStatus();assert.deepEqual(order,ids,'FIFO docking order changed');assert.equal(final.tank.normal,5,'herd did not clear all five robot jobs: '+JSON.stringify(c.animals.map(a=>({i:a.ref.i,pos:a.g.position.toArray(),task:a.cowTask,label:a.label}))));assert.equal(final.job,null);assert.equal(final.queue.length,0);assert.equal(G.S.xp,15);for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();});

test('switching or recovering a different farm rebuilds same-count cows and releases the former farm reservations',()=>{const{c,y}=scene(1),a=c.animals[0];a.ref={type:'pen',kind:'cow',i:0};a.farmPen=G.S.pens.cow;assert(c.beginCowTask(a,'bed'));c.syncChickenYard=()=>{};c.scene={remove(){}};c.rnd=()=>.5;c.persOf=()=> 'Calm';c.PERSONALITY={Calm:{}};c.PENS.courtyard.bed=COW_YARD_LAYOUT.bed;c.penOf=()=>c.PENS.courtyard;c.freePoint=()=>new THREE.Vector2();c.Beast=function(kind,name,pers,x,z,ref){Object.assign(this,{kind,name,pers,ref,g:new THREE.Group()});this.g.position.set(x,0,z);};vm.runInContext(html.slice(html.indexOf('const refKey ='),html.indexOf('let chickenPreview=')),c);c.syncHerd();assert.equal(c.animals[0],a,'same saved pen rebuilt on an ordinary refresh');G.S.pens.cow=structuredClone(G.S.pens.cow);c.syncCowYard();c.syncHerd();assert.notEqual(c.animals.find(b=>b.kind==='cow'),a,'same-count recovered or visited farm retained its former cow rig');assert.equal(c.cowStations.snapshot().length,0,'former farm kept a bed reservation');assert.equal(c.animals.find(b=>b.kind==='cow').farmPen,G.S.pens.cow);y.dispose();});

test('legacy rig stroll releases a held bed instead of measuring care approach movement',()=>{
 const {c,y}=fullHerdScene(),a=c.animals[0];
 c.PRESET={night:true};a.need={hunger:0,tired:0,lonely:0};assert(c.beginCowTask(a,'bed'));
 for(let i=0;i<1200;i++){c.clockT=i/60;c.updateCowTask(a,1/60,c.clockT);}
 assert.equal(a.cowTask.stage,'hold');assert.equal(a.cowTask.weight,1);
 const legacy=()=>{a.mode='fair';a.until=9e15;a.act='idle';a.doing=null;a.need={hunger:0,tired:0,lonely:0};a.go(a.g.position.x+.9,a.g.position.z+.6,false,'Test stroll');};
 const sample=n=>{let distance=0;const start=a.rig3d.state.distance;for(let i=0;i<n;i++){const x=a.g.position.x,z=a.g.position.z;a.update(1/60,c.clockT);distance+=Math.hypot(a.g.position.x-x,a.g.position.z-z);}return{distance,measured:a.rig3d.state.distance-start};};
 legacy();const red=sample(120);assert.equal(red.distance,0,'retained held-bed fixture no longer reproduces the browser failure');
 const token=a.cowTask.token,occupied=c.cowStations.snapshot(),owns=r=>r.stationId===token.stationId&&r.animalId===token.animalId&&r.generation===token.generation;assert(occupied.some(owns));
 const setup=prepareCowStroll({cowStations:c.cowStations},a);assert.equal(setup.before.task,'bed');assert.equal(a.cowTask,null);assert.deepEqual(c.cowStations.snapshot(),occupied.filter(r=>!owns(r)));
 c.PRESET={night:false};legacy();
 const green=sample(120);assert(green.distance>.01);assert(Math.abs(green.distance-green.measured)<1e-8);
 const x=a.g.position.x,z=a.g.position.z,fit=a.fit;a.fit=v=>v.set(x,z);a.target=a.pos.addScalar(5);a.until=9e15;
 const phase=a.rig3d.state.phase,blocked=sample(180);a.fit=fit;assert.equal(blocked.distance,0);assert.equal(a.rig3d.state.phase,phase);assert(a.rig3d.state.amount<1e-10);
 console.log('COW RIG FIXTURE RED/GREEN',JSON.stringify({red,green,setup}));
 for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();
});

test('expanded northern courtyard completes three full-herd feed, drink, sleep and wake cycles',()=>{
 const {c,y}=fullHerdScene(25);let tick=0;
 try{for(let cycle=0;cycle<3;cycle++){
  G.S.barn.cow_feed=5;G.fillCowFeed(5);G.fillCowWater();c.syncCowYard();c.PRESET={night:true};
  for(const a of c.animals){a.need.hunger=1;a.need.tired=1;a.cowDrinkAt=0;}
  const seen={feed:new Set(),drink:new Set(),bed:new Set()};let settled=false;
  for(let i=0;i<12000;i++){c.clockT=++tick/30;for(const a of c.animals){a.update(1/30,c.clockT);const task=a.cowTask;if(task?.stage==='hold'&&task.weight>.99)seen[task.kind]?.add(a.ref.i);}
   if(Object.values(seen).every(s=>s.size===5)&&c.animals.every(a=>a.cowTask?.kind==='bed'&&a.cowTask.stage==='hold'&&a.cowTask.weight>.99)){settled=true;break;}
  }
  assert(settled,'northern herd failed cycle '+cycle+': '+JSON.stringify(c.animals.map(a=>({i:a.ref.i,pos:a.g.position.toArray(),kind:a.cowTask?.kind,stage:a.cowTask?.stage}))));
  assert.equal(new Set(c.animals.map(a=>a.cowTask.station.id)).size,5,'shared resting place');
  c.PRESET={night:false};let awake=false;
  for(let i=0;i<1200;i++){c.clockT=++tick/30;for(const a of c.animals)a.update(1/30,c.clockT);if(c.animals.every(a=>a.cowTask?.kind!=='bed')){awake=true;break;}}
  assert(awake,'northern herd did not wake after cycle '+cycle);
 }}finally{for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();}
});

test('expanded northern herd clears all five robot requests in FIFO order',()=>{
 const {c,y}=fullHerdScene(25),ids=c.cowStatus.cows.map(b=>b.id),order=[];
 try{for(const id of ids)assert(G.milkCow(id));c.syncCowYard();
  for(let i=0;i<15000;i++){at(T+180000+i*1000/30);c.clockT=i/30;G.settleCows(true);c.syncCowYard();for(const a of c.animals)a.update(1/30,c.clockT);const s=G.getCowCareStatus();if(s.job?.stage==='milking'&&!order.includes(s.job.cowId))order.push(s.job.cowId);assert(s.tank.normal<=5);if(s.tank.normal===5&&!s.job&&!s.queue.length)break;}
  const s=G.getCowCareStatus();assert.deepEqual(order,ids);assert.equal(s.tank.normal,5,'expanded herd did not complete all robot visits');assert.equal(s.job,null);assert.equal(s.queue.length,0);assert.equal(G.S.xp,15);
 }finally{for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();}
});

test('releasing the last bed leaves an awake cow able to accept the next nighttime task',()=>{
 const {c,y}=fullHerdScene(25),a=c.animals[4];
 try{c.PRESET={night:true};a.need={hunger:0,tired:1,lonely:0};a.cowDrinkAt=9e15;
  for(let i=0;i<600;i++){c.clockT=i/30;a.update(1/30,c.clockT);}
  assert.equal(a.cowTask.kind,'bed');assert.equal(a.cowTask.stage,'hold');assert.equal(a.mode,'night');
  c.PRESET={night:false};for(let i=0;i<1200&&a.cowTask;i++){c.clockT=20+i/30;a.update(1/30,c.clockT);}
  assert.equal(a.cowTask,null);assert.equal(a.act,'idle','released bed left the cow marked asleep');
  c.PRESET={night:true};a.update(1/30,++c.clockT);assert.equal(a.cowTask?.kind,'bed');
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});

test('visible frames longer than one second retain cow walking pace without hidden-tab catchup',()=>{
 const {c,y}=scene(1,25),a=c.animals[0];
 try{assert(G.milkCow(c.cowStatus.cows[0].id));c.syncCowYard();assert(c.chooseCowTask(a));const start=a.rig3d.state.distance;
  c.updateCowTask(a,.1,2.5);assert(Math.abs(a.rig3d.state.distance-start-2)<.04,'visible2.5s frame advanced only '+(a.rig3d.state.distance-start)+'m');
  const before=a.g.position.clone();c.updateCowTask(a,0,1002.5);assert(a.g.position.distanceTo(before)<1e-8);c.updateCowTask(a,1/60,1002.5+1/60);assert(a.g.position.distanceTo(before)<.02);
 }finally{a.rig3d.dispose();y.dispose();}
});

test('the longest expanded robot approach meets the original60s deadline on2.4s visible frames',()=>{
 const {c,y}=scene(1,25),a=c.animals[0];let docked=false;
 try{assert(G.milkCow(c.cowStatus.cows[0].id));c.syncCowYard();assert(c.chooseCowTask(a));
  for(let i=0;i<25;i++){const t=(i+1)*2.4;at(T+180000+t*1000);c.clockT=t;G.settleCows(true);c.syncCowYard();c.updateCowTask(a,.1,t);if(G.getCowCareStatus().job?.stage==='milking'){docked=true;break;}}
  assert(docked,'robot still approaching after60s: '+JSON.stringify(a.g.position.toArray()));
 }finally{a.rig3d.dispose();y.dispose();}
});

test('offline snapshot assertions distinguish ledger settlement from physical motion during slow boot frames',()=>{
 const rows=[];
 for(const paused of [false,true]){const {c,y}=scene(1,25),a=c.animals[0];
  try{assert(G.milkCow(c.cowStatus.cows[0].id));assert(G.reportCowRobotDock(G.getCowCareStatus().job.id));at(T+300000);G.settleCows(true);c.syncCowYard();assert.equal(c.cowStatus.job.stage,'exiting');a.g.position.set(...y.layout.robot.dock);assert(c.chooseCowTask(a));const start=a.rig3d.state.distance;
   for(let i=0;i<3;i++){c.clockT=paused?0:(i+1)*3;c.updateCowTask(a,paused?0:.1,c.clockT);}
   const s=G.getCowCareStatus(),distance=a.rig3d.state.distance-start;assert.equal(s.tank.normal,1);assert.equal(G.S.xp,3);
   if(paused){assert.equal(distance,0);assert.equal(s.job.stage,'exiting');}else{assert(distance>6,'exiting cow did not actually walk the exit route');assert.equal(s.job,null);}
   rows.push({paused,distance,job:s.job?.stage??null,tank:s.tank.normal,xp:G.S.xp});
  }finally{a.rig3d.dispose();y.dispose();}
 }
 console.log('OFFLINE BOOT CLOCK PROOF',JSON.stringify(rows));
});

test('a seeded herd clears care docks while waiting through three nights and full forty-second wakes',()=>{
 for(const initialSeed of [1,4242,21,390]){const {c,y}=fullHerdScene(25);let tick=0,seed=initialSeed;c.rnd=()=>((seed=seed*16807%2147483647)/2147483647);
 try{for(let cycle=0;cycle<3;cycle++){
  c.PRESET={night:true};for(const a of c.animals){a.need.hunger=1;a.need.tired=1;a.cowDrinkAt=0;}let settled=false;
  for(let n=0;n<15000;n++){c.clockT=++tick/30;for(const a of c.animals)a.update(1/30,c.clockT);if(c.animals.every(a=>a.cowTask?.kind==='bed'&&a.cowTask.stage==='hold'&&a.cowTask.weight>.99)){settled=true;break;}}
  assert(settled,'waiting cows block released docks on night '+cycle+': '+JSON.stringify(c.animals.map(a=>({i:a.ref.i,p:a.g.position.toArray(),kind:a.cowTask?.kind,stage:a.cowTask?.stage,label:a.label}))));assert.equal(new Set(c.animals.map(a=>a.cowTask.station.id)).size,5);
  c.PRESET={night:false};for(let n=0;n<1200;n++){c.clockT=++tick/30;for(const a of c.animals)a.update(1/30,c.clockT);}assert(c.animals.every(a=>a.cowTask?.kind!=='bed'),'wake retained a bed');
 }}finally{for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();}}
});

test('bedtime cow near another cow bed avoids a false shared approach while a real bed departure keeps its exit',()=>{
 const {c,y}=scene(5,25),beds=y.stations.filter(s=>s.kind==='bed'),owner=c.animals[2],passing=c.animals[4];
 try{
  owner.g.position.set(beds[2].approach[0],.08,beds[2].approach[2]);
  passing.g.position.set(beds[2].dock[0]+.8,.08,beds[2].dock[2]);
  assert(Math.hypot(passing.g.position.x-beds[2].dock[0],passing.g.position.z-beds[2].dock[2])<.95,'fixture must reproduce old proximity classification');
  assert(owner.g.position.distanceTo(passing.g.position)>.85,'fixture begins with physical cow separation');
  assert(c.beginCowTask(owner,'bed'));assert(c.beginCowTask(passing,'bed'));
  assert.equal(owner.cowTask.station.id,beds[2].id);assert.equal(passing.cowTask.station.id,beds[4].id);
  assert.deepEqual(Array.from(passing.cowTask.waypoints,p=>[p[0],p[2]]),[beds[4].approach,beds[4].dock].map(p=>[p[0],p[2]]),'ordinary proximity to a different bed must not claim its approach');
  const departing=c.animals[0];assert(c.beginCowTask(departing,'feed'));
  assert.deepEqual([departing.cowTask.waypoints[0][0],departing.cowTask.waypoints[0][2]],[beds[0].approach[0],beds[0].approach[2]],'real departure from own bed retains a physical exit approach');
  assert.equal(new Set(c.cowStations.snapshot().map(t=>t.stationId)).size,3);
 }finally{for(const a of c.animals){a.carePose?.reset();a.rig3d.dispose();}y.dispose();}
});

test('a waiting cow physically clears a released feed dock without a new reservation or save mutation',()=>{
 const {c,y}=fullHerdScene(25),a=c.animals[2];
 try{c.clockT=1;c.PRESET={night:true};assert(c.beginCowTask(c.animals[1],'feed'));assert(c.beginCowTask(c.animals[0],'feed'));a.g.position.set(-7.2,.08,-34);const before=a.g.position.clone(),reservations=JSON.stringify(c.cowStations.snapshot()),save=JSON.stringify(G.S);
  assert(c.waitCowStation(a,'Waiting for a feed space'));assert.deepEqual(a.g.position.toArray(),before.toArray(),'waiting cannot teleport');assert(a.target,'released dock must begin clearing');assert.equal(a.running,false,'waiting must use normal walking');assert.equal(a.cowTask,undefined);assert.equal(JSON.stringify(c.cowStations.snapshot()),reservations);assert.equal(JSON.stringify(G.S),save);
  for(let n=0;n<300;n++){const p=a.g.position.clone();c.clockT+=1/30;a.update(1/30,c.clockT);assert(a.g.position.distanceTo(p)<.1,'waiting walk jumped');if(Math.hypot(a.g.position.x-before.x,a.g.position.z-before.z)>1.1)break;}
  assert(a.g.position.distanceTo(before)>1.1,'waiting cow kept blocking the feed dock');assert.equal(JSON.stringify(G.S),save,'cosmetic waiting changed saved state');
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});

test('a real robot job advancing during a pen draft retains credit and walks its relocated exit',()=>{
 const {c,y,s}=scene(1,25),a=c.animals[0],id=c.cowStatus.cows[0].id;let candidate;
 try{
  assert(G.milkCow(id));c.syncCowYard();assert(c.chooseCowTask(a));
  let t=0;for(let n=0;n<3600&&G.getCowCareStatus().job?.stage!=='milking';n++){t+=1/60;at(T+180000+t*1000);c.clockT=t;G.settleCows(true);c.syncCowYard();c.updateCowTask(a,1/60,t);}
  assert.equal(G.getCowCareStatus().job?.stage,'milking');const jobId=G.getCowCareStatus().job.id,gate=a.cowTask.gate,tokens=c.cowStations.snapshot();
  // Real elapsed production continues while the physical editor is paused.
  at(T+180000+(t+13)*1000);G.settleCows(true);c.syncCowYard();assert.equal(c.cowStatus.job.stage,'exiting');assert.equal(c.cowStatus.tank.normal,1);
  const paid=JSON.stringify(s.pens.cow.care),record=defaultSiteRecord('cow');for(const v of record.boundary)v.x+=2;for(const p of Object.values(record.structures))p[0]+=2;
  const site=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}).sites.cow,adapter=vm.runInContext('cowPenCare',c),position=a.g.position.toArray(),prepared=adapter.prepareLayoutRebind({site,now:t+13,placements:{[id]:[position[0]+2,position[1],position[2]]}});
  c.installedAnimalPens={sites:{cow:site}};candidate=createCowYard({north:25,layout:site});c.cowYard=candidate;c.COW_YARD_LAYOUT=candidate.layout;c.PENS.courtyard.poly=candidate.layout.polygon;c.OBST=candidate.layout.obstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0}));
  prepared.publish();assert.equal(JSON.stringify(s.pens.cow.care),paid);assert.equal(a.cowTask.jobId,jobId);assert.equal(a.cowTask.gate,gate);assert.deepEqual(c.cowStations.snapshot(),tokens);assert.equal(a.cowTask.stage,'exit');
  candidate.group.updateMatrixWorld(true);const solid=[];candidate.group.traverse(o=>{if(o.isMesh)solid.push(o);});
  for(let n=0;n<3600&&a.cowTask;n++){t+=1/60;const before=a.g.position.clone();c.updateCowTask(a,1/60,t+13);const delta=a.g.position.clone().sub(before);assert(delta.length()<=.8/60+1e-8);if(delta.length()>1e-6)assert(!new THREE.Raycaster(before.clone().setY(.55),delta.clone().normalize(),0,delta.length()).intersectObjects(solid,false)[0],'relocated exit crosses geometry');}
  assert.equal(a.cowTask,null);assert.equal(G.getCowCareStatus().job,null);assert.equal(G.getCowCareStatus().tank.normal,1);
 }finally{candidate?.dispose();y.dispose();for(const a of c.animals)a.rig3d.dispose();}
});

test('ordinary daytime cow choices cannot start a generic rest',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[0];
 try{
  c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:false};a.cowDrinkAt=9e15;a.need={hunger:0,tired:.79,lonely:0};
  for(let i=0;i<100;i++){c.rnd=()=>i/100;a.target=null;a.act='idle';a.doing=null;a.until=0;a.think();assert.notEqual(a.cowTask?.kind,'bed','daytime thought scheduled a bed');assert.notEqual(a.doing,'rest','daytime thought scheduled generic rest at random fraction '+i/100);}
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});
test('a chicken leaving overnight bedding keeps its individual forty-second awake window before ordinary naps',()=>{
 const{c,y}=fullHerdScene(),a=c.animals[0];
 try{
  a.kind='chicken';a.chickenTask={kind:'bed',nap:false,stage:'exit'};c.chickenSupplies={};
  c.chickenCare={update(b){b.chickenTask=null;return true;}};c.PRESET={night:false};c.clockT=20;
  a.update(1/30,20);
  assert.equal(a.postNightAwakeUntil,60,'overnight exit did not start the individual wake barrier');
  a.need={hunger:0,tired:.79,lonely:0};let laterNap=false;
  for(let i=0;i<100;i++){c.rnd=()=>i/100;a.target=null;a.act='idle';a.doing=null;a.until=0;c.clockT=59.9;a.think();assert.notEqual(a.doing,'rest','early chicken nap at random fraction '+i/100);}
  for(let i=0;i<100;i++){c.rnd=()=>i/100;a.target=null;a.act='idle';a.doing=null;a.until=0;c.clockT=60;a.think();laterNap||=a.doing==='rest';}
  assert(laterNap,'normal later chicken nap was removed');
 }finally{for(const b of c.animals){b.carePose?.reset();b.rig3d.dispose();}y.dispose();}
});
test('captured opposite-side bed routes clear their shared static waypoint with physical cow separation',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[1],b=c.animals[3];
 try{
  for(const [cow,pos,path,station] of [
   [a,[-.7623720259011585,.08,-35.82392005305538],[[-1.195,-35.845],[-6.405,-35.845],[-7.8,-36.8]],y.stations[1]],
   [b,[-1.6060728610025274,.08,-35.69489485575693],[[-1.195,-35.845],[.2,-36.8]],y.stations[3]]
  ]){cow.g.position.set(...pos);const token=c.cowStations.request(c.cowStatus.cows[cow.ref.i].id,'bed',station.id);assert(token);cow.cowTask={kind:'bed',stage:'approach',station,path:path.map(p=>new THREE.Vector2(...p)),waypoints:[],weight:0,token};cow.cowTickAt=0;}
  c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:true};let cleared=-1,minSep=Infinity;
  const detours=[
   c.route(a.pos,new THREE.Vector2(-6.405,-35.845),.42,c.PENS.courtyard,[{x:b.g.position.x,z:b.g.position.z,hw:.425,hd:.425,radius:.425,c:1,s:0}],()=>true).map(p=>p.toArray()),
   c.route(b.pos,new THREE.Vector2(.2,-36.8),.42,c.PENS.courtyard,[{x:a.g.position.x,z:a.g.position.z,hw:.425,hd:.425,radius:.425,c:1,s:0}],()=>true).map(p=>p.toArray())
  ];
  for(let frame=1;frame<=15000;frame++){c.clockT=frame/30;c.updateCowTask(a,1/30,c.clockT);c.updateCowTask(b,1/30,c.clockT);minSep=Math.min(minSep,a.g.position.distanceTo(b.g.position));if((a.cowTask?.path?.length??0)<3&&(b.cowTask?.path?.length??0)<2){cleared=frame;break;}}
  assert(minSep>=.85-1e-9,'physical cow separation violated');
  assert(cleared>0,'both cows failed to clear opposite-side shared waypoint within original 500 seconds: '+JSON.stringify({a:a.g.position.toArray(),b:b.g.position.toArray(),paths:[a.cowTask?.path?.length,b.cowTask?.path?.length],detours}));
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('diagnostic: one physical circular-obstacle detour clears both sides at 30/60/120 Hz and either priority',()=>{
 for(const hz of [30,60,120])for(const yielding of [1,3])for(const reverse of [false,true]){
  const{c,y}=fullHerdScene(25),a=c.animals[1],b=c.animals[3];
  try{
   for(const [cow,pos,path,station] of [
    [a,[-.7623720259011585,.08,-35.82392005305538],[[-1.195,-35.845],[-6.405,-35.845],[-7.8,-36.8]],y.stations[1]],
    [b,[-1.6060728610025274,.08,-35.69489485575693],[[-1.195,-35.845],[.2,-36.8]],y.stations[3]]
   ]){cow.g.position.set(...pos);const token=c.cowStations.request(c.cowStatus.cows[cow.ref.i].id,'bed',station.id);assert(token);cow.cowTask={kind:'bed',stage:'approach',station,path:path.map(p=>new THREE.Vector2(...p)),waypoints:[],weight:0,token};cow.cowTickAt=0;}
   c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:true};
   const walker=yielding===1?a:b,other=walker===a?b:a,original=walker.cowTask.path;
   const blocker={x:other.g.position.x,z:other.g.position.z,hw:.43,hd:.43,radius:.43,c:1,s:0};
   const traverse=(u,v)=>{const n=Math.max(1,Math.ceil(u.distanceTo(v)/.4));for(let k=0;k<=n;k++){const x=u.x+(v.x-u.x)*k/n,z=u.y+(v.y-u.y)*k/n;if(!c.fitsPen(c.PENS.courtyard,x,z,.42)||!Number.isFinite(c.cowSupportY(x,z)))return false;}return true;};
   const detour=c.route(walker.pos,original[1],.42,c.PENS.courtyard,[blocker],traverse);
   assert(detour.length>=2,'no alternative path for '+JSON.stringify({hz,yielding,reverse}));
   walker.cowTask.path=[...detour,...original.slice(2)];
   let crossed=-1,minSep=Infinity,maxSpeed=0;
   for(let frame=1;frame<=500*hz;frame++){c.clockT=frame/hz;for(const cow of reverse?[b,a]:[a,b])c.updateCowTask(cow,1/hz,c.clockT);minSep=Math.min(minSep,a.g.position.distanceTo(b.g.position));maxSpeed=Math.max(maxSpeed,a.lastSpd,b.lastSpd);for(const cow of [a,b]){assert(c.fitsPen(c.PENS.courtyard,cow.g.position.x,cow.g.position.z,.42));assert(Number.isFinite(c.cowSupportY(cow.g.position.x,cow.g.position.z)));assert(!y.layout.obstacles.some(([x,z,hw,hd])=>Math.abs(cow.g.position.x-x)<hw+.4&&Math.abs(cow.g.position.z-z)<hd+.4),'solid post overlap');}if(a.g.position.x<-2.5&&b.g.position.x>-.5){crossed=frame;break;}}
   assert(minSep>=.85-1e-9,'physical cow separation '+JSON.stringify({hz,yielding,reverse,minSep}));
   assert(maxSpeed<=.8+1e-9,'directed cow speed '+JSON.stringify({hz,yielding,reverse,maxSpeed}));
   assert(crossed>0,'detour failed to exchange sides by 500 seconds: '+JSON.stringify({hz,yielding,reverse,a:a.g.position.toArray(),b:b.g.position.toArray(),detour:detour.map(p=>p.toArray())}));
  }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
 }
});
test('shared-corner right-of-way clears either stable-identity side and update order at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120])for(const reverse of [false,true])for(const swap of [false,true]){
  const{c,y}=fullHerdScene(25),east=c.animals[swap?3:1],west=c.animals[swap?1:3];
  try{
   for(const [cow,pos,path,station] of [
    [east,[-.7623720259011585,.08,-35.82392005305538],[[-1.195,-35.845],[-6.405,-35.845],[-7.8,-36.8]],y.stations[1]],
    [west,[-1.6060728610025274,.08,-35.69489485575693],[[-1.195,-35.845],[.2,-36.8]],y.stations[3]]
   ]){cow.g.position.set(...pos);const token=c.cowStations.request(c.cowStatus.cows[cow.ref.i].id,'bed',station.id);assert(token);cow.cowTask={kind:'bed',stage:'approach',station,path:path.map(p=>new THREE.Vector2(...p)),waypoints:[],weight:0,token};cow.cowTickAt=0;}
   c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:true};
   let crossed=-1,minSep=Infinity,maxSpeed=0;
   for(let frame=1;frame<=500*hz;frame++){c.clockT=frame/hz;for(const cow of reverse?[west,east]:[east,west])c.updateCowTask(cow,1/hz,c.clockT);minSep=Math.min(minSep,east.g.position.distanceTo(west.g.position));maxSpeed=Math.max(maxSpeed,east.lastSpd,west.lastSpd);for(const cow of [east,west]){assert(c.fitsPen(c.PENS.courtyard,cow.g.position.x,cow.g.position.z,.42));assert(Number.isFinite(c.cowSupportY(cow.g.position.x,cow.g.position.z)));assert(!y.layout.obstacles.some(([x,z,hw,hd])=>Math.abs(cow.g.position.x-x)<hw+.4&&Math.abs(cow.g.position.z-z)<hd+.4),'solid post overlap');}if(east.g.position.x<-2.5&&west.g.position.x>-.5){crossed=frame;break;}}
   assert(minSep>=.85-1e-9,'cow separation '+JSON.stringify({hz,reverse,swap,minSep}));
   assert(maxSpeed<=.8+1e-9,'directed speed '+JSON.stringify({hz,reverse,swap,maxSpeed}));
   assert(crossed>0,'one cow starved at the shared corner: '+JSON.stringify({hz,reverse,swap,east:east.g.position.toArray(),west:west.g.position.toArray()}));
  }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
 }
});
test('a blocked shared-corner yield keeps the original physical collision guard and route',()=>{
 const{c,y}=fullHerdScene(25),east=c.animals[1],west=c.animals[3];
 try{
  for(const [cow,pos,path,station] of [
   [east,[-.7623720259011585,.08,-35.82392005305538],[[-1.195,-35.845],[-6.405,-35.845],[-7.8,-36.8]],y.stations[1]],
   [west,[-1.6060728610025274,.08,-35.69489485575693],[[-1.195,-35.845],[.2,-36.8]],y.stations[3]]
  ]){cow.g.position.set(...pos);const token=c.cowStations.request(c.cowStatus.cows[cow.ref.i].id,'bed',station.id);assert(token);cow.cowTask={kind:'bed',stage:'approach',station,path:path.map(p=>new THREE.Vector2(...p)),waypoints:[],weight:0,token};cow.cowTickAt=0;}
  c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:true};
  const original=east.cowTask.path.map(p=>p.toArray());let calls=0,minSep=Infinity,maxSpeed=0;c.route=()=>{calls++;return[];};
  for(let frame=1;frame<=300;frame++){c.clockT=frame/30;c.updateCowTask(east,1/30,c.clockT);c.updateCowTask(west,1/30,c.clockT);minSep=Math.min(minSep,east.g.position.distanceTo(west.g.position));maxSpeed=Math.max(maxSpeed,east.lastSpd,west.lastSpd);}
  assert.deepEqual(east.cowTask.path.map(p=>p.toArray()),original,'no route must not publish a false detour');
  assert(calls<=1,'unchanged blocked geometry caused unbounded replanning: '+JSON.stringify({calls,west:west.g.position.toArray(),tried:east.cowTask.detourTried}));
  assert(minSep>=.85-1e-9);assert(maxSpeed<=.8+1e-9);assert(!east.cowTask.detourFor);
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('same-direction followers and non-bed jobs do not claim bedtime right-of-way detours',()=>{
 const{c,y}=fullHerdScene(25);try{
  const corner=new THREE.Vector2(-1,0),task={kind:'bed',stage:'approach',path:[corner,new THREE.Vector2(-2,0)]};
  const a={ref:{i:1},pos:new THREE.Vector2(0,0),S:{walk:.8}},b={ref:{i:3},pos:new THREE.Vector2(1,0),g:{position:{x:1,z:0}},cowTask:{kind:'bed',stage:'approach',path:[corner]}};
  let routes=0;c.route=()=>{routes++;return[];};
  assert.equal(c.cowSharedCornerDetour(a,b,task,0),false,'following in the same direction must not yield');
  task.kind='feed';b.pos.set(-2,0);b.g.position.x=-2;
  assert.equal(c.cowSharedCornerDetour(a,b,task,0),false,'feed jobs retain their existing route');
  assert.equal(routes,0);assert.deepEqual(task.path.map(p=>p.toArray()),[[-1,0],[-2,0]]);
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('captured distinct final bed approaches physically clear at full cow separation',()=>{
 for(const hz of [30,60,120])for(const reverse of [false,true])for(const swap of [false,true]){
  const{c,y}=fullHerdScene(25),a=c.animals[3],b=c.animals[4];
  try{
   const east=swap?b:a,west=swap?a:b;
   for(const[cow,pos,goal,station]of [
    [east,[1.9683018698673003,.08,-36.05417203939151],[.2,-36.8],y.stations[3]],
    [west,[1.7444063213105419,.08,-36.874532094406725],[4.2,-36.8],y.stations[4]]
   ]){cow.g.position.set(...pos);const token=c.cowStations.request(c.cowStatus.cows[cow.ref.i].id,'bed',station.id);assert(token);cow.cowTask={kind:'bed',stage:'approach',station,path:[new THREE.Vector2(...goal)],waypoints:[station.dock],weight:0,token};cow.cowTickAt=0;}
   c.cowStatus={...c.cowStatus,feed:0,waterUntil:0,job:null,cows:c.cowStatus.cows.map(s=>({...s,feedCharged:false,ready:true}))};c.PRESET={night:true};
   let reached=-1,minSep=Infinity,maxSpeed=0;
   for(let frame=1;frame<=500*hz;frame++){c.clockT=frame/hz;for(const cow of reverse?[b,a]:[a,b])c.updateCowTask(cow,1/hz,c.clockT);minSep=Math.min(minSep,a.g.position.distanceTo(b.g.position));maxSpeed=Math.max(maxSpeed,a.lastSpd,b.lastSpd);for(const cow of [a,b]){assert(c.fitsPen(c.PENS.courtyard,cow.g.position.x,cow.g.position.z,.42));assert(Number.isFinite(c.cowSupportY(cow.g.position.x,cow.g.position.z)));}if(a.cowTask?.stage==='hold'&&b.cowTask?.stage==='hold'&&a.cowTask.weight===1&&b.cowTask.weight===1){reached=frame;break;}}
   assert(minSep>=.85-1e-9,'physical cow separation '+JSON.stringify({hz,reverse,swap,minSep}));assert(maxSpeed<=.8+1e-9,'directed cow speed '+JSON.stringify({hz,reverse,swap,maxSpeed}));
   assert(reached>0,'distinct reserved beds remained blocked through the original 500 seconds: '+JSON.stringify({hz,reverse,swap,a:a.g.position.toArray(),b:b.g.position.toArray()}));
  }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
 }
});
test('opposing final-bed detour cannot publish a blocked path or claim following and non-bed traffic',()=>{
 const{c,y}=fullHerdScene(25);try{
  const a={ref:{i:3},pos:new THREE.Vector2(1.9683018698673003,-36.05417203939151),S:{walk:.8}},
   b={ref:{i:4},pos:new THREE.Vector2(1.7444063213105419,-36.874532094406725),g:{position:{x:1.7444063213105419,z:-36.874532094406725}}},
   task={kind:'bed',stage:'approach',station:y.stations[3],path:[new THREE.Vector2(.2,-36.8)],waypoints:[y.stations[3].dock]};
  b.cowTask={kind:'bed',stage:'approach',station:y.stations[4],path:[new THREE.Vector2(4.2,-36.8)],waypoints:[y.stations[4].dock]};
  let calls=0;c.route=()=>{calls++;return[];};const original=task.path.map(p=>p.toArray());
  assert.equal(c.cowSharedCornerDetour(a,b,task,5),false);assert.deepEqual(task.path.map(p=>p.toArray()),original);assert.equal(calls,1,'one bounded route attempt');
  assert.equal(c.cowSharedCornerDetour(a,b,task,5.1),false);assert.equal(calls,1,'unchanged blocked geometry must not replan every frame');
  b.pos.set(3,-36);b.g.position.x=3;b.g.position.z=-36;b.cowTask.path=[new THREE.Vector2(2,-36.8)];
  assert.equal(c.cowSharedCornerDetour(a,b,task,8),false,'same-direction follower got an opposing detour');assert.equal(calls,1);
  task.kind='feed';b.pos.set(1.7444063213105419,-36.874532094406725);b.g.position.x=b.pos.x;b.g.position.z=b.pos.y;
  assert.equal(c.cowSharedCornerDetour(a,b,task,9),false,'feed task got a bedtime detour');assert.equal(calls,1);
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('captured 120 Hz daytime cow target abandonment leaves the old sleeping core physically',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[4],dock=y.stations.filter(s=>s.kind==='bed')[4].dock;
 try{
  c.PRESET={night:false};c.clockT=100;a.mode='fair';a.cowTask=null;a.need={hunger:0,tired:0,lonely:0};
  a.g.position.set(4.223294383151744,.08,-37.60174069147301);a.target=new THREE.Vector2(4.375862073188582,-36.9784292641461);a.path=[];a.act='moving';a.doing=null;a.stuckT=2.5;a.lastPos.set(4.02,-37.82);a.vel.set(.14,.55);
  const before=a.g.position.clone();a.update(1/120,c.clockT);
  assert(Math.hypot(before.x-dock[0],before.z-dock[2])<.65,'fixture not in original bed core');
  assert.equal(a.act,'moving','premature ordinary arrival left cow idle inside its old sleeping core');
  assert(a.target,'physical exit route was not retained');
  assert.deepEqual([a.target.x,a.target.y],[y.stations.filter(s=>s.kind==='bed')[4].approach[0],y.stations.filter(s=>s.kind==='bed')[4].approach[2]]);
  assert(a.g.position.distanceTo(before)<=a.S.walk/120+1e-9,'exit teleported');
  assert(c.fitsPen(c.PENS.courtyard,a.g.position.x,a.g.position.z,.42));assert(Number.isFinite(c.cowSupportY(a.g.position.x,a.g.position.z)));
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('outside-core ordinary arrival and night bed travel keep their existing cow behavior',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[4];
 try{
  c.PRESET={night:false};c.clockT=100;a.mode='fair';a.cowTask=null;a.need={hunger:0,tired:0,lonely:0};
  a.g.position.set(3.54,.08,-37.27);a.target=new THREE.Vector2(4.375862073188582,-36.9784292641461);a.path=[];a.act='moving';a.doing=null;a.stuckT=2.5;a.lastPos.set(3.5,-37.3);a.vel.set(0,0);
  a.update(1/120,c.clockT);assert.equal(a.act,'idle','ordinary outside-core arrival was intercepted by bed egress');
  c.PRESET={night:true};a.g.position.set(4.223294383151744,.08,-37.60174069147301);a.target=new THREE.Vector2(4.375862073188582,-36.9784292641461);a.path=[];a.act='moving';a.doing=null;a.mode='night';a.stuckT=2.5;a.lastPos.set(4.02,-37.82);
  c.clockT+=1/120;a.update(1/120,c.clockT);assert.notEqual(a.label,'Leaving the straw beds','night bed travel was treated as daytime exit');
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
test('a cow leaving its daytime bed core cannot teleport through a cow blocking the authored exit',()=>{
 const{c,y}=fullHerdScene(25),a=c.animals[4],blocker=c.animals[3];
 try{
  c.PRESET={night:false};c.clockT=100;a.mode='fair';a.cowTask=null;a.need={hunger:0,tired:0,lonely:0};
  a.g.position.set(4.223294383151744,.08,-37.60174069147301);a.target=new THREE.Vector2(4.375862073188582,-36.9784292641461);a.path=[];a.act='moving';a.doing=null;a.stuckT=2.5;a.lastPos.set(4.02,-37.82);a.vel.set(.14,.55);
  blocker.g.position.set(4.2,.08,-36.6);let minSep=Infinity,maxStep=0;
  for(let frame=0;frame<180;frame++){const before=a.g.position.clone();c.clockT+=1/120;a.update(1/120,c.clockT);minSep=Math.min(minSep,a.g.position.distanceTo(blocker.g.position));maxStep=Math.max(maxStep,a.g.position.distanceTo(before));assert(c.fitsPen(c.PENS.courtyard,a.g.position.x,a.g.position.z,.42));assert(Number.isFinite(c.cowSupportY(a.g.position.x,a.g.position.z)));}
  assert(minSep>=.85-1e-9,'cow exit crossed the blocking cow');assert(maxStep<=a.S.walk*1.2/120+1e-9,'cow exit teleported past a blocked step');
 }finally{for(const cow of c.animals){cow.carePose?.reset();cow.rig3d.dispose();}y.dispose();}
});
