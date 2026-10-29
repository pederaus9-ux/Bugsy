// No game imports occur before the user starts an empty-origin preview.
export const QUERY='?testfarm&debug&artHands&perf&weather=clear&night=0&season=summer&theme=&preset=noon&yaw=0';
// Proposed address only; not reserved or published. A different assigned origin
// requires a reviewed rebuild, never a runtime override.
export const APPROVED_ORIGIN='https://sunny-cow-picking-preview-20261029.onrender.com';
export async function checkEmpty(w){
 if(w.top!==w||w.location.protocol!=='https:'||w.location.origin!==APPROVED_ORIGIN||/(^|\.)github\.io$/i.test(w.location.hostname)||w.location.search!==QUERY)throw Error('ORIGIN_OR_QUERY');
 if(typeof w.indexedDB?.databases!=='function'||!w.caches||!w.navigator.serviceWorker)throw Error('ISOLATION_API');
 const [db,cache,workers]=await Promise.all([w.indexedDB.databases(),w.caches.keys(),w.navigator.serviceWorker.getRegistrations()]);
 const counts={localStorage:w.localStorage.length,sessionStorage:w.sessionStorage.length,indexedDB:db.length,cacheStorage:cache.length,serviceWorkers:workers.length};
 const cookieEmpty=w.document.cookie==='',controllerAbsent=w.navigator.serviceWorker.controller===null;
 if(Object.values(counts).some(n=>n!==0)||!cookieEmpty||!controllerAbsent)throw Error('ORIGIN_NOT_EMPTY');
 return{counts,cookieEmpty,controllerAbsent};
}
export async function admit(w,load){const proof=await checkEmpty(w);await load();return proof;}
export function boot(w=window){
 const d=w.document,cover=d.createElement('section');cover.id='previewAdmission';cover.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#15231e;color:white;padding:5vh 5vw;font:18px system-ui;overflow:auto';
 cover.innerHTML='<h1>Sunny fictional phone preview</h1><p>This separate preview has no real farm or sign-in. It refuses an origin containing existing storage. Do not clear your real game data.</p><p id="admissionStatus">Checking this preview origin…</p><button id="previewStart" disabled>Open fictional farm</button>';
 d.body.append(cover);const button=cover.querySelector('button'),status=cover.querySelector('p#admissionStatus');let attempted=false;
 checkEmpty(w).then(()=>{status.textContent='Empty preview origin verified. Start only on the separately approved preview address.';button.disabled=false;},()=>{status.textContent='STOP: this origin or browser is not eligible. Nothing was loaded. Report this message; do not clear storage.';});
 button.addEventListener('click',async event=>{if(!event.isTrusted||attempted)return;attempted=true;button.disabled=true;try{
  await admit(w,async()=>{await import('./farm3d/auth.js?v=21');await import('./farm3d/preview-game-entry.js');});cover.remove();
 }catch{status.textContent='STOP: preview admission or startup failed. Do not retry or clear storage. No diagnostic result is available.';}});
}
