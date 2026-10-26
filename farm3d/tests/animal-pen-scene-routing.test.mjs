import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as THREE from '../lib/three.module.min.js';import {pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint} from '../animal-pen-geometry.js';
import {resolveAnimalPens} from '../animal-pen-layout.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture(poly){const pen={poly,custom:true},c={THREE,pen,pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint,PENS:{courtyard:{}},PEN_LIST:[pen],OBST:[],HOME:new THREE.Vector2(1,3),ROAM:19};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('function edgeDepths('),html.indexOf('// where the animals may not walk')),c);c.fitsPen=(p,x,z,m)=>pointInPolygon([x,z],p.poly,m);vm.runInContext(html.slice(html.indexOf('const toLocal ='),html.indexOf('const blocked =')),c);return c;}
const L=[[0,0],[6,0],[6,2],[2,2],[2,6],[0,6]];
for(const reverse of [false,true])test('actual scene routes around a concave corner, winding '+reverse,()=>{const c=fixture(reverse?[...L].reverse():L),from=new THREE.Vector2(1,5),to=new THREE.Vector2(5,1),path=c.route(from,to,.42,c.pen);assert(path.length>1,'a direct route cuts across the missing corner');let previous=from;for(const p of path){assert(segmentInPolygon([previous.x,previous.y],[p.x,p.y],c.pen.poly,.42),'route leaves the pen');previous=p;}assert(previous.distanceTo(to)<1e-9);});
test('actual containment accepts both arms of a concave pen and projects an illegal point inside',()=>{const c=fixture(L);assert(vm.runInContext('inPen(pen,1,5,.42)',c));assert(vm.runInContext('inPen(pen,5,1,.42)',c));assert(!vm.runInContext('inPen(pen,3,3,.42)',c));const p=c.intoPen(c.pen,new THREE.Vector2(3,3),.42);assert(pointInPolygon([p.x,p.y],L,.42));});
test('a blocked custom route never falls back to an illegal straight crossing',()=>{const c=fixture(L);c.OBST.push({x:1,z:3,hw:2,hd:.5,c:1,s:0});const path=c.route(new THREE.Vector2(1,5),new THREE.Vector2(5,1),.42,c.pen);assert.equal(path.length,0);});
test('free-roaming pets are pushed out of either arm of a custom concave pen',()=>{const c=fixture(L);for(const p of [[1,5],[5,1],[1,1]]){const v=c.outOfPens(new THREE.Vector2(...p),.42);assert(!pointInPolygon([v.x,v.y],L,-.42+1e-7),'pet remains in expanded custom enclosure');assert(v.distanceTo(new THREE.Vector2(...p))<2,'projection unnecessarily crosses the farm');}});
test('actual ordinary movement cannot tunnel between legal endpoints across a custom concavity',()=>{const c=fixture(L),a={pen:c.pen,S:{r:.37},vel:new THREE.Vector2(4,-4),g:new THREE.Group(),fit:v=>v};a.g.position.set(5,0,1);Object.defineProperty(a,'pos',{get:()=>new THREE.Vector2(a.g.position.x,a.g.position.z)});c.a=a;c.ox=1;c.oz=5;const start=html.indexOf('        const held = this.fit(this.pos, .05);'),end=html.indexOf('        this.phase +=',start);vm.runInContext('(function(){'+html.slice(start,end)+'}).call(a)',c);assert.deepEqual(a.g.position.toArray(),[1,0,5]);assert.equal(a.vel.length(),0);});

test('narrow cow expansion retains the ordinary planner margin and failed go returns to idle',()=>{
 const poly=[[-14,-40.2],[11.8,-40.2],[12,-38],[10,-38],[9.8,-32.8],[-14,-32.8]],c=fixture(poly);
 const from=new THREE.Vector2(9.79,-39.1),goal=new THREE.Vector2(10.6,-39.1);
 assert(segmentInPolygon([from.x,from.y],[goal.x,goal.y],poly,.95));
 assert(!pointInPolygon([from.x,from.y],poly,1.6));
 const a={kind:'cow',pen:c.pen,pos:from,S:{r:.9},fit:v=>c.intoPen(c.pen,v,1.25)};
 Object.assign(c,{cowYardActive:true,cowYard:{stations:resolveAnimalPens().sites.cow.stations},PRESET:{}});a.g={position:new THREE.Vector3(from.x,0,from.y)};
 vm.runInContext(html.slice(html.indexOf('function ordinaryDayTarget('),html.indexOf('\nclass Beast {')),c);
 c.a=a;const start=html.indexOf('  go(x, z, running, label, doing) {'),end=html.indexOf('\n  stay(',start);assert(start>=0&&end>start);
 vm.runInContext('({'+html.slice(start,end)+'}).go.call(a,10.6,-39.1,false,"narrow target")',c);
 assert.equal(a.target,undefined);assert.equal(a.path.length,0);
 assert.equal(a.act,'idle','a refused target must not strand the cow in moving-without-target');
});
