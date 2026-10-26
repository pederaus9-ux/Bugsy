import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MAP_EDGE} from '../farm-land.js';
import {penEditableLand,penEditableLandContains} from '../animal-pen-validation.js';

test('outer map is candidate pen land but complete footprint cannot cross rendered edge',()=>{
 const land=penEditableLand(),world={land};
 assert.equal(penEditableLandContains([[48,48],[52,48],[52,52],[48,52]],world),true);
 assert.equal(penEditableLandContains([[107,107],[110,107],[110,110],[107,110]],world),false);
});

test('two-finger animal-pen draft pan reaches both full-map edges without crossing them',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const start=html.indexOf("addEventListener('pointermove',event=>{");
 const end=html.indexOf('\n},true);',start);
 assert(start>=0&&end>start);
 for(const sign of [-1,1]){
  let move;const cam={dist:40,target:{x:0,z:0}},session={pointers:new Map([[1,[0,0]]]),pan:true,last:{c:[0,0],d:null}};
  vm.runInNewContext(html.slice(start,end+'\n},true);'.length),{cam,animalPenEditing:session,MAP_EDGE,THREE:{MathUtils:{clamp:(v,lo,hi)=>Math.min(hi,Math.max(lo,v))}},addEventListener:(type,fn)=>{move=fn;}});
  let prevented=0,stopped=0;move({pointerId:1,clientX:sign*100000,clientY:sign*100000,preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}});
  assert.equal(cam.target.x,-sign*MAP_EDGE);assert.equal(cam.target.z,-sign*MAP_EDGE);
  assert(Number.isFinite(cam.target.x)&&Number.isFinite(cam.target.z));assert.equal(prevented,1);assert.equal(stopped,1);
 }
});
