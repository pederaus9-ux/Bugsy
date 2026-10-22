import fs from 'node:fs';import assert from 'node:assert/strict';
import {remainingWorld as actualWorld} from '../../../remaining-care-world.mjs';
import {careSegmentClear,carePointRuleClear} from '../../../../remaining-care-navigation.js';
// Observation only: same actual Beast calls and RNG, no decisions or positions replaced.
export function remainingWorld(seed){
 const f=actualWorld(seed),step=f.step,dispose=f.dispose,pets=f.animals.filter(a=>a.kind==='dog'||a.kind==='cat'),events=[],counts={dog:0,cat:0};
 f.step=(dt=1/30)=>{
  const before=pets.map(a=>({p:a.g.position.toArray(),care:!!a.remainingTask}));step(dt);
  for(const [i,a]of pets.entries())if(!before[i].care&&!a.remainingTask){
   counts[a.kind]++;const from=before[i].p,to=a.g.position.toArray(),polygons=f.c.PEN_LIST.map(p=>p.poly);
   const staticClear=careSegmentClear(from,to,{pad:a.S.r,rectangles:f.c.BLOCKS,segments:f.c.fenceSegs,polygons}),penClear=carePointRuleClear(from,to,{pad:a.S.r+.15,polygons,clearPoint:(x,z)=>f.c.acceptsPoint(null,x,z,a.S.r+.15)});
   if((!staticClear||!penClear)&&events.length<12)events.push({kind:a.kind,time:f.c.clockT,from,to,staticClear,penClear});
  }
 };
 f.dispose=()=>{try{
  fs.writeFileSync(new URL('seed-'+seed+'-ordinary-safety.json',import.meta.url),JSON.stringify({seed,counts,events},null,2)+'\n',{flag:'wx'});
  assert(counts.dog>0&&counts.cat>0);assert.deepEqual(events,[],'ordinary full-body static/pen violation');
 }finally{dispose();}};
 return f;
}
