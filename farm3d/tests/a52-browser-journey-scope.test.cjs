'use strict';
// Source/orchestration checks only. Never require or execute a browser journey here.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {normalizeA52NativeKeyboard}=require('./helpers/a52-native-keyboard-scope.cjs');
const root=path.resolve(__dirname,'../..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {normalizeA52Registration}=require('./helpers/a52-regression-registration.cjs');
const read=f=>normalizeA52Registration(f,fs.readFileSync(path.join(root,f),'utf8'));
const raw=read('farm3d/tests/fixtures/a52-browser-journey-scope.json'),scope=JSON.parse(raw);
const exact=(f,source)=>{
 const e=scope.files[f];assert(e,'Known journey accounting path');assert.equal(sha(source),e.afterSha256,'Exact reviewed current journey '+f);
 for(const h of [...e.hunks].reverse()){
  assert.equal(source.split(h.after).length-1,h.count,'Exact inverse hunk count '+f);
  source=source.split(h.after).join(h.before);
 }
 assert.equal(sha(source),e.beforeSha256,'Exact previous journey '+f);return source;
};
test('A52 journey receipt is exact and restricted to test-only paths',()=>{
 assert.equal(sha(raw),'004e413bdbbb0aa9919840235c4f211736c734550b645bc7b8ae936cfe9a8026');
 assert.equal(scope.browserExecution,'NOT_RUN_RETAINED_HOLDS');assert.equal(Object.keys(scope.files).length,42);
 assert(Object.keys(scope.files).every(p=>p.startsWith('farm3d/tests/')&&!p.includes('/evidence/')&&!p.includes('/fixtures/')));
});
test('every adapted journey reverses exactly without changing historical scenarios',()=>{
 for(const file of Object.keys(scope.files)){
  const current=read(file),original=exact(file,current);
  if(file.endsWith('.cjs')){new vm.Script(original,{filename:file+'-previous'});new vm.Script(current,{filename:file});}
  assert.deepEqual(current.match(/timeout\s*:\s*\d+/g),original.match(/timeout\s*:\s*\d+/g),'Original timeouts retained: '+file);
  assert.deepEqual(current.match(/waitForTimeout\([^)]*\)/g),original.match(/waitForTimeout\([^)]*\)/g),'Original waits retained: '+file);
  if(file.endsWith('.browser.cjs')){
   const focus=file.endsWith('/accessibility.browser.cjs');
   const amended=focus?original.replace("assert.equal(await p.evaluate(()=>document.activeElement.dataset.p),'settings');","assert.deepEqual(await p.evaluate(()=>({id:document.activeElement.id,visible:!!document.activeElement.getClientRects().length})),{id:'preview-tools-launch',visible:true},'A52 closes back to the visible Menu launcher');"):original;
   assert.deepEqual(current.match(/\bassert(?:\.[a-zA-Z]+)?\(/g),amended.match(/\bassert(?:\.[a-zA-Z]+)?\(/g),'No original assertions removed: '+file);
  }
 }
});
test('source accounting rejects appended edits, missing openers and changed assertions',()=>{
 for(const file of Object.keys(scope.files)){
  const current=read(file);assert.throws(()=>exact(file,current+'\n/* unknown */'));
  if(current.includes('await revealCornerAction'))assert.throws(()=>exact(file,current.replace('await revealCornerAction','await missingAction')));
  if(current.includes('assert.equal'))assert.throws(()=>exact(file,current.replace('assert.equal','assert.notEqual')));
 }
});
test('historical accessibility source remains a byte-exact separate fixture',()=>{
 const old=read('farm3d/tests/fixtures/a52-accessibility-v85.browser.cjs.txt');
 assert.equal(sha(old),'4809cdae2e6d33f88e305795e8ac5347fe9eb8572962fced6b35fa90fca07b90');
 assert.equal(old,exact('farm3d/tests/accessibility.browser.cjs',read('farm3d/tests/accessibility.browser.cjs')));
 assert(old.includes("assert.equal(await p.evaluate(()=>document.activeElement.dataset.p),'settings');"));
});
test('historical phases retain direct controls and explicit current phases open menus',()=>{
 assert(read('farm3d/tests/north-clearing-build.browser.cjs').includes("if(phase==='new')await revealCornerAction(p,'#editBtn');await p.locator('#editBtn').click();"));
 assert(read('farm3d/tests/immediate-buildable-land.browser.cjs').includes("if(ref==='current')await revealCornerAction(p,'#editBtn');await p.locator('#editBtn').click();"));
 assert(read('farm3d/tests/animal-pen-resource-cycles.browser.cjs').includes("if(!await entry.isVisible()){await revealCornerAction(p,'#editBtn');await p.locator('#editBtn').click();}"));
 assert(read('farm3d/tests/animal-pen-mobile-menu.browser.cjs').includes("if(!await page.locator('#animalPensBtn').isVisible()){await revealCornerAction(page,'#editBtn');await page.locator('#editBtn').click();}"));
 assert(read('farm3d/tests/animal-pen-operations.browser.cjs').includes("if(!await p.getByRole('button',{name:'Animal pens',exact:true}).isVisible())await revealCornerAction(p,'#editBtn');"));
});
test('three historical CDP audio journeys remain unchanged',()=>{
 const pins={
  'qualification-audio.browser.cjs':'ba5b71639242ab4446f14c6a3842e4218cd56b25db0f267982ededabaf0fd082',
  'qualification-audio-background.browser.cjs':'262296457f83bd39717091e59af14ac00a975b0bb5d4964cdc109f6150455553',
  'qualification-audio-fix-background.browser.cjs':'023f31e78bdbb44e35324757653453e092a167425c8b55568bc5634d431c6960'
 };
 for(const [file,pin]of Object.entries(pins))assert.equal(sha(read('farm3d/tests/'+file)),pin);
});
test('current installed-cache checks use v93 without deleting prior assertions',()=>{
 for(const file of ['cow-update','chicken-pen-update','decor-catalog','utility-lights']){
  const name='farm3d/tests/'+file+'.browser.cjs',source=read(name),original=exact(name,source);
  assert(source.includes('sa3d-v93'));assert.equal(source.includes('sa3d-v85'),false);
  const historical=s=>[...s.matchAll(/sa3d-v(\d+)/g)].map(m=>m[0]).filter(v=>!['sa3d-v85','sa3d-v93'].includes(v));
  assert.deepEqual(historical(source),historical(original));
 }
});
test('each standalone server serves local CSS without broader runner changes',()=>{
 for(const file of ['hands-production','performance7k','animal-pen-full-ground-grid','animal-pen-mobile-menu']){
  const source=read('farm3d/tests/'+file+'.browser.cjs');assert(source.includes("'.css':'text/css'")||source.includes("file.endsWith('.css')?'text/css':"));
 }
});
test('new native coverage is opt-in and Node-only runner never launches it',()=>{
 const native=read('farm3d/tests/a52-corner-menus.browser.cjs');new vm.Script(native);
 assert(native.includes('[[1280,720,false],[320,568,true],[390,844,true],[844,390,true]]'));
 assert(native.indexOf('A52_CURRENT_BROWSER_APPROVED')<native.indexOf("require('./browser-harness.cjs')"));
 const manifest=JSON.parse(read('farm3d/tests/quality-loops.json'));
 const lane=manifest.lanes.find(l=>l.files?.includes('a52-corner-menus.browser.cjs'));assert.equal(lane.id,'browser-accessibility');assert.equal(lane.defaultEnabled,false);
 assert(manifest.lanes.find(l=>l.kind==='node'&&l.files?.includes('a52-browser-navigation.test.cjs')));
 const runner=read('farm3d/tests/run-core-game-tests.mjs');assert(runner.includes("'a52-browser-navigation.test.cjs','a52-browser-journey-scope.test.cjs'"));
 assert(!runner.includes("'a52-corner-menus.browser.cjs'"));
});
test('native identity probe handles id-less Settings in its original left container',()=>{
 const native=read('farm3d/tests/a52-corner-menus.browser.cjs');
 const expression=native.match(/assert\.deepEqual\(await p\.evaluate\(\(\)=>\((\{\s*count:__a52Journey\.nodes\.length,[\s\S]*?\})\)\),\{count:12,same:true,hidden:true\}\);/);assert(expression,'Exact identity observation found');
 const defs=[['','orders'],['','barn'],['','decor'],['','shop'],['walkBtn',''],['editBtn',''],['','settings'],['soundBtn',''],['friendsBtn',''],['verifiedBtn',''],['questBtn','quests'],['photoBtn','']];
 const nodes=defs.map(([id,p])=>({id,dataset:{p},isConnected:true,hidden:id==='verifiedBtn',closest:s=>s==='dialog.preview-menu'?{}:null}));
 const hosts=defs.map((_,i)=>i<4?'.dock':'.side');
 const document={getElementById:id=>nodes.find(b=>b.id===id),querySelector:selector=>nodes.find((b,i)=>selector===hosts[i]+' [data-p="'+b.dataset.p+'"]')??null};
 const result=vm.runInNewContext('('+expression[1]+')',{__a52Journey:{nodes,hosts},document});
 assert.deepEqual(JSON.parse(JSON.stringify(result)),{count:12,same:true,hidden:true});
});
function probeFixture(){
 const file='farm3d/tests/a52-corner-menus.browser.cjs';
 const source=normalizeA52NativeKeyboard(file,read(file));
 const named=source.match(/function observeOriginalControls\(\)\{([\s\S]*?)\n\}\nasync function main/);
 const legacy=source.match(/await p\.addInitScript\(\(\)=>\{([\s\S]*?)\n        \}\);/);
 assert(named||legacy,'Original-node observation script found');
 let observer,visible=[];const listeners={};
 const host=side=>({nodeType:1,classList:{contains:n=>n===side},matches:s=>s==='.side,.dock'});
 const left=host('side'),right=host('dock');
 const keys=['orders','barn','decor','shop','walkBtn','editBtn','questBtn','photoBtn','soundBtn','friendsBtn','verifiedBtn','settings'];
 const nodes=keys.map((key,i)=>({nodeType:1,id:key.endsWith('Btn')?key:'',dataset:{p:key.endsWith('Btn')?'':key},classList:{contains:()=>false},matches:s=>s==='button',parentElement:i<4?right:left,handlers:[],addEventListener(_name,fn){this.handlers.push(fn);}}));
 left.children=nodes.slice(4);right.children=nodes.slice(0,4);
 const launchers=[left,right].map(parentElement=>({parentElement,nodeType:1,classList:{contains:n=>n==='preview-launcher'},matches:s=>s==='button',addEventListener(){}}));
 const window={addEventListener(){}};
 const document={querySelectorAll:()=>visible,addEventListener:(name,fn)=>listeners[name]=fn};
 class MutationObserver{constructor(fn){this.callback=fn;observer=this;}observe(){}disconnect(){this.closed=true;}}
 vm.runInNewContext('(()=>{'+(named||legacy)[1]+'})()',{window,document,MutationObserver});
 // The browser has already reparented all original controls by the time its
 // deferred module finishes. Mutation records still retain their original host.
 visible=launchers;
 const records=[right,left].map(target=>({target,addedNodes:[],removedNodes:nodes.filter(n=>n.parentElement===target)}));
 return {window,nodes,records,roots:[right,left],emit(batch=records){observer?.callback([...batch,...batch]);listeners.DOMContentLoaded?.();}};
}
test('identity observation survives module initialization before DOMContentLoaded',()=>{
 const f=probeFixture();f.emit();assert.equal(f.window.__a52Journey.nodes.length,12);
 assert.equal(f.window.__a52Journey.nodes.every(b=>f.nodes.includes(b)),true);
 assert.deepEqual(Array.from(f.window.__a52Journey.hosts),['.dock','.dock','.dock','.dock',...Array(8).fill('.side')]);
});
test('repeated parser/reparent mutation records attach only one event observer per original',()=>{
 const f=probeFixture();f.emit();assert(f.nodes.every(b=>b.handlers.length===1));
});
test('newly inserted toolbar roots are scanned before their controls move',()=>{
 const f=probeFixture();f.emit([{target:{},addedNodes:f.roots,removedNodes:[]}]);assert.equal(f.window.__a52Journey.nodes.length,12);assert(f.nodes.every(b=>b.handlers.length===1));
});
test('a duplicate node for an expected original identity is explicitly rejected',()=>{
 const f=probeFixture(),original=f.nodes[0],copy={...original,handlers:[]};
 f.records[0].removedNodes.push(copy);f.emit();assert.equal(f.window.__a52Journey.duplicate,true);
 assert.equal(f.window.__a52Journey.nodes[0],original);assert.equal(copy.handlers.length,0);
});
