import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
import {translateSheepEvidencePose} from './sheep-evidence-placement.mjs';
const foot=l=>l.foot.getWorldPosition(new T.Vector3());
function stage(height,mode){
  const r=createLiveAnimal('sheep',height,0,14);
  for(let n=0;n<24;n++){
    const dz=mode==='idle'?0:-height*(mode==='run'?1.4:.65)/60;
    r.g.position.z+=dz;updateLiveAnimal(r,0,dz,1/60,mode,mode==='run');
  }
  r.g.updateMatrixWorld(true);return r;
}
test('negative control reproduces sheep root-only staging errors',()=>{
  for(const [mode,expected] of [['walk',.312],['run',.672]]){
    const r=stage(1.2,mode);
    try{
      const planted=r.legs.filter(l=>l.planted);assert.ok(planted.length>0);
      for(const l of planted){const f=foot(l);assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<.002);}
      r.g.position.z=14;r.g.updateMatrixWorld(true);
      for(const l of planted){const f=foot(l);assert.ok(Math.abs(Math.hypot(f.x-l.ax,f.z-l.az)-expected)<1e-9);}
    }finally{r.dispose();}
  }
});
test('sheep evidence translation preserves mesh, pose and contacts at both sizes',()=>{
  for(const height of [.9,1.2])for(const mode of ['idle','walk','run']){
    const r=stage(height,mode);
    try{
      const oldRoot=r.g.position.clone(),delta=new T.Vector3(.7-oldRoot.x,0,14-oldRoot.z);
      const before=r.legs.map(l=>({foot:foot(l),ax:l.ax,az:l.az,planted:l.planted}));
      const bones=r.card.skeleton.bones.map(b=>({p:b.position.toArray(),q:b.quaternion.toArray()}));
      const phase=r.state.phase,time=r.state.time;
      const vertex=i=>r.card.getVertexPosition(i,new T.Vector3()).applyMatrix4(r.card.matrixWorld);
      const vertices=Array.from({length:r.card.geometry.attributes.position.count},(_,i)=>vertex(i));
      translateSheepEvidencePose(r,.7,14);
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
