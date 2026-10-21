import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {cowYardLayout} from '../cow-yard.js';
import {farmGroundY,onFarm} from '../farm-land.js';
let path={};try{path=await import('../farm-path.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('stone path joins the main farm to the northern gate without crossing fixed pens or barn',()=>{
 assert.equal(typeof path.createDairyPath,'function');
 const l=cowYardLayout(25),p=path.createDairyPath({layout:l,groundY:farmGroundY});
 assert.deepEqual(p.points[0],[-1.4,8.1]);assert.deepEqual(p.points.at(-1),[(l.gate[0]+l.gate[1])/2,l.polygon[2][1]-.08]);
 for(const[x,z]of p.samples){assert(onFarm(x,z));assert(!(Math.abs(x)<4.75&&Math.abs(z)<6.25),'path crosses barn');assert(!(x> -16.85&&x< -4.55&&z> -6.15&&z<5.35),'path crosses chicken enclosure');}
 assert(p.group.children[0].geometry.attributes.normal.getY(0)>.9,'paving bed faces below the ground');
 assert.equal(p.group.children[0].material.polygonOffset,false,'base depth bias hides raised paving at wide farm zoom');
 assert(p.stones.count>200&&p.stones.count<600);assert.equal(p.group.children.length,2,'path must stay batched');
 const m=new THREE.Matrix4();for(let i=0;i<p.stones.count;i++){p.stones.getMatrixAt(i,m);const[x,y,z]=[m.elements[12],m.elements[13],m.elements[14]];assert(Math.abs(y-farmGroundY(x,z)-.052)<1e-5);}
 p.dispose();
});
test('path hit area and disposal preserve caller-owned materials and textures',()=>{
 assert.equal(typeof path.createDairyPath,'function');
 const material=new THREE.MeshStandardMaterial(),before=material.color.getHex();let disposed=0;material.addEventListener('dispose',()=>disposed++);
 const p=path.createDairyPath({layout:cowYardLayout(25),groundY:farmGroundY,material});
 assert(p.contains(-18.4,-12));assert(!p.contains(-12,-12));assert(p.contains(-3.25,-31));assert.equal(material.color.getHex(),before);
 let geometries=0;p.group.traverse(o=>o.geometry?.addEventListener('dispose',()=>geometries++));p.dispose();p.dispose();assert.equal(geometries,2);assert.equal(disposed,0);
 material.dispose();
});
