const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {start,artifacts}=require('./browser-harness.cjs');
const file=path.join(artifacts,'seed-probe.json');if(fs.existsSync(file))throw Error('Preserve previous seed probe');
const report={status:'RUNNING',cases:[]};const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));
(async()=>{try{
 for(const seed of [1,1,4242,null]){
  const h=await start({deviceScaleFactor:.5,...(seed===null?{}:{gameplaySeed:seed})});let s;
  try{s=await h.setup({width:844,height:390},false,'seed-'+(seed??'default')+'-'+report.cases.length);const p=s.page;await p.addInitScript(()=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');});await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});const observed=await p.evaluate(()=>{const d=__dbg,G=d.G;G.close();G.S.pens.chicken={...(G.S.pens.chicken||{}),owned:true,list:[0],meta:[{name:'Seed witness',love:50,loveAt:Date.now(),petAt:0,brushAt:0,playAt:0}]};G.view.refresh('all');return{marker:window.__testGameplaySeed??null,actors:d.animals.slice(0,8).map(a=>({kind:a.kind,phase:a.phase,hunger:a.need.hunger,tired:a.need.tired,lonely:a.need.lonely}))};});assert(observed.actors.length>0);if(seed!==null){assert.equal(observed.marker.value,seed);assert.equal(observed.marker.firstCall,seed*16807/2147483647);assert(observed.marker.calls>0);}else assert.equal(observed.marker,null);assert.deepEqual(s.errors,[]);report.cases.push({seed:seed??'unmodified-default',...observed});save();console.log('PASS seed '+(seed??'default')+' actors='+observed.actors.length);}finally{if(s)await s.finish();await h.close();}
 }
 assert.deepEqual(report.cases[0].actors,report.cases[1].actors,'same requested seed must reproduce initial animal state');
 assert.notDeepEqual(report.cases[0].actors,report.cases[2].actors,'seed 1 must change actual animal state');
 assert.deepEqual(report.cases[2].actors,report.cases[3].actors,'explicit 4242 must match unmodified production default');
 report.status='PASS';
}catch(error){report.status='FAIL';report.error=String(error.stack||error);console.error(report.error);}finally{save();process.exitCode=report.status==='PASS'?0:1;console.log(JSON.stringify({status:report.status,file}));}})();
