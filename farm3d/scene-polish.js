import * as THREE from './lib/three.module.min.js';

// Small, deterministic assets built once. No external downloads or per-frame texture work.
export function soilCanvas(seed, path = false) {
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'); let state = seed;
  const random = () => (state = state * 16807 % 2147483647) / 2147483647;
  x.fillStyle = path ? '#aa906b' : '#75553c'; x.fillRect(0, 0, n, n);
  // Broad tonal patches sit beneath fine grains; soil must read as earth at close range.
  for (let i = 0; i < 36; i++) {
    const px = random() * n, py = random() * n, r = 24 + random() * 66;
    for (const [ox, oy] of [[0,0],[n,0],[-n,0],[0,n],[0,-n]]) {
      const g = x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,r);
      g.addColorStop(0, i % 2 ? 'rgba(38,25,15,.10)' : 'rgba(205,173,126,.10)'); g.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(px+ox-r,py+oy-r,r*2,r*2);
    }
  }
  for (let i = 0; i < 12000; i++) {
    const px=random()*n, py=random()*n, r=.35+random()*1.25;
    x.fillStyle = i % 3 ? 'rgba(38,26,17,.18)' : 'rgba(221,191,142,.24)';
    x.beginPath(); x.ellipse(px,py,r,r*.65,random()*Math.PI,0,Math.PI*2); x.fill();
  }
  if (path) { // two soft wheel ruts; UVs repeat along the path without hard end seams
    for (const center of [.3,.7]) {
      const g=x.createLinearGradient((center-.045)*n,0,(center+.045)*n,0);
      g.addColorStop(0,'rgba(50,36,22,0)');g.addColorStop(.5,'rgba(50,36,22,.20)');g.addColorStop(1,'rgba(50,36,22,0)');
      x.fillStyle=g;x.fillRect((center-.045)*n,0,.09*n,n);
    }
  }
  return c;
}

function batch(geometries, material) {
  const positions=[],normals=[];
  for (const geometry of geometries) {
    const flat=geometry.index ? geometry.toNonIndexed() : geometry;
    positions.push(...flat.attributes.position.array);normals.push(...flat.attributes.normal.array);
    if (flat !== geometry) flat.dispose(); geometry.dispose();
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  return new THREE.Mesh(g,material);
}
const ellipsoid=(radius,scale,position) => {
  const g=new THREE.SphereGeometry(radius,12,8);g.scale(...scale);g.translate(...position);return g;
};
export function createHands(sleeve, skin) {
  const g=new THREE.Group();
  for (const sd of [-1,1]) {
    const h=new THREE.Group();h.position.set(sd*.22,-.19,-.44);h.rotation.set(-.2,sd*-.3,sd*.2);g.add(h);
    // Tapered sleeve, raised fabric cuff and wrist fit the same camera envelope as before.
    const arm=new THREE.CylinderGeometry(.034,.044,.24,12);arm.rotateX(Math.PI/2+.32);arm.translate(0,.039,.15);
    const cuff=new THREE.CylinderGeometry(.038,.038,.017,12);cuff.rotateX(Math.PI/2+.32);cuff.translate(0,.08,.035);
    h.add(batch([arm,cuff],sleeve));
    const palm=ellipsoid(.041,[1,.62,1.08],[0,.105,-.021]);
    const wrist=ellipsoid(.027,[1,.8,1.3],[0,.09,.022]);
    const thumb=ellipsoid(.021,[.85,.85,1.45],[-sd*.035,.09,-.035]);
    // Show the back of the hand rather than hiding its fingers behind the sleeve.
    const tilt=1.05;
    for(const part of [palm,wrist,thumb]){part.translate(0,-.105,.021);part.rotateX(tilt);part.translate(0,.105,-.021);}
    h.add(batch([palm,wrist,thumb],skin));
    const knuckles=new THREE.Group();knuckles.position.set(0,.105+.005*Math.cos(tilt)+.027*Math.sin(tilt),-.021+.005*Math.sin(tilt)-.027*Math.cos(tilt));knuckles.rotation.x=tilt;h.add(knuckles);
    const fingers=new THREE.Group();knuckles.add(fingers);
    const segments=[];
    for (let i=0;i<4;i++) {
      const px=(i-1.5)*.017, length=[.036,.048,.044,.032][i];
      segments.push(ellipsoid(.009,[.9,.95,length/.018],[px,0,-length*.5]));
      segments.push(ellipsoid(.009,[.88,.9,.9],[px,-.005,-length]));
    }
    fingers.add(batch(segments,skin));
    h.userData={base:h.position.clone(),side:sd,fingers};
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=10;}});
  g.visible=false;g.userData={sleeve,skin};return g;
}
export function poseHands(g, reach, kind) {
  for (const h of g.children) {
    // The active hand closes gently for a harvest/plant reach and opens for petting.
    h.userData.fingers.rotation.x = h.userData.side === 1 && kind !== 'pat' ? reach * .65 : 0;
  }
}

const markerPosition=new THREE.Vector3(),parentScale=new THREE.Vector3();
export function fitMarker(sprite, base, camera, height, firstPerson) {
  if (!firstPerson || !sprite.visible) { sprite.scale.setScalar(base); return; }
  sprite.getWorldPosition(markerPosition).applyMatrix4(camera.matrixWorldInverse);
  sprite.parent.getWorldScale(parentScale);
  const pixelLimit=48, depth=Math.max(.1,-markerPosition.z);
  const limit=pixelLimit*2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*depth/height/Math.max(.001,parentScale.y);
  sprite.scale.setScalar(Math.min(base,limit));
}
