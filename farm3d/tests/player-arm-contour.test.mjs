import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../lib/three.module.min.js';
import {installPlayerMotion} from '../player-motion.js';
import {installArmAttachment} from '../player-arm-attachment.js';
import {fallbackFixture} from './fixtures/native-player-hands.mjs';
const cap=new T.Vector3(0,.039+.12*Math.cos(Math.PI/2+.32),.15+.12*Math.sin(Math.PI/2+.32)),normal=new T.Vector3(0,Math.cos(Math.PI/2+.32),Math.sin(Math.PI/2+.32));
for(const mode of ['idle','walk','pet','reach-up'])test('fallback elbow cross-section matches narrow native forearm: '+mode,()=>{
 const f=fallbackFixture(installPlayerMotion),a=installArmAttachment({THREE:T,camera:f.camera,fallback:f.hands,getContext:()=>f.ctx});
 f.ctx.walk.pitch=(mode==='reach-up'?80:-69)*Math.PI/180;f.camera.position.set(0,1.6,16);f.camera.rotation.set(f.ctx.walk.pitch,f.ctx.walk.yaw,0,'YXZ');
 try{for(let i=0;i<44;i++){if(i===30&&(mode==='pet'||mode==='reach-up'))f.ctx.punch={kind:mode==='pet'?'pat':'reach',authoredKind:mode==='pet'?'pet':'harvest',t:0};if(mode==='walk'){f.ctx.walk.gspd=3.4;f.ctx.walk.gait=i/40;}f.step(i);a.update();}
 f.scene.updateMatrixWorld(true);const root=f.camera.getObjectByName('First-person upper sleeves');
 for(let i=0;i<2;i++){
  const mesh=root.children[i],g=mesh.geometry,p=g.attributes.position,idx=g.index,inv=new T.Matrix4().copy(f.hands.children[i].matrixWorld).invert(),hits=[];
  for(let j=0;j<(idx?idx.count:p.count);j+=3){const vertices=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(j+k):j+k).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv));if(vertices.some(v=>{const axial=-v.clone().sub(cap).dot(normal);return axial<-.0061||axial>.0141;}))continue;for(let k=0;k<3;k++){const v=vertices[k],w=vertices[(k+1)%3],d=v.clone().sub(cap).dot(normal),e=w.clone().sub(cap).dot(normal);if(d*e>0||Math.abs(d-e)<1e-12)continue;const point=v.clone().lerp(w,d/(d-e)),radius=point.distanceTo(cap);if(radius<.065)hits.push(radius);}}
  assert.ok(hits.length>=12,'actual rendered triangles surround native elbow plane');
  assert.ok(Math.max(...hits)<=.037,'no oversized elbow bulb;max radius='+Math.max(...hits));
  assert.ok(Math.min(...hits)>=.033,'continuous coverage around34mm native cap');
 }
 }finally{a.dispose();f.motion.dispose();}
});
