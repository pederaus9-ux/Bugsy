'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {launcherHit,finiteHit,observeLauncherHit}=require('./helpers/a52-native-hit.cjs');
const sample={observed:true,connected:true,enabled:true,visible:true,inViewport:true,centerOwned:false,pointerEvents:true,openModals:1,blocker:'dialog'};
test('finite projection rejects raw values and strips unrelated data',()=>{
 assert.deepEqual(finiteHit({...sample,secret:'private'}),sample);
 for(const patch of [{blocker:'private'},{openModals:33},{openModals:NaN},{enabled:'true'}])assert.throws(()=>finiteHit({...sample,...patch}));
});
test('observation failure exports no error details',async()=>{assert.deepEqual(await observeLauncherHit({evaluate:async()=>{throw Error('private');}}),{observed:false});});
test('passive DOM observation classifies hit without leaking coordinates or DOM text',()=>{
 const blocker={closest:s=>s==='dialog'?{}:null};const el={isConnected:true,disabled:false,contains:()=>false,matches:()=>false,getBoundingClientRect:()=>({left:1,top:2,width:44,height:44})};
 el.ownerDocument={defaultView:{innerWidth:320,innerHeight:568,getComputedStyle:()=>({visibility:'visible',display:'block',pointerEvents:'auto'})},elementFromPoint:()=>blocker,querySelectorAll:()=>[{}]};
 assert.deepEqual(launcherHit(el),sample);
 el.ownerDocument.elementFromPoint=()=>el;assert.equal(launcherHit(el).centerOwned,true);assert.equal(launcherHit(el).blocker,'launcher');
 el.getBoundingClientRect=()=>({left:-100,top:2,width:44,height:44});assert.equal(launcherHit(el).inViewport,false);assert.equal(launcherHit(el).blocker,'none');
});
test('helper scope preserves every original assertion/action and no deadline changes',()=>{
 const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),scope=JSON.parse(fs.readFileSync(require.resolve('./fixtures/a52-native-hit-scope.json'))),now=fs.readFileSync(require.resolve('./helpers/a52-browser-navigation.cjs'),'utf8');
 assert.equal(sha(fs.readFileSync(require.resolve('./fixtures/a52-native-hit-scope.json'))),'85b5fcc94fbc0408715ee10eba5e09b495eb4f28a4dbcc489bfdbdd0596acd2b');
 assert.equal(sha(now),scope.afterSha256);assert.equal(sha(scope.before),scope.beforeSha256);
 assert.equal(now.split(scope.actionReplacement.after).length,2);
 const inverse=now.replace(scope.actionReplacement.after,scope.actionReplacement.before);
 for(const re of [/assert\.[^;]+;/g,/await [^;]+;/g,/timeout\s*:\s*\d+/g])assert.deepEqual(inverse.match(re),scope.before.match(re));
 assert(now.includes('throw error;'));assert(!now.includes('force:'));
 const {scope:k,sha:ks}=require('./helpers/a52-native-keyboard-scope.cjs');assert.equal(ks(k.hitExtension.before),k.hitExtension.previousAfterSha256);
 const current=fs.readFileSync(require.resolve('./a52-corner-menus.browser.cjs'),'utf8');assert.equal(ks(current),k.afterSha256);
});

test('scrim classification is finite and leaves panel precedence intact',()=>{
 const el={isConnected:true,disabled:false,contains:()=>false,matches:()=>false,getBoundingClientRect:()=>({left:1,top:2,width:44,height:44})};
 const w={innerWidth:320,innerHeight:568,getComputedStyle:()=>({visibility:'visible',display:'block',pointerEvents:'auto'})};
 el.ownerDocument={defaultView:w,elementFromPoint:()=>({closest:s=>s==='#panelRoot > .scrim'?{}:null}),querySelectorAll:()=>[]};
 assert.equal(launcherHit(el).blocker,'scrim');assert.equal(finiteHit(launcherHit(el)).blocker,'scrim');
 el.ownerDocument.elementFromPoint=()=>({closest:s=>['.panel','#panelRoot > .scrim'].includes(s)?{}:null});assert.equal(launcherHit(el).blocker,'panel');
});
test('scrim diagnosis scope preserves exact predecessors',()=>{
 const raw=fs.readFileSync(require.resolve('./fixtures/a52-native-hit-panel-scope.json')),scope=JSON.parse(raw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 assert.equal(sha(raw),'e28ab3dc28df0fbe1c8d51823f781dfa4884c090f134b19d6efb871a48e35fb5');
 for(const [name,e]of Object.entries(scope.files)){const now=fs.readFileSync(require('node:path').resolve(__dirname,'../..',name));assert.equal(sha(now),e.afterSha256);assert.equal(sha(e.before),e.beforeSha256);}
});
