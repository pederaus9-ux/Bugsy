'use strict';
// Inert trusted-image feasibility only. Never invokes Jekyll or mounts game/source.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),net=require('node:net'),os=require('node:os');
const imageTag='ghcr.io/actions/jekyll-build-pages:v1.0.13';
const entryHash='7b4eea4418b12b872ab2e2612f118d27be25e381b86a4cce0911ea8809b7dd0d';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const base=()=>({schema:1,status:'failed',imageDigest:null,imageId:null,entrypointVerified:false,networkVerified:false,privilegeVerified:false,mountVerified:false,userNamespaceDistinct:null,cleanupVerified:false,gameLoaded:false,buildStarted:false});
function demand(ok){if(!ok)throw Error('probe-failed');}
function blocked(host){return new Promise(resolve=>{let s,done=false;const end=v=>{if(done)return;done=true;clearTimeout(t);s?.destroy();resolve(v);};const t=setTimeout(()=>end(false),1500);try{s=net.createConnection({host,port:9});s.once('connect',()=>end(false));s.once('error',e=>end(['ENETUNREACH','EHOSTUNREACH','EAFNOSUPPORT','EADDRNOTAVAIL'].includes(e.code)));}catch{end(false);}});}
function loopback(){return new Promise(resolve=>{let srv,s,done=false;const peers=new Set();const end=ok=>{if(done)return;done=true;clearTimeout(t);s?.destroy();for(const p of peers)p.destroy();try{srv.close(()=>resolve(ok));}catch{resolve(false);}};const t=setTimeout(()=>end(false),1500);srv=net.createServer(p=>{peers.add(p);p.on('close',()=>peers.delete(p));});srv.on('error',()=>end(false));srv.listen(0,'127.0.0.1',()=>{s=net.createConnection({host:'127.0.0.1',port:srv.address().port});s.once('connect',()=>end(true));s.once('error',()=>end(false));});});}
async function inside(){const r=base();try{
 demand(process.pid===1 && process.getuid()===Number(process.env.EXPECT_UID) && process.getuid()>0 && process.getgid()===Number(process.env.EXPECT_GID));
 for(const n of ['net','pid','mnt'])demand(fs.readlinkSync('/proc/self/ns/'+n)!==process.env['HOST_NS_'+n.toUpperCase()]);
 r.userNamespaceDistinct=fs.readlinkSync('/proc/self/ns/user')!==process.env.HOST_NS_USER;
 const status=fs.readFileSync('/proc/self/status','utf8');
 for(const k of ['CapInh','CapPrm','CapEff','CapBnd','CapAmb']){const m=status.match(new RegExp('^'+k+':\\s*([a-fA-F0-9]+)$','m'));demand(m&&/^0+$/.test(m[1]));}
 demand(/^NoNewPrivs:\s*1$/m.test(status));r.privilegeVerified=true;
 const ifaces=os.networkInterfaces();demand(Object.keys(ifaces).length===1 && Array.isArray(ifaces.lo)&&ifaces.lo.length>0);
 demand(ifaces.lo.every(a=>a.internal&&['127.0.0.1','::1'].includes(a.address)));
 const routes=fs.readFileSync('/proc/net/route','utf8').trim().split('\n').slice(1);demand(routes.every(l=>!l.trim()||l.trim().split(/\s+/)[0]==='lo'));
 const routes6=fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n');demand(routes6.every(l=>!l.trim()||l.trim().split(/\s+/).at(-1)==='lo'));
 demand(await loopback());demand(await blocked('203.0.113.1'));demand(await blocked('2001:db8::1'));r.networkVerified=true;
 const mounts=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n').filter(Boolean).map(l=>l.split(' '));
 const root=mounts.find(m=>m[4]==='/'),probe=mounts.find(m=>m[4]==='/probe.cjs');demand(root&&root[5].split(',').includes('ro')&&probe&&probe[5].split(',').includes('ro'));
 demand(!fs.existsSync('/var/run/docker.sock')&&!fs.existsSync('/github/workspace'));r.mountVerified=true;
 demand(hash(fs.readFileSync('/entrypoint.sh'))===entryHash);r.entrypointVerified=true;r.status='passed';
 }catch{}process.stdout.write(JSON.stringify(r)+'\n');process.exitCode=r.status==='passed'?0:125;}
let dockerEnv=null;
function docker(args,timeout=30000){demand(dockerEnv!==null);const r=cp.spawnSync('docker',args,{encoding:'utf8',maxBuffer:65536,timeout,env:dockerEnv,stdio:['ignore','pipe','pipe']});demand(!r.error&&r.status===0);return r.stdout.trim();}
function inspect(id){return JSON.parse(docker(['inspect',id]))[0];}
function receiptValid(r){return r&&Object.keys(r).sort().join('|')===Object.keys(base()).sort().join('|')&&r.schema===1&&r.status==='passed'&&r.entrypointVerified===true&&r.networkVerified===true&&r.privilegeVerified===true&&r.mountVerified===true&&typeof r.userNamespaceDistinct==='boolean'&&r.gameLoaded===false&&r.buildStarted===false&&r.cleanupVerified===false&&r.imageDigest===null&&r.imageId===null;}
async function host(receipt){let cid=null;let r=base();try{
 demand(process.platform==='linux'&&process.getuid()>0&&path.isAbsolute(receipt)&&receipt.endsWith('.json')&&!fs.existsSync(receipt));
 const cleanConfig=fs.mkdtempSync(path.join(os.tmpdir(),'sunny-inert-docker-'));fs.chmodSync(cleanConfig,0o700);
 dockerEnv={PATH:process.env.PATH,HOME:cleanConfig,DOCKER_CONFIG:cleanConfig};
 // Anonymous trusted official image acquisition only, before any app input exists.
 docker(['pull',imageTag],120000);
 const image=JSON.parse(docker(['image','inspect',imageTag]))[0];
 const digest=image.RepoDigests?.find(s=>/^ghcr\.io\/actions\/jekyll-build-pages@sha256:[a-f0-9]{64}$/.test(s));demand(digest&&/^sha256:[a-f0-9]{64}$/.test(image.Id));
 demand(JSON.stringify(image.Config.Entrypoint)===JSON.stringify(['/entrypoint.sh']));r.imageDigest=digest;r.imageId=image.Id;
 const args=['create','--pull=never','--network=none','--user',`${process.getuid()}:${process.getgid()}`,'--cap-drop=ALL','--security-opt=no-new-privileges','--read-only','--log-driver=none','--pids-limit=64','--memory=256m','--cpus=1','--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=16m','--mount',`type=bind,src=${fs.realpathSync(__filename)},dst=/probe.cjs,readonly`,'--entrypoint','node'];
 for(const [k,v] of Object.entries({EXPECT_UID:String(process.getuid()),EXPECT_GID:String(process.getgid()),...Object.fromEntries(['net','pid','mnt','user'].map(n=>['HOST_NS_'+n.toUpperCase(),fs.readlinkSync('/proc/self/ns/'+n)]))}))args.push('--env',`${k}=${v}`);
 args.push(digest,'/probe.cjs','--inside');cid=docker(args);demand(/^[a-f0-9]{64}$/.test(cid));
 const meta=inspect(cid);demand(meta.Image===image.Id&&meta.HostConfig.NetworkMode==='none'&&meta.HostConfig.ReadonlyRootfs===true&&meta.HostConfig.Privileged===false&&meta.HostConfig.LogConfig.Type==='none');
 demand(meta.Mounts.length===1&&meta.Mounts[0].Destination==='/probe.cjs'&&meta.Mounts[0].RW===false);
 const text=docker(['start','--attach',cid],15000);demand(Buffer.byteLength(text)<=2048);const inner=JSON.parse(text);demand(receiptValid(inner));r={...inner,imageDigest:digest,imageId:image.Id};
 const state=inspect(cid).State;demand(state.Running===false&&state.ExitCode===0);
 }catch{r.status='failed';}
 finally{if(cid&&/^[a-f0-9]{64}$/.test(cid))try{let s=inspect(cid).State;if(s.Running){try{docker(['stop','--time','1',cid],5000);}catch{}s=inspect(cid).State;}if(s.Running){docker(['kill',cid],5000);s=inspect(cid).State;}demand(s.Running===false);docker(['rm',cid]);const q=cp.spawnSync('docker',['ps','-aq','--no-trunc','--filter',`id=${cid}`],{encoding:'utf8',timeout:5000,maxBuffer:4096,env:dockerEnv,stdio:['ignore','pipe','pipe']});demand(!q.error&&q.status===0&&q.stdout.trim()==='');r.cleanupVerified=true;}catch{r.status='failed';r.cleanupVerified=false;}}
 if(!r.cleanupVerified)r.status='failed';fs.writeFileSync(receipt,JSON.stringify(r)+'\n',{flag:'wx',mode:0o600});process.stdout.write(JSON.stringify(r)+'\n');process.exitCode=r.status==='passed'?0:125;
}
if(require.main===module){if(process.argv.length===3&&process.argv[2]==='--inside')inside();else if(process.argv.length===3)host(process.argv[2]).catch(()=>{process.stdout.write(JSON.stringify(base())+'\n');process.exitCode=125;});else process.exitCode=125;}
module.exports={receiptValid,base};
