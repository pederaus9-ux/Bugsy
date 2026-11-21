'use strict';
// Test-only. Fresh synthetic guest, frozen files, loopback, and no screenshots or raw logs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),http=require('node:http'),os=require('node:os');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const config='farm3d/tests/fixtures/a54-installed-v95-public.json',fixturePath='farm3d/tests/fixtures/saves/3d-v3-cow-robot.json';
const pins={config:'9d6d435970562cc5f82540dc08b5f8619deed271614d7fe352f7814eaf2e6d72',fixture:'2f60cd0a2e0985ab8463d67ad64ea1726238c57d7fbc2d7b8e1700a1ba02da4e',
 runner:'cdb1d4ad2da88964c10053ce34bfd3e269cb929fecb7e4d6314a864154c9656a',transition:'9f54134eea4b55844822437d30408a02331d03578904f4f56d999e6561f3e7de'};
const files=['farm3d/index.html','farm3d/sw.js'];
function payload(){
 const raw=read(config);assert.equal(sha(raw),pins.config);
 const m=JSON.parse(raw);assert.equal(m.baseCommit,'9e6f2763dd7781b761ccaef2f2cfa680d57b4783');assert.deepEqual(Object.keys(m.files),files);
 assert(Array.isArray(m.assets)&&m.assets.length===128&&new Set(m.assets).size===128&&m.assets.every(f=>/^(?:farm|farm3d)\/[a-z\d_./-]+$/i.test(f)&&!f.includes('..')&&!f.includes('/tests/')));
 const old=new Map(m.assets.map(f=>[f,read(f)])),next=new Map(old);
 for(const f of files){
  const d=m.files[f], previous=old.get(f);assert.equal(sha(previous),d.beforeSha256);
  let s=previous.toString('utf8');for(const h of d.hunks){assert.equal(s.split(h.before).length,2);s=s.replace(h.before,()=>h.after);}
  assert.equal(sha(s),d.afterSha256);next.set(f,Buffer.from(s));
  for(const h of [...d.hunks].reverse()){assert.equal(s.split(h.after).length,2);s=s.replace(h.after,()=>h.before);}
  assert.equal(s,previous.toString('utf8'));
 }
 assert.equal(old.get(files[1]).toString().replace('sa3d-v94','sa3d-v95'),next.get(files[1]).toString());
 assert.equal(sha(read(fixturePath)),pins.fixture);
 assert.equal(sha(read('farm3d/tests/worker-transition.cjs')),pins.transition);
 assert.equal(sha(read('farm3d/tests/helpers/ci-isolated-runner.cjs')),pins.runner);
 return {old,next,fixture:JSON.parse(read(fixturePath)).save};
}
if(process.argv[2]==='--verify-only'){
 const p=payload();console.log(JSON.stringify({assets:p.old.size,changed:files,old:files.map(f=>sha(p.old.get(f))),next:files.map(f=>sha(p.next.get(f)))}));
 return;
}
const guard=require('./helpers/ci-isolated-runner.cjs');
assert.equal(process.argv[2],'--isolated-browser');assert(process.pid>1&&guard.topologySafe(os.networkInterfaces(),fs.readFileSync('/proc/net/route','utf8'),fs.readFileSync('/proc/net/ipv6_route','utf8')));
assert(!process.env.DEBUG&&!process.env.PWDEBUG);
const {chromium}=require('playwright');
const {beginWorkerUpdate,updateWorker}=require('./worker-transition.cjs');
const listen=s=>new Promise((r,j)=>{s.once('error',j);s.listen(0,'127.0.0.1',r);});
const stop=s=>new Promise(r=>{if(!s.listening){r();return;}s.close(()=>r());s.closeAllConnections();});
const getURL=s=>'http://127.0.0.1:'+s.address().port;
const mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.glb':'model/gltf-binary','.webmanifest':'application/manifest+json','.woff2':'font/woff2'};
const p=payload(),hashes=Object.fromEntries([['v94',p.old],['v95',p.next]].map(([v,o])=>[v,files.map(f=>sha(o.get(f)))]));
const records={schema:1,status:'FAIL',stage:'prepare',hashes,automaticHttpsRegistration:false};
let browser,context,server,proxy,phase='v94',serverRequests=0,missingRequests=0,origin=null;
const receipts=process.env.TEST_ARTIFACTS;
const ready=page=>page.waitForFunction(()=>window.__ready===true&&!!window.__dbg&&!document.getElementById('loading'),null,{timeout:70000});
const query='?debug&portrait&preset=noon';
function setStage(s){records.stage=s;}
async function ownedCache(page,version,expected){
 const r=await page.evaluate(async({version,expected})=>{
  const r=await navigator.serviceWorker.getRegistration(),key='sa3d-'+version;
  if(!r?.active||r.active!==navigator.serviceWorker.controller||r.active.state!=='activated'||r.installing||r.waiting)return {control:false};
  const keys=await caches.keys();if(!keys.includes(key))return {control:false};
  const c=await caches.open(key),registered=new URL('sw.js',location.href);
  const h=async route=>{
   const raw=await c.match(new URL(route,location.href));if(!raw)return null;
   const d=await crypto.subtle.digest('SHA-256',await raw.arrayBuffer());
   return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,'0')).join('');
  };
  const foreign=keys.includes('a54-fixture-foreign')&&await(await(await caches.open('a54-fixture-foreign')).match('fixture-marker')).text()==='preserved';
  return {control:r.active.scriptURL===registered.href,root:(await h('./'))===expected,index:(await h('index.html'))===expected,
    versions:keys.filter(x=>x.startsWith('sa3d-')).sort(),foreign};
 },{version,expected});
 assert(r.control&&r.root&&r.index&&r.foreign);
 assert.deepEqual(r.versions,['sa3d-'+version]);
}
async function saveView(page){
 const result=await page.evaluate(()=>{
  if(!window.__dbg?.G.save())throw Error('fixture save did not write');
  const s=JSON.parse(localStorage.getItem(window.__dbg.G.SAVE_KEY));
  if(!s||s.coins!==345||s.barn.wheat!==3||s.pens.chicken.list.length!==30||!s.pens.cow.care.cows.length)throw Error('fixture mismatch');
  const cows=s.pens.cow.care.cows.map(x=>[x.id,x.cycle,x.feedCharged,x.ready]);
  const job=s.pens.cow.care.job;
  return {v:s.v,coins:s.coins,inventory:s.barn,layout:s.layout,pens:{cow:s.pens.cow.list,chicken:s.pens.chicken.list},cows,
    job:job?[job.id,job.cowId,job.stage]:null,paid:s.pens.cow.care.feed};
 });
 return sha(JSON.stringify(result)); // Comparison only. Digest/data not exported.
}
async function localPage(page,alias,expected,offline){
 const h=await page.goto(origin+'/farm3d/'+alias+query,{waitUntil:'domcontentloaded',timeout:70000});
 assert(h&&h.status()===200&&h.headers()['content-type']?.includes('text/html'));assert.equal(sha(await h.body()),expected);
 if(offline)assert(h.fromServiceWorker());
 await ready(page);
}
(async()=>{
 try{
  setStage('network');
  server=http.createServer((req,res)=>{
   serverRequests++;
   let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);res.end();return;}
   const f=url.pathname==='/farm3d/'?'farm3d/index.html':url.pathname.slice(1);
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const map=phase==='v94'?p.old:p.next;
   res.setHeader('cache-control','no-store');
   if(phase==='broken'&&f==='farm3d/sunny-ui.css'){missingRequests++;res.writeHead(404);res.end();return;}
   if(!map.has(f)){res.writeHead(404);res.end();return;}
   res.setHeader('content-type',mime[path.extname(f)]||'application/octet-stream');
   res.end(req.method==='HEAD'?undefined:map.get(f));
  });
  proxy=http.createServer((_q,s)=>{s.writeHead(403);s.end();});
  proxy.on('connect',(_q,s)=>s.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
  proxy.on('upgrade',(_q,s)=>s.destroy());
  await listen(server);await listen(proxy);
  setStage('sandbox');
  browser=await chromium.launch({headless:true,chromiumSandbox:true,proxy:{server:getURL(proxy),bypass:'<-loopback>,127.0.0.1:'+server.address().port},args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844},deviceScaleFactor:.5,hasTouch:true,isMobile:true});
  origin=getURL(server);
  await context.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(origin+'/'))return route.continue();
   // Match only the existing Firebase SDK stub precedent. Never forward a remote request.
   if(u.startsWith('https://www.gstatic.com/firebasejs/'))return route.fulfill({contentType:'text/javascript',body:'export {};'});
   return route.abort('blockedbyclient');
  });
  const initial=Date.now();
  await context.addInitScript(({fixture,initial,ownerOrigin})=>{
   if(location.origin!==ownerOrigin)return;
   Date.now=()=>initial;
   const key='sunny-acres-3d-v1';
   if(localStorage.getItem('a54-fixture-initialized'))return;
   if(localStorage.length)throw Error('nonfresh test origin');
   fixture.lastSeen=initial;fixture.tut=99;fixture.event=null;fixture.nextEventAt=fixture.nextRushAt=fixture.nextVisitorAt=9e15;
   localStorage.setItem(key,JSON.stringify(fixture));localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');
   localStorage.setItem('a54-fixture-initialized','1');
  },{fixture:p.fixture,initial,ownerOrigin:origin});
  const oldTab=await context.newPage();
  setStage('old_install');await localPage(oldTab,'',hashes.v94[0],false);
  await oldTab.evaluate(async()=>{
   if(!isSecureContext||location.protocol!=='http:')throw Error('expected trusted loopback secure context only');
   const c=await caches.open('a54-fixture-foreign');await c.put('fixture-marker',new Response('preserved'));
   window.__a54OldRegistration=await navigator.serviceWorker.register('./sw.js');
  });
  await oldTab.waitForFunction(()=>{const r=window.__a54OldRegistration;return r?.active?.state==='activated'&&r.active===navigator.serviceWorker.controller&&!r.installing&&!r.waiting;},null,{timeout:70000});
  await ownedCache(oldTab,'v94',hashes.v94[0]);const oldSave=await saveView(oldTab);records.oldInstall=true;
  setStage('failed_precache');phase='broken';await oldTab.evaluate(beginWorkerUpdate).catch(()=>{});
  await oldTab.waitForFunction(()=>{const s=window.__workerTransition;return s?.expected?.state==='redundant'&&s.registration.active===s.before&&navigator.serviceWorker.controller===s.before;},null,{timeout:25000});
  assert(missingRequests>0);records.redundantWorker=true;records.failedPrecacheRequests=Math.min(missingRequests,100);
  const failedWrites=serverRequests;await context.setOffline(true);
  await localPage(oldTab,'index.html',hashes.v94[0],true);assert.equal(await saveView(oldTab),oldSave);assert.equal(serverRequests,failedWrites);
  records.oldOfflineAfterFailure=true;await context.setOffline(false);
  setStage('takeover');phase='v95';const t=await updateWorker(oldTab);
  assert(t.requestedWorkerControls&&t.predecessorReplaced&&t.state==='activated');
  await ownedCache(oldTab,'v95',hashes.v95[0]);records.sameTabTakeover=true;
  // Controller replacement does not mean the live old in-memory JS changed.
  // Shut the actual listener before requesting any assets or navigating either tab.
  setStage('offline');await context.setOffline(true);await stop(server);assert(!server.listening);const count=serverRequests;
  const moduleURL=origin+'/farm3d/corner-menu.js?v=1';
  const late=oldTab.waitForResponse(r=>r.url()===moduleURL,{timeout:25000});
  const [moduleHash,moduleResponse]=await Promise.all([oldTab.evaluate(async()=>{
   const res=await fetch('./corner-menu.js?v=1');if(!res.ok||!res.headers.get('Content-Type')?.includes('javascript'))throw Error();
   return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await res.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
  }),late]);
  assert(moduleResponse.fromServiceWorker()&&moduleResponse.status()===200);assert.equal(serverRequests,count);
  assert.equal(moduleHash,sha(p.next.get('farm3d/corner-menu.js')));records.lateModuleExact=true;
  await localPage(oldTab,'',hashes.v95[0],true);await ownedCache(oldTab,'v95',hashes.v95[0]);assert.equal(await saveView(oldTab),oldSave);
  const newTab=await context.newPage();await localPage(newTab,'index.html',hashes.v95[0],true);
  await ownedCache(newTab,'v95',hashes.v95[0]);assert.equal(await saveView(newTab),oldSave);
  const r=await newTab.reload({waitUntil:'domcontentloaded',timeout:70000});assert(r&&r.status()===200&&r.fromServiceWorker());assert.equal(sha(await r.body()),hashes.v95[0]);
  await ready(newTab);assert.equal(await saveView(newTab),oldSave);assert.equal(serverRequests,count);
  records.offlineOldTab=true;records.offlineNewTab=true;records.offlineReload=true;records.savePreserved=true;records.finalServerRequests=0;
  records.status='PASS';setStage('complete');
 }catch{process.exitCode=1;}
 finally{
  const bounded=()=>{if(!path.isAbsolute(receipts||''))throw Error('receipt root');fs.writeFileSync(path.join(receipts,'result.json'),JSON.stringify(records)+'\n',{flag:'wx',mode:0o600});};
  try{await context?.close();await browser?.close();}catch{records.status='FAIL';records.stage='cleanup';process.exitCode=1;}
  await Promise.all([server?stop(server):null,proxy?stop(proxy):null]);bounded();
 }
})().catch(()=>{process.exitCode=1;});
