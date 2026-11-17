'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(__dirname,'a52-corner-menus.browser.cjs');
function load(){const m={exports:{}};vm.runInNewContext(fs.readFileSync(file,'utf8')+'\nmodule.exports={keyboardObservation,finiteKeyboard};',{require,module:m,process:{env:{}},console});return m.exports;}
test('keyboard receipt rejects arbitrary labels and nonfinite numeric values',()=>{const d=load();for(const args of [[9,'tab-check',0,0],[1,'https://secret.invalid',0,0],[1,'tab-check',3,0],[1,'tab-check',0,99]])assert.throws(()=>d.finiteKeyboard(...args));});
test('keyboard receipt projects only bounded primitive fields, never raw DOM diagnostics',()=>{const d=load(),o={inMenu:false,documentFocused:false,bodyActive:true,rootActive:false,launcherActive:false,dialogOpen:true,focusableCount:8,secret:'DO_NOT_EXPORT'};const r=d.finiteKeyboard(1,'tab-check',1,8,o);assert.equal(r.observed,true);assert.equal(r.inMenu,false);assert.equal(r.focusableCount,8);assert(!JSON.stringify(r).includes('DO_NOT_EXPORT'));assert.throws(()=>d.finiteKeyboard(1,'tab-check',1,8,{...o,inMenu:'secret'}));assert.throws(()=>d.finiteKeyboard(1,'tab-check',1,8,{...o,focusableCount:Infinity}));});
test('passive observation distinguishes menu focus from document/chrome focus loss without recording element identity',()=>{
 const source=fs.readFileSync(file,'utf8'),m={exports:{}},active={closest(){return null;}},doc={activeElement:active,body:active,documentElement:{},hasFocus(){return false;},getElementById(){return {open:true,querySelectorAll(){return [{disabled:false,getClientRects(){return [1];}},{disabled:true,getClientRects(){return [1];}}]}};}};
 vm.runInNewContext(source+'\nmodule.exports={keyboardObservation};',{require,module:m,process:{env:{}},document:doc,console});const r=m.exports.keyboardObservation('preview-tools-menu');assert.equal(r.bodyActive,true);assert.equal(r.inMenu,false);assert.equal(r.documentFocused,false);assert.equal(r.dialogOpen,true);assert.equal(r.focusableCount,1);
});
test('exact delta keeps every original assertion, keyboard action and timeout',()=>{
 const {scope,sha,normalizeA52NativeKeyboard}=require('./helpers/a52-native-keyboard-scope.cjs');const s=fs.readFileSync(file,'utf8');assert.equal(sha(s),scope.afterSha256);assert.equal(normalizeA52NativeKeyboard(scope.file,s),scope.before);
 for(const pattern of [/assert\.[\s\S]*?;\n/g,/await p\.keyboard\.[^;]+;/g,/timeout:\d+/g,/for\(const key of \['Tab','Shift\+Tab'\]\)for\(let i=0;i<14;i\+\+\)/g])assert.deepEqual(s.match(pattern),scope.before.match(pattern));
 const changed=s+'\n// unknown';assert.equal(normalizeA52NativeKeyboard(scope.file,changed),changed);
});
test('dismissal instrumentation reverses to exact prior keyboard source and preserves native action sequence',()=>{
 const {scope,sha}=require('./helpers/a52-native-keyboard-scope.cjs');const current=fs.readFileSync(file,'utf8');let prior=scope.navigationExtension?scope.navigationExtension.before:current;
 for(const h of [...scope.diagnosticExtension].reverse()){assert.equal(prior.split(h.after).length,2);prior=prior.replace(h.after,h.before);}
 assert.equal(sha(prior),scope.previousAfterSha256);assert.equal(scope.previousReceiptSha256,'620301be0db89e9c1c62ac9f1b35266809fd4785b16a13b68bf6b0e18a344d74');
 const actions=/await (?:p\.(?:keyboard\.(?:press|down|up)|touchscreen\.tap|mouse\.click|screenshot)|revealCornerAction|native|closed)\([^;]*?\);/g;
 assert.deepEqual(current.match(actions),prior.match(actions));
 assert.equal(sha(scope.navigationExtension.before),scope.navigationExtension.previousAfterSha256);
 assert.deepEqual(current.match(/assert\.[\s\S]*?;\n/g),prior.match(/assert\.[\s\S]*?;\n/g));
 for(const phase of ['escape-input','escape-check','escape-focus','close-reveal','close-input','close-check','close-focus','capture-reveal','capture-escape-input','capture-escape-check','backdrop-reveal','backdrop-input','backdrop-check','backdrop-focus','dismiss-complete'])assert.equal(load().finiteKeyboard(1,phase).phase,phase);
});
