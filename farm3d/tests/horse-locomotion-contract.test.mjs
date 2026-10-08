// Horse R1a: intentionally strict behavior tests for an independently reviewed
// locomotion defect. These must FAIL on the old solver before it is replaced.
// They are not renderer snapshots or source-string checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';

const EPS=1e-6;
function advance(r,vx,vz,dt,mode){
  const dx=vx*dt,dz=vz*dt;
  r.g.position.x+=dx;
  r.g.position.z+=dz;
  updateHorse3D(r,dx,dz,dt,mode);
  r.g.updateMatrixWorld(true);
  return Math.hypot(dx,dz);
}
function feet(r){
  return r.legs.map(l=>l.foot.getWorldPosition(new THREE.Vector3()));
}

test('horse hips remain anatomically attached to the body through walk and canter',()=>{
  let worst=0,frame=-1,leg=-1;
  const r=createHorse3D(2.3);
  try{
    for(let n=0;n<180;n++){
      const running=n>=90,dt=1/60;
      advance(r,0,running?-5:-1.2,dt,running?'run':'walk');
      for(let k=0;k<r.legs.length;k++){
        const l=r.legs[k],err=Math.max(
          Math.abs(l.hip.position.x-l.x),
          Math.abs(l.hip.position.y-(HORSE.hip-HORSE.bodyY)),
          Math.abs(l.hip.position.z-l.z)
        );
        if(err>worst){worst=err;frame=n;leg=k;}
      }
    }
  }finally{r.dispose();}
  assert.ok(worst<EPS,'hip-root drift model-m='+worst+' frame='+frame+' leg='+leg);
});

test('every hoof trajectory remains continuous through gait change, turn and stop',()=>{
  const segments=[
    {name:'walk',frames:60,vx:0,vz:-1.1,mode:'walk'},
    {name:'trot',frames:20,vx:0,vz:-1.2,mode:'run'},
    {name:'canter',frames:45,vx:0,vz:-5,mode:'run'},
    {name:'corner',frames:45,vx:5,vz:0,mode:'run'},
    {name:'stop',frames:60,vx:0,vz:0,mode:'idle'}
  ];
  let worst={excess:-Infinity};
  for(const hz of [30,60]){
    const r=createHorse3D(2.3),dt=1/hz;
    let prev=feet(r),frame=0;
    try{
      for(const seg of segments){
        for(let n=0;n<seg.frames;n++,frame++){
          const distance=advance(r,seg.vx,seg.vz,dt,seg.mode);
          const now=feet(r);
          // A generous discontinuity sentinel: even at slow speed a foot may
          // travel 100 mm in a frame, but must not teleport half a metre.
          const bound=Math.max(.10,2.5*distance+.002);
          for(let k=0;k<4;k++){
            const observed=now[k].distanceTo(prev[k]);
            const excess=observed-bound;
            if(excess>worst.excess)worst={excess,observed,bound,frame,leg:k,hz,segment:seg.name};
          }
          prev=now;
        }
      }
    }finally{r.dispose();}
  }
  assert.ok(worst.excess<=0,'hoof motion discontinuity '+JSON.stringify(worst));
});

test('trot/canter threshold does not chatter under small speed variations',()=>{
  const r=createHorse3D(2.3);
  let changes=0,previous=null;
  try{
    for(let n=0;n<120;n++){
      const speed=n%2===0?1.24:1.26;
      advance(r,0,-speed,1/60,'run');
      if(previous!==null&&r.state.gait!==previous)changes++;
      previous=r.state.gait;
    }
  }finally{r.dispose();}
  assert.ok(changes<=2,'gait chatter: '+changes+' switches across 120 frames');
});
