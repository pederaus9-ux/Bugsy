// Amendment A2: the horse paddock is a full square and the stone path turns a right
// angle south of it; the stable and every care station stay exactly as accepted.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {remainingCareLayouts} from '../remaining-care-layout.js';import {createDairyPath} from '../farm-path.js';import {cowYardLayout} from '../cow-yard.js';import {farmGroundY} from '../farm-land.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';import {makePenWorld} from './fixtures/animal-pen-world.mjs';
const pr95=JSON.parse(fs.readFileSync(new URL('./fixtures/animal-pens-pr95.json',import.meta.url),'utf8')).sites.horse;
const square=[[-23.5,-31.8],[-4.8,-31.8],[-4.8,-19.8],[-23.5,-19.8]];
const near=(a,b,m)=>{assert.equal(a.length,b.length,m);a.forEach((q,i)=>assert(Math.abs(q[0]-b[i][0])<1e-9&&Math.abs(q[1]-b[i][1])<1e-9,m+' point '+i+': '+q+' vs '+b[i]));};
const dairyPoints=()=>{const p=createDairyPath({layout:cowYardLayout(25),groundY:farmGroundY});try{return p.points.map(q=>[...q]);}finally{p.dispose?.();}};
test('the horse paddock is the full square with its gate at the path corner',()=>{
 const l=remainingCareLayouts().horse;assert.deepEqual(l.polygon,square);
 const g=l.gates[0];assert.equal(g.a[1],-19.8);assert.equal(g.b[1],-19.8);assert(Math.abs(g.b[0]-g.a[0]-4.25)<1e-9,'gate width');assert(Math.abs((g.a[0]+g.b[0])/2+18.45)<1e-9,'gate centre');
 const site=resolveAnimalPens().sites.horse;assert.equal(site.template,'sa3d-horse-v2');assert.deepEqual(site.polygon,square);
 for(const f of site.fenceSegments)assert(f[0]===f[2]||f[1]===f[3],'slanted fence '+f);
});
test('the stable, stations and obstacles are exactly the accepted ones and the old outline fits inside',()=>{
 const l=remainingCareLayouts().horse;
 for(const k of ['capacity','footprint','stations','turnouts','shelter','bedSize','bedSurface','margin','speed'])assert.deepEqual(l[k],pr95[k],k);
 assert.deepEqual(resolveAnimalPens().sites.horse.obstacles,pr95.obstacles);
 for(const [x,z] of pr95.polygon)assert(x>=-23.5&&x<=-4.8&&z>=-31.8&&z<=-19.8,'old outline point outside the square: '+[x,z]);
});
test('the stone path turns a right angle south of the paddock and keeps every other point',()=>{
 const p=dairyPoints(),old=[[-1.4,8.1],[-18.4,8.1],[-18.4,-20.5],[-3.25,-25.5],[-3.25,-32.88]];
 near(p,[...old.slice(0,2),[-18.4,-18.6],[old[3][0],-18.6],old[4]],'stone path');
 for(let i=1;i<p.length;i++)assert(p[i][0]===p[i-1][0]||p[i][1]===p[i-1][1],'diagonal path segment '+i);
});
test('the validator fixture uses the real stone path',()=>{
 const p=dairyPoints(),w=makePenWorld();assert.equal(w.path.length,p.length-1);w.path.forEach((c,i)=>{near([c.a,c.b],[p[i],p[i+1]],'fixture segment '+i);assert.equal(c.r,.92);});
});
