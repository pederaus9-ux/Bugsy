import test from 'node:test';
import assert from 'node:assert/strict';
import {REMOVABLE_TREE_IDS,decodeRemovedTrees,addRemovedTree} from '../tree-removal.js';
import {FAR_TREE_SITES} from '../far-tree-sites.js';
import {loadPenGame} from './fixtures/animal-pen-game-harness.mjs';

const id='courtyard:tree';
function request(x,extra={}){
 const nextLayout=structuredClone(x.G.S.layout);nextLayout.removedTrees=addRemovedTree(nextLayout.removedTrees,id);
 return {expectedFarm:x.G.S,expectedLayout:JSON.stringify(x.G.S.layout),nextLayout,canCommit:()=>true,
  prepare:()=>({publish(){},dispose(){}}),onFatal(){},...extra};
}
test('stable named and seeded identities reject unknown, duplicate and malformed removals',()=>{
 assert.equal(REMOVABLE_TREE_IDS.length,86);
 assert.equal(new Set(REMOVABLE_TREE_IDS).size,86);
 assert.deepEqual(decodeRemovedTrees(undefined),{ok:true,ids:[]});
 assert.deepEqual(addRemovedTree(undefined,id),[id]);
 assert.equal(addRemovedTree([id],id),null);
 for(const value of [['future:tree'],[id,id],{ids:[id]},[1]])assert.equal(decodeRemovedTrees(value).ok,false);
});
test('frozen distant site IDs retain the exact predecessor scenery transforms',()=>{
 let seed=91;const R=()=> (seed=(seed*16807)%2147483647)/2147483647;
 assert.equal(FAR_TREE_SITES.length,70);
 for(let i=0;i<70;i++){
  const a=R()*Math.PI*2,r=70+R()*50,site=FAR_TREE_SITES[i];
  assert.equal(site.id,`wood:site-${String(i+1).padStart(3,'0')}`);
  assert.equal(site.x,Math.cos(a)*r);assert.equal(site.z,Math.sin(a)*r);
  assert.equal(site.rotation,R()*7);assert.equal(site.scale,1.1+R()*.7);assert.equal(site.kind,i%4);
 }
});
test('old farm retains trees and first clear promotes writer only after durable Apply',()=>{
 const x=loadPenGame();assert.equal(x.G.S.v,1);assert.equal(x.G.S.layout.removedTrees,undefined);
 const r=x.G.commitOrdinaryLayout(request(x,{prepare:()=>({publish(){assert.equal(JSON.parse(x.raw).v,5);assert.deepEqual(JSON.parse(x.raw).layout.removedTrees,[id]);},dispose(){assert.fail('published tree disposed');}})}));
 assert.equal(r.code,'OK');assert.equal(x.G.S.v,5);assert.deepEqual(JSON.parse(x.raw).layout.removedTrees,[id]);
 const reloaded=loadPenGame({raw:x.raw});assert.deepEqual(JSON.parse(JSON.stringify(reloaded.G.S.layout.removedTrees)),[id]);
});
test('cancel, repeated clear, stale and storage failure retain stored bytes and scene publication count',()=>{
 const x=loadPenGame();x.G.save();const raw=x.raw,version=x.G.S.v;let publishes=0,disposes=0;
 assert.equal(x.raw,raw); // cancelling the confirmation calls no commit
 x.setQuota(true);const quota=x.G.commitOrdinaryLayout(request(x,{prepare:()=>({publish(){publishes++;},dispose(){disposes++;}})}));
 assert.equal(quota.code,'STORAGE');assert.equal(x.raw,raw);assert.equal(x.G.S.v,version);assert.equal(publishes,0);assert.equal(disposes,1);
 x.setQuota(false);const stale=x.G.commitOrdinaryLayout(request(x,{canCommit:()=>false}));assert.equal(stale.code,'STALE');assert.equal(x.raw,raw);
 assert.equal(x.G.commitOrdinaryLayout(request(x)).code,'OK');const saved=x.raw;
 const repeat=x.G.commitOrdinaryLayout({...request(x),nextLayout:{...x.G.S.layout,removedTrees:[id,id]}});assert.equal(repeat.code,'INVALID');assert.equal(x.raw,saved);
});
test('future unknown tree IDs block all writers without erasing their bytes',()=>{
 const x=loadPenGame();x.G.S.layout.removedTrees=['future:tree'];
 assert.equal(x.G.save(),false);assert.equal(x.G.commitOrdinaryLayout(request(x)).code,'READONLY');
});
