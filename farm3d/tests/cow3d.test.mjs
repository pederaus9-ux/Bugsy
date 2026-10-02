import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createCow3D,updateCow3D,poseCowLeg,COW_GAIT} from '../cow3d.js';
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);
test('actual joints reach hoof targets and keep hooves level in three dimensions',()=>{
  const r=createCow3D(1.8),l=r.legs[0],p=new THREE.Vector3(),q=new THREE.Quaternion(),up=new THREE.Vector3();
  for(const [x,z,lift]of [[0,0,0],[.08,-.22,0],[-.08,.22,.09],[.1,0,0]]){
    l.planted=false;poseCowLeg(l,x,z,lift,r);r.g.updateMatrixWorld(true);l.foot.getWorldPosition(p);
    near(p.x,l.x+x,.02);near(p.z,l.z+z,.02);assert.ok(p.y>=COW_GAIT.hoof-.006);
    l.foot.getWorldQuaternion(q);up.set(0,1,0).applyQuaternion(q);near(up.y,1);
  }
  r.dispose();
});
test('planted feet stay in place through real travel; stationary phase freezes and settles',()=>{
  for(const speed of [.2,.8,2.6]){
    const r=createCow3D(1.8),points=r.legs.map(()=>new THREE.Vector3());let plantedFrames=0;
    for(let i=0;i<360;i++){
      const was=r.legs.map(l=>l.planted);r.g.updateMatrixWorld(true);r.legs.forEach((l,j)=>l.foot.getWorldPosition(points[j]));
      r.g.position.z-=speed/60;updateCow3D(r,0,-speed/60,1/60,i/60);r.g.updateMatrixWorld(true);
      for(const [j,l]of r.legs.entries()){
        const now=l.foot.getWorldPosition(new THREE.Vector3());assert.ok(now.y>=COW_GAIT.hoof-.006,'hoof stays above floor');
        if(i>120&&l.planted&&was[j]&&r.state.amount>.9999){assert.ok(now.distanceTo(points[j])<.018,'planted hoof slips');plantedFrames++;}
      }
    }
    assert.ok(plantedFrames>20);near(r.state.distance,speed*6);
    const phase=r.state.phase;
    for(let i=0;i<180;i++)updateCow3D(r,0,0,1/60,6+i/60);
    near(r.state.phase,phase);assert.ok(r.state.amount<1e-10);r.g.updateMatrixWorld(true);
    for(const l of r.legs)near(l.foot.getWorldPosition(new THREE.Vector3()).y,COW_GAIT.hoof,1e-3);
    r.dispose();
  }
});
test('head turns, independent ears flick, blinking/tail move; sleeping is quieter',()=>{
  const r=createCow3D(),other=createCow3D(1.7,0,0,'Daisy');let headMin=0,headMax=0,earMax=0,independent=false,blink=false,tail=false;
  for(let i=0;i<1200;i++){
    updateCow3D(r,0,0,1/60,i/60);const yaw=r.neck.rotation.y+r.head.rotation.y;
    headMin=Math.min(headMin,yaw);headMax=Math.max(headMax,yaw);earMax=Math.max(earMax,Math.abs(r.ears[0].rotation.z),Math.abs(r.ears[1].rotation.z));
    independent ||= Math.abs(r.ears[0].rotation.z)>Math.abs(r.ears[1].rotation.z)*2;
    blink ||= r.eyes[0].scale.y<.3;tail ||= Math.abs(r.tail[1].rotation.z)>.1;
  }
  assert.ok(headMin<-.1&&headMax>.1);assert.ok(earMax>.2);assert.ok(independent&&blink&&tail);
  for(let i=0;i<180;i++)updateCow3D(r,0,0,1/60,20+i/60,'sleeping');assert.ok(r.eyes[0].scale.y<.2);assert.ok(Math.abs(r.state.look)<.08);
  assert.notEqual(r.state.seed,other.state.seed);r.dispose();other.dispose();
});
test('skin geometry is shared, animation belongs to each cow, and teleport is not a stride',()=>{
  const a=createCow3D(),b=createCow3D();assert.equal(a.card.geometry,b.card.geometry);assert.equal(a.card.material,b.card.material);assert.notEqual(a.card.skeleton,b.card.skeleton);
  assert.ok(a.card.isSkinnedMesh);assert.equal(a.card.skeleton.bones.length,24);
  const phase=a.state.phase;updateCow3D(a,10,10,1/60,0);near(a.state.phase,phase);near(a.state.distance,0);near(b.state.time,1/60);
  a.dispose();a.dispose();b.dispose();
});
test('planted hoof drift stays small at walk and run, then returns to neutral',()=>{
  const slip=(speed)=>{
    const r=createCow3D(1.8);let worst=0;
    for(let i=0;i<360;i++){
      const was=r.legs.map(l=>l.planted),points=r.legs.map(l=>l.foot.getWorldPosition(new THREE.Vector3()));
      r.g.position.z-=speed/60;updateCow3D(r,0,-speed/60,1/60,i/60);r.g.updateMatrixWorld(true);
      r.legs.forEach((l,j)=>{const now=l.foot.getWorldPosition(new THREE.Vector3());
        if(i>120&&l.planted&&was[j]&&r.state.amount>.999)worst=Math.max(worst,now.distanceTo(points[j]));
        assert.ok(Number.isFinite(l.knee.rotation.x)&&Number.isFinite(l.foot.rotation.x));
      });
    }
    for(let i=0;i<90;i++)updateCow3D(r,0,0,1/60,20+i/60);
    r.g.updateMatrixWorld(true);
    for(const l of r.legs){assert.equal(l.hip.parent,r.body);assert.ok(Math.abs(l.hip.getWorldPosition(new THREE.Vector3()).y-COW_GAIT.hip)<.003);}
    r.dispose();return worst;
  };
  const walk=slip(.8),run=slip(2.6);
  assert.ok(walk<.001,`walk slip ${walk}`);assert.ok(run<.002,`run slip ${run}`);
});
test('hips stay parented to the body and do not drop during a full stride',()=>{
  const r=createCow3D(1.8);
  for(const l of r.legs){assert.equal(l.hip.parent,r.body);assert.ok(Math.abs(l.hip.position.y-(COW_GAIT.hip-1.03))<.003);}
  for(let i=0;i<180;i++){r.g.position.z-=.8/60;updateCow3D(r,0,-.8/60,1/60,i/60);}
  r.g.updateMatrixWorld(true);
  const body=new THREE.Vector3(),hip=new THREE.Vector3();
  r.body.getWorldPosition(body);
  for(const l of r.legs){
    assert.ok(Number.isFinite(l.knee.rotation.x));
    l.hip.getWorldPosition(hip);
    assert.ok(Math.abs(hip.y-COW_GAIT.hip)<.08,'hip reach stays covered by the haunch');
    assert.ok(hip.y>body.y-.42,'haunch hip stays inside the torso lower volume');
  }
  r.dispose();
});
test('equal travel at 30/60/120 Hz gives equal idle/walk cadence and finite turns',()=>{
  const runs=[30,60,120].map(hz=>{const r=createCow3D();for(let i=0;i<hz*2;i++){r.g.position.z-=.8/hz;updateCow3D(r,0,-.8/hz,1/hz,i/hz);}return r;});
  for(const r of runs){near(r.state.distance,1.6);near(r.state.phase,runs[0].state.phase);assert.ok(Number.isFinite(r.model.rotation.y));for(const l of r.legs)assert.ok(Number.isFinite(l.knee.rotation.x));r.dispose();}
});
