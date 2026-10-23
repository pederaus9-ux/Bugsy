import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {validateAnimalPens} from '../animal-pen-validation.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
import {farmGroundY} from '../farm-land.js';
import {pointInPolygon,segmentInPolygon} from '../animal-pen-geometry.js';

// Exact retained maximum-ownership World and narrow layout. No evidence rewrite.
const evidence=new URL('./evidence/pen-editing-implementation/',import.meta.url);
const saved=JSON.parse(fs.readFileSync(new URL('task7-codex-cow-support-fix-20261023/daylight-red/results.json',evidence))).applied.site;
const retained=JSON.parse(fs.readFileSync(new URL('task7-codex-cow-support-20261023/probe/candidate-probe.json',evidence))).world;
function fixture(){
 const world={...structuredClone(retained),groundY:farmGroundY},cow=defaultSiteRecord('cow');
 Object.assign(cow,{boundary:structuredClone(saved.boundary),runs:structuredClone(saved.runs),gates:structuredClone(saved.gateRecords),structures:Object.fromEntries(Object.entries(saved.components).map(([id,c])=>[id,[...c.origin]]))});
 return{world,layout:resolveAnimalPens({v:1,revision:1,sites:{cow}})};
}
test('retained free cow in the narrow extension is rejected, without silently relocating it',()=>{
 const {world,layout}=fixture(),cow=world.actors.find(a=>a.id==='cow-5');cow.position=[10.6,0,-39.1];cow.component=null;cow.stationId=null;
 const before=JSON.stringify(world),r=validateAnimalPens(layout,world);
 assert.equal(r.ok,false,'care clearance alone cannot authorize a free ordinary cow');
 assert(r.issues.some(i=>i.code==='ROAMING'&&i.target===cow.id));
 assert.deepEqual(r.placements[cow.id],cow.position);assert.equal(JSON.stringify(world),before);
});
test('the same narrow band remains valid for a cow with a real care destination',()=>{
 const {world,layout}=fixture(),cow=world.actors.find(a=>a.id==='cow-5');cow.position=[10.6,0,-39.1];cow.component=null;cow.stationId=layout.sites.cow.stations.filter(s=>s.kind==='bed')[4].id;
 const r=validateAnimalPens(layout,world);assert.equal(r.ok,true,JSON.stringify(r.issues));assert.deepEqual(r.placements[cow.id],cow.position);
});
test('a bogus care destination cannot exempt a free cow from ordinary placement checks',()=>{
 const {world,layout}=fixture(),cow=world.actors.find(a=>a.id==='cow-5');cow.position=[10.6,0,-39.1];cow.stationId='missing-station';
 const r=validateAnimalPens(layout,world);assert.equal(r.ok,false);assert(r.issues.some(i=>i.code==='ROAMING'&&i.target===cow.id));
});
test('harmless border reshaping remains allowed with original legal free positions and verified ordinary steps',()=>{
 const {world,layout}=fixture(),r=validateAnimalPens(layout,world);assert.equal(r.ok,true,JSON.stringify(r.issues));assert.equal(world.actors.length,46);
 for(const a of world.actors.filter(a=>a.kind==='cow')){
  assert.deepEqual(r.placements[a.id],a.position);
  const path=r.ordinaryRoutes[a.id];assert.equal(path.length,2);assert.deepEqual(path[0],a.position);
  assert(Math.hypot(path[1][0]-path[0][0],path[1][2]-path[0][2])>.35);
  assert(segmentInPolygon(path[0].filter((_,i)=>i!==1),path[1].filter((_,i)=>i!==1),layout.sites.cow.polygon,1.6));
 }
});
test('genuinely excluded free cows receive deterministic distinct ordinary staging',()=>{
 const {world,layout}=fixture(),cows=world.actors.filter(a=>a.kind==='cow');
 for(const a of cows)a.position=[18,0,-38];
 const r=validateAnimalPens(layout,world),again=validateAnimalPens(layout,world);assert.equal(r.ok,true,JSON.stringify(r.issues));assert.deepEqual(r.placements,again.placements);
 for(const a of cows){assert(pointInPolygon([r.placements[a.id][0],r.placements[a.id][2]],layout.sites.cow.polygon,1.6));assert(r.ordinaryRoutes[a.id]);}
 for(let i=0;i<cows.length;i++)for(let j=i+1;j<cows.length;j++){const a=r.placements[cows[i].id],b=r.placements[cows[j].id];assert(Math.hypot(a[0]-b[0],a[2]-b[2])>=1.8-1e-8);}
});
test('care destination never waives an actual blocked required route',()=>{
 const {world,layout}=fixture(),cow=world.actors.find(a=>a.id==='cow-5');cow.position=[10.6,0,-39.1];cow.stationId=layout.sites.cow.stations.filter(s=>s.kind==='bed')[4].id;
 world.blocked.push({type:'rectangle',x:7,z:-38.9,hw:.1,hd:1.3});
 const r=validateAnimalPens(layout,world);assert.equal(r.ok,false);assert(r.issues.some(i=>i.code==='ROUTE'));
});
test('live snapshots distinguish a pending authoritative robot job before its physical task starts',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('const penFarmEpochs='),end=html.indexOf('\nconst penEditor=',start),layout=resolveAnimalPens();
 const a={kind:'cow',ref:{type:'pen',i:0},g:{position:{x:8.6,y:.08,z:-36.3}}};
 const c=vm.createContext({G:{S:{pens:{cow:{owned:true,list:[0]}},pets:[]}},visiting:false,BLOCKS:[],OBST_BLOCKS:new Set(),fenceSegs:[],penSceneRegistry:{},dairyPath:{points:[]},cowYardActive:true,remainingSites:Object.fromEntries(['horse','sheep','dog','cat'].map(k=>[k,{active:false}])),remainingLayouts:{},animals:[a],cowIdOf:()=>'cow-1',installedAnimalPens:layout,pointInPolygon,groundY:farmGroundY,penEditableLand:()=>[],cowStatus:{job:{id:'job-1',cowId:'cow-1',stage:'exiting'}}});
 vm.runInContext(html.slice(start,end)+'\nglobalThis.snapshot=snapshotPenWorld;',c);
 const id=layout.sites.cow.stations.find(s=>s.kind==='robot').id;
 assert.equal(c.snapshot().actors[0].careStationId,id);
 c.cowStatus.job.cowId='cow-2';assert.equal(c.snapshot().actors[0].careStationId,null);
 a.cowTask={station:layout.sites.cow.stations[0]};assert.equal(c.snapshot().actors[0].careStationId,a.cowTask.station.id);
 a.cowTask=null;c.cowStatus.job=null;assert.equal(c.snapshot().actors[0].careStationId,null);
});
test('every retained and newly staged ordinary witness executes through the actual unchanged index route',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),routeSource=html.slice(html.indexOf('const toLocal ='),html.indexOf('\nconst blocked ='));
 for(const staged of [false,true]){
  const {world,layout}=fixture();if(staged)for(const a of world.actors.filter(a=>a.kind==='cow'))a.position=[18,0,-38];
  const r=validateAnimalPens(layout,world);assert(r.ok,JSON.stringify(r.issues));
  const fence=(f,hd)=>{const dx=f[2]-f[0],dz=f[3]-f[1],n=Math.hypot(dx,dz);return{x:(f[0]+f[2])/2,z:(f[1]+f[3])/2,hw:n/2,hd,c:dx/n,s:dz/n};};
  const OBST=[...world.blocked.map(s=>s.type==='capsule'?fence([...s.a,...s.b],s.r):s.type==='circle'?{x:s.x,z:s.z,hw:s.r,hd:s.r,radius:s.r,c:1,s:0}:{...s,c:s.c??1,s:s.s??0}),...Object.values(layout.sites).flatMap(s=>[...s.obstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0})),...s.fenceSegments.map(f=>fence(f,s.kind==='cow'?.05:.1))])];
  const pen={custom:true,care:true,poly:layout.sites.cow.polygon},c=vm.createContext({THREE,OBST,PENS:{courtyard:pen},HOME:new THREE.Vector2(1,3),ROAM:19,pointInPolygon,segmentInPolygon,fitsPen:(p,x,z,m)=>pointInPolygon([x,z],p.poly,m)});
  vm.runInContext(routeSource+'\nglobalThis.plan=route;',c);
  for(const [id,[from,to]]of Object.entries(r.ordinaryRoutes)){
   const route=c.plan(new THREE.Vector2(from[0],from[2]),new THREE.Vector2(to[0],to[2]),1.6,pen);
   assert.equal(route.length,1,id+' must have a real direct route');assert.deepEqual(route[0].toArray(),[to[0],to[2]]);
  }
  const failed=c.plan(new THREE.Vector2(10.6,-39.1),new THREE.Vector2(4.2,-38.2),1.6,pen);assert.equal(failed.length,0,'retained trapped start remains forbidden to runtime routing');
 }
});
test('a sufficiently wide added area can hold an ordinary cow and retain every required care route',()=>{
 const {world}=fixture(),cow=defaultSiteRecord('cow');cow.boundary[1].x=16;
 // Keep v2 and its gate edge fixed: moving that endpoint would shift the gate
 // across the accepted stone path, independently invalidating this control.
 cow.boundary.splice(2,0,{id:'eastCorner',x:16,z:-34},{id:'eastReturn',x:9.8,z:-34});
 const layout=resolveAnimalPens({v:1,revision:1,sites:{cow}}),a=world.actors.find(a=>a.id==='cow-5');a.position=[14,0,-38.2];
 assert(!pointInPolygon([14,-38.2],resolveAnimalPens().sites.cow.polygon));
 const r=validateAnimalPens(layout,world);assert(r.ok,JSON.stringify(r.issues));assert.deepEqual(r.placements[a.id],a.position);assert(r.ordinaryRoutes[a.id]);
 assert(r.routes.some(p=>p.actorId===a.id&&p.targetId==='cow-robot-exit'));
});
