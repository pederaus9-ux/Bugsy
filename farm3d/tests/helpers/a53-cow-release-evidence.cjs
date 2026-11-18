'use strict';
// Finite synthetic release receipts only. Never export logs, saves or page bodies.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('node:child_process');
const {validReceipt}=require('./ci-isolated-runner.cjs'),{offlineProbe}=require('./a52-ci-evidence.cjs');
const BASE='40a8fb8797989b2b45393d70368a00a01af9a289';
const names=['namespace.json','inert.json','contracts.json','source-package.json','regressions.json','installed.json'];
const files=['index.html','sunny-ui.css?v=1','compact-ui.css?v=1','corner-menu.js?v=1','game.js?v=36','farmer3d.js'];
const stages=['predecessor','update','updated-online','offline'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function reject(){throw Error('Invalid bounded cow release evidence');}
function directory(p){p=path.resolve(p);if(fs.realpathSync(p)!==p||!fs.lstatSync(p).isDirectory())reject();return p;}
function regular(p,max=16384){const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||fs.realpathSync(p)!==path.resolve(p)||s.size>max)reject();return fs.readFileSync(p);}
function completeOffline(q){
 if(!q||Object.keys(q).sort().join('|')!=='cacheMatches|controlled|differentFields|errorCounts|farmMatches|nonWorkerResponses|responseClasses|responseObservation|serverResponses|step|transport')return false;
 const zero=o=>Object.values(o).every(n=>n===0),sdk=o=>o.firebaseApp===1&&o.firebaseAuth===1&&o.firebaseFirestore===1&&o.other===0;
 return q.step==='complete'&&q.farmMatches===true&&q.cacheMatches===true&&q.controlled===true&&q.serverResponses===0&&q.nonWorkerResponses===0&&q.differentFields.length===0&&zero(q.errorCounts)&&q.responseClasses.length===0&&q.responseObservation.localResponses.length===0&&zero(q.responseObservation.externalFulfillCalls)&&q.transport.serverClosed===true&&q.transport.activeOwnedSockets===0&&['externalAborts','observedDisconnected','expectedConsole'].every(k=>sdk(q.transport[k]))&&sdk(q.transport.consoleObservations.exactDisconnected)&&zero(q.transport.consoleObservations.otherText);
}
function executedPass(r){return !!r&&r.status==='passed'&&r.commandStarted===true&&r.commandResultAvailable===true&&r.isolationVerified===true&&r.cleanupVerified===true&&r.exitCode===0&&r.signal===null;}
function installed(v,expected){
 if(!v||Object.keys(v).some(k=>!['status','base','physicalPhone','stages','hashes','failedStage','offlineProbe'].includes(k))||!['RUNNING','PASS','FAIL'].includes(v.status)||v.base!==BASE||v.physicalPhone!==false)reject();
 if(!Array.isArray(v.stages)||v.stages.length>4||JSON.stringify(v.stages)!==JSON.stringify(stages.slice(0,v.stages.length)))reject();
 if('failedStage'in v&&!['source',...stages,'cleanup'].includes(v.failedStage))reject();
 if(!v.hashes||typeof v.hashes!=='object'||Array.isArray(v.hashes)||![0,6].includes(Object.keys(v.hashes).length))reject();
 for(const[k,h]of Object.entries(v.hashes))if(!files.includes(k)||h!==expected[k])reject();
 if('offlineProbe'in v){const q={...v.offlineProbe};if('differentFields'in q){if(!Array.isArray(q.differentFields)||new Set(q.differentFields).size!==q.differentFields.length)reject();q.differentFields=q.differentFields.filter(k=>!['cowIds','pets'].includes(k));}offlineProbe(q);}
 if(v.status==='PASS'&&(v.stages.length!==4||Object.keys(v.hashes).length!==6||'failedStage'in v||v.offlineProbe?.step!=='complete'||v.offlineProbe.farmMatches!==true||v.offlineProbe.cacheMatches!==true||v.offlineProbe.controlled!==true||v.offlineProbe.serverResponses!==0||v.offlineProbe.nonWorkerResponses!==0||v.offlineProbe.differentFields?.length!==0||!completeOffline(v.offlineProbe)))reject();
 return JSON.parse(JSON.stringify(v));
}
function collect({source,output,head,result,root}){
 if(!/^[a-f0-9]{40}$/.test(head||''))reject();source=directory(source);root=directory(root);output=path.resolve(output);if(fs.existsSync(output)||directory(path.dirname(output))!==path.dirname(output))reject();
 const actualHead=execFileSync('git',['--no-lazy-fetch','-C',root,'-c','protocol.allow=never','-c','core.hooksPath=/dev/null','rev-parse','--verify','HEAD'],{encoding:'utf8',timeout:10000,maxBuffer:1024,stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,GIT_ALLOW_PROTOCOL:'',GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_TERMINAL_PROMPT:'0'}}).trim();
 if(actualHead!==head)reject();
 const expectedResult=path.join(root,'artifacts/a53-cow-release/a52-installed-cow-cache/results.json');if(result!==expectedResult)reject();
 const receiptNames=fs.readdirSync(source);if(!receiptNames.length||receiptNames.some(n=>!names.includes(n)))reject();
 const receipts={};for(const n of receiptNames){const r=JSON.parse(regular(path.join(source,n)));if(!validReceipt(r))reject();receipts[n]=r;}
 const expected=Object.fromEntries(files.map(f=>[f,sha(regular(path.join(root,'farm3d',f.split('?')[0]),1048576))]));
 let progress=null;if(result&&fs.existsSync(result)){directory(path.dirname(result));progress=installed(JSON.parse(regular(result)),expected);}
 const r=receipts['installed.json'];if(r?.status==='passed'&&(!executedPass(r)||progress?.status!=='PASS'))reject();if(progress?.status==='PASS'&&!executedPass(r))reject();
 const v={schema:1,head,base:BASE,receipts,installed:progress,personalSavesUsed:false,physicalPhoneQualification:false,visualReview:false,rawDiagnosticsPublished:false};
 fs.mkdirSync(output,{mode:0o700});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(v)+'\n',{flag:'wx',mode:0o600});return v;
}
function main(args){try{const o={};for(let i=0;i<args.length;i+=2){const k=args[i]?.slice(2);if(!['source','output','head','result','root'].includes(k)||k in o||typeof args[i+1]!=='string')reject();o[k]=args[i+1];}collect(o);return 0;}catch{process.stderr.write('Cow release projection rejected\n');return 1;}}
module.exports={installed,collect,main};if(require.main===module)process.exitCode=main(process.argv.slice(2));
