// Read-only comparison of the retained native Apply with both production contracts.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {resolveAnimalPens,animalPenYardLayout} from '../animal-pen-layout.js';
import {validateAnimalPens} from '../animal-pen-validation.js';
import {cowYardConflicts} from '../cow-yard.js';
import {farmGroundY} from '../farm-land.js';
import {shapeIntersectsPolygon,segmentClearOfShapes} from '../animal-pen-geometry.js';
const dir='farm3d/tests/evidence/pen-editing-implementation/task7-codex-feed-rebind-20261023',r=JSON.parse(fs.readFileSync(dir+'/native-sync-diagnostic-60/results.json'));
const before=r.steps.find(s=>s.name==='before occupied feed edit').value,applied=r.steps.find(s=>s.name==='native feed-bunk Apply').value,record=applied.after.record;
const layout=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}),site=layout.sites.cow,yard=animalPenYardLayout(site),world={...before.held.world,groundY:farmGroundY};
const validation=validateAnimalPens(layout,world),blocks=r.rebindTrace[0].before.issues.map(v=>v.bounds),rect=b=>({type:'rectangle',x:b[0],z:b[1],hw:b[2],hd:b[3]}),g=site.gates[0],a=[g.inside[0],g.inside[2]],b=[g.outside[0],g.outside[2]],pad=world.actors.find(a=>a.kind==='cow').clearance;
const report={input:'Retained real46 World; production farmGroundY restored; read-only current production validator and locked legacy guard',validation:{ok:validation.ok,issues:validation.issues},layout:{polygon:site.polygon,footprint:yard.footprint,access:yard.access,gate:g},actorClearance:pad,legacyConflicts:cowYardConflicts({layout:yard,blocks}),blocks:blocks.map(v=>({bounds:v,insideEnclosure:shapeIntersectsPolygon(rect(v),site.polygon),componentHits:Object.entries(site.components).filter(([,c])=>shapeIntersectsPolygon(rect(v),c.footprint)).map(([id])=>id),axisClear:segmentClearOfShapes(a,b,[rect(v)],pad)})),controls:[]};
assert(validation.ok);assert.equal(report.legacyConflicts.length,2);assert(report.blocks.every(b=>!b.insideEnclosure&&!b.componentHits.length&&b.axisClear));
for(const [name,block]of [['gate-axis obstruction',[(a[0]+b[0])/2,(a[1]+b[1])/2,.2,.2]],['enclosure obstruction',[0,-35,.5,.5]]]){const w={...world,blocked:[...world.blocked,rect(block)]},v=validateAnimalPens(layout,w),legacy=cowYardConflicts({layout:yard,blocks:[block]});report.controls.push({name,block,validation:v.ok,issues:v.issues,legacy});assert(!v.ok);assert(legacy.length);}
report.status='PASS diagnosis and obstruction controls; native integration remains FAIL';const file=dir+'/activation-contract.json';assert(!fs.existsSync(file));fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
