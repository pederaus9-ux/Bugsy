import test from 'node:test';
import assert from 'node:assert/strict';
import {fastCowSupport} from './animal-pen-shelter-fast-support.mjs';
import {cowPenSupportHeight} from '../animal-pen-cow-support.js';
import {farmGroundY} from '../farm-land.js';
import {PEN_TEMPLATES} from '../animal-pen-templates.js';

test('test-only rectangle sampler equals production slab and soil support at boundaries and across terrain',()=>{
 const site={components:{shelter:{delta:[2.6,-1.75]}}};
 const poly=PEN_TEMPLATES.cow.baseline.polygon;
 const xs=[...new Set(poly.map(p=>p[0]))],zs=[...new Set(poly.map(p=>p[1]))];
 let count=0;
 const check=(x,z)=>{const a=cowPenSupportHeight(site,x,z,farmGroundY),b=fastCowSupport(site,x,z,farmGroundY);assert.equal(b,a,`support at ${x},${z}`);count++;};
 for(const x of xs)for(const z of zs)for(const dx of [-2e-9,-1e-9,-5e-10,0,5e-10,1e-9,2e-9])for(const dz of [-2e-9,-1e-9,-5e-10,0,5e-10,1e-9,2e-9])check(x+2.6+dx,z-1.75+dz);
 for(let i=0;i<10000;i++)check(-30+(i%200)*.31,-55+Math.floor(i/200)*.91);
 assert(count>10000);
});
