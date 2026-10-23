import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {cowPenStep} from '../animal-pen-cow-support.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('function updateCowTaskStep('),end=html.indexOf('\nbootStep("making the sky")',start),source=html.slice(start,end);assert(start>=0&&end>start);
function fixture({kind='robot',stage='approach',custom=false,gap=.033,blocked=false,slope=false,intermediate=false}={}){
 const dock=[9,.08,-36],p=new THREE.Vector2(dock[0],dock[2]),a={kind:'cow',g:{position:new THREE.Vector3(9,.08,-36+gap)},rig3d:{model:{rotation:{y:0}}},carePose:{reset(){}},S:{walk:.8},ref:{i:0},vel:new THREE.Vector2(),need:{},cowTask:{kind,stage,jobId:1,station:{facing:Math.PI},token:{},weight:0,waypoints:intermediate?[[9,.08,-37]]:[],path:[p],gate:{update(){return false;}}}};
 Object.defineProperty(a,'pos',{get(){return new THREE.Vector2(a.g.position.x,a.g.position.z);}});
 const arrivals=[],status={job:{id:1,cowId:'cow-1',stage:'approaching'},feed:1,waterUntil:1e10,cows:[{ready:{},feedCharged:false}]},ctx={THREE,animals:[a,...(blocked?[{kind:'cow',g:{position:new THREE.Vector3(...dock)}}]:[])],cowStatus:status,cowIdOf:()=> 'cow-1',nowMs:()=>0,clockT:0,PRESET:{},COW_YARD_LAYOUT:{custom,floor:.08,robot:{dock},obstacles:[]},PENS:{courtyard:{}},fitsPen:()=>false,route(){throw Error('Unexpected replan');},cowStations:{arrive(t){arrivals.push(t);}},releaseCowTask(){throw Error('Unexpected release');},Cow3D:{updateCow3D(){}},applyCowPenSupport(){},cowPenStep,cowSupportY:()=>slope?.18:.08};
 if(kind!=='robot')ctx.cowStatus={...status,job:null};
 const step=vm.runInNewContext(source+'\nupdateCowTaskStep;',ctx);return{a,p,arrivals,step:dt=>step(a,dt,0)};
}
for(const custom of [false,true])for(const hz of [30,60,120])test(`terminal robot dock completes bounded movement at ${hz}Hz custom=${custom}`,()=>{
 const f=fixture({custom});for(let n=0;n<12&&f.a.cowTask.stage==='approach';n++){const before=f.a.g.position.clone();f.step(1/hz);assert(f.a.g.position.distanceTo(before)<=.8/hz+1e-10);}
 assert.equal(f.a.cowTask.stage,'align');assert(f.a.pos.distanceTo(f.p)<1e-10,'must reach final dock before alignment');assert.equal(f.arrivals.length,1);
});
test('blocked final robot dock is retained and cannot become an arrival',()=>{
 const f=fixture({blocked:true});for(let n=0;n<5;n++)f.step(1/120);assert.equal(f.a.cowTask.stage,'approach');assert.equal(f.a.cowTask.path.length,1);assert.equal(f.arrivals.length,0);assert.equal(f.a.g.position.z,-35.967);
});
test('terminal arrival is decided after actual custom support limits the 3D step',()=>{
 const f=fixture({custom:true,gap:.006,slope:true}),before=f.a.g.position.clone();f.step(1/120);assert(f.a.g.position.distanceTo(before)<=.8/120+1e-10);assert(f.a.pos.distanceTo(f.p)>1e-5);assert.equal(f.a.cowTask.path.length,1,'support-limited position has not arrived');assert.equal(f.arrivals.length,0);
});
for(const options of [{kind:'drink'},{intermediate:true},{stage:'exit'}])test('unrelated accepted waypoint policy is unchanged '+JSON.stringify(options),()=>{
 const f=fixture(options);f.step(1/120);assert.equal(f.a.cowTask.path.length,0);assert(f.a.pos.distanceTo(f.p)>.025);
});
