// Native evidence in disposable synthetic farms; external services blocked by harness.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {start,artifacts,root}=require('./browser-harness.cjs');
const {updateWorker}=require('./worker-transition.cjs');
const BASE='9214e564f64c43ab4ccf3eb1175a075d34e32a70',out=path.join(artifacts,'decor-catalog');fs.mkdirSync(out,{recursive:true});
const result={status:'RUNNING',base:BASE,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),drawingScale:1,physicalDevice:false,results:[],captures:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
const pass=(name,details)=>{result.results.push({name,details});save();console.log('PASS',name);};
const photo=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png')});result.captures.push(name+'.png');save();};
const press=(p,selector,touch)=>touch?p.locator(selector).tap():p.locator(selector).click();
async function ready(p){await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});if(await p.locator('#authGuest').isVisible())await p.locator('#authGuest').click();await p.evaluate(()=>{const G=__dbg.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.event=null;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;});}
async function boot(p,base,id='lantern'){
 await p.addInitScript(()=>{Date.now=()=>1792494000000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(base+'farm3d/?debug&portrait&preset=noon&theme=');await ready(p);
 await p.evaluate(id=>{const d=__dbg;d.G.S.coins=1000;d.G.S.decor={inv:{},placed:[]};d.cam.target.set(-18,.65,8);const spot=d.G.view.freeDecorSpot(1);if(!spot)throw Error('no valid decor review spot');d.G.S.decor.placed=[{id,x:spot.x,z:spot.z,rotation:.57}];d.G.view.refresh('decor');d.G.save();d.G.view.setQuality('high');},id);
 await p.mouse.click(10,10);
}
async function view(p,yaw=0){const f=await p.evaluate(yaw=>{const d=__dbg,q=d.G.S.decor.placed[0];if(q)d.cam.target.set(q.x,.65,q.z);d.cam.yaw=yaw;d.cam.pitch=.5;d.cam.dist=7;Object.assign(d.view,{yaw,pitch:.5,dist:7});d.view.target.copy(d.cam.target);return d.renderer.info.render.frame;},yaw);await p.waitForFunction(f=>__dbg.renderer.info.render.frame>=f+3,f,{timeout:60000});}
const poses=p=>p.evaluate(()=>__dbg.decorObjs.map(o=>({rotation:o.rotation.toArray(),children:o.children.map(c=>c.rotation.toArray())})));
async function pick(p,touch){const target=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js'),o=d.decorObjs[0],centers=[];o.traverse(c=>{if(c.isMesh&&!c.userData.contactShadow)centers.push(new T.Box3().setFromObject(c).getCenter(new T.Vector3()));});for(const v of centers){v.project(d.camera);const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2,h=d.hitAt(x,y);if(x>0&&x<innerWidth&&y>0&&y<innerHeight&&h?.type==='decor'&&h.j===0)return {x,y,hit:{type:h.type,j:h.j}};}throw Error('real model has no unobstructed selectable surface');});assert.deepEqual(target.hit,{type:'decor',j:0});if(touch)await p.touchscreen.tap(target.x,target.y);else await p.mouse.click(target.x,target.y);}
const state=p=>p.evaluate(()=>{const G=__dbg.G;G.save();const s=JSON.parse(localStorage.getItem(G.SAVE_KEY));return {decor:s.decor,coins:s.coins,barn:s.barn,gold:s.gold,pens:s.pens,plots:s.plots,buildings:s.buildings};});
let h,failed=true;save();
(async()=>{try{
 // Real old-worker installation and offline boot of the new module, normal guest only.
 h=await start({deviceScaleFactor:1,serviceWorkers:'allow',ref:BASE});
 {const s=await h.setup({width:844,height:390},true,'decor-installed-update'),p=s.page;await boot(p,h.base);
  await p.evaluate(()=>{const G=__dbg.G;G.S.decor.inv={sunflowers:3,maple:2};G.S.decor.placed[0].rotation=.57;G.save();});const old=await state(p);
  // Localhost is secure for service workers, but the unchanged game only auto-registers
  // on HTTPS. Explicitly install the predecessor, as the other installed-update tests do.
  await p.evaluate(()=>{window.__decorRegistrationError=null;window.__decorRegistration=null;navigator.serviceWorker.register('sw.js').then(r=>window.__decorRegistration=r).catch(e=>window.__decorRegistrationError=String(e));});
  await p.waitForFunction(()=>{if(window.__decorRegistrationError)throw Error(window.__decorRegistrationError);const r=window.__decorRegistration;return !!r?.active&&r.active.state==='activated'&&!r.installing&&!r.waiting&&navigator.serviceWorker.controller===r.active;},null,{timeout:90000});
  pass('explicit old50 installation controls localhost before update',{registration:await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {scope:r.scope,active:r.active.state,controls:navigator.serviceWorker.controller===r.active,caches:await caches.keys()};})});await p.reload();await ready(p);assert.equal(await p.evaluate(async()=>(await caches.keys()).includes('sa3d-v50')),true);
  h.serveRef(null);const transition=await updateWorker(p);assert(transition.requestedWorkerControls);const hash=await p.evaluate(async()=>{const c=await caches.open('sa3d-v51'),r=await c.match(new URL('decor-models.js?v=1',location.href));if(!r)throw Error('new model module missing from offline cache');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');});assert.equal(hash,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'farm3d/decor-models.js'))).digest('hex'));
  await p.reload();await ready(p);assert.deepEqual(await state(p),old);await s.context.setOffline(true);await p.reload();await ready(p);assert.deepEqual(await state(p),old);const solid=await p.evaluate(()=>({id:__dbg.decorObjs[0].children.find(o=>o.userData.decorId)?.userData.decorId,card:!!__dbg.decorObjs[0].userData.card,rotation:__dbg.decorObjs[0].rotation.y}));assert.deepEqual(solid,{id:'lantern',card:false,rotation:.57});await photo(p,'offline-lantern');pass('actual50to51 requested-worker update and offline boot preserve owned decor/farm exactly',{transition,hash,solid,old});assert.deepEqual(s.errors,[]);await s.finish();
 }
 result.status='PASS';failed=false;save();
 }catch(e){result.status='FAIL';result.error=String(e.stack||e);save();console.error(e);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
