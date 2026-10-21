const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {start,artifacts}=require('./browser-harness.cjs');const {execFileSync}=require('node:child_process');
const out=path.join(artifacts,'cow-robot');fs.mkdirSync(out,{recursive:true});const result={status:'RUNNING',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingDiff:execFileSync('git',['diff','--stat'],{encoding:'utf8'}),physicalPhone:false,dpr:1,browser:process.env.CHROME_PATH||'CI pinned Chromium',checks:[],screenshots:[]};const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));let h,p,failed=true;save();
async function verifyCowActionIdentity(page){
 const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
 const patch=html.slice(html.indexOf('function patchAnimalInfo('),html.indexOf('\nfunction refreshInfo('));
 const refresh=html.slice(html.indexOf('function refreshInfo('),html.indexOf('\nfunction openInfo('));
 const observed=await page.evaluate(({patch,refresh})=>{
  const tray=document.createElement('div');tray.hidden=false;
  const markup=(activity,disabled=false,id='cow-1',pet='Pet')=>`<div class="acard"><div class="who"><button data-w="rename">Rename</button><div class="status">${activity}</div></div><button data-w="close">Close</button></div><div class="row"><button id="cow-milk" data-w="cowMilk" data-id="${id}" ${disabled?'disabled':''}>Milk</button><button data-w="petA" data-k="cow" data-i="0">${pet}</button></div><div class="tray-sub">Live cow</div>`;
  let next=markup('Eating');tray.innerHTML=next;tray.dataset.h=next;
  const patchFn=new Function('return ('+patch+');')();
  const selected={type:'animal',an:{kind:'cow'}};
  const refreshFn=new Function('infoTray','trayHtml','trayFor','closeTrays','patchAnimalInfo','return ('+refresh+');')(tray,()=>next,selected,()=>{},patchFn);
  const milk=tray.querySelector('#cow-milk'),rename=tray.querySelector('[data-w=rename]'),close=tray.querySelector('[data-w=close]'),header=tray.querySelector('.acard');let clicks=0;milk.addEventListener('click',()=>clicks++);
  next=markup('Walking to water',false,'cow-1','Pet 3s');refreshFn();milk.click();
  const stable=tray.querySelector('#cow-milk')===milk&&clicks===1;
  const headerStable=tray.querySelector('[data-w=rename]')===rename&&tray.querySelector('[data-w=close]')===close&&tray.querySelector('.acard')===header;
  const live=tray.querySelector('.status').textContent==='Walking to water'&&tray.querySelector('[data-w="petA"]').textContent==='Pet 3s';
  next=markup('Robot milking',true,'cow-1','Pet 2s');refreshFn();
  const disabled=tray.querySelector('#cow-milk')===milk&&milk.disabled;
  next=markup('Different cow',false,'cow-2');refreshFn();
  const differentCow=tray.querySelector('#cow-milk')!==milk&&tray.querySelector('#cow-milk').dataset.id==='cow-2';
  const birdMarkup=(activity,i=0)=>`<div class="acard"><div class="who"><button data-w="rename">Rename</button><div class="status">${activity}</div></div><button data-w="close">Close</button></div><div class="row"><button data-w="petA" data-k="chicken" data-i="${i}" disabled>Pet 19m</button></div>`;
  selected.an.kind='chicken';next=birdMarkup('Pecking');tray.innerHTML=next;tray.dataset.h=next;
  const birdButtons=[...tray.querySelectorAll('button')],birdHeader=tray.querySelector('.acard');
  next=birdMarkup('Zooming around');refreshFn();
  const birdControlsStable=birdButtons.every((button,i)=>tray.querySelectorAll('button')[i]===button)&&tray.querySelector('.acard')===birdHeader&&tray.querySelector('.status').textContent==='Zooming around';
  const saved=tray.innerHTML,bad=saved.replace('<div class="who">','<div class="who" data-check="changed"><span>new structural child</span>');
  const atomicFallback=patchFn(tray,bad)===false&&tray.innerHTML===saved;
  next=birdMarkup('Another bird',1);refreshFn();
  const birdSwitch=tray.querySelector('[data-w=petA]')!==birdButtons[2]&&tray.querySelector('[data-w=petA]').dataset.i==='1';
  const stationControls={};
  for(const type of ['chickenStation','cowStation']){
   selected.type=type;const prefix=type==='chickenStation'?'chicken':'cow';
   const stationMarkup=(minute,disabled=false)=>`<h3><span>Station</span><button data-w="close">Close</button></h3><div class="tray-sub">Water: 9h ${minute}m</div><button id="${prefix}-fill" data-w="${prefix}Fill" data-rev="${minute}" ${disabled?'disabled':''}>Refill</button>`;
   next=stationMarkup(59);tray.innerHTML=next;tray.dataset.h=next;
   const oldButtons=[...tray.querySelectorAll('button')],oldHeader=tray.querySelector('h3');let closeClicks=0;oldButtons[0].addEventListener('click',()=>closeClicks++);
   next=stationMarkup(58,true);refreshFn();oldButtons[0].click();
   stationControls[type]=oldButtons.every((n,i)=>tray.querySelectorAll('button')[i]===n)&&tray.querySelector('h3')===oldHeader&&closeClicks===1&&oldButtons[1].disabled&&oldButtons[1].dataset.rev==='58'&&tray.querySelector('.tray-sub').textContent==='Water: 9h 58m';
  }
  return {stable,headerStable,live,disabled,differentCow,birdControlsStable,atomicFallback,birdSwitch,stationControls};
 },{patch,refresh});
 assert.deepEqual(observed,{stable:true,headerStable:true,live:true,disabled:true,differentCow:true,birdControlsStable:true,atomicFallback:true,birdSwitch:true,stationControls:{chickenStation:true,cowStation:true}});
 result.actionIdentity=observed;result.checks.push('live animal activity retains header, Rename/Close and action nodes; labels/disabled update; farm/cow switch rebuilds');save();
}
(async()=>{try{h=await start({deviceScaleFactor:1,recordVideo:true,videoDir:path.join(out,'video')});for(const[width,height]of [String(process.env.COW_VIEWPORT||'844x390').split('x').map(Number)]){const touch=width<1000,s=await h.setup({width,height},touch,'cow-robot-'+width,touch);p=s.page;const press=selector=>touch?p.locator(selector).tap():p.locator(selector).click();await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');const nativeNow=Date.now.bind(Date);window.__cowOffset=0;Date.now=()=>nativeNow()+window.__cowOffset;});await p.goto(h.base+'farm3d/?debug&portrait&preset=noon&testfarm');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});await verifyCowActionIdentity(p);
// Observe trusted input without changing targets, dispatch, timing or gameplay.
await p.evaluate(()=>{
 const entries=window.__cowInputEvidence=[];
 const describe=n=>n instanceof Element?{tag:n.tagName,id:n.id,action:n.getAttribute('data-w'),text:n.textContent?.slice(0,80)}:null;
 const record=(kind,detail)=>{entries.push({at:performance.now(),kind,...detail});if(entries.length>200)entries.shift();};
 for(const type of ['pointerdown','pointerup','pointercancel','touchstart','touchend','click'])document.addEventListener(type,e=>{
  const path=e.composedPath();if(!path.some(n=>n instanceof Element&&(n.id==='actBtn'||n.id==='infoTray')))return;
  const d=window.__dbg,h=d.hitAt(innerWidth/2,innerHeight/2),b=document.getElementById('actBtn');
  record(type,{trusted:e.isTrusted,target:describe(e.target),path:path.slice(0,4).map(describe),defaultPrevented:e.defaultPrevented,hit:{type:h?.type,kind:h?.an?.kind,dist:h?.dist},act:describe(b),trayHidden:document.getElementById('infoTray').hidden,seedHidden:document.getElementById('seedTray').hidden,panel:d.G.panel,walk:!!d.walk});
 },true);
 for(const id of ['actBtn','infoTray'])new MutationObserver(ms=>record('mutation',{id,changes:ms.map(m=>({type:m.type,attribute:m.attributeName,target:describe(m.target)}))})).observe(document.getElementById(id),{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','data-h']});
});
await p.evaluate(()=>{const d=__dbg,G=d.G;G.close();G.PREFS.quality='high';G.view.setQuality('high');G.S.event=null;G.S.rush=null;G.S.visitor=null;G.opts.quiet=true;G.S.tut=99;G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;G.S.level=12;G.S.barnCap=400;G.S.barn={cow_feed:30,milk:7};G.S.pens.cow={owned:true,list:[0],meta:[{name:'Review Bessie',love:50,loveAt:Date.now()}]};G.view.refresh('all');});
const site=await p.evaluate(()=>({active:__dbg.cowYardActive,issues:__dbg.cowYardIssues}));result.site=site;save();assert(site.active,'yard site unavailable: '+JSON.stringify(site.issues));
await p.evaluate(()=>{const d=__dbg;d.cam.target.set(-7,1,-11+d.cowYard.group.position.z);d.cam.dist=13;d.cam.pitch=.65;d.cam.yaw=1.6;Object.assign(d.view,{dist:13,pitch:.65,yaw:1.6});d.view.target.copy(d.cam.target);});const frame=await p.evaluate(()=>__dbg.renderer.info.render.frame);await p.waitForFunction(frame=>__dbg.renderer.info.render.frame>=frame+9,frame);await p.screenshot({path:path.join(out,'day-'+width+'.png')});result.screenshots.push('day-'+width+'.png');result.renderQuality=await p.evaluate(()=>({dpr:devicePixelRatio,pixelRatio:__dbg.renderer.getPixelRatio(),buffer:[__dbg.renderer.domElement.width,__dbg.renderer.domElement.height],quality:__quality()}));assert.equal(result.renderQuality.pixelRatio,1);save();
// Use an actual station ray and trusted touch, with a walking viewpoint.
await press('#walkBtn');await p.waitForFunction(()=>!!__dbg.walk);
async function station(kind){await p.evaluate(kind=>{const d=__dbg,v=d.keyPos('cow:'+kind),w=d.walk;w.pos.set(v.x,v.z+2.3);w.vel.set(0,0);w.yaw=0;w.pitch=-Math.atan2(1.6-v.y,2.3);},kind);await p.waitForFunction(kind=>{const h=__dbg.hitAt(innerWidth/2,innerHeight/2);return h?.type==='cowStation'&&h.station===kind&&!document.getElementById('actBtn').hidden;},kind);await press('#actBtn');}
async function followCow(near=false){await p.evaluate(near=>{const d=__dbg,w=d.walk;cancelAnimationFrame(window.__cowFollow);w.pos.set(-7,-7+d.cowYard.group.position.z);w.vel.set(0,0);window.__cowTracking=true;const follow=()=>{if(!window.__cowTracking)return;const a=d.animals.find(a=>a.kind==='cow');if(near)w.pos.set(a.g.position.x+3,a.g.position.z+1.2);const dx=w.pos.x-a.g.position.x,dz=w.pos.y-a.g.position.z;w.yaw=Math.atan2(dx,dz);w.pitch=-Math.atan2(1.6-.85,Math.hypot(dx,dz));window.__cowFollow=requestAnimationFrame(follow);};follow();},near);}
await station('feed');await press('#cow-fill-feed');await press('[data-w="close"]');await station('water');await press('#cow-fill-water');await press('[data-w="close"]');assert.equal(await p.evaluate(()=>__dbg.G.have('cow_feed')),0);result.checks.push('native '+(touch?'touch':'mouse')+' stocks feed and water');save();
await p.evaluate(()=>{window.__cowOffset=180001;__dbg.G.save();__dbg.syncCowYard();});assert(await p.evaluate(()=>!!__dbg.cowStatus.cows[0].ready));
// Click a real visible cow; the setup only moves the camera, never the animal.
await followCow(true); // Keep aim on the naturally moving cow through the trusted tap.
await p.waitForFunction(()=>{const d=__dbg,h=d.hitAt(innerWidth/2,innerHeight/2);return h?.type==='animal'&&h.an.kind==='cow'&&document.getElementById('actBtn').textContent.includes('Ready cow');});await press('#actBtn');await press('#cow-milk');assert.equal(await p.evaluate(()=>__dbg.G.have('milk')),7);result.checks.push('ready cow tap then Milk preserves barn milk');save();await press('[data-w="close"]');
await followCow();
await p.waitForFunction(()=>__dbg.G.getCowCareStatus().job?.stage==='milking',null,{timeout:60000});await p.evaluate(()=>{const w=__dbg.walk;w.pos.set(-5.5,-12.025+__dbg.cowYard.group.position.z);w.vel.set(0,0);});result.docked=await p.evaluate(()=>({care:__dbg.G.getCowCareStatus(),position:__dbg.animals.find(a=>a.kind==='cow').g.position.toArray()}));save();await p.waitForFunction(()=>{const j=__dbg.G.getCowCareStatus().job;return j?.stage==='milking'&&Date.now()-j.startedAt>=3000&&__dbg.cowYard.robot.arm.position.x< -2.2;});await p.screenshot({path:path.join(out,'milking-'+width+'.png')});result.screenshots.push('milking-'+width+'.png');
await p.waitForFunction(()=>__dbg.G.getCowCareStatus().tank.normal===1,null,{timeout:30000});assert.equal(await p.evaluate(()=>__dbg.G.have('milk')),7);await p.waitForFunction(()=>!__dbg.G.getCowCareStatus().job,null,{timeout:30000});result.checks.push('physical docking, service, tank credit and exit');save();await p.evaluate(()=>{window.__cowTracking=false;cancelAnimationFrame(window.__cowFollow);});
const xp=await p.evaluate(()=>__dbg.G.S.xp);await station('tank');await press('#cow-pickup-one');assert.equal(await p.evaluate(()=>__dbg.G.have('milk')),8);assert.equal(await p.evaluate(()=>__dbg.G.getCowCareStatus().tank.normal),0);assert.equal(await p.evaluate(()=>__dbg.G.S.xp),xp);assert(await p.locator('#cow-pickup-one').isDisabled());await press('[data-w="close"]');result.checks.push('native tank pickup moves one gallon to barn with no second XP award');save();
await p.evaluate(()=>{const d=__dbg,a=d.animals.find(a=>a.kind==='cow');if(a.cowTask?.token)d.cowStations.release(a.cowTask.token);a.carePose?.reset();a.cowTask=null;a.target=null;a.path=null;a.act='idle';d.setPreset('night');a.need.hunger=1;a.need.tired=1;a.cowDrinkAt=0;a.until=0;});await followCow();result.liveCare={};
for(const kind of ['feed','drink','bed']){await p.waitForFunction(kind=>{const a=__dbg.animals.find(a=>a.kind==='cow');return a.cowTask?.kind===kind&&a.cowTask.stage==='hold'&&a.cowTask.weight>.99;},kind,{timeout:60000});const observed=await p.evaluate(()=>{const a=__dbg.animals.find(a=>a.kind==='cow');return{position:a.g.position.toArray(),station:a.cowTask.station,label:a.label,pixelRatio:__dbg.renderer.getPixelRatio()};});assert.equal(observed.pixelRatio,1);result.liveCare[kind]=observed;await p.screenshot({path:path.join(out,'live-'+kind+'-'+width+'.png')});result.screenshots.push('live-'+kind+'-'+width+'.png');save();}
await p.evaluate(()=>{const d=__dbg,a=d.animals.find(a=>a.kind==='cow');window.__cowOffset+=180001;d.G.save();d.syncCowYard();d.walk.pos.set(-10.2,-11.4+d.cowYard.group.position.z);d.walk.vel.set(0,0);});await p.waitForFunction(()=>document.getElementById('actBtn').textContent.includes('Ready cow')&&!document.getElementById('actBtn').hidden);await press('#actBtn');await press('#cow-milk');await press('[data-w="close"]');await p.waitForFunction(()=>{const a=__dbg.animals.find(a=>a.kind==='cow');return a.cowTask?.kind==='robot'&&a.rig3d.body.position.y>1.02;},null,{timeout:30000});await p.screenshot({path:path.join(out,'live-stand-'+width+'.png')});result.screenshots.push('live-stand-'+width+'.png');result.checks.push('continuous native night feed, drink, folded bedding and stand-before-robot at drawingDPR1');save();assert.deepEqual(s.errors,[]);result.nativeInput=await p.evaluate(()=>window.__cowInputEvidence);save();await s.finish();}failed=false;result.status='PASS';save();}catch(e){result.status='FAIL';result.error=String(e.stack||e);if(p)try{result.nativeInput=await p.evaluate(()=>window.__cowInputEvidence);result.failure=await p.evaluate(()=>{const d=window.__dbg;return{ready:window.__ready,site:d?.cowYardActive,issues:d?.cowYardIssues,care:d?.G.getCowCareStatus(),animals:d?.animals.filter(a=>a.kind==='cow').map(a=>({name:a.name,pos:a.g.position.toArray(),task:a.cowTask,label:a.label}))};});await p.screenshot({path:path.join(out,'failure.png')});}catch(x){result.failureError=String(x);}save();console.error(result.error);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
