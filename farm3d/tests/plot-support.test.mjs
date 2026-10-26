import test from 'node:test';
import assert from 'node:assert/strict';
import {plotSupport} from '../plot-support.js';
import {farmGroundY} from '../farm-land.js';
import {terrainMeshY} from '../workshop-site.js';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const slots=new Function('THREE',src.slice(src.indexOf('const FIELD_C ='),src.indexOf('BLOCKS.push([-10, 17.5'))+';return FIELD_SLOTS;')({Vector2:class{constructor(x,y){this.x=x;this.y=y;}}});
test('flat soil keeps original root/top/bottom',()=>{const s=plotSupport(0,0,.12,()=>0);assert.equal(s.rootY,0);assert.equal(s.topY,.1);assert.equal(s.bottomY,-.02);assert(Math.abs(s.height-.12)<1e-8);assert(Math.abs(s.centerY-.04)<1e-8);});
function check(p){const s=plotSupport(p.x,p.y,.12,farmGroundY);for(let a=0;a<=32;a++)for(let b=0;b<=32;b++){const x=-1.1+2.2*a/32,z=-1.1+2.2*b/32,y=terrainMeshY(p.x+x*Math.cos(.12)+z*Math.sin(.12),p.y-x*Math.sin(.12)+z*Math.cos(.12),(x,z)=>Math.fround(farmGroundY(x,z)));assert(s.topY>=y+.1-1e-8);assert(s.bottomY<=y-.02+1e-8);}assert(Math.abs(s.rootY+s.centerY+s.height/2-s.topY)<1e-8);assert(Math.abs(s.rootY+s.centerY-s.height/2-s.bottomY)<1e-8);}
for(const [i,p]of slots.entries())test(`slot ${i}: full footprint clear and soil reaches below terrain`,()=>check(p));
test('representative translated sites use their own terrain footprint',()=>{for(const [x,y]of [[37,-30],[-50,20],[0,0]])check({x,y});});
test('nonfinite and off-map sites are rejected',()=>{assert.throws(()=>plotSupport(NaN,0,0,farmGroundY));assert.throws(()=>plotSupport(110,0,0,farmGroundY));});
