// A33 observation only: original choice predicate/assertion is evaluated first.
// A failing assertion stays failed even if a bounded follow-through later recovers.
const fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
async function choiceDiagnostic(page,artifacts,label){
 const rows=[],started=performance.now(),mark=(event,detail={})=>{if(rows.length<512)rows.push({event,ms:performance.now()-started,...detail});};
 const listeners=[],on=(event,fn)=>{page.on(event,fn);listeners.push([event,fn]);};
 const relevant=r=>/^http:\/\/127\.0\.0\.1:8085\//.test(r.url())&&/:commit$/.test(r.url());
 on('request',r=>{if(!relevant(r))return;let farms=[];try{farms=(r.postDataJSON()?.writes||[]).filter(w=>/\/farms\//.test(w.update?.name||'')).map(w=>({revision:w.update.fields?.rev?.integerValue,marker:JSON.parse(w.update.fields?.save?.stringValue||'{}').__sentinel}));}catch{}mark('commit-request',{farms});});
 on('response',r=>{if(relevant(r.request()))mark('commit-response',{status:r.status()});});
 on('requestfinished',r=>{if(relevant(r))mark('commit-finished',{timing:r.timing()});});
 on('requestfailed',r=>{if(relevant(r))mark('commit-failed',{reason:r.failure()?.errorText});});
 on('console',m=>{const t=m.text();if(t.startsWith('A33_UPLOAD_EVENT ')){try{mark('uploaded-event',JSON.parse(t.slice(17)));}catch{mark('event-parse-error');}}});
 const before=await page.evaluate(()=>{
  window.__a33ChoiceUploaded=0;
  window.__a33ChoiceListener=()=>{window.__a33ChoiceUploaded++;console.debug('A33_UPLOAD_EVENT '+JSON.stringify({browserMs:performance.now(),rev:localStorage.getItem('sa3d-sync-rev'),dirty:localStorage.getItem('sa3d-dirty'),marker:window.__dbg?.G.S.__sentinel}));};
  addEventListener('sa3d:uploaded',window.__a33ChoiceListener);
  return{browserMs:performance.now(),userAlreadyOpen:!!window.saAuth.user,marker:window.__dbg?.G.S.__sentinel,dirty:localStorage.getItem('sa3d-dirty'),rev:localStorage.getItem('sa3d-sync-rev')};
 });
 mark('before-choice',before);let choiceAt,closed=false;
 const flush=()=>fs.writeFileSync(path.join(artifacts,'choice-'+label+'.json'),JSON.stringify(rows,null,2));
 return{mark,choice(){choiceAt=performance.now();mark('choice-call');},assertion(c,s,selected,failed){mark('original-assertion',{failed,selected,cloudMarker:JSON.parse(c.save).__sentinel,cloudRev:c.rev,localMarker:s.marker,localRev:s.rev,dirty:s.dirty,userOpen:!!s.uid});flush();},
  async follow(read){
   const remaining=Math.max(0,180000-(performance.now()-choiceAt));
   mark('failed-assertion-follow-through',{remainingOriginalBudgetMs:remaining});
   // Do not alter the acceptance predicate or retry it. Observe the real upload
   // event once, within the original choice budget, solely to classify impact.
   if(remaining>0)await page.waitForFunction(()=>window.__a33ChoiceUploaded>0,null,{timeout:remaining,polling:250}).catch(e=>mark('follow-event-timeout',{message:e.message}));
   if(performance.now()-choiceAt<180000){const c=await read();mark('follow-cloud',{rev:c?.rev,marker:c?.save?JSON.parse(c.save).__sentinel:null});}
   flush();
  },async finish(){if(closed)return;closed=true;for(const [event,fn]of listeners)page.off(event,fn);if(!page.isClosed())await page.evaluate(()=>{removeEventListener('sa3d:uploaded',window.__a33ChoiceListener);delete window.__a33ChoiceListener;delete window.__a33ChoiceUploaded;}).catch(()=>{});flush();}}
}
module.exports={choiceDiagnostic};
