import test from 'node:test';import assert from 'node:assert/strict';
import {growPasture,templateArea,PASTURE_TARGET_RATIO} from '../animal-pen-pasture.js';
import {defaultSiteRecord,decodeAnimalPens} from '../animal-pen-layout.js';
import {polygonArea} from '../animal-pen-geometry.js';
const area=v=>polygonArea(v.sites.cow.boundary.map(p=>[p.x,p.z]));
test('a template-sized cow pen grows to about 1.5x when the land is free',()=>{
  const r=growPasture(undefined,'cow',{isValid:()=>true});assert(r);assert(r.area>=templateArea('cow')*PASTURE_TARGET_RATIO-1e-6);
  assert.equal(decodeAnimalPens(r.value).status,'ok','the saved record is the same shape the pen editor writes');
  assert.deepEqual(r.value.sites.cow.structures,defaultSiteRecord('cow').structures,'stations never move');
  assert.equal(r.value.revision,1);
});
test('every accepted step passed validation; blocked edges stay put',()=>{
  const seen=[];const r=growPasture(undefined,'cow',{isValid:c=>{seen.push(c);return c.sites.cow.boundary.every(v=>v.z<=-32.8+1e-9);}}); // south (gate side) blocked
  assert(r&&r.steps>0);assert(r.value.sites.cow.boundary.every(v=>v.z<=-32.8+1e-9));
});
test('nothing valid means no change',()=>assert.equal(growPasture(undefined,'cow',{isValid:()=>false}),null));
test('player-designed pens are left alone',()=>{
  const big={v:1,revision:3,sites:{cow:defaultSiteRecord('cow')}};for(const v of big.sites.cow.boundary)v.x*=1.2;
  assert.equal(growPasture(big,'cow',{isValid:()=>true}),null,'already enlarged');
  const runs={v:1,revision:3,sites:{cow:{...defaultSiteRecord('cow'),runs:[{id:'r1',a:[0,-35],b:[1,-35]}]}}};
  assert.equal(growPasture(runs,'cow',{isValid:()=>true}),null,'interior fences');
});
test('a grown pen is not grown again',()=>{const r=growPasture(undefined,'cow',{isValid:()=>true});assert.equal(growPasture(r.value,'cow',{isValid:()=>true}),null);});
test('other sites are preserved exactly',()=>{const start={v:1,revision:2,sites:{chicken:defaultSiteRecord('chicken')}};const r=growPasture(start,'cow',{isValid:()=>true});assert.deepEqual(r.value.sites.chicken,start.sites.chicken);assert.equal(r.value.revision,3);});
