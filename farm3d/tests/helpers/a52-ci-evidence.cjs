'use strict';
// Public projection: finite execution receipts and a small exact screenshot set.
// No raw logs, trace archives, page bodies, arbitrary JSON, or saved-farm data.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validReceipt}=require('./ci-isolated-runner.cjs');
const NAMES=new Set(['namespace.json','inert.json','contracts.json','native.json','accessibility.json','installed.json','source-package.json']);
const VIEWPORTS=[[1280,720],[320,568],[390,844],[844,390]];
const STAGES=['harness','boot','original-controls','tools-keyboard','tools-dismiss','tools-capture','barn-keyboard','barn-dismiss','barn-capture','panel-settings','panel-quests','panel-orders','panel-barn','panel-decor','panel-shop','mode-walking','mode-editing','mode-photo','mode-walking-select','mode-walking-enter-wait','mode-walking-exit-action','mode-walking-exit-wait','mode-editing-select','mode-editing-enter-wait','mode-editing-exit-action','mode-editing-exit-wait','mode-photo-select','mode-photo-enter-wait','mode-photo-exit-action','mode-photo-exit-wait','viewport-complete'];
const reject=()=>{throw Error('A52 public evidence rejected');};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function safeReceipt(value){if(!validReceipt(value))reject();return JSON.parse(JSON.stringify(value));}
function executedPass(value){return validReceipt(value)&&value.status==='passed'&&value.commandStarted===true&&value.commandResultAvailable===true&&value.isolationVerified&&value.cleanupVerified&&value.exitCode===0&&value.signal===null;}
function crc32(bytes){let c=0xffffffff;for(const v of bytes){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function validatePng(b,width,height){
 if(!Buffer.isBuffer(b)||b.length<57||b.length>16*1024*1024||b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')reject();
 let at=8,header=false,data=false,done=false,dataEnded=false;
 while(at<b.length){
  if(done||at+12>b.length)reject();const n=b.readUInt32BE(at),type=b.toString('ascii',at+4,at+8);if(n>16*1024*1024||at+12+n>b.length)reject();
  const body=b.subarray(at+8,at+8+n);if(crc32(b.subarray(at+4,at+8+n))!==b.readUInt32BE(at+8+n))reject();
  if(!header&&type!=='IHDR')reject();
  if(type==='IHDR'){
   if(header||at!==8||n!==13||body.readUInt32BE(0)!==width||body.readUInt32BE(4)!==height||body[8]!==8||![2,6].includes(body[9])||body[10]!==0||body[11]!==0||body[12]!==0)reject();header=true;
  }else if(type==='IDAT'){if(!header||dataEnded||n===0)reject();data=true;}
  else if(type==='IEND'){if(n!==0||!data)reject();done=true;}
  else if(type==='sRGB'){if(data||n!==1||body[0]>3)reject();}
  else if(type==='gAMA'){if(data||n!==4)reject();}
  else if(type==='pHYs'){if(data||n!==9||body[8]>1)reject();}
  else reject();
  if(data&&type!=='IDAT')dataEnded=true;at+=12+n;
 }
 if(!header||!data||!done)reject();return {width,height,bytes:b.length,sha256:sha(b)};
}
function regular(file,max){const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>max)reject();return fs.readFileSync(file);}
function directory(file){const resolved=path.resolve(file);if(fs.realpathSync(resolved)!==resolved||!fs.statSync(resolved).isDirectory())reject();return resolved;}
function nativeProgress(value){
 if(!value||Object.keys(value).sort().join('|')!=='completedViewports|schema|stage|status|viewport'||value.schema!==1||!['running','passed','failed'].includes(value.status)||!STAGES.includes(value.stage))reject();
 for(const k of ['viewport','completedViewports'])if(!Number.isInteger(value[k])||value[k]<0||value[k]>4)reject();
 if(value.completedViewports>value.viewport||(value.status==='passed'&&(value.completedViewports!==4||value.viewport!==4||value.stage!=='viewport-complete')))reject();
 return {...value};
}
function nativeKeyboard(value){
 const bools=['observed','inMenu','documentFocused','bodyActive','rootActive','launcherActive','dialogOpen'];
 const keys=['schema','side','phase','direction','iteration','focusableCount','keyDownCount','keyUpCount',...bools];
 const phases=['reveal','fit','expanded','tab-input','tab-check','key-read','key-down','key-up','key-check','complete','escape-input','escape-check','escape-focus','close-reveal','close-input','close-check','close-focus','capture-reveal','capture-escape-input','capture-escape-check','backdrop-reveal','backdrop-input','backdrop-check','backdrop-focus','dismiss-complete','nav-input','nav-route','nav-count-host','nav-count-launcher','nav-count-dialog','nav-count-target','nav-ready','nav-controls','nav-parent','nav-open-read','nav-key-focus','nav-key-press','nav-click','nav-tap','nav-open-check','nav-expanded','nav-dialog-visible','nav-target-visible','nav-complete'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join('|')!==keys.sort().join('|')||value.schema!==1||![1,2].includes(value.side)||!phases.includes(value.phase)||![0,1,2].includes(value.direction))reject();
 for(const k of bools)if(typeof value[k]!=='boolean')reject();
 for(const k of ['iteration','focusableCount','keyDownCount','keyUpCount'])if(!Number.isInteger(value[k])||value[k]<0||value[k]>(k==='iteration'?14:32))reject();
 return {...value};
}
function nativeHit(value){
 if(!value||Object.keys(value).sort().join('|')!=='before|rejected|schema|side'||value.schema!==1||![1,2].includes(value.side))reject();
 function snapshot(v){
  if(!v||typeof v!=='object'||Array.isArray(v))reject();
  if(v.observed===false){if(Object.keys(v).join('|')!=='observed')reject();return;}
  const bools=['connected','enabled','visible','inViewport','centerOwned','pointerEvents'];
  if(v.observed!==true||Object.keys(v).sort().join('|')!==['observed','openModals','blocker',...bools].sort().join('|')||bools.some(k=>typeof v[k]!=='boolean')||!Number.isInteger(v.openModals)||v.openModals<0||v.openModals>32||!['launcher','intro','auth','rotate','loading','panel','scrim','dialog','canvas','other','none'].includes(v.blocker))reject();
 }
 snapshot(value.before);if(value.rejected!==null)snapshot(value.rejected);return JSON.parse(JSON.stringify(value));
}
function modeHit(value){
 if(!value||Object.keys(value).sort().join('|')!=='mode|schema|snapshot'||value.schema!==1||!['walking','editing','photo'].includes(value.mode))reject();
 nativeHit({schema:1,side:1,before:value.snapshot,rejected:null});return JSON.parse(JSON.stringify(value));
}
function offlineProbe(value){
 const keys=['step','controlled','farmMatches','cacheMatches','differentFields','serverResponses','nonWorkerResponses','errorCounts','responseClasses','responseObservation','transport'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k))||!['set-offline','reload','ready','control','save','menus','cache','responses','errors','complete'].includes(value.step))reject();
 for(const k of ['controlled','farmMatches','cacheMatches'])if(k in value&&typeof value[k]!=='boolean')reject();
 for(const k of ['serverResponses','nonWorkerResponses'])if(k in value&&(!Number.isSafeInteger(value[k])||value[k]<0||value[k]>1e6))reject();
 if('differentFields'in value){const a=value.differentFields,allowed=['v','coins','gems','xp','level','barn','barnCap','barnUps','decor','gold','plots','pens','layout','buildings'];if(!Array.isArray(a)||new Set(a).size!==a.length||a.some(k=>!allowed.includes(k)))reject();}
 if('errorCounts'in value){const c=value.errorCounts;if(!c||Object.keys(c).sort().join('|')!=='console|http|other|page|request'||Object.values(c).some(v=>!Number.isSafeInteger(v)||v<0||v>1e6))reject();}
 if('responseClasses'in value){
  const rows=value.responseClasses,seen=new Set();let count=0;
  if(!Array.isArray(rows)||rows.length>91||!('nonWorkerResponses'in value))reject();
  for(const r of rows){
   if(!r||Object.keys(r).sort().join('|')!=='count|protocol|resourceType|scope'||!['http','https','data','blob','other'].includes(r.protocol)||!['local','external','non-network','unknown'].includes(r.scope)||!['document','stylesheet','image','media','font','script','texttrack','xhr','fetch','eventsource','websocket','manifest','other'].includes(r.resourceType)||!Number.isSafeInteger(r.count)||r.count<1||r.count>1e6)reject();
   if(['http','https'].includes(r.protocol)?!['local','external'].includes(r.scope):['data','blob'].includes(r.protocol)?r.scope!=='non-network':r.scope!=='unknown')reject();
   const key=[r.protocol,r.scope,r.resourceType].join('|');if(seen.has(key))reject();seen.add(key);count+=r.count;
  }
  if(count!==value.nonWorkerResponses)reject();
 }
 if('transport'in value){
  const t=value.transport;
  if(!t||Object.keys(t).sort().join('|')!=='activeOwnedSockets|consoleObservations|expectedConsole|externalAborts|observedDisconnected|serverClosed'||typeof t.serverClosed!=='boolean'||!Number.isSafeInteger(t.activeOwnedSockets)||t.activeOwnedSockets<0||t.activeOwnedSockets>1e6)reject();
  if(!t.consoleObservations||Object.keys(t.consoleObservations).sort().join('|')!=='exactDisconnected|otherText')reject();
  for(const c of Object.values(t.consoleObservations))if(!c||Object.keys(c).sort().join('|')!=='firebaseApp|firebaseAuth|firebaseFirestore|other'||Object.values(c).some(n=>!Number.isSafeInteger(n)||n<0||n>1e6))reject();
  for(const key of ['externalAborts','observedDisconnected','expectedConsole']){
   const c=t[key];if(!c||Object.keys(c).sort().join('|')!=='firebaseApp|firebaseAuth|firebaseFirestore|other'||Object.values(c).some(n=>!Number.isSafeInteger(n)||n<0||n>1e6))reject();
  }
 }
 if('responseObservation'in value){
  const o=value.responseObservation;
  if(!o||Object.keys(o).sort().join('|')!=='externalFulfillCalls|localResponses')reject();
  const c=o.externalFulfillCalls;
  if(!c||Object.keys(c).sort().join('|')!=='firebaseSdk|other'||Object.values(c).some(n=>!Number.isSafeInteger(n)||n<0||n>1e6))reject();
  if(!Array.isArray(o.localResponses)||o.localResponses.length>6)reject();
  const seen=new Set();
  for(const row of o.localResponses){
   if(!row||Object.keys(row).sort().join('|')!=='beganBeforeOffline|category|count'||!['worker-script','app-asset','other'].includes(row.category)||typeof row.beganBeforeOffline!=='boolean'||!Number.isSafeInteger(row.count)||row.count<1||row.count>1e6)reject();
   const key=row.category+':'+row.beganBeforeOffline;if(seen.has(key))reject();seen.add(key);
  }
 }
 return JSON.parse(JSON.stringify(value));
}
function installedProgress(value){
 if(!value||Object.keys(value).some(k=>!['status','base','physicalPhone','stages','hashes','failedStage','offlineProbe'].includes(k))||!['RUNNING','PASS','FAIL'].includes(value.status)||value.base!=='38fa4706e41c40197b7afc32de693cb3901a80fb'||value.physicalPhone!==false)reject();
 const stages=['predecessor','update','updated-online','offline'];
 if(!Array.isArray(value.stages)||JSON.stringify(value.stages)!==JSON.stringify(stages.slice(0,value.stages.length)))reject();
 if('failedStage'in value&&!['source',...stages,'cleanup'].includes(value.failedStage))reject();
 const hashes=value.hashes,files=['index.html','sunny-ui.css?v=1','compact-ui.css?v=1','corner-menu.js?v=1','game.js?v=36'];
 if(!hashes||typeof hashes!=='object'||Array.isArray(hashes)||![0,5].includes(Object.keys(hashes).length))reject();
 for(const [name,hash]of Object.entries(hashes))if(!files.includes(name)||typeof hash!=='string'||hash!==sha(fs.readFileSync(path.join(__dirname,'../..',name.split('?')[0]))))reject();
 if(value.status==='PASS'&&(value.stages.length!==4||Object.keys(hashes).length!==5||'failedStage'in value))reject();
 if('offlineProbe'in value)offlineProbe(value.offlineProbe);
 return JSON.parse(JSON.stringify(value));
}
function collect({source,output,head,screenshots}){
 if(typeof head!=='string'||!/^[a-f0-9]{40}$/.test(head))reject();source=directory(source);output=path.resolve(output);
 if(fs.existsSync(output)||directory(path.dirname(output))!==path.dirname(output))reject();
 const entries=fs.readdirSync(source).sort(),files=[],receipts=[];let native;
 for(const name of entries){
  if(!name.endsWith('.json'))continue;if(!NAMES.has(name))reject();
  const raw=regular(path.join(source,name),8192),value=safeReceipt(JSON.parse(raw));if(name==='native.json')native=value;
  const bytes=Buffer.from(JSON.stringify(value)+'\n');files.push([name,bytes]);receipts.push({name,...value});
 }
 if(!receipts.length)reject();const images=[];let nativeState=null,keyboardState=null,hitState=null,modeHitState=null,installedState=null;
 if(screenshots&&fs.existsSync(screenshots)){
  screenshots=directory(screenshots);const progress=path.join(screenshots,'a52-native-progress.json'),installed=path.join(screenshots,'a52-installed-ui-cache/results.json');
  if(fs.existsSync(progress)){nativeState=nativeProgress(JSON.parse(regular(progress,4096)));files.push(['native-progress.json',Buffer.from(JSON.stringify(nativeState)+'\n')]);}
  const keyboard=path.join(screenshots,'a52-native-keyboard.json');
  if(fs.existsSync(keyboard)){keyboardState=nativeKeyboard(JSON.parse(regular(keyboard,4096)));files.push(['native-keyboard.json',Buffer.from(JSON.stringify(keyboardState)+'\n')]);}
  const hit=path.join(screenshots,'a52-native-hit.json');
  if(fs.existsSync(hit)){hitState=nativeHit(JSON.parse(regular(hit,8192)));files.push(['native-hit.json',Buffer.from(JSON.stringify(hitState)+'\n')]);}
  const mode=path.join(screenshots,'a52-mode-hit.json');
  if(fs.existsSync(mode)){modeHitState=modeHit(JSON.parse(regular(mode,8192)));files.push(['mode-hit.json',Buffer.from(JSON.stringify(modeHitState)+'\n')]);}
  if(fs.existsSync(installed)){directory(path.dirname(installed));installedState=installedProgress(JSON.parse(regular(installed,8192)));files.push(['installed-progress.json',Buffer.from(JSON.stringify(installedState)+'\n')]);}
 }
 if(screenshots&&executedPass(native)){
  screenshots=directory(screenshots);if(nativeState?.status!=='passed')reject();
  for(const [width,height]of VIEWPORTS)for(const stem of ['a52-tools-','a52-barn-','a52-corner-menus-']){
   const name=stem+width+'x'+height+'.png',b=regular(path.join(screenshots,name),16*1024*1024);images.push({name,...validatePng(b,width,height)});files.push([name,b]);
  }
 }
 const summary={schema:1,head,receipts,nativeProgress:nativeState,nativeKeyboard:keyboardState,nativeHit:hitState,modeHit:modeHitState,installedProgress:installedState,screenshots:images,rawDiagnosticsPublished:false,personalSavesUsed:false,visualReview:'pending-human-or-agent-pixel-inspection',physicalPhoneQualification:false};
 // All validation completes before the first output is created.
 fs.mkdirSync(output,{mode:0o700});for(const [name,b]of files)fs.writeFileSync(path.join(output,name),b,{flag:'wx',mode:0o600});
 fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx',mode:0o600});return summary;
}
function main(args){
 try{const o={};for(let i=0;i<args.length;i+=2){const key=args[i];if(!['--source','--output','--head','--screenshots'].includes(key)||key.slice(2)in o||typeof args[i+1]!=='string')reject();o[key.slice(2)]=args[i+1];}collect(o);process.stdout.write('A52 finite evidence exported\n');return 0;}
 catch{process.stderr.write('A52 public evidence rejected\n');return 1;}
}
module.exports={safeReceipt,executedPass,crc32,validatePng,nativeProgress,nativeKeyboard,nativeHit,modeHit,offlineProbe,installedProgress,collect,main,VIEWPORTS};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
