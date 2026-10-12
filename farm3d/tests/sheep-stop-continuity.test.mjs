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
