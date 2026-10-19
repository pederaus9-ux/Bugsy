const assert=require('node:assert/strict');

// Diagnostic-only served HTML. Never written into production index.html.
function instrumentSource(source){
 const replace=(from,to)=>{assert.equal(source.split(from).length,2,'unique diagnostic anchor: '+from);source=source.replace(from,to);};
 replace('function frame() {','function frame() { window.__handReturnObserver?.enter(); if(window.__handsCaptureHold){requestAnimationFrame(frame);return;}');
 replace('const dt = Math.min(.1, t - (frame.lastT ?? t)); frame.lastT = t; clockT = t;',
   'const dt = Math.min(.1, t - (frame.lastT ?? t)); window.__handReturnObserver?.begin(dt,t,t-(frame.lastT??t)); frame.lastT = t; clockT = t;');
 replace('updateHands(dt, t, tk); playerMotion.update(dt, t);',
   'updateHands(dt, t, tk); window.__handReturnObserver?.native(); playerMotion.update(dt, t); window.__handReturnObserver?.composed(punch,playerMotion.state);');
 return source;
}

// Serializable page function. It observes existing callbacks; it drives none.
function installHandObservation({nativeNeutral,neutral,capacity=256}){
 const w=window,d=w.__dbg,root=d.camera.getObjectByName('Authored first-person hands');
 const now=()=>performance.now(),q=()=>root.getObjectByName('R_finger1_0').quaternion.toArray();
 const diff=a=>Math.max(...a.map((n,i)=>Math.abs(n-neutral[i])));
 const updates=new Array(capacity),inputs=[],samples=[],polls=[],errors=[],listeners=[];
 let entries=0,total=0,completed=0,cursor=0,current=null,lastPoll=null;
 const started=now();
 const safe=fn=>(...args)=>{try{return fn(...args);}catch(e){if(errors.length<8)errors.push(String(e?.stack||e));}};
 const state=()=>({hidden:document.hidden,visibility:document.visibilityState,hold:!!w.__handsCaptureHold,visible:root.visible,clock:d.clock()});
 const observer={
  enter:safe(()=>{entries++;}),
  begin:safe((dt,t,rawDelta)=>{total++;current={id:total,beginAt:now(),dt,t,rawDelta,state:state()};}),
  native:safe(()=>{if(current)current.nativeQ=q();}),
  composed:safe((punch,motion)=>{
   if(!current)return;completed++;
   Object.assign(current,{composedAt:now(),composedQ:q(),rest:motion.rest,action:motion.action,
     punch:punch?{kind:punch.kind,authoredKind:punch.authoredKind,t:punch.t}:null});
   updates[cursor++%capacity]=current;current=null;
  }),
  sample:safe(value=>{samples.push({index:samples.length,at:now(),updateId:total,completedId:completed,q:value.slice(),state:state()});}),
  poll:safe(pass=>{
   const a=w.__authoredSamples;
   lastPoll={at:now(),totalUpdates:total,completedUpdates:completed,count:a.length,
    countGt5:a.length>5,departure:a.some(v=>diff(v)>.1),tail:a.slice(-3).every(v=>diff(v)<1e-6),pass};
   if(polls.length===16)polls.shift();polls.push(lastPoll);
  }),
  snapshot(){
   const observedAt=now(),live=q(),a=w.__authoredSamples;
   const click=inputs.find(e=>e.type==='click'&&e.trusted),history=updates.filter(Boolean).sort((a,b)=>a.id-b.id);
   return {observedAt,started,observation:'post-wait snapshot; not the exact timeout instant',
    nativeNeutral,neutral,liveQ:live,liveDiff:diff(live),state:state(),crop:d.G.S.plots[0].crop,
    counts:{entries,totalUpdates:total,completedUpdates:completed,updatesAtTrustedClick:click?.total??null,
     updatesAfterTrustedClick:click?total-click.total:null,samplesAtTrustedClick:click?.samples??null,
     sampleCount:a.length,capReached:a.length===71},
    history:{capacity,stored:history.length,dropped:Math.max(0,completed-capacity),firstRetainedId:history[0]?.id??null,updates:history},
    inputs,samples:a.map(v=>v.slice()),sampleMeta:samples,polls,lastPoll,
    errorCount:errors.length,errors};
  },
  stop(){for(const [type,fn] of listeners)document.getElementById('actBtn').removeEventListener(type,fn,true);delete w.__handReturnObserver;}
 };
 for(const type of ['pointerdown','mousedown','click']){
  const fn=safe(e=>{if(inputs.length<12)inputs.push({type,trusted:e.isTrusted,eventAt:e.timeStamp,at:now(),total,completed,samples:w.__authoredSamples?.length??0,button:document.getElementById('actBtn').textContent});});
  document.getElementById('actBtn').addEventListener(type,fn,true);listeners.push([type,fn]);
 }
 w.__handReturnObserver=observer;
}
module.exports={instrumentSource,installHandObservation};
