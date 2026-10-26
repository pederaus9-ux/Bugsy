// Read-only replay of retained real World snapshots; not native Apply qualification.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolveAnimalPens,defaultSiteRecord} from '../animal-pen-layout.js';
import {validateAnimalPens} from '../animal-pen-validation.js';
import {farmGroundY} from '../farm-land.js';
import {shapeIntersectsPolygon,volumesOverlap,pointInPolygon} from '../animal-pen-geometry.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),prior='farm3d/tests/evidence/pen-editing-implementation/task7-codex-occupied-shelter-20261023',out=process.env.TEST_ARTIFACTS;
assert(out);fs.mkdirSync(out,{recursive:true});assert(!fs.existsSync(path.join(out,'results.json')));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),report={status:'RUNNING',input:'Exact retained World/actors with production farmGroundY restored (index groundY=farmGroundY); no runtime/editor/state mutation',cases:[]};
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
function evaluate(name,world,record){const layout=resolveAnimalPens({v:1,revision:1,sites:{cow:record}}),site=layout.sites.cow,v=validateAnimalPens(layout,world),e={name,record,ok:v.ok,issues:v.issues,placements:v.placements,ordinaryRoutes:v.ordinaryRoutes,diagnostics:v.diagnostics,pathHits:Object.entries(site.components).flatMap(([id,c])=>world.path.map((p,i)=>shapeIntersectsPolygon(p,c.footprint)?{component:id,path:i}:null).filter(Boolean)),componentOverlaps:Object.entries(site.components).flatMap(([id,c])=>Object.entries(site.components).filter(([other,d])=>id<other&&volumesOverlap(c.volumes,d.volumes)).map(([other])=>[id,other])),cowPlacements:world.actors.filter(a=>a.kind==='cow').map(a=>({actor:a,placement:v.placements[a.id],ordinaryInset:v.placements[a.id]?pointInPolygon([v.placements[a.id][0],v.placements[a.id][2]],site.polygon,1.6):null}))};report.cases.push(e);save();console.log(name,v.ok,[...new Set(v.issues.map(i=>i.code+':'+i.target))].join(','));return e;}
const shelter=read(prior+'/initial-60/results.json'),feed=read(prior+'/feed-initial-60/results.json');
const sw={...shelter.steps.find(s=>s.name==='before occupied shelter edit').value.held.world,groundY:farmGroundY},fw={...feed.steps.find(s=>s.name==='before occupied feed edit').value.held.world,groundY:farmGroundY};
let r=defaultSiteRecord('cow');r.structures.shelter=[-3,-38];const sr=evaluate('retained shelter right-nudge RED',sw,r);assert.deepEqual(sr.issues,shelter.draft.validation.issues);
r=defaultSiteRecord('cow');r.structures.feedBunk=[-8,-34];const fr=evaluate('retained active-feed bunk RED',fw,r);assert.deepEqual(fr.issues,feed.draft.validation.issues);
// Separate legal-edit candidates, not modifications of the retained failing test.
for(const position of [[-4,-40],[-3,-40],[-2,-40],[-1,-40],[0,-40]]){r=defaultSiteRecord('cow');r.structures.shelter=position;evaluate('shelter only '+position,sw,r);}
for(const delta of [[0,-2],[2,-2],[3,-2],[4,-2],[4,-3]]){r=defaultSiteRecord('cow');for(const v of r.boundary){v.x+=delta[0];v.z+=delta[1];}for(const p of Object.values(r.structures)){p[0]+=delta[0];p[1]+=delta[1];}evaluate('whole cow relocation '+delta,sw,r);}
for(const south of [-32.6,-32.4,-32.2]){r=defaultSiteRecord('cow');r.structures.feedBunk=[-8,-34];for(const v of r.boundary)if(v.id==='v2'||v.id==='v3')v.z=south;evaluate('active feed with separately expanded south '+south,fw,r);}
report.status='PASS diagnostic execution; candidate status is per case';save();
