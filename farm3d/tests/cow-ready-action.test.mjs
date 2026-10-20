import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../lib/three.module.min.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(){
 const pen={list:[0,0]},camera=new THREE.PerspectiveCamera(50,844/390,.1,100);camera.position.set(0,1.6,4);camera.lookAt(0,.8,0);camera.updateMatrixWorld(true);
 const g=new THREE.Group(),card=new THREE.Mesh(new THREE.BoxGeometry(.6,1,1),new THREE.MeshBasicMaterial());card.position.y=.8;g.add(card);g.position.x=1.4;
 const status=new THREE.Sprite(new THREE.SpriteMaterial());status.position.y=2.2;status.visible=false;g.add(status);g.updateMatrixWorld(true);
 const a={kind:'cow',ref:{type:'pen',kind:'cow',i:0},farmPen:pen,g,card,status,S:{h:1.7},rig3d:{body:card}};
 const dummy=()=>{const g=new THREE.Group();g.visible=false;return g;};
 const c={THREE,camera,animals:[a],plots:[],buildings:{},chickenYard:{group:{visible:false}},cowYardActive:false,board:dummy(),gift:dummy(),stall:dummy(),plotSale:dummy(),yardSign:dummy(),paddockSign:dummy(),visitorCard:dummy(),decorObjs:[],barn:dummy(),walk:{},thirdPerson:false,innerWidth:844,innerHeight:390,
  G:{panel:null,S:{pens:{cow:pen}},sfx(){}},cowStatus:{cows:[{id:'cow-1',ready:{id:'batch-1'}}]},visiting:false,editMode:false,photoMode:false,wardrobeOn:false,inBarn:false,seedTray:{hidden:true},armed:null,aim:{type:'animal',label:'Ready cow',an:a},handPunch(){},squish(){},opened:null,closeTrays(){c.opened=null;},openInfo(f){c.opened=f;}};
 c.GS=()=>c.G.S;vm.createContext(c);
 vm.runInContext(html.slice(html.indexOf('function toScreen('),html.indexOf('\nfunction fxAt(')),c);
 vm.runInContext(html.slice(html.indexOf('function hitAt('),html.indexOf('\nconst plotAt =')),c);
 vm.runInContext(html.slice(html.indexOf('function onTap('),html.indexOf('// ---------- barn colours')),c);
 const begin=html.indexOf('function openReadyCow(');
 if(begin>=0)vm.runInContext(html.slice(begin,html.indexOf('\nfunction interact(',begin)),c);
 vm.runInContext(html.slice(html.indexOf('function interact('),html.indexOf('\nactBtn.addEventListener(')),c);
 return {c,a};
}
test('Ready-cow action retains the displayed moving cow when the crosshair has missed',()=>{
 const {c,a}=fixture();assert.equal(c.hitAt(422,195),null);
 assert.equal(c.interact(),true);assert.equal(c.opened.an,a);assert.equal(c.opened.type,'animal');
});
test('Ready-cow action does not silently switch to a different cow under the crosshair',()=>{
 const {c,a}=fixture(),g=a.g.clone();g.position.x=0;g.updateMatrixWorld(true);
 const card=g.children[0],status=g.children[1],b={...a,g,card,status,rig3d:{body:card},ref:{...a.ref,i:1}};c.animals.push(b);c.cowStatus.cows.push({id:'cow-2',ready:{}});
 assert.equal(c.hitAt(422,195).an,b);assert.equal(c.interact(),true);assert.equal(c.opened.an,a);
});
test('Ready-cow selection still rejects an occluded or distant displayed cow',()=>{
 for(const condition of ['occluded','distant']){
  const {c,a}=fixture();
  if(condition==='occluded'){const wall=new THREE.Mesh(new THREE.BoxGeometry(2,3,.3),new THREE.MeshBasicMaterial());wall.position.set(.7,1.1,2);wall.userData.hit={type:'decor',j:0};wall.updateMatrixWorld(true);c.decorObjs.push(wall);}
  else{a.g.position.set(2,0,-10);a.g.updateMatrixWorld(true);}
  assert.equal(c.interact(),false,condition);assert.equal(c.opened,null,condition);
 }
});
test('Ready-cow selection rejects removed, hidden, no-longer-ready and former-farm cows',()=>{
 for(const condition of ['removed','hidden','spent','farm']){
  const {c,a}=fixture();a.g.position.x=0;a.g.updateMatrixWorld(true);
  if(condition==='removed')c.animals.length=0;
  if(condition==='hidden')a.g.visible=false;
  if(condition==='spent')c.cowStatus.cows[0].ready=null;
  if(condition==='farm')c.G.S.pens.cow={list:[0,0]};
  assert.equal(c.interact(),false,condition);assert.equal(c.opened,null,condition);
 }
});
