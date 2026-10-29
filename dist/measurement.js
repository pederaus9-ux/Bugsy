// Manual, local-only comparison. No network, storage, automatic UI, or game mutation.
export const LIMITS=Object.freeze({walkMs:30000,overheadMs:20000,totalMs:120000,maxSamples:4,maxFrames:16000});
export function createCollector(h,e){
 const report={schema:2,source:h.source,cache:h.cache,status:'IDLE',firstFailure:null,samples:[],totalMs:0,totalOverrunMs:0,collectionLimitReached:false,matchedPair:false,timerEnforcement:'cooperative JavaScript; elapsed time is not clamped',scope:'matchedPair means observed matched-view conditions only, not identical cow poses or continuous state proof; descriptive walking retained; no phone outcome assumed'};
 let active=null,at=0,lastAt=null,lastFrame=null,timer=null,raf=null,ended=false,originalHit=null,hooks=[];
 const signature=s=>JSON.stringify([s.position,s.yaw,s.pitch,s.pixels,s.pixelRatio,s.shadow,s.qualityCut,s.auto,s.quality]);
 const summary=()=>structuredClone({...report,samples:report.samples.map(({intervals,...p})=>({...p,frameCount:intervals?.length??p.frames?.count??0}))});
 const write=()=>h.publish(summary());
 const stateOK=s=>s.ready&&s.sandbox&&s.workerAbsent&&!s.account&&!s.guest&&!s.held&&!s.hidden&&s.auto&&s.quality==='auto'&&s.panel==='none';
 function restore(){let failed=false;if(originalHit){try{h.setHitAt(originalHit);}catch{failed=true;}originalHit=null;}for(const r of hooks){try{if(r.own)Object.defineProperty(r.card,'raycast',r.own);else delete r.card.raycast;}catch{failed=true;}}hooks=[];if(failed)throw Error('CLEANUP_FAILED');}
 function stop(reason='OWNER_STOP',failure=false){if(!active)return;const p=active;active=null;e.clearInterval(timer);e.cancelAnimationFrame(raf);p.durationMs=e.now()-at;p.deadlineOverrunMs=Math.max(0,p.durationMs-p.budgetMs);report.totalMs+=p.durationMs;report.totalOverrunMs=Math.max(0,report.totalMs-LIMITS.totalMs);report.collectionLimitReached=report.totalMs>=LIMITS.totalMs;p.reason=reason;
  if(failure)report.firstFailure??={code:reason,mode:p.mode,elapsedMs:p.durationMs};
  try{p.end=h.state();p.cameraSettledStable&&=p.end.cameraSettled===true;p.stateStable&&=signature(p.end)===signature(p.start);}catch{p.stateReadFailed=true;failure=true;report.firstFailure??={code:'END_STATE_READ_FAILED',mode:p.mode,elapsedMs:p.durationMs};reason='END_STATE_READ_FAILED';}
  try{restore();p.cleanupFailed=false;}catch{p.cleanupFailed=true;failure=true;report.firstFailure??={code:'CLEANUP_FAILED',mode:p.mode,elapsedMs:p.durationMs};reason='CLEANUP_FAILED';}p.reason=reason;
  const a=p.intervals;p.frames={count:a.length,meanMs:a.length?a.reduce((x,y)=>x+y,0)/a.length:0,p95Ms:a.length?[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1]:0,worstMs:a.length?Math.max(...a):0};delete p.intervals;
  p.valid=!failure&&p.frames.count>=2&&(p.mode==='overhead'?p.hitAtCount===0:p.bodyHits>0);p.fullDuration=reason==='TIME_LIMIT'&&p.budgetMs===p.requestedMs&&p.durationMs>=p.requestedMs;p.partial=!p.fullDuration;
  if(failure){ended=true;report.firstFailure??={code:reason,mode:p.mode,elapsedMs:p.durationMs};report.status='STOP';}else report.status=p.valid?'SAMPLE_READY':'INCONCLUSIVE';
  if(report.collectionLimitReached)ended=true;
  const eligible=x=>x.valid&&!x.partial&&x.fullDuration&&x.reason==='TIME_LIMIT'&&x.cameraSettledStable&&x.stateStable;
  const n=report.samples.find(x=>x.mode==='native'&&eligible(x)),c=report.samples.find(x=>x.mode==='optimized'&&eligible(x));report.matchedPair=!!n&&!!c&&signature(n.start)===signature(c.start);write();
 }
 function fail(code){if(active)stop(code,true);else{ended=true;report.firstFailure??={code,mode:null,elapsedMs:0};report.status='STOP';write();}}
 function start(mode){if(ended||active)return false;try{
  if(!['native','optimized','overhead'].includes(mode)||report.samples.length>=LIMITS.maxSamples||report.totalMs>=LIMITS.totalMs)return fail('LIMIT_OR_MODE');
  const s=h.state();if(!stateOK(s))return fail('STATE_NOT_READY');if(mode==='overhead'?s.walking:(!s.walking||!s.firstPerson||!s.authoredReady||!s.authoredVisible||s.fallbackVisible))return fail('MODE_OR_HANDS');
  const hardware=h.hardware();if(hardware.classification==='software')return fail('SOFTWARE_RENDERER');
  const requestedMs=mode==='overhead'?LIMITS.overheadMs:LIMITS.walkMs;
  active={mode,start:s,end:null,hardware,stateStable:true,cameraSettledStable:s.cameraSettled===true,motionObserved:false,requestedMs,budgetMs:Math.min(requestedMs,LIMITS.totalMs-report.totalMs),deadlineOverrunMs:0,hitAtCount:0,hitAtMs:0,cowRayCount:0,cowRayMs:0,bodyHits:0,intervals:[],durationMs:0,reason:null,valid:false};report.samples.push(active);at=e.now();lastAt=lastFrame=null;report.status='SAMPLING';
  originalHit=h.getHitAt();const raw=originalHit;h.setHitAt(function(...args){const p=active,t=e.now();try{return raw.apply(this,args);}catch(error){fail('HIT_AT_ERROR');throw error;}finally{if(p){p.hitAtCount++;p.hitAtMs+=e.now()-t;if(!active)write();}}});
  for(const cow of h.cows()){const card=cow.card,own=Object.getOwnPropertyDescriptor(card,'raycast'),candidate=card.raycast;hooks.push({card,own});card.raycast=function(ray,hits){const p=active,t=e.now(),before=hits.length,bone=Object.getOwnPropertyDescriptor(this,'applyBoneTransform');if(mode==='native')this.applyBoneTransform=h.nativeBone;
   try{return(mode==='native'?h.nativeRaycast:candidate).call(this,ray,hits);}catch(error){fail('COW_RAY_ERROR');throw error;}finally{if(mode==='native'){if(bone)Object.defineProperty(this,'applyBoneTransform',bone);else delete this.applyBoneTransform;}if(p){p.cowRayCount++;p.cowRayMs+=e.now()-t;p.bodyHits+=hits.length-before;if(!active)write();}}};}
  const poll=()=>{if(!active)return;try{const q=h.state();if(!stateOK(q))return fail('STATE_CHANGED');if(mode!=='overhead'&&!q.walking)return stop('WALKING_ENDED');if(mode==='overhead'?q.walking:(!q.firstPerson||!q.authoredVisible||q.fallbackVisible))return fail('MODE_CHANGED');if(h.cows().length!==hooks.length||h.cows().some((x,i)=>x.card!==hooks[i].card))return fail('COW_SET_CHANGED');active.end=q;active.motionObserved||=JSON.stringify([q.position,q.yaw,q.pitch])!==JSON.stringify([active.start.position,active.start.yaw,active.start.pitch]);active.stateStable&&=signature(q)===signature(active.start);active.cameraSettledStable&&=q.cameraSettled===true;if(e.now()-at>=active.budgetMs)return stop('TIME_LIMIT');write();}catch{fail('OBSERVATION_ERROR');}};
  const frame=t=>{if(!active)return;try{const f=h.renderFrame();if(f!==lastFrame){if(lastAt!==null){if(active.intervals.length>=LIMITS.maxFrames)return fail('FRAME_LIMIT');active.intervals.push(t-lastAt);}lastAt=t;lastFrame=f;}raf=e.raf(frame);}catch{fail('OBSERVATION_ERROR');}};
  timer=e.interval(poll,100);raf=e.raf(frame);write();return true;
 }catch{fail('START_FAILED');return false;}}
 write();return{start,stop,fail,snapshot:summary,active:()=>!!active};
}
export function install(h,w=window){
 const d=w.document,box=d.createElement('section');box.id='phonePreview';box.style.cssText='position:fixed;left:4px;top:4px;z-index:100000;max-width:320px;background:#14231eed;color:white;padding:8px;border-radius:8px;font:13px system-ui';
 box.innerHTML='<details><summary>Fictional preview · local measurements</summary><p>Use native Walk and walk near cows. Samples retain movement; only stationary matching views qualify for matched picking comparison. Native × Stop walking preserves a partial sample. Then choose Overhead. No real farm is used.</p><select aria-label="Measurement mode"><option value="native">Native picking · 30 s</option><option value="optimized">Optimized picking · 30 s</option><option value="overhead">Overhead · 20 s</option></select><button data-preview="start">Start sample</button><button data-preview="stop">Stop sample</button><button data-preview="copy">Select summary to copy</button><p data-preview="status"></p><textarea aria-label="Local summary" readonly rows="5" style="width:96%"></textarea></details>';
 d.body.append(box);const select=box.querySelector('select'),summary=box.querySelector('textarea'),status=box.querySelector('[data-preview="status"]');
 const collector=createCollector({...h,publish:r=>{summary.value=JSON.stringify(r,null,2);status.textContent=r.status+(r.firstFailure?' · '+r.firstFailure.code:'');select.disabled=r.status==='SAMPLING';}}, {now:()=>w.performance.now(),interval:(f,n)=>w.setInterval(f,n),clearInterval:n=>w.clearInterval(n),raf:f=>w.requestAnimationFrame(f),cancelAnimationFrame:n=>w.cancelAnimationFrame(n)});
 box.addEventListener('click',event=>{const action=event.target.closest('button')?.dataset.preview;if(!action)return;if(!event.isTrusted)return collector.fail('UNTRUSTED_INPUT');if(action==='start')collector.start(select.value);if(action==='stop')collector.stop();if(action==='copy'){summary.focus();summary.select();status.textContent+=' · use Copy on the selected text';}});
 w.addEventListener('error',event=>{if(event.error&&collector.active())collector.fail('PAGE_ERROR');});w.addEventListener('unhandledrejection',()=>{if(collector.active())collector.fail('UNHANDLED_REJECTION');});w.addEventListener('pagehide',()=>{if(collector.active())collector.fail('PAGE_HIDDEN');});
 return collector;
}
