'use strict';
// Test infrastructure only. No project module is loaded before the kernel isolation
// preflight. Raw child diagnostics are counted/hashed, never printed or exported.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const EMPTY_HASH = crypto.createHash('sha256').digest('hex');
const STATUSES = new Set(['passed','command_failed','command_signaled','timeout','output_limit','isolation_failed','protocol_failed','cleanup_failed','configuration_failed']);
const SIGNALS = new Set(['SIGTERM','SIGKILL','SIGINT','SIGABRT','SIGSEGV','SIGBUS','SIGILL','SIGFPE','SIGHUP','SIGQUIT','SIGPIPE','SIGXCPU','SIGXFSZ']);
const ENV_KEYS = new Set(['PATH','HOME','TMPDIR','TMP','TEMP','LANG','LC_ALL','TZ','CHROME_PATH','PLAYWRIGHT_MODULE','TEST_ARTIFACTS','FARM3D_CORE_GROUP','QUALITY_LANES','QUALITY_BASELINE_HEAD','QUALITY_BASELINE_REPORT','QUALITY_HEAD_BRANCH','QUALITY_ARTIFACT_ROOT','PEN_MATRIX_EDIT_CLASS','PEN_MATRIX_SEED','PEN_MATRIX_RATE_HZ','GITHUB_WORKSPACE','GITHUB_SHA','GITHUB_REF_NAME','GITHUB_HEAD_REF','GITHUB_REPOSITORY','GITHUB_RUN_ID','GITHUB_SERVER_URL','RUNNER_TEMP','RUNNER_TRACKING_ID']);
const KEYS = ['schema','status','isolationVerified','commandStarted','commandResultAvailable','cleanupVerified','exitCode','signal','stdoutBytes','stderrBytes','stdoutSha256','stderrSha256','elapsedMs','tap'];
const TAP_KEYS = ['tests','pass','fail','cancelled','skipped','todo'];
const integer = (x,lo,hi) => Number.isSafeInteger(x) && x >= lo && x <= hi;
function cleanEnv(source = process.env) {
  const result = {};
  for (const key of ENV_KEYS) if (typeof source[key] === 'string' && source[key].length <= 8192 && !source[key].includes('\0')) result[key] = source[key];
  for(const key of ['QUALITY_BASELINE_RUN','QUALITY_BASELINE_ARTIFACT']) if(typeof source[key]==='string' && /^[1-9][0-9]{0,19}$/.test(source[key]))result[key]=source[key];
  if(source.GITHUB_ACTIONS==='true'||source.GITHUB_ACTIONS==='false')result.GITHUB_ACTIONS=source.GITHUB_ACTIONS;
  return Object.assign(result, {CI:'true',GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0',POWERSHELL_TELEMETRY_OPTOUT:'1'});
}
function baseReceipt(status='configuration_failed') {
  return {schema:1,status,isolationVerified:false,commandStarted:false,commandResultAvailable:false,cleanupVerified:false,exitCode:null,signal:null,stdoutBytes:0,stderrBytes:0,stdoutSha256:EMPTY_HASH,stderrSha256:EMPTY_HASH,elapsedMs:0,tap:{}};
}
// commandResultAvailable:false marks exit/output/count/hash/TAP placeholders as
// unobserved, not zero output or an observed empty digest.
// null means the command may have run but its receipt was lost; never infer safe retry.
function transportFailure(status,transport,probeOnly=false) {
  return {...baseReceipt(status),commandStarted:probeOnly||transport.commandStarted===false?false:null,elapsedMs:transport.elapsedMs};
}
function validReceipt(r) {
  if (!r || typeof r!=='object' || Array.isArray(r) || Object.keys(r).sort().join('|')!==[...KEYS].sort().join('|')) return false;
  if (r.schema!==1 || !STATUSES.has(r.status) || ['isolationVerified','commandResultAvailable','cleanupVerified'].some(k=>typeof r[k]!=='boolean') || !(r.commandStarted===null || typeof r.commandStarted==='boolean')) return false;
  if (!(r.exitCode===null || integer(r.exitCode,0,255)) || !(r.signal===null || SIGNALS.has(r.signal))) return false;
  if (!integer(r.stdoutBytes,0,2**40) || !integer(r.stderrBytes,0,2**40) || !integer(r.elapsedMs,0,86400000)) return false;
  if (![r.stdoutSha256,r.stderrSha256].every(s=>typeof s==='string' && /^[a-f0-9]{64}$/.test(s))) return false;
  if (!r.tap || typeof r.tap!=='object' || Array.isArray(r.tap) || Object.keys(r.tap).some(k=>!TAP_KEYS.includes(k)||!integer(r.tap[k],0,1e9))) return false;
  if (r.commandStarted && !r.isolationVerified) return false;
  if (r.status==='passed' && (r.commandStarted===null || !r.isolationVerified || !r.cleanupVerified || r.exitCode!==0 || r.signal!==null)) return false;
  return true;
}
function validateConfig(c) {
  return !!c && integer(c.timeoutMs,1000,3600000) && integer(c.maxOutputBytes,1024,67108864) && typeof c.probeOnly==='boolean'
    && Array.isArray(c.command) && c.command.length<=128 && c.command.every(s=>typeof s==='string'&&s.length<=32768&&!s.includes('\0'))
    && (c.probeOnly ? c.command.length===0 : c.command.length>0 && c.command[0].length>0)
    && Buffer.byteLength(JSON.stringify(c.command))<=65536;
}
function parseArgs(args) {
  if (args.length===1 && args[0]==='--inside') return {inside:true};
  if (args.length===1 && args[0]==='--restricted') return {restricted:true};
  const c={timeoutMs:null,maxOutputBytes:16777216,probeOnly:false,command:[],receipt:null}; const seen=new Set();
  for (let i=0;i<args.length;i++) {
    const key=args[i];
    if (key==='--') { c.command=args.slice(i+1); break; }
    if (!['--receipt','--timeout-ms','--max-output-bytes','--probe-only'].includes(key) || seen.has(key)) throw Error('configuration');
    seen.add(key);
    if(key==='--probe-only') {c.probeOnly=true;continue;}
    const value=args[++i]; if(typeof value!=='string'||value.startsWith('--')) throw Error('configuration');
    if(key==='--receipt') c.receipt=value;
    else {if(!/^\d+$/.test(value))throw Error('configuration');c[key==='--timeout-ms'?'timeoutMs':'maxOutputBytes']=Number(value);}
  }
  if(!validateConfig(c)||typeof c.receipt!=='string'||!path.isAbsolute(c.receipt)||!c.receipt.endsWith('.json'))throw Error('configuration');
  return c;
}
function outputCollector(limit,onLimit=()=>{}) {
  const hashes=[crypto.createHash('sha256'),crypto.createHash('sha256')], bytes=[0,0];
  const tap={}; let tail='',overflow=false,limited=false;
  return {
    add(stream,chunk) {
      const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk); bytes[stream]+=b.length;hashes[stream].update(b);
      if(bytes[0]+bytes[1]>limit&&!limited){limited=true;onLimit();}
      if(stream===0) for(const byte of b) {
        if(byte===10) {
          if(!overflow){const m=/^# (tests|pass|fail|cancelled|skipped|todo) (\d{1,10})\r?$/.exec(tail);if(m&&integer(Number(m[2]),0,1e9))tap[m[1]]=Number(m[2]);}
          tail='';overflow=false;
        } else if(!overflow) {if(tail.length>=64){tail='';overflow=true;}else tail+=String.fromCharCode(byte);}
      }
    },
    result(){return {stdoutBytes:bytes[0],stderrBytes:bytes[1],stdoutSha256:hashes[0].digest('hex'),stderrSha256:hashes[1].digest('hex'),tap};}
  };
}
function safeKill(child,signal,kill=process.kill.bind(process)) {
  if(!child || !integer(child.pid,2,2**31-1))return false;
  try {kill(-child.pid,signal);return true;} catch(e) {return e&&e.code==='ESRCH';}
}
async function runBounded(command,options,overrides={}) {
  const spawn=overrides.spawn||cp.spawn, now=overrides.now||Date.now, set=overrides.setTimeout||setTimeout, clear=overrides.clearTimeout||clearTimeout;
  const began=now(); let child,reason=null,ended=false,closed=false,started=false; const timers=[];
  return new Promise(resolve=>{
    const finish=(code=null,signal=null)=>{
      if(ended)return;ended=true;for(const t of timers)clear(t);
      options.abortSignal?.removeEventListener('abort',abort);
      const status=reason||(signal?'command_signaled':code===0?'passed':'command_failed');
      const result={...baseReceipt(status),...collector.result(),exitCode:integer(code,0,255)?code:null,signal:SIGNALS.has(signal)?signal:null,elapsedMs:Math.min(86400000,Math.max(0,now()-began)),cleanupVerified:closed,commandStarted:started,commandResultAvailable:started};
      resolve(result);
    };
    const stop=why=>{
      if(ended||reason)return;reason=why;
      safeKill(child,'SIGTERM',overrides.kill);
      timers.push(set(()=>{safeKill(child,'SIGKILL',overrides.kill);timers.push(set(()=>{reason='cleanup_failed';finish();},1500));},1500));
    };
    const abort=()=>stop('command_signaled');
    const collector=outputCollector(options.maxOutputBytes,()=>stop('output_limit'));
    try {
      child=spawn(command[0],command.slice(1),{cwd:options.cwd||process.cwd(),env:cleanEnv(options.env),detached:true,stdio:options.stdio||['ignore','pipe','pipe']});
      started=integer(child.pid,2,2**31-1);
      child.stdout.on('data',b=>collector.add(0,b));child.stderr.on('data',b=>collector.add(1,b));
      child.on('error',()=>{if(started){stop('command_failed');}else{reason=reason||'command_failed';closed=true;finish();}});
      child.on('close',(code,signal)=>{closed=true;finish(code,signal);});
      options.onChild?.(child,stop);
      timers.push(set(()=>stop('timeout'),options.timeoutMs));
      options.abortSignal?.addEventListener('abort',abort,{once:true});
      if(options.abortSignal?.aborted)abort();
    } catch {if(child&&integer(child.pid,2,2**31-1)){stop('configuration_failed');}else{reason='configuration_failed';closed=true;finish();}}
  });
}
function topologySafe(interfaces,route4,route6) {
  if(!interfaces||Object.keys(interfaces).some(n=>n!=='lo')||!Array.isArray(interfaces.lo)||!interfaces.lo.length)return false;
  if(interfaces.lo.some(a=>!a.internal||!['127.0.0.1','::1'].includes(a.address)))return false;
  const rows=route4.trim().split(/\n/).slice(1).filter(Boolean);
  if(rows.some(line=>line.trim().split(/\s+/)[0]!=='lo'))return false;
  const rows6=route6.trim().split(/\n/).filter(Boolean);
  return !rows6.some(line=>line.trim().split(/\s+/).at(-1)!=='lo');
}
function blockedConnect(host,connect=net.createConnection,timer=setTimeout,clear=clearTimeout) {
  return new Promise(resolve=>{
    let done=false,socket;const finish=ok=>{if(done)return;done=true;clear(t);socket?.destroy();resolve(ok);};
    const t=timer(()=>finish(false),1500);
    try {socket=connect({host,port:9});socket.once('connect',()=>finish(false));socket.once('error',e=>finish(['ENETUNREACH','EHOSTUNREACH','EAFNOSUPPORT','EADDRNOTAVAIL'].includes(e&&e.code)));} catch {finish(false);}
  });
}
function loopbackWorks(createServer=net.createServer,connect=net.createConnection) {
  return new Promise(resolve=>{
    let done=false,server,socket;const peers=new Set();const timer=setTimeout(()=>finish(false),1500);
    function finish(ok){if(done)return;done=true;clearTimeout(timer);socket?.destroy();for(const p of peers)p.destroy();try{server?.close(()=>resolve(ok));}catch{resolve(false);}}
    try {server=createServer(s=>{peers.add(s);s.on('close',()=>peers.delete(s));});server.once('error',()=>finish(false));server.listen(0,'127.0.0.1',()=>{socket=connect({host:'127.0.0.1',port:server.address().port});socket.once('error',()=>finish(false));socket.once('connect',()=>finish(true));});}catch{finish(false);}
  });
}
async function isolationPreflight(host,overrides={}) {
  const platform=overrides.platform||process.platform, uid=overrides.uid||(()=>process.getuid()), gid=overrides.gid||(()=>process.getgid()), pid=overrides.pid||(()=>process.pid);
  const link=overrides.readlink||fs.readlinkSync, read=overrides.readFile||((p)=>fs.readFileSync(p,'utf8'));
  if(platform!=='linux'||!host||!integer(host.uid,1,2**31-1)||!integer(host.gid,0,2**31-1)||uid()!==host.uid||gid()!==host.gid||pid()!==1)return false;
  try {
    for(const k of ['net','user','pid','mnt']) {const current=link('/proc/self/ns/'+k);if(!/^\w+:\[\d+\]$/.test(current)||current===host[k])return false;}
    const up=await (overrides.run||runBounded)(['ip','link','set','lo','up'],{timeoutMs:3000,maxOutputBytes:1024,env:process.env});
    if(up.status!=='passed'||!up.cleanupVerified)return false;
    if(!topologySafe((overrides.interfaces||os.networkInterfaces)(),read('/proc/net/route'),read('/proc/net/ipv6_route')))return false;
    if(!await(overrides.loopback||loopbackWorks)())return false;
    for(const addr of ['203.0.113.1','2001:db8::1'])if(!await(overrides.blocked||blockedConnect)(addr))return false;
    return true;
  }catch{return false;}
}
async function executeIsolated(plan,overrides={}) {
  if(!validateConfig(plan))return baseReceipt('configuration_failed');
  if(!await(overrides.preflight||isolationPreflight)(plan.host))return baseReceipt('isolation_failed');
  if(plan.probeOnly)return {...baseReceipt('passed'),isolationVerified:true,cleanupVerified:true,exitCode:0};
  if(!overrides.run)return (overrides.launchRestricted||launchRestricted)(plan);
  const result=await overrides.run(plan.command,{timeoutMs:plan.timeoutMs,maxOutputBytes:plan.maxOutputBytes,env:process.env});
  return {...result,isolationVerified:true};
}
function parseReceipt(text) {
  if(typeof text!=='string'||Buffer.byteLength(text)>8192)return null;
  try {const r=JSON.parse(text);return validReceipt(r)?r:null;}catch{return null;}
}
async function launchOuter(config,overrides={}) {
  if((overrides.platform||process.platform)!=='linux'||!validateConfig(config))return baseReceipt('configuration_failed');
  const link=overrides.readlink||fs.readlinkSync;let host;
  try {host={uid:(overrides.uid||process.getuid.bind(process))(),gid:(overrides.gid||process.getgid.bind(process))()};for(const k of ['net','user','pid','mnt'])host[k]=link('/proc/self/ns/'+k);if(host.uid===0)return baseReceipt('isolation_failed');}catch{return baseReceipt('isolation_failed');}
  const plan={timeoutMs:config.timeoutMs,maxOutputBytes:config.maxOutputBytes,probeOnly:config.probeOnly,command:config.command,host};
  let message='',protocolError=false;
  const command=['unshare','--user','--map-current-user','--keep-caps','--net','--pid','--fork','--kill-child=SIGKILL','--mount','--mount-proc','--',process.execPath,__filename,'--inside'];
  const transport=await(overrides.run||runBounded)(command,{timeoutMs:config.timeoutMs,maxOutputBytes:16384,env:process.env,abortSignal:config.abortSignal,stdio:['ignore','pipe','pipe','pipe','pipe'],onChild(child,stop){
    child.stdio[3].on('data',b=>{if(Buffer.byteLength(message)+b.length>8192){protocolError=true;stop('protocol_failed');}else message+=b.toString('utf8');});
    child.stdio[3].on('error',()=>{protocolError=true;stop('protocol_failed');});
    child.stdio[4].on('error',()=>{protocolError=true;stop('protocol_failed');});
    child.stdio[4].write(JSON.stringify(plan)+'\n');
  }});
  if(protocolError)return transportFailure('protocol_failed',transport,config.probeOnly);
  if(transport.status!=='passed'||!transport.cleanupVerified)return transportFailure(['timeout','output_limit','cleanup_failed','command_signaled'].includes(transport.status)?transport.status:'isolation_failed',transport,config.probeOnly);
  const result=parseReceipt(message);if(!result)return transportFailure('protocol_failed',transport,config.probeOnly);
  return {...result,cleanupVerified:true,elapsedMs:transport.elapsedMs};
}
function capabilityStateSafe(status) {
  if(typeof status!=='string')return false;
  for(const name of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb']) {
    const hits=[...status.matchAll(new RegExp('^'+name+':\\s*([a-fA-F0-9]+)$','gm'))];
    if(hits.length!==1||!/^0+$/.test(hits[0][1]))return false;
  }
  return /^NoNewPrivs:\s*1$/m.test(status);
}
async function executeRestricted(plan,overrides={}) {
  const read=overrides.readFile||((p)=>fs.readFileSync(p,'utf8')),link=overrides.readlink||fs.readlinkSync;
  const uid=overrides.uid||(()=>process.getuid()),gid=overrides.gid||(()=>process.getgid());
  try {
    if(!validateConfig(plan)||!plan.restricted||uid()===0||uid()!==plan.restricted.uid||gid()!==plan.restricted.gid)return baseReceipt('isolation_failed');
    for(const k of ['net','user','pid','mnt'])if(link('/proc/self/ns/'+k)!==plan.restricted[k])return baseReceipt('isolation_failed');
    if(!capabilityStateSafe(read('/proc/self/status')))return baseReceipt('isolation_failed');
    const result=await(overrides.run||runBounded)(plan.command,{timeoutMs:plan.timeoutMs,maxOutputBytes:plan.maxOutputBytes,env:process.env});
    return {...result,isolationVerified:true};
  }catch{return baseReceipt('isolation_failed');}
}
async function launchRestricted(plan,overrides={}) {
  const restricted={uid:process.getuid(),gid:process.getgid()};
  for(const k of ['net','user','pid','mnt'])restricted[k]=fs.readlinkSync('/proc/self/ns/'+k);
  let message='',bad=false;
  const command=['setpriv','--no-new-privs','--inh-caps=-all','--ambient-caps=-all','--bounding-set=-all','--',process.execPath,__filename,'--restricted'];
  const transport=await(overrides.run||runBounded)(command,{timeoutMs:plan.timeoutMs,maxOutputBytes:16384,env:process.env,stdio:['ignore','pipe','pipe','pipe','pipe'],onChild(child,stop){
    child.stdio[3].on('data',b=>{if(Buffer.byteLength(message)+b.length>8192){bad=true;stop('protocol_failed');}else message+=b.toString('utf8');});
    child.stdio[3].on('error',()=>{bad=true;stop('protocol_failed');});
    child.stdio[4].on('error',()=>{bad=true;stop('protocol_failed');});
    child.stdio[4].write(JSON.stringify({...plan,restricted})+'\n');
  }});
  if(bad)return transportFailure('protocol_failed',transport);
  if(transport.status!=='passed'||!transport.cleanupVerified)return transportFailure('isolation_failed',transport);
  return parseReceipt(message)||transportFailure('protocol_failed',transport);
}
function readPlan(fd=4) {
  return new Promise((resolve,reject)=>{
    let received=false,buffer='';const stream=new net.Socket({fd,readable:true,writable:false});
    const timer=setTimeout(()=>{reject(Error('protocol'));},5000);
    stream.on('data',b=>{
      if(received){process.exit(125);return;}
      if(Buffer.byteLength(buffer)+b.length>131072){clearTimeout(timer);reject(Error('protocol'));return;}
      buffer+=b.toString('utf8');const end=buffer.indexOf('\n');if(end<0)return;
      clearTimeout(timer);received=true;
      if(end!==buffer.length-1){reject(Error('protocol'));return;}
      try{resolve(JSON.parse(buffer.slice(0,end)));}catch{reject(Error('protocol'));}
    });
    // A killed outer wrapper closes its only writing end. PID1 exits, causing
    // the kernel to kill every descendant, including detached browser children.
    stream.on('end',()=>{clearTimeout(timer);if(!received)reject(Error('protocol'));else process.exit(125);});
    stream.on('error',()=>{clearTimeout(timer);if(!received)reject(Error('protocol'));else process.exit(125);});
  });
}
function writeReceipt(file,receipt) {
  if(!validReceipt(receipt))throw Error('receipt');
  fs.writeFileSync(file,JSON.stringify(receipt)+'\n',{flag:'wx',mode:0o600});
}
async function main(args=process.argv.slice(2)) {
  let config;
  try{config=parseArgs(args);}catch{process.stdout.write(JSON.stringify(baseReceipt('configuration_failed'))+'\n');return 125;}
  if(config.inside||config.restricted) {
    let result;
    try{const plan=await readPlan();result=await(config.restricted?executeRestricted(plan):executeIsolated(plan));}catch{result=baseReceipt('isolation_failed');}
    try{fs.writeSync(3,JSON.stringify(validReceipt(result)?result:baseReceipt('protocol_failed')));}catch{}
    // Do not leave namespace PID1 running after the finite response.
    process.exit(0);
  }
  const controller=new AbortController();const abort=()=>controller.abort();process.once('SIGTERM',abort);process.once('SIGINT',abort);
  let result;
  try{result=await launchOuter({...config,abortSignal:controller.signal});}catch{result=baseReceipt('isolation_failed');}
  process.removeListener('SIGTERM',abort);process.removeListener('SIGINT',abort);
  try{writeReceipt(config.receipt,result);}catch{result=baseReceipt('configuration_failed');}
  process.stdout.write(JSON.stringify(result)+'\n');
  return result.status==='passed'?0:result.exitCode&&result.exitCode!==0?result.exitCode:125;
}
module.exports={cleanEnv,baseReceipt,validReceipt,validateConfig,parseArgs,outputCollector,safeKill,runBounded,topologySafe,blockedConnect,isolationPreflight,executeIsolated,parseReceipt,launchOuter,capabilityStateSafe,executeRestricted,launchRestricted,writeReceipt,main};
if(require.main===module)main().then(code=>{process.exitCode=code;},()=>{process.stdout.write(JSON.stringify(baseReceipt('configuration_failed'))+'\n');process.exitCode=125;});
