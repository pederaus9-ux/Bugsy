import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createCowYard,cowYardConflicts} from '../cow-yard.js';
let land={};try{land=await import('../farm-land.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('usable land extends exactly25 metres north and preserves every former placement',()=>{
 assert.equal(land.NORTH_EXTENSION,25);
 for(const radius of [23,24,40]){
  for(let i=0;i<360;i++){const a=i*Math.PI/180;assert(land.onFarm(1+Math.cos(a)*radius,3+Math.sin(a)*radius,radius));}
  assert(land.onFarm(1,3-radius-25,radius));assert(!land.onFarm(1,3-radius-25-.01,radius));
  assert(!land.onFarm(1+radius+.01,-22,radius));assert(!land.onFarm(1,3+radius+.01,radius));
 }
});
test('expanded courtyard clears an occupied legacy site without altering those objects',()=>{
 const blocks=[[-8,-11,1.9,1.7]],decor=[{id:'oak',x:-7,z:-13,r:.6}],before=structuredClone({blocks,decor});
 const y=createCowYard({north:25});assert.equal(y.layout.robot.dock[2],-36.3);
 assert.deepEqual(cowYardConflicts({blocks,decor,layout:y.layout}),[]);assert.deepEqual({blocks,decor},before);
 for(const[x,z]of y.layout.footprint){assert(land.onFarm(x,z,24));assert.equal(land.farmGroundY(x,z),0);}
 y.group.updateMatrixWorld(true);const dock=y.layout.robot.dock,ray=new THREE.Raycaster(new THREE.Vector3(dock[0],1,dock[2]+5),new THREE.Vector3(0,0,-1));
 assert(ray.intersectObject(y.targets.find(t=>t.kind==='robot').object,true).length>0,'translated robot cannot be selected');
 const bed=y.stations.find(s=>s.kind==='bed'),roof=new THREE.Raycaster(new THREE.Vector3(bed.dock[0],1,bed.dock[2]),new THREE.Vector3(0,1,0)).intersectObject(y.group,true)[0];assert(roof,'world stations no longer match physical geometry');
 assert.equal(cowYardConflicts({layout:y.layout,decor:[{id:'new',x:-7,z:-36,r:1}]}).length,1,'new land must still protect later player objects');y.dispose();
});
test('new flat land joins existing terrain without changing old farm heights',()=>{
 assert.equal(typeof land.farmGroundY,'function');
 const old=(x,z)=>{const d=Math.hypot(x,z);return d<16?0:(Math.sin(x*.09)*Math.cos(z*.07)*1.3+Math.sin(x*.23+z*.17)*.4)*Math.min(1,(d-16)/20);};
 for(let x=-25;x<=25;x+=2)for(let z=-21;z<=28;z+=2)assert.equal(land.farmGroundY(x,z),old(x,z));
 for(let x=-14;x<=2;x++)for(let z=-41;z<=-27;z++)assert.equal(land.farmGroundY(x,z),0);
 for(const z of [-21,-25,-46,-50])assert(Math.abs(land.farmGroundY(0,z-.0001)-land.farmGroundY(0,z+.0001))<.001);
});
