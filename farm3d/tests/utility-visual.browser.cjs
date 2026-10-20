const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
const out=path.join(artifacts,'utility-visual');fs.mkdirSync(out,{recursive:true});
const results={status:'RUNNING',question:'Does lamp-only near-field calibration remove pole/arm clipping without altering scene lighting?',physicalDevice:false,views:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
let h,failed=true;save();
(async()=>{try{
 h=await start({deviceScaleFactor:1});
 for(const [label,ref]of [['before','ec05703e9519deba1c5f67c34ceeafda3eb54562'],['after',null]]){
  h.serveRef(ref);const s=await h.setup({width:390,height:844},true,'utility-visual-'+label),p=s.page;
  await p.addInitScript(()=>{Date.now=()=>1792494000000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});
  await p.goto(h.base+'farm3d/?debug&portrait&preset=night&theme=');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
  if(await p.locator('#authGuest').isVisible())await p.locator('#authGuest').click();
  await p.evaluate(()=>{const d=__dbg,G=d.G;G.close();G.opts.quiet=true;G.S.tut=99;G.S.event=null;G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;G.S.coins=750;G.S.decor={inv:{lantern:2,sunflowers:3},placed:[{id:'utilitylamp',x:-17.76,z:7.42,rotation:.57}]};G.view.setQuality('high');G.view.refresh('decor');});
  await p.mouse.click(10,10);
  for(const [view,yaw]of [['side',Math.PI/2],['front',0]]){
   const frame=await p.evaluate(yaw=>{const d=__dbg;d.cam.target.set(-17.76,1.1,7.42);d.cam.yaw=yaw;d.cam.pitch=.35;d.cam.dist=8;Object.assign(d.view,{yaw,pitch:.35,dist:8});d.view.target.copy(d.cam.target);return d.renderer.info.render.frame;},yaw);
   await p.waitForFunction(n=>__dbg.renderer.info.render.frame>=n+3,frame,{timeout:60000});
   await p.screenshot({path:path.join(out,label+'-'+view+'-390.png')});
  }
  const settings=await p.evaluate(()=>({intensity:__dbg.utilityLights.lights.find(l=>l.intensity>0).intensity,decay:__dbg.utilityLights.lights[0].decay,rotation:__dbg.decorObjs[0].rotation.y}));
  assert.equal(settings.intensity,label==='before'?38:12);assert.equal(settings.decay,label==='before'?2:1);assert.equal(settings.rotation,.57);results.views.push({label,ref,settings});save();assert.deepEqual(s.errors,[]);await s.finish();
 }
 failed=false;results.status='PASS';save();console.log('PASS matched actual390old/newglare captures; visual review required, not full qualification');
}catch(error){results.status='FAIL';results.error=String(error.stack||error);save();throw error;}finally{if(h)await h.close(failed);}})().catch(error=>{console.error(error);process.exitCode=1;});
