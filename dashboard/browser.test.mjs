// Dependency-free browser qualification using an installed Chrome and its DevTools protocol.
// Run: node dashboard/browser.test.mjs [evidence-directory]
// Preview only: node dashboard/browser.test.mjs --serve [port]
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function server(port=0) {
  const s=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname;
    const name=path==='/dashboard/'?'index.html':path==='/dashboard/dashboard.mjs'?'dashboard.mjs':null;
    if(!name){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(await readFile(join(root,name)));
  });
  await new Promise((ok,no)=>{s.once('error',no);s.listen(port,'127.0.0.1',ok);});return s;
}
class CDP {
  constructor(ws){this.ws=ws;this.id=0;this.pending=new Map();this.errors=[];ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=this.pending.get(data.id);this.pending.delete(data.id);data.error?p?.reject(new Error(JSON.stringify(data.error))):p?.resolve(data.result);}else if(data.method==='Runtime.exceptionThrown')this.errors.push(data.params.exceptionDetails);});}
  static async connect(url){const ws=new WebSocket(url);await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});return new CDP(ws);}
  send(method,params={}){const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  async until(expression,timeout=6000){for(let i=0;i<timeout/50;i++){if(await this.eval(expression))return;await pause(50);}throw new Error('Timed out: '+expression);}
}
function fixture(scenario) {
  const H='a'.repeat(40),M='b'.repeat(40),X='c'.repeat(40),O='d'.repeat(40);
  let clock=Date.now();const originalNow=Date.now;Date.now=()=>clock;window.__advance=ms=>{clock+=ms;};
  Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__hidden?'hidden':'visible'});
  window.__requests=[];window.__offline=scenario==='offline';window.__clipboard='';
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__clipboard=text;}}});
  const p={number:92,id:92,title:'Chickens: larger two-door coop and physical care',draft:true,state:'open',head:{sha:H,ref:'codex/chickens'},base:{sha:M},merge_commit_sha:X,updated_at:'2026-10-21T12:00:00Z'};
  const r=(id,conclusion='success',extra={})=>({id,workflow_id:id,name:id===1?'Farm3D regression':'Workflow '+id,event:'pull_request',head_sha:H,head_branch:'codex/chickens',run_number:600+id,run_attempt:1,status:'completed',conclusion,created_at:'2026-10-21T12:00:00Z',run_started_at:'2026-10-21T12:00:01Z',updated_at:'2026-10-21T12:03:01Z',...extra});
  const realFetch=window.fetch;
  window.fetch=async function(url,opts){
    if(this!==window)throw new TypeError('Illegal invocation: fetch requires the window receiver');
    if(!String(url).startsWith('https://api.github.com/'))return realFetch(url,opts);
    const u=new URL(url);window.__requests.push({url:String(url),method:opts.method,credentials:opts.credentials});
    if(window.__offline)throw new TypeError('Offline fixture');
    let data,headers={'Content-Type':'application/json','x-ratelimit-remaining':'55'},status=200;
    if(scenario==='rate'){status=429;data={};headers['retry-after']='3600';}
    else if(u.pathname.endsWith('/branches/main'))data={commit:{sha:M}};
    else if(u.pathname.endsWith('/pulls'))data=scenario==='no-pr'?[]:[p,{...p,number:69,title:'Horse R1 old work',updated_at:'2026-10-01T00:00:00Z',head:{sha:O,ref:'old-horse'}}];
    else if(u.pathname.endsWith('/pulls/92'))data=window.__newHead?{...p,head:{sha:O,ref:p.head.ref},merge_commit_sha:null}:p;
    else if(u.pathname.endsWith('/pulls/69'))data={...p,number:69,title:'Horse R1 old work',head:{sha:O,ref:'old-horse'},merge_commit_sha:null};
    else if(u.pathname.endsWith('/commits/'+X))data={parents:[{sha:scenario==='old-merge'?O:H},{sha:M}]};
    else if(u.pathname.endsWith('/actions/runs')){
      const sha=u.searchParams.get('head_sha');
      if(scenario==='partial'&&sha===X){data={};status=503;}
      else if(sha===M)data={workflow_runs:[r(20,'success',{head_sha:M,head_branch:'main',event:'push'}),r(21,'failure',{head_sha:O,head_branch:'main',event:'push'}),r(22,'success',{head_sha:M,head_branch:'main',event:'pull_request'})]};
      else if(sha===X)data={workflow_runs:[]};
      else if(sha===O)data={workflow_runs:[]};
      else if(scenario==='zero')data={workflow_runs:[]};
      else if(scenario==='stale')data={workflow_runs:[r(1,'success',{head_sha:O})]};
      else if(scenario==='mixed'||scenario==='partial-jobs')data={workflow_runs:[r(1),r(2,'failure',{run_attempt:3}),r(3,null,{status:'in_progress'}),r(4,null,{status:'queued'}),r(5,'cancelled'),r(6,'skipped'),r(7,null)]};
      else if(scenario==='pagination'){
        data={workflow_runs:u.searchParams.get('page')==='2'?[r(2,'failure')]:[r(1)]};
        if(u.searchParams.get('page')!=='2')headers.link=`<${u.href}&page=2>; rel="next"`;
      }else data={workflow_runs:[r(1),r(2),r(3,'failure',{workflow_id:1,created_at:'2026-10-20T00:00:00Z'})]};
    }else if(/\/attempts\/\d+\/jobs$/.test(u.pathname)){data={jobs:[{id:777,name:'Portrait coop check',status:'completed',conclusion:'failure',started_at:'2026-10-21T12:00:00Z',completed_at:'2026-10-21T12:02:00Z'}]};if(scenario==='partial-jobs'){status=503;data={};}}
    else if(u.pathname.endsWith('/deployments'))data=scenario==='deployment'?[{id:55,sha:M,environment:'github-pages'}]:[];
    else if(u.pathname.endsWith('/statuses'))data=[{state:'success',created_at:'2026-10-21T12:05:00Z'}];
    else throw new Error('Unexpected fixture request: '+url);
    return new Response(JSON.stringify(data),{status,headers});
  };
}
async function qualify() {
  const evidence=resolve(process.argv[2]||join(tmpdir(),'sunny-dashboard-evidence'));await mkdir(evidence,{recursive:true});
  const web=await server(),port=web.address().port;
  const profile=await mkdtemp(join(tmpdir(),'sunny-dashboard-chrome-'));
  const chrome=process.env.DASHBOARD_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child=spawn(chrome,['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'],{windowsHide:true,stdio:'ignore'});
  let browser,cdp;const results=[];
  try {
    let debugPort;
    for(let i=0;i<150;i++){try{debugPort=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break;}catch{await pause(100);}}
    assert.ok(debugPort,'Chrome DevTools started');
    const version=await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();browser=await CDP.connect(version.webSocketDebuggerUrl);
    const target=await (await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`,{method:'PUT'})).json();cdp=await CDP.connect(target.webSocketDebuggerUrl);
    await cdp.send('Runtime.enable');await cdp.send('Page.enable');
    if(process.argv.includes('--live')){
      await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/dashboard/?pr=92`});
      await cdp.until(`!!document.querySelector('#connectionText') && !['Awaiting evidence','Fetching GitHub'].includes(document.querySelector('#connectionText').textContent)`,45000);
      const actual=await cdp.eval(`({capturedAt:new Date().toISOString(),title:document.querySelector('#heroTitle').textContent,main:document.querySelector('#mainSha').textContent,head:document.querySelector('#sha').textContent,merge:document.querySelector('#mergeSha').textContent,badge:document.querySelector('#heroBadge').textContent,passed:document.querySelector('#passed').textContent,active:document.querySelector('#active').textContent,failed:document.querySelector('#failed').textContent,notice:document.querySelector('#notice').textContent,renderedText:document.body.innerText})`);
      for(const width of [390,1440]){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
        for(const section of ['overview','checks','release','roadmap']){await cdp.eval(`document.querySelector('#${section}').scrollIntoView()`);await pause(100);const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(evidence,`live-${width}-${section}.png`),Buffer.from(shot.data,'base64'));}
        assert.equal(await cdp.eval(`document.documentElement.scrollWidth<=innerWidth`),true);
      }
      assert.deepEqual(cdp.errors,[]);await writeFile(join(evidence,'live-browser-evidence.json'),JSON.stringify({...actual,chrome:version.Browser,exceptions:cdp.errors},null,2));console.log(JSON.stringify({...actual,renderedText:undefined,chrome:version.Browser}));return;
    }
    let init;
    async function open(scenario,query='',width=390) {
      if(init)await cdp.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:init});
      init=(await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:`(${fixture.toString()})(${JSON.stringify(scenario)})`})).identifier;
      await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<768});
      await cdp.send('Page.navigate',{url:`http://127.0.0.1:${port}/dashboard/${query}`});
      await cdp.until(`window.__requests?.length>0 && document.querySelector('#connectionText')?.textContent!=='Fetching GitHub'`);
    }
    async function check(name,fn){await fn();results.push({name,result:'PASS'});console.log('PASS '+name);}
    await check('success counts latest workflow results; main stays separate',async()=>{await open('success');assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'2');assert.equal(await cdp.eval(`document.querySelector('#failed').textContent`),'0');assert.match(await cdp.eval(`document.querySelector('#mainRuns').textContent`),/main bbbbbbbbb/);assert.equal(await cdp.eval(`document.querySelector('#prSelect').value`),'92');});
    await check('mixed statuses and attempt-specific direct failed-job links',async()=>{await open('mixed');assert.equal(await cdp.eval(`document.querySelector('#active').textContent`),'2');assert.equal(await cdp.eval(`document.querySelector('#failed').textContent`),'1');for(const value of ['Cancelled','Skipped','Unknown','Running','Queued'])assert.match(await cdp.eval(`document.querySelector('#headRuns').textContent`),new RegExp(value));assert.equal(await cdp.eval(`document.querySelector('#headRuns .run .run-title').textContent`),'Workflow 2');assert.match(await cdp.eval(`JSON.stringify(window.__requests)`),/runs\/2\/attempts\/3\/jobs/);assert.equal(await cdp.eval(`document.querySelector('a[href$="/job/777"]').textContent`),'Portrait coop check');});
    await check('zero runs cannot qualify revision',async()=>{await open('zero');assert.equal(await cdp.eval(`document.querySelector('#heroBadge').textContent`),'No runs found');});
    await check('older commit green cannot qualify selected head',async()=>{await open('stale');assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'0');assert.equal(await cdp.eval(`document.querySelector('#heroBadge').textContent`),'No runs found');});
    await check('stale merge-test parents cannot qualify the current PR head',async()=>{await open('old-merge');assert.match(await cdp.eval(`document.querySelector('#mergeSha').textContent`),/Unavailable/);assert.match(await cdp.eval(`document.querySelector('#detailError').textContent`),/parents/);assert.equal(await cdp.eval(`window.__requests.some(r=>r.url.includes('head_sha='+'c'.repeat(40)))`),false);});
    await check('partial merge fetch failure preserves successful head evidence and marks incomplete',async()=>{await open('partial');assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'2');assert.equal(await cdp.eval(`document.querySelector('#heroBadge').textContent`),'Incomplete evidence');assert.match(await cdp.eval(`document.querySelector('#notice').textContent`),/503/);});
    await check('failed job fetch is explicit while run evidence remains visible',async()=>{await open('partial-jobs');assert.equal(await cdp.eval(`document.querySelector('#failed').textContent`),'1');assert.match(await cdp.eval(`document.querySelector('#headRuns').textContent`),/Unavailable: GitHub HTTP 503/);assert.match(await cdp.eval(`document.querySelector('#connectionText').textContent`),/Partial/);});
    await check('pagination is explicit and includes later-page failures',async()=>{await open('pagination');assert.equal(await cdp.eval(`document.querySelector('#heroBadge').textContent`),'Incomplete evidence');await cdp.eval(`document.querySelector('[data-more="head"]').click()`);await cdp.until(`document.querySelector('#failed').textContent==='1'`);assert.equal(await cdp.eval(`!!document.querySelector('[data-more="head"]')`),false);});
    await check('rate limit backs off and disables refresh',async()=>{await open('rate');assert.equal(await cdp.eval(`document.querySelector('#refresh').disabled`),true);assert.match(await cdp.eval(`document.querySelector('#notice').textContent`),/429/);assert.match(await cdp.eval(`document.querySelector('#nextCheck').textContent`),/backoff/);});
    await check('offline first load reports unavailable, no invented evidence',async()=>{await open('offline');assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'0');assert.match(await cdp.eval(`document.querySelector('#notice').textContent`),/Offline/);assert.match(await cdp.eval(`document.querySelector('#deployment').textContent`),/Unknown/);});
    await check('no open PR defaults to main integration without mixing PR runs',async()=>{await open('no-pr');assert.equal(await cdp.eval(`document.querySelector('#prSelect').value`),'main');assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'1');});
    await check('deployment record is independent; owner approval remains unknown',async()=>{await open('deployment');assert.match(await cdp.eval(`document.querySelector('#deployment').textContent`),/API record: success/);assert.match(await cdp.eval(`document.querySelector('#release').textContent`),/Manual \/ unknown/);});
    await check('PR selection uses new head; no stale success survives revision change',async()=>{await open('success');await cdp.eval(`const s=document.querySelector('#prSelect');s.value='69';s.dispatchEvent(new Event('change'));`);await cdp.until(`document.querySelector('#heroTitle').textContent.includes('#69')`);assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'0');assert.match(await cdp.eval(`location.search`),/pr=69/);});
    await check('offline refresh retains last evidence with failure and freshness labels in copied status',async()=>{await open('success');await cdp.eval(`window.__offline=true;window.__advance(46000);document.querySelector('#refresh').click()`);await cdp.until(`document.querySelector('#notice').textContent.includes('Offline')`);assert.equal(await cdp.eval(`document.querySelector('#passed').textContent`),'2');assert.equal(await cdp.eval(`document.querySelector('#heroBadge').textContent`),'Incomplete evidence');await cdp.eval(`document.querySelector('#copyStatus').click()`);await cdp.until(`window.__clipboard.includes('Offline')`);});
    await check('hidden tabs pause reads; returning refreshes only when due',async()=>{await open('success');const before=await cdp.eval(`window.__requests.length`);await cdp.eval(`window.__hidden=true;window.__advance(16*60000);document.dispatchEvent(new Event('visibilitychange'))`);await pause(100);assert.equal(await cdp.eval(`window.__requests.length`),before);assert.match(await cdp.eval(`document.querySelector('#nextCheck').textContent`),/paused/);await cdp.eval(`window.__hidden=false;document.dispatchEvent(new Event('visibilitychange'))`);await cdp.until(`window.__requests.length>${before} && !document.querySelector('#refresh').disabled`);});
    await check('stale hidden evidence is labeled and copied as stale',async()=>{await open('success');await cdp.eval(`window.__hidden=true;window.__advance(16*60000);document.dispatchEvent(new Event('visibilitychange'));document.querySelector('#copyStatus').click()`);await cdp.until(`window.__clipboard.includes('STALE')`);assert.match(await cdp.eval(`document.querySelector('#connectionText').textContent`),/Stale/);});
    await check('copy fallback is available when clipboard rejects',async()=>{await open('success');await cdp.eval(`navigator.clipboard.writeText=async()=>{throw Error('denied')};document.querySelector('#copyStatus').click()`);await cdp.until(`document.activeElement.id==='copyText'`);assert.match(await cdp.eval(`document.querySelector('#copyText').value`),/Owner approval: unknown/);});
    await check('390px, 320px and desktop render without overflow; controls and keyboard focus',async()=>{
      for(const width of [390,320,1440]){await open('mixed','',width);assert.equal(await cdp.eval(`document.documentElement.scrollWidth<=innerWidth`),true);for(const section of ['overview','checks','release','roadmap']){await cdp.eval(`document.querySelector('#${section}').scrollIntoView()`);const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(evidence,`dashboard-${width}-${section}.png`),Buffer.from(shot.data,'base64'));}}
      await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.ok(await cdp.eval(`document.activeElement.tagName==='A'||document.activeElement.tagName==='BUTTON'||document.activeElement.tagName==='SELECT'`));
    });
    assert.deepEqual(cdp.errors,[],'No uncaught browser exceptions');
    assert.equal(await cdp.eval(`window.__requests.every(r=>r.method==='GET'&&r.credentials==='omit')`),true);
    await writeFile(join(evidence,'browser-results.json'),JSON.stringify({results,uncaughtExceptions:cdp.errors,chrome:version.Browser,profile,preview:`http://127.0.0.1:${port}/dashboard/`},null,2));
    console.log(`${results.length}/${results.length} browser checks PASS. Evidence: ${evidence}`);
  }finally{cdp?.ws.close();try{await browser?.send('Browser.close');}catch{}browser?.ws.close();child.kill();web.closeAllConnections();await new Promise(ok=>web.close(ok));}
}
if(process.argv[2]==='--serve'){const s=await server(Number(process.argv[3]||4173));console.log(`Dashboard preview: http://127.0.0.1:${s.address().port}/dashboard/`);}else await qualify();
