import test from 'node:test';
import assert from 'node:assert/strict';
import {G,reset} from './chicken-game-fixture.mjs';
test('all54 legacy decor IDs, paid counts, positions and stored rotations survive the actual save/load path',()=>{
 const s=reset(30),ids=Object.keys(G.DECOR);assert.equal(ids.length,54);
 s.decor={inv:Object.fromEntries(ids.map((id,i)=>[id,1+i%3])),placed:ids.map((id,i)=>({id,x:-20+(i%9)*3,z:5+Math.floor(i/9)*3,rotation:.57}))};
 const expected=JSON.stringify(s.decor);G.save();G.load();assert.equal(JSON.stringify(G.S.decor),expected);
 assert.equal(G.S.pens.chicken.list.length,30);assert.equal(G.S.v,1);
});
