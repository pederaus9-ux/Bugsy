// Sunny Acres 3D — Phase 7M visual makeover layer.
//
// This file is intentionally presentation-only. It does not touch saves, economy,
// progression, collisions, animal AI, Firebase or interaction rules. The main game
// remains the source of truth; this module adds a bounded, low-draw-call art pass.
// Add ?visuallegacy to the URL for a clean before/after comparison.
import * as THREE from "./lib/three.module.min.js";

const qs = new URLSearchParams(location.search);
const LEGACY = qs.has("visuallegacy");
const state = {installed:false, legacy:LEGACY, scene:null, renderer:null, extraDrawCalls:0, flowers:0, lanterns:0, butterflies:0};
window.__sa7m = state;

if (!LEGACY) {
  installUiSkin();
}

function reducedMotion() {
  return document.documentElement?.dataset?.motion === "reduce" ||
    (!document.documentElement?.dataset?.motion && !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function installUiSkin() {
  if (document.getElementById("sa7m-skin")) return;
  const style = document.createElement("style");
  style.id = "sa7m-skin";
  style.textContent = `
    :root{
      --parch:#fff1c9; --parch2:#f7d995; --wood:#875020; --wood-dk:#4e2a10;
      --green:#67bf45; --green-dk:#347a21; --gold:#ffd24b; --gold-dk:#b97008;
      --red:#d94432; --red-dk:#8f291b;
    }
    .hud{filter:drop-shadow(0 5px 10px rgba(42,22,5,.16))}
    .star{filter:drop-shadow(0 4px 0 rgba(63,31,7,.22)) drop-shadow(0 6px 12px rgba(0,0,0,.15))}
    .xpbar,.cnt,.chip,.modebar{
      border-color:rgba(255,255,255,.96)!important;
      box-shadow:0 3px 0 rgba(61,31,8,.24),0 8px 18px rgba(42,23,5,.16)!important;
    }
    .xpbar,.cnt{background:linear-gradient(180deg,rgba(76,43,19,.88),rgba(46,25,11,.82))!important}
    .xpbar i{background:linear-gradient(180deg,#a9ed78 0%,#59bd34 56%,#3b9426 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
    .cnt .ic{filter:drop-shadow(0 3px 1px rgba(0,0,0,.28)) saturate(1.08)}
    .chip{background:linear-gradient(180deg,rgba(79,45,20,.84),rgba(46,26,12,.78))!important}
    .chip.ev{background:linear-gradient(180deg,#ffc04f,#e98118 72%,#cf6411)!important}
    .dock button,.throwbtn{
      box-shadow:0 4px 0 #704016,0 8px 18px rgba(45,24,6,.28),inset 0 2px 0 rgba(255,255,255,.72)!important;
    }
    .dock button{background:radial-gradient(circle at 34% 24%,#fff9da 0%,#ffe49a 40%,#efb63b 100%)!important}
    .throwbtn{background:radial-gradient(circle at 34% 24%,#f4ffe8 0%,#b9ef83 42%,#68bb3c 100%)!important}
    .side button,.walkbtns button{
      background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(246,237,215,.93))!important;
      box-shadow:0 3px 0 rgba(89,49,17,.28),0 7px 16px rgba(35,19,6,.18)!important;
    }
    .stick{background:radial-gradient(circle,rgba(255,249,223,.08),rgba(73,48,25,.30))!important;box-shadow:0 5px 18px rgba(31,18,7,.25),inset 0 0 0 1px rgba(255,255,255,.24)!important}
    .stick i{background:radial-gradient(circle at 34% 24%,#fffbdc,#f1bc40)!important;box-shadow:0 4px 0 #704016,0 7px 14px rgba(0,0,0,.18)!important}
    .tray,.panel,.fbbox,.authcard,.wsheet{
      box-shadow:0 12px 34px rgba(52,28,8,.28),0 3px 0 rgba(99,55,17,.16)!important;
    }
    .btn{box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 3px 0 rgba(77,43,14,.22)}
    .out{text-shadow:0 2px 0 #573012,2px 0 0 #573012,-2px 0 0 #573012,0 -2px 0 #573012,1.5px 1.5px 0 #573012,-1.5px 1.5px 0 #573012,1.5px -1.5px 0 #573012,-1.5px -1.5px 0 #573012!important}
    #sa7m-vignette{position:fixed;inset:0;z-index:3;pointer-events:none;background:
      radial-gradient(ellipse at 50% 47%,transparent 50%,rgba(50,27,7,.035) 76%,rgba(35,18,5,.10) 100%);
      mix-blend-mode:multiply}
    #sa7m-sunwash{position:fixed;inset:0;z-index:3;pointer-events:none;opacity:.34;background:
      radial-gradient(circle at 76% 10%,rgba(255,218,139,.12),transparent 25%),
      linear-gradient(180deg,rgba(255,242,207,.035),transparent 42%)}
    html[data-motion="reduce"] .dock button,html[data-motion="reduce"] .throwbtn{transition:none!important}
    @media (max-width:900px){#sa7m-vignette{background:radial-gradient(ellipse at 50% 47%,transparent 56%,rgba(42,22,6,.07) 100%)}}
  `;
  document.head.appendChild(style);
  for (const [id] of [["sa7m-vignette"],["sa7m-sunwash"]]) {
    if (!document.getElementById(id)) { const el = document.createElement("div"); el.id = id; el.setAttribute("aria-hidden","true"); document.body.appendChild(el); }
  }
}

export function installWorld(scene, renderer) {
  if (LEGACY || scene.userData.__sa7mInstalled) return;
  scene.userData.__sa7mInstalled = true;
  state.installed = true; state.scene = scene; state.renderer = renderer;
  scene.userData.phase7m = "max-wow-v1";

  tuneExistingMaterials(scene);

  const root = new THREE.Group(); root.name = "Phase7M-MaxWow"; root.userData.phase7m = true; scene.add(root);
  addBarnIvy(root);
  addFlowerMeadow(root);
  addLanternWalk(root);
  addButterflies(root);
  addSoftGroundAccents(root);
  root.traverse(o => { if (o.isMesh || o.isPoints) state.extraDrawCalls++; });

  // A very small warm fill from the camera-facing side. It has no shadows, so it is
  // cheap, and it keeps faces/animals readable without flattening the sun shadows.
  const fill = new THREE.DirectionalLight(0xffd9ac, .18);
  fill.position.set(-14, 8, 18); fill.castShadow = false; fill.name = "Phase7M warm fill"; root.add(fill);

  // Expose only bounded diagnostic facts for visual/performance evidence.
  Object.assign(state, {flowers:132, lanterns:7, butterflies:18});
}

export function visualExposure(value) {
  return LEGACY ? value : value * (value > 1.08 ? 1.025 : 1.055);
}

export function visualFog(value) {
  return LEGACY ? value : value * (value < .006 ? .78 : .90);
}

function tuneExistingMaterials(scene) {
  const seen = new Set();
  scene.traverse((o) => {
    if (!o?.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || seen.has(m.uuid)) continue; seen.add(m.uuid);
      if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
        // Slightly stronger highlight separation without turning the farm glossy.
        if (m.metalness > .55) m.roughness = Math.max(.26, m.roughness * .86);
        else if (m.roughness > .86) m.roughness = Math.max(.78, m.roughness * .94);
        if (m.color && m.color.getHex() === 0xf2eadc) m.color.set(0xfff1df);
        m.needsUpdate = true;
      }
    }
  });
}

function seeded(seed=731) { let s=seed; return ()=>((s=(s*16807)%2147483647)/2147483647); }
function mat(color, roughness=.82, emissive=0x000000, emissiveIntensity=0) {
  return new THREE.MeshStandardMaterial({color, roughness, emissive, emissiveIntensity, vertexColors:true});
}
function setInst(inst, i, x, y, z, sx, sy, sz, rotY=0, rotZ=0, color=null) {
  const p = new THREE.Object3D(); p.position.set(x,y,z); p.scale.set(sx,sy,sz); p.rotation.set(0,rotY,rotZ); p.updateMatrix(); inst.setMatrixAt(i,p.matrix); if (color) inst.setColorAt(i,color);
}

function addFlowerMeadow(root) {
  const R=seeded(79), count=132;
  const stemGeo=new THREE.CylinderGeometry(.018,.026,.42,5); stemGeo.translate(0,.21,0);
  const headGeo=new THREE.IcosahedronGeometry(.075,1);
  const stems=new THREE.InstancedMesh(stemGeo,new THREE.MeshStandardMaterial({color:0x3d8a32,roughness:.9}),count);
  const heads=new THREE.InstancedMesh(headGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,vertexColors:true}),count);
  const palette=[0xffd34c,0xffffff,0xf2a3c7,0xd7a6ff,0xff8f62,0xffef9b].map(x=>new THREE.Color(x));
  let i=0;
  while(i<count){
    const a=R()*Math.PI*2, rr=6+R()*18, x=Math.cos(a)*rr, z=Math.sin(a)*rr;
    // Keep the main barn doors/path readable; flowers live on borders and soft edges.
    if (Math.abs(x)<3.8 && z>3.8 && z<9.5) continue;
    const h=.26+R()*.34, s=.7+R()*.65;
    setInst(stems,i,x,0,z,s,h/.42,s,R()*6.28,(R()-.5)*.08);
    setInst(heads,i,x,h,z,s,s*.7,s,R()*6.28,0,palette[Math.floor(R()*palette.length)]);
    i++;
  }
  for(const m of [stems,heads]){m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;root.add(m);}
}

function addBarnIvy(root) {
  const R=seeded(177), n=58, geo=new THREE.SphereGeometry(.10,6,4);
  const leaves=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0x4b913a,roughness:.86,vertexColors:true}),n);
  const greens=[0x39772f,0x4f9637,0x6aaa42,0x7eaa43].map(v=>new THREE.Color(v));
  for(let i=0;i<n;i++){
    const side=i%2?1:-1, y=.8+R()*6.1;
    const x=side*(3.72+R()*.22), z=5.54+(R()-.5)*.12;
    const s=.65+R()*.9;
    setInst(leaves,i,x,y,z,s,s*.55,s*.35,R()*6.28,(R()-.5)*1.2,greens[Math.floor(R()*greens.length)]);
  }
  leaves.castShadow=true; leaves.receiveShadow=true; root.add(leaves);
}

function addLanternWalk(root) {
  const pts=[[-6.2,6.8],[-3.3,7.4],[0,7.7],[3.3,8.1],[6.2,8.7],[-5.2,-6.2],[6.5,-5.8]];
  const postGeo=new THREE.CylinderGeometry(.045,.065,1.05,7); postGeo.translate(0,.525,0);
  const lampGeo=new THREE.BoxGeometry(.24,.32,.24), capGeo=new THREE.ConeGeometry(.22,.18,4); capGeo.rotateY(Math.PI/4);
  const post=new THREE.InstancedMesh(postGeo,new THREE.MeshStandardMaterial({color:0x51361f,roughness:.9}),pts.length);
  const lampMat=new THREE.MeshStandardMaterial({color:0x5b4129,roughness:.5,metalness:.12});
  const lamps=new THREE.InstancedMesh(lampGeo,lampMat,pts.length), caps=new THREE.InstancedMesh(capGeo,lampMat,pts.length);
  const glowGeo=new THREE.SphereGeometry(.09,8,6);
  const glow=new THREE.InstancedMesh(glowGeo,new THREE.MeshBasicMaterial({color:0xffc85d,toneMapped:false}),pts.length);
  pts.forEach(([x,z],i)=>{setInst(post,i,x,0,z,1,1,1);setInst(lamps,i,x,1.05,z,1,1,1);setInst(caps,i,x,1.31,z,1,1,1,0);setInst(glow,i,x,1.05,z,1,1.18,1);});
  for(const m of [post,lamps,caps]){m.castShadow=true;m.receiveShadow=true;root.add(m);} root.add(glow);
}

function addButterflies(root) {
  const R=seeded(923), n=18, pos=new Float32Array(n*3), col=new Float32Array(n*3);
  const palette=[new THREE.Color(0xffd15c),new THREE.Color(0xff8fad),new THREE.Color(0x9fd7ff),new THREE.Color(0xe9b8ff)];
  for(let i=0;i<n;i++){const a=R()*6.28,r=4+R()*17;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=.8+R()*2.2;pos[i*3+2]=Math.sin(a)*r;const c=palette[i%palette.length];col.set([c.r,c.g,c.b],i*3);}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("color",new THREE.BufferAttribute(col,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:.10,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.9,depthWrite:false}));
  pts.name="Phase7M butterflies"; root.add(pts);
  const base=pos.slice(), phase=Array.from({length:n},()=>R()*6.28);
  pts.onBeforeRender=()=>{if(reducedMotion())return;const t=performance.now()*.001,p=geo.attributes.position.array;for(let i=0;i<n;i++){p[i*3]=base[i*3]+Math.sin(t*.72+phase[i])*.18;p[i*3+1]=base[i*3+1]+Math.sin(t*1.7+phase[i])*.16;p[i*3+2]=base[i*3+2]+Math.cos(t*.63+phase[i])*.14;}geo.attributes.position.needsUpdate=true;};
}

function addSoftGroundAccents(root) {
  // Tiny warm/dark grounding ellipses around the hero barn area. One transparent
  // instanced mesh supplies the contact richness without adding lights or particles.
  const pts=[[-6.2,6.8],[-3.3,7.4],[0,7.7],[3.3,8.1],[6.2,8.7],[-8,3],[8,-3],[0,-7]],n=pts.length;
  const geo=new THREE.CircleGeometry(.62,16);geo.rotateX(-Math.PI/2);
  const colors=[];for(let i=0;i<geo.attributes.position.count;i++)colors.push(1,1,1,i===0?1:0);
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));
  const mesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0x3f2812,vertexColors:true,transparent:true,opacity:.10,depthWrite:false}),n);
  pts.forEach(([x,z],i)=>setInst(mesh,i,x,.012,z,1,.62,1));root.add(mesh);
}
