import fs from 'node:fs';
import assert from 'node:assert/strict';
import {remainingWorld} from '../../../remaining-care-world.mjs';
import {careSegmentClear} from '../../../../remaining-care-navigation.js';
import {pointSegmentDistance} from '../../../../animal-pen-geometry.js';
const text=fs.readFileSync(new URL('source-five-red.log',import.meta.url),'utf8');
const failures=[...text.matchAll(/AssertionError \[ERR_ASSERTION\]: (.*?) (\[\{"kind".*\])/g)];
const seeds=[23,26,41,62,69];assert.equal(failures.length,seeds.length);
const results=[];
for(let i=0;i<seeds.length;i++){
 const f=remainingWorld(seeds[i]),rows=JSON.parse(failures[i][2]);
 try{
  rows.forEach((row,j)=>f.animals[j].g.position.fromArray(row.p));
  const a=f.animals.find(a=>a.kind==='dog'),row=rows.find(a=>a.kind==='dog'),pad=f.layouts.dog.margin,p=a.g.position.toArray(),goal=f.layouts.dog.stations.find(s=>s.id===row.station).dock;
  const rectangles=f.c.BLOCKS,segments=f.c.fenceSegs,polygons=f.c.PEN_LIST.map(p=>p.poly),circles=f.animals.filter(b=>b!==a).map(b=>({x:b.g.position.x,z:b.g.position.z,r:pad+f.layouts[b.kind].margin}));
  const nearRects=rectangles.map(b=>({rectangle:b,bodyPenetration:Math.min(b[2]+pad-Math.abs(p[0]-b[0]),b[3]+pad-Math.abs(p[2]-b[1])),footprintPenetration:Math.min(b[2]-Math.abs(p[0]-b[0]),b[3]-Math.abs(p[2]-b[1]))})).filter(b=>b.bodyPenetration>0);
  const nearFences=segments.map(s=>({segment:s,distance:pointSegmentDistance([p[0],p[2]],[s[0],s[1]],[s[2],s[3]])})).filter(s=>s.distance<pad+.1);
  const directions=Array.from({length:16},(_,j)=>{const angle=j*Math.PI/8,q=[p[0]+Math.cos(angle)*.05,0,p[2]+Math.sin(angle)*.05];return{angle,q,stepFree:f.c.remainingCare.free(a,q[0],q[2],true),continuous:careSegmentClear(p,q,{pad,rectangles,segments,polygons,circles,escape:true}),clearPoint:f.c.acceptsPoint(null,q[0],q[2],pad)};});
  const entry={seed:seeds[i],failure:failures[i][1],report:rows,pad,goal,startFree:f.c.remainingCare.free(a,p[0],p[2]),nearRects,nearFences,plan:f.c.remainingCare.plan(a,goal),directions,world:{rectangles,segments,polygons}};results.push(entry);
  console.log(JSON.stringify({seed:entry.seed,p,nearRects,nearFences,plan:entry.plan,legalDirections:directions.filter(q=>q.stepFree&&q.continuous).map(q=>q.angle),stepOnlyDirections:directions.filter(q=>q.stepFree).map(q=>q.angle)}));
 }finally{f.dispose();}
}
fs.writeFileSync(new URL('source-five-snapshots.json',import.meta.url),JSON.stringify(results,null,2)+'\n',{flag:'wx'});
