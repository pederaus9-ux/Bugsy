import * as THREE from './lib/three.module.min.js';
import {createQuadruped,updateQuadruped,CAT} from './quadruped3d.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createCat3D(h=.4,x=0,z=0){return createQuadruped(CAT,h,x,z);}
// Cat-specific recovery; the shared walking solver and geometry stay unchanged.
export function updateCat3D(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const distance=Math.hypot(dx,dz),s=r.state,scale=r.model.scale.x,c=r.spec;
  if(distance>0){
    if(distance>1.5){s.catStop=null;s.catResume=null;}
    else{
      if(s.catStop){
        r.g.updateMatrixWorld(true);
        const resume=r.catResumeCache||={elapsed:0,point:new THREE.Vector3(),legs:r.legs.map(()=>({}))};
        resume.elapsed=0;
        const cycle=c.stride*(mode==='run'?1.35:1)*scale/Math.max(distance/dt,.4*scale*.65);
        resume.duration=Math.min(.15,cycle*(mode==='run'?.55:.45));
        for(let i=0;i<r.legs.length;i++){
          const p=r.legs[i].foot.getWorldPosition(resume.point),target=resume.legs[i];
          // Caller already advanced the root; recover the preceding world pose.
          target.x=p.x-dx;target.y=p.y;target.z=p.z-dz;
        }
        s.catResume=resume;
      }
      s.catStop=null;s.lastCatSpeed=distance/dt;s.lastCatMode=mode;
    }
  }else if(s.amount>0&&!s.catStop){
    // Retain actual world contacts instead of snapping all feet to neutral.
    r.g.updateMatrixWorld(true);
    const ground=r.g.position.y+c.hoof*scale;
    const cycle=c.stride*(s.lastCatMode==='run'?1.35:1)*scale/Math.max(s.lastCatSpeed||0,.4*scale*.65);
    const stop=r.catStopCache||={elapsed:0,point:new THREE.Vector3(),legs:r.legs.map(()=>({}))};
    stop.elapsed=0;
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],p=l.foot.getWorldPosition(stop.point),target=stop.legs[i];
      target.x=p.x;target.z=p.z;target.y=Math.max(ground,p.y);
      target.duration=Math.max(dt,(1-(s.phase+l.phase)%1)*cycle);target.yaw=l.planted?l.ayaw:r.model.rotation.y;
    }
    s.catStop=stop;s.catResume=null;
  }
  updateQuadruped(r,dx,dz,dt,mode);
  if(s.catStop){
    const stop=s.catStop;stop.elapsed+=dt;
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i],target=stop.legs[i],u=Math.min(1,stop.elapsed/target.duration),blend=smooth(u);
      const ground=r.g.position.y+c.hoof*scale,y=target.y+(ground-target.y)*blend;
      poseCatWorldTarget(r,l,target.x,y,target.z,target.yaw);
      l.planted=y-ground<1e-8;l.ax=target.x;l.az=target.z;l.ayaw=target.yaw;
    }
  }else if(s.catResume){
    const resume=s.catResume;resume.elapsed+=dt;
    const u=Math.min(1,resume.elapsed/resume.duration);
    if(u===1){s.catResume=null;return;}
    const blend=smooth(u);r.g.updateMatrixWorld(true);
    for(let i=0;i<r.legs.length;i++){
      const l=r.legs[i];if(l.planted)continue; // Established contacts remain fixed.
      const from=resume.legs[i],to=l.foot.getWorldPosition(resume.point);
      poseCatWorldTarget(r,l,from.x+(to.x-from.x)*blend,from.y+(to.y-from.y)*blend,from.z+(to.z-from.z)*blend,r.model.rotation.y);
    }
  }
}
const smooth=u=>u*u*u*(10+u*(-15+6*u));
function poseCatWorldTarget(r,l,x,yWorld,z,footYaw){
  const scale=r.model.scale.x,c=r.spec,yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw);
  const ground=r.g.position.y+c.hoof*scale,lift=(yWorld-ground)/scale;
  const wx=(x-r.g.position.x)/scale,wz=(z-r.g.position.z)/scale,tx=wx*cos-wz*sin-l.x,tz=wx*sin+wz*cos-l.z;
  // Identical adaptive root height, reach margin and joint solve to shared gait.
  const rootY=Math.min(c.hip,c.hoof+lift+Math.sqrt(Math.max(0,(c.upper+c.lower-.001)**2-tx*tx-tz*tz)));
  l.hip.position.y=rootY-c.bodyY;
  const y=rootY-c.hoof-lift,dist=Math.min(c.upper+c.lower-.001,Math.hypot(tx,tz,y));
  let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
  const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi),alpha=Math.atan2(horizontal,y);
  const delta=Math.acos(clamp((c.upper*c.upper+dist*dist-c.lower*c.lower)/(2*c.upper*dist),-1,1));
  const bend=Math.acos(clamp((dist*dist-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,phi,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;
  l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();
  l.foot.quaternion.multiply(r.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,footYaw-yaw));
}
