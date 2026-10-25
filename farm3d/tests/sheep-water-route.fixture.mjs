import fs from 'node:fs';import assert from 'node:assert/strict';import * as T from '../lib/three.module.min.js';
import {resolveAnimalPens,animalPenYardLayout,defaultSiteRecord} from '../animal-pen-layout.js';
import {createRemainingCareController} from '../remaining-care-controller.js';import {createLiveAnimal,updateLiveAnimal} from '../live3d.js';
import {pointInPolygon} from '../animal-pen-geometry.js';import {farmGroundY} from '../farm-land.js';
export function sheepWaterFixture(){
const red=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task8-codex-a22-matrix-20261025/gate-1-120/results.json',import.meta.url)));
const record=defaultSiteRecord('sheep');for(const command of red.setup.action.commands){assert.equal(command.type,'setGate');Object.assign(record.gates.find(g=>g.id===command.id),{offset:command.offset,width:command.width});}
const resolved=resolveAnimalPens({v:1,revision:1,sites:{sheep:record}}),layouts=Object.fromEntries(Object.entries(resolved.sites).map(([k,s])=>[k,animalPenYardLayout(s)])),layout=layouts.sheep;
const extra=JSON.parse(fs.readFileSync(new URL('./fixtures/remaining-care-initial-world.json',import.meta.url))).existingBlocks;
const blocks=[...extra,...Object.values(resolved.sites).flatMap(s=>s.obstacles)],fences=Object.values(resolved.sites).flatMap(s=>s.fenceSegments);
const actors=red.failureState.animals.map(row=>{const[k,i]=row.key.split(':'),r=k==='sheep'?createLiveAnimal(k,1.2,row.pos[0],row.pos[2]):null,g=r?.g??new T.Group();g.position.fromArray(row.pos);return{kind:k,ref:{type:['dog','cat'].includes(k)?'pet':'pen',i:+i,j:+i},g,rig3d:r,vel:new T.Vector2(),S:{r:layouts[k].margin},need:{hunger:0,tired:1,lonely:0},remainingDrinkAt:Infinity,remainingNapAt:Infinity,remainingMealAt:Infinity,row};});
let includeNeighbours=true;const care=createRemainingCareController({layouts,neighbours:()=>includeNeighbours?actors:[],active:()=>true,obstacles:()=>blocks,segments:()=>fences,groundY:farmGroundY,clearPoint:(a,x,z)=>!layouts[a.kind].polygon||pointInPolygon([x,z],layouts[a.kind].polygon,layouts[a.kind].margin),updateRig:(r,dx,dz,dt)=>updateLiveAnimal(r,dx,dz,dt,'moving',false)});
const a=actors.find(a=>a.kind==='sheep'&&a.ref.i===3),goal=layout.stations.find(s=>s.id===a.row.station).dock;
return{care,actors,blocks,fences,a,goal,layout,resolved,dispose(){for(const b of actors)b.rig3d?.dispose();}};}
