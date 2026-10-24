const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.PREVIEW_DIRECTORY||path.join(__dirname,'../../safe-test-preview'));
const artifacts=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts/full-ground-grid'));
fs.mkdirSync(artifacts,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const viewport of [{width:844,height:390},{width:1280,height:720}]){
   const context=await browser.newContext({viewport,deviceScaleFactor:.5,hasTouch:true,isMobile:viewport.width<1000,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({status:200,contentType:'text/css',body:''}));
   await page.goto(base+'index.html?debug',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__ready===true,{timeout:30000});
   await page.locator('#editBtn').click();await page.locator('#animalPensBtn').click();const host=page.locator('[data-pen-editor-host]');
   await host.locator('[data-field="kind"]').selectOption('horse');const target=host.locator('[data-field="target"]');
   const choice=await target.locator('option').evaluateAll(nodes=>nodes.find(n=>n.value.startsWith('structure|'))?.value);if(!choice)throw Error('No horse building in preview');
   await target.selectOption(choice);await page.waitForTimeout(350);
   const state=await page.evaluate(()=>{const scene=window.__dbg.scene,guide=scene.getObjectByName('Ground placement guide'),base=scene.getObjectByName('Editable ground grid');return{candidateCount:guide?.userData.cells?.length??0,baseCount:base?.userData.tileCount??0,maskedCount:base?.userData.maskedCount??0,baseBounds:base?.userData.bounds??null,baseStates:base?.userData.states??null,buildMs:base?.userData.buildMs??null,compact:!document.querySelector('[data-compact-dock]')?.hidden};});
   const name=`grid-${viewport.width}x${viewport.height}`;await page.screenshot({path:path.join(artifacts,name+'.png')});fs.writeFileSync(path.join(artifacts,name+'.json'),JSON.stringify({state,errors},null,2));console.log(name,JSON.stringify({state,errors}));
   if(state.candidateCount>25||state.baseCount<=500||!state.maskedCount||state.baseStates!=='unchecked'||errors.length)process.exitCode=1;
   if(viewport.width===844&&state.baseCount){
    await page.waitForFunction(()=>{const c=window.__dbg.scene.getObjectByName('Ground placement guide')?.userData.cells??[];return c.some(x=>x.status==='valid')&&c.some(x=>x.status==='blocked');},null,{timeout:45000});
    const checks=await page.evaluate(async()=>{const cells=__dbg.scene.getObjectByName('Ground placement guide').userData.cells,{evaluatePenPlacement}=await import('./animal-pen-placement.js?v=2'),state=__dbg.penEditor.snapshot(),world=__dbg.penRuntime.world;return['valid','blocked'].map(status=>{const cell=cells.find(c=>c.status===status);return{cell,actual:evaluatePenPlacement(state,cell.at,world)};});});
    fs.writeFileSync(path.join(artifacts,'authoritative-cells.json'),JSON.stringify(checks,null,2));for(const check of checks)if(check.cell.status!==check.actual.status||check.cell.reason!==check.actual.reason)throw Error('Rendered candidate differs from Apply constraints');
   }
   await host.locator(state.compact?'[data-compact-dock] [data-action="cancel"]':'[aria-label="Animal pen editor"] [data-action="cancel"]').click();
   const ordinary=await page.evaluate(()=>{const g=__dbg.scene.getObjectByName('Editable ground grid');return{visible:g.visible,count:g.userData.tileCount,bounds:g.userData.bounds,states:g.userData.states};});
   await page.screenshot({path:path.join(artifacts,name+'-ordinary.png')});
   fs.writeFileSync(path.join(artifacts,name+'-ordinary.json'),JSON.stringify(ordinary,null,2));if(!ordinary.visible||ordinary.count<=500||ordinary.states!=='unchecked')throw Error('Ordinary Edit lost its ground grid');
   await context.close();
  }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
