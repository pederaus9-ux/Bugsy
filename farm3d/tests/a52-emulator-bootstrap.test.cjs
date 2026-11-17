'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const d=require('./helpers/a52-emulator-bootstrap.cjs');
const metadata=()=>[{packages:{'node_modules/firebase-tools':{version:'14.27.0',integrity:d.INTEGRITY,resolved:'https://registry.npmjs.org/firebase-tools/-/firebase-tools-14.27.0.tgz'},'node_modules/firebase-browser':{version:'12.19.0'}}},{version:'14.27.0'},{firestore:{...d.FIRESTORE}},{version:'12.19.0'}];
test('reviewed exact CLI metadata accepted without loading CLI or project modules',()=>assert.doesNotThrow(()=>d.verifyMetadata(...metadata())));
for(const key of Object.keys(d.FIRESTORE))test('rejects changed emulator '+key,()=>{const m=metadata();m[2].firestore[key]='unreviewed';assert.throws(()=>d.verifyMetadata(...m));});
for(const kind of ['version','integrity','resolved'])test('rejects unlocked CLI '+kind,()=>{const m=metadata();m[0].packages['node_modules/firebase-tools'][kind]='wrong';assert.throws(()=>d.verifyMetadata(...m));});
test('rejects installed CLI and real npm SDK mismatch',()=>{for(const i of [1,3]){const m=metadata();m[i].version='wrong';assert.throws(()=>d.verifyMetadata(...m));}});
test('official setup invocation cannot inherit tokens accounts config or project cwd',()=>{
 const call=d.invocation('/tool/lib/bin/firebase.js','/fresh/home','/shared/cache',{PATH:'/usr/bin',FIREBASE_TOKEN:'synthetic',GITHUB_TOKEN:'synthetic',GOOGLE_APPLICATION_CREDENTIALS:'/secret',HOME:'/account',NODE_OPTIONS:'--require=/untrusted',HTTP_PROXY:'http://bad'});
 assert.deepEqual(call.args,['/tool/lib/bin/firebase.js','setup:emulators:firestore','--non-interactive']);assert.equal(call.options.cwd,'/fresh/home');assert.equal(call.options.env.HOME,'/fresh/home');assert.equal(call.options.env.FIREBASE_EMULATORS_PATH,'/shared/cache');assert.equal(call.options.timeout,300000);assert.equal(call.options.maxBuffer,8388608);
 assert.deepEqual(Object.keys(call.options.env).sort(),['CI','FIREBASE_CLI_DISABLE_TELEMETRY','FIREBASE_EMULATORS_PATH','HOME','NO_UPDATE_NOTIFIER','PATH','TMPDIR','XDG_CONFIG_HOME'].sort());
});
test('artifact verification uses actual size and SHA256 and rejects symlinks, corruption and truncation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-jar-proof-')),file=path.join(dir,'fixture');
 try{const bytes=Buffer.from('inert fixture, not a JAR');fs.writeFileSync(file,bytes);const expected={expectedSize:bytes.length,expectedChecksumSHA256:crypto.createHash('sha256').update(bytes).digest('hex')};assert.doesNotThrow(()=>d.verifyArtifact(file,expected));fs.symlinkSync(file,path.join(dir,'link'));assert.throws(()=>d.verifyArtifact(path.join(dir,'link'),expected));fs.writeFileSync(file,Buffer.alloc(bytes.length));assert.throws(()=>d.verifyArtifact(file,expected));fs.writeFileSync(file,'short');assert.throws(()=>d.verifyArtifact(file,expected));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('missing installation fails closed before any downloader is invoked',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-missing-cli-'));let calls=0;
 try{assert.throws(()=>d.prepare(dir,false,{run(){calls++;}}));assert.equal(calls,0);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
