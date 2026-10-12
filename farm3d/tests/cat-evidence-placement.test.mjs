import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
import {resetCatEvidencePose,translateCatEvidencePose} from './cat-evidence-placement.mjs';
const foot=l=>l.foot.getWorldPosition(new T.Vector3());
test('active cat restart cache follows staging translation',()=>{
  const a=createLiveAnimal('cat',.85),b=createLiveAnimal('cat',.85);
  try{
    for(const r of [a,b]){
      for(let n=0;n<60;n++){r.g.position.z-=.9/60;updateLiveAnimal(r,0,-.9/60,1/60,'walk');}
      for(let n=0;n<60;n++)updateLiveAnimal(r,0,0,1/60,'idle');
      r.g.position.z-=.9/60;updateLiveAnimal(r,0,-.9/60,1/60,'walk');
      assert.ok(r.state.catResume,'restart cache must be active');
    }
    const delta=new T.Vector3(3,0,7);
    translateCatEvidencePose(a,a.g.position.x+3,a.g.position.z+7);
    for(let n=0;n<12;n++){
      for(const r of [a,b]){r.g.position.z-=.9/60;updateLiveAnimal(r,0,-.9/60,1/60,'walk');r.g.updateMatrixWorld(true);}
      for(let i=0;i<4;i++)assert.ok(foot(a.legs[i]).distanceTo(foot(b.legs[i]).add(delta))<1e-8,'translated restart matches uninterrupted rig');
    }
  }finally{a.dispose();b.dispose();}
});
function stage(height,mode,frames=24){
  const r=createLiveAnimal('cat',height,0,14);
  for(let n=0;n<frames;n++){
    const dz=mode==='idle'?0:-height*(mode==='run'?1.4:.65)/60;
    r.g.position.z+=dz;updateLiveAnimal(r,0,dz,1/60,mode,mode==='run');
  }
  r.g.updateMatrixWorld(true);return r;
}
test('negative control reproduces cat root-only staging errors',()=>{
  for(const mode of ['walk','run']){
    // Run frame24 is airborne; frame23 provides actual planted contacts.
    const r=stage(.85,mode,mode==='run'?23:24),expected=14-r.g.position.z;
    try{
      const planted=r.legs.filter(l=>l.planted);assert.ok(planted.length>0);
      for(const l of planted){const f=foot(l);assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<.002);}
      r.g.position.z=14;r.g.updateMatrixWorld(true);
      for(const l of planted){const f=foot(l);assert.ok(Math.abs(Math.hypot(f.x-l.ax,f.z-l.az)-expected)<1e-9);}
    }finally{r.dispose();}
  }
});
function stoppedAwayFromStage(height){
  const r=createLiveAnimal('cat',height,6,-2);
  for(let n=0;n<60;n++){
    const dz=-height*.65/60;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,1/60,'walk',false);
  }
  updateLiveAnimal(r,0,0,1/60,'idle',false);
  assert.ok(r.state.catStop,'reproduction must have an active recovery');return r;
}
test('negative control reproduces stale recovery targets during neutral stage reset',()=>{
  const r=stoppedAwayFromStage(.85);
  try{
    r.g.position.set(0,0,14);r.model.rotation.set(0,0,0);r.state.phase=0;for(const l of r.legs)l.planted=false;
    for(let n=0;n<24;n++)updateLiveAnimal(r,0,0,1/60,'idle',false);
    translateCatEvidencePose(r,0,14);
    assert.ok(r.legs.some(l=>l.planted&&Math.hypot(foot(l).x-l.ax,foot(l).z-l.az)>.002),'old setup leaves contacts inconsistent');
  }finally{r.dispose();}
});
test('neutral cat stage reset clears previous recovery at both sizes',()=>{
  for(const height of [.4,.85]){
    const r=stoppedAwayFromStage(height),reference=createLiveAnimal('cat',height,0,14);
    try{
      resetCatEvidencePose(r,0,14);
      assert.equal(r.state.catStop,null);assert.equal(r.state.amount,0);assert.equal(r.state.phase,0);
      for(let n=0;n<24;n++)updateLiveAnimal(r,0,0,1/60,'idle',false);
      r.g.updateMatrixWorld(true);reference.g.updateMatrixWorld(true);
      for(let i=0;i<4;i++)assert.ok(foot(r.legs[i]).distanceTo(foot(reference.legs[i]))<1e-9,'neutral feet match a fresh rig');
      for(let n=0;n<24;n++){
        const dz=-height*.65/60;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,1/60,'walk',false);
      }
      translateCatEvidencePose(r,0,14);
      for(const l of r.legs)if(l.planted){const f=foot(l);assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<=.002);}
    }finally{r.dispose();reference.dispose();}
  }
});
test('stopping cat contacts remain translated on subsequent idle updates',()=>{
  for(const height of [.4,.85]){
    const r=stage(height,'walk');
    try{
      updateLiveAnimal(r,0,0,1/60,'idle',false);r.g.updateMatrixWorld(true);
      const before=r.legs.map(l=>foot(l)),oldRoot=r.g.position.clone(),delta=new T.Vector3(1-oldRoot.x,0,15-oldRoot.z);
      translateCatEvidencePose(r,1,15);
      for(let n=0;n<60;n++)updateLiveAnimal(r,0,0,1/60,'idle',false);
      r.g.updateMatrixWorld(true);
      for(const [i,l] of r.legs.entries()){
        const f=foot(l),expected=before[i].clone().add(delta);
        assert.ok(Math.hypot(f.x-expected.x,f.z-expected.z)<=.002,'stop cache follows test placement');
        assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<=.002,'landed contact matches translated anchor');
      }
    }finally{r.dispose();}
  }
});
test('cat evidence translation preserves mesh, pose and contacts at both sizes',()=>{
  for(const height of [.4,.85])for(const mode of ['idle','walk','run']){
    const r=stage(height,mode);
    try{
      const oldRoot=r.g.position.clone(),delta=new T.Vector3(.7-oldRoot.x,0,14-oldRoot.z);
      const before=r.legs.map(l=>({foot:foot(l),ax:l.ax,az:l.az,planted:l.planted}));
      const bones=r.card.skeleton.bones.map(b=>({p:b.position.toArray(),q:b.quaternion.toArray()}));
      const phase=r.state.phase,time=r.state.time;
      const vertex=i=>r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld);
      const vertices=Array.from({length:r.card.geometry.attributes.position.count},(_,i)=>vertex(i));
      translateCatEvidencePose(r,.7,14);
      assert.equal(r.state.phase,phase);assert.equal(r.state.time,time);
      r.card.skeleton.bones.forEach((b,i)=>{assert.deepEqual(b.position.toArray(),bones[i].p);assert.deepEqual(b.quaternion.toArray(),bones[i].q);});
      r.legs.forEach((l,i)=>{
        assert.equal(l.planted,before[i].planted);
        assert.ok(foot(l).distanceTo(before[i].foot.clone().add(delta))<1e-9);
        if(l.planted){const f=foot(l);assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<=.002);}
      });
      vertices.forEach((v,i)=>assert.ok(vertex(i).distanceTo(v.add(delta))<1e-8,'actual skinned vertex translated consistently'));
      if(mode!=='idle'){
        const dz=-height*(mode==='run'?1.4:.65)/60;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,1/60,mode,mode==='run');r.g.updateMatrixWorld(true);
        for(const l of r.legs)if(l.planted){const f=foot(l);assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<=.002);}
      }
    }finally{r.dispose();}
  }
});
