import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {COW_YARD_LAYOUT,cowYardLayout,createCowYard,cowYardConflicts} from '../cow-yard.js';
import {createCow3D} from '../cow3d.js';
import {onFarm,farmGroundY} from '../farm-land.js';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');

const area=l=>Math.abs((l.polygon[1][0]-l.polygon[0][0])*(l.polygon[2][1]-l.polygon[1][1]));
function connectedWalkingArea(l){
 const step=.1,pad=.65,[x0,z0]=l.polygon[0],[x1]=l.polygon[1],z1=l.polygon[2][1];
 const points=new Set();
 for(let ix=0;x0+pad+ix*step<x1-pad;ix++)for(let iz=0;z0+pad+iz*step<z1-pad;iz++){
  const x=x0+pad+ix*step,z=z0+pad+iz*step;
  if(!l.obstacles.some(([bx,bz,hw,hd])=>Math.abs(x-bx)<hw+pad&&Math.abs(z-bz)<hd+pad))points.add(ix+','+iz);
 }
 let largest=0;
 while(points.size){const first=points.values().next().value,queue=[first];points.delete(first);for(let i=0;i<queue.length;i++){const [x,z]=queue[i].split(',').map(Number);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(z+dz);if(points.delete(k))queue.push(k);}}largest=Math.max(largest,queue.length);}
 return largest*step*step;
}
test('northern yard provides double the floor and double the connected cow-width walking area',()=>{
 const old=COW_YARD_LAYOUT,l=cowYardLayout(25),before=connectedWalkingArea(old),after=connectedWalkingArea(l);
 console.log('COW ROOM',JSON.stringify({oldFloor:area(old),floor:area(l),oldConnected:before,connected:after}));
 assert(area(l)>=2*area(old)-1e-8,'floor area has not doubled');
 assert(after>=2*before,'cow-width connected walking area has not doubled');
});
test('each of five resting cows has actual standing-skin clearance for a full turn',()=>{
 const l=cowYardLayout(25);
 for(const s of l.stations.filter(s=>s.kind==='bed')){
  const r=createCow3D(1.7,s.dock[0],s.dock[2],'turn-'+s.id);r.g.position.y=l.floor;
  try{for(let angle=0;angle<Math.PI*2;angle+=Math.PI/12){r.model.rotation.y=angle;r.g.updateMatrixWorld(true);r.card.skeleton.update();
   const box=new THREE.Box3().setFromObject(r.card,true);
   for(const [x,z,hw,hd] of l.obstacles)assert(!(box.max.x>x-hw&&box.min.x<x+hw&&box.max.z>z-hd&&box.min.z<z+hd),s.id+' standing skin hits a divider/wall while turning at '+angle);
  }}finally{r.dispose();}
 }
});
test('enlarged physical foundation stays on flat authorized land and preserves the stone-path entrance',()=>{
 const y=createCowYard({north:25}),l=y.layout;
 try{
  assert.deepEqual(l.gate,[-4.4,-2.1]);assert.equal(l.polygon[2][1],-32.8);
  for(const [x,z] of l.footprint){assert(onFarm(x,z,24),'outside existing authorized farm');assert.equal(farmGroundY(x,z),0);}
  y.group.updateMatrixWorld(true);
  for(let x=l.polygon[0][0]+.3;x<l.polygon[1][0]-.3;x+=.5)for(let z=l.polygon[0][1]+.3;z<l.polygon[2][1]-.3;z+=.5){
   const hits=new THREE.Raycaster(new THREE.Vector3(x,.09,z),new THREE.Vector3(0,-1,0),0,.03).intersectObject(y.group,true);
   assert(hits.length,'missing physical floor at '+[x,z]);
  }
  const decor=[{id:'paid',x:5,z:-36,r:.6}],copy=structuredClone(decor);
  assert(cowYardConflicts({layout:l,decor}).length,'new extension must protect saved objects');assert.deepEqual(decor,copy);
 }finally{y.dispose();}
});
test('care-pose contact targets follow the actual moved feed and water geometry',()=>{
 const y=createCowYard({north:25}),c={THREE,cowYard:y,NORTH_EXTENSION:25};vm.createContext(c);
 try{vm.runInContext(html.slice(html.indexOf('const cowSurfaces='),html.indexOf('\nCHICKEN_YARD_LAYOUT.obstacles'))+';globalThis.targets=cowSurfaces;',c);y.group.updateMatrixWorld(true);
  for(const s of y.stations.filter(s=>s.kind==='feed'||s.kind==='drink')){const object=y.targets.find(t=>t.kind===(s.kind==='feed'?'feed':'water')).object,center=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()),target=c.targets.get(s.id);assert(Math.abs(target.x-(s.kind==='feed'?s.dock[0]:center.x))<1e-6,'muzzle target misses moved '+s.kind);assert.equal(target.y,s.surface);assert(Math.abs(target.z-(s.kind==='feed'?center.z:s.dock[2]))<1e-6);}
 }finally{y.dispose();}
});
test('owned grass clearings cover the full enlarged foundation',()=>{
 const l=cowYardLayout(25),tiles=[],start=html.indexOf('function setCowGrass('),c={COW_YARD_LAYOUT:l,cowPlantClearing:null,moveClear:(key,x,z,r)=>tiles.push([x,z,r]),CLEARS:new Map()};vm.createContext(c);
 vm.runInContext(html.slice(start,html.indexOf('\nfunction syncCowYard(',start))+';setCowGrass(true);',c);
 for(let x=l.footprint[0][0]+.1;x<l.footprint[1][0];x+=.25)for(let z=l.footprint[0][1]+.1;z<l.footprint[2][1];z+=.25)assert(tiles.some(([cx,cz,r])=>Math.abs(x-cx)<=r&&Math.abs(z-cz)<=r),'uncleared enlarged foundation '+[x,z]);
});
test('ordinary courtyard destinations use the enlarged width rather than the old central three-metre circle',()=>{
 const l=cowYardLayout(25),pen={poly:l.polygon,bed:l.bed};let seed=12345;
 const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const c={THREE,PENS:{courtyard:pen},BLOCKS:l.obstacles,HOME:new THREE.Vector2(1,3),ROAM:19,fitsPen:(p,x,z,m)=>x>=p.poly[0][0]+m&&x<=p.poly[1][0]-m&&z>=p.poly[0][1]+m&&z<=p.poly[2][1]-m};vm.createContext(c);
 const start=html.indexOf('function freePoint(');vm.runInContext(html.slice(start,html.indexOf('// little mood bubbles',start))+';globalThis.pick=freePoint;',c);
 const samples=Array.from({length:500},()=>c.pick(random,0,0,3,pen));
 for(const p of samples)assert(c.fitsPen(pen,p.x,p.y,.7));
 const span=Math.max(...samples.map(p=>p.x))-Math.min(...samples.map(p=>p.x));assert(span>=(l.polygon[1][0]-l.polygon[0][0]-1.4)*.7,'cow wandering still confined to '+span+'m');
});
test('expanded shelter retains the original model draw and triangle budgets',()=>{
 const y=createCowYard({north:25});let calls=0,triangles=0;
 try{y.group.traverse(o=>{if(o.isMesh){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});assert(calls<=24,'expanded draw calls '+calls);assert(triangles<=16000,'expanded triangles '+triangles);console.log('EXPANDED YARD COST',JSON.stringify({calls,triangles}));}finally{y.dispose();}
});
test('station navigation and native tap aiming follow the moved real targets',()=>{
 const y=createCowYard({north:25}),c={THREE,cowYard:y,NORTH_EXTENSION:25};vm.createContext(c);
 try{const start=html.indexOf('function keyPos('),end=html.indexOf('\n}',start)+2;vm.runInContext(html.slice(start,end)+';globalThis.pick=keyPos;',c);y.group.updateMatrixWorld(true);
  for(const t of y.targets){const p=c.pick('cow:'+t.kind),center=t.kind==='robot'?new THREE.Vector3(...y.layout.robot.dock):new THREE.Box3().setFromObject(t.object).getCenter(new THREE.Vector3());assert(Math.hypot(p.x-center.x,p.z-center.z)<1e-6,'navigation misses moved '+t.kind);const origin=new THREE.Vector3(p.x,1.6,p.z+2.3),ray=new THREE.Raycaster(origin,p.clone().sub(origin).normalize(),0,6);assert(ray.intersectObject(t.object,true).length,'station aim ray misses '+t.kind);}
 }finally{y.dispose();}
});
