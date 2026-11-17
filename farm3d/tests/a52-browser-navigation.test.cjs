'use strict';
// Browser-free orchestration contracts. These do not qualify native dialog behavior.
const test=require('node:test'),assert=require('node:assert/strict');
let navigation;try{navigation=require('./helpers/a52-browser-navigation.cjs');}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
const reveal=(...args)=>{assert(navigation,'A52 browser navigation helper must exist');return navigation.revealCornerAction(...args);};
const actions={tools:['#walkBtn','#editBtn','#questBtn','#photoBtn','[data-p="settings"]','#soundBtn','#friendsBtn','#verifiedBtn'],barn:['[data-p="orders"]','[data-p="barn"]','[data-p="decor"]','[data-p="shop"]']};
function fixture(selector,side='tools',options={}){
 const calls=[],dialogId='preview-'+side+'-menu',launchId='preview-'+side+'-launch';
 const state={open:!!options.open,expanded:options.open?'true':'false',...options};
 const nodes={
  host:{attrs:{'data-menu-ready':state.ready??'true'}},
  launch:{attrs:{'aria-controls':state.controls??dialogId}},
  dialog:{},
  target:{closest:value=>value==='dialog'?{id:state.targetDialog??dialogId}:null}
 };
 function locator(kind){return{
  async count(){return state[kind+'Count']??1;},
  async getAttribute(name){if(name==='open')return state.open?'':null;if(name==='aria-expanded')return state.expanded;return nodes[kind].attrs?.[name]??null;},
  async evaluate(fn){return fn(nodes[kind]);},
  async waitFor(value){calls.push([kind,'waitFor',value]);if(state[kind+'Hidden']||(kind==='dialog'&&!state.open))throw Error('not visible');},
  async focus(){calls.push([kind,'focus']);},
  async click(options){calls.push([kind,'click',options]);if(kind!=='launch')throw Error('helper must not activate original action');if(state.activationError)throw Error('native activation blocked');if(!state.noOpen){state.open=true;state.expanded=state.wrongExpanded??'true';}},
  async tap(options){calls.push([kind,'tap',options]);if(kind!=='launch')throw Error('helper must not activate original action');if(!state.noOpen){state.open=true;state.expanded=state.wrongExpanded??'true';}}
 };}
 const page={locator(value){if(value===(side==='tools'?'.side':'.dock'))return locator('host');if(value==='#'+launchId)return locator('launch');if(value==='#'+dialogId)return locator('dialog');if(value===selector)return locator('target');throw Error('unexpected selector '+value);},keyboard:{async press(key){calls.push(['keyboard','press',key]);if(key!=='Enter')throw Error('unexpected key');state.open=true;state.expanded='true';}}};
 return{page,calls,state};
}
for(const [side,selectors] of Object.entries(actions))for(const selector of selectors)test('strict current-menu route for '+selector,async()=>{
 const f=fixture(selector,side);await reveal(f.page,selector);
 assert.equal(f.state.open,true);assert.equal(f.calls.filter(c=>c[1]==='click').length,1);
 assert.deepEqual(f.calls.find(c=>c[1]==='click'),['launch','click',undefined]);
 assert(f.calls.some(c=>c[0]==='target'&&c[1]==='waitFor'));
});
test('decor and dynamic panel selector variants use the appropriate menu',async()=>{
 for(const name of ['settings','orders','barn','decor','shop'])for(const selector of ['[data-act="open"][data-p="'+name+'"]',...(name==='settings'?[]:['.dock [data-p="'+name+'"]'])]){
  const f=fixture(selector,name==='settings'?'tools':'barn');await reveal(f.page,selector);assert.equal(f.state.open,true);
 }
});
test('touch opener remains a native tap and leaves original action to caller',async()=>{const f=fixture('#walkBtn');await reveal(f.page,'#walkBtn','tap');assert.deepEqual(f.calls.find(c=>c[1]==='tap'),['launch','tap',undefined]);assert(!f.calls.some(c=>c[1]==='click'));});
test('keyboard opener focuses launcher and uses native Enter',async()=>{const f=fixture('[data-p="settings"]');await reveal(f.page,'[data-p="settings"]','keyboard');assert.deepEqual(f.calls.filter(c=>c[1]==='focus'||c[1]==='press'),[['launch','focus'],['keyboard','press','Enter']]);});
test('an already open associated menu is not toggled closed',async()=>{const f=fixture('#walkBtn','tools',{open:true});await reveal(f.page,'#walkBtn');assert(!f.calls.some(c=>['click','tap','focus','press'].includes(c[1])));});
for(const [name,options] of Object.entries({missingMenu:{ready:'false'},wrongAssociation:{controls:'somewhere-else'},wrongParent:{targetDialog:'unrelated'},missingTarget:{targetCount:0},duplicateTarget:{targetCount:2},missingLauncher:{launchCount:0},missingDialog:{dialogCount:0},failedOpening:{noOpen:true},wrongExpanded:{wrongExpanded:'false'},hiddenTarget:{targetHidden:true},nativeFailure:{activationError:true}}))test('rejects '+name+' instead of falling back',async()=>{const f=fixture('#walkBtn','tools',options);await assert.rejects(async()=>reveal(f.page,'#walkBtn'));});
test('non-menu selectors and unsupported input modes are rejected before any action',async()=>{
 for(const [selector,input]of [['.panel [data-p="marketSales"]','click'],['#actBtn','click'],['#walkBtn','force']]){const f=fixture(selector);await assert.rejects(async()=>reveal(f.page,selector,input));assert.deepEqual(f.calls,[]);}
});
