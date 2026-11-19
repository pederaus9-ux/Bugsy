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
const candidate='ab69da0bf2bf0dbd0819aa0118b2b21303c02a48';
const lane=process.argv[2];
assert(['base','candidate'].includes(lane)&&process.argv.length===3,'expected base or candidate lane');
const source=lane==='base'?base:candidate;
const traceFile=path.join(process.env.TEST_ARTIFACTS,'cow-night-boundary-trace.json');
let traceReport=null;
const file=path.join(process.env.TEST_ARTIFACTS,'cow-distribution.json');
const report={schema:1,cases:[]};
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

// Private in-page aggregate only. Runtime update ordering and RNG are unchanged.
function makeNightTrace(d,s) {
  const layout=d.cowYard.layout, gate=layout.gate, access=layout.access, poly=s.poly;
  if(poly.length!==4||s.active.length!==5||s.active.some((a,i)=>a.pen.custom||a.ref.i!==i)||!Array.isArray(gate)||gate.length!==2||!gate.every(Number.isFinite)||gate[0]>=gate[1])throw Error('stock trace fixture refused');
  const edges=poly.map(([x,z],i)=>{
    const [bx,bz]=poly[(i+1)%4], dx=bx-x,dz=bz-z,L=Math.hypot(dx,dz);
    if(!(L>0))throw Error('trace edge refused');
    return {x,z,dx,dz,L};
  });
  const depth=(e,x,z)=>(e.dx*(z-e.z)-e.dz*(x-e.x))/e.L;
  if(edges.some(e=>poly.some(([x,z])=>depth(e,x,z)<-1e-8)))throw Error('nonconvex trace fixture');
  const openingZ=Math.max(...poly.map(p=>p[1]));
  if(!Array.isArray(access)||access.length!==4||access[0]!==gate[0]||access[1]!==gate[1]||Math.abs(access[2]-openingZ)>1e-8)throw Error('stock gate geometry refused');
  const nearestOpening=(x,z)=>Math.hypot(x-Math.max(gate[0],Math.min(gate[1],x)),z-openingZ);
  const rows=s.active.map((_,cow)=>({cow,outsideFrames:0,intervals:0,nightMinMm:null,nativeSamples:0,first:null,last:null,worst:null}));
  const live=rows.map(()=>null), minima=rows.map(()=>Infinity), intervalMin=rows.map(()=>Infinity), worst=rows.map(()=>Infinity);
  const enumId=(v,known)=>v==null?0:known.includes(v)?known.indexOf(v)+1:known.length+1;
  const mm=n=>{if(!Number.isFinite(n)||Math.abs(n)>256)throw Error('trace range refused');return Math.round(n*1000);};
  return {rows,observe(a,frame,ox,oz,native){
    const i=a.ref.i, {x,z}=a.g.position;
    let dep=Infinity, edge=-1;
    for(const [j,e] of edges.entries()){const p=depth(e,x,z);if(p<dep){dep=p;edge=j;}}
    const outside=dep<-.05;
    if(outside===d.inPen(a.pen,x,z,-.05)||edge<0)throw Error('trace geometry differs from native threshold');
    if(native&&!outside)throw Error('trace sample count mismatch');
    if(native)rows[i].nativeSamples++;
    if(dep<minima[i]){minima[i]=dep;rows[i].nightMinMm=mm(dep);}
    if(!outside&&!live[i])return;
    const e=edges[edge];
    const normal=(dx,dz)=>(e.dx*dz-e.dz*dx)/e.L;
    const toward=p=>p==null?null:mm(normal(p.x-x,p.y-z));
    const job=a.cowTask;
    const target=job?.path?.[0]??a.target;
    const pathTail=job?.path?.at(-1)??a.path?.at(-1);
    const nearestPeer=Math.min(...s.active.filter(b=>b!==a).map(b=>Math.hypot(x-b.g.position.x,z-b.g.position.z)));
    const sample=[frame,edge,mm(dep),mm(nearestOpening(x,z)),
      enumId(job?.kind,['bed','feed','drink','robot']),enumId(job?.stage,['approach','stand','exit','align','hold']),
      enumId(a.act,['idle','moving','sleeping','resting','eating','fleeing','playing']),
      enumId(a.doing,['social','eat','drink','rest','sleep','shelter','chase','look','bait']),
      toward(target),toward(pathTail),mm(normal(x-ox,z-oz)),mm(nearestPeer),x>=gate[0]&&x<=gate[1]?1:0];
    const row=rows[i];
    if(!outside){live[i].recovery=sample;live[i]=null;return;}
    row.outsideFrames++;
    if(!live[i]){
      live[i]={start:sample,end:sample,peak:sample,recovery:null};
      row.intervals++;
      row.first??=live[i];row.last=live[i];
      intervalMin[i]=Infinity;
    }
    live[i].end=sample;
    if(dep<intervalMin[i]){intervalMin[i]=dep;live[i].peak=sample;}
    if(dep<worst[i]){worst[i]=dep;row.worst=live[i];}
  }};
}

async function observe(page,phase,night,secs,trace=false) {
  await page.evaluate(({phase,night,trace})=>{
    const d=__dbg,s=window.__cowDistribution;
    if(night!==s.night)d.setPreset(night?'night':'noon');
    s.phase=phase;s.night=night;
    s.observer=window.__makeDistributionObserver({polygon:s.poly,projectX:s.projectX});
    s.observer.sample(s.active,0,night);
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

async function main() {
  for (const seed of [1,4242]) {
    const h=await start({ref:source,deviceScaleFactor:.5,gameplaySeed:seed});
    try {
      for (const fixture of fixtureCases) {
        const row={seed,...fixture,status:'setup-refused',counters:[]};
        const s=await h.setup({width:844,height:390},false,'cow-distribution-unused');
        try {
          const prepared=await setup(s.page,h.base,{...fixture,seed});
          if(prepared.edit)row.counters.push(...Object.entries(prepared.edit));
          if (prepared.accepted) {
            row.counters.push(['initialLowX',prepared.initialLowX]);
            const tracked=seed===4242&&fixture.herd===5&&fixture.layout==='default';
            if(tracked)await s.page.addScriptTag({content:'window.__makeNightTrace=('+makeNightTrace.toString()+');'});
            for(const [phase,night,secs] of phases)row.counters.push(...await observe(s.page,phase,night,secs,tracked&&phase==='night2'));
            if(tracked){
              const trace=await s.page.evaluate(()=>({frames:window.__cowDistribution.totals.frames,cows:window.__cowDistribution.boundary.rows}));
              const counters=new Map(row.counters);
              const phaseSamples=phases.map(([phase])=>counters.get(phase+'/containmentViolations'));
              assert.equal(trace.cows.reduce((sum,c)=>sum+c.nativeSamples,0),phaseSamples.at(-1),'night trace must retain original native aggregate');
              traceReport={schema:1,source,phaseSamples,frames:trace.frames,thresholdMm:-50,edgeCount:4,cows:trace.cows};
            }
            row.status='pass';
          }
          assert.equal(s.errors.length,0,'browser had errors');
          report.cases.push(row);
        } finally {
          // Reuse the existing secure server/browser teardown without writing
          // its default screenshot: the page is already closed in every case.
          await s.page.close();
        }
      }
    } finally { await h.close(); }
  }
  assert(traceReport,'expected target trace');
  fs.writeFileSync(traceFile,JSON.stringify(traceReport)+'\n',{mode:0o600,flag:'wx'});
  fs.writeFileSync(file,JSON.stringify(report)+'\n',{mode:0o600,flag:'wx'});
}
// A54_SUPPLEMENTAL_BEGIN: observation only; never substitutes for 120s qualification.
async function supplementalMain(){
  const sources={main:base,social:'39eac9ba486fa3929f6d1c238b0be86ba9da6220',fix:candidate};
  const label=process.env.A54_SUPPLEMENTAL_SOURCE;
  assert(Object.hasOwn(sources,label),'exact supplemental source required');
  const result={schema:1,source:sources[label],label,cases:[]};
  for(const [seed,target] of [[1,'night1'],[4242,'night2']]){
    // Each continuation gets a fresh deterministic guest, never modifies/reuses
    // the earlier 120s experiment or extends night1 before replaying day2.
    const h=await start({ref:sources[label],deviceScaleFactor:.5,gameplaySeed:seed});
    try{
      const s=await h.setup({width:844,height:390},false,'cow-supplement-unused');
      try{
        const prepared=await setup(s.page,h.base,{herd:5,layout:'default',seed});
        assert(prepared.accepted,'stock supplemental fixture refused');
        const prior=[];
        for(const [phase,night,secs] of phases){
          if(phase===target)break;
          prior.push(...await observe(s.page,phase,night,secs));
        }
        const priorSha256=require('node:crypto').createHash('sha256').update(JSON.stringify(prior.filter(([k])=>!['physicalBedArrivals','containmentOutsideFrames','bedHoldAwayFrames'].includes(k.split('/')[1])))).digest('hex');
        await s.page.evaluate(()=>{
          const d=__dbg,s=window.__cowDistribution;
          if(s.night)throw Error('target night must follow original day');
          d.setPreset('night');s.night=true;
          s.extended={frames:0,rows:s.active.map((a,i)=>({cow:i,firstArrival:0,outsideFrames:0,holdAwayFrames:0,movingFrames:0,progressFrames:0,stationaryApproachFrames:0,maxStationaryFrames:0,streak:0,checkpoints:[]}))};
        });
        for(let offset=0;offset<15000;offset+=300){
          await s.page.evaluate(()=>{
            const d=__dbg,s=window.__cowDistribution,e=s.extended,dt=1/30;
            let t=d.clock();
            for(let n=0;n<300;n++){
              t+=dt;d.setClock(t);e.frames++;
              for(const [i,a] of s.active.entries()){
                const before=a.cowTask,oldDock=before?.station?.dock;
                const ox=a.g.position.x,oy=a.g.position.y,oz=a.g.position.z;
                const oldGap=oldDock?Math.hypot(ox-oldDock[0],oy-oldDock[1],oz-oldDock[2]):null;
                a.update(dt,t);
                const {x,y,z}=a.g.position,task=a.cowTask,dock=task?.station?.dock,r=e.rows[i];
                if(![x,y,z].every(Number.isFinite))throw Error('nonfinite supplemental position');
                const outside=!d.inPen(a.pen,x,z,-.05);
                if(outside)r.outsideFrames++;
                const moved=Math.hypot(x-ox,y-oy,z-oz)>1e-6;
                if(moved)r.movingFrames++;
                const gap=dock?Math.hypot(x-dock[0],y-dock[1],z-dock[2]):null;
                if(gap!==null&&(!Number.isFinite(gap)||gap>256))throw Error('supplemental gap range');
                if(task?.kind==='bed'&&task===before&&dock===oldDock&&gap!==null&&oldGap-gap>1e-6)r.progressFrames++;
                const approach=task?.kind==='bed'&&task.stage==='approach';
                if(approach&&!moved){r.stationaryApproachFrames++;r.streak++;r.maxStationaryFrames=Math.max(r.maxStationaryFrames,r.streak);}else r.streak=0;
                const matches=task?.kind==='bed'?d.cowStations.snapshot().filter(q=>q.stationId===task.station.id):[];
                const reserved=matches.length===1&&matches[0].animalId===d.cowStatus.cows[a.ref.i]?.id&&
                  matches[0].generation===task.token?.generation&&task.token?.stationId===task.station.id&&
                  s.active.filter(b=>b.cowTask?.station?.id===task.station.id).length===1;
                const reservationArrived=reserved&&matches[0].arrived===true;
                const hold=task?.kind==='bed'&&task.stage==='hold'&&task.weight>=1-1e-6;
                const physical=hold&&reservationArrived&&gap!==null&&gap<=.05&&!outside;
                if(physical&&!r.firstArrival)r.firstArrival=e.frames;
                if(hold&&!physical)r.holdAwayFrames++;
                if([3600,7200,10800,15000].includes(e.frames)){
                  const stage=task?(['approach','align','hold','stand','exit'].indexOf(task.stage)+1||6):0;
                  r.checkpoints.push({frame:e.frames,stage:stage||0,bed:task?.kind==='bed'?1:0,reserved:reserved?1:0,reservationArrived:reservationArrived?1:0,hold:hold?1:0,physical:physical?1:0,gapMm:gap===null?null:Math.round(gap*1000),firstArrival:r.firstArrival,outsideFrames:r.outsideFrames,holdAwayFrames:r.holdAwayFrames,movingFrames:r.movingFrames,progressFrames:r.progressFrames,stationaryApproachFrames:r.stationaryApproachFrames,maxStationaryFrames:r.maxStationaryFrames});
                }
              }
            }
          });
        }
        const cows=await s.page.evaluate(()=>window.__cowDistribution.extended.rows.map(r=>({cow:r.cow,checkpoints:r.checkpoints})));
        assert.equal(s.errors.length,0,'supplemental browser errors');
        result.cases.push({seed,night:target,herd:5,layout:'default',priorSha256,cows});
      }finally{await s.page.close();}
    }finally{await h.close();}
  }
  fs.writeFileSync(path.join(process.env.TEST_ARTIFACTS,'cow-bed-supplement.json'),JSON.stringify(result)+'\n',{mode:0o600,flag:'wx'});
}
// A54_SUPPLEMENTAL_END
assert(process.env.A54_SUPPLEMENTAL===undefined||process.env.A54_SUPPLEMENTAL==='1','invalid supplemental mode');
(process.env.A54_SUPPLEMENTAL==='1'?supplementalMain:main)().catch(()=>{console.error('cow-distribution diagnostic failed before finite export');process.exitCode=1;});
