// Actual owned actors and original Beast.think/update in the real rendered game.
// Test-owned cooldown/needs isolate ordinary recovery; no native input claim.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const {start,artifacts,root}=require('../../../browser-harness.cjs');
const prior=JSON.parse(fs.readFileSync(path.join(__dirname,'../task7-codex-cow-validator-20261023/browser-final/results.json')));
const saved=prior.steps.find(x=>x.value.initialSave).value.initialSave,file=path.join(artifacts,'results.json');
if(fs.existsSync(file))throw Error('Preserve earlier evidence');
const report={status:'RUNNING',utc:new Date().toISOString(),base:'0f0d0562fdec3216da2130852441771bcd7d6552',input:'Actual owned actors; debug API, daylight/low needs/cooldown fixtures; original think and update. Local pinned browser, no native/device/hosted claim.',indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'farm3d/index.html'))).digest('hex'),cases:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');let h,stage='launch';save();
(async()=>{try{
  h=await start({deviceScaleFactor:1});
  for(const hz of [30,60,120]){
    const s=await h.setup({width:1280,height:720},false,'recovery-'+hz),p=s.page;report.browser=s.context.browser().version();
    await p.addInitScript(saved=>{Date.now=()=>1792594800000;localStorage.setItem('sa3d-guest','1');localStorage.setItem('sa3d-seen','1');localStorage.setItem('sunny-acres-3d-v1',saved);},saved);
    await p.goto(h.base+'farm3d/?debug&portrait&shot&sim=0&preset=noon');
    await p.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
    stage='Apply custom identity records '+hz;
    const applied=await p.evaluate(async()=>{const d=__dbg,e=d.penEditor,herd=d.animals.slice(),paid=()=>{const s=structuredClone(d.G.S);delete s.v;if(s.layout)delete s.layout.animalPens;return s;};d.G.tick();const before=paid();e.begin('cow');for(const kind of ['chicken','cow','horse','sheep'])if(!e.dispatch({type:'movePen',kind,delta:[0,0]}))throw Error('Identity command refused');const valid=await e.validateNow(),snapshot=e.snapshot(),ok=await e.apply();return{valid,ok,reason:snapshot.reason,count:d.animals.length,sameHerd:d.animals.every(a=>herd.includes(a)),paidBefore:before,paidAfter:paid()};});
    const row={hz,applied};report.cases.push(row);save();assert(applied.valid,applied.reason);assert(applied.ok);assert.equal(applied.count,46);assert(applied.sameHerd);assert.deepEqual(applied.paidAfter,applied.paidBefore);
    stage='owned ordinary recovery '+hz;
    row.recovery=await p.evaluate(async hz=>{
      const d=__dbg,{pointInPolygon,segmentInPolygon}=await import('/farm3d/animal-pen-geometry.js?v=1');
      const reservations=()=>({cow:d.cowStations.snapshot(),remaining:d.remainingCare.snapshotLayout().tokens,chicken:d.chickenCare.snapshotLayout().tokens,lanes:d.chickenCare.snapshotLayout().lanes});
      const rows=[];
      for(const kind of ['chicken','horse','sheep','cow']){
        const site=d.penRuntime.layout.sites[kind],a=d.animals.find(a=>a.kind===kind&&!a.chickenTask&&!a.remainingTask&&!a.cowTask&&pointInPolygon([a.g.position.x,a.g.position.z],site.polygon,a.S.r+.7));
        if(!a)throw Error('No naturally placed free ordinary-eligible owned '+kind);
        const start=d.clock(),until=start+.5,before=a.g.position.toArray(),beforeReservations=reservations(),gate=site.gates[0],frames=[],decisions=[],originalThink=a.think;
        a.mode='fair';a.need={hunger:0,tired:0,lonely:0};a.until=until;
        a.remainingMealAt=a.remainingDrinkAt=a.remainingNapAt=a.chickenMealAt=a.chickenDrinkAt=a.cowDrinkAt=Infinity;
        a.go(gate.outside[0],gate.outside[2],false,'Refused ordinary gate destination','look');
        const immediate={act:a.act,target:a.target?.toArray()??null,path:a.path?.map(p=>p.toArray()),until:a.until,position:a.g.position.toArray(),reservations:reservations()};
        a.think=function(){const value=originalThink.call(this);decisions.push({t:d.clock(),act:this.act,target:this.target?.toArray()??null,label:this.label,task:this.chickenTask?.kind??this.remainingTask?.kind??this.cowTask?.kind??null});return value;};
        try{for(let i=1;i<=2*hz;i++){
          const old=a.g.position.toArray(),t=start+i/hz;d.setClock(t);a.update(1/hz,t);
          frames.push({t,position:a.g.position.toArray(),act:a.act,target:a.target?.toArray()??null,until:a.until,inside:pointInPolygon([a.g.position.x,a.g.position.z],site.polygon),containedStep:segmentInPolygon([old[0],old[2]],[a.g.position.x,a.g.position.z],site.polygon,a.S.r+.05),step:a.g.position.distanceTo({x:old[0],y:old[1],z:old[2]})});
        }}finally{delete a.think;}
        rows.push({kind,ref:a.ref,start,until,before,beforeReservations,immediate,decisions,frames,afterReservations:reservations()});
        if(kind==='horse'){d.camera.position.set(a.g.position.x+8,5,a.g.position.z+8);d.camera.lookAt(a.g.position.x,1,a.g.position.z);d.renderScene();}
      }
      return rows;
    },hz);save();
    for(const r of row.recovery){
      assert.equal(r.immediate.act,'idle',r.kind+' failed route did not recover');assert.equal(r.immediate.target,null);assert.deepEqual(r.immediate.path,[]);assert.equal(r.immediate.until,r.until);assert.deepEqual(r.immediate.position,r.before);assert.deepEqual(r.immediate.reservations,r.beforeReservations);
      const waiting=r.frames.filter(f=>f.t<=r.until);assert(waiting.length>0);assert(waiting.every(f=>f.until===r.until&&f.act==='idle'&&f.target===null&&f.step===0),r.kind+' cooldown did not hold');
      assert(r.decisions.length>0,r.kind+' never called original think');assert(r.decisions.every(x=>x.t>r.until),r.kind+' thought before cooldown');assert(r.decisions.some(x=>x.label!=='Refused ordinary gate destination'),r.kind+' did not choose another action');
      assert(r.frames.every(f=>f.inside&&f.containedStep),r.kind+' left physical pen');
      assert(r.frames.every(f=>f.act!=='moving'||f.target!==null),r.kind+' targetless moving recurred');
    }
    assert.deepEqual(s.errors,[]);await p.screenshot({path:path.join(artifacts,'actual-owned-recovery-'+hz+'.png')});await s.finish();
  }
  report.status='PASS';
}catch(e){report.status='FAIL';report.stage=stage;report.error=String(e.stack||e);console.error(report.error);}
finally{report.finishedUtc=new Date().toISOString();save();if(h)await h.close(report.status!=='PASS');console.log(JSON.stringify({status:report.status,stage,file}));process.exitCode=report.status==='PASS'?0:1;}})();
