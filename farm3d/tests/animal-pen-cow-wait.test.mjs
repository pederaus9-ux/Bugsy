import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function waitCowStation('),end=html.indexOf('\nfunction chooseCowTask(',start);
assert(start>=0&&end>start);
function fixture({fail=0,blocked=false,project=false}={}){
 const calls=[],pen={},a={kind:'cow',g:{position:new THREE.Vector3(0,.08,0)},S:{r:.9},until:0,act:'idle',target:null,path:null,ref:{i:0},cowDrinkAt:15,token:{generation:7},fit(v){return project?v.set(0,0):v;},go(x,z,running,label){calls.push({x,z,running,label});this.path=[];this.target=calls.length>fail?new THREE.Vector2(x,z):undefined;this.act=this.target?'moving':'idle';}};
 const c=vm.createContext({THREE,animals:[a],cowYard:{stations:[{approach:[0,.08,-.5],dock:[0,.08,.5]}]},COW_YARD_LAYOUT:{obstacles:[]},PENS:{courtyard:pen},clockT:10,fitsPen:()=>!blocked});
 vm.runInContext(html.slice(start,end),c);
 return{a,c,calls,run:()=>c.waitCowStation(a,'Waiting for water')};
}
test('a rejected waiting route tries the next legal candidate instead of claiming movement',()=>{
 const f=fixture({fail:1});f.run();assert(f.calls.length>1,'first empty route must not end search');assert(f.a.target);assert.equal(f.a.act,'moving');assert.equal(f.calls[0].running,false);assert.equal(f.a.until,0);assert.equal(f.a.cowDrinkAt,15);assert.equal(f.a.token.generation,7);
});
test('an exhausted bounded search returns to the existing one-second wait',()=>{
 const f=fixture({fail:Infinity});f.run();assert(f.calls.length>1&&f.calls.length<=120);assert.equal(f.a.target,null);assert.equal(f.a.act,'idle');assert.equal(f.a.until,11);assert.equal(f.a.label,'Waiting for water');
});
test('a successful first destination retains its existing ordinary request',()=>{
 const f=fixture();f.run();assert.equal(f.calls.length,1);assert.deepEqual(f.a.target.toArray(),[1.4,0]);assert.equal(f.a.act,'moving');assert.equal(f.a.cowDrinkAt,15);assert.equal(f.a.token.generation,7);
});
test('solid or out-of-pen candidates never reach ordinary go',()=>{
 const f=fixture({blocked:true});f.run();assert.equal(f.calls.length,0);assert.equal(f.a.target,null);assert.equal(f.a.until,11);
});
test('a fitted destination inside the care corridor is not a waiting place',()=>{
 const f=fixture({project:true});f.run();assert.equal(f.calls.length,0);assert.equal(f.a.target,null);assert.equal(f.a.until,11);
});
test('waiting search leaves positions, care reservations and cooldowns unchanged',()=>{
 const f=fixture({fail:2}),position=f.a.g.position.toArray(),token=f.a.token;f.run();assert.deepEqual(f.a.g.position.toArray(),position);assert.strictEqual(f.a.token,token);assert.equal(f.a.cowDrinkAt,15);assert.equal(f.a.cowTask,undefined);
});
