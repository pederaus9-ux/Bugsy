'use strict';
// Bounded observer of the shipped Beast.update path in an offline, disposable
// guest. No saved farm is loaded and no animal decision is intercepted.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {topologySafe,capabilityStateSafe}=require('./helpers/ci-isolated-runner.cjs');
const read=p=>fs.readFileSync(p,'utf8');
// Defense in depth: the workflow's reviewed runner is still required to
// establish and attest separate kernel namespaces and non-egress probes.
assert(topologySafe(os.networkInterfaces(),read('/proc/net/route'),read('/proc/net/ipv6_route')),'local-only network namespace required');
assert(capabilityStateSafe(read('/proc/self/status')),'restricted capability state required');
assert(path.isAbsolute(process.env.TEST_ARTIFACTS||''),'private artifact directory required');
const {start}=require('./browser-harness.cjs');
const {makeObserver}=require('./helpers/cow-distribution-observer.cjs');
const base='9e6f2763dd7781b761ccaef2f2cfa680d57b4783';
const candidate='ba02621a9d9805c4fcf9d017be5921e2955fa517';
assert(/^[a-f0-9]{40}$/.test(candidate),'candidate fixture tree not pinned');
const lane=process.argv[2];
assert(['base','candidate'].includes(lane)&&process.argv.length===3,'expected qualification lane');
const source=lane==='base'?base:candidate;
const file=path.join(process.env.TEST_ARTIFACTS,'daytime-mirror-qualification.json');
const report={schema:1,source,lane,cases:[]};
const fixtureCases=[{herd:2,layout:'default'},{herd:5,layout:'default'},{herd:5,layout:'moved'}];
const phases=[['early',false,40],['day1',false,200],['night1',true,120],['day2',false,240],['night2',true,120]];
const hz=30;

async function setup(page,base,{herd,layout,seed}) {
  await page.addInitScript(()=>{
    Date.now=()=>1792594800000;
    localStorage.setItem('sa3d-guest','1');
    localStorage.setItem('sa3d-seen','1');
  });
  await page.goto(base+'farm3d/?debug&portrait&shot&sim=0&preset=noon',{timeout:45000});
  await page.waitForFunction(()=>window.__done&&window.__dbg&&!document.getElementById('loading'),null,{timeout:120000});
  await page.addScriptTag({content:'window.__makeDistributionObserver=('+makeObserver.toString()+');'});
  return page.evaluate(async ({herd,layout,seed})=>{
    const d=__dbg,G=d.G,t=Date.now();
    const q=new URLSearchParams(location.search);
    if(!q.has('debug')||!q.has('shot')||q.get('sim')!=='0'||q.get('preset')!=='noon'||window.__done!==true)throw Error('controlled fixture flags refused');
    if(d.animals.length!==0||d.cowStations.snapshot().length||d.cowStatus?.job||d.penEditor.snapshot().open||window.__testGameplaySeed?.calls!==0)throw Error('initial process fixture refused');
    d.setClock(0);
    G.close(); G.S.tut=99; G.S.level=20; G.S.coins=9000; G.S.event=null;
    G.S.nextEventAt=G.S.nextRushAt=G.S.nextVisitorAt=9e15;
    G.S.pets=[];
    for(const kind of ['chicken','horse','sheep']) if(G.S.pens[kind]) G.S.pens[kind].owned=false;
    G.S.pens.cow={...(G.S.pens.cow||{}),owned:true,list:Array(herd).fill(0),meta:Array.from({length:herd},(_,i)=>({name:'Test Cow '+i,love:50,loveAt:t,petAt:0,brushAt:0,playAt:0}))};
    G.view.refresh('all');
    const cows=d.animals.filter(a=>a.kind==='cow'&&!a.gone);
    if(cows.length!==herd||d.animals.length!==herd||!d.cowYardActive||!d.cowStatus||d.cowStatus.job||d.cowStatus.feed>0||d.cowStatus.waterUntil>t||d.cowStatus.cows.some(c=>c.feedCharged))throw Error('herd fixture refused');
    const rng=window.__testGameplaySeed;
    if(rng?.value!==seed||rng.firstCall!==seed*16807/2147483647||rng.calls<herd*4)throw Error('RNG witness refused');
    const original=cows[0].pen.poly.map(p=>p.slice());
    let moved=false;
    const edit={editAttempts:0,editDispatched:0,editValidated:0,editApplied:0,editChoice:0,editStage:0,editKind:0,editIssueMask:0};
    if(layout==='moved'){
      // Save only into this disposable guest profile. Refusal is a reported
      // setup limitation, not ordinary-behavior evidence.
      if(!G.save())throw Error('fixture save refused');
      const {defaultSiteRecord,resolveAnimalPens}=await import('./animal-pen-layout.js?v=1');
      const defaultRecord=defaultSiteRecord('cow');
      const v=defaultRecord.boundary[1];
      // Controls 1–3 are the original unsuccessful whole-pen candidates.
      // Control 9 is the existing cow-runtime fixture's +3 X vertex expansion.
      // These are tested against the actual guest world, not granted approval
      // by the earlier fixture. Never install an invalid candidate directly.
      const commands=[
        [-1,0],[0,-1],[1,0],[0,1],[-2,0],[2,0],[0,-2],[0,2],
      ].map(delta=>({type:'movePen',kind:'cow',delta}));
      commands.push(...[3,1,2].map(dx=>({type:'moveVertex',kind:'cow',id:v.id,to:[Math.round(v.x+dx),Math.round(v.z)]})));
      const bits={LAND:1,OVERLAP:2,PATH:4,SUPPORT:8,ROUTE:16,STAGING:32,ROAMING:64};
      for(const [i,command] of commands.entries()){
        const e=d.penEditor;
        edit.editAttempts++;
        edit.editStage=1;
        if(!e.begin('cow'))break;
        edit.editStage=2;
        if(e.dispatch(command)){
          edit.editDispatched++;
          edit.editStage=3;
          if(await e.validateNow()){
            edit.editValidated++;
            const preview=e.snapshot();
            if(!preview.canApply)throw Error('validated draft not applicable');
            const expected=structuredClone(preview.draft);
            expected.revision++;
            edit.editStage=4;
            if(await e.apply()){
              const saved=G.S.layout.animalPens;
              const solved=resolveAnimalPens(expected).sites.cow;
              if(JSON.stringify(saved)!==JSON.stringify(expected)||saved.revision!==1||d.penRuntime.revision!==saved.revision||
                JSON.stringify(d.penRuntime.layout.sites.cow.polygon)!==JSON.stringify(solved.polygon))throw Error('saved or installed revision did not match validated draft');
              edit.editApplied=1;
              edit.editChoice=i+1;
              edit.editKind=command.type==='movePen'?1:2;
              edit.editStage=5;
              moved=true;
              break;
            }
          }
          for(const issue of e.snapshot().validation?.issues||[])edit.editIssueMask|=(Object.hasOwn(bits,issue.code)?bits[issue.code]:128);
        }
        e.cancel();
      }
      if(!moved)return {accepted:false,edit};
    }
    const active=d.animals;
    const poly=active[0]?.pen?.poly;
    if(active.length!==herd||active.some(a=>a.kind!=='cow'||a.pen?.poly!==poly)||!poly||poly.length<3||!d.cowYardActive)throw Error('installed pen fixture refused');
    if(moved&&(!active[0].pen.custom||JSON.stringify(poly)===JSON.stringify(original)||!active.every(a=>d.inPen(a.pen,a.g.position.x,a.g.position.z,-.05))))throw Error('moved geometry witness refused');
    if(!moved&&active[0].pen.custom)throw Error('default layout unexpectedly custom');
    d.camera.updateMatrixWorld(true);
    const camera=d.camera.clone(), v=active[0].g.position.clone();
    const projectX=(x,z)=>v.set(x,0,z).project(camera).x;
    const xs=poly.map(p=>p[0]), mid=(Math.min(...xs)+Math.max(...xs))/2;
    const half=x=>x<mid-1?-1:x>mid+1?1:0;
    window.__cowDistribution={active,poly,projectX,half,phase:null,night:false,observer:null,travel:null,totals:null};
    return {accepted:true,edit:layout==='moved'?edit:null,initialLowX:active.filter(a=>a.g.position.x<mid).length};
  },{herd,layout,seed});
}

async function observe(page,phase,night,secs,trace=false) {
  await page.evaluate(({phase,night,trace})=>{
    const d=__dbg,s=window.__cowDistribution;
    if(night!==s.night)d.setPreset(night?'night':'noon');
    s.phase=phase;s.night=night;
    s.meetings.begin(phase);
    s.observer=window.__makeDistributionObserver({polygon:s.poly,projectX:s.projectX});
    s.observer.sample(s.active,0,night);
    s.meetings.sample();
    s.travel=new WeakMap();
    s.bedArrived=new Set();
    s.boundary=trace?window.__makeNightTrace(d,s):null;
    s.totals={ordinaryLowToHigh:0,ordinaryHighToLow:0,socialSelected:0,socialPlanned:0,socialAbandoned:0,socialUnresolved:0,containmentViolations:0,containmentOutsideFrames:0,physicalBedArrivals:0,bedHoldAwayFrames:0,frames:0};
  },{phase,night,trace});
  for(let frames=secs*hz;frames>0;frames-=300) {
    await page.evaluate(({frames,hz})=>{
      const d=__dbg,s=window.__cowDistribution, dt=1/hz;
      let t=d.clock();
      for(let n=0;n<frames;n++){
        t+=dt; d.setClock(t);
        for(const a of s.active){
          const visiting=()=>!a.cowTask&&a.doing==='social'&&a.label?.startsWith('Visiting ');
          const wasVisiting=visiting(), wasTarget=!!a.target;
          const ox=s.boundary?a.g.position.x:0, oz=s.boundary?a.g.position.z:0;
          a.update(dt,t);
          const visit=visiting(), hasTarget=!!a.target;
          if(visit&&!wasVisiting){s.totals.socialSelected++;if(hasTarget)s.totals.socialPlanned++;}
          if(wasVisiting&&wasTarget&&!hasTarget&&a.doing==='social')s.totals.socialAbandoned++;
          const {x,z}=a.g.position;
          if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('nonfinite position');
          const outside=!d.inPen(a.pen,x,z,-.05);
          const bad=n%hz===0&&outside;
          if(outside)s.totals.containmentOutsideFrames++;
          // A sleep label is not arrival: check the real station dock after update.
          const bed=a.cowTask;
          if(s.night&&bed?.kind==='bed'&&bed.stage==='hold'&&bed.weight>=1-1e-6){
            const dock=bed.station?.dock;
            if(!Array.isArray(dock)||dock.length!==3||!dock.every(Number.isFinite))throw Error('invalid bed dock');
            const reservation=d.cowStations.snapshot().filter(r=>r.stationId===bed.station.id);
            const valid=reservation.length===1&&reservation[0].arrived===true&&
              reservation[0].animalId===d.cowStatus.cows[a.ref.i]?.id&&
              reservation[0].generation===bed.token?.generation&&bed.token?.stationId===bed.station.id&&
              s.active.filter(b=>b.cowTask?.station?.id===bed.station.id).length===1;
            const arrived=valid&&Math.hypot(x-dock[0],a.g.position.y-dock[1],z-dock[2])<=.05&&!outside;
            if(arrived)s.bedArrived.add(a);
            else s.totals.bedHoldAwayFrames++;
          }
          if(bad)s.totals.containmentViolations++;
          s.boundary?.observe(a,s.totals.frames+1,ox,oz,bad);
          const ordinary=!s.night&&!a.cowTask&&!['eat','drink','sleep','shelter'].includes(a.doing)&&!['eating','sleeping','resting','fleeing'].includes(a.act);
          if(!ordinary){s.travel.delete(a);continue;}
          const prior=s.travel.get(a), side=s.half(x);
          if(side) {
            if(prior&&side!==prior) s.totals[side>0?'ordinaryLowToHigh':'ordinaryHighToLow']++;
            s.travel.set(a,side);
          }
        }
        s.observer.sample(s.active,dt,s.night);
        s.meetings.sample();
        s.totals.frames++;
      }
    },{frames:Math.min(frames,300),hz});
  }
  return page.evaluate(()=>{
    const s=window.__cowDistribution;
    s.totals.physicalBedArrivals=s.bedArrived.size;
    s.totals.socialUnresolved=s.active.filter(a=>a.doing==='social'&&a.target).length;
    return [...Object.entries(s.totals),...Object.entries(s.observer.tally)].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[s.phase+'/'+k,Math.round(v*1e6)/1e6]);
  });
}

function installMeetingLedger(s){
 const make=()=>({attempts:0,repeatedBeforeConfirmation:0,confirmed:0,confirmedAttempt:0,unmatchedConfirmation:0,worldL:0,worldR:0,screenL:0,screenR:0});
 let prior=new WeakMap(),phase=null;
 const attempts=new WeakMap(),directed=new Set(),pairs=new Set(),world={L:new Set(),R:new Set()},screen={L:new Set(),R:new Set()},totals=make();
 const xs=s.poly.map(p=>p[0]),zs=s.poly.map(p=>p[1]),mid=(Math.min(...xs)+Math.max(...xs))/2,screenMid=s.projectX(mid,(Math.min(...zs)+Math.max(...zs))/2);
 const wrappers=[];
 for(const a of s.active){
  const go=a.go;
  if(Object.hasOwn(a,'go')||typeof go!=='function')throw Error('unexpected meeting override');
  function observed(...args){
   if(!s.night&&args[4]==='social'&&typeof args[3]==='string'&&args[3].startsWith('Visiting ')&&!this.cowTask&&s.active.includes(this.friend)&&this.friend!==this&&this.friend.kind==='cow'){
    totals.attempts++;const old=attempts.get(this);
    if(old?.friend===this.friend&&!old.confirmed)totals.repeatedBeforeConfirmation++;
    attempts.set(this,{friend:this.friend,confirmed:false});
   }
   return Reflect.apply(go,this,args);
  }
  a.go=observed;wrappers.push([a,observed]);
 }
 return {
  begin(p){phase=p;prior=new WeakMap();},
  sample(){for(const [i,a] of s.active.entries()){
   const hanging=a.label?.startsWith('Hanging out with ')&&a.friend!=null,prev=prior.get(a),task=a.cowTask;
   if(!s.night&&hanging&&prev&&!prev.hanging&&prev.seeking===a.friend&&!task&&s.active.includes(a.friend)){
    const b=a.friend,gap=Math.hypot(a.g.position.x-b.g.position.x,a.g.position.z-b.g.position.z);
    if(gap<=2.5){
     totals.confirmed++;const pending=attempts.get(a);
     if(pending?.friend===b&&!pending.confirmed){totals.confirmedAttempt++;pending.confirmed=true;}else totals.unmatchedConfirmation++;
     const j=s.active.indexOf(b),pair=[Math.min(i,j),Math.max(i,j)].join(':');directed.add(i+':'+j);pairs.add(pair);
     const w=a.g.position.x>=mid?'R':'L',sc=s.projectX(a.g.position.x,a.g.position.z)>=screenMid?'R':'L';
     totals['world'+w]++;totals['screen'+sc]++;world[w].add(pair);screen[sc].add(pair);
    }
   }
   prior.set(a,{hanging:!!hanging,seeking:a.doing==='social'&&!task?a.friend:null});
  }},
  finish(){if(wrappers.some(([a,fn])=>a.go!==fn))throw Error('meeting wrapper replaced');return {...totals,distinctDirectedPairs:directed.size,distinctUnorderedPairs:pairs.size,repeatConfirmedPairs:totals.confirmed-pairs.size,worldDistinctL:world.L.size,worldDistinctR:world.R.size,screenDistinctL:screen.L.size,screenDistinctR:screen.R.size};}
 };
}
async function main(){
 for(const seed of [1,4242]){
  const h=await start({ref:source,deviceScaleFactor:.5,gameplaySeed:seed});
  try{for(const fixture of fixtureCases){
   const row={seed,...fixture,status:'setup-refused',counters:[],meetings:null};
   const s=await h.setup({width:844,height:390},false,'day-candidate-unused');
   try{
    const prepared=await setup(s.page,h.base,{...fixture,seed});
    if(prepared.edit)row.counters.push(...Object.entries(prepared.edit));
    if(prepared.accepted){
     row.counters.push(['initialLowX',prepared.initialLowX]);
     await s.page.addScriptTag({content:'window.__installMeetingLedger=('+installMeetingLedger.toString()+');'});
     await s.page.evaluate(()=>{const s=window.__cowDistribution;s.meetings=window.__installMeetingLedger(s);});
     for(const [phase,night,secs] of phases)row.counters.push(...await observe(s.page,phase,night,secs));
     row.meetings=await s.page.evaluate(()=>window.__cowDistribution.meetings.finish());row.status='pass';
    }
    assert.equal(s.errors.length,0,'candidate comparison browser errors');report.cases.push(row);
   }finally{await s.page.close();}
  }}finally{await h.close();}
 }
 fs.writeFileSync(file,JSON.stringify(report)+'\n',{mode:0o600,flag:'wx'});
}
main().catch(()=>{console.error('daytime mirror qualification failed before finite export');process.exitCode=1;});
