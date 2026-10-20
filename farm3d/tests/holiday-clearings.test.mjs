import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(){
 const grass=source.slice(source.indexOf('const GRASS ='),source.indexOf('\n{\n  // one clump',source.indexOf('const GRASS =')));
 const start=source.indexOf('const decorationClears ='),end=source.indexOf('function makeDecor(d)');
 const helper=start<0?'function syncDecorationClearings(){}':source.slice(start,end);
 const state={decor:{placed:[]}},holidayObjs=[],context={THREE,G:{DECOR:{jack:{hol:'halloween'},haunted:{hol:'halloween',size:2},bench:{cost:80}}},GS:()=>state,holidayObjs};
 return vm.runInNewContext(grass+'\n'+helper+`\n
 const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,.1,.1),new THREE.MeshBasicMaterial(),4);
 GRASS.grass=mesh;GRASS.gpos=[0,0,3,0,6,0,9,0];
 for(let i=0;i<4;i++)mesh.setMatrixAt(i,new THREE.Matrix4().makeTranslation(i*3,0,0));
 const original=mesh.instanceMatrix.array.slice();clearGrass(9,0,.8,'existing-building');
 ({state:GS(),holidayObjs,sync:syncDecorationClearings,cleared(i){return mesh.instanceMatrix.array[i*16]===0;},same(i){return Array.from(mesh.instanceMatrix.array.slice(i*16,i*16+16)).every((n,k)=>n===original[i*16+k]);},keys:()=>[...CLEARS.keys()]});`,context);
}
test('holiday placements clear overlapping grass and restore the old footprint on move/put-away',()=>{const f=fixture();f.state.decor.placed=[{id:'jack',x:0,z:0}];f.sync();assert.equal(f.cleared(0),true,'grass must not cut through the pumpkin face');f.state.decor.placed[0].x=3;f.sync();assert.equal(f.same(0),true);assert.equal(f.cleared(1),true);assert.equal(f.cleared(3),true,'existing building clearing remains protected');f.state.decor.placed=[];f.sync();assert.equal(f.same(1),true);assert.equal(f.cleared(3),true);});
test('ambient themes release their clearing without erasing another prop or fixed building',()=>{const f=fixture();f.state.decor.placed=[{id:'jack',x:0,z:0}];f.holidayObjs.push({position:{x:0,z:0}},{position:{x:6,z:0}});f.sync();assert.equal(f.cleared(0),true);assert.equal(f.cleared(2),true);f.holidayObjs.length=0;f.sync();assert.equal(f.cleared(0),true);assert.equal(f.same(2),true);assert.equal(f.cleared(3),true);f.state.decor.placed=[];f.sync();assert.equal(f.same(0),true);assert.deepEqual([...f.keys()],['existing-building']);});

test('a solid non-holiday decoration clears its footprint and restores grass on put-away',()=>{const f=fixture();f.state.decor.placed=[{id:'bench',x:0,z:0}];f.sync();assert.equal(f.cleared(0),true);f.state.decor.placed=[];f.sync();assert.equal(f.same(0),true);assert.equal(f.cleared(3),true);});
