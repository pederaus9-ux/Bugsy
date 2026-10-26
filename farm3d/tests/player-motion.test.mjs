import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../lib/three.module.min.js';
import {makeHands,nativeHandsDriver} from './fixtures/native-player-hands.mjs';

const file=new URL('../player-motion.js',import.meta.url);
const code=existsSync(file)?readFileSync(file,'utf8').replaceAll('\r\n','\n'):'';
const acceptedSha='05880d7813d667a86af2fbc05fd005495afc310c1665093b196f87ec7ad7c5b5';
const acceptedComment='// Owner-approved isolated pose overlay. Production modules/assets are unchanged.\n';
const acceptedGuard="  if(!['localhost','127.0.0.1'].includes(location.hostname)||!new URLSearchParams(location.search).has('testfarm')||window.__saPlayerStudy!==true||!G.SANDBOX)throw Error('Player motion study requires isolated synthetic harness');\n";
const frozen=readFileSync(new URL('./fixtures/player-motion-accepted.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const body=frozen.slice(frozen.indexOf('export function installPlayerMotion'));
const first=body.indexOf('\n')+1;
const acceptedSource=acceptedComment+body.slice(0,first)+acceptedGuard+body.slice(first);
const load=async s=>(await import('data:text/javascript;base64,'+Buffer.from(s).toString('base64'))).installPlayerMotion;
const candidate=code?await load(code):null;
const reference=code?await load(acceptedSource):null;
function requireCandidate(){assert.equal(typeof candidate,'function','production character module missing');}

// Lifecycle fixtures adapted from the reviewed cache-equivalence.cjs checks.
// Three.js is the real bundled library; scene nodes are synthetic, not game state.
function rig(install=candidate,legacyGuard=false){
  const scene=new T.Group(),camera=new T.PerspectiveCamera(),fallback=makeHands();
  scene.add(camera);camera.add(fallback);fallback.visible=false;let auth;
  function authored(){
    const root=new T.Group();root.name='Authored first-person hands';
    for(const side of ['L','R']){
      const arm=new T.Bone(),wrist=new T.Bone();arm.name=side+'_arm';wrist.name=side+'_wrist';root.add(arm);arm.add(wrist);
      for(let f=0;f<4;f++){let parent=wrist;for(let j=0;j<3;j++){const bone=new T.Bone();bone.name=side+'_finger'+f+'_'+j;parent.add(bone);parent=bone;}}
    }
    root.add(new T.Mesh(new T.BoxGeometry(.1,.1,.1),new T.MeshBasicMaterial()));return root;
  }
  auth=authored();camera.add(auth);
  const ctx={walk:{pos:new T.Vector2(0,16),yaw:0,pitch:-.08,gspd:0,gait:0,grun:0,vel:new T.Vector2(),bob:0,walked:0},ground:0,reducedMotion:false,punch:null};
  const args={THREE:T,G:{SANDBOX:legacyGuard},camera,fallback,getContext:()=>ctx};
  let controller;
  if(legacyGuard){
    const priorLocation=globalThis.location,priorWindow=globalThis.window;
    globalThis.location={hostname:'127.0.0.1',search:'?testfarm'};globalThis.window={__saPlayerStudy:true};
    try{controller=install(args);}finally{if(priorLocation===undefined)delete globalThis.location;else globalThis.location=priorLocation;if(priorWindow===undefined)delete globalThis.window;else globalThis.window=priorWindow;}
  }else controller=install(args);
  const nodes=root=>{const a=[];root.traverse(n=>{if(n.isBone)a.push(n);});return a;};
  const snapshot=root=>{const a=[];root.traverse(n=>a.push([n.name,n.position.toArray(),n.quaternion.toArray()]));return a;};
  const fallbackNative=nativeHandsDriver(fallback,ctx);
  function native(i){
    camera.position.set(ctx.walk?.pos.x||0,1.6,ctx.walk?.pos.y||16);camera.rotation.set(ctx.walk?.pitch||0,ctx.walk?.yaw||0,0,'YXZ');
    nodes(auth).forEach((b,k)=>{b.position.set((k%2?1:-1)*.01,.2+k*.002,Math.sin(i*.1+k)*.01);b.quaternion.setFromEuler(new T.Euler(.05*Math.sin(i+k),.02,.01));});
    if(fallback.visible)fallbackNative.evaluate(1/60,i/60);scene.updateMatrixWorld(true);
  }
  return {scene,camera,fallback,ctx,controller,nodes,snapshot,native,get auth(){return auth;},replace(){const prior=auth;camera.remove(auth);auth=authored();camera.add(auth);return prior;},authored};
}

test('accepted motion reference stays byte-pinned;production arm correction needs no browser globals',()=>{
  requireCandidate();
  assert.equal(createHash('sha256').update(acceptedSource).digest('hex'),acceptedSha,'every pose/cache/lifecycle byte must match accepted6dc0a17d');
  assert.doesNotMatch(code,/\b(?:window|location|SANDBOX|__saPlayerStudy)\b/);
  const r=rig();r.native(0);r.controller.update(1/60,0);assert.equal(r.controller.state.mode,'authored');
});

test('360 frames preserve accepted locomotion,local hand animation,state and held-frame behavior around scoped action placement',()=>{
  requireCandidate();const a=rig(reference,true),b=rig();
  for(let i=0;i<360;i++){
    for(const r of [a,b]){
      r.ctx.walk.gspd=i%90<30?0:i%90<60?3.4:6;r.ctx.walk.grun=r.ctx.walk.gspd>4?1:0;
      r.ctx.walk.gait=(i*.07)%1;r.ctx.walk.yaw=Math.sin(i*.03);r.ctx.walk.pitch=Math.sin(i*.04)*.8;
      r.ctx.reducedMotion=i>=280&&i<320;r.ctx.punch=i>=180&&i<240?{kind:'reach',authoredKind:['harvest','plant','water','pet','feed'][Math.floor(i/12)%5],t:0}:null;
      r.auth.visible=!(i>=240&&i<280);r.fallback.visible=!r.auth.visible;r.native(i);r.controller.update(1/60,i/60);
    }
    function compare(){
      assert.deepEqual(b.controller.state,a.controller.state);
      if(b.controller.state.rest===1)assert.deepEqual(b.snapshot(b.scene),a.snapshot(a.scene),'accepted locomotion and settled poses remain exact');
      else{
        assert.deepEqual(b.camera.position.toArray(),a.camera.position.toArray());assert.deepEqual(b.camera.quaternion.toArray(),a.camera.quaternion.toArray());
        const localHands=r=>r.snapshot(r.auth).filter(row=>!/^(L|R)_arm$/.test(row[0]));assert.deepEqual(localHands(b),localHands(a),'all authored wrist/finger/local animation stays exact');
        const localFingers=r=>r.fallback.children.map(h=>[h.userData.fingers.position.toArray(),h.userData.fingers.quaternion.toArray(),h.userData.fingers.parent.position.toArray(),h.userData.fingers.parent.quaternion.toArray()]);assert.deepEqual(localFingers(b),localFingers(a),'fallback local knuckle/finger animation stays exact');
      }
    }
    compare();
    if(i%7===0){const held=b.snapshot(b.scene);a.controller.update(1/60,i/60);b.controller.update(1/60,i/60);const same=(x,y)=>Array.isArray(x)?Array.isArray(y)&&x.length===y.length&&x.every((v,k)=>same(v,y[k])):x===y;assert.ok(same(b.snapshot(b.scene),held),'candidate held-frame pose has exactly equal numeric components;0 and-0 represent the same pose');compare();}
  }
});

test('restoration owns native values after subsequent native mutation',()=>{
  requireCandidate();const r=rig();r.ctx.walk.gspd=3.4;r.ctx.walk.gait=.3;r.native(5);const native=r.snapshot(r.auth);r.controller.update(1/60,1);
  r.nodes(r.auth).forEach(b=>{b.position.set(99,98,97);b.quaternion.identity();});r.controller.restoreNative();assert.deepEqual(r.snapshot(r.auth),native);
});

test('steady update reuses snapshots without vector or quaternion clones',()=>{
  requireCandidate();const r=rig();r.native(6);r.controller.update(1/60,2);let clones=0;
  const vp=T.Vector3.prototype.clone,qp=T.Quaternion.prototype.clone;
  T.Vector3.prototype.clone=function(){clones++;return vp.call(this);};T.Quaternion.prototype.clone=function(){clones++;return qp.call(this);};
  try{for(let i=0;i<20;i++){r.native(7+i);r.controller.update(1/60,3+i/60);}}finally{T.Vector3.prototype.clone=vp;T.Quaternion.prototype.clone=qp;}
  assert.equal(clones,0);
});

test('root replacement at held time never writes detached bones',()=>{
  requireCandidate();const r=rig();r.native(1);r.controller.update(1/60,1);const old=r.replace(),pose=r.snapshot(old);
  for(const b of r.nodes(old)){b.position.copy=()=>assert.fail('stale position');b.quaternion.copy=()=>assert.fail('stale quaternion');}
  r.native(30);r.controller.update(1/60,1);assert.deepEqual(r.snapshot(old),pose);assert.ok(r.auth.getObjectByName('L_arm').getWorldPosition(new T.Vector3()).y<1.5);
});

test('same-root bone subtree replacement invalidates cached references',()=>{
  requireCandidate();const r=rig();r.native(1);r.controller.update(1/60,1);const old=r.auth.getObjectByName('L_arm'),next=r.authored().getObjectByName('L_arm');r.auth.remove(old);r.auth.add(next);const pose=r.snapshot(old);
  for(const b of r.nodes(old)){b.position.copy=()=>assert.fail('stale subtree');b.quaternion.copy=()=>assert.fail('stale subtree');}
  r.native(40);r.controller.update(1/60,1);assert.deepEqual(r.snapshot(old),pose);assert.ok(next.getWorldPosition(new T.Vector3()).y<1.5);
});

test('customization materials and native channels remain current',()=>{
  requireCandidate();const r=rig(),mesh=r.auth.children.find(n=>n.isMesh),material=new T.MeshBasicMaterial({color:0x42aabb});mesh.material=material;
  r.native(55);const expected=r.snapshot(r.auth);r.controller.update(1/60,7);r.controller.restoreNative();assert.equal(mesh.material,material);assert.deepEqual(r.snapshot(r.auth),expected);
});

test('fallback finger replacement at held time invalidates reusable snapshots',()=>{
  requireCandidate();const r=rig();r.auth.visible=false;r.fallback.visible=true;r.native(60);r.controller.update(1/60,8);
  const hand=r.fallback.children[0],old=hand.userData.fingers,parent=old.parent,next=new T.Group();parent.remove(old);parent.add(next);hand.userData.fingers=next;old.position.copy=()=>assert.fail('stale finger');
  r.native(61);r.controller.update(1/60,8);r.controller.restoreNative();assert.equal(r.controller.state.mode,'fallback');
});

test('independent instances share no mutable snapshots or scratch state',()=>{
  requireCandidate();const a=rig(),b=rig();a.native(3);b.native(7);a.controller.update(1/60,1);b.controller.update(1/60,1);const held=b.snapshot(b.scene);
  a.native(40);a.controller.update(1/60,2);a.controller.restoreNative();assert.deepEqual(b.snapshot(b.scene),held);
});

test('dispose and repeated disposal do not dispose borrowed renderer resources',()=>{
  requireCandidate();const r=rig();r.native(4);r.controller.update(1/60,1);let disposed=0;
  r.auth.traverse(n=>{if(n.isMesh){n.geometry.dispose=()=>disposed++;n.material.dispose=()=>disposed++;}});
  r.controller.dispose();r.controller.dispose();const held=r.snapshot(r.scene);r.controller.update(1/60,10);r.controller.restoreNative();
  assert.deepEqual(r.snapshot(r.scene),held);assert.equal(disposed,0);assert.equal(r.controller.state.enabled,false);
});

test('hidden/classic, reduced motion and action handoff preserve native context ownership',()=>{
  requireCandidate();const r=rig();r.ctx.walk=null;r.auth.visible=false;r.fallback.visible=false;r.native(0);const held=r.snapshot(r.scene);r.controller.update(1/60,0);assert.equal(r.controller.state.mode,'hidden');assert.deepEqual(r.snapshot(r.scene),held);
  r.ctx.walk={pos:new T.Vector2(0,16),yaw:.2,pitch:.4,gspd:6,gait:.3,grun:1};r.auth.visible=true;r.ctx.reducedMotion=true;r.native(1);const context=structuredClone(r.ctx);r.controller.update(1/60,1);assert.deepEqual(structuredClone(r.ctx),context);assert.ok(r.snapshot(r.auth).flat(2).filter(x=>typeof x==='number').every(Number.isFinite));
  r.ctx.punch={authoredKind:'harvest'};for(let i=1;i<=60;i++){r.native(i);r.controller.update(1/60,1+i/60);}assert.equal(r.controller.state.rest,0);assert.equal(r.controller.state.action,'harvest');
  r.ctx.punch=null;for(let i=1;i<=60;i++){r.native(i);r.controller.update(1/60,2+i/60);}assert.equal(r.controller.state.rest,1);
});

test('native page installs once, updates after native hands, and precaches its exact import',()=>{
  requireCandidate();const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
  assert.equal((html.match(/import \{installPlayerMotion\} from "\.\/player-motion\.js\?v=1";/g)||[]).length,1);
  assert.equal((html.match(/const playerMotion = installPlayerMotion\(/g)||[]).length,1);
  assert.ok(/updateHands\(dt, t, tk\); playerMotion\.update\(dt, t\); updateDoors\(dt\)/.test(html),'native source contract');
  assert.ok(/getContext:\(\)=>\(\{walk,punch,thirdPerson,reducedMotion:G\.reducedMotion\(\),ground:walk\?workshopWalkY\(walk\.pos\.x,walk\.pos\.y\):0\}\)/.test(html),'native source contract');
  const shell=JSON.parse(sw.match(/const SHELL = (\[[^\]]*\])/)[1]);assert.ok(shell.includes('player-motion.js?v=1'));
  assert.ok(!/__playerMotion|__saPlayerStudy|playablePreview|previews\/player-motion/.test(html),'forbidden native source hook');
});
