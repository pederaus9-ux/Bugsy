import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createChickenYard} from '../chicken-yard.js';
import {createStationScheduler} from '../animal-stations.js';
import {createChicken3D,updateChicken3D} from '../chicken3d.js';
import {getAnimalCarePose} from '../animal-care-poses.js';

function skinBounds(r){r.g.updateMatrixWorld(true);r.card.skeleton.update();const b=new T.Box3(),v=new T.Vector3();for(let i=0;i<r.card.geometry.attributes.position.count;i++){r.card.getVertexPosition(i,v);b.expandByPoint(v.applyMatrix4(r.card.matrixWorld));}return b;}
function stations(y){assert.ok(Array.isArray(y.stations),'yard must expose physical care stations');return y.stations;}
test('both coop doors are real openings with independent continuous supported ramps',()=>{
 const y=createChickenYard();try{assert.equal(y.accesses?.length,2,'two physical doorways are required');y.group.updateMatrixWorld(true);const coop=y.targets.find(t=>t.kind==='coop').object;
 for(const A of y.accesses){const beds=y.stations.filter(s=>s.kind==='bed'&&s.lane===A.id);assert.equal(beds.length,15);for(const dx of [-.3,0,.3])for(const h of [.8,1.1,1.5])assert.equal(new T.Raycaster(new T.Vector3(A.entry[0]+dx,h,.9),new T.Vector3(0,0,-1),0,1.3).intersectObject(coop,true).length,0,'actual wall blocks doorway');
  for(let n=0;n<=100;n++){const z=A.rampStart[2]+(A.rampEnd[2]-A.rampStart[2])*n/100,p=y.sampleStationSupport(beds[0].id,A.rampStart[0],z),hits=new T.Raycaster(new T.Vector3(A.rampStart[0],2,z),new T.Vector3(0,-1,0)).intersectObject(y.group,true).filter(h=>h.point.y<1);assert(p.inside);assert.ok(Math.abs(p.height-A.floor*n/100)<1e-8);assert(hits.length);assert.ok(Math.abs(hits[0].point.y-p.height)<.012);}
 }
 const floor=new T.Box3().setFromObject(coop);assert.ok(floor.getSize(new T.Vector3()).x>6,'larger coop must give the two doorways room');
 }finally{y.dispose();}
});
test('thirty separately reserved resting places fit inside the raised coop',()=>{
 const y=createChickenYard();try{const beds=stations(y).filter(s=>s.kind==='bed');assert.equal(beds.length,30);assert.equal(new Set(beds.map(s=>s.id)).size,30);const scheduler=createStationScheduler(y.stations);
 for(let i=0;i<30;i++){const s=beds[i];assert.equal(scheduler.request('hen-'+i,'bed',s.id).stationId,s.id);assert.ok(s.dock[1]>.6);assert.ok(s.dock[0]>-14.35&&s.dock[0]<-8.65);assert.ok(s.dock[2]>-4.25&&s.dock[2]<-.1);for(let j=0;j<i;j++)assert.ok(Math.hypot(s.dock[0]-beds[j].dock[0],s.dock[2]-beds[j].dock[2])>=.66);assert.equal(y.sampleStationSupport(s.id,s.dock[0],s.dock[2]).height,s.dock[1]);}
 assert.equal(scheduler.request('overflow','bed'),null);
 }finally{y.dispose();}
});
test('feed and water visits reserve limited visible contact surfaces without producing supplies',()=>{
 const y=createChickenYard();try{const all=stations(y),scheduler=createStationScheduler(all);for(const kind of ['feed','drink']){const slots=all.filter(s=>s.kind===kind);assert.ok(slots.length>=2&&slots.length<=4);for(let i=0;i<slots.length;i++){assert.ok(scheduler.request(kind+i,kind));assert.ok(slots[i].contact[1]>.2&&slots[i].contact[1]<.3);}assert.equal(scheduler.request(kind+'overflow',kind),null);}const before=y.group.userData.appearance;y.setStatus({feedMs:0,waterMs:0,total:0});assert.deepEqual(y.group.userData.appearance,before);}finally{y.dispose();}
});
test('the doorway is a real opening and ramp support continuously meets the interior floor',()=>{
 const y=createChickenYard();try{stations(y);assert.equal(typeof y.sampleStationSupport,'function');y.group.updateMatrixWorld(true);const coop=y.targets.find(t=>t.kind==='coop').object;
 for(const x of [-11.9,-11.6,-11.3])for(const h of [.8,1.1,1.5]){const hits=new T.Raycaster(new T.Vector3(x,h,.9),new T.Vector3(0,0,-1),0,1.6).intersectObject(coop,true);assert.equal(hits.length,0,'door blocked at '+[x,h]);}
 const s=y.stations.find(s=>s.kind==='bed'),a=y.access.rampStart,b=y.access.rampEnd;let last=0;
 for(let i=0;i<=100;i++){const z=a[2]+(b[2]-a[2])*i/100,p=y.sampleStationSupport(s.id,a[0],z);assert.ok(p.inside);assert.ok(Math.abs(p.height-last)<.012,'ramp discontinuity');last=p.height;const hits=new T.Raycaster(new T.Vector3(a[0],2,z),new T.Vector3(0,-1,0)).intersectObject(y.group,true).filter(h=>h.point.y<1);assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-p.height)<.012,'sample differs from visible ramp');}
 assert.ok(Math.abs(last-s.dock[1])<1e-8);assert.equal(y.sampleStationSupport(s.id,-8,0).inside,false);
 }finally{y.dispose();}
});
test('chicken lying pose folds the actual legs above the raised floor and restores the accepted rig',()=>{
 const r=createChicken3D(.72);r.g.position.y=.66675;const p=getAnimalCarePose('chicken',r),before=skinBounds(r);try{
 for(let i=0;i<=20;i++){p.apply({mode:'lie',weight:i/20});const b=skinBounds(r);assert.ok(b.min.y>=r.g.position.y-.002,'skin below coop floor');if(i===20){assert.ok(b.max.y<before.max.y-.12,'hen must settle, not stand sleeping');assert.ok(b.min.y<r.g.position.y+.06);for(const l of r.legs)assert.ok(Math.abs(l.knee.rotation.x)>1,'leg must fold');}p.reset();}
 assert.ok(skinBounds(r).min.distanceTo(before.min)<1e-9);
 }finally{p.reset();r.dispose();}
});
test('feed peck and water sip place the actual beak at the visible surface with feet supported',()=>{
 const y=createChickenYard();try{for(const s of stations(y).filter(s=>['feed','drink'].includes(s.kind))){const r=createChicken3D(.72,s.dock[0],s.dock[2]);r.model.rotation.y=s.facing;const p=getAnimalCarePose('chicken',r);try{p.apply({mode:s.kind,weight:1,target:new T.Vector3(...s.contact)});r.g.updateMatrixWorld(true);const tip=r.head.localToWorld(new T.Vector3(0,-.012,-.1225));assert.ok(tip.distanceTo(new T.Vector3(...s.contact))<.015,s.kind+' beak misses '+tip.toArray());assert.ok(skinBounds(r).min.y>=-.002);for(const l of r.legs){const f=l.foot.getWorldPosition(new T.Vector3());assert.ok(Math.abs(f.y-r.spec.hoof*r.model.scale.x)<.002);} }finally{p.reset();r.dispose();}}}finally{y.dispose();}
});
test('opt-in ramp support keeps planted poultry feet on the actual access surface',()=>{
 const r=createChicken3D(.72,0,2),height=(x,z)=>Math.max(0,Math.min(.667,(2-z)*.23));r.sampleSupport=height;try{for(let i=0;i<400;i++){const dz=-.4/60;r.g.position.z+=dz;r.g.position.y=height(0,r.g.position.z);updateChicken3D(r,0,dz,1/60,'walk');r.g.updateMatrixWorld(true);for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());assert.ok(Math.abs(f.y-r.spec.hoof*r.model.scale.x-height(f.x,f.z))<.002,'planted foot is unsupported at '+i);}}}finally{r.dispose();}
});
