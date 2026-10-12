// Horse contact/reach scenario matrix and per-frame measurement of the ACTUAL
// rig: bone transforms, skinned hoof soles and hoof-track targets. Shared by
// horse-contact-feasibility.test.mjs and offline diagnostics. Test-only.
import * as THREE from '../lib/three.module.min.js';
import {createHorse3D,updateHorse3D,HORSE} from '../horse3d.js';

const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const face=new THREE.Color(HORSE.face);

// Segment velocity: constant {vx,vz}, or a circle {speed,yawRate,a0}, or a
// linear speed ramp {from,to,dir:[x,z]}. Heading follows the velocity.
function velocityAt(seg,t){
  if(seg.fn)return seg.fn(t);
  if(seg.yawRate!==undefined){const a=seg.a0+seg.yawRate*t;return [Math.sin(a)*seg.speed,-Math.cos(a)*seg.speed];}
  if(seg.from!==undefined){const v=seg.from+(seg.to-seg.from)*Math.min(1,t/seg.t);return [seg.dir[0]*v,seg.dir[1]*v];}
  return [seg.vx||0,seg.vz||0];
}
const run=(name,segs,extra={})=>({name,segs,...extra});
// Turns change the root velocity instantly (as gameplay may); the heading
// check runs at the end of the turned segment.
const turn=(speed,mode,side)=>[{t:1.2,vx:0,vz:-speed,mode},{t:mode==='walk'?4:3,vx:side*speed,vz:0,mode,heading:true}];
const warm=(q)=>q?[{t:q*HORSE.stride*1.2432/1.0/4,vx:0,vz:-1.0,mode:'walk'}]:[];

export function scenarios(){
  const S=[];
  for(const q of [0,1,2,3]){
    const w=warm(q),tag=q?' warm'+q+'/4':'';
    S.push(run('idle'+tag,[...w,{t:2.5,mode:'idle',stop:!!q}]));
    for(const v of [.5,1.0,1.5])S.push(run('walk '+v+tag,[...w,{t:3,vx:0,vz:-v,mode:'walk'}]));
    for(const v of [1.2,2.5])S.push(run('trot '+v+tag,[...w,{t:3,vx:0,vz:-v,mode:'run'}]));
    for(const v of [1.8,5])S.push(run('canter '+v+tag,[...w,{t:3,vx:0,vz:-v,mode:'run'}]));
    S.push(run('accelerate 0-5'+tag,[...w,{t:1.5,from:0,to:5,dir:[0,-1],mode:'run'},{t:1,vx:0,vz:-5,mode:'run'}]));
    S.push(run('decelerate 5-0'+tag,[...w,{t:1,vx:0,vz:-5,mode:'run'},{t:1.5,from:5,to:.02,dir:[0,-1],mode:'run'},{t:2.5,mode:'idle',stop:true}]));
    S.push(run('hard stop canter 1.8'+tag,[...w,{t:1,vx:0,vz:-1.8,mode:'run'},{t:3,mode:'idle',stop:true}]));
    S.push(run('hard stop walk 1.2'+tag,[...w,{t:1,vx:0,vz:-1.2,mode:'walk'},{t:3,mode:'idle',stop:true}]));
    // The game's steering stops the root while still requesting 'walk'.
    S.push(run('stop in walk mode from canter 1.8'+tag,[...w,{t:1,vx:0,vz:-1.8,mode:'run'},{t:3,vx:0,vz:0,mode:'walk',stop:true}]));
    S.push(run('stop in walk mode from walk 1.2'+tag,[...w,{t:1,vx:0,vz:-1.2,mode:'walk'},{t:3,vx:0,vz:0,mode:'walk',stop:true}]));
    // Eased steering (the farm's 4/s) coasting to rest after an idle request.
    S.push({...run('coast to stop from canter 4.5'+tag,[...w,{t:1.5,vx:0,vz:-4.5,mode:'run'},{t:3,mode:'idle',stop:true}]),smooth:4});
    for(const side of [1,-1]){
      S.push(run('turn90 walk 1 '+(side>0?'right':'left')+tag,[...w,...turn(1,'walk',side)]));
      S.push(run('turn90 canter 5 '+(side>0?'right':'left')+tag,[...w,...turn(5,'run',side)]));
      // Tight circle: radius 2 m (about one body length at h 2.3) at 1 m/s.
      S.push(run('circle r2 walk 1 '+(side>0?'cw':'ccw')+tag,[...w,{t:6,speed:1,yawRate:side/2,a0:0,mode:'walk'}]));
    }
    S.push(run('reverse180 walk 1'+tag,[...w,{t:1.2,vx:0,vz:-1,mode:'walk'},{t:7.5,vx:0,vz:1,mode:'walk',heading:true}]));
    S.push(run('reverse180 walk .5 after .3s'+tag,[...w,{t:.3,vx:0,vz:-.5,mode:'walk'},{t:4.5,vx:0,vz:.5,mode:'walk',heading:true}]));
    S.push(run('gait chain'+tag,[...w,{t:1.5,vx:0,vz:-1.2,mode:'walk'},{t:1.5,vx:0,vz:-1.2,mode:'run'},{t:1.5,vx:0,vz:-4,mode:'run'},{t:1.5,vx:0,vz:-1.2,mode:'run'},{t:1.5,vx:0,vz:-1.2,mode:'walk'},{t:2.5,mode:'idle',stop:true}]));
    S.push(run('existing continuity sequence'+tag,[...w,{t:1,vx:0,vz:-1.1,mode:'walk'},{t:1/3,vx:0,vz:-1.2,mode:'run'},{t:.75,vx:0,vz:-5,mode:'run'},{t:.75,vx:5,vz:0,mode:'run'},{t:2.5,mode:'idle',stop:true}]));
    S.push(run('teleport and continue'+tag,[...w,{t:1,vx:0,vz:-1.2,mode:'walk'},{t:1/60,teleport:[4,0,-4],mode:'walk'},{t:1.5,vx:0,vz:-1.2,mode:'walk'},{t:2.5,mode:'idle',stop:true}]));
  }
  return S;
}

// Game-faithful roaming (the farm Beast's steering): velocity eased at 4/s
// toward the wanted velocity and decaying at 6/s while idling, mode 'walk'
// or 'run' only, walk 1.2 / run 5 m/s, a 12 x 16 m paddock whose fences
// clamp position and drop the blocked velocity component. Seeded.
export function roaming(seed,seconds=20){
  let s=seed>>>0||1;const R=()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
  const h=.001,box=[-6,6,-8,8];let x=0,z=0,vx=0,vz=0,t=0,state='idle',until=1+R()*2,tx=0,tz=0,mode='walk',dirx=0,dirz=0;
  const vel=[],modes=[];
  while(t<seconds){
    if(t>=until||state==='walk'&&Math.hypot(tx-x,tz-z)<.5){
      const r=R();
      if(r<.35){state='idle';until=t+.5+R()*3;mode='walk';}
      else if(r<.85){state='walk';tx=box[0]+R()*(box[1]-box[0]);tz=box[2]+R()*(box[3]-box[2]);until=t+8;mode='walk';}
      else{state='run';const a=R()*Math.PI*2;dirx=Math.sin(a);dirz=-Math.cos(a);until=t+1+R()*1.5;mode='run';}
    }
    let wx=0,wz=0;
    if(state==='walk'){const d=Math.hypot(tx-x,tz-z)||1;wx=(tx-x)/d*1.2;wz=(tz-z)/d*1.2;}
    if(state==='run'){wx=dirx*5;wz=dirz*5;}
    if(state==='idle'){const k=Math.max(0,1-h*6);vx*=k;vz*=k;}
    else{const k=Math.min(1,h*4);vx+=(wx-vx)*k;vz+=(wz-vz)*k;}
    let nx=x+vx*h,nz=z+vz*h;
    if(nx<box[0]||nx>box[1]){nx=Math.min(box[1],Math.max(box[0],nx));vx=0;if(state==='run')dirx=-dirx;}
    if(nz<box[2]||nz>box[3]){nz=Math.min(box[3],Math.max(box[2],nz));vz=0;if(state==='run')dirz=-dirz;}
    vel.push([(nx-x)/h,(nz-z)/h]);modes.push(mode);x=nx;z=nz;t+=h;
  }
  const segs=[];let i0=0;
  for(let i=1;i<=modes.length;i++)if(i===modes.length||modes[i]!==modes[i0]){
    const a=i0,b=i;segs.push({t:(b-a)*h,mode:modes[a],fn:el=>vel[Math.min(b-1,a+Math.floor(el/h))]});i0=i;}
  segs.push({t:2.5,mode:'walk',vx:0,vz:0,stop:true});
  return {name:'roaming#'+seed,segs};
}

function hoofVertices(r){
  const g=r.card.geometry,c=g.attributes.color,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=r.card.skeleton.bones;
  return r.legs.map(l=>{const b=bones.indexOf(l.foot),out=[];
    for(let i=0;i<si.count;i++)if(si.getX(i)===b&&sw.getX(i)>1-1e-6&&Math.abs(c.getX(i)-face.r)<1e-5&&Math.abs(c.getY(i)-face.g)<1e-5&&Math.abs(c.getZ(i)-face.b)<1e-5)out.push(i);
    return out;});
}

// Runs one scenario at one rate and returns worst-case measurements. With
// jitter > 0 every frame is randomly shorter than 1/hz by up to that fraction
// (seeded), as a real frame clock is; frames are never longer than 1/hz.
// A segment in which the root does not move, whatever mode the caller reports.
const atRest=seg=>seg.mode==='idle'||seg.vx===0&&seg.vz===0&&seg.speed===undefined&&seg.from===undefined&&!seg.fn&&!seg.teleport;
export function measure(sc,hz,height=2.3,jitter=0,seed=1,onFrame=null){
  const r=createHorse3D(height),base=1/hz,scale=r.model.scale.x,L=(HORSE.upper+HORSE.lower)*scale;
  let rs=seed>>>0||1,dt=base;const rand=()=>(rs=(Math.imul(rs,1664525)+1013904223)>>>0)/4294967296;
  const hooves=hoofVertices(r),p=r.card.geometry.attributes.position,v=new THREE.Vector3();
  const M={scenario:sc.name,hz,height,frames:0,worstTargetMM:0,worstTargetAt:null,worstReach:0,worstSlipMM:0,worstPlantedSoleMM:0,minSoleMM:Infinity,
    worstContinuityExcess:-Infinity,minStance:4,minStanceWalkIdle:4,minStanceCallerWalk:4,minStanceIdle:4,longestTransitionS:0,longestAirborneS:0,worstAirborneExcess:-Infinity,maxDrop:0,longestSwingS:0,hipDrift:0,finalSwings:null,
    emergency:0,unverified:0,hurried:0,settledFloatMM:null,settleTimeS:null,restDrop:null,headingErrorDeg:0,headingTimeS:0,gaits:new Set()};
  const prevFoot=r.legs.map(l=>l.foot.getWorldPosition(new THREE.Vector3()));
  const prevPlant=r.legs.map(()=>null),swingStart=r.legs.map(()=>null);
  // Hooves already swinging when the gait changes (e.g. airborne canter hooves
  // at a hard stop) are held to the PREVIOUS gait's support rule until they
  // land; the length of that hand-over is reported separately.
  const inherited=r.legs.map(()=>null);
  // Hooves airborne when the caller stops running keep the run's allowance
  // until they land; otherwise a walking or idle caller never sees all four up.
  const fromRun=r.legs.map(()=>false);let lastMode=null;
  let airborne=0,stopFrame=null,stopTime=0,time=0,segStart=0,headingLate=0;const sv=[0,0];
  try{
    for(const seg of sc.segs){
      const n=Math.max(1,Math.round(seg.t*hz));
      segStart=time;headingLate=0;
      for(let f=0,el=0;jitter?el<seg.t-1e-9:f<n;f++,el+=dt,time+=dt){
        dt=jitter?base*(1-jitter*rand()):base;
        const last=jitter?el+dt>=seg.t-1e-9:f===n-1;
        let dx,dz,dist;
        if(seg.teleport&&f===0){dx=seg.teleport[0];dz=seg.teleport[2];}
        else{
          let [vx,vz]=seg.mode==='idle'?[0,0]:velocityAt(seg,el);
          // Optional game-like steering: velocity eases toward the command at
          // sc.smooth per second (the farm's Beast uses 4/s).
          if(sc.smooth){const k=Math.min(1,dt*sc.smooth);sv[0]+=(vx-sv[0])*k;sv[1]+=(vz-sv[1])*k;[vx,vz]=sv;}
          dx=vx*dt;dz=vz*dt;
        }
        if(seg.stop&&f===0){stopFrame=M.frames;stopTime=time;}
        r.g.position.x+=dx;r.g.position.z+=dz;dist=Math.hypot(dx,dz);
        const gaitBefore=r.state.gait;
        if(lastMode==='run'&&seg.mode!=='run')for(let k=0;k<4;k++)fromRun[k]=r.legs[k].track.mode==='swing';
        lastMode=seg.mode;
        if(onFrame)r.debugPlan=[];
        updateHorse3D(r,dx,dz,dt,seg.mode);
        if(r.state.gait!==gaitBefore&&dist<=1.5){
          for(let k=0;k<4;k++)if(r.legs[k].track.mode==='swing'&&swingStart[k]!==null&&!inherited[k])inherited[k]={gait:gaitBefore,since:time};
        }
        r.g.updateMatrixWorld(true);r.card.skeleton.update();
        M.frames++;M.gaits.add(r.state.gait);
        if(onFrame)onFrame(r,{frame:M.frames-1,time,dt,dx,dz,mode:seg.mode});
        const teleported=dist>1.5;
        let stance=0;
        for(let k=0;k<4;k++){
          const l=r.legs[k],t=l.track,foot=l.foot.getWorldPosition(new THREE.Vector3()),target=new THREE.Vector3(t.x,t.y,t.z);
          const hip=l.hip.getWorldPosition(new THREE.Vector3());
          const err=foot.distanceTo(target)*1000,reach=hip.distanceTo(target)/L;
          if(err>M.worstTargetMM){M.worstTargetMM=err;M.worstTargetAt={frame:M.frames,leg:k,mode:t.mode,reach:+reach.toFixed(4),gait:r.state.gait};}
          M.worstReach=Math.max(M.worstReach,reach);
          let sole=Infinity;for(const i of hooves[k]){r.card.applyBoneTransform(i,v.fromBufferAttribute(p,i));v.applyMatrix4(r.card.matrixWorld);sole=Math.min(sole,v.y);}
          const soleMM=(sole-r.g.position.y)*1000;M.minSoleMM=Math.min(M.minSoleMM,soleMM);
          if(t.mode==='stance'){
            stance++;inherited[k]=null;fromRun[k]=false;
            if(!teleported&&prevPlant[k]&&prevPlant[k].x===t.plantX&&prevPlant[k].z===t.plantZ)M.worstSlipMM=Math.max(M.worstSlipMM,foot.distanceTo(prevPlant[k].foot)*1000);
            M.worstPlantedSoleMM=Math.max(M.worstPlantedSoleMM,Math.abs(soleMM));
            prevPlant[k]={x:t.plantX,z:t.plantZ,foot};
            if(swingStart[k]!==null){M.longestSwingS=Math.max(M.longestSwingS,time+dt-swingStart[k]);swingStart[k]=null;}
          }else{prevPlant[k]=null;if(swingStart[k]===null)swingStart[k]=time;}
          if(!teleported){const bound=Math.max(.10,2.5*dist+.002);M.worstContinuityExcess=Math.max(M.worstContinuityExcess,foot.distanceTo(prevFoot[k])-bound);}
          prevFoot[k]=foot;
          M.hipDrift=Math.max(M.hipDrift,Math.abs(l.hip.position.x-l.x),Math.abs(l.hip.position.y-(HORSE.hip-HORSE.bodyY)),Math.abs(l.hip.position.z-l.z));
        }
        M.minStance=Math.min(M.minStance,stance);
        if(seg.mode!=='run'&&!fromRun.some(Boolean)&&stance<M.minStanceCallerWalk){M.minStanceCallerWalk=stance;M.callerWalkAt={frame:M.frames,gait:r.state.gait};}
        // During a hand-over the most lenient of the gaits' rules applies.
        const lenient=['idle','walk','trot','canter'];let ruleGait=r.state.gait;
        for(const h of inherited)if(h){
          M.longestTransitionS=Math.max(M.longestTransitionS,time+dt-h.since);
          if(lenient.indexOf(h.gait)>lenient.indexOf(ruleGait))ruleGait=h.gait;
        }
        if((ruleGait==='walk'||ruleGait==='idle')&&stance<M.minStanceWalkIdle){M.minStanceWalkIdle=stance;M.supportAt={frame:M.frames,gait:r.state.gait,mode:seg.mode};}
        // Idle recovery (one hoof at a time) applies once the root is still.
        if(ruleGait==='idle'&&dist<1e-9)M.minStanceIdle=Math.min(M.minStanceIdle,stance);
        airborne=stance===0?airborne+dt:0;M.longestAirborneS=Math.max(M.longestAirborneS,airborne);
        // Suspension is judged frame by frame against the effective gait's
        // allowance (a hand-over keeps the previous gait's), not the session's.
        M.worstAirborneExcess=Math.max(M.worstAirborneExcess,airborne-(ruleGait==='canter'?.15:ruleGait==='trot'?.10:0));
        M.maxDrop=Math.max(M.maxDrop,r.state.bodyDrop??0);
        if(seg.heading){
          // Heading completion: last time the model yaw was more than 1 deg off.
          const [vx,vz]=velocityAt(seg,el),err=Math.abs(wrap(Math.atan2(-vx,-vz)-r.model.rotation.y))*180/Math.PI;
          if(err>1)headingLate=time+dt-segStart;
          if(last){M.headingErrorDeg=Math.max(M.headingErrorDeg,err);M.headingTimeS=Math.max(M.headingTimeS,headingLate);}
        }
        if(stopFrame!==null&&M.settleTimeS===null&&atRest(seg)){
          const settled=r.legs.every(l=>l.track.mode==='stance')&&(r.state.bodyDrop??0)<1e-4;
          if(settled)M.settleTimeS=time+dt-stopTime;
        }
      }
    }
    M.emergency=r.state.emergencyLifts||0;M.unverified=r.state.unverifiedSwings||0;M.hurried=r.state.hurriedLandings||0;
    if(atRest(sc.segs.at(-1))){
      M.finalSwings=r.legs.filter(l=>l.track.mode==='swing').length;
      let float=0;for(let k=0;k<4;k++){let sole=Infinity;for(const i of hooves[k]){r.card.applyBoneTransform(i,v.fromBufferAttribute(p,i));v.applyMatrix4(r.card.matrixWorld);sole=Math.min(sole,v.y);}float=Math.max(float,Math.abs(sole-r.g.position.y)*1000);}
      M.settledFloatMM=float;M.restDrop=r.state.bodyDrop??0;
    }
  }finally{r.dispose();}
  M.gaits=[...M.gaits].join('/');
  return M;
}
