// A41 -> A42: the stock cow yard is boxed in by the barn walls, the stone path and the other pens, so the
// pasture migration must NOT grow it (A41 grew it behind the barn walls into a hidden strip). The check
// finishes, remembers the boxed-in result per obstacle layout, leaves the saved layout untouched, keeps
// every cow inside the template pen and stays stable across reloads.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const{start}=require('./browser-harness.cjs');
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/3d-v3-cow-robot.json'),'utf8')).save;let h,failed=true;
(async()=>{try{h=await start({deviceScaleFactor:1});const s=await h.setup({width:844,height:390},true,'pasture',true),p=s.page;
 await p.addInitScript(farm=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(farm));localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');},base);
 const ready=()=>p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 const before=JSON.stringify(base.layout?.animalPens??null);
 await p.goto(h.base+'farm3d/?debug&preset=noon');await ready();
 await p.waitForFunction(()=>localStorage.getItem('sa3d-pasture-checked:cow')!==null,null,{timeout:90000});
 const read=()=>p.evaluate(async()=>{const G=await import('./animal-pen-geometry.js?v=1'),L=await import('./animal-pen-layout.js?v=1');const s=__dbg.G.S.layout?.animalPens?.sites?.cow??L.defaultSiteRecord('cow'),poly=s.boundary.map(v=>[v.x,v.z]);
  const cows=__dbg.animals.filter(a=>a.kind==='cow').map(a=>[a.g.position.x,a.g.position.z]);return{poly,def:L.defaultSiteRecord('cow').boundary.map(v=>[v.x,v.z]),inside:cows.every(c=>G.pointInPolygon(c,poly)),cows:cows.length,raw:JSON.stringify(__dbg.G.S.layout?.animalPens??null)};});
 const first=await read();assert.deepEqual(first.poly,first.def,'boxed-in cow pen stays template-sized (no growth behind the barn walls)');
 assert.equal(first.raw,before,'saved layout untouched');assert(first.inside&&first.cows>0,'every cow is inside the pen');
 await p.reload();await ready();await p.waitForTimeout(6000);const again=await read();assert.equal(again.raw,first.raw,'stable across reloads');assert(again.inside&&again.cows===first.cows);
 assert.deepEqual(s.errors,[]);await s.finish();failed=false;console.log('PASTURE PASS template kept',JSON.stringify(first.poly));
}catch(e){console.error(e.stack||e);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
