const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.env.PREVIEW_DIRECTORY||path.join(__dirname,'../../safe-test-preview'));
const artifacts=path.resolve(process.env.TEST_ARTIFACTS||path.join(__dirname,'artifacts/mobile-menu'));
fs.mkdirSync(artifacts,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:.5,hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],foreign=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(base))foreign.push(r.url());});
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.fulfill({status:200,contentType:'text/css',body:''}));
  await page.goto(base+'index.html?debug',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__ready===true,{timeout:30000});
  await page.locator('#editBtn').click();
  await page.locator('#animalPensBtn').click();
  const host=page.locator('[data-pen-editor-host]');
  await host.locator('[data-field="kind"]').selectOption('horse');
  const target=host.locator('[data-field="target"]');
  const choice=await target.locator('option').evaluateAll(nodes=>nodes.find(n=>n.value.startsWith('structure|'))?.value);
  if(!choice)throw Error('No movable horse structure in preview');
  await target.selectOption(choice);
  await page.waitForTimeout(300);
  const state=await page.evaluate(()=>{
   const host=document.querySelector('[data-pen-editor-host]');
   const nodes=['Animal pen editor','Ground placement guide'].map(name=>host.querySelector(`[aria-label="${name}"]`));
   const metrics=nodes.map(n=>({visible:!!n&&getComputedStyle(n).display!=='none'&&!!n.getClientRects().length,rect:n?.getBoundingClientRect().toJSON()}));
   return {metrics,selected:host.querySelector('[data-field="target"]')?.value,dock:!!host.querySelector('[data-compact-dock]:not([hidden])')};
  });
  await page.screenshot({path:path.join(artifacts,'selected-horse-844x390.png')});
  fs.writeFileSync(path.join(artifacts,'selected-horse-844x390.json'),JSON.stringify({state,foreign,errors},null,2));
  console.log(JSON.stringify({state,foreign,errors}));
  if(state.metrics.some(m=>m.visible)||!state.dock||errors.length)process.exitCode=1;
  if(state.dock){
   const revision=await page.evaluate(()=>JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision??0);
   await host.locator('[data-compact-dock] [data-action="options"]').click();
   const reopened=await page.evaluate(()=>{
    const h=document.querySelector('[data-pen-editor-host]');
    return {panel:!!h.querySelector('[aria-label="Animal pen editor"]:not([hidden])'),guide:!!h.querySelector('[aria-label="Ground placement guide"]:not([hidden])'),selected:h.querySelector('[data-field="target"]').value};
   });
   if(!reopened.panel||!reopened.guide||reopened.selected!==choice)throw Error('Options did not preserve the selected draft');
   await host.locator('[data-controls] [data-action="right"]').click();
   await page.waitForFunction(()=>window.__dbg.penEditor.snapshot().dirty,{timeout:30000});
   const moved=await page.evaluate(()=>({compact:!document.querySelector('[data-compact-dock]').hidden,dirty:window.__dbg.penEditor.snapshot().dirty}));
   if(!moved.compact||!moved.dirty)throw Error('Nudge did not preserve a compact dirty draft');
   await host.locator('[data-compact-dock] [data-action="cancel"]').click();
   const cancelled=await page.evaluate(()=>({closed:!document.querySelector('[data-pen-editor-host]'),revision:JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision??0}));
   if(!cancelled.closed||cancelled.revision!==revision)throw Error('Cancel changed the saved layout');
   fs.writeFileSync(path.join(artifacts,'reopen-cancel.json'),JSON.stringify({reopened,moved,cancelled},null,2));
   console.log(JSON.stringify({reopened,moved,cancelled}));
   async function selectCat(){
    if(!await page.locator('#animalPensBtn').isVisible())await page.locator('#editBtn').click();
    await page.locator('#animalPensBtn').click();
    const h=page.locator('[data-pen-editor-host]');
    await h.locator('[data-field="kind"]').selectOption('cat');
    const item=await h.locator('[data-field="target"] option').evaluateAll(nodes=>nodes.find(n=>n.value.startsWith('structure|'))?.value);
    if(!item)throw Error('No cat structure to move');
    await h.locator('[data-field="target"]').selectOption(item);
    return h;
   }
   async function nudge(h,direction){
    await h.locator('[data-compact-dock] [data-action="options"]').click();
    await h.locator(`[data-controls] [data-action="${direction}"]`).click();
    await page.waitForFunction(()=>{const s=window.__dbg.penEditor.snapshot();return s.dirty&&s.validation&&(s.canApply||s.validation.ok===false);},{timeout:30000});
    return page.evaluate(()=>{const s=window.__dbg.penEditor.snapshot();return {canApply:s.canApply,valid:s.validation?.ok,reason:s.reason,draftRevision:s.draftRevision};});
   }
   let valid=null,validDirection=null;
   for(const direction of ['right','left','up','down']){
    const h=await selectCat(),outcome=await nudge(h,direction);
    if(outcome.canApply){valid=outcome;validDirection=direction;break;}
    await h.locator('[data-compact-dock] [data-action="cancel"]').click();
   }
   if(!valid)throw Error('No valid one-metre cat move found through native controls');
   await page.locator('[data-pen-editor-host] [data-compact-dock] [data-action="apply"]').click();
   await page.locator('[data-pen-editor-host]').waitFor({state:'detached',timeout:30000});
   const applied=await page.evaluate(()=>JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision??0);
   if(applied!==revision+1)throw Error(`Valid Apply revision ${applied} instead of ${revision+1}`);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.__ready===true,{timeout:30000});
   const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision??0);
   if(reloaded!==applied)throw Error('Valid Apply did not survive reload');
   const h=await selectCat();
   let invalid=null;
   for(let i=0;i<8;i++){
    const result=await nudge(h,'left');
    if(!result.canApply){invalid=result;break;}
   }
   if(!invalid||!invalid.reason)throw Error('No invalid draft/reason found before eight left nudges');
   const disabled=await h.locator('[data-compact-dock] [data-action="apply"]').isDisabled();
   if(!disabled)throw Error('Invalid Apply is enabled');
   await h.locator('[data-compact-dock] [data-action="cancel"]').click();
   const afterInvalid=await page.evaluate(()=>JSON.parse(localStorage.getItem('sunny-acres-3d-v1')).layout?.animalPens?.revision??0);
   if(afterInvalid!==applied)throw Error('Invalid draft changed saved revision');
   fs.writeFileSync(path.join(artifacts,'apply-validation-reload.json'),JSON.stringify({valid,validDirection,applied,reloaded,invalid,disabled,afterInvalid},null,2));
   console.log(JSON.stringify({valid,validDirection,applied,reloaded,invalid,disabled,afterInvalid}));
   const touchHost=await selectCat();
   const handle=touchHost.locator('[aria-label="Drag selected pen item"]');
   const box=await handle.boundingBox();if(!box)throw Error('Drag handle is not visible for touch interruption');
   await page.evaluate(()=>{
    const h=document.querySelector('[aria-label="Drag selected pen item"]');
    window.__touchProbe={down:0,cancel:0};
    h.addEventListener('pointerdown',()=>window.__touchProbe.down++);
    window.addEventListener('pointercancel',()=>window.__touchProbe.cancel++);
   });
   const cdp=await context.newCDPSession(page),x=box.x+box.width/2,y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1,radiusX:4,radiusY:4,force:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y,id:1,radiusX:4,radiusY:4,force:1}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
   await page.waitForTimeout(200);
   const interrupted=await page.evaluate(()=>({probe:window.__touchProbe,open:window.__dbg.penEditor.snapshot().open,dirty:window.__dbg.penEditor.snapshot().dirty,compact:!document.querySelector('[data-compact-dock]').hidden}));
   if(interrupted.probe.down<1||interrupted.probe.cancel<1||!interrupted.open||interrupted.dirty||!interrupted.compact)throw Error('Touch cancel lost the draft or left input captured');
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
   const portrait=await page.evaluate(()=>{
    const h=document.querySelector('[data-pen-editor-host]'),dock=h.querySelector('[data-compact-dock]'),r=dock.getBoundingClientRect();
    return {rect:r.toJSON(),panelHidden:h.querySelector('[aria-label="Animal pen editor"]').hidden,guideHidden:h.querySelector('[aria-label="Ground placement guide"]').hidden,buttons:[...dock.querySelectorAll('button')].map(b=>({name:b.textContent,visible:!!b.getClientRects().length})),width:innerWidth,height:innerHeight};
   });
   await page.screenshot({path:path.join(artifacts,'selected-cat-390x844.png')});
   if(portrait.rect.left<0||portrait.rect.right>portrait.width||portrait.rect.top<0||portrait.rect.bottom>portrait.height||!portrait.panelHidden||!portrait.guideHidden||portrait.buttons.some(b=>!b.visible))throw Error('Portrait compact controls are offscreen');
   await touchHost.locator('[data-compact-dock] [data-action="options"]').click();
   if(!await touchHost.locator('[aria-label="Animal pen editor"]').isVisible())throw Error('Portrait Options cannot reopen');
   await page.setViewportSize({width:844,height:390});
   await touchHost.locator('[data-controls] [data-action="right"]').click();
   await page.waitForFunction(()=>window.__dbg.penEditor.snapshot().dirty,{timeout:30000});
   const nudgeFocus=await page.evaluate(()=>document.activeElement?.dataset.action);
   if(nudgeFocus!=='options')throw Error('Nudge left focus on a hidden menu button');
   await page.keyboard.press('Escape');
   const exitShown=await touchHost.locator('[data-exit]').isVisible();
   if(!exitShown)throw Error('Dirty Escape did not expose the exit choices');
   await touchHost.locator('[data-action="exit-keep"]').click();
   const kept=await page.evaluate(()=>({dirty:window.__dbg.penEditor.snapshot().dirty,focus:document.activeElement?.dataset.field,visible:!!document.activeElement?.getClientRects().length}));
   if(!kept.dirty||kept.focus!=='target'||!kept.visible)throw Error('Keep editing lost the draft or visible focus');
   await touchHost.locator('[aria-label="Animal pen editor"] [data-action="cancel"]').click();
   fs.writeFileSync(path.join(artifacts,'touch-portrait.json'),JSON.stringify({interrupted,portrait,nudgeFocus,exitShown,kept},null,2));
   console.log(JSON.stringify({interrupted,portrait,nudgeFocus,exitShown,kept}));
  }
  await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
