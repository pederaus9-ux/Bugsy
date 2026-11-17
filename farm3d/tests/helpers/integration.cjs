'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const base=require('./candidate.cjs');
const planner=fs.readFileSync(__dirname+'/planner.cjs','utf8').replace(/^'use strict';\n/,'').replace(/module\.exports=\{[^\n]+\};\n?$/,'return {createRepair,segmentBlocked};');
const manager=fs.readFileSync(__dirname+'/integration-runtime.cjs','utf8').replace(/^'use strict';\n/,'').replace(/module\.exports=\{createRecovery\};\n?$/,'return createRecovery;');
const helper=`// Bounded static-refusal recovery; inserted corners are transient, never saved.
const cowStaticPlanner=(()=>{${planner}})();
const cowStaticCreateRecovery=(()=>{${manager}})();
const cowStaticRecovery=cowStaticCreateRecovery(cowStaticPlanner.createRepair,{
 obstacles:()=>OBST,polygon:()=>PENS.courtyard.poly,admitted:task=>cowCareTransitGuards.has(task),custom:()=>!!COW_YARD_LAYOUT.custom,
 farm:()=>G.S,
 canContinue:(a,task)=>animals.includes(a)&&PRESET.night&&!(cowStatus.cows[a.ref.i]?.feedCharged&&!cowStatus.cows[a.ref.i]?.ready&&a.cowMealCycle!==cowStatus.cows[a.ref.i]?.cycle)&&cowStatus?.job?.cowId!==cowIdOf(a),
 vector:(x,y)=>new THREE.Vector2(x,y)
});
function cowStaticEdgeClear(from,to){const a=[from.x,from.y],b=[to.x,to.y];return !OBST.some(o=>cowStaticPlanner.segmentBlocked(o,a,b));}
`;
const transformations=[
 ['function cowCareTransitStepClear(from,to,status){','function cowCareTransitStepClear(from,to,status,waypoint){'],
 ['cowCarePointUnoccupied(to)&&hitsBlock(from,to,.42,null)<0;','cowCarePointUnoccupied(to)&&(cowStaticRecovery.isEdge(waypoint)?cowStaticEdgeClear(from,to):hitsBlock(from,to,.42,null)<0);'],
 ['cowCareTransitStepClear(a.pos,next,transitStatus)','cowCareTransitStepClear(a.pos,next,transitStatus,p)'],
 ['cowCareTransitStepClear(a.pos,desired,transitStatus)','cowCareTransitStepClear(a.pos,desired,transitStatus,p)'],
 ['cowCareTransitStepClear(a.pos,new THREE.Vector2(x,z),transitStatus)','cowCareTransitStepClear(a.pos,new THREE.Vector2(x,z),transitStatus,p)'],
 ['function updateCowTaskStep(a,dt,t){',helper+'function updateCowTaskStep(a,dt,t){'],
 ["  const ox=a.g.position.x,oz=a.g.position.z;let robotDockTarget=null;", "  cowStaticRecovery.pump(clockT);\n  const ox=a.g.position.x,oz=a.g.position.z;let robotDockTarget=null;"],
 ['    let blockedBedLeg=false;', '    let blockedBedLeg=cowStaticRecovery.wait(a,task);'],
 ["    if(task.kind==='bed'&&task.stage==='approach'&&task.avoidSide&&task.path?.length&&hitsBlock", "    if(!blockedBedLeg&&task.kind==='bed'&&task.stage==='approach'&&task.avoidSide&&task.path?.length&&hitsBlock"],
 ["      const blockingCows=animals.filter(b=>b!==a&&b.kind==='cow'&&Math.hypot(b.g.position.x-next.x,b.g.position.z-next.y)<.85);", "      const recoveryQueued=transitStatus===1&&!transitClear&&cowStaticRecovery.request(a,task,p);\n      const blockingCows=animals.filter(b=>b!==a&&b.kind==='cow'&&Math.hypot(b.g.position.x-next.x,b.g.position.z-next.y)<.85);"],
 ["        if(blockingCows.length&&!blockingCows.some(b=>cowSharedCornerDetour(a,b,task,t))){", "        if(!recoveryQueued&&blockingCows.length&&!blockingCows.some(b=>cowSharedCornerDetour(a,b,task,t))){"],
 ["      else if(d<.035&&(!transitStatus||", "      else if(d<.035&&(!cowStaticRecovery.isCorner(p)||(transitCommitted&&Math.hypot(a.g.position.x-p.x,a.g.position.z-p.y)<=1e-6))&&(!transitStatus||"]
];
function replace(s,a,b){if(s.split(a).length!==2)throw Error('integration occurrence');return s.replace(a,b);}
function patch(input){let s=base.patch(input).toString();for(const [a,b]of transformations)s=replace(s,a,b);return Buffer.from(s);}
function inverse(input){let s=Buffer.from(input).toString();for(const[a,b]of [...transformations].reverse())s=replace(s,b,a);return base.inverse(Buffer.from(s));}
module.exports={patch,inverse,helper,transformations};
