import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
let M={};try{M=await import('../seasonal-leaves.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const geometry=()=>new THREE.PlaneGeometry(1,1);
test('season changes recolour existing canopies and winter removes leaves without new geometry',()=>{
 assert.equal(typeof M.createSeasonalLeaves,'function');const s=M.createSeasonalLeaves(),g=geometry();s.register(g,7);const colour=g.attributes.color;
 s.setSeason('spring');const spring=colour.array.slice();s.setSeason('summer');const summer=colour.array.slice();s.setSeason('fall');const fall=colour.array.slice();assert.notDeepEqual(spring,summer);assert.notDeepEqual(fall,summer);assert(fall[0]>fall[1]&&fall[1]>fall[2],'fall canopy is still green');
 assert.equal(s.setSeason('fall'),false,'unchanged season rewrites GPU buffers');assert.equal(g.attributes.color,colour);s.setSeason('winter');assert.equal(g.drawRange.count,0);s.setSeason('spring');assert(g.drawRange.count>0);assert.deepEqual(colour.array,spring);g.dispose();assert.equal(s.size,0,'removed trees retained by season registry');
});
test('tree variation is deterministic and late-added or merged woods receive the active season',()=>{
 assert.equal(typeof M.createSeasonalLeaves,'function');const s=M.createSeasonalLeaves();s.setSeason('fall');const a=geometry(),b=geometry(),c=geometry();s.register(a,7);s.register(b,8);s.register(c,7);assert.notDeepEqual(a.attributes.color.array,b.attributes.color.array);assert.deepEqual(a.attributes.color.array,c.attributes.color.array);const buffers=[a,b,c].map(g=>g.attributes.color);for(let i=0;i<20;i++)for(const ssn of ['winter','spring','summer','fall'])s.setSeason(ssn);[a,b,c].forEach((g,i)=>{assert.equal(g.attributes.color,buffers[i]);g.dispose();});assert.equal(s.size,0);
});
