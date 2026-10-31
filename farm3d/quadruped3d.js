import * as THREE from './lib/three.module.min.js';
// Baked shading (vertex colours only, no extra draw/texture): darker toward the hooves and
// belly (cheap ambient occlusion) and a slight sky-lit lift on upward faces (soft rim/top light).
// Vertices on bones in 'skip' (head, ears, upper legs) keep their exact authored colours, which tests key on.
function bakeShade(pos,norm,color,skin=null,skip=null){
  let lo=Infinity,hi=-Infinity;for(let i=1;i<pos.length;i+=3){lo=Math.min(lo,pos[i]);hi=Math.max(hi,pos[i]);}
  const span=Math.max(hi-lo,1e-6);
  for(let i=0;i<pos.length;i+=3){
    if(skip&&skip.has(skin[i/3*4]))continue;
    const h=(pos[i+1]-lo)/span,ny=norm[i+1],t=Math.min(1,h/.55);
    const ao=(.74+.26*t*t*(3-2*t))*(ny<0?1-.2*-ny:1),sky=1+.07*Math.max(ny,0);
    for(let k=0;k<3;k++)color[i+k]=Math.min(1,color[i+k]*ao*sky);
  }
}

// Walk mode aims from the screen centre every 120 ms. Three.js raycasts a skinned mesh by skinning every
// vertex on the CPU (about 10k triangles per cow), which hitched first person whenever an animal was
// under the crosshair, e.g. walking past the cow barn. Screen picks (setFromCamera) use the posed local
// bounds instead; geometric probes without a camera keep the exact skinned-triangle raycast.
const pickRay=new THREE.Ray(),pickInverse=new THREE.Matrix4(),pickPoint=new THREE.Vector3();
function boundsRaycast(raycaster,hits){if(!raycaster.camera)return THREE.SkinnedMesh.prototype.raycast.call(this,raycaster,hits);const box=this.boundingBox||(this.geometry.boundingBox||(this.geometry.computeBoundingBox(),this.geometry.boundingBox));if(!this.material||!box)return;pickInverse.copy(this.matrixWorld).invert();pickRay.copy(raycaster.ray).applyMatrix4(pickInverse);if(!pickRay.intersectBox(box,pickPoint))return;pickPoint.applyMatrix4(this.matrixWorld);const distance=raycaster.ray.origin.distanceTo(pickPoint);if(distance>=raycaster.near&&distance<=raycaster.far)hits.push({distance,point:pickPoint.clone(),object:this});}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const templates=new Map();
function build(spec){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[],tail:[],ears:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,spec.bodyY,0]);
  slots.neck=bone('neck',slots.body,[0,spec.neck[1],spec.neck[2]]);
  slots.head=bone('head',slots.neck,spec.head);
  for(const side of [-1,1])slots.ears.push(bone('ear'+side,slots.head,[side*spec.headSize[0]*.8,spec.headSize[1]*.8,0]));
  for(const [x,z,phase]of spec.feet){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,spec.hip-spec.bodyY,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-spec.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-spec.lower,0]);
    slots.legs.push({hip,knee,foot,x,z,phase});
  }
  let parent=slots.body;
  for(let i=0;i<spec.tail;i++){const b=bone('tail'+i,parent,[0,i?-spec.tailDrop:spec.name==='horse'?.12:.03,i?.08:spec.tailZ]);slots.tail.push(b);parent=b;}
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  function add(geo,col,p,scale,b=0,q=new THREE.Quaternion(),bodyBlend=null){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),q,new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);
    for(let i=0;i<a.count;i++){
      pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);
      // Binary fractions retain an exact sum of one in the Float32 skin buffer.
      if(bodyBlend){const w=Math.round(bodyBlend(a.getY(i)-o.y)*256)/256;skin.push(b,slots.body,0,0);weight.push(1-w,w,0,0);}
      else{skin.push(b,0,0,0);weight.push(1,0,0,0);}
    }g.dispose();
  }
  // Spend silhouette detail on the torso/head, not tiny pupils and joint caps.
  const oval=(col,p,scale,b,detail=8,rows=6)=>add(new THREE.SphereGeometry(1,detail,rows),col,p,scale,b);
  const rod=(col,p,r,len,b)=>add(new THREE.CylinderGeometry(r,r*.7,len,8),col,p,[1,1,1],b);
  const link=(col,from,to,r,b)=>{
    const a=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(a);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    add(new THREE.CylinderGeometry(r*.85,r,delta.length(),10),col,a.add(end).multiplyScalar(.5).toArray(),[1,1,1],b,q);
    oval(col,from,[r,r,r],b,6,4);oval(col,to,[r*.85,r*.85,r*.85],b,6,4);
  };
  const fineLine=(col,from,to,r,b)=>{
    const a=new THREE.Vector3(...from),end=new THREE.Vector3(...to),delta=end.clone().sub(a);
    const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
    add(new THREE.CylinderGeometry(r,r,delta.length(),6),col,a.add(end).multiplyScalar(.5).toArray(),[1,1,1],b,q);
  };
  function catUpperLeg(l){
    // One continuous surface. Its top follows the body through the existing
    // adaptive hip motion; the lower portion follows the unchanged leg bones.
    const rings=[[.085,.014,.017],[.035,.026,.030],[-.015,.019,.021],[-spec.upper*.8,.013,.014],[-spec.upper,.011,.011]];
    const vertices=[],indices=[],sides=8;
    for(const [y,rx,rz]of rings)for(let k=0;k<sides;k++){const a=k*Math.PI*2/sides;vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz);}
    for(let j=0;j<rings.length-1;j++)for(let k=0;k<sides;k++){
      const a=j*sides+k,b=j*sides+(k+1)%sides,c=(j+1)*sides+k,d=(j+1)*sides+(k+1)%sides;indices.push(a,b,c,b,d,c);
    }
    const top=vertices.length/3;vertices.push(0,rings[0][0],0);const bottom=vertices.length/3;vertices.push(0,rings.at(-1)[0],0);
    for(let k=0;k<sides;k++){indices.push(top,(k+1)%sides,k);const last=(rings.length-1)*sides;indices.push(bottom,last+k,last+(k+1)%sides);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
    add(geometry,spec.coat,[0,0,0],[1,1,1],l.hip,new THREE.Quaternion(),y=>clamp((y-.005)/.07,0,1));
  }
  oval(spec.coat,[0,0,0],spec.body,slots.body,24,14);
  // The head bone is a pivot, not a visible neck. Fill the entire shoulder-to-head span.
  link(spec.coat,[0,-spec.neck[1]*.8,-spec.neck[2]*.22],spec.head,spec.headSize[0]*.8,slots.neck);
  oval(spec.coat,[0,0,0],spec.name==='cat'?[spec.headSize[0]*.94,spec.headSize[1]*.85,spec.headSize[2]*.78]:spec.headSize,slots.head,20,12);
  const [hx,hy,hz]=spec.headSize;
  if(spec.name==='dog'){
    // A forward muzzle, lower jaw and one canine nose replace the paired dots.
    // Every surface stays on the existing head bone; the rig/gait are unchanged.
    oval(spec.muzzle,[0,-hy*.34,-hz*.98],[hx*.60,hy*.45,hz*.65],slots.head,12,8);
    oval(spec.muzzle,[0,-hy*.76,-hz*.93],[hx*.58,hy*.23,hz*.56],slots.head,12,8);
    oval(0x3c2920,[0,-hy*.59,-hz*1.01],[hx*.56,hy*.06,hz*.55],slots.head,12,8);
    oval(0x151515,[0,-hy*.25,-hz*1.70],[hx*.36,hy*.20,hz*.14],slots.head,12,8);
  }else if(spec.name==='cat'){
    // Short cheek pads and a small triangular nose give a feline face.
    for(const side of [-1,1])oval(spec.muzzle,[side*.019,-.025,-.068],[.026,.021,.026],slots.head,12,8);
    oval(spec.muzzle,[0,-.043,-.063],[.024,.012,.025],slots.head,12,8);
    const nose=new THREE.BufferGeometry();
    nose.setAttribute('position',new THREE.Float32BufferAttribute([-.009,-.012,-.091,.009,-.012,-.091,0,-.024,-.096,-.007,-.013,-.080,.007,-.013,-.080,0,-.022,-.083],3));
    nose.setIndex([0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0]);nose.computeVertexNormals();
    add(nose,0xd58d96,[0,0,0],[1,1,1],slots.head);
    fineLine(0x302d2b,[0,-.024,-.096],[0,-.031,-.094],.0007,slots.head);
    for(const side of [-1,1]){
      fineLine(0x302d2b,[0,-.031,-.094],[side*.012,-.038,-.089],.0007,slots.head);
      for(let j=-1;j<=1;j++)fineLine(0xf3eee3,[side*.032,-.022+j*.006,-.084],[side*.10,-.016+j*.01,-.075],.00065,slots.head);
    }
  }else{
    oval(spec.muzzle,[0,-hy*.42,-hz*.82],[hx*.85,hy*.56,hz*.6],slots.head,12,8);
  }
  for(const side of [-1,1]){
    if(spec.name==='cat'){
      const q=new THREE.Quaternion().setFromAxisAngle(THREE.Object3D.DEFAULT_UP,side*.45);
      add(new THREE.SphereGeometry(1,10,6),0x92ad53,[side*.043,.014,-.044],[.014,.012,.004],slots.head,q);
      add(new THREE.SphereGeometry(1,8,6),0x1d2417,[side*.045,.014,-.0483],[.003,.009,.003],slots.head,q);
      oval(0xffffff,[side*.044,.018,-.051],[.002,.002,.0015],slots.head,6,4);
    }else{
      if(spec.name!=='dog')oval(0x25221e,[side*hx*.42,-hy*.32,-hz*1.38],[hx*.15,hy*.1,hz*.04],slots.head);
      oval(0xf8f5e9,[side*hx*.91,hy*.24,-hz*.32],[hx*.17,hy*.18,hz*.14],slots.head);
      oval(0x211f1b,[side*hx*1.01,hy*.24,-hz*.39],[hx*.095,hy*.12,hz*.09],slots.head);
      oval(0xffffff,[side*hx*1.05,hy*.28,-hz*.45],[hx*.04,hy*.045,hz*.035],slots.head,6,4);
    }
    const ear=slots.ears[side===-1?0:1];
    if(spec.name==='dog'){
      oval(spec.face,[side*hx*.22,-hy*.32,0],[hx*.43,hy*.82,hz*.32],ear);
    }else if(spec.name==='cat'){
      add(new THREE.ConeGeometry(hx*.30,hy*.75,8),spec.coat,[side*.001,-.008,0],[1,1,1],ear);
      add(new THREE.ConeGeometry(hx*.18,hy*.52,8),0xdba0a6,[side*.001,-.006,-.010],[1,1,.35],ear);
    }else{
      add(new THREE.ConeGeometry(hx*.38,hy*.9,8),spec.coat,[side*hx*.1,hy*.28,0],[1,1,1],ear);
      add(new THREE.ConeGeometry(hx*.22,hy*.62,8),spec.muzzle,[side*hx*.1,hy*.28,-hx*.22],[1,1,.35],ear);
    }
  }
  if(spec.name==='horse'){
    // Mane follows the visible neck and a pale blaze makes the front readable at farm scale.
    link(spec.face,[0,-spec.neck[1]*.5,.07],[0,spec.head[1]+hy*.45,spec.head[2]+hz*.35],hx*.28,slots.neck);
    oval(0xeadbc0,[0,hy*.2,-hz*.94],[hx*.24,hy*.6,hz*.1],slots.head);
    oval(spec.face,[0,hy*.9,-hz*.28],[hx*.7,hy*.18,hz*.48],slots.head);
  }
  for(const l of slots.legs){
    if(spec.name==='cat')catUpperLeg(l);
    else{
      oval(spec.coat,[0,.05,0],[spec.upper*.5,spec.upper*.4,spec.upper*.45],l.hip);
      rod(spec.coat,[0,-spec.upper*.5,0],spec.upper*.19,spec.upper,l.hip);
    }
    oval(spec.coat,[0,0,0],[spec.lower*.17,spec.lower*.17,spec.lower*.17],l.knee);
    rod(spec.coat,[0,-spec.lower*.5,0],spec.lower*.14,spec.lower,l.knee);
    oval(spec.face,[0,-spec.hoof*.4,-spec.hoof*.55],[spec.hoof*.95,spec.hoof*.6,spec.hoof*1.4],l.foot);
  }
  for(let i=0;i<slots.tail.length;i++){
    const b=slots.tail[i],end=[0,-spec.tailDrop,.08];
    link(spec.face,[0,0,0],end,spec.name==='horse'?.032:spec.headSize[0]*.24,b);
    if(spec.name==='horse'&&i===slots.tail.length-1)oval(spec.face,[0,-spec.tailDrop,.08],[.06,.14,.055],b);
  }
  bakeShade(pos,norm,color,skin,new Set([slots.head,...(slots.ears||[]),...slots.legs.map(l=>l.hip)]));
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9})};
}
export function createQuadruped(spec,height,x=0,z=0){
  let t=templates.get(spec.name);if(!t){t=build(spec);templates.set(spec.name,t);}
  const bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
card.raycast=boundsRaycast;
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/spec.height);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot],planted:false,ax:0,az:0,ayaw:0}));
  for(const l of legs)l.hip.rotation.order='YXZ';
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],ears:t.slots.ears.map(i=>bones[i]),tail:t.slots.tail.map(i=>bones[i]),legs,spec,state:{phase:0,amount:0,time:0},q:new THREE.Quaternion(),disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateQuadruped(rig,0,0,1/60);return rig;
}
export function updateQuadruped(r,dx,dz,dt,mode='walk'){
  if(!(dt>0)||!Number.isFinite(dt))return;
  const s=r.state,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;
  s.amount=mode==='idle'?0:clamp(speed/.04,0,1);
  const stride=r.spec.stride*(mode==='run'?1.35:1),duty=mode==='run'?.45:.55,scale=r.model.scale.x;
  s.phase=(s.phase+(distance>1.5?0:distance)/scale/stride)%1;
  s.time+=dt;
  if(speed>.02){const yaw=Math.atan2(-dx,-dz),delta=yaw-r.model.rotation.y;r.model.rotation.y+=Math.atan2(Math.sin(delta),Math.cos(delta))*(1-Math.exp(-dt*12));}
  if(distance>1.5)for(const l of r.legs)l.planted=false;
  const yaw=r.model.rotation.y,cos=Math.cos(yaw),sin=Math.sin(yaw),step=stride*duty/2;
  for(const l of r.legs){
    const phase=(s.phase+l.phase)%1;
    const z=phase<duty?-step+phase/duty*2*step:step*Math.cos((phase-duty)/(1-duty)*Math.PI);
    const lift=phase<duty?0:Math.sin((phase-duty)/(1-duty)*Math.PI)*r.spec.lift*s.amount;
    if(phase<duty&&s.amount>.05){
      if(!l.planted){const rz=l.z+z;l.ax=r.g.position.x+(l.x*cos+rz*sin)*scale;l.az=r.g.position.z+(rz*cos-l.x*sin)*scale;l.ayaw=yaw;l.planted=true;}
    }else l.planted=false;
    let tx=0,tz=z*s.amount;
    if(l.planted){const wx=(l.ax-r.g.position.x)/scale,wz=(l.az-r.g.position.z)/scale;tx=wx*cos-wz*sin-l.x;tz=wx*sin+wz*cos-l.z;}
    if(s.amount<.01){l.planted=false;tx=tz=0;}
    const reach=(r.spec.upper+r.spec.lower)*.8,length=Math.hypot(tx,tz);
    if(length>reach){tx*=reach/length;tz*=reach/length;l.planted=false;}
    const rootY=Math.min(r.spec.hip,r.spec.hoof+lift+Math.sqrt(Math.max(0,(r.spec.upper+r.spec.lower-.001)**2-tx*tx-tz*tz)));
    l.hip.position.y=rootY-r.spec.bodyY;
    const y=rootY-r.spec.hoof-lift,dist=Math.min(r.spec.upper+r.spec.lower-.001,Math.hypot(tx,tz,y));
    let phi=Math.atan2(tx,tz);if(phi>Math.PI/2)phi-=Math.PI;if(phi<-Math.PI/2)phi+=Math.PI;
    const horizontal=Math.abs(tz)<1e-8?(Math.abs(tx)<1e-8?0:-tx/Math.sin(phi)):-tz/Math.cos(phi);
    const alpha=Math.atan2(horizontal,y);
    const delta=Math.acos(clamp((r.spec.upper**2+dist*dist-r.spec.lower**2)/(2*r.spec.upper*dist),-1,1));
    const bend=Math.acos(clamp((dist*dist-r.spec.upper**2-r.spec.lower**2)/(2*r.spec.upper*r.spec.lower),-1,1));
    l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,phi,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;
    l.foot.quaternion.copy(l.hip.quaternion).multiply(l.knee.quaternion).invert();
    if(l.planted)l.foot.quaternion.multiply(r.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,l.ayaw-yaw));
    if(!Number.isFinite(l.knee.rotation.x))throw new Error('joint not finite');
  }
  r.neck.rotation.x=Math.sin(s.phase*6.28)*.04*s.amount;
  r.head.rotation.y=Math.sin(s.time*.65)*.10*(1-s.amount);
  for(let i=0;i<r.ears.length;i++)r.ears[i].rotation.z=Math.sin(s.time*1.4+i*2.8)*.07;
  for(let i=0;i<r.tail.length;i++)r.tail[i].rotation.z=Math.sin(s.time*1.8+i)*.12;
}
export const HORSE={name:'horse',height:1.85,bodyY:1.05,hip:.84,upper:.38,lower:.4,hoof:.06,stride:1.2,step:.16,lift:.06,neck:[0,.28,-.55],head:[0,.16,-.18],tail:3,tailZ:.62,tailDrop:.19,coat:0x8a5a32,face:0x3b2415,muzzle:0xbaa087,body:[.28,.32,.7],headSize:[.15,.23,.27],feet:[[-.14,-.48,0],[.14,-.48,.5],[-.14,.42,.5],[.14,.42,0]]};
export const DOG={name:'dog',height:.55,bodyY:.38,hip:.27,upper:.12,lower:.12,hoof:.03,stride:.45,step:.06,lift:.03,neck:[0,.08,-.24],head:[0,.04,-.1],tail:2,tailZ:.24,tailDrop:-.045,coat:0xc4a574,face:0x3a2a1c,muzzle:0xead8b8,body:[.12,.12,.28],headSize:[.08,.08,.1],feet:[[-.07,-.16,0],[.07,-.16,.5],[-.07,.14,.5],[.07,.14,0]]};
export const CAT={name:'cat',height:.4,bodyY:.28,hip:.18,upper:.08,lower:.08,hoof:.02,stride:.36,step:.045,lift:.02,neck:[0,.05,-.18],head:[0,.03,-.08],tail:3,tailZ:.19,tailDrop:-.035,coat:0xb7b7b7,face:0x6d6d6d,muzzle:0xe4d4ce,body:[.09,.09,.22],headSize:[.07,.07,.08],feet:[[-.05,-.12,0],[.05,-.12,.5],[-.05,.1,.5],[.05,.1,0]]};
