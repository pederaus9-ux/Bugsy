'use strict';
const fs=require('node:fs'),path=require('node:path'),{valid}=require('./a53-conflict-progress.cjs'),{validReceipt}=require('./ci-isolated-runner.cjs');
function read(p,max){p=path.resolve(p);const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>max||fs.realpathSync(p)!==p)throw Error('File rejected');return JSON.parse(fs.readFileSync(p));}
function collect(source,receipt,output,head){
 if(!/^[a-f0-9]{40}$/.test(head||''))throw Error('Head rejected');const v=read(source,8192),r=read(receipt,16384);
 if(!valid(v)||!validReceipt(r)||!r.isolationVerified||!r.cleanupVerified||r.commandStarted!==true||!r.commandResultAvailable||r.signal!==null||!['passed','command_failed'].includes(r.status))throw Error('Unproven execution');
 if(r.status==='passed'&&(r.exitCode!==0||v.exitCode!==0||v.checkpoint!==58||v.caseId!==4||v.completed!==4||v.cleanup!=='complete'||v.caught||v.uncaught))throw Error('False pass');
 if(r.status==='command_failed'&&(r.exitCode===0||v.exitCode!==r.exitCode))throw Error('Exit mismatch');
 const result={schema:1,head,status:r.status==='passed'?'PASS':'FAIL',conflicts:v,receipt:r,rawDiagnosticsPublished:false};output=path.resolve(output);if(fs.existsSync(output)||fs.realpathSync(path.dirname(output))!==path.dirname(output))throw Error('Output rejected');fs.writeFileSync(output,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});return result;
}
module.exports={collect};if(require.main===module){try{if(process.argv.length!==6)throw Error('Args');collect(...process.argv.slice(2));}catch{process.stderr.write('Conflict finite evidence rejected\n');process.exitCode=1;}}
