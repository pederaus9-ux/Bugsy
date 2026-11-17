'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const file=require.resolve('./helpers/a52-native-event-setup.cjs');
function fixture(type='event',input='click'){
 const calls=[],state={type,menu:false,focused:false},m={exports:{}};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),{module:m,require:n=>n==='./a52-browser-navigation.cjs'?{revealCornerAction:async(p,s,i)=>{calls.push(['reveal',s,i]);state.menu=true;}}:require(n)});
 const page={waitForFunction:async(fn,arg,options)=>{calls.push(['wait',options.timeout]);if(options.timeout===45000&&state.type!=='event')throw Error('expected event absent');if(options.timeout===15000&&state.type)throw Error('panel remains');},evaluate:async()=>state.type,
 keyboard:{press:async key=>{calls.push(['key',key]);state.menu=false;state.focused=true;}},
 locator(selector){return {count:async()=>selector==='dialog.preview-menu[open]'?+state.menu:+!!state.type,evaluate:async()=>state.focused,[input]:async()=>{calls.push(['native',selector,input]);state.type=null;}};}};
 return {calls,state,run:()=>m.exports.settleSandboxEvent(page,input)};
}
for(const input of ['click','tap'])test('real event/menu coexistence then native '+input+' dismissal',async()=>{const f=fixture('event',input);await f.run();assert.deepEqual(f.calls,[['wait',45000],['reveal','#walkBtn','keyboard'],['key','Escape'],['native','#panelRoot .xbtn',input],['wait',15000]]);assert.equal(f.state.type,null);});
test('no arbitrary panel dismissed when expected event absent',async()=>{const f=fixture('settings');await assert.rejects(f.run);assert(!f.calls.some(c=>c[0]==='native'));});
test('main journey exact inverse retains original flow and deadline statements',()=>{
 const {scope,sha}=require('./helpers/a52-native-keyboard-scope.cjs'),s=fs.readFileSync(require.resolve('./a52-corner-menus.browser.cjs'),'utf8'),e=scope.eventSetupExtension;
 assert.equal(sha(s),scope.afterSha256);assert.equal(sha(e.before),e.previousAfterSha256);assert.equal(s.split(e.addition).length,2);assert.equal(s.replace(e.addition,''),e.before);
 const helper=fs.readFileSync(file,'utf8');assert(!/force\s*:|dispatchEvent|opts\.quiet\s*=|panel\s*=|\.close\(/.test(helper));
});
