import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
let M={};try{M=await import('../cow-yard.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const api=()=>{assert.equal(typeof M.createCowYard,'function');return M.createCowYard();};
const overlaps=(a,b)=>Math.abs(a[0]-b[0])<a[2]+b[2]&&Math.abs(a[1]-b[1])<a[3]+b[3];
function resources(g){let calls=0,triangles=0;const geometries=new Set(),materials=new Set();g.traverse(o=>{if(o.isMesh){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;geometries.add(o.geometry);materials.add(o.material);}});return{calls,triangles,geometries,materials};}
test('five distinct beds and care stations have world approaches and supported docks',()=>{
 const y=api(),l=y.layout,beds=y.stations.filter(s=>s.kind==='bed');assert.equal(beds.length,5);assert.equal(new Set(y.stations.map(s=>s.id)).size,y.stations.length);
 for(const s of y.stations){assert.equal(s.approach.length,3);assert.equal(s.dock.length,3);assert(Number.isFinite(s.facing));assert(Number.isFinite(s.surface));assert(s.dock[0]>l.polygon[0][0]&&s.dock[0]<l.polygon[1][0]);assert(s.dock[2]>l.polygon[0][1]&&s.dock[2]<l.polygon[2][1]);assert(Math.hypot(s.dock[0]-s.approach[0],s.dock[2]-s.approach[2])>=.7);}
 for(let i=0;i<beds.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(beds[i].dock[0]-beds[j].dock[0],beds[i].dock[2]-beds[j].dock[2])>=2.1);
 assert(y.stations.some(s=>s.kind==='feed'));assert(y.stations.some(s=>s.kind==='drink'));assert(y.stations.some(s=>s.kind==='robot'));
 assert(l.robot.entry[2]>l.robot.dock[2]&&l.robot.exit[2]<l.robot.dock[2]);assert(l.gate[1]-l.gate[0]>=1.8);assert(l.tank[0]>l.polygon[1][0]);y.dispose();
});
test('site fits authorized land and clears the barn, chicken yard, old paddock, rocks and field',()=>{
 const y=api(),l=y.layout;for(const[x,z]of l.footprint)assert(Math.hypot(x-1,z-3)<=24);
 const fixed=[[0,0,4.4,5.9],[-10.7,-.4,5.8,5.4],[8.6,1,4.2,9.4],[-12.4,-6.5,.88,.88],[-5.3,-6.5,.88,.88],[-10,17.5,6.6,8]];
 assert.deepEqual(M.cowYardConflicts({blocks:fixed,decor:[]}),[]);assert.equal(M.cowYardConflicts({decor:[{id:'lamp-paid',x:-7,z:-11,r:.6}]}).length,1);assert.equal(M.cowYardConflicts({blocks:[[-9,-12,1.9,1.7]]}).length,1);assert.equal(M.cowYardConflicts({decor:[{id:'outside',x:9,z:5,r:1}]}).length,0);
 for(const p of l.obstacles)assert(fixed.every(b=>!overlaps(p,b)));y.dispose();
});
test('model has selected shelter, five straw beds, separate robot and visible pipe/tank within bounded cost',()=>{
 const y=api();y.group.updateMatrixWorld(true);for(const name of ['cow-shelter','cow-beds','cow-feed','cow-water','cow-robot','cow-pipe','cow-tank','cow-grazing'])assert(y.group.getObjectByName(name),name);
 assert.equal(y.targets.length,4);assert.deepEqual(y.targets.map(t=>t.kind).sort(),['feed','robot','tank','water']);const r=resources(y.group);assert(r.calls<=24,JSON.stringify({calls:r.calls}));assert(r.triangles<=16000,JSON.stringify({triangles:r.triangles}));assert([...r.materials].every(m=>!m.map&&!m.transparent));
 const tank=new THREE.Box3().setFromObject(y.group.getObjectByName('cow-tank'));assert(tank.getSize(new THREE.Vector3()).x>2);y.dispose();
});
test('status and robot animation retain resources and all owned resources dispose once',()=>{
 const y=api(),r=resources(y.group);for(let i=0;i<100;i++){y.setStatus({feed:i%31,waterUntil:i%2?Date.now()+10000:0,tank:{normal:i%49,gold:1},job:i%2?{stage:'milking'}:null});y.setRobotPose(i/99);}
 assert.deepEqual(resources(y.group).geometries,r.geometries);assert.deepEqual(resources(y.group).materials,r.materials);const disposed=new Map();for(const o of [...r.geometries,...r.materials])o.addEventListener('dispose',()=>disposed.set(o,(disposed.get(o)||0)+1));y.dispose();y.dispose();assert.equal(disposed.size,r.geometries.size+r.materials.size);assert([...disposed.values()].every(n=>n===1));
});
