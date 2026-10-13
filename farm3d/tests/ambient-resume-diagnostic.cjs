// Read-only production probe. Compile an instrumented copy of the existing
// fixture in memory; do not edit its file, waits, comparisons or thresholds.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Module = require('node:module');
const vm = require('node:vm');

const originalPath = path.join(__dirname, 'scene-polish.browser.cjs');
const original = fs.readFileSync(originalPath, 'utf8');
const sourceSha256 = crypto.createHash('sha256').update(original).digest('hex');
const reducedAssertion = "await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>JSON.stringify(__butterflyBefore)===JSON.stringify(Array.from(__butterfly.geometry.attributes.position.array))),true,'new ambient motion stops');";
const resumeAssertion = "assert.equal(await p.evaluate(()=>JSON.stringify(__butterflyBefore)!==JSON.stringify(Array.from(__butterfly.geometry.attributes.position.array))),true,'ambient motion resumes');";
const resumeWait = "await p.evaluate(()=>document.documentElement.dataset.motion='full');await p.waitForTimeout(700);";
function replaceOnce(source, from, to) {
  if (source.split(from).length !== 2) throw new Error('Diagnostic anchor changed: '+from.slice(0,80));
  return source.replace(from,to);
}
let source = original;
const helpers = `
const __ambientReport={sourceSha256:${JSON.stringify(sourceSha256)},scope:'Original ambient windows only, first failing viewport stops the run',observations:[]};
function __persistAmbient(){fs.mkdirSync(artifacts,{recursive:true});fs.writeFileSync(path.join(artifacts,'ambient-resume-diagnostic.json'),JSON.stringify(__ambientReport,null,2));}
__persistAmbient();
async function __captureAmbient(p,width,stage,assertionPassed){
 try {
  const sample=await p.evaluate(()=>window.__ambientTape.snapshot());
  const observation={width,stage,assertionPassed,...sample};
  __ambientReport.observations.push(observation);__persistAmbient();
  console.log('AMBIENT_DIAGNOSTIC '+JSON.stringify(observation));
 } catch(error) {
  __ambientReport.observations.push({width,stage,assertionPassed,loggingError:error.message});__persistAmbient();
  console.error('AMBIENT_DIAGNOSTIC logging failed: '+error.message);
 }
}
`;
source = replaceOnce(source,"const {start,artifacts}=require('./browser-harness.cjs');","const {start,artifacts}=require('./browser-harness.cjs');\n"+helpers);
const setup = `
 await p.evaluate(async()=>{
  const T=await import('./lib/three.module.min.js'),d=__dbg,b=__butterfly;
  const callbacks=[],animationFrames=[],markers=[];
  let callbackCount=0,animationFrameCount=0,previousAnimationTime=null,active=true;
  const retainedLimit=128,append=(list,item)=>{if(list.length===retainedLimit)list.shift();list.push(item);};
  const describe=()=>{
   const sphere=b.geometry.boundingSphere;
   let intersectsFrustum=null;
   if(sphere){
    const worldSphere=sphere.clone().applyMatrix4(b.matrixWorld);
    const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(d.camera.projectionMatrix,d.camera.matrixWorldInverse));
    intersectsFrustum=frustum.intersectsSphere(worldSphere);
   }
   let ancestorsVisible=true;for(let o=b;o;o=o.parent)if(!o.visible)ancestorsVisible=false;
   return {browserTimeMs:performance.now(),rendererFrame:d.renderer.info.render.frame,
    callbackCount,animationFrameCount,hidden:document.hidden,visibilityState:document.visibilityState,
    motionAttribute:document.documentElement.dataset.motion||null,gameMotionPreference:d.G.PREFS.motion,
    gameReducedMotion:d.G.reducedMotion(),systemReducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
    objectVisible:b.visible,ancestorsVisible,frustumCulled:b.frustumCulled,intersectsFrustum,
    bounds:sphere?{center:sphere.center.toArray(),radius:sphere.radius}:null,
    position:Array.from(b.geometry.attributes.position.array)};
  };
  const observer=new MutationObserver(records=>{
   for(const record of records)append(markers,{previousMotionAttribute:record.oldValue,...describe()});
  });
  observer.observe(document.documentElement,{attributes:true,attributeOldValue:true,attributeFilter:['data-motion']});
  const native=b.onBeforeRender;
  b.onBeforeRender=function(...args){
   const start=performance.now(),value=Reflect.apply(native,this,args),nativeDurationMs=performance.now()-start;callbackCount++;
   const record={atMs:start,nativeDurationMs,motion:document.documentElement.dataset.motion||null,
    rendererFrame:d.renderer.info.render.frame,position:Array.from(b.geometry.attributes.position.array)};
   append(callbacks,record);record.instrumentationMs=performance.now()-start-nativeDurationMs;
   return value;
  };
  const sampleFrame=timestamp=>{
   if(!active)return;animationFrameCount++;
   append(animationFrames,{atMs:timestamp,deliveredAtMs:performance.now(),intervalMs:previousAnimationTime===null?null:timestamp-previousAnimationTime,
    rendererFrame:d.renderer.info.render.frame,motion:document.documentElement.dataset.motion||null});
   previousAnimationTime=timestamp;requestAnimationFrame(sampleFrame);
  };
  requestAnimationFrame(sampleFrame);
  window.__ambientTape={snapshot:()=>({...describe(),markers:markers.slice(),callbacks:callbacks.slice(),animationFrames:animationFrames.slice()}),
   stop:()=>{active=false;observer.disconnect();b.onBeforeRender=native;}};
 });
`;
const reduceSetter=" await p.evaluate(()=>{document.documentElement.dataset.motion='reduce';window.__butterflyBefore=Array.from(__butterfly.geometry.attributes.position.array);});";
source = replaceOnce(source,reduceSetter,setup+reduceSetter);
source = replaceOnce(source,reducedAssertion,`{let __passed=false;try{${reducedAssertion}__passed=true;}finally{await __captureAmbient(p,width,'reduced-after-original-assertion',__passed);}}`);
source = replaceOnce(source,resumeAssertion,`{let __passed=false;try{${resumeAssertion}__passed=true;}finally{await __captureAmbient(p,width,'full-after-original-assertion',__passed);await p.evaluate(()=>window.__ambientTape.stop()).catch(()=>{});}}`);
// End each case immediately after the original ambient assertion. Unrelated
// wardrobe/action/material tests and the legacy fixture are not diagnostic scope.
const walkLine=" await p.locator('#walkBtn').click();await p.waitForFunction(()=>!!__dbg.walk);await p.waitForTimeout(1500);";
source = replaceOnce(source,walkLine," results.push({width,environment,ambientDiagnosticOnly:true});await s.finish();console.log('PASS bounded ambient diagnostic '+width);continue;\n"+walkLine);
const legacyLine=" const legacy=await h.setup({width:844,height:390},true,'polish-legacy');";
source = replaceOnce(source,legacyLine," failed=false;return;\n"+legacyLine);
for(const preserved of [reducedAssertion,resumeAssertion,resumeWait])
  if(source.split(preserved).length!==2)throw new Error('Original 700 ms contract was altered');
new vm.Script(Module.wrap(source),{filename:originalPath});
console.log('AMBIENT_DIAGNOSTIC_SOURCE '+JSON.stringify({sourceSha256,originalFile:originalPath,preserved700msAssertions:true,viewports:[844,1280]}));
if(!process.argv.includes('--verify')){
 const probe=new Module(originalPath,module);probe.filename=originalPath;probe.paths=Module._nodeModulePaths(__dirname);
 probe._compile(source,originalPath);
}
