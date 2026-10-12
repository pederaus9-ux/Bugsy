// Regression for the first stopped frame: clearing a flag cannot hide hoof skating.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
for(const height of [.9,1.2])for(const hz of [30,60,120]){
  test(`sheep grounded planted hooves retain contact on first idle frame h=${height} hz=${hz}`,()=>{
    const r=createLiveAnimal('sheep',height),dt=1/hz;
    try{
      const speed=height*.65;
      for(let n=0;n<hz;n++){
        const dz=-speed*dt;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,dt,'walk',false);
      }
      r.g.updateMatrixWorld(true);
      const previous=r.legs.map(l=>({planted:l.planted,foot:l.foot.getWorldPosition(new T.Vector3()),ax:l.ax,az:l.az}));
      assert.ok(previous.some(p=>p.planted),'warm-up must contain planted contacts');
      updateLiveAnimal(r,0,0,dt,'idle',false);r.g.updateMatrixWorld(true);
      const geom=r.card.geometry;
      for(const [i,l] of r.legs.entries()){
        if(!previous[i].planted)continue;
        const footIndex=r.card.skeleton.bones.indexOf(l.foot);let sole=Infinity;
        for(let v=0;v<geom.attributes.position.count;v++)if(geom.attributes.skinIndex.getX(v)===footIndex){
          const p=r.card.getVertexPosition(v,new T.Vector3()).applyMatrix4(r.card.matrixWorld);sole=Math.min(sole,p.y);
        }
        assert.ok(sole>=-.002,'actual hoof sole cannot penetrate ground');
        // A foot that remains on the ground is a contact even when its flag resets.
        if(sole<=.002){
          const f=l.foot.getWorldPosition(new T.Vector3()),slip=Math.hypot(f.x-previous[i].ax,f.z-previous[i].az);
          assert.ok(slip<=.002,`grounded leg${i} moved${(slip*1000).toFixed(3)}mm from its planted anchor on first idle frame`);
        }
      }
    }finally{r.dispose();}
  });
}
test('sheep stop recovery holds contacts and lands all actual soles across gait phases',()=>{
  for(const height of [.9,1.2])for(const hz of [30,60,120])for(const running of [false,true])for(const warm of [.3,.7,1,1.3]){
    const r=createLiveAnimal('sheep',height),dt=1/hz,speed=height*(running?1.4:.65);
    try{
      for(let n=0;n<Math.round(hz*warm);n++){
        const dz=-speed*dt;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,dt,running?'run':'walk',running);
      }
      r.g.updateMatrixWorld(true);
      const feet=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
      const vertices=r.legs.map(l=>{
        const bone=r.card.skeleton.bones.indexOf(l.foot),indices=[];
        for(let v=0;v<r.card.geometry.attributes.position.count;v++)if(r.card.geometry.attributes.skinIndex.getX(v)===bone)indices.push(v);
        return indices;
      });
      const root=r.g.position.clone(),phase=r.state.phase;
      for(let n=0;n<hz;n++){
        updateLiveAnimal(r,0,0,dt,'idle',false);r.g.updateMatrixWorld(true);
        assert.ok(r.g.position.equals(root),'stopping cannot move gameplay root');assert.equal(r.state.phase,phase,'no fabricated travel');
        for(let i=0;i<4;i++){
          const f=r.legs[i].foot.getWorldPosition(new T.Vector3());
          assert.ok(Math.hypot(f.x-feet[i].x,f.z-feet[i].z)<=.002,'stop cannot skate horizontally');
          if(n%5===0||n===hz-1){
            let sole=Infinity;
            for(const v of vertices[i]){const p=r.card.getVertexPosition(v,new T.Vector3()).applyMatrix4(r.card.matrixWorld);sole=Math.min(sole,p.y);}
            assert.ok(sole>=-.002,'actual sole does not penetrate ground');
            if(n===hz-1)assert.ok(sole<=.002,'all soles have landed after one second');
          }
        }
      }
      const dz=-speed*dt;r.g.position.z+=dz;updateLiveAnimal(r,0,dz,dt,running?'run':'walk',running);
      for(let n=0;n<hz;n++){
        r.g.position.z+=dz;updateLiveAnimal(r,0,dz,dt,running?'run':'walk',running);r.g.updateMatrixWorld(true);
        for(const l of r.legs)if(l.planted){const f=l.foot.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(f.x-l.ax,f.z-l.az)<=.002,'restart preserves planted contacts');}
      }
      assert.ok(r.legs.every(l=>Number.isFinite(l.knee.rotation.x)),'restart is finite');
      const oldPhase=r.state.phase;r.g.position.x+=10;updateLiveAnimal(r,10,0,dt,'walk',false);
      assert.equal(r.state.phase,oldPhase);assert.ok(r.legs.every(l=>!l.planted),'teleport releases previous contacts');
    }finally{r.dispose();}
  }
});
test('sheep stop recovery also preserves contacts after left and right turns',()=>{
  for(const height of [.9,1.2])for(const hz of [30,60,120])for(const side of [-1,1]){
    const r=createLiveAnimal('sheep',height),dt=1/hz,speed=height*.65;
    try{
      for(let n=0;n<hz*2;n++){
        const dx=n<hz?0:side*speed*dt,dz=n<hz?-speed*dt:0;
        r.g.position.x+=dx;r.g.position.z+=dz;updateLiveAnimal(r,dx,dz,dt,'walk',false);
      }
      r.g.updateMatrixWorld(true);const previous=r.legs.map(l=>l.foot.getWorldPosition(new T.Vector3()));
      for(let n=0;n<hz;n++){
        updateLiveAnimal(r,0,0,dt,'idle',false);r.g.updateMatrixWorld(true);
        for(const [i,l] of r.legs.entries()){
          const f=l.foot.getWorldPosition(new T.Vector3());assert.ok(Math.hypot(f.x-previous[i].x,f.z-previous[i].z)<=.002);
          const up=new T.Vector3(0,1,0).applyQuaternion(l.foot.getWorldQuaternion(new T.Quaternion()));assert.ok(up.y>.99999,'stopped hoof stays flat');
        }
      }
      assert.ok(r.legs.every(l=>Number.isFinite(l.knee.rotation.x)));
    }finally{r.dispose();}
  }
});
