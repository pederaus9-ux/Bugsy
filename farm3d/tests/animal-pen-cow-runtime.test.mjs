import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import * as Cow3D from '../cow3d.js';
import * as support from '../animal-pen-cow-support.js';
import {getAnimalCarePose} from '../animal-care-poses.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function slice(start,end){const a=html.indexOf(start),b=html.indexOf(end,a+start.length);assert(a>=0&&b>a);return html.slice(a,b);}
const ordinary=slice('    if (this.rig3d) {','    // face the way it walks');
const directed=slice('function updateCowTaskStep(', '\nbootStep("making the sky")');
const record=defaultSiteRecord('cow');record.boundary[1].x+=3;
const site=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}).sites.cow;
const sample=(x,z)=>x<=9.8&&z>=-40.2&&z<=-32.8?.08:0;
function cow(x){const rig=Cow3D.createCow3D(1.7,x,-39.1,'runtime-support');rig.g.position.y=sample(x,-39.1);return{kind:'cow',pen:{custom:true},g:rig.g,rig3d:rig,vel:new THREE.Vector2(),S:{walk:.8,run:2.6},P:{energy:.5},act:'moving',hop:0,ref:{i:0},need:{tired:0},get pos(){return new THREE.Vector2(this.g.position.x,this.g.position.z);}};}
for(const mode of ['ordinary','directed'])test('actual '+mode+' runtime supports both slab crossings at30/60/120Hz',()=>{
 for(const hz of [30,60,120])for(const direction of [-1,1]){
  const a=cow(direction>0?8.8:10.8),goal=direction>0?10.8:8.8;
  a.rig3d.model.rotation.y=Math.atan2(-direction,0);
  a.cowTask={kind:'feed',stage:'approach',weight:0,station:{id:'feed',facing:0},path:[new THREE.Vector2(goal,-39.1)],waypoints:[]};
  const c=vm.createContext({THREE,Cow3D,...support,cowSupportY:sample,COW_YARD_LAYOUT:{custom:true,floor:.08,obstacles:[]},PENS:{courtyard:a.pen},animals:[a],cowStatus:{feed:1,cows:[{}]},getAnimalCarePose,PRESET:{},nowMs:()=>0,cowIdOf:()=> 'cow',cowStations:{arrive(){}},cowSurfaces:new Map(),P:a.P,releaseCowTask(){a.cowTask=null;},a,dt:1/hz,t:0});
  if(mode==='directed')vm.runInContext(directed,c);
  let previous=[],movingPlanted=0;
  try{for(let i=0;i<4*hz;i++){
   const before=a.g.position.clone();c.ox=before.x;c.oz=before.z;c.t=(i+1)/hz;
   if(mode==='ordinary'){
    const dx=Math.sign(goal-before.x)*Math.min(Math.abs(goal-before.x),.8/hz);
    a.g.position.x+=dx;a.act=Math.abs(dx)>0?'moving':'idle';
    vm.runInContext('(function(){'+ordinary+'}).call(a)',c);
   }else c.updateCowTaskStep(a,1/hz,c.t);
   assert(a.g.position.distanceTo(before)<=.8/hz+1e-10,mode+' full3D speed');
   const feet=a.rig3d.legs.map(l=>({planted:l.planted,p:l.foot.localToWorld(new THREE.Vector3(0,-Cow3D.COW_GAIT.hoof,0))}));
   for(let j=0;j<4;j++){const p=previous[j],q=feet[j];if(q.planted){movingPlanted++;assert(Math.abs(q.p.y-sample(q.p.x,q.p.z))<1e-10,mode+' sole contact');if(p?.planted)assert(q.p.distanceTo(p.p)<1e-10,mode+' planted drift');}else if(p?.planted)assert(q.p.distanceTo(p.p)<=.05,mode+' liftoff');}
   previous=feet;
   // The directed adapter changes into a station pose after arrival. Stop this
   // movement-only fixture before that independent care-pose stage.
   if(mode==='directed'&&a.cowTask.stage==='align')break;
  }
  assert(movingPlanted>hz,'nonvacuous planted coverage');assert(Math.abs(a.g.position.x-goal)<.04);assert(Math.abs(a.g.position.y-sample(goal,-39.1))<1e-10);
  }finally{a.carePose?.reset();a.rig3d.dispose();}
 }
});
test('runtime support sampler follows the shelter slab, independently of expanded fence',()=>{
 assert.equal(typeof support.cowPenSupportHeight,'function');
 assert.equal(support.cowPenSupportHeight(site,9.79,-39.1,()=>0),.08);
 assert.equal(support.cowPenSupportHeight(site,10.2,-39.1,()=>0),0);
 const moved=defaultSiteRecord('cow');moved.structures.shelter[0]-=2;
 const next=resolveAnimalPens({v:1,revision:2,sites:{cow:moved}}).sites.cow;
 assert.equal(support.cowPenSupportHeight(next,9,-39.1,()=>0),0);
 assert.equal(support.cowPenSupportHeight(next,7,-39.1,()=>0),.08);
});
