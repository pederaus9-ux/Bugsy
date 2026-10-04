// Opt-in local benchmark. Instrument a served copy; production game code stays unchanged.
// Desktop GPU measurements do not establish phone thermals or physical acceptance.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.env.PERF_ARTIFACTS||path.join(__dirname,'artifacts/performance7k'));
fs.mkdirSync(out,{recursive:true});
const sampleMs=Number(process.env.PERF_SAMPLE_MS||5000),sustainMs=Number(process.env.PERF_SUSTAIN_MS||180000);
const source=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8');
let instrumented=source;
function inject(anchor,replacement){assert.equal(instrumented.split(anchor).length,2,'unique profiling anchor: '+anchor);instrumented=instrumented.replace(anchor,replacement);}
inject('clock.update(); const t =','window.__bench.begin(); clock.update(); const t =');
inject('for (const a of animals) a.update(dt, t);','window.__bench.mark("camera"); for (const a of animals) a.update(dt, t); window.__bench.mark("animals");');
inject('updateGame(t, dt); updateAim(t); updateFarmerIdle(t, dt);','updateGame(t, dt); updateAim(t); updateFarmerIdle(t, dt); window.__bench.mark("gameAimFarmer");');
inject('if (perf) perf.render(); else composer.render();','window.__bench.mark("world"); window.__bench.gpuBegin(renderer); if (perf) perf.render(); else composer.render(); window.__bench.gpuEnd(); window.__bench.mark("renderSubmit");');
inject('if (photoWant) takePhoto();','if (photoWant) takePhoto(); window.__bench.end(renderer);');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');
 res.end(file===path.join(root,'farm3d/index.html')?instrumented:fs.readFileSync(file));
});
function installProbe(){
 const stages=['camera','animals','gameAimFarmer','world','renderSubmit','total','interval','gpu'];
 const lists=Object.fromEntries(stages.map(x=>[x,[]]));let enabled=false,last=null,began=0,mark=0,gl,ext,pending=null,active=false,rejected=0;
 const keep=(key,value)=>{if(enabled&&lists[key].length<100000)lists[key].push(value);};
 window.__bench={
  begin(){began=mark=performance.now();},
  mark(key){const now=performance.now();keep(key,now-mark);mark=now;},
  end(renderer){const now=performance.now();keep('total',now-began);if(last!==null)keep('interval',now-last);last=now;},
  gpuBegin(renderer){
   if(!gl){gl=renderer.getContext();ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');}if(!ext)return;
   if(pending&&gl.getQueryParameter(pending,gl.QUERY_RESULT_AVAILABLE)){
    if(!gl.getParameter(ext.GPU_DISJOINT_EXT))keep('gpu',gl.getQueryParameter(pending,gl.QUERY_RESULT)/1e6);else rejected++;
    gl.deleteQuery(pending);pending=null;
   }
   if(enabled&&!pending){pending=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,pending);active=true;}
  },
  gpuEnd(){if(active){gl.endQuery(ext.TIME_ELAPSED_EXT);active=false;}},
  reset(){if(pending){gl.deleteQuery(pending);pending=null;}enabled=true;last=null;rejected=0;for(const a of Object.values(lists))a.length=0;},
  read(){enabled=false;return {raw:structuredClone(lists),gpuTimerAvailable:!!ext,gpuDisjointRejected:rejected};}
 };
}
function stats(a){const sorted=[...a].sort((x,y)=>x-y);return {n:a.length,median:sorted[Math.floor(sorted.length/2)]??null,p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??null,worst:sorted.at(-1)??null,over33ms:a.filter(x=>x>33.3).length,over50ms:a.filter(x=>x>50).length};}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const results={method:'local injected CPU stage timers + complete composer counters + disjoint-checked asynchronous GPU queries; headless dispatch is uncapped and is not display FPS or physical mobile acceptance',base:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sampleMs,sustainMs,scenarios:[]};
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:process.env.PERF_SOFTWARE?['--use-angle=swiftshader','--enable-unsafe-swiftshader']:process.platform==='win32'?['--use-angle=d3d11']:[]});
  const base=`http://127.0.0.1:${server.address().port}/`;
  for(const profile of [{width:844,height:390,dpr:2},{width:1280,height:720,dpr:1}]){
   const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr,hasTouch:profile.width<1000,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('firebasejs')?'text/javascript':'application/json',body:r.request().url().includes('firebasejs')?'export {};':'{}'}));
   await page.addInitScript(installProbe);const boot=Date.now();
   await page.goto(base+'farm3d/?testfarm&debug&portrait&perf&preset=noon');
   await page.waitForFunction(()=>window.__ready&&!document.getElementById('loading'),null,{timeout:90000});
   const bootToReadyMs=Date.now()-boot;
   const setup=await page.evaluate(()=>{
    const d=__dbg,G=d.G,S=G.S;G.opts.quiet=true;G.close();S.nextEventAt=S.nextVisitorAt=S.nextRushAt=9e15;
    for(const [kind,a]of Object.entries(G.ANIMALS))S.pens[kind]={owned:true,list:Array(a.max).fill(0)};
    for(const p of S.plots){Object.assign(p,{crop:'wheat',end:Date.now()-1,dur:60000});}
    S.decor.placed=Array.from({length:16},(_,i)=>({id:['lantern','pine','tulips','bench'][i%4],x:-25+i%8*6,z:26+Math.floor(i/8)*5}));G.view.refresh('all');
    const gl=d.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    return {renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION),animals:d.animals.length,plots:S.plots.length,decor:S.decor.placed.length,save:localStorage.getItem('sunny-acres-3d-v1')};
   });
   console.log('PROFILE',profile,setup.renderer);
   async function measure(label,ms=sampleMs){
    await page.waitForTimeout(2500);const resourcesBefore=await page.evaluate(()=>{__bench.reset();return {...__dbg.renderer.info.memory};});await page.waitForTimeout(ms);
    const report=await page.evaluate(()=>{const d=__dbg,info=d.renderer.info;return {...__bench.read(),quality:window.__quality(),resources:{...info.memory},calls:info.render.calls,triangles:info.render.triangles,jsHeap:performance.memory?.usedJSHeapSize??null,save:localStorage.getItem('sunny-acres-3d-v1')};});
    assert.ok(report.raw.interval.length>0,'rendered samples');assert.ok(report.raw.total.length<100000,'full measurement fits the bounded probe');assert.deepEqual(errors,[]);assert.equal(report.save,setup.save,'sandbox does not write player save');
    const summary={profile,label,durationMs:ms,bootToReadyMs,setup,resourcesBefore,...report,stats:Object.fromEntries(Object.entries(report.raw).map(([key,a])=>[key,stats(a)]))};delete summary.raw;delete summary.save;
    results.scenarios.push(summary);console.log('MEASURE',label,JSON.stringify(summary.stats));fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
   }
   for(const mode of ['classic','walk']){
    if(mode==='walk'){await page.locator('#walkBtn').click();await page.waitForFunction(()=>!!__dbg.walk);}
    for(const preset of ['noon','golden','rain','snow','night']){await page.evaluate(p=>__dbg.setPreset(p),preset);await measure(mode+'-'+preset);}
   }
   await page.evaluate(()=>{__dbg.setPreset('noon');__dbg.walk.pos.set(-1.4,22);__dbg.walk.vel.set(0,0);__dbg.walk.yaw=0;});
   await page.keyboard.down('KeyW');await page.keyboard.down('KeyQ');
   try{await measure('walk-moving-noon');}finally{await page.keyboard.up('KeyW');await page.keyboard.up('KeyQ');}
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!__dbg.walk);await page.evaluate(()=>__dbg.G.openPanel('barn'));await measure('classic-barn-panel');await page.evaluate(()=>__dbg.G.close());
   if(profile.width===844){await page.evaluate(()=>__dbg.setPreset('rain'));await measure('classic-rain-sustained',sustainMs);}
   await page.screenshot({path:path.join(out,'heavy-farm-'+profile.width+'.png')});await context.close();
  }
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
