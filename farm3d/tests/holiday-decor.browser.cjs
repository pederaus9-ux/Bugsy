const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const BASE='c17d563886cca786391c8aaa401498437dfca0e7';
const out=path.join(artifacts,'holiday-depth');fs.mkdirSync(out,{recursive:true});
const result={status:'RUNNING',base:BASE,physicalDevice:false,results:[],captures:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
const pass=(name,details)=>{result.results.push({name,details});save();console.log('PASS',name);};
async function photo(p,name){await p.screenshot({path:path.join(out,name+'.png')});result.captures.push(name+'.png');save();}
async function boot(p,base){
 await p.addInitScript(()=>{localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
 await p.goto(base+'farm3d/?debug&portrait&preset=noon&theme=halloween');
 await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 if(await p.locator('#authGuest').isVisible())await p.locator('#authGuest').click();
 await p.evaluate(()=>{const d=__dbg;d.G.close();d.G.opts.quiet=true;d.G.S.tut=99;d.G.S.nextEventAt=d.G.S.nextVisitorAt=d.G.S.nextRushAt=9e15;
  d.G.S.decor={inv:{jack:2,spider:1,haunted:1},placed:[{id:'jack',x:4,z:17.8},{id:'haunted',x:7,z:20},{id:'spider',x:7,z:16}]};d.G.view.refresh('decor');d.G.save();d.G.view.setQuality('high');
 });
}
async function view(p,yaw){const f=await p.evaluate(yaw=>{const d=__dbg;d.cam.target.set(4,.65,17.8);d.cam.dist=10;d.cam.pitch=.25;d.cam.yaw=yaw;Object.assign(d.view,{yaw,pitch:.25,dist:10});d.view.target.copy(d.cam.target);return d.renderer.info.render.frame;},yaw);await p.waitForFunction(f=>__dbg.renderer.info.render.frame>=f+3,f,{timeout:60000});}
const poses=p=>p.evaluate(()=>({placed:__dbg.decorObjs[0].rotation.toArray(),children:__dbg.decorObjs[0].children.filter(o=>!o.material?.transparent).map(o=>o.rotation.toArray()),ambient:(__dbg.holidayObjs||__dbg.scene.children.filter(o=>o.userData.bill)).map(o=>o.rotation.toArray())}));
const press=async(p,selector,touch)=>touch?p.locator(selector).tap():p.locator(selector).click();
(async()=>{let h,failed=true;try{
 h=await start({deviceScaleFactor:1,ref:BASE});
 // A matched old-tree observation assigns the cause; it is not product qualification.
 {const s=await h.setup({width:1280,height:720},false,'holiday-baseline'),p=s.page;await boot(p,h.base);await view(p,0);const before=await poses(p);await photo(p,'before-front-1280');await view(p,Math.PI/2);const after=await poses(p);await photo(p,'before-side-1280');
  assert.notDeepEqual(before.children,after.children,'old placed emoji card follows the camera');assert.notDeepEqual(before.ambient,after.ambient,'old ambient props follow the camera');pass('baseline reproduces camera-facing placed and ambient pumpkin cards',{before,after});assert.deepEqual(s.errors,[]);await s.finish();}
 h.serveRef(null);
 for(const [width,height,touch]of [[390,844,true],[844,390,true],[1280,720,false]]){
  const s=await h.setup({width,height},touch,'holiday-candidate-'+width),p=s.page;await boot(p,h.base);await view(p,0);const before=await poses(p);await photo(p,'after-front-'+width);
  const measurement=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js');const record=o=>{o.updateMatrixWorld(true);const b=new T.Box3().setFromObject(o);return {position:o.position.toArray(),depth:b.max.z-b.min.z,base:b.min.y,ground:d.decorationGroundY(o.position.x,o.position.z,d.holidayObjs.includes(o)?.75:1.05),rotation:o.rotation.toArray()};};return {placed:record(d.decorObjs[0]),ambient:d.holidayObjs.map(record),buffer:d.renderer.getDrawingBufferSize(new T.Vector2()).toArray(),quality:{...d.QUALITY}};});
  assert.deepEqual(measurement.buffer,[width,height]);assert.ok(measurement.placed.depth>.5);assert.ok(measurement.placed.base>=measurement.placed.ground-1e-5);
  for(const o of measurement.ambient){assert.ok(o.depth>.1);assert.ok(o.base>=o.ground-1e-5);}
  await view(p,Math.PI/2);assert.deepEqual(await poses(p),before);await photo(p,'after-side-'+width);await view(p,Math.PI);assert.deepEqual(await poses(p),before);await photo(p,'after-back-'+width);
  pass(width+' full-resolution geometry stays fixed through front/side/back camera views',measurement);
  if(width===1280){await p.evaluate(()=>__dbg.setPreset('night'));await view(p,0);await photo(p,'after-night-1280');await p.evaluate(()=>__dbg.setPreset('noon'));
   const lifecycle=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js'),isolated=new T.Scene(),camera=new T.PerspectiveCamera(38,1,.1,100);camera.position.set(4,3,26);camera.lookAt(4,.5,17);isolated.add(new T.HemisphereLight(0xffffff,0x445044,2));const render=()=>{for(const o of d.holidayObjs){o.removeFromParent();isolated.add(o);}d.renderer.render(isolated,camera);for(const o of d.holidayObjs){o.removeFromParent();d.scene.add(o);}};render();const before={...d.renderer.info.memory};for(let k=0;k<2;k++)for(const theme of ['christmas','easter','newyear','valentine','thanksgiving','stpatrick','halloween']){d.G.THEME.holiday=theme;d.syncHoliday();render();}return {before,after:{...d.renderer.info.memory},ambientCount:d.holidayObjs.length};});
   assert.deepEqual(lifecycle.after,lifecycle.before,'theme refreshes must not grow live GPU geometry/textures');assert.equal(lifecycle.ambientCount,5);pass('repeated real theme refreshes dispose old GPU resources',lifecycle);
  }
  // Exercise actual put-away, native Place and Done controls in an isolated guest save.
  await view(p,0);const target=await p.evaluate(async()=>{const d=__dbg,T=await import('./lib/three.module.min.js'),v=new T.Box3().setFromObject(d.decorObjs[0]).getCenter(new T.Vector3()).project(d.camera),x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2,h=d.hitAt(x,y);return {x,y,hit:h&&{type:h.type,j:h.j}};});assert.deepEqual(target.hit,{type:'decor',j:0});
  if(touch)await p.touchscreen.tap(target.x,target.y);else await p.mouse.click(target.x,target.y);await press(p,'#infoTray [data-w="store"]',touch);await press(p,'[data-p="decor"]',touch);await press(p,'[data-act="placeDecor"][data-id="jack"]',touch);await p.waitForFunction(()=>!!__dbg.moving);
  const moveStart=await p.evaluate(()=>({x:__dbg.moving.x,z:__dbg.moving.z}));
  if(touch){const c=await s.context.newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.45,y:height*.55}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.55,y:height*.6}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
  else{await p.mouse.move(width*.45,height*.55);await p.mouse.down();await p.mouse.move(width*.55,height*.6);await p.mouse.up();}
  await press(p,'#moveBar [data-m="done"]',touch);assert.equal(await p.evaluate(()=>!!__dbg.moving),false);
  const saved=await p.evaluate(()=>{const d=__dbg;d.G.save();const raw=JSON.parse(localStorage.getItem(d.G.SAVE_KEY));return {decor:raw.decor,coins:raw.coins,barn:raw.barn,pens:raw.pens};});
  assert.equal(saved.decor.inv.jack,2);assert.equal(saved.decor.placed.filter(d=>d.id==='jack').length,1);
  await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  const restored=await p.evaluate(()=>{const d=__dbg;return {decor:d.G.S.decor,coins:d.G.S.coins,barn:d.G.S.barn,pens:d.G.S.pens};});assert.deepEqual(restored,saved);pass(width+' native place/move/put-away/reload keeps inventory and farm save',{moveStart,saved});
  assert.deepEqual(s.errors,[]);await s.finish();
 }
 // Asset study is clearly labeled separately from the real-farm screenshots above.
 {const s=await h.setup({width:1200,height:1750},false,'holiday-asset-study'),p=s.page;
  await p.route('**/farm3d/tests/holiday-study.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><html><body style="margin:0;background:#ede6d9;font:18px sans-serif;color:#3b4236"><div style="height:48px;text-align:center;padding-top:10px;box-sizing:border-box">Actual 3D asset study — all holiday prizes (not an in-game scene)</div><canvas id="c"></canvas><div id="labels"></div><script type="module">
 import * as T from '../lib/three.module.min.js';import {createHolidayDecoration,HOLIDAY_DECOR_IDS} from '../holiday-decor.js?v=1';
 const renderer=new T.WebGLRenderer({canvas:document.getElementById('c'),antialias:true});renderer.setSize(1200,1680);renderer.setPixelRatio(1);renderer.setScissorTest(true);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 for(let i=0;i<HOLIDAY_DECOR_IDS.length;i++){const id=HOLIDAY_DECOR_IDS[i],scene=new T.Scene();scene.background=new T.Color(i%2?0xe2dfd3:0xeee9dc);scene.add(new T.HemisphereLight(0xffffff,0x626349,2.4));const sun=new T.DirectionalLight(0xffeed0,3);sun.position.set(-2,4,5);scene.add(sun);const prop=createHolidayDecoration(id,{height:1.35,footprint:1.35});scene.add(prop);const camera=new T.PerspectiveCamera(34,400/240,.1,20);camera.position.set(1.4,1.4,3.2);camera.lookAt(0,.65,0);const x=(i%3)*400,y=1440-Math.floor(i/3)*240;renderer.setViewport(x,y,400,240);renderer.setScissor(x,y,400,240);renderer.render(scene,camera);const label=document.createElement('span');label.style.cssText='position:absolute;text-align:center;width:400px;left:'+x+'px;top:'+(48+Math.floor(i/3)*240+211)+'px';label.textContent=id;document.getElementById('labels').append(label);prop.userData.dispose();}
 window.__holidayStudyReady=true;</script></body></html>`}));await p.goto(h.base+'farm3d/tests/holiday-study.html');await p.waitForFunction(()=>window.__holidayStudyReady);await photo(p,'holiday-assets-all21');assert.deepEqual(s.errors,[]);await s.finish();}
 result.status='PASS';failed=false;save();
 }catch(e){result.status='FAIL';result.error=String(e.stack||e);save();console.error(e);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
