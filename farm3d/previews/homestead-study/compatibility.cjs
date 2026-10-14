const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function compatibility({h,wait,pose,out,profile,views}){
  const result={profile,scope:'Synthetic local study rendering/state/hits/input only; no migration/free-place/phone acceptance'};
  // Exercise native hits with original plot meshes still in their native roots.
  await pose(views[0]);
  result.plotHits=await h.cdp.evaluate(`(()=>{const d=__dbg;return d.plots.map((p,i)=>{const at=p.g.position.clone().setY(.1).project(d.camera),x=(at.x+1)*innerWidth/2,y=(1-at.y)*innerHeight/2,hit=d.hitAt(x,y);return{i,x,y,hit:hit?{type:hit.type,i:hit.i}:null,originalSoilVisible:p.g.children.find(o=>o.isMesh&&o.material===d.M.tilled)?.visible};});})()`);
  assert.ok(result.plotHits.every(r=>r.originalSoilVisible),'original hit objects restored after rendering');
  assert.ok(result.plotHits.every(r=>r.hit?.type==='plot'&&r.hit.i===r.i),'all 30 stable purchase-index crop hits');
  result.resources=[];
  // First visit warms each native preset. Second/third cycles test reuse.
  for(let cycle=0;cycle<3;cycle++){
    for(const preset of ['noon','golden','rain','snow','night','noon']){
      await pose({...views[3],preset});await wait(300);
      result.resources.push({cycle,preset,...await h.cdp.evaluate('({...__dbg.renderer.info.memory})')});
    }
    await pose(views[0]);
  }
  const a=result.resources.filter(x=>x.cycle===1),b=result.resources.filter(x=>x.cycle===2);
  assert.deepEqual(b.map(({geometries,textures})=>({geometries,textures})),a.map(({geometries,textures})=>({geometries,textures})),'stable warmed GPU resource counts across preset/mode cycle');
  await pose({...views[3],pose:{pos:[0,34],yaw:0,pitch:-.12}});
  const before=await h.cdp.evaluate('__dbg.walk.pos.toArray()');
  await h.cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});await wait(1000);
  result.moving=await h.cdp.evaluate('({pos:__dbg.walk.pos.toArray(),speed:__dbg.walk.gspd,walked:__dbg.walk.walked,bob:__dbg.walk.bob})');
  await h.cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});await wait(800);
  result.stopped=await h.cdp.evaluate('({pos:__dbg.walk.pos.toArray(),speed:__dbg.walk.gspd})');result.start=before;
  assert.ok(result.moving.pos[1]<before[1]-1&&result.moving.speed>2,'native forward control moves along synthetic path');
  assert.ok(result.stopped.speed<.05,'native stop settles');
  await h.cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await wait(600);
  result.reducedMotion=await h.cdp.evaluate('({enabled:__dbg.G.reducedMotion(),bob:__dbg.walk.bob,attr:document.documentElement.dataset.motion})');
  assert.ok(result.reducedMotion.enabled);assert.ok(Math.abs(result.reducedMotion.bob)<.0001);
  await h.cdp.screenshot(path.join(out,profile.name+'-after-reduced-motion.png'));
  await h.cdp.send('Emulation.setEmulatedMedia',{features:[]});
  // Sample actual animal centres, preserving all native animations. This is a
  // bounded observation rather than a new accepted-model gait qualification.
  result.animalSamples=[];
  for(let n=0;n<8;n++){await wait(250);result.animalSamples.push(await h.cdp.evaluate('(()=>{const d=__dbg;return d.animals.filter(a=>["horse","cow","sheep","chicken"].includes(a.kind)).map(a=>{const pen=d.PEN_LIST.find(p=>p.kinds.includes(a.kind));return {kind:a.kind,pos:[a.g.position.x,a.g.position.z],inside:d.inPen(pen,a.g.position.x,a.g.position.z),act:a.act};});})()'));}
  assert.ok(result.animalSamples.flat().every(a=>a.inside),'sampled animal centres remain in their species pens');
  result.ui=await h.cdp.evaluate('(()=>{const ids=["homestead-preview-label","homestead-preview-tools","walkBar","stick","actBtn"];return ids.map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return{id,hidden:e.hidden,rect:[r.x,r.y,r.width,r.height],text:e.textContent};});})()');
  result.status='PASS';fs.writeFileSync(path.join(out,profile.name+'-compatibility.json'),JSON.stringify(result,null,2)+'\n');return result;
};
