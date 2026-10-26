import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPenGame} from './fixtures/animal-pen-game-harness.mjs';

function move(x,extra={}){
 const nextLayout=structuredClone(x.G.S.layout);nextLayout.b.loom=[20,-40];
 return {expectedFarm:x.G.S,expectedLayout:JSON.stringify(x.G.S.layout),canCommit:()=>true,
  nextLayout,prepare:()=>({publish(){},dispose(){}}),onFatal(){},...extra};
}

test('ordinary placement persists the complete candidate before scene publication',()=>{
 const x=loadPenGame(),order=[];
 const r=x.G.commitOrdinaryLayout(move(x,{prepare:()=>({publish(){assert.deepEqual(JSON.parse(x.raw).layout.b.loom,[20,-40]);assert.deepEqual(x.events,[]);order.push('scene');},dispose(){assert.fail('published candidate disposed');}})}));
 assert.equal(r.code,'OK');assert.deepEqual(order,['scene']);assert.deepEqual(x.G.S.layout.b.loom,[20,-40]);assert.equal(x.writes,1);assert.deepEqual(x.events,['sa3d:saved']);
});

test('storage failure keeps the previous layout and live scene untouched',()=>{
 const x=loadPenGame();x.G.save();const before=x.raw,layout=structuredClone(x.G.S.layout);x.events.length=0;x.setQuota(true);let disposed=0;
 const r=x.G.commitOrdinaryLayout(move(x,{prepare:()=>({publish(){assert.fail('scene moved before save');},dispose(){disposed++;}})}));
 assert.equal(r.code,'STORAGE');assert.equal(x.raw,before);assert.deepEqual(JSON.parse(JSON.stringify(x.G.S.layout)),layout);assert.equal(disposed,1);assert.deepEqual(x.events,[]);
});

test('stale world, repeated move and failed preparation cannot write',()=>{
 for(const fault of ['world','repeat','prepare']){
  const x=loadPenGame(),o=move(x),raw=x.raw;
  if(fault==='world')o.canCommit=()=>false;
  if(fault==='repeat')x.G.S.layout.b.loom=[3,4];
  if(fault==='prepare')o.prepare=()=>{throw Error('prepare fault');};
  const r=x.G.commitOrdinaryLayout(o);assert.equal(r.code,fault==='prepare'?'PREPARE':'STALE');assert.equal(x.raw,raw);assert.equal(x.writes,0);
 }
});

test('failed publication keeps durable candidate for recovery and blocks old writes',()=>{
 const x=loadPenGame();let fatal=0;const r=x.G.commitOrdinaryLayout(move(x,{prepare:()=>({publish(){throw Error('scene fault');},dispose(){assert.fail('partly published scene disposed');}}),onFatal(){fatal++;}}));
 assert.equal(r.code,'RECOVERY');assert.equal(fatal,1);assert.deepEqual(JSON.parse(x.raw).layout.b.loom,[20,-40]);assert.equal(x.G.save(),false);assert.deepEqual(x.events,[]);
 const loaded=loadPenGame({raw:x.raw});assert.deepEqual(JSON.parse(JSON.stringify(loaded.G.S.layout.b.loom)),[20,-40]);
});
