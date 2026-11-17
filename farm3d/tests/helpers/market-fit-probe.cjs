'use strict';
// Branch-only observation. Never read/copy error messages, URLs, stacks or saves.
const fs=require('node:fs'),path=require('node:path');
const STEPS=Object.freeze(['entry','harness','context','css-read','set-content','animation-wait','measure','root-overhang','body-fit','close-fit','pass-record','session-finish','fit-complete']);
const FAILURES=Object.freeze(['none','caught','uncaught-exception','unhandled-rejection']);
function valid(v){return !!v&&Object.keys(v).sort().join('|')==='failure|schema|step'&&v.schema===1&&STEPS.includes(v.step)&&FAILURES.includes(v.failure);}
function create({dir=process.env.RUNNER_TEMP,events=process,write=fs.writeFileSync,mkdir=fs.mkdirSync}={}){
 const state={schema:1,step:'entry',failure:'none'};
 const save=()=>{if(dir){const p=path.join(dir,'market-fit-probe');mkdir(p,{recursive:true});write(path.join(p,'phase.json'),JSON.stringify(state)+'\n');}};
 const step=value=>{if(!STEPS.includes(value))throw Error('Invalid checkpoint');state.step=value;save();};
 const failure=value=>{if(!FAILURES.includes(value)||value==='none')throw Error('Invalid failure');state.failure=value;save();};
 // Observer only: leaves Node's default fatal behavior and exit status untouched.
 events.on('uncaughtExceptionMonitor',(_error,origin)=>{try{failure(origin==='unhandledRejection'?'unhandled-rejection':'uncaught-exception');}catch{}});
 save();return {step,failure};
}
function collect(source,dest,head){
 const reject=()=>{throw Error('Probe receipt rejected');};
 if(!/^[a-f0-9]{40}$/.test(head))reject();
 const read=name=>{const p=path.resolve(source,name),s=fs.lstatSync(p);if(fs.realpathSync(p)!==p||!s.isFile()||s.isSymbolicLink()||s.size>8192)reject();return JSON.parse(fs.readFileSync(p));};
 if(fs.realpathSync(source)!==path.resolve(source)||fs.readdirSync(source).some(n=>!['phase.json','execution.json'].includes(n)))reject();
 const execution=read('execution.json');if(!require('./ci-isolated-runner.cjs').validReceipt(execution)||!execution.cleanupVerified||!execution.isolationVerified||!execution.commandStarted)reject();
 const phase=read('phase.json');if(!valid(phase))reject();
 if(fs.existsSync(dest)||fs.realpathSync(path.dirname(dest))!==path.dirname(dest))reject();
 fs.mkdirSync(dest,{mode:0o700});fs.writeFileSync(path.join(dest,'receipt.json'),JSON.stringify({head,execution,phase})+'\n',{flag:'wx',mode:0o600});
}
module.exports={STEPS,FAILURES,valid,create,collect};
if(require.main===module){try{if(process.argv.length!==5)throw Error();collect(...process.argv.slice(2));console.log('Finite probe receipt validated');}catch{console.error('Probe receipt rejected');process.exitCode=1;}}
