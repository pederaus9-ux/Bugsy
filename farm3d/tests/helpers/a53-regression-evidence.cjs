'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {validReceipt}=require('./ci-isolated-runner.cjs'),{validReport}=require('./a53-regression-schema.cjs');
const BASE='9e2c5ec205321654f6bae4d502954d77cdb97792',MANIFEST='6d058821de179c264416c178e49fd9f047f35ae3e3b62a2455c3ab6be9fb26a9';
const added=["farm3d/tests/cow-legal-opposed-rejoin.test.mjs", "farm3d/tests/fixtures/a53-legal-opposed-rejoin.json", "farm3d/tests/cow-legal-opposed-rejoin-v2.test.mjs", "farm3d/tests/fixtures/a53-legal-opposed-rejoin-v2.json", ".github/workflows/a53-stale-cow-qualification.yml", "farm3d/tests/fixtures/a53-stale-source-files.sha256"];
const modified=["farm3d/index.html", "farm3d/tests/helpers/a53-cow-recovery-scope.cjs", "farm3d/tests/fixtures/a53-custom-nearest-scope.json", "farm3d/tests/a53-final-scope.test.cjs", "farm3d/tests/a52-installed-cow-cache.browser.cjs", "farm3d/tests/a52-installed-cow-cache.contract.test.cjs", "farm3d/tests/helpers/a53-regression-schema.cjs", "farm3d/tests/helpers/a53-regression-evidence.cjs", "farm3d/tests/a53-regression-diagnostic.test.cjs"];
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
 const raw=regular(path.join(root,'farm3d/tests/fixtures/a53-stale-source-files.sha256'));if(sha(raw)!==MANIFEST)reject();
 const lines=raw.toString().trim().split('\n');for(const line of lines){const m=/^([a-f0-9]{64})  ([A-Za-z0-9_./-]+)$/.exec(line);if(!m||m[2].split('/').includes('..')||path.isAbsolute(m[2])||sha(regular(path.join(root,m[2]),2*1024*1024))!==m[1])reject();}
 return{base:BASE,releaseManifestSha256:MANIFEST,releaseFilesVerified:lines.length,trackedSourceUnchanged:true};
}
function collect({source,output,root,head},readGit=git){source=dir(source);root=dir(root);output=path.resolve(output);if(fs.existsSync(output)||dir(path.dirname(output))!==path.dirname(output))reject();const preservation=verifySource(root,head,readGit);
 const names=fs.readdirSync(source);if(!names.length||names.some(n=>!['namespace.json','controls.json','regressions.json'].includes(n)))reject();const receipts={};for(const n of names){const r=JSON.parse(regular(path.join(source,n),16384));if(!validReceipt(r))reject();receipts[n]=r;}
 const file=path.join(root,'artifacts/a53-regression-diagnostic/failures.json');let report=null;if(fs.existsSync(file))report=JSON.parse(regular(file));if(report&&!validReport(report))reject();
 const r=receipts['regressions.json'];if(report){if(!r||!r.commandStarted||!r.commandResultAvailable||!r.isolationVerified||!r.cleanupVerified||r.signal!==null||!['passed','command_failed'].includes(r.status))reject();if(report.status==='PASS'){if(report.summary.counts.tests!==174||report.summary.counts.topLevel!==174||report.summary.counts.passed!==174||report.summary.counts.skipped!==0||report.summary.counts.todo!==0||report.summary.counts.suites!==0)reject();if(r.status!=='passed'||r.exitCode!==0)reject();}else if(report.status==='FAIL'){if(r.status!=='command_failed'||r.exitCode===null||r.exitCode===0)reject();}else if(r.status==='passed')reject();}
 if(r?.status==='passed'&&report?.status!=='PASS')reject();
 const out={schema:1,head,...preservation,receipts,report,rawDiagnosticsPublished:false};fs.mkdirSync(output,{mode:0o700});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(out)+'\n',{flag:'wx',mode:0o600});return out;
}
function main(args){try{const o={};for(let i=0;i<args.length;i+=2){if(!['--source','--output','--root','--head'].includes(args[i])||args[i].slice(2)in o||typeof args[i+1]!=='string')reject();o[args[i].slice(2)]=args[i+1];}collect(o);return 0;}catch{process.stderr.write('Finite regression projection rejected\n');return 1;}}
module.exports={BASE,MANIFEST,added,modified,expectedChanges,verifySource,collect,main};if(require.main===module)process.exitCode=main(process.argv.slice(2));
