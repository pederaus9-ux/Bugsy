import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {farmGroundY,onBuildableLand,clampToFarm,MAP_EDGE} from '../farm-land.js';
import {terrainMeshY,assessWorkshopSite} from '../workshop-site.js';

test('site sampler agrees with the rendered 220 m terrain triangles',()=>{
 const g=new T.PlaneGeometry(220,220,160,160);g.rotateX(-Math.PI/2);const a=g.attributes.position;
 for(let i=0;i<a.count;i++)a.setY(i,farmGroundY(a.getX(i),a.getZ(i)));
 const m=new T.Mesh(g,new T.MeshBasicMaterial({side:T.DoubleSide}));m.updateMatrixWorld(true);
 for(const [x,z] of [[30,-30],[31.3,-31.7],[40,-40],[-87.25,77.4],[0,0]]){
  const hit=new T.Raycaster(new T.Vector3(x,100,z),new T.Vector3(0,-1,0)).intersectObject(m)[0];
  assert(hit,`terrain ray at ${x},${z}`);assert(Math.abs(hit.point.y-terrainMeshY(x,z,farmGroundY))<1e-5,`rendered height at ${x},${z}`);
 }
 g.dispose();m.material.dispose();
});

test('gentle reachable hillside gets an upright supported site; steep and blocked approaches do not',()=>{
 const ground=(x,z)=>terrainMeshY(x,z,farmGroundY);
 const gentle=assessWorkshopSite(30,-30,ground);assert.equal(gentle.ok,true);assert(gentle.y>0);assert(gentle.maxY-gentle.minY>0);
 assert.equal(assessWorkshopSite(30,-40,ground).code,'SUPPORT');
 assert.equal(assessWorkshopSite(30,-30,ground,{entranceClear:()=>false}).code,'ENTRANCE');
 assert.equal(assessWorkshopSite(30,-30,ground,{landContains:()=>false}).code,'LAND');
 assert.equal(assessWorkshopSite(110,-30,ground).code,'LAND');
});

// A8/full-map commit0f62550 superseded the former pending-reach restriction.
// This checks land eligibility only; support and entrance guards remain above.
test('approved outer-map land is eligible and player reach is unchanged there',()=>{
 assert.equal(onBuildableLand(30,-30,1.9,1.7),true);
 assert.equal(onBuildableLand(55,-30,1.9,1.7),true,'A8 admits suitable grass across the existing map');
 assert.deepEqual(clampToFarm(55,-30),[55,-30]);
 assert.equal(onBuildableLand(MAP_EDGE-2,-30,1.9,1.7),true);
 for(const [x,z]of [[MAP_EDGE-1,-30],[-MAP_EDGE+1,-30],[55,MAP_EDGE-1],[55,-MAP_EDGE+1]])
  assert.equal(onBuildableLand(x,z,1.9,1.7),false,'entire footprint must remain within map edge');
});
