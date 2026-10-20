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
 h=await start({deviceScaleFactor:1,ref:BASE});
 {const s=await h.setup({width:1280,height:720},false,'decor-old-lantern'),p=s.page;await boot(p,h.base);await view(p,0);const before=await poses(p);await photo(p,'before-lantern-front');await view(p,Math.PI/2);const after=await poses(p);await photo(p,'before-lantern-side');assert.notDeepEqual(after,before,'old lantern follows camera');pass('matched published baseline reproduces camera-facing lantern',{before,after});assert.deepEqual(s.errors,[]);await s.finish();}
 h.serveRef(null);
 for(const [width,height,touch,id]of [[390,844,true,'sunflowers'],[844,390,true,'lantern'],[1280,720,false,'maple']]){
  const s=await h.setup({width,height},touch,'decor-native-'+width),p=s.page;await boot(p,h.base,id);await view(p,0);const before=await poses(p);await photo(p,id+'-front-'+width);
  const measured=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js'),o=d.decorObjs[0],model=o.children.find(c=>c.userData.decorId),b=new T.Box3().setFromObject(model);return {id:model.userData.decorId,depth:b.max.z-b.min.z,base:b.min.y,ground:d.decorationGroundY(o.position.x,o.position.z),card:!!o.userData.card,rotation:o.rotation.y,buffer:d.renderer.getDrawingBufferSize(new T.Vector2()).toArray()};});
  assert.equal(measured.id,id);assert(measured.depth>.1);assert(measured.base>=measured.ground-1e-5);assert.equal(measured.card,false);assert.equal(measured.rotation,.57);assert.deepEqual(measured.buffer,[width,height]);
  await view(p,Math.PI/2);assert.deepEqual(await poses(p),before);await photo(p,id+'-side-'+width);await view(p,Math.PI);assert.deepEqual(await poses(p),before);await photo(p,id+'-back-'+width);pass(width+' actual '+id+' stays solid, grounded and fixed through camera orbit',measured);
  if(width===844){await p.evaluate(()=>__dbg.setPreset('night'));await view(p,0);await photo(p,'lantern-night-844');await p.evaluate(()=>__dbg.setPreset('noon'));}
  await view(p,0);await pick(p,touch);await press(p,'#infoTray [data-w="store"]',touch);
  await press(p,'[data-p="decor"]',touch);await press(p,'[data-act="buyDecor"][data-id="lantern"]',touch);await p.waitForFunction(()=>!!__dbg.moving);assert.equal(await p.evaluate(()=>__dbg.G.S.coins),910);
  await view(p,0);const start=await p.evaluate(()=>({x:__dbg.moving.x,z:__dbg.moving.z}));
  if(touch){const c=await s.context.newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.45,y:height*.55}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.55,y:height*.6}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
  else{await p.mouse.move(width*.45,height*.55);await p.mouse.down();await p.mouse.move(width*.55,height*.6);await p.mouse.up();}
  await press(p,'#moveBar [data-m="done"]',touch);assert.equal(await p.evaluate(()=>!!__dbg.moving),false);const saved=await state(p);
  assert.equal(saved.decor.placed.length,1);assert.equal(saved.decor.placed[0].id,'lantern');assert(Math.hypot(saved.decor.placed[0].x-start.x,saved.decor.placed[0].z-start.z)>.25,'trusted drag must actually move prop');
  await p.reload();await ready(p);assert.deepEqual(await state(p),saved);await view(p,0);await pick(p,touch);await press(p,'#infoTray [data-w="store"]',touch);const stored=await state(p);assert.equal(stored.decor.placed.length,0);assert.equal(stored.decor.inv.lantern,(saved.decor.inv.lantern||0)+1);assert.equal(stored.coins,910);
  pass(width+' native buy/move/done/reload/put-away preserves paid ownership and farm',{start,saved,stored});assert.deepEqual(s.errors,[]);await s.finish();
 }
 // Actual engine asset views; clearly separate from the real-farm screenshots.
 {const s=await h.setup({width:1280,height:2024},false,'decor-asset-study'),p=s.page;
  await p.route('**/farm3d/tests/decor-study.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#eee7d9;color:#394238;font:16px sans-serif"><div style="height:64px;text-align:center;padding:12px;box-sizing:border-box">Actual Three.js model study — all31converted props (not a farm screenshot)</div><canvas id="c"></canvas><div id="labels"></div><script type="module">
import * as T from '../lib/three.module.min.js';import {createFarmDecoration,FARM_DECOR_IDS} from '../decor-models.js?v=1';
const r=new T.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(1280,1960);r.setScissorTest(true);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;
// Establish renderer-owned resources without creating any decoration. Three r186
// allocates a shared DFG_LUT for MeshStandardMaterial; a model cannot dispose it.
const warmScene=new T.Scene(),warmCamera=new T.PerspectiveCamera(34,1,.1,20),warmMat=new T.MeshStandardMaterial(),warmGeo=new T.BoxGeometry(.1,.1,.1);
let warmShader;warmMat.onBeforeCompile=shader=>{warmShader=shader;};warmScene.add(new T.Mesh(warmGeo,warmMat));warmScene.add(new T.HemisphereLight(0xffffff,0x626349,2.4));warmCamera.position.z=2;r.render(warmScene,warmCamera);
const lut=warmShader?.uniforms.dfgLUT?.value,rendererTexture={name:lut?.name,width:lut?.image?.width,height:lut?.image?.height};warmGeo.dispose();warmMat.dispose();warmScene.clear();r.render(warmScene,warmCamera);
const baseline={...r.info.memory};
const cells=FARM_DECOR_IDS.map((id,i)=>{const scene=new T.Scene();scene.background=new T.Color(i%2?0xe0ded1:0xeee9dc);scene.add(new T.HemisphereLight(0xffffff,0x626349,2.4));const sun=new T.DirectionalLight(0xffeed0,3);sun.position.set(-2,4,5);scene.add(sun);const prop=createFarmDecoration(id,{height:1.35,footprint:1.35});scene.add(prop);const camera=new T.PerspectiveCamera(34,320/245,.1,20);const label=document.createElement('span');label.style.cssText='position:absolute;text-align:center;width:320px;left:'+(i%4)*320+'px;top:'+(64+Math.floor(i/4)*245+218)+'px';label.textContent=id;document.getElementById('labels').append(label);return {id,scene,prop,camera,i};});
function render(yaw){for(const {scene,camera,i}of cells){camera.position.set(Math.sin(yaw)*3.3,1.6,Math.cos(yaw)*3.3);camera.lookAt(0,.65,0);r.setViewport((i%4)*320,1960-(Math.floor(i/4)+1)*245,320,245);r.setScissor((i%4)*320,1960-(Math.floor(i/4)+1)*245,320,245);r.render(scene,camera);}}
window.__study={render,dispose(){const before={...r.info.memory};for(const x of cells){x.prop.userData.dispose();x.scene.remove(x.prop);}render(.6);return {baseline,rendererTexture,before,after:{...r.info.memory},count:cells.length};}};render(.6);window.__studyReady=true;
</script></body></html>`}));
  await p.goto(h.base+'farm3d/tests/decor-study.html');await p.waitForFunction(()=>window.__studyReady);await photo(p,'all31-front');await p.evaluate(()=>__study.render(2.25));await photo(p,'all31-side');await p.evaluate(()=>__study.render(3.7));await photo(p,'all31-back');const resources=await p.evaluate(()=>__study.dispose());result.resourceDisposal=resources;save();assert.equal(resources.count,31);assert.deepEqual(resources.rendererTexture,{name:'DFG_LUT',width:16,height:16});assert.equal(resources.baseline.geometries,0);assert.equal(resources.baseline.textures,1);assert.equal(resources.after.geometries,0);assert.deepEqual(resources.after,resources.baseline,'all decoration GPU resources return exactly to the independently established renderer baseline');pass('all31 native geometry views and GPU cleanup',resources);assert.deepEqual(s.errors,[]);await s.finish();
 }
 await h.close(false);h=null;
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
