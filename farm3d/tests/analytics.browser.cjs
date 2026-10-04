const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {start,artifacts}=require('./browser-harness.cjs');
const SDK={
 'firebase-app.js':'export function initializeApp(){return {};}',
 'firebase-auth.js':`const auth={currentUser:null};let changed;export function getAuth(){return auth;}
 export function onAuthStateChanged(a,cb){changed=cb;auth.currentUser=window.__owner?{uid:'owner',email:'owner@example.com'}:null;queueMicrotask(()=>cb(auth.currentUser));}
 export async function signOut(){auth.currentUser=null;changed(null);}`,
 'firebase-firestore.js':`export function getFirestore(){return {};}
 export function collection(db,...p){return p.join('/');} export function doc(db,...p){return p.join('/');}
 export function where(...v){return {kind:'where',v};}export function orderBy(...v){return {kind:'order',v};}
 export function limit(n){return {kind:'limit',n};}export function startAfter(d){return {kind:'cursor',id:d.id};}
 export function query(ref,...clauses){return {ref,clauses};}export function serverTimestamp(){return Date.now();}
 export async function getDoc(){return {exists:()=>false};}export async function getCountFromServer(){return {data:()=>({count:0})};}
 export async function addDoc(ref,data){(window.__legacy ||= []).push(data);return {};}
 export async function setDoc(ref,data){(window.__reports ||= []).push({ref,data});return {};}
 export function onSnapshot(ref,cb,error){queueMicrotask(()=>window.__deny?error({code:'permission-denied'}):cb({docs:[]}));return ()=>{};}
 export async function getDocs(q){(window.__queries ||= []).push(q);const captured=[...(window.__eventDocs||[])];
   while(window.__holdReports)await new Promise(r=>setTimeout(r,20));if(window.__failReports)throw Error('offline');
   let docs=captured.sort((a,b)=>b.data.d.localeCompare(a.data.d)||a.id.localeCompare(b.id));
   const cutoff=q.clauses.find(c=>c.kind==='where')?.v[2];if(cutoff)docs=docs.filter(d=>d.data.d>=cutoff);
   const cursor=q.clauses.find(c=>c.kind==='cursor')?.id;if(cursor)docs=docs.slice(docs.findIndex(d=>d.id===cursor)+1);
   docs=docs.slice(0,q.clauses.find(c=>c.kind==='limit').n);return {docs:docs.map(d=>({id:d.id,data:()=>d.data}))};}`
};
async function mock(page){await page.route('**/*',route=>{const u=route.request().url();if(u.includes('gstatic.com/firebasejs/'))return route.fulfill({contentType:'text/javascript',body:SDK[u.split('/').pop()]||'export {};'});return route.fallback();});}
(async()=>{
 const h=await start(),results=[];let failed=true;
 try {
  for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1280,height:720}]){
   const s=await h.setup(viewport,false,`analytics-dashboard-${viewport.width}`),p=s.page;await mock(p);
   await p.addInitScript(()=>{window.__owner=true;const date=n=>new Date(Date.now()-n*864e5).toISOString().slice(0,10);window.__eventDocs=[];
    const put=(n,e,d)=>{for(let i=0;i<n;i++)window.__eventDocs.push({id:String(window.__eventDocs.length).padStart(6,'0'),data:{e,d}});};
    put(270,'a2_37_apg_sess_00a',date(0));put(20,'a2_37_ipa_sess_21c',date(2));put(10,'a2_34_ddg_open_0',date(3));put(10,'open',date(0));put(10,'a2_37_apg_ord_0',date(15));put(10,'a2_37_apg_harv_0',date(60));
   });
   await p.goto(h.base+'farm3d/players.html');await p.waitForFunction(()=>document.querySelector('#reportStatus')?.textContent.includes('Partial results'));
   assert.equal((await p.evaluate(()=>__queries.length)),1);await p.locator('#reportMore').click();await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('All available'));
   assert.match(await p.locator('#reportStatus').textContent(),/290 matching reports/);
   await p.locator('#reportPlatform').selectOption('ios');assert.match(await p.locator('#reportStatus').textContent(),/20 matching reports/);
   assert.match(await p.locator('#reportResults').textContent(),/20 visits · 0 with no reported errors/);
   await p.locator('#reportPlatform').selectOption('*');await p.locator('#reportVersion').selectOption('*');assert.match(await p.locator('#reportStatus').textContent(),/300 matching reports/);
   assert.equal(await p.evaluate(()=>__queries.length),2,'local filters issue no queries');
   await p.locator('#reportPeriod').selectOption('30');await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('Partial results'));await p.locator('#reportMore').click();await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('310 matching reports'));
   await p.locator('#reportPeriod').selectOption('all');await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('Partial results'));await p.locator('#reportMore').click();await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('320 matching reports'));
   await p.locator('#reportVersion').selectOption('37');await p.locator('#reportPlatform').selectOption('android');assert.match(await p.locator('#reportStatus').textContent(),/290 matching reports/);
   const fit=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,controls:[...document.querySelectorAll('#reports select')].map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))}));assert.equal(fit.overflow,false);assert.ok(fit.controls.every(c=>c.height>=44&&c.width>0));
   await p.locator('#reports').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(artifacts,`analytics-dashboard-${viewport.width}-full.png`),fullPage:true});
   // A superseded response must not overwrite the newly selected period.
   await p.evaluate(()=>window.__holdReports=true);await p.locator('#reportPeriod').selectOption('7');await p.waitForFunction(()=>__queries.length===7);await p.locator('#reportPeriod').selectOption('30');await p.waitForFunction(()=>__queries.length===8);await p.evaluate(()=>window.__holdReports=false);
   await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('Partial results'));assert.equal(await p.locator('#reportMore').isDisabled(),true,'read cap includes superseded requests');
   await p.locator('#out').click();await p.waitForFunction(()=>!document.querySelector('#signin').hidden);assert.equal(await p.locator('#reports').textContent(),'');
   assert.deepEqual(s.errors,[]);results.push({viewport,fit,passed:true});console.log('PASS owner filters, pagination, request races, read cap and fit',viewport);await s.finish();
  }
  for(const scenario of ['denied','signout-loading','retry']){
   const s=await h.setup({width:844,height:390},false,'analytics-'+scenario),p=s.page;await mock(p);
   await p.addInitScript(mode=>{window.__owner=true;window.__deny=mode==='denied';window.__holdReports=mode==='signout-loading';window.__failReports=mode==='retry';},scenario);
   await p.goto(h.base+'farm3d/players.html');
   if(scenario==='denied'){await p.waitForFunction(()=>!document.querySelector('#denied').hidden);assert.equal(await p.evaluate(()=>window.__queries?.length||0),0);}
   else if(scenario==='signout-loading'){await p.waitForFunction(()=>window.__queries?.length===1);await p.locator('#out').click();await p.evaluate(()=>window.__holdReports=false);await p.waitForTimeout(100);assert.equal(await p.locator('#reports').textContent(),'');}
   else{await p.waitForFunction(()=>document.querySelector('#reportStatus')?.textContent.includes("Couldn't load"));await p.evaluate(()=>window.__failReports=false);await p.locator('#reportMore').click();await p.waitForFunction(()=>document.querySelector('#reportStatus').textContent.includes('All available'));}
   assert.deepEqual(s.errors,[]);console.log('PASS dashboard',scenario);await s.finish();
  }
  for(const sandbox of [false,true]){
   const s=await h.setup({width:844,height:390},false,'analytics-game-'+sandbox),p=s.page;await mock(p);await p.addInitScript(()=>localStorage.setItem('sa3d-guest','1'));
   await p.goto(h.base+'farm3d/?debug'+(sandbox?'&testfarm':''));await p.waitForFunction(sandbox=>window.__ready&&window.__dbg&&(sandbox||window.saAuth?.guest),sandbox,{timeout:90000});
   await p.waitForFunction(()=>window.saMetrics);await p.evaluate(()=>{const G=__dbg.G;G.close();G.S.tut=99;G.S.barn.wheat=0;G.S.plots[0].crop=null;G.harvest(0,true);});
   assert.equal(await p.evaluate(()=>window.__reports?.some(r=>r.data.e.includes('_harv_'))||false),false,'failed harvest has no report');
   await p.evaluate(()=>{const G=__dbg.G;Object.assign(G.S.plots[0],{crop:'wheat',end:Date.now()-1});G.harvest(0,true);G.S.barn.wheat=10;G.S.orders=[{items:{wheat:3},coins:25,xp:2,gem:1,wait:0}];G.S.rush=null;G.openPanel('orders');});
   await p.locator('[data-act="deliver"][data-i="0"]').click();await p.evaluate(()=>{__dbg.G.close();window.saMetrics.end(performance.now());});await p.waitForTimeout(100);
   const reports=await p.evaluate(()=>({rows:(window.__reports||[]).filter(r=>r.ref.startsWith('events/')),stored:localStorage.getItem('sa3d-metrics-v2'),orders:__dbg.G.S.stats.orders}));
   assert.ok(reports.orders>=1);
   if(sandbox){assert.equal(reports.rows.length,0);assert.equal(reports.stored,null);}else{
    for(const kind of ['open','harv','ord','sess'])assert.equal(reports.rows.filter(r=>r.data.e.includes('_'+kind+'_')).length,1,kind+' reported once');
    assert.ok(reports.rows.every(r=>Object.keys(r.data).sort().join(',')==='d,e'));assert.ok(reports.rows.length<10);}
   assert.deepEqual(s.errors,[]);results.push({sandbox,reports});console.log('PASS real game milestone hooks and sandbox',sandbox);await s.finish();
  }
  failed=false;
 }finally{fs.writeFileSync(path.join(artifacts,'analytics-results.json'),JSON.stringify(results,null,2));await h.close(failed);}
})().catch(e=>{console.error(e);process.exitCode=1;});
