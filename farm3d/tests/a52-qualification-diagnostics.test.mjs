import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const file=new URL('./qualification-cdp.cjs',import.meta.url),source=fs.readFileSync(file,'utf8'),require=createRequire(file);
const synthetic='https://discord.example.invalid/api/webhooks/123/SYNTHETIC_NOT_A_REAL_CREDENTIAL';
const forms=[synthetic,synthetic.replaceAll('/','\\/'),encodeURIComponent(synthetic),'SYNTHETIC_NOT_A_REAL_CREDENTIAL'];
function setup({launchFailure=false}={}){
 const writes=new Map(),sent=[],child=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};child.exitCode=launchFailure?0:null;let handler,ws,launchArgs,failSend=false,evaluation,stall=false;
 class Socket{constructor(){this.listeners=new Map();ws=this;}addEventListener(k,fn){this.listeners.set(k,fn);if(k==='open')queueMicrotask(fn);}close(){}send(text){if(failSend)throw Error(forms.join(' '));const m=JSON.parse(text);sent.push(m);if(stall)return;queueMicrotask(()=>this.listeners.get('message')({data:JSON.stringify({id:m.id,result:m.method==='Runtime.evaluate'?evaluation||{result:{value:true}}:{}})}));}}
 const fakeFs={mkdirSync(){},mkdtempSync(){return '/synthetic-profile';},readFileSync(){if(launchFailure){child.stderr.emit('data',Buffer.from(synthetic.slice(0,25)));child.stderr.emit('data',Buffer.from(synthetic.slice(25)));throw Error('synthetic absent port');}return '12345\n';},writeFileSync(p,s){writes.set(p,String(s));}};
 const deps={'node:fs':fakeFs,'node:http':{createServer(fn){handler??=fn;const s=new EventEmitter();Object.assign(s,{listen(_p,_h,cb){cb();},address(){return{port:32123};},close(cb){cb?.();}});return s;}},'node:child_process':{spawn(_exe,args){launchArgs=args;return child;}},'./qualification-source.cjs':{createReader(){return ()=>Buffer.from('safe');}}};
 const mod={exports:{}};const context={require:n=>deps[n]||require(n),module:mod,exports:mod.exports,__dirname:new URL('.',file).pathname,process:{env:{}},Buffer,WebSocket:Socket,fetch:async()=>({json:async()=>[{type:'page',webSocketDebuggerUrl:'ws://127.0.0.1'}]}),URL,setTimeout:(fn,ms)=>setTimeout(fn,stall&&ms===90000?0:ms),clearTimeout,queueMicrotask};vm.runInNewContext(source+'\nmodule.exports.TestCDP=CDP;',context);
 return{...mod.exports,writes,sent,child,get ws(){return ws;},get launchArgs(){return launchArgs;},handler:()=>handler,setFail(v){failSend=v;},setStall(v){stall=v;},setEvaluation(v){evaluation=v;}};
}
function safe(value){for(const f of forms)assert.equal(String(value).includes(f),false);assert.equal(String(value).includes('SYNTHETIC_NOT_A_REAL_CREDENTIAL'),false);}
test('transport and stderr never retain raw/escaped/encoded/chunk-split diagnostic input',async()=>{
 const x=setup(),h=await x.start('/output','synthetic-ref');
 for(const url of forms){await h.cdp.handlers.get('Fetch.requestPaused')[0]({request:{url},requestId:'synthetic'});h.cdp.handlers.get('Runtime.exceptionThrown')[0]({exceptionDetails:{text:url}});x.child.emit('error',Error(url));}
 for(const chunk of [synthetic.slice(0,27),synthetic.slice(27)])x.child.stderr.emit('data',Buffer.from(chunk));
 const req={url:'/file?secret='+encodeURIComponent(synthetic),socket:{destroy(){}}},res={setHeader(){},end(){},writeHead(){}};x.handler()(req,res);
 assert.equal(h.external.length,forms.length);assert.equal(h.errors.length,forms.length*2);assert.equal(h.requests.length,1);assert.equal(h.requests[0].status,200);
 assert.equal(x.sent.filter(m=>m.method==='Fetch.fulfillRequest').length,forms.length);assert.equal(x.sent.filter(m=>m.method==='Fetch.continueRequest').length,0);
 await h.close();assert.equal(x.writes.size,2);for(const v of x.writes.values())safe(v);assert.equal([...x.writes.values()].some(v=>v.includes('bytes='+Buffer.byteLength(synthetic))),true);
});
test('original local continuation and SDK fulfillment remain unchanged',async()=>{const x=setup(),h=await x.start('/out','ref'),fn=h.cdp.handlers.get('Fetch.requestPaused')[0];await fn({request:{url:h.base+'farm3d/index.html'},requestId:'local'});await fn({request:{url:'https://www.gstatic.com/firebasejs/example.js'},requestId:'sdk'});assert.equal(x.sent.find(m=>m.params.requestId==='local').method,'Fetch.continueRequest');const p=x.sent.find(m=>m.params.requestId==='sdk').params;assert.equal(Buffer.from(p.body,'base64').toString(),'export {};');await h.close();});
test('evaluation and condition failures keep failure semantics without browser details',async()=>{const x=setup(),h=await x.start('/out','ref');x.setEvaluation({exceptionDetails:{exception:{description:forms.join(' ')}}});await assert.rejects(h.cdp.evaluate('synthetic'),e=>{safe(e.stack);return /Runtime evaluation/.test(e.message);});await assert.rejects(h.cdp.until(forms.join(' '),-1),e=>{safe(e.stack);return /Condition timeout/.test(e.message);});await h.close();});
test('protocol, send and serialization failures never expose data',async()=>{const x=setup(),h=await x.start('/out','ref');x.setFail(true);await assert.rejects(h.cdp.send('test',{value:synthetic}),e=>{safe(e.stack);return /CDP send/.test(e.message);});x.setFail(false);const cyclic={value:synthetic};cyclic.self=cyclic;await assert.rejects(h.cdp.send('test',cyclic),e=>{safe(e.stack);return /CDP send/.test(e.message);});const p=h.cdp.send('test');const id=h.cdp.seq;x.ws.listeners.get('message')({data:JSON.stringify({id,error:{message:forms.join(' ')}})});await assert.rejects(p,e=>{safe(e.stack);return /CDP protocol error/.test(e.message);});await h.close();});
test('diagnostic helper is fail-closed for hostile categories and coercion',()=>{const d=require('./helpers/qualification-diagnostics.cjs');for(const f of forms){safe(d.withheld(f));safe(d.requestLabel(f));}const hostile={toString(){throw Error(synthetic);}};assert.equal(d.withheld(hostile),'Diagnostic: details withheld');assert.equal(d.requestLabel(hostile),'[request URL withheld]');});

test('malformed CDP messages and command timeouts expose only fixed categories',async()=>{const x=setup(),h=await x.start('/out','ref');assert.throws(()=>x.ws.listeners.get('message')({data:synthetic}),e=>{safe(e.stack);return /CDP message/.test(e.message);});x.setStall(true);await assert.rejects(h.cdp.send(synthetic),e=>{safe(e.stack);return /CDP timeout/.test(e.message);});x.setStall(false);await h.close();});

test('failed launch logs only withheld stderr category and byte count',async()=>{const x=setup({launchFailure:true});await assert.rejects(x.start('/out','ref'),e=>{safe(e.stack);return /Chrome unavailable/.test(e.message);});assert.equal(x.writes.size,1);for(const v of x.writes.values()){safe(v);assert.equal(v.includes('bytes='+Buffer.byteLength(synthetic)),true);}});


test('local Git reads disable lazy fetch and protocols and never propagate command diagnostics',()=>{
 const d=require('./helpers/qualification-diagnostics.cjs'),calls=[],bytes=Buffer.from('exact source');
 assert.equal(typeof d.localGit,'function');
 const exec=(...args)=>{calls.push(args);return bytes;};assert.equal(d.localGit('abc','farm3d/index.html','/repo',exec),bytes);
 assert.deepEqual(calls[0][1],['--no-lazy-fetch','-c','protocol.allow=never','show','abc:farm3d/index.html']);
 const o=calls[0][2];assert.equal(o.cwd,'/repo');assert.equal(o.env.GIT_ALLOW_PROTOCOL,'');assert.equal(o.env.GIT_NO_LAZY_FETCH,'1');assert.equal(o.env.GIT_NO_REPLACE_OBJECTS,'1');
 assert.throws(()=>d.localGit('abc','x','/repo',()=>{throw Error(synthetic);}),e=>{safe(e.stack);return /details withheld/.test(e.message);});
});
test('rejecting CDP proxy does not forward or retain HTTP CONNECT or upgrade data',async()=>{
 const d=require('./helpers/qualification-diagnostics.cjs');assert.equal(typeof d.rejectingProxy,'function');
 let handler;const server=new EventEmitter();const http={createServer(fn){handler=fn;return server;}};
 assert.equal(d.rejectingProxy(http),server);let code,end,destroyed;
 handler({url:synthetic},{writeHead(v){code=v;},end(){end=true;}});assert.equal(code,403);assert.equal(end,true);
 server.emit('connect',{url:synthetic},{end(v){safe(v);assert.match(v,/403 Forbidden/);}});
 server.emit('upgrade',{url:synthetic},{destroy(){destroyed=true;}});assert.equal(destroyed,true);
});

test('CDP launch uses rejecting proxy with exact fixture-only bypass, never proxy-free mode',async()=>{const x=setup(),h=await x.start('/out','ref');assert(x.launchArgs.includes('--proxy-server=http://127.0.0.1:32123'));assert(x.launchArgs.includes('--proxy-bypass-list=<-loopback>;127.0.0.1:32123'));assert.equal(x.launchArgs.includes('--no-proxy-server'),false);await h.close();});
