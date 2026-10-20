import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// This is the actual browser test's camera-readiness helper. Page/DOM are the
// boundary; a stale cached interaction target must not pass a fresh-ray check.
const source=readFileSync(new URL('./seed-selection.browser.cjs',import.meta.url),'utf8');
const begin=source.indexOf('async function focusPlot('),end=source.indexOf('async function boot(',begin);
assert(begin>=0&&end>begin);
function setup(cachedIndex,freshIndex=2,label='Plant Wheat',cachedLabel='Plant'){
 const d={plots:Array.from({length:4},()=>({g:{position:{x:0,z:0}}})),walk:{pos:{set(){}},vel:{set(){}}},hitAt:()=>({type:'plot',i:freshIndex}),seedTestAim:{type:'plot',i:cachedIndex,label:cachedLabel},clock:()=>1};
 const env={__dbg:d,window:{__seedFocusObservations:[]},performance:{now:()=>0},targetDiagnostics:async()=>{},innerWidth:740,innerHeight:360,document:{getElementById:()=>({hidden:false,getAttribute:()=>label})},artifacts:'',path:{join:()=>''},fs:{writeFileSync(){}}};
 vm.createContext(env);const focus=vm.runInContext('('+source.slice(begin,end)+')',env);
 const page={evaluate:async(fn,arg)=>fn(arg),waitForFunction:async(fn,arg)=>{if(!fn(arg))throw Error('Target not ready');}};
 return {focus,page};
}
test('fresh ray and identical Plant label cannot certify a frame-old keyboard target',async()=>{
 const {focus,page}=setup(1);await assert.rejects(focus(page,2,'Plant Wheat'),/Target not ready/);
});
test('a matching cached target still requires the original fresh ray and visible label',async()=>{
 for(const [cached,fresh,label]of [[2,1,'Plant Wheat'],[2,2,'Water']]){const{focus,page}=setup(cached,fresh,label);await assert.rejects(focus(page,2,'Plant Wheat'),/Target not ready/);}
 const staleAction=setup(2,2,'Plant Wheat','Water');await assert.rejects(staleAction.focus(staleAction.page,2,'Plant Wheat'),/Target not ready/);
 const{focus,page}=setup(2);await focus(page,2,'Plant Wheat');
});
