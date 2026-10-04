// Normal guest farms, actual service-worker caching and real failed HTTP loads.
// Account/cloud behavior remains covered by the separate Firebase emulator job.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts'));
fs.mkdirSync(out,{recursive:true});
const sw=fs.readFileSync(path.join(root,'farm3d/sw.js'),'utf8');
const cacheName=sw.match(/const CACHE = "([^"]+)"/)[1];
const shell=JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const assetHash=hash(fs.readFileSync(path.join(root,'farm3d/assets/hands/hands-candidate.glb')));
let holdAsset=true,releaseAsset,deny=null,serverOffline=false,servedRequests=0;
const assetGate=new Promise(resolve=>releaseAsset=resolve),requests=[];
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');requests.push(url.pathname+url.search);
  if(serverOffline){req.socket.destroy();return;}
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if((deny==='asset'&&url.pathname.endsWith('/hands-candidate.glb'))||
     (deny==='module'&&url.pathname.endsWith('/authored-hands.js'))){res.writeHead(404);res.end('deliberate missing hands');return;}
  if(holdAsset&&url.pathname.endsWith('/hands-candidate.glb'))await assetGate;
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');
  servedRequests++;res.end(fs.readFileSync(file));
 }catch{res.writeHead(400);res.end();}
});
let browser,base,failed=true;const contexts=[],results=[];
async function session(name,workers='allow'){
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:.5,hasTouch:true,isMobile:true,serviceWorkers:workers});
 const record={context,name,closed:false};contexts.push(record);await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 await context.addInitScript(()=>{try{localStorage.setItem('sa3d-pov','eyes');}catch{/* about:blank has no storage origin */}});
 await context.route('**/*',route=>{const url=route.request().url();if(url.startsWith(base))return route.continue();
  const sdk=url.includes('gstatic.com/firebasejs/');return route.fulfill({contentType:sdk?'text/javascript':'application/json',body:sdk?'export {};':'{}'});});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push('HTTP '+r.status()+': '+r.url());});
 return {context,page,errors,record};
}
async function finish(s){await s.context.tracing.stop();await s.context.close();s.record.closed=true;}
async function boot(page){
 await page.goto(base+'farm3d/?debug&portrait',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 if(await page.locator('#authGuest').isVisible())await page.locator('#authGuest').click();
 await page.waitForFunction(()=>window.saAuth?.guest&&document.getElementById('authGate').hidden);
 await page.evaluate(()=>{const G=__dbg.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;});
}
async function walk(page,authored){
 await page.locator('#walkBtn').click();await page.waitForFunction(()=>!!__dbg.walk);
 await page.waitForFunction(want=>{const d=__dbg,a=d.camera.getObjectByName('Authored first-person hands'),legacy=d.camera.children.find(o=>o.userData.skin);
  return want?!!a?.visible&&!legacy.visible:legacy.visible&&!a?.visible;},authored);
}
async function saved(page){return page.evaluate(()=>({coins:__dbg.G.S.coins,crop:__dbg.G.S.plots[0].crop,guest:saAuth.guest}));}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/';
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const s=await session('hands-production'),p=s.page;
  await boot(p);assert.equal(await p.evaluate(()=>__dbg.G.S.level),1);
  assert.equal(new URL(p.url()).searchParams.has('testfarm'),false);
  assert.equal(new URL(p.url()).searchParams.has('artHands'),false);
  await walk(p,false);assert(requests.some(r=>r.includes('hands-candidate.glb?v=2')));
  results.push({name:'normal farm keeps procedural hands visible during actual pending model request'});
  console.log('PASS normal farm pending model fallback');
  holdAsset=false;releaseAsset();
  await p.waitForFunction(()=>__dbg.camera.getObjectByName('Authored first-person hands')?.visible);
  const wardrobe=await p.evaluate(()=>{const d=__dbg,a=d.camera.getObjectByName('Authored first-person hands'),legacy=d.camera.children.find(o=>o.userData.skin);
   d.G.wear('skin',2);const slots=[];a.traverse(o=>{if(o.isSkinnedMesh)slots.push(o.material===legacy.userData.skin||o.material===legacy.userData.sleeve);});
   return {slots,legacyVisible:legacy.visible,skin:d.G.lookOf(d.G.S).skin};});
  assert.deepEqual(wardrobe.slots,[true,true,true,true]);assert.equal(wardrobe.legacyVisible,false);assert.equal(wardrobe.skin,2);
  await p.screenshot({path:path.join(out,'hands-production-normal.png')});
  await p.keyboard.press('Escape');await p.waitForFunction(()=>!__dbg.walk&&!__dbg.camera.getObjectByName('Authored first-person hands').visible);
  await p.evaluate(()=>{const G=__dbg.G;G.plant(0,'wheat');G.save();});
  const before=await saved(p);assert.equal(before.crop,'wheat');
  // localhost is a secure context. Explicitly register the unmodified production
  // worker here because the deployed HTTPS-only auto-registration excludes HTTP.
  const migration=await p.evaluate(async()=>{
   await (await caches.open('sa3d-v39')).put('old-hands-marker',new Response('old'));
   await (await caches.open('foreign-farm-cache')).put('foreign-marker',new Response('preserve'));
   await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
   if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
   return {keys:await caches.keys(),foreign:await (await caches.open('foreign-farm-cache')).match('foreign-marker').then(r=>r.text()),controlled:!!navigator.serviceWorker.controller};
  });
  assert.equal(migration.controlled,true);assert(migration.keys.includes(cacheName));assert(!migration.keys.includes('sa3d-v39'));assert.equal(migration.foreign,'preserve');
  const cached=await p.evaluate(async({cacheName,shell})=>{
   const c=await caches.open(cacheName),entries=[];
   for(const item of shell){const r=await c.match(new URL(item,location.href));entries.push({item,status:r?.status});}
   const r=await c.match(new URL('assets/hands/hands-candidate.glb?v=2',location.href));
   const bytes=await r.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
   return {entries,assetHash:Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join(''),keys:(await c.keys()).map(r=>r.url)};
  },{cacheName,shell});
  assert(cached.entries.every(e=>e.status===200));assert.equal(cached.assetHash,assetHash);
  assert(!cached.keys.some(k=>/\.blend|build-hands/.test(k)));
  await p.reload();await p.waitForFunction(()=>window.__dbg&&!document.getElementById('loading')&&window.saAuth?.guest,null,{timeout:90000});
  assert.deepEqual(await saved(p),before);assert.equal(await p.evaluate(()=>__dbg.G.lookOf(__dbg.G.S).skin),2);
  await walk(p,true);await p.keyboard.press('Escape');await p.waitForFunction(()=>!__dbg.walk);
  // Chrome may independently check sw.js for updates even with context offline.
  // Cut off the server too, so no update or late request can supply game bytes.
  serverOffline=true;const onlineServedCount=servedRequests;
  await s.context.setOffline(true);await p.reload();
  await p.waitForFunction(()=>window.__dbg&&!document.getElementById('loading')&&window.saAuth?.guest,null,{timeout:90000});
  assert.deepEqual(await saved(p),before);await walk(p,true);
  assert.equal(servedRequests,onlineServedCount,'offline reload receives zero server responses');
  await p.screenshot({path:path.join(out,'hands-production-offline.png')});
  assert.deepEqual(s.errors,[]);results.push({name:'normal save, wardrobe, controlled cache migration and offline authored reload',before,migration,cached});
  serverOffline=false;await s.context.setOffline(false);await finish(s);
  console.log('PASS normal save/wardrobe and actual controlled offline reload');
  for(const failure of ['asset','module']){
   deny=failure;console.log('Checking real missing '+failure);const f=await session('hands-production-fallback-'+failure,'block');await boot(f.page);await walk(f.page,false);
   await f.page.waitForFunction(()=>__dbg.renderer.info.render.frame>30);
   assert.equal(await f.page.evaluate(()=>!!__dbg.camera.getObjectByName('Authored first-person hands')),false);
   const source=failure==='asset'?'hands-candidate.glb':'authored-hands.js';
   assert(f.errors.some(e=>e.includes('HTTP 404:')&&e.includes(source)),'real missing '+failure+' request reached fallback');
   assert(f.errors.every(e=>e.includes('HTTP 404:')&&e.includes(source)),'no unrelated failure');
   await f.page.keyboard.press('Escape');await f.page.waitForFunction(()=>!__dbg.walk);
   await f.page.evaluate(()=>{__dbg.G.plant(0,'wheat');__dbg.G.save();});
   assert.equal((await saved(f.page)).crop,'wheat');
   await f.page.screenshot({path:path.join(out,'hands-production-fallback-'+failure+'.png')});
   results.push({name:'normal game remains playable after real missing '+failure,expectedErrors:f.errors});
   await finish(f);console.log('PASS real missing '+failure+' fallback and save');
  }
  deny=null;failed=false;console.log('PASS normal hands: pending/ready/fallback, save/wardrobe, actual SW migration and offline reload');
 }catch(error){console.error(error);throw error;}finally{
  releaseAsset();fs.writeFileSync(path.join(out,'hands-production-results.json'),JSON.stringify({cacheName,assetHash,results,requests,failed},null,2));
  for(const {context,name,closed} of contexts){if(closed)continue;if(failed)try{await context.pages()[0]?.screenshot({path:path.join(out,name+'-failure.png'),timeout:15000});}catch{}
   await context.tracing.stop(failed?{path:path.join(out,name+'-failure.zip')}:{});await context.close();}
  await browser?.close();await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
