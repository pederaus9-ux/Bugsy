import test from 'node:test';import assert from 'node:assert/strict';
import {createEditableGroundGrid} from '../edit-ground-grid.js';
import {makePenWorld} from './fixtures/animal-pen-world.mjs';

test('neutral full-land grid follows terrain, leaves object/path holes and never implies valid placement',()=>{
 const grid=createEditableGroundGrid((x,z)=>x*.1+z*.2),world={land:[{type:'polygon',points:[[-3,-3],[3,-3],[3,3],[-3,3]]}],blocked:[{type:'circle',x:0,z:0,r:.4},{type:'rectangle',x:2,z:2,hw:.2,hd:.2}],path:[{type:'capsule',a:[-2,0],b:[-2,1],r:.1}]};
 assert.equal(grid.updateMask(world),true);const tiles=grid.userData.tiles;
 assert.equal(grid.userData.states,'unchecked');assert.equal(grid.userData.tileCount,tiles.length);assert(tiles.length>=20&&tiles.length<25);assert(grid.userData.maskedCount>=4);
 for(const p of [[0,0],[2,2],[-2,0],[-2,1],[-3,0],[3,0]])assert(!tiles.some(t=>t[0]===p[0]&&t[1]===p[1]),`Cell ${p} should not be drawn`);
 const line=grid.children[0],attr=line.geometry.attributes.position;assert.equal(grid.children.length,1);for(let i=0;i<attr.count;i++)assert(Math.abs(attr.getY(i)-attr.getX(i)*.1-attr.getZ(i)*.2-.09)<1e-6);
 const original=line;assert.equal(grid.updateMask(structuredClone(world)),false);assert.equal(grid.children[0],original);
 let disposed=0;line.geometry.addEventListener('dispose',()=>disposed++);line.material.addEventListener('dispose',()=>disposed++);grid.dispose();assert.equal(disposed,2);assert.equal(grid.children.length,0);
});

test('actual editable farm mask produces a bounded whole-area grid with object holes',()=>{
 const world=makePenWorld(),grid=createEditableGroundGrid(world.groundY);grid.updateMask(world);
 assert(grid.userData.tileCount>500);assert(grid.userData.maskedCount>0);assert(grid.userData.tileCount+grid.userData.maskedCount<=10000);
 assert(grid.userData.bounds[0]<-25&&grid.userData.bounds[1]>20&&grid.userData.bounds[2]<-40&&grid.userData.bounds[3]>20);
 grid.dispose();
});
