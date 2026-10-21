import test from 'node:test';
import assert from 'node:assert/strict';
import {onFarm,farmGroundY} from '../farm-land.js';
import {cowYardLayout} from '../cow-yard.js';
let M={};try{M=await import('../remaining-care-layout.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const inside=(p,x,z,pad=0)=>p.every(([ax,az],i)=>{const [bx,bz]=p[(i+1)%p.length];return ((bx-ax)*(z-az)-(bz-az)*(x-ax))/Math.hypot(bx-ax,bz-az)>=pad-1e-8;});
test('each supported horse/sheep has a spacious separate pen and stable bed, feed and drink places',()=>{
 assert.equal(typeof M.remainingCareLayouts,'function');const layouts=M.remainingCareLayouts();
 for(const [kind,max]of [['horse',4],['sheep',5]]){const l=layouts[kind];assert.equal(l.capacity,max);assert.equal(l.polygon.length,4);assert(Math.abs(l.polygon.reduce((sum,p,i)=>{const q=l.polygon[(i+1)%l.polygon.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2>=150);
  for(const mode of ['bed','feed','drink'])assert.equal(l.stations.filter(s=>s.kind===mode).length,max);
  for(let i=0;i<max;i++){const stations=l.stations.filter(s=>s.slot===i);assert.equal(stations.length,3);for(const s of stations){assert(inside(l.polygon,s.dock[0],s.dock[2],1.2));assert.equal(farmGroundY(s.dock[0],s.dock[2]),0,'care feet require existing flat land');assert(onFarm(s.dock[0],s.dock[2]));assert(s.path.length>0);}}
  assert(l.gates.every(g=>g.width>=3));assert(l.shelter.height>=(kind==='horse'?3:2));assert.equal(new Set(l.stations.map(s=>s.id)).size,max*3);
 }
});
test('new sites do not intersect the accepted dairy footprint or stone path',()=>{
 assert.equal(typeof M.remainingCareLayouts,'function');const layouts=M.remainingCareLayouts(),cow=cowYardLayout(25),path=[[-1.4,8.1],[-18.4,8.1],[-18.4,-20.5],[-3.25,-25.5],[-3.25,-32.88]];
 for(const l of [layouts.horse,layouts.sheep]){
  for(const p of cow.footprint)assert(!inside(l.polygon,...p));
  for(let i=1;i<path.length;i++)for(let t=0;t<=1;t+=.01){const a=path[i-1],b=path[i];assert(!inside(l.polygon,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,-.9),'stone approach intrudes into '+l.kind);}
 }
});
test('pet beds and separate bowls are distinct, attainable, and never occupy the main doorway',()=>{
 assert.equal(typeof M.remainingCareLayouts,'function');const l=M.remainingCareLayouts();
 for(const k of ['dog','cat']){assert.equal(l[k].capacity,1);assert.deepEqual(l[k].stations.map(s=>s.kind).sort(),['bed','drink','feed']);for(const s of l[k].stations){assert(Math.abs(s.dock[0])>1.4,'keep central entry route clear');assert(s.dock[2]>6.2);}}
 const a=l.dog.stations.find(s=>s.kind==='bed').dock,b=l.cat.stations.find(s=>s.kind==='bed').dock;assert(Math.hypot(a[0]-b[0],a[2]-b[2])>2);
});
test('paid-object conflicts are reported without editing any saved object',()=>{
 assert.equal(typeof M.remainingCareConflicts,'function');const l=M.remainingCareLayouts().horse,d={id:'bench',x:-20,z:-30,r:.6,rotation:.7},saved=structuredClone(d);assert(M.remainingCareConflicts(l,{decor:[d]}).length);assert.deepEqual(d,saved);assert.equal(M.remainingCareConflicts(l,{decor:[{id:'bench',x:0,z:12,r:.6}]}).length,0);
});
