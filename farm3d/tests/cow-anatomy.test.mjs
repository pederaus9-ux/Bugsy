import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as T from '../lib/three.module.min.js';
import {createCow3D,updateCow3D} from '../cow3d.js';

test('cow anatomy has outward closed surfaces, finite normalized weights and rigid flat cloven soles',()=>{
 const r=createCow3D(1.8),g=r.card.geometry,a=g.attributes;
 const vertices=new Map(),parent=[],volume=[];
 const root=i=>parent[i]===i?i:(parent[i]=root(parent[i]));
 const id=(v)=>{const key=[a.position.getX(v),a.position.getY(v),a.position.getZ(v)].map(x=>Math.round(x*1e7)).join(',');if(!vertices.has(key)){const i=vertices.size;vertices.set(key,i);parent.push(i);volume.push(0);}return vertices.get(key);};
 const edges=new Map(),triangles=[];
 for(let v=0;v<a.position.count;v+=3){
  const ids=[id(v),id(v+1),id(v+2)];
  const p=[v,v+1,v+2].map(n=>new T.Vector3().fromBufferAttribute(a.position,n));
  assert.ok(p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).lengthSq()>1e-18,'nondegenerate triangle');
  for(let j=0;j<3;j++){const x=ids[j],y=ids[(j+1)%3],key=Math.min(x,y)+','+Math.max(x,y);const edge=edges.get(key)||{count:0,balance:0};edge.count++;edge.balance+=x<y?1:-1;edges.set(key,edge);parent[root(y)]=root(x);}
  triangles.push({id:ids[0],volume:p[0].dot(p[1].clone().cross(p[2]))/6});
 }
 for(const e of edges.values()){assert.equal(e.count,2,'closed manifold part');assert.equal(e.balance,0,'consistent edge winding');}
 for(const t of triangles)volume[root(t.id)]+=t.volume;
 const components=volume.filter((v,i)=>root(i)===i);
 assert.ok(components.length>1);for(const v of components)assert.ok(v>0,'outward positive volume '+v);
 let blended=0;
 for(let v=0;v<a.position.count;v++){
  const weights=[0,1,2,3].map(j=>a.skinWeight.getComponent(v,j));
  assert.ok(weights.every(w=>Number.isFinite(w)&&w>=0));assert.ok(Math.abs(weights.reduce((s,w)=>s+w,0)-1)<1e-6);
  for(let j=0;j<4;j++)assert.ok(a.skinIndex.getComponent(v,j)<24);
  if(weights.filter(w=>w>0).length>1)blended++;
 }
 assert.ok(blended>100,'transition regions are actually blended');
 const bodyId=r.card.skeleton.bones.indexOf(r.body),bodyPoints=new Set();
 for(let v=0;v<a.position.count;v++)if(a.skinIndex.getX(v)===bodyId)bodyPoints.add([a.position.getX(v),a.position.getY(v),a.position.getZ(v)].map(x=>Math.round(x*1e6)).join(','));
 for(const key of bodyPoints){const [x,y,z]=key.split(',').map(Number);assert.ok(bodyPoints.has([-x,y,z].join(',')),'torso/udder geometry is bilaterally symmetric');}
 for(const leg of r.legs){
  const b=r.card.skeleton.bones.indexOf(leg.foot),ys=[],xs=[];
  for(let v=0;v<a.position.count;v++)if(a.skinIndex.getX(v)===b){assert.equal(a.skinWeight.getX(v),1);ys.push(a.position.getY(v));xs.push(a.position.getX(v)-leg.x);}
  const sole=Math.min(...ys),flat=ys.filter(y=>Math.abs(y-sole)<1e-7);
  assert.ok(flat.length>=24,'flat sole triangles');assert.ok(xs.some(x=>x<-.03)&&xs.some(x=>x>.03),'two claws');
 }
 assert.ok(a.position.count/3<=10592,'do not increase frozen triangle cost');
 r.dispose();
});

test('actual neutral cow skin fits the B1 envelope and exposes attached neck/head/limbs',()=>{
 const r=createCow3D(1.7,0,0,'Bessie');r.g.updateMatrixWorld(true);
 const box=new T.Box3(),p=new T.Vector3();
 for(let v=0;v<r.card.geometry.attributes.position.count;v++)box.expandByPoint(r.card.getVertexPosition(v,p).applyMatrix4(r.card.matrixWorld));
 const scale=r.model.scale.x;
 assert.ok(box.min.x>=-.443*scale&&box.max.x<=.443*scale);
 assert.ok(box.min.y>=-.002&&box.max.y<=1.724*scale);
 assert.ok(box.min.z>=-1.161*scale&&box.max.z<=.775*scale);
 const ray=new T.Raycaster();
 for(const [bone,offset]of [[r.neck,[0,.03,-.06]],[r.head,[0,0,0]],[r.body,[0,0,0]]]){
  const target=bone.localToWorld(new T.Vector3(...offset));ray.set(target.clone().add(new T.Vector3(3,0,0)),new T.Vector3(-1,0,0));assert.ok(ray.intersectObject(r.card).length,'anatomical region is pickable');
 }
 // Eyes must overlap the skull surface at their centers, not merely be nearby.
 for(const [i,eye]of r.eyes.entries()){
  const side=i===0?-1:1,center=eye.getWorldPosition(new T.Vector3()),eyeBox=new T.Box3(),id=r.card.skeleton.bones.indexOf(eye);
  const geo=r.card.geometry;
  for(let v=0;v<geo.attributes.position.count;v++)if(geo.attributes.skinIndex.getX(v)===id)eyeBox.expandByPoint(r.card.getVertexPosition(v,new T.Vector3()).applyMatrix4(r.card.matrixWorld));
  ray.set(center.clone().add(new T.Vector3(side*3,0,0)),new T.Vector3(-side,0,0));
  const skull=ray.intersectObject(r.card).find(hit=>r.card.skeleton.bones[geo.attributes.skinIndex.getX(hit.face.a)]===r.head);
  assert.ok(skull,'skull behind each eye');assert.ok(skull.point.x>=eyeBox.min.x&&skull.point.x<=eyeBox.max.x,'eye is attached to skull surface');
 }
 for(const l of r.legs){
  const hip=l.hip.getWorldPosition(new T.Vector3()),knee=l.knee.getWorldPosition(new T.Vector3()),foot=l.foot.getWorldPosition(new T.Vector3());
  for(const t of [.0,.2,.4,.6,.8,1])for(const [from,to]of [[hip,knee],[knee,foot]]){
   const target=from.clone().lerp(to,t);ray.set(target.clone().add(new T.Vector3(3,0,0)),new T.Vector3(-1,0,0));assert.ok(ray.intersectObject(r.card).length,'no floating limb segment');
  }
 }
 const out={height:1.7,scale,triangles:r.card.geometry.attributes.position.count/3,bones:r.card.skeleton.bones.length,actualSkinnedBounds:{min:box.min.toArray(),max:box.max.toArray()},units:'game coordinates; no physical meter calibration'};
 mkdirSync(new URL('./artifacts/',import.meta.url),{recursive:true});writeFileSync(new URL('./artifacts/cow-anatomy-static.json',import.meta.url),JSON.stringify(out,null,2));
 r.dispose();
});

test('head/neck transitions remain finite and independent; motion algorithm stays externally controlled',()=>{
 const a=createCow3D(1.7,0,0,'Bessie'),b=createCow3D(1.7,0,0,'Daisy');
 assert.equal(a.card.geometry,b.card.geometry);assert.equal(a.card.material,b.card.material);assert.notEqual(a.card.skeleton,b.card.skeleton);
 const before=b.neck.quaternion.clone();
 for(const act of ['eating','idle','resting','sleeping']){
  for(let n=0;n<90;n++)updateCow3D(a,0,0,1/60,n/60,act);
  a.g.updateMatrixWorld(true);
  for(const bone of a.card.skeleton.bones)assert.ok(bone.matrixWorld.elements.every(Number.isFinite));
  const box=new T.Box3();for(let v=0;v<a.card.geometry.attributes.position.count;v++)box.expandByPoint(a.card.getVertexPosition(v,new T.Vector3()).applyMatrix4(a.card.matrixWorld));
  assert.ok(box.min.y>-.002&&box.max.y<2.1,'posed skin stays finite and inside vertical culling bound');
 }
 assert.ok(b.neck.quaternion.equals(before));assert.equal(a.state.distance,0);assert.equal(a.state.phase,0);
 a.dispose();a.dispose();b.dispose();
});
