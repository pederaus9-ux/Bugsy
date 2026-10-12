// Comparable local CPU measurement; this does not measure a phone or a browser.
import {execFileSync} from 'node:child_process';
import {writeFileSync,unlinkSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const baseline='d87658e3ee97f0dabc372f4cbaf8c99a8d36e65d';
const file=new URL('../.chicken-performance-baseline.mjs',import.meta.url);
writeFileSync(file,execFileSync('git',['show',baseline+':farm3d/chicken3d.js']));
try{
 const old=await import(file),now=await import('../chicken3d.js');
 function run(mod,n){const rigs=Array.from({length:6},()=>mod.createChicken3D(.72)),start=performance.now();for(let j=0;j<n;j++)for(const r of rigs){const turn=j%180>90,dx=turn?.8/60:0,dz=turn?0:-.8/60;r.g.position.x+=dx;r.g.position.z+=dz;mod.updateChicken3D(r,dx,dz,1/60,'walk');}const cost=(performance.now()-start)*1000/(n*6);rigs.forEach(r=>r.dispose());return cost;}
 run(old,5000);run(now,5000);const baselineUs=[],candidateUs=[];
 for(let n=0;n<7;n++){if(n%2){candidateUs.push(run(now,20000));baselineUs.push(run(old,20000));}else{baselineUs.push(run(old,20000));candidateUs.push(run(now,20000));}}
 const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
 console.log(JSON.stringify({baseline,baselineUs,candidateUs,baselineMedianUs:median(baselineUs),candidateMedianUs:median(candidateUs),ratio:median(candidateUs)/median(baselineUs),environment:'Node, six rigs, repeated 90-degree turns; not a phone'},null,2));
}finally{unlinkSync(file);}
