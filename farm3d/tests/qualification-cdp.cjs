// Opt-in local qualification harness. Uses installed Chrome and Node's WebSocket;
// no package install, personal browser profile, production data or external apps.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {readSource} = require('./qualification-source.cjs');
const root = path.resolve(__dirname, '../..');
const wait = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) {
    this.ws = ws; this.seq = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id) { const p = this.pending.get(m.id); if (!p) return; this.pending.delete(m.id); clearTimeout(p.timer); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
      else for (const fn of this.handlers.get(m.method) || []) fn(m.params);
    });
  }
  on(event, fn) { const h = this.handlers.get(event) || []; h.push(fn); this.handlers.set(event, h); }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('CDP timeout: '+method)); }, 90000);
      this.pending.set(id, {resolve,reject,timer}); this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', {expression,awaitPromise:true,returnByValue:true});
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async until(expression, timeout = 60000) {
    const end = Date.now()+timeout;
    do { try { if (await this.evaluate(expression)) return; } catch {} await wait(100); } while (Date.now()<end);
    throw new Error('Condition timed out: '+expression);
  }
  async screenshot(file) { const r = await this.send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync(file,Buffer.from(r.data,'base64')); }
}
async function start(out, ref) {
  fs.mkdirSync(out,{recursive:true});
  // Short temporary path avoids deep Windows CacheStorage filesystem paths.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(),'sa3d-qualification-'));
  const errors=[], external=[], requests=[]; let sourceRef=ref, offline=false;
  const sourceCache = new Map();
  const server=http.createServer((req,res)=>{
    if(offline) { req.socket.destroy(); return; }
    try {
      let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');
      if(!rel || rel.endsWith('/')) rel+='index.html';
      if(rel.split('/').some(x=>x==='..')) {res.writeHead(403);res.end();return;}
      const key=sourceRef+':'+rel; let body=sourceCache.get(key);
      if(!body) { body=readSource(sourceRef,rel);sourceCache.set(key,body); }
      res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'})[path.extname(rel)]||'application/octet-stream');
      res.setHeader('Cache-Control','no-store'); requests.push({ref:sourceRef,path:req.url,status:200});res.end(body);
    } catch {requests.push({ref:sourceRef,path:req.url,status:404});res.writeHead(404);res.end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port+'/';
  const chrome=process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const child=spawn(chrome,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-extensions','--disable-default-apps','--no-proxy-server','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--use-angle=swiftshader','--enable-unsafe-swiftshader','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let stderr='';child.stderr.on('data',b=>stderr+=b);child.on('error',e=>errors.push('launch: '+e.message));
  let port;
  for(let i=0;i<150;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split(/\r?\n/)[0];break;}catch{} if(child.exitCode!==null)break;await wait(100);}
  if(!port){child.kill();server.close();fs.writeFileSync(path.join(out,'chrome-launch.txt'),stderr);throw new Error('Isolated Chrome unavailable: '+stderr.slice(-1200));}
  const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
  const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  const cdp=new CDP(ws);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:.5,mobile:false});
  cdp.on('Runtime.exceptionThrown',e=>errors.push(e.exceptionDetails.exception?.description||e.exceptionDetails.text));
  cdp.on('Fetch.requestPaused',async e=>{
    try{
      if(e.request.url.startsWith(base))await cdp.send('Fetch.continueRequest',{requestId:e.requestId});
      else{external.push(e.request.url);const sdk=e.request.url.includes('gstatic.com/firebasejs/');await cdp.send('Fetch.fulfillRequest',{requestId:e.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:sdk?'text/javascript':'application/json'}],body:Buffer.from(sdk?'export {};':'{}').toString('base64')});}
    }catch(e){errors.push('isolation: '+e.message);}
  });
  await cdp.send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});
  return {cdp,base,profile,errors,external,requests,
    async boot(query='?debug&portrait&shot&sim=0') {await cdp.send('Page.navigate',{url:base+'farm3d/'+query});await cdp.until('!!window.__dbg && !document.getElementById("loading")');},
    async reload(){await cdp.send('Page.reload');await cdp.until('!!window.__dbg && !document.getElementById("loading")');},
    setRef(ref){sourceRef=ref;},setOffline(value){offline=value;},
    async close(){fs.writeFileSync(path.join(out,'transport.json'),JSON.stringify({profile,errors,externalIsolated:external,requests},null,2));try{await cdp.send('Browser.close');}catch{}ws.close();child.kill();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'chrome-stderr.txt'),stderr);}
  };
}
module.exports={start,root,wait};
