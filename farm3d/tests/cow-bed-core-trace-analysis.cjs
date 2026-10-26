// Read-only algebra of the retained failure, with explicit replay limitations.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
const {cowYardLayout}=await import('../cow-yard.js'),dir=path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-bed-core-steering-20261025');
const original=JSON.parse(fs.readFileSync(path.join(dir,'../task8-codex-a22-matrix-20261025/boundary-1-30/results.json'))),replay=JSON.parse(fs.readFileSync(path.join(dir,'trace/results.json'))),a=original.failureState.animals.find(a=>a.key==='cow:2');
assert.equal(original.status,'FAIL');assert(original.error.includes('cow:2 frame=745'));
let hash=7;for(const ch of 'cow Night 2')hash=(hash*31+ch.charCodeAt(0))>>>0;const energy=[.25,.7,.5,1,.4,.6,.5][hash%7],speed=.8*(.8+energy*.4),dx=a.target[0]-a.pos[0],dz=a.target[1]-a.pos[2],distance=Math.hypot(dx,dz),forces=[{kind:'goal',vector:[dx/distance*speed,dz/distance*speed]}],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
for(const b of cowYardLayout(25).obstacles){const x=a.pos[0]-clamp(a.pos[0],b[0]-b[2],b[0]+b[2]),z=a.pos[2]-clamp(a.pos[2],b[1]-b[3],b[1]+b[3]),d=Math.hypot(x,z);if(d<1.5&&d>1e-4)forces.push({kind:'authored cow obstacle',bounds:b,distance:d,vector:[x/d*(1.5-d)*6,z/d*(1.5-d)*6]});}
for(const b of original.failureState.animals.filter(b=>b.key.startsWith('cow:')&&b!==a)){const x=a.pos[0]-b.pos[0],z=a.pos[2]-b.pos[2],d=Math.hypot(x,z);if(d<1.8)forces.push({kind:b.key,distance:d,vector:[x/d*(1.8-d)*3,z/d*(1.8-d)*3]});}
const total=forces.reduce((s,f)=>[s[0]+f.vector[0],s[1]+f.vector[1]],[0,0]),report={source:original.source,energy,speed,forces,total,requestedSpeed:Math.hypot(...total),limitations:'Captured-position algebra and native isolated fixture, not a full-history reconstruction or skin-clearance proof.',replay:{status:replay.status,credited:false,reason:'First cycle exact; later trajectory diverges. Original RED remains.',originalCycles:original.cycles.map(c=>[c.nightFrames,c.wakeFrames]),observedCycles:replay.cycles.map(c=>[c.nightFrames,c.wakeFrames])}};
assert.equal(forces.length,2);assert.equal(forces[1].kind,'cow:3');assert(report.requestedSpeed<.01);
const out=path.join(dir,'snapshot-analysis.json');if(fs.existsSync(out))throw Error('Preserve prior analysis');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})();
