// Diagnostic companion only. It executes a retained copy of the canonical traffic
// journey with passive go tracing. Baseline mode cancels the editor without Apply.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),crypto=require('node:crypto');
const canonical=path.join(__dirname,'animal-pen-cow-trough-traffic.browser.cjs');
const out=path.resolve(process.env.TEST_ARTIFACTS),mode=process.env.WAIT_CASE||'moved';
if(!['moved','baseline'].includes(mode))throw Error('Unknown WAIT_CASE');
fs.mkdirSync(out,{recursive:true});
let source=fs.readFileSync(canonical,'utf8');
const replace=(from,to)=>{if(!source.includes(from))throw Error('Missing diagnostic anchor: '+from.slice(0,80));source=source.replace(from,to);};
const trace=`await p.evaluate(()=>{window.__waitTrace={calls:0,unique:[]};for(const a of __dbg.animals.filter(a=>a.kind==='cow')){const go=a.go;a.go=function(...args){const before={i:this.ref.i,t:__dbg.clock(),position:this.pos.toArray(),args,fitted:this.fit(this.pos.clone().set(args[0],args[1])).toArray()};const result=go.apply(this,args),after={target:this.target?.toArray()??null,path:this.path?.map(p=>p.toArray())??null,act:this.act},key=JSON.stringify([before.i,before.position,args,after]);window.__waitTrace.calls++;if(!window.__waitTrace.unique.some(x=>x.key===key))window.__waitTrace.unique.push({key,before,after});return result;};}});`;
replace("stage='native trough-only draft and full validation';",trace+"\n stage='native trough-only draft and full validation';");
if(mode==='baseline'){
 const start=source.indexOf("stage='native trough-only draft and full validation';"),end=source.indexOf("stage='same live reserved cow continues after Apply';",start);
 source=source.slice(0,start)+`stage='baseline native Cancel with untouched facility';await p.locator('[data-action="cancel"]').click({delay:50});await p.waitForFunction(()=>!__dbg.penEditor.snapshot().open,null,{timeout:30000});const after=await physical(),expected=before.record;assert.deepEqual(after,before);record(stage,{after,baseline:true});\n `+source.slice(end);
 replace("if(a.g.position.distanceTo(new T.Vector3(...oldDock))<=.1)throw Error('stale old dock');","/* Baseline has no old/new dock distinction; canonical moved test remains unchanged. */");
}
replace("finally{save();",`finally{try{report.waitTrace=await p.evaluate(()=>window.__waitTrace);report.waitCase='${mode}';report.candidateProbe=await p.evaluate(()=>{
 const d=__dbg,y=d.cowYard,cows=d.animals.filter(a=>a.kind==='cow'),corridors=y.stations.map(s=>[s.approach[0],s.approach[2],s.dock[0],s.dock[2]]);
 for(const b of cows)if(['approach','exit'].includes(b.cowTask?.stage)){let x=b.g.position.x,z=b.g.position.z;for(const p of [...(b.cowTask.path||[]).map(v=>[v.x,v.y]),...(b.cowTask.waypoints||[]).map(v=>[v[0],v[2]])]){corridors.push([x,z,p[0],p[1]]);x=p[0];z=p[1];}}
 const near=(x,z)=>corridors.some(([px,pz,qx,qz])=>{const dx=qx-px,dz=qz-pz,u=Math.max(0,Math.min(1,((x-px)*dx+(z-pz)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-px-u*dx,z-pz-u*dz)<1.1;});
 return cows.filter(a=>!a.cowTask).map(a=>{const candidates=[];for(const radius of [1.4,2.1,2.8,4.2,5.6])for(let k=0;k<24;k++){const x=a.g.position.x+Math.cos(k*Math.PI/12)*radius,z=a.g.position.z+Math.sin(k*Math.PI/12)*radius;
 if(!d.inPen(a.pen,x,z,.7)||near(x,z)||y.layout.obstacles.some(([bx,bz,hw,hd])=>Math.abs(x-bx)<hw+.65&&Math.abs(z-bz)<hd+.65)||cows.some(b=>b!==a&&Math.hypot(x-b.g.position.x,z-b.g.position.z)<1.3))continue;
 const variants=[true,false].map(custom=>{const probe=Object.create(a);probe.pen={...a.pen,custom};const fitted=probe.fit(probe.pos.clone().set(x,z));Object.getPrototypeOf(a).go.call(probe,x,z,false,'probe');return{custom,fitted:fitted.toArray(),nearAfterFit:near(fitted.x,fitted.y),target:probe.target?.toArray()??null,path:probe.path?.map(p=>p.toArray())??null};});candidates.push({radius,k,point:[x,z],variants});}
 return{i:a.ref.i,position:a.pos.toArray(),near:near(a.g.position.x,a.g.position.z),candidates};});
 });}catch(e){report.probeError=String(e);}save();`);
const destination=path.join(out,'executed-source.cjs');if(fs.existsSync(destination))throw Error('Preserve existing source');fs.writeFileSync(destination,source);
fs.writeFileSync(path.join(out,'instrumentation.json'),JSON.stringify({mode,canonicalSha256:crypto.createHash('sha256').update(fs.readFileSync(canonical)).digest('hex'),executedSha256:crypto.createHash('sha256').update(source).digest('hex'),runtimeSourceChanged:false,behavior:'go wrapper records before/after and delegates original arguments once; no route/actor/task injection',baselineDifference:mode==='baseline'?'Cancel instead of edit/Apply; no stale-old-dock assertion because no moved dock':null},null,2)+'\n');
const run=new Module(canonical,module);run.filename=canonical;run.paths=Module._nodeModulePaths(__dirname);run._compile(source,canonical);
