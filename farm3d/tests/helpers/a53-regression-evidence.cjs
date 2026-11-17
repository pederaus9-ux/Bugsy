'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {validReceipt}=require('./ci-isolated-runner.cjs'),{validReport}=require('./a53-regression-schema.cjs');
const BASE='40a8fb8797989b2b45393d70368a00a01af9a289';
const PINS={'farm3d/index.html': '40a2bbcef45e5a29f463768937ef849a8aff53075d7820fba613d5064e5a294c', 'farm3d/sw.js': '647dad41cd19a91e33ad3efe64cc6fc4a63ec193568616d3fa648c1f7ddb441e', 'farm3d/tests/helpers/ci-isolated-runner.cjs': 'cdb1d4ad2da88964c10053ce34bfd3e269cb929fecb7e4d6314a864154c9656a'};
const added=['.github/workflows/a53-cow-baseline-diagnostic.yml','farm3d/tests/helpers/a53-regression-schema.cjs','farm3d/tests/helpers/a53-regression-reporter.cjs','farm3d/tests/helpers/a53-regression-evidence.cjs','farm3d/tests/a53-regression-diagnostic.test.cjs','farm3d/tests/fixtures/a53-baseline-diagnostic-files.sha256'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function reject(){throw Error('Finite regression evidence rejected');}
function dir(p){p=path.resolve(p);if(fs.realpathSync(p)!==p||!fs.lstatSync(p).isDirectory())reject();return p;}
function regular(p,max=65536){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>max||fs.realpathSync(p)!==path.resolve(p))reject();return fs.readFileSync(p);}
function git(root,args){return execFileSync('git',['--no-lazy-fetch','-C',root,'-c','protocol.allow=never','-c','core.hooksPath=/dev/null',...args],{encoding:'utf8',timeout:10000,maxBuffer:65536,stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}}).trim();}
function verifySource(root,head,readGit=git){
 if(!/^[a-f0-9]{40}$/.test(head||'')||readGit(root,['rev-parse','HEAD'])!==head||readGit(root,['rev-parse','HEAD^'])!==BASE)reject();
 const changes=readGit(root,['diff','--name-status',BASE,'HEAD','--']).split('\n').filter(Boolean);if(changes.length!==added.length||new Set(changes).size!==added.length||changes.some(x=>!x.startsWith('A\t')||!added.includes(x.slice(2))))reject();
 readGit(root,['diff','--quiet','HEAD','--']);readGit(root,['diff','--cached','--quiet','--']);
 for(const [file,hash] of Object.entries(PINS)){if(sha(regular(path.join(root,file),2*1024*1024))!==hash)reject();}
 return{base:BASE,baselinePins:PINS,trackedSourceUnchanged:true};
}
function collect({source,output,root,head},readGit=git){source=dir(source);root=dir(root);output=path.resolve(output);if(fs.existsSync(output)||dir(path.dirname(output))!==path.dirname(output))reject();const preservation=verifySource(root,head,readGit);
 const names=fs.readdirSync(source);if(!names.length||names.some(n=>!['namespace.json','controls.json','regressions.json'].includes(n)))reject();const receipts={};for(const n of names){const r=JSON.parse(regular(path.join(source,n),16384));if(!validReceipt(r))reject();receipts[n]=r;}
 const file=path.join(root,'artifacts/a53-regression-diagnostic/failures.json');let report=null;if(fs.existsSync(file))report=JSON.parse(regular(file));if(report&&!validReport(report))reject();
 const r=receipts['regressions.json'];if(report){if(!r||!r.commandStarted||!r.commandResultAvailable||!r.isolationVerified||!r.cleanupVerified||r.signal!==null||!['passed','command_failed'].includes(r.status))reject();if(report.status==='PASS'){if(r.status!=='passed'||r.exitCode!==0)reject();}else if(report.status==='FAIL'){if(r.status!=='command_failed'||r.exitCode===null||r.exitCode===0)reject();}else if(r.status==='passed')reject();}
 if(r?.status==='passed'&&report?.status!=='PASS')reject();
 const out={schema:1,head,...preservation,receipts,report,rawDiagnosticsPublished:false};fs.mkdirSync(output,{mode:0o700});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(out)+'\n',{flag:'wx',mode:0o600});return out;
}
function main(args){try{const o={};for(let i=0;i<args.length;i+=2){if(!['--source','--output','--root','--head'].includes(args[i])||args[i].slice(2)in o||typeof args[i+1]!=='string')reject();o[args[i].slice(2)]=args[i+1];}collect(o);return 0;}catch{process.stderr.write('Finite regression projection rejected\n');return 1;}}
module.exports={BASE,PINS,added,verifySource,collect,main};if(require.main===module)process.exitCode=main(process.argv.slice(2));
