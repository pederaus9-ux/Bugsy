import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),d=require('./helpers/playwright-diagnostics.cjs');
const marker='SYNTHETIC_DIAGNOSTIC_NOT_A_CREDENTIAL',synthetic='https://discord.example.invalid/api/webhooks/123/'+marker;
const forms=[synthetic,synthetic.replaceAll('/','\\/'),encodeURIComponent(synthetic),marker];
function clean(value){for(const form of forms)assert.equal(String(value).includes(form),false);}
const hostile=()=>Object.assign(Error(forms.join(' ')),{cause:Error(synthetic),extra:synthetic});
function mock({launchFailure=false,newPageFailure=false,cleanupFailure=false,routeFailure=false,listenFailure=false,env={}}={}){
 const servers=[],calls=[],logs=[],contexts=[];let fail=false,options,cdpResult={result:{value:17}};
 class Keyboard{down(...args){calls.push(['keyboard',...args]);if(fail)throw hostile();}}
 class Locator{click(...args){calls.push(['click',...args]);return fail?Promise.reject(hostile()):Promise.resolve('clicked');}first(){return this;}locator(){return this;}}
 class JSHandle{jsonValue(){return fail?Promise.reject(hostile()):Promise.resolve({answer:7});}}
 class Worker{evaluate(){return fail?Promise.reject(hostile()):Promise.resolve(23);}}
 class Download{path(){return fail?Promise.reject(hostile()):Promise.resolve('/disposable/backup.json');}}
 class CDPSession extends EventEmitter{send(...args){calls.push(['send',...args]);return fail?Promise.reject(hostile()):Promise.resolve(cdpResult);}detach(){if(fail)throw hostile();}}
 class ConsoleMessage{type(){return 'error';}text(){return synthetic;}}
 class Request{constructor(url){this.href=url;}url(){return this.href;}failure(){return{errorText:synthetic};}}
 class Response extends Request{status(){return 404;}}
 class WebSocket{send(){if(fail)throw hostile();}}
 class WebSocketRoute{connectToServer(){return new WebSocket();}}
 class Route{constructor(url){this.req=new Request(url);}request(){return this.req;}continue(){calls.push(['continue']);return Promise.resolve();}fulfill(data){calls.push(['fulfill',data]);return Promise.resolve();}}
 class Tracing{start(){calls.push(['trace-start']);}stop(){calls.push(['trace-stop']);}}
 class Page extends EventEmitter{
  constructor(context){super();this.owner=context;this.keyboard=new Keyboard();this.loc=new Locator();this.worker=new Worker();this.handle=new JSHandle();this.routes=[];}
  context(){return this.owner;}locator(){return this.loc;}workers(){return[this.worker];}
  evaluate(...args){calls.push(['evaluate',...args]);return fail?Promise.reject(hostile()):Promise.resolve(args[1]);}
  evaluateHandle(){return Promise.resolve(this.handle);}
  addInitScript(...args){calls.push(['init',...args]);return Promise.resolve();}
  waitForFunction(...args){calls.push(['wait',...args]);return fail?Promise.reject(hostile()):Promise.resolve(this.handle);}
  waitForEvent(event){return Promise.resolve(event==='download'?new Download():event==='pageerror'?hostile():undefined);}
  routeWebSocket(pattern,fn){this.socketRoute=fn;return Promise.resolve();}
  route(pattern,fn){if(routeFailure)return Promise.reject(hostile());this.routes.push(fn);calls.push(['route',pattern]);return Promise.resolve();}
  screenshot(arg){calls.push(['screenshot',arg]);return cleanupFailure?Promise.reject(hostile()):Promise.resolve(Buffer.from('pixels'));}
 }
 class BrowserContext{
  constructor(browser){this.owner=browser;this.tracing=new Tracing();this.pages=[];this.cdp=new CDPSession();}
  browser(){return this.owner;}async newPage(){if(newPageFailure)throw hostile();const page=new Page(this);this.pages.push(page);return page;}
  newCDPSession(page){assert.equal(this.pages.includes(page),true);return Promise.resolve(this.cdp);}
  setOffline(v){calls.push(['offline',v]);return fail?Promise.reject(hostile()):Promise.resolve();}
  close(){calls.push(['context-close']);return cleanupFailure?Promise.reject(hostile()):Promise.resolve();}
 }
 class Browser{
  version(){if(fail)throw hostile();return 'test-browser';}
  newContext(o){calls.push(['newContext',o]);const c=new BrowserContext(this);contexts.push(c);return Promise.resolve(c);}
  close(){calls.push(['browser-close']);return cleanupFailure?Promise.reject(hostile()):Promise.resolve();}
 }
 const browser=new Browser();
 class Server extends EventEmitter{constructor(handler){super();this.handler=handler;this.port=32100+servers.length;servers.push(this);}listen(_port,host,cb){calls.push(['listen',host]);if(listenFailure)throw hostile();cb();}address(){return{port:this.port};}close(cb){calls.push(['server-close',this.port]);cb();}}
 const fakeFs={mkdirSync(){},existsSync(){return true;},statSync(){return{isDirectory:()=>false,isFile:()=>true};},readFileSync(){return Buffer.from('safe source');}};
 const deps={fs:fakeFs,http:{createServer:fn=>new Server(fn)},playwright:{chromium:{async launch(o){options=o;calls.push(['launch']);if(launchFailure)throw hostile();return browser;}}},'node:child_process':{execFileSync(){throw hostile();}}};
 const file=new URL('./browser-harness.cjs',import.meta.url),source=fs.readFileSync(file,'utf8'),mod={exports:{}};
 const context={require:n=>deps[n]||require(n),module:mod,exports:mod.exports,__dirname:new URL('.',file).pathname,process:{env},Buffer,URL,setTimeout,clearTimeout,console:{error:(...args)=>logs.push(args.join(' '))}};
 vm.runInNewContext(source,context);
 return{...mod.exports,servers,calls,logs,contexts,browser,setFail:v=>{fail=v;},setCDPResult:v=>{cdpResult=v;},get options(){return options;},types:{Route,ConsoleMessage,Request,Response,WebSocketRoute}};
}
async function rejectsSafe(fn){await assert.rejects(fn,error=>{clean(error.stack);clean(JSON.stringify(error));assert.equal(Object.hasOwn(error,'cause'),false);return /details withheld/.test(error.message);});}
test('Playwright nested APIs reject safely and keep raw handle identity',async()=>{
 const x=mock(),h=await x.start(),s=await h.setup({width:844,height:390},true,'test'),p=s.page,raw=x.contexts[0].pages[0];
 assert.equal(p.context(),s.context);assert.equal(p.context().browser(),s.context.browser());assert.equal(p.locator('a').first(),p.locator('b'));assert.equal(p.workers()[0],p.workers()[0]);
 const cdp=await s.context.newCDPSession(p),handle=await p.evaluateHandle(()=>1),download=await p.waitForEvent('download');
 x.setFail(true);
 for(const fn of [()=>p.evaluate(()=>1),()=>p.waitForFunction(()=>true),()=>p.locator('a').click(),()=>s.context.setOffline(true),()=>p.workers()[0].evaluate(()=>1),()=>handle.jsonValue(),()=>cdp.send('test'),()=>download.path()])await rejectsSafe(fn);
 for(const fn of [()=>p.keyboard.down('x'),()=>s.context.browser().version(),()=>cdp.detach()])assert.throws(fn,e=>{clean(e.stack);return /details withheld/.test(e.message);});
 x.setFail(false);assert.equal(raw.context(),x.contexts[0]);await h.close();
});
test('serialized functions, successful game data and exact timeout options stay unchanged',async()=>{
 const x=mock(),h=await x.start({serviceWorkers:'allow'}),s=await h.setup({width:390,height:844},true,'test'),fn=()=>17,value={save:{coins:23}},timeout={timeout:90000};
 assert.equal(await s.page.evaluate(fn,value),value);await s.page.addInitScript(fn,value);await s.page.waitForFunction(fn,null,timeout);
 const evaluation=x.calls.find(c=>c[0]==='evaluate'),init=x.calls.find(c=>c[0]==='init'),wait=x.calls.find(c=>c[0]==='wait');
 assert.equal(evaluation[1],fn);assert.equal(evaluation[2],value);assert.equal(init[1],fn);assert.equal(init[2],value);assert.equal(wait[1],fn);assert.equal(wait[3],timeout);
 assert.equal(x.calls.find(c=>c[0]==='newContext')[1].serviceWorkers,'allow');await h.close();
});
test('diagnostic event callbacks preserve identity, removal and rejection behavior',async()=>{
 const x=mock(),h=await x.start(),s=await h.setup({},false,'test'),raw=x.contexts[0].pages[0];let seen=0,worker,err;
 const listener=()=>seen++;s.page.on('worker',listener);s.page.off('worker',listener);raw.emit('worker',raw.worker);assert.equal(seen,0);
 let receiver;s.page.once('worker',function(w){worker=w;receiver=this;});raw.emit('worker',raw.worker);assert.equal(worker,s.page.workers()[0]);assert.equal(receiver,s.page);
 s.page.on('pageerror',e=>{err=e;});raw.emit('pageerror',hostile());clean(err.stack);assert.equal(s.errors.length,1);const awaited=await s.page.waitForEvent('pageerror');clean(awaited.stack);assert.equal(awaited instanceof Error,true);
 raw.emit('console',new x.types.ConsoleMessage());assert.equal(s.errors.length,2);clean(s.errors.join(' '));
 await s.page.routeWebSocket('test',route=>{const socket=route.connectToServer();x.setFail(true);assert.throws(()=>socket.send('payload'),e=>{clean(e.stack);return /details withheld/.test(e.message);});x.setFail(false);});raw.socketRoute(new x.types.WebSocketRoute());
 const expected=Error('user callback assertion');s.page.on('worker',()=>{throw expected;});assert.throws(()=>raw.emit('worker',raw.worker),e=>e===expected);
 await s.page.route('local',async route=>{assert.equal(route.request().url(),'http://fixture.invalid/');throw expected;});await assert.rejects(raw.routes.at(-1)(new x.types.Route('http://fixture.invalid/')),e=>e===expected);
 await h.close();
});
test('finite error classifications retain unchanged save and icon failure predicates',()=>{
 const saveSource=fs.readFileSync(new URL('./save7h.browser.cjs',import.meta.url),'utf8'),saveFilter=vm.runInNewContext(saveSource.match(/const errorsOf = ([^\n]+);/)[1]);
 const stage=fs.readFileSync(new URL('./stage-a-live3d.browser.cjs',import.meta.url),'utf8'),classify=vm.runInNewContext(stage.slice(stage.indexOf('function unexpectedErrors'),stage.indexOf('\nfunction inspect'))+';unexpectedErrors');
 for(const text of ['gstatic','firebase','Failed to load module script','net::ERR','fonts.googleapis']){const safe=d.diagnosticText(text+' '+synthetic);clean(safe);assert.equal(saveFilter({errors:[safe]}).length,0);}
 const other=d.diagnosticText(synthetic);assert.equal(saveFilter({errors:[other]}).length,1);
 const missing='console: '+d.diagnosticText('Failed to load resource: the server responded with a status of 404 (Not Found)');
 assert.equal(classify(['HTTP 404: '+d.localRequestLabel('http://127.0.0.1:32/farm/icon-192.png?'+synthetic,'http://127.0.0.1:32/'),missing]).length,0);
 assert.equal(classify(['HTTP 404: [request URL withheld]',missing]).length,2);
 for(const value of forms)clean(d.diagnosticText(value));
});
test('successful CDP exception and paused envelopes withhold diagnostics but preserve failure and call-frame state',async()=>{
 const x=mock(),h=await x.start(),s=await h.setup({},false,'test'),cdp=await s.context.newCDPSession(s.page),value={result:{value:'{"coins":17}'}};
 x.setCDPResult(value);assert.equal(await cdp.send('Debugger.evaluateOnCallFrame'),value);
 x.setCDPResult({exceptionDetails:{text:synthetic,exception:{description:synthetic}},result:{description:synthetic}});
 const error=await cdp.send('Debugger.evaluateOnCallFrame');assert.notEqual(error.exceptionDetails,undefined);clean(JSON.stringify(error));
 let paused;cdp.once('Debugger.paused',e=>paused=e);x.contexts[0].cdp.emit('Debugger.paused',{reason:synthetic,callFrames:[{callFrameId:'frame-7',functionName:synthetic,url:synthetic,location:{scriptId:'3',lineNumber:12,columnNumber:4},scopeChain:[synthetic]}]});
 clean(JSON.stringify(paused));assert.equal(paused.callFrames[0].callFrameId,'frame-7');assert.deepEqual(paused.callFrames[0].location,{scriptId:'3',lineNumber:12,columnNumber:4});await h.close();
});
test('trace capture is absent and explicit attempts fail closed',async()=>{
 const x=mock(),h=await x.start(),s=await h.setup({},false,'test');assert.throws(()=>s.context.tracing.start({sources:true}),/details withheld/);await h.close(true);assert.equal(x.calls.some(c=>c[0].startsWith('trace-')),false);
});
test('source-bearing launch and page creation failures retain no text and close resources',async()=>{
 const launch=mock({launchFailure:true});await rejectsSafe(()=>launch.start());assert.equal(launch.calls.filter(c=>c[0]==='server-close').length,2);clean(JSON.stringify(launch.logs));
 const x=mock({newPageFailure:true}),h=await x.start();await rejectsSafe(()=>h.setup({},false,'test'));assert.equal(x.calls.filter(c=>c[0]==='context-close').length,1);await h.close();assert.equal(x.calls.filter(c=>c[0]==='server-close').length,2);
});
test('failed screenshot and cleanup keep failure semantics, close every session and stop both servers last',async()=>{
 const x=mock({cleanupFailure:true}),h=await x.start();await h.setup({},false,'one');await h.setup({},false,'two');await rejectsSafe(()=>h.close(true));
 assert.equal(x.calls.filter(c=>c[0]==='context-close').length,2);assert.equal(x.calls.filter(c=>c[0]==='browser-close').length,1);assert.equal(x.calls.filter(c=>c[0]==='server-close').length,2);clean(JSON.stringify(x.logs));assert.deepEqual(x.calls.slice(-2).map(c=>c[0]),['server-close','server-close']);
});
test('rejecting proxy never forwards or logs HTTP, CONNECT or upgrade targets',async()=>{
 const x=mock(),h=await x.start(),proxy=x.servers[1];assert.equal(x.options.proxy.server,'http://127.0.0.1:32101');assert.equal(x.options.proxy.bypass,'<-loopback>,127.0.0.1:32100');let code,ended,destroyed=false;
 proxy.handler({url:synthetic},{writeHead:v=>code=v,end:()=>{ended=true;}});assert.equal(code,403);assert.equal(ended,true);
 proxy.emit('connect',{url:synthetic},{end:v=>{clean(v);assert.match(v,/403 Forbidden/);}});proxy.emit('upgrade',{url:synthetic},{destroy:()=>destroyed=true});assert.equal(destroyed,true);clean(JSON.stringify(x.logs));await h.close();
});
test('local and external SDK request handling retain their existing semantics',async()=>{
 const x=mock(),h=await x.start(),s=await h.setup({},false,'test'),route=x.contexts[0].pages[0].routes[0];
 await route(new x.types.Route(h.base+'farm3d/index.html'));await route(new x.types.Route('https://www.gstatic.com/firebasejs/example.js'));await route(new x.types.Route(synthetic));
 assert.equal(x.calls.filter(c=>c[0]==='continue').length,1);const replies=x.calls.filter(c=>c[0]==='fulfill').map(c=>c[1]);assert.equal(replies[0].body,'export {};');assert.equal(replies[1].body,'{}');await h.close();
});
test('diagnostic modes that log raw protocol content are refused before Playwright initialization',()=>{for(const key of ['DEBUG','PWDEBUG'])assert.throws(()=>mock({env:{[key]:synthetic}}),e=>{clean(e.stack);return /Verbose browser diagnostics/.test(e.message);});});

test('fixture listen and route-setup failures remain sanitized and release started resources',async()=>{
 const badListen=mock({listenFailure:true});await rejectsSafe(()=>badListen.start());assert.equal(badListen.calls.filter(c=>c[0]==='server-close').length,1);assert.equal(badListen.calls.some(c=>c[0]==='launch'),false);
 const x=mock({routeFailure:true}),h=await x.start();await rejectsSafe(()=>h.setup({},false,'test'));assert.equal(x.calls.filter(c=>c[0]==='context-close').length,1);await h.close();assert.equal(x.calls.filter(c=>c[0]==='server-close').length,2);
});

test('cleanup destroys fixture and proxy sockets while keeping all original assertion bounds',async()=>{
 const x=mock(),h=await x.start(),seen=[];
 for(const server of x.servers){const socket=new EventEmitter();socket.destroy=()=>seen.push(server.port);server.emit('connection',socket);}
 await h.close();assert.deepEqual(seen,[32100,32101]);
 const source=fs.readFileSync(new URL('./browser-harness.cjs',import.meta.url),'utf8');assert.match(source,/setTimeout\(\(\)=>reject\(failure\(\)\),5000\)/);assert.match(source,/GIT_ALLOW_PROTOCOL:''/);assert.match(source,/GIT_NO_LAZY_FETCH:'1'/);assert.match(source,/GIT_NO_REPLACE_OBJECTS:'1'/);
});
