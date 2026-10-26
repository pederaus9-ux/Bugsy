import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as THREE from '../lib/three.module.min.js';
import {resolveAnimalPens,animalPenYardLayout} from '../animal-pen-layout.js';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=html.indexOf('function ordinaryDayTarget('),end=html.indexOf('class Beast {',start);
test('seed-1 horse and cow ordinary targets cannot stop inside their old bed cores',()=>{
 assert(start>=0&&end>start,'ordinary destination guard is absent');
 const guard=vm.runInNewContext(html.slice(start,end)+';ordinaryDayTarget',{THREE});
 const sites=resolveAnimalPens().sites;
 const horse=animalPenYardLayout(sites.horse),horseBed=horse.stations.find(s=>s.id==='horse-bed-1');
 const horseTarget=new THREE.Vector2(-16.887232555881294,-28.43607508939546);
 const horseEnd=guard(horseTarget,horse.stations,horse.margin);
 assert.deepEqual(horseEnd.toArray(),[horseBed.approach[0],horseBed.approach[2]]);
 const safe=new THREE.Vector2(-17,-24);assert.equal(guard(safe,horse.stations,horse.margin),safe,'safe ordinary location changed');
 const cow=animalPenYardLayout(sites.cow),cowBed=cow.stations.find(s=>s.id==='cow-bed-5');
 const cowTarget=new THREE.Vector2(cowBed.dock[0]-.25095937193882,cowBed.dock[2]-.2752225470614);
 assert.deepEqual(guard(cowTarget,cow.stations,.65).toArray(),[cowBed.approach[0],cowBed.approach[2]]);
});
