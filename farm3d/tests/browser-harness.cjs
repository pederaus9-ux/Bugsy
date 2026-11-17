const fs = require('fs');
const http = require('http');
const path = require('path');
const {execFileSync}=require('node:child_process');
// Verbose Playwright logging can serialize protocol arguments before this boundary.
if(process.env.DEBUG||process.env.PWDEBUG)throw new Error('Verbose browser diagnostics are disabled for qualification');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {createBoundary,diagnosticText,localRequestLabel,failure}=require('./helpers/playwright-diagnostics.cjs');
const {createOfflineObservation}=require('./helpers/a52-offline-observation.cjs');
const root = path.resolve(__dirname, '../..');
const artifacts = path.resolve(process.env.TEST_ARTIFACTS || path.join(__dirname, 'artifacts'));
fs.mkdirSync(artifacts, {recursive:true});

// Served to disposable local test browsers only. The checked-in game keeps
// rng(4242); this replaces exactly that one ordinary-animal RNG declaration.
function applyTestGameplaySeed(source,seed){
  if(!Number.isInteger(seed)||![1,4242].includes(seed))throw Error('Unsupported gameplay test seed');
  const declaration='const rnd = rng(4242);',count=source.split(declaration).length-1;
  if(count!==1)throw Error('Expected exactly one ordinary gameplay RNG declaration; found '+count);
  const replacement=`const __testRnd = rng(${seed}); const rnd = () => { const value = __testRnd(); if(window.__testGameplaySeed.firstCall === null) window.__testGameplaySeed.firstCall = value; window.__testGameplaySeed.calls++; return value; }; window.__testGameplaySeed = {value:${seed},firstCall:null,calls:0};`;
  return source.replace(declaration,replacement);
}

async function start(options = {}) {
  let servedRef=options.ref||null;
  let keepCurrentWorker=false;
  const sourceCache=new Map();
  const fileBytes=file=>{const relative=path.relative(root,file).split(path.sep).join('/');let bytes;if(!servedRef||(keepCurrentWorker&&relative==='farm3d/sw.js'))bytes=fs.readFileSync(file);else{const key=servedRef+':'+relative;if(!sourceCache.has(key))sourceCache.set(key,execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never','show',key],{cwd:root,maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe'],env:{...process.env,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1'}}));bytes=sourceCache.get(key);}return options.gameplaySeed!==undefined&&relative==='farm3d/index.html'?Buffer.from(applyTestGameplaySeed(bytes.toString('utf8'),options.gameplaySeed)):bytes;};
  const offlineObservation=createOfflineObservation();
  const server = http.createServer((req, res) => {
    offlineObservation.localRequest(req,res);
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      if(options.missingFiles?.has(path.relative(root,file).split(path.sep).join('/'))){res.writeHead(404);res.end();return;}
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', ({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(file)] || 'application/octet-stream');
      res.end(fileBytes(file));
    } catch { res.writeHead(400); res.end(); }
  });
  let servedResponses=0;
  server.on('request',(_req,res)=>res.once('finish',()=>{servedResponses++;}));
  const sockets=new WeakMap();
  const track=s=>{const active=new Set();sockets.set(s,active);s.on('connection',socket=>{active.add(socket);socket.once('close',()=>active.delete(socket));});};
  track(server);
  const listen=s=>new Promise((resolve,reject)=>{s.once('error',()=>reject(failure()));s.listen(0,'127.0.0.1',resolve);}).catch(()=>{throw failure();});
  const stop=s=>new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(failure()),5000);
    try{s.close(()=>{clearTimeout(timer);resolve();});for(const socket of sockets.get(s)||[])socket.destroy();s.closeAllConnections?.();}
    catch{clearTimeout(timer);reject(failure());}
  });
  try{await listen(server);}catch{await stop(server);throw failure();}
  const base = `http://127.0.0.1:${server.address().port}/`;
  // Browser-wide rejecting HTTP(S) proxy also covers service-worker-owned traffic
  // that page.route cannot intercept. It never forwards or records a target.
  // Real-browser SW/IP egress checks remain a qualification gate.
  const denyProxy=http.createServer((_req,res)=>{res.writeHead(403);res.end();});
  track(denyProxy);
  denyProxy.on('connect',(_req,socket)=>socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
  denyProxy.on('upgrade',(_req,socket)=>socket.destroy());
  try{await listen(denyProxy);}catch{await stop(server);throw failure();}
  const boundary=createBoundary();
  let browser;
  try {
    browser = boundary.wrap(await chromium.launch({executablePath:process.env.CHROME_PATH,channel:process.env.CHROME_PATH?undefined:'chromium',headless:true,proxy:{server:`http://127.0.0.1:${denyProxy.address().port}`,bypass:`<-loopback>,127.0.0.1:${server.address().port}`},args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}));
  } catch { await Promise.all([stop(server),stop(denyProxy)]);throw failure(); }
  const sessions = [];
  return {
    base,
    serverResponseCount(){return servedResponses;},
    beginOfflineObservation(){offlineObservation.begin();},
    offlineResponseObservation(){return offlineObservation.snapshot();},
    serveRef(ref,settings={}){servedRef=ref||null;keepCurrentWorker=!!settings.keepCurrentWorker;},
    async setup(viewport, touch, name, mobile = touch) {
      // CSS viewports stay exact; smaller drawing buffers keep software GPU CI responsive.
      const context = await browser.newContext({viewport,deviceScaleFactor:options.deviceScaleFactor??.5,hasTouch:touch,isMobile:mobile,serviceWorkers:options.serviceWorkers??'block',...(options.recordVideo?{recordVideo:{dir:options.videoDir??path.join(artifacts,'chicken-pen','video'),size:viewport}}:{})});
      // No Playwright trace: even sources:false retains network response bodies.
      let page;try{page=await context.newPage();}catch{await context.close();throw failure();}
      const errors = [];
      try{
      page.on('pageerror', error => errors.push('pageerror: ' + diagnosticText(error.message)));
      page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + diagnosticText(message.text())); });
      page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push('HTTP ' + response.status() + ': ' + localRequestLabel(response.url(),base)); });
      page.on('requestfailed', request => { if (request.url().startsWith(base)) errors.push('request: ' + localRequestLabel(request.url(),base) + ': ' + diagnosticText(request.failure()?.errorText)); });
      // Deliberately exercise offline guest fallback; never contact accounts, weather,
      // analytics or feedback endpoints from CI. This is not a cloud integration test.
      await page.route('**/*', route => {
        const url = route.request().url();
        if (url.startsWith(base)) return route.continue();
        const sdk = url.includes('gstatic.com/firebasejs/');
        offlineObservation.externalFulfill(sdk);
        return route.fulfill({contentType:sdk?'text/javascript':'application/json',body:sdk?'export {};':'{}'});
      });
      }catch{await context.close();throw failure();}
      let closed = false;
      const session = {context,page,errors,async finish(failed = false) {
        if (closed) return;
        closed = true;
        try {
          await page.screenshot({path:path.join(artifacts, name + (failed ? '-failure' : '') + '.png'),timeout:15000});
        } catch (error) { console.error('Screenshot unavailable: details withheld'); }
        await context.close();
      }};
      sessions.push(session);
      return session;
    },
    async close(failed = false) {
      let failedCleanup=false;
      for(const session of sessions)try{await session.finish(failed);}catch{failedCleanup=true;}
      try{await browser.close();}catch{failedCleanup=true;}
      finally{await Promise.all([stop(server),stop(denyProxy)]);}
      if(failedCleanup)throw failure();
    }
  };
}
module.exports = {start, artifacts, root, applyTestGameplaySeed};
