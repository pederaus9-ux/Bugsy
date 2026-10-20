import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../lib/three.module.min.js';
import {G,reset} from './chicken-game-fixture.mjs';
let createUtilityLamp,installUtilityLights;
try {({createUtilityLamp,installUtilityLights}=await import('../utility-lights.js'));}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const page=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
test('utility lamp is an ordinary coin purchase; insufficient coins and full placement preserve ownership',()=>{
 const s=reset(30);assert.equal(G.DECOR.utilitylamp?.cost,250);assert.equal(G.DECOR.utilitylamp?.light,true);
 const buy=vm.runInNewContext('('+game.slice(game.indexOf('function buyDecor('),game.indexOf('export function storeDecor'))+')',{
  S:s,DECOR:G.DECOR,toast(){},sfx(){},closePanel(){},placeDecor:G.placeDecor
 });
 G.view.freeDecorSpot=()=>null;s.coins=249;buy('utilitylamp');assert.equal(s.coins,249);assert.equal(s.decor.inv.utilitylamp,undefined);
 s.coins=1000;buy('utilitylamp');assert.equal(s.coins,750);assert.equal(s.decor.inv.utilitylamp,1);assert.equal(s.decor.placed.length,0);
 G.view.freeDecorSpot=()=>({x:-18,z:8});assert.equal(G.placeDecor('utilitylamp'),true);assert.equal(s.decor.inv.utilitylamp,undefined);
 s.decor.placed[0].rotation=.57;const owned=JSON.stringify(s.decor);G.save();G.load();assert.equal(JSON.stringify(G.S.decor),owned);assert.equal(G.S.pens.chicken.list.length,30);
 G.storeDecor(0);assert.equal(G.S.decor.inv.utilitylamp,1);assert.equal(G.S.coins,750);assert.equal(G.S.v,1);
});
test('utility pole is solid, grounded, within the existing small footprint and owns its resources',()=>{
 assert.equal(typeof createUtilityLamp,'function');const a=createUtilityLamp(),b=createUtilityLamp();a.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(a),size=box.getSize(new T.Vector3());assert(box.min.y>=-1e-6);assert(size.y>=3.4&&size.y<=4);assert(size.x>.3&&size.z>.1);
 let calls=0,tris=0;const resources=new Set(),other=new Set(),v=new T.Vector3();
 a.traverse(o=>{if(o.isMesh){calls++;tris+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.notEqual(o.geometry.type,'PlaneGeometry');assert.equal(o.material.map,null);resources.add(o.geometry);resources.add(o.material);const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert(Math.hypot(v.x,v.z)<=.6+1e-6);}}});
 b.traverse(o=>{if(o.isMesh){other.add(o.geometry);other.add(o.material);}});assert(calls<=12);assert(tris<=6500);assert(a.userData.utilityLamp.anchor.isObject3D);
 const disposed=new Map();for(const r of [...resources,...other])r.addEventListener('dispose',()=>disposed.set(r,(disposed.get(r)||0)+1));a.userData.dispose();a.userData.dispose();assert.equal(disposed.size,resources.size);for(const r of resources)assert.equal(disposed.get(r),1);for(const r of other)assert(!disposed.has(r));b.userData.dispose();
});
test('placed lamp light follows actual rotated/moved source; day disables light and night illuminates again',()=>{
 assert.equal(typeof installUtilityLights,'function');const scene=new T.Scene(),pool=installUtilityLights(scene),root=new T.Group(),model=createUtilityLamp();root.add(model);root.userData.utilityLamp=model.userData.utilityLamp;scene.add(root);root.position.set(2,.4,3);root.rotation.y=.57;
 pool.setLamps([root]);pool.update(new T.Vector3(2,1,3),true);const active=pool.lights.filter(l=>l.intensity>0);assert.equal(active.length,1);assert.equal(active[0].castShadow,false);assert.equal(active[0].distance,10);assert.deepEqual(active[0].position.toArray(),model.userData.utilityLamp.anchor.getWorldPosition(new T.Vector3()).toArray());
 root.position.x+=5;root.rotation.y+=1;pool.update(root.position,true);assert.deepEqual(active[0].position.toArray(),model.userData.utilityLamp.anchor.getWorldPosition(new T.Vector3()).toArray());
 pool.update(root.position,false);assert(pool.lights.every(l=>l.intensity===0));pool.update(root.position,true);assert.equal(pool.lights.filter(l=>l.intensity>0).length,1);
 pool.setLamps([]);pool.update(root.position,true);assert(pool.lights.every(l=>l.intensity===0));pool.dispose();pool.dispose();assert.equal(scene.children.filter(o=>o.isPointLight).length,0);model.userData.dispose();
});
test('many purchased lamps cannot allocate unbounded real lights; nearby sources change without moving models',()=>{
 assert.equal(typeof installUtilityLights,'function');const scene=new T.Scene(),pool=installUtilityLights(scene),roots=[];
 assert.equal(scene.children.filter(o=>o.isPointLight).length,0,'farms without purchased lamps pay no extra fragment-light cost');
 for(let i=0;i<40;i++){const m=createUtilityLamp();m.position.x=i*3;roots.push(m);scene.add(m);}
 const positions=roots.map(r=>r.position.toArray());pool.setLamps(roots);pool.update(new T.Vector3(0,0,0),true);assert.equal(pool.lights.length,4);assert.equal(pool.lights.filter(l=>l.intensity>0).length,4);assert.equal(scene.children.filter(o=>o.isPointLight).length,4);const before=pool.lights.map(l=>l.position.x);
 pool.update(new T.Vector3(117,0,0),true);assert(pool.lights.every(l=>l.position.x>before[3]));assert.deepEqual(roots.map(r=>r.position.toArray()),positions);
 pool.setLamps([roots[0]]);pool.update(roots[0].position,true);assert.equal(pool.lights.filter(l=>l.intensity>0).length,1);pool.setLamps([]);assert.equal(scene.children.filter(o=>o.isPointLight).length,0);pool.dispose();roots.forEach(r=>r.userData.dispose());
});
test('actual world consumer installs once, renders lighting after movement and precaches the new dependency',()=>{
 assert.match(page,/import \{createUtilityLamp,installUtilityLights\} from ['"]\.\/utility-lights\.js\?v=1['"]/);
 assert.equal(page.split('installUtilityLights(scene)').length,2);assert.match(page,/utilityLights\.setLamps\(decorObjs\)/);
 const frame=page.slice(page.indexOf('function frame() {'));assert(frame.indexOf('utilityLights.update(')>frame.indexOf('updateWalk(dt)'));assert(frame.indexOf('utilityLights.update(')<frame.indexOf('composer.render()'));
 const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert(sw.includes('utility-lights.js?v=1'));
});
