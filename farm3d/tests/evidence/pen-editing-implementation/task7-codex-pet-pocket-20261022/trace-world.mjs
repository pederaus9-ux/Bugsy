import fs from 'node:fs';
import {remainingWorld as actualWorld} from '../../../remaining-care-world.mjs';
// Observation only: calls the same actual fixture/Beast once per step, no RNG or
// production function replacement. Capture first ordinary entries into the barn.
export function remainingWorld(seed){
 const f=actualWorld(seed),step=f.step,dispose=f.dispose,events=[],ring=[];
 const a=f.animals.find(a=>a.kind==='dog'),barn=f.c.BLOCKS.find(([x,z,hw,hd])=>x===0&&z===0&&hw===4.4&&hd===5.9);
 const penetration=p=>Math.min(barn[2]-Math.abs(p[0]-barn[0]),barn[3]-Math.abs(p[2]-barn[1]));
 const row=()=>({t:f.c.clockT,p:a.g.position.toArray(),target:a.target?.toArray(),path:a.path?.map(p=>p.toArray()),velocity:a.vel.toArray(),act:a.act,doing:a.doing,care:a.remainingTask?{kind:a.remainingTask.kind,stage:a.remainingTask.stage}:null});
 f.step=(dt=1/30)=>{
  const before=row();step(dt);const after=row();ring.push({before,after});if(ring.length>30)ring.shift();
  if(!before.care&&penetration(before.p)<=0&&penetration(after.p)>0&&events.length<12)events.push({type:'ordinary movement enters real barn footprint',before,after,priorFrames:structuredClone(ring)});
 };
 f.dispose=()=>{fs.writeFileSync(new URL('seed-'+seed+'-ordinary-entry-trace.json',import.meta.url),JSON.stringify({seed,barn,events,final:row()},null,2)+'\n',{flag:'wx'});dispose();};
 return f;
}
