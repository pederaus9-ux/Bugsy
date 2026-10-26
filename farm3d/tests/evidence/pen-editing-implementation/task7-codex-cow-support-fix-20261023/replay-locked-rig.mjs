import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import * as T from '../../../../lib/three.module.min.js';
import {createCow3D,updateCow3D,COW_GAIT} from '../../../../cow3d.js';
const report=JSON.parse(fs.readFileSync(new URL('./transitions-clock/results.json',import.meta.url))),out=[];let clock=0;
for(const tr of report.transitions){const r=createCow3D(1.7,10.6,-39.1,'Directed support '+tr.hz);let old=[],largest=0,maxBrowserDifference=0;
 try{for(const f of tr.frames){if(f.position[0]<10.45)break;const before=r.g.position.clone();r.g.position.fromArray(f.position);updateCow3D(r,r.g.position.x-before.x,r.g.position.z-before.z,1/tr.hz,clock+(f.i+1)/tr.hz,f.i?'moving':'idle',0);r.g.updateMatrixWorld(true);
  const feet=r.legs.map(l=>({planted:l.planted,p:l.foot.localToWorld(new T.Vector3(0,-COW_GAIT.hoof,0)).toArray()}));
  for(let j=0;j<4;j++){const q=feet[j];maxBrowserDifference=Math.max(maxBrowserDifference,Math.hypot(...q.p.map((v,k)=>v-f.feet[j].p[k])));if(!q.planted&&old[j]?.planted)largest=Math.max(largest,Math.hypot(...q.p.map((v,k)=>v-old[j].p[k])));}
  old=feet;
 }}finally{r.dispose();}
 assert(maxBrowserDifference<1e-10,'unmodified rig must reproduce actual browser feet before the slab');
 out.push({hz:tr.hz,largestLiftoff:largest,maxBrowserDifference,limit:.05,passes:largest<=.05});clock+=tr.frames.length/tr.hz;
}
const result={scope:'unchanged locked cow rig only; no support overlay or terrain/path edits; actual browser first-turn displacement replay before slab',rigSha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('../../../../cow3d.js',import.meta.url))).digest('hex'),cases:out};
fs.writeFileSync(new URL('./locked-rig-replay.json',import.meta.url),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
