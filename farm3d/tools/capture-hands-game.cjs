const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../..');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || path.join(repo,'farm3d/tests/node_modules/playwright'));
const out=process.env.TEST_ARTIFACTS || path.join(repo,'farm3d/tests/artifacts/hands-game-captures');
fs.mkdirSync(out,{recursive:true});
let source=fs.readFileSync(path.join(repo,'farm3d/index.html'),'utf8');
for(const [anchor,replacement] of [
 ['function frame() {',`function frame() {
  if(window.__handsFence){const gl=renderer.getContext(),status=gl.clientWaitSync(__handsFence,0,0);
   if(status===gl.WAIT_FAILED)throw Error('hand capture GPU fence failed');
   if(status!==gl.ALREADY_SIGNALED&&status!==gl.CONDITION_SATISFIED){requestAnimationFrame(frame);return;}
   gl.deleteSync(__handsFence);window.__handsFence=null;window.__handsFrames=(window.__handsFrames||0)+1;}
  if(window.__handsHold){requestAnimationFrame(frame);return;}`],
 ['if (perf) perf.render(); else composer.render();',`if(window.__handsPose){const root=camera.getObjectByName('Authored first-person hands');
   root.userData.authoredHands.update({visible:true,kind:__handsPose,phase:.5,time:0,reducedMotion:true});}
  if (perf) perf.render(); else composer.render();
  {const gl=renderer.getContext();window.__handsFence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();}`]
]){assert.equal(source.split(anchor).length,2);source=source.replace(anchor,replacement);}
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;
 const file=path.resolve(repo,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
 if(!file.startsWith(repo+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
 res.end(file===path.join(repo,'farm3d/index.html')?source:fs.readFileSync(file));});
async function hold(page){
 const frames=await page.evaluate(()=>{window.__handsHold=false;return window.__handsFrames||0;});
 await page.waitForFunction(n=>(window.__handsFrames||0)>=n+3,frames,{timeout:30000});
 return page.evaluate(()=>{window.__handsHold=true;return {frames:__handsFrames,buffer:[__dbg.renderer.domElement.width,__dbg.renderer.domElement.height],
   visible:__dbg.camera.getObjectByName('Authored first-person hands').visible,
   quality:{...__dbg.QUALITY}};});
}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const results=[];
try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,
 args:process.platform==='win32'?['--use-angle=d3d11']:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base='http://127.0.0.1:'+server.address().port+'/';
for(const width of [844,1280]){
 const height=width===844?390:720,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width===844,serviceWorkers:'block'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('firebasejs')?'text/javascript':'application/json',body:r.request().url().includes('firebasejs')?'export {};':'{}'}));
 await page.goto(base+'farm3d/?testfarm&debug&portrait&artHands&preset=noon');
 await page.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await page.waitForFunction(()=>__dbg.camera.getObjectByName('Authored first-person hands')?.userData.authoredHands.state.status==='ready');
 await page.evaluate(()=>{const d=__dbg;d.G.opts.quiet=true;d.G.close();d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;});
 const overview=await hold(page);assert.equal(overview.visible,false);assert.deepEqual(overview.buffer,[width,height]);
 results.push({width,height,pose:'overview-hidden',proof:overview});
 await page.screenshot({path:path.join(out,width+'-overview-hidden.png')});
 await page.evaluate(()=>window.__handsHold=false);await page.locator('#walkBtn').click();
 await page.waitForFunction(()=>!!__dbg.walk);await page.waitForTimeout(1500);
 for(const pose of ['idle','harvest','pet']){
  await page.evaluate(pose=>{window.__handsPose=pose;window.__handsHold=false;},pose);
  const proof=await hold(page);assert.equal(proof.visible,true);assert.deepEqual(proof.buffer,[width,height]);
  assert.equal(proof.quality.pr,1);assert.equal(proof.quality.cut,0);assert.deepEqual(proof.quality.steps,[]);
  await page.screenshot({path:path.join(out,width+'-'+pose+'.png')});results.push({width,height,pose,proof});
 }
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('sunny-acres-3d-v1')),null);
 await context.close();
}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'full CSS-resolution test farm composer, not owner/device acceptance',results},null,2));
console.log('PASS full CSS drawing resolution: overview hides hands; Walk idle/harvest/pet at both viewports');
}finally{if(browser)await browser.close();server.close();}
})().catch(error=>{fs.writeFileSync(path.join(out,'failure.txt'),error.stack);console.error(error);server.close();process.exitCode=1;});
