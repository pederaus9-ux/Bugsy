// Focused source fixture: actual createHands, poseHands and updateHands.
// No browser, WebGL, clock virtualization or world/replay infrastructure.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../../lib/three.module.min.js';
import {createHands,poseHands} from '../../scene-polish.js';

const html=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
const start=html.indexOf('function updateHands(dt, t, tweenK) {');
const end=html.indexOf('// ---------- the farmer,',start);
if(start<0||end<0)throw Error('Native updateHands source anchor missing');
const source=html.slice(start,end).trim();

export function makeHands(){return createHands(new THREE.MeshStandardMaterial(),new THREE.MeshStandardMaterial());}
export function nativeHandsDriver(hands,ctx){
  const env={hands,walk:ctx.walk,punch:ctx.punch??null,thirdPerson:ctx.thirdPerson??false,inBarn:false,photoMode:false,authoredHands:null,G:{reducedMotion:()=>ctx.reducedMotion},poseHands};
  const evaluate=vm.runInNewContext(source+'; updateHands',env,{timeout:1000});
  return {evaluate(dt,t,tween=1){
    Object.assign(env,{walk:ctx.walk,punch:ctx.punch??null,thirdPerson:ctx.thirdPerson??false});
    evaluate(dt,t,tween);ctx.punch=env.punch;
  },env,source};
}
export function handChannels(hands){
  return hands.children.map(h=>({side:h.userData.side,position:h.position.toArray(),rotation:h.rotation.toArray(),quaternion:h.quaternion.toArray(),knucklePosition:h.userData.fingers.parent.position.toArray(),knuckleRotation:h.userData.fingers.parent.rotation.toArray(),knuckleQuaternion:h.userData.fingers.parent.quaternion.toArray(),fingerPosition:h.userData.fingers.position.toArray(),fingerRotation:h.userData.fingers.rotation.toArray(),fingerQuaternion:h.userData.fingers.quaternion.toArray()}));
}
export function fallbackFixture(install){
  const scene=new THREE.Group(),camera=new THREE.PerspectiveCamera(),hands=makeHands();scene.add(camera);camera.add(hands);
  camera.position.set(0,1.6,16);camera.rotation.set(-.08,.25,0,'YXZ');
  const ctx={walk:{pos:new THREE.Vector2(0,16),vel:new THREE.Vector2(),yaw:.25,pitch:-.08,gspd:0,gait:.2,grun:0,bob:0,walked:0},punch:null,thirdPerson:false,reducedMotion:false,ground:0};
  const native=nativeHandsDriver(hands,ctx),motion=install?.({THREE,G:{SANDBOX:false},camera,fallback:hands,getContext:()=>ctx});
  const step=(i)=>{native.evaluate(1/60,i/60);scene.updateMatrixWorld(true);const beforeOverlay=handChannels(hands);motion?.update(1/60,i/60);return {beforeOverlay,afterOverlay:handChannels(hands)};};
  return {scene,camera,hands,ctx,native,motion,step};
}
