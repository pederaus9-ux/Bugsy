// Bounded diagnostic of the valid composed occupied-shelter journey: retain
// approved setup/Apply assertions and measure only one resumed frame.
// This result is never a shelter continuation qualification.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const composed=path.join(__dirname,'animal-pen-shelter-composed.browser.cjs');
let wrapper=fs.readFileSync(composed,'utf8');
const anchor="fs.mkdirSync(out,{recursive:true});assert(!fs.existsSync(path.join(out,'executed-source.cjs')))";
assert.equal(wrapper.split(anchor).length,2,'expected unchanged composed wrapper');
wrapper=wrapper.replace(anchor,`
const start=source.indexOf(" stage='occupied support then actual wake and release';");
const end=source.indexOf(" }catch(e){report.status='FAIL';",start);
assert(start>=0&&end>start,'expected unchanged continuation boundary');
source=source.slice(0,start)+\`
 stage='bounded post-Apply timing diagnostic';
 const timing=await p.evaluate(async()=>{
  const d=__dbg,T=await import('./lib/three.module.min.js'),{fastCowSupport}=await import('./tests/animal-pen-shelter-fast-support.mjs'),cows=d.animals.filter(a=>a.kind==='cow'),site=d.penRuntime.layout.sites.cow;
  const counts=cows.map(a=>{const g=a.rig3d.card.geometry,p=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,seen=new Set();for(let i=0;i<p.count;i++)seen.add([p.getX(i),p.getY(i),p.getZ(i),si.getX(i),si.getY(i),si.getZ(i),si.getW(i),sw.getX(i),sw.getY(i),sw.getZ(i),sw.getW(i)].join(','));return{vertices:p.count,unique:seen.size,morphs:Object.keys(g.morphAttributes)};});
  const mark=(name,fn)=>{const begin=performance.now();const value=fn();return{name,elapsedMs:performance.now()-begin,value};};
  const first=cows[0].rig3d,geom=first.card.geometry,position=geom.attributes.position,skinIndex=geom.attributes.skinIndex,skinWeight=geom.attributes.skinWeight,point=new T.Vector3(),coords=new Float64Array(position.count*3);
  const oneDeform=mark('one cow deform after Apply',()=>{first.g.updateMatrixWorld(true);first.card.skeleton.update();for(let i=0;i<position.count;i++){first.card.getVertexPosition(i,point);point.applyMatrix4(first.card.matrixWorld);coords[i*3]=point.x;coords[i*3+1]=point.y;coords[i*3+2]=point.z;}return position.count;});
  const oneSupport=mark('one cow verified rectangle support with cached site after Apply',()=>{let min=Infinity;for(let i=0;i<position.count;i++)min=Math.min(min,coords[i*3+1]-fastCowSupport(site,coords[i*3],coords[i*3+2],d.groundY));return min;});
  const oneCombined=mark('one cow complete observer with cached site after Apply',()=>{first.g.updateMatrixWorld(true);first.card.skeleton.update();const bounds=new T.Box3();let min=Infinity,belly=Infinity;for(let i=0;i<position.count;i++){first.card.getVertexPosition(i,point);point.applyMatrix4(first.card.matrixWorld);bounds.expandByPoint(point);min=Math.min(min,point.y-fastCowSupport(site,point.x,point.z,d.groundY));if(Math.abs(position.getZ(i))<=.2&&Math.abs(position.getX(i))<=.2&&position.getY(i)<=.9&&skinIndex.getX(i)===1&&skinWeight.getX(i)>=.95)belly=Math.min(belly,point.y);}return{min,belly};});
  const before=mark('full skin pose before tick',()=>__shelterPose().map(p=>({minFloor:p.minFloor,belly:p.belly})));
  const tick=mark('one unchanged physics frame',()=>__shelterTick());
  const after=mark('full skin pose after tick',()=>__shelterPose().map(p=>({minFloor:p.minFloor,belly:p.belly})));
  const render=mark('one scene render',()=>{d.renderScene();return true;});
  return{counts,oneDeform,oneSupport,oneCombined,before,tick,after,render,clock:d.clock(),actors:d.animals.length};
 });
 record(stage,timing);report.diagnosticOnly=true;report.status='PASS';
\`+source.slice(end);
`+anchor);
const run=new Module(composed,module);run.filename=composed;run.paths=Module._nodeModulePaths(__dirname);run._compile(wrapper,composed);
