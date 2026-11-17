'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib');
const e=require('./helpers/a52-ci-evidence.cjs'),r=require('./helpers/ci-isolated-runner.cjs');
const canary='SYNTHETIC_PRIVATE_DIAGNOSTIC_0123456789';
function receipt(status='passed'){return {...r.baseReceipt(status),isolationVerified:true,commandStarted:true,commandResultAvailable:true,cleanupVerified:true,exitCode:status==='passed'?0:1};}
function chunk(type,data){const b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(e.crc32(b.subarray(4,8+data.length)),8+data.length);return b;}
function png(extra=[]){const h=Buffer.alloc(13);h.writeUInt32BE(1);h.writeUInt32BE(1,4);h[8]=8;h[9]=6;return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',h),...extra,chunk('IDAT',zlib.deflateSync(Buffer.from([0,0,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);}
test('only schema-valid finite runner receipts are accepted, including true failures',()=>{
 assert.deepEqual(e.safeReceipt(receipt()),receipt());assert.equal(e.safeReceipt(receipt('command_failed')).status,'command_failed');
 for(const bad of [{...receipt(),error:canary},{...receipt(),stdoutSha256:canary},{...receipt(),tap:{secret:canary}},{...receipt(),commandStarted:true,isolationVerified:false}])assert.throws(()=>e.safeReceipt(bad));
});
test('probe receipts cannot be confused with actual application execution',()=>{
 const p={...receipt(),commandStarted:false,commandResultAvailable:false};assert.equal(e.executedPass(p),false);
 assert.equal(e.executedPass(receipt()),true);assert.equal(e.executedPass(receipt('command_failed')),false);
});
test('native progress permits only fixed stages and bounded counts, never exception text',()=>{
 const good={schema:1,status:'failed',stage:'tools-keyboard',viewport:2,completedViewports:1};assert.deepEqual(e.nativeProgress(good),good);
 for(const bad of [{...good,error:canary},{...good,stage:canary},{...good,viewport:999},{...good,status:'passed'},{...good,completedViewports:4}])assert.throws(()=>e.nativeProgress(bad));
});
test('installed progress permits only exact baseline, ordered stages and current-source hashes',()=>{
 const good={status:'FAIL',base:'38fa4706e41c40197b7afc32de693cb3901a80fb',physicalPhone:false,stages:['predecessor'],hashes:{},failedStage:'update'};assert.deepEqual(e.installedProgress(good),good);
 for(const bad of [{...good,error:canary},{...good,failedStage:canary},{...good,status:'PASS'},{...good,stages:['offline']},{...good,hashes:{index:canary}},{...good,base:'a'.repeat(40)}])assert.throws(()=>e.installedProgress(bad));
});
test('offline probe accepts finite observations and rejects raw values and invalid counters',()=>{
 const good={step:'errors',controlled:true,farmMatches:true,cacheMatches:true,differentFields:[],serverResponses:0,nonWorkerResponses:0,errorCounts:{page:0,console:1,http:0,request:1,other:0}};
 assert.deepEqual(e.offlineProbe(good),good);
 for(const bad of [{...good,error:canary},{...good,step:canary},{...good,differentFields:[canary]},{...good,differentFields:['coins','coins']},{...good,serverResponses:-1},{...good,nonWorkerResponses:1.2},{...good,errorCounts:{page:canary}},{...good,farmMatches:canary}])assert.throws(()=>e.offlineProbe(bad));
});
test('offline response classes are finite, unique and account for every non-worker response',()=>{
 const row={protocol:'https',scope:'external',resourceType:'script',count:3},good={step:'responses',serverResponses:0,nonWorkerResponses:3,responseClasses:[row]};
 assert.deepEqual(e.offlineProbe(good),good);
 for(const bad of [{...good,responseClasses:[{...row,url:canary}]},{...good,responseClasses:[{...row,protocol:canary}]},{...good,responseClasses:[{...row,scope:canary}]},{...good,responseClasses:[{...row,resourceType:canary}]},{...good,responseClasses:[{...row,count:0}]},{...good,responseClasses:[row,row]},{...good,nonWorkerResponses:4},{...good,responseClasses:[{...row,protocol:'blob',scope:'external'}]}])assert.throws(()=>e.offlineProbe(bad));
});
test('keyboard evidence accepts exact finite primitives, never raw DOM or exception content',()=>{
 const good={schema:1,side:1,phase:'tab-check',direction:1,iteration:8,observed:true,inMenu:false,documentFocused:false,bodyActive:true,rootActive:false,launcherActive:false,dialogOpen:true,focusableCount:8,keyDownCount:0,keyUpCount:0};
 assert.deepEqual(e.nativeKeyboard(good),good);
 for(const bad of [{...good,error:canary},{...good,phase:canary},{...good,side:3},{...good,direction:3},{...good,iteration:15},{...good,focusableCount:Infinity},{...good,keyDownCount:33},{...good,inMenu:canary},{...good,schema:2}])assert.throws(()=>e.nativeKeyboard(bad));
 const missing={...good};delete missing.observed;assert.throws(()=>e.nativeKeyboard(missing));
});
test('failed native run still exports schema-validated finite diagnostics, not screenshots',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-safe-')),source=path.join(dir,'in'),output=path.join(dir,'out'),screenshots=path.join(dir,'images');fs.mkdirSync(source);fs.mkdirSync(screenshots);
 const keyboard={schema:1,side:1,phase:'tab-check',direction:1,iteration:8,observed:true,inMenu:false,documentFocused:false,bodyActive:true,rootActive:false,launcherActive:false,dialogOpen:true,focusableCount:8,keyDownCount:0,keyUpCount:0};
 try{fs.writeFileSync(path.join(source,'native.json'),JSON.stringify(receipt('command_failed')));fs.writeFileSync(path.join(screenshots,'a52-native-keyboard.json'),JSON.stringify(keyboard));fs.writeFileSync(path.join(screenshots,'raw.log'),canary);
  const result=e.collect({source,output,head:'a'.repeat(40),screenshots});assert.deepEqual(result.nativeKeyboard,keyboard);assert.deepEqual(result.screenshots,[]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output,'native-keyboard.json'),'utf8')),keyboard);assert.equal(JSON.stringify(result).includes(canary),false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('PNG accepts only exact dimensions, validated chunks and an unchanged raster',()=>{
 const b=png();assert.equal(e.validatePng(b,1,1).bytes,b.length);assert.throws(()=>e.validatePng(b,2,1));
 const corrupt=Buffer.from(b);corrupt[20]^=1;assert.throws(()=>e.validatePng(corrupt,1,1));
 assert.throws(()=>e.validatePng(Buffer.concat([b,Buffer.from(canary)]),1,1));
 assert.throws(()=>e.validatePng(png([chunk('tEXt',Buffer.from(canary))]),1,1));
 assert.throws(()=>e.validatePng(png([chunk('eXIf',Buffer.from(canary))]),1,1));
});
test('collector publishes only explicitly named receipts, never arbitrary diagnostics',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-safe-')),source=path.join(dir,'in'),output=path.join(dir,'out');fs.mkdirSync(source);
 try{fs.writeFileSync(path.join(source,'contracts.json'),JSON.stringify(receipt()));fs.writeFileSync(path.join(source,'raw.log'),canary);
  const result=e.collect({source,output,head:'a'.repeat(40)});assert.equal(result.receipts.length,1);assert.equal(result.screenshots.length,0);
  assert.equal(JSON.stringify(result).includes(canary),false);assert.equal(fs.existsSync(path.join(output,'raw.log')),false);
  assert.throws(()=>e.collect({source,output,head:'a'.repeat(40)}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('unknown JSON names, invalid receipts, symlinks and missing evidence fail closed',()=>{
 for(const mode of ['unknown','invalid','symlink','empty']){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-safe-')),source=path.join(dir,'in'),output=path.join(dir,'out');fs.mkdirSync(source);
  try{if(mode==='unknown')fs.writeFileSync(path.join(source,'raw.json'),JSON.stringify({error:canary}));
   if(mode==='invalid')fs.writeFileSync(path.join(source,'native.json'),JSON.stringify({error:canary}));
   if(mode==='symlink'){fs.writeFileSync(path.join(dir,'target'),JSON.stringify(receipt()));fs.symlinkSync(path.join(dir,'target'),path.join(source,'native.json'));}
   assert.throws(()=>e.collect({source,output,head:'a'.repeat(40)}));
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
});
test('failed native execution never authorizes copying screenshots',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a52-safe-')),source=path.join(dir,'in'),output=path.join(dir,'out');fs.mkdirSync(source);
 try{fs.writeFileSync(path.join(source,'native.json'),JSON.stringify(receipt('command_failed')));
  const result=e.collect({source,output,head:'a'.repeat(40),screenshots:path.join(dir,'does-not-exist')});assert.deepEqual(result.screenshots,[]);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('public collector has no app, browser, git or network execution',()=>{
 const text=fs.readFileSync(require.resolve('./helpers/a52-ci-evidence.cjs'),'utf8');assert.equal(/child_process|require\(['"](?:node:)?(?:https?|net|tls)['"]\)|\bfetch\(|playwright|execSync|spawn\(/.test(text),false);
});
test('dedicated exporter verifies its complete code closure before execution and upload',()=>{
 const root=path.resolve(__dirname,'../..'),workflow=fs.readFileSync(path.join(root,'.github/workflows/a52-protected-qualification.yml'),'utf8');
 const start=workflow.indexOf('      - name: Export finite receipts'),end=workflow.indexOf('      - name: Preserve reviewed public projection'),step=workflow.slice(start,end);
 assert(step.includes('id: public_evidence'));
 for(const file of ['farm3d/tests/helpers/a52-ci-evidence.cjs','farm3d/tests/helpers/ci-isolated-runner.cjs']){
  const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
  assert(step.includes('test -f "'+file+'" && test ! -L "'+file+'"'));
  const pin='test "$(sha256sum "'+file+'" | cut -d \' \' -f1)" = '+hash;assert(step.includes(pin));assert(step.indexOf(pin)<step.indexOf('node farm3d/tests/helpers/a52-ci-evidence.cjs'));
 }
 assert(workflow.slice(end).includes("if: ${{ always() && steps.public_evidence.outcome == 'success' }}"));
});

test('dismissal diagnostics remain finite and exportable',()=>{
 const good={schema:1,side:1,phase:'escape-check',direction:0,iteration:0,observed:true,inMenu:false,documentFocused:true,bodyActive:false,rootActive:false,launcherActive:true,dialogOpen:false,focusableCount:0,keyDownCount:0,keyUpCount:0};
 for(const phase of ['escape-input','escape-check','escape-focus','close-reveal','close-input','close-check','close-focus','capture-reveal','capture-escape-input','capture-escape-check','backdrop-reveal','backdrop-input','backdrop-check','backdrop-focus','dismiss-complete'])assert.deepEqual(e.nativeKeyboard({...good,phase}),{...good,phase});
 assert.throws(()=>e.nativeKeyboard({...good,phase:canary}));
});

test('offline harness attribution exports finite categories and counts only',()=>{
 const o={localResponses:[{category:'worker-script',beganBeforeOffline:false,count:1}],externalFulfillCalls:{firebaseSdk:3,other:0}};
 const good={step:'responses',responseObservation:o};assert.deepEqual(e.offlineProbe(good),good);
 for(const bad of [{...o,url:canary},{...o,externalFulfillCalls:{firebaseSdk:Infinity,other:0}},{...o,externalFulfillCalls:{firebaseSdk:3,other:0,url:canary}},{...o,localResponses:[{category:canary,beganBeforeOffline:false,count:1}]},{...o,localResponses:[{category:'other',beganBeforeOffline:canary,count:1}]},{...o,localResponses:[{category:'other',beganBeforeOffline:false,count:0}]},{...o,localResponses:[...o.localResponses,...o.localResponses]}])assert.throws(()=>e.offlineProbe({...good,responseObservation:bad}));
});

test("reopen helper diagnostics retain bounded phases",()=>{
const good={schema:1,side:1,phase:"nav-click",direction:0,iteration:0,observed:false,inMenu:false,documentFocused:false,bodyActive:false,rootActive:false,launcherActive:false,dialogOpen:false,focusableCount:0,keyDownCount:0,keyUpCount:0};
for(const phase of ['nav-input', 'nav-route', 'nav-count-host', 'nav-count-launcher', 'nav-count-dialog', 'nav-count-target', 'nav-ready', 'nav-controls', 'nav-parent', 'nav-open-read', 'nav-key-focus', 'nav-key-press', 'nav-click', 'nav-tap', 'nav-open-check', 'nav-expanded', 'nav-dialog-visible', 'nav-target-visible', 'nav-complete'])assert.deepEqual(e.nativeKeyboard({...good,phase}),{...good,phase});
});

test('offline transport receipt accepts only fixed booleans and counters',()=>{
 const counters={firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:0},transport={serverClosed:true,activeOwnedSockets:0,externalAborts:counters,observedDisconnected:counters,expectedConsole:counters,consoleObservations:{exactDisconnected:counters,otherText:{firebaseApp:0,firebaseAuth:0,firebaseFirestore:0,other:0}}},good={step:'responses',transport};
 assert.deepEqual(e.offlineProbe(good),good);
 for(const t of [{...transport,url:canary},{...transport,serverClosed:canary},{...transport,activeOwnedSockets:Infinity},{...transport,externalAborts:{...counters,other:-1}},{...transport,observedDisconnected:{...counters,url:canary}}])assert.throws(()=>e.offlineProbe({...good,transport:t}));
});

test('native hit evidence exports only finite actionability facts',()=>{
 const before={observed:true,connected:true,enabled:true,visible:true,inViewport:true,centerOwned:false,pointerEvents:true,openModals:0,blocker:'scrim'},good={schema:1,side:1,before,rejected:before};
 assert.deepEqual(e.nativeHit(good),good);assert.deepEqual(e.nativeHit({...good,before:{observed:false},rejected:null}),{...good,before:{observed:false},rejected:null});
 for(const bad of [{...good,url:canary},{...good,side:3},{...good,before:{observed:false,url:canary}},{...good,before:{...before,blocker:canary}},{...good,before:{...before,openModals:99}},{...good,before:{...before,visible:canary}},{...good,before:{...before,x:10}}])assert.throws(()=>e.nativeHit(bad));
});
test('expected offline console observations reject arbitrary text and malformed counts',()=>{
 const counters={firebaseApp:1,firebaseAuth:1,firebaseFirestore:1,other:0};
 const transport={serverClosed:true,activeOwnedSockets:0,externalAborts:counters,observedDisconnected:counters,expectedConsole:counters,consoleObservations:{exactDisconnected:counters,otherText:counters}};
 const good={step:'errors',transport};assert.deepEqual(e.offlineProbe(good),good);
 for(const consoleObservations of [{...transport.consoleObservations,text:canary},{exactDisconnected:{...counters,url:canary},otherText:counters},{exactDisconnected:{...counters,other:-1},otherText:counters}])assert.throws(()=>e.offlineProbe({...good,transport:{...transport,consoleObservations}}));
});
