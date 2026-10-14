const assert=require('node:assert/strict'),crypto=require('node:crypto');
module.exports=function build(source,variant){let page=source;const patches=[];function replace(anchor,replacement,label){assert.equal(page.split(anchor).length,2,'unique served-copy anchor '+label);page=page.replace(anchor,replacement);patches.push({label,anchor,replacement});}
  replace('clock.update(); const t =','window.__bench.begin(); clock.update(); const t =','CPU begin');
  replace('for (const a of animals) a.update(dt, t);','window.__bench.mark("camera"); for (const a of animals) a.update(dt, t); window.__bench.mark("animals");','animal stage');
  replace('updateGame(t, dt); updateAim(t); updateFarmerIdle(t, dt);','updateGame(t, dt); updateAim(t); updateFarmerIdle(t, dt); window.__bench.mark("gameAimFarmer");','game stage');
  replace('if (perf) perf.render(); else composer.render();','window.__bench.mark("world"); window.__bench.gpuBegin(renderer); if (perf) perf.render(); else composer.render(); window.__bench.gpuEnd(); window.__bench.mark("renderSubmit");','full composer GPU');
  replace('if (photoWant) takePhoto();','if (photoWant) takePhoto(); window.__bench.end(renderer);','CPU end');
  const fixture=`G.opts.quiet=true; G.S.nextEventAt=G.S.nextVisitorAt=G.S.nextRushAt=9e15;
for (const [kind,p] of Object.entries(G.S.pens)) p.meta=p.list.map((_,i)=>({name:G.NAMES[kind][i],love:50,loveAt:Date.now(),petAt:0,brushAt:0,playAt:0}));
window.__fixtureStateBefore=JSON.stringify(G.S);
`;
  let install='let homesteadStudy=null;\n'+fixture;
  if(variant==='after'){
    replace('const HOME = new THREE.Vector2(1, 3), ROAM = 19;','const HOME = new THREE.Vector2(1, 3), ROAM = 60;','isolated fixture roam domain');
    install+=`homesteadStudy=(await import('./previews/homestead-study/scene-study.js')).createStudy({THREE,scene,renderer,M,std,box,beam,gable,mergeStatic,makeTree,contact,G,barn,ground,GRASS,clearGrass,PENS,PEN_LIST,FIELD_SLOTS,FIELD_BLOCKS,BLOCKS,OBST,BUILD_SPOT,HOME_SPOT,BLD_BLK,BLD_DECAL,fenceSegs,plots,oldStatic:[tree,tree2,silo,trough,henWater,petBowl,lampPost,...fences,...bushes,...hills]});
homesteadStudy.prepare(); makeWorkshop=homesteadStudy.workshop;
PRESETS.noon.cover=.30;
`;
  }
  install+='window.__fixtureStateAfter=JSON.stringify(G.S); window.__seedReset();\n';
  replace('bootStep("putting your farm in place");\nGV.refresh("all");','bootStep("putting your farm in place");\n'+install+'GV.refresh("all");','shared synthetic fixture and study installation');
  if(variant==='after')replace('for (const [x, z, hw, hd] of BLOCKS.slice(OBST_BLOCKS)) OBST.push({x, z, hw, hd, c:1, s:0});','// study prepares complete synthetic obstacles once; skip old suffix append','avoid duplicate fixture obstacles');
  replace('installWorld(scene, renderer);','installWorld(scene, renderer);\nif(homesteadStudy)homesteadStudy.finish();','preview presentation finalization');
  return {page,receipt:{variant,baseSourceSha256:crypto.createHash('sha256').update(source).digest('hex'),servedSourceSha256:crypto.createHash('sha256').update(page).digest('hex'),patches}};
};
