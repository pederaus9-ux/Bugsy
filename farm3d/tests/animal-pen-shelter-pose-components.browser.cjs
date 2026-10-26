// Diagnostic only: isolate the cost of the retained all-vertex shelter observer.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task7-codex-cow-validator-20261023/browser-final/results.json')));
const fixture=JSON.parse(prior.steps.find(s=>s.value.initialSave).value.initialSave);
const file=path.join(artifacts,'pose-components.json');assert(!fs.existsSync(file),'retain prior diagnostic');
let h;
(async()=>{try{
 h=await start({deviceScaleFactor:.5});const s=await h.setup({width:1280,height:720},false,'shelter-pose-components');const p=s.page;
 await p.addInitScript(farm=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(farm));},fixture);
 await p.goto(h.base+'farm3d/?debug&shot&sim=0&preset=night');await p.waitForFunction(()=>window.__ready&&window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 const result=await p.evaluate(async()=>{
  const d=__dbg,T=await import('./lib/three.module.min.js'),{cowPenSupportHeight}=await import('./animal-pen-cow-support.js?v=1'),{pointInPolygon}=await import('./animal-pen-geometry.js?v=1'),{PEN_TEMPLATES}=await import('./animal-pen-templates.js?v=1'),{fastCowSupport}=await import('./tests/animal-pen-shelter-fast-support.mjs');
  const cow=d.animals.find(a=>a.kind==='cow'),r=cow.rig3d,g=r.card.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
  r.g.updateMatrixWorld(true);r.card.skeleton.update();
  const time=(fn)=>{const start=performance.now(),value=fn();return{ms:performance.now()-start,value};};
  const positions=new Float64Array(p.count*3),v=new T.Vector3();
  const deform=time(()=>{for(let i=0;i<p.count;i++){r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);positions[i*3]=v.x;positions[i*3+1]=v.y;positions[i*3+2]=v.z;}return p.count;});
  const supportValues=new Float64Array(p.count);
  const support=time(()=>{let min=Infinity;for(let i=0;i<p.count;i++){supportValues[i]=cowPenSupportHeight(d.penRuntime.layout.sites.cow,positions[i*3],positions[i*3+2],d.groundY);min=Math.min(min,positions[i*3+1]-supportValues[i]);}return min;});
  const site=d.penRuntime.layout.sites.cow,baseline=PEN_TEMPLATES.cow.baseline,poly=baseline.polygon,[shiftX,shiftZ]=site.components.shelter.delta;
  const polygon=time(()=>{let n=0;for(let i=0;i<p.count;i++)if(pointInPolygon([positions[i*3]-shiftX,positions[i*3+2]-shiftZ],poly))n++;return n;});
  const ground=time(()=>{let sum=0;for(let i=0;i<p.count;i++)sum+=d.groundY(positions[i*3],positions[i*3+2]);return sum;});
  const xs=poly.map(q=>q[0]),zs=poly.map(q=>q[1]),x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs),eps=1e-9;
  const rect=time(()=>{let min=Infinity,mismatch=0;for(let i=0;i<p.count;i++){const x=positions[i*3]-shiftX,z=positions[i*3+2]-shiftZ,dx=Math.max(x0-x,0,x-x1),dz=Math.max(z0-z,0,z-z1),inside=(dx===0&&dz===0)||Math.hypot(dx,dz)<=eps,raised=inside?baseline.floor:d.groundY(positions[i*3],positions[i*3+2]);mismatch=Math.max(mismatch,Math.abs(raised-supportValues[i]));min=Math.min(min,positions[i*3+1]-raised);}return{min,mismatch};});
  const fastFunction=time(()=>{let min=Infinity;for(let i=0;i<p.count;i++)min=Math.min(min,positions[i*3+1]-fastCowSupport(site,positions[i*3],positions[i*3+2],d.groundY));return min;});
  const bounds=time(()=>{const box=new T.Box3(),point=new T.Vector3();for(let i=0;i<p.count;i++){point.set(positions[i*3],positions[i*3+1],positions[i*3+2]);box.expandByPoint(point);}return box.min.toArray();});
  const belly=time(()=>{let min=Infinity;for(let i=0;i<p.count;i++)if(Math.abs(p.getZ(i))<=.2&&Math.abs(p.getX(i))<=.2&&p.getY(i)<=.9&&si.getX(i)===1&&sw.getX(i)>=.95)min=Math.min(min,positions[i*3+1]);return min;});
  const matrices=time(()=>{r.g.updateMatrixWorld(true);r.card.skeleton.update();return r.card.skeleton.bones.length;});
  const limbs=time(()=>({knees:r.legs.map(l=>{const q=new T.Quaternion();l.knee.matrix.decompose(new T.Vector3(),q,new T.Vector3());return q.angleTo(new T.Quaternion());}),feet:r.legs.map(l=>l.foot.localToWorld(new T.Vector3(0,-.055,0)).toArray())}));
  const combined=time(()=>{r.g.updateMatrixWorld(true);r.card.skeleton.update();const box=new T.Box3(),point=new T.Vector3();let min=Infinity,bellyY=Infinity;for(let i=0;i<p.count;i++){r.card.getVertexPosition(i,point);point.applyMatrix4(r.card.matrixWorld);box.expandByPoint(point);min=Math.min(min,point.y-fastCowSupport(site,point.x,point.z,d.groundY));if(Math.abs(p.getZ(i))<=.2&&Math.abs(p.getX(i))<=.2&&p.getY(i)<=.9&&si.getX(i)===1&&sw.getX(i)>=.95)bellyY=Math.min(bellyY,point.y);}return{min,bellyY};});
  const unique=time(()=>{const seen=new Set(),indices=[];for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i),si.getX(i),si.getY(i),si.getZ(i),si.getW(i),sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)].join(',');if(!seen.has(key)){seen.add(key);indices.push(i);}}return indices;});
  const fastDeform=time(()=>{for(const i of unique.value){r.card.getVertexPosition(i,v);v.applyMatrix4(r.card.matrixWorld);}return unique.value.length;});
  const fastSupport=time(()=>{let min=Infinity;for(const i of unique.value)min=Math.min(min,positions[i*3+1]-cowPenSupportHeight(d.penRuntime.layout.sites.cow,positions[i*3],positions[i*3+2],d.groundY));return min;});
  return{actors:d.animals.length,vertices:p.count,morphs:Object.keys(g.morphAttributes),deform,support,polygon,ground,rect,fastFunction,bounds,belly,matrices,limbs,combined,unique:{ms:unique.ms,count:unique.value.length},fastDeform,fastSupport};
 });
 fs.writeFileSync(file,JSON.stringify({diagnosticOnly:true,result},null,2)+'\n');console.log(JSON.stringify({status:'PASS',file,components:result}));
}catch(e){console.error(e.stack||e);process.exitCode=1;}finally{if(h)await h.close(process.exitCode!==0);}})();
