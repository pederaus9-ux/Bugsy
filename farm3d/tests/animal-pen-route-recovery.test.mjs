import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../lib/three.module.min.js';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
import {pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint} from '../animal-pen-geometry.js';

// Execute the actual fit, route, go and retry guard. The first eight assertions
// retain the diagnosed gate-endpoint failure and its controls unchanged.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const go=html.slice(html.indexOf('  go(x, z, running, label, doing) {'),html.indexOf('\n  stay(',html.indexOf('  go(x, z, running, label, doing) {')));
const thinkLine=html.split('\n').find(s=>s.includes('if (!this.target && (this.act === "idle"'));
function fixture(kind,{custom=true,room=false}={}){
  const site=resolveAnimalPens({v:1,revision:1,sites:{[kind]:defaultSiteRecord(kind)}}).sites[kind];
  const pen={custom,care:true,poly:room?[[-10,-10],[10,-10],[10,10],[-10,10]]:site.polygon};
  const g=site.gates[0],c=vm.createContext({THREE:T,pointInPolygon,segmentInPolygon,nearestLegalPoint,nearestExteriorPoint,PENS:{courtyard:pen},PEN_LIST:[pen],OBST:[],HOME:new T.Vector2(1,3),ROAM:19,clockT:1,t:1,cowYardActive:kind==='cow',cowYard:{stations:site.stations},PRESET:{},remainingSites:{[kind]:{active:true}},remainingLayouts:{[kind]:site}});
  vm.runInContext(html.slice(html.indexOf('function edgeDepths('),html.indexOf('// where the animals may not walk')),c);
  vm.runInContext('globalThis.fitsPen=(p,x,z,m)=>inPen(p,x,z,m);',c);
  vm.runInContext(html.slice(html.indexOf('const toLocal ='),html.indexOf('const blocked =')),c);
  vm.runInContext(html.slice(html.indexOf('function ordinaryDayTarget('),html.indexOf('\nclass Beast {')),c);
  const a={kind,pen,pos:room?new T.Vector2(0,0):new T.Vector2(g.inside[0],g.inside[2]),S:{r:{chicken:.3,cow:.9,horse:1,sheep:.6}[kind]},until:0,thinkCalls:0,think(){this.thinkCalls++;},fit:v=>c.intoPen(pen,v,a.S.r+.35)};
  a.g={position:new T.Vector3(a.pos.x,0,a.pos.y)};
  c.a=a;c.goal=room?[3,0,0]:g.outside;
  const request=(running=false,label='Curious about the player beyond the gate',doing)=>{c.args={running,label,doing};vm.runInContext('({'+go+'}).go.call(a,goal[0],goal[2],args.running,args.label,args.doing)',c);};
  const retry=()=>vm.runInContext('(function(){'+thinkLine+'}).call(a)',c);
  return {c,a,site,request,retry};
}

for(const kind of ['chicken','cow','horse','sheep']){
  test(kind+' ordinary request beyond a gate never authorizes crossing',()=>{
    const {a,site,request}=fixture(kind);request();
    assert.equal(a.target,undefined);assert.equal(a.path.length,0);assert(pointInPolygon(a.pos.toArray(),site.polygon));
  });
  test(kind+' refused custom route returns to a state that can think again without extending its timer',()=>{
    const {a,request,retry}=fixture(kind);request();assert.equal(a.until,0);retry();
    assert.equal(a.act,'idle');assert.equal(a.thinkCalls,1);
  });
  test(kind+' refusal preserves cooldown, request metadata and existing reservation references',()=>{
    const {c,a,request,retry}=fixture(kind),position=a.pos.toArray();
    const reservations={chickenTask:{token:{stationId:'bed',generation:7}},remainingTask:{token:{stationId:'drink',generation:9}},cowTask:{token:{stationId:'feed',generation:11}},gateTask:{gateId:'reserved',revision:1}};
    Object.assign(a,reservations);a.until=5;request(true,'Waiting to look','look');
    assert.deepEqual(a.pos.toArray(),position);assert.equal(a.until,5);
    assert.equal(a.running,true);assert.equal(a.label,'Waiting to look');assert.equal(a.doing,'look');
    for(const [key,value] of Object.entries(reservations))assert.strictEqual(a[key],value);
    retry();assert.equal(a.thinkCalls,0);c.t=5;retry();assert.equal(a.thinkCalls,0);
    c.t=5+1/120;retry();assert.equal(a.thinkCalls,1);
  });
  for(const custom of [false,true])test(kind+' successful '+(custom?'custom':'default')+' request retains normal moving action and route',()=>{
    const {a,request,retry}=fixture(kind,{custom,room:true});a.until=5;request(true,'Going to graze','eat');
    assert.equal(a.act,'moving');assert.deepEqual(a.target.toArray(),[3,0]);assert.equal(a.path.length,0);
    assert.equal(a.until,5);assert.equal(a.running,true);assert.equal(a.label,'Going to graze');assert.equal(a.doing,'eat');
    assert.deepEqual(a.pos.toArray(),[0,0]);retry();assert.equal(a.thinkCalls,0);
  });
}
