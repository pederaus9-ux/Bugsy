import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
let createHolidayDecoration;
try {({createHolidayDecoration}=await import('../holiday-decor.js'));} catch(e) {if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const DECOR=vm.runInNewContext('('+game.match(/export const DECOR = (\{[\s\S]*?\n\});/)[1]+')');
const ids=Object.keys(DECOR).filter(id=>DECOR[id].hol);
function placed(id){
 const context={THREE,G:{DECOR},createHolidayDecoration,groundY:()=>0,decorationGroundY:()=>0,
  emojiTexture:()=>new THREE.Texture(),contact:(x,z,w,d,parent)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({transparent:true}));o.userData.contactShadow=true;o.rotation.x=-Math.PI/2;o.position.y=.02;parent.add(o);return o;},std:x=>new THREE.MeshStandardMaterial(x)};
 return vm.runInNewContext(page.slice(page.indexOf('function makeDecor(d)'),page.indexOf('function syncDecor()'))+'\nmakeDecor({id:'+JSON.stringify(id)+',x:2,z:3});',context);
}
for(const id of ids)test(id+' is a complete above-ground volume rather than a camera-facing card',()=>{
 const g=placed(id);g.position.set(0,0,0);g.updateMatrixWorld(true);
 const b=new THREE.Box3();g.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow)b.union(new THREE.Box3().setFromObject(o));});const size=b.getSize(new THREE.Vector3());
 assert.ok(size.z>.1,id+' needs real depth, got '+size.z);
 assert.ok(b.min.y>=-1e-6,id+' is buried below the ground: '+b.min.y);
 let calls=0,triangles=0;g.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow){calls++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.notEqual(o.geometry.type,'PlaneGeometry');assert.equal(o.material.transparent,false);assert.equal(o.material.map,null);}});
 assert.ok(calls<=12,id+' draw budget '+calls);assert.ok(triangles<=6500,id+' triangle budget '+triangles);
 assert.equal(g.userData.card,undefined);g.userData.dispose?.();
});
test('refresh disposal releases only the solid prop resources exactly once',()=>{
 assert.equal(typeof createHolidayDecoration,'function');
 const a=createHolidayDecoration('jack'),b=createHolidayDecoration('jack'),owned=new Set(),borrowed=new Set();
 a.traverse(o=>{if(o.isMesh){owned.add(o.geometry);owned.add(o.material);}});b.traverse(o=>{if(o.isMesh){borrowed.add(o.geometry);borrowed.add(o.material);}});
 const disposed=new Map();for(const r of [...owned,...borrowed])r.addEventListener('dispose',()=>disposed.set(r,(disposed.get(r)||0)+1));
 a.userData.dispose();a.userData.dispose();assert.equal(disposed.size,owned.size);for(const r of owned)assert.equal(disposed.get(r),1);for(const r of borrowed)assert.equal(disposed.get(r),undefined);b.userData.dispose();
});
test('unrelated shop/event/seasonal IDs retain their existing renderer',()=>{
 assert.equal(typeof createHolidayDecoration,'function');for(const id of ['bench','fountain','hay','pine','unicorn','unknown'])assert.equal(createHolidayDecoration(id),null,id);
});
test('placed prop cleanup also owns its contact geometry without disposing the borrowed shadow material',()=>{
 const g=placed('jack'),shadow=g.children.find(o=>o.userData.contactShadow);let geometryDisposals=0,materialDisposals=0;
 shadow.geometry.addEventListener('dispose',()=>geometryDisposals++);shadow.material.addEventListener('dispose',()=>materialDisposals++);
 g.userData.dispose();g.userData.dispose();assert.equal(geometryDisposals,1);assert.equal(materialDisposals,0);
});
for(const id of ids)test(id+' fits the existing circular walking/placement clearance',()=>{
 const g=placed(id);g.position.set(0,0,0);g.updateMatrixWorld(true);const limit=DECOR[id].size===2?1.2:.6,v=new THREE.Vector3();let radius=0;
 g.traverse(o=>{if(o.isMesh&&!o.userData.contactShadow){const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);radius=Math.max(radius,Math.hypot(v.x,v.z));}}});
 assert.ok(radius<=limit+1e-6,id+' radius '+radius+' exceeds existing clearance '+limit);g.userData.dispose();
});
test('curved pumpkin skin shades continuously across shared back-surface vertices',()=>{
 const g=createHolidayDecoration('jack'),seen=new Map();let duplicates=0,worst=0;
 g.traverse(o=>{if(o.isMesh&&o.material.color.getHex()===0xdd7026){const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;for(let i=0;i<p.count;i++){if(p.getZ(i)>=-.1)continue;const key=[p.getX(i),p.getY(i),p.getZ(i)].join(','),value=[n.getX(i),n.getY(i),n.getZ(i)];if(seen.has(key)){duplicates++;worst=Math.max(worst,...value.map((v,k)=>Math.abs(v-seen.get(key)[k])));}else seen.set(key,value);}}});
 assert.ok(duplicates>50,'exercise connected curved skin');assert.ok(worst<1e-6,'visible normal seam '+worst);g.userData.dispose();
});
