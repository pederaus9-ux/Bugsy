// Test-only production-domain adapter. No live scene mutation or RNG.
// Native elementary functions assume supported high-accuracy engines; the
// consumer enlarges every spatial bound by 1um plus magnitude/error terms.
import * as T from '../../lib/three.module.min.js';
import {ordinaryLeg,lieLeg,bodyMatrix,intervalMath as Q} from './cow-leg-enclosure.mjs';
const {I,P,A,M,S,D,N,sq,hull,MM,pointMatrix}=Q,TAU=2*Math.PI;
// One shared phase: w'(t)=-6*t*(1-t)<=0 on[0,1]. Independent copies of
// t in the cubic introduced impossible negative residual weights. Evaluate
// each endpoint outward, then include a small outward native-operation guard.
// This enlarges bounds only; no collision/leg/contact assertion is relaxed.
export function cowRecoveryWeight(rt){
 I(...rt);if(rt[0]<0||rt[1]>1)throw Error('Invalid recovery phase');
 const at=t=>t===0?P(1):t===1?P(0):S(P(1),M(M(P(t),P(t)),S(P(3),M(P(2),P(t)))));
 return A(I(at(rt[1])[0],at(rt[0])[1]),I(-16*Number.EPSILON,16*Number.EPSILON));
}
const clamp=(x,a,b)=>I(Math.max(a,Math.min(b,x[0])),Math.max(a,Math.min(b,x[1])));
const max=(a,b)=>I(Math.max(a[0],b[0]),Math.max(a[1],b[1]));
const mix=(a,b,k)=>A(a,M(S(b,a),k)),exp=x=>I(Math.exp(x[0]),Math.exp(x[1]));
const ease=(t,k)=>S(P(1),exp(M(P(-k),t)));
const sin=x=>{if(x[1]-x[0]>=TAU)return I(-1,1);let lo=Math.min(Math.sin(x[0]),Math.sin(x[1])),hi=Math.max(Math.sin(x[0]),Math.sin(x[1]));if(Math.ceil((x[0]-Math.PI/2)/TAU)<=Math.floor((x[1]-Math.PI/2)/TAU))hi=1;if(Math.ceil((x[0]+Math.PI/2)/TAU)<=Math.floor((x[1]+Math.PI/2)/TAU))lo=-1;return I(lo,hi);};
const cos=x=>sin(A(x,P(Math.PI/2)));
const periodicPieces=x=>{const out=[];if(x[1]-x[0]>=1)return[I(0,1)];for(let k=Math.floor(x[0]);k<=Math.floor(x[1]);k++)out.push(I(Math.max(0,x[0]-k),Math.min(1,x[1]-k)));return out;};
const root=x=>I(Math.sqrt(Math.max(0,x[0])),Math.sqrt(Math.max(0,x[1])));
const norm2=(x,z)=>root(A(sq(x),sq(z)));
// Native radial clipping preserves the disk invariant, even though independent
// component and norm intervals lose that correlation. Intersect two enclosures;
// do not change native geometry or the downstream .5m supported-domain guard.
export function cowReachClip(tx,tz,reach=norm2(tx,tz)){
 I(...tx);I(...tz);I(...reach);if(reach[0]<0)throw Error('Invalid reach');
 if(reach[1]<=.34)return {tx:[...tx],tz:[...tz]};
 const k=I(.34/reach[1],reach[0]>.34?.34/reach[0]:1);
 const cap=A(P(.34),P(16*Number.EPSILON*(1+.34)))[1];
 const constrain=v=>{const q=M(v,k);return I(Math.max(-cap,q[0]),Math.min(cap,q[1]));};
 return {tx:constrain(tx),tz:constrain(tz)};
}
const local=n=>({p:n.position.toArray().map(P),e:[n.rotation.x,n.rotation.y,n.rotation.z].map(P),s:n.scale.toArray().map(P)});
function eulerMatrix({p,e,s}){const [x,y,z]=e,a=cos(x),b=sin(x),c=cos(y),d=sin(y),ee=cos(z),f=sin(z),ae=M(a,ee),af=M(a,f),be=M(b,ee),bf=M(b,f);return [M(M(c,ee),s[0]),M(A(af,M(be,d)),s[0]),M(S(bf,M(ae,d)),s[0]),P(0),M(N(M(c,f)),s[1]),M(S(ae,M(bf,d)),s[1]),M(A(be,M(af,d)),s[1]),P(0),M(d,s[2]),M(N(M(b,c)),s[2]),M(M(a,c),s[2]),P(0),...p,P(1)];}
function guardInput(r,request){
 if(r.disposed||r.g.parent||r.g.rotation.toArray().slice(0,3).some(Boolean)||r.g.scale.toArray().some(x=>x!==1)||r.model.position.toArray().some(Boolean)||r.model.rotation.x||r.model.rotation.z||r.model.scale.x!==r.model.scale.y||r.model.scale.x!==r.model.scale.z)throw Error('Unsupported cow carrier');
 if(!(request.dt>0&&request.dt<=1/30)||![request.dx||0,request.dy||0,request.dz||0,request.dt].every(Number.isFinite)||request.hop||request.alignYaw!==undefined)throw Error('Unsupported motion request');
 if(Math.hypot(request.dx||0,request.dz||0)>1.5)throw Error('Unsupported external displacement');
 if(request.support&&(!['plane','height-union'].includes(request.support.kind)||!request.support.heights?.every(x=>Number.isFinite(x)&&x>=0&&x<=.08)))throw Error('Unsupported support domain');
 if(request.care&&(!['feed','drink','lie'].includes(request.care.mode)||!Number.isFinite(request.care.weight)||!Number.isFinite(request.care.weightFrom)||Math.min(request.care.weight,request.care.weightFrom)<0||Math.max(request.care.weight,request.care.weightFrom)>1||request.dx||request.dy||request.dz))throw Error('Unsupported moving care overlay');
}

// Fractional native update from one immutable pre-overlay base. Event provenance
// is optional only when there is no recovery in flight. At the left endpoint,
// include the preceding evaluated phase as well as the stored next phase.
export function cowMotionDomains(r,request,lo=0,hi=1){
 guardInput(r,request);if(!(0<=lo&&lo<=hi&&hi<=1)||(lo===hi&&!(lo===0&&request.recoveryFraction)))throw Error('Invalid temporal interval');
 const s=r.state,scale=r.model.scale.x,t=I(lo*request.dt,hi*request.dt),time=A(P(s.time),t),f=I(lo,hi),dx=request.dx||0,dy=request.dy||0,dz=request.dz||0,speed=Math.hypot(dx,dz)/request.dt,dist=M(P(speed),t),phaseStep=D(dist,P(1.09+(.26*s.blend))),phase=A(P(s.phase),phaseStep);
 const target=Math.max(0,Math.min(1,speed/.06)),x0=s.amount-target,b=s.amountV+18*x0,amount=clamp(A(P(target),M(A(P(x0),M(P(b),t)),exp(M(P(-18),t)))),0,1),run=mix(P(s.run),P(Math.max(0,Math.min(1,(speed-1.1)/1.5))),ease(t,6));
 const blendStep=I(-phaseStep[1],phaseStep[1]),runDiff=S(run,P(s.blend)),follow=A(P(s.blend),I(Math.max(blendStep[0],Math.min(blendStep[1],runDiff[0])),Math.max(blendStep[0],Math.min(blendStep[1],runDiff[1])))),blend=amount[1]<.01?run:amount[0]>=.01?follow:hull(run,follow),stride=A(P(1.09),M(P(.26),blend)),duty=A(P(.65),M(P(-.20),blend));
 const oldYaw=r.model.rotation.y,targetYaw=Math.atan2(-dx,-dz),angle=Math.atan2(Math.sin(targetYaw-oldYaw),Math.cos(targetYaw-oldYaw));
 const raw=speed>.02?Math.sign(angle)*Math.min(Math.abs(angle)*(1-Math.exp(-14*t[1])),4*t[1]):0;
 // Feasibility search multiplies the requested heading by a number in[0,1].
 const yaw=A(P(oldYaw),I(Math.min(0,raw),Math.max(0,raw))),cy=cos(yaw),sy=sin(yaw),ratioTarget=speed>.01?I(Math.min(0,Math.max(-2,Math.min(2,Math.sign(angle)*Math.min(4,Math.abs(angle)*14)/Math.max(speed,.5)))),Math.max(0,Math.max(-2,Math.min(2,Math.sign(angle)*Math.min(4,Math.abs(angle)*14)/Math.max(speed,.5))))):P(0),turn=mix(P(s.turnRatio||0),ratioTarget,ease(t,8)),quiet=['sleeping','resting'].includes(request.act)?.12:1;
 const nodes=new Map(r.card.skeleton.bones.map(n=>[n,local(n)])),get=n=>nodes.get(n),body=get(r.body),neck=get(r.neck),head=get(r.head),jaw=get(r.jaw),rootPos=r.g.position.toArray().map((v,k)=>A(P(v),M(P([dx,dy,dz][k]),f)));
 body.s[1]=A(P(1),M(P(.007*quiet),sin(A(M(time,P(1.5)),P(s.seed)))));body.e[1]=M(P(.15),M(turn,amount));body.e[2]=M(sin(M(phase,P(TAU))),M(A(P(.012),M(P(-.003),blend)),amount));
 const sleeping=['sleeping','resting'].includes(request.act),feeding=request.act==='eating',pet=I(Math.max(0,s.pet-t[1]),Math.max(0,s.pet-t[0])),hold=I(Math.max(0,s.hold-t[1]),Math.max(0,s.hold-t[0]));
 const attention=mix(P(s.attention),pet[0]>0?P(1):pet[1]>0?I(0,1):hold[0]>0?P(.55):hold[1]>0?I(0,.55):P(0),ease(t,feeding?2.2:3.2)),tailAlert=mix(P(s.tailAlert),clamp(M(attention,S(P(1),M(amount,P(.65)))),0,1),ease(t,2.6));
 const chewDrive=feeding?clamp(A(A(P(.72),M(P(.38),sin(A(M(time,P(.43)),P(s.seed*2.3))))),M(P(.18),sin(A(M(time,P(.17)),P(s.seed*.9))))),0,1):P(0),drive=mix(P(s.chewDrive),chewDrive,ease(t,1.8)),chewAmount=mix(P(s.chewAmount),drive,ease(t,feeding?3.2:3)),chewPhase=A(P(s.chewPhase),M(t,A(P(2.8+.45*Math.sin(s.seed*1.7)),M(P(.25),sin(A(M(time,P(.31)),P(s.seed)))))));
 let lookBase=hold[0]>0?P(s.lookTo):hold[1]>0?hull(P(0),P(s.lookTo)):P(0);if(s.nextLook-t[1]<=0)lookBase=hull(lookBase,M(P(.48),sin(A(P(s.seed*2.1),M(time,P(1.3))))));if(pet[1]>0)lookBase=pet[0]>0?P(.28):hull(lookBase,P(.28));
 const look=mix(P(s.look),M(M(lookBase,P(quiet)),S(P(1),M(amount,P(.6)))),ease(t,3.5));neck.e[1]=M(look,P(.65));head.e[1]=M(look,P(.35));neck.e[0]=mix(neck.e[0],feeding?P(-.95):sleeping?P(.11):M(P(.012),M(sin(M(phase,P(TAU*2))),amount)),ease(t,5));neck.p[1]=mix(neck.p[1],P(feeding?.8:1.12),ease(t,5));head.e[2]=mix(head.e[2],pet[0]>0?P(.08):pet[1]>0?hull(P(.08),M(look,P(.06))):M(look,P(.06)),ease(t,5));
 jaw.e[0]=A(M(P(.025),chewAmount),M(M(max(P(0),sin(chewPhase)),P(.022)),chewAmount));const grind=hull(...periodicPieces(D(chewPhase,P(TAU))).map(p=>sin(A(M(p,P(Math.PI)),P(1.1)))));jaw.e[1]=M(P(.018),M(grind,chewAmount));
 const earFocus=mix(P(s.earFocus),M(attention,P(quiet)),ease(t,4));for(let i=0;i<2;i++){const side=i===0?-1:1,ear=get(r.ears[i]);let earTime=I(Math.max(0,s.earTime-t[1]),Math.max(0,s.earTime-t[0])),sides=[s.earSide];if(s.nextEar-t[1]<=0){earTime=hull(earTime,P(.65));sides.push((s.earEvent+1)%2);}const flick=M(sq(sin(M(S(P(1),D(earTime,P(.65))),P(Math.PI)))),P(.42*quiet)),targets=sides.map(selected=>M(P(selected===i?side:-side*.15),flick));ear.e[2]=mix(ear.e[2],hull(...targets),ease(t,22));ear.e[1]=A(N(M(P(side),M(look,A(P(.18),M(P(.12),earFocus))))),M(P(side*.045),earFocus));}
 let blink=I(Math.max(0,s.blinkTime-t[1]),Math.max(0,s.blinkTime-t[0]));if(s.nextBlink-t[1]<=0)blink=hull(blink,P(.2));const shut=sin(M(S(P(1),D(blink,P(.2))),P(Math.PI)));for(const eye of r.eyes)get(eye).s[1]=sleeping?P(.18):S(P(1),M(P(.9),shut));
 for(let i=0;i<3;i++){const tail=get(r.tail[i]),calm=feeding?S(P(1),M(P(.28),chewAmount)):P(1);tail.e[2]=M(P(quiet),A(M(M(sin(A(M(time,P(.9)),P(s.seed-i*.5))),P(.12+i*.04)),calm),M(sin(A(M(time,P(2.1)),P(s.seed+i))),M(tailAlert,P(.035+i*.025)))));tail.e[0]=A(P(.08),M(P(.04),sin(S(M(time,P(.7)),P(i*.3)))));}
 let B=bodyMatrix({y:body.p[1],yaw:body.e[1],roll:body.e[2],scaleY:body.s[1]}),legPoses=[],events=[];
 for(const [i,l]of r.legs.entries()){
  const phases=periodicPieces(A(A(phase,P(l.walkPhase)),M(blend,P(l.blendDelta)))),lphase=hull(...phases),legStride=M(stride,clamp(A(P(1),M(P(l.x),turn)),.4,1.6)),step=M(M(duty,legStride),P(.5));let nominal=[],lifts=[];
  for(const ph of phases){if(ph[0]<=duty[1]){const p=I(ph[0],Math.min(ph[1],duty[1]));nominal.push(A(N(step),M(M(D(p,duty),P(2)),step)));lifts.push(P(0));}
  if(ph[1]>=duty[0]){const u=clamp(D(S(ph,duty),S(P(1),duty)),0,1);nominal.push(M(step,cos(M(u,P(Math.PI)))));lifts.push(M(M(sin(M(u,P(Math.PI))),A(P(.075),M(P(.055),blend))),amount));}}
  let nz=M(hull(...nominal),amount),lift=hull(...lifts);if(amount[0]<.01){nz=hull(nz,P(0));lift=hull(lift,P(0));}if(amount[1]<.01){nz=P(0);lift=P(0);}
  let tx,tz,footYaw=P(0);
  if(l.planted){const wx=D(S(P(l.ax),rootPos[0]),P(scale)),wz=D(S(P(l.az),rootPos[2]),P(scale));tx=S(S(M(wx,cy),M(wz,sy)),P(l.x));tz=S(A(M(wx,sy),M(wz,cy)),P(l.z));lift=P(0);footYaw=hull(P(0),S(P(l.ayaw),yaw));events.push('plant-or-release');}
  else{let rt=P(l.rt);if((l.rt<1||request.evaluatedRt?.[i]<l.rt)&&lo===0){if(!request.evaluatedRt||!Number.isFinite(request.evaluatedRt[i]))throw Error('Missing evaluated recovery phase');const previous=request.evaluatedRt[i];rt=request.recoveryFraction?clamp(A(P(previous),M(P(l.rt-previous),request.recoveryFraction)),0,1):hull(rt,P(previous));events.push('recovery-phase');}if(rt[0]<0||rt[1]>1)throw Error('Invalid recovery phase');const w=cowRecoveryWeight(rt);tx=M(S(S(M(P(l.rax||0),cy),M(P(l.raz||0),sy)),P(l.x)),w);tz=A(nz,M(S(S(A(M(P(l.rax||0),sy),M(P(l.raz||0),cy)),P(l.z)),P(l.rnz||0)),w));lift=max(P(0),S(lift,M(P(l.ry||0),w)));if(l.r0>1e-4&&rt[0]<1)lift=max(lift,M(sq(sin(M(rt,P(Math.PI)))),P(Math.min(.08,l.r0*.25))));if(!l.slip&&amount[1]>.05&&lphase[0]<=duty[1]&&norm2(tx,tz)[0]+dist[0]/scale<=.34)lift=hull(lift,P(0));}
  const reach=norm2(tx,tz);if(reach[1]>.34){({tx,tz}=cowReachClip(tx,tz,reach));events.push('reach-clip');}
  let pose=ordinaryLeg(l,{tx,tz,lift},B,{planted:true,footYaw});
  if(request.support){const heights=request.support.heights,H=I(Math.min(...heights),Math.max(...heights)),diff=S(H,rootPos[1]);if(Math.max(Math.abs(diff[0]),Math.abs(diff[1]))>=1e-12){const foot=MM(MM(B,pose.hip),MM(pose.knee,pose.foot)),p={tx:S(foot[12],P(l.x)),tz:S(foot[14],P(l.z)),lift:A(S(foot[13],P(.055)),D(diff,P(scale)))};const supported=ordinaryLeg(l,p,B,{planted:true,footYaw});if(diff[0]<=1e-12&&diff[1]>=-1e-12)for(const k of['hip','knee','foot','root'])supported[k]=supported[k].map((v,j)=>hull(v,pose[k][j]));pose=supported;events.push('support-union');}}
  legPoses.push(pose);
 }
 if(request.care){const c=request.care,w=clamp(A(P(c.weightFrom),M(P(c.weight-c.weightFrom),f)),0,1),one=S(P(1),w);if(c.mode==='lie'){body.p[1]=mix(body.p[1],P(.45),w);body.e[2]=M(body.e[2],one);neck.p[1]=S(neck.p[1],M(P(.47),w));neck.e[0]=mix(neck.e[0],P(.18),w);head.e[1]=M(head.e[1],one);get(r.tail[0]).p[1]=S(get(r.tail[0]).p[1],M(P(.58),w));get(r.tail[0]).e[0]=mix(get(r.tail[0]).e[0],P(1.1),w);B=bodyMatrix({y:body.p[1],yaw:body.e[1],roll:body.e[2],scaleY:body.s[1]});for(let i=0;i<4;i++){const lie=lieLeg(r.legs[i],w,B);if(w[0]===0)for(const k of['hip','knee','foot'])lie[k]=lie[k].map((v,j)=>hull(v,legPoses[i][k][j]));legPoses[i]=lie;}events.push('lie-onset');}
  else{if(!Array.isArray(c.target)||c.target.length!==3||!c.target.every(Number.isFinite))throw Error('Invalid care target');const inv=new T.Matrix4().compose(r.g.position,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),oldYaw),r.model.scale).invert(),v=new T.Vector3(...c.target).applyMatrix4(inv),rz=v.z+.59,L=Math.hypot(.07,.56),desiredY=-Math.sqrt(Math.max(0,L*L-rz*rz)),pitch=Math.max(-1.4,Math.min(.1,Math.atan2(desiredY,-rz)-Math.atan2(.07,.56)));neck.e[0]=mix(neck.e[0],P(pitch),w);neck.p[1]=mix(neck.p[1],P(v.y-desiredY),w);neck.e[1]=M(neck.e[1],one);head.e[1]=M(head.e[1],one);head.e[2]=M(head.e[2],one);if(c.mode==='drink'){jaw.e[0]=mix(jaw.e[0],A(P(.012),M(P(.006),sin(M(time,P(4))))),w);jaw.e[1]=M(jaw.e[1],one);}events.push('care-weight');}}
 const localMatrices=new Map([...nodes].map(([n,d])=>[n,eulerMatrix(d)]));localMatrices.set(r.body,B);for(let i=0;i<4;i++)for(const k of['hip','knee','foot'])localMatrices.set(r.legs[i][k],legPoses[i][k]);
 const world=new Map(),bones=r.card.skeleton.bones;for(const bone of bones){const li=r.legs.findIndex(l=>l.hip===bone);world.set(bone,li>=0&&request.care?.mode!=='lie'?legPoses[li].root:bones.includes(bone.parent)?MM(world.get(bone.parent),localMatrices.get(bone)):localMatrices.get(bone));}
 return {boneFrames:bones.map(bone=>world.get(bone)),matrices:bones.map((bone,i)=>MM(world.get(bone),pointMatrix(r.card.skeleton.boneInverses[i]))),yaw,rootPos,scale,events:[...new Set(events)],classification:'SUPPORTED_ENGINE_PRODUCTION_DOMAIN',fraction:[lo,hi]};
}
