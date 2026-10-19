// Failure-path observation only. Do not change original actions/sampling/deadlines.
const fs=require('node:fs'),path=require('node:path'),harness=require('./browser-harness.cjs');
const start=harness.start;
harness.start=async(...args)=>{
 const h=await start(...args),setup=h.setup,close=h.close,pages=[];
 h.setup=async(...a)=>{const s=await setup(...a);pages.push({page:s.page,name:a[2]});return s;};
 h.close=async failed=>{
  if(failed){
   const rows=[];
   for(const {page,name} of pages){if(page.isClosed())continue;
    try{rows.push({name,snapshot:await page.evaluate(()=>{const d=window.__dbg,root=d?.camera.getObjectByName('Authored first-person hands'),samples=window.__authoredSamples;
     return {now:performance.now(),samples,live:root?.getObjectByName('R_finger1_0').quaternion.toArray(),crop:d?.G.S.plots[0].crop,hold:window.__handsCaptureHold,samplingFlag:window.__authoredSampling,visible:root?.visible,reduced:d?.G.reducedMotion()};})});}
    catch(error){rows.push({name,error:String(error)});}
   }
   fs.writeFileSync(path.join(harness.artifacts,'authored-failure-snapshot.json'),JSON.stringify({observation:'only after original failure, before original close',rows},null,2)+'\n');
  }
  return close(failed);
 };
 return h;
};
