// Owner-requested 3D character prototype. The farm's AI/saves are kept outside this module.
import * as THREE from './lib/three.module.min.js';
const TAU=Math.PI*2, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ease=(dt,k)=>1-Math.exp(-dt*k), mix=(a,b,k)=>a+(b-a)*k;
const UP=new THREE.Vector3(0,1,0);
export const COW_GAIT=Object.freeze({walk:.8,run:2.6,stride:1.09,runStride:1.35,stance:.65,runStance:.45,upper:.36,lower:.37,hip:.77,hoof:.055});
let template;
function buildTemplate(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[],ears:[],eyes:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,1.03,0]);
  slots.neck=bone('neck',0,[0,1.12,-.59]);slots.head=bone('head',slots.neck,[0,.21,-.15]);
  slots.jaw=bone('jaw',slots.head,[0,-.09,-.08]);
  for(const side of [-1,1]){slots.ears.push(bone('ear'+side,slots.head,[side*.20,.15,.01]));slots.eyes.push(bone('eye'+side,slots.head,[side*.145,.045,-.125]));}
  // Hips are body children. The offset is body-local so the rest hip stays at the old root position.
  for(const [x,z,phase,walkPhase]of [[-.265,-.46,0,0.75],[.265,-.46,.5,0.25],[-.265,.48,.5,0],[.265,.48,0,0.5]]){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,COW_GAIT.hip-1.03,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-COW_GAIT.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-COW_GAIT.lower,0]);slots.legs.push({hip,knee,foot,x,z,phase,walkPhase});
  }
  let parent=0;
  for(let i=0;i<3;i++){const b=bone('tail'+i,parent,i?[0,-.22,.02]:[0,1.17,.74]);slots.tail.push(b);parent=b;}
  // One immutable skin/material/draw; instances keep independent skeletons.
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);if(i)p.add(restParent(i));return p;});
  function restParent(i){let p=new THREE.Vector3(),j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;}
  const pos=[],norm=[],color=[],skin=[],weight=[];
  const cream=0xf2eee1,ink=0x282b2a,pink=0xd89b91,horn=0xc8bba1;
  const white=new THREE.Color(cream),black=new THREE.Color(ink),matCol=new THREE.Color();
  function coat(x,y,z){
    // Rounded, irregular Holstein patches in object space; no image cards or texture atlas.
    const side=x>0?1:-1;
    const p1=((x-side*.30)/.22)**2+((y-1.12)/.34)**2+((z+.37)/.36)**2;
    const p2=((x-side*.26)/.27)**2+((y-1.13-side*.06)/.29)**2+((z-.40)/.32)**2;
    const p3=(x/.29)**2+((y-1.37)/.16)**2+((z-.04)/.34)**2;
    const d=Math.min(p1,p2,p3)+Math.sin(y*24+z*15)*.10+Math.sin(x*35-z*22)*.07;
    const k=clamp((1.02-d)/.16,0,1);matCol.copy(white).lerp(black,k);return matCol;
  }
  function add(geo,col,p,scale,b=0,rx=0,rz=0,blend=null){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const origin=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+origin.x,p[1]+origin.y,p[2]+origin.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,0,rz)),new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=typeof col==='number'?new THREE.Color(col):null;
    for(let i=0;i<a.count;i++){
      const x=a.getX(i),y=a.getY(i),z=a.getZ(i),rgb=c||col(x,y,z);
      pos.push(x,y,z);norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(rgb.r,rgb.g,rgb.b);
      const influences=blend?blend(x,y,z):[[b,1]];
      const sum=influences.reduce((s,w)=>s+w[1],0);
      for(let j=0;j<4;j++){skin.push(influences[j]?.[0]||0);weight.push((influences[j]?.[1]||0)/sum);}
    }
    g.dispose();
  }
  const oval=(col,p,scale,b=0,rx=0,rz=0,detail=12)=>add(new THREE.SphereGeometry(1,detail,Math.round(detail*.65)),col,p,scale,b,rx,rz);
  const subdivide=(sections,steps)=>sections.flatMap((a,i)=>i===sections.length-1?[a]:Array.from({length:steps},(_,j)=>a.map((x,k)=>mix(x,sections[i+1][k],j/steps))));
  const smoothSections=(sections,steps)=>sections.flatMap((a,i)=>i===sections.length-1?[a]:Array.from({length:steps},(_,j)=>a.map((x,k)=>{
    const p=sections[Math.max(0,i-1)][k],q=sections[i+1][k],r=sections[Math.min(sections.length-1,i+2)][k],t=j/steps;
    return .5*((2*x)+(-p+q)*t+(2*p-5*x+4*q-r)*t*t+(-p+3*x-3*q+r)*t*t*t);
  })));
  // Authored sections are [axis, transverse center1/2, radius1/2].
  // Closed, smooth section surfaces define anatomy instead of stacked spheres.
  function loft(col,axis,sections,b=0,blend=null,sides=20,warp=null){
    const vertices=[],indices=[];
    for(const [along,u,v,ru,rv,lower=rv] of sections)for(let j=0;j<sides;j++){
      const a=j/sides*TAU,s=Math.sin(a);let pu=u+Math.cos(a)*ru,pv=v+s*(s<0?lower:rv);
      if(warp)[pu,pv]=warp(pu,pv,along,a,s);
      if(axis==='z')vertices.push(pu,pv,along);
      else if(axis==='y')vertices.push(pu,along,pv);
      else vertices.push(along,pv,pu);
    }
    for(let i=0;i<sections.length-1;i++)for(let j=0;j<sides;j++){
      const a=i*sides+j,c=i*sides+(j+1)%sides,d=c+sides,e=a+sides;
      indices.push(a,c,e,c,d,e);
    }
    for(const end of [0,sections.length-1]){
      const [along,u,v]=sections[end],center=vertices.length/3;
      if(axis==='z')vertices.push(u,v,along);else if(axis==='y')vertices.push(u,along,v);else vertices.push(along,v,u);
      for(let j=0;j<sides;j++){const a=end*sides+j,c=end*sides+(j+1)%sides;indices.push(...(end===0?[center,c,a]:[center,a,c]));}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    // Axis basis and section direction both determine outward winding.
    if((axis==='z'?1:-1)*(sections.at(-1)[0]-sections[0][0])<0){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];g.setIndex(indices);g.computeVertexNormals();}
    add(g,col,[0,0,0],[1,1,1],b,0,0,blend);
  }
  const bodyY=rest[slots.body].y;
  // Independently shaped dorsal/ventral radii: brisket, deep ribs, rising flank,
  // loin and angular dairy pelvis. Rear stations expose hooks, pins and rump slope.
  const torso=[[-.64,1.13,.075,.22,.20],[-.58,1.14,.20,.265,.28],[-.50,1.13,.275,.30,.33],[-.42,1.12,.315,.335,.335],[-.30,1.11,.32,.34,.335],[-.16,1.11,.335,.34,.365],[.03,1.10,.343,.345,.395],[.20,1.13,.33,.325,.345],[.32,1.17,.27,.29,.28],[.43,1.205,.315,.29,.265],[.53,1.185,.275,.265,.245],[.62,1.155,.225,.225,.215],[.695,1.135,.145,.175,.17],[.735,1.13,.065,.13,.125],[.755,1.13,.015,.10,.10]];
  const torsoBlend = (x,y,z) => {
    let influences = [[slots.body, 1]];
    for (const l of slots.legs) {
      const h = rest[l.hip];
      // Localized deformation zone: shift center up to mesh intersection, tighter radius, lower max weight
      const dist = Math.hypot(x - h.x, (y - (h.y + 0.10)) * 0.8, z - h.z);
      const w = clamp((.18 - dist) / .18, 0, 1) * 0.35;
      if (w > 0) influences.push([l.hip, w]);
    }
    return influences;
  };
  loft(coat,'z',smoothSections(torso.map(([z,y,w,top,bottom])=>[z,0,y-bodyY,w,top,bottom]),3),slots.body,torsoBlend,32);
  // Neck overlaps the chest internally; dominant neck weights retain its hit contract.
  loft(coat,'z',subdivide([
    [.14,0,.01,.215,.23],[.07,0,.04,.205,.22],[-.01,0,.08,.195,.205],
    [-.10,0,.14,.175,.18],[-.18,0,.18,.155,.155],[-.24,0,.19,.13,.125]
  ],2),slots.neck,(x,y,z)=>{
    const body=clamp((z+.70)/.25,0,1)*.32,head=clamp((-z-.72)/.12,0,1)*.3;
    return [[slots.neck,1-body-head],[slots.body,body],[slots.head,head]];
  },24);
  const faceCoat=(x,y,z)=>{const whiteBridge=clamp((.065-Math.abs(x))/.025,0,1);return matCol.copy(black).lerp(white,whiteBridge);};
  loft(faceCoat,'z',subdivide([
    [.09,0,.045,.12,.17],[.025,0,.055,.18,.235],[-.05,0,.035,.182,.23],
    [-.14,0,-.015,.155,.19],[-.23,0,-.07,.12,.135],[-.31,0,-.11,.135,.105],[-.37,0,-.12,.143,.083]
  ],2),slots.head,(x,y,z)=>[[slots.head,1-clamp((z+.70)/.11,0,1)*.22],[slots.neck,clamp((z+.70)/.11,0,1)*.22]],24);
  loft(cream,'z',[[.015,0,-.025,.09,.08],[-.06,0,-.03,.13,.087],[-.14,0,-.06,.12,.07],[-.26,0,-.055,.135,.065]],slots.jaw,null,20);
  // Wider, flatter bovine muzzle plane; fuller below the lip than above it.
  loft(pink,'z',[[-.20,0,-.045,.138,.076,.098],[-.26,0,-.055,.168,.073,.098],[-.30,0,-.055,.172,.068,.09],[-.33,0,-.05,.148,.055,.068]],slots.jaw,null,24);
  for(const side of [-1,1]){
    oval(ink,[side*.088,-.023,-.328],[.034,.017,.009],slots.jaw,0,0,12);
    const ear=slots.ears[side===-1?0:1];
    const leaf=[[0,0,0,.037,.020],[side*.045,0,.01,.055,.030],[side*.115,0,.028,.074,.034],[side*.185,0,.034,.046,.023],[side*.23,0,.027,.008,.006]];
    if(side<0)leaf.reverse();
    loft(cream,'x',leaf,ear,null,16);
    // The inset follows the ear bone and sits on its forward-facing cup.
    oval(pink,[side*.115,.028,-.050],[.072,.019,.009],ear,0,side*.10,12);
    loft(horn,'y',[[.20,side*.14,.012,.032,.029],[.265,side*.145,.022,.025,.023],[.325,side*.17,.040,.014,.013],[.365,side*.19,.052,.002,.002]],slots.head,null,10);
    const eye=slots.eyes[side===-1?0:1];
    oval(ink,[0,0,.004],[.038,.040,.026],eye,0,0,12);
    oval(0x60442a,[side*.006,0,-.012],[.027,.030,.017],eye,0,0,12);
    oval(0x101816,[side*.009,0,-.025],[.018,.025,.009],eye,0,0,12);
    oval(0xffffff,[-.005,.009,-.032],[.005,.006,.004],eye,0,0,8);
    oval(ink,[side*.145,.081,-.121],[.04,.012,.023],slots.head,0,0,12);
  }
  // A small forelock follows the refined poll rather than a round hair helmet.
  for(let i=0;i<3;i++)oval(0xe7dfc8,[(i-1)*.035,.251,-.085],[.030,.026,.035],slots.head,0,0,8);
  const udder=(x,y,z)=>{const centerGroove=Math.exp(-x*x/.0005)*.06;matCol.setHex(pink).lerp(white,clamp((y-.81)/.13,0,1)*.55).multiplyScalar(1-centerGroove);return matCol;};
  const quarterUdder=(x,y,z)=>{
    const rear=clamp((z-.22)/.28,0,1),underside=clamp((.86-y)/.18,0,1);
    const cleft=Math.exp(-(x*x)/.0011)*rear*underside;
    const lobe=Math.exp(-((Math.abs(x)-.085)**2)/.0016)*rear*underside;
    return [x,y+.034*cleft-.005*lobe];
  };
  // Broad attachment stays inside the belly while a real geometric cleft separates
  // the rear quarters instead of relying on color alone.
  loft(udder,'z',[[.08,0,.785,.065,.11,.045],[.15,0,.745,.14,.14,.09],[.26,0,.735,.185,.15,.125],[.37,0,.76,.17,.17,.15],[.47,0,.82,.135,.155,.17],[.53,0,.88,.065,.08,.08]],0,(x,y,z)=>[[slots.body,.85],[0,.15]],24,quarterUdder);
  for(const x of [-.085,.085])for(const z of [.23,.39])loft(pink,'y',[[.50,x,z,.010,.010],[.52,x,z,.014,.014],[.59,x,z,.019,.019],[.65,x,z,.023,.023]],0,()=>[[slots.body,.85],[0,.15]],10);
  for(const [i,l]of slots.legs.entries()){
    const rear=i>=2,base=rest[l.hip],rearOut=rear?Math.sign(l.x)*.012:0;
    const upper=[[-.38,rearOut*.25,0,.044,.048],[-.32,rearOut*.45,rear?.025:0,.052,.058],[-.23,rearOut*.70,rear?.035:-.005,.065,.076],[-.10,rearOut,rear?.028:-.015,.083,.10],[.03,rearOut,0,rear?.105:.095,rear?.12:.11],[.14,rearOut*.85,-.008,rear?.085:.080,rear?.10:.095],[.27,rearOut*.55,-.01,.047,.053],[.40,rearOut*.25,-.01,.012,.022]];
    loft(coat,'y',upper,l.hip,(x,y,z)=>{
      const local=y-base.y,body=clamp((local+.02)/.18,0,1),knee=clamp((-local-.25)/.13,0,1)*.3;
      return [[l.hip,1-body-knee],[slots.body,body],[l.knee,knee]];
    },16);
    const shin=[[-.39,0,-.006,.032,.035],[-.35,0,-.002,.045,.047],[-.31,0,rear?.005:0,.037,.040],[-.24,0,rear?.014:0,.029,.034],[-.14,0,rear?.026:0,.028,.036],[-.07,0,rear?.033:0,.036,.045],[.0,0,rear?.041:.003,.057,.070],[.045,0,rear?.025:0,.050,.060],[.075,0,.005,.040,.045]];
    const kneeRest=rest[l.knee];
    loft(cream,'y',shin,l.knee,(x,y,z)=>{
      const local=y-kneeRest.y,hip=clamp((local+.02)/.08,0,1)*.35,foot=clamp((-local-.29)/.10,0,1)*.3;
      return [[l.knee,1-hip-foot],[l.hip,hip],[l.foot,foot]];
    },12);
    // Separate cloven claws with bevels and an exactly flat sole, rigidly skinned.
    for(const side of [-1,1]){
      const outline=[[-.022,-.066],[.005,-.083],[.025,-.076],[.032,-.048],[.030,.022],[.014,.049],[-.019,.045],[-.027,.005]];
      const vertices=[],indices=[],ys=[-.055,-.049,.005,.030,.050],sizes=[.85,1,.94,.77,.52],count=outline.length;
      // Mirrored claws taper into the coronary band, with a longer rounded toe
      // and inset heel. Only their rigid sole retains the exact contact plane.
      for(let r=0;r<ys.length;r++)for(const [x,z]of outline)vertices.push(side*(.033+x*sizes[r]),ys[r],z*sizes[r]-.012+r*.004);
      for(let r=0;r<ys.length-1;r++)for(let j=0;j<count;j++){const a=r*count+j,c=r*count+(j+1)%count;indices.push(a,c,a+count,c,c+count,a+count);}
      for(const [ring,reverse]of [[0,true],[ys.length-1,false]])for(let j=1;j<count-1;j++)indices.push(...(reverse?[ring*count,ring*count+j+1,ring*count+j]:[ring*count,ring*count+j,ring*count+j+1]));
      if(side>0)for(let j=0;j<indices.length;j+=3)[indices[j+1],indices[j+2]]=[indices[j+2],indices[j+1]];
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();add(g,0x413c34,[0,0,0],[1,1,1],l.foot);
    }
  }
  for(const [i,b]of slots.tail.entries())loft(cream,'y',[
    [-.235,0,.024,.011,.012],[-.14,0,.015,.014,.016],[-.04,0,.005,.018,.020],[i===0?.135:.02,0,i===0?-.028:0,i===0?.020:.019,i===0?.021:.020]
  ],b,i===0?(x,y,z)=>[[b,1-clamp((y-1.18)/.15,0,1)*.3],[slots.body,clamp((y-1.18)/.15,0,1)*.3]]:null,12);
  loft(ink,'y',[[-.285,0,.02,.009,.011],[-.245,0,.018,.030,.036],[-.19,0,.015,.038,.043],[-.12,0,.01,.020,.025]],slots.tail[2],null,14);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.86});
  return {defs,slots,geometry,material};
}
export function createCow3D(height=1.7,x=0,z=0,seed=0){
  if (typeof seed === 'string') { let hash=7; for (const ch of seed) hash=(hash*31+ch.charCodeAt(0))>>>0; seed=(hash%997)/17; }
  template ||= buildTemplate();const t=template;
  const bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));card.castShadow=card.receiveShadow=true;
  // Conservative static bounds avoid a full vertex scan during each animation frame.
  card.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.9,0),1.7);
  card.boundingBox=new THREE.Box3(new THREE.Vector3(-.8,-.15,-1.5),new THREE.Vector3(.8,2.1,1.25));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/1.8);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false,ax:0,az:0,ayaw:0}));
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,h:height,legs,head:bones[t.slots.head],neck:bones[t.slots.neck],jaw:bones[t.slots.jaw],body:bones[t.slots.body],ears:t.slots.ears.map(i=>bones[i]),eyes:t.slots.eyes.map(i=>bones[i]),tail:t.slots.tail.map(i=>bones[i]),
    state:{phase:0,distance:0,speed:0,amount:0,run:0,time:0,seed,look:0,lookTo:0,nextLook:1.3+seed%2,hold:0,earTime:0,nextEar:1+seed%2,earSide:0,earEvent:0,blinkTime:0,nextBlink:2.3+seed%3,pet:0},q:new THREE.Quaternion(),bodyInverse:new THREE.Quaternion(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateCow3D(rig,0,0,1/60,0);return rig;
}
export function poseCowLeg(leg,tx,tz,lift,rig){
  const c=COW_GAIT;
  const yReach=c.hoof+lift+Math.sqrt(Math.max(.01,(c.upper+c.lower-.001)**2-tx*tx-tz*tz));
  const rootY=Math.min(c.hip,yReach);
  const y=rootY-c.hoof-lift;
  const distance=Math.min(c.upper+c.lower-.001,Math.hypot(tx,tz,y));
  let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
  const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi);
  const alpha=Math.atan2(horizontal,y);
  const delta=Math.acos(clamp((c.upper*c.upper+distance*distance-c.lower*c.lower)/(2*c.upper*distance),-1,1));
  const bend=Math.acos(clamp((distance*distance-c.upper*c.upper-c.lower*c.lower)/(2*c.upper*c.lower),-1,1));
  const sign=leg.z<0?1:-1;

  // Ensure body matrix is updated before we invert it
  rig.body.updateMatrix();

  leg.hip.matrixAutoUpdate = false;
  const rootMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(leg.x, rootY, leg.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(alpha-sign*delta, phi, 0, 'YXZ')),
    new THREE.Vector3(1,1,1)
  );
  leg.hip.matrix.copy(rig.body.matrix).invert().multiply(rootMatrix);

  leg.knee.matrixAutoUpdate = false;
  leg.knee.matrix.compose(
    new THREE.Vector3(0, -c.upper, 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(sign*bend, 0, 0, 'YXZ')),
    new THREE.Vector3(1,1,1)
  );

  leg.foot.matrixAutoUpdate = false;
  const footQ = leg.planted ? new THREE.Quaternion().setFromAxisAngle(UP, leg.ayaw-rig.model.rotation.y) : new THREE.Quaternion();
  // To keep foot aligned in root space, foot's local rotation must cancel hip and knee!
  const hipKneeRot = new THREE.Quaternion().setFromRotationMatrix(rootMatrix).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(sign*bend, 0, 0, 'YXZ')));
  leg.foot.matrix.compose(
    new THREE.Vector3(0, -c.lower, 0),
    hipKneeRot.invert().multiply(footQ),
    new THREE.Vector3(1,1,1)
  );
}
export function updateCow3D(r,dx,dz,dt,time,act='idle',hop=0){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,c=COW_GAIT;s.time+=dt;s.pet=Math.max(0,s.pet-dt);
  const distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;s.distance+=distance>1.5?0:distance;
  if (distance > 1.5) for (const l of r.legs) l.planted=false;
  s.speed=mix(s.speed,speed,ease(dt,10));s.run=mix(s.run,clamp((speed-1.1)/(c.run-1.1),0,1),ease(dt,6));
  s.amount=mix(s.amount,clamp(speed/.06,0,1),ease(dt,12));
  const stride=mix(c.stride,c.runStride,s.run),duty=mix(c.stance,c.runStance,s.run);
  s.phase=(s.phase+(distance>1.5?0:distance)/stride)%1;
  let yawDelta = 0;
  if(speed>.02){const targetYaw=Math.atan2(-dx,-dz),d=targetYaw-r.model.rotation.y;yawDelta=Math.atan2(Math.sin(d),Math.cos(d))*ease(dt,14);r.model.rotation.y+=yawDelta;}
  s.turnRatio = mix(s.turnRatio || 0, speed > 0.01 ? clamp((yawDelta/dt)/Math.max(speed, 0.5), -2, 2) : 0, ease(dt, 8));
  const sleeping=act==='sleeping'||act==='resting',quiet=sleeping?.12:1;
  r.body.scale.y=1+Math.sin(s.time*1.5+s.seed)*.007*quiet;
  r.body.rotation.y=s.turnRatio * 0.15 * s.amount;
  r.body.rotation.z=s.run > 0.5 ? Math.sin(s.phase*TAU)*.009*s.amount : Math.sin(s.phase*TAU)*.012*s.amount;
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),scale=r.model.scale.x;
  for(const l of r.legs){
    const effectivePhase = s.run > 0.5 ? l.phase : l.walkPhase;
    const legStride = stride * clamp(1 + l.x * s.turnRatio, 0.4, 1.6);
    const phase=(s.phase+effectivePhase)%1,step=duty*legStride/2;
    let z,lift=0;
    if(phase<duty){z=-step+phase/duty*2*step;
      if(!l.planted&&s.amount>.05){const rz=l.z+z*s.amount;l.ax=r.g.position.x+(l.x*cos+rz*sin)*scale;l.az=r.g.position.z+(rz*cos-l.x*sin)*scale;l.ayaw=yaw;l.planted=true;}
    }else{const u=(phase-duty)/(1-duty);z=step*Math.cos(u*Math.PI);lift=Math.sin(u*Math.PI)*mix(.075,.13,s.run)*s.amount;l.planted=false;}
    let tx=0,tz=z*s.amount;
    if(l.planted){const wx=(l.ax-r.g.position.x)/scale,wz=(l.az-r.g.position.z)/scale;tx=(wx*cos-wz*sin-l.x);tz=(wx*sin+wz*cos-l.z);}
    if(s.amount<.01){l.planted=false;tx=tz=lift=0;}
    // A very tight turn can pull a planted foot beyond its reach; release rather than stretch a leg.
    if(Math.hypot(tx,tz)>.34){const k=.34/Math.hypot(tx,tz);tx*=k;tz*=k;l.planted=false;}
    poseCowLeg(l,tx,tz,lift,r);
  }
  s.nextLook-=dt;s.hold=Math.max(0,s.hold-dt);
  if(s.nextLook<=0){s.lookTo=Math.sin(s.seed*2.1+s.time*1.3)*.48;s.hold=1.6;s.nextLook=4.5+2*(.5+.5*Math.sin(s.time+s.seed));}
  s.look=mix(s.look,(s.pet>0?.28:s.hold>0?s.lookTo:0)*quiet*(1-s.amount*.6),ease(dt,3.5));
  r.neck.rotation.y=s.look*.65;r.head.rotation.y=s.look*.35;
  r.neck.rotation.x=mix(r.neck.rotation.x,act==='eating'?-.95: sleeping?.11:.012*Math.sin(s.phase*TAU*2)*s.amount,ease(dt,5));
  r.neck.position.y=mix(r.neck.position.y,act==='eating'?.80:1.12,ease(dt,5));
  r.head.rotation.z=mix(r.head.rotation.z,s.pet>0?.08:s.look*.06,ease(dt,5));
  r.jaw.rotation.x=act==='eating'?(.03+.025*Math.sin(s.time*4)):0;
  s.nextEar-=dt;s.earTime=Math.max(0,s.earTime-dt);
  if(s.nextEar<=0){s.earSide=++s.earEvent%2;s.earTime=.65;s.nextEar=2.5+3*(.5+.5*Math.sin(s.seed*1.7+s.time));}
  const flick=s.earTime>0?Math.sin((1-s.earTime/.65)*Math.PI)**2*.42*quiet:0;
  for(let i=0;i<2;i++){const side=i===0?-1:1;r.ears[i].rotation.z=mix(r.ears[i].rotation.z,(i===s.earSide?side*flick:-side*flick*.15),ease(dt,22));r.ears[i].rotation.y=-side*s.look*.18;}
  s.nextBlink-=dt;s.blinkTime=Math.max(0,s.blinkTime-dt);
  if(s.nextBlink<=0){s.blinkTime=.20;s.nextBlink=3+2*(.5+.5*Math.sin(s.seed+s.time));}
  const shut=s.blinkTime>0?Math.sin((1-s.blinkTime/.20)*Math.PI):0;for(const eye of r.eyes)eye.scale.y=sleeping?.18:1-shut*.90;
  for(let i=0;i<3;i++){r.tail[i].rotation.z=Math.sin(s.time*.9+s.seed-i*.5)*(.12+i*.04)*quiet;r.tail[i].rotation.x=.08+Math.sin(s.time*.7-i*.3)*.04;}
  r.model.position.y=hop>0?Math.sin((1-hop)*Math.PI)*r.h*.18:0;
}
