// Assertion-identical diagnostic of boundary/seed1/30Hz third-wake failure.
// Compile the original test with observation-only inserts; never edit its assertions.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const original=path.join(__dirname,'animal-pen-three-night-extra-classes.browser.cjs');
let source=fs.readFileSync(original,'utf8');
const preimage=source;
function insert(marker,text){if(source.split(marker).length!==2)throw Error('Diagnostic marker is not unique');source=source.replace(marker,text+marker);}
insert("  const assigned=await p.evaluate",`  await p.evaluate(cycle=>{
    const d=__dbg,a=d.animals.find(a=>a.kind==='cow'&&a.ref.i===2);
    if(a.__coreOriginalUpdate)a.update=a.__coreOriginalUpdate;
    window.__coreTrace=[];window.__coreGeometry={blocks:d.BLOCKS.map(b=>[...b]),layout:d.cowYard.layout,pen:a.pen};
    if(cycle!==3)return;
    const original=a.update; a.__coreOriginalUpdate=original;
    const state=()=>({pos:a.g.position.toArray(),velocity:a.vel.toArray(),target:a.target?.toArray(),path:a.path?.map(p=>p.toArray()),act:a.act,label:a.label,doing:a.doing,until:a.until,stuckT:a.stuckT,lastPos:a.lastPos.toArray(),radius:a.S.r,walk:a.S.walk,run:a.S.run,running:a.running,mode:a.mode,need:{...a.need},task:a.cowTask?{kind:a.cowTask.kind,stage:a.cowTask.stage,weight:a.cowTask.weight}:null});
    a.update=function(dt,t){const frame=(window.__wakeFrame??0)+1,before=state();original.call(this,dt,t);if(frame<=930)window.__coreTrace.push({frame,t,dt,before,after:state(),neighbours:d.animals.filter(b=>b!==a&&Math.hypot(b.g.position.x-a.g.position.x,b.g.position.z-a.g.position.z)<4).map(b=>({key:b.kind+':'+(b.ref.i??b.ref.j??0),pos:b.g.position.toArray(),radius:b.S.r,act:b.act,task:b.cowTask?.kind}))});};
  },cycle);
`);
const marker='cycle:window.__wakeFrame,cow4Trace:';
if(source.split(marker).length!==2)throw Error('Diagnostic output marker is not unique');
source=source.replace(marker,'coreTrace:window.__coreTrace,coreGeometry:window.__coreGeometry,'+marker);
const out=path.resolve(process.env.TEST_ARTIFACTS);
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'diagnostic-source.json'),JSON.stringify({original:path.basename(original),sha256:crypto.createHash('sha256').update(preimage).digest('hex'),changes:'Two observation-only insertions. Original assertions, seeds, simulation steps, deadlines and oracle unchanged.'},null,2));
const diagnostic=new Module(original,module);diagnostic.filename=original;diagnostic.paths=module.paths;diagnostic._compile(source,original);
