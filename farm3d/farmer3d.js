import * as THREE from './lib/three.module.min.js';
// The farmer (and the visiting villagers): one skinned body for the skin (head, neck, ears, nose, hands) on a small
// skeleton, with the wardrobe (clothes, hair, hats, face) as meshes riding on the bones. Faces -z, about 2 m tall
// with the hat, chunky cartoon proportions to match the classic farmer. Every rig gets its own materials.
let template;
function build(){
  const defs=[{name:'root',parent:-1,p:[0,0,0]}];
  const bone=(name,parent,p)=>{const i=defs.length;defs.push({name,parent,p});return i;};
  const body=bone('body',0,[0,.8,0]),chest=bone('chest',body,[0,0,0]),neck=bone('neck',chest,[0,.8,0]),head=bone('head',neck,[0,.18,0]);
  const slots={body,chest,neck,head,arms:[],elbows:[],legs:[],knees:[]};
  for(const sd of[-1,1]){const a=bone('arm'+sd,chest,[sd*.26,.7,0]);slots.arms.push(a);slots.elbows.push(bone('elbow'+sd,a,[0,-.28,0]));}
  for(const sd of[-1,1]){const l=bone('leg'+sd,body,[sd*.11,0,0]);slots.legs.push(l);slots.knees.push(bone('knee'+sd,l,[0,-.36,0]));}
  const rest=defs.map((b,i)=>{const p=new THREE.Vector3(...b.p);let j=defs[i].parent;while(j>=0){p.add(new THREE.Vector3(...defs[j].p));j=defs[j].parent;}return p;});
  const pos=[],norm=[],skin=[],weight=[];
  function add(geo,p,scale,b){const g=geo.toNonIndexed();geo.dispose();const o=rest[b];g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(p[0]+o.x,p[1]+o.y,p[2]+o.z),new THREE.Quaternion(),new THREE.Vector3(...scale)));const a=g.attributes.position,n=g.attributes.normal;for(let i=0;i<a.count;i++){pos.push(a.getX(i),a.getY(i),a.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));skin.push(b,0,0,0);weight.push(1,0,0,0);}g.dispose();}
  add(new THREE.SphereGeometry(.19,20,16),[0,0,0],[1,1,1],head);
  add(new THREE.CylinderGeometry(.07,.08,.14,10),[0,-.12,0],[1,1,1],head);
  for(const sd of[-1,1])add(new THREE.SphereGeometry(.045,8,6),[sd*.185,0,.01],[.55,1,.8],head); // ears
  add(new THREE.SphereGeometry(.035,8,6),[0,-.015,-.19],[1,.85,1],head); // nose
  for(const e of slots.elbows)add(new THREE.SphereGeometry(.068,10,8),[0,-.3,0],[1,1.1,1],e); // hands
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skin,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weight,4));
  return {defs,slots,geometry};
}
export function createFarmer3D(options={}){
  template ||= build();const t=template,bones=t.defs.map(d=>{const b=new THREE.Bone();b.name=d.name;b.position.set(...d.p);return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const look=options.look||{},mats=new Map(),extras=[];
  const mat=(color,rough=.82)=>{const k=color+'/'+rough;if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:rough}));return mats.get(k);};
  const card=new THREE.SkinnedMesh(t.geometry,mat(look.skin??0xf0c6a0,.7));card.add(bones[0]);card.bind(new THREE.Skeleton(bones));card.castShadow=true;card.frustumCulled=false;
  const B=i=>bones[i],head=B(t.slots.head),chest=B(t.slots.chest);
  const part=(geo,color,parent,p,rot,rough)=>{const m=new THREE.Mesh(geo,typeof color==='number'?mat(color,rough):color);m.position.set(...p);if(rot)m.rotation.set(...rot);m.castShadow=true;parent.add(m);extras.push(m);return m;};
  const skinC=look.skin??0xf0c6a0,shirt=look.shirt??0x5ea64a,hairC=look.hairColor??0x6b4127,boot=look.boots??0x4a3222,over=look.overalls!==false;
  const denim=over?(look.overallColor??0x3d6fa8):0x8b7355,dark=0x2a1c12;
  // legs: thigh on the hip bone, shin and boot on the knee
  for(let i=0;i<2;i++){part(new THREE.CylinderGeometry(.085,.08,.38,10),denim,B(t.slots.legs[i]),[0,-.19,0]);const k=B(t.slots.knees[i]);part(new THREE.CylinderGeometry(.08,.075,.36,10),denim,k,[0,-.17,0]);
    part(new THREE.BoxGeometry(.16,.11,.28),boot,k,[0,-.38,-.05],null,.6);part(new THREE.BoxGeometry(.165,.03,.29),dark,k,[0,-.43,-.05],null,.9);}
  // torso: trousers or overalls below, shirt above, bib and straps or a belt
  part(new THREE.CylinderGeometry(.2,.19,.5,16),over?denim:shirt,chest,[0,.23,0]);
  part(new THREE.CylinderGeometry(.2,.2,.3,16),shirt,chest,[0,.6,0]);
  part(new THREE.SphereGeometry(.2,16,8,0,Math.PI*2,0,Math.PI/2),shirt,chest,[0,.74,0],null).scale.y=.45; // round shoulders
  if(over){part(new THREE.BoxGeometry(.3,.24,.05),denim,chest,[0,.55,-.19]);part(new THREE.BoxGeometry(.12,.08,.02),denim,chest,[0,.54,-.22]); // bib and pocket
    for(const sd of[-1,1]){part(new THREE.BoxGeometry(.05,.32,.42),denim,chest,[sd*.1,.63,0]);part(new THREE.CylinderGeometry(.022,.022,.012,8),0xd9b56a,chest,[sd*.1,.66,-.215],[Math.PI/2,0,0],.4);}}
  else{part(new THREE.CylinderGeometry(.205,.205,.06,16),dark,chest,[0,.02,0],null,.6);part(new THREE.BoxGeometry(.07,.05,.02),0xd9b56a,chest,[0,.02,-.205],null,.4);
    part(new THREE.CylinderGeometry(.203,.2,.2,16),shirt,chest,[0,.13,0]);}
  // arms: sleeve to the elbow, forearm sleeve, cuff (the hands are skin, on the body)
  for(let i=0;i<2;i++){part(new THREE.SphereGeometry(.075,10,8),shirt,B(t.slots.arms[i]),[0,0,0]);part(new THREE.CylinderGeometry(.066,.06,.3,10),shirt,B(t.slots.arms[i]),[0,-.14,0]);
    const e=B(t.slots.elbows[i]);part(new THREE.CylinderGeometry(.058,.052,.22,10),shirt,e,[0,-.11,0]);part(new THREE.CylinderGeometry(.06,.06,.04,10),0xf1e6cf,e,[0,-.22,0]);}
  // face: eyes with a highlight, brows in the hair colour, a smile and rosy cheeks
  for(const sd of[-1,1]){part(new THREE.SphereGeometry(.036,10,8),0xffffff,head,[sd*.068,.03,-.163],null,.4).scale.set(1,1.2,.5); // whites, so the eyes read on every skin tone
    part(new THREE.SphereGeometry(.024,10,8),dark,head,[sd*.068,.028,-.172],null,.35).scale.set(1,1.25,.6);part(new THREE.SphereGeometry(.009,6,4),0xffffff,head,[sd*.068+.008,.042,-.188],null,.2);
    part(new THREE.BoxGeometry(.05,.012,.012),hairC,head,[sd*.068,.072,-.18],[0,0,sd*-.12]);part(new THREE.SphereGeometry(.03,8,6),0xe88f8f,head,[sd*.11,-.03,-.15],null,.9).scale.set(1,.6,.35);}
  part(new THREE.TorusGeometry(.045,.009,5,12,Math.PI),dark,head,[0,-.065,-.176],[0,0,Math.PI]);
  // hair (from the wardrobe: short, long, pony, bun, curly, buzz, bob, braids)
  const hair=look.hair||'short',cap=(r,y,sy,back=0,cut=.56)=>part(new THREE.SphereGeometry(r,18,12,0,Math.PI*2,0,Math.PI*cut),hairC,head,[0,y,back]).scale.set(1,sy,1);
  if(hair==='buzz')cap(.196,.005,1,0,.36);
  else if(hair==='curly'){for(let k=0;k<14;k++){const a=k/14*Math.PI*2;part(new THREE.SphereGeometry(.07,8,6),hairC,head,[Math.cos(a)*.16,.1+(k%2)*.04,Math.sin(a)*.144+.02]);}part(new THREE.SphereGeometry(.1,10,8),hairC,head,[0,.17,.02]);}
  else{cap(.205,.01,1.05,.01,.36);part(new THREE.SphereGeometry(.205,16,10,Math.PI*.15,Math.PI*.7,Math.PI*.3,Math.PI*.42),hairC,head,[0,0,.01]); // hairline above the brows; the back of the head (+z) lower
    if(hair==='long')part(new THREE.BoxGeometry(.36,.42,.1),hairC,head,[0,-.16,.12]);
    else if(hair==='bob')part(new THREE.CylinderGeometry(.215,.22,.2,16,1,true),hairC,head,[0,-.04,.01]).material.side=THREE.DoubleSide;
    else if(hair==='pony'){part(new THREE.SphereGeometry(.04,8,6),hairC,head,[0,.04,.2]);part(new THREE.CylinderGeometry(.05,.03,.36,8),hairC,head,[0,-.1,.23],[-.35,0,0]);}
    else if(hair==='bun')part(new THREE.SphereGeometry(.09,10,8),hairC,head,[0,.14,.17]);
    else if(hair==='braids')for(const sd of[-1,1]){part(new THREE.CylinderGeometry(.035,.025,.4,8),hairC,head,[sd*.16,-.24,-.02],[0,0,sd*.12]);part(new THREE.SphereGeometry(.03,6,4),shirt,head,[sd*.185,-.44,-.02]);}
    else part(new THREE.SphereGeometry(.07,8,6),hairC,head,[.05,.16,-.15]).scale.set(1.6,.6,.8); // short: a little fringe
  }
  // hats (straw, cap, beanie, cowboy, flower crown; "none" is none)
  const hat=look.hat||'none',band=look.hatColor??shirt;
  if(hat==='straw'){part(new THREE.CylinderGeometry(.37,.39,.03,22),0xe8c86a,head,[0,.12,0],null,.9);part(new THREE.CylinderGeometry(.17,.2,.17,16),0xe8c86a,head,[0,.21,0],null,.9);part(new THREE.TorusGeometry(.195,.02,6,20),band,head,[0,.16,0],[Math.PI/2,0,0]);}
  else if(hat==='cap'){part(new THREE.SphereGeometry(.21,16,10,0,Math.PI*2,0,Math.PI/2),band,head,[0,.06,0]);part(new THREE.CylinderGeometry(.16,.16,.02,16,1,false,0,Math.PI),band,head,[0,.07,-.12],[0,Math.PI/2,0]).scale.set(1,1,1.2);part(new THREE.SphereGeometry(.02,6,4),band,head,[0,.27,0]);}
  else if(hat==='beanie'){part(new THREE.SphereGeometry(.215,16,10,0,Math.PI*2,0,Math.PI*.55),band,head,[0,.04,0],null,.95);part(new THREE.CylinderGeometry(.215,.215,.07,16),0xf1e6cf,head,[0,.03,0],null,.95);part(new THREE.SphereGeometry(.05,8,6),0xf1e6cf,head,[0,.26,0],null,.95);}
  else if(hat==='cowboy'){const br=part(new THREE.CylinderGeometry(.42,.42,.03,24),0x7a4b28,head,[0,.1,0],null,.7);br.scale.set(1,1,.85);
    for(const sd of[-1,1])part(new THREE.BoxGeometry(.12,.03,.5),0x7a4b28,head,[sd*.38,.15,0],[0,0,sd*-.5],.7);
    part(new THREE.CylinderGeometry(.16,.2,.22,16),0x7a4b28,head,[0,.22,0],null,.7);part(new THREE.TorusGeometry(.19,.018,6,20),dark,head,[0,.13,0],[Math.PI/2,0,0]);}
  else if(hat==='flowers'){const fc=[0xf28bb5,0xffe066,0xffffff,0xb48cf2,0xff9a5a];for(let k=0;k<12;k++){const a=k/12*Math.PI*2;part(new THREE.SphereGeometry(.045,8,6),fc[k%fc.length],head,[Math.cos(a)*.19,.1,Math.sin(a)*.19]);}
    part(new THREE.TorusGeometry(.19,.015,6,24),0x5ea64a,head,[0,.09,0],[Math.PI/2,0,0]);}
  else if(hat!=='none')part(new THREE.CylinderGeometry(.16,.18,.06,8),band,head,[0,.18,0]); // an unknown hat from a newer save: still a hat
  const g=new THREE.Group(),model=new THREE.Group();g.add(model);model.add(card);model.scale.setScalar(options.scale||1);
  const rig={g,model,card,body:B(t.slots.body),chest,head,arms:t.slots.arms.map(B),elbows:t.slots.elbows.map(B),legs:t.slots.legs.map(B),knees:t.slots.knees.map(B),look,hair,hat,extras,state:{phase:0,amount:0,t:0},disposed:false};
  rig.dispose=()=>{if(rig.disposed)return;for(const m of extras)m.geometry.dispose();for(const m of mats.values())m.dispose();card.skeleton.dispose();rig.disposed=true;};
  updateFarmer3D(rig,0,0,1/60);return rig;
}
// Walking from the real distance moved: legs swing opposite the arms, the swinging leg bends at the knee, the shoulders
// twist against the hips and the body bobs on each footfall. Starts and stops ease, so nothing snaps. Standing still,
// the farmer breathes, looks about and now and then waves.
export function updateFarmer3D(r,dx,dz,dt,act='idle'){
  if(!(dt>0))return;const s=r.state,distance=Math.hypot(dx,dz),moved=distance>1.5?0:distance,speed=moved/dt;
  s.t+=dt;s.phase=(s.phase+moved/1.4)%1;
  const target=act==='idle'?0:THREE.MathUtils.smoothstep(speed,.05,1.2),run=THREE.MathUtils.smoothstep(speed,2.6,4.5);
  s.amount+=(target-s.amount)*Math.min(1,dt*12);const a=s.amount,c=s.phase*Math.PI*2,sn=Math.sin(c),cs=Math.cos(c);
  const hip=THREE.MathUtils.lerp(.42,.72,run)*a,kneeBend=THREE.MathUtils.lerp(.55,1.25,run)*a;
  for(let i=0;i<2;i++){const sd=i?-1:1,swing=sn*sd,fwd=cs*sd;
    r.legs[i].rotation.x=swing*hip+run*.12*a;r.knees[i].rotation.x=-(Math.max(0,fwd)*kneeBend+(.08+.25*run)*a);
    r.arms[i].rotation.set(-swing*THREE.MathUtils.lerp(.5,.85,run)*a+run*.35*a,0,(i?1:-1)*(.06+run*.12*a));r.elbows[i].rotation.x=(.15+.6*run)*a+.1;}
  const idle=1-a,breathe=Math.sin(s.t*1.8);
  r.chest.rotation.set(-THREE.MathUtils.lerp(.04,.2,run)*a,sn*THREE.MathUtils.lerp(.1,.16,run)*a,sn*.025*a*(1-run));
  r.body.position.y=.8+Math.abs(cs)*.035*a-.017*a+breathe*.004*idle;r.body.position.x=sn*.02*a*(1-run);
  r.head.rotation.set(Math.sin(s.t*.7)*.04*idle,-r.chest.rotation.y*.8+Math.sin(s.t*.4)*.45*idle,0);
  for(let i=0;i<2;i++)r.arms[i].rotation.x+=Math.sin(s.t*1.3+i)*.04*idle;
  const wave=Math.sin(s.t*.35)>.985?Math.sin(s.t*14)*.5:0;
  if(wave&&idle>.9){r.arms[1].rotation.z=2.3*idle-wave;r.elbows[1].rotation.x=.4;}
  if(act==='interact'){r.arms[1].rotation.set(1.1,0,0);r.elbows[1].rotation.x=.3;} // reach forward (-z)
  if(!Number.isFinite(r.legs[0].rotation.x)||!Number.isFinite(r.body.position.y))throw new Error('farmer joint');
}
export function createVillager3D(look={}){return createFarmer3D({scale:look.scale||1, look:look.look||{shirt:look.tint||0xffffff, overalls:false, hat:'none'}});}
