'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const f=require('./helpers/cow-day-mirror-source-fixture.cjs');
const run=new Function('pal','THREE','rnd','pen','weather','PRESET','inPen','roamClearance','BLOCKS',f.after);
class V {constructor(x,y){this.x=x;this.y=y;}clone(){return new V(this.x,this.y)}add(o){this.x+=o.x;this.y+=o.y;return this}multiplyScalar(v){this.x*=v;this.y*=v;return this}set(x,y){this.x=x;this.y=y;return this}}
function probe({spec='cow',palKind='cow',night=false,wx='fair',care=false,palCare=false,shared=true,fence=x=>x>=0,blocks=[],px=.3,pz=0,u=.1,v=.5}={}){
 const pen={},pal={kind:palKind,pen:shared?pen:{},name:'Partner',cowTask:palCare,get pos(){return new V(px,pz)}};
 const actor={kind:spec,cowTask:care,go(...args){this.calls.push(args);return 7654},calls:[]};
 let i=0;const draws=[u,v],result=run.call(actor,pal,{Vector2:V},()=>{assert(i<2);return draws[i++]},pen,wx,{night},(_,x,z,margin)=>fence(x,z,margin),.75,blocks);
 assert.equal(i,2);assert.equal(actor.friend,pal);assert.equal(result,7654);assert.equal(actor.calls.length,1);assert.deepEqual(actor.calls[0].slice(2),[false,'Visiting Partner','social']);return actor.calls[0].slice(0,2);
}
test('legal original destination/partner/RNG unchanged',()=>assert.deepEqual(probe({fence:()=>true}),[-.7,0]));
test('mirror only when original blocked and reflected point legal',()=>assert.deepEqual(probe(),[1.2999999999999998,0]));
test('if both points blocked leave original to normal route machinery',()=>assert.deepEqual(probe({fence:()=>false}),[-.7,0]));
test('obstacle clearance uses both axes plus original margin',()=>{
 assert.deepEqual(probe({fence:()=>true,blocks:[[-.7,0,.1,.1]]}),[1.2999999999999998,0]);assert.deepEqual(probe({fence:()=>true,blocks:[[-.7,2,.1,.1]]}),[-.7,0]);});
test('exclude nights, wet weather, care, other species and other pens',()=>{for(const opts of [{night:true},{wx:'wet'},{care:true},{palCare:true},{spec:'sheep'},{palKind:'sheep'},{shared:false}])assert.deepEqual(probe(opts),[-.7,0]);});
test('exact splice fails when original is missing or duplicated',()=>{assert.throws(()=>f.substitute(''));assert.throws(()=>f.substitute(f.before+f.before));assert.equal(f.substitute('a'+f.before+'b'),'a'+f.after+'b');});
