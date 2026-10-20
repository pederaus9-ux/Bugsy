import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {createHolidayDecoration} from '../holiday-decor.js';
let createFarmDecoration;
try {({createFarmDecoration}=await import('../decor-models.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const DECOR=vm.runInNewContext('('+game.match(/export const DECOR = (\{[\s\S]*?\n\});/)[1]+')');
const ids=Object.keys(DECOR).filter(id=>!DECOR[id].hol&&!DECOR[id].tree);
function placed(id){
 const context={THREE,G:{DECOR},createHolidayDecoration,createFarmDecoration,groundY:()=>.37,decorationGroundY:()=>.37,
  emojiTexture:()=>new THREE.Texture(),contact:(x,z,w,d,parent)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({transparent:true}));m.userData.contactShadow=true;m.rotation.x=-Math.PI/2;m.position.y=.02;parent.add(m);return m;}};
 return vm.runInNewContext(page.slice(page.indexOf('function makeDecor(d)'),page.indexOf('function syncDecor()'))+'\nmakeDecor({id:'+JSON.stringify(id)+',x:2,z:3,rotation:.57});',context);
}
test('the catalog audit includes all31 remaining shop/event/season props and preserves54 total IDs',()=>{
 assert.equal(Object.keys(DECOR).length,54);assert.equal(ids.length,31);
 for(const id of ['lantern','maple','sunflowers','carousel','igloo'])assert(ids.includes(id));
});
for(const id of ids)test(id+' uses complete grounded geometry within its existing footprint and draw budget',()=>{
 const g=placed(id);try{
  assert.equal(g.userData.card,undefined,id+' must not use an emoji billboard');
  assert.equal(g.position.y,.37,id+' uses actual terrain height');assert.equal(g.rotation.y,.57,id+' retains saved orientation');
  g.position.set(0,0,0);g.rotation.y=0;g.updateMatrixWorld(true);const bounds=new THREE.Box3(),v=new THREE.Vector3();let calls=0,triangles=0,radius=0;
  g.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow){
   calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
   assert.notEqual(o.geometry.type,'PlaneGeometry');assert.equal(o.material.map,null);assert.equal(o.material.transparent,false);
   bounds.union(new THREE.Box3().setFromObject(o));const p=o.geometry.attributes.position;
   for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert(Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z));radius=Math.max(radius,Math.hypot(v.x,v.z));}
  }});
  const size=bounds.getSize(new THREE.Vector3()),limit=DECOR[id].size===2?1.2:.6;
  assert(size.x>.1&&size.z>.1,id+' needs real volume');assert(bounds.min.y>=-1e-6,id+' must not be cut off by the ground');
  assert(radius<=limit+1e-6,id+' exceeds original placement/collision clearance');
  assert(calls>0&&calls<=12,id+' draw calls '+calls);assert(triangles<=6500,id+' triangles '+triangles);
 }finally{g.userData.dispose?.();}
});
test('orbiting the camera cannot rotate placed shop or seasonal models',()=>{
 const decorObjs=['lantern','sunflowers','maple'].map(placed),camera=new THREE.PerspectiveCamera();
 try{
  const pose=()=>decorObjs.map(g=>[g.rotation.toArray(),g.children.map(o=>o.rotation.toArray())]);const before=JSON.stringify(pose());
  const turn=page.match(/for \(const o of decorObjs\) if[^\n]*/)?.[0]||'';
  for(const [x,z]of [[9,0],[0,-9],[-9,0],[0,9]]){camera.position.set(x,2,z);vm.runInNewContext(turn,{decorObjs,camera,Math});}
  assert.equal(JSON.stringify(pose()),before,'actual decoration update path must leave placed orientation fixed');
 }finally{decorObjs.forEach(g=>g.userData.dispose?.());}
});
test('each new model owns and releases its geometry/materials exactly once without touching another instance',()=>{
 assert.equal(typeof createFarmDecoration,'function');
 for(const id of ids){const a=createFarmDecoration(id),b=createFarmDecoration(id),owned=new Set(),borrowed=new Set(),disposed=new Map();
  for(const [root,set]of [[a,owned],[b,borrowed]])root.traverse(o=>{if(o.isMesh){set.add(o.geometry);set.add(o.material);}});
  for(const r of [...owned,...borrowed])r.addEventListener('dispose',()=>disposed.set(r,(disposed.get(r)||0)+1));
  a.userData.dispose();a.userData.dispose();assert.equal(disposed.size,owned.size,id);
  for(const r of owned)assert.equal(disposed.get(r),1,id);for(const r of borrowed)assert.equal(disposed.get(r),undefined,id);b.userData.dispose();
 }
});
