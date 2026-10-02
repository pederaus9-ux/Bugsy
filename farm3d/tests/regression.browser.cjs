const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const {start, artifacts, root} = require('./browser-harness.cjs');
const html = fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8');
const results=[];
function pass(name,detail=''){results.push({name,status:'PASS',detail});console.log('PASS',name,detail);}
for (const f of ['game.js','auth.js','friends.js','perf.js','sw.js']) new vm.SourceTextModule(fs.readFileSync(path.join(root,'farm3d',f),'utf8'));
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if(match[1].includes('type="module"'))new vm.SourceTextModule(match[2]);
  else if(!match[1].includes('type="importmap"'))new vm.Script(match[2]);
}
pass('All game modules and inline scripts parse');
const paintSource=html.slice(html.indexOf('function paintAlong('),html.indexOf('\nfunction farmMove('));
for (const mode of ['plant','harvest']) {
  const c={farmDrag:null,renderer:{domElement:{}},GS:()=>({plots:[{crop:null}]}),ready:()=>true,plotAt:()=>0,calls:0};
  c.document={elementFromPoint:()=>c.renderer.domElement};
  c.plantAt=c.harvestAt=()=>{c.calls++;c.farmDrag=null;};
  vm.createContext(c);vm.runInContext(paintSource,c);c.paintAlong(20,20);assert.equal(c.calls,0);
  c.farmDrag={mode,last:[0,0]};c.paintAlong(20,20);assert.equal(c.calls,1);assert.equal(c.farmDrag,null);
}
pass('PR #24 paintAlong guards', 'Null entry and mid-loop cancellation during planting and harvesting');
let base;
async function boot(page,query){
  await page.goto(base+query,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__dbg&&!document.getElementById('loading'),{},{timeout:90000});
  await page.evaluate(()=>{__dbg.G.S.nextEventAt=9e15;__dbg.G.S.nextVisitorAt=9e15;__dbg.G.S.nextRushAt=9e15;__dbg.G.opts.quiet=true;__dbg.G.close();__dbg.renderer.shadowMap.enabled=false;});
}
async function resetWalker(page){await page.evaluate(()=>{const w=__dbg.walk;w.pos.set(-1.4,22);w.vel.set(0,0);w.yaw=0;w.pitch=-.1;});}
async function hold(page,key,ms=500){
  const frame=await page.evaluate(()=>__dbg.renderer.info.render.frame);
  await page.keyboard.down(key);
  try {await page.waitForFunction(f=>__dbg.renderer.info.render.frame>=f+8,frame,{timeout:60000});await page.waitForTimeout(ms);}
  finally{await page.keyboard.up(key);}
}
async function checkKeys(page){
  await page.locator('#walkBtn').click();
  await page.waitForFunction(()=>__dbg.walk);await page.waitForTimeout(1500);
  for(const [key,axis,sign] of [['KeyW','y',-1],['KeyS','y',1],['KeyA','x',-1],['KeyD','x',1]]){
    await resetWalker(page);const before=await page.evaluate(()=>({x:__dbg.walk.pos.x,y:__dbg.walk.pos.y}));
    await hold(page,key);const after=await page.evaluate(()=>({x:__dbg.walk.pos.x,y:__dbg.walk.pos.y}));
    assert.ok((after[axis]-before[axis])*sign>.05,`${key}: ${JSON.stringify({before,after})}`);pass(key+' movement');
  }
  for(const [key,sign]of [['KeyQ',1],['ArrowLeft',1],['ArrowRight',-1]]){
    await resetWalker(page);await hold(page,key);const yaw=await page.evaluate(()=>__dbg.walk.yaw);
    assert.ok(yaw*sign>.05,`${key}: ${yaw}`);pass(key+' rotation');
  }
  for(const key of ['KeyE','Enter']){
    await page.evaluate(()=>{
      const d=__dbg,p=d.plots[0].g.position,w=d.walk;
      for(const plot of d.G.S.plots)Object.assign(plot,{crop:'wheat',water:0,end:Date.now()-1000,dur:60000});
      d.G.view.refresh('plots');d.G.close();
      w.pos.set(p.x,p.z+2);w.vel.set(0,0);w.yaw=0;w.pitch=-Math.atan2(1.6,2);
    });
    const frame=await page.evaluate(()=>__dbg.renderer.info.render.frame);
    await page.waitForFunction(f=>__dbg.renderer.info.render.frame>=f+8,frame,{timeout:60000});
    await page.waitForFunction(()=>!document.getElementById('actBtn').hidden&&document.getElementById('actBtn').innerText.includes('Harvest'),{},{timeout:15000});
    const hit=await page.evaluate(()=>{const h=__dbg.hitAt(innerWidth/2,innerHeight/2);return {type:h&&h.type,i:h&&h.i};});
    assert.equal(hit.type,'plot');
    const before=await page.evaluate(()=>({yaw:__dbg.walk.yaw,harvests:__dbg.G.S.stats.harvests,wheat:__dbg.G.S.barn.wheat||0,empty:__dbg.G.S.plots.filter(p=>!p.crop).length}));
    await hold(page,key,600);
    // Animated crop geometry can change which neighboring plot the throttled aim
    // scan sees. Require one actual harvest/reward, rather than a stale ray's index.
    const after=await page.evaluate(()=>({yaw:__dbg.walk.yaw,harvests:__dbg.G.S.stats.harvests,wheat:__dbg.G.S.barn.wheat||0,empty:__dbg.G.S.plots.filter(p=>!p.crop).length}));
    assert.equal(after.empty,before.empty+1,key+' clears one ripe crop');assert.equal(after.harvests,before.harvests+1,key+' harvest');assert.equal(after.wheat,before.wheat+2);assert.equal(after.yaw,before.yaw,key+' must not turn');pass(key+' interacts without rotation');
  }
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!__dbg.walk);
}
async function planting(page,size,cancel=true){
  await page.evaluate(()=>{const d=__dbg;d.G.close();d.G.S.tut=99;for(const p of d.G.S.plots)p.crop=null;d.G.view.refresh('plots');d.cam.target.set(-10,1,12);d.cam.yaw=0;d.cam.pitch=.8;d.cam.dist=18;});
  // Leaving walk mode eases the camera from the walker's eye to the farm view, and the farmer stays where the walk
  // stopped (often on the plots). Wait until the eased view has actually arrived (a fixed 2 s was not enough on a slow
  // CI machine: the spot was picked mid-ease and the next click hit the farmer, opening the wardrobe), and only pick a
  // spot where the game's own hit test says "this plot", not the farmer standing on it.
  await page.waitForFunction(()=>{const v=__dbg.view,c=__dbg.cam;return Math.abs(v.pitch-c.pitch)<.002&&Math.abs(v.dist-c.dist)<.02&&Math.abs(v.yaw-c.yaw)<.002&&v.target.distanceTo(c.target)<.02;},null,{timeout:30000});
  const spot=await page.evaluate(()=>{
    for(let i=0;i<__dbg.plots.length;i++){
      const s=__dbg.G.view.screenPos('plot:'+i), h=s&&__dbg.hitAt(s.x,s.y);
      if(s&&s.x>120&&s.x<innerWidth-140&&s.y>55&&s.y<innerHeight-100&&__dbg.plotAt(s.x,s.y)===i&&h&&h.type==='plot'&&h.i===i&&document.elementFromPoint(s.x,s.y)===__dbg.renderer.domElement)return {...s,i};
    }throw Error('No unobscured plot');
  });
  await page.mouse.click(spot.x,spot.y);
  await page.waitForFunction(()=>!document.getElementById('seedTray').hidden);
  await page.locator('[data-crop="wheat"]').click();
  assert.equal(await page.evaluate(i=>__dbg.G.S.plots[i].crop,spot.i),'wheat');pass(size+' planting through seed tray');
  const before=await page.evaluate(i=>{const G=__dbg.G;G.S.plots[i].end=Date.now()-1000;G.view.closeTrays();G.view.refresh('plots');return {wheat:G.S.barn.wheat||0,harvests:G.S.stats.harvests,xp:G.S.xp};},spot.i);
  await page.mouse.click(spot.x,spot.y);
  const after=await page.evaluate(i=>({crop:__dbg.G.S.plots[i].crop,wheat:__dbg.G.S.barn.wheat||0,harvests:__dbg.G.S.stats.harvests,xp:__dbg.G.S.xp}),spot.i);
  assert.equal(after.crop,null);assert.equal(after.wheat,before.wheat+2);assert.equal(after.harvests,before.harvests+1);assert.ok(after.xp>before.xp);pass(size+' pointer harvest adds crops and XP');
  if(!cancel)return;
  // Open an empty plot using the real pointer path, then drag a seed.
  await page.evaluate(i=>{__dbg.G.S.plots[i].crop=null;__dbg.G.view.refresh('plots');__dbg.G.view.closeTrays();},spot.i);
  await page.mouse.click(spot.x,spot.y);
  const box=await page.locator('[data-crop="wheat"]').boundingBox();assert.ok(box);
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x+box.width/2,box.y-30,{steps:3});
  await page.waitForFunction(()=>!!__dbg.farmDrag);
  // A second touch on the canvas cancels farmDrag while the original pointer continues.
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:spot.x,y:spot.y,id:81},{x:spot.x+35,y:spot.y,id:82}]});
  assert.equal(await page.evaluate(()=>__dbg.farmDrag),null);
  await page.mouse.move(spot.x,spot.y,{steps:4});
  assert.ok(await page.locator('#ghost').evaluate(el=>el.hidden));
  assert.ok(await page.locator('#seedTray').evaluate(el=>!el.classList.contains('away')));
  await page.mouse.up();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();
  pass(size+' cancelled seed drag', 'Second-pointer cancellation followed by continued original pointer movement; ghost/tray cleanup');
}
async function orders(page,size){
  const before=await page.evaluate(()=>{const G=__dbg.G;G.close();G.view.closeTrays();G.S.tut=99;G.S.barn.wheat=10;G.S.orders=[{items:{wheat:3},coins:25,xp:2,gem:1,wait:0}];G.S.rush=null;G.S.stats.orders=0;return {coins:G.S.coins,gems:G.S.gems,xp:G.S.xp};});
  await page.locator('.dock [data-p="orders"]').click();
  const deliver=page.locator('[data-act="deliver"][data-i="0"]');
  assert.equal(await deliver.isEnabled(),true);await deliver.click();
  const after=await page.evaluate(()=>{const s=__dbg.G.S;return {coins:s.coins,gems:s.gems,xp:s.xp,wheat:s.barn.wheat,orders:s.stats.orders,wait:s.orders[0].wait};});
  assert.equal(after.wheat,7);assert.equal(after.coins,before.coins+25);assert.equal(after.gems,before.gems+1);assert.equal(after.xp,before.xp+2);assert.equal(after.orders,1);assert.ok(after.wait>Date.now());
  assert.equal(await deliver.count(),0);pass(size+' order delivery pays once and consumes inventory');
  await page.evaluate(()=>{__dbg.G.close();__dbg.G.S.barn.wheat=0;__dbg.G.S.orders=[{items:{wheat:3},coins:25,xp:2,gem:1,wait:0}];});
  await page.locator('.dock [data-p="orders"]').click();assert.equal(await deliver.isEnabled(),false);pass(size+' insufficient order inventory disables delivery');
  await page.locator('#panelRoot .xbtn').click();
}
async function panels(page,size){
  await page.evaluate(()=>{__dbg.G.close();__dbg.G.view.closeTrays();});
  for(const name of ['orders','barn','shop','settings']){
    await page.locator(`[data-act="open"][data-p="${name}"]`).click();
    await page.waitForFunction(name=>__dbg.G.panel?.type===name,name);
    // Wait for the opening CSS animation before measuring the final panel bounds.
    await page.waitForTimeout(350);
    const fit=await page.locator('#panelRoot .panel').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};});
    assert.ok(fit.x>=-1&&fit.y>=-1&&fit.right<=fit.w+1&&fit.bottom<=fit.h+1,JSON.stringify({name,...fit}));
    await page.screenshot({path:path.join(artifacts,`panel-${size}-${name}.png`)});
    await page.locator('#panelRoot .xbtn').click();assert.equal(await page.evaluate(()=>__dbg.G.panel),null);
  }
  pass(size+' orders/barn/shop/settings panels fit and close');
}
(async()=>{
  const harness=await start();base=harness.base+'farm3d/';let failed=true;
  try{
    for(const viewport of [{width:1280,height:720},{width:740,height:360},{width:844,height:390}]){
      const size=viewport.width+'x'+viewport.height;
      const session=await harness.setup(viewport,viewport.width<1000,'regression-'+size);
      const {context,page,errors}=session;
      await boot(page,'?testfarm&debug&portrait');
      assert.equal(await page.evaluate(()=>__dbg.G.S.level),12);pass(size+' testfarm boot');
      if(viewport.width===1280){await checkKeys(page);}
      else{
        await page.locator('#walkBtn').tap();await page.waitForFunction(()=>!!__dbg.walk);
        await resetWalker(page);
        const cdp=await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:180,id:71}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:140,y:145,id:71}]});
        await page.waitForFunction(()=>__dbg.walk.pos.y<21.95,{},{timeout:60000});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();
        pass(size+' mobile joystick movement');
        await page.evaluate(()=>{const d=__dbg,p=d.plots[0].g.position,w=d.walk;for(const plot of d.G.S.plots)Object.assign(plot,{crop:'wheat',water:0,end:Date.now()-1000,dur:60000});d.G.view.refresh('plots');d.G.close();w.pos.set(p.x,p.z+2);w.vel.set(0,0);w.yaw=0;w.pitch=-Math.atan2(1.6,2);});
        const aimedFrame=await page.evaluate(()=>__dbg.renderer.info.render.frame);
        await page.waitForFunction(f=>__dbg.renderer.info.render.frame>=f+8,aimedFrame,{timeout:60000});
        await page.waitForFunction(()=>!document.getElementById('actBtn').hidden&&document.getElementById('actBtn').innerText.includes('Harvest'),null,{timeout:60000});
        const hit=await page.evaluate(()=>{const h=__dbg.hitAt(innerWidth/2,innerHeight/2);return {type:h?.type,i:h?.i};});assert.equal(hit.type,'plot');
        const beforeAction=await page.evaluate(()=>({harvests:__dbg.G.S.stats.harvests,wheat:__dbg.G.S.barn.wheat||0,empty:__dbg.G.S.plots.filter(p=>!p.crop).length}));
        await page.locator('#actBtn').tap();
        const afterAction=await page.evaluate(()=>({harvests:__dbg.G.S.stats.harvests,wheat:__dbg.G.S.barn.wheat||0,empty:__dbg.G.S.plots.filter(p=>!p.crop).length}));
        assert.deepEqual(afterAction,{harvests:beforeAction.harvests+1,wheat:beforeAction.wheat+2,empty:beforeAction.empty+1});pass(size+' mobile walk action button harvests ripe crop');
        await page.keyboard.press('Escape');
      }
      await planting(page,size,viewport.width===1280);
      await orders(page,size);await panels(page,size);
      await page.evaluate(()=>__dbg.G.save());
      assert.equal(await page.evaluate(()=>localStorage.getItem(__dbg.G.SAVE_KEY)),null);pass(size+' sandbox never writes a farm save');
      assert.deepEqual(errors,[]);pass(size+' no page/console/resource errors');await session.finish();
      // Each viewport also exercises a fresh, normal guest farm and a real reload.
      const normal=await harness.setup(viewport,viewport.width<1000,'normal-'+size);
      await boot(normal.page,'?debug&portrait');
      await normal.page.locator('#authGuest').click();
      await normal.page.waitForFunction(()=>document.getElementById('authGate').hidden);
      assert.equal(await normal.page.evaluate(()=>__dbg.G.S.level),1);
      pass(size+' normal fresh guest boot', 'Firebase SDK isolated to exercise offline guest fallback');
      const saved=await normal.page.evaluate(()=>{const G=__dbg.G;G.close();G.S.tut=99;G.S.nextEventAt=9e15;G.plant(0,'wheat');G.save();return {coins:G.S.coins,crop:G.S.plots[0].crop,raw:localStorage.getItem(G.SAVE_KEY)};});
      assert.equal(saved.crop,'wheat');assert.ok(saved.raw);assert.equal(JSON.parse(saved.raw).v,1);
      await normal.page.reload({waitUntil:'load'});
      await normal.page.waitForFunction(()=>window.__dbg&&!document.getElementById('loading')&&window.saAuth?.guest,{},{timeout:90000});
      const loaded=await normal.page.evaluate(()=>({coins:__dbg.G.S.coins,crop:__dbg.G.S.plots[0].crop,guest:window.saAuth.guest}));
      assert.equal(loaded.coins,saved.coins);assert.equal(loaded.crop,saved.crop);assert.equal(loaded.guest,true);
      pass(size+' local v1 save/reload retains crop, coins and guest');
      if(viewport.width===1280){
        const savedFarm=await normal.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(__dbg.G.SAVE_KEY));delete s.lastSeen;return s;});
        await boot(normal.page,'?testfarm&debug&portrait');
        // Leaving a normal farm legitimately flushes its lastSeen timestamp.
        // Every other saved field must survive; subsequent sandbox saves change nothing.
        const preserved=await normal.page.evaluate(()=>{const raw=localStorage.getItem(__dbg.G.SAVE_KEY),s=JSON.parse(raw);delete s.lastSeen;return {raw,farm:s};});
        assert.deepEqual(preserved.farm,savedFarm);
        await normal.page.evaluate(()=>{__dbg.G.plant(0,'corn');__dbg.G.save();});
        assert.equal(await normal.page.evaluate(()=>localStorage.getItem(__dbg.G.SAVE_KEY)),preserved.raw);
        pass('Existing normal farm save survives sandbox play');
      }
      assert.deepEqual(normal.errors,[]);pass(size+' normal/reload no page/console/resource errors');await normal.finish();
    }
    failed=false;
  }finally{await harness.close(failed);fs.writeFileSync(path.join(artifacts,'regression-results.json'),JSON.stringify({status:failed?'FAIL':'PASS',checks:results},null,2));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
