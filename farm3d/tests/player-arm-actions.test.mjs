import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import * as T from '../lib/three.module.min.js';
import {GLTFLoader} from '../lib/addons/loaders/GLTFLoader.js';
import {installAuthoredHands} from '../art/authored-hands.js';
import {installPlayerMotion} from '../player-motion.js';
import {installArmAttachment} from '../player-arm-attachment.js';
import {fallbackFixture} from './fixtures/native-player-hands.mjs';
const bytes=readFileSync(new URL('../assets/hands/hands-candidate.glb',import.meta.url));
const cap=new T.Vector3(0,.039+.12*Math.cos(Math.PI/2+.32),.15+.12*Math.sin(Math.PI/2+.32));
const records=[];
for(const authored of [false,true])for(const pitch of [-80,-69,0,80,'sweep'])for(const kind of ['reach','pat'])test(`connected natural action/return: ${authored?'authored':'fallback'} ${kind} pitch${pitch}`,async()=>{
 const f=fallbackFixture(installPlayerMotion);let native;
 if(authored){native=installAuthoredHands(f.camera,f.hands,{load:()=>new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')});await native.ready;assert.equal(native.state.status,'ready');f.native.env.authoredHands=native;}
 const attachment=installArmAttachment({THREE:T,camera:f.camera,fallback:f.hands,getContext:()=>f.ctx}),model=f.camera.getObjectByName('Authored first-person hands');
 Object.assign(f.ctx.walk,{pitch:(typeof pitch==='number'?pitch:-69)*Math.PI/180,yaw:.7,bob:0});f.camera.position.set(0,1.6,16);f.camera.rotation.set(f.ctx.walk.pitch,.7,0,'YXZ');
 let before,after,maxUpper=0,minUpper=Infinity,maxStep=0,maxStepFrame=null,previous=null,forearmLength=null,firstFailure=null;
 try{for(let frame=0;frame<150;frame++){
  if(frame===30)f.ctx.punch={kind,authoredKind:kind==='pat'?'pet':'harvest',t:0};
  if(pitch==='sweep'){f.ctx.walk.pitch=(frame>=30&&frame<=57?-80+160*(frame-30)/27:-69)*Math.PI/180;f.camera.rotation.set(f.ctx.walk.pitch,.7,0,'YXZ');}
  f.step(frame);attachment.update();f.scene.updateMatrixWorld(true);
  const sample=[];
  for(let i=0;i<2;i++){
   const shoulder=new T.Vector3((i?1:-1)*.30,1.43,.10).applyAxisAngle(new T.Vector3(0,1,0),.7).add(new T.Vector3(0,0,16));
   const arm=authored?model.getObjectByName((i?'R':'L')+'_arm'):f.hands.children[i];
   const elbow=authored?arm.getWorldPosition(new T.Vector3()):cap.clone().applyMatrix4(arm.matrixWorld),wrist=authored?model.getObjectByName((i?'R':'L')+'_wrist').getWorldPosition(new T.Vector3()):new T.Vector3(0,.09,.022).applyMatrix4(arm.matrixWorld);
   const upper=elbow.distanceTo(shoulder),forearm=elbow.distanceTo(wrist);maxUpper=Math.max(maxUpper,upper);minUpper=Math.min(minUpper,upper);
   if((upper<.19||upper>.335)&&!firstFailure)firstFailure={frame,side:i?'R':'L',upper};
   if(!forearmLength)forearmLength=forearm;assert.ok(Math.abs(forearm-forearmLength)<1e-6,'whole forearm/hand moves rigidly;no segment stretching');
   sample.push({elbow:elbow.toArray(),wrist:wrist.toArray(),upper});
   if(previous){const step=elbow.distanceTo(new T.Vector3().fromArray(previous[i].elbow));if(step>maxStep){maxStep=step;maxStepFrame={frame,side:i?'R':'L'};}}
  }
  if(frame===29)before=sample;if(frame===149)after=sample;previous=sample;
 }
 assert.equal(f.ctx.punch,null);assert.equal(f.motion.state.rest,1);
 for(let i=0;i<2;i++)for(const key of ['elbow','wrist'])assert.ok(new T.Vector3().fromArray(before[i][key]).distanceTo(new T.Vector3().fromArray(after[i][key]))<1e-6,'action returns exactly to body-mounted idle');
 records.push({authored,pitch,kind,minUpper,maxUpper,maxStep,maxStepFrame,firstFailure});
 assert.equal(firstFailure,null,'natural upper span across actual native action and return: '+JSON.stringify(firstFailure));
 assert.ok(maxStep<.08,'bounded continuous elbow travel through native action onset/return');
 }finally{attachment.dispose();f.motion.dispose();native?.dispose();}
});
test.after(()=>{if(!process.env.TEST_ARTIFACTS)return;mkdirSync(process.env.TEST_ARTIFACTS,{recursive:true});writeFileSync(path.join(process.env.TEST_ARTIFACTS,'action-proportions.json'),JSON.stringify(records,null,2)+'\n');});
