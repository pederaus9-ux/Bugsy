import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {replayCowWait} from './animal-pen-cow-wait-replay.mjs';
import {segmentInPolygon} from '../animal-pen-geometry.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('exact retained obstructing cow chooses an executable full-clearance ordinary route',()=>{
 const r=replayCowWait(html);assert(r.target,'retained cow4 must obtain a real ordinary target');assert.equal(r.act,'moving');assert.deepEqual(r.after,r.before);assert(r.tokensUnchanged);
 let from=[r.before[0],r.before[2]];for(const to of [r.target,...r.path]){assert(segmentInPolygon(from,to,r.polygon,1.6),'unchanged ordinary1.6 containment');from=to;}
});
test('exact retained actor cannot be sent through a solid waiting-area obstacle',()=>{
 const r=replayCowWait(html,{solid:true});assert.equal(r.target,null);assert.equal(r.calls.length,0);assert.equal(r.act,'idle');assert.equal(r.until,101);assert.deepEqual(r.after,r.before);assert(r.tokensUnchanged);
});
test('unmoved default and custom route decisions preserve positions and reservation tokens',()=>{
 for(const custom of [false,true]){const r=replayCowWait(html,{custom,moved:false});assert.deepEqual(r.after,r.before);assert(r.tokensUnchanged);}
});
