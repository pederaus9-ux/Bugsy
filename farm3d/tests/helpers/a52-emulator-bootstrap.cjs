'use strict';
// NETWORKED TOOL PREPARATION ONLY. Never starts emulators, loads project code,
// authenticates, or provides a fallback for a protected command's denied egress.
// Source: firebase-tools v14.27.0 src/commands/setup-emulators-firestore.ts and
// src/emulator/downloadableEmulatorInfo.json. Auth/Functions are CLI Node modules;
// this project's exact firebase.json disables the separately downloaded UI.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const FIRESTORE=Object.freeze({version:'1.19.8',expectedSize:63634791,expectedChecksumSHA256:'9d43599ed6151199e8d604dc87fac51218e49e5f3a48519b1ae560bbe5e3382d',remoteUrl:'https://storage.googleapis.com/firebase-preview-drop/emulator/cloud-firestore-emulator-v1.19.8.jar',downloadPathRelativeToCacheDir:'cloud-firestore-emulator-v1.19.8.jar'});
const PINS=Object.freeze({'package-lock.json':'98df2dee6288547ed878bbdd7c0f293870b0e0bc817b30ea756342b7a7ef5946','firebase.json':'1664628f7b80ed49269e7f38c3c6d8b000c42f641bc56217cf6690c88978391c','functions/package-lock.json':'10c4d68cf0726f2dc4bd28a8c64fa3451f01298a86d67afb9d65ccbc73f32093'});
const INTEGRITY='sha512-HrucHJ69mLM9pQhZFO1rb0N/QMpZD4iznoOtKd2lctEELPtbSMN5JHgdgzLlf+EXn5aQy87u5zlPd/0xwwyYTQ==';
function fail(){throw Error('Emulator bootstrap rejected; details withheld');}
function verifyMetadata(lock,installed,info,sdk){
 const cli=lock.packages?.['node_modules/firebase-tools'];
 if(cli?.version!=='14.27.0'||cli.integrity!==INTEGRITY||cli.resolved!=='https://registry.npmjs.org/firebase-tools/-/firebase-tools-14.27.0.tgz'||installed.version!==cli.version||sdk.version!=='12.19.0'||lock.packages?.['node_modules/firebase-browser']?.version!==sdk.version)fail();
 for(const [k,v]of Object.entries(FIRESTORE))if(info.firestore?.[k]!==v)fail();
}
function regular(file){const s=fs.lstatSync(file);if(!s.isFile()||s.isSymbolicLink())fail();return s;}
function verifyArtifact(file,expected=FIRESTORE){
 if(regular(file).size!==expected.expectedSize)fail();
 if(sha(fs.readFileSync(file))!==expected.expectedChecksumSHA256)fail();
}
function inspect(directory,functions=false){
 for(const [f,hash]of Object.entries(PINS)){const full=path.join(directory,f);regular(full);if(sha(fs.readFileSync(full))!==hash)fail();}
 const json=f=>JSON.parse(fs.readFileSync(path.join(directory,f),'utf8'));
 const cli=path.join(directory,'node_modules/firebase-tools');
 verifyMetadata(json('package-lock.json'),json('node_modules/firebase-tools/package.json'),json('node_modules/firebase-tools/lib/emulator/downloadableEmulatorInfo.json'),json('node_modules/firebase-browser/package.json'));
 for(const f of ['lib/bin/firebase.js','lib/commands/setup-emulators-firestore.js','lib/emulator/auth/index.js','lib/emulator/functionsEmulator.js'])regular(path.join(cli,f));
 for(const m of ['app','auth','firestore','functions'])regular(path.join(directory,'node_modules/firebase-browser/firebase-'+m+'.js'));
 if(functions){const lock=json('functions/package-lock.json');for(const name of ['firebase-admin','firebase-functions'])if(json('functions/node_modules/'+name+'/package.json').version!==lock.packages['node_modules/'+name].version)fail();}
 return path.join(cli,'lib/bin/firebase.js');
}
function invocation(cli,home,cache,sourceEnv=process.env){
 // Construct, never inherit, the downloader environment. HOME/cwd contain no
 // project config, saved Firebase login, ADC, token or live account credentials.
 const env={PATH:sourceEnv.PATH||'',HOME:home,XDG_CONFIG_HOME:path.join(home,'.config'),TMPDIR:home,CI:'true',FIREBASE_EMULATORS_PATH:cache,FIREBASE_CLI_DISABLE_TELEMETRY:'1',NO_UPDATE_NOTIFIER:'1'};
 return {file:process.execPath,args:[cli,'setup:emulators:firestore','--non-interactive'],options:{cwd:home,env,timeout:300000,maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']}};
}
function prepare(directory,functions=false,{run=cp.execFileSync}={}){
 const cli=inspect(directory,functions),cache=path.join(os.homedir(),'.cache','firebase','emulators');
 // Explicit overrides could send the subsequent unchanged command elsewhere.
 if(process.env.FIREBASE_EMULATORS_PATH||process.env.FIREBASE_TOKEN||process.env.GOOGLE_APPLICATION_CREDENTIALS||process.env.CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE)fail();
 fs.mkdirSync(cache,{recursive:true});if(fs.realpathSync(cache)!==cache)fail();
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'a52-firebase-setup-'));const call=invocation(cli,home,cache);
 try{run(call.file,call.args,call.options);verifyArtifact(path.join(cache,FIRESTORE.downloadPathRelativeToCacheDir));}
 finally{fs.rmSync(home,{recursive:true,force:true});}
 return {schema:1,status:'prepared',cli:'14.27.0',firestore:'1.19.8',jarBytes:FIRESTORE.expectedSize,jarSha256:FIRESTORE.expectedChecksumSHA256,sdk:'12.19.0',functionsDependenciesChecked:functions,emulatorsStarted:false,rawDiagnosticsPublished:false};
}
module.exports={FIRESTORE,PINS,INTEGRITY,verifyMetadata,verifyArtifact,invocation,inspect,prepare};
if(require.main===module){try{
 const args=process.argv.slice(2);if(args.length!==1||!['auth','functions'].includes(args[0]))fail();
 const r=prepare(path.resolve(__dirname,'../../firebase'),args[0]==='functions');process.stdout.write(JSON.stringify(r)+'\n');
}catch{process.stderr.write('Emulator bootstrap failed; diagnostics withheld; no application started\n');process.exitCode=1;}}
