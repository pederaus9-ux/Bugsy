const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts,root}=require('./browser-harness.cjs');
const results=[];
function pass(name,detail){results.push({name,detail});console.log('PASS',name,detail||'');}
async function targets(page){
 return page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility==='visible').map(b=>{const r=b.getBoundingClientRect();return{label:b.getAttribute('aria-label')||b.textContent.trim(),w:r.width,h:r.height};}).filter(b=>b.w<43.9||b.h<43.9));
}
(async()=>{const h=await start();let failed=true;try{
 for(const [width,height]of [[740,360],[844,390],[1280,720]]){
  const s=await h.setup({width,height},width<1000,'accessibility-'+width),p=s.page;
  await p.emulateMedia({reducedMotion:width===740?'reduce':'no-preference'});
  await p.goto(h.base+'farm3d/?testfarm&debug&portrait');
  await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  await p.evaluate(()=>{__dbg.G.opts.quiet=true;__dbg.G.close();__dbg.G.S.nextEventAt=__dbg.G.S.nextVisitorAt=__dbg.G.S.nextRushAt=9e15;});
  assert.deepEqual(await targets(p),[],'home buttons have 44px targets');
  for(const panel of ['settings','barn','orders','shop','weather','decor']){
   await p.evaluate(panel=>__dbg.G.openPanel(panel),panel);
   await p.waitForFunction(()=>[...document.querySelector('.panel').getAnimations()].every(a=>a.playState==='finished'),null,{timeout:30000});
   assert.deepEqual(await targets(p),[],panel+' targets');
   const fit=await p.evaluate(()=>{const r=document.querySelector('.panel').getBoundingClientRect(),b=document.querySelector('.pbody');return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:b.scrollWidth>b.clientWidth+1};});
   assert.ok(fit.left>=0&&fit.right<=width&&fit.top>=0&&fit.bottom<=height,JSON.stringify(fit));assert.equal(fit.overflow,false,panel+' horizontal fit');
  }
  pass('44px home/panel targets and scrolling fit '+width+'x'+height);
  await p.evaluate(()=>__dbg.G.close());
  await p.locator('[data-p="settings"]').focus();await p.keyboard.press('Enter');
  await p.waitForFunction(()=>document.activeElement?.classList.contains('xbtn'));
  await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.act),'reset');
  await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('xbtn')),true);
  await p.locator('[data-act="motion"][data-k="reduce"]').click();
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.k),'reduce','focus follows replacement control');
  assert.equal(await p.locator('[data-act="motion"][data-k="reduce"]').getAttribute('aria-pressed'),'true');
  const motion=await p.evaluate(()=>({setting:__dbg.G.PREFS.motion,reduced:__dbg.G.reducedMotion(),css:document.documentElement.dataset.motion,saved:JSON.parse(localStorage.getItem('sunny-acres-3d-v1-prefs')).motion,animation:getComputedStyle(document.querySelector('.panel')).animationName}));
  assert.deepEqual(motion,{setting:'reduce',reduced:true,css:'reduce',saved:'reduce',animation:'none'});
  await p.locator('[data-act="motion"][data-k="reduce"]').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(artifacts,'accessibility-settings-'+width+'.png')});
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>__dbg.G.panel),null);assert.equal(await p.evaluate(()=>document.activeElement.dataset.p),'settings');
  pass('modal tab loop, close/return focus and persisted motion setting '+width);
  // System setting follows live OS changes; full motion is an explicit override.
  await p.evaluate(()=>__dbg.G.openPanel('settings'));await p.locator('[data-act="motion"][data-k="system"]').click();
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.evaluate(()=>__dbg.G.reducedMotion()),true);
  await p.emulateMedia({reducedMotion:'no-preference'});assert.equal(await p.evaluate(()=>__dbg.G.reducedMotion()),false);
  await p.locator('[data-act="motion"][data-k="full"]').click();await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.evaluate(()=>__dbg.G.reducedMotion()),false);
  await p.locator('[data-act="motion"][data-k="reduce"]').click();await p.keyboard.press('Escape');
  if(width===844){
   await p.evaluate(()=>{for(const [k,v]of Object.entries({'left':28,'right':20,'top':12,'bottom':16}))document.documentElement.style.setProperty('--safe-'+k,v+'px');});
   const safe=await p.evaluate(()=>({side:document.querySelector('.side').getBoundingClientRect().left,dock:document.querySelector('.dock').getBoundingClientRect().right}));
   assert.ok(safe.side>=28&&safe.dock<=844-20,JSON.stringify(safe));
   await p.screenshot({path:path.join(artifacts,'accessibility-notch-844.png')});pass('simulated side insets',safe);
   await p.locator('#walkBtn').click();await p.waitForFunction(()=>__dbg.walk);
   assert.equal(await p.evaluate(()=>document.activeElement===__dbg.renderer.domElement),true);
   const before=await p.evaluate(()=>{__dbg.walk.pos.set(-1.4,22);__dbg.walk.yaw=0;return __dbg.walk.pos.y;});
   await p.keyboard.down('KeyW');await p.waitForFunction(y=>__dbg.walk.pos.y<y-.1,before,{timeout:30000});await p.keyboard.up('KeyW');
   const bob=await p.evaluate(()=>__dbg.walk.bob);assert.equal(bob,0,'reduced motion disables head bob');
   await p.evaluate(()=>__dbg.G.openPanel('settings'));await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>!!__dbg.walk),true,'Escape closes panel and retains walking');
   await p.keyboard.down('KeyW');
   const renderBefore=await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden||false});window.__hidden=true;document.dispatchEvent(new Event('visibilitychange'));window.__pausedPosition=__dbg.walk.pos.clone();return __dbg.renderer.info.render.frame;});
   await p.evaluate(()=>new Promise(resolve=>{let n=0;function step(){if(++n===5)resolve();else requestAnimationFrame(step);}requestAnimationFrame(step);}));
   assert.equal(await p.evaluate(()=>__dbg.renderer.info.render.frame),renderBefore,'hidden farm submits no renderer frames');
   await p.evaluate(()=>{window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForFunction(f=>__dbg.renderer.info.render.frame>f,renderBefore);
   await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>__dbg.walk.pos.distanceTo(__pausedPosition)),0,'background input does not stick after return');await p.keyboard.up('KeyW');
   pass('walking keys/head bob, modal Escape and hidden/resumed rendering');
  }
  await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});assert.equal(await p.evaluate(()=>__dbg.G.reducedMotion()),true,'preference survives reload');
  assert.deepEqual(s.errors,[]);await s.finish();
 }
 // Isolate the actual production form/handlers, replacing SDK startup only.
 // Full authentication/cloud behavior is covered separately by emulator CI.
 const html=fs.readFileSync(path.join(root,'farm3d/index.html'),'utf8');
 const form=html.slice(html.indexOf('<div class="authgate"'),html.indexOf('<script type="module" src="auth.js'));
 const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 let auth=fs.readFileSync(path.join(root,'farm3d/auth.js'),'utf8').replace(/import \{installAnalytics\} from '[^']+';/,'const installAnalytics=()=>({end(){}});');
 auth=auth.replace('else if (configured) start();','else if (configured) { window.__showForm=show; fb={A:{async createUserWithEmailAndPassword(a,e,p){window.__created={e,p};}},auth:{}}; show("signin"); }');
 for(const [width,height,touch]of [[740,360,true],[390,844,true],[1280,720,false]]){
  const s=await h.setup({width,height},touch,'accessibility-auth-'+width),p=s.page;
  await p.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+css+'</style>'+form);await p.addScriptTag({content:auth,type:'module'});await p.waitForFunction(()=>window.__showForm);await p.waitForTimeout(80);
  assert.equal(await p.evaluate(()=>innerWidth),width,'auth fixture uses the production mobile viewport');
  assert.equal(await p.evaluate(()=>document.activeElement.tagName),touch?'BODY':'INPUT','touch forms do not force open the keyboard; desktop keeps default focus');
  await p.locator('[data-mode="register"]').click();await p.locator('#authEmail').fill('probe@example.invalid');await p.locator('#authPass').fill('hunter22');await p.locator('#authPass2').fill('hunter22');await p.waitForTimeout(80);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'authPass2');await p.locator('#authGo').click();assert.deepEqual(await p.evaluate(()=>__created),{e:'probe@example.invalid',p:'hunter22'});
  assert.deepEqual(await targets(p),[],'auth controls have 44px targets');
  await p.screenshot({path:path.join(artifacts,'accessibility-auth-'+width+'.png')});
  // Rapid tab changes cancel the earlier request, then explicit focus wins.
  await p.evaluate(()=>{__showForm('signin');__showForm('register');document.getElementById('authPass2').focus();});await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>document.activeElement.id),'authPass2');
  await p.locator('[data-mode="signin"]').focus();await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'authGuest');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.mode),'signin');
  await s.finish();pass('touch auth sizing, rapid registration and focus preservation '+width+'x'+height);
 }
 failed=false;
}finally{fs.writeFileSync(path.join(artifacts,'accessibility-results.json'),JSON.stringify(results,null,2));await h.close(failed);}})().catch(e=>{console.error(e);process.exitCode=1;});
