import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../lib/three.module.min.js';
import {createCowYard} from '../cow-yard.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf(' chickenYard.applyAppearance(chickenPreview',html.indexOf('function installAnimalPenScene(')),end=html.indexOf('\n const petActive=',start),source=html.slice(start,end);assert(start>=0&&end>start);
for(const elapsed of [0,1500,3000,6000,10500,11999])test('actual publication preserves robot service phase at '+elapsed+'ms',()=>{
 const record=defaultSiteRecord('cow');record.structures.robot=[9,-36];const site=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}).sites.cow,before=createCowYard({north:25}),after=createCowYard({north:25,layout:site}),status={job:{id:7,stage:'milking',startedAt:1000},tank:{normal:0,gold:0}},copy=structuredClone(status);
 try{before.setStatus(status);before.setRobotPose(elapsed/12000);const p=before.robot.arm.getWorldPosition(new T.Vector3());vm.runInNewContext(source,{chickenYard:{applyAppearance(){},setStatus(){}},chickenPreview:null,chickenSupplies:{},G:{S:{pens:{chicken:{}}},CHICKEN_DEFAULT_STYLE:{}},cowStatus:status,cowYard:after,nowMs:()=>1000+elapsed});const q=after.robot.arm.getWorldPosition(new T.Vector3());assert(q.distanceTo(p.add(new T.Vector3(...[site.components.robot.delta[0],0,site.components.robot.delta[1]])))<1e-8,'arm changed phase during publication');assert.deepEqual(status,copy);assert.equal(after.robot.entryGate.rotation.y,0);assert.equal(after.robot.exitGate.rotation.y,0);}finally{before.dispose();after.dispose();}
});
for(const stage of ['approaching','exiting',null])test('publication keeps retracted arm for '+stage,()=>{
 const y=createCowYard({north:25});try{vm.runInNewContext(source,{chickenYard:{applyAppearance(){},setStatus(){}},chickenPreview:null,chickenSupplies:{},G:{S:{pens:{chicken:{}}}},cowStatus:{job:stage?{stage}:null},cowYard:y,nowMs:()=>{throw Error('Non-milking job must not sample service time');}});assert.equal(y.robot.arm.position.x,-1.2);assert.equal(y.robot.arm.position.y,.25);}finally{y.dispose();}
});
test('boot before cow status does not sample the not-yet-initialized clock',()=>{
 vm.runInNewContext(source,{chickenYard:{applyAppearance(){},setStatus(){}},chickenPreview:null,chickenSupplies:{},G:{S:{pens:{chicken:{}}}},cowStatus:null,cowYard:{setStatus(){throw Error('Unexpected boot status');},setRobotPose(){throw Error('Unexpected boot pose');}},nowMs:()=>{throw Error('Unexpected boot clock');}});
});
