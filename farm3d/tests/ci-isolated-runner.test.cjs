'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {PassThrough}=require('node:stream');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const r=require('./helpers/ci-isolated-runner.cjs');
const config={timeoutMs:20000,maxOutputBytes:4096,probeOnly:false,command:['node','unchanged-test.cjs']};
const host={uid:1001,gid:1001,net:'net:[1]',user:'user:[2]',pid:'pid:[3]',mnt:'mnt:[4]'};
const pass=()=>({...r.baseReceipt('passed'),cleanupVerified:true,commandStarted:true,exitCode:0});
const canary='SYNTHETIC_PRIVATE_DIAGNOSTIC_NO_AUTHORITY_0123456789';
function noCanary(value){const s=JSON.stringify(value);for(const x of [canary,encodeURIComponent(canary),Buffer.from(canary).toString('base64')])assert.equal(s.includes(x),false);}
function fixture(overrides={}) {
 const calls=[];
 return {calls,platform:'linux',uid:()=>1001,gid:()=>1001,pid:()=>1,readlink:p=>p.endsWith('/net')?'net:[11]':p.endsWith('/user')?'user:[12]':p.endsWith('/mnt')?'mnt:[14]':'pid:[13]',readFile:p=>p.endsWith('ipv6_route')?'00000000000000000000000000000001 80 00000000000000000000000000000000 00 00000000000000000000000000000000 00000001 00000000 00000000 00200200 lo\n':'Iface\tDestination\tGateway\n',interfaces:()=>({lo:[{address:'127.0.0.1',internal:true},{address:'::1',internal:true}]}),run:async(cmd)=>{calls.push(cmd);return pass();},loopback:async()=>true,blocked:async(addr)=>{calls.push(addr);return true;},...overrides};
}
function childFixture(action) {
 const child=new EventEmitter();child.pid=43210;child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdio=[null,child.stdout,child.stderr,new PassThrough(),new PassThrough()];
 const timers=[],kills=[],spawns=[];let now=0;
 const deps={spawn:(...a)=>{spawns.push(a);queueMicrotask(()=>action?.(child));return child;},now:()=>now,setTimeout:(fn,ms)=>{const t={fn,ms,cleared:false};timers.push(t);return t;},clearTimeout:t=>{t.cleared=true;},kill:(pid,signal)=>kills.push({pid,signal})};
 return {child,timers,kills,spawns,deps,fire(ms){now+=ms;const t=timers.find(t=>!t.cleared&&t.ms===ms);assert.ok(t);t.cleared=true;t.fn();}};
}
test('CLI requires explicit bounded options and retains exact original argv',()=>{
 const c=r.parseArgs(['--receipt','/tmp/safe.json','--timeout-ms','1200000','--','bash','--noprofile','--norc','-e','-o','pipefail','-c','node original.cjs && node second.cjs']);
 assert.deepEqual(c.command,['bash','--noprofile','--norc','-e','-o','pipefail','-c','node original.cjs && node second.cjs']);assert.equal(c.timeoutMs,1200000);assert.equal(c.maxOutputBytes,16777216);
});
for(const args of [[],['--inside','extra'],['--unknown'],['--receipt','relative.json','--timeout-ms','1000','--','node'],['--receipt','/tmp/x.json','--timeout-ms','0','--','node'],['--receipt','/tmp/x.json','--timeout-ms','1000','--timeout-ms','1000','--','node'],['--receipt','/tmp/x.json','--timeout-ms','1000','--probe-only','--','node'],['--receipt','/tmp/x.json','--timeout-ms','1000','--max-output-bytes','999999999999','--','node'],['--receipt','/tmp/x.json','--timeout-ms','1000','--','']])test('invalid CLI shape fails closed '+JSON.stringify(args.map(a=>a.startsWith('/')?'path':a)).slice(0,60),()=>assert.throws(()=>r.parseArgs(args)));
test('probe-only and internal flags have separate strict shapes',()=>{assert.deepEqual(r.parseArgs(['--inside']),{inside:true});assert.equal(r.parseArgs(['--receipt','/tmp/probe.json','--timeout-ms','1000','--probe-only']).probeOnly,true);});
test('environment drops credential, command-file, proxy and debug channels',()=>{
 const e=r.cleanEnv({PATH:'/usr/bin',HOME:'/tmp/disposable',CHROME_PATH:'/safe/chrome',PLAYWRIGHT_MODULE:'/safe/pw',FARM3D_CORE_GROUP:'browser',TEST_ARTIFACTS:'/tmp/private',QUALITY_LANES:'all',GITHUB_SHA:'a'.repeat(40),RUNNER_TRACKING_ID:'tracking',GITHUB_TOKEN:canary,GITHUB_OUTPUT:canary,GITHUB_ENV:canary,GITHUB_STEP_SUMMARY:canary,ACTIONS_ID_TOKEN_REQUEST_TOKEN:canary,AWS_SECRET_ACCESS_KEY:canary,NODE_OPTIONS:canary,DEBUG:canary,PWDEBUG:canary,HTTPS_PROXY:canary,HTTP_PROXY:canary,ALL_PROXY:canary,SSH_AUTH_SOCK:canary});
 noCanary(e);assert.equal(e.FARM3D_CORE_GROUP,'browser');assert.equal(e.TEST_ARTIFACTS,'/tmp/private');assert.equal(e.GIT_ALLOW_PROTOCOL,'');assert.equal(e.GIT_NO_LAZY_FETCH,'1');assert.equal(e.GIT_TERMINAL_PROMPT,'0');assert.equal(e.RUNNER_TRACKING_ID,'tracking');
});
test('environment ignores oversized or NUL values',()=>{assert.equal(r.cleanEnv({PATH:'a'.repeat(9000)}).PATH,undefined);assert.equal(r.cleanEnv({HOME:'x\0y'}).HOME,undefined);});
test('streaming output never emits canaries; TAP totals alone survive',()=>{
 const c=r.outputCollector(100000);const s=canary+'\n'+JSON.stringify({secret:canary})+'\n'+Buffer.from(canary).toString('base64')+'\n# tests 22\n# pass 21\n# fail 1\n# skipped 0\n';
 for(let i=0;i<s.length;i+=3)c.add(0,s.slice(i,i+3));c.add(1,canary);
 const v=c.result();assert.deepEqual(v.tap,{tests:22,pass:21,fail:1,skipped:0});assert.equal(v.stdoutBytes,Buffer.byteLength(s));assert.equal(v.stderrBytes,Buffer.byteLength(canary));assert.equal(v.stdoutSha256,crypto.createHash('sha256').update(s).digest('hex'));noCanary(v);
});
test('untrusted TAP-shaped text and excessively long lines are ignored',()=>{const c=r.outputCollector(100000);c.add(0,'x'.repeat(1000)+'# pass 9\n# pass 9 secret\n# fail -1\n# tests 999999999999999\n# todo 2\n');assert.deepEqual(c.result().tap,{todo:2});});
test('byte cap fires once, across stdout and stderr',()=>{let n=0;const c=r.outputCollector(5,()=>n++);c.add(0,'abcd');c.add(1,'ef');c.add(1,'gh');assert.equal(n,1);assert.equal(c.result().stderrBytes,4);});
test('normal child execution preserves cwd, command args and failure exit',async()=>{
 const f=childFixture(c=>{c.stdout.write(canary);c.stderr.write(Buffer.from(canary).toString('base64'));c.emit('close',7,null);});
 const out=await r.runBounded(['bash','-c','node original.cjs'],{...config,cwd:'/safe/historical',env:{PATH:'/usr/bin',GITHUB_TOKEN:canary}},f.deps);
 assert.equal(out.status,'command_failed');assert.equal(out.exitCode,7);assert.equal(out.commandStarted,true);assert.equal(out.cleanupVerified,true);assert.equal(f.spawns[0][0],'bash');assert.deepEqual(f.spawns[0][1],['-c','node original.cjs']);assert.equal(f.spawns[0][2].cwd,'/safe/historical');noCanary(out);noCanary(f.spawns[0][2].env);
});
test('spawn errors cannot leak arbitrary messages',async()=>{
 const f=childFixture(c=>c.emit('error',new Error(canary)));f.child.pid=undefined;const out=await r.runBounded(['node','x'],config,f.deps);assert.equal(out.status,'command_failed');noCanary(out);
});
test('synchronous spawn failure is finite',async()=>{const out=await r.runBounded(['node','x'],config,{spawn(){throw Error(canary);}});assert.equal(out.status,'configuration_failed');assert.equal(out.commandStarted,false);noCanary(out);});
test('setup callback failure cleans up an already spawned process',async()=>{
 const f=childFixture();const p=r.runBounded(['node','x'],{...config,onChild(){throw Error(canary);}},f.deps);assert.deepEqual(f.kills,[{pid:-43210,signal:'SIGTERM'}]);f.child.emit('close',null,'SIGTERM');const out=await p;assert.equal(out.status,'configuration_failed');noCanary(out);
});
test('normal signal is retained only as a finite enum',async()=>{const f=childFixture(c=>c.emit('close',null,'SIGSEGV'));const out=await r.runBounded(['node','x'],config,f.deps);assert.equal(out.status,'command_signaled');assert.equal(out.signal,'SIGSEGV');});
test('oversized stream terminates rather than falsely passing',async()=>{const f=childFixture(c=>{c.stdout.write('x'.repeat(5000));c.emit('close',0,null);});const out=await r.runBounded(['node','x'],config,f.deps);assert.equal(out.status,'output_limit');assert.equal(f.kills[0].signal,'SIGTERM');});
test('timeout escalates to group kill and cannot hang cleanup',async()=>{const f=childFixture();const p=r.runBounded(['node','x'],config,f.deps);f.fire(20000);f.fire(1500);f.fire(1500);const out=await p;assert.equal(out.status,'cleanup_failed');assert.equal(out.cleanupVerified,false);assert.deepEqual(f.kills.map(k=>k.signal),['SIGTERM','SIGKILL']);});
test('timeout with closed child retains timeout status',async()=>{const f=childFixture();const p=r.runBounded(['node','x'],config,f.deps);f.fire(20000);f.child.emit('close',null,'SIGTERM');assert.equal((await p).status,'timeout');});
test('parent cancellation stops captured workload',async()=>{const f=childFixture();const controller=new AbortController();const p=r.runBounded(['node','x'],{...config,abortSignal:controller.signal},f.deps);controller.abort();f.child.emit('close',null,'SIGTERM');assert.equal((await p).status,'command_signaled');assert.equal(f.kills.length,1);});
test('kill never targets root or an invalid process group',()=>{let n=0;for(const pid of [null,0,1,-1,NaN])assert.equal(r.safeKill({pid},'SIGTERM',()=>n++),false);assert.equal(n,0);assert.equal(r.safeKill({pid:42},'SIGTERM',()=>{const e=Error();e.code='ESRCH';throw e;}),true);});
test('namespace preflight verifies distinct net/user/pid, non-root, loopback and both address families',async()=>{const f=fixture();assert.equal(await r.isolationPreflight(host,f),true);assert.deepEqual(f.calls,[['ip','link','set','lo','up'],'203.0.113.1','2001:db8::1']);});
for(const [name,override] of [['platform',{platform:'win32'}],['root',{uid:()=>0}],['wrong user',{uid:()=>1002}],['wrong group',{gid:()=>1002}],['not PID1',{pid:()=>12}],['same namespace',{readlink:p=>p.endsWith('/net')?host.net:'user:[99]'}],['unreadable namespace',{readlink(){throw Error(canary);}}],['loopback failure',{loopback:async()=>false}],['reachable egress',{blocked:async()=>false}],['ip error',{run:async()=>({...pass(),status:'command_failed',exitCode:1})}],['external interface',{interfaces:()=>({lo:[{internal:true,address:'127.0.0.1'}],eth0:[]})}],['external IPv4 route',{readFile:p=>p.endsWith('ipv6_route')?'':'Iface Destination\neth0 00000000\n'}],['external IPv6 route',{readFile:p=>p.endsWith('ipv6_route')?'0000 eth0\n':'Iface Destination\n'}]])test('isolation fails closed: '+name,async()=>assert.equal(await r.isolationPreflight(host,fixture(override)),false));
test('topology rejects empty, externally addressed and malformed interface data',()=>{for(const x of [null,{}, {lo:[]},{lo:[{address:'127.0.0.1',internal:false}]},{lo:[{address:'203.0.113.1',internal:true}]}])assert.equal(r.topologySafe(x,'Iface\n',''),false);});
test('reserved-address probe only accepts unreachable-family errors',async()=>{
 for(const code of ['ENETUNREACH','EHOSTUNREACH','EAFNOSUPPORT','EADDRNOTAVAIL','ECONNREFUSED','ETIMEDOUT']) {
  let destroyed=0;const socket=new EventEmitter();socket.destroy=()=>destroyed++;const ok=await r.blockedConnect('203.0.113.1',()=>{queueMicrotask(()=>socket.emit('error',{code}));return socket;});assert.equal(ok,['ENETUNREACH','EHOSTUNREACH','EAFNOSUPPORT','EADDRNOTAVAIL'].includes(code));assert.equal(destroyed,1);
 }
});
test('successful external connection fails preflight',async()=>{const socket=new EventEmitter();socket.destroy=()=>{};assert.equal(await r.blockedConnect('203.0.113.1',()=>{queueMicrotask(()=>socket.emit('connect'));return socket;}),false);});
test('historical command never starts before successful preflight',async()=>{let calls=0;const out=await r.executeIsolated({...config,host},{preflight:async()=>false,run:async()=>{calls++;return pass();}});assert.equal(calls,0);assert.equal(out.commandStarted,false);assert.equal(out.status,'isolation_failed');});
test('synthetic probe mode never loads a project command',async()=>{const out=await r.executeIsolated({...config,command:[],probeOnly:true,host},{preflight:async()=>true,run:async()=>{throw Error('must not execute');}});assert.equal(out.commandStarted,false);assert.equal(out.status,'passed');assert.equal(r.validReceipt(out),true);});
test('command executes with its exact argv only after preflight',async()=>{let actual;const out=await r.executeIsolated({...config,host},{preflight:async()=>true,run:async cmd=>{actual=cmd;return pass();}});assert.deepEqual(actual,config.command);assert.equal(out.commandStarted,true);assert.equal(r.validReceipt(out),true);});
test('invalid plan never invokes any preflight or command',async()=>{let n=0;const out=await r.executeIsolated({...config,timeoutMs:0},{preflight:async()=>{n++;return true;}});assert.equal(n,0);assert.equal(out.status,'configuration_failed');});
test('receipt schema rejects arbitrary content and malformed status',()=>{const good={...pass(),isolationVerified:true};assert.equal(r.validReceipt(good),true);for(const v of [{...good,error:canary},{...good,status:canary},{...good,signal:canary},{...good,stdoutSha256:canary},{...good,tap:{name:canary}},{...good,elapsedMs:Infinity},{...good,exitCode:1000},{...good,isolationVerified:false}])assert.equal(r.validReceipt(v),false);assert.equal(r.parseReceipt('{'+canary),null);assert.equal(r.parseReceipt('x'.repeat(8193)),null);});
test('outer launches only namespace bootstrap and sends command through private pipe',async()=>{
 let command,plan;const out=await r.launchOuter(config,{platform:'linux',uid:()=>1001,gid:()=>1001,readlink:p=>'old:'+p,run:async(cmd,opts)=>{command=cmd;const child={stdio:[null,null,null,new PassThrough(),new PassThrough()]};child.stdio[4].on('data',b=>plan=JSON.parse(b));opts.onChild(child,()=>{});child.stdio[3].write(JSON.stringify({...pass(),isolationVerified:true,commandStarted:true}));return pass();}});
 assert.equal(out.status,'passed');assert.deepEqual(plan.command,config.command);assert.equal(command.includes('--keep-caps'),true);assert.equal(command.includes('--net'),true);assert.equal(command.includes('--pid'),true);assert.equal(command.includes('--mount-proc'),true);assert.equal(command.includes('--kill-child=SIGKILL'),true);assert.equal(command.includes('unchanged-test.cjs'),false);assert.equal(command.includes('--no-sandbox'),false);assert.equal(command.includes('sudo'),false);
});
test('unshare failure cannot cause direct-command fallback',async()=>{let count=0;const out=await r.launchOuter(config,{platform:'linux',uid:()=>1001,gid:()=>1001,readlink:()=> 'net:[1]',run:async()=>{count++;return {...pass(),commandStarted:false,status:'command_failed',exitCode:1};}});assert.equal(count,1);assert.equal(out.status,'isolation_failed');assert.equal(out.commandStarted,false);});
test('untrusted inner control payload is withheld and fails closed',async()=>{const out=await r.launchOuter(config,{platform:'linux',uid:()=>1001,gid:()=>1001,readlink:()=> 'net:[1]',run:async(cmd,opts)=>{const child={stdio:[null,null,null,new PassThrough(),new PassThrough()]};opts.onChild(child,()=>{});child.stdio[3].write(JSON.stringify({error:canary}));return pass();}});assert.equal(out.status,'protocol_failed');noCanary(out);});
test('oversized control pipe stops namespace supervisor',async()=>{let stopped;const out=await r.launchOuter(config,{platform:'linux',uid:()=>1001,gid:()=>1001,readlink:()=> 'net:[1]',run:async(cmd,opts)=>{const child={stdio:[null,null,null,new PassThrough(),new PassThrough()]};opts.onChild(child,s=>stopped=s);child.stdio[3].write(canary.repeat(1000));return pass();}});assert.equal(stopped,'protocol_failed');assert.equal(out.status,'protocol_failed');noCanary(out);});
test('receipt write is exclusive and contains only validated fields',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ci-runner-receipt-test-'));const file=path.join(dir,'receipt.json');try{const v={...pass(),isolationVerified:true};r.writeReceipt(file,v);assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),v);assert.throws(()=>r.writeReceipt(file,v));assert.throws(()=>r.writeReceipt(path.join(dir,'bad.json'),{error:canary}));assert.equal(fs.existsSync(path.join(dir,'bad.json')),false);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('standalone runner has no project imports, raw diagnostic writes or sandbox weakening',()=>{const source=fs.readFileSync(require.resolve('./helpers/ci-isolated-runner.cjs'),'utf8');assert.equal(/require\(['"]\./.test(source),false);assert.equal(source.includes('--no-sandbox'),false);assert.equal(source.includes('GITHUB_STEP_SUMMARY'),false);assert.equal(source.includes("stream.on('end'"),true);assert.equal(source.includes('process.exit(125)'),true);});

test('validated baseline IDs and GitHub execution context survive without command-file channels',()=>{
 const e=r.cleanEnv({QUALITY_BASELINE_HEAD:'a'.repeat(40),QUALITY_BASELINE_RUN:'1234',QUALITY_BASELINE_ARTIFACT:'5678',GITHUB_ACTIONS:'true',GITHUB_STEP_SUMMARY:canary});
 assert.equal(e.QUALITY_BASELINE_RUN,'1234');assert.equal(e.QUALITY_BASELINE_ARTIFACT,'5678');assert.equal(e.GITHUB_ACTIONS,'true');assert.equal(e.GITHUB_STEP_SUMMARY,undefined);
 assert.equal(r.cleanEnv({GITHUB_ACTIONS:'false'}).GITHUB_ACTIONS,'false');
 for(const bad of ['0','-1','1x','',canary,'123456789012345678901'])assert.equal(r.cleanEnv({QUALITY_BASELINE_RUN:bad}).QUALITY_BASELINE_RUN,undefined);
 assert.equal(r.cleanEnv({GITHUB_ACTIONS:canary}).GITHUB_ACTIONS,undefined);
});
test('same mount namespace is rejected independently',async()=>assert.equal(await r.isolationPreflight(host,fixture({readlink:p=>p.endsWith('/mnt')?host.mnt:p.endsWith('/net')?'net:[11]':p.endsWith('/user')?'user:[12]':'pid:[13]'})),false));
const zeroCaps='CapInh:\t0000000000000000\nCapPrm:\t0000000000000000\nCapEff:\t0000000000000000\nCapBnd:\t0000000000000000\nCapAmb:\t0000000000000000\nNoNewPrivs:\t1\n';
test('restricted bootstrap requires every capability set cleared and no-new-privileges',()=>{
 assert.equal(r.capabilityStateSafe(zeroCaps),true);
 for(const name of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb']) {
  assert.equal(r.capabilityStateSafe(zeroCaps.replace(name+':\t0000000000000000',name+':\t0000000000000001')),false);
  assert.equal(r.capabilityStateSafe(zeroCaps.replace(new RegExp(name+':[^\n]+\n'),'')),false);
 }
 assert.equal(r.capabilityStateSafe(zeroCaps.replace('NoNewPrivs:\t1','NoNewPrivs:\t0')),false);
});
test('actual command waits for restricted namespace and capabilities proof',async()=>{
 const restricted={uid:1001,gid:1001,net:'net:[11]',user:'user:[12]',pid:'pid:[13]',mnt:'mnt:[14]'};let calls=0;
 const deps={uid:()=>1001,gid:()=>1001,readlink:p=>restricted[p.split('/').at(-1)],readFile:()=>zeroCaps,run:async cmd=>{calls++;assert.deepEqual(cmd,config.command);return pass();}};
 const good=await r.executeRestricted({...config,restricted},deps);assert.equal(good.status,'passed');assert.equal(good.commandStarted,true);assert.equal(calls,1);
 for(const override of [{uid:()=>0},{readFile:()=>zeroCaps.replace('CapEff:\t0000000000000000','CapEff:\t0000000000000001')},{readlink:()=> 'net:[wrong]'}]){calls=0;const bad=await r.executeRestricted({...config,restricted},{...deps,...override});assert.equal(bad.status,'isolation_failed');assert.equal(calls,0);}
});

test('restricted preflight rejection never claims original command started',async()=>{
 const failure=r.baseReceipt('isolation_failed');let calls=0;
 const out=await r.executeIsolated({...config,host},{preflight:async()=>true,launchRestricted:async()=>{calls++;return failure;}});
 assert.equal(calls,1);assert.deepEqual(out,failure);assert.equal(out.commandStarted,false);assert.equal(out.isolationVerified,false);
});

test('ENOENT preserves not-started through restricted execution',async()=>{
 const restricted={uid:1001,gid:1001,net:'net:[11]',user:'user:[12]',pid:'pid:[13]',mnt:'mnt:[14]'};
 const f=childFixture(c=>{const e=Error(canary);e.code='ENOENT';c.emit('error',e);});f.child.pid=undefined;
 const out=await r.executeRestricted({...config,restricted},{uid:()=>1001,gid:()=>1001,readlink:p=>restricted[p.split('/').at(-1)],readFile:()=>zeroCaps,run:(cmd,opts)=>r.runBounded(cmd,opts,f.deps)});
 assert.equal(out.commandStarted,false);assert.equal(out.status,'command_failed');assert.equal(out.cleanupVerified,true);assert.equal(f.kills.length,0);noCanary(out);
});
test('post-spawn errors require cleanup rather than assuming process exit',async()=>{
 const f=childFixture();const pending=r.runBounded(config.command,config,f.deps);f.child.emit('error',Error(canary));assert.equal(f.kills.length,1);f.child.emit('close',null,'SIGTERM');
 const out=await pending;assert.equal(out.commandStarted,true);assert.equal(out.cleanupVerified,true);assert.equal(out.status,'command_failed');
});

test('lost outer receipt records unknown execution, never proven not-started',async()=>{
 for(const status of ['timeout','cleanup_failed','command_signaled','passed']) {
  const out=await r.launchOuter(config,{platform:'linux',uid:()=>1001,gid:()=>1001,readlink:()=> 'ns:[1]',run:async()=>({...pass(),status})});
  assert.equal(out.commandStarted,null);assert.equal(out.commandResultAvailable,false);assert.equal(r.validReceipt(out),true);
 }
});
test('lost restricted receipt records unknown execution',async()=>{
 for(const status of ['timeout','passed']) {
  const out=await r.launchRestricted(config,{run:async()=>({...pass(),status})});
  assert.equal(out.commandStarted,null);assert.equal(out.commandResultAvailable,false);assert.equal(r.validReceipt(out),true);
 }
});
test('receipt distinguishes uncertainty from verified rejection and forbids unknown success',()=>{
 assert.equal(r.validReceipt({...r.baseReceipt('protocol_failed'),commandStarted:null}),true);
 assert.equal(r.validReceipt({...pass(),isolationVerified:true,commandStarted:null}),false);
 assert.equal(r.validReceipt({...r.baseReceipt(),commandStarted:'unknown'}),false);
});

test('captured original-command result is distinguished from unobserved placeholders',async()=>{
 const f=childFixture(c=>{c.stdout.write('synthetic');c.emit('close',1,null);});
 const out=await r.runBounded(config.command,config,f.deps);
 assert.equal(out.commandResultAvailable,true);assert.equal(out.stdoutBytes,9);assert.equal(out.exitCode,1);
 assert.equal(r.baseReceipt('isolation_failed').commandResultAvailable,false);
});

test('original 65-test contract is preserved as an exact prefix',()=>{
 const bytes=fs.readFileSync(__filename);
 assert.equal(crypto.createHash('sha256').update(bytes.subarray(0,22066)).digest('hex'),'0e59ef6328ad2abf822afd68831e81d3e9dfcaa1c46dc3f9da275960e584b7c0');
});
