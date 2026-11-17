'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validReceipt}=require('./ci-isolated-runner.cjs');
const {verifySource}=require('./a53-regression-evidence.cjs');
const CASES={core_game:1,characters:1,field:1,quality_scope:1,chicken:1,market:2};
function project(kind,receipts){
 if(!Object.hasOwn(CASES,kind)||!receipts||typeof receipts!=='object'||Array.isArray(receipts))throw Error('Case rejected');
 const allowed=['namespace.json','controls.json',...Array.from({length:CASES[kind]},(_,i)=>'step-'+(i+1)+'.json')];
 if(Object.keys(receipts).some(n=>!allowed.includes(n)))throw Error('Receipt rejected');
 for(const[n,r]of Object.entries(receipts))if(!validReceipt(r)||!r.isolationVerified||!r.cleanupVerified||(n!=='namespace.json'&&!r.commandStarted)||(n==='namespace.json'&&(r.commandStarted||r.commandResultAvailable)))throw Error('Isolation rejected');
 const required=allowed,complete=required.every(n=>receipts[n]);
 let status=complete&&required.every(n=>receipts[n].status==='passed'&&receipts[n].exitCode===0&&receipts[n].signal===null&&(n==='namespace.json'||receipts[n].commandResultAvailable))?'PASS':'FAIL';
 if(!complete)status='INCOMPLETE';
 if(status==='PASS'&&kind==='field'){const t=receipts['step-1.json'].tap;if(t.tests!==123||t.pass!==123||t.fail!==0||t.cancelled!==0||t.skipped!==0||t.todo!==0)throw Error('Exact field inventory rejected');}
 return{schema:1,case:kind,status,receipts,rawDiagnosticsPublished:false};
}
function read(file){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink()||s.size>16384||fs.realpathSync(file)!==path.resolve(file))throw Error('File rejected');return JSON.parse(fs.readFileSync(file));}
function collect(root,head,kind,source,output,check=verifySource){if(!/^[a-f0-9]{40}$/.test(head||''))throw Error('Head rejected');const identity=check(root,head);source=path.resolve(source);output=path.resolve(output);if(fs.realpathSync(source)!==source||fs.existsSync(output)||fs.realpathSync(path.dirname(output))!==path.dirname(output))throw Error('Directory rejected');const receipts={};for(const n of fs.readdirSync(source))receipts[n]=read(path.join(source,n));const result={head,...identity,...project(kind,receipts)};fs.mkdirSync(output,{mode:0o700});fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});return result;}
module.exports={CASES,project,collect};if(require.main===module){try{if(process.argv.length!==6)throw Error('Arguments rejected');collect(process.cwd(),...process.argv.slice(2));}catch{process.stderr.write('Finite legacy evidence rejected\n');process.exitCode=1;}}
