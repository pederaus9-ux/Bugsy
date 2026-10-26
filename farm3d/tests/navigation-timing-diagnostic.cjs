// A33 test-only observation. Never release the renderer or change navigation criteria.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {performance}=require('node:perf_hooks');
async function navigationTiming(page,directory,name){
 const started=performance.now(),rows=[],listeners=[],mark=(event,detail={})=>{if(rows.length<1024)rows.push({event,ms:performance.now()-started,...detail});};
 const local=url=>/^http:\/\/127\.0\.0\.1:\d+\//.test(url),safe=url=>{const u=new URL(url);return u.origin+u.pathname;};
 const on=(event,fn)=>{page.on(event,fn);listeners.push([event,fn]);};
 on('request',r=>{if(local(r.url())&&(r.isNavigationRequest()||/characters3d|cow3d|three.module/.test(r.url())))mark('request',{url:safe(r.url()),navigation:r.isNavigationRequest()});});
 on('response',r=>{if(local(r.url())&&(r.request().isNavigationRequest()||/characters3d|cow3d|three.module/.test(r.url())))mark('response',{url:safe(r.url()),status:r.status()});});
 on('requestfinished',r=>{if(local(r.url())&&(r.isNavigationRequest()||/characters3d|cow3d|three.module/.test(r.url())))mark('finished',{url:safe(r.url()),timing:r.timing()});});
 on('framenavigated',f=>{if(f===page.mainFrame())mark('commit');});on('load',()=>mark('load'));
 const cdp=await page.context().newCDPSession(page),complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
 await cdp.send('Tracing.start',{traceConfig:{recordMode:'recordUntilFull',traceBufferSizeInKb:32768,includedCategories:['devtools.timeline','loading','toplevel','blink','gpu']},transferMode:'ReturnAsStream',streamCompression:'gzip'});
 let end;const stop=()=>end||(end=cdp.send('Tracing.end'));const timer=setTimeout(()=>{void stop().catch(()=>{});},45000);
 const bounded=(promise,ms)=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Diagnostic collection cap')),ms);promise.then(v=>{clearTimeout(t);resolve(v);},e=>{clearTimeout(t);reject(e);});});
 return {mark,async finish(){
  clearTimeout(timer);let handle;
  try{await bounded(stop(),15000);const result=await bounded(complete,15000);handle=result.stream;const chunks=[];let bytes=0;const t=performance.now();
   for(;;){const c=await bounded(cdp.send('IO.read',{handle,size:1048576}),5000),b=Buffer.from(c.data,c.base64Encoded?'base64':'utf8');bytes+=b.length;if(bytes>134217728||performance.now()-t>15000)throw Error('Diagnostic size/time cap');chunks.push(b);if(c.eof)break;}
   const events=JSON.parse(zlib.gunzipSync(Buffer.concat(chunks))).traceEvents;
   // Persist timing metadata only, never source, HTTP headers/bodies, snapshots or trace args.
   const threads=new Map(events.filter(e=>e.name==='thread_name').map(e=>[e.pid+':'+e.tid,e.args?.name]));
   const spans=events.filter(e=>e.ph==='X'&&e.dur>=1000).map(e=>({name:e.name,ts:e.ts,dur:e.dur,pid:e.pid,tid:e.tid,thread:threads.get(e.pid+':'+e.tid)}));
   fs.writeFileSync(path.join(directory,name+'-spans.json'),JSON.stringify({dataLoss:!!result.dataLossOccurred,spans}));mark('trace-collected',{bytes,spans:spans.length});
  }catch(e){mark('diagnostic-incomplete',{message:e.message});}
  finally{if(handle)await bounded(cdp.send('IO.close',{handle}),5000).catch(()=>{});for(const [event,fn]of listeners)page.off(event,fn);await cdp.detach().catch(()=>{});fs.writeFileSync(path.join(directory,name+'-navigation.json'),JSON.stringify(rows,null,2));}
 }};
}
module.exports={navigationTiming};
