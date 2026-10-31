// A42 fix (owner report 2026-10-30 19:44 CDT): the first A41 release grew the cow pen 3 m north and 2 m west,
// behind the barn's own back and side walls. The fence the player sees stayed put and cows wandered into the
// hidden strip. Now: nothing grows behind those walls (the yard is boxed in by the stone path and the other
// pens, so it stays template-sized until the yard is relocated), a pen grown that way is repaired back, the
// visible fence matches the saved pen, every cow is inside it, and the check never freezes a frame.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const{start}=require('./browser-harness.cjs');
const base=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/saves/3d-v3-cow-robot.json'),'utf8')).save;let h,failed=true;
async function run(name,farm,expectChange){
 const s=await h.setup({width:844,height:390},true,'pasture-fence-'+name,true),p=s.page;
 await p.addInitScript(f=>{if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');localStorage.setItem('sunny-acres-3d-v1',JSON.stringify(f));localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');},farm);
 await p.goto(h.base+'farm3d/?debug&preset=noon');await p.waitForFunction(()=>window.__ready&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
 const before=JSON.stringify(farm.layout?.animalPens??null); // the seeded value: the migration may finish before the page is ready
 if(expectChange)await p.evaluate(()=>{const a=__dbg.animals.find(a=>a.kind==='cow');a.g.position.set(-15,a.g.position.y,-42);}); // a cow stuck in the hidden strip
 await p.evaluate(()=>{window.__worst=0;let last=performance.now();const f=()=>{const x=performance.now();window.__worst=Math.max(window.__worst,x-last);last=x;if(!window.__stopWatch)requestAnimationFrame(f);};requestAnimationFrame(f);});
 if(expectChange)await p.waitForFunction(b=>JSON.stringify(__dbg.G.S.layout?.animalPens??null)!==b,before,{timeout:120000});
 await p.waitForTimeout(expectChange?4000:12000);
 const r=await p.evaluate(async()=>{window.__stopWatch=true;const G=await import('./animal-pen-geometry.js?v=1'),L=await import('./animal-pen-layout.js?v=1');
  const def=L.defaultSiteRecord('cow'),site=__dbg.G.S.layout?.animalPens?.sites?.cow??def,poly=site.boundary.map(v=>[v.x,v.z]);
  let mn=[1e9,1e9],mx=[-1e9,-1e9],fence=null;__dbg.scene.traverse(o=>{if(o.name==='cow-fence'&&o.visible)fence=o;});
  if(fence){fence.updateMatrixWorld(true);fence.traverse(c=>{if(c.isMesh){c.geometry.computeBoundingBox();const b=c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);mn=[Math.min(mn[0],b.min.x),Math.min(mn[1],b.min.z)];mx=[Math.max(mx[0],b.max.x),Math.max(mx[1],b.max.z)];}});}
  const cows=__dbg.animals.filter(a=>a.kind==='cow').map(a=>[a.g.position.x,a.g.position.z]);
  if(mn[0]>1e8){const st=[];__dbg.scene.traverse(o=>{if(o.name==="cow-static")st.push(o);});}return{poly,def:def.boundary.map(v=>[v.x,v.z]),fence:fence?[mn,mx]:null,inside:cows.every(c=>G.pointInPolygon(c,poly)),cows,worst:window.__worst,raw:JSON.stringify(__dbg.G.S.layout?.animalPens??null)};});
 const xs=r.poly.map(v=>v[0]),zs=r.poly.map(v=>v[1]);
 assert.deepEqual(r.poly,r.def,name+': the cow pen is exactly the template behind no barn wall '+JSON.stringify(r.poly));
 if(!expectChange)assert.equal(r.raw,before,name+': a boxed-in template yard is left untouched');
 if(r.fence&&r.fence[0][0]<1e8)for(const [got,want] of [[r.fence[0][0],Math.min(...xs)],[r.fence[1][0],Math.max(...xs)],[r.fence[0][1],Math.min(...zs)],[r.fence[1][1],Math.max(...zs)]])assert(Math.abs(got-want)<.35,name+': visible fence matches the saved pen '+JSON.stringify(r.fence)+' vs '+JSON.stringify(r.poly));
 assert(r.inside,name+': every cow is inside the visible fence '+JSON.stringify(r.cows));
 assert(r.worst<(2500),name+': no long freeze while the pasture is checked ('+Math.round(r.worst)+' ms)'); // the one-time repair commit rebuilds the yard once
 await p.reload();await p.waitForFunction(()=>window.__ready&&window.__dbg,null,{timeout:120000});await p.waitForTimeout(7000);
 assert.equal(await p.evaluate(()=>JSON.stringify(__dbg.G.S.layout?.animalPens??null)),r.raw,name+': stable across reloads');
 assert.deepEqual(s.errors,[]);await s.finish();console.log('PASTURE FENCE',name,JSON.stringify(r.poly),'fence',JSON.stringify(r.fence),'worst',Math.round(r.worst),'ms');
}
(async()=>{try{h=await start({deviceScaleFactor:1});
 await run('fresh',base,false);
 // The shape the first A41 release saved (Austin's farm): 3 m north and 2 m west, behind the barn walls.
 const L=await import('../animal-pen-layout.js'),site=L.defaultSiteRecord('cow');
 site.boundary=[{id:'v0',x:-16,z:-43.2},{id:'v1',x:9.8,z:-43.2},{id:'v2',x:9.8,z:-32.8},{id:'v3',x:-16,z:-32.8}];
 const old=structuredClone(base);old.layout={...(old.layout||{}),animalPens:{v:1,revision:1,sites:{cow:site}}};old.v=4;
 await run('repair-v80',old,true);
 failed=false;
}catch(e){console.error(e.stack||e);process.exitCode=1;}finally{if(h)await h.close(failed);}})();
