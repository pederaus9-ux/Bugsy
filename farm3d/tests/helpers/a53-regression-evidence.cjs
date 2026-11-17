'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {validReceipt}=require('./ci-isolated-runner.cjs'),{validReport}=require('./a53-regression-schema.cjs');
const BASE='a72c850fd9715412da0ee9a5646abac16c6e5c92',MANIFEST='7a3241f8c3287d316a8f78152d9bb94d07ee42fd58bd56ca34370ec05cda6f01';
const added=['.github/workflows/a53-nearest-transit-qualification.yml','farm3d/tests/fixtures/a53-nearest-source-files.sha256'];
const modified=['farm3d/index.html','farm3d/tests/helpers/a53-regression-evidence.cjs','farm3d/tests/a53-regression-diagnostic.test.cjs'];
const expectedChanges=[...added.map(f=>'A\t'+f),...modified.map(f=>'M\t'+f)];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function reject(){throw Error('Finite regression evidence rejected');}
function dir(p){p=path.resolve(p);if(fs.realpathSync(p)!==p||!fs.lstatSync(p).isDirectory())reject();return p;}
function regular(p,max=65536){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>max||fs.realpathSync(p)!==path.resolve(p))reject();return fs.readFileSync(p);}
function git(root,args){return execFileSync('git',['--no-lazy-fetch','-C',root,'-c','protocol.allow=never','-c','core.hooksPath=/dev/null',...args],{encoding:'utf8',timeout:10000,maxBuffer:65536,stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}}).trim();}
function verifySource(root,head,readGit=git){
 if(!/^[a-f0-9]{40}$/.test(head||'')||readGit(root,['rev-parse','HEAD'])!==head||readGit(root,['rev-parse','HEAD^'])!==BASE)reject();
 const changes=readGit(root,['diff','--name-status',BASE,'HEAD','--']).split('\n').filter(Boolean);if(changes.length!==expectedChanges.length||new Set(changes).size!==expectedChanges.length||changes.some(x=>!expectedChanges.includes(x)))reject();
 readGit(root,['diff','--quiet','HEAD','--']);readGit(root,['diff','--cached','--quiet','--']);
 const raw=regular(path.join(root,'farm3d/tests/fixtures/a53-nearest-source-files.sha256'));if(sha(raw)!==MANIFEST)reject();
 const lines=raw.toString().trim().split('\n');for(const line of lines){const m=/^([a-f0-9]{64})  ([A-Za-z0-9_./-]+)$/.exec(line);if(!m||m[2].split('/').includes('..')||path.isAbsolute(m[2])||sha(regular(path.join(root,m[2]),2*1024*1024))!==m[1])reject();}
 return{base:BASE,candidateManifestSha256:MANIFEST,candidateFilesVerified:lines.length,trackedSourceUnchanged:true};
}
function readTelemetry(root){
 const file=path.join(root,'artifacts/a53-regression-diagnostic/stall.json');
 if(!fs.existsSync(file))return{status:'INCOMPLETE',samples:[]};
 const raw=regular(file),v=JSON.parse(raw),{encode}=require('./stall/projector.cjs');
 if(JSON.stringify(v)===JSON.stringify({schema:1,scope:'synthetic-v1-stall-only',valid:false}))return{status:'INVALID',samples:[]};
 const clean=JSON.parse(encode(v.samples));if(JSON.stringify(v)!==JSON.stringify(clean))reject();
 let complete=true;for(const hz of [30,60,120])for(const reverse of [false,true]){const rows=clean.samples.filter(s=>s.hz===hz&&s.reverse===reverse),start=rows.find(s=>s.checkpoint==='start'),end=rows.find(s=>s.checkpoint==='terminal'),stall=rows.find(s=>s.checkpoint==='first-stall');if(!start||!end)complete=false;if(start&&start.simSeconds!==0||end&&end.simSeconds<=0||stall&&(stall.simSeconds<30||end&&stall.simSeconds>end.simSeconds))reject();}
 return{status:complete?'COMPLETE':'INCOMPLETE',samples:clean.samples};
}
function collect({source,output,root,head},readGit=git){source=dir(source);root=dir(root);output=path.resolve(output);if(fs.existsSync(output)||dir(path.dirname(output))!==path.dirname(output))reject();const preservation=verifySource(root,head,readGit);
 const names=fs.readdirSync(source);if(!names.length||names.some(n=>!['namespace.json','controls.json','regressions.json'].includes(n)))reject();const receipts={};for(const n of names){const r=JSON.parse(regular(path.join(source,n),16384));if(!validReceipt(r))reject();receipts[n]=r;}
 const file=path.join(root,'artifacts/a53-regression-diagnostic/failures.json');let report=null;if(fs.existsSync(file))report=JSON.parse(regular(file));if(report&&!validReport(report))reject();
 const r=receipts['regressions.json'];if(report){if(!r||!r.commandStarted||!r.commandResultAvailable||!r.isolationVerified||!r.cleanupVerified||r.signal!==null||!['passed','command_failed'].includes(r.status))reject();if(report.status==='PASS'){if(report.summary.counts.tests!==16||report.summary.counts.topLevel!==16||report.summary.counts.passed!==16||report.summary.counts.skipped!==0||report.summary.counts.todo!==0||report.summary.counts.suites!==0)reject();if(r.status!=='passed'||r.exitCode!==0)reject();}else if(report.status==='FAIL'){if(r.status!=='command_failed'||r.exitCode===null||r.exitCode===0)reject();}else if(r.status==='passed')reject();}
 if(r?.status==='passed'&&report?.status!=='PASS')reject();
 const telemetry=readTelemetry(root);if(report?.status==='PASS'&&telemetry.status!=='COMPLETE')reject();if(telemetry.samples.length&&(!r||!r.commandStarted||!r.commandResultAvailable||!r.isolationVerified||!r.cleanupVerified||r.signal!==null))reject();
 const out={schema:1,telemetry,scope:"nearest-custom-v1-v2-sixteen-only",original158Qualified:false,head,...preservation,receipts,report,rawDiagnosticsPublished:false};fs.mkdirSync(output,{mode:0o700});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(out)+'\n',{flag:'wx',mode:0o600});return out;
}
function main(args){try{const o={};for(let i=0;i<args.length;i+=2){if(!['--source','--output','--root','--head'].includes(args[i])||args[i].slice(2)in o||typeof args[i+1]!=='string')reject();o[args[i].slice(2)]=args[i+1];}collect(o);return 0;}catch{process.stderr.write('Finite regression projection rejected\n');return 1;}}
module.exports={BASE,MANIFEST,added,modified,expectedChanges,verifySource,readTelemetry,collect,main};if(require.main===module)process.exitCode=main(process.argv.slice(2));
