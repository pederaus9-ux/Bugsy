// Focused touch regression; Playwright is supplied externally (no game build dependencies).
// ?shot freezes the 3D fixture so software-renderer stalls cannot turn taps into long presses.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'../..'),results=[];
const server=http.createServer((req,res)=>{
 let file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const viewport of [{width:740,height:360},{width:844,height:390},{width:1280,height:720}]){
   const context=await browser.newContext({viewport,hasTouch:true,isMobile:viewport.width<1000}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.fulfill({contentType:r.request().url().includes('gstatic.com/firebasejs/')?'text/javascript':'application/json',body:r.request().url().includes('gstatic.com/firebasejs/')?'export {};':'{}'}));
   await page.goto(base+'farm3d/?testfarm&debug&portrait&shot&sim=0');
   await page.waitForFunction(()=>window.__ready&&window.__dbg&&window.__done&&!document.getElementById('loading'),null,{timeout:90000});
   await page.evaluate(()=>{const d=__dbg;d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;d.G.opts.quiet=true;d.G.close();d.G.view.setQuality('battery');for(const s of Object.values(d.G.S.buildings))s.jobs=[];});
   const pair=await page.evaluate(()=>{
    const d=__dbg,lo=(innerWidth-Math.min(580,innerWidth-28))/2,hi=innerWidth-lo;
    for(const targetX of [5,9,0,14,-5,20])for(const targetZ of [14,18,10,22])for(const yaw of [0,.5,-.5,1,-1])for(const dist of [12,18,24,32]){
     Object.assign(d.cam,{yaw,pitch:.85,dist});d.cam.target.set(targetX,1,targetZ);d.placeCamera(100);d.camera.updateMatrixWorld(true);d.scene.updateMatrixWorld(true);
     const points=Object.entries(d.buildings).map(([bid,b])=>{const p=b.g.position.clone().setY(1.8).project(d.camera);return {bid,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}).filter(p=>p.x>8&&p.x<innerWidth-8&&p.y>65&&p.y<innerHeight-70&&d.hitAt(p.x,p.y)?.bid===p.bid&&document.elementFromPoint(p.x,p.y)===d.renderer.domElement);
     const b=points.find(p=>p.x<lo-12||p.x>hi+12),a=points.find(p=>p!==b);
     if(a&&b)return {a,b,cam:{targetX,targetZ,yaw,dist}};
    }throw Error('No unobscured building pair');
   });
   await page.evaluate(()=>__dbg.renderer.render(__dbg.scene,__dbg.camera));
   await page.waitForTimeout(2500);
   await page.evaluate(()=>{window.shedEvents=[];for(const k of ['pointerdown','pointerup','click'])document.addEventListener(k,e=>shedEvents.push({type:k,target:e.target.className,time:performance.now(),x:e.clientX,y:e.clientY,panel:__dbg.G.panel&&{...__dbg.G.panel}}),true);});
   const cdp=await context.newCDPSession(page);
   const tap=async(p,id=1)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:p.x,y:p.y,id}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
   await tap(pair.a);
   const openedA=await page.evaluate(()=>({panel:__dbg.G.panel,events:shedEvents}));
   if(!openedA.panel)console.log('A DIAGNOSTIC',JSON.stringify({pair,...openedA}));
   assert.deepEqual(openedA.panel,{type:'building',arg:pair.a.bid});
   const target=await page.evaluate(p=>({tag:document.elementFromPoint(p.x,p.y).tagName,cls:document.elementFromPoint(p.x,p.y).className,hit:__dbg.hitAt(p.x,p.y).bid}),pair.b);
   assert.equal(target.cls,'scrim');assert.equal(target.hit,pair.b.bid);
   await tap(pair.b,2);
   const first=await page.evaluate(()=>__dbg.G.panel);
   if(process.argv.includes('--repro')){
    assert.equal(first,null);await tap(pair.b,3);
    const openedB=await page.evaluate(p=>({panel:__dbg.G.panel,events:shedEvents,hit:__dbg.hitAt(p.x,p.y)?.bid,target:document.elementFromPoint(p.x,p.y).className}),pair.b);
    assert.ok(openedB.panel?.arg===pair.b.bid || openedB.events.some(e=>e.type==='click'&&e.panel?.arg===pair.b.bid));
    console.log('REPRODUCED',viewport.width+'x'+viewport.height,JSON.stringify({pair,first,second:openedB.panel,target,events:openedB.events}));
   }else{
    assert.deepEqual(first,{type:'building',arg:pair.b.bid});
    // Repeat rapid A->B switches, including a tap on the already selected B.
    for(let i=0;i<3;i++){
     await page.evaluate(()=>__dbg.G.close());await tap(pair.a);await tap(pair.b,2);
     assert.deepEqual(await page.evaluate(()=>__dbg.G.panel),{type:'building',arg:pair.b.bid});
     await page.evaluate(()=>window.shedPanelNode=document.querySelector('#panelRoot .panel'));
     await tap(pair.b,3);
     assert.equal(await page.evaluate(()=>document.querySelector('#panelRoot .panel')===shedPanelNode),true);
    }
    // Switching opens the menu without collecting finished goods or changing coins.
    const ready=await page.evaluate(bid=>{
     __dbg.G.close();const G=__dbg.G,r=G.BUILDINGS[bid].recipes[0];
     G.S.buildings[bid].jobs=[{r,end:Date.now()-1000,dur:1000}];
     return {barn:JSON.stringify(G.S.barn),coins:G.S.coins};
    },pair.b.bid);
    await tap(pair.a);await tap(pair.b,2);
    assert.deepEqual(await page.evaluate(bid=>({jobs:__dbg.G.S.buildings[bid].jobs.length,barn:JSON.stringify(__dbg.G.S.barn),coins:__dbg.G.S.coins}),pair.b.bid),{jobs:1,...ready});
    assert.equal(await page.locator('[data-act="collectJobs"]').count(),1);
    // An ordinary direct tap still collects; the next tap opens the shed and stays open.
    await page.evaluate(()=>__dbg.G.close());await tap(pair.b);
    assert.equal(await page.evaluate(bid=>__dbg.G.S.buildings[bid].jobs.length,pair.b.bid),0);
    assert.equal(await page.evaluate(()=>__dbg.G.panel),null);
    await tap(pair.b);assert.deepEqual(await page.evaluate(()=>__dbg.G.panel),{type:'building',arg:pair.b.bid});
    await page.waitForTimeout(250);await page.locator('#panelRoot .ribbon').tap();
    assert.equal(await page.evaluate(()=>__dbg.G.panel.arg),pair.b.bid);
    await page.locator('#panelRoot .xbtn').tap();assert.equal(await page.evaluate(()=>__dbg.G.panel),null);
    // Other menus keep their usual dismiss-only backdrop behavior.
    await page.evaluate(()=>__dbg.G.openPanel('settings'));await tap(pair.b);
    assert.equal(await page.evaluate(()=>__dbg.G.panel),null);
    // A non-building backdrop target dismisses without a farm action.
    await page.evaluate(bid=>__dbg.G.openPanel('building',bid),pair.a.bid);
    const outside=await page.evaluate(()=>{
     for(const x of [10,innerWidth-10])for(let y=75;y<innerHeight-55;y+=25){
      if(document.elementFromPoint(x,y)?.className==='scrim'&&__dbg.hitAt(x,y)?.type!=='building')return {x,y};
     }throw Error('No non-building backdrop point');
    });
    const crops=await page.evaluate(()=>JSON.stringify(__dbg.G.S.plots));await tap(outside);
    assert.equal(await page.evaluate(()=>__dbg.G.panel),null);
    assert.equal(await page.evaluate(()=>JSON.stringify(__dbg.G.S.plots)),crops);
    console.log('PASS one-tap shed switch',viewport.width+'x'+viewport.height,JSON.stringify(pair));
   }
   results.push({viewport,pair,first,errors});assert.deepEqual(errors,[]);await cdp.detach();await context.close();
  }
 }finally{if(browser)await browser.close();server.close();if(process.env.SHED_RESULTS)fs.writeFileSync(process.env.SHED_RESULTS,JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
