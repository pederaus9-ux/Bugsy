'use strict';
// Exercise the actual bounded steering selection before unchanged gate/peer checks.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const code=src.slice(src.indexOf('let next=new THREE.Vector2(ox+nx,oz+nz)'),src.indexOf('const recoveryQueued=transitStatus===1'));
const run=new Function('THREE','a','ox','oz','nx','nz','dx','dz','d','step','transitStatus','p','cowCareTransitStepClear','COW_YARD_LAYOUT','PRESET','task','PENS','inPen','hitsBlock',code+';return {next,transitClear};');
class V{constructor(x,y){this.x=x;this.y=y}}
const sim=({night=true,kind='bed',stage='approach',custom=false,layoutReturn=false,from=.01,preferred=-.02,direct=.02,blocked=false}={})=>run({Vector2:V},{pos:new V(from,0)},from,0,preferred,0,direct,0,Math.abs(direct),Math.abs(direct),0,new V(1,0),()=>true,{custom},{night},{kind,stage,layoutReturn},{courtyard:{}},(_,x)=>x>=0,()=>blocked?0:-1);
test('night stock straw approach replaces an outward step with a physically bounded inward step',()=>{const {next,transitClear}=sim();assert.ok(transitClear);assert.ok(next.x>.01&&next.x<=.03000001)});
test('unusable inward step cannot be committed or teleported',()=>{assert.equal(sim({blocked:true}).transitClear,false);assert.equal(sim({direct:-.02}).transitClear,false)});
test('legal existing movement is unchanged',()=>{assert.equal(sim({preferred:.006}).next.x,.016)});
test('not a generic pen, gate or other-care change',()=>{for(const o of [{night:false},{kind:'robot'},{kind:'feed'},{kind:'drink'},{stage:'exit'},{custom:true},{layoutReturn:true},{from:-.01}])assert.equal(sim(o).next.x,(o.from??.01)-.02)});
