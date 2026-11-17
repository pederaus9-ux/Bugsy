import * as THREE from './lib/three.module.min.js';

// One owned geometry and one shared material per character, including face and wardrobe.
// Rigid sections are weighted to joints; the hip/shoulder arrays retain the live callers' contract.
const material = new THREE.MeshStandardMaterial({vertexColors:true, roughness:.86});
const HIP=.82, SEGMENT=.35, ANKLE=.12;
const clamp=THREE.MathUtils.clamp;
function build(look) {
  const defs=[{name:'root',parent:-1,p:[0,0,0]}];
  const bone=(name,parent,p)=>{const i=defs.length; defs.push({name,parent,p}); return i;};
  const body=bone('body',0,[0,HIP,0]), torso=bone('torso',body,[0,0,0]);
  const neck=bone('neck',torso,[0,.72,0]), head=bone('head',neck,[0,.18,0]);
  const arms=[], elbows=[], legs=[], knees=[], feet=[];
  for(const sd of [-1,1]) {
    const arm=bone('shoulder'+sd,torso,[sd*.27,.61,0]); arms.push(arm);
    elbows.push(bone('elbow'+sd,arm,[0,-.26,0]));
    const leg=bone('hip'+sd,body,[sd*.11,0,0]); legs.push(leg);
    const knee=bone('knee'+sd,leg,[0,-SEGMENT,0]); knees.push(knee);
    feet.push(bone('ankle'+sd,knee,[0,-SEGMENT,0]));
  }
  const rest=defs.map((d,i)=>{const p=new THREE.Vector3(...d.p); let j=defs[i].parent; while(j>=0){p.add(new THREE.Vector3(...defs[j].p)); j=defs[j].parent;} return p;});
  const positions=[], normals=[], colors=[], indices=[], weights=[], parts=[];
  const add=(name,geo,col,b,p=[0,0,0],scale=[1,1,1],rotation=[0,0,0])=>{
    const g=geo.index?geo.toNonIndexed():geo;
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p).add(rest[b]),q,new THREE.Vector3(...scale)));
    const a=g.attributes.position,n=g.attributes.normal,c=new THREE.Color(col),start=positions.length/3;
    for(let i=0;i<a.count;i++) {
      positions.push(a.getX(i),a.getY(i),a.getZ(i)); normals.push(n.getX(i),n.getY(i),n.getZ(i));
      colors.push(c.r,c.g,c.b); indices.push(b,0,0,0); weights.push(1,0,0,0);
    }
    parts.push({name,bone:b,start,count:a.count,color:col});
    g.dispose(); if(g!==geo)geo.dispose();
  };
  const sphere=(name,col,b,p,scale,segments=10)=>add(name,new THREE.SphereGeometry(1,segments,8),col,b,p,scale);
  const box=(name,col,b,p,size,rotation)=>add(name,new THREE.BoxGeometry(...size),col,b,p,undefined,rotation);
  const cylinder=(name,col,b,p,top,bottom,h,rotation)=>add(name,new THREE.CylinderGeometry(top,bottom,h,10),col,b,p,undefined,rotation);
  const skin=look.skin??0xf0c6a0,shirt=look.shirt??0xd24d3f,hairColor=look.hairColor??0x6b4127;
  const over=look.overalls!==false,denim=over?look.overallColor??0x3d6fa8:0x8b7355;
  const dark=0x2a1c12,boot=look.boots??0x4a3222;
  sphere('shirt',shirt,torso,[0,.37,0],[.215,.32,.13]);
  sphere('trousers',denim,body,[0,.035,0],[.195,.14,.125]);
  if(over) {
    box('bib',denim,torso,[0,.34,-.126],[.26,.25,.026]);
    for(const sd of [-1,1]) {box('strap',denim,torso,[sd*.105,.55,-.115],[.038,.21,.035]); sphere('button',0xe8c86a,torso,[sd*.105,.435,-.15],[.016,.016,.008],6);}
    box('pocket',denim,torso,[0,.33,-.146],[.12,.075,.015]);
  } else box('belt',dark,body,[0,.08,-.12],[.32,.045,.027]);
  cylinder('neck',skin,neck,[0,.04,0],.07,.074,.14);
  sphere('face',skin,head,[0,0,0],[.18,.225,.16],16);
  for(const sd of [-1,1]) {
    sphere('ear',skin,head,[sd*.18,-.005,0],[.031,.052,.025],8);
    sphere('eye-white',0xfff9ed,head,[sd*.066,.026,-.151],[.036,.034,.014],10);
    sphere('eye',dark,head,[sd*.066,.026,-.166],[.016,.021,.007],8);
    sphere('eye-glint',0xffffff,head,[sd*.066-.004,.033,-.173],[.005,.006,.003],6);
    box('brow',hairColor,head,[sd*.066,.083,-.146],[.063,.014,.012],[0,0,sd*-.09]);
  }
  sphere('nose',skin,head,[0,-.012,-.168],[.027,.04,.04],10);
  add('mouth',new THREE.TorusGeometry(.046,.008,5,12,Math.PI),0x704037,head,[0,-.067,-.157],[1,1,1],[0,0,Math.PI]);
  for(let i=0;i<2;i++) {
    sphere('shoulder',shirt,arms[i],[0,-.045,0],[.08,.10,.09]);
    cylinder('sleeve',shirt,arms[i],[0,-.10,0],.071,.061,.20);
    cylinder('upper-arm',skin,arms[i],[0,-.23,0],.056,.049,.10);
    sphere('elbow',skin,elbows[i],[0,0,0],[.05,.05,.05],8);
    cylinder('forearm',skin,elbows[i],[0,-.115,0],.049,.039,.23);
    sphere('hand',skin,elbows[i],[0,-.26,-.008],[.048,.065,.037],8);
    sphere('hip',denim,legs[i],[0,-.025,0],[.095,.11,.09]);
    cylinder('thigh',denim,legs[i],[0,-.17,0],.092,.075,.34);
    sphere('knee',denim,knees[i],[0,0,0],[.075,.076,.075],8);
    cylinder('shin',denim,knees[i],[0,-.175,0],.074,.060,.35);
    box('boot',boot,feet[i],[0,-.051,-.039],[.145,.126,.245]);
    box('sole',dark,feet[i],[0,-.113,-.039],[.15,.014,.25]);
  }
  const hair=look.hair||'short',hat=look.hat||'none',covered=!['none','flowers'].includes(hat);
  // Hats tuck away the hair crown, leaving each style's sides/back. Buns sit below the rear brim.
  if(!covered)add('hair-cap',new THREE.SphereGeometry(hair==='buzz'?.183:.19,12,8,0,Math.PI*2,0,1.07),hairColor,head,[0,.055,0],[1,1.05,1]);
  if(hair==='short') {
    for(const sd of [-1,1])box('short-side',hairColor,head,[sd*.162,.065,.02],[.045,.10,.10]);
    if(!covered)sphere('quiff',hairColor,head,[-.035,.218,-.02],[.10,.045,.08]);
  } else if(hair==='long') {
    box('long-back',hairColor,head,[0,-.10,.139],[.31,.44,.08]);
    for(const sd of [-1,1])box('long-side',hairColor,head,[sd*.16,-.09,.055],[.062,.37,.13]);
  } else if(hair==='pony') {
    cylinder('ponytail',hairColor,head,[0,-.115,.225],.046,.026,.31,[-.32,0,0]);
    sphere('pony-tie',shirt,head,[0,.025,.19],[.048,.028,.032],8);
  } else if(hair==='bun') {
    sphere('bun',hairColor,head,[0,covered?.01:.14,.225],[.085,.082,.075]);
  } else if(hair==='curly') {
    for(let k=0;k<10;k++) {const a=k/10*Math.PI*2,front=Math.sin(a)<-.3; sphere('curl',hairColor,head,[Math.cos(a)*.155,covered?.06:(front?.16:.12),Math.sin(a)*.125+.015],[.054,covered?.043:.064,.049],8);}
    if(!covered)sphere('curl-top',hairColor,head,[0,.23,.02],[.105,.07,.09]);
  } else if(hair==='bob') {
    box('bob-back',hairColor,head,[0,-.025,.145],[.32,.23,.073]);
    for(const sd of [-1,1])sphere('bob-side',hairColor,head,[sd*.165,-.014,.04],[.046,.135,.11]);
  } else if(hair==='braids') {
    for(const sd of [-1,1]) {for(let k=0;k<6;k++)sphere('braid',hairColor,head,[sd*(.172+k*.004),-.05-k*.047,.047+(k%2)*.01],[.034,.036,.033],8); sphere('braid-tie',shirt,head,[sd*.192,-.31,.048],[.035,.018,.033],6);}
  }
  const straw=look.hatColor??0xe8c86a;
  if(hat==='straw') {
    cylinder('hat-brim',straw,head,[0,.17,0],.34,.35,.025);
    cylinder('hat-crown',straw,head,[0,.26,0],.165,.205,.17);
    cylinder('hat-band',shirt,head,[0,.205,0],.197,.202,.035);
  } else if(hat==='cap') {
    add('hat-cap',new THREE.SphereGeometry(.215,12,8,0,Math.PI*2,0,Math.PI/2),shirt,head,[0,.13,0],[1,.75,1]);
    sphere('hat-visor',shirt,head,[0,.136,-.22],[.19,.018,.16],12);
    box('hat-badge',0xf1e6cf,head,[0,.223,-.185],[.045,.045,.012]);
  } else if(hat==='beanie') {
    add('hat-beanie',new THREE.SphereGeometry(.218,12,8,0,Math.PI*2,0,Math.PI/2),shirt,head,[0,.115,0],[1,1.05,1]);
    add('hat-cuff',new THREE.CylinderGeometry(.226,.226,.063,16),0xf1e6cf,head,[0,.138,0]);
    sphere('hat-pom',0xf1e6cf,head,[0,.375,0],[.049,.049,.049],8);
  } else if(hat==='cowboy') {
    add('hat-brim',new THREE.CylinderGeometry(.34,.34,.027,16),0x7a4b28,head,[0,.17,0],[1,1,.85]);
    for(const sd of [-1,1])box('hat-upturn',0x7a4b28,head,[sd*.315,.195,0],[.14,.028,.45],[0,0,sd*.42]);
    sphere('hat-crown',0x7a4b28,head,[0,.285,0],[.18,.13,.155]);
    cylinder('hat-band',dark,head,[0,.207,0],.18,.195,.035);
  } else if(hat==='flowers') {
    add('hat-vine',new THREE.TorusGeometry(.205,.015,5,16),0x5ea64a,head,[0,.15,0],[1,1,1],[Math.PI/2,0,0]);
    const palette=[0xf28bb5,0xffe066,0xffffff,0xb48cf2,0xff9a5a];
    for(let k=0;k<10;k++) {const a=k/10*Math.PI*2; sphere('hat-flower',palette[k%5],head,[Math.cos(a)*.21,.16,Math.sin(a)*.21],[.037,.035,.037],8);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  return {defs,body,torso,neck,head,arms,elbows,legs,knees,feet,geometry,parts,hair,hat};
}

export function createFarmer3D(options={}) {
  const look={...(options.look||{})},t=build(look);
  const bones=t.defs.map(d=>{const b=new THREE.Bone(); b.name=d.name; b.position.set(...d.p); return b;});
  for(let i=1;i<bones.length;i++)bones[t.defs[i].parent].add(bones[i]);
  const card=new THREE.SkinnedMesh(t.geometry,material); card.add(bones[0]); card.bind(new THREE.Skeleton(bones));
  card.castShadow=card.receiveShadow=true;
  const g=new THREE.Group(),model=new THREE.Group(); g.add(model); model.add(card); model.scale.setScalar(options.scale||1);
  const map=a=>a.map(i=>bones[i]);
  const r={g,model,card,root:bones[0],body:bones[t.body],torso:bones[t.torso],neck:bones[t.neck],head:bones[t.head],arms:map(t.arms),elbows:map(t.elbows),legs:map(t.legs),knees:map(t.knees),feet:map(t.feet),look,hair:t.hair,hat:t.hat,parts:t.parts,extras:t.parts,state:{phase:0,amount:0,time:0,distance:0},disposed:false};
  let wardrobeMaterial=null;
  // The fitting view draws the farmer last, so foreground farm objects cannot cover the face.
  // This is local to this rig; villagers and the background retain their normal depth rendering.
  r.setWardrobe=on=>{
    if(r.disposed)return;
    if(on&&!wardrobeMaterial) {wardrobeMaterial=material.clone(); wardrobeMaterial.transparent=true;}
    card.material=on?wardrobeMaterial:material; card.renderOrder=on?100:0;
    if(!on&&wardrobeMaterial) {wardrobeMaterial.dispose(); wardrobeMaterial=null;}
  };
  card.onBeforeRender=renderer=>{if(wardrobeMaterial)renderer.clearDepth();};
  r.dispose=()=>{if(r.disposed)return; wardrobeMaterial?.dispose(); card.geometry.dispose(); card.skeleton.dispose(); r.disposed=true;};
  updateFarmer3D(r,0,0,1/60); return r;
}

export function updateFarmer3D(r,dx,dz,dt,act='idle',motion) {
  if(r.disposed||!(dt>0)||![dx,dz,dt].every(Number.isFinite))return;
  const s=r.state,distance=Math.hypot(dx,dz),travel=distance>1.5?0:distance;
  const speed=travel/dt,run=clamp(motion?.run??(speed-3.6)/1.8,0,1);
  const moving=act!=='idle'&&travel>0;
  s.time+=dt; s.amount+=((moving?1:0)-s.amount)*(1-Math.exp(-dt*16)); s.distance+=travel;
  if(s.amount<1e-8)s.amount=0;
  const cycle=1.44+.66*run;
  if(moving)s.phase=Number.isFinite(motion?.phase)?((motion.phase%1)+1)%1:(s.phase+travel/cycle)%1;
  const amount=s.amount;
  r.root.position.y=-(.12+.04*run)*amount;
  // Stance travels backwards at the character's forward speed. A two-link solve reaches
  // the ground target and the ankle counter-rotates to keep the boot flat.
  for(let i=0;i<2;i++) {
    const phase=(s.phase+i*.5)%1,duty=.5-.1*run,planted=phase<duty;
    const u=planted?phase/duty:(phase-duty)/(1-duty),span=cycle*duty/2;
    const z=(planted?-span+2*span*u:span*Math.cos(Math.PI*u))*amount;
    const lift=planted?0:Math.sin(Math.PI*u)*(.10+.06*run)*amount;
    const vertical=HIP+r.root.position.y-ANKLE-lift;
    const reach=Math.min(2*SEGMENT,Math.hypot(vertical,z));
    const knee=-2*Math.acos(clamp(reach/(2*SEGMENT),0,1));
    const hip=Math.atan2(-z,vertical)-knee/2;
    r.legs[i].rotation.x=hip; r.knees[i].rotation.x=knee; r.feet[i].rotation.x=-hip-knee;
    r.feet[i].userData.planted=planted&&moving;
    const swing=Math.sin((s.phase+i*.5)*Math.PI*2);
    r.arms[i].rotation.set(-swing*(.42+.25*run)*amount,0,(i?1:-1)*.06);
    r.elbows[i].rotation.x=-(.13+.10*(.5+.5*swing)+run*.55)*amount;
  }
  r.torso.rotation.set(-.06*run*amount,Math.sin(s.phase*Math.PI*2)*.055*amount,0);
  r.head.rotation.set(.025*amount,-r.torso.rotation.y+(1-amount)*Math.sin(s.time*.4)*.25,0);
  if(act==='interact') {
    const reach=clamp(motion?.reach??1,0,1);
    r.arms[1].rotation.x=THREE.MathUtils.lerp(r.arms[1].rotation.x,-1.1,reach);
    r.elbows[1].rotation.x=THREE.MathUtils.lerp(r.elbows[1].rotation.x,-.65,reach);
  }
  else if(!moving) {
    r.arms[0].rotation.x=Math.sin(s.time*1.3)*.035; r.arms[1].rotation.x=Math.sin(s.time*1.3+1)*.035;
    const wave=s.time%18;
    if(wave>8&&wave<10) {const envelope=Math.sin((wave-8)*Math.PI/2); r.arms[1].rotation.z=2.2*envelope; r.elbows[1].rotation.x=-(.8+Math.sin(wave*14)*.22)*envelope;}
  }
}
export function createVillager3D(look={}) {return createFarmer3D({scale:look.scale||1,look:look.look||{shirt:look.tint||0xffffff,overalls:false,hat:'none'}});}
