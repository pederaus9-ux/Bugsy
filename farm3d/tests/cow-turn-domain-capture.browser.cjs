const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'../..'),dir=path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-turn-domain-capture-20261025'),file=path.join(dir,'capture.json');
if(fs.existsSync(file))throw Error('Preserve diagnostic; no automatic retry');
const served=new Map(),edits=[];
function patch(rel,a,b){const p=path.join(root,rel),text=served.get(p)||fs.readFileSync(p,'utf8');assert.equal(text.split(a).length,2,'Unique hook: '+rel+' '+a);served.set(p,text.replace(a,b));edits.push({file:rel,before:a,after:b});}
patch('farm3d/index.html','clock.update(); const t =','window.__movingProbe?.beginFrame(); clock.update(); const t =');
patch('farm3d/index.html','if(!animalPenEditing)for (const a of animals) a.update(dt, t);','window.__movingProbe?.step(); if(!animalPenEditing)for (const a of animals) a.update(dt, t);');
patch('farm3d/index.html','if (photoWant) takePhoto();','if (photoWant) takePhoto(); window.__movingProbe?.endFrame();');
patch('farm3d/tests/helpers/cow-reference-moving-fixture.mjs',"if(mode==='reference'){\n     const result=", "if(mode==='reference'){\n     window.__turnDiag.before(c,q,frame,stage,boxes); const result=");
patch('farm3d/tests/helpers/cow-reference-moving-fixture.mjs','measure.queryCalls++;','measure.queryCalls++;window.__turnDiag.result(result);');
patch('farm3d/tests/helpers/cow-reference-moving-fixture.mjs','updateCow3D(c.r,dx,dz,dt,frame*dt,q.act);','window.__turnDiag.nativeBegin(c,frame);updateCow3D(c.r,dx,dz,dt,frame*dt,q.act);');
patch('farm3d/tests/helpers/cow-reference-moving-fixture.mjs','c.r.g.updateMatrixWorld(true);\n    if(dx||dz)', 'c.r.g.updateMatrixWorld(true);window.__turnDiag.after(c);\n    if(dx||dz)');
patch('farm3d/tests/helpers/cow-reference-moving-fixture.mjs','if(frame>=210){','if(frame>=166){');
patch('farm3d/cow3d.js','export function poseCowLeg(leg,tx,tz,lift,rig){','export function poseCowLeg(leg,tx,tz,lift,rig){globalThis.__turnDiag?.pose(rig,leg,tx,tz,lift);');
patch('farm3d/cow3d.js','l.rt=Math.min(1,l.rt+dt/.25);','globalThis.__turnDiag?.recovery(r,l,l.rt);l.rt=Math.min(1,l.rt+dt/.25);');
patch('farm3d/tests/helpers/cow-motion-domains.mjs','let pose=ordinaryLeg(l,{tx,tz,lift},B,{planted:true,footYaw});','globalThis.__turnDiag?.domain(r,request,lo,hi,i,tx,tz,lift,{reach,oldYaw,yaw,rootPos,amount,lphase,duty,step,nz,leg:Object.fromEntries(Object.entries(l).filter(([k])=>!["hip","knee","foot"].includes(k)))});let pose=ordinaryLeg(l,{tx,tz,lift},B,{planted:true,footYaw});');
patch('farm3d/tests/helpers/cow-leg-enclosure.mjs',"throw Error('Unsupported limb domain');", "{globalThis.__turnDiag?.fail(p);throw Error('Unsupported limb domain');}");
fs.writeFileSync(path.join(dir,'served-instrumentation.json'),JSON.stringify(edits,null,2));
const server=http.createServer((req,res)=>{try{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))throw Error('Path');if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.end(served.get(p)||fs.readFileSync(p));}catch{res.writeHead(404);res.end();}});
const report={source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),status:'RUNNING',limits:'Single instrumented deterministic trace through166; no benchmark timings, no changed arithmetic or assertion. Native-skin samples are finite and do not prove continuous absence.'};let browser;
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
(async()=>{try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=d3d11']});report.browser=browser.version();
 const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));page.on('console',m=>{if(m.text().startsWith('MOVING_PROGRESS'))console.log(m.text());});
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('firebasejs')?'text/javascript':'application/json',body:r.request().url().includes('firebasejs')?'export {};':'{}'}));
 await page.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');Date.now=()=>1792594800000;});
 await page.goto(base+'farm3d/?testfarm&debug&portrait&preset=noon');await page.waitForFunction(()=>window.__ready&&!document.getElementById('loading'),null,{timeout:90000});
 report.setup=await page.evaluate(async()=>{const d=__dbg,G=d.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;for(const[k,n]of[['chicken',30],['cow',5],['horse',4],['sheep',5]])G.S.pens[k]={owned:true,list:Array(n).fill(0)};G.view.refresh('all');d.cam.target.set(0,1,-35);d.cam.dist=25;d.QUALITY.auto=false;const diag=await import('./tests/helpers/cow-turn-domain-diagnostic.mjs');diag.installTurnDiagnostic();window.__turnClassify=diag.classifyRejection;window.__turnFailed=diag.examineFailedNative;const m=await import('./tests/helpers/cow-reference-moving-fixture.mjs');return m.installMovingFixture(d,'reference');});
 console.log('Single trace started');await page.evaluate(()=>__movingProbe.resume());await page.waitForFunction(()=>__movingProbe.done,null,{timeout:45000});
 report.capture=await page.evaluate(()=>__turnDiag.export());report.execution=await page.evaluate(()=>({errors:__movingProbe.measure.errors,queries:__movingProbe.measure.queryCalls,rejections:__movingProbe.measure.rejections,frames:__movingProbe.measure.frames.length,save:localStorage.getItem('sunny-acres-3d-v1')}));report.pageErrors=pageErrors;save();
 const old=JSON.parse(fs.readFileSync(path.join(__dirname,'evidence/pen-editing-implementation/task8-codex-reference-moving-browser-20261025/measurement.json'))).cases[1];
 assert.equal(report.capture.guard?.frame,166);assert.equal(report.execution.queries,827);assert.deepEqual(report.execution.rejections,old.rejections);assert.equal(report.execution.errors.length,1);assert(report.execution.errors[0].includes('Unsupported limb domain'));assert.equal(report.execution.save,null);assert.deepEqual(pageErrors,[]);
 report.exactReproduction=true;console.log('EXACT RED '+JSON.stringify(report.capture.guard));
 report.failedNative=await page.evaluate(()=>__turnFailed());save();console.log('Native failed-frame samples captured; phase mismatches '+report.capture.phaseMismatches.length);
 report.classifications=[];for(let i=0;i<41;i++){const row=await page.evaluate(i=>__turnClassify(i),i);report.classifications.push(row);save();if(i%5===0||i===40)console.log('CLASSIFY '+(i+1)+'/41 '+row.classification);}
 report.status='DIAGNOSTIC_COMPLETE_ORIGINAL_RED_RETAINED';
 }catch(e){report.status='DIAGNOSTIC_BLOCKED';report.error=e.stack;console.error(e);}finally{save();await browser?.close();await new Promise(r=>server.close(r));}if(report.status==='DIAGNOSTIC_BLOCKED')process.exitCode=1;
})();
