import * as THREE from './lib/three.module.min.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const templates=new Map();
function build(spec){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}],slots={legs:[],tail:[]};
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  slots.body=bone('body',0,[0,spec.bodyY,0]);
  slots.neck=bone('neck',slots.body,[0,spec.neck[1],spec.neck[2]]);
  slots.head=bone('head',slots.neck,spec.head);
  for(const [x,z,phase]of spec.feet){
    const hip=bone('hip'+slots.legs.length,slots.body,[x,spec.hip-spec.bodyY,z]);
    const knee=bone('knee'+slots.legs.length,hip,[0,-spec.upper,0]);
    const foot=bone('hoof'+slots.legs.length,knee,[0,-spec.lower,0]);
    slots.legs.push({hip,knee,foot,x,z,phase});
  }
  let parent=slots.body;
  for(let i=0;i<spec.tail;i++){const b=bone('tail'+i,parent,[0,i?-spec.tailDrop:.16,i?.08:spec.tailZ]);slots.tail.push(b);parent=b;}
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],color=[],skin=[],weight=[];
  function add(geo,col,p,scale,b=0,rot){
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const o=rest[b],q=new THREE.Quaternion();if(rot)q.setFromEuler(new THREE.Euler(...rot));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),q,new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col);
    for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));color.push(c.r,c.g,c.b);skin.push(b,0,0,0);weight.push(1,0,0,0);}g.dispose();
  }
  const oval=(col,p,scale,b)=>add(new THREE.SphereGeometry(1,12,8),col,p,scale,b);
  const rod=(col,p,r,len,b)=>add(new THREE.CylinderGeometry(r,r*.7,len,8),col,p,[1,1,1],b);
  oval(spec.coat,[0,0,0],spec.body,slots.body);
  oval(spec.face,[0,0,0],spec.headSize,slots.head);
  if(spec.neckSize){
    const mid=[spec.head[0]*.45,spec.head[1]*.45,spec.head[2]*.45];
    const lean=[Math.atan2(spec.head[2],spec.head[1]||.001),0,0];
    add(new THREE.CylinderGeometry(1,1,1,8),spec.coat,mid,spec.neckSize,slots.neck,lean);
  }
  if(spec.ears){oval(spec.coat,spec.ears,spec.earSize,slots.head);oval(spec.coat,[-spec.ears[0],spec.ears[1],spec.ears[2]],spec.earSize,slots.head);}
  if(spec.muzzle)oval(spec.face,spec.muzzle,spec.muzzleSize,slots.head);
  for(const l of slots.legs){oval(spec.coat,[0,.05,0],[spec.upper*.55,spec.upper*.4,spec.upper*.5],l.hip);rod(spec.coat,[0,-spec.upper*.45,0],spec.upper*.22,spec.upper,l.hip);rod(spec.face,[0,-spec.lower*.45,0],spec.lower*.16,spec.lower,l.knee);}
  for(const b of slots.tail)rod(spec.face,[0,-.04,0],.02,.12,b);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry,material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9})};
}
export function createQuadruped(spec,height,x=0,z=0){
  let t=templates.get(spec.name);if(!t){t=build(spec);templates.set(spec.name,t);}
  const bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,t.material);card.add(bones[0]);card.bind(new THREE.Skeleton(bones));
  const g=new THREE.Group(),model=new THREE.Group();g.position.set(x,0,z);g.add(model);model.add(card);model.scale.setScalar(height/spec.height);
  const legs=t.slots.legs.map(l=>({...l,hip:bones[l.hip],knee:bones[l.knee],foot:bones[l.foot]}));
  const rig={g,model,card,body:bones[t.slots.body],neck:bones[t.slots.neck],head:bones[t.slots.head],tail:t.slots.tail.map(i=>bones[i]),legs,spec,state:{phase:0,amount:0},disposed:false};
  rig.dispose=()=>{if(!rig.disposed){card.skeleton.dispose();rig.disposed=true;}};
  updateQuadruped(rig,0,0,1/60);return rig;
}
export function updateQuadruped(r,dx,dz,dt,mode='walk'){
  if(!(dt>0))return;
  const s=r.state,distance=Math.hypot(dx,dz),speed=distance>1.5?0:distance/dt;
  s.amount=mode==='idle'?0:clamp(speed/.04,0,1);
  s.phase=(s.phase+(distance>1.5?0:distance)/r.spec.stride)%1;
  const step=mode==='run'?r.spec.step*1.35:r.spec.step;
  for(const l of r.legs){
    const phase=(s.phase+l.phase)%1;
    const z=phase<.55?-step+phase/.55*2*step:step*Math.cos((phase-.55)/.45*Math.PI);
    const lift=phase<.55?0:Math.sin((phase-.55)/.45*Math.PI)*r.spec.lift*s.amount;
    const y=r.spec.hip-r.spec.hoof-lift,dist=Math.min(r.spec.upper+r.spec.lower-.001,Math.hypot(z*s.amount,y));
    const alpha=Math.atan2(z*s.amount,y);
    const delta=Math.acos(clamp((r.spec.upper**2+dist*dist-r.spec.lower**2)/(2*r.spec.upper*dist),-1,1));
    const bend=Math.acos(clamp((dist*dist-r.spec.upper**2-r.spec.lower**2)/(2*r.spec.upper*r.spec.lower),-1,1));
    l.hip.rotation.set(alpha-(l.z<0?1:-1)*delta,0,0);l.knee.rotation.x=(l.z<0?1:-1)*bend;
    if(!Number.isFinite(l.knee.rotation.x))throw new Error('joint not finite');
  }
  r.neck.rotation.x=Math.sin(s.phase*6.28)*.04*s.amount;
  for(let i=0;i<r.tail.length;i++)r.tail[i].rotation.z=Math.sin(s.phase*6.28+i)*.12;
}
export const HORSE={name:'horse',height:1.6,bodyY:1.05,hip:.92,upper:.38,lower:.4,hoof:.06,stride:1.2,step:.16,lift:.06,neck:[0,.4,-.72],head:[0,.28,-.36],tail:3,tailZ:.62,tailDrop:.08,coat:0x8a5a32,face:0xe0b070,body:[.28,.32,.7],headSize:[.2,.24,.36],neckSize:[.13,.46,.13],ears:[.08,.22,-.04],earSize:[.045,.14,.045],muzzle:[0,-.02,-.3],muzzleSize:[.1,.09,.16],feet:[[-.14,-.48,0],[.14,-.48,.5],[-.14,.42,.5],[.14,.42,0]]};
export const DOG={name:'dog',height:.55,bodyY:.38,hip:.3,upper:.12,lower:.12,hoof:.03,stride:.45,step:.06,lift:.03,neck:[0,.08,-.24],head:[0,.04,-.1],tail:2,tailZ:.28,tailDrop:.02,coat:0xc4a574,face:0x3a2a1c,body:[.12,.12,.28],headSize:[.08,.08,.1],feet:[[-.07,-.16,0],[.07,-.16,.5],[-.07,.14,.5],[.07,.14,0]]};
export const CAT={name:'cat',height:.4,bodyY:.28,hip:.22,upper:.08,lower:.08,hoof:.02,stride:.36,step:.045,lift:.02,neck:[0,.05,-.18],head:[0,.03,-.08],tail:3,tailZ:.22,tailDrop:.015,coat:0xb7b7b7,face:0x6d6d6d,body:[.09,.09,.22],headSize:[.07,.07,.08],feet:[[-.05,-.12,0],[.05,-.12,.5],[-.05,.1,.5],[.05,.1,0]]};
