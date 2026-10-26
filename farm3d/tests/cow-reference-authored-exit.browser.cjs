const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../..');
const dir=path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-recovery-range-20261025'),file=path.join(dir,'authored-exit-measurement.json');
if(fs.existsSync(file))throw Error('Preserve existing result; no blind rerun');
let source=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8');
function inject(a,b){assert.equal(source.split(a).length,2,a);source=source.replace(a,b);}
inject('clock.update(); const t =','window.__movingProbe?.beginFrame(); clock.update(); const t =');
inject('if(!animalPenEditing)for (const a of animals) a.update(dt, t);','window.__movingProbe?.step(); if(!animalPenEditing)for (const a of animals) a.update(dt, t);');
inject('if (perf) perf.render(); else composer.render();','window.__movingProbe?.gpuBegin(); if (perf) perf.render(); else composer.render(); window.__movingProbe?.gpuEnd();');
inject('if (photoWant) takePhoto();','if (photoWant) takePhoto(); window.__movingProbe?.endFrame();');
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error('Path');if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.end(p===path.join(root,'farm3d/index.html')?source:fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
const stats=a=>{const s=a.filter(Number.isFinite).sort((a,b)=>a-b);return{n:s.length,median:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1),over33:s.filter(x=>x>33.3).length,over50:s.filter(x=>x>50).length};};
const report={source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:'RUNNING',cases:[],limits:'Desktop pinned Chromium/D3D11. Full game and41 normal animals;5 native scripted cows with production scheduler reservations. Reference queries observe but never control movement. Supported slab only. No live controller, successful care, phone or integration claim.'};report.semanticCorrection='Robot now follows authored dock/exit/turn/clear rather than reversed lane.30warm+420measured steps permit complete route at unchanged.8m/s; other4 originalmotions unchanged. Prior reversal remains separate adversarial evidence. This is scripted cost, not live route safety.';report.helperSha256=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'helpers/cow-motion-domains.mjs'))).digest('hex');let browser;
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
(async()=>{try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=d3d11','--js-flags=--expose-gc']});report.browser=browser.version();
 for(const label of ['baseline','reference','reference-allocations']){
  const mode=label==='baseline'?'baseline':'reference',allocation=label.endsWith('allocations');
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().startsWith('MOVING_PROGRESS'))console.log(label+' '+m.text());});
  await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('firebasejs')?'text/javascript':'application/json',body:r.request().url().includes('firebasejs')?'export {};':'{}'}));
  await page.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');Date.now=()=>1792594800000;});
  await page.goto(base+'farm3d/?testfarm&debug&portrait&preset=noon');await page.waitForFunction(()=>window.__ready&&!document.getElementById('loading'),null,{timeout:90000});
  const setup=await page.evaluate(async mode=>{const d=__dbg,G=d.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={owned:true,list:Array(n).fill(0)};G.view.refresh('all');d.cam.target.set(0,1,-35);d.cam.dist=25;d.QUALITY.auto=false;const before=localStorage.getItem('sunny-acres-3d-v1'),m=await import('./tests/helpers/cow-reference-authored-exit-fixture.mjs');return{...m.installAuthoredExitFixture(d,mode),before};},mode);
  let cdp;if(allocation){cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.startSampling',{samplingInterval:131072,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
  console.log('START '+label+' '+JSON.stringify(setup));await page.evaluate(()=>__movingProbe.resume());
  await page.waitForFunction(()=>__movingProbe.done,null,{timeout:45000});
  const result=await page.evaluate(()=>({...__movingProbe.measure,save:localStorage.getItem('sunny-acres-3d-v1'),render:{calls:__dbg.renderer.info.render.calls,triangles:__dbg.renderer.info.render.triangles}}));
  assert.equal(result.save,setup.before);delete setup.before;delete result.save;result.label=label;result.setup=setup;result.errors.push(...errors);
  if(!allocation){result.stats=Object.fromEntries(['cpu','interval','query','gpu'].map(k=>[k,stats(result.frames.map(x=>x[k]))]));result.warmupStats=Object.fromEntries(['cpu','query'].map(k=>[k,stats(result.warmup.map(x=>x[k]))]));result.stageStats=Object.fromEntries(['approach','stop-recovery','departure'].map(s=>[s,Object.fromEntries(['cpu','query'].map(k=>[k,stats(result.frames.filter(x=>x.stage===s).map(x=>x[k]))]))]));}
  else{const{profile}=await cdp.send('HeapProfiler.stopSampling');fs.writeFileSync(path.join(dir,label+'.heapprofile'),JSON.stringify(profile));let total=0;const groups={reference:0,copy:0,other:0};function walk(n,group='other'){if(n.callFrame.functionName==='cowSweptQuery')group='reference';else if(n.callFrame.functionName==='copyCowRig')group='copy';total+=n.selfSize;groups[group]+=n.selfSize;for(const c of n.children)walk(c,group);}walk(profile.head);result.allocation={frames:450,estimatedWholeBrowserBytesPerFrame:total/450,attributionBytesPerFrame:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v/450])),method:'Separate fresh context, identical450-frame sequence including30idlewarmup. CDP128KiBsampling includescollectedobjects. No profiledtimingused. Estimates notexactbytes.'};await cdp.detach();}
  report.cases.push(result);save();await page.screenshot({path:path.join(dir,label+'.png')});
  console.log('DONE '+label+' '+JSON.stringify({stats:result.stats,allocation:result.allocation,rejections:result.rejections.length,first:Object.keys(result.firstRejected),moving:result.movingCowFrames,recovery:result.recoveryCowFrames,releases:result.releaseEvents,errors:result.errors}));
  assert.deepEqual(result.errors,[]);assert.equal(result.frames.length,420);assert.equal(result.reservations.length,5);assert(result.movingCowFrames>0&&result.recoveryCowFrames>0&&result.releaseEvents>0);assert(result.minSeparation>=.85);assert(result.distances.every(c=>c.metres>0));
  assert.deepEqual(result.robotRoute.remaining,[]);assert.deepEqual(result.robotRoute.visited.map(p=>p.name),['dock','exit','turn','clear']);for(const p of result.robotRoute.visited)assert(Math.hypot(...p.point.map((v,i)=>v-p.actual[i]))<=1e-8);
  if(report.cases.length>1){assert.deepEqual(result.distances,report.cases[0].distances);assert.deepEqual(result.robotRoute,report.cases[0].robotRoute);assert.deepEqual(result.reservations,report.cases[0].reservations);}
  await context.close();
 }
 report.status='MEASUREMENT_COMPLETE_NOT_SAFETY_CLEARANCE';
 }catch(e){report.status='RED';report.error=e.stack;console.error(e);}finally{save();await browser?.close();await new Promise(r=>server.close(r));}if(report.status==='RED')process.exitCode=1;
})();
