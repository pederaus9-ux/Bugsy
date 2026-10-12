import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';
import {resetHorseEvidencePose} from './horse-evidence-placement.mjs';
import {HORSE_MOTION_CLIPS,horseMotionInput} from './horse-motion-evidence.mjs';
test('motion evidence clips exercise actual gaits, transitions, turns, stops and teleport',()=>{
  for(const hz of [30,60,120]){
    const r=createHorse3D(2.3),v=new T.Vector3();
    const geom=r.card.geometry,soleVertices=r.legs.map(l=>{
      const bone=r.card.skeleton.bones.indexOf(l.foot),indices=[];
      const bindY=HORSE.hip-HORSE.upper-HORSE.lower-.07425;
      for(let n=0;n<geom.attributes.position.count;n++)if(
        geom.attributes.skinIndex.getX(n)===bone&&geom.attributes.skinWeight.getX(n)===1&&
        Math.abs(geom.attributes.position.getY(n)-bindY)<1e-6)indices.push(n);
      assert.ok(indices.length,'actual sole vertices found');return indices;
    });
    try{
      for(const clip of HORSE_MOTION_CLIPS){
        resetHorseEvidencePose(r,0,0,14);updateHorse3D(r,0,0,1/hz,'idle');r.g.updateMatrixWorld(true);
        for(let n=0;n<Math.round((clip.warm||0)*hz);n++){
          const speed=clip.name==='deceleration'||clip.name==='hard-stop'?1.8:1;
          r.g.position.z-=speed/hz;updateHorse3D(r,0,-speed/hz,1/hz,speed>1?'run':'walk');
        }
        const gaits=new Set(),start=r.g.position.clone(),previous=r.legs.map(l=>({foot:l.foot.getWorldPosition(new T.Vector3()),x:l.track.plantX,z:l.track.plantZ,mode:l.track.mode}));
        for(let frame=0;frame<Math.round(clip.seconds*hz);frame++){
          const i=horseMotionInput(clip,frame,hz);r.g.position.x+=i.dx;r.g.position.z+=i.dz;
          updateHorse3D(r,i.dx,i.dz,i.dt,i.mode);r.g.updateMatrixWorld(true);gaits.add(r.state.gait);
          for(const [leg,l] of r.legs.entries()){
            l.foot.getWorldPosition(v);
            const prior=previous[leg];
            if(!clip.teleport){
              const bound=Math.max(.10,2.5*Math.hypot(i.dx,i.dz)+.002);
              assert.ok(v.distanceTo(prior.foot)<=bound,clip.name+' actual hoof continuity '+hz+'Hz frame '+frame);
              if(prior.mode==='stance'&&l.track.mode==='stance'&&prior.x===l.track.plantX&&prior.z===l.track.plantZ)
                assert.ok(v.distanceTo(prior.foot)<=.002,clip.name+' actual planted slip');
            }
            prior.foot.copy(v);prior.mode=l.track.mode;prior.x=l.track.plantX;prior.z=l.track.plantZ;
            assert.ok([v.x,v.y,v.z].every(Number.isFinite),clip.name+' finite actual foot');
            assert.ok(v.distanceTo(new T.Vector3(l.track.x,l.track.y,l.track.z))<=.002,
              clip.name+' actual foot differs from target at '+hz+'Hz frame '+frame);
            for(const index of soleVertices[leg]){
              r.card.getVertexPosition(index,v).applyMatrix4(r.card.matrixWorld);
              assert.ok(v.y>=r.g.position.y-.002,clip.name+' actual sole penetration');
              if(l.track.mode==='stance')assert.ok(Math.abs(v.y-r.g.position.y)<=.002,clip.name+' actual planted sole floats');
            }
          }
          if(clip.mode==='walk')assert.ok(r.legs.some(l=>l.track.mode==='stance'),clip.name+' walking requires ground support '+hz+'Hz frame '+frame);
          assert.ok(r.state.bodyDrop<=.15,clip.name+' bounded torso compression '+hz+'Hz frame '+frame+' drop '+r.state.bodyDrop);
        }
        if(['idle','walk','trot','canter'].includes(clip.name))assert.deepEqual([...gaits],[clip.name],clip.name+' actual gait');
        if(clip.name==='acceleration')for(const gait of ['idle','walk','trot','canter'])assert.ok(gaits.has(gait),gait+' acceleration coverage');
        if(clip.name==='deceleration')for(const gait of ['canter','trot','walk','idle'])assert.ok(gaits.has(gait),gait+' deceleration coverage');
        if(clip.name==='hard-stop'){
          assert.equal(r.state.gait,'idle');
          assert.ok(r.state.bodyDrop<.002,'stopped horse recovers full resting height');
          assert.ok(r.legs.every(l=>l.track.mode==='stance'),'recovery steps finish planted');
        }
        if(clip.teleport)assert.ok(Math.abs(r.g.position.x-start.x-3)<1e-6,'real root teleport');
        if(clip.name==='turn-90')assert.ok(Math.abs(r.model.rotation.y-Math.PI/2)<.01,'real ninety-degree turn');
        if(clip.name==='reverse-180')assert.ok(Math.abs(Math.abs(r.model.rotation.y)-Math.PI)<.01,'real reversal');
      }
    }finally{r.dispose();}
  }
});
test('slow reversals preserve actual contact without compensatory crouch',()=>{
  for(const hz of [30,60,120])for(const speed of [.5,1])for(const warm of [.3,1])for(const side of [-1,1]){
    const r=createHorse3D(2.3),actual=new T.Vector3();
    try{
      for(let n=0;n<Math.round(warm*hz);n++){
        r.g.position.z-=speed/hz;updateHorse3D(r,0,-speed/hz,1/hz,'walk');
      }
      for(let n=0;n<hz*3;n++){
        const dx=-Math.sin(side*Math.PI)*speed/hz,dz=speed/hz;
        r.g.position.x+=dx;r.g.position.z+=dz;updateHorse3D(r,dx,dz,1/hz,'walk');r.g.updateMatrixWorld(true);
        const context=JSON.stringify({hz,speed,warm,side,frame:n,drop:r.state.bodyDrop});
        assert.ok(r.state.bodyDrop<=.15,'reverse torso compression '+context);
        assert.ok(r.legs.some(l=>l.track.mode==='stance'),'reverse walking support '+context);
        for(const l of r.legs){
          l.foot.getWorldPosition(actual);
          assert.ok(actual.distanceTo(new T.Vector3(l.track.x,l.track.y,l.track.z))<=.002,'reverse actual contact '+context);
        }
      }
    }finally{r.dispose();}
  }
});
