 'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {validReceipt}=require('./ci-isolated-runner.cjs');
const ALLOWED=Object.freeze({"farm3d-regression/utility-lights":["step-1.json","step-2.json"],"farm3d-regression/market-sales":["step-1.json","step-2.json"],"farm3d-regression/decor-catalog":["step-1.json","step-2.json"],"farm3d-regression/holiday-decor":["step-1.json","step-2.json"],"farm3d-regression/regression":["step-1.json"],"farm3d-regression/characters-polish":["step-1.json"],"farm3d-regression/animal-visuals":["step-1.json"],"farm3d-regression/saves":["step-1.json"],"farm3d-regression/analytics":["step-1.json"],"farm3d-regression/accessibility":["step-1.json"],"farm3d-regression/firebase-rules":["step-1.json","step-2.json"],"farm3d-regression/seed-selection":["step-1.json"],"farm3d-regression/chicken-pen":["step-1.json","step-2.json"],"farm3d-regression/chicken-update":["step-1.json"],"farm3d-regression/chicken-flock30":["step-1.json"],"farm3d-quality-loops/node-evidence":["step-1.json","step-2.json","step-3.json"],"farm3d-art-candidate/cow-b1-reference":["step-1.json"],"farm3d-art-candidate/barn-candidate":["step-1.json","step-2.json","step-3.json","step-4.json"],"farm3d-art-candidate/authored-hands":["step-1.json","step-2.json","step-3.json","step-4.json","step-5.json"],"farm3d-release-qualification/conflicts":["step-1.json"],"farm3d-release-qualification/a35_fixtures_integrity":["step-1.json","step-2.json","step-3.json","step-4.json","step-5.json"],"farm3d-release-qualification/pen_cache":["step-1.json","step-2.json","step-3.json","step-4.json","step-5.json","step-6.json"],"farm3d-release-qualification/recovery_restore":["step-1.json","step-2.json","step-3.json","step-4.json"],"field-support-qualification/field":["step-1.json","step-2.json","step-3.json","step-4.json","step-5.json"],"field-support-qualification/rollback":["step-1.json","step-2.json"],"pages-package-validation/package":["step-1.json","step-2.json"]});
const ADDITIONAL=Object.freeze({'pages-package-validation/package':['jekyll-build.json']});
const reject=()=>{throw Error('Workflow receipt rejected');};
function regular(file,max=8192){const p=path.resolve(file);if(fs.realpathSync(p)!==p)reject();const s=fs.lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>max)reject();return fs.readFileSync(p);}
function git(args){return cp.execFileSync('git',['--no-lazy-fetch','-c','protocol.allow=never',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe'],env:{PATH:process.env.PATH,HOME:process.env.HOME,GIT_NO_LAZY_FETCH:'1',GIT_NO_REPLACE_OBJECTS:'1',GIT_ALLOW_PROTOCOL:'',GIT_TERMINAL_PROMPT:'0'},timeout:10000,maxBuffer:8192}).trim();}
function identity(key,candidate,readGit=git){
 if(!Object.hasOwn(ALLOWED,key)||!/^[a-f0-9]{40}$/.test(candidate))reject();
 if(readGit(['rev-parse',candidate+'^{commit}'])!==candidate)reject();
 const tested=key==='field-support-qualification/field'?'0d0542bf93e4e010b5543e81a40fae4bca2dd5f9':candidate;
 if(readGit(['rev-parse','HEAD'])!==tested)reject();
 return {schema:1,candidate,testedSource:tested,coverage:tested===candidate?'candidate':'historical-field-v76'};
}
function collect(key,source,output,candidate,readGit=git){
 const id=identity(key,candidate,readGit),allowed=[...ALLOWED[key],...(ADDITIONAL[key]||[])],rows=[];
 if(fs.realpathSync(source)!==path.resolve(source)||!fs.lstatSync(source).isDirectory())reject();
 const names=fs.readdirSync(source);if(names.some(n=>!allowed.includes(n)))reject();
 for(const name of names.sort()){const r=JSON.parse(regular(path.join(source,name)));const valid=name==='jekyll-build.json'?require('./a52-jekyll-build.cjs').finiteReceipt(r):validReceipt(r);if(!valid||!r.cleanupVerified)reject();rows.push([name,r]);}
 const dest=path.resolve(output);if(fs.existsSync(dest)||fs.realpathSync(path.dirname(dest))!==path.dirname(dest))reject();
 fs.mkdirSync(dest,{mode:0o700});
 for(const [name,r]of rows)fs.writeFileSync(path.join(dest,name),JSON.stringify(r)+'\n',{flag:'wx',mode:0o600});
 fs.writeFileSync(path.join(dest,'identity.json'),JSON.stringify({...id,present:rows.map(r=>r[0]),absent:allowed.filter(n=>!names.includes(n))})+'\n',{flag:'wx',mode:0o600});return rows.length;
}
module.exports={ALLOWED,ADDITIONAL,regular,identity,collect};
if(require.main===module){try{const a=process.argv.slice(2);if(a.length!==4)reject();collect(...a);process.stdout.write('Workflow receipts projected\n');}catch{process.stderr.write('Workflow receipt rejected\n');process.exitCode=1;}}
