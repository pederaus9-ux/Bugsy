// Active walk, first-person hands and pet interaction: actual UI on the running game loop.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {start,artifacts}=require('./browser-harness.cjs');
(async()=>{const h=await start();let failed=true;try{
 const {page,errors}=await h.setup({width:1280,height:720},false,'farmer-walk');
 await page.goto(h.base+'farm3d/?testfarm&debug&portrait');await page.waitForFunction(()=>window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});
 await page.evaluate(()=>{__dbg.renderer.shadowMap.enabled=false;__dbg.G.opts.quiet=true;__dbg.G.close();__dbg.G.S.nextEventAt=__dbg.G.S.nextVisitorAt=__dbg.G.S.nextRushAt=9e15;});
 await page.locator('#walkBtn').click();await page.waitForFunction(()=>__dbg.walk);await page.waitForTimeout(1500);
 // Walk intentionally enters first person; switch with the real POV control before auditing the body gait.
 await page.locator('#povBtn').click();
 await page.waitForFunction(()=>{let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});return f?.visible;});
 await page.evaluate(()=>{const w=__dbg.walk;w.pos.set(-1.4,22);w.vel.set(0,0);w.yaw=0;w.pitch=-.1;});
 const frame=await page.evaluate(()=>__dbg.renderer.info.render.frame);await page.keyboard.down('KeyW');
 // A planted leg may be nearly straight in any one frame. Audit both limbs across
 // real rendered travel instead of requiring both knees to bend at the same instant.
 await page.waitForFunction(f=>{
  let farmer;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')farmer=o;});
  const r=farmer.userData.live,n=__dbg.renderer.info.render.frame;
  const samples=window.__farmerStrideSamples||(window.__farmerStrideSamples=[]);
  if(n>f&&samples.at(-1)?.frame!==n)samples.push({frame:n,phase:r.state.phase,walkPhase:__dbg.walk.gait,knees:r.knees.map(k=>k.rotation.x),elbows:r.elbows.map(k=>k.rotation.x)});
  return samples.length>15&&__dbg.walk.pos.y<20.8;
 },frame,{timeout:60000});
 const gait=await page.evaluate(()=>{let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});const r=f.userData.live;return {visible:f.visible,phase:r.state.phase,walkPhase:__dbg.walk.gait,knees:r.knees.map(k=>k.rotation.x),elbows:r.elbows.map(k=>k.rotation.x),pos:__dbg.walk.pos.toArray()};});
 const stride=await page.evaluate(()=>window.__farmerStrideSamples);
 await page.keyboard.up('KeyW');assert.equal(gait.visible,true);assert.ok(Math.abs(gait.phase-gait.walkPhase)<1e-9);assert.ok(gait.pos[1]<20.8);
 assert.ok(stride.every(s=>Math.abs(s.phase-s.walkPhase)<1e-9),'every rendered pose honors actual walking phase');
 for(const part of ['knees','elbows'])for(let leg=0;leg<2;leg++){
  const values=stride.map(s=>s[part][leg]);
  assert.ok(Math.min(...values)<-.05,part+' '+leg+' bends during travel');
  assert.ok(Math.max(...values)-Math.min(...values)>(part==='knees'?.1:.01),part+' '+leg+' articulates across the stride');
 }
 await page.screenshot({path:path.join(artifacts,'farmer-walk.png'),scale:'css'});
 await page.locator('#povBtn').click();await page.waitForFunction(()=>__dbg.camera.children.some(g=>g.userData.skin&&g.visible),null,{timeout:60000});
 const hands=await page.evaluate(()=>{__dbg.G.wear('skin',5);__dbg.G.wear('shirt',2);const h=__dbg.camera.children.find(g=>g.userData.skin);let f;__dbg.scene.traverse(o=>{if(o.userData?.hit?.type==='farmer')f=o;});return {visible:h.visible,skin:h.userData.skin.color.getHex(),shirt:h.userData.sleeve.color.getHex(),farmer:f.visible};});
 assert.equal(hands.skin,0x5b3822);assert.equal(hands.shirt,0x5ea64a);assert.equal(hands.farmer,false);assert.equal(hands.visible,true);
 await page.screenshot({path:path.join(artifacts,'farmer-first-person.png'),scale:'css'});
 const animal=await page.evaluate(()=>{
  const d=__dbg,a=d.animals.find(a=>a.kind==='cow');d.setPreset('noon');a.g.position.set(-1.4,0,18);a.mode='fair';a.target=null;a.doing=null;a.until=9e15;a.calmUntil=9e15;a.act='idle';a.need.lonely=.7;
  const ref=a.ref;if(ref.type==='pen')d.G.S.pens[a.kind].list[ref.i]=Date.now()+600000;
  d.walk.pos.set(-1.4,20.5);d.walk.vel.set(0,0);d.walk.yaw=0;d.walk.pitch=-.23;
  window.__testPet=a;return {lonely:a.need.lonely,ref};
 });
 await page.waitForFunction(()=>__dbg.hitAt(innerWidth/2,innerHeight/2)?.an===__testPet&&!document.getElementById('actBtn').hidden&&document.getElementById('actBtn').innerText.includes('Pet'),null,{timeout:60000}).catch(async e=>{console.log('pet aim failure',await page.evaluate(()=>{const h=__dbg.hitAt(innerWidth/2,innerHeight/2);return {walk:__dbg.walk.pos.toArray(),camera:__dbg.camera.position.toArray(),cow:__testPet.g.position.toArray(),act:document.getElementById('actBtn').innerText,hidden:document.getElementById('actBtn').hidden,hit:h?.type,kind:h?.an?.kind,ref:h?.an?.ref};}));throw e;});
 const target=await page.evaluate(()=>{const h=__dbg.hitAt(innerWidth/2,innerHeight/2);return {type:h?.type,kind:h?.an?.kind,same:h?.an===__testPet,ref:h?.an?.ref,meta:__dbg.G.meta('cow',__testPet.ref.i)};});
 await page.keyboard.press('KeyE');const pet=await page.evaluate(()=>({lonely:__testPet.need.lonely,act:__testPet.act}));console.log('pet fixture',JSON.stringify({target,animal,pet}));assert.ok(pet.lonely<animal.lonely,'pet action reaches animal');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!__dbg.walk);assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(artifacts,'farmer-walk-results.json'),JSON.stringify({gait,stride,hands,animal,pet,errors},null,2));console.log('PASS live farmer gait / mitten colors / pet action',JSON.stringify({gait,strideFrames:stride.length,hands,pet}));failed=false;
 }finally{await h.close(failed);}})().catch(e=>{console.error(e);process.exit(1);});
