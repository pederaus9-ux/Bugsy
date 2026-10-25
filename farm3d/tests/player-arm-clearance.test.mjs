import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as T from '../lib/three.module.min.js';
import {installPlayerMotion} from '../player-motion.js';
import {installArmAttachment} from '../player-arm-attachment.js';
import {fallbackFixture,handChannels} from './fixtures/native-player-hands.mjs';

// Independent convex-plane containment oracle, using actual batched native
// forearm vertices and the rendered capsule, not an endpoint equality check.
function planesOf(g){
 const p=g.attributes.position,idx=g.index,center=new T.Vector3(),planes=[];
 for(let i=0;i<p.count;i++)center.add(new T.Vector3().fromBufferAttribute(p,i));
 center.multiplyScalar(1/p.count);
 for(let i=0;i<(idx?idx.count:p.count);i+=3){
  const a=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i):i),b=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+1):i+1),c=new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+2):i+2);
  const n=b.sub(a).cross(c.sub(a));if(n.lengthSq()<1e-20)continue;
  const plane=new T.Plane().setFromNormalAndCoplanarPoint(n.normalize(),a);
  if(plane.distanceToPoint(center)>0)plane.negate();
  if(!planes.some(o=>o.normal.distanceTo(plane.normal)<1e-6&&Math.abs(o.constant-plane.constant)<1e-7))planes.push(plane);
 }
 return planes;
}
const cap=new T.Vector3(0,.039+.12*Math.cos(Math.PI/2+.32),.15+.12*Math.sin(Math.PI/2+.32));
const normal=new T.Vector3(0,Math.cos(Math.PI/2+.32),Math.sin(Math.PI/2+.32));
function nativeCap(hand){
 const points=[],p=hand.children[0].geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const v=new T.Vector3().fromBufferAttribute(p,i);
  if(Math.abs(v.clone().sub(cap).dot(normal))<1e-6&&Math.abs(v.distanceTo(cap)-.034)<1e-6&&!points.some(o=>o.distanceTo(v)<1e-7))points.push(v);
 }
 assert.equal(points.length,12,'select the whole actual native elbow cap rim');
 return [cap.clone(),...points];
}
function collarPlanes(mesh,hand){
 const p=mesh.geometry.attributes.position,idx=mesh.geometry.index,inv=new T.Matrix4().copy(hand.matrixWorld).invert(),points=[],faces=[];
 for(let i=0;i<idx.count;i+=3){const triangle=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx.getX(i+k)).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv));if(triangle.some(v=>{const d=v.clone().sub(cap),axial=-d.dot(normal),radial=Math.sqrt(Math.max(0,d.lengthSq()-axial*axial));return axial<-.0061||axial>.0141||radial<.033||radial>.038;}))continue;points.push(...triangle);faces.push(triangle);}
 assert.ok(faces.length>=48,'actual continuous collar sides surround native cap');
 const centroid=points.reduce((a,p)=>a.add(p),new T.Vector3()).multiplyScalar(1/points.length),planes=[];
 for(const[a,b,c]of faces){const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),plane=new T.Plane().setFromNormalAndCoplanarPoint(n,a);if(plane.distanceToPoint(centroid)>0)plane.negate();planes.push(plane.applyMatrix4(hand.matrixWorld));}
 const forward=normal.clone().negate(),axial=points.map(v=>v.clone().sub(cap).dot(forward));
 for(const sign of [-1,1]){const d=sign<0?Math.min(...axial):Math.max(...axial),point=cap.clone().addScaledVector(forward,d);planes.push(new T.Plane().setFromNormalAndCoplanarPoint(forward.clone().multiplyScalar(sign),point).applyMatrix4(hand.matrixWorld));}
 return planes;
}
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const cameraSource=html.slice(html.indexOf('function placeWalkCamera()'),html.indexOf('// Ultra graphics while walking:'));
const supportStart=html.indexOf('function workshopWalkY('),supportEnd=html.indexOf('\n}',supportStart);assert(supportStart>=0&&supportEnd>supportStart,'missing supported walk height');
const supportSource=html.slice(supportStart,supportEnd+2);
const records=[];
for(const pitch of [-80,-69,0,80])for(const mode of ['idle','walk','run','reach','pat'])test(`native fallback full cap has strict clearance: ${mode}, pitch ${pitch}`,()=>{
 const f=fallbackFixture(installPlayerMotion);Object.assign(f.ctx.walk,{pitch:pitch*Math.PI/180,yaw:.7});f.ctx.ground=1.2;
 const place=vm.runInNewContext(supportSource+'\n'+cameraSource+';placeWalkCamera',{walk:f.ctx.walk,workshopGroundY:()=>f.ctx.ground,buildings:{},BUILD_SPOT:{},farmer:{visible:false},thirdPerson:false,camera:f.camera,EYE:1.6,sun:{target:{position:new T.Vector3()},position:new T.Vector3()},sunDir:new T.Vector3(0,1,0)});
 const attachment=installArmAttachment({THREE:T,camera:f.camera,fallback:f.hands,getContext:()=>f.ctx}),points=f.hands.children.map(nativeCap);
 let minimum=Infinity,samples=0,firstFailure=null;
 try{for(let frame=0;frame<90;frame++){
  const w=f.ctx.walk,moving=mode==='walk'||mode==='run';w.gspd=moving?(mode==='run'?6:3.4):0;w.grun=mode==='run'?1:0;w.gait=frame/40;w.bob=moving?Math.sin(frame*.157)*.045:0;w.walked=frame*.1;w.vel.set(0,w.gspd);
  if(frame===30&&(mode==='reach'||mode==='pat'))f.ctx.punch={kind:mode,authoredKind:mode==='pat'?'pet':'harvest',t:0};
  place();f.step(frame);f.scene.updateMatrixWorld(true);
  const before=handChannels(f.hands),cameraBefore=f.camera.matrixWorld.toArray();attachment.update();f.scene.updateMatrixWorld(true);
  assert.deepEqual(handChannels(f.hands),before,'attachment preserves every native hand/knuckle/finger channel');
  assert.deepEqual(f.camera.matrixWorld.toArray(),cameraBefore,'attachment preserves native camera');
  if(frame<29)continue;
  const root=f.camera.getObjectByName('First-person upper sleeves');assert.ok(root.visible);
  for(let i=0;i<2;i++){
   const mesh=root.children[i],ps=collarPlanes(mesh,f.hands.children[i]),top=new T.Vector3(),positions=mesh.geometry.attributes.position;
   for(let k=0;k<12;k++)top.add(new T.Vector3().fromBufferAttribute(positions,k));top.multiplyScalar(1/12).applyMatrix4(mesh.matrixWorld);
   const shoulder=new T.Vector3((i?1:-1)*.30,1.43,.10).applyAxisAngle(new T.Vector3(0,1,0),w.yaw).add(new T.Vector3(w.pos.x,f.ctx.ground,w.pos.y));
   assert.ok(top.distanceTo(shoulder)<1e-6,'original body shoulder endpoint remains exact');
   for(let k=0;k<12;k++)assert.ok(Math.abs(new T.Vector3().fromBufferAttribute(positions,k).applyMatrix4(mesh.matrixWorld).distanceTo(top)-.047)<1e-6,'proximal radius preserved while elbow tapers');
   assert.ok(mesh.geometry.attributes.normal.array.every(Number.isFinite),'finite smooth surface normals');
   for(const local of points[i]){const world=local.clone().applyMatrix4(f.hands.children[i].matrixWorld);for(const p of ps){const clearance=-p.distanceToPoint(world);minimum=Math.min(minimum,clearance);if(clearance<.001&&!firstFailure)firstFailure={frame,side:i?'R':'L',clearance};}}
   samples++;
  }
 }
 records.push({pitch,mode,samples,minimumWorldClearance:minimum,firstFailure});
 assert.equal(samples,122);assert.equal(firstFailure,null,`whole cap requires >=1mm world clearance: ${JSON.stringify(firstFailure)}`);
 }finally{attachment.dispose();f.motion.dispose();}
});
test.after(()=>{if(!process.env.TEST_ARTIFACTS)return;mkdirSync(process.env.TEST_ARTIFACTS,{recursive:true});writeFileSync(path.join(process.env.TEST_ARTIFACTS,'native-cap-clearance.json'),JSON.stringify({cases:records.length,joints:records.reduce((n,r)=>n+r.samples,0),records},null,2)+'\n');});

test('native walk support resolves flat ground and authored ramp, rejecting wrong-height substitution',()=>{const ctx={workshopGroundY:()=>1.2,buildings:{loom:{site:{ok:true,needsRamp:true,floorY:1.55,approachY:1.2}}},BUILD_SPOT:{loom:[0,0]}};const y=vm.runInNewContext(supportSource+';workshopWalkY',ctx);const check=fn=>{for(const[x,z,h]of [[0,1.7,1.55],[0,3.2,1.375],[0,4.7,1.2],[1,3.2,1.2]])assert(Math.abs(fn(x,z)-h)<1e-12,'support height '+[x,z]);};check(y);assert.throws(()=>check(()=>1.2));const f=fallbackFixture(installPlayerMotion);try{assert.throws(()=>vm.runInNewContext(cameraSource+';placeWalkCamera();',{walk:f.ctx.walk,groundY:()=>1.2}),/workshopWalkY is not defined/);}finally{f.motion.dispose();}});
