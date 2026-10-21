const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const out=path.join(artifacts,'north-land');fs.mkdirSync(out,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/3d-v3-cow-robot.json'))).save;
fixture.layout.b.feedmill=[-8,-11];fixture.layout.t.tree=[-9,4];
fixture.decor.placed=[{id:'oak',x:-6,z:-13,rotation:1.2},{id:'pine',x:14,z:-14,rotation:.4},{id:'utilitylamp',x:5,z:-31,rotation:.7}];
const result={status:'RUNNING',physicalPhone:false,viewports:[]},save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
let h,failed=true;save();
async function ready(p){await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:90000});await p.evaluate(()=>{const G=__dbg.G;G.close();G.opts.quiet=true;G.PREFS.quality='high';G.view.setQuality('high');});}
async function frame(p,target,distance=35){await p.evaluate(({target,distance})=>{const d=__dbg,V=d.camera.position.constructor,t=new V(...target);d.cam.target.copy(t);d.view.target.copy(t);d.camera.position.copy(t).add(new V(7,19,22).normalize().multiplyScalar(distance));d.camera.lookAt(t);d.camera.updateMatrixWorld(true);d.sun.target.position.copy(t);d.sun.position.copy(t).add(new V(20,50,20));d.renderScene();},{target,distance});}
(async()=>{try{
 h=await start({deviceScaleFactor:1,serviceWorkers:'allow'});
 for(const[width,height]of [[844,390],[390,844],[1280,720]]){
  const session=await h.setup({width,height},width<1000,'north-land-'+width,width<1000),p=session.page;
  await p.addInitScript(farm=>{if(!sessionStorage.getItem('land-seeded')){localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(farm));sessionStorage.setItem('land-seeded','1');}localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');},fixture);
  await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon&season=fall');await ready(p);
  const row={width,height};result.viewports.push(row);
  row.state=await p.evaluate(()=>{const d=__dbg,G=d.G,cows=d.animals.filter(a=>a.kind==='cow');return{active:d.cowYardActive,issues:d.cowYardIssues,layout:G.S.layout,decor:G.S.decor.placed,pen:cows.every(a=>a.pen.poly===d.cowYard.layout.polygon||a.pen.poly[0][1]===d.cowYard.layout.polygon[0][1]),positions:cows.map(a=>a.g.position.toArray()),season:G.THEME.season,registry:d.seasonalLeaves.size,flat:d.groundY(-8,-36),place:d.spotFree(17,-35,1),edit:d.editValid('b:feedmill',17,-35),expandedPlace:d.spotFree(7,-35,1),expandedEdit:d.editValid('b:feedmill',7,-35),walk:d.collideWalker(new(d.cam.target.constructor)(17,-35,0)).toArray(),dpr:d.renderer.getPixelRatio()};});
  assert(row.state.active,JSON.stringify(row.state.issues));assert(row.state.pen);assert(row.state.positions.every(p=>p[2]<-30));assert.equal(row.state.flat,0);assert(row.state.place&&row.state.edit);assert.equal(row.state.expandedPlace,false);assert.equal(row.state.expandedEdit,false);assert.equal(row.state.dpr,1);assert.equal(row.state.season,'fall');assert.deepEqual(row.state.walk.slice(0,2),[17,-35]);assert.deepEqual(row.state.layout.b,fixture.layout.b);assert.deepEqual(row.state.layout.t,fixture.layout.t);assert.deepEqual(row.state.decor,fixture.decor.placed);
  // Check the real walker collider across the open gate, including after reload.
  async function entrance(){return p.evaluate(()=>{
   const d=__dbg,l=d.cowYard.layout,V=d.cam.target.constructor,x=(l.gate[0]+l.gate[1])/2,z=l.polygon[2][1],samples=[];
   for(let step=0;step<=50;step++){const wanted=[x,z+4-step*.1],actual=d.collideWalker(new V(...wanted)).toArray();samples.push({wanted,actual});}
   return {samples,decorAllowed:d.spotFree(x,z+2,1),buildingAllowed:d.editValid('b:feedmill',x,z+2)};
  });}
  async function pathState(){return p.evaluate(()=>{
   const d=__dbg,V=d.cam.target.constructor,path=d.dairyPath;
   return {points:path.points,stones:path.stones.count,draws:path.group.children.length,visible:path.group.visible,
    samples:path.samples.filter((_,i)=>i%2===0).map(wanted=>({wanted,actual:d.collideWalker(new V(...wanted)).toArray()})),
    decorAllowed:d.spotFree(-18.4,-12,1),buildingAllowed:d.editValid('b:feedmill',-18.4,-12)};
  });}
  row.path=await pathState();assert(row.path.visible);assert(row.path.stones>200&&row.path.stones<600);assert.equal(row.path.draws,2);
  for(const s of row.path.samples)assert(Math.hypot(s.wanted[0]-s.actual[0],s.wanted[1]-s.actual[1])<1e-6,'stone path walking route is blocked');
  assert.equal(row.path.decorAllowed,false);assert.equal(row.path.buildingAllowed,false);
  await frame(p,[-8,.5,-12],width<height?78:66);await p.screenshot({path:path.join(out,'stone-path-'+width+'.png')});
  row.entrance=await entrance();
  for(const s of row.entrance.samples)assert(Math.hypot(s.wanted[0]-s.actual[0],s.wanted[1]-s.actual[1])<1e-6,'cow entrance walking approach is blocked');
  assert.equal(row.entrance.decorAllowed,false);assert.equal(row.entrance.buildingAllowed,false);
  // Actual render, with the existing occupied site still visible in the farm view.
  await frame(p,[-5,.5,-25],width<height?68:46);await p.screenshot({path:path.join(out,'expanded-fall-'+width+'.png')});
  await frame(p,[-6,.6,-36],width<height?44:22);await p.screenshot({path:path.join(out,'dairy-day-'+width+'.png')});
  await p.evaluate(()=>__dbg.setPreset('night'));await frame(p,[-6,.6,-36],width<height?44:22);await p.screenshot({path:path.join(out,'dairy-night-'+width+'.png')});await p.evaluate(()=>__dbg.setPreset('noon'));
  if(width===1280){
   row.seasons=[];
   for(const season of ['spring','summer','fall','winter']){
    const state=await p.evaluate(season=>{const d=__dbg;d.G.THEME.season=season;d.G.view.applyWeather();const materials=new Set(),canopies=[];d.scene.traverse(o=>{if(o.isMesh){materials.add(o.material);if(o.geometry.attributes.color&&o.material.customProgramCacheKey?.()==='seasonal-leaves-v1')canopies.push({count:o.geometry.drawRange.count,colour:Array.from(o.geometry.attributes.color.array.slice(0,3))});}});const pine=d.decorObjs.find(o=>o.userData.hit.j===1),v=[];pine.traverse(o=>{if(o.isMesh)v.push(o.material.color.getHex());});return{season:d.seasonalLeaves.season,canopies,pine:v,geometries:d.renderer.info.memory.geometries,textures:d.renderer.info.memory.textures};},season);
    assert.equal(state.season,season);assert(state.canopies.length>=4);assert(state.canopies.every(c=>season==='winter'?c.count===0:c.count>0));row.seasons.push(state);await frame(p,[-3,1,-2],29);await p.screenshot({path:path.join(out,season+'-trees-1280.png')});
   }
   for(const s of row.seasons)assert.deepEqual(s.pine,row.seasons[0].pine,'evergreen changed with season');assert.notDeepEqual(row.seasons[1].canopies[0].colour,row.seasons[2].canopies[0].colour);
   await p.evaluate(()=>{__dbg.G.THEME.season='fall';__dbg.G.view.applyWeather();});
  }
  // Reopen the genuine saved layout; do not reconstruct or reposition it after load.
  await p.evaluate(()=>__dbg.G.save());await p.reload();await ready(p);
  row.reload=await p.evaluate(()=>({layout:__dbg.G.S.layout,decor:__dbg.G.S.decor.placed,active:__dbg.cowYardActive}));assert(row.reload.active);assert.deepEqual(row.reload.layout.b,fixture.layout.b);assert.deepEqual(row.reload.layout.t,fixture.layout.t);assert.deepEqual(row.reload.decor,fixture.decor.placed);
  row.entranceReload=await entrance();assert.deepEqual(row.entranceReload,row.entrance);
  row.pathReload=await pathState();assert.deepEqual(row.pathReload,row.path);
  assert.deepEqual(session.errors,[]);save();await session.finish();
 }
 failed=false;result.status='PASS';save();
}catch(e){result.status='FAIL';result.error=String(e.stack||e);save();console.error(result.error);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
