import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHands,poseHands,fitMarker} from '../scene-polish.js';

test('sculpted hands keep the camera envelope, six draws and bounded geometry',()=>{
  const sleeve=new THREE.MeshStandardMaterial(),skin=new THREE.MeshStandardMaterial(),g=createHands(sleeve,skin);
  let meshes=0,triangles=0;const geometries=new Set();
  g.traverse(o=>{if(!o.isMesh)return;meshes++;geometries.add(o.geometry);triangles+=o.geometry.attributes.position.count/3;
    for(const a of ['position','normal'])assert.ok([...o.geometry.attributes[a].array].every(Number.isFinite));
    assert.equal(o.castShadow,false);assert.equal(o.renderOrder,10);
  });
  assert.equal(meshes,6);assert.equal(geometries.size,6);assert.ok(triangles<6000);
  const bounds=new THREE.Box3().setFromObject(g);
  assert.ok(bounds.min.x>-.34&&bounds.max.x<.34,'arms fit the existing horizontal envelope');
  assert.ok(bounds.max.z<-.1,'geometry stays beyond the camera near plane');
  poseHands(g,1,'harvest');assert.equal(g.children[0].userData.fingers.rotation.x,0);assert.ok(g.children[1].userData.fingers.rotation.x>.6);
  poseHands(g,1,'pat');assert.ok(g.children.every(h=>h.userData.fingers.rotation.x===0),'petting opens both hands');
  poseHands(g,0,null);assert.ok(g.children.every(h=>h.userData.fingers.rotation.x===0),'reach returns to neutral');
  for(const geo of geometries)geo.dispose();sleeve.dispose();skin.dispose();
});

test('near animal markers stay readable without filling the first-person view',()=>{
  const camera=new THREE.PerspectiveCamera(70,844/390,.1,600);camera.updateMatrixWorld();
  const parent=new THREE.Group(),sprite=new THREE.Sprite();parent.add(sprite);parent.scale.setScalar(1.4);
  for(const depth of [.2,1,4,20]){
    parent.position.z=-depth;parent.updateMatrixWorld();fitMarker(sprite,.7,camera,390,true);
    const pixels=sprite.scale.y*1.4*390/(2*Math.tan(70*Math.PI/360)*depth);
    assert.ok(pixels<=48.001);assert.ok(sprite.scale.y<=.7);
  }
  fitMarker(sprite,.7,camera,390,false);assert.equal(sprite.scale.y,.7,'classic marker scale returns');
  sprite.material.dispose();
});
