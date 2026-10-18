import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {installPlayerMotion} from '../player-motion.js';
import {fallbackFixture,handChannels} from './fixtures/native-player-hands.mjs';
const evidence=[];
function pair(){const native=fallbackFixture(),overlay=fallbackFixture(installPlayerMotion);for(let i=0;i<30;i++){native.step(i);overlay.step(i);}return {native,overlay};}
function compareAction(kind,mutate){
  const {native,overlay}=pair();mutate?.(native,overlay);
  for(const f of [native,overlay])f.ctx.punch={kind,authoredKind:kind==='pat'?'pet':'harvest',t:0};
  let first,active;
  for(let i=30;i<120;i++){
    // Vary current native bob/sway to catch restoration after animation evaluation.
    for(const f of [native,overlay]){f.ctx.walk.bob=Math.sin(i*.13)*.02;f.ctx.walk.walked=i*.1;f.ctx.walk.vel.set(1,2);}
    const a=native.step(i),b=overlay.step(i);
    const record={kind,frame:i,native:a.beforeOverlay,overlayThenNative:b.beforeOverlay};
    if(!first){first=record;evidence.push({scenario:'first action frame',...record});}
    for(const channels of [a.beforeOverlay,b.beforeOverlay])for(const h of channels)for(const value of Object.values(h).flat())if(typeof value==='number')assert.ok(Number.isFinite(value),'finite native channels');
    assert.deepEqual(b.beforeOverlay,a.beforeOverlay,kind+' native channels must not inherit the preceding overlay');
    if(i===42)active=record;
    if(i===100)evidence.push({scenario:'returned native idle',...record});
  }
  // Native action, not a forced rest pose: active reach/pat and current motion survive.
  const hand=active.native.find(h=>h.side===1);
  assert.equal(hand.rotation[1],-.3);assert.equal(hand.rotation[2],.2);assert.equal(hand.knuckleRotation[0],1.05);
  assert.notEqual(hand.position[1],-.19);
  if(kind==='pat'){assert.ok(hand.rotation[0]<-.2);assert.equal(hand.fingerRotation[0],0);}
  else{assert.equal(hand.rotation[0],-.2);assert.ok(hand.fingerRotation[0]>0);}
  assert.equal(overlay.ctx.punch,null);assert.equal(overlay.motion.state.rest,1);
  return {native,overlay};
}
test('real native fallback idle-to-reach and return preserve every native pose channel',()=>{compareAction('reach');});
test('real native fallback idle-to-pat and return preserve every native pose channel',()=>{compareAction('pat');});
test('fallback finger replacement does not retain prior overlay rotation or stale writes',()=>{
  compareAction('reach',(native,overlay)=>{
    for(const f of [native,overlay])for(const hand of f.hands.children){
      const old=hand.userData.fingers,parent=old.parent,next=old.clone(true);parent.remove(old);parent.add(next);hand.userData.fingers=next;
      old.position.copy=()=>assert.fail('detached finger position write');old.quaternion.copy=()=>assert.fail('detached finger quaternion write');
    }
  });
});
test('hidden-to-fallback, disable and disposal preserve fresh native action evaluation',()=>{
  for(const transition of ['hidden','disable','dispose']){
    compareAction('pat',(native,overlay)=>{
      if(transition==='hidden')for(const f of [native,overlay]){const walk=f.ctx.walk;f.ctx.walk=null;f.step(30);f.ctx.walk=walk;}
      if(transition==='disable')overlay.motion.setEnabled(false);
      if(transition==='dispose'){let disposed=0;overlay.hands.traverse(o=>{if(o.isMesh){o.geometry.dispose=()=>disposed++;o.material.dispose=()=>disposed++;}});overlay.motion.dispose();overlay.motion.dispose();assert.equal(disposed,0);}
      evidence.push({scenario:transition,native:handChannels(native.hands),overlay:handChannels(overlay.hands)});
    });
  }
});
test.after(()=>{
  if(!process.env.TEST_ARTIFACTS)return;mkdirSync(process.env.TEST_ARTIFACTS,{recursive:true});
  writeFileSync(path.join(process.env.TEST_ARTIFACTS,'native-fallback-channels.json'),JSON.stringify(evidence,(k,v)=>Object.is(v,-0)?{float64:'negative-zero'}:v,2)+'\n');
});
