import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/function updatePointer\(\) \{[\s\S]*?\n\}/)?.[0];
assert(source,'Native tutorial pointer function missing');
function run({buttonVisible,launcherVisible=true,buttonPresent=true}){
 const pointer={hidden:false,style:{}},rect={left:100,top:200,width:44,height:44},launchRect={left:700,top:230,width:76,height:54};
 const button=buttonPresent?{getClientRects:()=>buttonVisible?[rect]:[],getBoundingClientRect:()=>buttonVisible?rect:{left:0,top:0,width:0,height:0}}:null;
 const launcher={getClientRects:()=>launcherVisible?[launchRect]:[],getBoundingClientRect:()=>launchRect};
 const ctx={pointer,G:{panel:null,tutTarget:()=> 'btn:shop'},document:{getElementById:()=>({hidden:false}),querySelector:s=>s==='.dock > .preview-launcher'?launcher:button}};
 vm.runInNewContext(source+'\nupdatePointer();',ctx,{timeout:1000});return pointer;
}
test('tutorial points to the visible menu opener when Shop is collapsed',()=>{
 const p=run({buttonVisible:false});assert.equal(p.hidden,false);assert.equal(p.style.left,'738px');assert.equal(p.style.top,'216px');
});
test('tutorial retains the actual action target when its menu is open',()=>{
 const p=run({buttonVisible:true});assert.equal(p.hidden,false);assert.equal(p.style.left,'122px');assert.equal(p.style.top,'186px');
});
test('tutorial does not draw a zero-coordinate arrow when both targets are hidden',()=>assert.equal(run({buttonVisible:false,launcherVisible:false}).hidden,true));
test('missing original action does not invent a tutorial destination',()=>assert.equal(run({buttonVisible:false,buttonPresent:false}).hidden,true));
