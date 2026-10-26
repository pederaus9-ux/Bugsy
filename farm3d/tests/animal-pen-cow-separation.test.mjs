import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
import {cowPenStep} from '../animal-pen-cow-support.js';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('    if (this.rig3d) {'),end=html.indexOf('    // face the way it walks',start);
assert(start>=0&&end>start);const source=html.slice(start,end);
// Position-only replay of the actual final ordinary runtime block. Rig behavior
// is covered by the existing real-rig runtime/support suites and browser case.
function step({from,to,others,custom=true,dt=1/60}){
 const target=new THREE.Vector2(10,10),a={kind:'cow',pen:{custom},g:{position:new THREE.Vector3(...to)},rig3d:{},vel:new THREE.Vector2(),S:{walk:.8,run:2.6},P:{energy:.5},act:'moving',hop:0,target,ref:{i:3},cowMealCycle:1};
 const animals=[a,...others.map(p=>({kind:'cow',g:{position:new THREE.Vector3(...p)}}))];
 const c=vm.createContext({THREE,a,animals,dt,t:51.04,ox:from[0],oz:from[2],P:a.P,cowPenStep,cowSupportY:()=>.08,Cow3D:{updateCow3D(){}},applyCowPenSupport(){}});
 vm.runInContext('(function(){'+source+'}).call(a)',c);
 assert.strictEqual(a.target,target);assert.equal(a.cowMealCycle,1);assert.equal(a.cowTask,undefined);
 const after=a.g.position.toArray();assert(Math.hypot(...after.map((v,i)=>v-from[i]))<=.8*dt+1e-10);
 return after;
}
const raw=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task7-codex-occupied-shelter-20261023/feed-separation-trace-60/results.json',import.meta.url))),frame=raw.stepTrace.find(s=>s.pairs.some(p=>p.gap<.85));
const retained={from:frame.before[3].p,to:frame.after[3].p,others:frame.before.filter(a=>a.i!==3).map(a=>a.p)};
test('retained ordinary cow4 step cannot cross reserved cow3 minimum separation',()=>{
 const after=step(retained);for(const b of retained.others)assert(Math.hypot(after[0]-b[0],after[2]-b[2])>=.85,'retained .85m separation');
});
test('default ordinary policy stays byte-behavior compatible in the same final-step replay',()=>{
 assert.deepEqual(step({...retained,custom:false}),retained.to);
});
test('a clear ordinary step is unchanged and actually moves',()=>{
 const from=[0,.08,0],to=[.01,.08,.002];assert.deepEqual(step({from,to,others:[[2,.08,0]]}),to);
});
test('nearby cows do not suppress a safe departing step',()=>{
 const from=[.851,.08,0],to=[.861,.08,0];assert.deepEqual(step({from,to,others:[[0,.08,0]]}),to);
});
test('continuous clearance rejects tunnelling even when both endpoints are clear',()=>{
 const from=[-1,.08,0],to=[1,.08,0],after=step({from,to,others:[[0,.08,0]],dt:2.5});
 assert(after[0]<=-.85,'cannot cross through a cow');
});
test('a pre-existing close pair may recover without a snap or any closer approach',()=>{
 const from=[.8,.08,0],away=[.81,.08,0],toward=[.79,.08,0];assert.deepEqual(step({from,to:away,others:[[0,.08,0]]}),away);
 const after=step({from,to:toward,others:[[0,.08,0]]});assert(Math.hypot(after[0],after[2])>=.8);
});
test('all neighbors are protected, including a second cow opposite the first',()=>{
 const from=[0,.08,0],to=[.01,.08,0],after=step({from,to,others:[[-.86,.08,0],[.855,.08,0]]});
 for(const x of [-.86,.855])assert(Math.hypot(after[0]-x,after[2])>=.85);
});
