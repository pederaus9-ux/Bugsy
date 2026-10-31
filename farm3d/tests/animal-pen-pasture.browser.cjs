// A41: a template-sized cow pen grows ~1.5x through the validated pen commit, persists, and keeps animals inside.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const{start}=require('./browser-harness.cjs');
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/3d-v3-cow-robot.json'),'utf8')).save;let h,failed=true;
(async()=>{try{h=await start({deviceScaleFactor:1});const s=await h.setup({width:844,height:390},true,'pasture',true),p=s.page;
 await p.addInitScript(farm=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(farm));localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');},base);
 const ready=()=>p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 await p.goto(h.base+'farm3d/?debug&preset=noon');await ready();
 await p.waitForFunction(()=>!!__dbg.G.S.layout?.animalPens?.sites?.cow,null,{timeout:90000});
 const read=()=>p.evaluate(async()=>{const G=await import('./animal-pen-geometry.js?v=1'),T=await import('./animal-pen-pasture.js?v=1');const s=__dbg.G.S.layout.animalPens.sites.cow,poly=s.boundary.map(v=>[v.x,v.z]);
  const cows=__dbg.animals.filter(a=>a.kind==='cow').map(a=>[a.g.position.x,a.g.position.z]);return{area:G.polygonArea(poly),base:T.templateArea('cow'),inside:cows.every(c=>G.pointInPolygon(c,poly)),cows:cows.length,structures:s.structures,raw:JSON.stringify(__dbg.G.S.layout.animalPens)};});
 const first=await read();assert(first.area>=first.base*1.45,'cow pen grew about 1.5x: '+first.area+' vs '+first.base);assert(first.inside,'every cow is inside the new pen');
 const defaults=await p.evaluate(async()=>(await import('./animal-pen-layout.js?v=1')).defaultSiteRecord('cow').structures);assert.deepEqual(first.structures,defaults,'shelter, beds, feed, water and robot keep their exact places');
 await p.reload();await ready();await p.waitForTimeout(6000);const again=await read();assert.equal(again.raw,first.raw,'the grown pen persists and is not grown twice');assert(again.inside&&again.cows===first.cows);
 assert.deepEqual(s.errors,[]);await s.finish();failed=false;console.log('PASTURE PASS',Math.round(first.base),'->',Math.round(first.area));
}catch(e){console.error(e.stack||e);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
