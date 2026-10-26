import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as T from '../lib/three.module.min.js';
import {createCow3D} from '../cow3d.js';import {createCowYard} from '../cow-yard.js';import {resolveAnimalPens} from '../animal-pen-layout.js';
const legacy=process.env.COW_CONTRACT_IMPL==='legacy';
let clear;
if(legacy){
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),c={THREE:T};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('const toLocal ='),html.indexOf('// shortest way from'))+';globalThis.insideObst=insideObst;',c);
 clear=({from,to,rootObstacles=[]})=>{const obs=rootObstacles.map(([x,z,hw,hd])=>({x,z,hw,hd,c:1,s:0})),a=new T.Vector2(from.x,from.z),b=new T.Vector2(to.x,to.z),skip=new Set(obs.flatMap((o,i)=>c.insideObst(o,a,.42)||c.insideObst(o,b,.42)?[i]:[]));return c.hitsBlock(a,b,.42,skip,obs)<0;};
}else({cowRigidSweepClear:clear}=await import('./helpers/cow-rigid-sweep.mjs'));
const box=(x0,y0,z0,x1,y1,z1)=>({points:[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],minY:y0,maxY:y1});
const pose=(x=0,z=0,yaw=0,y=0)=>({x,y,z,yaw});
const rest=box(-.406111118,0,-1.092722171,.406111118,1.600833383,.722493027),post=[2.135,.08,-36.515,2.265,2.78,-36.385];
test('retained A19/A20 entry movements cannot pass the shared post check',()=>{
 for(const folder of ['first-entry','a19-point4-entry']){const d=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task8-codex-post-root-cause-20261025/'+folder+'/results.json',import.meta.url)));for(const e of d.failureState.postDiagnosis.events){const p=s=>pose(s.pos[0],s.pos[2],s.yaw,s.pos[1]);assert.equal(clear({parts:[rest],from:p(e.before),to:p(e.after),solids:[post],rootObstacles:[e.post]}),false,folder+' accepted penetrating approach');}}
});
test('root sweep rejects the retained 0.05m shrink gap without exempting its start',()=>{
 const d=JSON.parse(fs.readFileSync(new URL('./evidence/pen-editing-implementation/task8-codex-post-root-cause-20261025/a19-point4-entry/results.json',import.meta.url))),e=d.failureState.postDiagnosis.events.at(-1);
 assert.equal(clear({parts:[],from:pose(e.before.pos[0],e.before.pos[2]),to:pose(e.after.pos[0],e.after.pos[2]),solids:[],rootObstacles:[e.post]}),false);
});
test('containing start or goal cannot erase a real obstacle',()=>{for(const [a,b]of [[pose(),pose(3,0)],[pose(3,0),pose()]])assert.equal(clear({parts:[rest],from:a,to:b,solids:[[-.1,0,-.1,.1,2,.1]],rootObstacles:[[0,0,.1,.1]]}),false);});
test('thin obstacle between two clear endpoints blocks translation',()=>assert.equal(clear({parts:[box(-.1,0,-.1,.1,1,.1)],from:pose(-2,0),to:pose(2,0),solids:[[-.001,0,-1,.001,2,1]],rootObstacles:[]}),false));
test('long body mid-turn collision is rejected although both endpoint poses are clear',()=>{
 const request={parts:[box(-.05,0,-2,.05,1,2)],from:pose(0,0,-Math.PI/4),to:pose(0,0,Math.PI/4),solids:[[-.04,0,1.95,.04,2,2.05]],rootObstacles:[]};
 assert.equal(clear({...request,to:request.from}),true);assert.equal(clear({...request,from:request.to}),true);assert.equal(clear(request),false);
});
test('clear full turn and parallel travel remain available',()=>{assert(clear({parts:[rest],from:pose(),to:pose(0,0,Math.PI),solids:[[3,0,-2,3.1,2,2]],rootObstacles:[[3.05,0,.05,2]]}));assert(clear({parts:[rest],from:pose(-2,0,Math.PI/2),to:pose(2,0,Math.PI/2),solids:[[-3,0,1,3,2,1.1]],rootObstacles:[[0,1.05,3,.05]]}));});
test('aligned long cow fits narrow corridor while sideways cow is rejected',()=>{
 const request={parts:[rest],from:pose(0,0),to:pose(0,-3),solids:[[-.6,0,-5,-.5,2,2],[.5,0,-5,.6,2,2]],rootObstacles:[[-.55,-1.5,.05,3.5],[.55,-1.5,.05,3.5]]};
 assert(clear(request),'aligned passage falsely blocked');assert.equal(clear({...request,from:pose(0,0,Math.PI/2),to:pose(0,-3,Math.PI/2)}),false);
});
test('body height distinguishes overhang from real solid penetration',()=>{
 const r={parts:[box(-.4,.8,-1.1,.4,1.6,.7)],from:pose(),to:pose(0,-.1),rootObstacles:[]};assert(clear({...r,solids:[[-.5,0,-1.2,.5,.6,-.8]]}));assert.equal(clear({...r,solids:[[-.5,0,-1.2,.5,2,-.8]]}),false);
});
test('invalid and unbounded motion requests fail closed',()=>{for(const to of [pose(NaN),pose(0,0,100)])assert.equal(clear({parts:[rest],from:pose(),to,solids:[],rootObstacles:[]}),false);});
test('animated shape extension cannot tunnel while the root and original pose stay clear',()=>{
 const part={points:[[-.1,-.1],[.1,-.1],[.1,.1],[-.1,.1]],endPoints:[[2.9,-.1],[3.1,-.1],[3.1,.1],[2.9,.1]],minY:0,maxY:1,endMinY:0,endMaxY:1};
 assert.equal(clear({parts:[part],from:pose(),to:pose(),solids:[[1.4,0,-.2,1.6,2,.2]],rootObstacles:[]}),false);
});
test('animated height change must include the intermediate vertical interval',()=>{
 const part={...box(-.1,0,-.1,.1,.1,.1),endMinY:2,endMaxY:2.1};
 assert.equal(clear({parts:[part],from:pose(),to:pose(),solids:[[-.2,.9,-.2,.2,1.1,.2]],rootObstacles:[]}),false);
});

// Actual stationary skinned triangles, converted to local vertical prisms.
// This bounds this pose under rigid motion only, not an animated gait envelope.
function poseParts(){const r=createCow3D(1.7,0,0,0),v=new T.Vector3(),p=[];r.g.updateMatrixWorld(true);r.card.skeleton.update();for(let i=0;i<r.card.geometry.attributes.position.count;i+=3){const verts=[];for(let j=0;j<3;j++){r.card.getVertexPosition(i+j,v);v.applyMatrix4(r.card.matrixWorld);verts.push(v.clone());}p.push({points:verts.map(v=>[v.x,v.z]),minY:Math.min(...verts.map(v=>v.y)),maxY:Math.max(...verts.map(v=>v.y))});}r.dispose();return p;}
test('rigid-pose proof preserves all authored straight care approaches and bed turns',()=>{
 const y=createCowYard({layout:resolveAnimalPens().sites.cow}),parts=poseParts();try{
 // These exact primitives are support surfaces, already governed by the support
 // contract: slab, thin meadow overlay and five straw beds. Keep every solid
 // post, divider, wall, rail, bunk, trough, robot and roof primitive.
 const solids=Object.entries(y.componentVolumes()).flatMap(([owner,boxes])=>boxes.filter((_,i)=>!(owner==='shelter'&&[0,1,15,16,17,18,19].includes(i))));
 for(const s of y.stations){const yaw=Math.atan2(s.approach[0]-s.dock[0],s.approach[2]-s.dock[2]),p=(v,a)=>pose(v[0],v[2],a,v[1]),request={parts,from:p(s.approach,yaw),to:p(s.dock,yaw),solids,rootObstacles:y.layout.obstacles};assert(clear(request),'straight '+s.id);if(s.kind==='bed')assert(clear({...request,from:p(s.dock,yaw),to:p(s.dock,yaw+Math.PI)}),'bed turn '+s.id);}
 }finally{y.dispose();}
});
