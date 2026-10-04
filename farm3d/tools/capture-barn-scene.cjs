const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || path.join(repo,'farm3d/tests/node_modules/playwright'));
const out=process.env.TEST_ARTIFACTS || path.join(repo,'farm3d/tests/artifacts/barn-scene-captures');fs.mkdirSync(out,{recursive:true});
// Instrument only this served copy. Hold an actual completed composer frame for
// readback, so software rendering cannot enqueue more GPU work during capture.
let captureSource=fs.readFileSync(path.join(repo,'farm3d/index.html'),'utf8');
for(const [anchor,replacement] of [
 ['function frame() {','function frame() { if (window.__captureHold) { requestAnimationFrame(frame); return; }'],
 ['if (perf) perf.render(); else composer.render();','if (perf) perf.render(); else composer.render(); window.__captureFrames=(window.__captureFrames||0)+1;']
]){assert.equal(captureSource.split(anchor).length,2,'unique capture anchor');captureSource=captureSource.replace(anchor,replacement);}
const server=http.createServer((req,res)=>{const file=path.resolve(repo,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)+(req.url.split('?')[0].endsWith('/')?'index.html':''));if(!file.startsWith(repo+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(file===path.join(repo,'farm3d/index.html')?captureSource:fs.readFileSync(file));});
async function holdCompletedFrame(page){
 const started=Date.now(),frames=await page.evaluate(()=>{window.__captureHold=false;return window.__captureFrames||0;});
 await page.waitForFunction(n=>(window.__captureFrames||0)>=n+3,frames,{timeout:30000});
 await page.evaluate(()=>{window.__captureHold=true;const gl=__dbg.renderer.getContext();window.__captureFence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();});
 await page.waitForFunction(()=>{const gl=__dbg.renderer.getContext(),result=gl.clientWaitSync(__captureFence,0,0);if(result===gl.WAIT_FAILED)throw new Error('capture GPU fence failed');return result===gl.ALREADY_SIGNALED||result===gl.CONDITION_SATISFIED;},null,{timeout:Math.max(1,30000-(Date.now()-started))});
 return page.evaluate(()=>{const gl=__dbg.renderer.getContext();gl.deleteSync(__captureFence);delete window.__captureFence;return {frames:__captureFrames,buffer:[__dbg.renderer.domElement.width,__dbg.renderer.domElement.height],held:true};});
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const results=[];
try{browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.platform==='win32'&&!process.env.CAPTURE_SOFTWARE?['--use-angle=d3d11']:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});const base=`http://127.0.0.1:${server.address().port}/`;
for(const width of process.env.POLISH_QUICK?[844]:[844,1280]){const context=await browser.newContext({viewport:{width,height:width===844?390:720},deviceScaleFactor:1,hasTouch:width===844,serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('firebasejs')?'text/javascript':'application/json',body:r.request().url().includes('firebasejs')?'export {};':'{}'}));
await page.goto(base+'farm3d/?testfarm&debug&portrait&perf&preset=noon');await page.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});await page.addStyleTag({content:'#saPerf{display:none!important}'});
await page.evaluate(()=>{const d=__dbg,G=d.G;G.opts.quiet=true;G.close();G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;for(const [i,p]of G.S.plots.entries())Object.assign(p,{crop:['wheat','corn','carrot','tomato'][i%4],end:Date.now()-1,dur:60000});G.view.refresh('all');});
await page.evaluate(async()=>{
 const {GLTFLoader}=await import('./lib/addons/loaders/GLTFLoader.js');
 const {createBarnScene}=await import('./art/barn-scene-candidate.js');
 const {scene}=await new GLTFLoader().loadAsync('./assets/barn/barn-candidate.glb');
 window.__art=createBarnScene(scene,__dbg.scene);__art.setVisible(false);__dbg.scene.add(__art.root);
 window.__oldBias=__dbg.sun.shadow.normalBias;
});
for(const preset of process.env.POLISH_QUICK?['noon']:['noon','golden','rain']){
 await page.evaluate(p=>{__dbg.setPreset(p);__dbg.QUALITY.auto=false;__dbg.cam.yaw=__dbg.view.yaw=.55;__dbg.cam.pitch=__dbg.view.pitch=.35;__dbg.cam.dist=__dbg.view.dist=24;__dbg.cam.target.set(0,1,2);__dbg.view.target.set(0,1,2);},preset);
 for(const mode of ['overview','walk']){
  if(mode==='walk'){
   await page.locator('#walkBtn').click();await page.waitForFunction(()=>!!__dbg.walk);await page.waitForTimeout(1500);
   const pov=await page.evaluate(()=>!!__dbg.camera.children.find(o=>o.userData.skin)?.visible);
   if(!pov)await page.locator('#povBtn').click();
   await page.evaluate(()=>{__dbg.walk.pos.set(1.3,9.5);__dbg.walk.vel.set(0,0);__dbg.walk.yaw=.2;__dbg.walk.pitch=.06;});
  }
  for(const candidate of [false,true]){
   await page.evaluate(on=>{__art.setVisible(on);__dbg.barn.visible=!on;__dbg.sun.shadow.normalBias=on?.12:__oldBias;},candidate);
   const capture=await holdCompletedFrame(page);
   await page.screenshot({path:path.join(out,`${width}-${preset}-${mode}-${candidate?'after':'before'}.png`)});
   const result=await page.evaluate(({preset,mode,candidate})=>{const d=__dbg;return {preset,mode,candidate,viewport:[innerWidth,innerHeight],buffer:[d.renderer.domElement.width,d.renderer.domElement.height],quality:{...d.QUALITY},counts:{...d.renderer.info.render,...d.renderer.info.memory},save:localStorage.getItem('sunny-acres-3d-v1')};},{preset,mode,candidate});
   assert.deepEqual(result.buffer,result.viewport,'full CSS drawing resolution');results.push({...result,capture});
   await page.evaluate(()=>{window.__captureHold=false;});
  }
 }
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!__dbg.walk);
}
await holdCompletedFrame(page);
const lifetime=await page.evaluate(()=>{const d=__dbg;d.barn.visible=false;const before={...d.renderer.info.memory};__art.dispose();__art.dispose();return {before,after:{...d.renderer.info.memory}};});
assert.equal(lifetime.after.geometries,lifetime.before.geometries-8);assert.equal(lifetime.after.textures,lifetime.before.textures-2);
results.push({lifetime,save:null});
await page.evaluate(()=>{__dbg.barn.visible=true;__dbg.sun.shadow.normalBias=__oldBias;window.__captureHold=false;});
assert.deepEqual(errors,[]);assert.ok(results.every(r=>r.save===null));await context.close();}console.log('PASS captures',results.length);}
finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});


