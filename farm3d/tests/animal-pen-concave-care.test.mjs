import test from 'node:test';
import assert from 'node:assert/strict';
import {careSegmentClear} from '../remaining-care-navigation.js';
import {createRemainingCareController} from '../remaining-care-controller.js';
import * as T from '../lib/three.module.min.js';
const polygon=[[0,0],[8,0],[8,3],[3,3],[3,8],[0,8]];
test('pets avoid the actual concave pen arms while the open notch remains usable in either winding',()=>{
 for(const points of [polygon,[...polygon].reverse()]){
  assert.equal(careSegmentClear([4,0,5],[7,0,5],{pad:.3,polygons:[points]}),true);
  assert.equal(careSegmentClear([1,0,-1],[1,0,9],{pad:.3,polygons:[points]}),false);
  assert.equal(careSegmentClear([4,0,2.8],[7,0,2.8],{pad:.3,polygons:[points]}),false);
 }
});
test('care containment accepts both arms and rejects routes crossing the concave notch',()=>{
 const a={kind:'sheep',g:new T.Group(),ref:{i:0},vel:new T.Vector2()};a.g.position.set(1,0,7);
 for(const points of [polygon,[...polygon].reverse()]){
  const c=createRemainingCareController({layouts:{sheep:{polygon:points,stations:[],margin:.4,speed:1}},neighbours:()=>[a],active:()=>true,obstacles:()=>[],updateRig:()=>{}});
  assert.equal(c.free(a,1,7),true);assert.equal(c.free(a,7,1),true);assert.equal(c.free(a,5,5),false);
  const path=c.plan(a,[7,0,1]);assert(path.length>1,'route must turn through connecting elbow');
  let from=a.g.position.toArray();for(const to of path){for(let i=0;i<=100;i++){const x=from[0]+(to[0]-from[0])*i/100,z=from[2]+(to[2]-from[2])*i/100;assert(c.free(a,x,z),'route leaves inset enclosure');}from=to;}
 }
});
